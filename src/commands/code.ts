import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import { cloneRepository, getAlternativeUrl, extractRepoName } from '../utils/git';
import { openInEditor } from '../utils/editor';

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
          console.log(chalk.blue(`Opening existing directory: ${targetDir}`));
          await openInEditor(targetDir);
          return;
        }

        console.log(chalk.blue(`Cloning repository: ${repoUrl}`));
        const result = await cloneRepository(repoUrl, targetDir);

        if (!result.success) {
          console.log(chalk.yellow('Attempting to clone with alternative URL format...'));
          const alternativeUrl = getAlternativeUrl(repoUrl);
          const altResult = await cloneRepository(alternativeUrl, targetDir);

          if (!altResult.success) {
            console.error(chalk.red(`Failed to clone repository: ${altResult.error}`));
            return;
          }
          console.log(chalk.green('Repository cloned successfully with alternative URL.'));
        } else {
          console.log(chalk.green('Repository cloned successfully.'));
        }

        console.log(chalk.blue(`Opening new directory: ${targetDir}`));
        await openInEditor(targetDir);
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`));
        process.exit(1);
      }
    });
} 