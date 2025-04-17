import { exec } from 'child_process';
import * as assert from 'assert';
import { describe, it, Done } from 'mocha';

// Test constants
const VALID_TX_SIGNATURE = '4Wf4nesG7qNR5fJaKDRmgJ9dt9MKZvGBhgeqYLZYYi1Vf6eT5oCRPvGZgVSHPMKmEEKaVdqfPSBGJFyyE1yTY93e';
const INVALID_TX_SIGNATURE = 'InvalidSignature123';

/**
 * Test suite for transaction debugging by signature functionality
 */
describe('Transaction Debug by Signature', function () {
  // Set longer timeout for network calls
  this.timeout(30000);

  /**
   * Test successful transaction debugging with a valid signature
   */
  it('should successfully debug a valid transaction signature', function (done: Done) {
    const cmd = `node dist/cli/index.js transaction ${VALID_TX_SIGNATURE}`;

    exec(cmd, (error, stdout, stderr) => {
      // Verify no errors occurred
      assert.strictEqual(error, null, 'Command execution error');

      // Check for expected output in the command result
      assert.ok(stdout.includes('Transaction Details'), 'Missing transaction details header');
      assert.ok(stdout.includes('Instructions:'), 'Missing instructions section');
      assert.ok(stdout.includes('Account Changes:'), 'Missing account changes section');

      done();
    });
  });

  /**
   * Test error handling with an invalid transaction signature
   */
  it('should handle invalid transaction signatures gracefully', function (done: Done) {
    const cmd = `node dist/cli/index.js transaction ${INVALID_TX_SIGNATURE}`;

    exec(cmd, (error, stdout, stderr) => {
      // Command should fail but not crash
      assert.ok(error, 'Expected error for invalid signature');
      assert.ok(stdout.includes('Error') || stderr.includes('Error'), 'Should show error message');

      done();
    });
  });

  /**
   * Test verbose output mode
   */
  it('should provide more details in verbose mode', function (done: Done) {
    const cmd = `node dist/cli/index.js transaction ${VALID_TX_SIGNATURE} --verbose`;

    exec(cmd, (error, stdout, stderr) => {
      assert.strictEqual(error, null, 'Command execution error');

      // Check for additional verbose information
      assert.ok(stdout.includes('Log Messages:'), 'Missing log messages in verbose mode');
      assert.ok(stdout.includes('Raw Data:'), 'Missing raw data in verbose mode');

      done();
    });
  });
}); 