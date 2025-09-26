'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useChainId } from 'wagmi'
import { Wallet, AlertCircle, RefreshCw, Droplets, Sparkles, Crown, TrendingUp, Clock, ExternalLink, Copy, CheckCircle } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { RugCleaning } from '@/components/RugCleaning'
import { RugMarketplace } from '@/components/RugMarketplace'
import LiquidGlass from '@/components/LiquidGlass'
import { onchainRugsABI, contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'
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
  image?: string
  animation_url?: string
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [userRugs, setUserRugs] = useState<RugData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRug, setSelectedRug] = useState<RugData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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

        // Get NFTs owned by user from Alchemy
        const ownerResponse = await fetch(`${window.location.origin}/api/alchemy?endpoint=getTokenIdByIndex&contractAddress=${contractAddress}&owner=${address}&index=0`)
        const ownerData = await ownerResponse.json()

        if (ownerData.ownedNfts && ownerData.ownedNfts.length > 0) {
          for (const nft of ownerData.ownedNfts) {
            try {
              const tokenId = parseInt(nft.tokenId)

              // Get rug metadata
              const rugResponse = await fetch(`${window.location.origin}/api/alchemy?endpoint=getNFTMetadata&contractAddress=${contractAddress}&tokenId=${tokenId}`)
              const rugData = await rugResponse.json()

              if (rugData) {
                // Get aging data from contract (mock for now)
                const agingResponse = await fetch(`${window.location.origin}/api/alchemy?endpoint=getAgingData&contractAddress=${contractAddress}&tokenId=${tokenId}`)
                const agingData = agingResponse.ok ? await agingResponse.json() : null

                rugs.push({
                  tokenId,
                  traits: rugData.rugData || {},
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
                  owner: address,
                  name: rugData.name,
                  image: rugData.image,
                  animation_url: rugData.animation_url
                })
              }
            } catch (error) {
              console.warn(`Failed to fetch rug data:`, error)
            }
          }
        }

        setUserRugs(rugs)
      } catch (error) {
        console.error('Failed to fetch user rugs:', error)
        setUserRugs([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserRugs()
  }, [address, contractAddress])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetchBalance()
    setTimeout(() => setRefreshing(false), 2000)
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

  const getTimeSinceEvent = (timestamp: bigint) => {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - Number(timestamp)

    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
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
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
              <p className="text-white/70">Loading your rugs...</p>
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
                {userRugs.filter(rug => getDirtLevel(rug.aging.lastCleaned) === 0).length}
              </div>
              <div className="text-sm text-white/60">Clean Rugs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {userRugs.filter(rug => rug.aging.launderingCount > BigInt(0)).length}
              </div>
              <div className="text-sm text-white/60">Laundered</div>
            </div>
          </div>
        </motion.div>

        {/* Refresh Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 text-blue-300 rounded-lg transition-colors duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRugs.map((rug) => {
              const dirtLevel = rug.aging.dirtLevel || 0
              const textureLevel = rug.aging.textureLevel || 0

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
                    className="p-4"
                  >
                    <div className="space-y-4">
                      {/* Rug Preview */}
                      <div className="aspect-square bg-black/30 rounded-lg overflow-hidden">
                        {rug.animation_url ? (
                          <iframe
                            src={rug.animation_url}
                            className="w-full h-full"
                            title={`Rug #${rug.tokenId}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50">
                            <div className="text-center">
                              <div className="text-4xl mb-2">🧵</div>
                              <div>Rug #{rug.tokenId}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Rug Info */}
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">
                          Rug #{rug.tokenId}
                        </h3>

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

                        {/* Quick Stats */}
                        <div className="text-xs text-white/60 space-y-1">
                          <div>Minted: {getTimeSinceEvent(rug.traits.mintTime)}</div>
                          {rug.aging.launderingCount > BigInt(0) && (
                            <div>Laundered: {Number(rug.aging.launderingCount)} times</div>
                          )}
                          {rug.aging.lastSalePrice > BigInt(0) && (
                            <div>Last Sale: {formatEther(rug.aging.lastSalePrice)} ETH</div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded text-sm transition-colors duration-200">
                          Manage
                        </button>
                        <button className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-sm transition-colors duration-200">
                          <ExternalLink className="w-4 h-4" />
                        </button>
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
                className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Rug #{selectedRug.tokenId}
                    </h2>
                    <button
                      onClick={() => setSelectedRug(null)}
                      className="text-white/60 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Rug Display */}
                    <div className="space-y-4">
                      <div className="aspect-square bg-black/30 rounded-lg overflow-hidden">
                        {selectedRug.animation_url ? (
                          <iframe
                            src={selectedRug.animation_url}
                            className="w-full h-full"
                            title={`Rug #${selectedRug.tokenId}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50">
                            Rug Preview
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors duration-200">
                          <ExternalLink className="w-4 h-4 inline mr-2" />
                          View on OpenSea
                        </button>
                        <button className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors duration-200">
                          <TrendingUp className="w-4 h-4 inline mr-2" />
                          List for Sale
                        </button>
                      </div>
                    </div>

                    {/* Management Panel */}
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
                            <span className="text-white/70">Laundering Count:</span>
                            <span className="text-white">{Number(selectedRug.aging.launderingCount)}</span>
                          </div>
                          {selectedRug.aging.lastSalePrice > BigInt(0) && (
                            <div className="flex justify-between">
                              <span className="text-white/70">Last Sale Price:</span>
                              <span className="text-white">{formatEther(selectedRug.aging.lastSalePrice)} ETH</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Maintenance */}
                      <RugCleaning tokenId={BigInt(selectedRug.tokenId)} />

                      {/* Marketplace */}
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Marketplace</h3>
                        <RugMarketplace
                          tokenId={selectedRug.tokenId}
                          isOwner={true}
                          currentPrice={selectedRug.aging.lastSalePrice > BigInt(0) ? formatEther(selectedRug.aging.lastSalePrice) : undefined}
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
