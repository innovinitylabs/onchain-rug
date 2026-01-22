"use client"

import { useAttributionStats } from '@/hooks/use-attribution-registration'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEther } from 'viem'

export function AttributionStats() {
  const { address } = useAccount()
  const { stats, isLoading } = useAttributionStats(address || undefined)

  if (!address) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">ERC-8021 Attribution Statistics</CardTitle>
          <CardDescription>
            Connect your wallet to view attribution stats
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">ERC-8021 Attribution Statistics</CardTitle>
          <CardDescription>Loading your stats...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalReferrals = stats?.[0] || BigInt(0)
  const totalEarned = stats?.[1] || BigInt(0)
  const lastReferralTime = stats?.[2] || BigInt(0)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">ERC-8021 Attribution Statistics</CardTitle>
        <CardDescription>
          Your ERC-8021 attribution performance and earnings
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {totalReferrals.toString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Referrals
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Number(formatEther(totalEarned)).toFixed(4)}
            </div>
            <div className="text-sm text-muted-foreground">
              ETH Earned
            </div>
          </div>
        </div>

        {lastReferralTime > BigInt(0) && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Last Referral</span>
              <span className="text-xs px-2 py-1 rounded font-mono bg-amber-600 text-amber-100">
                {new Date(Number(lastReferralTime) * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {totalReferrals === BigInt(0) && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">
              No referrals yet. Share your referral link to start earning!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}