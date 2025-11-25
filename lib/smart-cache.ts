/**
 * Smart Cache Invalidation Strategies
 *
 * Intelligent cache invalidation based on data relationships:
 * - Dependency tracking between related entities
 * - Selective invalidation to minimize cache misses
 * - Predictive invalidation based on usage patterns
 * - Batch invalidation for performance
 */

import { redis, RedisKeys, parseTokenId, makeContractId } from './redis-schema'
import { CacheOperations, ContractOperations, UserOperations, TraitOperations } from './redis-operations'

export interface InvalidationResult {
  keysInvalidated: number
  relatedEntitiesUpdated: number
  executionTime: number
  strategy: string
}

export class SmartCacheInvalidation {
  /**
   * Comprehensive token update invalidation
   * Invalidates all caches related to a token when it changes
   */
  static async invalidateTokenAndDependents(
    tokenId: string,
    changeType: 'metadata' | 'ownership' | 'maintenance' | 'full'
  ): Promise<InvalidationResult> {
    const startTime = Date.now()
    const pipeline = redis.pipeline()
    let keysInvalidated = 0

    // Parse token information
    const { chainId, contract, tokenId: tid } = parseTokenId(tokenId)
    const contractId = makeContractId(chainId, contract)

    // Always invalidate token-specific caches
    pipeline.del(RedisKeys.cacheToken(tokenId))
    keysInvalidated += 1

    switch (changeType) {
      case 'metadata':
        // Metadata changes: invalidate token and related trait caches
        keysInvalidated += await this.invalidateTokenMetadataCaches(pipeline, tokenId, contractId)
        break

      case 'ownership':
        // Ownership changes: invalidate token, user, and ownership-related caches
        keysInvalidated += await this.invalidateOwnershipCaches(pipeline, tokenId, contractId)
        break

      case 'maintenance':
        // Maintenance changes: invalidate token dynamic data and analytics
        keysInvalidated += await this.invalidateMaintenanceCaches(pipeline, tokenId, contractId)
        break

      case 'full':
        // Full invalidation: invalidate everything related to this token
        keysInvalidated += await this.invalidateAllTokenCaches(pipeline, tokenId, contractId)
        break
    }

    // Execute invalidation
    await pipeline.exec()

    return {
      keysInvalidated,
      relatedEntitiesUpdated: 0, // Would track if we updated related entities
      executionTime: Date.now() - startTime,
      strategy: `token_${changeType}_invalidation`
    }
  }

  /**
   * Batch invalidation for multiple tokens
   */
  static async invalidateMultipleTokens(
    tokenIds: string[],
    changeType: 'metadata' | 'maintenance'
  ): Promise<InvalidationResult> {
    const startTime = Date.now()
    const pipeline = redis.pipeline()
    let keysInvalidated = 0

    // Group tokens by contract for efficient invalidation
    const tokensByContract = this.groupTokensByContract(tokenIds)

    for (const [contractId, contractTokens] of Object.entries(tokensByContract)) {
      switch (changeType) {
        case 'metadata':
          for (const tokenId of contractTokens) {
            pipeline.del(RedisKeys.cacheToken(tokenId))
            keysInvalidated += 1
            keysInvalidated += await this.invalidateTokenMetadataCaches(pipeline, tokenId, contractId)
          }
          break

        case 'maintenance':
          for (const tokenId of contractTokens) {
            keysInvalidated += await this.invalidateMaintenanceCaches(pipeline, tokenId, contractId)
          }
          break
      }
    }

    await pipeline.exec()

    return {
      keysInvalidated,
      relatedEntitiesUpdated: tokenIds.length,
      executionTime: Date.now() - startTime,
      strategy: `batch_${changeType}_invalidation`
    }
  }

