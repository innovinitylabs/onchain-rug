/**
 * Upstash Redis client and key helpers
 * 
 * WARNING: This is example code - adapt imports and types to your real project.
 * All cache operations use Upstash Redis (serverless-safe, no in-memory Maps).
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client
// Support both Vercel KV naming and standard Upstash naming
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

export { redis }

// Cache TTL configuration (in seconds)
export const STATIC_TTL = parseInt(process.env.STATIC_TTL_SECONDS || '86400') // 24 hours
export const DYNAMIC_TTL = parseInt(process.env.DYNAMIC_TTL_SECONDS || '300') // 5 minutes
export const TOKENURI_TTL = parseInt(process.env.TOKENURI_TTL_SECONDS || '3600') // 1 hour

/**
 * Redis key helpers
 * Format: nft:{type}:{chainId}:{contract}:{tokenId}
 */

export function getStaticKey(chainId: number, contract: string, tokenId: number): string {
  return `nft:static:${chainId}:${contract}:${tokenId}`
}

export function getTokenURIKey(chainId: number, contract: string, tokenId: number): string {
  return `nft:tokenuri:${chainId}:${contract}:${tokenId}`
}

export function getDynamicKey(chainId: number, contract: string, tokenId: number): string {
  return `nft:dynamic:${chainId}:${contract}:${tokenId}`
}

export function getHashKey(chainId: number, contract: string, tokenId: number): string {
  return `nft:hash:${chainId}:${contract}:${tokenId}`
}

export function getCollectionKey(chainId: number, contract: string, page: number): string {
  return `nft:collection:${chainId}:${contract}:page:${page}`
}

export function getRefreshOffsetKey(chainId: number, contract: string): string {
  return `nft:refresh-offset:${chainId}:${contract}`
}

/**
 * Batch key generation helpers
 */
export function getStaticKeys(chainId: number, contract: string, tokenIds: number[]): string[] {
  return tokenIds.map(tokenId => getStaticKey(chainId, contract, tokenId))
}

export function getDynamicKeys(chainId: number, contract: string, tokenIds: number[]): string[] {
  return tokenIds.map(tokenId => getDynamicKey(chainId, contract, tokenId))
}

export function getTokenURIKeys(chainId: number, contract: string, tokenIds: number[]): string[] {
  return tokenIds.map(tokenId => getTokenURIKey(chainId, contract, tokenId))
}

/**
 * Cache operations
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key)
    return data
  } catch (error) {
    console.error(`Redis get error for key ${key}:`, error)
    return null
  }
}

export async function setCached<T>(key: string, value: T, ttl?: number): Promise<void> {
  try {
    if (ttl) {
      await redis.setex(key, ttl, value)
    } else {
      await redis.set(key, value)
    }
  } catch (error) {
    console.error(`Redis set error for key ${key}:`, error)
  }
}

export async function getCachedBatch<T>(keys: string[]): Promise<(T | null)[]> {
  try {
    if (keys.length === 0) return []
    const results = await redis.mget<T>(...keys)
    return results || []
  } catch (error) {
    console.error(`Redis mget error for ${keys.length} keys:`, error)
    return keys.map(() => null)
  }
}

export async function setCachedBatch<T>(
  entries: Array<{ key: string; value: T; ttl?: number }>
): Promise<void> {
  try {
    if (entries.length === 0) return
    
    // Use pipeline for batch operations
    const pipeline = redis.pipeline()
    
    for (const { key, value, ttl } of entries) {
      if (ttl) {
        pipeline.setex(key, ttl, value)
      } else {
        pipeline.set(key, value)
      }
    }
    
    await pipeline.exec()
  } catch (error) {
    console.error(`Redis batch set error for ${entries.length} entries:`, error)
  }
}

export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error(`Redis delete error for key ${key}:`, error)
  }
}

export async function deleteCachedBatch(keys: string[]): Promise<void> {
  try {
    if (keys.length === 0) return
    await redis.del(...keys)
  } catch (error) {
    console.error(`Redis batch delete error for ${keys.length} keys:`, error)
  }
}

/**
 * Get refresh offset for incremental cron processing
 */
export async function getRefreshOffset(chainId: number, contract: string): Promise<number> {
  try {
    const key = getRefreshOffsetKey(chainId, contract)
    const offset = await redis.get<number>(key)
    return offset || 0
  } catch (error) {
    console.error(`Redis get refresh offset error:`, error)
    return 0
  }
}

/**
 * Set refresh offset for incremental cron processing
 */
export async function setRefreshOffset(chainId: number, contract: string, offset: number): Promise<void> {
  try {
    const key = getRefreshOffsetKey(chainId, contract)
    // No TTL on offset - it persists until manually reset
    await redis.set(key, offset)
  } catch (error) {
    console.error(`Redis set refresh offset error:`, error)
  }
}

