# SolTrace: Solana Transaction Debugger and Simulator

## Table of Contents

1. [Introduction](#introduction)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [Core Components](#core-components)
5. [Web Interface](#web-interface)
6. [CLI Interface](#cli-interface)
7. [Development Guide](#development-guide)
8. [API Reference](#api-reference)
9. [Deployment](#deployment)
10. [Testing](#testing)
11. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)

## Introduction

SolTrace is a powerful debugging and simulation tool for Solana blockchain transactions. It allows developers to:

- Trace transactions using their signature
- Simulate and debug transactions before sending them
- View detailed execution logs in a human-readable format
- Analyze account state changes before and after transactions
- Work with Anchor programs with IDL integration

SolTrace consists of:
- A core simulation engine
- A CLI interface for command-line usage
- A web interface for interactive debugging

## Technology Stack

### Backend
- **Node.js**: JavaScript runtime environment
- **TypeScript**: Strongly typed superset of JavaScript
- **Express**: Web server framework for the web interface
- **@solana/web3.js**: Solana JavaScript SDK for blockchain interaction
- **@project-serum/anchor**: Library for working with Anchor programs
- **Commander**: Command-line interface framework
- **Inquirer**: Interactive command-line prompts
- **Borsh**: Binary serialization format used by Solana

### Frontend
- **Vanilla JavaScript**: No frontend frameworks, keeping it lightweight
- **HTML/CSS**: Standard web technologies for UI
- **Custom CSS**: Styling with modern design principles
- **Template elements**: For dynamic content rendering

### Build System
- **TypeScript Compiler**: Compiles TypeScript to JavaScript
- **npm**: Package management and script running

## Project Architecture

The project is organized into several key directories:

```
soltrace/
├── src/
│   ├── core/              # Core simulation engine
│   ├── utils/             # Utility functions and types
│   ├── web/               # Web interface
│   │   ├── public/        # Static web assets
│   │   ├── server.ts      # Express web server
│   ├── cli/               # CLI interface
│   │   ├── commands/      # Command implementations
│   │   ├── index.ts       # Entry point for CLI
│   ├── index.ts           # Library exports
├── dist/                  # Compiled JavaScript output
├── package.json           # Project dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

SolTrace follows a modular architecture:

1. **Core Module**: Handles transaction simulation and debugging logic
2. **Web Module**: Provides a web interface for users
3. **CLI Module**: Provides a command-line interface
4. **Utils Module**: Shared utilities and types

## Core Components

### TransactionSimulator (src/core/simulator.ts)

The heart of SolTrace is the `TransactionSimulator` class, which:

- Connects to a Solana node
- Fetches transactions by signature
- Simulates transaction execution
- Captures and analyzes logs
- Tracks account state changes

Key methods:
- `debugSignature(signature, options)`: Debug an existing transaction by signature
- `debugLocalTransaction(transaction, options)`: Debug a local transaction before sending

### Types (src/utils/types.ts)

Important data structures:

- `SimulateOptions`: Options for transaction simulation
- `DebugTransaction`: Complete result of transaction debugging
- `DebugInstruction`: Individual instruction with debug info
- `AccountState`: Snapshot of account state
- `AccountDiff`: Changes to an account from before/after execution

### Log Parser (src/utils/log-parser.ts)

Parses Solana transaction logs and organizes them by instruction.

Key functions:
- `parseTransactionLogs(logs)`: Groups logs by instruction
- `extractProgramIdFromLog(logLine)`: Extracts program ID from log
- `extractErrorFromLogs(logs)`: Extracts error information
- `isTransactionSuccessful(logs)`: Checks if transaction succeeded

### Lookup Utilities (src/utils/lookup.ts)

Provides human-readable names for programs and accounts.

Key functions:
- `getProgramName(programId)`: Converts program ID to name
- `getAccountLabel(pubkey, accountInfo)`: Gets label for account
- `getClusterEndpoint(network)`: Gets RPC URL for network

### Anchor Utilities (src/utils/anchor-utils.ts)

Helps with Anchor program integration:

- `fetchAnchorIdl(programId)`: Fetches Anchor IDL for program
- `decodeAnchorInstruction(instruction, idl, accountKeys)`: Decodes Anchor instructions
- `createLocalIdlRegistry(idlPath)`: Creates a local registry of IDLs

## Web Interface

The web interface provides a user-friendly way to debug transactions.

### Server (src/web/server.ts)

- Express server that serves static files from `public/`
- Provides API endpoints:
  - `/api/info`: Version information
  - `/api/debug/tx`: Transaction debugging endpoint

### Frontend (src/web/public/)

- **index.html**: Main UI structure
- **style.css**: Stylesheet
- **main.js**: Client-side JavaScript
- **logo.svg**: SolTrace logo

The front-end UI is organized into sections:
1. Network selector
2. Transaction input form
3. Results display with tabs for:
   - Transaction overview
   - Instructions
   - Logs
   - Account changes

Key JavaScript functions in main.js:
- `setupNetworkButtons()`: Sets up network selection
- `setupTransactionForm()`: Handles transaction submission
- `displayResult(result, signature)`: Renders debug results
- `formatLogs(logs)`: Formats transaction logs
- `formatAccountDiffs(accountDiffs)`: Formats account state changes

## CLI Interface

The CLI provides a command-line interface for developers.

### Entry Point (src/cli/index.ts)

Sets up commands:
- `tx`: Debug transaction by signature
- `program`: Debug specific program instruction
- `interactive`: Start interactive mode
- `config`: Manage configuration

### Commands

- **TransactionCommand** (src/cli/commands/transaction.ts): Handles `tx` command
- **ProgramCommand** (src/cli/commands/program.ts): Handles `program` command
- **InteractiveCommand** (src/cli/commands/interactive.ts): Interactive debugging
- **ConfigCommand** (src/cli/commands/config.ts): Configuration management

## Development Guide

### Setting Up Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/soltrace.git
   cd soltrace
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run the development server:
   ```bash
   npm run dev  # For CLI
   npm run web  # For web interface
   ```

### Project Configuration Files

- **tsconfig.json**: TypeScript compiler options
- **package.json**: Project metadata and dependencies

### Making Changes

1. **Adding a new command**:
   - Create a new command class in `src/cli/commands/`
   - Register in `src/cli/index.ts`

2. **Enhancing the simulator**:
   - Modify `src/core/simulator.ts`

3. **Adding UI features**:
   - Update files in `src/web/public/`

### Building and Testing

- Build: `npm run build`
- Run CLI: `npm run start`
- Run web: `npm run web`

## API Reference

### TransactionSimulator

```typescript
class TransactionSimulator {
  constructor(rpcUrl: string, anchorIdlMap?: Map<string, any>);
  
  // Debug transaction by signature
  async debugSignature(
    signature: TransactionSignature,
    options?: SimulateOptions
  ): Promise<DebugTransaction>;
  
  // Debug local transaction
  async debugLocalTransaction(
    transaction: Transaction | VersionedTransaction,
    options?: SimulateOptions
  ): Promise<DebugTransaction>;
}
```

### SimulateOptions

```typescript
interface SimulateOptions {
  commitment?: string;
  signers?: any[];
  skipPreflight?: boolean;
  preflightCommitment?: string;
  encodedTransaction?: string;
  replaceRecentBlockhash?: boolean;
  anchorIdlMap?: Map<string, any>;
}
```

### DebugTransaction

```typescript
interface DebugTransaction {
  signature?: TransactionSignature;
  parsedTransaction?: ParsedTransaction;
  success: boolean;
  instructions: DebugInstruction[];
  error?: string;
  timestamp?: number;
  slot?: number;
  blockTime?: number;
}
```

## Deployment

### As a Library

SolTrace can be used as a library in other projects:

```typescript
import { TransactionSimulator } from 'soltrace';

const simulator = new TransactionSimulator('https://api.devnet.solana.com');
const result = await simulator.debugSignature(signature);
```

### As a CLI Tool

Install globally:
```bash
npm install -g soltrace
```

Then use:
```bash
soltrace tx <signature>
```

### As a Web Service

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the web server:
   ```bash
   node dist/web/server.js
   ```

3. Access at http://localhost:3000

## Testing

*Note: Currently, SolTrace doesn't have automated tests. This is an area for improvement.*

To manually test:

1. Find a transaction signature from Solana Explorer
2. Run `npm run start tx <signature>`
3. Verify the output matches what's expected

## Common Issues and Troubleshooting

### RPC Connection Issues

**Symptom**: "Error: Failed to fetch" or timeout errors  
**Solution**: 
- Try changing RPC endpoints
- Check your internet connection
- Use a custom RPC endpoint if rate-limited

### Transaction Not Found

**Symptom**: "Transaction X not found"  
**Solution**:
- Verify signature is correct
- Ensure you're on the correct network (mainnet, testnet, etc.)
- For recent transactions, wait for finalization

### Program IDL Not Found

**Symptom**: Anchor instruction data shows as raw hex  
**Solution**:
- Add IDL using `soltrace config --idl <path>`
- Check if program is Anchor-based
- Ensure IDL matches program version

### Web Interface Errors

**Symptom**: "An error occurred" after submitting a transaction  
**Solution**:
- Check browser console for errors
- Verify signature format
- Try CLI version to get more detailed error information
