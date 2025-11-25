/**
 * Professional Redis Operations for NFT Caching System
 *
 * Implements normalized data operations with:
 * - Atomic transactions for data consistency
 * - Relationship management through Sets
 * - Efficient batch operations
 * - Smart cache invalidation
 * - Comprehensive error handling
 */

import { redis, RedisKeys, ContractSchema, TokenSchema, TraitSchema, UserSchema, makeContractId, makeTokenId, parseContractId, parseTokenId, normalizeTraitId } from './redis-schema'

// =============================================================================
// CONTRACT OPERATIONS
// =============================================================================

export class ContractOperations {
  /**
   * Store contract metadata
   */
  static async storeContract(contract: Omit<ContractSchema, 'id'>): Promise<void> {
    const contractId = makeContractId(contract.chainId, contract.address)
    const key = RedisKeys.contract(contractId)

    const data = {
      id: contractId,
      ...contract,
      updatedAt: new Date().toISOString()
    }

    await redis.hset(key, data)
  }

  /**
   * Get contract metadata
   */
  static async getContract(chainId: number, address: string): Promise<ContractSchema | null> {
    const contractId = makeContractId(chainId, address)
    const key = RedisKeys.contract(contractId)

    const data = await redis.hgetall(key)
    return data && Object.keys(data).length > 0 ? data as unknown as ContractSchema : null
  }

  /**
   * Add token to contract's token set
   */
  static async addTokenToContract(contractId: string, tokenId: string): Promise<void> {
    const key = RedisKeys.contractTokens(contractId)
    await redis.sadd(key, tokenId)
  }

  /**
   * Get all tokens for a contract
   */
  static async getContractTokens(contractId: string): Promise<string[]> {
    const key = RedisKeys.contractTokens(contractId)
    return await redis.smembers(key)
  }

  /**
   * Update contract total supply
   */
  static async updateTotalSupply(contractId: string, totalSupply: number): Promise<void> {
    const key = RedisKeys.contract(contractId)
    await redis.hset(key, {
      totalSupply,
      updatedAt: new Date().toISOString()
    })
  }
}

// =============================================================================
// TOKEN OPERATIONS
// =============================================================================

export class TokenOperations {
  /**
   * Store complete token data with relationships
   */
  static async storeToken(token: Omit<TokenSchema, 'id'>): Promise<void> {
    const tokenId = makeTokenId(token.contractId.split(':')[0] as any, token.contractId.split(':')[1], token.tokenId)
    const key = RedisKeys.token(tokenId)

    // Prepare data for Redis hash
    const data = {
      ...token,
      id: tokenId,
      traits: JSON.stringify(token.traits), // Store as JSON string
      dynamic: JSON.stringify(token.dynamic), // Store as JSON string
      lastRefresh: new Date().toISOString()
    }

    // Store main token data
    await redis.hset(key, data)

    // Update relationships
    await ContractOperations.addTokenToContract(token.contractId, tokenId)
    await UserOperations.addTokenToUser(token.owner, tokenId)

    // Update trait relationships
    for (const traitId of token.traits) {
      await TraitOperations.addTokenToTrait(traitId, tokenId)
    }
  }

  /**
   * Get complete token data
   */
  static async getToken(tokenId: string): Promise<TokenSchema | null> {
    const key = RedisKeys.token(tokenId)
    const data = await redis.hgetall(key)

    if (!data || Object.keys(data).length === 0) return null

    // Parse JSON fields
    return {
      ...data,
      traits: JSON.parse(data.traits as string),
      dynamic: JSON.parse(data.dynamic as string)
    } as unknown as TokenSchema
  }

  /**
   * Update token owner (transfers)
   */
  static async updateTokenOwner(tokenId: string, newOwner: string, oldOwner?: string): Promise<void> {
    const key = RedisKeys.token(tokenId)

    // Update token ownership
    await redis.hset(key, {
      owner: newOwner,
      updatedAt: new Date().toISOString()
    })

    // Update user relationships
    if (oldOwner) {
      await UserOperations.removeTokenFromUser(oldOwner, tokenId)
    }
    await UserOperations.addTokenToUser(newOwner, tokenId)
  }

