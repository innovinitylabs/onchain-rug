# Deployment Configuration Guide

This document describes all user-changeable settings that can be configured during deployment via environment variables.

## Environment Variables

All settings can be overridden by setting environment variables before running the deployment script. If not set, defaults will be used.

### Royalty Configuration

#### `ROYALTY_PERCENTAGE`
- **Description**: **TOTAL** royalty percentage for NFT sales (includes curator + creator + pool)
- **Type**: Basis points (1 basis point = 0.01%)
- **Default**: `1000` (10%)
- **Range**: 200-10000 (2% to 100%, minimum 2% required for curator + pool)
- **Example**: `export ROYALTY_PERCENTAGE=1000` (10%)
- **Important**: This is the TOTAL royalty that gets split as:
  - **Curator (Minter)**: 1% (100 basis points) - **HARDCODED, NOT CONFIGURABLE** - goes to the person who minted the NFT
  - **Pool**: Configurable via `POOL_PERCENTAGE` (default 1% = 100 basis points)
  - **Creator**: Remaining amount = `ROYALTY_PERCENTAGE - 100 - POOL_PERCENTAGE`
- **Example Breakdown** (with default 10% total):
  - Curator: 1% (100 basis points) - fixed
  - Pool: 1% (100 basis points) - configurable
  - Creator: 8% (800 basis points) - remaining

### Marketplace Configuration

#### `MARKETPLACE_FEE_BPS`
- **Description**: Marketplace fee percentage for sales
- **Type**: Basis points (1 basis point = 0.01%)
- **Default**: `0` (0%)
- **Range**: 0-10000 (0% to 100%)
- **Example**: `export MARKETPLACE_FEE_BPS=250` (2.5%)
- **Note**: This fee is deducted from the sale price before royalties are calculated

### Pool Configuration

#### `POOL_PERCENTAGE`
- **Description**: Percentage of royalties that go to the Diamond Frame Pool
- **Type**: Basis points (1 basis point = 0.01%)
- **Default**: `100` (1%)
- **Range**: 0-10000 (0% to 100%)
- **Example**: `export POOL_PERCENTAGE=100` (1%)
- **Note**: This is part of the total `ROYALTY_PERCENTAGE`. The creator gets the remaining amount after curator and pool are deducted.

#### `CURATOR_ROYALTY_BPS` (NOT CONFIGURABLE)
- **Description**: Curator (Minter) royalty percentage
- **Type**: Basis points
- **Value**: **Hardcoded to 100 (1%)** - Cannot be changed
- **Note**: This goes to the address that minted the NFT (stored in `RugData.curator`). This is automatically deducted from the total royalty before distribution.

#### `MINIMUM_CLAIMABLE_AMOUNT`
- **Description**: Minimum amount (in wei) that must be accumulated before claiming from the pool
- **Type**: Wei (1 ETH = 1e18 wei)
- **Default**: `100000000000000` (0.0001 ETH)
- **Example**: `export MINIMUM_CLAIMABLE_AMOUNT=1000000000000000` (0.001 ETH)

### Minting Configuration

#### `BASE_PRICE`
- **Description**: Base minting price in wei
- **Type**: Wei
- **Default**: `30000000000000` (0.00003 ETH)
- **Example**: `export BASE_PRICE=100000000000000` (0.0001 ETH)

#### `COLLECTION_CAP`
- **Description**: Maximum number of NFTs that can be minted
- **Type**: Integer
- **Default**: `10000`
- **Example**: `export COLLECTION_CAP=5000`

#### `WALLET_LIMIT`
- **Description**: Maximum number of NFTs a single wallet can mint
- **Type**: Integer
- **Default**: `10`
- **Example**: `export WALLET_LIMIT=10`

### Service Fee Configuration

#### `SERVICE_FEE`
- **Description**: Flat service fee for AI maintenance operations (in wei)
- **Type**: Wei
- **Default**: `420000000000000` (0.00042 ETH)
- **Example**: `export SERVICE_FEE=1000000000000000` (0.001 ETH)
- **Note**: This is the fee charged for agent-authorized maintenance operations

