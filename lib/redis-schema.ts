/**
 * Professional Redis Schema Design for NFT Caching System
 *
 * NORMALIZED DATA MODEL within Redis:
 * - Contracts: Main contract metadata
 * - Tokens: Individual NFT data with relationships
 * - Traits: Normalized trait registry
 * - Users: User profiles and NFT ownership
 * - Indexes: Advanced querying capabilities
 * - Analytics: Performance and usage metrics
 *
 * All data relationships maintained through Redis Sets and References
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = Redis.fromEnv()

export { redis }

// =============================================================================
// SCHEMA DEFINITIONS
// =============================================================================

/**
 * Contract Schema - Main contract metadata
 * Key: contract:{chainId}:{address}
 * Type: Hash
 */
export interface ContractSchema {
  id: string                    // "84532:0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff"
  chainId: number              // 84532
  address: string              // "0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff"
  name: string                 // "OnchainRugs"
  symbol: string               // "OCR"
  totalSupply: number          // 10000
  createdAt: string           // ISO date
  updatedAt: string           // ISO date
  lastRefresh: string         // ISO date
}

/**
 * Token Schema - Individual NFT with normalized relationships
 * Key: token:{chainId}:{contract}:{tokenId}
 * Type: Hash
 */
export interface TokenSchema {
  id: string                   // "84532:contract:1"
  contractId: string           // Reference to contract
  tokenId: number              // 1
  owner: string               // "0x123..." (current owner)
  name: string                // "OnchainRug #1"
  description: string         // Description text
  image: string               // IPFS/image URL
  animation_url: string       // Animation URL
  traits: string[]            // Array of trait IDs ["trait_palette_cornell_red", "trait_complexity_2"]
  dynamic: {
    dirtLevel: number
    agingLevel: number
    lastMaintenance: string   // ISO date
    maintenanceCount: number
    lastCleaning: string      // ISO date
    cleaningCount: number
  }
  metadataHash: string        // SHA256 of metadata
  lastRefresh: string         // ISO date
  createdAt: string           // ISO date
}

/**
 * Trait Schema - Normalized trait definitions
 * Key: trait:{type}:{normalizedValue}
 * Type: Hash
 */
export interface TraitSchema {
  id: string                   // "trait_palette_cornell_red"
  type: string                // "palette", "complexity", "owner"
  value: string               // Original value "Cornell Red"
  normalizedValue: string     // "cornell_red"
  displayName: string         // "Cornell Red"
  category: string            // "color", "numeric", "address"
  rarity: number              // 0.15 (calculated rarity)
  tokenCount: number          // How many tokens have this trait
  createdAt: string           // ISO date
}

/**
 * User Schema - User profiles and ownership
 * Key: user:{address}
 * Type: Hash
 */
export interface UserSchema {
  id: string                  // "0x123..."
  address: string             // "0x123..."
  nftCount: number            // Total NFTs owned
  lastActivity: string        // ISO date
  createdAt: string           // ISO date
}

// =============================================================================
// RELATIONSHIP INDEXES (Redis Sets)
// =============================================================================

/**
 * Contract → Tokens relationship
 * Key: contract:{contractId}:tokens
 * Type: Set of token IDs
 * Example: contract:84532:0x123...:tokens = {"1", "2", "3"}
 */

/**
 * User → Owned Tokens relationship
 * Key: user:{address}:tokens
 * Type: Set of token IDs
 * Example: user:0x123...:tokens = {"84532:contract:1", "84532:contract:5"}
 */

/**
 * Trait → Tokens relationship (reverse index)
 * Key: trait:{traitId}:tokens
 * Type: Set of token IDs
 * Example: trait:palette_cornell_red:tokens = {"84532:contract:1", "84532:contract:7"}
 */

/**
 * Token → Traits relationship
 * Key: token:{tokenId}:traits
 * Type: Set of trait IDs
 * Example: token:84532:contract:1:traits = {"trait_palette_cornell_red", "trait_complexity_2"}
 */

// =============================================================================
// ANALYTICS & METRICS (Sorted Sets, HyperLogLog)
// =============================================================================

