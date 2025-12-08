/**
 * Contract Config Cache
 * 
 * Caches contract configuration (aging thresholds) with 24-hour TTL.
 * This config rarely changes, so a long cache duration is appropriate.
 */

import { redis } from './redis'
import { getContractAddress } from './networks'
import { callContractMultiFallback, onchainRugsABI } from '@/lib/web3'

// Contract config cache TTL: 24 hours (in seconds)
const CONFIG_CACHE_TTL = 24 * 60 * 60

export interface ContractConfig {
  dirtLevel1Days: bigint
  dirtLevel2Days: bigint
  agingAdvanceDays: bigint
  freeCleanDays: bigint
  freeCleanWindow: bigint
  lastUpdated: number // Timestamp in milliseconds
  chainId: number
}

/**
 * Get Redis key for contract config cache
 */
function getConfigCacheKey(chainId: number): string {
  return `rugmarket:contract:config:${chainId}`
}

/**
 * Fetch contract config from blockchain
 */
async function fetchConfigFromBlockchain(chainId: number): Promise<ContractConfig> {
  const contractAddress = getContractAddress(chainId)
  if (!contractAddress) {
    throw new Error(`No contract address found for chain ${chainId}`)
  }

  console.log(`[ContractConfigCache] Fetching config from blockchain for chain ${chainId}`)

  try {
    const result = await callContractMultiFallback(
      contractAddress,
      onchainRugsABI,
      'getAgingThresholds',
      [],
      { chainId }
    )

    // Result is an array: [dirtLevel1Days, dirtLevel2Days, agingAdvanceDays, freeCleanDays, freeCleanWindow]
    const [
      dirtLevel1Days,
      dirtLevel2Days,
      agingAdvanceDays,
      freeCleanDays,
      freeCleanWindow
    ] = result as [bigint, bigint, bigint, bigint, bigint]

    const config: ContractConfig = {
      dirtLevel1Days,
      dirtLevel2Days,
      agingAdvanceDays,
      freeCleanDays,
      freeCleanWindow,
      lastUpdated: Date.now(),
      chainId
    }

    console.log(`[ContractConfigCache] Fetched config from blockchain:`, {
      dirtLevel1Days: config.dirtLevel1Days.toString(),
      dirtLevel2Days: config.dirtLevel2Days.toString(),
      agingAdvanceDays: config.agingAdvanceDays.toString(),
      freeCleanDays: config.freeCleanDays.toString(),
      freeCleanWindow: config.freeCleanWindow.toString()
    })

    return config
  } catch (error) {
    console.error(`[ContractConfigCache] Failed to fetch config from blockchain:`, error)
    throw new Error(`Failed to fetch contract config from blockchain: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Contract Config Cache
 * 
 * Provides cached access to contract configuration with 24-hour TTL.
 * Falls back to blockchain if cache is missing or expired.
 */
export class ContractConfigCache {
  /**
   * Get contract config for a chain
   * 
   * - Checks Redis cache first
   * - If cache hit and fresh (< 24 hours), returns cached config
   * - If cache miss or expired, fetches from blockchain and caches it
   * 
   * @param chainId Chain ID to get config for
   * @returns Contract configuration
   */
  static async getConfig(chainId: number): Promise<ContractConfig> {
    const cacheKey = getConfigCacheKey(chainId)

    try {
      // Try to get from cache
      const cached = await redis.get<any>(cacheKey)
      
      if (cached) {
        // Convert BigInt strings back to BigInt
        const config: ContractConfig = {
          dirtLevel1Days: BigInt(cached.dirtLevel1Days),
          dirtLevel2Days: BigInt(cached.dirtLevel2Days),
          agingAdvanceDays: BigInt(cached.agingAdvanceDays),
          freeCleanDays: BigInt(cached.freeCleanDays),
          freeCleanWindow: BigInt(cached.freeCleanWindow),
          lastUpdated: cached.lastUpdated,
          chainId: cached.chainId
        }

        // Check if config is still fresh (within 24 hours)
        const age = Date.now() - config.lastUpdated
        const ageInHours = age / (1000 * 60 * 60)

        if (age < CONFIG_CACHE_TTL * 1000) {
          console.log(`[ContractConfigCache] Cache hit for chain ${chainId} (age: ${ageInHours.toFixed(2)} hours)`)
          return config
        } else {
          console.log(`[ContractConfigCache] Cache expired for chain ${chainId} (age: ${ageInHours.toFixed(2)} hours), fetching fresh`)
        }
      } else {
        console.log(`[ContractConfigCache] Cache miss for chain ${chainId}`)
      }
    } catch (error) {
      console.error(`[ContractConfigCache] Error reading cache for chain ${chainId}:`, error)
      // Continue to fetch from blockchain
    }

    // Cache miss or expired - fetch from blockchain
    const freshConfig = await fetchConfigFromBlockchain(chainId)

    // Store in cache with TTL
    try {
      // Convert BigInt to strings for Redis storage
      const cacheData = {
        dirtLevel1Days: freshConfig.dirtLevel1Days.toString(),
        dirtLevel2Days: freshConfig.dirtLevel2Days.toString(),
        agingAdvanceDays: freshConfig.agingAdvanceDays.toString(),
        freeCleanDays: freshConfig.freeCleanDays.toString(),
        freeCleanWindow: freshConfig.freeCleanWindow.toString(),
        lastUpdated: freshConfig.lastUpdated,
        chainId: freshConfig.chainId
      }

      await redis.setex(cacheKey, CONFIG_CACHE_TTL, cacheData)
      console.log(`[ContractConfigCache] Cached config for chain ${chainId} with TTL ${CONFIG_CACHE_TTL}s`)
    } catch (error) {
      console.error(`[ContractConfigCache] Failed to cache config for chain ${chainId}:`, error)
      // Continue anyway - we have the fresh config
    }

    return freshConfig
  }

  /**
   * Invalidate config cache for a chain
   * 
   * Useful when admin updates contract config
   * 
   * @param chainId Chain ID to invalidate cache for
   */
  static async invalidateConfig(chainId: number): Promise<void> {
    const cacheKey = getConfigCacheKey(chainId)
    try {
      await redis.del(cacheKey)
      console.log(`[ContractConfigCache] Invalidated cache for chain ${chainId}`)
    } catch (error) {
      console.error(`[ContractConfigCache] Failed to invalidate cache for chain ${chainId}:`, error)
    }
  }

  /**
   * Force refresh config from blockchain and update cache
   * 
   * @param chainId Chain ID to refresh config for
   * @returns Fresh contract configuration
   */
  static async refreshConfig(chainId: number): Promise<ContractConfig> {
    // Invalidate cache first
    await this.invalidateConfig(chainId)
    
    // Fetch fresh config (will be cached automatically)
    return await this.getConfig(chainId)
  }
}

