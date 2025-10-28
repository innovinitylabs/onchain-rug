'use client'

import { CheckCircle, ArrowRight, Heart } from 'lucide-react'
import { formatEth } from '@/utils/marketplace-utils'

interface PurchaseReceiptProps {
  tokenId: number
  price: bigint
  royaltyAmount: bigint
  marketplaceFee: bigint
  sellerReceived: bigint
  txHash: string
  onClose: () => void
}

export default function PurchaseReceipt({
  tokenId,
  price,
  royaltyAmount,
  marketplaceFee,
  sellerReceived,
  txHash,
  onClose
}: PurchaseReceiptProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-xl rounded-2xl border border-white/20 max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white text-center">Purchase Complete!</h2>
          <p className="text-white/60 text-center text-sm mt-1">
            You successfully purchased OnchainRug #{tokenId}
          </p>
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-4">
          {/* Amount Breakdown */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-white font-medium text-sm">Payment Breakdown</h3>

            <div className="space-y-2 text-sm">
              {/* Listing Price */}
              <div className="flex justify-between text-white/80">
                <span>Listing Price:</span>
                <span>{formatEth(price)} ETH</span>
              </div>

              {/* Creator Royalty */}
              {royaltyAmount > BigInt(0) && (
                <div className="flex justify-between text-orange-300">
                  <span>Creator Royalty:</span>
                  <span>-{formatEth(royaltyAmount)} ETH</span>
                </div>
              )}

              {/* Marketplace Fee */}
              <div className="flex justify-between text-purple-300">
                <span>Marketplace Fee:</span>
                <span>-{formatEth(marketplaceFee)} ETH</span>
              </div>

              {/* Separator */}
              <div className="border-t border-white/20 pt-2">
                <div className="flex justify-between text-white font-medium">
                  <span>You Paid:</span>
                  <span>{formatEth(price)} ETH</span>
                </div>
                <div className="flex justify-between text-green-300 text-xs mt-1">
                  <span>Seller Received:</span>
                  <span>{formatEth(sellerReceived)} ETH</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Message */}
          <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-orange-300 font-medium text-sm mb-1">Supporting Creators</h4>
                <p className="text-white/70 text-xs">
                  Your purchase helps creators earn from their work. Royalties ensure fair compensation for artists and builders in the ecosystem.
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Link */}
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Transaction:</span>
              <a
                href={`https://explorer.shape.network/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View on Explorer
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    </div>
  )
}
