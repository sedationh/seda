#!/usr/bin/env node

import { Command } from 'commander';
import { registerCodeCommand } from './commands/code';

const program = new Command();

program
  .name('seda')
  .description('SedationH\'s CLI toolkit')
  .version('0.1.0');

registerCodeCommand(program);

program.parse(); 