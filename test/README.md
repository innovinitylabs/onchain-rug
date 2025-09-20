# Local Scripty Testing Guide

This directory contains comprehensive local tests for your OnchainRugs Scripty integration.

## Prerequisites

Before running tests, ensure you have:

1. **JavaScript Libraries**: Your `data/rug-p5.js.b64` and `data/rug-algo.js.b64` files
2. **Foundry**: Latest version installed
3. **Dependencies**: Run `forge install` to install all dependencies

## Quick Start

### 1. Start Local Anvil Node
```bash
anvil
```

### 2. Run All Tests
```bash
forge test --match-contract LocalScriptyTest -v
```

### 3. Run Specific Tests
```bash
# Test infrastructure deployment only
forge test --match-test testInfrastructureDeployment -v

# Test HTML generation only
forge test --match-test testHTMLGeneration -v

# Test OnchainRugs NFT integration
forge test --match-test testOnchainRugsIntegration -v
```

### 4. Run with Gas Reporting
```bash
forge test --match-contract LocalScriptyTest --gas-report -v
```

## What the Tests Do

### Infrastructure Deployment
- [x] **CREATE2 Deployer**: For deterministic contract deployments
- [x] **EthFS FileStore**: Content-addressable file storage
- [x] **ETHFSV2FileStorage**: Scripty-compatible storage interface
- [x] **ScriptyStorageV2**: Content management and chunking
- [x] **ScriptyBuilderV2**: HTML generation from requests
- [x] **OnchainRugsHTMLGenerator**: Your project-specific generator
- [x] **OnchainRugs NFT**: Your main NFT contract

### Library Upload
- [x] **p5.js Library**: Uploads `rug-p5.js.b64` from your `data/` folder
- [x] **Algorithm Library**: Uploads `rug-algo.js.b64` from your `data/` folder
- [x] **Chunked Upload**: Handles large files by splitting into 20KB chunks
- [x] **Content Freezing**: Locks content after upload

### Testing Scenarios
- [x] **HTML Generation**: Tests your HTML generator with real rug data
- [x] **Library Retrieval**: Verifies libraries can be retrieved from storage
- [x] **ScriptyBuilder Direct**: Tests ScriptyBuilderV2 directly
- [x] **OnchainRugs Integration**: Tests full NFT minting and tokenURI generation
- [x] **Metadata Functions**: Tests project metadata and library requirements

## Expected Output

When tests pass, you'll see output like:

```
Setting up complete local Scripty infrastructure...
1. Deploying CREATE2 Deployer...
CREATE2 Deployer deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
2. Deploying EthFS FileStore...
FileStore deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
3. Deploying ETHFSV2FileStorage...
ETHFSV2FileStorage deployed at: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
4. Deploying ScriptyStorageV2...
ScriptyStorageV2 deployed at: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
5. Deploying ScriptyBuilderV2...
ScriptyBuilderV2 deployed at: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
6. Deploying OnchainRugsHTMLGenerator...
OnchainRugsHTMLGenerator deployed at: 0x0165878A594ca255338adfa4d48449f69242Eb8F0
7. Deploying OnchainRugs NFT contract...
OnchainRugs deployed at: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6

Starting library uploads...
Uploaded library: onchainrugs-p5.js.b64 Size: 28471 bytes
Uploaded library: onchainrugs.js.b64 Size: 15432 bytes

Testing HTML generation...
HTML generated successfully!
HTML length: 2847
HTML preview (first 500 chars):
data:text/html;base64,PGh0bWw+PGhlYWQ+PG1ldGEgY2hhcnNldD0idXRmLTgiPjxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsaW5pdGlhbC1zY2FsZT0xIj48dGl0bGU+T25jaGFpblJ1ZyAjMTwvdGl0bGU+PHN0eWxlPmJvZHl7ZGlzcGxheTpmbGV4O2p1c3RpZnk...

Testing library storage and retrieval...
p5.js retrieved successfully, size: 28471
Algorithm retrieved successfully, size: 15432

Testing ScriptyBuilderV2 directly...
ScriptyBuilderV2 direct test successful!
HTML length: 1284

Testing OnchainRugs NFT integration...
Rug minted successfully with tokenId: 1
TokenURI generated successfully!
TokenURI length: 1247
```

## Troubleshooting

### Common Issues

1. **Missing JavaScript Files**
   ```bash
   ls -la data/rug-*.js.b64
   ```
   Make sure your base64-encoded JavaScript files exist.

2. **Anvil Not Running**
   ```bash
   curl http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

3. **Gas Limit Issues**
   ```bash
   anvil --gas-limit 100000000
   ```

4. **Compilation Errors**
   ```bash
   forge build --sizes
   ```

### Debug Commands

```bash
# Run with maximum verbosity
forge test --match-contract LocalScriptyTest -vvv

# Run single test with gas reporting
forge test --match-test testHTMLGeneration --gas-report -vv

# Check contract sizes
forge build --sizes | grep -E "(Scripty|OnchainRugs)"
```

## Test Coverage

The test suite covers:

- [x] **Contract Deployment**: All infrastructure contracts
- [x] **Library Upload**: JavaScript library storage and retrieval
- [x] **HTML Generation**: End-to-end HTML creation
- [x] **NFT Integration**: Full tokenURI generation workflow
- [x] **Metadata Functions**: Project information and requirements
- [x] **Error Handling**: Graceful handling of missing files
- [x] **Gas Efficiency**: Monitoring gas usage for optimization

## Next Steps

After local testing succeeds:

1. **Deploy to Testnet**: Use the same infrastructure on testnet
2. **Verify on Mainnet**: Deploy production contracts
3. **Monitor Gas**: Optimize for mainnet gas costs
4. **Add More Tests**: Extend test coverage as needed

Your local Scripty testing environment is now ready!
