'use client'

import { useRoyaltyInfo, useMarketplaceFee } from '@/hooks/use-royalty-info'
import { formatEth } from '@/utils/marketplace-utils'

interface RoyaltyBreakdownProps {
  tokenId: number
  listingPrice: bigint
}

export default function RoyaltyBreakdown({ tokenId, listingPrice }: RoyaltyBreakdownProps) {
  const { royaltyAmount, royaltyPercentage, isLoading: royaltyLoading } = useRoyaltyInfo(tokenId, listingPrice)
  const { marketplaceFeePercent, calculateMarketplaceFee } = useMarketplaceFee()

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

  // Calculate fees
  const marketplaceFee = calculateMarketplaceFee(listingPrice)
  const totalDeductions = (royaltyAmount || BigInt(0)) + marketplaceFee
  const sellerReceives = listingPrice - totalDeductions

  return (
    <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
        <h4 className="text-blue-200 font-medium text-sm">Purchase Breakdown</h4>
      </div>

      <div className="space-y-2 text-sm">
        {/* Listing Price */}
        <div className="flex justify-between text-white/90">
          <span>Listing Price:</span>
          <span className="font-medium">{formatEth(listingPrice)} ETH</span>
        </div>

        {/* Creator Royalty */}
        {royaltyAmount && royaltyAmount > BigInt(0) && (
          <div className="flex justify-between text-green-300">
            <span>Creator Royalty ({royaltyPercentage}%):</span>
            <span>-{formatEth(royaltyAmount)} ETH</span>
          </div>
        )}

        {/* Marketplace Fee */}
        <div className="flex justify-between text-purple-300">
          <span>Marketplace Fee ({marketplaceFeePercent}%):</span>
          <span>-{formatEth(marketplaceFee)} ETH</span>
        </div>

        {/* Separator */}
        <div className="border-t border-blue-400/30 pt-2 mt-3">
          {/* Total Paid */}
          <div className="flex justify-between text-white font-medium mb-1">
            <span>You Pay:</span>
            <span>{formatEth(listingPrice)} ETH</span>
          </div>

          {/* Seller Receives */}
          <div className="flex justify-between text-green-300 text-xs">
            <span>Seller Receives:</span>
            <span>{formatEth(sellerReceives)} ETH</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-blue-200/70 mt-3 pt-2 border-t border-blue-400/20">
        💰 Royalties support creators and ensure fair compensation for their work
      </div>
    </div>
  )
}