  /**
   * Contract-wide invalidation (e.g., when contract is upgraded)
   */
  static async invalidateContractCaches(contractId: string): Promise<InvalidationResult> {
    const startTime = Date.now()
    const pipeline = redis.pipeline()
    let keysInvalidated = 0

    // Get all tokens for this contract
    const tokenIds = await ContractOperations.getContractTokens(contractId)

    // Invalidate all token caches
    for (const tokenId of tokenIds) {
      pipeline.del(RedisKeys.cacheToken(tokenId))
      keysInvalidated += 1
    }

    // Invalidate collection caches (all pages)
    // Note: In production, maintain a registry of active cache keys
    const collectionPattern = `cache:collection:${contractId}:page:*`
    // Redis doesn't support pattern deletion directly, so we mark for cleanup
    pipeline.setex(`cleanup:contract:${contractId}`, 300, 'marked_for_cleanup')
    keysInvalidated += 1

    // Invalidate trait caches
    pipeline.del(RedisKeys.cacheTraits(contractId))
    keysInvalidated += 1

    await pipeline.exec()

    return {
      keysInvalidated,
      relatedEntitiesUpdated: tokenIds.length,
      executionTime: Date.now() - startTime,
      strategy: 'contract_wide_invalidation'
    }
  }

  /**
   * User-specific invalidation (e.g., when user preferences change)
   */
  static async invalidateUserCaches(address: string): Promise<InvalidationResult> {
    const startTime = Date.now()
    const pipeline = redis.pipeline()
    let keysInvalidated = 0

    // Get user's tokens
    const userTokens = await UserOperations.getUserTokens(address)

    // Invalidate user's token caches
    for (const tokenId of userTokens) {
      pipeline.del(RedisKeys.cacheToken(tokenId))
      keysInvalidated += 1
    }

    // Clear user-specific caches
    pipeline.del(`cache:user:${address}:nfts`)
    pipeline.del(`cache:user:${address}:portfolio`)
    keysInvalidated += 2

    await pipeline.exec()

    return {
      keysInvalidated,
      relatedEntitiesUpdated: userTokens.length,
      executionTime: Date.now() - startTime,
      strategy: 'user_cache_invalidation'
    }
  }

  /**
   * Time-based cache expiration (cleanup old caches)
   */
  static async expireOldCaches(maxAgeHours: number = 24): Promise<InvalidationResult> {
    const startTime = Date.now()
    let keysInvalidated = 0

    // This would require maintaining a registry of cache keys with timestamps
    // For now, we'll implement a basic cleanup strategy

    // Get all cache keys (this is expensive, avoid in production)
    const cacheKeys = await this.getAllCacheKeys()

    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000)
    const pipeline = redis.pipeline()

    for (const key of cacheKeys) {
      // Check if key has expired (this is approximate)
      // In production, you'd store timestamps separately
      const ttl = await redis.ttl(key)
      if (ttl === -2) { // Key doesn't exist
        continue
      }
      if (ttl === -1 || ttl > maxAgeHours * 3600) {
        // Key has no TTL or TTL is too long, mark for review
        pipeline.setex(`${key}:review`, 3600, 'needs_ttl_check')
        keysInvalidated += 1
      }
    }

    await pipeline.exec()

    return {
      keysInvalidated,
      relatedEntitiesUpdated: 0,
      executionTime: Date.now() - startTime,
      strategy: 'time_based_cleanup'
    }
  }

  // =============================================================================
  // PRIVATE INVALIDATION HELPERS
  // =============================================================================

  private static async invalidateTokenMetadataCaches(
    pipeline: any,
    tokenId: string,
    contractId: string
  ): Promise<number> {
    let keysInvalidated = 0

    // Invalidate trait-related caches that depend on this token's metadata
    const tokenTraits = await this.getTokenTraitIds(tokenId)
    for (const traitId of tokenTraits) {
      // Mark trait analytics as stale
      pipeline.del(`analytics:trait_usage:${contractId}`)
      keysInvalidated += 1
      break // Only need to do this once per contract
    }

    return keysInvalidated
  }

  private static async invalidateOwnershipCaches(
    pipeline: any,
    tokenId: string,
    contractId: string
  ): Promise<number> {
    let keysInvalidated = 0

    // Invalidate ownership-related analytics
    pipeline.del(`analytics:ownership:${contractId}`)
    keysInvalidated += 1

    // Invalidate user's portfolio cache (would need user address)
    // This would require additional logic to get the user address

    return keysInvalidated
  }

  private static async invalidateMaintenanceCaches(
    pipeline: any,
    tokenId: string,
    contractId: string
  ): Promise<number> {
    let keysInvalidated = 0

    // Invalidate maintenance analytics
    pipeline.del(`analytics:maintenance:${contractId}`)
    keysInvalidated += 1

    // Mark token as recently maintained for cache warming
    pipeline.setex(`recent:maintenance:${tokenId}`, 3600, Date.now().toString())
    keysInvalidated += 1

    return keysInvalidated
  }

  private static async invalidateAllTokenCaches(
    pipeline: any,
    tokenId: string,
    contractId: string
  ): Promise<number> {
    let keysInvalidated = 0

    // Combine all invalidation strategies
    keysInvalidated += await this.invalidateTokenMetadataCaches(pipeline, tokenId, contractId)
    keysInvalidated += await this.invalidateOwnershipCaches(pipeline, tokenId, contractId)
    keysInvalidated += await this.invalidateMaintenanceCaches(pipeline, tokenId, contractId)

    return keysInvalidated
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private static groupTokensByContract(tokenIds: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {}

    for (const tokenId of tokenIds) {
      const { chainId, contract } = parseTokenId(tokenId)
      const contractId = makeContractId(chainId, contract)

      if (!groups[contractId]) {
        groups[contractId] = []
      }
      groups[contractId].push(tokenId)
    }

    return groups
  }

  private static async getTokenTraitIds(tokenId: string): Promise<string[]> {
    const traitKey = RedisKeys.tokenTraits(tokenId)
    return await redis.smembers(traitKey)
  }

  private static async getAllCacheKeys(): Promise<string[]> {
    // This is a simplified implementation
    // In production, you'd maintain a registry of cache keys
    const keys: string[] = []

    // Get some known cache key patterns
    const tokenKeys = await redis.keys('cache:token:*:data')
    const collectionKeys = await redis.keys('cache:collection:*:page:*')
    const traitKeys = await redis.keys('cache:traits:*')

    return [...tokenKeys, ...collectionKeys, ...traitKeys]
  }
}

