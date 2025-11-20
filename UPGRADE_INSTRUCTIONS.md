# Diamond Frame Pool Integration - Base Sepolia Upgrade Instructions

## Overview

This upgrade adds Diamond Frame Pool functionality to your existing Base Sepolia deployment. The pool allows diamond frame NFT holders to claim a share of 1% of all royalties generated from NFT sales.

## Prerequisites

1. **Existing Diamond Address**: You need your deployed OnchainRugs diamond contract address on Base Sepolia
2. **Private Key**: Set up your `PRIVATE_KEY` or `TESTNET_PRIVATE_KEY` environment variable
3. **Base Sepolia RPC**: Ensure you have access to Base Sepolia RPC endpoint

## Files Created

1. `script/UpgradeDiamondFramePoolIntegration.s.sol` - Full upgrade script
2. `script/DeployDiamondFramePool.s.sol` - Existing pool deployment script (updated for testing)

## Deployment Steps

### Option 1: Full Upgrade (Recommended)

1. **Configure the upgrade script**:
   ```bash
   # Edit script/UpgradeDiamondFramePoolIntegration.s.sol
   # Replace these constants with your actual deployed addresses:
   address public constant EXISTING_DIAMOND = 0x0000000000000000000000000000000000000000; // Your diamond address
   address public constant EXISTING_DIAMOND_CUT_FACET = 0x0000000000000000000000000000000000000000; // Your diamond cut facet
   ```

2. **Run the upgrade**:
   ```bash
   forge script script/UpgradeDiamondFramePoolIntegration.s.sol \
     --rpc-url https://sepolia.base.org \
     --broadcast \
     --verify \
     --etherscan-api-key YOUR_BASESCAN_API_KEY
   ```

### Option 2: Pool-Only Deployment (For Testing)

1. **Use the existing deployment script**:
   ```bash
   # Set environment variables
   export DIAMOND_ADDRESS=0x0000000000000000000000000000000000000000  # Your diamond address
   export MINIMUM_CLAIMABLE_AMOUNT=1000000000000000  # 0.001 ETH in wei
   export POOL_PERCENTAGE=100  # 1% in basis points
   ```

2. **Deploy just the pool**:
   ```bash
   forge script script/DeployDiamondFramePool.s.sol \
     --rpc-url https://sepolia.base.org \
     --broadcast \
     --verify \
     --etherscan-api-key YOUR_BASESCAN_API_KEY
   ```

3. **Manually configure the pool in your diamond** (if not using full upgrade):
   ```bash
   # After deployment, call these functions on your diamond:
   # setPoolContract(POOL_ADDRESS)
   # setPoolPercentage(100) // 1% = 100 basis points
   ```

## Configuration Details

- **Pool Percentage**: 1% of all royalties (100 basis points)
- **Minimum Claimable Amount**: 0.001 ETH to prevent dust claims
- **Claim Mechanism**: Manual claims by diamond frame NFT holders
- **Distribution**: Equal share per diamond frame NFT owned

## New Features Added

### RugCommerceFacet Updates
- `setPoolContract(address poolContract)` - Set pool contract address
- `setPoolPercentage(uint256 poolPercentage)` - Set royalty percentage for pool
- `claimPoolRoyalties(uint256[] calldata tokenIds)` - Claim pool royalties for diamond frames
- `getPoolConfig()` - Get current pool configuration
- `emergencyWithdrawFromPool(address recipient, uint256 amount)` - Emergency withdrawal

### RugAgingFacet Updates
- `getDiamondFrameCount()` - Get total diamond frame NFTs
- `hasDiamondFrame(uint256 tokenId)` - Check if token has diamond frame
- `getDiamondFrameTokenIds()` - Get all diamond frame token IDs

### DiamondFramePool Contract
- Standalone contract for royalty pool management
- Reentrancy protection
- Gas-optimized claim mechanism
- Emergency withdrawal functionality

## Testing the Integration

After deployment, you can test the functionality:

1. **Mint some NFTs** and advance them to diamond frame status
2. **Make sales** to generate royalties (1% goes to pool)
3. **Claim pool royalties** using `claimPoolRoyalties([tokenIds])`
4. **Verify pool balance** and claimable amounts

## Environment Variables

Make sure your `.env` file contains:

```bash
PRIVATE_KEY=your_private_key_without_0x
BASE_RPC=https://sepolia.base.org
ETHERSCAN_API_KEY=your_basescan_api_key
```

## Troubleshooting

- **"Can't add function that already exists"**: Function selector collision - ensure you're using Replace action for existing facets
- **"LibDiamond: Must be contract owner"**: Make sure you're using the correct deployer account
- **Gas estimation failed**: Try lowering gas limit or checking contract logic

## Security Notes

- The pool contract includes reentrancy protection
- Claims require diamond frame verification through the diamond contract
- Emergency withdrawal is owner-only through the diamond
- All funds are isolated in the separate pool contract

## Final Summary

✅ **Diamond Frame Pool Integration Complete**

- **Pool Contract**: Standalone royalty pool for diamond frame NFT holders
- **Facet Updates**: All facets updated with diamond frame tracking functionality
- **Security**: Reentrancy protection, access controls, and emergency recovery
- **Gas Optimization**: Direct storage access and optimized claim mechanisms
- **Testing Ready**: Scripts prepared for Base Sepolia deployment and testing

**Ready for production deployment with all security fixes applied!** 🚀
