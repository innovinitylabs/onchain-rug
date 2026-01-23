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
    <Card className="w-full bg-white border-amber-200/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
          ERC-8021 Attribution System
          {isRegistered && <CheckCircle className="w-5 h-5 text-green-600" />}
        </CardTitle>
        <CardDescription className="text-amber-700">
          Share your ERC-8021 attribution link and earn 5% commission on purchases
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Registration Status */}
          <div className="space-y-4">
            {/* Registration Status */}
            {!isRegistered ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    🚀 Start Earning Commissions
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Your wallet generates a unique ERC-8021 attribution code automatically. Register to start earning 5% commission on every mint and marketplace purchase made through your link.
                  </p>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• One-time gas fee (~$0.01-0.05)</p>
                  <p>• Earn on all future referrals</p>
                  <p>• No monthly fees or requirements</p>
                </div>

                {/* Registration Button */}
                <button
                  onClick={register}
                  disabled={isLoading || !address}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-mono text-sm transition-colors border border-green-500"
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
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                    ✅ Successfully Registered!
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your ERC-8021 attribution code is active. Share your link to start earning commissions on every transaction.
                  </p>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 5% commission on mints and purchases</p>
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
              <label className="text-sm font-medium text-amber-800">Your ERC-8021 Attribution Code</label>
              <div className="flex gap-2">
                <input
                  value={attributionCode}
                  readOnly
                  className="flex-1 px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded text-sm font-mono focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  onClick={() => copyToClipboard(attributionCode)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded font-mono text-sm transition-colors border border-amber-500 shrink-0"
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
              <label className="text-sm font-medium text-amber-800">Your ERC-8021 Attribution Link</label>
              <div className="flex gap-2">
                <input
                  value={getSharingUrl()}
                  readOnly
                  className="flex-1 px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  onClick={() => copyToClipboard(getSharingUrl())}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded font-mono text-sm transition-colors border border-amber-500 shrink-0"
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
                <label className="text-sm font-medium text-amber-800">Share on Social Media</label>
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
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded font-mono text-sm transition-colors border border-gray-500 flex items-center gap-2"
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