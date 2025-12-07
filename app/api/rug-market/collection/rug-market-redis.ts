/**
 * Rug Market Redis Operations
 *
 * Handles all Redis operations for Rug Market data with proper error handling
 */

import { redis } from './redis'
import {
  RugPermanentData,
  RugDynamicData,
  RugMarketNFT,
  CollectionStats,
  MarketplaceActivity,
  RugMarketKeys
} from './rug-market-types'

// Activity feed TTL (7 days in seconds)
const ACTIVITY_TTL = 7 * 24 * 60 * 60

export class RugMarketRedis {
  /**
   * Get permanent data for a single NFT
   */
  static async getPermanentData(
    chainId: number,
    contract: string,
    tokenId: number
  ): Promise<RugPermanentData | null> {
    try {
      const key = RugMarketKeys.permanentData(chainId, contract, tokenId)
      const data = await redis.get<any>(key)
      if (!data) return null

      // Convert string values back to BigInt
      return {
        ...data,
        seed: BigInt(data.seed),
        mintTime: BigInt(data.mintTime),
        characterCount: data.characterCount ? BigInt(data.characterCount) : undefined,
        stripeCount: data.stripeCount ? BigInt(data.stripeCount) : undefined
      }
    } catch (error) {
      console.error(`Failed to get permanent data for NFT ${tokenId}:`, error)
      return null
    }
  }

  /**
   * Set permanent data for a single NFT
   */
  static async setPermanentData(
    chainId: number,
    contract: string,
    tokenId: number,
    data: RugPermanentData
  ): Promise<void> {
    try {
      const key = RugMarketKeys.permanentData(chainId, contract, tokenId)
      // Convert BigInt values to strings for Redis storage
      const redisData = {
        ...data,
        seed: data.seed.toString(),
        mintTime: data.mintTime.toString(),
        characterCount: data.characterCount?.toString(),
        stripeCount: data.stripeCount?.toString()
      }
      await redis.set(key, redisData)
      console.log(`✅ Set permanent data for NFT ${tokenId}`)
    } catch (error) {
      console.error(`Failed to set permanent data for NFT ${tokenId}:`, error)
      throw error
    }
  }

  /**
   * Get dynamic data for a single NFT
   */
  static async getDynamicData(
    chainId: number,
    contract: string,
    tokenId: number
  ): Promise<RugDynamicData | null> {
    try {
      const key = RugMarketKeys.dynamicData(chainId, contract, tokenId)
      const data = await redis.get<any>(key)
      if (!data) return null

      // Convert string values back to BigInt
      return {
        ...data,
        maintenanceScore: BigInt(data.maintenanceScore),
        lastCleaned: BigInt(data.lastCleaned),
        ownershipHistory: data.ownershipHistory.map((history: any) => ({
          ...history,
          acquiredAt: BigInt(history.acquiredAt)
        })),
        saleHistory: data.saleHistory.map((sale: any) => ({
          ...sale,
          timestamp: BigInt(sale.timestamp)
        })),
        lastUpdated: BigInt(data.lastUpdated)
      }
    } catch (error) {
      console.error(`Failed to get dynamic data for NFT ${tokenId}:`, error)
      return null
    }
  }

  /**
   * Set dynamic data for a single NFT
   */
  static async setDynamicData(
    chainId: number,
    contract: string,
    tokenId: number,
    data: RugDynamicData
  ): Promise<void> {
    try {
      const key = RugMarketKeys.dynamicData(chainId, contract, tokenId)
      // Convert BigInt values to strings for Redis storage
      const redisData = {
        ...data,
        maintenanceScore: data.maintenanceScore.toString(),
        lastCleaned: data.lastCleaned.toString(),
        ownershipHistory: data.ownershipHistory.map(history => ({
          ...history,
          acquiredAt: history.acquiredAt.toString()
        })),
        saleHistory: data.saleHistory.map(sale => ({
          ...sale,
          timestamp: sale.timestamp.toString()
        })),
        lastUpdated: data.lastUpdated.toString()
      }
      await redis.set(key, redisData)
      console.log(`✅ Set dynamic data for NFT ${tokenId}`)
    } catch (error) {
      console.error(`Failed to set dynamic data for NFT ${tokenId}:`, error)
      throw error
    }
  }

