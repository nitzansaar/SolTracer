import { AccountInfo, ParsedInstruction, ParsedTransaction, PublicKey, TransactionSignature } from '@solana/web3.js';

// Define our own IdlInstruction type since @project-serum/anchor doesn't expose it properly
export interface IdlInstruction {
  name: string;
  accounts: IdlAccountItem[];
  args: IdlField[];
}

export interface IdlAccountItem {
  name: string;
  isMut: boolean;
  isSigner: boolean;
}

export interface IdlField {
  name: string;
  type: any;
}

/**
 * Represents account state at a specific point in time
 */
export interface AccountState {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
  label?: string;
  programOwner?: string;
}

/**
 * Captures account state changes before and after simulation
 */
export interface AccountDiff {
  pubkey: PublicKey;
  before: AccountState | null;
  after: AccountState | null;
  changes: {
    balance?: [number, number];
    data?: boolean;
    owner?: [string, string];
    executable?: [boolean, boolean];
    rentEpoch?: [number, number];
  };
  decodedData?: {
    before: any;
    after: any;
  };
}

/**
 * Single instruction with debug info
 */
export interface DebugInstruction {
  programId: PublicKey;
  programName?: string;
  instructionName?: string;
  instructionIndex: number;
  parsedInstruction?: ParsedInstruction;
  logs: string[];
  accountDiffs: AccountDiff[];
  error?: string;
  anchorInstruction?: IdlInstruction;
  anchorArgs?: any;
}

/**
 * Complete transaction debug result
 */
export interface DebugTransaction {
  signature?: TransactionSignature;
  parsedTransaction?: ParsedTransaction;
  success: boolean;
  instructions: DebugInstruction[];
  error?: string;
  timestamp?: number;
  slot?: number;
  blockTime?: number;
}

/**
 * Options for transaction simulation
 */
export interface SimulateOptions {
  commitment?: string;
  signers?: any[];
  skipPreflight?: boolean;
  preflightCommitment?: string;
  encodedTransaction?: string;
  replaceRecentBlockhash?: boolean;
  anchorIdlMap?: Map<string, any>;
}

/**
 * Detailed log entry with metadata
 */
export interface LogEntry {
  programId?: string;
  instructionIndex?: number;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: number;
}

/**
 * Results of an IDL lookup for Anchor programs
 */
export interface IdlLookupResult {
  idl: any;
  programId: PublicKey;
} 