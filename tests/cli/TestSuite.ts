/**
 * Test suite base class that provides proper typing for Mocha test context
 */
export class TestSuite {
  /**
   * Set timeout for the entire test suite
   */
  protected timeout(ms: number): void {
    // @ts-ignore - This is a workaround for typing Mocha's this context
    this.timeout(ms);
  }
} 