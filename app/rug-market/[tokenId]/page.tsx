'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LoadingAnimation from '@/components/LoadingAnimation'
import {
  ArrowLeft,
  RefreshCw,
  Heart,
  Share2,
  ExternalLink,
  ShoppingCart,
  Tag,
  TrendingUp,
  History,
  Wrench,
  Calendar,
  User,
  DollarSign
} from 'lucide-react'
import { RugMarketNFT } from '@/lib/rug-market-types'
import { getCalculatedLevels } from '@/utils/rug-market-data-adapter'
import { config } from '@/lib/config'
import Head from 'next/head'

export default function NFTDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [nft, setNft] = useState<RugMarketNFT | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  const tokenId = parseInt(params.tokenId as string)

  useEffect(() => {
    if (!tokenId || isNaN(tokenId)) {
      router.push('/rug-market')
      return
    }

    fetchNFTData()
  }, [tokenId])

  const fetchNFTData = async () => {
    try {
      setLoading(true)

      // Fetch from our Redis API
      const response = await fetch(`/api/rug-market/nft/${tokenId}?chainId=${config.chainId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch NFT: ${response.status}`)
      }
      const { data: nft } = await response.json()

      if (!nft) {
        throw new Error('NFT not found')
      }

      setNft(nft)
    } catch (error) {
      console.error('Failed to fetch NFT data:', error)
      setNft(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      // TODO: Call refresh API
      // await fetch(`/api/rug-market/nft/${tokenId}/refresh`, { method: 'POST' })
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      await fetchNFTData()
    } catch (error) {
      console.error('Failed to refresh NFT:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited)
    // TODO: Implement favorite functionality
  }

  const handleBuy = () => {
    // TODO: Implement buy functionality
    console.log('Buy NFT:', tokenId)
  }

  const handleList = () => {
    // TODO: Implement list functionality
    console.log('List NFT:', tokenId)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: bigint) => {
    // Convert bigint to number
    const numTimestamp = Number(timestamp)
    
    // Check for invalid values
    if (isNaN(numTimestamp) || numTimestamp === 0) return 'N/A'
    
    // Check if timestamp looks like it's already in milliseconds (very large number)
    // Unix timestamps in seconds are typically < 10^10, milliseconds are > 10^12
    const isLikelyMilliseconds = numTimestamp > 10000000000
    
    // Convert: if it's already in milliseconds, use as-is; otherwise multiply by 1000
    const milliseconds = isLikelyMilliseconds ? numTimestamp : numTimestamp * 1000
    
    // Additional validation: dates before 1970-01-01 or after 2100 are likely errors
    const date = new Date(milliseconds)
    if (date.getFullYear() < 1970 || date.getFullYear() > 2100) {
      console.warn('[formatDate] Suspicious date:', date, 'from timestamp:', timestamp, 'milliseconds:', milliseconds)
      return 'Invalid Date'
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Navigation />
        <main className="flex-grow pt-28">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <LoadingAnimation message="Loading NFT details..." size="lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Navigation />
        <main className="flex-grow pt-28">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <div className="text-6xl mb-6">🔍</div>
              <h2 className="text-2xl font-bold text-white mb-4">NFT Not Found</h2>
              <p className="text-white/70 mb-8">The requested NFT could not be found.</p>
              <button
                onClick={() => router.push('/rug-market')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Market
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { permanent, dynamic } = nft

  // Generate dynamic SEO metadata
  const seoTitle = `${permanent.name} - Onchain Rug #${permanent.tokenId} | Living NFT Art`
  const seoDescription = `View Onchain Rug #${permanent.tokenId} - ${permanent.paletteName} palette with ${permanent.textRows?.length || 0} text lines. Dirt Level: ${getCalculatedLevels(dynamic).dirtLevel}, Frame: ${dynamic.frameLevel}. Living generative art on Shape L2 blockchain.`
  const seoImage = permanent.image || 'https://onchainrugs.xyz/rug-preview.jpg'
  const seoUrl = `https://onchainrugs.xyz/rug-market/${permanent.tokenId}`

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={seoUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={seoImage} />
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="800" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={seoImage} />
        <link rel="canonical" href={seoUrl} />

        {/* NFT-specific structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VisualArtwork",
              "name": permanent.name,
              "description": permanent.description,
              "creator": {
                "@type": "Person",
                "name": "valipokkann"
              },
              "dateCreated": new Date(Number(permanent.mintTime) * 1000).toISOString().split('T')[0],
              "artMedium": "Digital (HTML5 Canvas, P5.js)",
              "artform": "Generative Textile Art",
              "material": "On-chain generated, Shape L2 blockchain",
              "width": "800px",
              "height": "1200px",
              "image": seoImage,
              "url": seoUrl,
              "sameAs": seoUrl,
              "additionalProperty": [
                {
                  "@type": "PropertyValue",
                  "name": "Token ID",
                  "value": permanent.tokenId.toString()
                },
                {
                  "@type": "PropertyValue",
                  "name": "Blockchain",
                  "value": "Shape L2"
                },
                {
                  "@type": "PropertyValue",
                  "name": "Contract Standard",
                  "value": "ERC-721"
                },
                {
                  "@type": "PropertyValue",
                  "name": "Palette",
                  "value": permanent.paletteName
                },
                {
                  "@type": "PropertyValue",
                  "name": "Text Lines",
                  "value": permanent.textRows?.length.toString() || "0"
                },
                {
                  "@type": "PropertyValue",
                  "name": "Current Frame",
                  "value": dynamic.frameLevel
                }
              ],
              "offers": dynamic.isListed ? {
                "@type": "Offer",
                "price": dynamic.listingPrice,
                "priceCurrency": "ETH",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Person",
                  "name": "OnchainRugs Collector"
                }
              } : undefined
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation />

      <main className="pb-20 pt-28">
        {/* Header */}
        <div className="border-b border-white/10">
          <div className="container mx-auto px-4 py-6">
            <button
              onClick={() => router.push('/rug-market')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Market
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{permanent.name}</h1>
                <p className="text-white/70">Token ID: #{permanent.tokenId}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFavoriteToggle}
                  className={`p-3 rounded-lg border transition-colors ${
                    isFavorited
                      ? 'bg-red-500/20 border-red-500/30 text-red-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>

                <button className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>

                <a
                  href="#" // TODO: Add explorer link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* NFT Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  {/* TODO: Replace with actual trait-based preview */}
                  <div className="text-center text-white/50">
                    <div className="text-6xl mb-4">🎨</div>
                    <div className="text-xl font-medium">Rug Preview</div>
                    <div className="text-sm mt-2">Trait-based generation</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="text-white/60 text-sm mb-1">Condition</div>
                  <div className="text-white font-medium">
                    {(() => {
                      const { dirtLevel, agingLevel } = getCalculatedLevels(dynamic)
                      return `D${dirtLevel} A${agingLevel}`
                    })()}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="text-white/60 text-sm mb-1">Frame</div>
                  <div className="text-white font-medium">{dynamic.frameLevel}</div>
                </div>
              </div>
            </motion.div>

            {/* Details & Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Price & Actions */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                {dynamic.isListed ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white/60 text-sm">Current Price</div>
                        <div className="text-2xl font-bold text-white">{dynamic.listingPrice} ETH</div>
                      </div>
                      <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                        Listed
                      </div>
                    </div>

                    <button
                      onClick={handleBuy}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Buy Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="text-white/60 text-sm mb-2">Not Listed</div>
                      <div className="text-white/50">This rug is not currently for sale</div>
                    </div>

                    <button
                      onClick={handleList}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Tag className="w-5 h-5" />
                      List for Sale
                    </button>
                  </div>
                )}
              </div>

              {/* Traits */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Traits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/60 text-sm">Palette</div>
                    <div className="text-white font-medium">{permanent.paletteName}</div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/60 text-sm">Warp Thickness</div>
                    <div className="text-white font-medium">{permanent.warpThickness}</div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/60 text-sm">Text Lines</div>
                    <div className="text-white font-medium">{permanent.textRows.length}</div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/60 text-sm">Maintenance Score</div>
                    <div className="text-white font-medium">{dynamic.maintenanceScore.toString()}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Description</h3>
                <p className="text-white/80 leading-relaxed">{permanent.description}</p>
              </div>

              {/* Ownership & History */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Ownership
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="text-white/60 text-sm mb-1">Current Owner</div>
                    <div className="font-mono text-white bg-black/30 px-3 py-2 rounded">
                      {formatAddress(dynamic.currentOwner)}
                    </div>
                  </div>

                  <div>
                    <div className="text-white/60 text-sm mb-2">Ownership History</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {dynamic.ownershipHistory.map((record, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/5 rounded p-2">
                          <div>
                            <div className="text-white text-sm font-mono">
                              {formatAddress(record.owner)}
                            </div>
                            <div className="text-white/60 text-xs">
                              {record.acquiredVia} • {formatDate(record.acquiredAt)}
                            </div>
                          </div>
                          {record.price && (
                            <div className="text-green-400 font-medium">
                              {record.price} ETH
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sale History */}
              {dynamic.saleHistory.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Sale History
                  </h3>

                  <div className="space-y-2">
                    {dynamic.saleHistory.map((sale, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 rounded p-3">
                        <div>
                          <div className="text-white font-medium">{sale.price} ETH</div>
                          <div className="text-white/60 text-sm">{formatDate(sale.timestamp)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/60 text-sm">From</div>
                          <div className="text-white text-sm font-mono">
                            {formatAddress(sale.from)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </>
  )
}
