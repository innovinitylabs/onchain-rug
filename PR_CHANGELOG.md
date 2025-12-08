# Dynamic Cache Architecture for NFT Data

## Overview
This PR implements a new architecture for handling dynamic NFT traits (`dirtLevel` and `agingLevel`) that are calculated on-the-fly based on time and frame level, rather than being stored statically in Redis. This ensures data is always accurate and reflects real-time state changes.

## Key Changes

### 🏗️ Architecture Improvements

#### Dynamic Calculation System
- **New Files:**
  - `app/api/rug-market/collection/dynamic-calculator.ts` - Calculates `dirtLevel` and `agingLevel` on read, matching contract logic exactly
  - `app/api/rug-market/collection/contract-config-cache.ts` - Caches contract-wide configuration (24-hour TTL)

#### Data Structure Changes
- **Removed from stored data:** `dirtLevel` and `agingLevel` (now calculated on read)
- **Added to stored data:** `baseAgingLevel` (stored base value from contract)
- **New interface:** `RugMarketNFTWithCalculated` - Represents NFTs with calculated values attached

### 🔄 Cache & API Updates

#### Redis Layer (`rug-market-redis.ts`)
- `getNFTData()` and `getNFTDataBatch()` now calculate `dirtLevel` and `agingLevel` on read
- Added timestamp normalization (handles milliseconds → seconds conversion)
- Added migration logic for old cache entries
- Contract config caching with 24-hour TTL

#### Blockchain Fetcher (`blockchain-fetcher.ts`)
- Updated to fetch `getAgingData` from contract (includes `baseAgingLevel`, `frameLevel`, `lastCleaned`)
- Removed direct fetching of calculated fields (`dirtLevel`, `agingLevel`)

#### API Routes
- **Collection API (`/api/rug-market/collection`):** Returns NFTs with calculated values
- **Refresh API (`/api/rug-market/nft/[tokenId]/refresh`):**
  - Added rate limiting (5-second cooldown per NFT)
  - Added deduplication (prevents concurrent refreshes)
  - Fetches fresh data from blockchain and updates cache
- **Update API (`/api/rug-market/nft/[tokenId]/update`):**
  - Only allows updates to stored fields (prevents updating calculated fields)
  - Handles BigInt serialization properly

### 🎨 Frontend Improvements

#### Preview Generation (`NFTDisplay.tsx`)
- Preview now regenerates when dynamic traits change (`dirtLevel`, `agingLevel`, `frameLevel`)
- Added `traitsKey` tracking to detect trait changes
- Frame level properly displayed in previews

#### Grid Component (`RugMarketGrid.tsx`)
- Component key includes dynamic traits to force remount on data changes
- Refresh button on each NFT card (visible on hover)
- Proper display of calculated dirt/aging levels

#### Maintenance Actions (`RugCleaning.tsx`)
- After maintenance transactions, automatically refreshes NFT data from blockchain
- Fetches fresh `baseAgingLevel` and `frameLevel` after restore/master restore
- Updates cache with correct values before UI refresh

#### Data Adapter (`rug-market-data-adapter.ts`)
- New `getCalculatedLevels()` helper function for safe extraction of calculated values
- Proper handling of missing or invalid calculated values
- Caps `agingLevel` at 10 (max value)

### 🐛 Bug Fixes

1. **Import Path Fixes**
   - Fixed relative import paths in API routes
   - Changed to absolute imports with `@/` alias for better build compatibility

2. **BigInt Compatibility**
   - Replaced BigInt literals (`10n`) with `BigInt()` constructor for ES2017 compatibility
   - Fixes TypeScript compilation errors in production builds

3. **Timestamp Normalization**
   - Handles both milliseconds and seconds timestamps
   - Prevents negative time calculations

4. **Preview Refresh**
   - Previews now update correctly after maintenance actions
   - Frame levels display properly in previews

### 📊 Performance Optimizations

- Contract config cached for 24 hours (reduces blockchain calls)
- Rate limiting prevents API abuse
- Deduplication prevents redundant refreshes
- Batch operations for multiple NFTs

### 🔒 Data Integrity

- Calculated values always match contract logic
- Stored values (`baseAgingLevel`, `lastCleaned`, `frameLevel`) are source of truth
- Migration path for existing cache entries
- Validation and error handling throughout

## Testing Notes

- ✅ Preview generation with dynamic traits
- ✅ Frame level display in previews
- ✅ Maintenance action refresh flow
- ✅ Rate limiting and deduplication
- ✅ BigInt serialization in API
- ✅ Build compatibility (ES2017 target)

## Migration

Existing cache entries are automatically migrated when read:
- Old entries with `dirtLevel`/`agingLevel` are detected
- Fresh `baseAgingLevel` is fetched from blockchain
- Cache is updated with new structure

## Breaking Changes

None - The API maintains backward compatibility. Calculated values are added on read, so existing code continues to work.

## Files Changed

- **New Files:** 2
- **Modified Files:** 19
- **Total Changes:** +1,198 insertions, -142 deletions

