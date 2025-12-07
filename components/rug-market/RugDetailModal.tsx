'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, ExternalLink, Calendar, User, TrendingUp, ShoppingCart, Tag, AlertCircle } from 'lucide-react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { RugMarketNFT } from '@/lib/rug-market-types'
import NFTDisplay from '@/components/NFTDisplay'
import { rugMarketNFTToNFTData } from '@/utils/rug-market-data-adapter'
import { useCreateListing, useCancelListing, useApproveMarketplace, useApprovalStatus } from '@/hooks/use-marketplace-contract'
import { useListingData } from '@/hooks/use-marketplace-data'
import { useWaitForTransactionReceipt } from 'wagmi'
import { contractAddresses, onchainRugsABI } from '@/lib/web3'
import { getExplorerUrl } from '@/lib/networks'

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
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { permanent, dynamic } = nft
  
  // Get contract address
  const contractAddress = contractAddresses[chainId]
  
  // Get owner from contract
  const { data: ownerAddress } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'ownerOf',
    args: [BigInt(permanent.tokenId)]
  })
  
  // Marketplace hooks
  const { listing, isLoading: listingLoading } = useListingData(permanent.tokenId)
  const { approved, isLoading: approvalLoading } = useApprovalStatus(permanent.tokenId)
  const approveMarketplace = useApproveMarketplace(permanent.tokenId)
  const createListing = useCreateListing()
  const cancelListing = useCancelListing()
  
  // Listing state
  const [showListingForm, setShowListingForm] = useState(false)
  const [listingPrice, setListingPrice] = useState('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  // Check if user is owner
  const isOwner = isConnected && address?.toLowerCase() === ownerAddress?.toLowerCase()
  const isListingActive = listing?.isActive
  
  // Transaction tracking
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveMarketplace.hash
  })
  
  const { isLoading: isListingConfirming, isSuccess: isListingSuccess } = useWaitForTransactionReceipt({
    hash: createListing.hash
  })
  
  const { isLoading: isCancelConfirming, isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({
    hash: cancelListing.hash
  })
  
  // Auto-refresh after approvals/listings
  useEffect(() => {
    if (isApproveSuccess) {
      setNotification({ type: 'success', message: 'Marketplace approved! You can now list your NFT.' })
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isApproveSuccess])
  
  useEffect(() => {
    if (isListingSuccess) {
      setNotification({ type: 'success', message: 'NFT listed successfully!' })
      setShowListingForm(false)
      setListingPrice('')
      onRefreshNFT?.(permanent.tokenId)
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isListingSuccess, permanent.tokenId, onRefreshNFT])
  
  useEffect(() => {
    if (isCancelSuccess) {
      setNotification({ type: 'success', message: 'Listing cancelled successfully!' })
      onRefreshNFT?.(permanent.tokenId)
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isCancelSuccess, permanent.tokenId, onRefreshNFT])

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  const handleCreateListing = () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      setNotification({ type: 'error', message: 'Please enter a valid price' })
      setTimeout(() => setNotification(null), 3000)
      return
    }
    
    if (!approved) {
      setNotification({ type: 'error', message: 'Please approve the marketplace first' })
      setTimeout(() => setNotification(null), 3000)
      return
    }
    
    createListing.createListing(permanent.tokenId, listingPrice, 0) // 0 = no expiration
  }
  
  const handleCancelListing = () => {
    if (!isListingActive) return
    cancelListing.cancelListing(permanent.tokenId)
  }

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
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close (ESC)"
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
                <div className="relative bg-black/30 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  <NFTDisplay
                    nftData={nftDataForDisplay}
                    size="large"
                    interactive={false}
                    className="rounded-xl w-full h-full"
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
                    {/* Permanent Traits */}
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

                    {permanent.curator && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Curator</div>
                        <div className="text-white font-medium font-mono text-xs">{formatAddress(permanent.curator)}</div>
                      </div>
                    )}

                    {/* Dynamic Traits */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Dirt Level</div>
                      <div className="text-white font-medium">{dynamic.dirtLevel || 0}</div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Aging Level</div>
                      <div className="text-white font-medium">{dynamic.agingLevel || 0}</div>
                    </div>

                    {dynamic.frameLevel && dynamic.frameLevel !== 'None' && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Frame</div>
                        <div className="text-white font-medium">{dynamic.frameLevel}</div>
                      </div>
                    )}

                    {dynamic.maintenanceScore !== undefined && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Maintenance Score</div>
                        <div className="text-white font-medium">{Number(dynamic.maintenanceScore || 0)}</div>
                      </div>
                    )}

                    {dynamic.cleaningCount !== undefined && dynamic.cleaningCount > 0 && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Cleanings</div>
                        <div className="text-white font-medium">{dynamic.cleaningCount}</div>
                      </div>
                    )}

                    {dynamic.restorationCount !== undefined && dynamic.restorationCount > 0 && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Restorations</div>
                        <div className="text-white font-medium">{dynamic.restorationCount}</div>
                      </div>
                    )}

                    {dynamic.masterRestorationCount !== undefined && dynamic.masterRestorationCount > 0 && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Master Restorations</div>
                        <div className="text-white font-medium">{dynamic.masterRestorationCount}</div>
                      </div>
                    )}

                    {dynamic.launderingCount !== undefined && dynamic.launderingCount > 0 && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Launderings</div>
                        <div className="text-white font-medium">{dynamic.launderingCount}</div>
                      </div>
                    )}

                    {dynamic.lastCleaned && Number(dynamic.lastCleaned) > 0 && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Last Cleaned</div>
                        <div className="text-white font-medium text-xs">{formatDate(dynamic.lastCleaned)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification */}
                {notification && (
                  <div className={`p-3 rounded-lg border ${
                    notification.type === 'success'
                      ? 'bg-green-500/20 border-green-500/30 text-green-300'
                      : 'bg-red-500/20 border-red-500/30 text-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{notification.message}</span>
                    </div>
                  </div>
                )}

                {/* Listing Actions */}
                {isOwner && (
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    {isListingActive ? (
                      <>
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                          <div className="text-green-300 text-sm font-medium mb-1">Listed for Sale</div>
                          <div className="text-green-200 font-semibold">
                            {listing?.price ? `${(Number(listing.price) / 1e18).toFixed(4)} ETH` : dynamic.listingPrice || 'N/A'}
                          </div>
                        </div>
                        <button
                          onClick={handleCancelListing}
                          disabled={isCancelConfirming || cancelListing.isPending}
                          className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {isCancelConfirming || cancelListing.isPending ? 'Cancelling...' : 'Cancel Listing'}
                        </button>
                      </>
                    ) : (
                      <>
                        {!approved && (
                          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-3">
                            <div className="text-yellow-300 text-sm mb-2">
                              You need to approve the marketplace to list this NFT
                            </div>
                            <button
                              onClick={() => approveMarketplace.approve()}
                              disabled={isApproveConfirming || approveMarketplace.isPending}
                              className="w-full bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-200 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {isApproveConfirming || approveMarketplace.isPending ? 'Approving...' : 'Approve Marketplace'}
                            </button>
                          </div>
                        )}
                        
                        {!showListingForm && approved && (
                          <button
                            onClick={() => setShowListingForm(true)}
                            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <Tag className="w-5 h-5" />
                            List for Sale
                          </button>
                        )}
                        
                        {showListingForm && approved && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-white/70 text-sm mb-2">Price (ETH)</label>
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={listingPrice}
                                onChange={(e) => setListingPrice(e.target.value)}
                                placeholder="0.01"
                                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleCreateListing}
                                disabled={isListingConfirming || createListing.isPending || !listingPrice}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                {isListingConfirming || createListing.isPending ? 'Creating...' : 'Create Listing'}
                              </button>
                              <button
                                onClick={() => {
                                  setShowListingForm(false)
                                  setListingPrice('')
                                }}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  {isListingActive && !isOwner && onBuyNFT && (
                    <button
                      onClick={() => onBuyNFT(permanent.tokenId, listing?.price ? (Number(listing.price) / 1e18).toString() : dynamic.listingPrice || '0')}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Buy Now {listing?.price ? `${(Number(listing.price) / 1e18).toFixed(4)} ETH` : formatPrice(dynamic.listingPrice)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

