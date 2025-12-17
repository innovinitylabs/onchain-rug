# Fresh Deployment Guide - Base Sepolia Clean Start

## Overview
This guide covers the complete process for doing a fresh deployment of the OnchainRugs system to Base Sepolia, including withdrawing funds from the old contract and deploying everything anew.

## Current Status
- **Old Contract**: `0x15c5a551b8aA39a3A4E73643a681E71F76093b62` (Base Sepolia)
- **Balance Check**: ✅ Confirmed 0 ETH balance (no withdrawal needed)
- **New Deployment**: Ready with all facets including DiamondFramePool

## Step 1: Pre-Deployment Checks

### 1.1 Environment Setup
Ensure your `.env` file has:
```bash
TESTNET_PRIVATE_KEY=your_private_key_here
```

### 1.2 Balance Verification
```bash
# Check if old contract has funds
cd /Users/valipokkann/Developer/onchain_rugs_working
forge script script/CheckBalance.s.sol --rpc-url https://sepolia.base.org
```

Expected output: `Contract balance: 0 ETH` (no withdrawal needed)

### 1.3 Build Verification
```bash
# Ensure everything compiles
forge build
```

## Step 2: Fresh Deployment

### 2.1 Run Fresh Deployment
```bash
# Deploy everything fresh to Base Sepolia
forge script script/FreshDeployBaseSepolia.s.sol --rpc-url https://sepolia.base.org --broadcast --verify
```

This will deploy:
1. **Infrastructure** (4 contracts):
   - FileStore
   - ScriptyStorageV2
   - ScriptyBuilderV2
   - OnchainRugsHTMLGenerator

2. **Diamond System** (10 facets):
   - Diamond (main contract)
   - DiamondCutFacet
   - DiamondLoupeFacet
   - RugNFTFacet (ERC721 + metadata)
   - RugAdminFacet (configuration)
   - RugAgingFacet (aging system)
   - RugMaintenanceFacet (cleaning/restoration)
   - RugCommerceFacet (royalties/withdrawals)
   - RugLaunderingFacet (sale tracking)
   - RugTransferSecurityFacet (ERC721-C security)
   - RugMarketplaceFacet (listing/buying)

3. **DiamondFramePool** (royalty distribution)

### 2.2 Expected Output
```
=========================================
FRESH Base Sepolia Deployment
=========================================
WARNING: This will deploy ALL contracts fresh!
Make sure old contract addresses are backed up!
=========================================

1. Deploying FileStore...
   FileStore deployed at: 0x...

2. Deploying ScriptyStorageV2...
   ScriptyStorageV2 deployed at: 0x...

3. Deploying ScriptyBuilderV2...
   ScriptyBuilderV2 deployed at: 0x...

4. Deploying OnchainRugsHTMLGenerator...
   OnchainRugsHTMLGenerator deployed at: 0x...

5. Deploying Diamond system...
   Deploying DiamondCutFacet...
   DiamondCutFacet deployed
   Deploying DiamondLoupeFacet...
   DiamondLoupeFacet deployed
   Deploying main Diamond contract...
   Diamond deployed at: 0x...
   Deploying Rug facets...
   All Rug facets deployed (including Transfer Security and Marketplace)

9. Deploying Diamond Frame Pool...
   DiamondFramePool deployed at: 0x...
   Minimum claimable amount: 0.0001 ETH

6. Configuring Diamond with facets...
   Added DiamondLoupeFacet
   Added RugNFTFacet with all ERC721 functions (includes ERC721-C validation)
   Added RugAdminFacet
   Added RugAgingFacet
   Added RugMaintenanceFacet
   Added RugCommerceFacet
   Added RugLaunderingFacet
   Added RugTransferSecurityFacet
   Added RugMarketplaceFacet

10. Configuring Diamond Frame Pool...
   Pool ownership set to diamond contract in constructor
   Pool configured in diamond contract (1% of royalties)

7. Uploading JavaScript libraries to ScriptyStorage...
   File: rug-p5.js
   Size: XXXX bytes
   Chunks: X
   Uploaded chunk 1 / X
   ...
   Content rug-p5.js uploaded and frozen
   (same for rug-algo.js and rug-frame.js)

8. Initializing OnchainRugs system...
   Initializing ERC721 metadata...
   Name: OnchainRugs, Symbol: RUGS
   Scripty contracts configured
   ERC721-C transfer validator initialized in RugNFTFacet
   O(1) Aging System:
   - Dirt: 1min to 1, 2min to 2 (normally 3d to 1, 7d to 2)
   - Texture: 3min/level progression (normally 30dto60dto90dto120d...)
   - Free cleaning: 30min after mint, 11min after last clean
   System initialized with:
   - Base price: 0.00003 ETH
   - Collection cap: 10,000
   - Wallet limit: 7
   - Aging thresholds (TEST VALUES): 1min/2min dirt, 3min aging progression
   - Free cleaning: 5min after mint, 2min after cleaning
   - Service costs: 0.00001 ETH each
   - Frame thresholds: Bronze(50), Silver(150), Gold(300), Diamond(600)
   - Aging protection: Bronze(25% slower), Silver(50%), Gold(80%), Diamond(90%)
   - Dirt immunity: Silver+ frames never accumulate dirt
   - Maintenance points: Clean(2), Restore(8), Master(12), Launder(20)
   - Fresh mechanics: 3 dirt levels, 11 aging levels, 5 frames
   - Scripty contracts configured
   Configuring royalties...
   - Royalties: 10% to deployer address
   Enabling automatic laundering...
   - Automatic laundering: ENABLED
   Configuring x402 AI maintenance fees...
   - Fee recipient: deployer address
   - Flat service fee: 0.00042 ETH for all actions
   - AI service fee: 0 ETH (disabled)

=========================================
Base Sepolia Fresh Deployment Complete!
=========================================
FileStore: 0x...
ScriptyStorageV2: 0x...
ScriptyBuilderV2: 0x...
HTMLGenerator: 0x...
Diamond: 0x...  ← THIS IS YOUR NEW CONTRACT ADDRESS
DiamondFramePool: 0x...
=========================================
Next Steps:
1. Update .env with new Diamond address
2. Update frontend environment variables
3. Test minting, maintenance, and marketplace
4. Verify Diamond Frame Pool integration
=========================================
```

