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
  RugMarketNFTWithCalculated,
  CollectionStats,
  MarketplaceActivity,
  RugMarketKeys
} from './rug-market-types'
import { ContractConfigCache } from './contract-config-cache'
import { calculateDirtLevel, calculateAgingLevel, frameLevelToNumber } from './dynamic-calculator'

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
   * Migrate old format cache entry to new format
   * Old format has dirtLevel/agingLevel stored, new format has baseAgingLevel
   */
  static async migrateOldFormatEntry(
    chainId: number,
    contract: string,
    tokenId: number,
    oldData: any
  ): Promise<void> {
    try {
      console.log(`[Migration] Migrating NFT ${tokenId} from old format to new format`)
      
      // Fetch fresh data from blockchain to get baseAgingLevel and lastCleaned
      const { fetchNFTFromBlockchain } = await import('./blockchain-fetcher')
      const freshData = await fetchNFTFromBlockchain(chainId, contract, tokenId)
      
      if (freshData) {
        // Update with new format (only stored fields)
        await this.setDynamicData(chainId, contract, tokenId, freshData.dynamic)
        console.log(`[Migration] Successfully migrated NFT ${tokenId}`)
      } else {
        console.warn(`[Migration] Could not fetch fresh data for NFT ${tokenId}, keeping old format`)
      }
    } catch (error) {
      console.error(`[Migration] Failed to migrate NFT ${tokenId}:`, error)
      // Don't throw - allow old format to continue working
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

      // Check if this is old format (has dirtLevel/agingLevel but no baseAgingLevel)
      const isOldFormat = (data.dirtLevel !== undefined || data.agingLevel !== undefined) && 
                          data.baseAgingLevel === undefined
      
      if (isOldFormat) {
        console.log(`[Migration] Detected old format for NFT ${tokenId}, migrating...`)
        // Migrate in background (don't block)
        this.migrateOldFormatEntry(chainId, contract, tokenId, data).catch(err => {
          console.error(`[Migration] Background migration failed for NFT ${tokenId}:`, err)
        })
        
        // For now, try to use old data but fetch baseAgingLevel from blockchain
        // This is a lazy migration - will be fully migrated on next read
      }

      // Convert string values back to BigInt
      // Note: dirtLevel and agingLevel are NOT returned here - they're calculated on read
      
      // Normalize lastCleaned - handle both seconds and milliseconds
      let lastCleanedValue = data.lastCleaned
      if (lastCleanedValue) {
        const numValue = typeof lastCleanedValue === 'string' ? parseInt(lastCleanedValue, 10) : Number(lastCleanedValue)
        // If value is > 1e10, it's likely in milliseconds, convert to seconds
        if (numValue > 10000000000) {
          lastCleanedValue = Math.floor(numValue / 1000)
          console.warn(`[Redis] lastCleaned for token ${tokenId} appears to be in milliseconds (${numValue}), converting to seconds (${lastCleanedValue})`)
        }
      } else {
        lastCleanedValue = Math.floor(Date.now() / 1000)
      }
      
      const dynamic: RugDynamicData = {
        baseAgingLevel: data.baseAgingLevel ?? 0,  // Default to 0 if missing (for migration)
        frameLevel: data.frameLevel ?? 'None',
        maintenanceScore: BigInt(data.maintenanceScore || 0),
        lastCleaned: BigInt(lastCleanedValue),
        cleaningCount: data.cleaningCount,
        restorationCount: data.restorationCount,
        masterRestorationCount: data.masterRestorationCount,
        launderingCount: data.launderingCount,
        currentOwner: data.currentOwner || '',
        ownershipHistory: (data.ownershipHistory || []).map((history: any) => ({
          ...history,
          acquiredAt: BigInt(history.acquiredAt)
        })),
        saleHistory: (data.saleHistory || []).map((sale: any) => ({
          ...sale,
          timestamp: BigInt(sale.timestamp)
        })),
        isListed: data.isListed || false,
        listingPrice: data.listingPrice,
        listingSeller: data.listingSeller,
        listingExpiresAt: data.listingExpiresAt ? BigInt(data.listingExpiresAt) : undefined,
        listingTxHash: data.listingTxHash,
        lastSalePrice: data.lastSalePrice,
        lastUpdated: BigInt(data.lastUpdated || Date.now())
      }

      return dynamic
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
   * Get complete NFT data (permanent + dynamic) with calculated values
   * 
   * Calculates dirtLevel and agingLevel on read based on current time
   */
  static async getNFTData(
    chainId: number,
    contract: string,
    tokenId: number
  ): Promise<RugMarketNFTWithCalculated | null> {
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

      // Calculate dirtLevel and agingLevel on read
      let dirtLevel = 0
      let agingLevel = dynamic.baseAgingLevel

      try {
        // Try to get contract config (with fallback)
        let contractConfig
        try {
          contractConfig = await ContractConfigCache.getConfig(chainId)
        } catch (configError) {
          console.error(`[Redis] Failed to get contract config for token ${tokenId}, using defaults:`, configError)
          // Fallback: fetch from blockchain directly
          try {
            const { fetchNFTFromBlockchain } = await import('./blockchain-fetcher')
            const freshData = await fetchNFTFromBlockchain(chainId, contract, tokenId)
            if (freshData) {
              // Return fresh data with calculated values
              const freshWithCalculated = await this.getNFTData(chainId, contract, tokenId)
              if (freshWithCalculated) return freshWithCalculated
            }
          } catch (fallbackError) {
            console.error(`[Redis] Fallback to blockchain also failed for token ${tokenId}:`, fallbackError)
          }
          // If all fails, use baseAgingLevel as agingLevel (no time-based calculation)
          return {
            permanent,
            dynamic: {
              ...dynamic,
              dirtLevel: 0, // Can't calculate without config
              agingLevel: dynamic.baseAgingLevel // Use stored base level
            }
          } as RugMarketNFTWithCalculated
        }
        
        const frameLevelNum = frameLevelToNumber(dynamic.frameLevel)
        
        dirtLevel = calculateDirtLevel(
          dynamic.lastCleaned,
          frameLevelNum,
          contractConfig
        )
        
        agingLevel = calculateAgingLevel(
          dynamic.lastCleaned,
          frameLevelNum,
          dynamic.baseAgingLevel,
          contractConfig
        )

        console.log(`[Redis] Calculated values for token ${tokenId}: dirtLevel=${dirtLevel}, agingLevel=${agingLevel}, lastCleaned=${dynamic.lastCleaned}, baseAgingLevel=${dynamic.baseAgingLevel}`)
      } catch (error) {
        console.error(`[Redis] Failed to calculate dynamic values for token ${tokenId}:`, error)
        // Fallback: return with base values (no time-based calculation)
        return {
          permanent,
          dynamic: {
            ...dynamic,
            dirtLevel: 0, // Default to clean if calculation fails
            agingLevel: dynamic.baseAgingLevel // Use stored base level
          }
        } as RugMarketNFTWithCalculated
      }

      // Return with calculated values
      const result: RugMarketNFTWithCalculated = {
        permanent,
        dynamic: {
          ...dynamic,
          dirtLevel,
          agingLevel
        }
      }

      // Verify calculated values are included
      if (!('dirtLevel' in result.dynamic) || !('agingLevel' in result.dynamic)) {
        console.error(`[Redis] ERROR: Calculated values missing in result for token ${tokenId}!`, {
          hasDirtLevel: 'dirtLevel' in result.dynamic,
          hasAgingLevel: 'agingLevel' in result.dynamic,
          calculatedDirt: dirtLevel,
          calculatedAging: agingLevel
        })
      }

      console.log(`[Redis] Returning NFT data for token ${tokenId} with calculated values: D${dirtLevel} A${agingLevel}`)
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
   * Batch get NFT data for multiple tokens with calculated values
   * 
   * Calculates dirtLevel and agingLevel on read for all NFTs
   */
  static async getNFTDataBatch(
    chainId: number,
    contract: string,
    tokenIds: number[]
  ): Promise<(RugMarketNFTWithCalculated | null)[]> {
    try {
      const permanentKeys = RugMarketKeys.permanentDataBatch(chainId, contract, tokenIds)
      const dynamicKeys = RugMarketKeys.dynamicDataBatch(chainId, contract, tokenIds)

      const [permanentData, dynamicData] = await Promise.all([
        redis.mget(...permanentKeys),
        redis.mget(...dynamicKeys)
      ])

      // Get contract config once for all calculations
      let contractConfig
      try {
        contractConfig = await ContractConfigCache.getConfig(chainId)
      } catch (error) {
        console.error(`[Redis] Failed to get contract config for batch:`, error)
        // Will use defaults in calculation
      }

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

        // Normalize lastCleaned for batch
        let lastCleanedValue = dynRaw.lastCleaned
        if (lastCleanedValue) {
          const numValue = typeof lastCleanedValue === 'string' ? parseInt(lastCleanedValue, 10) : Number(lastCleanedValue)
          if (numValue > 10000000000) {
            lastCleanedValue = Math.floor(numValue / 1000)
          }
        } else {
          lastCleanedValue = Math.floor(Date.now() / 1000)
        }
        
        // Check if old format (has dirtLevel/agingLevel but no baseAgingLevel)
        const isOldFormat = (dynRaw.dirtLevel !== undefined || dynRaw.agingLevel !== undefined) && 
                            dynRaw.baseAgingLevel === undefined
        
        if (isOldFormat) {
          // Migrate in background
          this.migrateOldFormatEntry(chainId, contract, tokenIds[index], dynRaw).catch(err => {
            console.error(`[Migration] Background migration failed for NFT ${tokenIds[index]}:`, err)
          })
        }
        
        const dyn: RugDynamicData = {
          baseAgingLevel: dynRaw.baseAgingLevel ?? 0,  // Default to 0 for old format (will be migrated)
          frameLevel: dynRaw.frameLevel ?? 'None',
          maintenanceScore: BigInt(dynRaw.maintenanceScore || 0),
          lastCleaned: BigInt(lastCleanedValue),
          cleaningCount: dynRaw.cleaningCount,
          restorationCount: dynRaw.restorationCount,
          masterRestorationCount: dynRaw.masterRestorationCount,
          launderingCount: dynRaw.launderingCount,
          currentOwner: dynRaw.currentOwner || '',
          ownershipHistory: (dynRaw.ownershipHistory || []).map((history: any) => ({
            ...history,
            acquiredAt: BigInt(history.acquiredAt)
          })),
          saleHistory: (dynRaw.saleHistory || []).map((sale: any) => ({
            ...sale,
            timestamp: BigInt(sale.timestamp)
          })),
          isListed: dynRaw.isListed || false,
          listingPrice: dynRaw.listingPrice,
          listingSeller: dynRaw.listingSeller,
          listingExpiresAt: dynRaw.listingExpiresAt ? BigInt(dynRaw.listingExpiresAt) : undefined,
          listingTxHash: dynRaw.listingTxHash,
          lastSalePrice: dynRaw.lastSalePrice,
          lastUpdated: BigInt(dynRaw.lastUpdated || Date.now())
        }

        // Calculate dirtLevel and agingLevel
        let dirtLevel = 0
        let agingLevel = dyn.baseAgingLevel

        if (contractConfig) {
          try {
            const frameLevelNum = frameLevelToNumber(dyn.frameLevel)
            dirtLevel = calculateDirtLevel(
              dyn.lastCleaned,
              frameLevelNum,
              contractConfig
            )
            agingLevel = calculateAgingLevel(
              dyn.lastCleaned,
              frameLevelNum,
              dyn.baseAgingLevel,
              contractConfig
            )
          } catch (error) {
            console.error(`[Redis] Failed to calculate values for token ${tokenIds[index]}:`, error)
            // Use defaults: dirtLevel=0, agingLevel=baseAgingLevel
          }
        } else {
          // No contract config available - use base values
          console.warn(`[Redis] No contract config for batch calculation, using base values for token ${tokenIds[index]}`)
        }

        return {
          permanent: perm,
          dynamic: {
            ...dyn,
            dirtLevel,
            agingLevel
          }
        } as RugMarketNFTWithCalculated
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
