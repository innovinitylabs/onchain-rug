# NFT Cache Implementation - Integration Guide

## Overview

This implementation provides a serverless NFT metadata cache using Vercel + Upstash Redis + viem Multicall. It optimizes NFT loading for 10k+ NFTs by batching blockchain reads and implementing smart caching with stale-while-revalidate pattern.

## Architecture

- **Upstash Redis**: Persistent serverless cache (not in-memory)
- **Vercel Cron**: Background refresh of metadata every 5 minutes
- **viem Multicall**: Batch blockchain reads (backend only, 100 calls per batch)
- **Stale-While-Revalidate**: Serve cached data immediately, refresh in background

## Files Created

1. `lib/redis.ts` - Upstash Redis client and key helpers
2. `lib/multicall.ts` - viem multicall utilities with chunking
3. `lib/refresh-utils.ts` - TokenURI fetching, IPFS handling, JSON parsing, hash computation
4. `app/api/metadata/[id]/route.ts` - Get cached metadata endpoint
5. `app/api/refresh-one/route.ts` - Refresh single token endpoint
6. `app/api/refresh-metadata/route.ts` - Cron endpoint for batch refresh
7. `app/api/collection/route.ts` - Paginated collection API
8. `hooks/use-cached-nfts.ts` - SWR hooks for frontend
9. `vercel.json` - Cron configuration
10. Updated `app/gallery/page.tsx` - Added feature flag for cached API

## Environment Variables

### Required (New)

**If using Vercel KV (recommended - automatically set):**
When you add KV/Redis storage in Vercel, these are automatically configured:
- `KV_REST_API_URL` - Automatically set by Vercel
- `KV_REST_API_TOKEN` - Automatically set by Vercel
- `KV_REST_API_READ_ONLY_TOKEN` - Read-only token (optional)
- `REDIS_URL` - Connection string (for direct Redis clients)
- `KV_URL` - Same as REDIS_URL

**If using Upstash directly:**
Add these to your `.env` file:

```bash
# Upstash Redis (alternative to Vercel KV)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Multicall (optional - has default for most chains)
# Default: 0xcA11bde05977b3631167028862bE2a173976CA11 (Multicall3 - standard on most EVM chains)
# Only set this if your chain uses a different multicall address
MULTICALL_ADDRESS=0xcA11bde05977b3631167028862bE2a173976CA11

# Vercel Cron
VERCEL_CRON_SECRET=your-secret-key

# Cache TTL (optional - have defaults)
BATCH_SIZE=100
STATIC_TTL_SECONDS=86400  # 24 hours
DYNAMIC_TTL_SECONDS=300    # 5 minutes
TOKENURI_TTL_SECONDS=3600  # 1 hour
TOKENS_PER_CRON=200        # Tokens to process per cron run

# IPFS Gateway (optional)
IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### Already Configured

These are already in your `.env`:
- `ALCHEMY_API_KEY`
- `NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT`
- `NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT`
- RPC URLs via `lib/networks.ts`

## Setup Instructions

### 1. Set Up Redis (Vercel KV or Upstash)

**Option A: Using Vercel KV (Recommended)**
1. In your Vercel project, go to Storage → Create → KV
2. Vercel will automatically set `KV_REST_API_URL` and `KV_REST_API_TOKEN`
3. No additional configuration needed!

**Option B: Using Upstash Directly**
1. Go to [Upstash](https://upstash.com/) and create a free Redis database
2. Copy the REST URL and token
3. Add them to your `.env` file as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 2. Configure Vercel Cron

1. Add `VERCEL_CRON_SECRET` to your environment variables in Vercel
2. The cron job is configured in `vercel.json` to run every 5 minutes
3. Vercel will automatically set up the cron job when deployed

### 3. Enable Feature Flag (Optional)

To enable the cached API in the gallery:

```bash
# In .env or Vercel environment variables
NEXT_PUBLIC_USE_CACHED_NFT_API=true
```

By default, the gallery will continue using the existing Alchemy API. Set this flag to `true` to use the new cached endpoints.

## API Endpoints

### GET `/api/collection?chainId=84532&page=1`

Returns paginated collection data from cache.

**Response:**
```json
{
  "page": 1,
  "totalPages": 417,
  "totalSupply": 10000,
  "itemsPerPage": 24,
  "nfts": [
    {
      "tokenId": 0,
      "static": { ... },
      "dynamic": {
        "dirtLevel": 0,
        "agingLevel": 2,
        "owner": "0x..."
      },
      "tokenURI": "data:application/json,...",
      "cached": true
    }
  ],
  "hasMore": true
}
```

### GET `/api/metadata/[id]?chainId=84532`

Returns cached metadata for a single NFT. Returns 202 if data is missing and refresh is queued.

**Response (200):**
```json
{
  "tokenId": 1,
  "static": { ... },
  "dynamic": { ... },
  "tokenURI": "...",
  "hash": "..."
}
```

**Response (202 - Loading):**
```json
{
  "tokenId": 1,
  "loading": true
}
```

### POST `/api/refresh-one?tokenId=1&chainId=84532`

Manually refresh metadata for a single token.

### GET `/api/refresh-metadata?chainId=84532`

Cron endpoint that processes a batch of tokens. Requires `Authorization: Bearer {VERCEL_CRON_SECRET}` header.

## Testing

### Unit Tests

```bash
# TODO: Add unit tests for:
# - lib/redis.ts key helpers
# - lib/refresh-utils.ts parsing functions
```

### Integration Tests

1. **Test metadata endpoint with empty cache:**
   ```bash
   curl http://localhost:3000/api/metadata/1?chainId=84532
   # Should return 202 with { loading: true }
   ```

2. **Test collection endpoint:**
   ```bash
   curl http://localhost:3000/api/collection?chainId=84532&page=1
   # Should return paginated NFT data
   ```

3. **Test manual refresh:**
   ```bash
   curl -X POST http://localhost:3000/api/refresh-one?tokenId=1&chainId=84532
   # Should refresh and cache the token
   ```

### Manual Cron Test

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/refresh-metadata?chainId=84532
```

