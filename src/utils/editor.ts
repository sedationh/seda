import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { EditorConfig } from '../types';
import { logger } from './logger';

const execAsync = promisify(exec);

export function getEditorConfig(): EditorConfig {
  const customEditor = process.env.VSCODE_ALTERNATIVE;
  if (customEditor) {
    return {
      name: customEditor,
      command: customEditor
    };
  }
  return {
    name: 'Visual Studio Code',
    command: 'code'
  };
}

export async function openInEditor(path: string): Promise<void> {
  const editor = getEditorConfig();
  try {
    await execAsync(`${editor.command} ${path}`);
  } catch (error) {
    throw new Error(`Failed to open ${editor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 

export async function openDirectoryInEditor(targetDir: string): Promise<void> {
  logger.info(`Opening directory: ${targetDir}`);
  await openInEditor(targetDir);
  logger.success('Project opened in editor.');
}