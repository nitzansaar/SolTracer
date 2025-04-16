import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
  SimulatedTransactionResponse,
  Message,
  VersionedTransaction,
  VersionedMessage,
  ComputeBudgetProgram,
  sendAndConfirmTransaction,
  Keypair,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  RpcResponseAndContext,
  Finality,
  TransactionResponse,
  VersionedTransactionResponse
} from '@solana/web3.js';
import { AccountDiff, AccountState, DebugInstruction, DebugTransaction, SimulateOptions } from '../utils/types';
import { getAccountLabel, getProgramName } from '../utils/lookup';
import { parseTransactionLogs } from '../utils/log-parser';
import { decodeAnchorInstruction } from '../utils/anchor-utils';
import chalk from 'chalk';

interface LegacyMessage {
  accountKeys: PublicKey[];
  instructions: any[];
  isAccountSigner(index: number): boolean;
  isAccountWritable(index: number): boolean;
}

/**
 * Format any error object into a readable string
 * @param err The error object
 * @returns A string representation of the error
 */
function formatError(err: any): string {
  if (err === null || err === undefined) {
    return 'Unknown error';
  }
  
  if (typeof err === 'string') {
    return err;
  }
  
  if (typeof err === 'object') {
    // Check if it's an Error instance
    if (err.message) {
      return err.message;
    }
    
    // Try to extract meaningful info from the error object
    try {
      return JSON.stringify(err);
    } catch (e) {
      // If circular reference or other JSON stringify error
      return Object.prototype.toString.call(err);
    }
  }
  
  return String(err);
}

/**
 * Core transaction simulator that replays and analyzes Solana transactions
 */
export class TransactionSimulator {
  private connection: Connection;
  private anchorIdlMap: Map<string, any>;
  private rpcUrl: string;

  /**
   * Creates a new simulator instance
   * @param rpcUrl The Solana RPC URL to connect to
   * @param anchorIdlMap Optional map of program IDs to Anchor IDLs
   */
  constructor(rpcUrl: string, anchorIdlMap?: Map<string, any>) {
    this.rpcUrl = rpcUrl;
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.anchorIdlMap = anchorIdlMap || new Map();
  }

