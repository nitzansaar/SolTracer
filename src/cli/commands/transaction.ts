import { TransactionSignature } from '@solana/web3.js';
import { TransactionSimulator } from '../../core/simulator';
import * as fs from 'fs';
import chalk from 'chalk';

/**
 * Command options for transaction debugging
 */
interface TransactionCommandOptions {
  rpcUrl: string;
  verbose: boolean;
  output: 'json' | 'text';
  file?: string;
  skipNetworkFallback?: boolean;
}

/**
 * Handler for the 'tx' command which debugs transactions by signature
 */
export class TransactionCommand {
  /**
   * Execute the transaction command
   * @param signature Transaction signature to debug
   * @param options Command options
   */
  public async execute(signature: TransactionSignature, options: TransactionCommandOptions): Promise<void> {
    try {
      console.log(chalk.cyan(`Debugging transaction: ${signature}`));
      console.log(chalk.cyan(`Using RPC URL: ${options.rpcUrl}`));
      
      // Create simulator
      const simulator = new TransactionSimulator(options.rpcUrl);
      
      // Debug the transaction - allow network auto-detection
      console.log(chalk.yellow('Simulating transaction...'));
      const simulateOptions = {
        skipNetworkFallback: options.skipNetworkFallback
      };
      const result = await simulator.debugSignature(signature, simulateOptions);
      
      if (result.success) {
        console.log(chalk.green('✓ Transaction simulation successful'));
      } else {
        console.log(chalk.red(`✗ Transaction simulation failed: ${result.error}`));
      }
      
      // Generate output
      const output = this.formatOutput(result, options.output);
      
      // Write to file or console
      if (options.file) {
        fs.writeFileSync(options.file, output);
        console.log(chalk.green(`Output written to ${options.file}`));
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error(chalk.red('Error debugging transaction:'));
      console.error(error);
      process.exit(1);
    }
  }
  
  /**
   * Format the debug result based on output format
   * @param result Debug result
   * @param format Output format
   * @returns Formatted output
   */
  private formatOutput(result: any, format: 'json' | 'text'): string {
    if (format === 'json') {
      return JSON.stringify(result, null, 2);
    } else {
      // Text output format - more human-readable
      let output = '';
      
      // Transaction overview
      output += chalk.bold('=== Transaction Overview ===\n');
      output += `Signature: ${result.signature}\n`;
      output += `Status: ${result.success ? chalk.green('Success') : chalk.red('Failed')}\n`;
      if (result.error) {
        output += `Error: ${chalk.red(result.error)}\n`;
      }
      if (result.network) {
        output += `Network: ${chalk.cyan(result.network)}\n`;
      }
      if (result.slot) {
        output += `Slot: ${result.slot}\n`;
      }
      if (result.blockTime) {
        const date = new Date(result.blockTime * 1000);
        output += `Block Time: ${date.toLocaleString()}\n`;
      }
      output += '\n';
      
      // Instructions
      output += chalk.bold(`=== Instructions (${result.instructions.length}) ===\n`);
      
      result.instructions.forEach((instruction: any, index: number) => {
        output += chalk.cyan(`\n--- Instruction ${index + 1} ---\n`);
        output += `Program: ${instruction.programName || instruction.programId.toString()}\n`;
        
        if (instruction.instructionName) {
          output += `Function: ${instruction.instructionName}\n`;
        }
        
        // Accounts involved
        output += chalk.yellow('\nAccounts:\n');
        instruction.accountDiffs.forEach((diff: any) => {
          const label = diff.before?.label ? ` (${diff.before.label})` : '';
          output += `  ${diff.pubkey.toString()}${label}\n`;
          
          // Show changes if any
          if (diff.changes.balance) {
            const [before, after] = diff.changes.balance;
            const change = after - before;
            const changeStr = change >= 0 ? `+${change}` : `${change}`;
            output += `    Balance: ${before} → ${after} (${changeStr} lamports)\n`;
          }
          
          if (diff.changes.data) {
            output += `    Data: ${chalk.yellow('[changed]')}\n`;
          }
          
          if (diff.changes.owner) {
            const [before, after] = diff.changes.owner;
            output += `    Owner: ${before} → ${after}\n`;
          }
        });
        
        // Logs
        if (instruction.logs && instruction.logs.length > 0) {
          output += chalk.yellow('\nLogs:\n');
          instruction.logs.forEach((log: any) => {
            // Format log lines for readability
            if (log.includes('Program log:')) {
              output += chalk.green(`  ${log}\n`);
            } else if (log.includes('Program data:')) {
              output += chalk.blue(`  ${log}\n`);
            } else if (log.includes('Program failed:') || log.includes('Error:')) {
              output += chalk.red(`  ${log}\n`);
            } else {
              output += `  ${log}\n`;
            }
          });
        }
        
        // Anchor-specific info
        if (instruction.anchorArgs) {
          output += chalk.yellow('\nArguments:\n');
          output += `  ${JSON.stringify(instruction.anchorArgs, null, 2).replace(/\n/g, '\n  ')}\n`;
        }
      });
      
      return output;
    }
  }
} 