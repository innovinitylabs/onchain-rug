'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChainId, useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Eye, Heart, ExternalLink, ShoppingCart, HandCoins, Tag, X, Handshake, Share2 } from 'lucide-react'
import { useTokenOffers, useOfferData } from '@/hooks/use-marketplace-contract'
import { RugMarketNFT } from '@/lib/rug-market-types'
import NFTDisplay, { NFTDisplaySkeleton } from './NFTDisplay'
import { rugMarketNFTToNFTData, getCalculatedLevels } from '@/utils/rug-market-data-adapter'
import { getExplorerUrl, getContractAddress } from '@/lib/networks'
import { formatEth } from '@/utils/marketplace-utils'
import { SocialShareModal } from '@/components/SocialShareModal'

interface RugMarketGridProps {
  nfts: RugMarketNFT[]
  loading?: boolean
  onNFTClick?: (nft: RugMarketNFT) => void
  onRefreshNFT?: (tokenId: number) => void
  onFavoriteToggle?: (tokenId: number) => void
  onBuyNFT?: (tokenId: number, price: string) => void
  onMakeOffer?: (tokenId: number) => void
  onCancelListing?: (tokenId: number) => void
  onCancelOffer?: (offerId: number) => void
  sortKey?: string // Key to force remount when sort changes
}

interface RugCardProps {
  nft: RugMarketNFT
  onClick?: () => void
  onRefresh?: () => void
  onFavoriteToggle?: () => void
  onBuyNFT?: (tokenId: number, price: string) => void
  onMakeOffer?: (tokenId: number) => void
  onCancelListing?: (tokenId: number) => void
  onCancelOffer?: (offerId: number) => void
  isFavorited?: boolean
}




