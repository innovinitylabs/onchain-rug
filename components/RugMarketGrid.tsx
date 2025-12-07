'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useChainId } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Eye, Heart, ExternalLink, ShoppingCart } from 'lucide-react'
import { RugMarketNFT } from '@/lib/rug-market-types'
import NFTDisplay, { NFTDisplaySkeleton } from './NFTDisplay'
import { rugMarketNFTToNFTData } from '@/utils/rug-market-data-adapter'
import { getExplorerUrl, getContractAddress } from '@/lib/networks'

interface RugMarketGridProps {
  nfts: RugMarketNFT[]
  loading?: boolean
  onNFTClick?: (nft: RugMarketNFT) => void
  onRefreshNFT?: (tokenId: number) => void
  onFavoriteToggle?: (tokenId: number) => void
  onBuyNFT?: (tokenId: number, price: string) => void
}

interface RugCardProps {
  nft: RugMarketNFT
  onClick?: () => void
  onRefresh?: () => void
  onFavoriteToggle?: () => void
  onBuyNFT?: (tokenId: number, price: string) => void
  isFavorited?: boolean
}




function RugCard({ nft, onClick, onRefresh, onFavoriteToggle, onBuyNFT, isFavorited }: RugCardProps) {
  const router = useRouter()
  const chainId = useChainId()

  // Convert RugMarketNFT to NFTData format using adapter for data consistency
  const nftData = rugMarketNFTToNFTData(nft)

  const conditionBadge = useMemo(() => {
    const dirt = nft.dynamic.dirtLevel
    const aging = nft.dynamic.agingLevel

    if (dirt === 0 && aging === 0) {
      return { text: 'Perfect', color: 'bg-green-500/20 text-green-300 border-green-500/30' }
    } else if (dirt <= 1 && aging <= 1) {
      return { text: `D${dirt} A${aging}`, color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' }
    } else {
      return { text: `D${dirt} A${aging}`, color: 'bg-red-500/20 text-red-300 border-red-500/30' }
    }
  }, [nft.dynamic.dirtLevel, nft.dynamic.agingLevel])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300"
    >
      {/* NFT Display Component */}
      <div className="relative cursor-pointer aspect-video bg-black/20 flex items-center justify-center overflow-hidden" onClick={onClick}>
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
          <NFTDisplay
            nftData={nftData}
            size="medium"
            interactive={false}
            className="rounded-none w-full h-full"
          />
        </div>

        {/* Custom Overlay Info */}
        <div className="absolute inset-0 pointer-events-none">
        {/* Top Left - Token ID */}
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-mono pointer-events-auto">
            #{nft.permanent.tokenId}
        </div>

        {/* Bottom Left - Condition */}
          <div className="absolute bottom-2 left-2 pointer-events-auto">
          <span className={`px-2 py-1 rounded border text-xs font-medium ${conditionBadge.color}`}>
            {conditionBadge.text}
          </span>
        </div>

        {/* Bottom Right - Price/Status */}
          {nft.dynamic.isListed && (
            <div className="absolute bottom-2 right-2 bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30 text-xs font-medium pointer-events-auto">
              {nft.dynamic.listingPrice ? `${nft.dynamic.listingPrice} ETH` : 'LISTED'}
          </div>
        )}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold truncate">
            {nft.permanent.name}
          </h3>
          <span className="text-white/60 text-sm">
            {nft.permanent.paletteName}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {nft.dynamic.isListed && nft.dynamic.listingPrice && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBuyNFT?.(nft.permanent.tokenId, nft.dynamic.listingPrice)
              }}
              className="flex-1 flex items-center justify-center gap-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 py-2 px-3 rounded-lg border border-green-500/30 transition-colors text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy Now
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const explorerUrl = getExplorerUrl(chainId)
              const contractAddress = getContractAddress(chainId)
              if (explorerUrl && contractAddress) {
                window.open(`${explorerUrl}/token/${contractAddress}/${nft.permanent.tokenId}`, '_blank')
              }
            }}
            className="p-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg border border-white/20 transition-colors"
            title="View on explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function RugMarketGrid({
  nfts,
  loading = false,
  onNFTClick,
  onRefreshNFT,
  onFavoriteToggle,
  onBuyNFT
}: RugMarketGridProps) {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  const handleFavoriteToggle = (tokenId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(tokenId)) {
        newFavorites.delete(tokenId)
      } else {
        newFavorites.add(tokenId)
      }
      return newFavorites
    })
    onFavoriteToggle?.(tokenId)
  }

  const handleBuyNFT = (tokenId: number, price: string) => {
    onBuyNFT?.(tokenId, price)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="aspect-video bg-black/20 flex items-center justify-center overflow-hidden">
              <img
                src="/rug-loading-mid.webp"
                alt="Loading..."
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
              <div className="h-8 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6">🔍</div>
        <h3 className="text-2xl font-bold text-white mb-4">No rugs found</h3>
        <p className="text-white/70">Try adjusting your filters or check back later.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {nfts.map((nft) => (
            <RugCard
              key={nft.permanent.tokenId}
              nft={nft}
              onClick={() => onNFTClick?.(nft)}
              onRefresh={() => onRefreshNFT?.(nft.permanent.tokenId)}
              onFavoriteToggle={() => handleFavoriteToggle(nft.permanent.tokenId)}
              onBuyNFT={(tokenId, price) => handleBuyNFT(tokenId, price)}
              isFavorited={favorites.has(nft.permanent.tokenId)}
            />
          ))}
        </AnimatePresence>
      {nfts.length === 0 && <div className="col-span-full text-center py-8 text-white">No rugs found</div>}
    </div>
  )
}
