'use client'

import { ExternalLink, AlertCircle } from 'lucide-react'
import { useExternalMarketplaces } from '@/hooks/use-marketplace'
import { useMarketplace } from '@/hooks/use-marketplace'

interface RugMarketplaceProps {
  tokenId: number
  isOwner?: boolean
  currentPrice?: string
  isListed?: boolean
}

export function RugMarketplace({ tokenId, isOwner = false, currentPrice, isListed = false }: RugMarketplaceProps) {
  const { getMarketplaceUrls } = useExternalMarketplaces(tokenId)
  const { getMarketplaceListings } = useMarketplace()

  const marketplaceUrls = getMarketplaceUrls()
  const listings = getMarketplaceListings(tokenId)

  return (
    <div className="space-y-3">
      {/* Current Listing Status */}
      {isListed || listings.length > 0 ? (
        <div className="bg-green-900/50 border border-green-500/30 rounded p-3">
          <div className="flex items-center justify-between">
            <div className="text-green-400 text-sm font-mono">
              {listings.length > 0
                ? `Listed on ${listings[0].marketplace} for ${listings[0].price} ETH`
                : 'Listed for sale'
              }
            </div>
            {isOwner && (
              <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">
                Your listing
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-500/30 rounded p-3">
          <div className="text-center text-gray-400 text-sm">
            Not currently listed for sale
          </div>
        </div>
      )}

      {/* Marketplace Links */}
      <div className="bg-blue-900/50 border border-blue-500/30 rounded p-3">
        <h4 className="text-white font-semibold mb-2 text-sm">Trade on Marketplaces</h4>
        <div className="grid grid-cols-1 gap-2">
          <a
            href={marketplaceUrls.opensea}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            OpenSea
          </a>
          <a
            href={marketplaceUrls.looksrare}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            LooksRare
          </a>
          <a
            href={marketplaceUrls.x2y2}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            X2Y2
          </a>
        </div>
      </div>

      {/* Info for owners */}
      {isOwner && (
        <div className="bg-yellow-900/50 border border-yellow-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>To sell your rug, list it on one of the marketplaces above</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Quick marketplace stats component
export function MarketplaceStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600/30">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">1,234</div>
        <div className="text-sm text-white/60">Total Volume</div>
        <div className="text-xs text-white/40">ETH</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-400">89</div>
        <div className="text-sm text-white/60">Listed</div>
        <div className="text-xs text-white/40">For Sale</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-400">0.005</div>
        <div className="text-sm text-white/60">Floor Price</div>
        <div className="text-xs text-white/40">ETH</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-400">156</div>
        <div className="text-sm text-white/60">Owners</div>
        <div className="text-xs text-white/40">Unique</div>
      </div>
    </div>
  )
}
