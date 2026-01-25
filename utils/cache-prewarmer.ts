/**
 * Cache Pre-warmer for Marketplace
 *
 * Pre-loads popular marketplace pages into Redis cache for instant loading
 */

import { getContractAddress } from '@/app/api/rug-market/collection/networks'

interface PrewarmOptions {
  chainId: number
  pagesToPrewarm?: number
  itemsPerPage?: number
  delayBetweenPages?: number
}

export class MarketplaceCachePrewarmer {
  private static instance: MarketplaceCachePrewarmer | null = null
  private isRunning = false

  static getInstance(): MarketplaceCachePrewarmer {
    if (!MarketplaceCachePrewarmer.instance) {
      MarketplaceCachePrewarmer.instance = new MarketplaceCachePrewarmer()
    }
    return MarketplaceCachePrewarmer.instance
  }

  /**
   * Pre-warm cache for popular marketplace pages
   */
  async prewarmCache(options: PrewarmOptions): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Cache pre-warming already running, skipping...')
      return
    }

    this.isRunning = true
    const {
      chainId,
      pagesToPrewarm = 5, // Pre-warm first 5 pages
      itemsPerPage = 24,
      delayBetweenPages = 2000 // 2 second delay between pages
    } = options

    try {
      console.log(`🚀 Starting marketplace cache pre-warming for chain ${chainId}...`)

      const contractAddress = getContractAddress(chainId)
      if (!contractAddress) {
        console.error(`❌ No contract address for chain ${chainId}`)
        return
      }

      // Pre-warm pages 1-5 (most popular pages)
      for (let page = 1; page <= pagesToPrewarm; page++) {
        try {
          const offset = (page - 1) * itemsPerPage

          console.log(`🔥 Pre-warming page ${page} (offset: ${offset})...`)

          // Call the marketplace API to trigger caching
          const apiUrl = `${window.location.origin}/api/rug-market/collection?contractAddress=${contractAddress}&chainId=${chainId}&includeMetadata=true&limit=${itemsPerPage}&offset=${offset}&forceCacheRefresh=true`

          const response = await fetch(apiUrl)
          if (!response.ok) {
            console.warn(`⚠️ Failed to pre-warm page ${page}: ${response.status}`)
            continue
          }

          const data = await response.json()
          console.log(`✅ Pre-warmed page ${page} (${data.nfts?.length || 0} NFTs cached)`)

          // Delay between pages to avoid overwhelming the system
          if (page < pagesToPrewarm) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenPages))
          }

        } catch (error) {
          console.error(`❌ Error pre-warming page ${page}:`, error)
          // Continue with next page
        }
      }

      console.log(`🎉 Cache pre-warming completed successfully!`)

    } catch (error) {
      console.error('❌ Cache pre-warming failed:', error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Pre-warm cache on application startup
   */
  async prewarmOnStartup(chainId: number = 84532): Promise<void> {
    // Delay pre-warming to avoid interfering with initial page load
    setTimeout(() => {
      this.prewarmCache({ chainId })
    }, 10000) // 10 seconds after startup
  }

  /**
   * Pre-warm cache when marketplace becomes idle
   */
  setupIdlePrewarming(chainId: number = 84532): void {
    let idleTimer: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        // User has been idle for 30 seconds, pre-warm cache
        this.prewarmCache({ chainId })
      }, 30000)
    }

    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true })
    })

    resetTimer() // Start initial timer
  }
}

// Export singleton instance
export const marketplaceCachePrewarmer = MarketplaceCachePrewarmer.getInstance()