function RugCard({ nft, onClick, onRefresh, onFavoriteToggle, onBuyNFT, onMakeOffer, onCancelListing, onCancelOffer, isFavorited }: RugCardProps) {
  const router = useRouter()
  const chainId = useChainId()
  const { address } = useAccount()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareImageUrl, setShareImageUrl] = useState<string | undefined>()
  const nftDisplayRef = useRef<HTMLDivElement>(null)
  
  // Check if user owns this NFT
  const isOwner = address && nft.dynamic.currentOwner && 
    address.toLowerCase() === nft.dynamic.currentOwner.toLowerCase()
  
  // Check for user's active offer
  const { offerIds } = useTokenOffers(nft.permanent.tokenId)

  // Convert RugMarketNFT to NFTData format using adapter for data consistency
  const nftData = rugMarketNFTToNFTData(nft)
  
  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  const conditionBadge = useMemo(() => {
    // Use calculated values from helper function
    const { dirtLevel: dirt, agingLevel: aging } = getCalculatedLevels(nft.dynamic)

    if (dirt === 0 && aging === 0) {
      return { text: 'Perfect', color: 'bg-green-600/90 text-white border-green-400' }
    } else if (dirt <= 1 && aging <= 1) {
      return { text: `D${dirt} A${aging}`, color: 'bg-yellow-600/90 text-white border-yellow-400' }
    } else {
      return { text: `D${dirt} A${aging}`, color: 'bg-red-600/90 text-white border-red-400' }
    }
  }, [nftData.traits?.dirtLevel, nftData.traits?.agingLevel, nft.dynamic])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300"
    >
      {/* NFT Display Component */}
      <div 
        className="relative cursor-pointer bg-black/20" 
        onClick={onClick} 
        style={{ 
          overflow: 'hidden', 
          position: 'relative', 
          aspectRatio: '4/3',
          backgroundImage: 'url(/rug-loading-mid.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div 
          ref={nftDisplayRef}
          className="absolute inset-0 w-full h-full" 
          style={{ overflow: 'hidden' }}
          onClick={onClick}
        >
        <NFTDisplay
          nftData={nftData}
          size="medium"
          interactive={false}
            className="rounded-none w-full h-full cursor-pointer"
            onClick={onClick}
        />
        </div>

        {/* Custom Overlay Info - Visible on hover */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Top Left - Token ID */}
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded text-sm font-mono pointer-events-auto shadow-lg">
            #{nft.permanent.tokenId}
          </div>
          
          {/* Top Right - Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
            <button
              onClick={async (e) => {
                e.stopPropagation()
                // Try to capture the rendered NFT as an image
                let capturedImage: string | null = null
                
                // First, try to capture from the rendered canvas
                if (nftDisplayRef.current) {
                  const canvas = nftDisplayRef.current.querySelector('canvas') as HTMLCanvasElement
                  if (canvas) {
                    try {
                      capturedImage = canvas.toDataURL('image/png')
                    } catch (error) {
                      console.warn('Failed to capture canvas:', error)
                    }
                  }
                }
                
                // Fallback: fetch animation_url from API
                if (!capturedImage) {
                  try {
                    const response = await fetch(`/api/rug-image/${nft.permanent.tokenId}?chainId=${chainId}`)
                    if (response.ok) {
                      const data = await response.json()
                      // Use animation_url which contains the rendered HTML NFT
                      capturedImage = data.animationUrl || data.shareImageUrl || null
                    }
                  } catch (error) {
                    console.error('Failed to fetch share image:', error)
                  }
                }
                
                setShareImageUrl(capturedImage || undefined)
                setShowShareModal(true)
              }}
              className="p-2 bg-black/80 backdrop-blur-sm text-white rounded hover:bg-black/90 transition-colors shadow-lg"
              title="Share this rug"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-black/80 backdrop-blur-sm text-white rounded hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="Refresh NFT data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

        {/* Bottom Left - Condition */}
          <div className="absolute bottom-2 left-2 pointer-events-auto">
          <span className={`px-2 py-1 rounded border backdrop-blur-sm text-xs font-semibold shadow-lg ${conditionBadge.color}`}>
            {conditionBadge.text}
          </span>
        </div>

        {/* Bottom Right - Price/Status */}
          {nft.dynamic.isListed && (
            <div className="absolute bottom-2 right-2 bg-green-600/90 backdrop-blur-sm text-white px-2 py-1 rounded border border-green-400 text-xs font-semibold pointer-events-auto shadow-lg">
              {nft.dynamic.listingPrice ? (() => {
                try {
                  // listingPrice is stored as string in wei format, convert to ETH
                  const priceWei = BigInt(nft.dynamic.listingPrice)
                  return `${formatEth(priceWei)} ETH`
                } catch (error) {
                  console.error('Failed to format listing price:', error)
                  return 'LISTED'
                }
              })() : 'LISTED'}
          </div>
        )}
        {/* Bottom Right - Highest Offer (if not listed) */}
          {!nft.dynamic.isListed && offerIds && offerIds.length > 0 && (
            <HighestOfferDisplay offerIds={offerIds} />
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={onClick}
        >
          <h3 className="text-white font-semibold truncate">
            {nft.permanent.name}
          </h3>
          <span className="text-white/60 text-sm">
            {nft.permanent.paletteName}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {nft.dynamic.isListed && nft.dynamic.listingPrice && !isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBuyNFT?.(nft.permanent.tokenId, nft.dynamic.listingPrice)
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-green-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy Now
            </button>
          )}
          {isOwner && !nft.dynamic.isListed && (
            <div className="flex-1 flex flex-col gap-2">
              {offerIds && offerIds.length > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick?.()
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-green-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
                >
                  <Handshake className="w-4 h-4" />
                  Accept Offer ({offerIds.length})
                </button>
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClick?.()
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-amber-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
              >
                <Tag className="w-4 h-4" />
                List for Sale
              </button>
            </div>
          )}
          {isOwner && nft.dynamic.isListed && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick?.()
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
            >
              <X className="w-4 h-4" />
              Cancel Listing
            </button>
          )}
          {!isOwner && !nft.dynamic.isListed && (
            <UserOfferButton
              tokenId={nft.permanent.tokenId}
              offerIds={offerIds}
              address={address}
              onMakeOffer={onMakeOffer}
              onCancelOffer={onCancelOffer}
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const explorerUrl = getExplorerUrl(chainId)
              const contractAddress = getContractAddress(chainId)
              if (explorerUrl && contractAddress) {
                window.open(`${explorerUrl}/token/${contractAddress}/instance/${nft.permanent.tokenId}`, '_blank')
              }
            }}
            className="p-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg border border-white/20 transition-colors"
            title="View on explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        action="view"
        tokenId={nft.permanent.tokenId}
        imageUrl={shareImageUrl}
      />
    </motion.div>
  )
}

export default function RugMarketGrid({
  nfts,
  loading = false,
  onNFTClick,
  onRefreshNFT,
  onFavoriteToggle,
  onBuyNFT,
  onMakeOffer,
  onCancelListing,
  onCancelOffer,
  sortKey
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

  const handleMakeOffer = (tokenId: number) => {
    onMakeOffer?.(tokenId)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="bg-black/20 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '4/3' }}>
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
          {nfts.map((nft) => {
            // Create a key that includes dynamic traits so React remounts when they change
            const { dirtLevel, agingLevel } = getCalculatedLevels(nft.dynamic)
            const frameLevel = nft.dynamic.frameLevel || 'None'
            const dynamicKey = `${dirtLevel}-${agingLevel}-${frameLevel}`
            return (
              <RugCard
                key={`${nft.permanent.tokenId}-${sortKey || ''}-${dynamicKey}`}
                nft={nft}
                onClick={() => onNFTClick?.(nft)}
                onRefresh={() => onRefreshNFT?.(nft.permanent.tokenId)}
                onFavoriteToggle={() => handleFavoriteToggle(nft.permanent.tokenId)}
                onBuyNFT={(tokenId, price) => handleBuyNFT(tokenId, price)}
                onMakeOffer={(tokenId) => handleMakeOffer(tokenId)}
                onCancelListing={(tokenId) => onCancelListing?.(tokenId)}
                onCancelOffer={(offerId) => onCancelOffer?.(offerId)}
                isFavorited={favorites.has(nft.permanent.tokenId)}
              />
            )
          })}
        </AnimatePresence>
      {nfts.length === 0 && <div className="col-span-full text-center py-8 text-white">No rugs found</div>}
    </div>
  )
}

// Component to show Make Offer or Cancel Offer button based on user's active offer
function UserOfferButton({
  tokenId,
  offerIds,
  address,
  onMakeOffer,
  onCancelOffer
}: {
  tokenId: number
  offerIds: bigint[] | undefined
  address?: string
  onMakeOffer?: (tokenId: number) => void
  onCancelOffer?: (offerId: number) => void
}) {
  const [userOfferId, setUserOfferId] = useState<number | null>(null)

  // Render offer checkers and button
  if (offerIds && offerIds.length > 0 && address) {
    // Render checkers in a way that doesn't interfere with clicks
    return (
      <>
        {/* Hidden checkers - use a portal-like approach */}
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
          {offerIds.map((offerIdBigInt) => (
            <OfferIdChecker
              key={Number(offerIdBigInt)}
              offerId={Number(offerIdBigInt)}
              address={address}
              onFound={(id) => setUserOfferId(id)}
              onNotFound={() => {}}
            />
          ))}
        </div>
        {userOfferId !== null ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Open modal to show offer details and cancel option
              onMakeOffer?.(tokenId)
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
          >
            <X className="w-4 h-4" />
            Cancel Offer
          </button>
        ) : onMakeOffer ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMakeOffer(tokenId)
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
          >
            <HandCoins className="w-4 h-4" />
            Make Offer
          </button>
        ) : null}
      </>
    )
  }

  // No offers, show make offer button
  return onMakeOffer ? (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onMakeOffer(tokenId)
      }}
      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
    >
      <HandCoins className="w-4 h-4" />
      Make Offer
    </button>
  ) : null
}

