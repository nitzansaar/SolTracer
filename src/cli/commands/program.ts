import { Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TransactionSimulator } from '../../core/simulator';
import * as fs from 'fs';
import chalk from 'chalk';

/**
 * Command options for program-based debugging
 */
interface ProgramCommandOptions {
  rpcUrl: string;
  verbose: boolean;
  output: 'json' | 'text';
  ix?: string;
  accounts?: string;
  signers?: string;
}

/**
 * Handler for the 'program' command which debugs specific program instructions
 */
export class ProgramCommand {
  /**
   * Execute the program command
   * @param programId Program ID to debug
   * @param options Command options
   */
  public async execute(programId: string, options: ProgramCommandOptions): Promise<void> {
    try {
      const programPubkey = new PublicKey(programId);
      console.log(chalk.cyan(`Debugging program: ${programId}`));
      console.log(chalk.cyan(`Using RPC URL: ${options.rpcUrl}`));
      
      // Load signers if provided
      const signers: Keypair[] = [];
      if (options.signers) {
        const keyPaths = options.signers.split(',');
        for (const path of keyPaths) {
          try {
            const keypairData = JSON.parse(fs.readFileSync(path.trim(), 'utf-8'));
            const keypair = Keypair.fromSecretKey(Buffer.from(keypairData));
            signers.push(keypair);
            console.log(chalk.green(`Loaded signer: ${keypair.publicKey.toString()}`));
          } catch (error: any) {
            console.warn(chalk.yellow(`Could not load keypair from ${path}: ${error.message || error}`));
          }
        }
      }
      
      // Ensure we have at least one signer as the fee payer
      if (signers.length === 0) {
        const feePayer = Keypair.generate();
        signers.push(feePayer);
        console.log(chalk.yellow(`No signers provided. Generated temporary key: ${feePayer.publicKey.toString()}`));
      }
      
      // Parse accounts
      let accountKeys: PublicKey[] = [];
      if (options.accounts) {
        try {
          const accountStrs = JSON.parse(options.accounts);
          accountKeys = accountStrs.map((acc: string) => new PublicKey(acc));
        } catch (error: any) {
          console.error(chalk.red(`Invalid accounts format: ${error.message || error}`));
          process.exit(1);
        }
      }
      
      // Create transaction instruction
      let instructionData: Buffer;
      if (options.ix) {
        try {
          instructionData = Buffer.from(options.ix, 'base64');
        } catch (error: any) {
          console.error(chalk.red(`Invalid instruction data: ${error.message || error}`));
          process.exit(1);
        }
      } else {
        console.log(chalk.yellow('No instruction data provided. Using empty data buffer.'));
        instructionData = Buffer.from([]);
      }
      
      // Build the instruction
      const keys = accountKeys.map(pubkey => ({
        pubkey,
        isSigner: signers.some(s => s.publicKey.equals(pubkey)),
        isWritable: true // Assume writable by default
      }));
      
      // Add fee payer if not already in accounts
      const feePayer = signers[0];
      if (!keys.some(k => k.pubkey.equals(feePayer.publicKey))) {
        keys.unshift({
          pubkey: feePayer.publicKey,
          isSigner: true,
          isWritable: true
        });
      }
      
      const instruction = new TransactionInstruction({
        programId: programPubkey,
        keys,
        data: instructionData
      });
      
      // Create transaction
      const transaction = new Transaction();
      transaction.add(instruction);
      transaction.feePayer = feePayer.publicKey;
      
      // Create simulator
      const simulator = new TransactionSimulator(options.rpcUrl);
      
      // Debug the transaction
      console.log(chalk.yellow('Simulating instruction...'));
      const result = await simulator.debugLocalTransaction(transaction, {
        signers
      });
      
      if (result.success) {
        console.log(chalk.green('✓ Instruction simulation successful'));
      } else {
        console.log(chalk.red(`✗ Instruction simulation failed: ${result.error}`));
      }
      
      // Output result
      this.displayResult(result, options.output);
      
    } catch (error) {
      console.error(chalk.red('Error debugging program instruction:'));
      console.error(error);
      process.exit(1);
    }
  }
  
  /**
   * Display the debug result
   * @param result Debug result
   * @param format Output format
   */
  private displayResult(result: any, format: 'json' | 'text'): void {
    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      // Text output format
      console.log(chalk.bold('\n=== Instruction Results ===\n'));
      console.log(`Status: ${result.success ? chalk.green('Success') : chalk.red('Failed')}`);
      
      if (result.error) {
        console.log(`Error: ${chalk.red(result.error)}`);
      }
      
      // Display each instruction (only one in this case)
      result.instructions.forEach((instruction: any, index: number) => {
        console.log(chalk.cyan(`\n--- Instruction ${index + 1} ---`));
        console.log(`Program: ${instruction.programName || instruction.programId.toString()}`);
        
        if (instruction.instructionName) {
          console.log(`Function: ${instruction.instructionName}`);
        }
        
        // Display logs
        if (instruction.logs && instruction.logs.length > 0) {
          console.log(chalk.yellow('\nLogs:'));
          instruction.logs.forEach((log: string) => {
            // Format log lines
            if (log.includes('Program log:')) {
              console.log(chalk.green(`  ${log}`));
            } else if (log.includes('Program data:')) {
              console.log(chalk.blue(`  ${log}`));
            } else if (log.includes('Program failed:') || log.includes('Error:')) {
              console.log(chalk.red(`  ${log}`));
            } else {
              console.log(`  ${log}`);
            }
          });
        } else {
          console.log('\nNo logs generated.');
        }
        
        // Display account diffs
        if (instruction.accountDiffs && instruction.accountDiffs.length > 0) {
          console.log(chalk.yellow('\nAccount Changes:'));
          instruction.accountDiffs.forEach((diff: any) => {
            const label = diff.before?.label ? ` (${diff.before.label})` : '';
            console.log(`  ${diff.pubkey.toString()}${label}`);
            
            if (diff.changes.balance) {
              const [before, after] = diff.changes.balance;
              const change = after - before;
              console.log(`    Balance: ${before} → ${after} (${change >= 0 ? '+' : ''}${change} lamports)`);
            }
            
            if (diff.changes.data) {
              console.log(`    Data: ${chalk.yellow('[changed]')}`);
            }
          });
        }
        
        // Anchor arguments if available
        if (instruction.anchorArgs) {
          console.log(chalk.yellow('\nArguments:'));
          console.log(JSON.stringify(instruction.anchorArgs, null, 2).replace(/^/gm, '  '));
        }
      });
    }
  }
} 