## Deployment Process

The deployment script (`DeployBaseSepolia.s.sol`) performs the following steps:

1. **Deploy Infrastructure**
   - FileStore
   - ScriptyStorageV2
   - ScriptyBuilderV2
   - OnchainRugsHTMLGenerator

2. **Deploy Diamond System**
   - DiamondCutFacet
   - DiamondLoupeFacet
   - Main Diamond contract
   - All Rug facets (NFT, Admin, Aging, Maintenance, Commerce, Laundering, Transfer Security, Marketplace)

3. **Configure Diamond**
   - Add all facets to the diamond
   - Configure function selectors

4. **Deploy Pool**
   - DiamondFramePool contract
   - Configure minimum claimable amount

5. **Configure Pool**
   - Link pool to diamond
   - Set pool percentage

6. **Upload Libraries**
   - Upload JavaScript libraries to ScriptyStorage (rug-p5.js, rug-algo.js, rug-frame.js)

7. **Initialize System**
   - Initialize ERC721 metadata
   - Set Scripty contracts
   - Configure mint pricing
   - Set collection cap and wallet limit
   - Set aging thresholds (test values in minutes)
   - Set service pricing
   - Set frame progression thresholds
   - Configure royalties
   - Enable laundering
   - Configure marketplace fee
   - Configure x402 AI maintenance fees

## Fixed Settings (Not Configurable)

These settings are hardcoded in the deployment script and cannot be changed via environment variables:

### Aging Thresholds (Test Values)
- Dirt Level 1: 1 minute (normally 1 day)
- Dirt Level 2: 2 minutes (normally 3 days)
- Aging Advance: 3 minutes between levels (normally 7 days)
- Free Clean: 5 minutes after mint (normally 14 days)
- Free Clean Window: 2 minutes after cleaning (normally 5 days)

### Service Pricing
- Cleaning Cost: 0.00001 ETH
- Restoration Cost: 0.00001 ETH
- Master Restoration Cost: 0.00001 ETH
- Laundering Threshold: 0.00001 ETH

### Frame Thresholds
- Bronze: 50 maintenance points
- Silver: 150 maintenance points
- Gold: 300 maintenance points
- Diamond: 600 maintenance points

### Other Fixed Settings
- Laundering: Enabled by default
- AI Service Fee: 0 ETH (disabled)
- Line Prices: All set to 0 (only base price is used)

## Example Deployment

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key_here
export ROYALTY_PERCENTAGE=1000  # 10%
export MARKETPLACE_FEE_BPS=250  # 2.5%
export POOL_PERCENTAGE=100      # 1%
export BASE_PRICE=30000000000000  # 0.00003 ETH
export COLLECTION_CAP=10000
export WALLET_LIMIT=7
export SERVICE_FEE=420000000000000  # 0.00042 ETH

# Run deployment
forge script script/DeployBaseSepolia.s.sol:DeployBaseSepolia \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

## Post-Deployment Configuration

After deployment, the following can be changed by the contract owner:

- **Marketplace Fee**: Can be updated via `RugMarketplaceFacet.setMarketplaceFee()`
- **Royalty Configuration**: Can be updated via `RugCommerceFacet.configureRoyalties()`
- **Pool Percentage**: Can be updated via `RugCommerceFacet.setPoolPercentage()`
- **Mint Pricing**: Can be updated via `RugAdminFacet.updateMintPricing()`
- **Collection Cap**: Can be updated via `RugAdminFacet.updateCollectionCap()`
- **Wallet Limit**: Can be updated via `RugAdminFacet.updateWalletLimit()`
- **Service Pricing**: Can be updated via `RugAdminFacet.updateServicePricing()`
- **Service Fee**: Can be updated via `RugAdminFacet.setServiceFee()`
- **Fee Recipient**: Can be updated via `RugAdminFacet.setFeeRecipient()`

## Royalty Distribution Breakdown

When an NFT is sold, royalties are distributed as follows:

