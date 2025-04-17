# SolTrace Tests

This directory contains tests for SolTrace CLI functionality.

## CLI Tests

The `cli` directory contains tests for each of the CLI's main features:

- `transaction-debug.test.ts` - Tests for debugging transactions by signature
- `program-debug.test.ts` - Tests for debugging program instructions
- `anchor-idl.test.ts` - Tests for fetching and caching Anchor IDLs
- `rpc-endpoint.test.ts` - Tests for configuring RPC endpoints
- `interactive-mode.test.ts` - Tests for interactive CLI mode

## Running Tests

From the root directory, you can run the tests with:

```bash
# Install test dependencies
cd tests
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:transaction  # Run just transaction debugging tests
npm run test:program      # Run just program instruction tests
npm run test:idl          # Run just Anchor IDL tests
npm run test:rpc          # Run just RPC endpoint tests
npm run test:interactive  # Run just interactive mode tests
```

## Test Prerequisites

1. Ensure SolTrace is built: `npm run build` in the root directory
2. Make sure you have a connection to a Solana RPC endpoint 
3. Some tests may require a live Solana devnet or testnet connection

## Mocking

The tests use actual CLI commands and verify their outputs and side effects. This is an integration testing approach rather than unit testing.

For future improvements, consider adding mocked RPC responses to make tests more deterministic and faster.

## Adding New Tests

When adding new CLI features, please add corresponding test files following the pattern of the existing ones:

1. Create a new `feature-name.test.ts` file
2. Add appropriate test cases checking both success and error cases
3. Update the `package.json` scripts to include the new test file 