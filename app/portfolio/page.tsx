'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useChainId } from 'wagmi'
import { 
  Palette, 
  Grid, 
  Tag, 
  Gift, 
  Archive,
  Eye,
  Heart,
  Sparkles,
  X
} from 'lucide-react'
import { contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LoadingAnimation from '@/components/LoadingAnimation'
import LiquidGlass from '@/components/LiquidGlass'
import ListingCard from '@/components/marketplace/ListingCard'
import NFTDetailModal from '@/components/marketplace/NFTDetailModal'
// Marketplace hooks removed - simplified marketplace
import { useCancelListing } from '@/hooks/use-marketplace-contract'
import { formatEth } from '@/utils/marketplace-utils'

type TabType = 'collection' | 'showcased' | 'offers-received' | 'offers-made' | 'history'

export default function PortfolioPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [activeTab, setActiveTab] = useState<TabType>('collection')
  const [nfts, setNfts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [selectedNFTs, setSelectedNFTs] = useState<Set<number>>(new Set())

  const contractAddress = contractAddresses[chainId] // No fallback for safety

  // Fetch user's NFTs
  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (!address || !contractAddress) return

      try {
        setLoading(true)
        
        const response = await fetch(
          `/api/alchemy?endpoint=getNFTsForOwner&owner=${address}&contractAddresses[]=${contractAddress}`
        )

        if (!response.ok) throw new Error('Failed to fetch NFTs')

        const data = await response.json()
        console.log('Portfolio API response:', data)
        
        const processedNfts: any[] = []
        const ownedNfts = data.ownedNfts || []
        
        console.log('Found', ownedNfts.length, 'NFTs for address:', address)

        for (const nft of ownedNfts) {
          // Handle different response formats
          const tokenId = nft.tokenId || nft.id?.tokenId || nft.token?.tokenId
          
          if (!tokenId) {
            console.warn('No tokenId found in NFT:', nft)
            continue
          }
          
          try {
            
            const metadataResponse = await fetch(
              `/api/alchemy?endpoint=getNFTMetadata&contractAddress=${contractAddress}&tokenId=${tokenId}`
            )

            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json()
              const attributes = metadata.raw?.metadata?.attributes || metadata.attributes || []
              
              // Verify ownership with contract call
              let verifiedOwner = address;
              try {
                const response = await fetch(`/api/contract?method=ownerOf&tokenId=${tokenId}&contractAddress=${contractAddress}`);
                if (response.ok) {
                  const ownerData = await response.json();
                  verifiedOwner = ownerData.owner;
                }
              } catch (error) {
                console.warn(`Failed to verify owner for token ${tokenId}:`, error);
              }

              processedNfts.push({
                tokenId: parseInt(tokenId),
                traits: metadata.rugData || {},
                aging: parseAgingData(attributes),
                owner: verifiedOwner,
                name: metadata.name,
                description: metadata.description,
                animation_url: metadata.animation_url || metadata.raw?.metadata?.animation_url,
                rarityScore: calculateRarity(metadata.rugData)
              })
            }
          } catch (error) {
            console.warn(`Failed to fetch metadata for token ${tokenId}`, error)
          }
        }

        console.log('Portfolio: Successfully loaded', processedNfts.length, 'NFTs')
        setNfts(processedNfts)
      } catch (error) {
        console.error('Failed to fetch user NFTs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserNFTs()
  }, [address, contractAddress])

  const parseAgingData = (attributes: any[]) => {
    const getValue = (trait: string) => attributes.find((a: any) => a.trait_type === trait)?.value || 0
    return {
      dirtLevel: parseInt(getValue('Dirt Level') || '0'),
      agingLevel: parseInt(getValue('Aging Level') || '0'),
      currentFrameLevel: getValue('Frame Level') || 'None',
      launderingCount: BigInt(getValue('Laundering Count') || '0'),
      cleaningCount: BigInt(getValue('Cleaning Count') || '0'),
      restorationCount: BigInt(getValue('Restoration Count') || '0'),
      recentSalePrices: [BigInt(0), BigInt(0), BigInt(0)]
    }
  }

  const calculateRarity = (traits: any): number => {
    if (!traits) return 0
    let score = 0
    score += traits.complexity || 0
    score += traits.characterCount ? Number(traits.characterCount) / 10 : 0
    score += traits.textRows?.length * 2 || 0
    return Math.round(score)
  }

  const toggleNFTSelection = (tokenId: number) => {
    setSelectedNFTs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId)
      } else {
        newSet.add(tokenId)
      }
      return newSet
    })
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Navigation />
        <main className="flex-grow flex items-center justify-center">
          <LiquidGlass
            blurAmount={0.15}
            aberrationIntensity={2}
            elasticity={0.1}
            cornerRadius={16}
            className="p-12 max-w-md mx-4"
          >
            <div className="text-center">
              <Palette className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-white/70">
                Connect your wallet to view and manage your rug collection
              </p>
            </div>
          </LiquidGlass>
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
            <LoadingAnimation message="Loading your collection..." size="lg" />
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
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Palette className="w-8 h-8 text-purple-400" />
              <h1 className="text-4xl font-bold text-white">Your Collection</h1>
            </div>
            <p className="text-white/70">
              Manage your personal gallery of OnchainRugs
            </p>

            {/* Collection Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <LiquidGlass blurAmount={0.08} aberrationIntensity={1} elasticity={0.05} cornerRadius={12}>
                <div className="p-4 text-center">
                  <div className="text-3xl font-bold text-white">{nfts.length}</div>
                  <div className="text-sm text-white/60">Pieces Owned</div>
                </div>
              </LiquidGlass>
              <LiquidGlass blurAmount={0.08} aberrationIntensity={1} elasticity={0.05} cornerRadius={12}>
                <div className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {nfts.filter(n => n.aging.currentFrameLevel !== 'None').length}
                  </div>
                  <div className="text-sm text-white/60">With Frames</div>
                </div>
              </LiquidGlass>
              <LiquidGlass blurAmount={0.08} aberrationIntensity={1} elasticity={0.05} cornerRadius={12}>
                <div className="p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-400">
                    {nfts.filter(n => n.aging.dirtLevel === 0 && n.aging.agingLevel === 0).length}
                  </div>
                  <div className="text-sm text-white/60">Pristine</div>
                </div>
              </LiquidGlass>
              <LiquidGlass blurAmount={0.08} aberrationIntensity={1} elasticity={0.05} cornerRadius={12}>
                <div className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {nfts.reduce((sum, n) => sum + Number(n.aging.launderingCount), 0)}
                  </div>
                  <div className="text-sm text-white/60">Total Launderings</div>
                </div>
              </LiquidGlass>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="mb-6">
            <LiquidGlass
              blurAmount={0.1}
              aberrationIntensity={1}
              elasticity={0.05}
              cornerRadius={12}
              className="p-2"
            >
              <div className="flex flex-wrap gap-2">
                <TabButton
                  active={activeTab === 'collection'}
                  onClick={() => setActiveTab('collection')}
                  icon={<Grid className="w-4 h-4" />}
                  label="Your Gallery"
                  count={nfts.length}
                />
                <TabButton
                  active={activeTab === 'showcased'}
                  onClick={() => setActiveTab('showcased')}
                  icon={<Eye className="w-4 h-4" />}
                  label="Showcased for Sale"
                  count={0} // Would be actual count from listings
                />
                <TabButton
                  active={activeTab === 'offers-received'}
                  onClick={() => setActiveTab('offers-received')}
                  icon={<Gift className="w-4 h-4" />}
                  label="Interest Received"
                  count={0} // Actual offers count
                />
                <TabButton
                  active={activeTab === 'offers-made'}
                  onClick={() => setActiveTab('offers-made')}
                  icon={<Heart className="w-4 h-4" />}
                  label="Interest Expressed"
                  count={0}
                />
                <TabButton
                  active={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
                  icon={<Archive className="w-4 h-4" />}
                  label="Collection History"
                  count={0}
                />
              </div>
            </LiquidGlass>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'collection' && (
              <motion.div
                key="collection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {nfts.length === 0 ? (
                  <EmptyState
                    icon={<Palette className="w-16 h-16" />}
                    title="Your gallery is empty"
                    description="Mint your first OnchainRug to start your collection"
                  />
                ) : (
                  <>
                    {/* Bulk Actions */}
                    {selectedNFTs.size > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4"
                      >
                        <LiquidGlass
                          blurAmount={0.1}
                          aberrationIntensity={1}
                          elasticity={0.05}
                          cornerRadius={12}
                          className="p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white">
                              {selectedNFTs.size} piece{selectedNFTs.size > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {/* Bulk showcase */}}
                                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                              >
                                Showcase Selected
                              </button>
                              <button
                                onClick={() => setSelectedNFTs(new Set())}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                              >
                                Clear Selection
                              </button>
                            </div>
                          </div>
                        </LiquidGlass>
                      </motion.div>
                    )}

                    {/* NFT Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {nfts.map((nft) => (
                        <div key={nft.tokenId} className="relative">
                          {/* Selection Checkbox */}
                          <div className="absolute top-2 left-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleNFTSelection(nft.tokenId)
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                selectedNFTs.has(nft.tokenId)
                                  ? 'bg-blue-500/30 text-blue-300'
                                  : 'bg-black/50 text-white/60 hover:bg-black/70'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedNFTs.has(nft.tokenId)}
                                onChange={() => {}}
                                className="pointer-events-none"
                              />
                            </button>
                          </div>

                          <ListingCard
                            tokenId={nft.tokenId}
                            nftData={nft}
                            onCardClick={() => setSelectedNFT(nft)}
                            viewMode="grid"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'showcased' && (
              <motion.div
                key="showcased"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ShowcasedTab nfts={nfts} onSelectNFT={setSelectedNFT} />
              </motion.div>
            )}

            {activeTab === 'offers-received' && (
              <motion.div
                key="offers-received"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <OffersReceivedTab address={address} onSelectNFT={setSelectedNFT} />
              </motion.div>
            )}

            {activeTab === 'offers-made' && (
              <motion.div
                key="offers-made"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <OffersMadeTab address={address} />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CollectionHistoryTab address={address} />
              </motion.div>
            )}
          </AnimatePresence>
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

