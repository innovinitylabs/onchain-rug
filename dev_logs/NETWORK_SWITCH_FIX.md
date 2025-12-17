# Network Switch Fix for Gallery, Dashboard, and Marketplace

## Issue

The gallery, marketplace, and dashboard pages were not properly passing the `chainId` parameter to the Alchemy API, causing them to always fetch data from the default network instead of the currently connected network.

## Root Cause

When users switched networks in their wallet (e.g., from Base Sepolia to Shape Sepolia), the frontend components were:
1. Using the correct contract address for the selected network
2. But NOT passing the `chainId` to the Alchemy API endpoint
3. This caused the Alchemy API to use the default network, resulting in empty or incorrect data

## Fix Applied

Updated all Alchemy API calls to include the `chainId` parameter:

### Files Modified

#### 1. **app/gallery/page.tsx**
- Added `chainId` parameter to `getNFTsForCollection` call (line 118)
- Added `chainId` parameter to `getNFTMetadata` call (line 136)
- Updated `useEffect` dependency array to include `chainId` (line 168)

**Before:**
```typescript
const response = await fetch(
  `/api/alchemy?endpoint=getNFTsForCollection&contractAddress=${resolvedContractAddress}`
)
```

**After:**
```typescript
const response = await fetch(
  `/api/alchemy?endpoint=getNFTsForCollection&contractAddress=${resolvedContractAddress}&chainId=${chainId}`
)
```

#### 2. **app/dashboard/page.tsx**
- Added `chainId` parameter to `getTokenIdByIndex` call (line 293)

**Before:**
```typescript
const ownerResponse = await fetch(`${window.location.origin}/api/alchemy?endpoint=getTokenIdByIndex&contractAddress=${contractAddress}&owner=${address}&index=0`)
```

**After:**
```typescript
const ownerResponse = await fetch(`${window.location.origin}/api/alchemy?endpoint=getTokenIdByIndex&contractAddress=${contractAddress}&owner=${address}&index=0&chainId=${chainId}`)
```

#### 3. **app/market/page.tsx**
- Added `chainId` parameter to `getNFTsForCollection` call (line 85)
- Added `chainId` parameter to `getNFTMetadata` call (line 98)
- Updated `useEffect` dependency array to include `chainId` (line 162)

**Before:**
```typescript
const response = await fetch(
  `/api/alchemy?endpoint=getNFTsForCollection&contractAddress=${contractAddress}`
)
```

**After:**
```typescript
const response = await fetch(
  `/api/alchemy?endpoint=getNFTsForCollection&contractAddress=${contractAddress}&chainId=${chainId}`
)
```

## How It Works Now

### Network Detection Flow

1. **User connects wallet** → `useChainId()` hook detects the chain (e.g., Base Sepolia = 84532)
2. **Contract address selection** → `contractAddresses[chainId]` returns the correct contract for that network
3. **Alchemy API routing** → `chainId` parameter routes to the correct Alchemy network endpoint
4. **Data display** → NFTs from the correct network are displayed

### Example User Flow

**Scenario: User switches from Base Sepolia to Shape Sepolia**

1. **Initial state (Base Sepolia)**:
   - `chainId = 84532`
   - `contractAddress = 0xa43532205Fc90b286Da98389a9883347Cc4064a8`
   - Alchemy API: `https://base-sepolia.g.alchemy.com/nft/v3/...`
   - ✅ Shows Base Sepolia NFTs

2. **User switches network in wallet**:
   - Wallet changes to Shape Sepolia (11011)
   - `useChainId()` hook detects the change
   - `useEffect` triggers re-fetch with new `chainId`

3. **New state (Shape Sepolia)**:
   - `chainId = 11011`
   - `contractAddress = 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325`
   - Alchemy API: `https://shape-sepolia.g.alchemy.com/nft/v3/...`
   - ✅ Shows Shape Sepolia NFTs

## Testing

To verify the fix works:

### Test 1: Base Sepolia
```bash
1. Connect wallet to Base Sepolia (84532)
2. Visit /gallery → Should show Base Sepolia NFTs
3. Visit /dashboard → Should show your Base Sepolia NFTs
4. Visit /market → Should show Base Sepolia marketplace
```

### Test 2: Shape Sepolia
```bash
1. Switch wallet to Shape Sepolia (11011)
2. Visit /gallery → Should show Shape Sepolia NFTs
3. Visit /dashboard → Should show your Shape Sepolia NFTs
4. Visit /market → Should show Shape Sepolia marketplace
```

### Test 3: Network Switching
```bash
1. Start on Base Sepolia
2. Mint/view an NFT
3. Switch to Shape Sepolia in wallet
4. Gallery/Dashboard/Market should update automatically
5. Switch back to Base Sepolia
6. Should show Base NFTs again
```

## Benefits

✅ **Automatic Network Detection** - No manual configuration needed  
✅ **Seamless Switching** - Switch networks in wallet, app updates automatically  
✅ **Correct Data Display** - Always shows NFTs from the connected network  
✅ **Multi-Network Support** - Works for all 4 networks (Shape/Base Sepolia/Mainnet)  
✅ **No Breaking Changes** - Backwards compatible with existing code

## Related Files

- **API Handler**: `app/api/alchemy/route.ts` - Already had dynamic `chainId` routing
- **Web3 Config**: `lib/web3.ts` - Contract address mapping by `chainId`
- **Hooks**: `hooks/use-network-contract.ts` - Helper hook for network detection

## Network-Specific Alchemy Endpoints

The API automatically routes to the correct endpoint based on `chainId`:

| Chain ID | Network | Alchemy Endpoint |
|----------|---------|------------------|
| 11011 | Shape Sepolia | `https://shape-sepolia.g.alchemy.com/nft/v3/...` |
| 360 | Shape Mainnet | `https://shape-mainnet.g.alchemy.com/nft/v3/...` |
| 84532 | Base Sepolia | `https://base-sepolia.g.alchemy.com/nft/v3/...` |
| 8453 | Base Mainnet | `https://base-mainnet.g.alchemy.com/nft/v3/...` |

## Summary

This fix ensures that the **Gallery**, **Dashboard**, and **Marketplace** pages properly support multi-network operation by:

1. Passing `chainId` to all Alchemy API calls
2. Re-fetching data when `chainId` changes
3. Displaying NFTs from the correct network

Users can now seamlessly switch between Shape and Base networks, and the app will automatically show the correct NFTs for each network! 🎉

---

**Date**: October 28, 2025  
**Status**: ✅ Complete  
**Impact**: Gallery, Dashboard, Marketplace now support network switching

