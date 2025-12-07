/**
 * Multi-Level Caching System: L1 Memory + L2 Redis
 *
 * Architecture:
 * - L1: In-memory LRU cache (fastest, per-request)
 * - L2: Redis cache (persistent, shared across instances)
 * - Automatic cache warming and invalidation
 * - Intelligent cache strategies based on data type
 */

import { redis, RedisKeys } from './redis-schema'
import { CacheOperations, AnalyticsOperations } from './redis-operations'

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

export class MultiLevelCache {
  private static memoryCache = new Map<string, CacheEntry>()
  private static readonly MAX_MEMORY_SIZE = 1000 // Maximum entries in memory cache
  private static readonly CLEANUP_INTERVAL = 60000 // 1 minute cleanup interval

  // Initialize cleanup timer
  static {
    if (typeof globalThis !== 'undefined') {
      setInterval(() => this.cleanupExpiredEntries(), this.CLEANUP_INTERVAL)
    }
  }

  // =============================================================================
  // CORE CACHE OPERATIONS
  // =============================================================================

  /**
   * Get data from multi-level cache
   * 1. Check L1 memory cache
   * 2. Check L2 Redis cache
   * 3. Return data with source indicator
   */
  static async get<T = any>(
    key: string,
    options: {
      redisTTL?: number
      memoryTTL?: number
      fetchFunction?: () => Promise<T>
    } = {}
  ): Promise<{
    data: T | null
    source: 'memory' | 'redis' | 'miss'
    hit: boolean
  }> {
    const startTime = Date.now()

    // 1. Check L1 memory cache
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      memoryEntry.accessCount++
      memoryEntry.lastAccessed = Date.now()

      await AnalyticsOperations.updateCacheMetrics(true, Date.now() - startTime)

      return {
        data: memoryEntry.data,
        source: 'memory',
        hit: true
      }
    }

    // 2. Check L2 Redis cache
    try {
      const redisKey = this.getRedisKey(key)
      const redisData = await redis.get(redisKey)

      if (redisData) {
        const data = JSON.parse(redisData as string)

        // Store in L1 memory cache for faster future access
        this.setMemoryCache(key, data, options.memoryTTL || 300) // 5 minutes default

        await AnalyticsOperations.updateCacheMetrics(true, Date.now() - startTime)

        return {
          data,
          source: 'redis',
          hit: true
        }
      }
    } catch (error) {
      console.warn('Redis cache read error:', error)
    }

    // 3. Cache miss - optionally fetch fresh data
    if (options.fetchFunction) {
      try {
        const freshData = await options.fetchFunction()

        // Store in both caches
        await this.set(key, freshData, options)

        await AnalyticsOperations.updateCacheMetrics(false, Date.now() - startTime)

        return {
          data: freshData,
          source: 'miss',
          hit: false
        }
      } catch (error) {
        console.error('Cache fetch function error:', error)
      }
    }

    await AnalyticsOperations.updateCacheMetrics(false, Date.now() - startTime)

