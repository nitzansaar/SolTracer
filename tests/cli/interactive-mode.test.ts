import { spawn } from 'child_process';
import * as assert from 'assert';
import { describe, it } from 'mocha';

/**
 * Test suite for interactive mode functionality
 * Note: Since interactive mode requires user input, we can only test
 * the startup behavior and basic responses, not full interactive workflows.
 */
describe('Interactive Mode', function() {
  // Set longer timeout for process startup
  this.timeout(10000);
  
  /**
   * Test interactive mode startup
   */
  it('should start in interactive mode successfully', (done: Mocha.Done) => {
    // Spawn the process to capture stdout in real time
    const process = spawn('node', ['dist/cli/index.js'], { shell: true });
    
    let output = '';
    let errorOutput = '';
    
    // Collect output chunks
    process.stdout.on('data', (data) => {
      output += data.toString();
      
      // Once we see the menu prompt, we know interactive mode started successfully
      if (output.includes('What would you like to do?') && 
          output.includes('Debug a transaction by signature')) {
        // Success, kill the process and finish the test
        process.kill();
        done();
      }
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Handle process exit
    process.on('close', (code) => {
      if (code !== 0 && code !== null) {  // null when killed by us
        done(new Error(`Process exited with code ${code}: ${errorOutput}`));
      }
    });
    
    // Set a timeout in case the prompt never appears
    setTimeout(() => {
      process.kill();
      done(new Error('Timed out waiting for interactive prompt'));
    }, 8000);
  });
  
  /**
   * Test connecting to different network
   */
  it('should show connected network status', (done: Mocha.Done) => {
    // Spawn the process to capture stdout in real time
    const process = spawn('node', ['dist/cli/index.js'], { shell: true });
    
    let output = '';
    
    // Collect output chunks
    process.stdout.on('data', (data) => {
      output += data.toString();
      
      // Once we see the connection status, we know it's working
      if (output.includes('Connected to:')) {
        // Success, kill the process and finish the test
        process.kill();
        done();
      }
    });
    
    // Set a timeout in case the status never appears
    setTimeout(() => {
      process.kill();
      done(new Error('Timed out waiting for connection status'));
    }, 8000);
  });
  
  /**
   * Test CLI banner display
   */
  it('should display the SolTrace banner', (done: Mocha.Done) => {
    // Spawn the process to capture stdout in real time
    const process = spawn('node', ['dist/cli/index.js'], { shell: true });
    
    let output = '';
    
    // Collect output chunks
    process.stdout.on('data', (data) => {
      output += data.toString();
      
      // Check for the banner content
      if (output.includes('SolTrace CLI') && 
          output.includes('Solana transaction debugger')) {
        // Success, kill the process and finish the test
        process.kill();
        done();
      }
    });
    
    // Set a timeout in case the banner never appears
    setTimeout(() => {
      process.kill();
      done(new Error('Timed out waiting for SolTrace banner'));
    }, 8000);
  });
  
  /**
   * Test menu options display
   */
  it('should display all expected menu options', (done: Mocha.Done) => {
    // Spawn the process to capture stdout in real time
    const process = spawn('node', ['dist/cli/index.js'], { shell: true });
    
    let output = '';
    
    // Collect output chunks
    process.stdout.on('data', (data) => {
      output += data.toString();
      
      // Check for all menu options
      const hasAllOptions = 
        output.includes('Debug a transaction by signature') &&
        output.includes('Debug a program instruction') &&
        output.includes('Fetch and cache Anchor IDL') &&
        output.includes('Change RPC endpoint') &&
        output.includes('Exit');
      
      if (hasAllOptions) {
        // Success, kill the process and finish the test
        process.kill();
        done();
      }
    });
    
    // Set a timeout in case the menu never fully appears
    setTimeout(() => {
      process.kill();
      done(new Error('Timed out waiting for complete menu'));
    }, 8000);
  });
}); 