'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag, Gavel, DollarSign, Clock, User, TrendingUp, Sparkles, AlertCircle } from 'lucide-react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import LiquidGlass from '../LiquidGlass'
import { useListingData, useAuctionData, useTokenOffers } from '@/hooks/use-marketplace-data'
import { useCreateListing, useBuyListing, useCancelListing, useCreateAuction, usePlaceBid, useMakeOffer, useAcceptOffer } from '@/hooks/use-marketplace-contract'
import { formatTimeRemaining, formatEth, isAuctionActive, isListingExpired, getConditionColor } from '@/utils/marketplace-utils'

interface NFTDetailModalProps {
  tokenId: number
  isOpen: boolean
  onClose: () => void
  nftData: any // Full NFT data including traits, aging, etc.
}

type ModalView = 'details' | 'create-listing' | 'create-auction' | 'place-bid' | 'make-offer'

export default function NFTDetailModal({ tokenId, isOpen, onClose, nftData }: NFTDetailModalProps) {
  const { address, isConnected } = useAccount()
  const [currentView, setCurrentView] = useState<ModalView>('details')
  
  // Fetch marketplace data
  const { listing, refetch: refetchListing } = useListingData(tokenId)
  const { auction, refetch: refetchAuction } = useAuctionData(tokenId)
  const { offerIds } = useTokenOffers(tokenId)
  
  // Check if user is the owner
  const isOwner = isConnected && address?.toLowerCase() === nftData?.owner?.toLowerCase()
  
  console.log('NFT Modal Debug:', {
    tokenId,
    userAddress: address?.toLowerCase(),
    nftOwner: nftData?.owner?.toLowerCase(),
    isOwner,
    isConnected
  })
  
  // Determine current status
  const hasActiveListing = listing?.isActive && !isListingExpired(listing)
  const hasActiveAuction = auction?.isActive && isAuctionActive(auction)
  const hasOffers = offerIds.length > 0

  useEffect(() => {
    if (isOpen) {
      setCurrentView('details')
      refetchListing()
      refetchAuction()
    }
  }, [isOpen, refetchListing, refetchAuction])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          <LiquidGlass
            blurAmount={0.15}
            aberrationIntensity={2}
            elasticity={0.1}
            cornerRadius={16}
          >
            <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 p-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  Rug #{tokenId}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - NFT Display */}
                <div>
                  {/* NFT Preview */}
                  <div 
                    className="bg-black/30 rounded-lg overflow-hidden mb-4 relative"
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
                            background: 'transparent'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🧵</div>
                            <div>#{tokenId}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Traits */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Traits</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-white/60">Palette:</span>
                        <span className="text-white ml-2">{nftData?.traits?.paletteName || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Complexity:</span>
                        <span className="text-white ml-2">{nftData?.traits?.complexity || 0}/5</span>
                      </div>
                      <div>
                        <span className="text-white/60">Character Count:</span>
                        <span className="text-white ml-2">{Number(nftData?.traits?.characterCount || 0)}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Stripe Count:</span>
                        <span className="text-white ml-2">{Number(nftData?.traits?.stripeCount || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="bg-white/5 rounded-lg p-4 mt-4">
                    <h3 className="text-white font-semibold mb-3">Condition</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Dirt Level:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getConditionColor(nftData?.aging?.dirtLevel || 0, 0)}`}>
                          Level {nftData?.aging?.dirtLevel || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Aging Level:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getConditionColor(0, nftData?.aging?.agingLevel || 0)}`}>
                          Level {nftData?.aging?.agingLevel || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Frame:</span>
                        <span className="text-white">{nftData?.aging?.currentFrameLevel || 'None'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Marketplace Actions */}
                <div>
                  {currentView === 'details' && (
                    <DetailsView
                      tokenId={tokenId}
                      nftData={nftData}
                      isOwner={isOwner}
                      listing={listing}
                      auction={auction}
                      hasOffers={hasOffers}
                      onCreateListing={() => setCurrentView('create-listing')}
                      onCreateAuction={() => setCurrentView('create-auction')}
                      onPlaceBid={() => setCurrentView('place-bid')}
                      onMakeOffer={() => setCurrentView('make-offer')}
                    />
                  )}

                  {currentView === 'create-listing' && (
                    <CreateListingView
                      tokenId={tokenId}
                      onBack={() => setCurrentView('details')}
                      onSuccess={() => {
                        refetchListing()
                        setCurrentView('details')
                      }}
                    />
                  )}

                  {currentView === 'create-auction' && (
                    <CreateAuctionView
                      tokenId={tokenId}
                      onBack={() => setCurrentView('details')}
                      onSuccess={() => {
                        refetchAuction()
                        setCurrentView('details')
                      }}
                    />
                  )}

                  {currentView === 'place-bid' && auction && (
                    <PlaceBidView
                      tokenId={tokenId}
                      auction={auction}
                      onBack={() => setCurrentView('details')}
                      onSuccess={() => {
                        refetchAuction()
                        setCurrentView('details')
                      }}
                    />
                  )}

                  {currentView === 'make-offer' && (
                    <MakeOfferView
                      tokenId={tokenId}
                      onBack={() => setCurrentView('details')}
                      onSuccess={() => setCurrentView('details')}
                    />
                  )}
                </div>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Details View Component
function DetailsView({ tokenId, nftData, isOwner, listing, auction, hasOffers, onCreateListing, onCreateAuction, onPlaceBid, onMakeOffer }: any) {
  const { cancelListing, isPending: isCancelling } = useCancelListing()
  const { buyListing, isPending: isBuying } = useBuyListing()

  const hasActiveListing = listing?.isActive && !isListingExpired(listing)
  const hasActiveAuction = auction?.isActive && isAuctionActive(auction)

  return (
    <div className="space-y-4">
      {/* Current Status */}
      {hasActiveListing && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">Listed for Sale</span>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {formatEth(listing.price)} ETH
          </div>
          {listing.expiresAt > 0 && (
            <div className="text-sm text-white/60">
              Expires: {formatTimeRemaining(listing.expiresAt)}
            </div>
          )}
          
          {isOwner ? (
            <button
              onClick={() => cancelListing(tokenId)}
              disabled={isCancelling}
              className="w-full mt-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Listing'}
            </button>
          ) : (
            <button
              onClick={() => {
                console.log('Buy Now clicked:', {
                  tokenId,
                  listing,
                  price: formatEther(listing.price),
                  isOwner
                })
                buyListing(tokenId, formatEther(listing.price))
              }}
              disabled={isBuying}
              className="w-full mt-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors disabled:opacity-50"
            >
              {isBuying ? 'Buying...' : 'Buy Now'}
            </button>
          )}
        </div>
      )}

      {hasActiveAuction && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gavel className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">Active Auction</span>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {auction.currentBid > BigInt(0) ? formatEth(auction.currentBid) : formatEth(auction.startPrice)} ETH
          </div>
          <div className="text-sm text-white/60 mb-2">
            {auction.highestBidder !== '0x0000000000000000000000000000000000000000' 
              ? `Current bid by ${auction.highestBidder.slice(0, 6)}...${auction.highestBidder.slice(-4)}`
              : 'No bids yet'}
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Clock className="w-4 h-4" />
            {formatTimeRemaining(auction.endTime)} remaining
          </div>
          
          {!isOwner && (
            <button
              onClick={onPlaceBid}
              className="w-full mt-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
            >
              Place Bid
            </button>
          )}
        </div>
      )}

      {/* Owner Actions */}
      {isOwner && !hasActiveListing && !hasActiveAuction && (
        <div className="space-y-3">
          <button
            onClick={onCreateListing}
            className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Tag className="w-5 h-5" />
            Create Listing
          </button>
          <button
            onClick={onCreateAuction}
            className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Gavel className="w-5 h-5" />
            Create Auction
          </button>
        </div>
      )}

      {/* Non-Owner Actions - Only show if NOT owner */}
      {!isOwner && (
        <button
          onClick={onMakeOffer}
          className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <DollarSign className="w-5 h-5" />
          Make Offer
        </button>
      )}

      {/* Sales History */}
      {nftData?.aging?.recentSalePrices && (
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sales History
          </h3>
          <div className="space-y-2 text-sm">
            {nftData.aging.recentSalePrices.map((price: bigint, index: number) => (
              price > BigInt(0) && (
                <div key={index} className="flex justify-between text-white/70">
                  <span>Sale {index + 1}:</span>
                  <span className="text-white">{formatEth(price)} ETH</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Offers Count */}
      {hasOffers && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
          <span className="text-blue-300">This rug has active offers</span>
        </div>
      )}
    </div>
  )
}

// Create Listing View Component
function CreateListingView({ tokenId, onBack, onSuccess }: any) {
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('7')
  const { createListing, isPending, isSuccess } = useCreateListing()

  useEffect(() => {
    if (isSuccess) {
      onSuccess()
    }
  }, [isSuccess, onSuccess])

  const handleCreate = async () => {
    if (!price || parseFloat(price) <= 0) {
      alert('Please enter a valid price')
      return
    }
    await createListing(tokenId, price, parseInt(duration))
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-white/60 hover:text-white">
        ← Back
      </button>
      
      <h3 className="text-xl font-bold text-white">Create Fixed-Price Listing</h3>
      
      <div>
        <label className="block text-white/70 mb-2">Price (ETH)</label>
        <input
          type="number"
          step="0.001"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
          placeholder="0.01"
        />
      </div>

      <div>
        <label className="block text-white/70 mb-2">Duration (days)</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
        >
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
        </select>
      </div>

      <button
        onClick={handleCreate}
        disabled={isPending || !price}
        className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create Listing'}
      </button>
    </div>
  )
}

// Create Auction View Component
function CreateAuctionView({ tokenId, onBack, onSuccess }: any) {
  const [startPrice, setStartPrice] = useState('')
  const [reservePrice, setReservePrice] = useState('')
  const [duration, setDuration] = useState('3')
  const [autoExtend, setAutoExtend] = useState(true)
  const { createAuction, isPending, isSuccess } = useCreateAuction()

  useEffect(() => {
    if (isSuccess) {
      onSuccess()
    }
  }, [isSuccess, onSuccess])

  const handleCreate = async () => {
    if (!startPrice || parseFloat(startPrice) <= 0) {
      alert('Please enter a valid starting price')
      return
    }
    await createAuction(tokenId, startPrice, reservePrice || '0', parseInt(duration), autoExtend)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-white/60 hover:text-white">
        ← Back
      </button>
      
      <h3 className="text-xl font-bold text-white">Create Auction</h3>
      
      <div>
        <label className="block text-white/70 mb-2">Starting Price (ETH)</label>
        <input
          type="number"
          step="0.001"
          value={startPrice}
          onChange={(e) => setStartPrice(e.target.value)}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
          placeholder="0.01"
        />
      </div>

      <div>
        <label className="block text-white/70 mb-2">Reserve Price (ETH) - Optional</label>
        <input
          type="number"
          step="0.001"
          value={reservePrice}
          onChange={(e) => setReservePrice(e.target.value)}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
          placeholder="0"
        />
      </div>

      <div>
        <label className="block text-white/70 mb-2">Duration (days)</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
        >
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={autoExtend}
          onChange={(e) => setAutoExtend(e.target.checked)}
          className="w-4 h-4"
        />
        <label className="text-white/70">Auto-extend if bid near end</label>
      </div>

      <button
        onClick={handleCreate}
        disabled={isPending || !startPrice}
        className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create Auction'}
      </button>
    </div>
  )
}

// Place Bid View Component
function PlaceBidView({ tokenId, auction, onBack, onSuccess }: any) {
  const [bidAmount, setBidAmount] = useState('')
  const { placeBid, isPending, isSuccess } = usePlaceBid()

  const minBid = auction.currentBid > BigInt(0) 
    ? formatEth(auction.currentBid * BigInt(105) / BigInt(100)) // 5% increment
    : formatEth(auction.startPrice)

  useEffect(() => {
    if (isSuccess) {
      onSuccess()
    }
  }, [isSuccess, onSuccess])

  const handleBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) < parseFloat(minBid)) {
      alert(`Bid must be at least ${minBid} ETH`)
      return
    }
    await placeBid(tokenId, bidAmount)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-white/60 hover:text-white">
        ← Back
      </button>
      
      <h3 className="text-xl font-bold text-white">Place Bid</h3>
      
      <div className="bg-white/5 rounded-lg p-4">
        <div className="text-sm text-white/60 mb-1">Minimum Bid</div>
        <div className="text-xl font-bold text-white">{minBid} ETH</div>
      </div>

      <div>
        <label className="block text-white/70 mb-2">Your Bid (ETH)</label>
        <input
          type="number"
          step="0.001"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
          placeholder={minBid}
        />
      </div>

      <button
        onClick={handleBid}
        disabled={isPending || !bidAmount}
        className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? 'Placing Bid...' : 'Place Bid'}
      </button>
    </div>
  )
}

// Make Offer View Component
function MakeOfferView({ tokenId, onBack, onSuccess }: any) {
  const [offerAmount, setOfferAmount] = useState('')
  const [duration, setDuration] = useState('7')
  const { makeOffer, isPending, isSuccess } = useMakeOffer()

  useEffect(() => {
    if (isSuccess) {
      onSuccess()
    }
  }, [isSuccess, onSuccess])

  const handleOffer = async () => {
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      alert('Please enter a valid offer amount')
      return
    }
    await makeOffer(tokenId, offerAmount, parseInt(duration))
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-white/60 hover:text-white">
        ← Back
      </button>
      
      <h3 className="text-xl font-bold text-white">Make Offer</h3>
      
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-300">
          Your ETH will be escrowed until the offer is accepted or cancelled
        </div>
      </div>

      <div>
        <label className="block text-white/70 mb-2">Offer Amount (ETH)</label>
        <input
          type="number"
          step="0.001"
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
          placeholder="0.01"
        />
      </div>

      <div>
        <label className="block text-white/70 mb-2">Offer Duration (days)</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
        >
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
        </select>
      </div>

      <button
        onClick={handleOffer}
        disabled={isPending || !offerAmount}
        className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? 'Making Offer...' : 'Make Offer'}
      </button>
    </div>
  )
}