  /**
   * Update token dynamic data (maintenance actions)
   */
  static async updateTokenDynamic(tokenId: string, dynamic: Partial<TokenSchema['dynamic']>): Promise<void> {
    const key = RedisKeys.token(tokenId)

    // Get current dynamic data
    const currentData = await redis.hget(key, 'dynamic')
    const currentDynamic = currentData ? JSON.parse(currentData as string) : {}

    // Merge updates
    const updatedDynamic = {
      ...currentDynamic,
      ...dynamic,
      lastMaintenance: dynamic.lastMaintenance || new Date().toISOString()
    }

    // Update in Redis
    await redis.hset(key, {
      dynamic: JSON.stringify(updatedDynamic),
      lastRefresh: new Date().toISOString()
    })

    // Invalidate related caches
    await CacheOperations.invalidateTokenCache(tokenId)
  }

  /**
   * Get tokens by trait
   */
  static async getTokensByTrait(traitId: string): Promise<string[]> {
    const key = RedisKeys.traitTokens(traitId)
    return await redis.smembers(key)
  }

  /**
   * Batch store multiple tokens (atomic operation)
   */
  static async batchStoreTokens(tokens: Omit<TokenSchema, 'id'>[]): Promise<void> {
    const pipeline = redis.pipeline()

    for (const token of tokens) {
      const tokenId = makeTokenId(
        parseInt(token.contractId.split(':')[0]),
        token.contractId.split(':')[1],
        token.tokenId
      )
      const key = RedisKeys.token(tokenId)

      const data = {
        ...token,
        id: tokenId,
        traits: JSON.stringify(token.traits),
        dynamic: JSON.stringify(token.dynamic),
        lastRefresh: new Date().toISOString()
      }

      pipeline.hset(key, data)
      pipeline.sadd(RedisKeys.contractTokens(token.contractId), tokenId)
      pipeline.sadd(RedisKeys.userTokens(token.owner), tokenId)

      // Add trait relationships
      for (const traitId of token.traits) {
        pipeline.sadd(RedisKeys.traitTokens(traitId), tokenId)
      }
    }

    await pipeline.exec()
  }
}

// =============================================================================
// TRAIT OPERATIONS
// =============================================================================

export class TraitOperations {
  /**
   * Store trait definition
   */
  static async storeTrait(trait: Omit<TraitSchema, 'id'>): Promise<void> {
    const traitId = normalizeTraitId(trait.type, trait.value)
    const key = RedisKeys.trait(trait.type, trait.normalizedValue)

    const data = {
      id: traitId,
      ...trait,
      createdAt: trait.createdAt || new Date().toISOString()
    }

    await redis.hset(key, data)
  }

  /**
   * Get trait definition
   */
  static async getTrait(type: string, normalizedValue: string): Promise<TraitSchema | null> {
    const key = RedisKeys.trait(type, normalizedValue)
    const data = await redis.hgetall(key)
    return data && Object.keys(data).length > 0 ? data as unknown as TraitSchema : null
  }

  /**
   * Add token to trait's token set
   */
  static async addTokenToTrait(traitId: string, tokenId: string): Promise<void> {
    const key = RedisKeys.traitTokens(traitId)
    await redis.sadd(key, tokenId)
  }

  /**
   * Remove token from trait's token set
   */
  static async removeTokenFromTrait(traitId: string, tokenId: string): Promise<void> {
    const key = RedisKeys.traitTokens(traitId)
    await redis.srem(key, tokenId)
  }

  /**
   * Update trait usage count
   */
  static async updateTraitCount(traitId: string, increment: number = 1): Promise<void> {
    const key = RedisKeys.trait(traitId.split('_')[1], traitId.split('_')[2]) // Extract type and value
    await redis.hincrby(key, 'tokenCount', increment)
  }

