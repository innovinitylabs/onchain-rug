# Redis Setup Overview - Rug Market

## Infrastructure

### Redis Client
- **Provider:** Upstash Redis (serverless-safe)
- **Configuration:** Environment variables
  - `KV_REST_API_URL` - Upstash REST API URL
  - `KV_REST_API_TOKEN` - Upstash REST API token
- **Client:** `@upstash/redis` package
- **Location:** `app/api/rug-market/collection/redis.ts`

---

## Data Structures Stored

### 1. Permanent NFT Data (No TTL - Permanent Storage)
**Key Pattern:** `rugmarket:{chainId}:{contract}:nft:{tokenId}:permanent`

**Stored Fields:**
- `tokenId` (number)
- `seed` (BigInt → stored as string)
- `paletteName` (string)
- `minifiedPalette` (string)
- `minifiedStripeData` (string)
- `textRows` (string[])
- `warpThickness` (number)
- `curator` (string)
- `mintTime` (BigInt → stored as string)
- `filteredCharacterMap` (string)
- `characterCount` (BigInt → stored as string, optional)
- `stripeCount` (BigInt → stored as string, optional)
- `name` (string)
- `description` (string)
- `image` (string)

**TTL:** ❌ **No expiration** - Permanent storage (acts as database)

**Update Triggers:**
- Initial mint (from blockchain)
- Manual refresh from blockchain
- Never changes after mint (immutable data)

---

### 2. Dynamic NFT Data (No TTL - Permanent Storage)
**Key Pattern:** `rugmarket:{chainId}:{contract}:nft:{tokenId}:dynamic`

**Stored Fields:**
- `baseAgingLevel` (number) - Stored base aging level from contract
- `frameLevel` (string) - "None", "Bronze", "Silver", "Gold", "Diamond"
- `maintenanceScore` (BigInt → stored as string)
- `lastCleaned` (BigInt → stored as string, in seconds)
- `cleaningCount` (number, optional)
- `restorationCount` (number, optional)
- `masterRestorationCount` (number, optional)
- `launderingCount` (number, optional)
- `currentOwner` (string)
- `ownershipHistory` (array) - Each entry has `acquiredAt` (BigInt → string)
- `saleHistory` (array) - Each entry has `timestamp` (BigInt → string)
- `isListed` (boolean)
- `listingPrice` (string, optional)
- `listingSeller` (string, optional)
- `listingExpiresAt` (BigInt → string, optional)
- `listingTxHash` (string, optional)
- `lastSalePrice` (BigInt → string, optional)
- `lastUpdated` (BigInt → stored as string)

**NOT Stored (Calculated on Read):**
- ❌ `dirtLevel` - Calculated from `lastCleaned` + `frameLevel` + contract config
- ❌ `agingLevel` - Calculated from `lastCleaned` + `frameLevel` + `baseAgingLevel` + contract config

**TTL:** ❌ **No expiration** - Permanent storage (acts as database)

**Update Triggers:**
- **Maintenance actions:** After clean/restore/master restore transactions
  - Updates `lastCleaned` timestamp
  - Updates `baseAgingLevel` (for restore/master restore)
  - Updates `frameLevel` (if maintenance score changes)
  - Updates maintenance counts
- **Marketplace actions:** After listing/delisting/sale
  - Updates `isListed`, `listingPrice`, `listingSeller`
  - Updates `currentOwner` and `ownershipHistory`
  - Updates `saleHistory` and `lastSalePrice`
- **Manual refresh:** Force refresh from blockchain
- **Blockchain fallback:** When cache miss, fetched from blockchain

---

### 3. Contract Configuration Cache (24-Hour TTL)
**Key Pattern:** `rugmarket:contract:config:{chainId}`

**Stored Fields:**
- `dirtLevel1Days` (BigInt → stored as string)
- `dirtLevel2Days` (BigInt → stored as string)
- `agingAdvanceDays` (BigInt → stored as string)
- `freeCleanDays` (BigInt → stored as string)
- `freeCleanWindow` (BigInt → stored as string)
- `lastUpdated` (number) - Timestamp in milliseconds
- `chainId` (number)

