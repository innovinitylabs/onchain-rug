'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Heart,
  Copy,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  ShoppingCart,
  Tag,
  Eye,
  Maximize2,
  Minimize2
} from 'lucide-react'
import type { NFTData } from './NFTDisplay'

interface NFTDetailModalProps {
  nftData: NFTData
  isOpen: boolean
  onClose: () => void
  onFavoriteToggle?: (tokenId: number) => void
  onRefreshData?: (tokenId: number) => void
  onCopyLink?: (tokenId: number) => void
}

export default function NFTDetailModal({
  nftData,
  isOpen,
  onClose,
  onFavoriteToggle,
  onRefreshData,
  onCopyLink
}: NFTDetailModalProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited)
    onFavoriteToggle?.(nftData.tokenId)
  }

  // Handle copy link
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/rug-market/${nftData.tokenId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      onCopyLink?.(nftData.tokenId)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  // Handle refresh data
  const handleRefreshData = () => {
    onRefreshData?.(nftData.tokenId)
  }

  // Format price
  const formatPrice = (price?: string) => {
    if (!price) return null
    const num = parseFloat(price)
    return num >= 1 ? `${num.toFixed(3)} ETH` : `${(num * 1000).toFixed(1)}K WEI`
  }

  // Get condition badge
  const getConditionBadge = () => {
    const traits = nftData?.traits
    const dirt = traits?.dirtLevel || 0
    const aging = traits?.agingLevel || 0

    let condition = 'Excellent'
    let color = 'bg-green-100 text-green-800'

    if (dirt > 0 || aging > 0) {
      condition = `D${dirt} A${aging}`
      color = dirt > 1 || aging > 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
    }

    return { condition, color }
  }

  const { condition, color: conditionColor } = getConditionBadge()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`relative w-full max-w-6xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden ${
            isFullscreen ? 'max-h-screen' : 'max-h-[90vh]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {nftData.name || `OnchainRug #${nftData.tokenId}`}
              </h2>
              <p className="text-gray-600 mt-1">Token ID: {nftData.tokenId}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-gray-600" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-gray-600" />
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className={`flex ${isFullscreen ? 'flex-col h-[calc(100vh-120px)]' : 'flex-col lg:flex-row'} ${!isFullscreen ? 'max-h-[calc(90vh-120px)] overflow-y-auto' : ''}`}>
            {/* Large NFT Preview */}
            <div className={`flex-shrink-0 ${isFullscreen ? 'flex-1 p-6' : 'lg:w-1/2 p-6'}`}>
              <div className="relative bg-gray-50 rounded-xl overflow-hidden">
                <iframe
                  src={nftData.processedPreviewUrl || nftData.animation_url}
                  className="w-full h-full min-h-[400px] lg:min-h-[500px]"
                  title={`Onchain Rug #${nftData.tokenId}`}
                  sandbox="allow-scripts"
                  style={{ border: 'none' }}
                />

                {/* Overlay badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {nftData.isListed && (
                    <div className="bg-green-500 text-white text-sm px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      FOR SALE
                    </div>
                  )}
                  <div className={`text-white text-sm px-3 py-1 rounded-lg font-bold ${conditionColor.replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                    {condition}
                  </div>
                </div>

                {/* Price badge */}
                {nftData.listingPrice && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white text-lg px-4 py-2 rounded-lg font-bold">
                    {formatPrice(nftData.listingPrice)}
                  </div>
                )}
              </div>
            </div>

            {/* Details Panel */}
            {!isFullscreen && (
              <div className="flex-1 p-6 lg:w-1/2 lg:max-h-[600px] overflow-y-auto">
                {/* Description */}
                {nftData.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{nftData.description}</p>
                  </div>
                )}

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Owner</div>
                    <div className="font-mono text-sm text-gray-900 break-all">
                      {nftData.owner.slice(0, 6)}...{nftData.owner.slice(-4)}
                    </div>
                  </div>

                  {nftData.rarityScore && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Rarity Score</div>
                      <div className="text-2xl font-bold text-gray-900">{nftData.rarityScore}</div>
                    </div>
                  )}
                </div>

                {/* Traits Grid */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Traits</h3>
                  {!nftData.traits ? (
                    <div className="text-center py-4 text-gray-500">
                      No trait data available
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                    {nftData.traits?.paletteName && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Palette</div>
                        <div className="text-gray-900 font-medium">{nftData.traits.paletteName}</div>
                      </div>
                    )}

                    {nftData.traits?.textLinesCount !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Text Lines</div>
                        <div className="text-gray-900 font-medium">{Number(nftData.traits.textLinesCount)}</div>
                      </div>
                    )}

                    {nftData.traits?.characterCount !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Characters</div>
                        <div className="text-gray-900 font-medium">{Number(nftData.traits.characterCount)}</div>
                      </div>
                    )}

                    {nftData.traits?.stripeCount !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Stripes</div>
                        <div className="text-gray-900 font-medium">{Number(nftData.traits.stripeCount)}</div>
                      </div>
                    )}

                    {nftData.traits?.warpThickness !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Warp Thickness</div>
                        <div className="text-gray-900 font-medium">{nftData.traits.warpThickness}</div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Dirt Level</div>
                      <div className="text-gray-900 font-medium">{nftData.traits?.dirtLevel || 0}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Aging Level</div>
                      <div className="text-gray-900 font-medium">{nftData.traits?.agingLevel || 0}</div>
                    </div>

                    {nftData.traits?.frameLevel && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Frame</div>
                        <div className="text-gray-900 font-medium">{nftData.traits.frameLevel}</div>
                      </div>
                    )}

                    {nftData.traits?.maintenanceScore !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Maintenance Score</div>
                        <div className="text-gray-900 font-medium">{Number(nftData.traits.maintenanceScore)}</div>
                      </div>
                    )}

                    {nftData.traits?.curator && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Curator</div>
                        <div className="font-mono text-gray-900 font-medium text-sm break-all">
                          {nftData.traits.curator.slice(0, 6)}...{nftData.traits.curator.slice(-4)}
                        </div>
                      </div>
                    )}

                    {nftData.traits?.cleaningCount !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Cleaning Count</div>
                        <div className="text-gray-900 font-medium">{Number(nftData.traits.cleaningCount)}</div>
                      </div>
                    )}

                    {nftData.traits?.restorationCount !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Restoration Count</div>
                        <div className="text-gray-900 font-medium">{Number(nftData.traits.restorationCount)}</div>
                      </div>
                    )}

                    {nftData.traits?.masterRestorationCount !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Master Restoration</div>
                        <div className="text-gray-900 font-medium">{Number(nftData.traits.masterRestorationCount)}</div>
                      </div>
                    )}

                    {nftData.traits?.launderingCount !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Laundering Count</div>
                        <div className="text-gray-900 font-medium">{Number(nftData.traits.launderingCount)}</div>
                      </div>
                    )}

                    {nftData.traits?.lastSalePrice && nftData.traits.lastSalePrice !== '0' && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Last Sale Price</div>
                        <div className="text-gray-900 font-medium">{nftData.traits.lastSalePrice} ETH</div>
                      </div>
                    )}

                    {nftData.traits?.lastCleaned && nftData.traits.lastCleaned > BigInt(0) && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Last Cleaned</div>
                        <div className="text-gray-900 font-medium text-sm">
                          {new Date(Number(nftData.traits.lastCleaned) * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {nftData.isListed ? (
                    <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Buy Now - {formatPrice(nftData.listingPrice)}
                    </button>
                  ) : (
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                      <Tag className="w-5 h-5" />
                      List for Sale
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleFavoriteToggle}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        isFavorited
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                      {isFavorited ? 'Favorited' : 'Add to Favorites'}
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {copySuccess ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copySuccess ? 'Copied!' : 'Copy Link'}
                    </button>

                    {onRefreshData && (
                      <button
                        onClick={handleRefreshData}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        title="Refresh data from blockchain"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Explorer Link */}
                  <a
                    href={`https://sepolia.basescan.org/token/${nftData.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
