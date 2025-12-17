# Base Sepolia Testing Branch

Welcome to the Base Sepolia fork of OnchainRugs! This branch contains everything you need to deploy and test your NFT collection on Base Sepolia testnet.

## What's New

This branch adds complete Base Sepolia support while maintaining full backward compatibility with Shape Sepolia.

### Key Features

- **Multi-Network Support**: Deploy to Base Sepolia or Shape Sepolia
- **Lower Gas Costs**: Base Sepolia uses ~0.5 gwei vs Shape's 1 gwei
- **Complete Deployment Script**: One command deploys everything
- **Comprehensive Documentation**: Guides for every step
- **Frontend Ready**: Web3 configuration supports all networks

## Quick Links

- **Quick Start**: [`QUICK_START_BASE_SEPOLIA.md`](./QUICK_START_BASE_SEPOLIA.md) - Deploy in 5 minutes
- **Full Guide**: [`BASE_SEPOLIA_DEPLOYMENT_GUIDE.md`](./BASE_SEPOLIA_DEPLOYMENT_GUIDE.md) - Complete documentation
- **Migration Summary**: [`BASE_SEPOLIA_MIGRATION_SUMMARY.md`](./BASE_SEPOLIA_MIGRATION_SUMMARY.md) - What changed
- **Environment Setup**: [`BASE_SEPOLIA_ENV_EXAMPLE.txt`](./BASE_SEPOLIA_ENV_EXAMPLE.txt) - Configuration template

## Network Information

### Base Sepolia Testnet

| Property | Value |
|----------|-------|
| **Network Name** | Base Sepolia |
| **Chain ID** | 84532 |
| **RPC Endpoint** | https://sepolia.base.org |
| **Flashblocks RPC** | https://sepolia-preconf.base.org |
| **Block Explorer** | https://sepolia-explorer.base.org |
| **Currency** | ETH |
| **Gas Price** | ~0.5 gwei |
| **Block Time** | 2 seconds |

### Get Testnet ETH

- Coinbase Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Other Base faucets available online

## Deployment Options

### Option 1: Quick Deploy (Recommended)

```bash
# 1. Switch to branch
git checkout base-sepolia-testing

# 2. Setup environment
cp BASE_SEPOLIA_ENV_EXAMPLE.txt .env
# Edit .env with your PRIVATE_KEY

# 3. Deploy
forge script script/DeployBaseSepolia.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify \
  --profile base
```

### Option 2: Step-by-Step

Follow the comprehensive guide in [`BASE_SEPOLIA_DEPLOYMENT_GUIDE.md`](./BASE_SEPOLIA_DEPLOYMENT_GUIDE.md)

## What Gets Deployed

### Smart Contracts
1. **FileStore** - On-chain file storage
2. **ScriptyStorage** - Script storage system
3. **ScriptyBuilder** - HTML generation
4. **OnchainRugsHTMLGenerator** - Custom art generator
5. **Diamond** - Main contract (EIP-2535)
6. **8 Facets**:
   - RugNFTFacet (ERC-721 + minting)
   - RugAdminFacet (configuration)
   - RugAgingFacet (aging mechanics)
   - RugMaintenanceFacet (cleaning/restoration)
   - RugCommerceFacet (royalties)
   - RugLaunderingFacet (anti-wash trading)
   - RugTransferSecurityFacet (ERC-721-C)
   - RugMarketplaceFacet (built-in marketplace)

### Libraries Uploaded
- `rug-p5.js` - p5.js rendering engine
- `rug-algo.js` - Art generation algorithm
- `rug-frame.js` - Frame rendering

## Configuration

### Default Settings

**Minting**
- Base Price: 0.00003 ETH
- Collection Cap: 10,000 NFTs
- Wallet Limit: 7 NFTs

**Aging (Test Values)**
- Dirt Level 1: 1 minute (production: 1 day)
- Dirt Level 2: 2 minutes (production: 3 days)
- Aging Progression: 3 minutes (production: 30 days)
- Free Cleaning: 5 minutes after mint

**Service Costs**
- Cleaning: 0.00001 ETH
- Restoration: 0.00001 ETH
- Master Restoration: 0.00001 ETH

**Frame Progression**
- Bronze: 50 points
- Silver: 150 points
- Gold: 300 points
- Diamond: 600 points

## Testing

### After Deployment

1. **Verify Contract**
   ```bash
   # Check on Basescan
   https://sepolia-explorer.base.org/address/YOUR_DIAMOND_ADDRESS
   ```

2. **Test Mint**
   ```bash
   cast send YOUR_DIAMOND_ADDRESS \
     "mintRug(string[],string,string,string,uint256)" \
     '["Test Rug"]' "default" "" "" 8 \
     --value 0.00003ether \
     --rpc-url base-sepolia \
     --private-key $PRIVATE_KEY
   ```

3. **Check Supply**
   ```bash
   cast call YOUR_DIAMOND_ADDRESS "totalSupply()" --rpc-url base-sepolia
   ```

4. **View NFT**
   - Check TokenURI
   - View on block explorer
   - Test aging after waiting period

## Frontend Setup

