# Base Sepolia Deployment - Success!

## Deployment Summary

**Date**: October 28, 2025  
**Network**: Base Sepolia Testnet  
**Chain ID**: 84532  
**Status**: ✅ Successfully Deployed  

---

## 🎉 Main Contract Address

**OnchainRugs Diamond (Main Contract)**:  
[`0x3bcd07e784c00bb84EfBab7F710ef041707003b9`](https://sepolia-explorer.base.org/address/0x3bcd07e784c00bb84EfBab7F710ef041707003b9)

This is your main NFT contract address. Use this for:
- Minting NFTs
- All user interactions
- Frontend configuration
- Marketplace integration

---

## 📝 Infrastructure Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| **FileStore** | `0x5Fb9310C998cC608226316F521D6d25E97E4B78A` | On-chain file storage |
| **ScriptyStorageV2** | `0x63bb0d67db4B7bFf07FAAcbF0E973ed3f6422C59` | Script storage system |
| **ScriptyBuilderV2** | `0x7e3FFB073E29d1715C08Ee9bC3E41356c75dcF42` | HTML builder |
| **HTMLGenerator** | `0x46270eB2bB5CE81ea29106514679e67d9Fa9ad27` | Art generator |

---

## 🔧 Deployed Features

### Core NFT Features
- ✅ ERC-721 Standard (full compliance)
- ✅ Minting with custom text
- ✅ On-chain generative art
- ✅ TokenURI with HTML art
- ✅ Transfer functionality

### Aging System
- ✅ O(1) dirt accumulation (1min → level 1, 2min → level 2)
- ✅ Texture aging progression (3min per level)
- ✅ Free cleaning windows (5min after mint, 2min after clean)
- ✅ Frame progression system

### Maintenance Features
- ✅ Clean rugs (removes dirt)
- ✅ Restore rugs (fixes aging)
- ✅ Master restoration (full reset)
- ✅ Dynamic pricing based on condition

### Commerce Features
- ✅ Built-in marketplace
- ✅ EIP-2981 royalties
- ✅ Configurable pricing
- ✅ Withdraw functions

### Advanced Features
- ✅ ERC-721-C transfer security
- ✅ Anti-wash trading (laundering detection)
- ✅ Frame system (Bronze → Silver → Gold → Diamond)
- ✅ Maintenance score tracking

---

## 📊 Configuration

### Collection Settings
- **Max Supply**: 10,000 NFTs
- **Wallet Limit**: 7 NFTs per wallet
- **Base Price**: 0.00003 ETH

### Test Timing Values (Rapid Testing)
- **Dirt Level 1**: 1 minute (production: 1 day)
- **Dirt Level 2**: 2 minutes (production: 3 days)
- **Aging Progression**: 3 minutes per level (production: 30 days)
- **Free Cleaning Window**: 5 minutes after mint (production: 14 days)
- **Free Clean After Maintenance**: 2 minutes (production: 5 days)

### Service Costs
- **Cleaning**: 0.00001 ETH
- **Restoration**: 0.00001 ETH
- **Master Restoration**: 0.00001 ETH
- **Laundering Threshold**: 0.00001 ETH

### Frame Thresholds
- **Bronze Frame**: 50 points
- **Silver Frame**: 150 points
- **Gold Frame**: 300 points
- **Diamond Frame**: 600 points

### Maintenance Points
- **Cleaning**: 2 points
- **Restoration**: 8 points
- **Master Restoration**: 12 points
- **Laundering**: 20 points

---

## 🧪 Test Your Deployment

### 1. Test Mint

```bash
cast send 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 \
  "mintRug(string[],string,string,string,uint256)" \
  '["My First Rug"]' "default" "" "" 8 \
  --value 0.00003ether \
  --rpc-url https://sepolia.base.org \
  --private-key $TESTNET_PRIVATE_KEY
```

### 2. Check Total Supply

```bash
cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 \
  "totalSupply()" \
  --rpc-url https://sepolia.base.org
```

### 3. Get Token URI (after minting)

```bash
cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 \
  "tokenURI(uint256)" 1 \
  --rpc-url https://sepolia.base.org
```

### 4. Check Aging State (wait 1-2 minutes)

```bash
cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 \
  "getAgingState(uint256)" 1 \
  --rpc-url https://sepolia.base.org
```

### 5. Clean a Rug

```bash
cast send 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 \
  "cleanRug(uint256)" 1 \
  --value 0.00001ether \
  --rpc-url https://sepolia.base.org \
  --private-key $TESTNET_PRIVATE_KEY
```

---

## 🌐 Block Explorer

View your contract on Base Sepolia Explorer:

**Main Contract**: https://sepolia-explorer.base.org/address/0x3bcd07e784c00bb84EfBab7F710ef041707003b9

You can:
- View all transactions
- See contract code
- Monitor events
- Check holders
- View NFT transfers

---

## 🖥️ Frontend Setup

Update your frontend `.env` or `.env.local`:

```bash
# Base Sepolia Configuration
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0x3bcd07e784c00bb84EfBab7F710ef041707003b9

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=84532

# Optional: Alchemy API for Base Sepolia
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

Then start your frontend:

```bash
npm run dev
```

Your app will automatically detect Base Sepolia (chain ID 84532) and connect to the deployed contract.

---

## 📦 JavaScript Libraries Uploaded

These libraries are stored on-chain in ScriptyStorage:

1. **rug-p5.js** (8,331 bytes) - p5.js rendering engine
2. **rug-algo.js** (10,315 bytes) - Art generation algorithm  
3. **rug-frame.js** (2,339 bytes) - Frame rendering system

Total on-chain storage: ~21 KB of JavaScript code

---

## 🎨 Art Generation

Each NFT generates unique art using:
- **Seed-based randomness**: Deterministic art from seed
- **Text integration**: Custom text woven into patterns
- **Color palettes**: Multiple palette options
- **Stripe patterns**: Varied stripe configurations
- **Character mapping**: Text character distribution

The art is generated on-demand from on-chain data and JavaScript libraries.

---

## 🔐 Security Features

### ERC-721-C Integration
- Transfer validator initialized
- Security policies configurable
- Optional marketplace restrictions

### Anti-Wash Trading
- Laundering detection system
- Tracks recent sales
- Automatic dirt accumulation on suspicious activity

### Access Control
- Admin functions protected
- Owner-only operations
- Upgradeable via diamond pattern

---

## 💰 Economics

### Revenue Streams
1. **Minting Fees**: 0.00003 ETH per mint
2. **Maintenance Fees**: 0.00001 ETH per service
3. **Marketplace Fees**: Configurable percentage
4. **Royalties**: EIP-2981 support for secondary sales

### Withdrawal
Contract owner can withdraw accumulated fees:

```bash
cast send 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 \
  "withdraw()" \
  --rpc-url https://sepolia.base.org \
  --private-key $TESTNET_PRIVATE_KEY
```

---

## 📈 Next Steps

### Immediate
- [x] Deploy contracts
- [ ] Test minting functionality
- [ ] Verify aging mechanics work
- [ ] Test cleaning operations
- [ ] Configure frontend

### Short Term
- [ ] Test marketplace features
- [ ] Verify frame progression
- [ ] Test all maintenance operations
- [ ] Monitor gas costs
- [ ] Create test NFTs with various attributes

### Before Mainnet
- [ ] Comprehensive testing on Base Sepolia
- [ ] Adjust timing values to production (days instead of minutes)
- [ ] Review and optimize gas usage
- [ ] Security audit (recommended)
- [ ] Final configuration review
- [ ] Set proper royalty recipients
- [ ] Plan marketing and launch

---

## 🐛 Known Test Configuration

**Important**: This deployment uses **test timing values** for rapid testing:
- Dirt accumulates in minutes (not days)
- Aging progresses in minutes (not days)
- Free cleaning windows are short

**For production (Base Mainnet)**:
- Update timing values to use days/weeks
- Review all pricing
- Adjust collection cap if needed
- Consider longer free cleaning windows

---

## 📊 Gas Usage

Deployment gas used: **36,271,055 gas**  
Estimated cost: **~0.000036 ETH** (at 0.001 gwei)

This is extremely cheap on Base Sepolia!

---

## 🎯 Contract Verification

To verify your contract on Basescan:

```bash
forge verify-contract \
  0x3bcd07e784c00bb84EfBab7F710ef041707003b9 \
  src/diamond/Diamond.sol:Diamond \
  --chain-id 84532 \
  --constructor-args $(cast abi-encode "constructor(address,address)" YOUR_DEPLOYER_ADDRESS DIAMOND_CUT_FACET_ADDRESS) \
  --etherscan-api-key YOUR_BASESCAN_API_KEY
```

---

## 📞 Support & Resources

- **Base Docs**: https://docs.base.org
- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Explorer**: https://sepolia-explorer.base.org
- **Project Spec**: See ONCHAIRUGS_SPECIFICATION.md
- **Deployment Guide**: See BASE_SEPOLIA_DEPLOYMENT_GUIDE.md

---

## ✅ Deployment Checklist

- [x] Environment configured
- [x] Testnet ETH obtained
- [x] Contracts compiled successfully
- [x] All contracts deployed
- [x] Diamond configured with facets
- [x] JavaScript libraries uploaded
- [x] System initialized
- [x] Configuration set
- [x] Addresses saved to .env
- [ ] Contract verified on Basescan
- [ ] Test minting completed
- [ ] Frontend configured
- [ ] Full feature testing

---

## 🎊 Congratulations!

Your OnchainRugs NFT collection is now live on Base Sepolia!

**Main Contract**: `0x3bcd07e784c00bb84EfBab7F710ef041707003b9`

Start minting, testing, and building your generative NFT collection with aging mechanics!

---

**Deployed on**: Base Sepolia Testnet  
**Branch**: base-sepolia-testing  
**Deployment Script**: script/DeployBaseSepolia.s.sol  
**Status**: ✅ Ready for Testing

