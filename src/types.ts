export interface GitCloneResult {
  success: boolean;
  error?: string;
}

export interface EditorConfig {
  name: string;
  command: string;
} 