# Base Sepolia Deployment Guide - OnchainRugs NFT Collection

## Overview

This guide provides step-by-step instructions for deploying the OnchainRugs NFT collection to Base Sepolia testnet. Base Sepolia offers a stable testing environment with lower gas costs compared to other L2 solutions.

## Base Sepolia Network Details

| Property | Value |
|----------|-------|
| **Network Name** | Base Sepolia |
| **Chain ID** | 84532 |
| **Currency Symbol** | ETH |
| **RPC Endpoint** | https://sepolia.base.org |
| **Block Explorer** | https://sepolia-explorer.base.org |
| **Flashblocks RPC** | https://sepolia-preconf.base.org |

## Prerequisites

### 1. Environment Setup

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
```

### 2. Get Base Sepolia Testnet ETH

Obtain testnet ETH from Base Sepolia faucets:
- Base official faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Other faucets available through various providers

### 3. Configure Environment Variables

Copy `BASE_SEPOLIA_ENV_EXAMPLE.txt` to `.env` and fill in your values:

```bash
cp BASE_SEPOLIA_ENV_EXAMPLE.txt .env
```

Required variables:
- `PRIVATE_KEY`: Your deployer wallet private key (without 0x prefix)
- `BASE_RPC`: https://sepolia.base.org
- `NEXT_PUBLIC_ALCHEMY_API_KEY`: Your Alchemy API key (optional but recommended)
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Your WalletConnect project ID

## Deployment Steps

### Step 1: Verify Configuration

Check that foundry.toml has Base Sepolia configured:

```toml
[rpc_endpoints]
base-sepolia = "https://sepolia.base.org"
base = "https://sepolia.base.org"

[etherscan]
base-sepolia = { key = "your-api-key", url = "https://api-sepolia.basescan.org/api" }

[profile.base.gas]
gas_price = 500000000  # 0.5 gwei
gas_limit = 20000000   # 20M gas limit
```

### Step 2: Deploy Contracts

Run the Base Sepolia deployment script:

```bash
# Deploy to Base Sepolia
forge script script/DeployBaseSepolia.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify \
  --profile base

# Alternative: Using environment variable
forge script script/DeployBaseSepolia.s.sol \
  --rpc-url $BASE_RPC \
  --broadcast \
  --verify
```

The deployment will:
1. Deploy FileStore infrastructure
2. Deploy ScriptyStorage and ScriptyBuilder
3. Deploy OnchainRugsHTMLGenerator
4. Deploy Diamond and all facets
5. Configure the diamond with facets
6. Upload JavaScript libraries (rug-p5.js, rug-algo.js, rug-frame.js)
7. Initialize the system with default settings

### Step 3: Save Deployment Addresses

After deployment, save these addresses from the console output:

```bash
FileStore: 0x...
ScriptyStorageV2: 0x...
ScriptyBuilderV2: 0x...
HTMLGenerator: 0x...
Diamond: 0x...  # This is your main contract address
```

Update your `.env` file:
```bash
ONCHAIN_RUGS_DIAMOND=0x...  # Your diamond address
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0x...  # Same as diamond address
```

### Step 4: Verify on Basescan

If verification failed during deployment, verify manually:

```bash
forge verify-contract \
  --chain-id 84532 \
  --num-of-optimizations 10 \
  --compiler-version v0.8.22 \
  YOUR_CONTRACT_ADDRESS \
  src/diamond/Diamond.sol:Diamond \
  --etherscan-api-key YOUR_BASESCAN_API_KEY
```

### Step 5: Test Basic Functionality

Test minting on Base Sepolia:

```bash
# Test a mint transaction
cast send YOUR_DIAMOND_ADDRESS \
  "mintRug(string[],string,string,string,uint256)" \
  '["Test Rug"]' "default" "" "" 8 \
  --value 0.00003ether \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY
```

## ERC-721-C Integration (Optional)

### Check LimitBreak Infrastructure Availability

The project includes ERC-721-C support for programmable royalties and transfer restrictions. Check if LimitBreak has deployed their infrastructure on Base Sepolia:

1. Visit https://developers.apptokens.com/infrastructure
2. Check for:
   - CreatorTokenTransferValidator
   - Payment Processor V3
   - Collection Settings Registry

### If Infrastructure is Available

Update your `.env`:
```bash
CREATOR_TOKEN_VALIDATOR_BASE=0x...
PAYMENT_PROCESSOR_BASE=0x...
```

Configure security policies (if needed):
```bash
# Call through RugTransferSecurityFacet
cast send YOUR_DIAMOND_ADDRESS \
  "setPaymentProcessorSecurityPolicy(uint256)" \
  POLICY_ID \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY
