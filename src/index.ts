/**
 * SolTrace - A powerful Solana transaction debugger and simulator
 */

// Core functionality
export { TransactionSimulator } from './core/simulator';

// Types
export * from './utils/types';

// Utilities
export * from './utils/log-parser';
export * from './utils/lookup';
export * from './utils/anchor-utils';

/**
 * SolTrace version
 */
export const VERSION = '0.1.0';

/**
 * Library information
 */
export const info = {
  name: 'soltrace',
  version: VERSION,
  description: 'A powerful Solana transaction debugger and simulator',
  repository: 'https://github.com/yourusername/soltrace',
}; 