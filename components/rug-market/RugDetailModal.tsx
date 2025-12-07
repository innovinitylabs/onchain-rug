'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, ExternalLink, Calendar, User, TrendingUp, ShoppingCart, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RugMarketNFT } from '@/lib/rug-market-types'
import NFTDisplay from '@/components/NFTDisplay'
import { rugMarketNFTToNFTData } from '@/utils/rug-market-data-adapter'

interface RugDetailModalProps {
  nft: RugMarketNFT
  isOpen: boolean
  onClose: () => void
  onBuyNFT?: (tokenId: number, price: string) => void
  onRefreshNFT?: (tokenId: number) => void
}

export default function RugDetailModal({
  nft,
  isOpen,
  onClose,
  onBuyNFT,
  onRefreshNFT
}: RugDetailModalProps) {
  const router = useRouter()
  const { permanent, dynamic } = nft

  const formatAddress = (address: string) => {
    if (!address) return 'N/A'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: bigint | number | string) => {
    const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : Number(timestamp)
    if (isNaN(numTimestamp) || numTimestamp === 0) return 'N/A'
    return new Date(numTimestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price?: string) => {
    if (!price) return null
    const num = parseFloat(price)
    return num >= 1 ? `${num.toFixed(3)} ETH` : `${(num * 1000).toFixed(1)}K WEI`
  }

  const getConditionBadge = () => {
    const dirt = dynamic.dirtLevel || 0
    const aging = dynamic.agingLevel || 0

    if (dirt === 0 && aging === 0) {
      return { text: 'Excellent', color: 'bg-green-500/20 text-green-300 border-green-500/30' }
    }

    const condition = `D${dirt} A${aging}`
    if (dirt > 1 || aging > 1) {
      return { text: condition, color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' }
    }
    return { text: condition, color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' }
  }

  const conditionBadge = getConditionBadge()

  // Convert RugMarketNFT to NFTData for NFTDisplay
  const nftDataForDisplay = rugMarketNFTToNFTData(nft)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {permanent.name || `OnchainRug #${permanent.tokenId}`}
              </h2>
              <p className="text-white/60 mt-1">Token ID: #{permanent.tokenId}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/rug-market/${permanent.tokenId}`)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Open in new page"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - NFT Display */}
              <div className="space-y-4">
                <div className="relative bg-black/30 rounded-xl overflow-hidden">
                  <NFTDisplay
                    nftData={nftDataForDisplay}
                    size="large"
                    interactive={false}
                    className="rounded-xl"
                  />
                  
                  {/* Overlay badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-lg border text-sm font-medium ${conditionBadge.color}`}>
                      {conditionBadge.text}
                    </span>
                    {dynamic.isListed && (
                      <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 text-sm font-medium flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        FOR SALE
                      </span>
                    )}
                  </div>

                  {/* Price badge */}
                  {dynamic.isListed && dynamic.listingPrice && (
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white text-lg px-4 py-2 rounded-lg font-bold">
                      {formatPrice(dynamic.listingPrice)}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Description */}
                {permanent.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-white/70 leading-relaxed">{permanent.description}</p>
                  </div>
                )}

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-sm text-white/60 mb-1">Owner</div>
                    <div className="font-mono text-sm text-white break-all flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {formatAddress(dynamic.currentOwner)}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-sm text-white/60 mb-1">Minted</div>
                    <div className="text-sm text-white flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(permanent.mintTime)}
                    </div>
                  </div>

                  {dynamic.lastSalePrice && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-sm text-white/60 mb-1">Last Sale</div>
                      <div className="text-sm text-white flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {formatPrice(dynamic.lastSalePrice)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Traits */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Traits</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Palette</div>
                      <div className="text-white font-medium">{permanent.paletteName}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Warp Thickness</div>
                      <div className="text-white font-medium">{permanent.warpThickness}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Text Lines</div>
                      <div className="text-white font-medium">{permanent.textRows?.length || 0}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Characters</div>
                      <div className="text-white font-medium">{Number(permanent.characterCount || 0)}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Stripes</div>
                      <div className="text-white font-medium">{Number(permanent.stripeCount || 0)}</div>
                    </div>

                    {dynamic.frameLevel && dynamic.frameLevel !== 'None' && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Frame</div>
                        <div className="text-white font-medium">{dynamic.frameLevel}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Text Content */}
                {permanent.textRows && permanent.textRows.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Text</h3>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="text-white font-mono text-center">
                        {permanent.textRows.map((row, idx) => (
                          <div key={idx}>{row}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  {dynamic.isListed && dynamic.listingPrice && onBuyNFT && (
                    <button
                      onClick={() => onBuyNFT(permanent.tokenId, dynamic.listingPrice!)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Buy Now {formatPrice(dynamic.listingPrice)}
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/rug-market/${permanent.tokenId}`)}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                    View Full Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

