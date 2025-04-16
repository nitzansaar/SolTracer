# SolTrace

A powerful Solana transaction debugger and simulator for Solana and Anchor programs.

## Features

- **Transaction Replay**: Simulate any Solana transaction in a controlled environment
- **Step-by-Step Debugging**: Walk through each instruction execution
- **Detailed Logging**: Human-readable logs with instruction decoding
- **Account State Analysis**: View and diff account states before and after instructions
- **Anchor-Aware**: Special handling for Anchor programs with IDL integration
- **Intuitive Interface**: CLI and web interfaces for different debugging needs

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
npm run start
```

## License

MIT
