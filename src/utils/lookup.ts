import { AccountInfo, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

// Map of known program IDs to human-readable names
const KNOWN_PROGRAMS: { [key: string]: string } = {
  '11111111111111111111111111111111': 'System Program',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Token Metadata',
  'SysvarRent111111111111111111111111111111111': 'Rent Sysvar',
  'SysvarC1ock11111111111111111111111111111111': 'Clock Sysvar',
  'Stake11111111111111111111111111111111111111': 'Stake Program',
  'Vote111111111111111111111111111111111111111': 'Vote Program',
  'BPFLoaderUpgradeab1e11111111111111111111111': 'BPF Loader',
  'ComputeBudget111111111111111111111111111111': 'Compute Budget Program',
  // Add more known programs as needed
};

// Cache for program names to avoid repeated lookups
const programNameCache = new Map<string, string>();

/**
 * Get a human-readable name for a program ID
 * @param programId The program ID as a string or PublicKey
 * @returns Human-readable name or the original program ID
 */
export function getProgramName(programId: string | PublicKey): string {
  const idStr = programId.toString();
  
  // Check cache first
  if (programNameCache.has(idStr)) {
    return programNameCache.get(idStr)!;
  }
  
  // Check known programs
  if (KNOWN_PROGRAMS[idStr]) {
    programNameCache.set(idStr, KNOWN_PROGRAMS[idStr]);
    return KNOWN_PROGRAMS[idStr];
  }
  
  // User-defined program mappings (could be loaded from a config file)
  const userDefinedName = loadUserProgramMappings()[idStr];
  if (userDefinedName) {
    programNameCache.set(idStr, userDefinedName);
    return userDefinedName;
  }
  
  // Return abbreviated format if no name is found
  const abbreviated = `${idStr.slice(0, 4)}...${idStr.slice(-4)}`;
  programNameCache.set(idStr, abbreviated);
  return abbreviated;
}

/**
 * Get a label for an account
 * @param pubkey The account public key
 * @param accountInfo The account info
 * @returns A human-readable label or undefined
 */
export async function getAccountLabel(
  pubkey: PublicKey,
  accountInfo: AccountInfo<Buffer>
): Promise<string | undefined> {
  // Try to identify common account types
  const pubkeyStr = pubkey.toString();
  
  // Check if it's a program
  if (accountInfo.executable) {
    return getProgramName(pubkeyStr);
  }
  
  // Check if it's a token account (owned by Token Program)
  if (accountInfo.owner.equals(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'))) {
    // This is a simplified approach - in a real implementation, 
    // we would parse the token account data to get the mint and owner
    return 'Token Account';
  }
  
  // Check user-defined account mappings
  const userDefinedLabel = loadUserAccountMappings()[pubkeyStr];
  if (userDefinedLabel) {
    return userDefinedLabel;
  }
  
  // We could add more sophisticated logic here to identify different account types
  // For example, parse Anchor account discriminators or known data structures
  
  return undefined;
}

/**
 * Load user-defined program name mappings
 * @returns Map of program IDs to names
 */
function loadUserProgramMappings(): { [key: string]: string } {
  try {
    // Look for mappings in user's config directory
    const userConfigPath = path.join(process.env.HOME || '', '.soltrace', 'programs.json');
    if (fs.existsSync(userConfigPath)) {
      return JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Error loading user program mappings:', error);
  }
  return {};
}

/**
 * Load user-defined account mappings
 * @returns Map of account public keys to labels
 */
function loadUserAccountMappings(): { [key: string]: string } {
  try {
    // Look for mappings in user's config directory
    const userConfigPath = path.join(process.env.HOME || '', '.soltrace', 'accounts.json');
    if (fs.existsSync(userConfigPath)) {
      return JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Error loading user account mappings:', error);
  }
  return {};
}

/**
 * Get a named cluster endpoint
 * @param network Network name (mainnet, testnet, devnet, localhost)
 * @returns RPC URL
 */
export function getClusterEndpoint(network: string): string {
  switch (network.toLowerCase()) {
    case 'mainnet':
    case 'mainnet-beta':
      return 'https://api.mainnet-beta.solana.com';
    case 'testnet':
      return 'https://api.testnet.solana.com';
    case 'devnet':
      return 'https://api.devnet.solana.com';
    case 'localhost':
    case 'local':
      return 'http://localhost:8899';
    default:
      // Assume it's a custom RPC URL
      return network;
  }
} 