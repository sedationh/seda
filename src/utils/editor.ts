import { exec } from 'child_process';
import { promisify } from 'util';
import { EditorConfig } from '../types';

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