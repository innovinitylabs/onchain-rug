/**
 * Advanced Redis Indexes for Efficient Querying
 *
 * Creates and maintains sorted sets and indexes for:
 * - Owner-based queries (primary focus - replaces rarity)
 * - Trait-based filtering
 * - Maintenance activity tracking
 * - Performance analytics
 */

import { redis, RedisKeys, makeContractId, makeTokenId } from './redis-schema'

export interface IndexEntry {
  member: string
  score: number
  data?: any
}

export class RedisIndexes {
  // =============================================================================
  // OWNER-BASED INDEXES (PRIMARY - REPLACES RARITY)
  // =============================================================================

  /**
   * Owner token count index: sorted set of owners by token count
   * Key: index:owners:by_token_count:{contractId}
   * Score: token count (descending)
   * Member: owner address
   */
  static async updateOwnerTokenCountIndex(contractId: string, ownerAddress: string, tokenCount: number): Promise<void> {
    const key = `index:owners:by_token_count:${contractId}`
    await redis.zadd(key, { score: tokenCount, member: ownerAddress })
  }

  /**
   * Owner activity index: sorted set of owners by last activity
   * Key: index:owners:by_activity:{contractId}
   * Score: timestamp
   * Member: owner address
   */
  static async updateOwnerActivityIndex(contractId: string, ownerAddress: string, timestamp?: number): Promise<void> {
    const key = `index:owners:by_activity:${contractId}`
    const score = timestamp || Date.now()
    await redis.zadd(key, { score, member: ownerAddress })
  }

  /**
   * Get top owners by token count
   */
  static async getTopOwnersByCount(contractId: string, limit: number = 10): Promise<string[]> {
    const key = `index:owners:by_token_count:${contractId}`
    const results = await redis.zrange(key, 0, limit - 1, { rev: true })
    return results.map(r => String(r))
  }

  /**
   * Get most active owners recently
   */
  static async getMostActiveOwners(contractId: string, limit: number = 10): Promise<string[]> {
    const key = `index:owners:by_activity:${contractId}`
    const results = await redis.zrange(key, 0, limit - 1, { rev: true })
    return results.map(r => String(r))
  }

  // =============================================================================
  // TOKEN-BASED INDEXES
  // =============================================================================

  /**
   * Token maintenance index: tokens sorted by last maintenance
   * Key: index:tokens:by_maintenance:{contractId}
   * Score: maintenance timestamp
   * Member: tokenId
   */
  static async updateTokenMaintenanceIndex(contractId: string, tokenId: string, timestamp: string): Promise<void> {
    const key = `index:tokens:by_maintenance:${contractId}`
    const score = new Date(timestamp).getTime()
    await redis.zadd(key, { score, member: tokenId })
  }

  /**
   * Token dirt level index: tokens sorted by dirt level
   * Key: index:tokens:by_dirt_level:{contractId}
   * Score: dirt level
   * Member: tokenId
   */
  static async updateTokenDirtIndex(contractId: string, tokenId: string, dirtLevel: number): Promise<void> {
    const key = `index:tokens:by_dirt_level:${contractId}`
    await redis.zadd(key, { score: dirtLevel, member: tokenId })
  }

  /**
   * Token aging level index: tokens sorted by aging level
   * Key: index:tokens:by_aging_level:{contractId}
   * Score: aging level
   * Member: tokenId
   */
  static async updateTokenAgingIndex(contractId: string, tokenId: string, agingLevel: number): Promise<void> {
    const key = `index:tokens:by_aging_level:${contractId}`
    await redis.zadd(key, { score: agingLevel, member: tokenId })
  }

  /**
   * Get tokens needing maintenance (high dirt/aging)
   */
  static async getTokensNeedingMaintenance(contractId: string, limit: number = 20): Promise<string[]> {
    const dirtKey = `index:tokens:by_dirt_level:${contractId}`
    const agingKey = `index:tokens:by_aging_level:${contractId}`

    // Get tokens with highest dirt levels
    const dirtyTokens = await redis.zrange(dirtKey, 0, limit - 1, { rev: true })

    // Get tokens with highest aging levels
    const agingTokens = await redis.zrange(agingKey, 0, limit - 1, { rev: true })

    // Combine and deduplicate
    const allTokens = [
      ...dirtyTokens.map(t => String(t)),
      ...agingTokens.map(t => String(t))
    ]
    return [...new Set(allTokens)].slice(0, limit)
  }