// Tab Button Component
function TabButton({ active, onClick, icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        active
          ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {count > 0 && (
        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
          {count}
        </span>
      )}
    </button>
  )
}

// Empty State Component
function EmptyState({ icon, title, description }: any) {
  return (
    <div className="text-center py-20">
      <div className="text-white/30 mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/60">{description}</p>
    </div>
  )
}

// Showcased Tab (pieces for sale)
function ShowcasedTab({ nfts, onSelectNFT }: any) {
  // Simplified - no active listings in simplified marketplace
  const listings = []
  const { cancelListing, isPending } = useCancelListing()

  const listedNFTs = nfts.filter((nft: any) =>
    listings.some((l: any) => l.tokenId === nft.tokenId && l.isActive)
  )

  if (listedNFTs.length === 0) {
    return (
      <EmptyState
        icon={<Eye className="w-16 h-16" />}
        title="No pieces showcased"
        description="Select pieces from your gallery to showcase them for collectors"
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listedNFTs.map((nft: any) => {
        const listing = listings.find((l: any) => l.tokenId === nft.tokenId)
        
        return (
          <div key={nft.tokenId}>
            <ListingCard
              tokenId={nft.tokenId}
              nftData={nft}
              onCardClick={() => onSelectNFT(nft)}
              viewMode="grid"
            />
            <motion.div className="mt-2">
              <LiquidGlass
                blurAmount={0.08}
                aberrationIntensity={1}
                elasticity={0.05}
                cornerRadius={8}
                className="p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/60">Showcased at</div>
                    <div className="text-white font-mono">{listing ? formatEth(listing.price) : '0'} ETH</div>
                  </div>
                  <button
                    onClick={() => cancelListing(nft.tokenId)}
                    disabled={isPending}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </LiquidGlass>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

// Offers Received Tab
function OffersReceivedTab({ address, onSelectNFT }: any) {
  // Simplified marketplace - no offers functionality
  const offers = []
  const isLoading = false

  if (isLoading) {
    return <LoadingAnimation message="Loading interest received..." />
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={<Gift className="w-16 h-16" />}
        title="No interest received yet"
        description="When collectors express interest in your pieces, they'll appear here"
      />
    )
  }

  return (
    <div className="space-y-4">
      {offers.map((offer: any) => (
        <LiquidGlass
          key={offer.id}
          blurAmount={0.1}
          aberrationIntensity={1}
          elasticity={0.05}
          cornerRadius={12}
          className="p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white/60">Rug #{offer.tokenId}</div>
              <div>
                <div className="text-sm text-white/60">Collector offers</div>
                <div className="text-xl font-bold text-white">{formatEth(offer.price)} ETH</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors">
                Accept
              </button>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                Decline
              </button>
            </div>
          </div>
        </LiquidGlass>
      ))}
    </div>
  )
}

// Offers Made Tab
function OffersMadeTab({ address }: any) {
  // Simplified marketplace - no offers functionality
  const offers = []
  const isLoading = false

  if (isLoading) {
    return <LoadingAnimation message="Loading your expressed interest..." />
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="w-16 h-16" />}
        title="No interest expressed"
        description="Express interest in pieces you'd like to add to your collection"
      />
    )
  }

  return (
    <div className="space-y-4">
      {offers.map((offer: any) => (
        <LiquidGlass
          key={offer.id}
          blurAmount={0.1}
          aberrationIntensity={1}
          elasticity={0.05}
          cornerRadius={12}
          className="p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-white/60">Rug #{offer.tokenId}</div>
              <div>
                <div className="text-sm text-white/60">Your offer</div>
                <div className="text-xl font-bold text-white">{formatEth(offer.price)} ETH</div>
              </div>
              <div className="text-sm text-white/50">
                {offer.expiresAt > 0 ? `Expires in ${Math.floor((offer.expiresAt - Date.now() / 1000) / 86400)}d` : 'No expiration'}
              </div>
            </div>
            <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors">
              Withdraw
            </button>
          </div>
        </LiquidGlass>
      ))}
    </div>
  )
}

// Collection History Tab
function CollectionHistoryTab({ address }: any) {
  return (
    <EmptyState
      icon={<Archive className="w-16 h-16" />}
      title="Collection history"
      description="Your acquisition and exchange history will appear here"
    />
  )
}

