'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Tag, ShoppingCart, Edit3, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import LiquidGlass from '../LiquidGlass'
import { useListingData } from '@/hooks/use-marketplace-data'
import { useApprovalStatus, useApproveMarketplace, useCreateListing, useBuyListing, useCancelListing, useUpdateListingPrice } from '@/hooks/use-marketplace-contract'
import { formatEth } from '@/utils/marketplace-utils'
import { useReadContract, useChainId } from 'wagmi'
import { contractAddresses, onchainRugsABI } from '@/lib/web3'
import { config } from '@/lib/config'

interface NFTDetailModalProps {
  tokenId: number
  isOpen: boolean
  onClose: () => void
  nftData: any // Full NFT data including traits, aging, etc.
}

type ModalView = 'details' | 'create-listing' | 'update-listing'

export default function NFTDetailModal({ tokenId, isOpen, onClose, nftData }: NFTDetailModalProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [currentView, setCurrentView] = useState<ModalView>('details')
  const [listingPrice, setListingPrice] = useState('')

  // Get contract address (no fallback for safety)
  const contractAddress = contractAddresses[chainId]

  // Fetch owner from contract (more reliable than Alchemy data)
  const { data: ownerAddress, isLoading: ownerLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)]
  })

  // Marketplace hooks
  const { listing, isLoading: listingLoading } = useListingData(tokenId)
  const { approved, isLoading: approvalLoading } = useApprovalStatus(tokenId)
  const approveMarketplace = useApproveMarketplace(tokenId)
  const createListing = useCreateListing()
  const buyListing = useBuyListing()
  const cancelListing = useCancelListing()
  const updateListingPrice = useUpdateListingPrice()

  // Check if user is the owner using contract data
  const isOwner = isConnected && address?.toLowerCase() === ownerAddress?.toLowerCase()
  const isListingActive = listing?.isActive
  const canList = isOwner && !isListingActive && approved
  const canBuy = isConnected && !isOwner && isListingActive

  // Auto-refresh after successful transactions
  useEffect(() => {
    if (approveMarketplace.isConfirmed || createListing.isConfirmed || 
        buyListing.isConfirmed || cancelListing.isConfirmed || 
        updateListingPrice.isConfirmed) {
      console.log('Transaction confirmed - refreshing modal data...')
      // Trigger a page reload to refresh all data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }, [
    approveMarketplace.isConfirmed,
    createListing.isConfirmed,
    buyListing.isConfirmed,
    cancelListing.isConfirmed,
    updateListingPrice.isConfirmed
  ])

  if (!isOpen) return null

  const handleCreateListing = async () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) return

    try {
      await createListing.createListing(tokenId, listingPrice)
      setCurrentView('details')
      setListingPrice('')
    } catch (error) {
      console.error('Failed to create listing:', error)
    }
  }

  const handleBuyListing = async () => {
    if (!listing?.price) return

    try {
      await buyListing.buyListing(tokenId, formatEth(listing.price))
    } catch (error) {
      console.error('Failed to buy listing:', error)
    }
  }

  const handleCancelListing = async () => {
    try {
      await cancelListing.cancelListing(tokenId)
    } catch (error) {
      console.error('Failed to cancel listing:', error)
    }
  }

  const handleUpdatePrice = async () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) return

    try {
      await updateListingPrice.updateListingPrice(tokenId, listingPrice)
      setCurrentView('details')
      setListingPrice('')
    } catch (error) {
      console.error('Failed to update listing price:', error)
    }
  }

  const renderModalContent = () => {
    switch (currentView) {
      case 'create-listing':
        return <CreateListingView
          price={listingPrice}
          setPrice={setListingPrice}
          onSubmit={handleCreateListing}
          onCancel={() => setCurrentView('details')}
          isLoading={createListing.isPending}
        />

      case 'update-listing':
        return <UpdateListingView
          currentPrice={listing?.price}
          price={listingPrice}
          setPrice={setListingPrice}
          onSubmit={handleUpdatePrice}
          onCancel={() => setCurrentView('details')}
          isLoading={updateListingPrice.isPending}
        />

      default:
        return <DetailsView
          tokenId={tokenId}
          nftData={nftData}
          listing={listing}
          ownerAddress={ownerAddress}
          ownerLoading={ownerLoading}
          isConnected={isConnected}
          isOwner={isOwner}
          canList={canList}
          canBuy={canBuy}
          approved={approved}
          approvalLoading={approvalLoading}
          onApprove={() => approveMarketplace.approve()}
          onCreateListing={() => setCurrentView('create-listing')}
          onUpdateListing={() => setCurrentView('update-listing')}
          onBuy={handleBuyListing}
          onCancel={handleCancelListing}
          approveLoading={approveMarketplace.isPending}
          buyLoading={buyListing.isPending}
          cancelLoading={cancelListing.isPending}
        />
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/20 backdrop-blur-sm"
      >
          <LiquidGlass
            blurAmount={0.15}
            aberrationIntensity={2}
            elasticity={0.1}
            cornerRadius={16}
          >
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                  Rug #{tokenId}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              {renderModalContent()}
            </div>
        </LiquidGlass>
      </motion.div>
    </AnimatePresence>
  )
}