    return {
      data: null,
      source: 'miss',
      hit: false
    }
  }

  /**
   * Set data in multi-level cache
   */
  static async set<T = any>(
    key: string,
    data: T,
    options: {
      redisTTL?: number
      memoryTTL?: number
      skipMemory?: boolean
      skipRedis?: boolean
    } = {}
  ): Promise<void> {
    // Store in L1 memory cache (unless skipped)
    if (!options.skipMemory) {
      this.setMemoryCache(key, data, options.memoryTTL || 300)
    }

    // Store in L2 Redis cache (unless skipped)
    if (!options.skipRedis) {
      const redisKey = this.getRedisKey(key)
      const redisTTL = options.redisTTL || 3600 // 1 hour default

      try {
        await redis.setex(redisKey, redisTTL, JSON.stringify(data))
      } catch (error) {
        console.warn('Redis cache write error:', error)
      }
    }
  }

  /**
   * Delete from multi-level cache
   */
  static async delete(key: string): Promise<void> {
    // Delete from L1 memory cache
    this.memoryCache.delete(key)

    // Delete from L2 Redis cache
    try {
      const redisKey = this.getRedisKey(key)
      await redis.del(redisKey)
    } catch (error) {
      console.warn('Redis cache delete error:', error)
    }
  }

  /**
   * Clear all cache levels
   */
  static async clear(pattern?: string): Promise<void> {
    // Clear L1 memory cache
    if (pattern) {
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key)
        }
      }
    } else {
      this.memoryCache.clear()
    }

    // Clear L2 Redis cache (pattern deletion is complex in Redis)
    // For now, we'll rely on TTL expiration
  }

  // =============================================================================
  // MEMORY CACHE MANAGEMENT
  // =============================================================================

  private static setMemoryCache<T>(key: string, data: T, ttlSeconds: number): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.MAX_MEMORY_SIZE) {
      this.evictLRU()
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000, // Convert to milliseconds
      accessCount: 0,
      lastAccessed: Date.now()
    })
  }

  private static isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private static evictLRU(): void {
    // Find least recently used entry
    let lruKey: string | null = null
    let lruTime = Date.now()

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed
        lruKey = key
      }
    }

    if (lruKey) {
      this.memoryCache.delete(lruKey)
    }
  }

  private static cleanupExpiredEntries(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.memoryCache.delete(key))
  }

  // =============================================================================
  // CACHE STRATEGIES BY DATA TYPE
  // =============================================================================

  /**
   * Token data cache strategy (frequently accessed, moderate TTL)
   */
  static async getTokenData(tokenId: string): Promise<any> {
    const cacheKey = `token:${tokenId}`

    return await this.get(cacheKey, {
      redisTTL: 1800, // 30 minutes in Redis
      memoryTTL: 300,  // 5 minutes in memory
      fetchFunction: async () => {
        // This would call your token fetching logic
        // For now, return null to indicate cache miss
        return null
      }
    })
  }

  /**
   * Collection data cache strategy (high traffic, short TTL)
   */
  static async getCollectionData(contractId: string, page: number): Promise<any> {
    const cacheKey = `collection:${contractId}:page:${page}`

    return await this.get(cacheKey, {
      redisTTL: 600,  // 10 minutes in Redis
      memoryTTL: 60,   // 1 minute in memory
      fetchFunction: async () => {
        // This would call your collection fetching logic
        return null
      }
    })
  }

  /**
   * Owner data cache strategy (personalized, longer TTL)
   */
  static async getOwnerData(ownerAddress: string): Promise<any> {
    const cacheKey = `owner:${ownerAddress}`

    return await this.get(cacheKey, {
      redisTTL: 3600, // 1 hour in Redis
      memoryTTL: 600,  // 10 minutes in memory
      fetchFunction: async () => {
        // This would call your owner data fetching logic
        return null
      }
    })
  }

  /**
   * Static metadata cache strategy (rarely changes, long TTL)
   */
  static async getStaticMetadata(tokenId: string): Promise<any> {
    const cacheKey = `metadata:static:${tokenId}`

    return await this.get(cacheKey, {
      redisTTL: 86400, // 24 hours in Redis
      memoryTTL: 1800,  // 30 minutes in memory
      fetchFunction: async () => {
        // This would call your static metadata fetching logic
        return null
      }
    })
  }

  /**
   * Dynamic data cache strategy (changes frequently, short TTL)
   */
  static async getDynamicData(tokenId: string): Promise<any> {
    const cacheKey = `metadata:dynamic:${tokenId}`

    return await this.get(cacheKey, {
      redisTTL: 300,  // 5 minutes in Redis
      memoryTTL: 60,   // 1 minute in memory
      fetchFunction: async () => {
        // This would call your dynamic data fetching logic
        return null
      }
    })
  }

  // =============================================================================
  // CACHE WARMING AND PREDICTIVE LOADING
  // =============================================================================

  /**
   * Warm cache for anticipated requests
   */
  static async warmCache(tokens: string[], strategy: 'aggressive' | 'conservative' = 'conservative'): Promise<void> {
    const promises: Promise<void>[] = []

    for (const tokenId of tokens) {
      promises.push(
        this.getTokenData(tokenId).then(() => {}) // Ignore result, just warm cache
      )

      if (strategy === 'aggressive') {
        // Also warm related data
        promises.push(
          this.getStaticMetadata(tokenId).then(() => {}),
          this.getDynamicData(tokenId).then(() => {})
        )
      }
    }

    await Promise.allSettled(promises)
  }

  /**
   * Predictive cache warming based on user behavior
   */
  static async warmPredictiveCache(userAddress: string, recentActions: string[]): Promise<void> {
    // Analyze user behavior patterns and warm relevant caches
    // This would be more sophisticated in production

    const relatedTokens = await this.getRelatedTokens(userAddress)
    await this.warmCache(relatedTokens, 'conservative')
  }

  private static async getRelatedTokens(userAddress: string): Promise<string[]> {
    // Get tokens owned by user or recently interacted with
    // Implementation would depend on your data access patterns
    return []
  }

  // =============================================================================
  // CACHE MONITORING AND METRICS
  // =============================================================================

  /**
   * Get cache performance metrics
   */
  static getCacheStats(): {
    memoryCache: {
      size: number
      maxSize: number
      hitRate: number
    }
    recentPerformance: any
  } {
    const totalEntries = this.memoryCache.size
    const recentHits = Array.from(this.memoryCache.values())
      .filter(entry => entry.lastAccessed > Date.now() - 60000) // Last minute
      .reduce((sum, entry) => sum + entry.accessCount, 0)

    return {
      memoryCache: {
        size: totalEntries,
        maxSize: this.MAX_MEMORY_SIZE,
        hitRate: totalEntries > 0 ? recentHits / totalEntries : 0
      },
      recentPerformance: {} // Would integrate with AnalyticsOperations
    }
  }

  /**
   * Health check for cache system
   */
  static async healthCheck(): Promise<{
    memoryCache: 'healthy' | 'degraded'
    redisCache: 'healthy' | 'degraded' | 'unavailable'
    overall: 'healthy' | 'degraded' | 'unavailable'
  }> {
    let memoryStatus: 'healthy' | 'degraded' = 'healthy'
    let redisStatus: 'healthy' | 'degraded' | 'unavailable' = 'unavailable'

    // Check memory cache
    if (this.memoryCache.size > this.MAX_MEMORY_SIZE * 0.9) {
      memoryStatus = 'degraded'
    }

    // Check Redis cache
    try {
      await redis.ping()
      redisStatus = 'healthy'
    } catch (error) {
      console.warn('Redis health check failed:', error)
      redisStatus = 'unavailable'
    }

    const overall = redisStatus === 'unavailable' ? 'degraded' :
                   (memoryStatus === 'degraded') ? 'degraded' : 'healthy'

    return {
      memoryCache: memoryStatus,
      redisCache: redisStatus,
      overall
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private static getRedisKey(key: string): string {
    return `cache:multilevel:${key}`
  }

  /**
   * Batch operations for efficiency
   */
  static async batchGet<T = any>(keys: string[], options: any = {}): Promise<Map<string, T>> {
    const results = new Map<string, T>()

    // Get from memory cache first
    const memoryResults = new Map<string, T>()
    for (const key of keys) {
      const entry = this.memoryCache.get(key)
      if (entry && !this.isExpired(entry)) {
        memoryResults.set(key, entry.data)
      }
    }

    // Get remaining keys from Redis
    const missingKeys = keys.filter(key => !memoryResults.has(key))
    if (missingKeys.length > 0) {
      const pipeline = redis.pipeline()

      for (const key of missingKeys) {
        const redisKey = this.getRedisKey(key)
        pipeline.get(redisKey)
      }

      const redisResults = await pipeline.exec()
      let index = 0

      for (const key of missingKeys) {
        const result = redisResults[index]
        if (result && result[1]) { // Redis pipeline result format
          const data = JSON.parse(result[1] as string)
          memoryResults.set(key, data)

          // Also store in memory cache
          this.setMemoryCache(key, data, options.memoryTTL || 300)
        }
        index++
      }
    }

    // Return all results
    for (const key of keys) {
      const data = memoryResults.get(key)
      if (data !== undefined) {
        results.set(key, data)
      }
    }

    return results
  }
}

// =============================================================================
// CACHE INVALIDATION WRAPPER
// =============================================================================

export class SmartMultiLevelCache {
  /**
   * Invalidate cache across all levels with smart strategies
   */
  static async invalidateTokenCache(tokenId: string, changeType: 'metadata' | 'ownership' | 'maintenance' = 'metadata'): Promise<void> {
    const cacheKeys = [
      `token:${tokenId}`,
      `metadata:static:${tokenId}`,
      `metadata:dynamic:${tokenId}`
    ]

    // Delete from multi-level cache
    await Promise.all(cacheKeys.map(key => MultiLevelCache.delete(key)))

    // Additional invalidation based on change type
    switch (changeType) {
      case 'ownership':
        // Invalidate owner-related caches
        await MultiLevelCache.clear(`owner:`)
        break

      case 'maintenance':
        // Invalidate dynamic data cache
        await MultiLevelCache.delete(`metadata:dynamic:${tokenId}`)
        break
    }
  }

  /**
   * Warm cache for user session
   */
  static async warmUserSession(userAddress: string): Promise<void> {
    // Warm user's owned tokens
    await MultiLevelCache.warmPredictiveCache(userAddress, [])
  }
}
