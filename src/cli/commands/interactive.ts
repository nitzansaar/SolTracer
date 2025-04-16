import inquirer from 'inquirer';
import chalk from 'chalk';
import { Connection, PublicKey } from '@solana/web3.js';
import { TransactionCommand } from './transaction';
import { ProgramCommand } from './program';
import { fetchAnchorIdl } from '../../utils/anchor-utils';
import { getClusterEndpoint } from '../../utils/lookup';

/**
 * Command options for interactive mode
 */
interface InteractiveCommandOptions {
  rpcUrl: string;
  verbose: boolean;
}

/**
 * Handler for the 'interactive' command which provides an interactive interface
 */
export class InteractiveCommand {
  private connection!: Connection;
  
  /**
   * Execute the interactive command
   * @param options Command options
   */
  public async execute(options: InteractiveCommandOptions): Promise<void> {
    this.connection = new Connection(options.rpcUrl);
    
    console.log(chalk.cyan('Starting interactive debugging session...'));
    console.log(chalk.cyan(`Connected to: ${options.rpcUrl}`));
    
    // Main menu loop
    let exit = false;
    while (!exit) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Debug a transaction by signature', value: 'tx' },
            { name: 'Debug a program instruction', value: 'program' },
            { name: 'Fetch and cache Anchor IDL', value: 'fetch-idl' },
            { name: 'Change RPC endpoint', value: 'change-rpc' },
            { name: 'Exit', value: 'exit' }
          ]
        }
      ]);
      
      switch (action) {
        case 'tx':
          await this.debugTransaction(options);
          break;
        case 'program':
          await this.debugProgram(options);
          break;
        case 'fetch-idl':
          await this.fetchIdl();
          break;
        case 'change-rpc':
          await this.changeRpcEndpoint(options);
          break;
        case 'exit':
          exit = true;
          break;
      }
    }
    
    console.log(chalk.cyan('Exiting interactive session. Goodbye!'));
  }
  
  /**
   * Debug a transaction interactively
   * @param options Command options
   */
  private async debugTransaction(options: InteractiveCommandOptions): Promise<void> {
    const { signature, format } = await inquirer.prompt([
      {
        type: 'input',
        name: 'signature',
        message: 'Enter transaction signature:',
        validate: (input: string) => input.trim().length > 0 || 'Signature is required'
      },
      {
        type: 'list',
        name: 'format',
        message: 'Select output format:',
        choices: [
          { name: 'Text (human-readable)', value: 'text' },
          { name: 'JSON', value: 'json' }
        ],
        default: 'text'
      }
    ]);
    
    try {
      // Let the simulator auto-detect the network by not providing skipNetworkFallback
      console.log(chalk.yellow(`Debugging transaction: ${signature.trim()}`));
      console.log(chalk.yellow(`Starting with RPC URL: ${options.rpcUrl}. Will auto-detect if needed.`));
      
      // Execute transaction command
      await new TransactionCommand().execute(signature.trim(), {
        rpcUrl: options.rpcUrl,
        verbose: options.verbose,
        output: format
      });
    } catch (error) {
      console.error(chalk.red('Error debugging transaction:'));
      console.error(error);
    }
  }
  
  /**
   * Debug a program instruction interactively
   * @param options Command options
   */
  private async debugProgram(options: InteractiveCommandOptions): Promise<void> {
    const { programId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'programId',
        message: 'Enter program ID:',
        validate: (input: string) => {
          try {
            new PublicKey(input.trim());
            return true;
          } catch (error) {
            return 'Invalid program ID';
          }
        }
      }
    ]);
    
    // Ask for instruction data
    const { hasInstructionData } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasInstructionData',
        message: 'Do you have base64-encoded instruction data?',
        default: false
      }
    ]);
    
    let instructionData;
    if (hasInstructionData) {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'data',
          message: 'Enter base64-encoded instruction data:',
          validate: (input: string) => {
            try {
              Buffer.from(input.trim(), 'base64');
              return true;
            } catch (error) {
              return 'Invalid base64-encoded data';
            }
          }
        }
      ]);
      instructionData = response.data.trim();
    }
    
    // Ask for accounts
    const { hasAccounts } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasAccounts',
        message: 'Do you want to specify accounts?',
        default: false
      }
    ]);
    
    let accounts = '[]';
    if (hasAccounts) {
      console.log(chalk.yellow('Enter account addresses one per line. Press Enter twice when done:'));
      
      const accountList: string[] = [];
      let done = false;
      
      while (!done) {
        const { account } = await inquirer.prompt([
          {
            type: 'input',
            name: 'account',
            message: `Account ${accountList.length + 1}:`,
          }
        ]);
        
        if (!account.trim()) {
          done = true;
        } else {
          try {
            new PublicKey(account.trim());
            accountList.push(account.trim());
          } catch (error) {
            console.log(chalk.red('Invalid account address. Please try again.'));
          }
        }
      }
      
      accounts = JSON.stringify(accountList);
    }
    
    // Execute program command
    await new ProgramCommand().execute(programId.trim(), {
      rpcUrl: options.rpcUrl,
      verbose: options.verbose,
      output: 'text',
      ix: instructionData,
      accounts
    });
  }
  
  /**
   * Fetch and cache an Anchor IDL
   */
  private async fetchIdl(): Promise<void> {
    const { programId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'programId',
        message: 'Enter Anchor program ID:',
        validate: (input: string) => {
          try {
            new PublicKey(input.trim());
            return true;
          } catch (error) {
            return 'Invalid program ID';
          }
        }
      }
    ]);
    
    try {
      console.log(chalk.yellow('Fetching IDL...'));
      const result = await fetchAnchorIdl(programId.trim());
      
      if (result) {
        console.log(chalk.green('✓ IDL fetched and cached successfully'));
        console.log(`Program: ${result.programId.toString()}`);
        console.log(`Name: ${result.idl.name}`);
        console.log(`Version: ${result.idl.version}`);
        console.log(`Instructions: ${result.idl.instructions.length}`);
      } else {
        console.log(chalk.red('✗ Could not fetch IDL for this program'));
        console.log('It might not be an Anchor program or the IDL is not published');
      }
    } catch (error) {
      console.error(chalk.red('Error fetching IDL:'));
      console.error(error);
    }
  }
  
  /**
   * Change the RPC endpoint
   * @param options Command options
   */
  private async changeRpcEndpoint(options: InteractiveCommandOptions): Promise<void> {
    const { network } = await inquirer.prompt([
      {
        type: 'list',
        name: 'network',
        message: 'Select a network:',
        choices: [
          { name: 'Mainnet', value: 'mainnet' },
          { name: 'Testnet', value: 'testnet' },
          { name: 'Devnet', value: 'devnet' },
          { name: 'Localhost (8899)', value: 'localhost' },
          { name: 'Custom RPC URL', value: 'custom' }
        ]
      }
    ]);
    
    let rpcUrl = '';
    
    if (network === 'custom') {
      const { customUrl } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customUrl',
          message: 'Enter custom RPC URL:',
          validate: (input: string) => input.trim().length > 0 || 'URL is required'
        }
      ]);
      rpcUrl = customUrl.trim();
    } else {
      rpcUrl = getClusterEndpoint(network);
    }
    
    // Update the connection
    this.connection = new Connection(rpcUrl);
    options.rpcUrl = rpcUrl;
    
    console.log(chalk.green(`RPC endpoint changed to: ${rpcUrl}`));
    
    // Test connection
    try {
      const version = await this.connection.getVersion();
      console.log(chalk.green('✓ Connection successful'));
      console.log(`Solana version: ${version['solana-core']}`);
    } catch (error) {
      console.log(chalk.red('✗ Connection failed'));
      console.error(error);
    }
  }
} 