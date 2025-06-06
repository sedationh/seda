import { Command } from 'commander';
import inquirer from 'inquirer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  parseRepoUrl,
  fetchRefs,
  selectRef,
  downloadFile,
  extractTar,
  mkdirp,
  getCachedRepos,
  saveCachedRepo,
  getCacheDir
} from '../utils/git';
import { openDirectoryInEditor, openInEditor } from '../utils/editor';
import { CachedRepo } from '../types';
import { logger } from '../utils/logger';

export function registerDegitCommand(program: Command): void {
  program
    .command('degit')
    .description('Clone repositories without git history')
    .argument('[repository]', 'Repository URL (e.g., https://github.com/user/repo)')
    .argument('[destination]', 'Destination directory', '.')
    .option('-f, --force', 'Overwrite existing files')
    .option('--no-git', 'Skip git init and initial commit')
    .option('--no-open', 'Skip opening project in editor')
    .action(async (repository?: string, destination?: string, options?: any) => {
      try {
        // Check if repository looks like a URL
        const isUrl = repository?.startsWith('http')

        if (!isUrl) {
          // Interactive mode - show cached repos
          // If repository doesn't look like URL, treat it as destination
          const dest = repository || '.'
          await interactiveMode(dest, options);
        } else {
          // Direct mode - clone specific repo
          await cloneRepo(repository!, destination || '.', options);
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}

async function interactiveMode(destination: string, options: any): Promise<void> {
  const cachedRepos = getCachedRepos();

  if (cachedRepos.length === 0) {
    logger.warning('No cached repositories found.');
    logger.info('Use: seda degit <repository-url> to clone a repository first.');
    return;
  }

  const choices = cachedRepos.map(repo => ({
    name: `${repo.name} (${repo.url})`,
    value: repo.url,
    short: repo.name
  }));

  const { selectedRepo } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedRepo',
      message: 'Select a repository to clone:',
      choices
    }
  ]);

  await cloneRepo(selectedRepo, destination, options);
}

async function cloneRepo(repository: string, destination: string, options: any): Promise<void> {
  const { force = false, git = true, open = true } = options || {};
  const resolvedDestination = path.resolve(destination);

  const repo = parseRepoUrl(repository);

  // Check if destination exists and is not empty
  if (fs.existsSync(resolvedDestination)) {
    const files = fs.readdirSync(resolvedDestination);
    if (files.length > 0 && !force) {
      throw new Error(`Destination directory is not empty. Use --force to overwrite.`);
    }
  }

  // 获取仓库的提交哈希值（commit hash）
  // 这个哈希值用于后续下载特定版本的源码压缩包
  let hash: string;
  try {
    // 获取远程仓库的所有引用信息（包括分支、标签、HEAD等）
    const refs = await fetchRefs(repo);
    
    // 判断用户指定的引用类型
    if (repo.ref === 'HEAD') {
      // 情况1: 用户没有指定具体分支/标签，使用默认的 HEAD
      // 例如: https://github.com/user/repo (没有 # 锚点)
      
      // 从所有引用中找到 HEAD 引用
      const headRef = refs.find(ref => ref.type === 'HEAD');
      if (!headRef) {
        throw new Error('Could not find HEAD ref');
      }
      // 使用 HEAD 指向的提交哈希
      hash = headRef.hash;
    } else {
      // 情况2: 用户指定了具体的分支、标签或提交哈希
      // 例如: https://github.com/user/repo#main
      //      https://github.com/user/repo#v1.0.0  
      //      https://github.com/user/repo#abc123
      
      // 根据用户指定的引用名称，查找对应的完整提交哈希
      // selectRef 函数会匹配分支名、标签名或哈希前缀
      const selectedHash = selectRef(refs, repo.ref);
      if (!selectedHash) {
        // 如果找不到指定的引用，抛出错误
        throw new Error(`Could not find ref: ${repo.ref}`);
      }
      // 使用找到的提交哈希
      hash = selectedHash;
    }
  } catch (error) {
    // 如果获取引用信息失败，包装错误信息重新抛出
    throw new Error(`Failed to fetch repository refs: ${error}`);
  }

  // Prepare cache directories
  const cacheDir = getCacheDir();
  const repoDir = path.join(cacheDir, repo.site, repo.user, repo.name);
  mkdirp(repoDir);

  const tarFile = path.join(repoDir, `${hash}.tar.gz`);
  const downloadUrl = `${repo.url}/archive/${hash}.tar.gz`;

  // Download if not cached
  if (!fs.existsSync(tarFile)) {
    try {
      logger.info(`Downloading ${downloadUrl} to ${tarFile}`);
      await downloadFile(downloadUrl, tarFile);
      logger.success(`Downloaded ${downloadUrl} to ${tarFile}`);
    } catch (error) {
      throw new Error(`Failed to download repository: ${error}`);
    }
  } else {
    logger.success(`Using cached file: ${tarFile}`);
  }

  // Extract
  mkdirp(resolvedDestination);

  logger.info(`Extracting ${tarFile} to ${resolvedDestination}`);
  await extractTar(tarFile, resolvedDestination);
  logger.success(`Extracted ${tarFile} to ${resolvedDestination}`);


  if (git) {
    try {
      // 使用 process.cwd() 作为基准
      const destPath = path.resolve(resolvedDestination);

      const isInGitRepo = fs.existsSync(path.join(destPath, '.git'));

      if (!isInGitRepo) {
        execSync('git init', { cwd: destPath, stdio: 'pipe' });

        execSync('git add .', { cwd: destPath, stdio: 'pipe' });

        execSync('git commit -m "Init"', { cwd: destPath, stdio: 'pipe' });
      }
    } catch (error) {
      logger.warning(`Failed to initialize git repository: ${error}`);
    }
  }

  // Save to cache
  const cachedRepo: CachedRepo = {
    url: repository,
    name: `${repo.user}/${repo.name}`,
    lastUsed: new Date().toISOString()
  };
  saveCachedRepo(cachedRepo);


  // Open project in editor if enabled
  if (open) {
    try {
      await openDirectoryInEditor(resolvedDestination);
    } catch (error) {
      logger.warning(`Could not open project in editor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 