  /**
   * Get recently maintained tokens
   */
  static async getRecentlyMaintainedTokens(contractId: string, limit: number = 20): Promise<string[]> {
    const key = `index:tokens:by_maintenance:${contractId}`
    const results = await redis.zrange(key, 0, limit - 1, { rev: true })
    return results.map(r => String(r))
  }

  // =============================================================================
  // TRAIT-BASED INDEXES
  // =============================================================================

  /**
   * Trait popularity index: traits sorted by usage count
   * Key: index:traits:by_popularity:{contractId}
   * Score: usage count
   * Member: traitId
   */
  static async updateTraitPopularityIndex(contractId: string, traitId: string, count: number): Promise<void> {
    const key = `index:traits:by_popularity:${contractId}`
    await redis.zadd(key, { score: count, member: traitId })
  }

  /**
   * Get most popular traits
   */
  static async getPopularTraits(contractId: string, limit: number = 10): Promise<string[]> {
    const key = `index:traits:by_popularity:${contractId}`
    const results = await redis.zrange(key, 0, limit - 1, { rev: true })
    return results.map(r => String(r))
  }

  // =============================================================================
  // COMPOSITE QUERY INDEXES
  // =============================================================================

  /**
   * Owner + trait combination index for complex queries
   * Key: index:composite:owner_trait:{contractId}:{ownerAddress}
   * Score: timestamp (for ordering)
   * Member: traitId
   */
  static async updateOwnerTraitIndex(contractId: string, ownerAddress: string, traitId: string): Promise<void> {
    const key = `index:composite:owner_trait:${contractId}:${ownerAddress}`
    const score = Date.now()
    await redis.zadd(key, { score, member: traitId })
  }

  /**
   * Get all traits owned by a specific address
   */
  static async getOwnerTraits(contractId: string, ownerAddress: string): Promise<string[]> {
    const key = `index:composite:owner_trait:${contractId}:${ownerAddress}`
    return await redis.zrange(key, 0, -1)
  }

  // =============================================================================
  // PERFORMANCE INDEXES
  // =============================================================================

  /**
   * Query performance index: track slow queries
   * Key: index:performance:queries
   * Score: execution time
   * Member: query signature
   */
  static async trackQueryPerformance(querySignature: string, executionTime: number): Promise<void> {
    const key = 'index:performance:queries'
    await redis.zadd(key, { score: executionTime, member: querySignature })
  }

  /**
   * Cache hit rate index: track cache effectiveness
   * Key: index:performance:cache_hits
   * Score: timestamp
   * Member: cache key + hit/miss
   */
  static async trackCacheHit(cacheKey: string, isHit: boolean): Promise<void> {
    const key = 'index:performance:cache_hits'
    const member = `${cacheKey}:${isHit ? 'hit' : 'miss'}`
    const score = Date.now()
    await redis.zadd(key, { score, member: member })
  }

  /**
   * Get cache hit rate over time period
   */
  static async getCacheHitRate(hours: number = 24): Promise<number> {
    const key = 'index:performance:cache_hits'
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)

    // Get recent cache events
    // Note: Upstash Redis uses zrange with BYSCORE option instead of zrangebyscore
    const events = await redis.zrange(key, cutoff, Date.now(), { byScore: true })
    const eventStrings = events.map(e => String(e))
    const hits = eventStrings.filter(event => event.endsWith(':hit')).length
    const total = eventStrings.length

