/**
 * Utility to parse Solana transaction logs
 */

/**
 * Parse transaction logs and group them by instruction
 * @param logs Array of log lines from a transaction simulation
 * @returns Logs grouped by instruction index
 */
export function parseTransactionLogs(logs: string[]): { [key: number]: string[] } {
  const instructionLogs: { [key: number]: string[] } = {};
  let currentInstruction = 0;
  let inInstruction = false;

  logs.forEach(log => {
    // Check for instruction start
    if (log.startsWith('Program ') && log.includes(' invoke [')) {
      const matches = log.match(/invoke \[(\d+)\]/);
      if (matches && matches[1]) {
        // For root level instructions (depth 1), increment instruction counter
        if (matches[1] === '1') {
          inInstruction = true;
          currentInstruction++;
          instructionLogs[currentInstruction] = instructionLogs[currentInstruction] || [];
          instructionLogs[currentInstruction].push(log);
        } else if (inInstruction) {
          // Inner instruction (CPI), add to current instruction logs
          instructionLogs[currentInstruction].push(log);
        }
      }
    } else if (inInstruction) {
      // Add log to current instruction
      instructionLogs[currentInstruction].push(log);
    }
  });

  return instructionLogs;
}

/**
 * Extract the program ID from a log line
 * @param logLine Program invoke log line
 * @returns Program ID or undefined
 */
export function extractProgramIdFromLog(logLine: string): string | undefined {
  // Format: "Program {programId} invoke [depth]"
  const match = logLine.match(/Program (\w+) invoke/);
  return match ? match[1] : undefined;
}

/**
 * Extract error information from logs
 * @param logs Array of log lines
 * @returns Error message or undefined
 */
export function extractErrorFromLogs(logs: string[]): string | undefined {
  for (const log of logs) {
    if (log.includes('Error:') || log.includes('failed:')) {
      // Clean up the error message
      return log.replace('Program log: ', '').trim();
    }
  }
  return undefined;
}

/**
 * Check if logs indicate a successful transaction
 * @param logs Array of log lines
 * @returns True if the transaction was successful
 */
export function isTransactionSuccessful(logs: string[]): boolean {
  // Check the last few logs for a successful program completion
  const lastFewLogs = logs.slice(-5);
  for (const log of lastFewLogs) {
    if (log.includes('failed') || log.includes('Error:')) {
      return false;
    }
  }
  
  // Check for successful program completion
  return logs.some(log => log.includes('Program log: Success'));
}

/**
 * Extract compute units used from logs
 * @param logs Array of log lines
 * @returns Compute units used or undefined
 */
export function extractComputeUnits(logs: string[]): number | undefined {
  for (const log of logs) {
    const match = log.match(/consumed (\d+) of \d+ compute units/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  return undefined;
}

/**
 * Extracts account addresses from logs
 * @param logs Array of log lines
 * @returns Array of account addresses
 */
export function extractAccountsFromLogs(logs: string[]): string[] {
  const accounts = new Set<string>();
  
  logs.forEach(log => {
    // Look for account mentions in logs
    // Example: "Program log: Create account: 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
    const matches = log.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/g);
    if (matches) {
      matches.forEach(match => {
        // Simple validation to avoid false positives
        if (match.length >= 32 && match.length <= 44) {
          accounts.add(match);
        }
      });
    }
  });
  
  return Array.from(accounts);
} 