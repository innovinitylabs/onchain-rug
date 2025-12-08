/**
 * Rug Market Data Types and Redis Key Helpers
 *
 * Permanent data (no TTL) and dynamic data structures for the Rug Market
 */

export interface RugPermanentData {
  // Core immutable data (set on mint)
  tokenId: number
  seed: bigint
  paletteName: string
  minifiedPalette: string
  minifiedStripeData: string
  textRows: string[]
  warpThickness: number
  curator: string
  mintTime: bigint
  filteredCharacterMap: string
  characterCount: bigint
  stripeCount: bigint

  // Common metadata
  name: string
  description: string
  image: string
}

export interface RugDynamicData {
  // Stored base values (from contract)
  baseAgingLevel: number  // Stored base aging level from contract (0-10)
  frameLevel: string | number  // Frame level: string ("None", "Bronze", etc.) or number (0-4)
  maintenanceScore: bigint
  lastCleaned: bigint  // Last cleaned timestamp (in seconds)
  cleaningCount?: number
  restorationCount?: number
  masterRestorationCount?: number
  launderingCount?: number

  // Note: dirtLevel and agingLevel are NOT stored - they are calculated on read

  // Ownership tracking
  currentOwner: string
  ownershipHistory: Array<{
    owner: string
    acquiredAt: bigint
    acquiredVia: 'mint' | 'sale' | 'transfer'
    price?: string
    txHash: string
  }>

  // Sale history
  saleHistory: Array<{
    price: string
    from: string
    to: string
    timestamp: bigint
    txHash: string
  }>

  // Marketplace state
  isListed: boolean
  listingPrice?: string
  listingSeller?: string
  listingExpiresAt?: bigint
  listingTxHash?: string
  lastSalePrice?: string

  // Metadata
  lastUpdated: bigint
}

/**
 * Stored NFT data (what's in Redis)
 * Does not include calculated fields
 */
export interface RugMarketNFT {
  permanent: RugPermanentData
  dynamic: RugDynamicData
}

/**
 * NFT data with calculated fields (for API responses)
 * Includes computed dirtLevel and agingLevel
 */
export interface RugMarketNFTWithCalculated extends RugMarketNFT {
  dynamic: RugDynamicData & {
    dirtLevel: number  // Calculated on read
    agingLevel: number  // Calculated on read
  }
}

export interface CollectionStats {
  totalSupply: number
  maxSupply: number
  floorPrice: string
  volume24h: string
  sales24h: number
  uniqueOwners: number
  lastUpdated: bigint
}

export interface MarketplaceActivity {
  id: string
  type: 'mint' | 'sale' | 'listing' | 'delisting' | 'maintenance'
  tokenId: number
  from?: string
  to?: string
  price?: string
  timestamp: bigint
  txHash: string
}

/**
 * Redis key helpers for Rug Market data
 */
export class RugMarketKeys {
  private static baseKey(chainId: number, contract: string) {
    return `${chainId}:${contract}`
  }

  // Permanent NFT data (no TTL)
  static permanentData(chainId: number, contract: string, tokenId: number): string {
    return `rugmarket:${this.baseKey(chainId, contract)}:nft:${tokenId}:permanent`
  }

  // Dynamic NFT data (no TTL)
  static dynamicData(chainId: number, contract: string, tokenId: number): string {
    return `rugmarket:${this.baseKey(chainId, contract)}:nft:${tokenId}:dynamic`
  }

  // Collection statistics (no TTL)
  static collectionStats(chainId: number, contract: string): string {
    return `rugmarket:${this.baseKey(chainId, contract)}:collection`
  }

  // Activity feed (7 days TTL)
  static activityFeed(chainId: number, contract: string): string {
    return `rugmarket:${this.baseKey(chainId, contract)}:activity`
  }

  // Batch keys for multiple NFTs
  static permanentDataBatch(chainId: number, contract: string, tokenIds: number[]): string[] {
    return tokenIds.map(tokenId => this.permanentData(chainId, contract, tokenId))
  }

  static dynamicDataBatch(chainId: number, contract: string, tokenIds: number[]): string[] {
    return tokenIds.map(tokenId => this.dynamicData(chainId, contract, tokenId))
  }
}