    return total > 0 ? hits / total : 0
  }

  // =============================================================================
  // BATCH INDEX UPDATES
  // =============================================================================

  /**
   * Batch update all indexes for a token
   */
  static async updateAllTokenIndexes(
    contractId: string,
    tokenId: string,
    ownerAddress: string,
    traits: string[],
    dynamic: { dirtLevel: number; agingLevel: number; lastMaintenance: string }
  ): Promise<void> {
    const pipeline = redis.pipeline()

    // Owner indexes
    pipeline.zadd(`index:owners:by_activity:${contractId}`, {
      score: Date.now(),
      member: ownerAddress
    })

    // Get current owner token count and increment
    // Note: This is simplified - you'd need to track current counts properly
    pipeline.zincrby(`index:owners:by_token_count:${contractId}`, 1, ownerAddress)

    // Token indexes
    pipeline.zadd(`index:tokens:by_dirt_level:${contractId}`, {
      score: dynamic.dirtLevel,
      member: tokenId
    })

    pipeline.zadd(`index:tokens:by_aging_level:${contractId}`, {
      score: dynamic.agingLevel,
      member: tokenId
    })

    if (dynamic.lastMaintenance) {
      const maintenanceTime = new Date(dynamic.lastMaintenance).getTime()
      pipeline.zadd(`index:tokens:by_maintenance:${contractId}`, {
        score: maintenanceTime,
        member: tokenId
      })
    }

    // Trait indexes
    for (const traitId of traits) {
      pipeline.zincrby(`index:traits:by_popularity:${contractId}`, 1, traitId)
      pipeline.zadd(`index:composite:owner_trait:${contractId}:${ownerAddress}`, {
        score: Date.now(),
        member: traitId
      })
    }

    await pipeline.exec()
  }

  // =============================================================================
  // INDEX MAINTENANCE
  // =============================================================================

  /**
   * Clean up old index entries (time-based expiration)
   */
  static async cleanupOldIndexes(maxAgeHours: number = 24 * 30): Promise<void> {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000)

    // Clean up activity indexes
    const activityPattern = 'index:owners:by_activity:*'
    // Note: Redis doesn't support pattern-based ZREMRANGEBYSCORE
    // You'd need to maintain a list of active contract IDs

    // Clean up performance indexes
    await redis.zremrangebyscore('index:performance:queries', 0, cutoff)
    await redis.zremrangebyscore('index:performance:cache_hits', 0, cutoff)
  }

  /**
   * Rebuild indexes for a contract (maintenance operation)
   */
  static async rebuildContractIndexes(contractId: string): Promise<void> {
    console.log(`🔄 Rebuilding indexes for contract ${contractId}`)

    // Clear existing indexes
    await redis.del(
      `index:owners:by_token_count:${contractId}`,
      `index:owners:by_activity:${contractId}`,
      `index:tokens:by_maintenance:${contractId}`,
      `index:tokens:by_dirt_level:${contractId}`,
      `index:tokens:by_aging_level:${contractId}`,
      `index:traits:by_popularity:${contractId}`
    )

    // Get all tokens for the contract
    const tokenIds = await redis.smembers(`contract:${contractId}:tokens`)

    // Rebuild indexes for each token
    for (const tokenId of tokenIds) {
      const tokenData = await redis.hgetall(`token:${tokenId}`)
      if (tokenData && Object.keys(tokenData).length > 0) {
        const traits = JSON.parse(tokenData.traits as string || '[]')
        const dynamic = JSON.parse(tokenData.dynamic as string || '{}')

        await this.updateAllTokenIndexes(
          contractId,
          tokenId,
          tokenData.owner as string,
          traits,
          dynamic
        )
      }
    }

    console.log(`✅ Rebuilt indexes for ${tokenIds.length} tokens`)
  }
}

// =============================================================================
// QUERY OPTIMIZATION HELPERS
// =============================================================================

export class QueryOptimizer {
  /**
   * Analyze query pattern and suggest optimal index usage
   */
  static analyzeQuery(query: {
    contractId: string
    ownerAddress?: string
    traits?: string[]
    sortBy?: string
    filters?: any
  }): {
    recommendedIndexes: string[]
    estimatedComplexity: 'low' | 'medium' | 'high'
    optimizationHints: string[]
  } {
    const hints: string[] = []
    const indexes: string[] = []

    // Owner-based queries (primary optimization)
    if (query.ownerAddress) {
      indexes.push(`index:composite:owner_trait:${query.contractId}:${query.ownerAddress}`)
      hints.push('Use owner-trait composite index for fast owner filtering')
    }

    // Trait-based queries
    if (query.traits && query.traits.length > 0) {
      indexes.push(`index:traits:by_popularity:${query.contractId}`)
      hints.push('Use trait popularity index for filtering')
    }

    // Sorting optimizations
    if (query.sortBy === 'owner') {
      indexes.push(`index:owners:by_token_count:${query.contractId}`)
      hints.push('Owner-based sorting optimized')
    }

    // Complexity assessment
    let complexity: 'low' | 'medium' | 'high' = 'low'
    if (query.traits && query.traits.length > 2) {
      complexity = 'high'
      hints.push('Consider pagination for complex trait queries')
    } else if (query.ownerAddress || (query.traits && query.traits.length > 0)) {
      complexity = 'medium'
    }

    return {
      recommendedIndexes: indexes,
      estimatedComplexity: complexity,
      optimizationHints: hints
    }
  }

  /**
   * Pre-warm indexes for predicted queries
   */
  static async prewarmIndexes(contractId: string, predictedQueries: any[]): Promise<void> {
    // Implement predictive index warming based on usage patterns
    // This would analyze historical queries and pre-load relevant indexes
  }
}