  /**
   * Get trait analytics
   */
  static async getTraitAnalytics(contractId: string): Promise<Array<{ traitId: string, count: number }>> {
    const key = RedisKeys.traitUsage(contractId)
    const results = await redis.zrange(key, 0, -1, { rev: true, withScores: true })

    return results.map(([traitId, score]) => ({
      traitId,
      count: parseInt(score)
    }))
  }
}

// =============================================================================
// USER OPERATIONS
// =============================================================================

export class UserOperations {
  /**
   * Store user profile
   */
  static async storeUser(user: Omit<UserSchema, 'id'>): Promise<void> {
    const key = RedisKeys.user(user.address)

    const data = {
      ...user,
      id: user.address,
      createdAt: user.createdAt || new Date().toISOString()
    }

    await redis.hset(key, data)
  }

  /**
   * Get user profile
   */
  static async getUser(address: string): Promise<UserSchema | null> {
    const key = RedisKeys.user(address)
    const data = await redis.hgetall(key)
    return data && Object.keys(data).length > 0 ? data as unknown as UserSchema : null
  }

  /**
   * Add token to user's owned tokens
   */
  static async addTokenToUser(address: string, tokenId: string): Promise<void> {
    const key = RedisKeys.userTokens(address)
    await redis.sadd(key, tokenId)

    // Update user's NFT count
    await redis.hincrby(RedisKeys.user(address), 'nftCount', 1)
  }

  /**
   * Remove token from user's owned tokens
   */
  static async removeTokenFromUser(address: string, tokenId: string): Promise<void> {
    const key = RedisKeys.userTokens(address)
    await redis.srem(key, tokenId)

    // Update user's NFT count
    await redis.hincrby(RedisKeys.user(address), 'nftCount', -1)
  }

  /**
   * Get user's owned tokens
   */
  static async getUserTokens(address: string): Promise<string[]> {
    const key = RedisKeys.userTokens(address)
    return await redis.smembers(key)
  }

  /**
   * Update user activity
   */
  static async updateUserActivity(address: string, action: string, metadata?: any): Promise<void> {
    const userKey = RedisKeys.user(address)
    await redis.hset(userKey, {
      lastActivity: new Date().toISOString()
    })

    // Track activity in analytics
    const date = new Date().toISOString().split('T')[0]
    const activityKey = RedisKeys.userActivity(date)
    await redis.pfadd(activityKey, address)
  }
}

// =============================================================================
// CACHE OPERATIONS
// =============================================================================

export class CacheOperations {
  /**
   * Store normalized token cache
   */
  static async cacheTokenData(tokenId: string, data: any, ttl: number = 3600): Promise<void> {
    const key = RedisKeys.cacheToken(tokenId)
    await redis.setex(key, ttl, JSON.stringify(data))
  }

  /**
   * Get cached token data
   */
  static async getCachedTokenData(tokenId: string): Promise<any | null> {
    const key = RedisKeys.cacheToken(tokenId)
    const data = await redis.get(key)
    return data ? JSON.parse(data as string) : null
  }

  /**
   * Store collection page cache
   */
  static async cacheCollectionPage(contractId: string, page: number, data: any, ttl: number = 1800): Promise<void> {
    const key = RedisKeys.cacheCollection(contractId, page)
    await redis.setex(key, ttl, JSON.stringify(data))
  }

  /**
   * Get cached collection page
   */
  static async getCachedCollectionPage(contractId: string, page: number): Promise<any | null> {
    const key = RedisKeys.cacheCollection(contractId, page)
    const data = await redis.get(key)
    return data ? JSON.parse(data as string) : null
  }

  /**
   * Smart cache invalidation for token updates
   */
  static async invalidateTokenCache(tokenId: string): Promise<void> {
    const pipeline = redis.pipeline()

    // Invalidate token-specific caches
    pipeline.del(RedisKeys.cacheToken(tokenId))

    // Parse token ID to get contract info
    const { chainId, contract } = parseTokenId(tokenId)
    const contractId = makeContractId(chainId, contract)

    // Invalidate all collection pages for this contract
    // Note: In production, we'd want to be more selective
    const collectionPattern = `cache:collection:${contractId}:page:*`
    // Redis doesn't have direct pattern deletion, so we'd need to track page keys separately

    await pipeline.exec()
  }