// Details View Component
function DetailsView({
  tokenId,
  nftData,
  listing,
  ownerAddress,
  ownerLoading,
  isConnected,
  isOwner,
  canList,
  canBuy,
  approved,
  approvalLoading,
  onApprove,
  onCreateListing,
  onUpdateListing,
  onBuy,
  onCancel,
  approveLoading,
  buyLoading,
  cancelLoading
}: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - NFT Preview */}
      <div>
        <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 mb-4">
          {nftData?.animation_url ? (
            <iframe
              src={nftData.animation_url}
              className="w-full h-full"
              title={`Rug #${tokenId}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60">
              Loading...
            </div>
          )}
        </div>

        {/* NFT Traits */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Traits</h3>
          <div className="grid grid-cols-2 gap-3">
            {nftData?.traits && Object.entries(nftData.traits).map(([key, value]: [string, any]) => (
              <div key={key} className="bg-white/10 rounded-lg p-3 border border-white/20">
                <div className="text-xs text-white/70 uppercase tracking-wide">{key}</div>
                <div className="text-sm font-medium text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Details & Actions */}
      <div className="space-y-6">
        {/* Listing Status */}
        {listing?.isActive && (
          <div className="bg-green-500/20 border border-green-400/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-green-300" />
              <span className="text-green-200 font-medium">Listed for Sale</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatEth(listing.price)} ETH
            </div>
            <div className="text-sm text-green-100">
              Listed by: {listing.seller?.slice(0, 6)}...{listing.seller?.slice(-4)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Loading state */}
          {ownerLoading && (
            <div className="text-center text-white/80 py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
              Loading ownership data...
            </div>
          )}

          {/* Not connected */}
          {!isConnected && !ownerLoading && (
            <div className="text-center text-white/80 py-4">
              Connect your wallet to interact with this NFT
            </div>
          )}

          {/* Connected but ownership not determined yet */}
          {isConnected && ownerLoading && (
            <div className="text-center text-white/80 py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
              Checking ownership...
            </div>
          )}

          {/* Owner actions */}
          {isOwner && !ownerLoading && (
            <>
              {!approved && (
                <button
                  onClick={onApprove}
                  disabled={approveLoading || approvalLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {approveLoading || approvalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {approveLoading ? 'Approving...' : 'Approve Marketplace'}
                </button>
              )}

              {approved && !listing?.isActive && (
                <button
                  onClick={onCreateListing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  Create Listing
                </button>
              )}

              {listing?.isActive && (
                <div className="space-y-2">
                  <button
                    onClick={onUpdateListing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Update Price
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={cancelLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {cancelLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {cancelLoading ? 'Cancelling...' : 'Cancel Listing'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Buy actions for non-owners */}
          {canBuy && (
            <button
              onClick={onBuy}
              disabled={buyLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {buyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {buyLoading ? 'Buying...' : `Buy for ${formatEth(listing.price)} ETH`}
            </button>
          )}

          {/* Cannot interact messages */}
          {!isOwner && !canBuy && !ownerLoading && isConnected && (
            <div className="text-center text-white/60 py-4">
              {listing?.isActive ? 'You cannot buy your own listing' : 'This NFT is not for sale'}
            </div>
          )}

          {/* Not the owner and connected */}
          {!isOwner && !ownerLoading && isConnected && !listing?.isActive && (
            <div className="text-center text-white/60 py-4">
              You do not own this NFT
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Create Listing View Component
function CreateListingView({ price, setPrice, onSubmit, onCancel, isLoading }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Create Listing</h3>
        <p className="text-white/80">Set a price for your NFT</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Price (ETH)</label>
        <input
          type="number"
          step="0.001"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.1"
          className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading || !price || parseFloat(price) <= 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-white/10 disabled:text-white/40 text-white rounded-lg transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Tag className="w-4 h-4" />
          )}
          {isLoading ? 'Creating...' : 'Create Listing'}
        </button>
      </div>
    </div>
  )
}

// Update Listing View Component
function UpdateListingView({ currentPrice, price, setPrice, onSubmit, onCancel, isLoading }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Update Listing Price</h3>
        <p className="text-white/80">Current price: {formatEth(currentPrice)} ETH</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">New Price (ETH)</label>
        <input
          type="number"
          step="0.001"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={formatEth(currentPrice)}
          className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading || !price || parseFloat(price) <= 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/40 text-white rounded-lg transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Edit3 className="w-4 h-4" />
          )}
          {isLoading ? 'Updating...' : 'Update Price'}
        </button>
      </div>
    </div>
  )
}
