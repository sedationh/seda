import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { cloneRepository, getAlternativeUrl, extractRepoName } from '../utils/git';
import { openInEditor } from '../utils/editor';
import { logger } from '../utils/logger';

async function openDirectoryInEditor(targetDir: string): Promise<void> {
  logger.info(`Opening directory: ${targetDir}`);
  await openInEditor(targetDir);
  logger.success('Project opened in editor.');
}

export function registerCodeCommand(program: Command): void {
  program
    .command('code')
    .description('Clone a repository and open it in your editor')
    .argument('<repo-url>', 'URL of the repository to clone')
    .argument('[new-name]', 'Custom name for the cloned directory')
    .action(async (repoUrl: string, newName?: string) => {
      try {
        const repoName = extractRepoName(repoUrl);
        const targetName = newName || repoName;
        const targetDir = path.join(process.cwd(), targetName);

        if (fs.existsSync(targetDir)) {
          await openDirectoryInEditor(targetDir);
          return;
        }

        logger.info(`Cloning repository: ${repoUrl}`);
        const result = await cloneRepository(repoUrl, targetDir);

        if (!result.success) {
          logger.warning('Attempting to clone with alternative URL format...');
          const alternativeUrl = getAlternativeUrl(repoUrl);
          const altResult = await cloneRepository(alternativeUrl, targetDir);

          if (!altResult.success) {
            logger.error(`Failed to clone repository: ${altResult.error}`);
            return;
          }
          logger.success('Repository cloned successfully with alternative URL.');
        } else {
          logger.success('Repository cloned successfully.');
        }

        await openDirectoryInEditor(targetDir);
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        process.exit(1);
      }
    });
} 