### Performance Test

```bash
# Simulate 100 concurrent requests
for i in {1..100}; do
  curl http://localhost:3000/api/collection?chainId=84532&page=1 &
done
wait
# Target: <200ms median response time
```

## Migration Strategy

1. **Phase 1: Setup** (Current)
   - Set up Upstash Redis
   - Configure environment variables
   - Deploy to staging

2. **Phase 2: Testing**
   - Run cron manually to populate cache
   - Test API endpoints
   - Verify cache is working

3. **Phase 3: Gradual Rollout**
   - Enable feature flag for subset of users
   - Monitor performance and errors
   - Gradually increase usage

4. **Phase 4: Full Migration**
   - Enable feature flag globally
   - Monitor for issues
   - Keep Alchemy API as fallback

5. **Phase 5: Cleanup**
   - Remove old Alchemy sequential calls
   - Remove feature flag
   - Optimize cache TTLs based on usage

## Redis Key Structure

- `nft:static:{chainId}:{contract}:{tokenId}` - Static traits (TTL: 24h)
- `nft:tokenuri:{chainId}:{contract}:{tokenId}` - TokenURI JSON (TTL: 1h)
- `nft:dynamic:{chainId}:{contract}:{tokenId}` - Dirt/aging levels (TTL: 5min)
- `nft:hash:{chainId}:{contract}:{tokenId}` - SHA256 hash of tokenURI
- `nft:collection:{chainId}:{contract}:page:{page}` - Paginated collection cache
- `nft:refresh-offset:{chainId}:{contract}` - Cron offset for incremental refresh

## Important Notes

### Serverless-Safe

All cache operations use Upstash Redis. No in-memory Maps are used across requests. This ensures the cache persists across serverless function invocations.

### TokenId Enumeration

The implementation assumes continuous token IDs (0 to totalSupply-1). If your collection uses non-contiguous token IDs, you'll need to:

1. Store a list of token IDs in Redis
2. Modify `batchRefreshRange` in `lib/refresh-utils.ts` to use this list
3. Update the cron job to iterate over the list instead of a range

### IPFS Handling

The implementation uses a gateway URL for IPFS. For stronger decentralization, consider:
- Adding IPFS pinning service integration
- Using multiple gateways with fallback
- Implementing IPFS cluster support

### ABI Adaptation

The code uses `onchainRugsABI` from `lib/web3.ts`. If your ABI structure differs, you may need to:
- Update function names in `lib/multicall.ts`
- Adjust return type parsing
- Add additional contract functions as needed

## Troubleshooting

### Cache Not Updating

1. Check Redis connection: 
   - If using Vercel KV: Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set (should be automatic)
   - If using Upstash: Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
2. Check cron job: Verify it's running in Vercel dashboard
3. Check logs: Look for errors in Vercel function logs

### Slow Performance

1. Increase `BATCH_SIZE` if RPC supports it
2. Reduce `TOKENS_PER_CRON` to avoid timeouts
3. Check RPC rate limits

### Missing Data

1. Verify contract address is correct for the chain
2. Check if tokens exist (totalSupply > 0)
3. Manually trigger refresh: `POST /api/refresh-one?tokenId=1`

## TODO Items

- [ ] Add unit tests for Redis key helpers
- [ ] Add integration tests for API endpoints
- [ ] Implement error retry logic with exponential backoff
- [ ] Add monitoring/alerting for cache hit rates
- [ ] Optimize cache TTLs based on production usage
- [ ] Add support for non-contiguous token IDs if needed
- [ ] Implement IPFS pinning if required
- [ ] Add rate limiting for API endpoints
- [ ] Add cache invalidation on maintenance actions

## Support

For issues or questions:
1. Check the logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Test endpoints manually using curl
4. Check Redis keys using Upstash console

