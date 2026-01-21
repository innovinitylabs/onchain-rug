"use client"

import { useReferralRegistration } from '@/hooks/use-referral-registration'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Share2, CheckCircle, Loader2, Twitter, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'

export function ReferralCodeDisplay() {
  const {
    isRegistered,
    referralCode,
    isLoading,
    register,
    getSharingUrl,
    address
  } = useReferralRegistration()

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

  const shareReferral = async () => {
    const url = getSharingUrl()
    const text = `Check out OnchainRugs! Use my referral code for exclusive benefits: ${url}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OnchainRugs Referral',
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
    const text = encodeURIComponent(`Check out OnchainRugs! Use my referral code and get exclusive benefits 🎨✨`)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const shareToWhatsApp = () => {
    const url = getSharingUrl()
    const text = `Check out OnchainRugs! Use my referral code for exclusive benefits: ${url}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const shareToTelegram = () => {
    const url = encodeURIComponent(getSharingUrl())
    const text = encodeURIComponent(`Check out OnchainRugs! Use my referral code for exclusive benefits 🎨✨`)
    const telegramUrl = `https://t.me/share/url?url=${url}&text=${text}`
    window.open(telegramUrl, '_blank', 'noopener,noreferrer')
  }

  if (!referralCode) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Referral Program</CardTitle>
          <CardDescription>
            Connect your wallet to see your referral code
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Referral Program
          {isRegistered && <CheckCircle className="w-5 h-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Share your referral link and earn 5% commission on purchases
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Registration Status */}
        {!isRegistered ? (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                🚀 Start Earning Commissions
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your wallet generates a unique referral code automatically. Register to start earning 5% commission on every mint and marketplace purchase made through your link.
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
                'Register for Commissions'
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
                Your referral code is active. Share your link to start earning commissions on every transaction.
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 5% commission on mints and purchases</p>
              <p>• Automatic payouts to your wallet</p>
              <p>• Track earnings in your dashboard</p>
            </div>
          </div>
        )}

        {/* Referral Code Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-green-300">Your Referral Code</label>
          <div className="flex gap-2">
            <input
              value={referralCode}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-900 border border-green-500/50 text-green-400 rounded text-sm font-mono focus:ring-1 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={() => copyToClipboard(referralCode)}
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
          <label className="text-sm font-medium text-green-300">Your Referral Link</label>
          <div className="flex gap-2">
            <input
              value={getSharingUrl()}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-900 border border-green-500/50 text-green-400 rounded text-xs font-mono focus:ring-1 focus:ring-green-500 focus:border-transparent"
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
            <label className="text-sm font-medium text-green-300">Share on Social Media</label>
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
                onClick={shareReferral}
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
      </CardContent>
    </Card>
  )
}