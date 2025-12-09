'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, ExternalLink, Calendar, User, TrendingUp, ShoppingCart, Tag, AlertCircle, RefreshCw, HandCoins, Handshake } from 'lucide-react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { RugMarketNFT } from '@/lib/rug-market-types'
import NFTDisplay from '@/components/NFTDisplay'
import { rugMarketNFTToNFTData, getCalculatedLevels } from '@/utils/rug-market-data-adapter'
import { useCreateListing, useCancelListing, useApproveMarketplace, useApprovalStatus, useMakeOffer, useAcceptOffer, useCancelOffer, useTokenOffers, useOfferData } from '@/hooks/use-marketplace-contract'
import { useListingData } from '@/hooks/use-marketplace-data'
import { useWaitForTransactionReceipt } from 'wagmi'
import { contractAddresses, onchainRugsABI } from '@/lib/web3'
import { getExplorerUrl } from '@/lib/networks'
import { formatEth } from '@/utils/marketplace-utils'
import { useRoyaltyInfo, useMarketplaceFee, useDiamondFramePoolInfo } from '@/hooks/use-royalty-info'

interface RugDetailModalProps {
  nft: RugMarketNFT
  isOpen: boolean
  onClose: () => void
  onBuyNFT?: (tokenId: number, price: string) => void
  onMakeOffer?: (tokenId: number) => void
  onRefreshNFT?: (tokenId: number) => void
}

