'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '../../components/Navigation'
import Footer from '../../components/Footer'
import LoadingAnimation from '../../components/LoadingAnimation'
import RugMarketGrid from '../../components/RugMarketGrid'
import RugDetailModal from '../../components/rug-market/RugDetailModal'
import { ShoppingCart, Sparkles, TrendingUp } from 'lucide-react'
import { RugMarketNFT } from '../../lib/rug-market-types'

type ListingFilter = 'all' | 'listed' | 'unlisted'
type SortOption = 'tokenId' | 'price-low' | 'price-high' | 'rarity' | 'newest'

export default function RugMarketPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [allNFTs, setAllNFTs] = useState<RugMarketNFT[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [listingFilter, setListingFilter] = useState<ListingFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('tokenId')
  const [selectedNFT, setSelectedNFT] = useState<RugMarketNFT | null>(null)
  const [stats, setStats] = useState({
    totalNFTs: 0,
    floorPrice: '0',
    volume24h: '0',
    sales24h: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch NFT data and stats on mount
  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        console.log('[Marketplace] Fetching collection data...')
        const response = await fetch('/api/rug-market/collection?chainId=84532&limit=24')

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        console.log('[Marketplace] Received data:', {
          nftsCount: data.nfts?.length || 0,
          hasStats: !!data.stats,
          error: data.error
        })

        // Update all NFTs from API
        setAllNFTs(data.nfts || [])
        console.log('[Marketplace] Updated allNFTs state with', data.nfts?.length || 0, 'NFTs')
        console.log('[Marketplace] First NFT sample:', data.nfts?.[0])

        // Update stats
        if (data.stats) {
          setStats(data.stats)
        }

        setIsLoading(false)
        setStatsLoading(false)

        console.log(`[Marketplace] Loaded ${data.nfts?.length || 0} NFTs`)
      } catch (error) {
        console.error('[Marketplace] Failed to fetch collection data:', error)
        // Fallback to empty state
        setAllNFTs([])
        setStats({
          totalNFTs: 0,
          floorPrice: '0',
          volume24h: '0',
          sales24h: 0
        })
        setIsLoading(false)
        setStatsLoading(false)
      }
    }

    fetchCollectionData()
  }, [])

  // Handler functions
  const handleRefreshNFT = useCallback(async (tokenId: number) => {
    // TODO: Implement NFT refresh from blockchain
    console.log('Refresh NFT:', tokenId)
  }, [])

  const handleFavoriteToggle = useCallback((tokenId: number) => {
    // TODO: Implement favorite toggle
    console.log('Toggle favorite:', tokenId)
  }, [])

  const handleBuyNFT = useCallback((tokenId: number, price: string) => {
    // TODO: Implement NFT purchase
    console.log('Buy NFT:', tokenId, 'for', price)
  }, [])

  // Filter and sort NFTs based on current filters
  const nfts = useMemo(() => {
    let filtered = [...allNFTs]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(nft => {
        const { permanent } = nft
        return (
          permanent.tokenId.toString().includes(query) ||
          permanent.paletteName.toLowerCase().includes(query) ||
          permanent.textRows.some(text => text.toLowerCase().includes(query)) ||
          permanent.name.toLowerCase().includes(query)
        )
      })
    }

    // Listing filter
    if (listingFilter === 'listed') {
      filtered = filtered.filter(nft => nft.dynamic.isListed)
    } else if (listingFilter === 'unlisted') {
      filtered = filtered.filter(nft => !nft.dynamic.isListed)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'tokenId':
          return a.permanent.tokenId - b.permanent.tokenId
        case 'price-low':
          const aPrice = a.dynamic.listingPrice ? parseFloat(a.dynamic.listingPrice) : Infinity
          const bPrice = b.dynamic.listingPrice ? parseFloat(b.dynamic.listingPrice) : Infinity
          return aPrice - bPrice
        case 'price-high':
          const aPrice2 = a.dynamic.listingPrice ? parseFloat(a.dynamic.listingPrice) : 0
          const bPrice2 = b.dynamic.listingPrice ? parseFloat(b.dynamic.listingPrice) : 0
          return bPrice2 - aPrice2
        case 'rarity':
          return Number(b.permanent.characterCount) - Number(a.permanent.characterCount)
        case 'newest':
          return Number(b.permanent.mintTime) - Number(a.permanent.mintTime)
        default:
          return 0
      }
    })

    return filtered
  }, [allNFTs, searchQuery, listingFilter, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              OnchainRug <span className="text-blue-400">Marketplace</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Discover and trade unique OnchainRugs - each one algorithmically generated and permanently stored on the blockchain.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{stats.totalNFTs}</div>
              <div className="text-white/70">Total Rugs</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{stats.floorPrice} ETH</div>
              <div className="text-white/70">Floor Price</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{stats.volume24h} ETH</div>
              <div className="text-white/70">24h Volume</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
              <ShoppingCart className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-2">{stats.sales24h}</div>
              <div className="text-white/70">24h Sales</div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search rugs by name, palette, or text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <select
                  value={listingFilter}
                  onChange={(e) => setListingFilter(e.target.value as ListingFilter)}
                  className="px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Listings</option>
                  <option value="listed">Listed Only</option>
                  <option value="unlisted">Not Listed</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tokenId">Token ID</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rarity">Highest Rarity</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-white/70 mb-6">
            <span>
              Showing {nfts.length} of {allNFTs.length} rugs
              {searchQuery && ` matching "${searchQuery}"`}
              {listingFilter !== 'all' && ` (${listingFilter})`}
            </span>
            <span>Updated just now</span>
          </div>

          {/* Debug Info */}
          <div className="mb-4 p-4 bg-gray-800 rounded-lg text-white text-sm">
            <div>Debug: {allNFTs.length} NFTs loaded, isLoading: {isLoading.toString()}</div>
            {allNFTs.length > 0 && (
              <div>Sample NFT: Token #{allNFTs[0].permanent?.tokenId} - {allNFTs[0].permanent?.paletteName}</div>
            )}
          </div>

          {/* NFT Grid */}
          <RugMarketGrid
            nfts={allNFTs}
            loading={isLoading}
            onNFTClick={(nft) => setSelectedNFT(nft)}
            onRefreshNFT={handleRefreshNFT}
            onFavoriteToggle={handleFavoriteToggle}
            onBuyNFT={handleBuyNFT}
          />
        </div>
      </main>

      <Footer />

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <RugDetailModal
          nft={selectedNFT}
          isOpen={!!selectedNFT}
          onClose={() => setSelectedNFT(null)}
          onBuyNFT={handleBuyNFT}
          onRefreshNFT={handleRefreshNFT}
        />
      )}
    </div>
  )
}