  /**
   * Get complete NFT data (permanent + dynamic)
   */
  static async getNFTData(
    chainId: number,
    contract: string,
    tokenId: number
  ): Promise<RugMarketNFT | null> {
    try {
      console.log(`[Redis] getNFTData called for token ${tokenId}`)
      const [permanent, dynamic] = await Promise.all([
        this.getPermanentData(chainId, contract, tokenId),
        this.getDynamicData(chainId, contract, tokenId)
      ])

      console.log(`[Redis] permanent: ${!!permanent}, dynamic: ${!!dynamic}`)

      if (!permanent || !dynamic) {
        console.log(`[Redis] Missing data for token ${tokenId}: permanent=${!!permanent}, dynamic=${!!dynamic}`)
        return null
      }

      const result = { permanent, dynamic }
      console.log(`[Redis] Returning NFT data for token ${tokenId}`)
      return result
    } catch (error) {
      console.error(`Failed to get complete NFT data for ${tokenId}:`, error)
      return null
    }
  }

  /**
   * Set complete NFT data (permanent + dynamic)
   */
  static async setNFTData(
    chainId: number,
    contract: string,
    tokenId: number,
    data: RugMarketNFT
  ): Promise<void> {
    try {
      await Promise.all([
        this.setPermanentData(chainId, contract, tokenId, data.permanent),
        this.setDynamicData(chainId, contract, tokenId, data.dynamic)
      ])
      console.log(`✅ Set complete data for NFT ${tokenId}`)
    } catch (error) {
      console.error(`Failed to set complete NFT data for ${tokenId}:`, error)
      throw error
    }
  }

  /**
   * Update only dynamic data for an NFT (used for maintenance/marketplace actions)
   */
  static async updateDynamicData(
    chainId: number,
    contract: string,
    tokenId: number,
    updates: Partial<RugDynamicData>
  ): Promise<void> {
    try {
      const existing = await this.getDynamicData(chainId, contract, tokenId)
      if (!existing) {
        throw new Error(`No existing dynamic data for NFT ${tokenId}`)
      }

      const updated = {
        ...existing,
        ...updates,
        lastUpdated: BigInt(Date.now())
      }

      await this.setDynamicData(chainId, contract, tokenId, updated)
      console.log(`✅ Updated dynamic data for NFT ${tokenId}`)
    } catch (error) {
      console.error(`Failed to update dynamic data for NFT ${tokenId}:`, error)
      throw error
    }
  }

  /**
   * Get collection statistics
   */
  static async getCollectionStats(
    chainId: number,
    contract: string
  ): Promise<CollectionStats | null> {
    try {
      const key = RugMarketKeys.collectionStats(chainId, contract)
      const data = await redis.get<any>(key)
      if (!data) return null

      // Convert string values back to BigInt
      return {
        ...data,
        lastUpdated: BigInt(data.lastUpdated)
      }
    } catch (error) {
      console.error('Failed to get collection stats:', error)
      return null
    }
  }

  /**
   * Set collection statistics
   */
  static async setCollectionStats(
    chainId: number,
    contract: string,
    stats: CollectionStats
  ): Promise<void> {
    try {
      const key = RugMarketKeys.collectionStats(chainId, contract)
      // Convert BigInt values to strings for Redis storage
      const redisData = {
        ...stats,
        lastUpdated: stats.lastUpdated.toString()
      }
      await redis.set(key, redisData)
      console.log('✅ Set collection stats')
    } catch (error) {
      console.error('Failed to set collection stats:', error)
      throw error
    }
  }

