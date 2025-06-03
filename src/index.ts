#!/usr/bin/env node

import { Command } from 'commander';
import { registerCodeCommand } from './commands/code';
import { registerDegitCommand } from './commands/degit';

const program = new Command();

program
  .name('seda')
  .description('SedationH\'s CLI toolkit')
  .version('0.1.0');

registerCodeCommand(program);
registerDegitCommand(program);

program.parse(); 