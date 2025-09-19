# 🚀 RugScripty Testnet Deployment Guide

## Overview
Deploy the complete RugScripty system (zero-bloat alternative to Scripty) to Shape testnet.

## Prerequisites
- Foundry installed
- Shape testnet private key with funds
- JavaScript libraries ready (`data/rug-p5.js`, `data/rug-algorithm.js`)

## Step 1: Environment Setup
```bash
export TESTNET_PRIVATE_KEY=your_private_key_here
```

## Step 2: Deploy RugScripty System
```bash
forge script script/DeployRugScriptyShapeTestnet.s.sol \
  --rpc-url https://sepolia.shape.network \
  --broadcast \
  --verify
```

**This deploys:**
- ✅ RugScriptyBuilderV2 (HTML assembler)
- ✅ RugScriptyContractStorage (file storage)
- ✅ OnchainRugsHTMLGenerator (logic)
- ✅ OnchainRugs (NFT contract)
- ✅ Sets up all relationships

**Outputs:**
- `rug-scripty-shape-testnet-deployment.txt` (deployment info)
- `rug-scripty-shape-testnet.env` (contract addresses)

## Step 3: Upload JavaScript Libraries
```bash
forge script script/UploadToRugScriptyShapeTestnet.s.sol \
  --rpc-url https://sepolia.shape.network \
  --broadcast
```

**This uploads:**
- ✅ `rug-p5.js` (chunked and stored)
- ✅ `rug-algorithm.js` (chunked and stored)
- ✅ Freezes content for security

## Step 4: Verify Deployment
```bash
forge script script/VerifyRugScriptyTestnet.s.sol \
  --rpc-url https://sepolia.shape.network
```

**This verifies:**
- ✅ All contracts deployed correctly
- ✅ JavaScript libraries accessible
- ✅ NFT contract ready for minting

## Step 5: Mint NFTs
Use the deployed OnchainRugs contract to mint NFTs:

```javascript
// Example mint transaction
const mintPrice = await onchainRugs.getMintPrice(1); // 1 text line
await onchainRugs.mintRug(
    ["YOUR TEXT"],     // textRows
    12345,             // seed
    "default",         // paletteName
    "255,0,0",         // minifiedStripeData
    "255,255,255",     // minifiedPalette
    "ABC...",          // filteredCharacterMap
    3,                  // warpThickness
    2,                  // complexity
    26,                 // characterCount
    3                   // stripeCount
    {value: mintPrice}
);
```

## Contract Addresses
After deployment, check `rug-scripty-shape-testnet.env`:
```
RUG_SCRIPPY_BUILDER=0x...
RUG_SCRIPTY_STORAGE=0x...
HTML_GENERATOR=0x...
ONCHAIN_RUGS=0x...
ETHFS_FILESTORE=0xFe1411d6864592549AdE050215482e4385dFa0FB
```

## Network Details
- **Network:** Shape L2 Testnet
- **Chain ID:** 11011
- **RPC URL:** https://sepolia.shape.network
- **Block Explorer:** https://explorer-sepolia.shape.network
- **EthFS FileStore:** Same address across all networks

## Troubleshooting
- Make sure you have enough ETH for gas fees
- Check that JavaScript files exist in `data/` folder
- Verify your private key has sufficient funds
- Use `--verify` flag to verify contracts on explorer

## Architecture Benefits
- ✅ **Zero Bloat** - No duplicate contracts
- ✅ **Complete Independence** - Standalone RugScripty system
- ✅ **Efficient Storage** - Uses EthFS for large files
- ✅ **Production Ready** - Battle-tested architecture

## Support
If you encounter issues:
1. Check the Shape testnet explorer for transaction status
2. Verify your wallet balance
3. Ensure all environment variables are set correctly
4. Check that JavaScript files are in the correct location
