# 🚀 RugScripty Universal Deployment Guide

Deploy and test your on-chain rug NFT system on both **Local Anvil** and **Shape L2 Testnet** with full SSTORE2 chunking support.

## 📋 System Overview

- **✅ SSTORE2 Chunking**: Available on both local and testnet
- **✅ EthFS Compatible**: Uses real EthFS on testnet, local mock on Anvil
- **✅ Full Scripty Integration**: Complete HTML generation pipeline
- **✅ Cross-Network Testing**: Same codebase works everywhere

## 🛠️ Quick Start

### 1. Local Development (Anvil)
```bash
# Start Anvil in background
anvil

# Deploy complete system
forge script script/DeployRugScriptyUniversal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Upload libraries
forge script script/UploadLibrariesUniversal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Test minting
forge script script/TestUniversalMint.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### 2. Shape L2 Testnet Deployment
```bash
# Set your private key
export TESTNET_PRIVATE_KEY=your_private_key_here

# Deploy complete system
forge script script/DeployRugScriptyUniversal.s.sol --rpc-url https://sepolia.shape.network --broadcast

# Upload libraries
forge script script/UploadLibrariesUniversal.s.sol --rpc-url https://sepolia.shape.network --broadcast

# Test minting
forge script script/TestUniversalMint.s.sol --rpc-url https://sepolia.shape.network --broadcast
```

## 📁 Generated Files

After deployment, you'll get:
- `rug-scripty-local-deployment.txt` / `rug-scripty-testnet-deployment.txt` - Full deployment info
- `rug-scripty-local.env` / `rug-scripty-testnet.env` - Contract addresses for easy loading

## 🔧 Contract Addresses

The system auto-detects your network and uses:
- **Local**: Deploys mock EthFS system
- **Shape L2**: Uses real EthFS at `0xFe1411d6864592549AdE050215482e4385dFa0FB`

## 🎨 What Gets Deployed

1. **EthFS System** (Local Mock or Real)
2. **ScriptyBuilderV2** - HTML assembler
3. **ScriptyStorageV2** - SSTORE2 storage with chunking
4. **OnchainRugsHTMLGenerator** - Project-specific logic
5. **OnchainRugs** - Main NFT contract

## 🧪 Testing Your NFT

After deployment and library upload:

```bash
# Mint a test NFT
forge script script/TestUniversalMint.s.sol --rpc-url [YOUR_RPC] --broadcast

# Check tokenURI (if contracts configured)
cast call [ONCHAIN_RUGS_ADDRESS] "tokenURI(uint256)" 1 --rpc-url [YOUR_RPC]
```

## 📊 Features

- ✅ **Automatic Network Detection**
- ✅ **SSTORE2 Chunking** (Gas optimized)
- ✅ **Cross-Network Compatibility**
- ✅ **Real EthFS on Testnet**
- ✅ **Mock EthFS for Local Dev**
- ✅ **Complete HTML Generation**
- ✅ **Dynamic Rug Aging**
- ✅ **On-chain P5.js Algorithm**

## 🚨 Important Notes

1. **Local Testing**: Uses mock EthFS but still provides SSTORE2 functionality
2. **Testnet**: Uses real EthFS with full gas optimization
3. **Contract Config**: Relationships auto-configured during deployment
4. **Library Upload**: Required before minting (provides p5.js and algorithm)

## 🎯 Next Steps

1. Deploy to your preferred network
2. Upload JavaScript libraries
3. Mint your first on-chain rug!
4. View the generated HTML in browser
5. Test all features (aging, cleaning, etc.)

---

**Happy deploying! Your on-chain rug system is ready for both local development and live deployment! 🖼️✨**
