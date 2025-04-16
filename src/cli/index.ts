#!/usr/bin/env node

/**
 * SolTrace CLI - Command-line interface for the Solana transaction debugger
 */

import { Command } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import { VERSION } from '../index';
import { TransactionCommand } from './commands/transaction';
import { ProgramCommand } from './commands/program';
import { InteractiveCommand } from './commands/interactive';
import { ConfigCommand } from './commands/config';
import { getClusterEndpoint } from '../utils/lookup';

// Create the main program
const program = new Command();

// Configure CLI
program
  .name('soltrace')
  .description('SolTrace: A powerful Solana transaction debugger and simulator')
  .version(VERSION);

// Add global options
program
  .option('-u, --url <string>', 'RPC URL to connect to', 'devnet')
  .option('-v, --verbose', 'Enable verbose output', false);

// Display banner
console.log(chalk.yellow(figlet.textSync('SolTrace', { horizontalLayout: 'full' })));
console.log(chalk.cyan(`SolTrace CLI v${VERSION} - Solana transaction debugger\n`));

// Transaction debugging command
program
  .command('tx <signature>')
  .description('Debug a transaction using its signature')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .option('-f, --file <path>', 'Write output to file')
  .action((signature, options, command) => {
    const parentOptions = command.parent?.opts() || {};
    const rpcUrl = getClusterEndpoint(parentOptions.url || 'devnet');
    const verbose = parentOptions.verbose || false;
    
    new TransactionCommand().execute(signature, {
      ...options,
      verbose,
      rpcUrl,
    });
  });

// Program-centric debugging command
program
  .command('program <programId>')
  .description('Debug instructions for a specific program')
  .option('-i, --ix <base64>', 'Base64-encoded instruction data')
  .option('-a, --accounts <array>', 'JSON array of account addresses', '[]')
  .option('-s, --signers <keypaths>', 'Comma-separated list of keypair paths')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .action((programId, options, command) => {
    const parentOptions = command.parent?.opts() || {};
    const rpcUrl = getClusterEndpoint(parentOptions.url || 'devnet');
    const verbose = parentOptions.verbose || false;
    
    new ProgramCommand().execute(programId, {
      ...options,
      verbose,
      rpcUrl,
    });
  });

// Interactive mode command
program
  .command('interactive')
  .alias('i')
  .description('Start interactive debugging session')
  .action((options, command) => {
    const parentOptions = command.parent?.opts() || {};
    const rpcUrl = getClusterEndpoint(parentOptions.url || 'devnet');
    const verbose = parentOptions.verbose || false;
    
    new InteractiveCommand().execute({
      ...options,
      verbose,
      rpcUrl,
    });
  });

// Configuration command
program
  .command('config')
  .description('Manage configuration and mappings')
  .option('--idl <path>', 'Add IDL files from directory')
  .option('--map-program <programId> <name>', 'Map program ID to name')
  .option('--map-account <account> <label>', 'Map account address to label')
  .option('--list', 'List current configuration')
  .action((options, command) => {
    const parentOptions = command.parent?.opts() || {};
    const verbose = parentOptions.verbose || false;
    
    new ConfigCommand().execute({
      ...options,
      verbose,
    });
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments are provided, show help
if (process.argv.length === 2) {
  program.help();
}