'use client'

/**
 * Client-side page content component
 * 
 * This component handles all client-side UI logic including:
 * - State management
 * - User interactions
 * - Web3 wallet connections
 * - Real-time data fetching
 * 
 * OG metadata is handled server-side in page.tsx via generateMetadata
 */

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAccount, useChainId } from 'wagmi'
import Navigation from '../../components/Navigation'
import Footer from '../../components/Footer'
import LoadingAnimation from '../../components/LoadingAnimation'
import RugMarketGrid from '../../components/RugMarketGrid'
import RugDetailModal from '../../components/rug-market/RugDetailModal'
import { ShoppingCart, Sparkles, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { RugMarketNFT } from '../../lib/rug-market-types'
import { useBuyListing, useCancelListing, useCancelOffer } from '../../hooks/use-marketplace-contract'
import { useWaitForTransactionReceipt } from 'wagmi'
import { getExplorerUrl } from '../../lib/networks'

type ListingFilter = 'all' | 'listed' | 'unlisted'
type SortOption = 'tokenId' | 'price-low' | 'price-high' | 'rarity' | 'newest'

export default function RugMarketPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [isLoading, setIsLoading] = useState(true)
  const [allNFTs, setAllNFTs] = useState<RugMarketNFT[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [listingFilter, setListingFilter] = useState<ListingFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('tokenId')
  const [selectedNFT, setSelectedNFT] = useState<RugMarketNFT | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24
  const [error, setError] = useState<string | null>(null)
  
  // Get tokenId from URL query param
  const tokenIdFromUrl = searchParams.get('tokenId')
  const [stats, setStats] = useState({
    totalNFTs: 0,
    floorPrice: '0',
    volume24h: '0',
    sales24h: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [refreshingTokenId, setRefreshingTokenId] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [cancellingTokenId, setCancellingTokenId] = useState<number | null>(null)
  
  // Buy listing hook
  const { buyListing, hash: buyHash, isPending: isBuyPending, error: buyError } = useBuyListing()
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash
  })

  // Cancel listing hook
  const { cancelListing, hash: cancelHash, isPending: isCancelPending } = useCancelListing()
  const { isLoading: isCancelConfirming, isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({
    hash: cancelHash
  })

  // Cancel offer hook
  const { cancelOffer, hash: cancelOfferHash, isPending: isCancelOfferPending } = useCancelOffer()
  const { isLoading: isCancelOfferConfirming, isSuccess: isCancelOfferSuccess } = useWaitForTransactionReceipt({
    hash: cancelOfferHash
  })

  // Fetch single NFT by ID
  const fetchNFTById = useCallback(async (tokenId: number) => {
    try {
      const response = await fetch(`/api/rug-market/nft/${tokenId}?chainId=${chainId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          setSelectedNFT(data.data)
        }
      }
    } catch (error) {
      // Failed to fetch NFT - silently continue
    }
  }, [chainId])

  // Open modal from URL tokenId
  useEffect(() => {
    if (tokenIdFromUrl) {
      const tokenId = parseInt(tokenIdFromUrl)
      if (!isNaN(tokenId)) {
        const nft = allNFTs.find(n => n.permanent.tokenId === tokenId)
        if (nft && nft !== selectedNFT) {
          setSelectedNFT(nft)
        } else if (!nft && allNFTs.length > 0) {
          // Fetch NFT if not in current list
          fetchNFTById(tokenId)
        }
      }
    } else if (!tokenIdFromUrl && selectedNFT) {
      // Close modal if tokenId removed from URL
      setSelectedNFT(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenIdFromUrl, allNFTs.length, fetchNFTById, selectedNFT])

  // Fetch NFT data and stats on mount and when chain changes
  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setError(null)
        setIsLoading(true)
        setStatsLoading(true)
        
        const response = await fetch(`/api/rug-market/collection?chainId=${chainId}&limit=100&offset=0`)

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        // Update all NFTs from API
        setAllNFTs(data.nfts || [])

        // Update stats
        if (data.stats) {
          setStats(data.stats)
          }

        setIsLoading(false)
        setStatsLoading(false)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load marketplace data')
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
  }, [chainId])

  // Handle buy success
  useEffect(() => {
    if (isBuySuccess && buyHash) {
      setNotification({
        type: 'success',
        message: `Purchase successful! View on explorer: ${getExplorerUrl(chainId)}/tx/${buyHash}`
      })
      // Refresh NFT data after purchase
      setTimeout(() => {
        refreshCollectionData()
      }, 2000)
    }
  }, [isBuySuccess, buyHash, chainId])

  // Handle buy error
  useEffect(() => {
    if (buyError) {
      setNotification({
        type: 'error',
        message: `Purchase failed: ${buyError.message}`
      })
    }
  }, [buyError])

  // Refresh collection data helper
  const refreshCollectionData = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)
      const response = await fetch(`/api/rug-market/collection?chainId=${chainId}&limit=100&offset=0`)
      if (!response.ok) throw new Error('Failed to refresh')
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      if (data.nfts) setAllNFTs(data.nfts)
      if (data.stats) setStats(data.stats)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to refresh:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh data')
      setIsLoading(false)
    }
  }, [chainId])

  // Handler functions
  const handleRefreshNFT = useCallback(async (tokenId: number) => {
    try {
      setRefreshingTokenId(tokenId)
      const response = await fetch(`/api/rug-market/nft/${tokenId}/refresh?chainId=${chainId}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 5
          throw new Error(`Please wait ${retryAfter} second(s) before refreshing again`)
        }
        // Handle conflict (already refreshing)
        if (response.status === 409) {
          throw new Error('Refresh already in progress for this NFT')
        }
        throw new Error(data.error || data.message || 'Failed to refresh NFT')
      }
      
      // Update the NFT in our local state with fresh calculated values
      if (data.data) {
        setAllNFTs(prev => prev.map(nft => 
          nft.permanent.tokenId === tokenId 
            ? data.data 
            : nft
        ))
      }
      
      setNotification({
        type: 'success',
        message: `NFT #${tokenId} refreshed successfully`
      })
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Failed to refresh NFT:', error)
      setNotification({
        type: 'error',
        message: `Failed to refresh NFT #${tokenId}`
      })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setRefreshingTokenId(null)
    }
  }, [chainId])

  // Handle NFT selection with URL update
  const handleNFTClick = useCallback((nft: RugMarketNFT) => {
    setSelectedNFT(nft)
    // Update URL without page reload
    const params = new URLSearchParams(searchParams.toString())
    params.set('tokenId', nft.permanent.tokenId.toString())
    router.push(`/rug-market?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Handle modal close with URL update
  const handleModalClose = useCallback(() => {
    setSelectedNFT(null)
    // Remove tokenId from URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tokenId')
    const newUrl = params.toString() ? `/rug-market?${params.toString()}` : '/rug-market'
    router.push(newUrl, { scroll: false })
  }, [router, searchParams])

  const handleFavoriteToggle = useCallback((tokenId: number) => {
    // Store favorites in localStorage
    const favoritesKey = `rug-market-favorites-${chainId}`
    const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]') as number[]
    const isFavorite = favorites.includes(tokenId)
    
    const updatedFavorites = isFavorite
      ? favorites.filter(id => id !== tokenId)
      : [...favorites, tokenId]
    
    localStorage.setItem(favoritesKey, JSON.stringify(updatedFavorites))
    
    setNotification({
      type: 'success',
      message: isFavorite ? `Removed from favorites` : `Added to favorites`
    })
    setTimeout(() => setNotification(null), 2000)
  }, [chainId])

  const handleBuyNFT = useCallback((tokenId: number, price: string) => {
    if (!isConnected) {
      setNotification({
        type: 'error',
        message: 'Please connect your wallet to purchase'
      })
      setTimeout(() => setNotification(null), 3000)
      return
    }
    
    try {
      buyListing(tokenId, price)
      setNotification({
        type: 'success',
        message: 'Transaction submitted. Please confirm in your wallet.'
      })
    } catch (error) {
      console.error('Failed to initiate purchase:', error)
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to initiate purchase'
      })
    }
  }, [isConnected, buyListing])

  const handleMakeOffer = useCallback((tokenId: number) => {
    // Open modal for the NFT to make an offer
    const nft = allNFTs.find(n => n.permanent.tokenId === tokenId)
    if (nft) {
      setSelectedNFT(nft)
      // Update URL with tokenId
      const params = new URLSearchParams(searchParams.toString())
      params.set('tokenId', tokenId.toString())
      router.push(`/rug-market?${params.toString()}`, { scroll: false })
    } else {
      // Fetch NFT if not in current list
      fetchNFTById(tokenId)
    }
  }, [allNFTs, router, searchParams, fetchNFTById])

  const handleCancelListing = useCallback((tokenId: number) => {
    if (!isConnected) {
      setNotification({
        type: 'error',
        message: 'Please connect your wallet to cancel listing'
      })
      setTimeout(() => setNotification(null), 3000)
      return
    }
    
    try {
      setCancellingTokenId(tokenId)
      cancelListing(tokenId)
      setNotification({
        type: 'success',
        message: 'Transaction submitted. Please confirm in your wallet.'
      })
    } catch (error) {
      console.error('Failed to cancel listing:', error)
      setCancellingTokenId(null)
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to cancel listing'
      })
    }
  }, [isConnected, cancelListing])

  // Handle cancel listing success
  useEffect(() => {
    if (isCancelSuccess && cancelHash && cancellingTokenId !== null) {
      setNotification({
        type: 'success',
        message: 'Listing cancelled successfully!'
      })
      // Refresh the NFT data
      handleRefreshNFT(cancellingTokenId)
      setCancellingTokenId(null)
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isCancelSuccess, cancelHash, cancellingTokenId, handleRefreshNFT])

  const handleCancelOffer = useCallback((offerId: number) => {
    if (!isConnected) {
      setNotification({
        type: 'error',
        message: 'Please connect your wallet to cancel offer'
      })
      setTimeout(() => setNotification(null), 3000)
      return
    }
    
    try {
      cancelOffer(offerId)
      setNotification({
        type: 'success',
        message: 'Transaction submitted. Please confirm in your wallet.'
      })
    } catch (error) {
      console.error('Failed to cancel offer:', error)
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to cancel offer'
      })
    }
  }, [isConnected, cancelOffer])

  // Handle cancel offer success
  useEffect(() => {
    if (isCancelOfferSuccess && cancelOfferHash) {
      setNotification({
        type: 'success',
        message: 'Offer cancelled successfully!'
      })
      // Refresh collection data to update UI
      refreshCollectionData()
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isCancelOfferSuccess, cancelOfferHash, refreshCollectionData])

  // Filter and sort NFTs based on current filters
  const filteredAndSortedNFTs = useMemo(() => {
    let filtered = [...allNFTs]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(nft => {
        const { permanent } = nft
        return (
          permanent.tokenId.toString().includes(query) ||
          permanent.paletteName.toLowerCase().includes(query) ||
          permanent.textRows?.some(text => text.toLowerCase().includes(query)) ||
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

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedNFTs.length / itemsPerPage)
  const paginatedNFTs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredAndSortedNFTs.slice(start, end)
  }, [filteredAndSortedNFTs, currentPage, itemsPerPage])

  // Update page if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <>
      {/* 
        OG metadata is now generated server-side via generateMetadata export in page.tsx.
        Client-side Head tags don't work for Twitter/X crawlers because:
        1. Twitter crawlers don't execute JavaScript
        2. Twitter crawlers don't wait for React hydration
        3. Client-side <Head> tags are invisible to crawlers
        4. generateMetadata runs on the server and is included in initial HTML
      */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Navigation />

      <main className="container mx-auto px-4 py-8 pt-28 flex-grow">
        <div className="max-w-7xl mx-auto">
          {/* Notification Banner */}
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-4 p-4 rounded-lg border ${
                notification.type === 'success'
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{notification.message}</span>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="text-current opacity-70 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  setError(null)
                  refreshCollectionData()
                }}
                className="px-3 py-1 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Header */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1 }}
            className="text-center mb-12"
        >
            <h1 className="text-5xl font-bold text-white mb-4">
              Rug <span className="text-blue-400">Market</span>
            </h1>
            {/* <p className="text-xl text-white/70 max-w-2xl mx-auto mb-4">
              Discover and trade unique OnchainRugs - each one algorithmically generated and permanently stored on the blockchain.
          </p> */}
            {/* <button
              onClick={() => refreshCollectionData()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button> */}
          </motion.div>

          {/* Stats */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            {/* <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
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
          </div> */}
        </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1 }}
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

          {/* Results Count and Pagination */}
          <div className="flex items-center justify-between text-white/70 mb-6 flex-wrap gap-4">
              <span>
              Showing {paginatedNFTs.length} of {filteredAndSortedNFTs.length} rugs
              {allNFTs.length !== filteredAndSortedNFTs.length && ` (${allNFTs.length} total)`}
                {searchQuery && ` matching "${searchQuery}"`}
                {listingFilter !== 'all' && ` (${listingFilter})`}
              </span>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  ←
                </button>
                <span className="px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || isLoading}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  →
                </button>
            </div>
            )}
          </div>

            {/* NFT Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingAnimation />
            </div>
          ) : (
            <RugMarketGrid
              nfts={paginatedNFTs}
              loading={isLoading}
              onNFTClick={handleNFTClick}
              onRefreshNFT={handleRefreshNFT}
              onFavoriteToggle={handleFavoriteToggle}
              onBuyNFT={handleBuyNFT}
              onMakeOffer={handleMakeOffer}
              onCancelListing={handleCancelListing}
              onCancelOffer={handleCancelOffer}
              sortKey={sortBy}
            />
          )}
        </div>
      </main>

      <Footer />

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <RugDetailModal
          nft={selectedNFT}
          isOpen={!!selectedNFT}
          onClose={handleModalClose}
          onBuyNFT={handleBuyNFT}
          onMakeOffer={handleMakeOffer}
          onRefreshNFT={handleRefreshNFT}
        />
      )}

      {/* Transaction Status Overlay */}
      {(isBuyPending || isBuyConfirming) && (
        <div className="fixed bottom-4 right-4 bg-blue-500/90 text-white p-4 rounded-lg shadow-lg border border-blue-400">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <div>
              <div className="font-semibold">
                {isBuyPending ? 'Waiting for wallet confirmation...' : 'Transaction confirming...'}
              </div>
              {buyHash && (
                <a
                  href={`${getExplorerUrl(chainId)}/tx/${buyHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline opacity-80 hover:opacity-100"
                >
                  View on explorer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}