// Component to check if a specific offer belongs to the user
function OfferIdChecker({
  offerId,
  address,
  onFound,
  onNotFound
}: {
  offerId: number
  address: string
  onFound: (offerId: number) => void
  onNotFound: () => void
}) {
  const { offer, isLoading } = useOfferData(offerId)

  useEffect(() => {
    if (isLoading) return

    if (!offer || !offer.isActive) {
      onNotFound()
      return
    }

    const isMyOffer = address.toLowerCase() === offer.offerer.toLowerCase()
    const isExpired = offer.expiresAt > 0 && Date.now() / 1000 > offer.expiresAt

    if (isMyOffer && !isExpired) {
      onFound(offerId)
    } else {
      onNotFound()
    }
  }, [offer, isLoading, address, offerId, onFound, onNotFound])

  // Return null - this component doesn't render anything visible
  return null
}

// Component to display the highest offer price in the overlay
function HighestOfferDisplay({ offerIds }: { offerIds: bigint[] }) {
  const [highestOffer, setHighestOffer] = useState<{ price: string; count: number } | null>(null)

  // Render individual offer checkers to find the highest
  return (
    <>
      {offerIds.map((offerIdBigInt) => (
        <OfferPriceChecker
          key={Number(offerIdBigInt)}
          offerId={Number(offerIdBigInt)}
          onPriceFound={(price) => {
            setHighestOffer(prev => {
              if (!prev || BigInt(price) > BigInt(prev.price)) {
                return { price, count: offerIds.length }
              }
              return prev
            })
          }}
        />
      ))}
      {highestOffer && highestOffer.price !== '0' && (
        <div className="absolute bottom-2 right-2 bg-blue-600/90 backdrop-blur-sm text-white px-2 py-1 rounded border border-blue-400 text-xs font-semibold pointer-events-auto shadow-lg">
          {formatEth(BigInt(highestOffer.price))} ETH
          {highestOffer.count > 1 && ` (${highestOffer.count})`}
        </div>
      )}
    </>
  )
}

// Component to check offer price
function OfferPriceChecker({
  offerId,
  onPriceFound
}: {
  offerId: number
  onPriceFound: (price: string) => void
}) {
  const { offer, isLoading } = useOfferData(offerId)

  useEffect(() => {
    if (!isLoading && offer && offer.isActive) {
      const isExpired = offer.expiresAt > 0 && Date.now() / 1000 > offer.expiresAt
      if (!isExpired) {
        onPriceFound(offer.price)
      }
    }
  }, [offer, isLoading, onPriceFound])

  return null
}