export default function RugDetailModal({
  nft,
  isOpen,
  onClose,
  onBuyNFT,
  onMakeOffer,
  onRefreshNFT
}: RugDetailModalProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { permanent, dynamic } = nft
  const [isRefreshing, setIsRefreshing] = useState(false)
  
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
  const makeOffer = useMakeOffer()
  const acceptOffer = useAcceptOffer()
  const cancelOffer = useCancelOffer()
  const { offerIds, isLoading: offersLoading, refetch: refetchOffers } = useTokenOffers(permanent.tokenId)
  
  // Listing state
  const [showListingForm, setShowListingForm] = useState(false)
  const [listingPrice, setListingPrice] = useState('')
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerDuration, setOfferDuration] = useState('7') // Default 7 days
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  // Check if user is owner
  const isOwner = isConnected && address?.toLowerCase() === ownerAddress?.toLowerCase()
  const isListingActive = listing?.isActive
  
  // Check if user is the listing seller (prevents buying own listings)
  const isListingSeller = isConnected && listing?.seller && address?.toLowerCase() === listing.seller.toLowerCase()
  
  // Find user's active offer
  const userOfferId = useMemo(() => {
    if (!address || !offerIds || offerIds.length === 0) return null
    // We'll check offers in a component that can fetch them individually
    return undefined // Will be determined by checking each offer
  }, [address, offerIds])
  
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

  const { isLoading: isMakeOfferConfirming, isSuccess: isMakeOfferSuccess } = useWaitForTransactionReceipt({
    hash: makeOffer.hash
  })

  const { isLoading: isAcceptOfferConfirming, isSuccess: isAcceptOfferSuccess } = useWaitForTransactionReceipt({
    hash: acceptOffer.hash
  })

  const { isLoading: isCancelOfferConfirming, isSuccess: isCancelOfferSuccess } = useWaitForTransactionReceipt({
    hash: cancelOffer.hash
  })
  
  // Auto-refresh after approvals/listings
  useEffect(() => {
    if (isApproveSuccess) {
      setNotification({ type: 'success', message: 'Marketplace approved! You can now list your NFT.' })
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isApproveSuccess])

  // Handle approval errors
  useEffect(() => {
    if (approveMarketplace.error) {
      const errorMessage = approveMarketplace.error.message || 'Failed to approve marketplace'
      setNotification({ type: 'error', message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    }
  }, [approveMarketplace.error])

  // Handle create listing errors
  useEffect(() => {
    if (createListing.error) {
      const errorMessage = createListing.error.message || 'Failed to create listing'
      setNotification({ type: 'error', message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    }
  }, [createListing.error])
  
  useEffect(() => {
    if (isListingSuccess && createListing.hash) {
      setNotification({ type: 'success', message: 'NFT listed successfully!' })
      setShowListingForm(false)
      setListingPrice('')
      
      // Update cache with listing data
      const updateCache = async () => {
        try {
          await fetch(`/api/rug-market/nft/${permanent.tokenId}/update?chainId=${chainId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'listing',
              data: {
                isListed: true,
                listingPrice: listingPrice,
                listingSeller: address,
                listingTxHash: createListing.hash
              },
              txHash: createListing.hash
            })
          })
        } catch (error) {
          console.error('Failed to update cache after listing:', error)
        }
      }
      
      updateCache().then(() => {
        onRefreshNFT?.(permanent.tokenId)
      })
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isListingSuccess, permanent.tokenId, onRefreshNFT, chainId, listingPrice, address, createListing.hash])
  
  useEffect(() => {
    if (isCancelSuccess && cancelListing.hash) {
      setNotification({ type: 'success', message: 'Listing cancelled successfully!' })
      
      // Update cache with delisting data
      const updateCache = async () => {
        try {
          await fetch(`/api/rug-market/nft/${permanent.tokenId}/update?chainId=${chainId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delisting',
              data: {
                isListed: false,
                listingPrice: undefined,
                listingSeller: undefined,
                listingTxHash: cancelListing.hash
              },
              txHash: cancelListing.hash
            })
          })
        } catch (error) {
          console.error('Failed to update cache after delisting:', error)
        }
      }
      
      updateCache().then(() => {
        onRefreshNFT?.(permanent.tokenId)
      })
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isCancelSuccess, permanent.tokenId, onRefreshNFT, chainId, cancelListing.hash])

  // Handle cancel listing errors
  useEffect(() => {
    if (cancelListing.error) {
      const errorMessage = cancelListing.error.message || 'Failed to cancel listing'
      setNotification({ type: 'error', message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    }
  }, [cancelListing.error])

  // Handle make offer success
  useEffect(() => {
    if (isMakeOfferSuccess && makeOffer.hash) {
      setNotification({ type: 'success', message: 'Offer created successfully!' })
      setShowOfferForm(false)
      setOfferPrice('')
      refetchOffers()
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isMakeOfferSuccess, makeOffer.hash, refetchOffers])

  // Handle make offer errors
  useEffect(() => {
    if (makeOffer.error) {
      const errorMessage = makeOffer.error.message || 'Failed to create offer'
      setNotification({ type: 'error', message: errorMessage })
      setTimeout(() => setNotification(null), 5000)
    }
  }, [makeOffer.error])

  // Handle accept offer success
  useEffect(() => {
    if (isAcceptOfferSuccess && acceptOffer.hash) {
      setNotification({ type: 'success', message: 'Offer accepted! NFT transferred.' })
      onRefreshNFT?.(permanent.tokenId)
      refetchOffers()
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isAcceptOfferSuccess, acceptOffer.hash, permanent.tokenId, onRefreshNFT, refetchOffers])

  // Handle cancel offer success
  useEffect(() => {
    if (isCancelOfferSuccess && cancelOffer.hash) {
      setNotification({ type: 'success', message: 'Offer cancelled successfully!' })
      refetchOffers()
      setTimeout(() => setNotification(null), 3000)
    }
  }, [isCancelOfferSuccess, cancelOffer.hash, refetchOffers])

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

  const handleMakeOffer = () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      setNotification({ type: 'error', message: 'Please enter a valid offer price' })
      setTimeout(() => setNotification(null), 3000)
      return
    }
    
    const duration = parseFloat(offerDuration) * 24 * 60 * 60 // Convert days to seconds
    makeOffer.makeOffer(permanent.tokenId, offerPrice, duration)
  }

  const handleAcceptOffer = (offerId: number) => {
    acceptOffer.acceptOffer(offerId)
  }

  const handleCancelOffer = (offerId: number) => {
    cancelOffer.cancelOffer(offerId)
  }

  const formatAddress = (address: string) => {
    if (!address) return 'N/A'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: bigint | number | string) => {
    // Convert to number, handling bigint properly
    let numTimestamp: number
    if (typeof timestamp === 'bigint') {
      // Check if the bigint is too large for safe Number conversion
      if (timestamp > BigInt(Number.MAX_SAFE_INTEGER)) {
        console.warn('[formatDate] Timestamp too large for safe conversion:', timestamp)
        return 'Invalid Date'
      }
      numTimestamp = Number(timestamp)
    } else if (typeof timestamp === 'string') {
      numTimestamp = parseInt(timestamp, 10)
    } else {
      numTimestamp = timestamp
    }
    
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
      day: 'numeric'
    })
  }

  const formatPrice = (price?: string) => {
    if (!price || price === '0' || price === '') return null
    try {
      // Price is stored as string in wei format, convert to ETH
      const priceWei = BigInt(price)
      if (priceWei === BigInt(0)) return null
      
      const eth = Number(priceWei) / 1e18
      
      // For very small amounts, show more precision to avoid truncation to 0
      if (eth < 0.000001) {
        // Show up to 8 decimals for extremely small amounts
        const formatted = eth.toFixed(8).replace(/\.?0+$/, '')
        return formatted === '0' ? null : `${formatted} ETH`
      }
      
      // Format with appropriate decimals
      if (eth < 0.001) {
        return `${eth.toFixed(6).replace(/\.?0+$/, '')} ETH`
      } else if (eth < 0.01) {
        return `${eth.toFixed(5).replace(/\.?0+$/, '')} ETH`
      } else if (eth < 1) {
        return `${eth.toFixed(4).replace(/\.?0+$/, '')} ETH`
      } else {
        return `${eth.toFixed(2)} ETH`
      }
    } catch (error) {
      console.error('Failed to format price:', error, 'Raw price:', price)
      return null
    }
  }

  // Convert to NFTData to get calculated values
  const nftDataForDisplay = rugMarketNFTToNFTData(nft)

  const getConditionBadge = () => {
    // Use calculated values from helper function
    const { dirtLevel: dirt, agingLevel: aging } = getCalculatedLevels(dynamic)

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
                onClick={async () => {
                  if (onRefreshNFT && !isRefreshing) {
                    setIsRefreshing(true)
                    try {
                      await onRefreshNFT(permanent.tokenId)
                    } finally {
                      setIsRefreshing(false)
                    }
                  }
                }}
                disabled={isRefreshing || !onRefreshNFT}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh NFT data"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
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
                <div className="relative bg-black/30 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <NFTDisplay
                    nftData={nftDataForDisplay}
                    size="large"
                    interactive={false}
                    className="rounded-xl w-full h-full"
                  />
                  
                  {/* Overlay badges */}
                  {dynamic.isListed && (
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 text-sm font-medium flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        FOR SALE
                      </span>
                    </div>
                    )}

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
                            {(() => {
                              // Try listing.price first (from contract, in wei as bigint)
                              if (listing?.price !== undefined && listing.price !== null) {
                                const priceWei = typeof listing.price === 'bigint' ? listing.price : BigInt(String(listing.price))
                                if (priceWei > BigInt(0)) {
                                  const formatted = formatEth(priceWei)
                                  const ethValue = parseFloat(formatted)
                                  // Log for debugging
                                  console.log(`[Price Display] Contract price: ${priceWei.toString()} wei = ${formatted} ETH (parsed: ${ethValue})`)
                                  // Don't show if formatted result is effectively 0
                                  if (ethValue > 0) {
                                    return `${formatted} ETH`
                                  } else {
                                    console.warn(`[Price Display] Price formatted to 0: ${priceWei.toString()} wei`)
                                  }
                                } else {
                                  console.log(`[Price Display] Contract price is 0: ${priceWei.toString()}`)
                                }
                              }
                              // Fallback to dynamic.listingPrice (stored as string in wei)
                              if (dynamic.listingPrice && dynamic.listingPrice !== '0' && dynamic.listingPrice !== '') {
                                try {
                                  const priceWei = BigInt(dynamic.listingPrice)
                                  if (priceWei > BigInt(0)) {
                                    const formatted = formatEth(priceWei)
                                    const ethValue = parseFloat(formatted)
                                    // Log for debugging
                                    console.log(`[Price Display] Dynamic price: ${priceWei.toString()} wei = ${formatted} ETH (parsed: ${ethValue})`)
                                    // Don't show if formatted result is effectively 0
                                    if (ethValue > 0) {
                                      return `${formatted} ETH`
                                    } else {
                                      console.warn(`[Price Display] Dynamic price formatted to 0: ${priceWei.toString()} wei`)
                                    }
                                  } else {
                                    console.log(`[Price Display] Dynamic price is 0: ${priceWei.toString()}`)
                                  }
                                } catch (error) {
                                  console.error('[Price Display] Failed to format listing price:', error, 'Raw value:', dynamic.listingPrice)
                                }
                              }
                              console.log(`[Price Display] No valid price. listing?.price:`, listing?.price, 'dynamic.listingPrice:', dynamic.listingPrice)
                              return 'Price not set'
                            })()}
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
                            
                            {/* Listing Breakdown */}
                            {listingPrice && parseFloat(listingPrice) > 0 && (
                              <ListingBreakdown
                                tokenId={permanent.tokenId}
                                listingPrice={listingPrice}
                              />
                            )}
                            
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

                {/* Actions - Make Offer and Buy */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  {isListingActive && !isOwner && !isListingSeller && onBuyNFT && (
                    <button
                      onClick={() => onBuyNFT(permanent.tokenId, listing?.price ? (Number(listing.price) / 1e18).toString() : dynamic.listingPrice || '0')}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-green-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Buy Now {(() => {
                        if (listing?.price) {
                          const priceWei = typeof listing.price === 'bigint' ? listing.price : BigInt(listing.price)
                          if (priceWei > BigInt(0)) {
                            return `${formatEth(priceWei)} ETH`
                          }
                        }
                        if (dynamic.listingPrice) {
                          try {
                            const priceWei = BigInt(dynamic.listingPrice)
                            if (priceWei > BigInt(0)) {
                              return `${formatEth(priceWei)} ETH`
                            }
                          } catch (error) {
                            console.error('Failed to format price for Buy Now button:', error)
                          }
                        }
                        return 'N/A'
                      })()}
                    </button>
                  )}
                  {isListingActive && isListingSeller && (
                    <div className="w-full text-center text-white/60 py-3 px-6 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                      <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm">You cannot buy your own listing</div>
                    </div>
                  )}

                  {/* Make Offer / My Offer Section */}
                  {!isOwner && (
                    <UserOfferDisplay
                      tokenId={permanent.tokenId}
                      offerIds={offerIds}
                      address={address}
                      onCancel={handleCancelOffer}
                      isCancelling={isCancelOfferConfirming || cancelOffer.isPending}
                    >
                      {!showOfferForm ? (
                        <button
                          onClick={() => setShowOfferForm(true)}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                          <HandCoins className="w-5 h-5" />
                          Make Offer
                        </button>
                      ) : (
                        <div className="space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
                          <div>
                            <label className="block text-white/70 text-sm mb-2">Offer Price (ETH)</label>
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              placeholder="0.01"
                              className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white/70 text-sm mb-2">Duration (days, 0 = no expiration)</label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={offerDuration}
                              onChange={(e) => setOfferDuration(e.target.value)}
                              placeholder="7"
                              className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleMakeOffer}
                              disabled={isMakeOfferConfirming || makeOffer.isPending || !offerPrice}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {isMakeOfferConfirming || makeOffer.isPending ? 'Creating...' : 'Create Offer'}
                            </button>
                            <button
                              onClick={() => {
                                setShowOfferForm(false)
                                setOfferPrice('')
                              }}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </UserOfferDisplay>
                  )}

                  {/* Active Offers Section */}
                  {isOwner && offerIds && offerIds.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">Active Offers</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {offerIds.map((offerIdBigInt) => {
                          const offerId = Number(offerIdBigInt)
                          return <OfferItem key={offerId} offerId={offerId} tokenId={permanent.tokenId} onAccept={handleAcceptOffer} onCancel={handleCancelOffer} isOwner={isOwner} address={address} />
                        })}
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
                    {(() => {
                      const { dirtLevel, agingLevel } = getCalculatedLevels(dynamic)
                      return (
                        <>
                          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Dirt Level</div>
                            <div className="text-white font-medium">{dirtLevel}</div>
                          </div>

                          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Aging Level</div>
                            <div className="text-white font-medium">{agingLevel}</div>
                          </div>
                        </>
                      )
                    })()}

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

              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// User Offer Display Component - Shows user's active offer or make offer button
function UserOfferDisplay({
  tokenId,
  offerIds,
  address,
  onCancel,
  isCancelling,
  children
}: {
  tokenId: number
  offerIds: bigint[] | undefined
  address?: string
  onCancel: (offerId: number) => void
  isCancelling: boolean
  children: React.ReactNode
}) {
  const [hasUserOffer, setHasUserOffer] = useState(false)

  // Render a checker component for each offer
  if (offerIds && offerIds.length > 0 && address) {
    return (
      <>
        {offerIds.map((offerIdBigInt) => (
          <OfferChecker
            key={Number(offerIdBigInt)}
            offerId={Number(offerIdBigInt)}
            address={address}
            onCancel={onCancel}
            isCancelling={isCancelling}
            onFound={() => setHasUserOffer(true)}
            onNotFound={() => setHasUserOffer(false)}
          />
        ))}
        {!hasUserOffer && children}
      </>
    )
  }

  // No offers, show make offer button
  return <>{children}</>
}

// Component to check if a specific offer belongs to the user
function OfferChecker({
  offerId,
  address,
  onCancel,
  isCancelling,
  onFound,
  onNotFound
}: {
  offerId: number
  address: string
  onCancel: (offerId: number) => void
  isCancelling: boolean
  onFound: () => void
  onNotFound: () => void
}) {
  const { offer, isLoading } = useOfferData(offerId)

  useEffect(() => {
    if (isLoading || !offer || !offer.isActive) {
      onNotFound()
      return
    }

    const isMyOffer = address.toLowerCase() === offer.offerer.toLowerCase()
    const isExpired = offer.expiresAt > 0 && Date.now() / 1000 > offer.expiresAt

    if (isMyOffer && !isExpired) {
      onFound()
    } else {
      onNotFound()
    }
  }, [offer, isLoading, address, onFound, onNotFound])

  if (isLoading) {
    return null // Don't show anything while loading
  }

  if (!offer || !offer.isActive) {
    return null // Not an active offer
  }

  const isMyOffer = address.toLowerCase() === offer.offerer.toLowerCase()
  const isExpired = offer.expiresAt > 0 && Date.now() / 1000 > offer.expiresAt

  if (isMyOffer && !isExpired) {
    // This is the user's active offer
    return (
      <div className="space-y-3">
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-blue-300 text-sm font-medium mb-1">Your Active Offer</div>
              <div className="text-white text-xl font-bold">{formatEth(BigInt(offer.price))} ETH</div>
            </div>
          </div>
          {offer.expiresAt > 0 && (
            <div className="text-blue-200 text-xs mb-3">
              Expires: {new Date(offer.expiresAt * 1000).toLocaleString()}
            </div>
          )}
          <button
            onClick={() => onCancel(offerId)}
            disabled={isCancelling}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            {isCancelling ? 'Cancelling...' : 'Cancel Offer'}
          </button>
        </div>
      </div>
    )
  }

  // Not user's offer, return null (other checkers will handle their offers)
  return null
}

// Listing Breakdown Component - Shows what seller will receive
function ListingBreakdown({ tokenId, listingPrice }: { tokenId: number; listingPrice: string }) {
  const { royaltyAmount, royaltyPercentage, isLoading: royaltyLoading } = useRoyaltyInfo(tokenId, BigInt(parseFloat(listingPrice) * 1e18))
  const { marketplaceFeePercent, calculateMarketplaceFee } = useMarketplaceFee()
  const { poolPercent, calculatePoolFee } = useDiamondFramePoolInfo()

  if (royaltyLoading) {
    return (
      <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-400/30 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-blue-400/20 rounded w-full"></div>
            <div className="h-3 bg-blue-400/20 rounded w-3/4"></div>
            <div className="h-3 bg-blue-400/20 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  const priceWei = BigInt(Math.floor(parseFloat(listingPrice) * 1e18))
  
  // Calculate fees
  const marketplaceFee = calculateMarketplaceFee(priceWei)
  const poolFee = calculatePoolFee(priceWei)
  const creatorRoyalty = (royaltyAmount || BigInt(0)) - poolFee // Creator gets 9%, pool gets 1%
  const totalDeductions = creatorRoyalty + poolFee + marketplaceFee
  const sellerReceives = priceWei - totalDeductions

  return (
    <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
        <h4 className="text-blue-200 font-medium text-sm">You Will Receive</h4>
      </div>

      <div className="space-y-2 text-sm">
        {/* Listing Price */}
        <div className="flex justify-between text-white/90">
          <span>Listing Price:</span>
          <span className="font-medium">{listingPrice} ETH</span>
        </div>

        {/* Creator Royalty */}
        {creatorRoyalty > BigInt(0) && (
          <div className="flex justify-between text-green-300">
            <span>Creator Royalty ({royaltyPercentage - poolPercent}%):</span>
            <span>-{formatEth(creatorRoyalty)} ETH</span>
          </div>
        )}

        {/* Diamond Frame Pool */}
        {poolFee > BigInt(0) && (
          <div className="flex justify-between text-yellow-300">
            <span>Diamond Frame Pool ({poolPercent}%):</span>
            <span>-{formatEth(poolFee)} ETH</span>
          </div>
        )}

        {/* Marketplace Fee */}
        {marketplaceFee > BigInt(0) && (
          <div className="flex justify-between text-purple-300">
            <span>Marketplace Fee ({marketplaceFeePercent}%):</span>
            <span>-{formatEth(marketplaceFee)} ETH</span>
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-blue-400/30 pt-2 mt-3">
          {/* Seller Receives */}
          <div className="flex justify-between text-green-300 font-medium">
            <span>You Will Receive:</span>
            <span>{formatEth(sellerReceives)} ETH</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-blue-200/70 mt-3 pt-2 border-t border-blue-400/20">
        💎 Royalties support creators (9%) and Diamond Frame NFT holders (1%) for long-term sustainability
      </div>
    </div>
  )
}

// Offer Item Component
function OfferItem({ 
  offerId, 
  tokenId, 
  onAccept, 
  onCancel, 
  isOwner, 
  address 
}: { 
  offerId: number
  tokenId: number
  onAccept: (offerId: number) => void
  onCancel: (offerId: number) => void
  isOwner: boolean
  address?: string
}) {
  const { offer, isLoading } = useOfferData(offerId)

  const formatAddress = (addr: string) => {
    if (!addr) return 'N/A'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isLoading || !offer) {
    return <div className="bg-white/5 rounded-lg p-3 border border-white/10">Loading offer...</div>
  }

  if (!offer.isActive) return null

  const isExpired = offer.expiresAt > 0 && Date.now() / 1000 > offer.expiresAt
  const isMyOffer = address?.toLowerCase() === offer.offerer.toLowerCase()

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-white font-medium">{formatEth(BigInt(offer.price))} ETH</div>
          <div className="text-white/60 text-xs font-mono">{formatAddress(offer.offerer)}</div>
        </div>
        {isExpired && (
          <span className="text-xs text-red-400">Expired</span>
        )}
      </div>
      {offer.expiresAt > 0 && (
        <div className="text-white/60 text-xs mb-2">
          Expires: {new Date(offer.expiresAt * 1000).toLocaleDateString()}
        </div>
      )}
      <div className="flex gap-2">
        {isOwner && !isExpired && (
          <button
            onClick={() => onAccept(offerId)}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            <Handshake className="w-4 h-4" />
            Accept
          </button>
        )}
        {isMyOffer && !isExpired && (
          <button
            onClick={() => onCancel(offerId)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel Offer
          </button>
        )}
      </div>
    </div>
  )
}

