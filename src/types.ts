export interface GitCloneResult {
  success: boolean;
  error?: string;
}

export interface EditorConfig {
  name: string;
  command: string;
}

// Degit related types
export interface RepoInfo {
  site: string;
  user: string;
  name: string;
  ref: string;
  url: string;
  ssh: string;
  mode: 'tar' | 'git';
}

export interface CachedRepo {
  url: string;
  name: string;
  lastUsed: string;
} 