'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useContractRead, useWatchContractEvent, useAccount, useChainId } from 'wagmi'
import { ExternalLink, Filter, SortAsc, Grid, List, RefreshCw, ChevronDown, ChevronUp, Code, X, Maximize2, Minimize2 } from 'lucide-react'
import { onchainRugsABI, contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'
import { getExplorerUrl } from '@/lib/networks'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LoadingAnimation from '@/components/LoadingAnimation'
import { useCachedCollection, useLazyNFTs } from '@/hooks/use-cached-nfts'

// Feature flag: Enable cached NFT API (set to true to use new cached endpoints)
const USE_CACHED_API = process.env.NEXT_PUBLIC_USE_CACHED_NFT_API === 'true'

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
  textLinesCount: number // From Alchemy "Text Lines" trait
}

interface NFTData {
  tokenId: number
  traits: RugTraits
  owner: string
  metadata?: any
  raw?: any // Raw Alchemy metadata including tokenURI attributes
  rarityScore?: number
  name?: string
  description?: string
  image?: string
  animation_url?: string
}

type SortOption = 'tokenId' | 'mintTime' | 'rarity' | 'complexity' | 'stripeCount' | 'characterCount' | 'textLines' | 'warpThickness' | 'dirtLevel' | 'agingLevel' | 'maintenanceScore'
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
  const [showRawData, setShowRawData] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const itemsPerPage = 24
  const contractAddress = contractAddresses[chainId] // No fallback - safer to fail than use wrong contract
  const resolvedContractAddress = contractAddress || '0x0000000000000000000000000000000000000000'

  // New cached API hook (when feature flag is enabled)
  const {
    data: cachedCollectionData,
    error: cachedError,
    isLoading: cachedLoading,
    mutate: mutateCached,
  } = useCachedCollection(chainId, currentPage)

  // Lazy loading for visible NFTs
  const visibleNFTs = useLazyNFTs(cachedCollectionData?.nfts || [])

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

        // Fetch collection data from our secure API proxy (no API key exposed)
        console.log('🔄 Step 1: Fetching NFT collection list via proxy...')
        console.log('📍 Using chainId:', chainId, 'for network-specific Alchemy API')
        const response = await fetch(
          `/api/alchemy?endpoint=getNFTsForCollection&contractAddress=${resolvedContractAddress}&chainId=${chainId}`
        )

        if (!response.ok) {
          throw new Error(`API proxy error: ${response.status}`)
        }

        const collectionData = await response.json()
        console.log('✅ Got collection data:', collectionData.nfts?.length || 0, 'NFTs')

        // Now fetch individual metadata for each NFT via proxy
        console.log('🔄 Step 2: Fetching individual metadata via proxy...')
        const enrichedNfts = []

        for (const nft of collectionData.nfts || []) {
          try {
            console.log(`📋 Fetching metadata for NFT #${nft.tokenId}...`)
            const metadataResponse = await fetch(
              `/api/alchemy?endpoint=getNFTMetadata&contractAddress=${resolvedContractAddress}&tokenId=${nft.tokenId}&chainId=${chainId}`
            )

            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json()
              // Merge collection data with metadata
              enrichedNfts.push({
                ...nft,
                ...metadata // This includes animation_url, name, description, etc.
              })
              console.log(`✅ NFT #${nft.tokenId}: animation_url = ${!!metadata.animation_url}`)
            } else {
              console.log(`⚠️ Failed to get metadata for NFT #${nft.tokenId}`)
              enrichedNfts.push(nft)
            }
          } catch (error) {
            console.warn(`❌ Error fetching metadata for NFT ${nft.tokenId}:`, error)
            enrichedNfts.push(nft)
          }
        }

        setAlchemyData({ nfts: enrichedNfts, pageKey: collectionData.pageKey })

      } catch (error) {
        console.error('Alchemy fetch error:', error)
        setAlchemyError(error instanceof Error ? error.message : 'Failed to fetch NFT data')
      } finally {
        setLoadingAlchemy(false)
      }
    }

    fetchAlchemyData()
  }, [resolvedContractAddress, chainId])

  // Initialize loading state
  useEffect(() => {
    if (resolvedContractAddress && resolvedContractAddress !== '0x0000000000000000000000000000000000000000') {
      setLoading(true)
      setInitialLoad(true)
    }
  }, [resolvedContractAddress])

  // Process cached API data (when feature flag is enabled)
  useEffect(() => {
    if (!USE_CACHED_API) return

    if (cachedLoading) {
      setLoading(true)
      return
    }

    if (cachedError) {
      console.error('Cached API error:', cachedError)
      setLoading(false)
      setInitialLoad(false)
      return
    }

    if (cachedCollectionData?.nfts) {
      // Transform cached data to NFTData format
      const transformedNFTs: NFTData[] = cachedCollectionData.nfts.map((nft) => {
        const staticData = nft.static || {}
        const dynamicData = nft.dynamic || {}

        return {
          tokenId: nft.tokenId,
          traits: {
            seed: BigInt(staticData.seed || nft.tokenId),
            paletteName: staticData['Palette Name'] || staticData.paletteName || 'Default',
            minifiedPalette: staticData.minifiedPalette || '',
            minifiedStripeData: staticData.minifiedStripeData || '',
            textRows: staticData.textRows || [],
            warpThickness: staticData['Warp Thickness'] || staticData.warpThickness || 3,
            mintTime: BigInt(staticData.mintTime || Date.now()),
            filteredCharacterMap: staticData.filteredCharacterMap || '',
            complexity: staticData['Complexity'] || staticData.complexity || 2,
            characterCount: BigInt(staticData['Character Count'] || staticData.characterCount || 1),
            stripeCount: BigInt(staticData['Stripe Count'] || staticData.stripeCount || 0),
            textLinesCount: staticData['Text Lines'] || staticData.textLinesCount || 0,
          },
          owner: (dynamicData as any)?.owner || '',
          name: staticData.name || `OnchainRug #${nft.tokenId}`,
          description: staticData.description || '',
          image: staticData.image || '/logo.png',
          animation_url: staticData.animation_url || nft.tokenURI || '',
          rarityScore: 0, // TODO: Calculate from traits
        }
      })

      setNfts(transformedNFTs)
      setLoading(false)
      setInitialLoad(false)
    }
  }, [USE_CACHED_API, cachedCollectionData, cachedLoading, cachedError])

  // Process Alchemy NFT data - much simpler! (when feature flag is disabled)
  useEffect(() => {
    if (USE_CACHED_API) return // Skip if using cached API

    console.log('🔄 Processing useEffect triggered:', {
      hasAlchemyData: !!alchemyData,
      hasAlchemyError: !!alchemyError,
      loadingAlchemy,
      loading,
      initialLoad,
      nftsLength: nfts.length,
      alchemyDataLength: alchemyData?.nfts?.length || 0
    })

    if (!alchemyData || alchemyError) {
      console.log('⏸️ Skipping processing - no data or error:', {
        alchemyData: !!alchemyData,
        alchemyError: alchemyError
      })
      // Make sure loading stops even if there's an error
      if (loadingAlchemy) {
        console.log('🔄 Stopping loading due to error')
        setLoadingAlchemy(false)
        setLoading(false)
        setInitialLoad(false)
      }
      return
    }

    try {
      const nftData: NFTData[] = []

      // Process Alchemy NFT data
      if (alchemyData.nfts && Array.isArray(alchemyData.nfts)) {
        console.log('🎯 Processing', alchemyData.nfts.length, 'NFTs from Alchemy')
        alchemyData.nfts.forEach((nft: any, index: number) => {
          console.log(`🆔 NFT #${nft.tokenId} (index ${index}):`, {
            name: nft.name,
            description: nft.description,
            animation_url: !!nft.animation_url,
            rawMetadataAttributes: nft.raw?.metadata?.attributes?.length || 0,
            hasRawMetadata: !!nft.raw?.metadata,
            owners: nft.owners?.length || 0
          })
          try {
            // Extract traits from Alchemy's raw.metadata.attributes (the actual tokenURI metadata)
            const attributes = nft.raw?.metadata?.attributes || []

            // Debug: Log the actual attributes structure from Alchemy
            console.log(`🔍 NFT #${nft.tokenId} raw metadata attributes:`, attributes)
            console.log(`🔍 NFT #${nft.tokenId} full Alchemy structure:`, {
              raw: nft.raw,
              metadata: nft.raw?.metadata,
              attributes: nft.raw?.metadata?.attributes,
              topLevelAttributes: nft.attributes
            })

            // Start with default values, then dynamically parse from metadata
            const traits: RugTraits = {
              seed: BigInt(nft.tokenId || 0),
              paletteName: 'Default Palette',
              minifiedPalette: '', // Not available from Alchemy
              minifiedStripeData: '', // Not available from Alchemy
              textRows: [], // Not available from Alchemy
              warpThickness: 3,
              mintTime: nft.mint?.timestamp ? BigInt(new Date(nft.mint.timestamp).getTime()) : BigInt(Date.now()),
              filteredCharacterMap: '', // Not available from Alchemy
              complexity: 2,
              characterCount: BigInt(1),
              stripeCount: BigInt(0),
              textLinesCount: 0, // Default from "Text Lines" trait
            }

            // Dynamic trait mapping: trait_type from tokenURI metadata -> RugTraits field
            const traitMapping: Record<string, keyof RugTraits> = {
              'Palette Name': 'paletteName',
              'Warp Thickness': 'warpThickness',
              'Complexity': 'complexity',
              'Character Count': 'characterCount',
              'Stripe Count': 'stripeCount',
              'Text Lines': 'textLinesCount', // Maps count to textLinesCount field
              // Note: 'Dirt Level' exists in metadata but not in RugTraits interface
            }

            // Parse attributes from nft.raw.metadata.attributes (the decoded tokenURI)
            attributes.forEach((attr: any) => {
              const traitType = attr.trait_type
              const value = attr.value
              const fieldName = traitMapping[traitType]

              if (fieldName && fieldName in traits) {
                // Type conversion based on the field type
                switch (fieldName) {
                  case 'characterCount':
                  case 'stripeCount':
                    (traits as any)[fieldName] = BigInt(value)
                    break
                  case 'warpThickness':
                  case 'complexity':
                  case 'textLinesCount':
                    (traits as any)[fieldName] = Number(value)
                    break
                  case 'paletteName':
                    (traits as any)[fieldName] = String(value)
                    break
                  default:
                    // For other fields, keep as string for now
                    (traits as any)[fieldName] = value
                }
                console.log(`✅ Mapped ${traitType} -> ${fieldName}: ${value}`)
              } else if (traitType === 'Dirt Level') {
                console.log(`ℹ️ Dirt Level trait: ${value} (not in RugTraits interface)`)
              } else {
                console.log(`❓ Unknown trait type: ${traitType} = ${value}`)
              }
            })

            // Debug: Show final parsed traits
            console.log(`🎯 NFT #${nft.tokenId} parsed traits:`, {
              paletteName: traits.paletteName,
              warpThickness: traits.warpThickness,
              complexity: traits.complexity,
              characterCount: traits.characterCount.toString(),
              stripeCount: traits.stripeCount.toString(),
              textLinesCount: traits.textLinesCount
            })

            const nftItem: NFTData = {
              tokenId: Number(nft.tokenId),
              traits,
              owner: nft.owners ? nft.owners[0] : '', // Primary owner
              raw: nft.raw, // Include raw Alchemy metadata for trait filtering
              rarityScore: calculateRarityScore(traits),
              // Use the metadata we already set up
              name: nft.name,
              description: nft.description,
              image: nft.image?.cachedUrl || nft.image?.originalUrl || nft.image || '/logo.png',
              animation_url: nft.animation_url || nft.animation?.cachedUrl || nft.animation?.originalUrl
            }

            nftData.push(nftItem)
            console.log(`✅ Successfully added NFT #${nft.tokenId} to gallery`)
          } catch (error) {
            console.warn(`❌ Error processing Alchemy NFT ${nft.tokenId}:`, error)
          }
        })

        console.log('📊 NFT processing complete:', {
          totalProcessed: alchemyData.nfts.length,
          successfullyAdded: nftData.length,
          failed: alchemyData.nfts.length - nftData.length
        })
      }

      console.log('✅ Final NFT data array:', nftData)
      console.log('📊 Total NFTs processed:', nftData.length)

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

  // Dynamic trait filtering - show all traits from tokenURI attributes
  const availableTraits = useMemo(() => {
    const traits: Record<string, Set<any>> = {}

    nfts.forEach(nft => {
      // Get attributes from Alchemy's raw metadata (tokenURI attributes)
      const attributes = nft.raw?.metadata?.attributes || []

      attributes.forEach((attr: any) => {
        if (!attr || !attr.trait_type || attr.value === undefined || attr.value === null) return

        const traitType = attr.trait_type
        const value = attr.value

        if (!traits[traitType]) traits[traitType] = new Set()
        traits[traitType].add(value)
      })

      // Also include any rug traits that might not be in attributes but are useful for filtering
      // (like seed, mintTime from rug data)
      Object.entries(nft.traits).forEach(([key, value]) => {
        // Skip internal implementation traits, keep only meaningful ones
        const excludedTraits = ['minifiedPalette', 'minifiedStripeData', 'filteredCharacterMap']
        if (excludedTraits.includes(key)) return

        if (!traits[key]) traits[key] = new Set()
        if (value !== undefined && value !== null) {
          traits[key].add(value)
        }
      })
    })

    return traits
  }, [nfts])

  // Helper function to get trait value for filtering/sorting
  const getTraitValue = (nft: NFTData, traitName: string): any => {
    // First check if the trait exists in nft.traits (RugTraits interface)
    if (nft.traits && traitName in nft.traits) {
      return nft.traits[traitName as keyof RugTraits]
    }

    // If not in traits, check tokenURI attributes from raw metadata
    if (nft.raw?.metadata?.attributes) {
      const attribute = nft.raw.metadata.attributes.find((attr: any) => attr.trait_type === traitName)
      return attribute ? attribute.value : undefined
    }

    return undefined
  }

  // Filtered and sorted NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    const filtered = nfts.filter(nft => {
      return Object.entries(selectedTraits).every(([trait, value]) => {
        if (value === null || value === undefined || value === '') return true

        const traitValue = getTraitValue(nft, trait)
        return traitValue != undefined && traitValue == value // Use loose equality for type conversion
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
          aValue = getTraitValue(a, 'Mint Time') || Number(a.traits.mintTime)
          bValue = getTraitValue(b, 'Mint Time') || Number(b.traits.mintTime)
          break
        case 'rarity':
          aValue = a.rarityScore || 0
          bValue = b.rarityScore || 0
          break
        case 'complexity':
          aValue = getTraitValue(a, 'Complexity') || a.traits.complexity
          bValue = getTraitValue(b, 'Complexity') || b.traits.complexity
          break
        case 'stripeCount':
          aValue = getTraitValue(a, 'Stripe Count') || Number(a.traits.stripeCount)
          bValue = getTraitValue(b, 'Stripe Count') || Number(b.traits.stripeCount)
          break
        case 'characterCount':
          aValue = getTraitValue(a, 'Character Count') || Number(a.traits.characterCount)
          bValue = getTraitValue(b, 'Character Count') || Number(b.traits.characterCount)
          break
        case 'textLines':
          aValue = getTraitValue(a, 'Text Lines')
          bValue = getTraitValue(b, 'Text Lines')
          break
        case 'warpThickness':
          aValue = getTraitValue(a, 'Warp Thickness') || a.traits.warpThickness
          bValue = getTraitValue(b, 'Warp Thickness') || b.traits.warpThickness
          break
        case 'dirtLevel':
          aValue = getTraitValue(a, 'Dirt Level')
          bValue = getTraitValue(b, 'Dirt Level')
          break
        case 'agingLevel':
          aValue = getTraitValue(a, 'Aging Level')
          bValue = getTraitValue(b, 'Aging Level')
          break
        case 'maintenanceScore':
          aValue = getTraitValue(a, 'Maintenance Score')
          bValue = getTraitValue(b, 'Maintenance Score')
          break
        default:
          // For other traits, try to get the value for sorting
          aValue = getTraitValue(a, sortBy)
          bValue = getTraitValue(b, sortBy)
          break
      }

      // Convert to numbers for numeric sorting if possible
      if (typeof aValue === 'string' && !isNaN(Number(aValue))) aValue = Number(aValue)
      if (typeof bValue === 'string' && !isNaN(Number(bValue))) bValue = Number(bValue)

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

  // Loading component with rug-loading-smol.webp
  const LoadingSpinner = () => (
    <LoadingAnimation message="Loading NFTs..." size="lg" />
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col">
      <Navigation />
      <main className="flex-grow">
        {/* Header */}
        <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 pt-24"
      >
        <h1 className="text-6xl md:text-7xl font-bold gradient-text mb-6">
          Gallery
        </h1>
        <p className="text-xl text-blue-700 max-w-3xl mx-auto mb-8">
          Explore our collection of 10K unique Onchain Rugs, algorithmically generated and stored entirely on-chain.
          {nfts.length > 0 ? ` Currently displaying ${nfts.length} loaded NFTs.` : ' Loading NFT data from the blockchain...'}
        </p>

        {/* TODO: remove when mainnet - Contract Info */}
        {false && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 max-w-4xl mx-auto mb-8">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Contract Information</h3>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200/50">
              <div className="text-sm text-blue-700 mb-1">Contract Address</div>
              <div className="font-mono text-sm text-blue-800 break-all">
                {resolvedContractAddress}
              </div>
              <div className="text-xs text-blue-600 mt-2">
                Shape Sepolia Testnet • Chain ID: {chainId}
              </div>
            </div>
          </div>

          {/* Raw Data Collapsible Section */}
          <div className="mt-6">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 text-blue-700 transition-colors w-full justify-center"
            >
              <Code className="w-4 h-4" />
              <span className="text-sm font-medium">
                {showRawData ? 'Hide' : 'Show'} Raw JSON Data
              </span>
              {showRawData ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {showRawData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
                >
                  <div className="p-4">
                    <h4 className="text-white font-medium mb-3">Raw Alchemy Data</h4>
                    <pre className="text-green-400 text-xs overflow-x-auto max-h-96 overflow-y-auto">
                      {JSON.stringify(alchemyData, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
            <div className="text-2xl font-bold text-blue-600">{totalSupply ? Number(totalSupply) : 10000}</div>
            <div className="text-sm text-blue-700">Total Supply</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-indigo-200/50">
            <div className="text-2xl font-bold text-indigo-600">{nfts.length}</div>
            <div className="text-sm text-blue-700">Loaded NFTs</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-200/50">
            <div className="text-2xl font-bold text-purple-600">{availableTraits.paletteName?.size || 0}</div>
            <div className="text-sm text-blue-700">Unique Palettes</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-cyan-200/50">
            <div className="text-2xl font-bold text-cyan-600">{availableTraits.complexity?.size || 0}</div>
            <div className="text-sm text-blue-700">Complexity Levels</div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Layout - Sidebar + NFTs */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters & Controls */}
          <div className="lg:w-80 flex-shrink-0">
            {/* Controls */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Gallery Controls
              </h3>

              {/* Sorting */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <SortAsc className="w-4 h-4" />
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-3 py-2 bg-white/80 border border-blue-200 rounded-lg text-blue-700"
                  >
                    <option value="tokenId">Token ID</option>
                    <option value="mintTime">Mint Date</option>
                    <option value="rarity">Rarity Score</option>
                    <option value="complexity">Complexity</option>
                    <option value="stripeCount">Stripes</option>
                    <option value="characterCount">Characters</option>
                    <option value="textLines">Text Lines</option>
                    <option value="warpThickness">Warp Thickness</option>
                    <option value="dirtLevel">Dirt Level</option>
                    <option value="agingLevel">Aging Level</option>
                    <option value="maintenanceScore">Maintenance Score</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-lg text-blue-700 transition-colors"
                    title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                  >
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* View Mode */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-blue-700 mb-2">View Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    List
                  </button>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-lg text-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh NFTs'}
              </button>
            </div>

            {/* Trait Filters */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">Filter by Traits</span>
              </div>

              <div className="space-y-4">
                {Object.entries(availableTraits).map(([trait, values]) => (
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
                      className="w-full px-2 py-2 text-sm bg-white/80 border border-blue-200 rounded text-blue-700"
                    >
                      <option value="">All</option>
                      {Array.from(values).slice(0, 20).map((value, idx) => (
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
                  className="mt-4 w-full px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-200 rounded-lg text-red-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Content - NFTs */}
          <div className="flex-1">
            {/* NFT Grid/List */}
            <div className="pb-20">
        {(() => {
          const shouldShowLoading = loading || loadingAlchemy || initialLoad
          console.log('🎯 Render decision:', {
            shouldShowLoading,
            loading,
            loadingAlchemy,
            initialLoad,
            nftsLength: nfts.length,
            hasAlchemyData: !!alchemyData,
            hasAlchemyError: !!alchemyError
          })
          if (shouldShowLoading) {
            return <LoadingSpinner />
          } else if (nfts.length === 0) {
            return (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-2xl font-bold text-blue-800 mb-4">No NFTs Available</h3>
                <p className="text-blue-700 mb-6 max-w-md mx-auto">
                  {alchemyError || "Unable to load NFT data. This could be due to:"}
                </p>
                <ul className="text-left text-blue-700 mb-6 max-w-md mx-auto list-disc list-inside space-y-2">
                  <li>Alchemy API key not configured on server</li>
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
            )
          } else {
            return (
          <>
            {/* Results count */}
            <div className="text-center mb-8">
              <p className="text-blue-700">
                Showing {paginatedNFTs.length} of {filteredAndSortedNFTs.length} loaded NFTs
                {Object.keys(selectedTraits).length > 0 && ' (filtered)'}
                {totalSupply && Number(totalSupply) > nfts.length && (
                  <span className="block text-sm mt-1 text-blue-600">
                    ({Number(totalSupply) - nfts.length} more NFTs available - loading first {Math.min(Number(totalSupply), 5)})
                  </span>
                )}
              </p>
            </div>

            {/* NFT Display */}
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
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
                    className={`bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                    onClick={() => setSelectedNFT(nft)}
                  >
                    {/* Artwork Iframe */}
                    <div className={`relative ${viewMode === 'grid' ? 'aspect-[4/3]' : 'w-64 flex-shrink-0'}`}>
                      {nft.animation_url ? (
                        <div className={`w-full ${viewMode === 'list' ? 'h-48' : 'h-full'} overflow-hidden rounded-lg relative bg-gradient-to-br from-blue-50 to-indigo-50`}>
                          {/* Responsive iframe container that matches canvas aspect ratio */}
                          <div
                            className="w-full relative overflow-hidden rounded-lg"
                            style={{
                              paddingBottom: viewMode === 'list' ? '75%' : '75%', // More generous aspect ratio to prevent overflow
                              maxHeight: viewMode === 'list' ? '192px' : 'none'
                            }}
                          >
                            <iframe
                              src={nft.animation_url}
                              className="absolute inset-0 border-0 w-full h-full rounded-lg"
                              style={{
                                width: '100%',
                                height: '100%',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                transform: 'scale(0.95)', // Slight scale down to prevent overflow
                                transformOrigin: 'center center'
                              }}
                              title={`Onchain Rug #${nft.tokenId}`}
                              sandbox="allow-scripts"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🎨</div>
                            <div className="text-sm text-blue-600 font-medium">No artwork available</div>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        #{nft.tokenId}
                      </div>
                    </div>

                    {/* NFT Info */}
                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-blue-800">
                          {nft.name || `OnchainRug #${nft.tokenId}`}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          nft.rarityScore && nft.rarityScore > 80 ? 'text-purple-600 bg-purple-100' :
                          nft.rarityScore && nft.rarityScore > 60 ? 'text-blue-600 bg-blue-100' :
                          nft.rarityScore && nft.rarityScore > 40 ? 'text-green-600 bg-green-100' :
                          'text-gray-600 bg-gray-100'
                        }`}>
                          {nft.rarityScore ? `Rarity: ${nft.rarityScore}` : 'Common'}
                        </span>
                      </div>

                      {/* Description */}
                      {nft.description && (
                        <p className="text-sm text-blue-700 mb-3 line-clamp-2">
                          {nft.description}
                        </p>
                      )}

                      {/* Traits Display */}
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        {Object.entries(nft.traits).filter(([key]) =>
                          ['paletteName', 'complexity', 'characterCount', 'stripeCount', 'textLinesCount', 'warpThickness'].includes(key)
                        ).slice(0, 6).map(([key, value]) => (
                          <div key={key} className="bg-blue-50 rounded-lg p-2">
                            <div className="text-xs text-blue-600 font-medium capitalize">
                              {key === 'paletteName' ? 'Palette' :
                               key === 'characterCount' ? 'Characters' :
                               key === 'stripeCount' ? 'Stripes' :
                               key === 'textLinesCount' ? 'Text Lines' :
                               key === 'warpThickness' ? 'Warp' :
                               key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-blue-800 font-semibold">
                              {String(value).length > 18 ? String(value).substring(0, 18) + '...' : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mint Time */}
                      <div className="text-xs text-blue-700 mb-4">
                        Minted: {nft.traits.mintTime ?
                          new Date(typeof nft.traits.mintTime === 'string' ?
                            nft.traits.mintTime : Number(nft.traits.mintTime) * 1000
                          ).toLocaleDateString() :
                          'Unknown'
                        }
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <a
                          href={`${getExplorerUrl(chainId)}/token/${contractAddress}/instance/${nft.tokenId}`}
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
            )
          }
        })()}
            </div>
          </div>
        </div>
      </div>
      </main>

      {/* NFT Detail Modal */}
      <AnimatePresence>
        {selectedNFT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed z-50 flex items-center justify-center ${isFullscreen ? 'inset-0 bg-black' : 'inset-0 p-4 bg-black/80 backdrop-blur-sm'}`}
            onClick={() => setSelectedNFT(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`w-full overflow-hidden ${isFullscreen ? 'max-w-full max-h-full' : 'max-w-6xl max-h-[90vh]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`overflow-hidden shadow-2xl ${isFullscreen ? 'bg-black w-full h-full' : 'bg-white/95 backdrop-blur-xl rounded-2xl border border-blue-200/50'}`}>
                {/* Modal Header - Hidden in fullscreen */}
                {!isFullscreen && (
                  <div className="flex items-center justify-between p-6 border-b border-blue-200/50">
                    <div>
                      <h2 className="text-2xl font-bold text-blue-800">
                        {selectedNFT.name || `OnchainRug #${selectedNFT.tokenId}`}
                      </h2>
                      <p className="text-blue-600 mt-1">Token ID: {selectedNFT.tokenId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                      >
                        <Maximize2 className="w-5 h-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => setSelectedNFT(null)}
                        className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Close"
                      >
                        <X className="w-5 h-5 text-blue-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Fullscreen Controls */}
                {isFullscreen && (
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                      title="Exit Fullscreen"
                    >
                      <Minimize2 className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => setSelectedNFT(null)}
                      className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                      title="Close"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}

                {/* Modal Content */}
                <div className={`flex ${isFullscreen ? 'flex-col h-full' : 'flex-col lg:flex-row'}`}>
                  {/* Large NFT Preview */}
                  <div className={`flex-shrink-0 ${isFullscreen ? 'flex-1 p-4' : 'lg:w-1/2 p-6'}`}>
                    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden">
                      {selectedNFT.animation_url ? (
                        <div
                          className="w-full relative"
                          style={{
                            paddingBottom: '69.7%', // Maintains 1320:920 aspect ratio
                          }}
                        >
                          <iframe
                            src={selectedNFT.animation_url}
                            className="absolute inset-0 border-0 w-full h-full rounded-xl"
                            title={`Onchain Rug #${selectedNFT.tokenId} - Large Preview`}
                            sandbox="allow-scripts"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-32">
                          <div className="text-center">
                            <div className="text-6xl mb-4">🎨</div>
                            <div className="text-xl text-blue-600 font-medium">No artwork available</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Traits Grid - Hidden in fullscreen */}
                  {!isFullscreen && (
                    <div className="flex-1 p-6 lg:w-1/2">
                    <h3 className="text-xl font-bold text-blue-800 mb-4">NFT Traits</h3>

                    {/* Description */}
                    {selectedNFT.description && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-blue-700 mb-2">Description</h4>
                        <p className="text-blue-600">{selectedNFT.description}</p>
                      </div>
                    )}

                    {/* Traits Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {/* Get all traits from both nft.traits and raw metadata */}
                      {(() => {
                        const allTraits = new Map<string, any>()

                        // Add traits from nft.traits
                        Object.entries(selectedNFT.traits).forEach(([key, value]) => {
                          if (key !== 'minifiedPalette' && key !== 'minifiedStripeData' && key !== 'filteredCharacterMap') {
                            allTraits.set(key, value)
                          }
                        })

                        // Add traits from raw metadata attributes
                        if (selectedNFT.raw?.metadata?.attributes) {
                          selectedNFT.raw.metadata.attributes.forEach((attr: any) => {
                            if (attr.trait_type && attr.value !== undefined) {
                              allTraits.set(attr.trait_type, attr.value)
                            }
                          })
                        }

                        return Array.from(allTraits.entries()).map(([traitName, value]) => (
                          <div key={traitName} className="bg-blue-50 rounded-lg p-3 border border-blue-200/50">
                            <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                              {traitName.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-blue-800 font-semibold mt-1">
                              {String(value).length > 25 ? String(value).substring(0, 25) + '...' : String(value)}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-blue-200/50">
                      <a
                        href={`${getExplorerUrl(chainId)}/token/${contractAddress}/instance/${selectedNFT.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Explorer
                      </a>
                      {userAddress && (
                        <button className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                          Transfer NFT
                        </button>
                      )}
                    </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  )
}
