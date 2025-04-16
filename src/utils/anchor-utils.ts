import { PublicKey } from '@solana/web3.js';
import { IdlInstruction, IdlLookupResult } from './types';
import * as borsh from 'borsh';
import * as fs from 'fs';
import * as path from 'path';

// Anchor discriminator is the first 8 bytes of the sha256 hash of the instruction name
const DISCRIMINATOR_SIZE = 8;

/**
 * Fetches an Anchor IDL for a given program ID
 * @param programId The program ID
 * @param idlDir Optional directory to look for local IDL files
 * @returns The IDL and program ID if found
 */
export async function fetchAnchorIdl(
  programId: PublicKey | string,
  idlDir?: string
): Promise<IdlLookupResult | null> {
  const id = typeof programId === 'string' ? new PublicKey(programId) : programId;

  // First try to load from local directory if provided
  if (idlDir) {
    try {
      const idlPath = path.join(idlDir, `${id.toString()}.json`);
      if (fs.existsSync(idlPath)) {
        const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
        return { idl, programId: id };
      }
    } catch (error) {
      console.warn(`Error loading local IDL for ${id}:`, error);
    }
  }

  // Try to load from user's cache directory
  try {
    const cacheDir = path.join(process.env.HOME || '', '.soltrace', 'idl');
    const idlPath = path.join(cacheDir, `${id.toString()}.json`);
    if (fs.existsSync(idlPath)) {
      const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
      return { idl, programId: id };
    }
  } catch (error) {
    console.warn(`Error loading cached IDL for ${id}:`, error);
  }

  // If all else fails, try fetching from Anchor API (not implemented in this example)
  // In a real implementation, we would fetch from Anchor's IDL registry
  // or other sources like Solana program registry
  
  return null;
}

/**
 * Decodes an Anchor instruction using the program's IDL
 * @param instruction The instruction to decode
 * @param idl The program's IDL
 * @param accountKeys The transaction's account keys
 * @returns Decoded instruction information
 */
export function decodeAnchorInstruction(
  instruction: any,
  idl: any,
  accountKeys: PublicKey[]
): { name: string; ix: IdlInstruction; args: any } | null {
  try {
    // Get instruction data
    const data = 'data' in instruction 
      ? instruction.data 
      : Buffer.from(instruction.data);
    
    // Extract discriminator (first 8 bytes)
    const discriminator = data.slice(0, DISCRIMINATOR_SIZE);
    
    // Find matching instruction in IDL
    const matchingIx = findInstructionByDiscriminator(idl, discriminator);
    if (!matchingIx) {
      return null;
    }
    
    // Get account list from instruction
    const accountIndices = 'accounts' in instruction 
      ? instruction.accounts 
      : instruction.keys.map((k: any) => k.pubkey);
      
    const accounts = accountIndices.map((idx: any) => {
      // Handle different instruction formats
      if (typeof idx === 'number') {
        return accountKeys[idx];
      } else if (idx instanceof PublicKey) {
        return idx;
      } else if ('pubkey' in idx) {
        return idx.pubkey;
      }
      return null;
    }).filter((a: any) => a !== null);
    
    // Decode instruction arguments
    const argsData = data.slice(DISCRIMINATOR_SIZE);
    const args = decodeAnchorArgs(argsData, matchingIx);
    
    return {
      name: matchingIx.name,
      ix: matchingIx,
      args
    };
  } catch (error) {
    console.warn('Error decoding Anchor instruction:', error);
    return null;
  }
}

/**
 * Finds an Anchor instruction by its discriminator
 * @param idl The program's IDL
 * @param discriminator The instruction discriminator
 * @returns The matching instruction or null
 */
function findInstructionByDiscriminator(idl: any, discriminator: Buffer): IdlInstruction | null {
  if (!idl.instructions) {
    return null;
  }
  
  for (const ix of idl.instructions) {
    const ixDiscriminator = deriveInstructionDiscriminator(ix.name);
    if (Buffer.compare(discriminator, ixDiscriminator) === 0) {
      return ix;
    }
  }
  
  return null;
}

/**
 * Derives an Anchor instruction discriminator from its name
 * @param ixName The instruction name
 * @returns The discriminator
 */
function deriveInstructionDiscriminator(ixName: string): Buffer {
  // In a real implementation, this would be a proper sha256 hash truncated to 8 bytes
  // For simplicity, we're using a placeholder implementation
  // In Anchor, the actual code is:
  // const discriminator = Buffer.from(sha256.digest(`instruction:${ixName}`)).slice(0, 8);
  
  // Placeholder hash for demo purposes only - NOT FOR PRODUCTION USE
  const nameBytes = Buffer.from(ixName, 'utf8');
  const placeholder = Buffer.alloc(8);
  
  // Very simple placeholder hash function
  for (let i = 0; i < nameBytes.length && i < 8; i++) {
    placeholder[i] = nameBytes[i];
  }
  
  return placeholder;
}

/**
 * Decodes Anchor instruction arguments
 * @param data The argument data
 * @param ix The instruction definition
 * @returns Decoded arguments
 */
function decodeAnchorArgs(data: Buffer, ix: IdlInstruction): any {
  // In a real implementation, this would use Borsh deserialization based on the IDL types
  // This is a simplified placeholder
  
  // If there are no args, return empty object
  if (!ix.args || ix.args.length === 0) {
    return {};
  }
  
  // Very simplified approach - in a real implementation we would define proper Borsh schema
  // based on the IDL and use borsh.deserialize()
  return { rawData: data.toString('hex') };
}

/**
 * Creates a local Anchor IDL registry
 * @param idlPath Path to directory containing IDL files
 */
export function createLocalIdlRegistry(idlPath: string): void {
  try {
    // Create .soltrace/idl directory if it doesn't exist
    const cacheDir = path.join(process.env.HOME || '', '.soltrace', 'idl');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    // Find all IDL files in the provided directory
    const files = fs.readdirSync(idlPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const idl = JSON.parse(fs.readFileSync(path.join(idlPath, file), 'utf8'));
          if (idl.metadata && idl.metadata.address) {
            // Copy file to cache with program ID as filename
            fs.copyFileSync(
              path.join(idlPath, file),
              path.join(cacheDir, `${idl.metadata.address}.json`)
            );
          }
        } catch (error: any) {
          console.warn(`Error processing IDL file ${file}:`, error);
        }
      }
    }
  } catch (error: any) {
    console.error('Error creating local IDL registry:', error);
  }
} 