/**
 * Trait usage analytics
 * Key: analytics:trait_usage:{contractId}
 * Type: Sorted Set (score = usage count)
 * Example: analytics:trait_usage:84532:contract = [
 *   { score: 150, member: "trait_palette_cornell_red" },
 *   { score: 89, member: "trait_complexity_2" }
 * ]
 */

/**
 * User activity tracking
 * Key: analytics:user_activity:{date}
 * Type: HyperLogLog (unique users)
 */

/**
 * Cache performance metrics
 * Key: metrics:cache_performance
 * Type: Hash with counters
 * Example: {
 *   hits: 15420,
 *   misses: 234,
 *   avg_response_time: 45,
 *   last_updated: "2025-01-01T10:00:00Z"
 * }
 */

// =============================================================================
// CACHE KEYS (for backward compatibility during migration)
// =============================================================================

/**
 * Legacy cache keys (will be phased out)
 * Key: nft:static:{chainId}:{contract}:{tokenId}
 * Key: nft:dynamic:{chainId}:{contract}:{tokenId}
 * Key: nft:tokenuri:{chainId}:{contract}:{tokenId}
 */

/**
 * New normalized cache keys
 * Key: cache:token:{tokenId}:data
 * Key: cache:collection:{contractId}:page:{page}
 * Key: cache:traits:{contractId}
 */

// =============================================================================
// KEY GENERATION UTILITIES
// =============================================================================

export class RedisKeys {
  // Contract keys
  static contract(contractId: string): string {
    return `contract:${contractId}`
  }

  static contractTokens(contractId: string): string {
    return `contract:${contractId}:tokens`
  }

  // Token keys
  static token(tokenId: string): string {
    return `token:${tokenId}`
  }

  static tokenTraits(tokenId: string): string {
    return `token:${tokenId}:traits`
  }

  // Trait keys
  static trait(type: string, normalizedValue: string): string {
    return `trait:${type}:${normalizedValue}`
  }

  static traitTokens(traitId: string): string {
    return `trait:${traitId}:tokens`
  }

  // User keys
  static user(address: string): string {
    return `user:${address}`
  }

  static userTokens(address: string): string {
    return `user:${address}:tokens`
  }

  // Analytics keys
  static traitUsage(contractId: string): string {
    return `analytics:trait_usage:${contractId}`
  }

  static userActivity(date: string): string {
    return `analytics:user_activity:${date}`
  }

  // Cache keys (new normalized)
  static cacheToken(tokenId: string): string {
    return `cache:token:${tokenId}:data`
  }

  static cacheCollection(contractId: string, page: number): string {
    return `cache:collection:${contractId}:page:${page}`
  }

  static cacheTraits(contractId: string): string {
    return `cache:traits:${contractId}`
  }

  // Legacy cache keys (for migration)
  static legacyStatic(chainId: number, contract: string, tokenId: number): string {
    return `nft:static:${chainId}:${contract}:${tokenId}`
  }

  static legacyDynamic(chainId: number, contract: string, tokenId: number): string {
    return `nft:dynamic:${chainId}:${contract}:${tokenId}`
  }

  static legacyTokenURI(chainId: number, contract: string, tokenId: number): string {
    return `nft:tokenuri:${chainId}:${contract}:${tokenId}`
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate normalized trait ID
 */
export function normalizeTraitId(type: string, value: string): string {
  const normalizedValue = value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  return `trait_${type}_${normalizedValue}`
}

/**
 * Generate contract ID
 */
export function makeContractId(chainId: number, address: string): string {
  return `${chainId}:${address}`
}

/**
 * Generate token ID
 */
export function makeTokenId(chainId: number, contract: string, tokenId: number): string {
  return `${chainId}:${contract}:${tokenId}`
}

/**
 * Parse contract ID
 */
export function parseContractId(contractId: string): { chainId: number, address: string } {
  const [chainId, address] = contractId.split(':')
  return { chainId: parseInt(chainId), address }
}

/**
 * Parse token ID
 */
export function parseTokenId(tokenId: string): { chainId: number, contract: string, tokenId: number } {
  const [chainId, contract, token] = tokenId.split(':')
  return {
    chainId: parseInt(chainId),
    contract,
    tokenId: parseInt(token)
  }
}
