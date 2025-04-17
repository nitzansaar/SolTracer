import { exec } from 'child_process';
import * as assert from 'assert';
import { PublicKey } from '@solana/web3.js';
import { describe, it } from 'mocha';

// Test constants
const PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'; // SPL Token Program
const TOKEN_MINT = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
const OWNER_ADDRESS = 'DdapqoGJLM1KdUBiHikDSi23bS9KsAHaHtKRFbvQWu8j';

/**
 * Test suite for program instruction debugging functionality
 */
describe('Program Instruction Debug', function() {
  // Set longer timeout for network calls
  this.timeout(30000);
  
  /**
   * Test mint token instruction simulation
   */
  it('should simulate a token mint instruction', (done: Mocha.Done) => {
    // Command to simulate creating a mint instruction for SPL token program
    const cmd = `node dist/cli/index.js program --programId ${PROGRAM_ID} --instruction MintTo --args '{"mint":"${TOKEN_MINT}","authority":"${OWNER_ADDRESS}","amount":1000000000}'`;
    
    exec(cmd, (error, stdout, stderr) => {
      // We're just simulating, so no error should occur
      assert.strictEqual(error, null, 'Command execution error');
      
      // Check for expected outputs
      assert.ok(stdout.includes('Instruction Simulation Results'), 'Missing simulation results header');
      assert.ok(stdout.includes('MintTo'), 'Should include instruction name');
      
      done();
    });
  });
  
  /**
   * Test for graceful handling of invalid program ID
   */
  it('should handle invalid program ID gracefully', (done: Mocha.Done) => {
    const cmd = `node dist/cli/index.js program --programId InvalidProgramId --instruction Transfer`;
    
    exec(cmd, (error, stdout, stderr) => {
      // Should have an error but not crash
      assert.ok(error || stderr, 'Expected error for invalid program ID');
      assert.ok(stdout.includes('Error') || stderr.includes('Error'), 'Should show error message');
      
      done();
    });
  });
  
  /**
   * Test for JSON instruction data input
   */
  it('should accept instruction data in JSON format', (done: Mocha.Done) => {
    // JSON data for a token transfer instruction
    const instructionData = {
      source: 'ATQJxEakPoSzhkCaKTaJxP3XN8xzRDnx3zxYmM4qtz9q',
      destination: 'BrHMKp4sErLvcMUSgBKTceCzX9q82SRNJzZbwGyD7TtQ',
      amount: 50000000,
      authority: OWNER_ADDRESS
    };
    
    const cmd = `node dist/cli/index.js program --programId ${PROGRAM_ID} --instruction Transfer --args '${JSON.stringify(instructionData)}'`;
    
    exec(cmd, (error, stdout, stderr) => {
      assert.strictEqual(error, null, 'Command execution error');
      assert.ok(stdout.includes('Transfer'), 'Missing instruction name');
      assert.ok(stdout.includes('Simulation Complete'), 'Missing simulation completion message');
      
      done();
    });
  });
  
  /**
   * Test with verbose output flag
   */
  it('should provide detailed logs with verbose flag', (done: Mocha.Done) => {
    const cmd = `node dist/cli/index.js program --programId ${PROGRAM_ID} --instruction Transfer --args '{"source":"ATQJxEakPoSzhkCaKTaJxP3XN8xzRDnx3zxYmM4qtz9q","destination":"BrHMKp4sErLvcMUSgBKTceCzX9q82SRNJzZbwGyD7TtQ","amount":1000,"authority":"${OWNER_ADDRESS}"}' --verbose`;
    
    exec(cmd, (error, stdout, stderr) => {
      assert.strictEqual(error, null, 'Command execution error');
      
      // Check for verbose output details
      assert.ok(stdout.includes('Program Logs:'), 'Missing program logs in verbose mode');
      assert.ok(stdout.includes('Compute Units:'), 'Missing compute units in verbose mode');
      
      done();
    });
  });
}); 