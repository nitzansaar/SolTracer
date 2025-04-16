import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { PublicKey } from '@solana/web3.js';
import { createLocalIdlRegistry } from '../../utils/anchor-utils';

/**
 * Options for the config command
 */
interface ConfigCommandOptions {
  verbose: boolean;
  idl?: string;
  'map-program'?: string;
  'map-account'?: string;
  list?: boolean;
}

/**
 * Handler for the 'config' command which manages program and account mappings
 */
export class ConfigCommand {
  private configDir: string;
  private programsFile: string;
  private accountsFile: string;
  
  constructor() {
    // Set up paths to config files
    this.configDir = path.join(process.env.HOME || '', '.soltrace');
    this.programsFile = path.join(this.configDir, 'programs.json');
    this.accountsFile = path.join(this.configDir, 'accounts.json');
    
    // Ensure the config directory exists
    this.ensureConfigDir();
  }
  
  /**
   * Execute the config command
   * @param options Command options
   */
  public async execute(options: ConfigCommandOptions): Promise<void> {
    try {
      // Handle IDL registration
      if (options.idl) {
        this.registerIdl(options.idl);
      }
      
      // Handle program mapping
      if (options['map-program']) {
        const [programId, name] = options['map-program'].split(' ');
        this.mapProgram(programId, name);
      }
      
      // Handle account mapping
      if (options['map-account']) {
        const [account, label] = options['map-account'].split(' ');
        this.mapAccount(account, label);
      }
      
      // List configuration
      if (options.list || (!options.idl && !options['map-program'] && !options['map-account'])) {
        this.listConfiguration();
      }
    } catch (error: any) {
      console.error(chalk.red('Error executing config command:'));
      console.error(error);
      process.exit(1);
    }
  }
  
  /**
   * Register IDL files for Anchor programs
   * @param idlPath Path to directory containing IDL files
   */
  private registerIdl(idlPath: string): void {
    try {
      if (!fs.existsSync(idlPath)) {
        console.error(chalk.red(`Directory not found: ${idlPath}`));
        return;
      }
      
      console.log(chalk.cyan(`Registering IDLs from: ${idlPath}`));
      createLocalIdlRegistry(idlPath);
      console.log(chalk.green('✓ IDL registration complete'));
    } catch (error: any) {
      console.error(chalk.red(`Error registering IDLs: ${error.message || error}`));
    }
  }
  
  /**
   * Map a program ID to a human-readable name
   * @param programId Program ID
   * @param name Human-readable name
   */
  private mapProgram(programId: string, name: string): void {
    try {
      // Validate program ID
      new PublicKey(programId);
      
      // Read existing programs
      const programs = this.readProgramMappings();
      
      // Add or update mapping
      programs[programId] = name;
      
      // Write back to file
      fs.writeFileSync(this.programsFile, JSON.stringify(programs, null, 2));
      
      console.log(chalk.green(`✓ Mapped program ${programId} to name "${name}"`));
    } catch (error: any) {
      console.error(chalk.red(`Error mapping program: ${error.message || error}`));
    }
  }
  
  /**
   * Map an account address to a human-readable label
   * @param account Account address
   * @param label Human-readable label
   */
  private mapAccount(account: string, label: string): void {
    try {
      // Validate account address
      new PublicKey(account);
      
      // Read existing accounts
      const accounts = this.readAccountMappings();
      
      // Add or update mapping
      accounts[account] = label;
      
      // Write back to file
      fs.writeFileSync(this.accountsFile, JSON.stringify(accounts, null, 2));
      
      console.log(chalk.green(`✓ Mapped account ${account} to label "${label}"`));
    } catch (error: any) {
      console.error(chalk.red(`Error mapping account: ${error.message || error}`));
    }
  }
  
  /**
   * List current configuration
   */
  private listConfiguration(): void {
    console.log(chalk.bold('=== SolTrace Configuration ===\n'));
    
    // List config directory
    console.log(chalk.cyan('Configuration Directory:'));
    console.log(this.configDir);
    console.log();
    
    // List program mappings
    const programs = this.readProgramMappings();
    console.log(chalk.cyan(`Program Mappings (${Object.keys(programs).length}):`));
    if (Object.keys(programs).length === 0) {
      console.log('  No program mappings defined');
    } else {
      Object.entries(programs).forEach(([id, name]) => {
        console.log(`  ${id} => ${chalk.yellow(name)}`);
      });
    }
    console.log();
    
    // List account mappings
    const accounts = this.readAccountMappings();
    console.log(chalk.cyan(`Account Mappings (${Object.keys(accounts).length}):`));
    if (Object.keys(accounts).length === 0) {
      console.log('  No account mappings defined');
    } else {
      Object.entries(accounts).forEach(([address, label]) => {
        console.log(`  ${address} => ${chalk.yellow(label)}`);
      });
    }
    console.log();
    
    // List IDLs
    const idlDir = path.join(this.configDir, 'idl');
    if (fs.existsSync(idlDir)) {
      const idlFiles = fs.readdirSync(idlDir).filter(f => f.endsWith('.json'));
      console.log(chalk.cyan(`Cached IDLs (${idlFiles.length}):`));
      if (idlFiles.length === 0) {
        console.log('  No IDLs cached');
      } else {
        idlFiles.forEach(file => {
          // Extract program ID from filename
          const programId = file.replace('.json', '');
          
          // Try to read IDL to get name
          try {
            const idl = JSON.parse(fs.readFileSync(path.join(idlDir, file), 'utf8'));
            console.log(`  ${programId} => ${chalk.yellow(idl.name)} (v${idl.version})`);
          } catch (error) {
            console.log(`  ${programId}`);
          }
        });
      }
    } else {
      console.log(chalk.cyan('Cached IDLs:'));
      console.log('  No IDLs cached');
    }
  }
  
  /**
   * Read program mappings from file
   * @returns Map of program IDs to names
   */
  private readProgramMappings(): { [key: string]: string } {
    if (fs.existsSync(this.programsFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.programsFile, 'utf8'));
      } catch (error: any) {
        console.warn(chalk.yellow(`Error reading program mappings file: ${error.message || error}`));
      }
    }
    return {};
  }
  
  /**
   * Read account mappings from file
   * @returns Map of account addresses to labels
   */
  private readAccountMappings(): { [key: string]: string } {
    if (fs.existsSync(this.accountsFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.accountsFile, 'utf8'));
      } catch (error: any) {
        console.warn(chalk.yellow(`Error reading account mappings file: ${error.message || error}`));
      }
    }
    return {};
  }
  
  /**
   * Ensure the config directory exists
   */
  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    
    // Create the IDL directory
    const idlDir = path.join(this.configDir, 'idl');
    if (!fs.existsSync(idlDir)) {
      fs.mkdirSync(idlDir, { recursive: true });
    }
    
    // Initialize empty program mappings file if it doesn't exist
    if (!fs.existsSync(this.programsFile)) {
      fs.writeFileSync(this.programsFile, JSON.stringify({}, null, 2));
    }
    
    // Initialize empty account mappings file if it doesn't exist
    if (!fs.existsSync(this.accountsFile)) {
      fs.writeFileSync(this.accountsFile, JSON.stringify({}, null, 2));
    }
  }
} 