**TTL:** ⏰ **24 hours** (86,400 seconds)

**Update Triggers:**
- **Automatic:** On cache miss or expiration
- **Manual:** Via `ContractConfigCache.refreshConfig(chainId)`
- **Invalidation:** Via `ContractConfigCache.invalidateConfig(chainId)`

**Fetch Source:** Blockchain contract `getAgingThresholds()` function

---

### 4. Activity Feed (7-Day TTL)
**Key Pattern:** `rugmarket:{chainId}:{contract}:activity`

**Data Structure:** Redis Sorted Set (ZSET)
- **Score:** Timestamp (number)
- **Member:** JSON stringified `MarketplaceActivity` object

**Activity Fields:**
- `id` (string) - `${action}-${tokenId}-${timestamp}`
- `type` (string) - "maintenance", "listing", "delisting", "sale", "transfer"
- `tokenId` (number)
- `timestamp` (BigInt)
- `txHash` (string)
- `price` (string, optional)
- `from` (string, optional)
- `to` (string, optional)

**TTL:** ⏰ **7 days** (604,800 seconds)

**Update Triggers:**
- Maintenance actions
- Listing/delisting actions
- Sale/transfer events

**Retention:** Keeps last 1000 activities, older ones automatically removed

---

### 5. Collection Statistics (No TTL)
**Key Pattern:** `rugmarket:{chainId}:{contract}:collection`

**Stored Fields:**
- Various collection-level statistics
- `lastUpdated` (BigInt → stored as string)

**TTL:** ❌ **No expiration** - Permanent storage

**Update Triggers:**
- Periodic updates from stats API
- Manual refresh

---

### 6. Rate Limiting Keys (5-Second TTL)
**Key Pattern:** `rugmarket:refresh:ratelimit:{chainId}:{contract}:{tokenId}`

**Stored Value:** Timestamp (number) - `Date.now()`

**TTL:** ⏰ **5 seconds**

**Purpose:** Prevents refresh spam (5-second cooldown per NFT)

**Update Triggers:**
- After successful refresh operation

---

### 7. Lock Keys (30-90 Second TTL)
**Key Patterns:**
- `rugmarket:refresh:lock:{chainId}:{contract}:{tokenId}` - Refresh operations
- `rugmarket:update:lock:{chainId}:{contract}:{tokenId}` - Update operations

**Stored Value:** `"1"` (string)

**TTL:**
- **Refresh lock:** ⏰ **90 seconds** (with automatic renewal every 60s)
- **Update lock:** ⏰ **30 seconds**

**Purpose:** Prevents concurrent operations on same NFT

**Update Triggers:**
- Acquired at start of operation
- Released on completion or error
- Auto-expires if operation hangs

---

## Key Naming Conventions

### Rug Market Keys (Primary)
```
rugmarket:{chainId}:{contract}:nft:{tokenId}:permanent
rugmarket:{chainId}:{contract}:nft:{tokenId}:dynamic
rugmarket:{chainId}:{contract}:collection
rugmarket:{chainId}:{contract}:activity
rugmarket:contract:config:{chainId}
```

### Operational Keys
```
rugmarket:refresh:ratelimit:{chainId}:{contract}:{tokenId}
rugmarket:refresh:lock:{chainId}:{contract}:{tokenId}
rugmarket:update:lock:{chainId}:{contract}:{tokenId}
```

### Legacy Keys (Old System - Not Used in Rug Market)
```
nft:static:{chainId}:{contract}:{tokenId}
nft:dynamic:{chainId}:{contract}:{tokenId}
nft:tokenuri:{chainId}:{contract}:{tokenId}
nft:collection:{chainId}:{contract}:page:{page}
nft:refresh-offset:{chainId}:{contract}
```

---

## Data Update Mechanisms

### 1. Initial Population
**When:** NFT first accessed or collection fetch
**How:**
1. Check Redis cache
2. If miss → Fetch from blockchain
3. Store in Redis (permanent + dynamic data)
4. Return with calculated values

