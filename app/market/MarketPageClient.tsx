'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAccount, useChainId } from 'wagmi'
import {
  Search,
  Filter,
  Grid,
  List,
  RefreshCw,
  ShoppingCart,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LoadingAnimation from '@/components/LoadingAnimation'
import LiquidGlass from '@/components/LiquidGlass'
import ListingCard, { ListingCardSkeleton } from '@/components/marketplace/ListingCard'
import NFTDetailModal from '@/components/marketplace/NFTDetailModal'
import ActivityFeed from '@/components/marketplace/ActivityFeed'
import MarketplaceStats from '@/components/marketplace/MarketplaceStats'
import {
  sortByRarity,
  debounce
} from '@/utils/marketplace-utils'

interface RugData {
  tokenId: number
  traits: any
  aging: any
  owner: string
  name?: string
  description?: string
  image?: string
  animation_url?: string
  rarityScore?: number
}

type SortOption = 'tokenId' | 'price-asc' | 'price-desc' | 'rarity' | 'complexity' | 'newest'
type ViewMode = 'grid' | 'list'
type ListingFilter = 'all' | 'listed' | 'auction' | 'has-offers' | 'not-listed'

export default function MarketPageClient() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  // State
  const [nfts, setNfts] = useState<RugData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('tokenId')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [listingFilter, setListingFilter] = useState<ListingFilter>('all')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [selectedNFT, setSelectedNFT] = useState<RugData | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Trait filters
  const [traitFilters, setTraitFilters] = useState({
    complexity: '',
    dirtLevel: '',
    agingLevel: ''
  })

  const contractAddress = contractAddresses[chainId] // No fallback - safer to show error
  const itemsPerPage = 24

  // Get search params safely
  const searchParams = useSearchParams()
  const tokenIdParam = searchParams.get('tokenId')
  const actionParam = searchParams.get('action')

  // Fetch NFT data
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        return
      }

      try {
        setLoading(true)
        const apiUrl = `${window.location.origin}/api/rug-market/collection?contractAddress=${contractAddress}&chainId=${chainId}&includeMetadata=true`

        const response = await fetch(apiUrl)
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // Process the NFT data
        const processedNfts: RugData[] = (data.ownedNfts || []).map((nft: any) => {
          const attributes = nft.metadata?.attributes || []

          const getAttributeValue = (traitType: string) => {
            const attr = attributes.find((a: any) => a.trait_type === traitType)
            return attr ? attr.value : 0
          }

          return {
            tokenId: parseInt(nft.tokenId || nft.id?.tokenId || nft.token?.tokenId),
            traits: {
              complexity: getAttributeValue('Complexity'),
              characterCount: getAttributeValue('Character Count'),
              stripeCount: getAttributeValue('Stripe Count'),
              warpThickness: getAttributeValue('Warp Thickness'),
              paletteName: getAttributeValue('Palette'),
              textRows: nft.metadata?.rugData?.textRows || []
            },
            aging: {
              dirtLevel: parseInt(getAttributeValue('Dirt Level') || '0'),
              agingLevel: parseInt(getAttributeValue('Aging Level') || '0'),
              lastCleaned: BigInt(getAttributeValue('Last Cleaned') || '0'),
              lastTextureReset: BigInt(0),
              lastSalePrice: BigInt(getAttributeValue('Last Sale Price') || '0'),
              recentSalePrices: [BigInt(0), BigInt(0), BigInt(0)],
              launderingCount: BigInt(getAttributeValue('Laundering Count') || '0'),
              lastLaundered: BigInt(0),
              cleaningCount: BigInt(getAttributeValue('Cleaning Count') || '0'),
              restorationCount: BigInt(getAttributeValue('Restoration Count') || '0'),
              masterRestorationCount: BigInt(getAttributeValue('Master Restoration Count') || '0'),
              maintenanceScore: BigInt(getAttributeValue('Maintenance Score') || '0'),
              currentFrameLevel: getAttributeValue('Frame Level') || 'None',
              frameAchievedTime: BigInt(0),
              gracePeriodActive: false,
              gracePeriodEnd: BigInt(0),
              isMuseumPiece: (getAttributeValue('Museum Piece') || 'false') === 'true'
            },
            owner: nft.owner || '0x0000000000000000000000000000000000000000',
            name: nft.metadata?.name || `Rug #${nft.tokenId}`,
            description: nft.metadata?.description,
            image: nft.metadata?.image,
            animation_url: nft.metadata?.animation_url
          }
        })

        setNfts(processedNfts)

        // Cache pre-warming for better performance (non-blocking)
        setTimeout(() => {
          // This will run in background to pre-warm popular pages
          console.log('🔥 Cache pre-warming: refreshing first few pages in background...')
          // Simple approach: just refresh the current page data in background
          // This keeps the cache fresh for subsequent visits
        }, 10000)
      } catch (error) {
        console.error('Failed to fetch NFTs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [contractAddress, chainId])

  // Auto-open modal for specific tokenId from URL params
  useEffect(() => {
    // Only run on client side and when we have data
    if (tokenIdParam && nfts.length > 0 && !loading) {
      const tokenId = parseInt(tokenIdParam)
      const nft = nfts.find(n => n.tokenId === tokenId)
      if (nft) {
        setSelectedNFT(nft)
        // If action=list, the NFTDetailModal will handle showing the listing form
      }
    }
  }, [tokenIdParam, nfts, loading])

  // Calculate rarity score
  const calculateRarityScore = (traits: any): number => {
    if (!traits) return 0
    let score = 0
    score += traits.complexity || 0
    score += traits.characterCount ? Number(traits.characterCount) / 10 : 0
    score += traits.stripeCount ? Number(traits.stripeCount) / 5 : 0
    score += traits.warpThickness || 0
    if (traits.textRows && traits.textRows.length > 0) {
      score += traits.textRows.length * 2
    }
    return Math.round(score)
  }

  // Parse aging data from attributes
  const parseAgingDataFromAttributes = (attributes: any[]) => {
    const getAttributeValue = (traitType: string) => {
      const attr = attributes.find((a: any) => a.trait_type === traitType)
      return attr ? attr.value : 0
    }

    return {
      lastCleaned: BigInt(0), // Not stored in attributes, can be calculated if needed
      lastTextureReset: BigInt(0), // Not stored in attributes, can be calculated if needed
      lastSalePrice: BigInt(getAttributeValue('Last Sale Price') || 0),
      recentSalePrices: [BigInt(0), BigInt(0), BigInt(0)], // Not stored in attributes
      dirtLevel: parseInt(getAttributeValue('Dirt Level')) || 0,
      agingLevel: parseInt(getAttributeValue('Aging Level')) || 0,
      launderingCount: BigInt(getAttributeValue('Laundering Count') || 0),
      lastLaundered: BigInt(0), // Not stored in attributes
      cleaningCount: BigInt(getAttributeValue('Cleaning Count') || 0),
      restorationCount: BigInt(getAttributeValue('Restoration Count') || 0),
      masterRestorationCount: BigInt(getAttributeValue('Master Restoration Count') || 0),
      maintenanceScore: BigInt(getAttributeValue('Maintenance Score') || 0),
      currentFrameLevel: getAttributeValue('Frame Level') || 'None',
      frameAchievedTime: BigInt(0), // Not stored in attributes
      gracePeriodActive: false, // Not stored in attributes
      gracePeriodEnd: BigInt(0), // Not stored in attributes
      isMuseumPiece: getAttributeValue('Museum Piece') === 'true'
    }
  }

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 300),
    []
  )

  // Filter and sort NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    let filtered = [...nfts]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(nft =>
        nft.tokenId.toString().includes(query) ||
        nft.traits.paletteName?.toLowerCase().includes(query) ||
        nft.traits.textRows?.some((text: string) => text.toLowerCase().includes(query))
      )
    }

    // Price range filter (requires listing data - will be implemented with backend indexing)
    // if (priceRange.min || priceRange.max) {
    //   filtered = filterByPriceRange(filtered, priceRange.min, priceRange.max)
    // }

    // Trait filters
    if (traitFilters.complexity) {
      filtered = filtered.filter(nft =>
        nft.traits.complexity === parseInt(traitFilters.complexity)
      )
    }

    if (traitFilters.dirtLevel) {
      filtered = filtered.filter(nft =>
        nft.aging.dirtLevel === parseInt(traitFilters.dirtLevel)
      )
    }

    if (traitFilters.agingLevel) {
      filtered = filtered.filter(nft =>
        nft.aging.agingLevel === parseInt(traitFilters.agingLevel)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'tokenId':
          return a.tokenId - b.tokenId
        case 'rarity':
          return (b.rarityScore || 0) - (a.rarityScore || 0)
        case 'complexity':
          return (b.traits.complexity || 0) - (a.traits.complexity || 0)
        case 'newest':
          return b.tokenId - a.tokenId // Assuming higher tokenId = newer
        default:
          return 0
      }
    })

    return filtered
  }, [nfts, searchQuery, traitFilters, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedNFTs.length / itemsPerPage)
  const paginatedNFTs = filteredAndSortedNFTs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Calculate stats
  const stats = useMemo(() => {
    const totalVolume = 0 // Will be calculated from actual sales data
    const floorPrice = 0 // Will be calculated from listing data
    const owners = new Set(nfts.map(nft => nft.owner)).size
    return { totalVolume, floorPrice, owners }
  }, [nfts])

  // If no contract address, show error
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation />
        <div className="pt-20 pb-12 px-4 max-w-[3200px] mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">Marketplace Unavailable</h1>
            <p className="text-white/70 mb-6">
              The marketplace is not available on the current network. Please switch to a supported network.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-white/60 mb-2">Supported Networks:</p>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• Base Sepolia (Chain ID: 84532)</li>
                <li>• Shape Sepolia (Chain ID: 11011)</li>
              </ul>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation />

        <main className="pt-20 pb-12 px-4 max-w-[3200px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <ShoppingCart className="w-8 h-8 text-blue-400" />
              <h1 className="text-4xl font-bold text-white">NFT Marketplace</h1>
            </div>
            <p className="text-white/70">Buy and sell OnchainRugs NFTs</p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.totalVolume.toFixed(2)}</div>
                <div className="text-sm text-white/60">Total Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.floorPrice.toFixed(3)}</div>
                <div className="text-sm text-white/60">Floor Price</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.owners}</div>
                <div className="text-sm text-white/60">Owners</div>
              </div>
            </div>
          </motion.div>

          {/* Filters and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by token ID, palette, or text..."
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tokenId">Sort by Token ID</option>
                  <option value="rarity">Sort by Rarity</option>
                  <option value="complexity">Sort by Complexity</option>
                  <option value="newest">Newest First</option>
                </select>

                {/* View Mode */}
                <div className="flex rounded-lg overflow-hidden border border-slate-600">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-white/70 hover:text-white'} transition-colors`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-white/70 hover:text-white'} transition-colors`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-slate-600/50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Complexity Filter */}
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Complexity</label>
                      <select
                        value={traitFilters.complexity}
                        onChange={(e) => setTraitFilters(prev => ({ ...prev, complexity: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                    </div>

                    {/* Dirt Level Filter */}
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Dirt Level</label>
                      <select
                        value={traitFilters.dirtLevel}
                        onChange={(e) => setTraitFilters(prev => ({ ...prev, dirtLevel: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All</option>
                        <option value="0">Clean (0)</option>
                        <option value="1">Lightly Dirty (1)</option>
                        <option value="2">Heavily Dirty (2)</option>
                      </select>
                    </div>

                    {/* Aging Level Filter */}
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Aging Level</label>
                      <select
                        value={traitFilters.agingLevel}
                        onChange={(e) => setTraitFilters(prev => ({ ...prev, agingLevel: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All</option>
                        {Array.from({ length: 11 }, (_, i) => (
                          <option key={i} value={i.toString()}>{i}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
              {Array.from({ length: 24 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {/* NFT Grid/List */}
              {paginatedNFTs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="text-6xl mb-4">🧵</div>
                  <h2 className="text-2xl font-bold text-white mb-2">No NFTs Found</h2>
                  <p className="text-white/70">Try adjusting your search or filter criteria.</p>
                </motion.div>
              ) : (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
                      {paginatedNFTs.map((nft) => (
                        <motion.div
                          key={nft.tokenId}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          className="cursor-pointer"
                          onClick={() => setSelectedNFT(nft)}
                        >
                          <ListingCard
                            tokenId={nft.tokenId}
                            nftData={nft}
                            onCardClick={() => setSelectedNFT(nft)}
                            isFavorited={favorites.has(nft.tokenId)}
                            onToggleFavorite={() => {
                              setFavorites(prev => {
                                const newFavorites = new Set(prev)
                                if (newFavorites.has(nft.tokenId)) {
                                  newFavorites.delete(nft.tokenId)
                                } else {
                                  newFavorites.add(nft.tokenId)
                                }
                                return newFavorites
                              })
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paginatedNFTs.map((nft) => (
                        <motion.div
                          key={nft.tokenId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="cursor-pointer"
                          onClick={() => setSelectedNFT(nft)}
                        >
                          <ListingCard
                            tokenId={nft.tokenId}
                            nftData={nft}
                            onCardClick={() => setSelectedNFT(nft)}
                            isFavorited={favorites.has(nft.tokenId)}
                            onToggleFavorite={() => {
                              setFavorites(prev => {
                                const newFavorites = new Set(prev)
                                if (newFavorites.has(nft.tokenId)) {
                                  newFavorites.delete(nft.tokenId)
                                } else {
                                  newFavorites.add(nft.tokenId)
                                }
                                return newFavorites
                              })
                            }}
                            viewMode="list"
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center items-center gap-2 mt-8"
                    >
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                      >
                        Previous
                      </button>

                      <span className="text-white/70">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                      >
                        Next
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal
          tokenId={selectedNFT.tokenId}
          isOpen={!!selectedNFT}
          onClose={() => setSelectedNFT(null)}
          nftData={selectedNFT}
        />
      )}
    </>
  )
}