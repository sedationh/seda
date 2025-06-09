import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import * as tar from 'tar';
import * as os from 'node:os';
import { GitCloneResult, RepoInfo, CachedRepo } from '../types';

const execAsync = promisify(exec);

export async function cloneRepository(url: string, targetPath: string): Promise<GitCloneResult> {
  try {
    await execAsync(`git clone ${url} ${targetPath}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export function getAlternativeUrl(repoUrl: string): string {
  if (repoUrl.startsWith('git@')) {
    // Convert SSH URL to HTTPS URL
    const parts = repoUrl.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid SSH URL format');
    }
    const domain = parts[0].replace('git@', '');
    const path = parts[1].replace('.git', '');
    return `https://${domain}/${path}.git`;
  } else if (repoUrl.startsWith('http')) {
    // Convert HTTPS URL to SSH URL
    const url = new URL(repoUrl);
    const path = url.pathname.replace(/^\//, '').replace(/\.git$/, '');
    return `git@${url.host}:${path}.git`;
  }
  throw new Error('Unsupported URL format');
}

export function extractRepoName(repoUrl: string): string {
  return repoUrl.split('/').pop()?.replace('.git', '') || '';
}

// Degit related functions
export const sedaHome = path.join(os.homedir(), '.seda');

export function parseRepoUrl(src: string): RepoInfo {
  // Support GitHub URLs like https://github.com/user/repo
  const match = /^(?:https:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#]+)(?:#(.+))?/.exec(src);
  
  if (!match) {
    throw new Error(`Could not parse repository URL: ${src}`);
  }

  const user = match[1];
  const name = match[2].replace(/\.git$/, '');
  const ref = match[3] || 'HEAD';

  const url = `https://github.com/${user}/${name}`;
  const ssh = `git@github.com:${user}/${name}`;

  return {
    site: 'github',
    user,
    name,
    ref,
    url,
    ssh,
    mode: 'tar'
  };
}

export function mkdirp(dir: string): void {
  const parent = path.dirname(dir);
  if (parent === dir) return;

  mkdirp(parent);

  try {
    fs.mkdirSync(dir);
  } catch (err: any) {
    if (err.code !== 'EEXIST') throw err;
  }
}

export function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      const code = response.statusCode;
      
      if (code && code >= 400) {
        response.resume(); // Consume response to free up memory
        reject(new Error(`HTTP ${code}: ${response.statusMessage}`));
        return;
      } 
      
      if (code && code >= 300) {
        // Handle redirects
        response.resume(); // Consume response to free up memory
        const location = response.headers.location;
        if (location) {
          downloadFile(location, dest).then(resolve, reject);
        } else {
          reject(new Error('Redirect without location header'));
        }
        return;
      }
      
      // Success case
      const writeStream = fs.createWriteStream(dest);
      
      writeStream.on('finish', () => {
        writeStream.close();
        resolve();
      });
      
      writeStream.on('error', (error) => {
        writeStream.close();
        // Clean up partial file
        fs.unlink(dest, () => {}); // Ignore unlink errors
        reject(error);
      });
      
      response.on('error', (error) => {
        writeStream.close();
        // Clean up partial file
        fs.unlink(dest, () => {}); // Ignore unlink errors
        reject(error);
      });
      
      response.pipe(writeStream);
    });
    
    request.on('error', (error) => {
      request.destroy();
      reject(error);
    });
    
    // Set a timeout to prevent hanging
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

export async function fetchRefs(repo: RepoInfo): Promise<Array<{type: string, name: string, hash: string}>> {
  try {
    const { stdout } = await execAsync(`git ls-remote ${repo.url}`);
    
    return stdout
      .split('\n')
      .filter(Boolean)
      .map(row => {
        const [hash, ref] = row.split('\t');

        if (ref === 'HEAD') {
          return {
            type: 'HEAD',
            name: 'HEAD',
            hash
          };
        }

        const match = /refs\/(\w+)\/(.+)/.exec(ref);
        if (!match) {
          throw new Error(`Could not parse ref: ${ref}`);
        }

        return {
          type: match[1] === 'heads' ? 'branch' : match[1],
          name: match[2],
          hash
        };
      });
  } catch (error) {
    throw new Error(`Could not fetch remote ${repo.url}: ${error}`);
  }
}

export function selectRef(refs: Array<{type: string, name: string, hash: string}>, selector: string): string | null {
  for (const ref of refs) {
    if (ref.name === selector) {
      return ref.hash;
    }
  }

  if (selector.length < 8) return null;

  for (const ref of refs) {
    if (ref.hash.startsWith(selector)) return ref.hash;
  }

  return null;
}

export async function extractTar(file: string, dest: string): Promise<void> {
  return tar.extract({
    file,
    strip: 1,
    C: dest
  });
}

export function getCacheDir(): string {
  return path.join(sedaHome, 'cache');
}

export function getCachedRepos(): CachedRepo[] {
  const cacheFile = path.join(getCacheDir(), 'repos.json');
  
  try {
    const data = fs.readFileSync(cacheFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveCachedRepo(repo: CachedRepo): void {
  const cacheDir = getCacheDir();
  mkdirp(cacheDir);
  
  const cacheFile = path.join(cacheDir, 'repos.json');
  const repos = getCachedRepos();
  
  // Remove existing entry if any
  const filtered = repos.filter(r => r.url !== repo.url);
  filtered.unshift(repo); // Add to the beginning
  
  // Keep only last 20 repos
  const limited = filtered.slice(0, 20);
  
  fs.writeFileSync(cacheFile, JSON.stringify(limited, null, 2));
} 