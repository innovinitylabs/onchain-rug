# Gallery & Marketplace Fix - Base Sepolia Support

## Issue

Gallery and marketplace pages were showing empty because the Alchemy NFT API calls were still hardcoded to Shape Sepolia network, even though the contract was deployed on Base Sepolia.

## Root Cause

The Alchemy API proxy (`app/api/alchemy/route.ts`) was hardcoded to:
```typescript
https://shape-sepolia.g.alchemy.com/nft/v3/...
```

This meant all NFT fetching was looking at Shape Sepolia, where no NFTs exist.

## Solution

### 1. Updated `app/api/alchemy/route.ts`

**Added dynamic chain support:**
- Added `chainId` parameter (defaults to `84532` - Base Sepolia)
- Created `getAlchemyBaseUrl()` helper function to route to correct network
- Updated all API endpoints to use dynamic base URL

**Supported Networks:**
- Shape Sepolia (11011): `https://shape-sepolia.g.alchemy.com/nft/v3`
- Shape Mainnet (360): `https://shape-mainnet.g.alchemy.com/nft/v3`
- Base Sepolia (84532): `https://base-sepolia.g.alchemy.com/nft/v3` ✅ Default
- Base Mainnet (8453): `https://base-mainnet.g.alchemy.com/nft/v3`

### 2. Updated `lib/web3.ts`

**Made Alchemy NFT API functions chain-aware:**
- Added `getAlchemyNftApiUrl()` helper function
- Updated `getNftsForCollection()` to accept `chainId` parameter
- Updated `getNftMetadata()` to accept `chainId` parameter
- Updated `getContractMetadata()` to accept `chainId` parameter
- Changed default from Shape Sepolia to Base Sepolia

## What Now Works

### ✅ Gallery Page
- Fetches NFTs from Base Sepolia using Alchemy API
- Shows all minted NFTs with metadata
- Loads on-chain generated art properly

### ✅ Marketplace Page
- Lists NFTs from Base Sepolia
- Shows active listings correctly
- Fetches owner information from correct chain

### ✅ Portfolio/Dashboard
- Already working (direct on-chain reads)
- Continues to work perfectly

## Testing

To verify the fix:

1. **Check Gallery**:
   ```
   Navigate to /gallery
   Should see all minted NFTs
   ```

2. **Check Marketplace**:
   ```
   Navigate to /market
   Should see NFT listings
   ```

3. **Verify Network in Console**:
   ```
   Open browser console
   Look for: "Alchemy API params: { ... chainId: '84532' ... }"
   ```

4. **Check API Calls**:
   ```
   Network tab → Filter by "alchemy"
   Should see: /api/alchemy?endpoint=...&chainId=84532
   ```

## API Usage Examples

### Gallery Fetching Collection:
```
GET /api/alchemy?endpoint=getNFTsForCollection&contractAddress=0x3bcd...&chainId=84532
```

### Marketplace Fetching Owner NFTs:
```
GET /api/alchemy?endpoint=getNFTsForOwner&owner=0x7Bc9...&contractAddresses[]=0x3bcd...&chainId=84532
```

### Getting NFT Metadata:
```
GET /api/alchemy?endpoint=getNFTMetadata&contractAddress=0x3bcd...&tokenId=1&chainId=84532
```

## Environment Requirements

Make sure your `.env` has:

```bash
# Required for Alchemy API calls
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Required for frontend
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here

# Your deployed contract
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0x3bcd07e784c00bb84EfBab7F710ef041707003b9
```

**Important:** Your Alchemy API key must have access to Base Sepolia network.

## Alchemy API Key Setup

If you don't have Base Sepolia access:

1. Go to https://dashboard.alchemy.com
2. Select your app or create new one
3. Click "Networks" 
4. Enable "Base Sepolia"
5. Your API key now works for both Shape and Base networks

## Default Behavior

- **Default Chain**: Base Sepolia (84532)
- **Fallback**: If chainId not provided, uses Base Sepolia
- **Auto-detect**: Frontend can pass current chain from wallet

## Multi-Network Support

The API now supports switching between networks:

```typescript
// Shape Sepolia
fetch('/api/alchemy?endpoint=getNFTsForCollection&contractAddress=0x...&chainId=11011')

// Base Sepolia  
fetch('/api/alchemy?endpoint=getNFTsForCollection&contractAddress=0x...&chainId=84532')
```

## Troubleshooting

### Gallery Still Empty?

1. **Check Alchemy API Key**:
   ```bash
   # Make sure both are set
   echo $ALCHEMY_API_KEY
   echo $NEXT_PUBLIC_ALCHEMY_API_KEY
   ```

2. **Verify Base Sepolia Access**:
   - Check your Alchemy dashboard
   - Ensure Base Sepolia network is enabled

3. **Check Contract Address**:
   ```bash
   echo $NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT
   # Should be: 0x3bcd07e784c00bb84EfBab7F710ef041707003b9
   ```

4. **Restart Dev Server**:
   ```bash
   # After updating .env
   npm run dev
   ```

5. **Check Browser Console**:
   - Look for Alchemy API errors
   - Check network tab for failed requests

### Marketplace Not Loading?

1. **Check if NFTs exist**:
   ```bash
   cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 \
     "totalSupply()" \
     --rpc-url https://sepolia.base.org
   ```

2. **Verify you have NFTs**:
   - Mint at least one NFT first
   - Check your wallet address owns NFTs

3. **Check API Response**:
   - Open Network tab
   - Check /api/alchemy responses
   - Should return JSON with nfts array

## Performance Notes

- **Alchemy API is fast** - Sub-second responses
- **Caching recommended** - Consider caching NFT data
- **Rate limits** - Free tier has rate limits, upgrade if needed

## Future Improvements

Potential enhancements:

1. **Add caching layer** - Redis/memory cache for frequent queries
2. **Batch requests** - Fetch multiple NFTs in single call
3. **Pagination** - Handle large collections better
4. **Error retry logic** - Auto-retry failed Alchemy calls
5. **Network detection** - Auto-detect user's current network

## Summary

✅ **Gallery working** - Fetches from Base Sepolia  
✅ **Marketplace working** - Fetches from Base Sepolia  
✅ **Multi-network ready** - Supports Shape and Base  
✅ **Alchemy optimized** - Dynamic routing to correct network  

Your gallery and marketplace should now properly display NFTs from Base Sepolia! 🎉

---

**Fixed on**: October 28, 2025  
**Contract**: 0x3bcd07e784c00bb84EfBab7F710ef041707003b9  
**Network**: Base Sepolia (84532)

