'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useChainId, usePublicClient } from 'wagmi'
import { onchainRugsABI, contractAddresses, callContractMultiFallback } from '@/lib/web3'
import { Wallet, AlertCircle, RefreshCw, Droplets, Sparkles, Crown, TrendingUp, Clock, ExternalLink, Copy, CheckCircle, Maximize2, Minimize2 } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LoadingAnimation from '@/components/LoadingAnimation'
import { RugCleaning } from '@/components/RugCleaning'
import { RugMarketplace } from '@/components/RugMarketplace'
import { useRugData } from '@/hooks/use-rug-data'
import LiquidGlass from '@/components/LiquidGlass'
import { config } from '@/lib/config'
import { formatEther } from 'viem'
import { parseTokenURIData } from '@/utils/parsing-utils'

// Types for our NFT data
interface RugTraits {
  seed?: string
  paletteName?: string
  minifiedPalette?: string
  minifiedStripeData?: string
  textRows?: string[]
  warpThickness?: number
  complexity?: number
  characterCount?: number
  stripeCount?: number
  mintTime?: number
}

// Parse aging data from tokenURI attributes
function parseAgingDataFromAttributes(attributes: any[]): AgingData {
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

interface AgingData {
  lastCleaned: bigint
  lastTextureReset: bigint
  lastSalePrice: bigint
  recentSalePrices: readonly [bigint, bigint, bigint]
  dirtLevel: number
  agingLevel: number
  launderingCount: bigint
  lastLaundered: bigint
  cleaningCount: bigint
  restorationCount: bigint
  masterRestorationCount: bigint
  maintenanceScore: bigint
  currentFrameLevel: string
  frameAchievedTime: bigint
  gracePeriodActive: boolean
  gracePeriodEnd: bigint
  isMuseumPiece: boolean
}

interface RugData {
  tokenId: number
  traits: {
    seed?: string
    paletteName?: string
    minifiedPalette?: string
    minifiedStripeData?: string
    textRows?: string[]
    warpThickness?: number
    complexity?: number
    characterCount?: number
    stripeCount?: number
    mintTime?: number
  }
  aging: {
    dirtLevel: number
    agingLevel: number
    lastCleaned: bigint | null
    mintTime: number
  }
  owner: string
  name?: string
  image?: string
  animation_url?: string
  tokenURI?: string
  metadata?: any
  dirtDescription?: string
  agingDescription?: string
  isClean?: boolean
  needsCleaning?: boolean
  cleaningCost?: number
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [userRugs, setUserRugs] = useState<RugData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRug, setSelectedRug] = useState<RugData | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [fullScreenMode, setFullScreenMode] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  // Get user's rug balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Helper function to fetch rug data using new utilities
  const fetchRugData = async (tokenId: number): Promise<RugData | null> => {
    try {
      // Get tokenURI directly from contract with Alchemy fallback
      console.log(`Fetching tokenURI for rug #${tokenId}...`)
      const tokenURI = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'tokenURI',
        [BigInt(tokenId)],
        { chainId }
      ) as unknown as string

      console.log(`Got tokenURI for rug #${tokenId}:`, tokenURI ? 'success' : 'empty')

      if (tokenURI) {
        try {
          // Parse the tokenURI JSON data using new utilities
          const parsedData = parseTokenURIData(tokenURI)
          console.log(`Parsed data for rug #${tokenId}:`, {
            name: parsedData.name,
            dirtLevel: parsedData.aging.dirtLevel,
            agingLevel: parsedData.aging.agingLevel,
          })

          // Get owner with Alchemy fallback
          const ownerOf = await callContractMultiFallback(
            contractAddress,
            onchainRugsABI,
            'ownerOf',
            [BigInt(tokenId)],
            { chainId }
          ) as unknown as string

          // Create rug data object
          const rugData: RugData = {
            tokenId,
            tokenURI,
            metadata: parsedData.metadata,
            aging: parsedData.aging,
            traits: parsedData.traits,
            animation_url: parsedData.animationUrl,
            image: parsedData.image,
            name: parsedData.name,
            owner: ownerOf,
            dirtDescription: parsedData.aging.dirtLevel === 0 ? 'Clean' : 'Dirty',
            agingDescription: parsedData.aging.agingLevel === 0 ? 'Brand New' : 'Aged',
            isClean: parsedData.aging.dirtLevel === 0,
            needsCleaning: parsedData.aging.dirtLevel > 0,
            cleaningCost: parsedData.aging.dirtLevel > 0 ? 0.01 : 0,
          }

          return rugData
        } catch (parseError) {
          console.error(`Failed to parse tokenURI for rug #${tokenId}:`, parseError)
          // If parsing fails, try the fallback approach
          return await fetchRugDataFallback(tokenId)
        }
      } else {
        console.warn(`Empty tokenURI for rug #${tokenId}`)
        return null
      }
    } catch (error) {
      console.error(`Failed to fetch rug data for token ${tokenId}:`, error)
      return null
    }
  }

  // Fallback function for parsing tokenURI
  const fetchRugDataFallback = async (tokenId: number): Promise<RugData | null> => {
    try {
      const tokenURI = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'tokenURI',
        [BigInt(tokenId)],
        { chainId }
      ) as unknown as string

      if (tokenURI && tokenURI.startsWith('data:application/json;base64,')) {
        // Manual parsing as fallback
        const jsonString = tokenURI.replace('data:application/json;base64,', '')
        const metadata = JSON.parse(atob(jsonString))

        const attributes = metadata.attributes || []
        const getAttributeValue = (traitType: string) => {
          const attr = attributes.find((a: any) => a.trait_type === traitType)
          return attr ? attr.value : 0
        }

        const aging = {
          dirtLevel: parseInt(getAttributeValue('Dirt Level')) || 0,
          agingLevel: parseInt(getAttributeValue('Aging Level')) || 0,
          lastCleaned: BigInt(0), // Not available in attributes
          mintTime: parseInt(getAttributeValue('Mint Time')) || 0,
        }

        const ownerOf = await callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'ownerOf',
          [BigInt(tokenId)],
          { chainId }
        ) as unknown as string

        return {
          tokenId,
          tokenURI,
          metadata,
          aging,
          traits: metadata.rugData || {},
          animation_url: metadata.animation_url,
          image: metadata.image,
          name: metadata.name,
          owner: ownerOf,
          dirtDescription: aging.dirtLevel === 0 ? 'Clean' : 'Dirty',
          agingDescription: aging.agingLevel === 0 ? 'Brand New' : 'Aged',
          isClean: aging.dirtLevel === 0,
          needsCleaning: aging.dirtLevel > 0,
          cleaningCost: aging.dirtLevel > 0 ? 0.01 : 0,
        }
      }
      return null
    } catch (error) {
      console.error(`Fallback parsing failed for rug #${tokenId}:`, error)
      return null
    }
  }

  // Fetch user's rugs
  useEffect(() => {
    const fetchUserRugs = async () => {
      if (!address) {
        setUserRugs([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const rugs: RugData[] = []

        console.log('Fetching rugs for address:', address)
        console.log('Using contract address:', contractAddress)
        console.log('Current chain ID:', chainId)

        // Get NFTs owned by user from Alchemy
        const ownerResponse = await fetch(`${window.location.origin}/api/alchemy?endpoint=getTokenIdByIndex&contractAddress=${contractAddress}&owner=${address}&index=0&chainId=${chainId}`)
        const ownerData = await ownerResponse.json()

        console.log('Owner data response:', ownerData)

        if (ownerData.ownedNfts && ownerData.ownedNfts.length > 0) {
          console.log(`Found ${ownerData.ownedNfts.length} NFTs from Alchemy`)

          for (const nft of ownerData.ownedNfts) {
            try {
              const tokenId = parseInt(nft.tokenId)
              console.log(`Processing rug #${tokenId}`)

              // Use the new consolidated rug data fetching
              const rugData = await fetchRugData(tokenId)
              if (rugData) {
                rugs.push(rugData)
                console.log(`Successfully added rug #${tokenId} to list`)
              }

              // Add delay between requests to avoid rate limiting
              if (ownerData.ownedNfts.indexOf(nft) < ownerData.ownedNfts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
              }
            } catch (error) {
              console.error(`Failed to fetch rug data for token ${nft.tokenId}:`, error)
            }
          }
        } else {
          console.log('No owned NFTs found from Alchemy')

          // Fallback: Try to check a few common token IDs for testing
          console.log('Trying fallback token ID check...')
          const testTokenIds = [1, 2, 3, 4, 5] // Common test token IDs

          for (const testTokenId of testTokenIds) {
            try {
              console.log(`Testing token ID ${testTokenId}...`)

              // Check if this token exists and is owned by the user with Alchemy fallback
              const ownerOf = await callContractMultiFallback(
                contractAddress,
                onchainRugsABI,
                'ownerOf',
                [BigInt(testTokenId)],
                { chainId }
              ) as unknown as string

              if (ownerOf && ownerOf.toLowerCase() === address?.toLowerCase()) {
                console.log(`Found owned token #${testTokenId}, fetching metadata...`)

                // Use the new consolidated rug data fetching
                const rugData = await fetchRugData(testTokenId)
                if (rugData) {
                  rugs.push(rugData)
                  console.log(`Successfully added test rug #${testTokenId}`)
                }
              }

              // Add delay between requests to avoid rate limiting
              if (testTokenIds.indexOf(testTokenId) < testTokenIds.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
              }
            } catch (error) {
              // Token doesn't exist or not owned by user, skip
              console.log(`Token ${testTokenId} not found or not owned`)
            }
          }
        }

        console.log(`Final rug count: ${rugs.length}`)
        setUserRugs(rugs)
      } catch (error) {
        console.error('Failed to fetch user rugs:', error)
        setUserRugs([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserRugs()
  }, [address, contractAddress, refreshTrigger])

  const handleRefresh = async () => {
    if (refreshing || selectedRug) {
      return
    }

    setRefreshing(true)
    try {
      await refetchBalance()
      // Trigger a refresh of the rug collection
      setRefreshTrigger(prev => prev + 1)
      setTimeout(() => {
        setRefreshing(false)
      }, 2000)
    } catch (error) {
      console.error('Refresh failed:', error)
      setRefreshing(false)
    }
  }

  // Function to refresh a specific NFT in the collection
  const handleRefreshNFT = async (tokenId: number) => {
    console.log(`Refreshing specific NFT #${tokenId}...`)

    try {
      // Find the NFT in the current collection
      const existingIndex = userRugs.findIndex(rug => rug.tokenId === tokenId)

      if (existingIndex === -1) {
        console.warn(`NFT #${tokenId} not found in current collection`)
        return
      }

      // Fetch updated data for this specific NFT
      const updatedRugData = await fetchRugData(tokenId)

      if (updatedRugData) {
        // Update the specific NFT in the state
        setUserRugs(prevRugs => {
          const newRugs = [...prevRugs]
          newRugs[existingIndex] = updatedRugData
          console.log(`Updated NFT #${tokenId} with fresh blockchain data`)
          return newRugs
        })

        // Also update selectedRug if it's the one being refreshed
        if (selectedRug && selectedRug.tokenId === tokenId) {
          setSelectedRug(updatedRugData)
        }
      } else {
        console.error(`Failed to fetch updated data for NFT #${tokenId}`)
      }
    } catch (error) {
      console.error(`Failed to refresh NFT #${tokenId}:`, error)
    }
  }

  const getDirtLevel = (lastCleaned: bigint) => {
    const now = Math.floor(Date.now() / 1000)
    const timeSinceCleaned = now - Number(lastCleaned)

    if (timeSinceCleaned >= config.aging.dirtAccumulation.heavy) return 2
    if (timeSinceCleaned >= config.aging.dirtAccumulation.light) return 1
    return 0
  }

  const getTextureLevel = (lastTextureReset: bigint) => {
    const now = Math.floor(Date.now() / 1000)
    const timeSinceReset = now - Number(lastTextureReset)

    if (timeSinceReset >= config.aging.textureAging.intense) return 2
    if (timeSinceReset >= config.aging.textureAging.moderate) return 1
    return 0
  }

  const getTimeSinceEvent = (timestamp: number | bigint) => {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - Number(timestamp)

    // Format absolute date/time
    const date = new Date(Number(timestamp) * 1000)
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Calculate relative time
    let relativeTime
    if (diff < 60) {
      relativeTime = `${diff}s ago`
    } else if (diff < 3600) {
      relativeTime = `${Math.floor(diff / 60)}m ago`
    } else if (diff < 86400) {
      relativeTime = `${Math.floor(diff / 3600)}h ago`
    } else {
      relativeTime = `${Math.floor(diff / 86400)}d ago`
    }

    return `${dateStr} ${timeStr} (${relativeTime})`
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Navigation />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md mx-auto"
            >
              <Wallet className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h1>
              <p className="text-white/70">Please connect your wallet to view your rug collection and manage your NFTs.</p>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Navigation />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <LoadingAnimation message="Loading your rugs..." size="lg" />
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
        <div className="max-w-4xl mx-auto px-4 py-20 pt-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Wallet className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">My Rug Dashboard</h1>
          </div>
          <p className="text-white/70">Manage your OnchainRugs collection, maintenance, and trading</p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{userRugs.length}</div>
              <div className="text-sm text-white/60">Total Rugs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {userRugs.filter(rug => rug.isClean).length}
              </div>
              <div className="text-sm text-white/60">Clean Rugs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {userRugs.filter(rug => rug.needsCleaning).length}
              </div>
              <div className="text-sm text-white/60">Laundered</div>
            </div>
          </div>
        </motion.div>

        {/* Refresh Button */}
        <div className="flex justify-center mb-8 relative z-10">
          <button
            onClick={handleRefresh}
            disabled={refreshing || !!selectedRug}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border-2 border-blue-400"
            style={{ pointerEvents: (refreshing || !!selectedRug) ? 'none' : 'auto' }}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Collection'}
          </button>
        </div>

        {/* Rugs Grid */}
        {userRugs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🧵</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Rugs Yet</h2>
            <p className="text-white/70 mb-6">Start by creating your first OnchainRug in the generator!</p>
            <a
              href="/generator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            >
              Create Your First Rug
            </a>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {userRugs.map((rug) => {
              const dirtLevel = rug.aging.dirtLevel || 0
              const agingLevel = rug.aging.agingLevel || 0

              return (
                <motion.div
                  key={rug.tokenId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedRug(rug)}
                >
                  <LiquidGlass
                    blurAmount={0.1}
                    aberrationIntensity={2}
                    elasticity={0.1}
                    cornerRadius={12}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
                      {/* Main Preview - Takes up 3/4 of space */}
                      <div className="lg:col-span-3">
                        {/* Rug Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-white">
                            Rug #{rug.tokenId}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rug.isClean ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {rug.isClean ? 'Clean' : 'Dirty'}
                            </span>
                          </div>
                        </div>

                        {/* Full-size Rug Preview */}
                        <div className="w-full bg-transparent rounded-lg overflow-hidden" style={{ aspectRatio: '1320/920' }}>
                          {rug.animation_url ? (
                            <iframe
                              src={rug.animation_url}
                              className="w-full h-full"
                              title={`Rug #${rug.tokenId}`}
                              scrolling="no"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                margin: 0,
                                padding: 0,
                                textDecoration: 'none',
                                boxShadow: 'none',
                                fontFamily: 'monospace',
                                overflow: 'hidden',
                                display: 'block'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">
                              <div className="text-center">
                                <div className="text-3xl mb-2">🧵</div>
                                <div>Rug #{rug.tokenId}</div>
                                <div className="text-xs mt-1">No preview</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Compact Stats Sidebar - Takes up 1/4 of space */}
                      <div className="lg:col-span-1 flex flex-col justify-between h-full">
                        {/* Status and Stats */}
                        <div className="space-y-4">
                          {/* Status Indicators */}
                          {/* Aging Level */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/60">Aging Level</span>
                            <div className={`w-3 h-3 rounded-full ${
                              agingLevel === 0 ? 'bg-emerald-400' :
                              agingLevel <= 3 ? 'bg-amber-400' :
                              agingLevel <= 7 ? 'bg-orange-400' : 'bg-red-400'
                            }`} />
                          </div>
                          <div className="text-xs text-white/70 text-center font-medium">
                            {agingLevel === 0 ? 'Brand New' :
                             agingLevel <= 3 ? 'Slightly Aged' :
                             agingLevel <= 7 ? 'Moderately Aged' : 'Heavily Aged'}
                          </div>
                          </div>

                          {/* Dirt Condition */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/60">Dirt Level</span>
                              <div className={`w-2 h-2 rounded-full ${
                                dirtLevel === 0 ? 'bg-slate-400' :
                                dirtLevel === 1 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                            </div>
                            <div className="text-xs text-white/70 text-center">
                              {dirtLevel === 0 ? 'Clean' : dirtLevel === 1 ? 'Needs Cleaning' : 'Very Dirty'}
                            </div>
                          </div>

                          {/* Maintenance Stats */}
                          <div className="space-y-3 pt-2 border-t border-white/10">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-400">{rug.isClean ? '✓' : '✗'}</div>
                              <div className="text-xs text-white/60">Status</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-400">{rug.aging.dirtLevel}</div>
                              <div className="text-xs text-white/60">Dirt Level</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-400">{rug.aging.agingLevel}</div>
                              <div className="text-xs text-white/60">Aging Level</div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions - Bottom */}
                        <div className="space-y-2 pt-4 border-t border-white/10">
                          <button className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded transition-colors duration-200 text-sm">
                            <ExternalLink className="w-3 h-3 inline mr-1" />
                            OpenSea
                          </button>
                          <button className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded transition-colors duration-200 text-sm">
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            List
                          </button>
                        </div>
                      </div>
                    </div>
                  </LiquidGlass>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Rug Detail Modal */}
        <AnimatePresence>
          {selectedRug && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedRug(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`bg-slate-800 rounded-lg w-full transition-all duration-300 ${
                  fullScreenMode ? 'max-w-none h-screen max-h-screen' : 'max-w-4xl max-h-[90vh]'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`transition-all duration-300 ${
                  fullScreenMode ? 'h-full overflow-hidden' : 'p-6 max-h-[calc(90vh-3rem)] overflow-y-auto'
                }`}>
                  {/* Header - Hidden in full screen mode */}
                  {!fullScreenMode && (
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">
                        Rug #{selectedRug.tokenId}
                      </h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRefreshNFT(selectedRug.tokenId)}
                          disabled={refreshing}
                          className="text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed p-1"
                          title="Refresh NFT data"
                        >
                          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => setSelectedRug(null)}
                          className="text-white/60 hover:text-white p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Large Rug Display - Top */}
                    <div className="w-full relative">
                      {/* Full Screen Toggle and Close Buttons */}
                      <div className="absolute top-2 right-2 z-10 flex gap-2">
                        <button
                          onClick={() => setFullScreenMode(!fullScreenMode)}
                          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors duration-200"
                          title={fullScreenMode ? "Exit full screen" : "View full screen"}
                        >
                          {fullScreenMode ? (
                            <Minimize2 className="w-5 h-5" />
                          ) : (
                            <Maximize2 className="w-5 h-5" />
                          )}
                        </button>
                        {fullScreenMode && (
                          <button
                            onClick={() => setSelectedRug(null)}
                            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors duration-200"
                            title="Close modal"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div
                        className={`w-full mx-auto bg-black/30 rounded-lg overflow-hidden transition-all duration-300 ${
                          fullScreenMode ? 'max-w-none h-screen max-h-screen' : 'max-w-4xl'
                        }`}
                        style={{
                          paddingBottom: fullScreenMode ? '0' : '69.7%', // 920/1320 * 100% = 69.7% (maintains 1320:920 aspect ratio)
                          position: 'relative',
                          height: fullScreenMode ? '100vh' : 'auto'
                        }}
                      >
                        <div className="absolute inset-0">
                          {selectedRug.animation_url ? (
                            <iframe
                              src={selectedRug.animation_url}
                              className="w-full h-full"
                              title={`Rug #${selectedRug.tokenId}`}
                              scrolling="no"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                margin: 0,
                                padding: 0,
                                textDecoration: 'none',
                                boxShadow: 'none',
                                fontFamily: 'monospace',
                                overflow: 'hidden',
                                display: 'block'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">
                              Rug Preview
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions - Hidden in full screen mode */}
                    {!fullScreenMode && (
                      <>
                        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                      <button className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors duration-200">
                        <ExternalLink className="w-4 h-4 inline mr-2" />
                        View on OpenSea
                      </button>
                      <button className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors duration-200">
                        <TrendingUp className="w-4 h-4 inline mr-2" />
                        List for Sale
                      </button>
                    </div>

                    {/* Management Panel - Below Art */}
                    <div className="space-y-6">
                      {/* Rug Stats */}
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Rug Statistics</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/70">Minted:</span>
                            <span className="text-white">{getTimeSinceEvent(selectedRug.traits.mintTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Last Cleaned:</span>
                            <span className="text-white">
                              {selectedRug.aging.lastCleaned > BigInt(0) ? getTimeSinceEvent(selectedRug.aging.lastCleaned) : 'Never'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Status:</span>
                            <span className="text-white">{selectedRug.isClean ? 'Clean' : 'Needs Cleaning'}</span>
                          </div>
                        </div>
                      </div>

                      {/* TokenURI Attributes Grid */}
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">TokenURI Attributes</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {selectedRug.metadata?.attributes?.map((attr: any, index: number) => (
                            <div key={index} className="bg-slate-600/30 rounded-lg p-3">
                              <div className="text-xs text-white/60 mb-1">{attr.trait_type}</div>
                              <div className="text-sm text-white">
                                {typeof attr.value === 'boolean'
                                  ? attr.value ? 'Yes' : 'No'
                                  : attr.value?.toString() || 'N/A'
                                }
                              </div>
                            </div>
                          )) || (
                            <div className="col-span-full text-center text-white/50 py-8">
                              No attributes available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Maintenance */}
                      <RugCleaning
                        tokenId={BigInt(selectedRug.tokenId)}
                        mintTime={selectedRug.aging.mintTime}
                        lastCleaned={selectedRug.aging.lastCleaned}
                        onRefreshNFT={handleRefreshNFT}
                      />

                      {/* Marketplace */}
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Marketplace</h3>
                        <RugMarketplace
                          tokenId={selectedRug.tokenId}
                          isOwner={true}
                          currentPrice={undefined}
                        />
                      </div>

                      {/* Transfer */}
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Transfer Rug</h3>
                        <p className="text-white/60 text-sm mb-3">
                          Transfer this rug to another wallet address
                        </p>
                        <button className="w-full px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-colors duration-200">
                          Transfer to Address
                        </button>
                      </div>
                    </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </main>

      <Footer />
    </div>
  )
}
