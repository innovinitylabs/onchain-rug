'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useContractRead, useWatchContractEvent, useAccount, useChainId } from 'wagmi'
import { ExternalLink, Filter, SortAsc, Grid, List, RefreshCw } from 'lucide-react'
import { onchainRugsABI, contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'
import Navigation from '@/components/Navigation'

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

interface NFTData {
  tokenId: number
  traits: RugTraits
  owner: string
  metadata?: any
  rarityScore?: number
}

type SortOption = 'tokenId' | 'mintTime' | 'rarity' | 'complexity' | 'stripeCount' | 'characterCount'
type SortDirection = 'asc' | 'desc'

export default function GalleryPage() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()

  // State management
  const [nfts, setNfts] = useState<NFTData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('tokenId')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedTraits, setSelectedTraits] = useState<Record<string, any>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [refreshing, setRefreshing] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const itemsPerPage = 24
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
  const resolvedContractAddress = contractAddress || '0x0000000000000000000000000000000000000000'

  // Contract reads
  const { data: totalSupply, error: totalSupplyError, isLoading: totalSupplyLoading } = useContractRead({
    address: resolvedContractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'totalSupply',
  })

  const { data: maxSupply, error: maxSupplyError } = useContractRead({
    address: resolvedContractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'maxSupply',
  })

  // Contract read status for error handling
  const contractReadStatus = {
    totalSupply: { data: totalSupply, error: totalSupplyError, loading: totalSupplyLoading },
    maxSupply: { data: maxSupply, error: maxSupplyError }
  }

  // Log contract info for debugging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Contract Address Resolution:', {
        chainId,
        resolvedAddress: resolvedContractAddress,
        totalSupply,
        maxSupply
      })
    }
  }, [chainId, resolvedContractAddress, totalSupply, maxSupply])

  // Alchemy NFT data fetching - much simpler and more reliable!
  const [alchemyData, setAlchemyData] = useState<any>(null)
  const [loadingAlchemy, setLoadingAlchemy] = useState(true)
  const [alchemyError, setAlchemyError] = useState<string | null>(null)

  // Fetch NFT data from Alchemy
  useEffect(() => {
    const fetchAlchemyData = async () => {
      if (!resolvedContractAddress || resolvedContractAddress === '0x0000000000000000000000000000000000000000') {
        return
      }

      try {
        setLoadingAlchemy(true)
        setAlchemyError(null)

        const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
        if (!alchemyApiKey) {
          throw new Error('Alchemy API key not configured')
        }

        // Fetch collection data from Alchemy
        const response = await fetch(
          `https://shape-sepolia.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTsForCollection?contractAddress=${resolvedContractAddress}&withMetadata=true&limit=5`
        )

        if (!response.ok) {
          throw new Error(`Alchemy API error: ${response.status}`)
        }

        const data = await response.json()
        setAlchemyData(data)

      } catch (error) {
        console.error('Alchemy fetch error:', error)
        setAlchemyError(error instanceof Error ? error.message : 'Failed to fetch NFT data')
      } finally {
        setLoadingAlchemy(false)
      }
    }

    fetchAlchemyData()
  }, [resolvedContractAddress])

  // Initialize loading state
  useEffect(() => {
    if (resolvedContractAddress && resolvedContractAddress !== '0x0000000000000000000000000000000000000000') {
      setLoading(true)
      setInitialLoad(true)
    }
  }, [resolvedContractAddress])

  // Process Alchemy NFT data - much simpler!
  useEffect(() => {
    if (!alchemyData || alchemyError) {
      return
    }

    try {
      const nftData: NFTData[] = []

      // Process Alchemy NFT data
      if (alchemyData.nfts && Array.isArray(alchemyData.nfts)) {
        alchemyData.nfts.forEach((nft: any) => {
          try {
            // Extract traits from metadata attributes
            const attributes = nft.metadata?.attributes || []
            const traits: RugTraits = {
              seed: BigInt(nft.tokenId || 0),
              paletteName: attributes.find((a: any) => a.trait_type === 'Palette Name')?.value || '',
              minifiedPalette: '', // Not available from Alchemy
              minifiedStripeData: '', // Not available from Alchemy
              textRows: [], // Not available from Alchemy
              warpThickness: Number(attributes.find((a: any) => a.trait_type === 'Warp Thickness')?.value || 0),
              mintTime: BigInt(nft.mint?.timestamp || 0),
              filteredCharacterMap: '', // Not available from Alchemy
              complexity: Number(attributes.find((a: any) => a.trait_type === 'Complexity')?.value || 0),
              characterCount: BigInt(attributes.find((a: any) => a.trait_type === 'Character Count')?.value || 0),
              stripeCount: BigInt(attributes.find((a: any) => a.trait_type === 'Stripe Count')?.value || 0),
            }

            const nftItem: NFTData = {
              tokenId: Number(nft.tokenId),
              traits,
              owner: nft.owners ? nft.owners[0] : '', // Primary owner
              rarityScore: calculateRarityScore(traits),
            }

            nftData.push(nftItem)
          } catch (error) {
            console.warn(`Error processing Alchemy NFT ${nft.tokenId}:`, error)
          }
        })
      }

      setNfts(nftData)

      // Set loading to false once we have data or have finished loading
      if (nftData.length > 0 || !loadingAlchemy) {
        setLoading(false)
        setInitialLoad(false)
      }

    } catch (error) {
      console.error('Error processing Alchemy data:', error)
      setAlchemyError('Failed to process NFT data')
    }
  }, [alchemyData, alchemyError, loadingAlchemy])

  // Handle loading timeout and fallback
  useEffect(() => {
    if (!resolvedContractAddress || resolvedContractAddress === '0x0000000000000000000000000000000000000000') {
      return
    }

    // Timeout after 10 seconds to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading || loadingAlchemy) {
        console.warn('Gallery loading timeout - showing empty state')
        setLoading(false)
        setInitialLoad(false)
        setLoadingAlchemy(false)
      }
    }, 10000)

    return () => clearTimeout(timeout)
  }, [resolvedContractAddress, loading, loadingAlchemy])

  // Update loading state when NFTs are loaded
  useEffect(() => {
    if (nfts.length > 0) {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [nfts.length])

  // Calculate rarity score based on trait frequency
  const calculateRarityScore = (traits: RugTraits): number => {
    // Simple rarity calculation - can be enhanced with actual trait frequencies
    let score = 0
    score += traits.complexity * 10
    score += Number(traits.stripeCount) * 5
    score += Number(traits.characterCount) * 2
    score += traits.warpThickness
    score += traits.textRows.length * 8
    return score
  }

  // Dynamic trait filtering
  const availableTraits = useMemo(() => {
    const traits: Record<string, Set<any>> = {}

    nfts.forEach(nft => {
      Object.entries(nft.traits).forEach(([key, value]) => {
        if (!traits[key]) traits[key] = new Set()
        if (value !== undefined && value !== null) {
          traits[key].add(value)
        }
      })
    })

    return traits
  }, [nfts])

  // Filtered and sorted NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    let filtered = nfts.filter(nft => {
      return Object.entries(selectedTraits).every(([trait, value]) => {
        if (value === null || value === undefined || value === '') return true
        return nft.traits[trait as keyof RugTraits] === value
      })
    })

    // Sort NFTs
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
          aValue = a.traits.complexity
          bValue = b.traits.complexity
          break
        case 'stripeCount':
          aValue = Number(a.traits.stripeCount)
          bValue = Number(b.traits.stripeCount)
          break
        case 'characterCount':
          aValue = Number(a.traits.characterCount)
          bValue = Number(b.traits.characterCount)
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
  }, [nfts, selectedTraits, sortBy, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedNFTs.length / itemsPerPage)
  const paginatedNFTs = filteredAndSortedNFTs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Set loading state when totalSupply changes
  useEffect(() => {
    if (totalSupply) {
      setLoading(true)
    }
  }, [totalSupply])

  // Listen for new mints
  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    eventName: 'Transfer',
    onLogs(logs) {
      console.log('New NFT minted:', logs)
      // Auto-refresh when new NFT is minted
      handleRefresh()
    },
  })

  // Refresh function
  const handleRefresh = () => {
    setRefreshing(true)
    // Trigger a re-render by updating the key (this will cause multicall to re-run)
    setNfts([])
    setLoading(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Loading component with rotating valipokkann.svg
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <motion.img
        src="/valipokkann.svg"
        alt="Loading"
        className="w-8 h-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <span className="ml-3 text-blue-600">Loading NFTs...</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <Navigation />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 pt-24"
      >
        <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
          🖼️ Gallery
        </h1>
        <p className="text-xl text-blue-700/70 max-w-3xl mx-auto mb-8">
          Explore our collection of 1,111 unique Onchain Rugs, algorithmically generated and stored entirely on-chain.
          {nfts.length > 0 ? ` Currently displaying ${nfts.length} loaded NFTs.` : ' Loading NFT data from the blockchain...'}
        </p>

        {/* Contract Info */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 max-w-4xl mx-auto mb-8">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Contract Information</h3>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200/50">
              <div className="text-sm text-blue-700/70 mb-1">Contract Address</div>
              <div className="font-mono text-sm text-blue-800 break-all">
                {resolvedContractAddress}
              </div>
              <div className="text-xs text-blue-600/70 mt-2">
                Shape Sepolia Testnet • Chain ID: {chainId}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
            <div className="text-2xl font-bold text-blue-600">{totalSupply ? Number(totalSupply) : 1111}</div>
            <div className="text-sm text-blue-700/70">Total Supply</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-indigo-200/50">
            <div className="text-2xl font-bold text-indigo-600">{nfts.length}</div>
            <div className="text-sm text-blue-700/70">Loaded NFTs</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-200/50">
            <div className="text-2xl font-bold text-purple-600">{availableTraits.paletteName?.size || 0}</div>
            <div className="text-sm text-blue-700/70">Unique Palettes</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-cyan-200/50">
            <div className="text-2xl font-bold text-cyan-600">{availableTraits.complexity?.size || 0}</div>
            <div className="text-sm text-blue-700/70">Complexity Levels</div>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50">
          {/* Sorting */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-blue-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 bg-white/80 border border-blue-200 rounded-lg text-blue-700"
              >
                <option value="tokenId">Token ID</option>
                <option value="mintTime">Mint Date</option>
                <option value="rarity">Rarity Score</option>
                <option value="complexity">Complexity</option>
                <option value="stripeCount">Stripes</option>
                <option value="characterCount">Characters</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-lg text-blue-700 transition-colors"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* View Mode & Refresh */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-lg text-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Trait Filters */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-medium">Filter by Traits:</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(availableTraits).slice(0, 12).map(([trait, values]) => (
              <div key={trait} className="space-y-2">
                <label className="block text-sm font-medium text-blue-700 capitalize">
                  {trait.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <select
                  value={selectedTraits[trait] || ''}
                  onChange={(e) => setSelectedTraits(prev => ({
                    ...prev,
                    [trait]: e.target.value === '' ? null : e.target.value
                  }))}
                  className="w-full px-2 py-1 text-sm bg-white/80 border border-blue-200 rounded text-blue-700"
                >
                  <option value="">All</option>
                  {Array.from(values).slice(0, 10).map((value, idx) => (
                    <option key={idx} value={String(value)}>
                      {String(value).length > 20 ? String(value).substring(0, 20) + '...' : String(value)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {Object.keys(selectedTraits).length > 0 && (
            <button
              onClick={() => setSelectedTraits({})}
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-200 rounded-lg text-red-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* NFT Grid/List */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {(loading || loadingAlchemy || initialLoad) ? (
          <LoadingSpinner />
        ) : (loading || loadingAlchemy) && nfts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-bold text-blue-800 mb-4">No NFTs Available</h3>
            <p className="text-blue-700/70 mb-6 max-w-md mx-auto">
              {alchemyError || "Unable to load NFT data. This could be due to:"}
            </p>
            <ul className="text-left text-blue-700/70 mb-6 max-w-md mx-auto list-disc list-inside space-y-2">
              <li>Alchemy API key not configured</li>
              <li>Contract not indexed by Alchemy yet</li>
              <li>No NFTs minted in the collection</li>
              <li>Network connectivity issues</li>
              <li>Contract not deployed on Shape Sepolia</li>
            </ul>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {refreshing ? '🔄 Refreshing...' : '🔄 Retry Load'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="text-center mb-8">
              <p className="text-blue-700/70">
                Showing {paginatedNFTs.length} of {filteredAndSortedNFTs.length} loaded NFTs
                {Object.keys(selectedTraits).length > 0 && ' (filtered)'}
                {totalSupply && Number(totalSupply) > nfts.length && (
                  <span className="block text-sm mt-1 text-blue-600/60">
                    ({Number(totalSupply) - nfts.length} more NFTs available - loading first {Math.min(Number(totalSupply), 5)})
                  </span>
                )}
              </p>
            </div>

            {/* NFT Display */}
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              <AnimatePresence>
                {paginatedNFTs.map((nft) => (
                  <motion.div
                    key={nft.tokenId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    {/* Artwork Iframe */}
                    <div className={`relative ${viewMode === 'grid' ? 'aspect-square' : 'w-48 h-48 flex-shrink-0'}`}>
                      <iframe
                        src={`data:text/html,${encodeURIComponent(`
                          <html>
                            <head>
                              <style>
                                body { margin: 0; background: transparent; }
                                canvas { max-width: 100%; max-height: 100%; }
                              </style>
                            </head>
                            <body>
                              <div id="nft-${nft.tokenId}">Loading artwork...</div>
                              <script>
                                // NFT artwork will be rendered here
                                console.log('NFT ${nft.tokenId} artwork');
                              </script>
                            </body>
                          </html>
                        `)}`}
                        className="w-full h-full border-0"
                        title={`Onchain Rug #${nft.tokenId}`}
                        sandbox="allow-scripts"
                      />
                      <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        #{nft.tokenId}
                      </div>
                    </div>

                    {/* NFT Info */}
                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-blue-800">Doormat #{nft.tokenId}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          nft.rarityScore && nft.rarityScore > 80 ? 'text-purple-600 bg-purple-100' :
                          nft.rarityScore && nft.rarityScore > 60 ? 'text-blue-600 bg-blue-100' :
                          nft.rarityScore && nft.rarityScore > 40 ? 'text-green-600 bg-green-100' :
                          'text-gray-600 bg-gray-100'
                        }`}>
                          {nft.rarityScore ? `Rarity: ${nft.rarityScore}` : 'Common'}
                        </span>
                      </div>

                      {/* Dynamic Traits Display */}
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        {Object.entries(nft.traits).slice(0, 8).map(([key, value]) => (
                          <div key={key} className="bg-blue-50 rounded-lg p-2">
                            <div className="text-xs text-blue-600 font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-blue-800 font-semibold">
                              {String(value).length > 15 ? String(value).substring(0, 15) + '...' : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mint Time */}
                      <div className="text-xs text-blue-700/70 mb-4">
                        Minted: {new Date(Number(nft.traits.mintTime) * 1000).toLocaleDateString()}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <a
                          href={`https://shapescan.xyz/token/${contractAddress}?a=${nft.tokenId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-lg py-2 px-4 text-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Explorer
                        </a>
                        {userAddress && (
                          <button className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-lg text-indigo-700 transition-colors">
                            Transfer
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/80 hover:bg-white border border-blue-200 rounded-lg text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <span className="text-blue-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/80 hover:bg-white border border-blue-200 rounded-lg text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