```

### If Infrastructure is Not Available

The contract will work without ERC-721-C features. The deployment includes:
- Standard ERC-721 functionality
- Aging and maintenance mechanics
- Built-in marketplace
- All core OnchainRugs features

## Frontend Configuration

### Update Environment Variables

Ensure your frontend `.env` or `.env.local` has:

```bash
# Base Sepolia Configuration
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0x...  # Your diamond address
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_ROYALTY_RECIPIENT=your_wallet_address
```

### Network Switching

The frontend supports multiple networks. Users can switch between:
- Shape Sepolia (Chain ID: 11011)
- Shape Mainnet (Chain ID: 360)
- Base Sepolia (Chain ID: 84532)
- Base Mainnet (Chain ID: 8453)

## Key Differences from Shape Sepolia

### Gas Costs
- **Base Sepolia**: ~0.5 gwei (cheaper)
- **Shape Sepolia**: ~1 gwei

Use the `--profile base` flag for optimized gas settings.

### Block Times
- Base Sepolia has predictable 2-second block times
- Faster transaction confirmation than Shape

### Infrastructure
- Both networks support standard ERC-721
- LimitBreak ERC-721-C availability may differ
- Base has more established tooling and faucets

## Testing Checklist

After deployment, verify:

- [ ] Contract deployed and verified on Basescan
- [ ] Can mint NFTs (test with small ETH amount)
- [ ] TokenURI returns valid data
- [ ] Aging mechanics work (check after waiting periods)
- [ ] Cleaning costs calculated correctly
- [ ] Maintenance functions execute
- [ ] Marketplace features operational
- [ ] Frontend connects to Base Sepolia
- [ ] Wallet interactions work properly

## Troubleshooting

### "Insufficient funds" Error
- Ensure you have enough Base Sepolia ETH
- Check gas price settings in foundry.toml
- Try getting more testnet ETH from faucets

### "Nonce too high" Error
```bash
# Reset your account nonce
cast nonce YOUR_ADDRESS --rpc-url base-sepolia
```

### Verification Fails
- Check compiler version matches (0.8.22)
- Verify optimizer settings (runs: 10, via-ir: true)
- Use `--watch` flag to monitor verification status

### Contract Call Reverts
- Check if system is initialized
- Verify mint price is correct (0.00003 ETH base)
- Ensure wallet has approval for operations

## Contract Configuration

The deployment initializes with these settings:

### Minting
- Base Price: 0.00003 ETH
- Collection Cap: 10,000 NFTs
- Wallet Limit: 7 NFTs per wallet

### Aging System (Test Values)
- Dirt Level 1: 1 minute (normally 1 day)
- Dirt Level 2: 2 minutes (normally 3 days)
- Aging Progression: 3 minutes per level
- Free Cleaning Window: 5 minutes after mint

### Service Costs
- Cleaning: 0.00001 ETH
- Restoration: 0.00001 ETH
- Master Restoration: 0.00001 ETH
- Laundering Threshold: 0.00001 ETH

### Frame Thresholds
- Bronze: 50 points
- Silver: 150 points
- Gold: 300 points
- Diamond: 600 points

## Production Deployment Notes

When moving to Base Mainnet:

1. Update chain ID to 8453
2. Use mainnet RPC: https://mainnet.base.org
3. Increase aging thresholds to production values (days instead of minutes)
4. Review and adjust pricing for mainnet economics
5. Set up proper monitoring and analytics
6. Configure real royalty recipients
7. Test thoroughly on testnet first

## Support and Resources

- **Base Documentation**: https://docs.base.org
- **Base Discord**: Join for community support
- **Foundry Book**: https://book.getfoundry.sh
- **OnchainRugs Spec**: See ONCHAIRUGS_SPECIFICATION.md

## Next Steps

After successful deployment:

1. Test all contract functions
2. Deploy and configure frontend
3. Set up monitoring and alerts
4. Create documentation for users
5. Plan marketing and launch strategy
6. Consider security audit for mainnet

---

**Congratulations!** You've successfully deployed OnchainRugs to Base Sepolia. Your generative NFT collection with aging mechanics is now live on a fast, low-cost L2 network.

