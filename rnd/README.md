# Contract Research & Development (RND)

This folder contains tools and resources for researching and analyzing smart contracts for feasibility studies and feature development.

## Contract Downloader

The `download_contract.py` script allows you to download verified smart contract source code from various blockchain explorers.

### Setup

1. **Install Python dependencies:**
   ```bash
   pip install requests
   ```

2. **Get an API key (optional but recommended):**
   - Visit [Etherscan APIs](https://etherscan.io/apis)
   - Create a free account and get your API key
   - Copy `env.example` to `.env` and add your API key:
     ```bash
     cp env.example .env
     # Edit .env and add your API key
     ```

3. **Make the script executable:**
   ```bash
   chmod +x download_contract.py
   ```

### Usage

#### Basic Usage
```bash
# Download from Ethereum (default)
python download_contract.py 0x185fbb7597ef4a2f55faf70302e196e642c4a673

# Download from Base
python download_contract.py 0x185fbb7597ef4a2f55faf70302e196e642c4a673 base

# Download from all supported chains
python download_contract.py 0x185fbb7597ef4a2f55faf70302e196e642c4a673 --all-chains
```

#### Advanced Usage
```bash
# List all supported chains
python download_contract.py --list-chains

# Download with specific chain
python download_contract.py 0x1234567890123456789012345678901234567890 polygon
```

### Supported Blockchains

The script uses [Etherscan V2 API](https://docs.etherscan.io/etherscan-v2/api-endpoints/contracts) with a single API key for all chains:

- **Ethereum** - Main Ethereum network (Chain ID: 1)
- **Base** - Coinbase's Layer 2 (Chain ID: 8453)
- **Polygon** - Polygon PoS network (Chain ID: 137)
- **Arbitrum** - Arbitrum One (Chain ID: 42161)
- **Optimism** - Optimism mainnet (Chain ID: 10)
- **Avalanche** - Avalanche C-Chain (Chain ID: 43114)
- **BNB Smart Chain** - BSC (Chain ID: 56)
- **Linea** - Linea mainnet (Chain ID: 59144)
- **Scroll** - Scroll mainnet (Chain ID: 534352)
- **Blast** - Blast mainnet (Chain ID: 81457)

### Output Structure

Downloaded contracts are organized as follows:

```
contracts/
├── ethereum-0x1234.../
│   ├── metadata.json          # Contract metadata + creator info
│   ├── abi.json              # Contract ABI (if available)
│   ├── ContractName.sol       # Single file contracts
│   └── src/                   # Multi-file contracts
│       ├── contracts/
│       ├── interfaces/
│       └── libraries/
└── base-0x5678.../
    ├── metadata.json
    ├── abi.json
    └── ...
```

### Contract Metadata

Each download includes a `metadata.json` file with:
- Contract address and chain
- Contract name and compiler version
- Optimization settings
- Constructor arguments
- Proxy information (if applicable)
- License type
- **Creator address** and **creation transaction hash**
- ABI information

Plus a separate `abi.json` file with the contract's ABI for easy integration with other tools.

### Examples

#### Download the contract you mentioned
```bash
python download_contract.py 0x185fbb7597ef4a2f55faf70302e196e642c4a673 base
```

#### Research multiple contracts
```bash
# Download several contracts for comparison
python download_contract.py 0xContract1 base
python download_contract.py 0xContract2 ethereum
python download_contract.py 0xContract3 --all-chains
```

### Troubleshooting

**"No verified source code available"**
- The contract may not be verified on that chain
- Try a different chain with `--all-chains`
- Check the contract address is correct

**"API Error"**
- Check your internet connection
- Verify your API key is correct
- Some APIs have rate limits

**"Invalid contract address format"**
- Ensure the address starts with `0x` and is 42 characters long
- Example: `0x185fbb7597ef4a2f55faf70302e196e642c4a673`

### Research Workflow

1. **Identify interesting contracts** from DeFi protocols, NFT projects, etc.
2. **Download source code** using this script
3. **Analyze patterns** and implementations
4. **Document findings** in this folder
5. **Create feasibility reports** for your project

### Integration with Onchain Rugs Project

This RND folder helps with:
- **Feature research** - Study how other projects implement similar features
- **Gas optimization** - Analyze efficient contract patterns
- **Security patterns** - Review best practices from verified contracts
- **Architecture decisions** - Compare different approaches to similar problems

### Contributing

When adding new research:
1. Create a descriptive folder name
2. Include the contract address in the folder name
3. Add a brief README explaining what you learned
4. Document any relevant patterns or insights
