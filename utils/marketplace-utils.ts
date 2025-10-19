/**
 * Marketplace utility functions for calculations, formatting, and filtering
 */

/**
 * Calculate marketplace fee
 */
export function calculateMarketplaceFee(price: bigint, feePercent: number): bigint {
  return (price * BigInt(feePercent)) / BigInt(10000)
}

/**
 * Calculate royalty amount
 */
export function calculateRoyalty(price: bigint, royaltyPercent: number): bigint {
  return (price * BigInt(royaltyPercent)) / BigInt(10000)
}

/**
 * Calculate total amount seller receives after fees and royalties
 */
export function calculateSellerProceeds(
  price: bigint,
  marketplaceFeePercent: number,
  royaltyPercent: number
): bigint {
  const marketplaceFee = calculateMarketplaceFee(price, marketplaceFeePercent)
  const remaining = price - marketplaceFee
  const royalty = calculateRoyalty(remaining, royaltyPercent)
  return remaining - royalty
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const remaining = endTime - now

  if (remaining <= 0) return 'Ended'

  const days = Math.floor(remaining / (24 * 60 * 60))
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((remaining % (60 * 60)) / 60)
  const seconds = remaining % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Check if auction is active
 */
export function isAuctionActive(auction: {
  isActive: boolean
  endTime: number
}): boolean {
  if (!auction.isActive) return false
  const now = Math.floor(Date.now() / 1000)
  return auction.endTime > now
}

/**
 * Check if listing is expired
 */
export function isListingExpired(listing: {
  expiresAt: number
  isActive: boolean
}): boolean {
  if (!listing.isActive) return true
  if (listing.expiresAt === 0) return false // No expiration
  const now = Math.floor(Date.now() / 1000)
  return listing.expiresAt < now
}

/**
 * Check if offer is expired
 */
export function isOfferExpired(offer: {
  expiresAt: number
  isActive: boolean
}): boolean {
  if (!offer.isActive) return true
  if (offer.expiresAt === 0) return false // No expiration
  const now = Math.floor(Date.now() / 1000)
  return offer.expiresAt < now
}

/**
 * Sort NFTs by price
 */
export function sortByPrice<T extends { price?: string | bigint }>(
  items: T[],
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const priceA = typeof a.price === 'string' ? parseFloat(a.price) : Number(a.price || 0)
    const priceB = typeof b.price === 'string' ? parseFloat(b.price) : Number(b.price || 0)
    return direction === 'asc' ? priceA - priceB : priceB - priceA
  })
}

/**
 * Sort NFTs by rarity score
 */
export function sortByRarity<T extends { rarityScore?: number }>(
  items: T[],
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const rarityA = a.rarityScore || 0
    const rarityB = b.rarityScore || 0
    return direction === 'asc' ? rarityA - rarityB : rarityB - rarityA
  })
}

/**
 * Sort auctions by end time
 */
export function sortByEndTime<T extends { endTime?: number }>(
  items: T[],
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const timeA = a.endTime || 0
    const timeB = b.endTime || 0
    return direction === 'asc' ? timeA - timeB : timeB - timeA
  })
}

/**
 * Filter by traits
 */
export function filterByTraits<T extends { traits?: any }>(
  items: T[],
  filters: Record<string, any>
): T[] {
  return items.filter(item => {
    if (!item.traits) return false
    
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') return true
      return item.traits[key] === value
    })
  })
}

/**
 * Filter by condition (dirt level and aging)
 */
export function filterByCondition<T extends { aging?: any }>(
  items: T[],
  filters: {
    minDirtLevel?: number
    maxDirtLevel?: number
    minAgingLevel?: number
    maxAgingLevel?: number
  }
): T[] {
  return items.filter(item => {
    if (!item.aging) return false
    
    const { dirtLevel, agingLevel } = item.aging
    
    if (filters.minDirtLevel !== undefined && dirtLevel < filters.minDirtLevel) return false
    if (filters.maxDirtLevel !== undefined && dirtLevel > filters.maxDirtLevel) return false
    if (filters.minAgingLevel !== undefined && agingLevel < filters.minAgingLevel) return false
    if (filters.maxAgingLevel !== undefined && agingLevel > filters.maxAgingLevel) return false
    
    return true
  })
}

/**
 * Filter by price range
 */
export function filterByPriceRange<T extends { price?: string | bigint }>(
  items: T[],
  minPrice?: string,
  maxPrice?: string
): T[] {
  return items.filter(item => {
    if (!item.price) return false
    
    const price = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price)
    
    if (minPrice && price < parseFloat(minPrice)) return false
    if (maxPrice && price > parseFloat(maxPrice)) return false
    
    return true
  })
}

/**
 * Calculate minimum bid for auction
 */
export function calculateMinimumBid(
  currentBid: bigint,
  startPrice: bigint,
  minBidIncrementPercent: number
): bigint {
  if (currentBid === BigInt(0)) {
    return startPrice
  }
  const increment = (currentBid * BigInt(minBidIncrementPercent)) / BigInt(10000)
  return currentBid + increment
}

/**
 * Format ETH amount with intelligent decimal display
 */
export function formatEth(wei: bigint): string {
  const eth = Number(wei) / 1e18

  // For very small amounts (< 0.001 ETH), show up to 6 decimals
  if (eth < 0.001) {
    return eth.toFixed(6).replace(/\.?0+$/, '') // Remove trailing zeros
  }

  // For small amounts (< 0.01 ETH), show up to 5 decimals
  if (eth < 0.01) {
    return eth.toFixed(5).replace(/\.?0+$/, '') // Remove trailing zeros
  }

  // For amounts < 1 ETH, show 4 decimals
  if (eth < 1) {
    return eth.toFixed(4).replace(/\.?0+$/, '') // Remove trailing zeros
  }

  // For amounts >= 1 ETH, show 2 decimals
  return eth.toFixed(2)
}

/**
 * Parse ETH to wei
 */
export function parseEthToWei(eth: string): bigint {
  return BigInt(Math.floor(parseFloat(eth) * 1e18))
}

/**
 * Get status badge color based on listing type
 */
export function getListingStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'for sale':
      return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'auction':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'offers':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'expired':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    case 'sold':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    default:
      return 'bg-white/10 text-white/60 border-white/20'
  }
}

/**
 * Get condition badge color
 */
export function getConditionColor(dirtLevel: number, agingLevel: number): string {
  if (dirtLevel === 0 && agingLevel === 0) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  }
  if (dirtLevel <= 1 && agingLevel <= 3) {
    return 'bg-green-500/20 text-green-300 border-green-500/30'
  }
  if (dirtLevel <= 1 && agingLevel <= 7) {
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  }
  if (dirtLevel === 2 || agingLevel > 7) {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  }
  return 'bg-red-500/20 text-red-300 border-red-500/30'
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): string {
  if (oldValue === 0) return '+∞'
  const change = ((newValue - oldValue) / oldValue) * 100
  return change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`
}

/**
 * Get time period label
 */
export function getTimePeriodLabel(period: '24h' | '7d' | '30d' | 'all'): string {
  switch (period) {
    case '24h': return 'Last 24 Hours'
    case '7d': return 'Last 7 Days'
    case '30d': return 'Last 30 Days'
    case 'all': return 'All Time'
  }
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