### 2. Event-Driven Updates
**Maintenance Actions:**
1. User performs maintenance (clean/restore/master restore)
2. Transaction confirmed on blockchain
3. Frontend calls `/api/rug-market/nft/{tokenId}/update`
4. Updates `lastCleaned`, `baseAgingLevel`, `frameLevel` in Redis
5. Then calls refresh API to fetch fresh data from blockchain

**Marketplace Actions:**
1. User lists/delists/sells NFT
2. Transaction confirmed
3. Frontend calls `/api/rug-market/nft/{tokenId}/update`
4. Updates listing/sale data in Redis

### 3. Manual Refresh
**When:** User clicks refresh button
**How:**
1. Rate limit check (5-second cooldown)
2. Lock acquisition (prevents concurrent refreshes)
3. Fetch fresh data from blockchain
4. Update Redis cache
5. Return fresh data with calculated values
6. Release lock

### 4. Automatic Refresh
**When:** Cache miss on read
**How:**
1. `getNFTData()` called
2. Check Redis for permanent + dynamic data
3. If either missing → Fetch from blockchain
4. Store in Redis
5. Calculate `dirtLevel` and `agingLevel` on read
6. Return with calculated values

---

## TTL and Expiration Summary

| Data Type | TTL | Expiration Behavior |
|-----------|-----|---------------------|
| **Permanent NFT Data** | ❌ None | Never expires (permanent storage) |
| **Dynamic NFT Data** | ❌ None | Never expires (permanent storage) |
| **Contract Config** | ⏰ 24 hours | Auto-refreshes from blockchain on expiration |
| **Activity Feed** | ⏰ 7 days | Auto-expires, keeps last 1000 entries |
| **Collection Stats** | ❌ None | Never expires (permanent storage) |
| **Rate Limit Keys** | ⏰ 5 seconds | Auto-expires, prevents spam |
| **Refresh Locks** | ⏰ 90 seconds | Auto-expires, prevents hanging locks |
| **Update Locks** | ⏰ 30 seconds | Auto-expires, prevents hanging locks |

---

## Cache Invalidation Strategies

### 1. No Automatic Invalidation
**Permanent & Dynamic Data:**
- ❌ No automatic expiration
- ✅ Updated on events (maintenance, marketplace)
- ✅ Can be manually refreshed
- ✅ Falls back to blockchain on read if missing

### 2. Time-Based Expiration
**Contract Config:**
- ⏰ Expires after 24 hours
- 🔄 Auto-refreshes from blockchain on expiration
- 🗑️ Can be manually invalidated via `invalidateConfig()`

**Activity Feed:**
- ⏰ Expires after 7 days
- 📊 Keeps last 1000 entries
- 🗑️ Old entries automatically removed

**Rate Limits & Locks:**
- ⏰ Auto-expire after TTL
- 🔄 Automatically cleaned up

### 3. Manual Invalidation
**Methods Available:**
- `ContractConfigCache.invalidateConfig(chainId)` - Clear config cache
- `ContractConfigCache.refreshConfig(chainId)` - Force refresh config
- `RugMarketRedis.clearNFTDataBatch()` - Clear multiple NFTs
- Direct Redis `DEL` operations (via API or admin tools)

---

## Data Flow: Read Path

```
1. API Request → getNFTData(tokenId)
   ↓
2. Check Redis for permanent + dynamic data
   ↓
3a. Cache Hit → Calculate dirtLevel/agingLevel on read
   ↓
3b. Cache Miss → Fetch from blockchain → Store in Redis → Calculate values
   ↓
4. Return NFT with calculated values
```

## Data Flow: Write Path

```
1. Event Occurs (maintenance/marketplace)
   ↓
2. Update API called with new data
   ↓
3. Acquire lock (prevent concurrent updates)
   ↓
4. Update Redis dynamic data (only stored fields)
   ↓
5. Release lock
   ↓
6. (Optional) Refresh from blockchain to verify
```

---

## BigInt Serialization

**Storage Format:** All BigInt values are converted to strings for Redis storage