### Environment Variables

```bash
# Add to .env
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=YOUR_DIAMOND_ADDRESS
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
```

### Network Switching

The frontend automatically detects and supports:
- Shape Sepolia (11011)
- Shape Mainnet (360)
- Base Sepolia (84532)
- Base Mainnet (8453)

Users switch via their wallet.

## Key Differences from Shape

### Advantages of Base
- **Lower Gas**: ~50% cheaper (0.5 gwei vs 1 gwei)
- **Faster Blocks**: 2-second block times
- **Better Tooling**: More established ecosystem
- **More Faucets**: Easier to get testnet ETH

### Deployment Differences
- Use `--profile base` for optimized gas settings
- Different block explorer (Basescan vs Shapescan)
- May have different LimitBreak infrastructure availability

## ERC-721-C Support

The deployment includes ERC-721-C integration for:
- Programmable royalties
- Transfer restrictions
- Marketplace whitelisting

**Note**: Check if LimitBreak infrastructure is deployed on Base Sepolia at:
https://developers.apptokens.com/infrastructure

If not available, all core features still work without it.

## Project Structure

```
.
├── script/
│   ├── DeployBaseSepolia.s.sol       # Base deployment script
│   └── DeployShapeSepolia.s.sol      # Shape deployment script
├── lib/
│   ├── web3.ts                        # Frontend Web3 config (multi-network)
│   └── config.ts                      # App config (multi-network)
├── foundry.toml                       # Forge config (Base + Shape)
├── BASE_SEPOLIA_DEPLOYMENT_GUIDE.md   # Comprehensive guide
├── BASE_SEPOLIA_MIGRATION_SUMMARY.md  # What changed
├── QUICK_START_BASE_SEPOLIA.md        # 5-minute deploy
└── BASE_SEPOLIA_ENV_EXAMPLE.txt       # Environment template
```

## Troubleshooting

### Common Issues

**"Insufficient funds for gas"**
- Get more testnet ETH from faucets
- Check your wallet balance

**"Verification failed"**
- Add Basescan API key to foundry.toml
- Try manual verification with forge verify-contract

**"Nonce too high"**
```bash
# Check your current nonce
cast nonce YOUR_ADDRESS --rpc-url base-sepolia
```

**"Transaction reverted"**
- Check if system is initialized
- Verify mint price is correct
- Ensure contract has required libraries uploaded

### Getting Help

1. Check documentation files in this branch
2. Review the ONCHAIRUGS_SPECIFICATION.md
3. Check contract events for error details
4. Join Base Discord for network-specific help

## Production Deployment

When ready for Base Mainnet:

1. **Test Thoroughly** on Base Sepolia first
2. **Update Timing Values** (days instead of minutes)
3. **Review Pricing** for mainnet economics
4. **Change Chain ID** to 8453
5. **Use Mainnet RPC** https://mainnet.base.org
6. **Consider Security Audit**
7. **Set up Monitoring**

## Branch Management

### To Use This Branch

```bash
# Switch to branch
git checkout base-sepolia-testing

# Pull latest changes
git pull origin base-sepolia-testing

# Start working
forge build
npm run dev
```

### To Merge Back

After successful testing, you can merge this branch back to main:

```bash
git checkout main
git merge base-sepolia-testing
```

## Files Summary

### New Files (4)
- `script/DeployBaseSepolia.s.sol` - Deployment script
- `BASE_SEPOLIA_ENV_EXAMPLE.txt` - Environment template
- `BASE_SEPOLIA_DEPLOYMENT_GUIDE.md` - Full guide
- `BASE_SEPOLIA_MIGRATION_SUMMARY.md` - Change summary
- `QUICK_START_BASE_SEPOLIA.md` - Quick start
- `BASE_SEPOLIA_README.md` - This file

### Modified Files (4)
- `foundry.toml` - Added Base RPC and gas config
- `lib/web3.ts` - Added Base chain support
- `lib/config.ts` - Added Base network config
- `DEPLOYMENT_ENV_EXAMPLE.txt` - Added Base variables

### Unchanged
- All smart contracts remain the same
- No breaking changes to existing functionality
- Full backward compatibility maintained

## Success Criteria

✅ Git branch created  
✅ Foundry configuration updated  
✅ Deployment script created  
✅ Frontend configuration updated  
✅ Documentation completed  
✅ Environment templates provided  
✅ All changes committed  

## Next Steps

1. **Read**: [`QUICK_START_BASE_SEPOLIA.md`](./QUICK_START_BASE_SEPOLIA.md)
2. **Setup**: Configure your `.env` file
3. **Deploy**: Run the deployment script
4. **Test**: Mint NFTs and test features
5. **Frontend**: Configure and launch web app

## Support

- **Base Docs**: https://docs.base.org
- **Foundry Book**: https://book.getfoundry.sh
- **Project Spec**: See ONCHAIRUGS_SPECIFICATION.md

---

**Ready to deploy OnchainRugs on Base Sepolia!** 🎨🚀

For the fastest deployment, start with [`QUICK_START_BASE_SEPOLIA.md`](./QUICK_START_BASE_SEPOLIA.md)

