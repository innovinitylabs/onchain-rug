'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useContractRead, useWatchContractEvent, useAccount, useChainId } from 'wagmi'
import { ExternalLink, Filter, SortAsc, Grid, List, RefreshCw } from 'lucide-react'
import { onchainRugsABI, contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'

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

  const itemsPerPage = 24
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  // Contract reads
  const { data: totalSupply } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'totalSupply',
  })

  const { data: maxSupply } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'maxSupply',
  })

  // For now, let's create a simple demo with sample data
  // In production, you would implement proper contract reading
  useEffect(() => {
    if (!totalSupply) return

    // Demo data - replace with actual contract calls
    const demoNFTs: NFTData[] = Array.from({ length: Math.min(Number(totalSupply), 20) }, (_, i) => ({
      tokenId: i + 1,
      traits: {
        seed: BigInt(i + 1),
        paletteName: `Palette ${i + 1}`,
        minifiedPalette: `#${(i * 12345).toString(16).slice(0, 6)}`,
        minifiedStripeData: `stripes-${i}`,
        textRows: [`Row ${i + 1}`, `Text ${i + 1}`],
        warpThickness: 8 + i,
        mintTime: BigInt(Date.now() - (i * 86400000)), // Days ago
        filteredCharacterMap: `chars-${i}`,
        complexity: 1 + (i % 10),
        characterCount: BigInt(100 + i * 10),
        stripeCount: BigInt(5 + (i % 15)),
      },
      owner: '',
      rarityScore: 50 + (i % 50), // Mock rarity
    }))

    setNfts(demoNFTs)
    setLoading(false)
  }, [totalSupply])

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
          Explore the complete collection of {totalSupply ? Number(totalSupply) : 0} unique Onchain Rugs.
          Each piece is algorithmically generated and stored entirely on-chain.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
            <div className="text-2xl font-bold text-blue-600">{totalSupply ? Number(totalSupply) : 0}</div>
            <div className="text-sm text-blue-700/70">Minted</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-indigo-200/50">
            <div className="text-2xl font-bold text-indigo-600">{maxSupply ? Number(maxSupply) : 1111}</div>
            <div className="text-sm text-blue-700/70">Max Supply</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-200/50">
            <div className="text-2xl font-bold text-purple-600">{availableTraits.paletteName?.size || 0}</div>
            <div className="text-sm text-blue-700/70">Palettes</div>
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
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Results count */}
            <div className="text-center mb-8">
              <p className="text-blue-700/70">
                Showing {paginatedNFTs.length} of {filteredAndSortedNFTs.length} NFTs
                {Object.keys(selectedTraits).length > 0 && ' (filtered)'}
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