**Fields Affected:**
- `seed`, `mintTime`, `characterCount`, `stripeCount` (permanent)
- `maintenanceScore`, `lastCleaned`, `lastUpdated` (dynamic)
- `acquiredAt` (ownership history)
- `timestamp` (sale history)
- `listingExpiresAt` (listing data)
- `dirtLevel1Days`, `dirtLevel2Days`, `agingAdvanceDays`, etc. (config)

**Conversion:**
- **Write:** `BigInt.toString()` → Store as string
- **Read:** `BigInt(stringValue)` → Convert back to BigInt

---

## Calculated Values (Not Stored)

### dirtLevel
- **Calculated from:**
  - `lastCleaned` (timestamp)
  - `frameLevel` (affects speed)
  - `dirtLevel1Days`, `dirtLevel2Days` (from contract config)
- **Calculation:** `calculateDirtLevel()` in `dynamic-calculator.ts`
- **Range:** 0-2 (Clean, Dirty, Very Dirty)

### agingLevel
- **Calculated from:**
  - `lastCleaned` (timestamp)
  - `frameLevel` (affects speed via multiplier)
  - `baseAgingLevel` (stored base value)
  - `agingAdvanceDays` (from contract config)
- **Calculation:** `calculateAgingLevel()` in `dynamic-calculator.ts`
- **Range:** 0-10 (capped at 10)

**Why Not Stored?**
- Time-dependent values change every second
- Storing would require constant updates
- Calculated on read ensures always accurate
- Matches contract logic exactly

---

## Migration Strategy

### Old Format Detection
**Old Format Had:**
- `dirtLevel` stored in dynamic data
- `agingLevel` stored in dynamic data

**New Format Has:**
- `baseAgingLevel` stored (from contract)
- `dirtLevel` and `agingLevel` calculated on read

**Migration:**
- Detected automatically on read
- Fetches fresh `baseAgingLevel` from blockchain
- Updates Redis with new format
- Old fields removed

---

## Performance Optimizations

### 1. Batch Operations
- `getNFTDataBatch()` - Uses `MGET` for parallel reads
- `setNFTDataBatch()` - Uses pipeline for batch writes
- Reduces Redis round trips

### 2. Contract Config Caching
- Fetched once per chain
- Cached for 24 hours
- Shared across all NFT reads
- Reduces blockchain calls

### 3. Calculated Values
- Calculated on read, not stored
- Always accurate (time-based)
- No cache invalidation needed
- Matches contract exactly

### 4. Rate Limiting
- Prevents API abuse
- 5-second cooldown per NFT
- Reduces unnecessary blockchain calls

### 5. Locking
- Prevents duplicate operations
- Reduces redundant blockchain fetches
- Auto-expires if operation hangs

---

## Error Handling

### Redis Failures
- **Read failures:** Return `null`, trigger blockchain fallback
- **Write failures:** Log error, throw exception
- **Connection failures:** Graceful degradation to blockchain

### Blockchain Fallback
- Always available if Redis fails
- Slower but reliable
- Ensures data availability

### Partial Failures
- Batch operations use `Promise.allSettled`
- Returns partial results
- Logs errors for failed items
- Continues with successful items

---

## Environment Variables

```bash
# Upstash Redis Configuration
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token

# Optional TTL Overrides (in seconds)
STATIC_TTL_SECONDS=86400      # 24 hours (default)
DYNAMIC_TTL_SECONDS=3600      # 1 hour (default)
TOKENURI_TTL_SECONDS=3600     # 1 hour (default)
```

---

## Summary

**Redis is used as a permanent database**, not a temporary cache:
- ✅ NFT data (permanent + dynamic) never expires
- ✅ Updated on events (maintenance, marketplace)
- ✅ Falls back to blockchain if missing
- ✅ Calculated values (`dirtLevel`, `agingLevel`) computed on read
- ✅ Contract config cached for 24 hours
- ✅ Activity feed expires after 7 days
- ✅ Rate limits and locks auto-expire

**Key Design Principles:**
1. **Permanent storage** for NFT data (acts as database)
2. **Event-driven updates** (not time-based refresh)
3. **Calculated on read** for time-dependent values
4. **Blockchain as source of truth** (fallback always available)
5. **Optimistic updates** (update cache immediately, verify later)

