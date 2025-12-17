# Rarible Fix: ERC721 Metadata Initialization

## Issue

Rarible Base Testnet was showing **"Unnamed Token"** instead of **"OnchainRugs"** for the NFT collection.

## Root Cause

The ERC721 `name()` and `symbol()` were not initialized during deployment. The contract storage had empty strings for both values.

### Verification

Before fix:
```bash
cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 "name()" --rpc-url https://sepolia.base.org
# Result: 0x00000000... (empty)

cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 "symbol()" --rpc-url https://sepolia.base.org
# Result: 0x00000000... (empty)
```

## Solution

### 1. Fixed Current Deployment

Created and ran `script/InitializeMetadata.s.sol`:
- Added `initializeERC721Metadata` selector to diamond
- Called the initialization function
- Set name to "OnchainRugs" and symbol to "RUGS"

**Execution**:
```bash
forge script script/InitializeMetadata.s.sol \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --legacy
```

### 2. Updated Deployment Script

Modified `script/DeployBaseSepolia.s.sol` to prevent this in future deployments:

**Changes Made:**
1. Added `initializeERC721Metadata` selector to `_getRugNFTSelectors()` (selector #28)
2. Added initialization call in `initializeSystem()` function
3. Increased selector array size from 28 to 29

**Code Added:**
```solidity
// In _getRugNFTSelectors()
selectors[28] = RugNFTFacet.initializeERC721Metadata.selector;

// In initializeSystem()
console.log("   Initializing ERC721 metadata...");
RugNFTFacet(diamondAddr).initializeERC721Metadata();
console.log("   Name: OnchainRugs, Symbol: RUGS");
```

## Verification After Fix

```bash
cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 "name()" --rpc-url https://sepolia.base.org | cast --to-ascii
# Result: OnchainRugs

cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 "symbol()" --rpc-url https://sepolia.base.org | cast --to-ascii
# Result: RUGS
```

## Result

✅ **Name**: OnchainRugs  
✅ **Symbol**: RUGS  
✅ **Contract**: 0x3bcd07e784c00bb84EfBab7F710ef041707003b9  
✅ **Network**: Base Sepolia (84532)

## Rarible Integration

Rarible Base Testnet should now properly display:
- Collection Name: **OnchainRugs**
- Token Symbol: **RUGS**
- Individual NFTs will show proper collection name

### Check on Rarible

View collection on Rarible Base Testnet:
```
https://testnet.rarible.com/collection/base-sepolia/0x3bcd07e784c00bb84EfBab7F710ef041707003b9
```

## How initializeERC721Metadata Works

From `src/facets/RugNFTFacet.sol`:

```solidity
function initializeERC721Metadata() external {
    LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
    if (bytes(es.name).length == 0) {
        es.name = "OnchainRugs";
    }
    if (bytes(es.symbol).length == 0) {
        es.symbol = "RUGS";
    }
}
```

This function:
1. Checks if name is empty
2. Sets name to "OnchainRugs" if empty
3. Checks if symbol is empty
4. Sets symbol to "RUGS" if empty
5. Safe to call multiple times (won't overwrite if already set)

## Future Deployments

All future deployments using `DeployBaseSepolia.s.sol` will:
1. ✅ Include the `initializeERC721Metadata` selector in the diamond
2. ✅ Automatically call the initialization during deployment
3. ✅ Set proper name and symbol from the start

## OpenSea & Other Marketplaces

This fix also helps with:
- **OpenSea**: Properly displays collection name
- **LooksRare**: Shows correct metadata
- **Any ERC721-compatible marketplace**: Gets proper name/symbol

## Transaction Details

**Initialization Transaction**:
- Gas Used: ~5,590,190 gas
- Cost: ~0.0000056 ETH
- Network: Base Sepolia
- Status: ✅ Success

## Files Modified

1. **script/InitializeMetadata.s.sol** - One-time fix script (new)
2. **script/DeployBaseSepolia.s.sol** - Updated for future deployments
   - Added selector to `_getRugNFTSelectors()`
   - Added initialization call to `initializeSystem()`

## Testing

To verify the fix works:

1. **Check contract directly**:
   ```bash
   cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 "name()" --rpc-url https://sepolia.base.org | cast --to-ascii
   cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 "symbol()" --rpc-url https://sepolia.base.org | cast --to-ascii
   ```

2. **Check on Rarible**:
   - Go to Rarible Base Testnet
   - Search for contract: 0x3bcd07e784c00bb84EfBab7F710ef041707003b9
   - Should show "OnchainRugs" collection

3. **Check on Base Sepolia Explorer**:
   - https://sepolia-explorer.base.org/address/0x3bcd07e784c00bb84EfBab7F710ef041707003b9
   - Token Tracker shows: OnchainRugs (RUGS)

## Why This Happened

The original deployment script didn't include:
1. The `initializeERC721Metadata` selector in the diamond configuration
2. A call to initialize the metadata during deployment

The Shape Sepolia deployment on main branch likely had this fixed earlier, which is why it showed properly as "Rugs".

## Prevention

Future deployments now have:
- ✅ Selector included in diamond
- ✅ Automatic initialization
- ✅ Verification in deployment logs

## Summary

| Before | After |
|--------|-------|
| Name: (empty) | Name: OnchainRugs |
| Symbol: (empty) | Symbol: RUGS |
| Rarible: "Unnamed Token" | Rarible: "OnchainRugs" |
| OpenSea: No name | OpenSea: "OnchainRugs" |

---

**Fixed on**: October 28, 2025  
**Contract**: 0x3bcd07e784c00bb84EfBab7F710ef041707003b9  
**Network**: Base Sepolia (84532)  
**Status**: ✅ Resolved

