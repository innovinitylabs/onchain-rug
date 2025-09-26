'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useChainId } from 'wagmi'
import {
  Search,
  Filter,
  SortAsc,
  Grid,
  List,
  RefreshCw,
  ChevronDown,
  Heart,
  ShoppingCart,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Clock,
  User,
  Eye,
  Zap
} from 'lucide-react'
import { onchainRugsABI, contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LiquidGlass from '@/components/LiquidGlass'
import { MarketplaceStats, RugMarketplace } from '@/components/RugMarketplace'
import { formatEther } from 'viem'

// Types for our NFT data
interface RugTraits {
  seed: bigint
  paletteName: string
  minifiedPalette: string
  minifiedStripeData: string
  textRows: string[]
  warpThickness: number
  mintTime: bigint
  filteredCharacterMap: string
  complexity: number
  characterCount: bigint
  stripeCount: bigint
}

interface AgingData {
  lastCleaned: bigint
  lastTextureReset: bigint
  lastSalePrice: bigint
  recentSalePrices: readonly [bigint, bigint, bigint]
  dirtLevel: number
  textureLevel: number
  launderingCount: bigint
  lastLaundered: bigint
}

interface RugData {
  tokenId: number
  traits: RugTraits
  aging: AgingData
  owner: string
  name?: string
  description?: string
  image?: string
  animation_url?: string
  rarityScore?: number
  price?: string
  isListed?: boolean
  marketplace?: string
}

type SortOption = 'tokenId' | 'mintTime' | 'rarity' | 'complexity' | 'price' | 'lastSale'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

export default function MarketPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  // State management
  const [nfts, setNfts] = useState<RugData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('tokenId')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedTraits, setSelectedTraits] = useState<Record<string, any>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' })
  const [statusFilter, setStatusFilter] = useState<'all' | 'listed' | 'unlisted'>('all')
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  const itemsPerPage = 24
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  // Fetch NFT data from Alchemy
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        return
      }

      try {
        setLoading(true)

        // Fetch collection data from our secure API proxy
        console.log('🔄 Fetching NFT collection list via proxy...')
        const response = await fetch(
          `/api/alchemy?endpoint=getNFTsForCollection&contractAddress=${contractAddress}`
        )

        if (!response.ok) {
          throw new Error(`API proxy error: ${response.status}`)
        }

        const collectionData = await response.json()
        console.log('✅ Got collection data:', collectionData.nfts?.length || 0, 'NFTs')

        // Process NFTs with additional data
        const processedNfts: RugData[] = []

        for (const nft of collectionData.nfts || []) {
          try {
            // Get metadata
            const metadataResponse = await fetch(
              `/api/alchemy?endpoint=getNFTMetadata&contractAddress=${contractAddress}&tokenId=${nft.tokenId}`
            )

            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json()

              // Get aging data
              const agingResponse = await fetch(
                `/api/alchemy?endpoint=getAgingData&contractAddress=${contractAddress}&tokenId=${nft.tokenId}`
              )
              const agingData = agingResponse.ok ? await agingResponse.json() : null

              // Calculate rarity score (simple implementation)
              const rarityScore = calculateRarityScore(metadata.rugData)

              processedNfts.push({
                tokenId: nft.tokenId,
                traits: metadata.rugData || {},
                  aging: agingData || {
                    lastCleaned: BigInt(0),
                    lastTextureReset: BigInt(0),
                    lastSalePrice: BigInt(0),
                    recentSalePrices: [BigInt(0), BigInt(0), BigInt(0)],
                    dirtLevel: 0,
                    textureLevel: 0,
                    launderingCount: BigInt(0),
                    lastLaundered: BigInt(0)
                  },
                owner: nft.owner,
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                animation_url: metadata.animation_url,
                rarityScore,
                price: getEstimatedPrice(metadata.rugData),
                isListed: Math.random() > 0.7, // Mock listing status
                marketplace: Math.random() > 0.5 ? 'OpenSea' : 'LooksRare' // Mock marketplace
              })
            } else {
              console.log(`⚠️ Failed to get metadata for NFT #${nft.tokenId}`)
            }
          } catch (error) {
            console.warn(`❌ Error fetching metadata for NFT ${nft.tokenId}:`, error)
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
  }, [contractAddress])

  // Calculate rarity score
  const calculateRarityScore = (traits: RugTraits): number => {
    if (!traits) return 0

    let score = 0
    score += traits.complexity || 0
    score += traits.characterCount ? Number(traits.characterCount) / 10 : 0
    score += traits.stripeCount ? Number(traits.stripeCount) / 5 : 0
    score += traits.warpThickness || 0

    // Bonus for unique text
    if (traits.textRows && traits.textRows.length > 0) {
      score += traits.textRows.length * 2
    }

    return Math.round(score)
  }

  // Get estimated price (mock implementation)
  const getEstimatedPrice = (traits: RugTraits): string => {
    if (!traits) return '0.001'

    let basePrice = 0.001
    basePrice += (traits.complexity || 0) * 0.0001
    basePrice += traits.characterCount ? Number(traits.characterCount) * 0.00001 : 0

    return basePrice.toFixed(4)
  }

  // Get dirt level
  const getDirtLevel = (lastCleaned: bigint) => {
    const now = Math.floor(Date.now() / 1000)
    const timeSinceCleaned = now - Number(lastCleaned)

    if (timeSinceCleaned >= config.aging.dirtAccumulation.heavy) return 2
    if (timeSinceCleaned >= config.aging.dirtAccumulation.light) return 1
    return 0
  }

  // Get texture level
  const getTextureLevel = (lastTextureReset: bigint) => {
    const now = Math.floor(Date.now() / 1000)
    const timeSinceReset = now - Number(lastTextureReset)

    if (timeSinceReset >= config.aging.textureAging.intense) return 2
    if (timeSinceReset >= config.aging.textureAging.moderate) return 1
    return 0
  }

  // Filter and sort NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    const filtered = nfts.filter(nft => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          nft.tokenId.toString().includes(query) ||
          nft.traits.paletteName?.toLowerCase().includes(query) ||
          nft.traits.textRows?.some(text => text.toLowerCase().includes(query))

        if (!matchesSearch) return false
      }

      // Price filter
      if (priceFilter.min && parseFloat(nft.price || '0') < parseFloat(priceFilter.min)) return false
      if (priceFilter.max && parseFloat(nft.price || '0') > parseFloat(priceFilter.max)) return false

      // Status filter
      if (statusFilter === 'listed' && !nft.isListed) return false
      if (statusFilter === 'unlisted' && nft.isListed) return false

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'tokenId':
          aValue = a.tokenId
          bValue = b.tokenId
          break
        case 'mintTime':
          aValue = Number(a.traits.mintTime)
          bValue = Number(b.traits.mintTime)
          break
        case 'rarity':
          aValue = a.rarityScore || 0
          bValue = b.rarityScore || 0
          break
        case 'complexity':
          aValue = a.traits.complexity || 0
          bValue = b.traits.complexity || 0
          break
        case 'price':
          aValue = parseFloat(a.price || '0')
          bValue = parseFloat(b.price || '0')
          break
        case 'lastSale':
          aValue = Number(a.aging.lastSalePrice)
          bValue = Number(b.aging.lastSalePrice)
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [nfts, searchQuery, priceFilter, statusFilter, sortBy, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedNFTs.length / itemsPerPage)
  const paginatedNFTs = filteredAndSortedNFTs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    // Re-fetch data
    window.location.reload()
  }, [])

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

  const handleBuy = (nft: RugData) => {
    if (!isConnected) {
      alert('Please connect your wallet to purchase rugs!')
      return
    }

    // Mock purchase - in real implementation, this would interact with marketplace
    alert(`Purchase functionality coming soon! Rug #${nft.tokenId} - ${nft.price} ETH`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Navigation />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
              <p className="text-white/70">Loading the rug market...</p>
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
          <p className="text-white/70">Browse, buy, and collect unique OnchainRugs</p>

          {/* Market Stats */}
          <div className="mt-6">
            <MarketplaceStats />
          </div>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <LiquidGlass
            blurAmount={0.1}
            aberrationIntensity={1}
            elasticity={0.05}
            cornerRadius={12}
            className="p-6"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by token ID, palette, or text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Price Filter */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min ETH"
                  value={priceFilter.min}
                  onChange={(e) => setPriceFilter(prev => ({ ...prev, min: e.target.value }))}
                  className="w-24 px-3 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max ETH"
                  value={priceFilter.max}
                  onChange={(e) => setPriceFilter(prev => ({ ...prev, max: e.target.value }))}
                  className="w-24 px-3 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Rugs</option>
                <option value="listed">For Sale</option>
                <option value="unlisted">Not Listed</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortDirection}`}
                onChange={(e) => {
                  const [sort, dir] = e.target.value.split('-')
                  setSortBy(sort as SortOption)
                  setSortDirection(dir as SortDirection)
                }}
                className="px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tokenId-asc">Token ID ↑</option>
                <option value="tokenId-desc">Token ID ↓</option>
                <option value="mintTime-desc">Newest First</option>
                <option value="rarity-desc">Highest Rarity</option>
                <option value="price-asc">Price Low-High</option>
                <option value="price-desc">Price High-Low</option>
                <option value="lastSale-desc">Recently Sold</option>
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

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-white/70">
            Showing {paginatedNFTs.length} of {filteredAndSortedNFTs.length} rugs
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                ←
              </button>

              <span className="text-white/70 px-3">
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">No rugs found</h2>
            <p className="text-white/70">Try adjusting your search filters</p>
          </motion.div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {paginatedNFTs.map((nft) => {
              const dirtLevel = getDirtLevel(nft.aging.lastCleaned)
              const textureLevel = getTextureLevel(nft.aging.lastTextureReset)
              const isOwner = address?.toLowerCase() === nft.owner?.toLowerCase()
              const isFavorited = favorites.has(nft.tokenId)

              return (
                <motion.div
                  key={nft.tokenId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <LiquidGlass
                    blurAmount={0.1}
                    aberrationIntensity={2}
                    elasticity={0.1}
                    cornerRadius={12}
                    className="overflow-hidden"
                  >
                    <div className="p-4">
                      {/* Header with favorite and marketplace */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-white/60">
                            #{nft.tokenId}
                          </span>
                          {nft.marketplace && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                              {nft.marketplace}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleFavorite(nft.tokenId)}
                          className={`p-1 rounded transition-colors ${
                            isFavorited
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-white/40 hover:text-white/60'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Rug Preview */}
                      <div className={`aspect-square bg-black/30 rounded-lg overflow-hidden mb-4 ${
                        viewMode === 'list' ? 'w-32 h-32 float-left mr-4' : ''
                      }`}>
                        {nft.animation_url ? (
                          <iframe
                            src={nft.animation_url}
                            className="w-full h-full"
                            title={`Rug #${nft.tokenId}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50">
                            <div className="text-center">
                              <div className="text-2xl mb-1">🧵</div>
                              <div className="text-xs">#{nft.tokenId}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Rug Info */}
                      <div className={viewMode === 'list' ? 'overflow-hidden' : ''}>
                        {/* Status Indicators */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              dirtLevel === 0 ? 'bg-green-500' :
                              dirtLevel === 1 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="text-xs text-white/70">
                              {dirtLevel === 0 ? 'Clean' : dirtLevel === 1 ? 'Light Dirt' : 'Heavy Dirt'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              textureLevel === 0 ? 'bg-blue-500' :
                              textureLevel === 1 ? 'bg-purple-500' : 'bg-indigo-500'
                            }`} />
                            <span className="text-xs text-white/70">
                              {textureLevel === 0 ? 'Fresh' : textureLevel === 1 ? 'Aged' : 'Ancient'}
                            </span>
                          </div>
                        </div>

                        {/* Marketplace */}
                        <div className="mt-2">
                          <RugMarketplace
                            tokenId={nft.tokenId}
                            isOwner={isOwner}
                            currentPrice={nft.price}
                          />
                        </div>

                        {/* Additional Info for List View */}
                        {viewMode === 'list' && (
                          <div className="mt-3 text-xs text-white/60 space-y-1">
                            <div>Palette: {nft.traits.paletteName || 'Unknown'}</div>
                            <div>Complexity: {nft.traits.complexity || 0}/5</div>
                            {nft.rarityScore && (
                              <div>Rarity: {nft.rarityScore}/100</div>
                            )}
                            {nft.aging.launderingCount > BigInt(0) && (
                              <div>Laundered: {Number(nft.aging.launderingCount)} times</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </LiquidGlass>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Load More / Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
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
              {totalPages > 5 && (
                <span className="px-2 py-2 text-white/60">...</span>
              )}
            </div>
          </div>
        )}
      </div>
      </main>

      <Footer />
    </div>
  )
}