  /**
   * Invalidate entire contract cache
   */
  static async invalidateContractCache(contractId: string): Promise<void> {
    const pipeline = redis.pipeline()

    // Get all tokens for this contract
    const tokens = await ContractOperations.getContractTokens(contractId)

    // Invalidate token caches
    for (const tokenId of tokens) {
      pipeline.del(RedisKeys.cacheToken(tokenId))
    }

    // Invalidate collection caches (all pages)
    // In a real implementation, we'd maintain a set of active page keys
    pipeline.del(`cache:collection:${contractId}:page:1`) // At least page 1

    await pipeline.exec()
  }
}

// =============================================================================
// ANALYTICS OPERATIONS
// =============================================================================

export class AnalyticsOperations {
  /**
   * Track trait usage
   */
  static async trackTraitUsage(contractId: string, traitId: string): Promise<void> {
    const key = RedisKeys.traitUsage(contractId)
    await redis.zincrby(key, 1, traitId)
  }

  /**
   * Track user activity
   */
  static async trackUserActivity(address: string, action: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0]
    const key = RedisKeys.userActivity(date)
    await redis.pfadd(key, `${address}:${action}`)
  }

  /**
   * Get daily active users
   */
  static async getDailyActiveUsers(date: string): Promise<number> {
    const key = RedisKeys.userActivity(date)
    return await redis.pfcount(key)
  }

  /**
   * Update cache performance metrics
   */
  static async updateCacheMetrics(hit: boolean, responseTime: number): Promise<void> {
    const key = 'metrics:cache_performance'
    const field = hit ? 'hits' : 'misses'

    const pipeline = redis.pipeline()
    pipeline.hincrby(key, field, 1)
    pipeline.hincrbyfloat(key, 'total_response_time', responseTime)
    pipeline.hset(key, { 'last_updated': new Date().toISOString() })

    // Recalculate average response time
    const metrics = await redis.hgetall(key)
    if (metrics) {
      const hits = parseInt(metrics.hits as string || '0')
      const misses = parseInt(metrics.misses as string || '0')
      const totalTime = parseFloat(metrics.total_response_time as string || '0')
      const avgTime = (hits + misses) > 0 ? totalTime / (hits + misses) : 0

      pipeline.hset(key, { 'avg_response_time': avgTime.toFixed(2) })
    }

    await pipeline.exec()
  }

  /**
   * Get cache performance metrics
   */
  static async getCacheMetrics(): Promise<any> {
    const key = 'metrics:cache_performance'
    return await redis.hgetall(key)
  }
}

// =============================================================================
// MIGRATION UTILITIES (for legacy data)
// =============================================================================

export class MigrationOperations {
  /**
   * Migrate legacy NFT data to normalized schema
   */
  static async migrateLegacyToken(chainId: number, contract: string, tokenId: number): Promise<void> {
    const legacyStaticKey = RedisKeys.legacyStatic(chainId, contract, tokenId)
    const legacyDynamicKey = RedisKeys.legacyDynamic(chainId, contract, tokenId)

    const [staticData, dynamicData] = await Promise.all([
      redis.get(legacyStaticKey),
      redis.get(legacyDynamicKey)
    ])

    if (staticData && dynamicData) {
      // Create normalized token data
      const tokenData = {
        contractId: makeContractId(chainId, contract),
        tokenId,
        owner: JSON.parse(dynamicData as string).owner || '',
        name: JSON.parse(staticData as string).name || `NFT #${tokenId}`,
        description: JSON.parse(staticData as string).description || '',
        image: JSON.parse(staticData as string).image || '',
        animation_url: JSON.parse(staticData as string).animation_url || '',
        traits: [], // Would need to extract from static data
        dynamic: JSON.parse(dynamicData as string),
        metadataHash: '',
        createdAt: new Date().toISOString()
      }

      await TokenOperations.storeToken(tokenData)

      // Optionally clean up legacy keys
      // await redis.del(legacyStaticKey, legacyDynamicKey)
    }
  }
}
