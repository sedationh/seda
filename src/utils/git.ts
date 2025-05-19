import { exec } from 'child_process';
import { promisify } from 'util';
import { GitCloneResult } from '../types';

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