  /**
   * Debug a transaction using its signature
   * @param signature Transaction signature to debug
   * @param options Simulation options
   * @returns Detailed debugging information
   */
  public async debugSignature(
    signature: TransactionSignature,
    options: SimulateOptions = {}
  ): Promise<DebugTransaction> {
    try {
      // Fetch the transaction
      let transaction = await this.connection.getTransaction(signature, {
        commitment: options.commitment as Finality || 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      // If transaction not found, try other networks
      if (!transaction && !options.skipNetworkFallback) {
        console.log(chalk.yellow(`Transaction not found on current network. Trying mainnet...`));
        
        // Try mainnet
        const mainnetUrl = 'https://api.mainnet-beta.solana.com';
        if (this.rpcUrl !== mainnetUrl) {
          const mainnetConnection = new Connection(mainnetUrl, 'confirmed');
          try {
            transaction = await mainnetConnection.getTransaction(signature, {
              commitment: options.commitment as Finality || 'confirmed',
              maxSupportedTransactionVersion: 0,
            });
            
            if (transaction) {
              console.log(chalk.green(`Transaction found on mainnet. Switching network...`));
              this.connection = mainnetConnection;
              this.rpcUrl = mainnetUrl;
            }
          } catch (err) {
            // Ignore errors, just continue to next network
          }
        }
        
        // If still not found, try devnet
        if (!transaction) {
          console.log(chalk.yellow(`Not found on mainnet. Trying devnet...`));
          const devnetUrl = 'https://api.devnet.solana.com';
          if (this.rpcUrl !== devnetUrl) {
            const devnetConnection = new Connection(devnetUrl, 'confirmed');
            try {
              transaction = await devnetConnection.getTransaction(signature, {
                commitment: options.commitment as Finality || 'confirmed',
                maxSupportedTransactionVersion: 0,
              });
              
              if (transaction) {
                console.log(chalk.green(`Transaction found on devnet. Switching network...`));
                this.connection = devnetConnection;
                this.rpcUrl = devnetUrl;
              }
            } catch (err) {
              // Ignore errors, just continue to next network
            }
          }
        }
        
        // If still not found, try testnet
        if (!transaction) {
          console.log(chalk.yellow(`Not found on devnet. Trying testnet...`));
          const testnetUrl = 'https://api.testnet.solana.com';
          if (this.rpcUrl !== testnetUrl) {
            const testnetConnection = new Connection(testnetUrl, 'confirmed');
            try {
              transaction = await testnetConnection.getTransaction(signature, {
                commitment: options.commitment as Finality || 'confirmed',
                maxSupportedTransactionVersion: 0,
              });
              
              if (transaction) {
                console.log(chalk.green(`Transaction found on testnet. Switching network...`));
                this.connection = testnetConnection;
                this.rpcUrl = testnetUrl;
              }
            } catch (err) {
              // Ignore errors
            }
          }
        }
      }

      if (!transaction) {
        throw new Error(`Transaction ${signature} not found on any network`);
      }

      // Get pre-transaction account states
      const message = transaction.transaction.message;
      // Handle both legacy and versioned transactions
      const accountKeys = 'accountKeys' in message 
        ? message.accountKeys 
        : message.getAccountKeys().staticAccountKeys;
      const preTransactionAccounts = new Map<string, AccountState>();

      // We would ideally get historical account info, but this is a limitation
      // For now, we'll use the current state as a starting point
      for (const key of accountKeys) {
        try {
          const accountInfo = await this.connection.getAccountInfo(new PublicKey(key));
          if (accountInfo) {
            preTransactionAccounts.set(key.toString(), {
              pubkey: new PublicKey(key),
              account: {
                ...accountInfo,
                data: accountInfo.data as Buffer,
              },
              programOwner: accountInfo.owner.toString(),
              label: await getAccountLabel(new PublicKey(key), accountInfo),
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch account ${key}:`, error);
        }
      }

      // Replay the transaction
      // This is a placeholder - in a real implementation we would replay the transaction
      // and capture the post-transaction states
      const simulationResult = await this.simulateFromSignature(signature, options);

      // Process the simulation results
      const debugTransaction: DebugTransaction = {
        signature,
        success: !(simulationResult.value.err),
        error: simulationResult.value.err ? formatError(simulationResult.value.err) : undefined,
        instructions: [],
        timestamp: transaction.blockTime || undefined,
        slot: transaction.slot,
        network: this.getNetworkName(this.rpcUrl),
      };

      // Parse logs
      const logsByInstruction = parseTransactionLogs(simulationResult.value.logs || []);

      // Process each instruction
      // Handle both legacy and versioned transactions
      if ('instructions' in message) {
        // Legacy transaction
        message.instructions.forEach((instruction: any, index: number) => {
          const programId = accountKeys[instruction.programIdIndex];
          const programName = getProgramName(programId.toString());
          
          // Create debug instruction
          const debugInstruction: DebugInstruction = {
            programId: programId,
            programName,
            instructionIndex: index,
            logs: logsByInstruction[index] || [],
            accountDiffs: [], // Will be populated below
          };

          // Try to decode Anchor instruction if IDL is available
          if (this.anchorIdlMap.has(programId.toString())) {
            try {
              const decodedInstruction = decodeAnchorInstruction(
                instruction,
                this.anchorIdlMap.get(programId.toString()),
                accountKeys
              );
              if (decodedInstruction) {
                debugInstruction.instructionName = decodedInstruction.name;
                debugInstruction.anchorInstruction = decodedInstruction.ix;
                debugInstruction.anchorArgs = decodedInstruction.args;
              }
            } catch (error) {
              console.warn(`Failed to decode Anchor instruction for program ${programId}:`, error);
            }
          }

          // Get account diffs for this instruction
          for (const accountIdx of instruction.accounts) {
            const account = accountKeys[accountIdx];
            const preState = preTransactionAccounts.get(account.toString()) || null;
            
            // In a real implementation, we would have the post state as well
            // For now this is a placeholder showing the structure
            const postState = preState; // Same as pre-state as a placeholder

            if (preState && postState) {
              const diff: AccountDiff = {
                pubkey: account,
                before: preState,
                after: postState,
                changes: {
                  // Detect changes (comparing pre and post state)
                  // This is a placeholder - in a real implementation, we would detect actual changes
                  data: false, // Placeholder - would compare data
                  balance: preState.account.lamports !== postState.account.lamports 
                    ? [preState.account.lamports, postState.account.lamports] 
                    : undefined,
                },
              };
              
              // Add to instruction account diffs
              debugInstruction.accountDiffs.push(diff);
            }
          }

          // Add instruction to debug transaction
          debugTransaction.instructions.push(debugInstruction);
        });
      } else {
        // Versioned transaction - would need custom processing
        // This is a simplified placeholder
        debugTransaction.instructions.push({
          programId: new PublicKey('11111111111111111111111111111111'),
          programName: 'System Program',
          instructionIndex: 0,
          logs: simulationResult.value.logs || [],
          accountDiffs: [],
        });
      }

      return debugTransaction;
    } catch (error: any) {
      console.error('Error debugging transaction:', error);
      return {
        signature,
        success: false,
        error: formatError(error),
        instructions: [],
      };
    }
  }

  /**
   * Debug a local transaction before sending it
   * @param transaction Transaction to debug
   * @param options Simulation options
   * @returns Detailed debugging information
   */
  public async debugLocalTransaction(
    transaction: Transaction | VersionedTransaction,
    options: SimulateOptions = {}
  ): Promise<DebugTransaction> {
    try {
      // Get pre-transaction account states
      const message = transaction instanceof Transaction 
        ? transaction.compileMessage() 
        : transaction.message;
        
      const accountKeys = message.staticAccountKeys || message.getAccountKeys().staticAccountKeys;
      const preTransactionAccounts = new Map<string, AccountState>();

      // Fetch account info for each account involved
      for (const key of accountKeys) {
        try {
          const accountInfo = await this.connection.getAccountInfo(key);
          if (accountInfo) {
            preTransactionAccounts.set(key.toString(), {
              pubkey: key,
              account: {
                ...accountInfo,
                data: accountInfo.data as Buffer,
              },
              programOwner: accountInfo.owner.toString(),
              label: await getAccountLabel(key, accountInfo),
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch account ${key}:`, error);
        }
      }

      // Simulate the transaction
      const simulationResult = await this.simulateTransaction(transaction, options);

      const debugTransaction: DebugTransaction = {
        success: !(simulationResult.value.err),
        error: simulationResult.value.err ? formatError(simulationResult.value.err) : undefined,
        instructions: [],
      };

      // Parse logs
      const logsByInstruction = parseTransactionLogs(simulationResult.value.logs || []);

      // Process each instruction
      // The logic here depends on transaction version
      // This is a simplified placeholder implementation
      let instructions: any[] = [];
      
      if (transaction instanceof Transaction) {
        instructions = transaction.instructions;
      } else {
        // For versioned transactions, we need to get instructions from the message
        // This is a simplified approach
        const versionedMessage = transaction.message as VersionedMessage;
        instructions = versionedMessage.compiledInstructions.map(ix => {
          return {
            programIdIndex: ix.programIdIndex,
            accounts: ix.accountKeyIndexes,
            data: ix.data,
          };
        });
      }

      instructions.forEach((instruction, index) => {
        const programIdIndex = 'programIdIndex' in instruction ? instruction.programIdIndex : accountKeys.findIndex(
          key => key.equals(instruction.programId)
        );
        
        const programId = 'programId' in instruction 
          ? instruction.programId 
          : accountKeys[programIdIndex];
          
        const programName = getProgramName(programId.toString());
        
        // Create debug instruction
        const debugInstruction: DebugInstruction = {
          programId: programId,
          programName,
          instructionIndex: index,
          logs: logsByInstruction[index] || [],
          accountDiffs: [], // Will be populated in a real implementation
        };

        // Try to decode Anchor instruction if IDL is available
        if (this.anchorIdlMap.has(programId.toString())) {
          try {
            const decodedInstruction = decodeAnchorInstruction(
              instruction,
              this.anchorIdlMap.get(programId.toString()),
              accountKeys
            );
            if (decodedInstruction) {
              debugInstruction.instructionName = decodedInstruction.name;
              debugInstruction.anchorInstruction = decodedInstruction.ix;
              debugInstruction.anchorArgs = decodedInstruction.args;
            }
          } catch (error) {
            console.warn(`Failed to decode Anchor instruction for program ${programId}:`, error);
          }
        }

        // Add instruction to debug transaction
        debugTransaction.instructions.push(debugInstruction);
      });

      return debugTransaction;
    } catch (error: any) {
      console.error('Error debugging local transaction:', error);
      return {
        success: false,
        error: formatError(error),
        instructions: [],
      };
    }
  }

  /**
   * Simulate a transaction from a signature
   * @param signature Transaction signature
   * @param options Simulation options
   * @returns Simulation response
   */
  private async simulateFromSignature(
    signature: string,
    options: SimulateOptions = {}
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    const transaction = await this.connection.getTransaction(signature, {
      commitment: options.commitment as Finality || 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      throw new Error(`Transaction ${signature} not found`);
    }

    // If we need to resimulate, we'd create a new transaction based on the original transaction data
    // This is a simplified approach
    const message = transaction.transaction.message;
    
    // Get a recent blockhash for the simulation
    const { blockhash } = await this.connection.getLatestBlockhash(options.commitment as Finality || 'confirmed');
    
    // Create a new transaction with the same instructions but a new blockhash
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    
    // Handle both legacy and versioned transactions
    if ('accountKeys' in message) {
      // Legacy transaction
      tx.feePayer = message.accountKeys[0];
      
      // Add all instructions from the original transaction
      message.instructions.forEach((ix: any) => {
        const programId = message.accountKeys[ix.programIdIndex];
        const accounts = ix.accounts.map((idx: number) => message.accountKeys[idx]);
        
        tx.add(new TransactionInstruction({
          programId,
          keys: accounts.map((pubkey: PublicKey, idx: number) => ({
            pubkey,
            isSigner: message.isAccountSigner(idx),
            isWritable: message.isAccountWritable(idx),
          })),
          data: Buffer.from(ix.data),
        }));
      });
    } else {
      // Versioned transaction
      const accountKeys = message.getAccountKeys().staticAccountKeys;
      tx.feePayer = accountKeys[0];
      
      // Simplistic approach - would need more complex logic for versioned transactions
      // This is just a placeholder
    }
    
    // Simulate the transaction
    return await this.connection.simulateTransaction(tx, options.signers);
  }

  /**
   * Simulate a local transaction
   * @param transaction Transaction to simulate
   * @param options Simulation options
   * @returns Simulation response
   */
  private async simulateTransaction(
    transaction: Transaction | VersionedTransaction,
    options: SimulateOptions = {}
  ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    if (options.replaceRecentBlockhash) {
      if (transaction instanceof Transaction) {
        const { blockhash } = await this.connection.getLatestBlockhash(
          options.preflightCommitment as Finality || 'confirmed',
        );
        transaction.recentBlockhash = blockhash;
      } else {
        // For versioned transactions, we'd need a different approach
        // Not implemented in this example
      }
    }
    
    if (transaction instanceof Transaction) {
      return await this.connection.simulateTransaction(transaction, options.signers);
    } else {
      // Handle versioned transactions - in a real implementation
      // This is a placeholder as the simulateTransaction doesn't support VersionedTransaction directly
      return await this.connection.simulateTransaction(Transaction.from(transaction.serialize()));
    }
  }

  private getNetworkName(rpcUrl: string): string {
    if (rpcUrl.includes('mainnet')) {
      return 'mainnet';
    } else if (rpcUrl.includes('devnet')) {
      return 'devnet';
    } else if (rpcUrl.includes('testnet')) {
      return 'testnet';
    } else {
      return 'unknown network';
    }
  }
} 