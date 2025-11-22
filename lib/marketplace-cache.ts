/**
 * Marketplace activity cache using Redis
 *
 * WARNING: This is example code - adapt imports and types to your real project.
 * Caches marketplace events (sales, listings, bids, offers) for fast access.
 */

import { redis } from './redis'

// Cache TTLs (in seconds)
const ACTIVITY_TTL = 60 // 1 minute - activity feed updates frequently
const LISTING_TTL = 300 // 5 minutes - listings change less often

/**
 * Activity types for marketplace events
 */
export type ActivityType = 'sale' | 'listing' | 'bid' | 'offer' | 'cancel'

export interface MarketplaceActivity {
  id: string
  type: ActivityType
  tokenId: number
  price?: string
  from?: string
  to?: string
  timestamp: number
  txHash: string
}

/**
 * Redis key helpers for marketplace data
 */
export function getActivityKey(chainId: number, contract: string): string {
  return `marketplace:activity:${chainId}:${contract}`
}

export function getActivityFeedKey(chainId: number, contract: string, limit: number): string {
  return `marketplace:feed:${chainId}:${contract}:limit:${limit}`
}

export function getListingKey(chainId: number, contract: string, tokenId: number): string {
  return `marketplace:listing:${chainId}:${contract}:${tokenId}`
}

export function getListingsKey(chainId: number, contract: string): string {
  return `marketplace:listings:${chainId}:${contract}`
}

/**
 * Cache marketplace activities (sales, listings, etc.)
 */
export async function cacheActivity(
  chainId: number,
  contract: string,
  activities: MarketplaceActivity[]
): Promise<void> {
  if (activities.length === 0) return

  try {
    const activityKey = getActivityKey(chainId, contract)

    // Add new activities to the list
    const pipeline = redis.pipeline()

    for (const activity of activities) {
      // Add to sorted set by timestamp (score = timestamp)
      pipeline.zadd(activityKey, { score: activity.timestamp, member: JSON.stringify(activity) })
    }

    // Trim to keep only recent activities (last 1000)
    pipeline.zremrangebyrank(activityKey, 0, -1001) // Keep 1000 most recent

    // Set TTL
    pipeline.expire(activityKey, ACTIVITY_TTL)

    await pipeline.exec()
  } catch (error) {
    console.error('Failed to cache marketplace activity:', error)
  }
}

/**
 * Get cached marketplace activity feed
 */
export async function getCachedActivityFeed(
  chainId: number,
  contract: string,
  limit: number = 20
): Promise<MarketplaceActivity[]> {
  try {
    const activityKey = getActivityKey(chainId, contract)

    // Get the most recent activities (highest timestamps)
    const activitiesJson = await redis.zrange(activityKey, limit - 1, 0, { rev: true })

    return activitiesJson.map((json: string) => JSON.parse(json))
  } catch (error) {
    console.error('Failed to get cached activity feed:', error)
    return []
  }
}

/**
 * Cache NFT listing data
 */
export async function cacheListing(
  chainId: number,
  contract: string,
  tokenId: number,
  listingData: {
    isListed: boolean
    price?: string
    seller?: string
    expiration?: number
  }
): Promise<void> {
  try {
    const listingKey = getListingKey(chainId, contract, tokenId)
    await redis.setex(listingKey, LISTING_TTL, JSON.stringify(listingData))

    // Also update the listings index
    const listingsKey = getListingsKey(chainId, contract)
    const pipeline = redis.pipeline()

    if (listingData.isListed) {
      // Add to active listings set
      pipeline.sadd(listingsKey, tokenId.toString())
    } else {
      // Remove from active listings set
      pipeline.srem(listingsKey, tokenId.toString())
    }

    pipeline.expire(listingsKey, LISTING_TTL)
    await pipeline.exec()
  } catch (error) {
    console.error('Failed to cache listing:', error)
  }
}

/**
 * Get cached listing data
 */
export async function getCachedListing(
  chainId: number,
  contract: string,
  tokenId: number
): Promise<{ isListed: boolean; price?: string; seller?: string; expiration?: number } | null> {
  try {
    const listingKey = getListingKey(chainId, contract, tokenId)
    const data = await redis.get(listingKey)

    if (!data) return null

    return JSON.parse(data as string)
  } catch (error) {
    console.error('Failed to get cached listing:', error)
    return null
  }
}

/**
 * Get all active listings for a contract
 */
export async function getCachedActiveListings(
  chainId: number,
  contract: string
): Promise<number[]> {
  try {
    const listingsKey = getListingsKey(chainId, contract)
    const listingIds = await redis.smembers(listingsKey)

    return listingIds.map(id => parseInt(id)).filter(id => !isNaN(id))
  } catch (error) {
    console.error('Failed to get cached active listings:', error)
    return []
  }
}

/**
 * Invalidate cached data when events occur
 */
export async function invalidateListingCache(
  chainId: number,
  contract: string,
  tokenId: number
): Promise<void> {
  try {
    const listingKey = getListingKey(chainId, contract, tokenId)
    await redis.del(listingKey)
  } catch (error) {
    console.error('Failed to invalidate listing cache:', error)
  }
}

/**
 * Update activity feed with new events
 * Call this when marketplace events occur (sales, listings, etc.)
 */
export async function addMarketplaceEvent(
  chainId: number,
  contract: string,
  event: Omit<MarketplaceActivity, 'id'>
): Promise<void> {
  const activity: MarketplaceActivity = {
    ...event,
    id: `${event.type}-${event.tokenId}-${event.timestamp}-${event.txHash}`,
  }

  await cacheActivity(chainId, contract, [activity])
}

/**
 * Example usage patterns for the activity feed
 *
 * // When a sale occurs:
 * await addMarketplaceEvent(chainId, contract, {
 *   type: 'sale',
 *   tokenId: 123,
 *   price: '1.5',
 *   from: sellerAddress,
 *   to: buyerAddress,
 *   timestamp: blockTimestamp,
 *   txHash: transactionHash
 * })
 *
 * // When a listing is created:
 * await cacheListing(chainId, contract, tokenId, {
 *   isListed: true,
 *   price: '2.0',
 *   seller: sellerAddress,
 *   expiration: expirationTimestamp
 * })
 *
 * // Get recent activity:
 * const activities = await getCachedActivityFeed(chainId, contract, 20)
 *
 * // Get all active listings:
 * const activeListings = await getCachedActiveListings(chainId, contract)
 */