  /**
   * Add activity to the feed
   */
  static async addActivity(
    chainId: number,
    contract: string,
    activity: MarketplaceActivity
  ): Promise<void> {
    try {
      const key = RugMarketKeys.activityFeed(chainId, contract)

      // Add to sorted set by timestamp (score = timestamp)
      await redis.zadd(key, { score: Number(activity.timestamp), member: JSON.stringify(activity) })

      // Keep only recent activities (last 1000)
      await redis.zremrangebyrank(key, 0, -1001)

      // Set TTL
      await redis.expire(key, ACTIVITY_TTL)

      console.log(`✅ Added ${activity.type} activity for NFT ${activity.tokenId}`)
    } catch (error) {
      console.error('Failed to add activity:', error)
      throw error
    }
  }

  /**
   * Get recent activities
   */
  static async getActivities(
    chainId: number,
    contract: string,
    limit: number = 20
  ): Promise<MarketplaceActivity[]> {
    try {
      const key = RugMarketKeys.activityFeed(chainId, contract)

      // Get most recent activities (highest timestamps)
      const activitiesJson = await redis.zrange(key, limit - 1, 0, { rev: true })

      return activitiesJson.map((json: string) => JSON.parse(json))
    } catch (error) {
      console.error('Failed to get activities:', error)
      return []
    }
  }

  /**
   * Batch get NFT data for multiple tokens
   */
  static async getNFTDataBatch(
    chainId: number,
    contract: string,
    tokenIds: number[]
  ): Promise<(RugMarketNFT | null)[]> {
    try {
      const permanentKeys = RugMarketKeys.permanentDataBatch(chainId, contract, tokenIds)
      const dynamicKeys = RugMarketKeys.dynamicDataBatch(chainId, contract, tokenIds)

      const [permanentData, dynamicData] = await Promise.all([
        redis.mget(...permanentKeys),
        redis.mget(...dynamicKeys)
      ])

      return tokenIds.map((_, index) => {
        const permRaw = permanentData[index] as any
        const dynRaw = dynamicData[index] as any

        if (!permRaw || !dynRaw) return null

        // Convert string values back to BigInt
        const perm: RugPermanentData = {
          ...permRaw,
          seed: BigInt(permRaw.seed),
          mintTime: BigInt(permRaw.mintTime),
          characterCount: permRaw.characterCount ? BigInt(permRaw.characterCount) : undefined,
          stripeCount: permRaw.stripeCount ? BigInt(permRaw.stripeCount) : undefined
        }

        const dyn: RugDynamicData = {
          ...dynRaw,
          maintenanceScore: BigInt(dynRaw.maintenanceScore),
          lastCleaned: BigInt(dynRaw.lastCleaned),
          ownershipHistory: dynRaw.ownershipHistory.map((history: any) => ({
            ...history,
            acquiredAt: BigInt(history.acquiredAt)
          })),
          saleHistory: dynRaw.saleHistory.map((sale: any) => ({
            ...sale,
            timestamp: BigInt(sale.timestamp)
          })),
          lastUpdated: BigInt(dynRaw.lastUpdated)
        }

        return { permanent: perm, dynamic: dyn }
      })
    } catch (error) {
      console.error('Failed to batch get NFT data:', error)
      return tokenIds.map(() => null)
    }
  }

  /**
   * Clear collection cache (stats and NFT keys)
   */
  static async clearCollectionCache(chainId: number, contract: string): Promise<void> {
    try {
      const statsKey = RugMarketKeys.collectionStats(chainId, contract)
      await redis.del(statsKey)
      console.log(`✅ Cleared collection stats cache for ${chainId}:${contract}`)
    } catch (error) {
      console.error('Failed to clear collection cache:', error)
    }
  }

  /**
   * Clear batch of NFT data from cache
   */
  static async clearNFTDataBatch(chainId: number, contract: string, tokenIds: number[]): Promise<void> {
    try {
      const permanentKeys = RugMarketKeys.permanentDataBatch(chainId, contract, tokenIds)
      const dynamicKeys = RugMarketKeys.dynamicDataBatch(chainId, contract, tokenIds)
      const allKeys = [...permanentKeys, ...dynamicKeys]

      if (allKeys.length > 0) {
        await redis.del(...allKeys)
        console.log(`✅ Cleared ${allKeys.length} NFT cache keys for ${tokenIds.length} tokens`)
      }
    } catch (error) {
      console.error('Failed to clear NFT data batch:', error)
    }
  }
}
