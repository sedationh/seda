import { Command } from 'commander';
import chalk from 'chalk';
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
import { CachedRepo } from '../types';

export function registerDegitCommand(program: Command): void {
  program
    .command('degit')
    .description('Clone repositories without git history')
    .argument('[repository]', 'Repository URL (e.g., https://github.com/user/repo)')
    .argument('[destination]', 'Destination directory', '.')
    .option('-f, --force', 'Overwrite existing files')
    .option('-v, --verbose', 'Verbose output')
    .option('--no-git', 'Skip git init and initial commit')
    .action(async (repository?: string, destination?: string, options?: any) => {
      try {
        // Check if repository looks like a URL
        const isUrl = repository && (repository.includes('github.com') || repository.startsWith('http'));
        
        if (!repository || !isUrl) {
          // Interactive mode - show cached repos
          // If repository doesn't look like URL, treat it as destination
          const dest = !isUrl && repository ? repository : (destination || '.');
          await interactiveMode(dest, options);
        } else {
          // Direct mode - clone specific repo
          await cloneRepo(repository, destination || '.', options);
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });
}

async function interactiveMode(destination: string, options: any): Promise<void> {
  const cachedRepos = getCachedRepos();
  
  if (cachedRepos.length === 0) {
    console.log(chalk.yellow('No cached repositories found.'));
    console.log(chalk.gray('Use: seda degit <repository-url> to clone a repository first.'));
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
  const { force = false, verbose = false, git = true } = options || {};

  if (verbose) {
    console.log(chalk.cyan(`> Parsing repository: ${repository}`));
  }

  const repo = parseRepoUrl(repository);
  
  // Check if destination exists and is not empty
  if (fs.existsSync(destination)) {
    const files = fs.readdirSync(destination);
    if (files.length > 0 && !force) {
      throw new Error(`Destination directory is not empty. Use --force to overwrite.`);
    }
  }

  if (verbose) {
    console.log(chalk.cyan(`> Fetching refs for ${repo.user}/${repo.name}`));
  }

  // Get the commit hash
  let hash: string;
  try {
    const refs = await fetchRefs(repo);
    if (repo.ref === 'HEAD') {
      const headRef = refs.find(ref => ref.type === 'HEAD');
      if (!headRef) {
        throw new Error('Could not find HEAD ref');
      }
      hash = headRef.hash;
    } else {
      const selectedHash = selectRef(refs, repo.ref);
      if (!selectedHash) {
        throw new Error(`Could not find ref: ${repo.ref}`);
      }
      hash = selectedHash;
    }
  } catch (error) {
    throw new Error(`Failed to fetch repository refs: ${error}`);
  }

  if (verbose) {
    console.log(chalk.cyan(`> Found commit hash: ${hash}`));
  }

  // Prepare cache directories
  const cacheDir = getCacheDir();
  const repoDir = path.join(cacheDir, repo.site, repo.user, repo.name);
  mkdirp(repoDir);

  const tarFile = path.join(repoDir, `${hash}.tar.gz`);
  const downloadUrl = `${repo.url}/archive/${hash}.tar.gz`;

  // Download if not cached
  if (!fs.existsSync(tarFile)) {
    if (verbose) {
      console.log(chalk.cyan(`> Downloading ${downloadUrl}`));
    }
    
    try {
      await downloadFile(downloadUrl, tarFile);
    } catch (error) {
      throw new Error(`Failed to download repository: ${error}`);
    }
  } else if (verbose) {
    console.log(chalk.cyan(`> Using cached file: ${tarFile}`));
  }

  // Extract
  if (verbose) {
    console.log(chalk.cyan(`> Extracting to ${destination}`));
  }

  mkdirp(destination);
  
  const subdir = repo.subdir ? `${repo.name}-${hash}${repo.subdir}` : undefined;
  await extractTar(tarFile, destination, subdir);

  // Initialize git repository and make initial commit if enabled
  if (git) {
    try {
      const destPath = path.resolve(destination);
      
      // Check if already in a git repository
      const isInGitRepo = fs.existsSync(path.join(destPath, '.git'));
      
      if (!isInGitRepo) {
        if (verbose) {
          console.log(chalk.cyan(`> Initializing git repository in ${destination}`));
        }
        
        // Initialize git repository
        execSync('git init', { cwd: destPath, stdio: verbose ? 'inherit' : 'pipe' });
        
        // Add all files
        execSync('git add .', { cwd: destPath, stdio: verbose ? 'inherit' : 'pipe' });
        
        // Make initial commit
        execSync('git commit -m "Init"', { cwd: destPath, stdio: verbose ? 'inherit' : 'pipe' });
        
        if (verbose) {
          console.log(chalk.cyan(`> Created initial commit`));
        }
      } else if (verbose) {
        console.log(chalk.yellow(`> Skipping git init - already in a git repository`));
      }
    } catch (error) {
      if (verbose) {
        console.log(chalk.yellow(`> Warning: Failed to initialize git repository: ${error}`));
      }
      // Don't fail the entire operation if git init fails
    }
  }

  // Save to cache
  const cachedRepo: CachedRepo = {
    url: repository,
    name: `${repo.user}/${repo.name}`,
    lastUsed: new Date().toISOString()
  };
  saveCachedRepo(cachedRepo);

  console.log(chalk.green(`✓ Cloned ${repo.user}/${repo.name}#${repo.ref} to ${destination}`));
} 