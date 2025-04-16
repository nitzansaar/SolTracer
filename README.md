# SolTrace

A powerful Solana transaction debugger and simulator for Solana and Anchor programs.

## Features

- **Transaction Replay**: Simulate any Solana transaction in a controlled environment
- **Step-by-Step Debugging**: Walk through each instruction execution
- **Detailed Logging**: Human-readable logs with instruction decoding
- **Account State Analysis**: View and diff account states before and after instructions
- **Anchor-Aware**: Special handling for Anchor programs with IDL integration
- **Intuitive Interface**: CLI and web interfaces for different debugging needs

## Why SolTrace?

SolTrace addresses critical challenges Solana developers face when building and debugging blockchain applications:

### Use Cases

- **Transaction Debugging**: When transactions fail on-chain, SolTrace helps identify exactly what went wrong and why.
- **Development Testing**: Test and simulate complex transactions before deploying to mainnet.
- **Smart Contract Auditing**: Analyze program behavior by reviewing how state changes across instructions.
- **Education and Learning**: Understand how Solana transactions work by seeing detailed execution flows.
- **Troubleshooting Production Issues**: Quickly diagnose issues in deployed applications by examining transaction details.
- **Forensic Analysis**: Investigate suspicious transactions by analyzing their execution step-by-step.

### Why It's Valuable

- **Time Savings**: Quickly identify bugs that would otherwise take hours of manual investigation.
- **Reduced Development Costs**: Catch issues before they reach production, avoiding costly fixes.
- **Improved Security**: Better understand program interactions to identify potential vulnerabilities.
- **Enhanced Visibility**: See exactly what happens during transaction execution, including account state changes.
- **Better Developer Experience**: Human-readable output makes complex transaction data accessible.
- **Cross-Program Insight**: Understand how different programs interact in complex transactions.

SolTrace fills a crucial need in the Solana ecosystem by providing developers with deep visibility into transaction execution, making development and debugging significantly more efficient.

## Installation

```bash
npm install -g soltrace
```

## Usage

### CLI

```bash
# Debug using a transaction signature
soltrace tx <signature>

# Debug a local transaction with a specific program
soltrace program <program-id> --ix <base64-encoded-instruction>

# Run in interactive mode
soltrace interactive
```

### Web Interface

```bash
soltrace web
# Then open your browser at http://localhost:3000
```

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/soltrace.git
cd soltrace

# Install dependencies
npm install

# Build
npm run build

# Run
#CLI
npm run dev -- interactive
#Web
npm run web
```

## License

MIT