// =============================================================================
// PREDICTIVE INVALIDATION
// =============================================================================

export class PredictiveInvalidation {
  /**
   * Invalidate caches based on usage patterns
   */
  static async invalidateBasedOnUsage(contractId: string): Promise<InvalidationResult> {
    const startTime = Date.now()

    // Analyze which caches are frequently accessed
    const hotTokens = await this.getHotTokens(contractId)
    const popularTraits = await this.getPopularTraits(contractId)

    const pipeline = redis.pipeline()
    let keysInvalidated = 0

    // Invalidate caches for hot tokens (they change frequently)
    for (const tokenId of hotTokens) {
      pipeline.del(RedisKeys.cacheToken(tokenId))
      keysInvalidated += 1
    }

    // Invalidate trait caches for popular traits
    for (const traitId of popularTraits) {
      pipeline.del(`analytics:trait_usage:${contractId}`)
      keysInvalidated += 1
      break // Only once per contract
    }

    await pipeline.exec()

    return {
      keysInvalidated,
      relatedEntitiesUpdated: hotTokens.length,
      executionTime: Date.now() - startTime,
      strategy: 'predictive_invalidation'
    }
  }

  private static async getHotTokens(contractId: string): Promise<string[]> {
    // Get tokens that have been recently maintained
    const recentMaintenanceKeys = await redis.keys('recent:maintenance:*')
    return recentMaintenanceKeys.map(key => key.replace('recent:maintenance:', ''))
  }

  private static async getPopularTraits(contractId: string): Promise<string[]> {
    // This would analyze trait usage analytics
    // For now, return empty array
    return []
  }
}

// =============================================================================
// CACHE WARMING STRATEGIES
// =============================================================================

export class CacheWarming {
  /**
   * Warm caches for tokens that are likely to be accessed soon
   */
  static async warmCacheForContract(contractId: string): Promise<void> {
    // Get recently maintained tokens (likely to be viewed)
    const recentMaintenanceKeys = await redis.keys('recent:maintenance:*')
    const recentTokens = recentMaintenanceKeys.slice(0, 10) // Limit to 10

    // Get popular tokens
    const popularTokens = await this.getPopularTokens(contractId, 10)

    const tokensToWarm = [...new Set([...recentTokens, ...popularTokens])]

    // Preload these tokens into cache
    for (const tokenId of tokensToWarm) {
      // This would trigger the normal cache loading process
      // Implementation depends on your cache loading logic
    }
  }

  private static async getPopularTokens(contractId: string, limit: number): Promise<string[]> {
    // Get tokens with highest view counts or other popularity metrics
    // This would require maintaining popularity analytics
    return []
  }
}
