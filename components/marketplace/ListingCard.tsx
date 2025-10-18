'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Tag, Gavel, Clock, TrendingUp, Eye } from 'lucide-react'
import LiquidGlass from '../LiquidGlass'
import { formatEth, formatTimeRemaining, getConditionColor, isAuctionActive, isListingExpired } from '@/utils/marketplace-utils'
import { useListingData, useAuctionData } from '@/hooks/use-marketplace-data'

interface ListingCardProps {
  tokenId: number
  nftData: any
  onCardClick: () => void
  isFavorited?: boolean
  onToggleFavorite?: () => void
  viewMode?: 'grid' | 'list'
}

export default function ListingCard({
  tokenId,
  nftData,
  onCardClick,
  isFavorited = false,
  onToggleFavorite,
  viewMode = 'grid'
}: ListingCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // Fetch marketplace data
  const { listing } = useListingData(tokenId)
  const { auction } = useAuctionData(tokenId)

  // Determine status
  const hasActiveListing = listing?.isActive && !isListingExpired(listing)
  const hasActiveAuction = auction?.isActive && isAuctionActive(auction)

  // Get status info
  let statusBadge = null
  let priceDisplay = null

  if (hasActiveListing) {
    statusBadge = (
      <div className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30 flex items-center gap-1">
        <Tag className="w-3 h-3" />
        FOR SALE
      </div>
    )
    priceDisplay = (
      <div>
        <div className="text-xs text-white/60">Price</div>
        <div className="text-lg font-bold text-white">{formatEth(listing.price)} ETH</div>
      </div>
    )
  } else if (hasActiveAuction) {
    statusBadge = (
      <div className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30 flex items-center gap-1">
        <Gavel className="w-3 h-3" />
        AUCTION
      </div>
    )
    priceDisplay = (
      <div>
        <div className="text-xs text-white/60">
          {auction.currentBid > BigInt(0) ? 'Current Bid' : 'Starting Price'}
        </div>
        <div className="text-lg font-bold text-white">
          {formatEth(auction.currentBid > BigInt(0) ? auction.currentBid : auction.startPrice)} ETH
        </div>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.01 }}
        onClick={onCardClick}
        className="cursor-pointer"
      >
        <LiquidGlass
          blurAmount={0.1}
          aberrationIntensity={1.5}
          elasticity={0.08}
          cornerRadius={12}
        >
          <div className="p-4 flex gap-4 items-center">
            {/* NFT Preview - Small */}
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black/30">
              {nftData?.animation_url ? (
                <iframe
                  src={nftData.animation_url}
                  className="w-full h-full"
                  title={`Rug #${tokenId}`}
                  style={{ border: 'none', background: 'transparent' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  <span className="text-xl">🧵</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono text-white/60">#{tokenId}</span>
                {statusBadge}
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Palette:</span>
                  <span className="text-white ml-2">{nftData?.traits?.paletteName || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-white/60">Complexity:</span>
                  <span className="text-white ml-2">{nftData?.traits?.complexity || 0}/5</span>
                </div>
                <div>
                  <span className="text-white/60">Condition:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getConditionColor(nftData?.aging?.dirtLevel || 0, nftData?.aging?.agingLevel || 0)}`}>
                    D{nftData?.aging?.dirtLevel || 0} A{nftData?.aging?.agingLevel || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            {priceDisplay && (
              <div className="text-right">
                {priceDisplay}
                {hasActiveAuction && (
                  <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeRemaining(auction.endTime)}
                  </div>
                )}
              </div>
            )}

            {/* Favorite */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                className={`p-2 rounded transition-colors ${
                  isFavorited
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </LiquidGlass>
      </motion.div>
    )
  }

  // Grid View (default)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      onClick={onCardClick}
      className="cursor-pointer"
    >
      <LiquidGlass
        blurAmount={0.1}
        aberrationIntensity={2}
        elasticity={0.1}
        cornerRadius={12}
        className="overflow-hidden"
      >
        <div className="p-3">
          {/* Header with Token ID and Favorite */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-white/60">#{tokenId}</span>
              {statusBadge}
            </div>
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                className={`p-1 rounded transition-colors ${
                  isFavorited
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          {/* NFT Preview */}
          <div 
            className="bg-transparent rounded-lg overflow-hidden mb-3 relative"
            style={{
              paddingBottom: '69.7%', // 1320:920 aspect ratio
              position: 'relative'
            }}
          >
            <div className="absolute inset-0">
              {nftData?.animation_url ? (
                <iframe
                  src={nftData.animation_url}
                  className="w-full h-full"
                  title={`Rug #${tokenId}`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none'
                  }}
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 bg-black/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl mb-1">🧵</div>
                    <div className="text-xs">#{tokenId}</div>
                  </div>
                </div>
              )}
              
              {!imageLoaded && nftData?.animation_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2">
            {/* Condition Indicators */}
            <div className="flex items-center gap-2 text-xs">
              <div className={`px-2 py-1 rounded ${getConditionColor(nftData?.aging?.dirtLevel || 0, nftData?.aging?.agingLevel || 0)}`}>
                D{nftData?.aging?.dirtLevel || 0} A{nftData?.aging?.agingLevel || 0}
              </div>
              {nftData?.aging?.currentFrameLevel && nftData.aging.currentFrameLevel !== 'None' && (
                <div className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/30">
                  {nftData.aging.currentFrameLevel}
                </div>
              )}
            </div>

            {/* Price/Auction Info */}
            {priceDisplay}
            
            {/* Auction Timer */}
            {hasActiveAuction && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Clock className="w-3 h-3" />
                Ends in {formatTimeRemaining(auction.endTime)}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs text-white/60 pt-2 border-t border-white/10">
              <div>
                <span className="text-white/40">Complexity:</span>
                <span className="text-white ml-1">{nftData?.traits?.complexity || 0}/5</span>
              </div>
              {nftData?.rarityScore && (
                <div>
                  <span className="text-white/40">Rarity:</span>
                  <span className="text-white ml-1">{nftData.rarityScore}</span>
                </div>
              )}
            </div>

            {/* Maintenance Stats (if any) */}
            {(nftData?.aging?.launderingCount > 0 || nftData?.aging?.cleaningCount > 0) && (
              <div className="flex items-center gap-3 text-xs text-white/50 pt-1">
                {nftData.aging.launderingCount > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {Number(nftData.aging.launderingCount)}x laundered
                  </div>
                )}
                {nftData.aging.cleaningCount > 0 && (
                  <div className="flex items-center gap-1">
                    ✨ {Number(nftData.aging.cleaningCount)}x cleaned
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </LiquidGlass>
    </motion.div>
  )
}

/**
 * Skeleton loader for listing cards
 */
export function ListingCardSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <LiquidGlass blurAmount={0.1} aberrationIntensity={1} elasticity={0.05} cornerRadius={12}>
        <div className="p-4 flex gap-4 items-center animate-pulse">
          <div className="w-24 h-24 bg-white/10 rounded-lg"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-white/10 rounded w-1/4"></div>
            <div className="h-3 bg-white/10 rounded w-3/4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
          <div className="w-24 space-y-2">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-6 bg-white/10 rounded"></div>
          </div>
        </div>
      </LiquidGlass>
    )
  }

  return (
    <LiquidGlass blurAmount={0.1} aberrationIntensity={2} elasticity={0.1} cornerRadius={12}>
      <div className="p-3 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-3"></div>
        <div 
          className="bg-white/10 rounded-lg mb-3"
          style={{ paddingBottom: '69.7%' }}
        ></div>
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded w-2/3"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-3 bg-white/10 rounded w-3/4"></div>
        </div>
      </div>
    </LiquidGlass>
  )
}

