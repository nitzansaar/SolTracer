import { exec } from 'child_process';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { describe, it, before, after } from 'mocha';

// Test constants
const CONFIG_PATH = path.join(os.homedir(), '.soltrace', 'config.json');
const DEFAULT_ENDPOINT = 'https://api.devnet.solana.com';
const MAINNET_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const CUSTOM_ENDPOINT = 'https://my-custom-rpc.example.com';

/**
 * Test suite for RPC endpoint configuration functionality
 */
describe('RPC Endpoint Configuration', function() {
  // Set longer timeout for file operations
  this.timeout(10000);
  
  /**
   * Backup the original config and restore it after tests
   */
  let originalConfig: string | undefined;
  
  before((done: Mocha.Done) => {
    // Make sure config directory exists
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Backup original config if it exists
    if (fs.existsSync(CONFIG_PATH)) {
      originalConfig = fs.readFileSync(CONFIG_PATH, 'utf8');
    }
    
    done();
  });
  
  after((done: Mocha.Done) => {
    // Restore original config if it existed
    if (originalConfig) {
      fs.writeFileSync(CONFIG_PATH, originalConfig);
    } else if (fs.existsSync(CONFIG_PATH)) {
      // If no original but one exists now, delete it
      fs.unlinkSync(CONFIG_PATH);
    }
    
    done();
  });
  
  /**
   * Test listing available RPC endpoints
   */
  it('should list available RPC endpoints', (done: Mocha.Done) => {
    const cmd = `node dist/cli/index.js config --list-endpoints`;
    
    exec(cmd, (error, stdout, stderr) => {
      // Verify no errors occurred
      assert.strictEqual(error, null, 'Command execution error');
      
      // Check for expected output
      assert.ok(stdout.includes('Available Endpoints'), 'Missing endpoints header');
      assert.ok(stdout.includes('devnet'), 'Missing devnet endpoint');
      assert.ok(stdout.includes('mainnet'), 'Missing mainnet endpoint');
      
      done();
    });
  });
  
  /**
   * Test setting RPC endpoint to a known preset
   */
  it('should change RPC endpoint to mainnet', (done: Mocha.Done) => {
    const cmd = `node dist/cli/index.js config --endpoint mainnet`;
    
    exec(cmd, (error, stdout, stderr) => {
      assert.strictEqual(error, null, 'Command execution error');
      assert.ok(stdout.includes('RPC endpoint changed to'), 'Missing success message');
      assert.ok(stdout.includes('mainnet'), 'Should mention mainnet in output');
      
      // Verify config file was updated
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      assert.strictEqual(config.endpoint, MAINNET_ENDPOINT, 'Config file not updated correctly');
      
      done();
    });
  });
  
  /**
   * Test setting RPC endpoint back to devnet
   */
  it('should change RPC endpoint to devnet', (done: Mocha.Done) => {
    const cmd = `node dist/cli/index.js config --endpoint devnet`;
    
    exec(cmd, (error, stdout, stderr) => {
      assert.strictEqual(error, null, 'Command execution error');
      assert.ok(stdout.includes('RPC endpoint changed to'), 'Missing success message');
      assert.ok(stdout.includes('devnet'), 'Should mention devnet in output');
      
      // Verify config file was updated
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      assert.strictEqual(config.endpoint, DEFAULT_ENDPOINT, 'Config file not updated correctly');
      
      done();
    });
  });
  
  /**
   * Test setting RPC endpoint to a custom URL
   */
  it('should set a custom RPC endpoint URL', (done: Mocha.Done) => {
    const cmd = `node dist/cli/index.js config --endpoint ${CUSTOM_ENDPOINT}`;
    
    exec(cmd, (error, stdout, stderr) => {
      assert.strictEqual(error, null, 'Command execution error');
      assert.ok(stdout.includes('RPC endpoint changed to'), 'Missing success message');
      assert.ok(stdout.includes(CUSTOM_ENDPOINT), 'Should mention custom endpoint in output');
      
      // Verify config file was updated
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      assert.strictEqual(config.endpoint, CUSTOM_ENDPOINT, 'Config file not updated correctly');
      
      done();
    });
  });
  
  /**
   * Test handling invalid endpoint URLs
   */
  it('should handle invalid endpoint URLs gracefully', (done: Mocha.Done) => {
    const cmd = `node dist/cli/index.js config --endpoint invalid-url`;
    
    exec(cmd, (error, stdout, stderr) => {
      // Should have an error but not crash
      assert.ok(error || stderr, 'Expected error for invalid URL');
      assert.ok(stdout.includes('Error') || stderr.includes('Error'), 'Should show error message');
      
      done();
    });
  });
  
  /**
   * Test getting current configuration
   */
  it('should show current configuration', (done: Mocha.Done) => {
    const cmd = `node dist/cli/index.js config`;
    
    exec(cmd, (error, stdout, stderr) => {
      assert.strictEqual(error, null, 'Command execution error');
      assert.ok(stdout.includes('Current Configuration'), 'Missing configuration header');
      assert.ok(stdout.includes('RPC Endpoint:'), 'Missing RPC endpoint in output');
      
      done();
    });
  });
}); 