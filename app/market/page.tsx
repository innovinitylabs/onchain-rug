'use client'

import { useState, useEffect, useMemo } from 'react'
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

export default function MarketPage() {
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

  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
  const itemsPerPage = 24

  // Fetch NFT data
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        return
      }

      try {
        setLoading(true)
        
        const response = await fetch(
          `/api/alchemy?endpoint=getNFTsForCollection&contractAddress=${contractAddress}&chainId=${chainId}`
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const collectionData = await response.json()
        const processedNfts: RugData[] = []

        for (const nft of collectionData.nfts || []) {
          try {
            const metadataResponse = await fetch(
              `/api/alchemy?endpoint=getNFTMetadata&contractAddress=${contractAddress}&tokenId=${nft.tokenId}&chainId=${chainId}`
            )

            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json()
              
              // Parse aging data from attributes
              const attributes = metadata.raw?.metadata?.attributes || metadata.attributes || []
              const agingData = parseAgingDataFromAttributes(attributes)
              
              // Calculate rarity score
              const rarityScore = calculateRarityScore(metadata.rugData)
              
              const animationUrl = metadata.animation_url ||
                                 metadata.raw?.metadata?.animation_url ||
                                 metadata.metadata?.animation_url

              // Get owner from contract call
              let owner: string;
              try {
                const response = await fetch(`/api/contract?method=ownerOf&tokenId=${nft.tokenId}&contractAddress=${contractAddress}`);
                if (response.ok) {
                  const ownerData = await response.json();
                  owner = ownerData.owner;
                } else {
                  owner = '0x0000000000000000000000000000000000000000';
                }
              } catch (error) {
                console.warn(`Failed to get owner for token ${nft.tokenId}:`, error);
                owner = '0x0000000000000000000000000000000000000000';
              }

              processedNfts.push({
                tokenId: nft.tokenId,
                traits: metadata.rugData || {},
                aging: agingData,
                owner: owner,
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                animation_url: animationUrl,
                rarityScore
              })
              
              // Debug logging
              if (processedNfts.length === 1) {
                console.log('Market page - First NFT owner:', owner)
                console.log('Your address:', address?.toLowerCase())
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch metadata for NFT ${nft.tokenId}:`, error)
          }
        }

        setNfts(processedNfts)
      } catch (error) {
        console.error('Failed to fetch NFTs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [contractAddress, chainId])

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
      lastCleaned: BigInt(0),
      lastTextureReset: BigInt(0),
      lastSalePrice: BigInt(getAttributeValue('Last Sale Price') || 0),
      recentSalePrices: [BigInt(0), BigInt(0), BigInt(0)],
      dirtLevel: parseInt(getAttributeValue('Dirt Level') || '0'),
      agingLevel: parseInt(getAttributeValue('Aging Level') || '0'),
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
    switch (sortBy) {
      case 'tokenId':
        filtered.sort((a, b) => a.tokenId - b.tokenId)
        break
      case 'price-asc':
      case 'price-desc':
        // Price sorting requires listing data - will be implemented with indexing
        filtered.sort((a, b) => a.tokenId - b.tokenId)
        break
      case 'rarity':
        filtered = sortByRarity(filtered, 'desc')
        break
      case 'complexity':
        filtered.sort((a, b) => (b.traits.complexity || 0) - (a.traits.complexity || 0))
        break
      case 'newest':
        filtered.sort((a, b) => Number(b.traits.mintTime || 0) - Number(a.traits.mintTime || 0))
        break
    }

    return filtered
  }, [nfts, searchQuery, priceRange, traitFilters, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedNFTs.length / itemsPerPage)
  const paginatedNFTs = filteredAndSortedNFTs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const toggleFavorite = (tokenId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(tokenId)) {
        newFavorites.delete(tokenId)
      } else {
        newFavorites.add(tokenId)
      }
      return newFavorites
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Navigation />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <LoadingAnimation message="Loading the rug market..." size="lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <Navigation />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <ShoppingCart className="w-8 h-8 text-green-400" />
              <h1 className="text-4xl font-bold text-white">Rug Market</h1>
            </div>
            <p className="text-white/70 mb-6">Browse, buy, and collect unique OnchainRugs</p>

            {/* Marketplace Stats */}
            <MarketplaceStats variant="compact" className="mb-6" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search and Controls */}
              <LiquidGlass
                blurAmount={0.1}
                aberrationIntensity={1}
                elasticity={0.05}
                cornerRadius={12}
                className="p-4"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by token ID, palette, or text..."
                        onChange={(e) => debouncedSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tokenId">Token ID</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rarity">Highest Rarity</option>
                    <option value="complexity">Highest Complexity</option>
                    <option value="newest">Newest First</option>
                  </select>

                  {/* View Mode */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-500/30 text-blue-300'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-500/30 text-blue-300'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Filters Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
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
                    className="mt-4 pt-4 border-t border-white/10"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Min Price (ETH)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Max Price (ETH)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                          placeholder="∞"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Complexity</label>
                        <select
                          value={traitFilters.complexity}
                          onChange={(e) => setTraitFilters(prev => ({ ...prev, complexity: e.target.value }))}
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                        >
                          <option value="">All</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Dirt Level</label>
                        <select
                          value={traitFilters.dirtLevel}
                          onChange={(e) => setTraitFilters(prev => ({ ...prev, dirtLevel: e.target.value }))}
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
                        >
                          <option value="">All</option>
                          <option value="0">Clean (0)</option>
                          <option value="1">Dirty (1)</option>
                          <option value="2">Very Dirty (2)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </LiquidGlass>

              {/* Results Count */}
              <div className="flex items-center justify-between text-white/70">
                <span>
                  Showing {paginatedNFTs.length} of {filteredAndSortedNFTs.length} rugs
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      ←
                    </button>
                    <span className="px-3">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>

              {/* NFT Grid/List */}
              {paginatedNFTs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-bold text-white mb-2">No rugs found</h2>
                  <p className="text-white/70">Try adjusting your filters</p>
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {paginatedNFTs.map((nft) => (
                    <ListingCard
                      key={nft.tokenId}
                      tokenId={nft.tokenId}
                      nftData={nft}
                      onCardClick={() => setSelectedNFT(nft)}
                      isFavorited={favorites.has(nft.tokenId)}
                      onToggleFavorite={() => toggleFavorite(nft.tokenId)}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 7) {
                        pageNum = i + 1
                      } else if (currentPage <= 4) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i
                      } else {
                        pageNum = currentPage - 3 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-500/30 text-blue-300'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <ActivityFeed limit={10} />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal
          tokenId={selectedNFT.tokenId}
          isOpen={!!selectedNFT}
          onClose={() => setSelectedNFT(null)}
          nftData={selectedNFT}
        />
      )}
    </div>
  )
}

