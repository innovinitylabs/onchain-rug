"use client"

import { useAttributionRegistration } from '@/hooks/use-attribution-registration'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Share2, CheckCircle, Loader2, Twitter, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'

export function AttributionCodeDisplay() {
  const {
    isRegistered,
    attributionCode,
    isLoading,
    register,
    getSharingUrl,
    address
  } = useAttributionRegistration()

  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareAttribution = async () => {
    const url = getSharingUrl()
    const text = `Check out OnchainRugs! Use my ERC-8021 attribution code for exclusive benefits: ${url}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OnchainRugs ERC-8021 Attribution',
          text,
          url,
        })
      } catch (err) {
        // Fallback to clipboard
        copyToClipboard(text)
      }
    } else {
      copyToClipboard(text)
    }
  }

  const shareToTwitter = () => {
    const url = encodeURIComponent(getSharingUrl())
    const text = encodeURIComponent(`Check out OnchainRugs! Use my ERC-8021 attribution code and get exclusive benefits 🎨✨`)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const shareToWhatsApp = () => {
    const url = getSharingUrl()
    const text = `Check out OnchainRugs! Use my ERC-8021 attribution code for exclusive benefits: ${url}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const shareToTelegram = () => {
    const url = encodeURIComponent(getSharingUrl())
    const text = encodeURIComponent(`Check out OnchainRugs! Use my ERC-8021 attribution code for exclusive benefits 🎨✨`)
    const telegramUrl = `https://t.me/share/url?url=${url}&text=${text}`
    window.open(telegramUrl, '_blank', 'noopener,noreferrer')
  }

  if (!attributionCode) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">ERC-8021 Attribution System</CardTitle>
          <CardDescription>
            Connect your wallet to see your ERC-8021 attribution code
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-slate-800 border-slate-700 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-slate-100">
          ERC-8021 Attribution System
          {isRegistered && <CheckCircle className="w-5 h-5 text-emerald-400" />}
        </CardTitle>
        <CardDescription className="text-slate-300">
          Share your ERC-8021 attribution link and earn 5% commission on purchases
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 bg-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Registration Status */}
          <div className="space-y-4">
            {/* Registration Status */}
            {!isRegistered ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <h4 className="font-medium text-slate-100 mb-1">
                    🚀 Start Earning Commissions
                  </h4>
                  <p className="text-sm text-slate-300">
                    Your wallet generates a unique ERC-8021 attribution code automatically. Register to start earning commission on every mint and marketplace purchase made through your link.
                  </p>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>• One-time gas fee (~$0.01-0.05)</p>
                  <p>• Earn Comission on all future referrals</p>
                  <p>• No monthly fees or requirements</p>
                </div>

                {/* Registration Button */}
                <button
                  onClick={register}
                  disabled={isLoading || !address}
                  className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-100 px-4 py-2 rounded font-mono text-sm transition-colors border border-slate-600"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering...
                    </div>
                  ) : (
                    'Register for ERC-8021 Attribution'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 rounded-lg border border-emerald-700/50">
                  <h4 className="font-medium text-emerald-400 mb-1">
                    ✅ Successfully Registered!
                  </h4>
                  <p className="text-sm text-slate-300">
                    Your ERC-8021 attribution code is active. Share your link to start earning commissions on every transaction.
                  </p>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>• Commission on mints and purchases</p>
                  <p>• Automatic payouts to your wallet</p>
                  <p>• Track earnings in your dashboard</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Attribution Code and Sharing */}
          <div className="space-y-4">
            {/* Attribution Code Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Your ERC-8021 Attribution Code</label>
              <div className="flex gap-2">
                <input
                  value={attributionCode}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 text-slate-100 rounded text-sm font-mono focus:ring-1 focus:ring-slate-400 focus:border-transparent"                />
                  <button
                    onClick={() => copyToClipboard(attributionCode)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded font-mono text-sm transition-colors border border-slate-600 shrink-0"
                  >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sharing URL */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-200">Your ERC-8021 Attribution Link</label>
               <div className="flex gap-2">
                <input
                  value={getSharingUrl()}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 text-slate-100 rounded text-xs font-mono focus:ring-1 focus:ring-slate-400 focus:border-transparent"
                />
                  <button
                    onClick={() => copyToClipboard(getSharingUrl())}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded font-mono text-sm transition-colors border border-slate-600 shrink-0"
                  >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Social Sharing Buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Share on Social Media</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={shareToTwitter}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-mono text-sm transition-colors border border-blue-500 flex items-center gap-2"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </button>
                  <button
                    onClick={shareToWhatsApp}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-mono text-sm transition-colors border border-green-500 flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={shareToTelegram}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded font-mono text-sm transition-colors border border-blue-400 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Telegram
                  </button>
                  <button
                    onClick={shareAttribution}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded font-mono text-sm transition-colors border border-slate-600 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    More
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Preview */}
            {isRegistered && (
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Earned</span>
                  <Badge variant="secondary">View Stats</Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}