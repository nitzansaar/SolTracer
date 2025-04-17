import { exec } from 'child_process';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { describe, it, before, after, Done } from 'mocha';

// Test constants
const PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'; // Metaplex Token Metadata Program
const IDL_CACHE_DIR = path.join(os.homedir(), '.soltrace', 'idl');

/**
 * Test suite for fetching and caching Anchor IDL functionality
 */
describe('Anchor IDL Cache', function () {
  // Set longer timeout for network operations
  this.timeout(60000);

  /**
   * Ensure the IDL cache directory exists before tests
   */
  before(function (done: Done) {
    // Create the cache directory if it doesn't exist
    if (!fs.existsSync(IDL_CACHE_DIR)) {
      fs.mkdirSync(IDL_CACHE_DIR, { recursive: true });
    }
    done();
  });

  /**
   * Remove test IDL files after tests
   */
  after(function (done: Done) {
    // Delete the test program IDL if it exists
    const idlPath = path.join(IDL_CACHE_DIR, `${PROGRAM_ID}.json`);
    if (fs.existsSync(idlPath)) {
      fs.unlinkSync(idlPath);
    }
    done();
  });

  /**
   * Test fetching and caching an Anchor IDL
   */
  it('should fetch and cache a valid program IDL', function (done: Done) {
    const cmd = `node dist/cli/index.js idl ${PROGRAM_ID}`;

    exec(cmd, (error, stdout, stderr) => {
      // Verify no errors occurred
      assert.strictEqual(error, null, 'Command execution error');

      // Check for expected output
      assert.ok(stdout.includes('IDL fetched') || stdout.includes('IDL cached'), 'Missing success message');

      // Verify the IDL file was created
      const idlPath = path.join(IDL_CACHE_DIR, `${PROGRAM_ID}.json`);
      assert.ok(fs.existsSync(idlPath), 'IDL file was not created');

      // Verify the IDL file contains valid JSON
      const idlContent = fs.readFileSync(idlPath, 'utf8');
      let idlJson;
      try {
        idlJson = JSON.parse(idlContent);
        assert.ok(idlJson, 'IDL content is not valid JSON');
      } catch (e) {
        assert.fail('IDL file does not contain valid JSON');
      }

      done();
    });
  });

  /**
   * Test handling invalid program IDs
   */
  it('should handle invalid program IDs gracefully', function (done: Done) {
    const cmd = `node dist/cli/index.js idl InvalidProgramId`;

    exec(cmd, (error, stdout, stderr) => {
      // Should have an error but not crash
      assert.ok(error || stderr, 'Expected error for invalid program ID');
      assert.ok(stdout.includes('Error') || stderr.includes('Error'), 'Should show error message');

      done();
    });
  });

  /**
   * Test force refreshing an IDL
   */
  it('should force refresh an IDL with the --force flag', function (done: Done) {
    // First ensure the IDL exists
    const idlPath = path.join(IDL_CACHE_DIR, `${PROGRAM_ID}.json`);
    if (!fs.existsSync(idlPath)) {
      // Create a dummy IDL file
      fs.writeFileSync(idlPath, JSON.stringify({ name: 'test', version: '1.0.0' }));
    }

    // Get the last modified time
    const statsBefore = fs.statSync(idlPath);
    const mtimeBefore = statsBefore.mtime;

    // Wait a second to ensure timestamp difference
    setTimeout(() => {
      const cmd = `node dist/cli/index.js idl ${PROGRAM_ID} --force`;

      exec(cmd, (error, stdout, stderr) => {
        assert.strictEqual(error, null, 'Command execution error');
        assert.ok(stdout.includes('IDL fetched'), 'Should indicate IDL was refreshed');

        // Verify the file was updated
        const statsAfter = fs.statSync(idlPath);
        const mtimeAfter = statsAfter.mtime;

        assert.ok(mtimeAfter > mtimeBefore, 'IDL file was not updated');

        done();
      });
    }, 1000);
  });

  /**
   * Test listing cached IDLs
   */
  it('should list all cached IDLs', function (done: Done) {
    const cmd = `node dist/cli/index.js idl --list`;

    exec(cmd, (error, stdout, stderr) => {
      assert.strictEqual(error, null, 'Command execution error');
      assert.ok(stdout.includes('Cached IDLs'), 'Missing cached IDLs header');

      // Should list our test program ID
      assert.ok(stdout.includes(PROGRAM_ID), 'Test program not listed in cache');

      done();
    });
  });
}); 