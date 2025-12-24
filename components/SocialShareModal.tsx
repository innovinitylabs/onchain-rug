'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Twitter, Share2, MessageCircle, Zap, Sparkles } from 'lucide-react'
import { useAccount, useChainId } from 'wagmi'
import { getExplorerUrl } from '@/lib/networks'

function getExplorerTxUrl(chainId: number, txHash: string): string {
  const baseUrl = getExplorerUrl(chainId)
  if (baseUrl) {
    return `${baseUrl}/tx/${txHash}`
  }
  return ''
}

export type ShareAction = 'mint' | 'purchase' | 'clean' | 'restore' | 'masterRestore' | 'view'

interface SocialShareModalProps {
  isOpen: boolean
  onClose: () => void
  action: ShareAction
  tokenId?: number
  txHash?: string
  imageUrl?: string // URL to the NFT image for sharing
  additionalData?: {
    price?: string
    actionName?: string
  }
}

interface SharePlatform {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  getShareUrl: (params: ShareParams) => string
}

interface ShareParams {
  text: string
  url: string
  action: ShareAction
  tokenId?: number
  txHash?: string
}

const platforms: SharePlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: <Twitter className="w-5 h-5" />,
    color: 'bg-black hover:bg-gray-800',
    getShareUrl: ({ text, url }) => {
      const encodedText = encodeURIComponent(text)
      const encodedUrl = encodeURIComponent(url)
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    }
  },
  {
    id: 'base',
    name: 'Base App',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-blue-600 hover:bg-blue-700',
    getShareUrl: ({ text, url }) => {
      // Base App uses a custom URL scheme or can be shared via Twitter with Base tag
      const encodedText = encodeURIComponent(`${text} 🟦`)
      const encodedUrl = encodeURIComponent(url)
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=Base,OnchainRugs`
    }
  },
  {
    id: 'farcaster',
    name: 'Farcaster',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'bg-purple-600 hover:bg-purple-700',
    getShareUrl: ({ text, url }) => {
      // Farcaster share via Warpcast
      const encodedText = encodeURIComponent(`${text}\n\n${url}`)
      return `https://warpcast.com/~/compose?text=${encodedText}`
    }
  },
  {
    id: 'warpcast',
    name: 'Warpcast',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'bg-purple-500 hover:bg-purple-600',
    getShareUrl: ({ text, url }) => {
      const encodedText = encodeURIComponent(`${text}\n\n${url}`)
      return `https://warpcast.com/~/compose?text=${encodedText}`
    }
  },
  {
    id: 'lens',
    name: 'Lens Protocol',
    icon: <Share2 className="w-5 h-5" />,
    color: 'bg-green-600 hover:bg-green-700',
    getShareUrl: ({ text, url }) => {
      // Lens Protocol share - opens in Lens app or via URL
      const encodedText = encodeURIComponent(`${text} ${url}`)
      return `https://lenster.xyz/?text=${encodedText}`
    }
  }
]

function generateShareText(
  action: ShareAction,
  tokenId?: number,
  additionalData?: { price?: string; actionName?: string }
): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.onchainrugs.xyz'
  const tokenText = tokenId ? ` #${tokenId}` : ''
  const rugUrl = tokenId ? `${baseUrl}/rug-market?tokenId=${tokenId}` : baseUrl
  
  switch (action) {
    case 'mint':
      return `🎨 Just minted my OnchainRug${tokenText}! Check it out: ${rugUrl}`
    
    case 'purchase':
      const priceText = additionalData?.price ? ` for ${additionalData.price} ETH` : ''
      return `🛒 Just purchased OnchainRug${tokenText}${priceText}! ${rugUrl}`
    
    case 'clean':
      return `✨ Just cleaned my OnchainRug${tokenText}! Keeping it fresh on-chain. ${rugUrl}`
    
    case 'restore':
      return `🔧 Just restored my OnchainRug${tokenText}! Bringing it back to life. ${rugUrl}`
    
    case 'masterRestore':
      return `🌟 Master restored my OnchainRug${tokenText}! Like new again! ${rugUrl}`
    
    case 'view':
      return `🧵 Check out this OnchainRug${tokenText}! ${rugUrl}`
    
    default:
      return `Just interacted with OnchainRug${tokenText}! ${rugUrl}`
  }
}

function generateShareUrl(tokenId?: number, txHash?: string, chainId?: number): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.onchainrugs.xyz'
  
  if (tokenId) {
    return `${baseUrl}/rug-market?tokenId=${tokenId}`
  }
  
  if (txHash && chainId) {
    const explorerUrl = getExplorerTxUrl(chainId, txHash)
    return explorerUrl || `${baseUrl}`
  }
  
  return baseUrl
}

export function SocialShareModal({
  isOpen,
  onClose,
  action,
  tokenId,
  txHash,
  imageUrl,
  additionalData
}: SocialShareModalProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const shareText = generateShareText(action, tokenId, additionalData)
  const shareUrl = generateShareUrl(tokenId, txHash, chainId)

  const handleShare = (platform: SharePlatform) => {
    // Use shareUrl which points to the rug page with Open Graph meta tags
    // Social platforms will automatically fetch the image from OG tags
    // Don't include imageUrl in the text as it makes URLs too long
    const url = platform.getShareUrl({
      text: shareText,
      url: shareUrl, // This URL will have OG meta tags with the image
      action,
      tokenId,
      txHash
    })
    
    window.open(url, '_blank', 'width=600,height=400')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: `OnchainRug${tokenId ? ` #${tokenId}` : ''}`,
          text: shareText,
          url: shareUrl
        }
        
        // Include image if available and platform supports it
        if (imageUrl && navigator.canShare && navigator.canShare({ ...shareData, files: [] })) {
          // For native share with image, we'd need to fetch and convert to File
          // For now, just share the URL which will use Open Graph
        }
        
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled')
      }
    }
  }

  const actionEmoji = {
    mint: '🎨',
    purchase: '🛒',
    clean: '✨',
    restore: '🔧',
    masterRestore: '🌟',
    view: '🧵'
  }[action]

  const actionText = {
    mint: 'Minted',
    purchase: 'Purchased',
    clean: 'Cleaned',
    restore: 'Restored',
    masterRestore: 'Master Restored',
    view: 'Share Rug'
  }[action]

  // Use portal to render modal at document body level, ensuring it appears above all content
  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
                {actionEmoji}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{actionText} Successfully!</h2>
                <p className="text-sm text-white/60">Share your achievement</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share Platforms */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform)}
                className={`${platform.color} text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95`}
              >
                {platform.icon}
                <span className="text-sm font-medium">{platform.name}</span>
              </button>
            ))}
          </div>

          {/* Native Share (Mobile) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 mb-3 hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share via...</span>
            </button>
          )}

          {/* Copy Link */}
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <p className="text-xs text-white/60 text-center">
            Share your OnchainRug journey with the community!
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