1. **Total Royalty** (`ROYALTY_PERCENTAGE`): 10% (1000 basis points) by default
   - This is the **TOTAL** royalty percentage that includes all three components:
   - **Curator (Minter)**: 1% (100 basis points) - **HARDCODED, NOT CONFIGURABLE**
     - Goes to the address that minted the NFT (stored in `RugData.curator`)
     - Automatically deducted first from total royalty
   - **Diamond Frame Pool**: Configurable via `POOL_PERCENTAGE` (default 1% = 100 basis points)
     - Goes to the pool contract
     - Deducted after curator royalty
   - **Creator**: Remaining amount = `ROYALTY_PERCENTAGE - 100 - POOL_PERCENTAGE`
     - Default: 8% (800 basis points) when total is 10% and pool is 1%
     - Goes to royalty recipients configured via `configureRoyalties()`

2. **Marketplace Fee**: Configurable via `MARKETPLACE_FEE_BPS` (default 0%)
   - Deducted from sale price before royalties

3. **Seller Receives**: Sale price - marketplace fee - total royalties

### Example Calculation (Default Settings)

For a 1 ETH sale with default settings:
- **Sale Price**: 1 ETH
- **Marketplace Fee**: 0 ETH (0%)
- **Total Royalty**: 0.1 ETH (10%)
  - Curator: 0.01 ETH (1%) - hardcoded
  - Pool: 0.01 ETH (1%) - configurable
  - Creator: 0.08 ETH (8%) - remaining
- **Seller Receives**: 0.9 ETH

## Summary: Configurable vs Hardcoded Settings

### ✅ Configurable Settings (via Environment Variables)
1. **ROYALTY_PERCENTAGE** - Total royalty (default: 10%)
2. **POOL_PERCENTAGE** - Pool share of royalties (default: 1%)
3. **MARKETPLACE_FEE_BPS** - Marketplace fee (default: 0%)
4. **BASE_PRICE** - Minting price (default: 0.00003 ETH)
5. **COLLECTION_CAP** - Max NFTs (default: 10000)
6. **WALLET_LIMIT** - Max mints per wallet (default: 10)
7. **SERVICE_FEE** - AI maintenance fee (default: 0.00042 ETH)
8. **MINIMUM_CLAIMABLE_AMOUNT** - Pool minimum claim (default: 0.0001 ETH)

### ❌ Hardcoded Settings (NOT Configurable)
1. **CURATOR_ROYALTY_BPS** - Fixed at 1% (100 basis points)
   - Goes to the address that minted the NFT
   - Cannot be changed without contract modification

### Important Royalty Structure Clarification

**YES, the 10% royalty INCLUDES both pool and curator royalty.**

The `ROYALTY_PERCENTAGE` is the **TOTAL** royalty that gets distributed as:
- **Curator**: 1% (hardcoded, always deducted first)
- **Pool**: Configurable via `POOL_PERCENTAGE` (default 1%)
- **Creator**: Remaining = `ROYALTY_PERCENTAGE - 100 - POOL_PERCENTAGE`

So if `ROYALTY_PERCENTAGE = 1000` (10%) and `POOL_PERCENTAGE = 100` (1%):
- Curator gets: 1% (100 basis points) - fixed
- Pool gets: 1% (100 basis points) - configurable
- Creator gets: 8% (800 basis points) - remaining

## Notes

- All percentages are specified in basis points (1 basis point = 0.01%)
- All ETH amounts are specified in wei (1 ETH = 1e18 wei)
- The deployment script uses test values for aging thresholds (minutes instead of days) for rapid testing
- The curator (minter) royalty is automatically distributed to the address stored in `RugData.curator` when the NFT was minted
- Marketplace fees are collected by the contract and can be withdrawn by the owner via `RugMarketplaceFacet.withdrawFees()`
- **Curator royalty cannot be changed** - it's hardcoded in the contract at 1%
- **Pool percentage is configurable** but must be set before or during deployment via `POOL_PERCENTAGE` env var