## Step 3: Environment Update

### 3.1 Update .env File
After deployment, update your `.env` file with the new contract address:

```bash
# Replace with the new Diamond address from deployment output
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0x...  # New Diamond contract address
```

### 3.2 Frontend Environment Variables
The frontend will automatically use the correct contract based on the chain. Make sure your `.env.local` or deployment environment has:

```bash
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0x...  # Same as above
```

## Step 4: Post-Deployment Testing

### 4.1 Minting Test
```bash
# Test basic minting functionality
cast send <NEW_DIAMOND_ADDRESS> "mintRug()" --value 30000000000000 --rpc-url https://sepolia.base.org --private-key $TESTNET_PRIVATE_KEY
```

### 4.2 Contract Verification
```bash
# Verify contracts on Base Sepolia explorer
forge verify-contract <DIAMOND_ADDRESS> src/diamond/Diamond.sol:Diamond --chain-id 84532 --etherscan-api-key $ETHERSCAN_API_KEY
```

## System Configuration Summary

### Pricing & Limits
- **Base Mint Price**: 0.00003 ETH
- **Collection Cap**: 10,000 NFTs
- **Wallet Limit**: 7 NFTs per address
- **Service Fees**: 0.00001 ETH (cleaning/restoration)
- **AI Service Fee**: 0.00042 ETH (flat fee for all actions)

### Aging System (Test Values - Fast)
- **Dirt Level 1**: 1 minute after mint
- **Dirt Level 2**: 2 minutes after mint
- **Aging Progression**: Every 3 minutes
- **Free Cleaning**: Available 5 minutes after mint, 2 minutes after cleaning

### Royalty Distribution
- **Artist Royalty**: 10% of sale price
- **Diamond Frame Pool**: 1% of sale price (automatic distribution to diamond frame holders)
- **Platform Fee**: 0% (royalties go directly to artist and pool)

### Frame Thresholds
- **Bronze**: 50 maintenance points
- **Silver**: 150 maintenance points
- **Gold**: 300 maintenance points
- **Diamond**: 600 maintenance points

### Maintenance Points System
- **Clean**: +2 points
- **Restore**: +8 points
- **Master Restore**: +12 points
- **Launder**: +20 points

## Troubleshooting

### If Deployment Fails
1. Check deployer balance: `cast balance <DEPLOYER_ADDRESS> --rpc-url https://sepolia.base.org`
2. Ensure TESTNET_PRIVATE_KEY is set correctly
3. Check gas limits (deployment is gas-intensive)

### If Frontend Doesn't Work
1. Verify NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT is updated
2. Check browser console for contract address logs
3. Ensure user is connected to Base Sepolia network

### If NFT Loading Fails
1. Check browser console for detailed error logs
2. Verify contract is deployed and verified
3. Test basic contract calls with cast

## Backup Old Addresses
Before deployment, ensure you have backed up:
- Old Diamond address: `0x15c5a551b8aA39a3A4E73643a681E71F76093b62`
- Any important NFT IDs or user data
- Previous environment variables

## Migration Notes
- All NFTs from old contract will remain there (not migrated)
- Fresh deployment starts with clean state
- Users can mint new NFTs on the fresh contract
- Diamond Frame Pool is integrated from day one
