'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table'
import { Badge } from '../../../../components/ui/badge'
import { Coins, Users, TrendingUp, Award } from 'lucide-react'

interface ReferralData {
  overview: {
    totalReferrers: number
    totalRewards: number
    totalDistributed: string
    avgReward: string
    firstReward: string
    lastReward: string
  }
  topReferrers: Array<{
    referrer_address: string
    total_rewards: number
    total_amount: string
    avg_reward: string
    last_reward: string
  }>
  trends: Array<{
    date: string
    attributed: number
    total: number
  }>
}

export function ReferralsTab() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      const [overviewRes, topRes] = await Promise.all([
        fetch('/api/analytics/referrals/stats'),
        fetch('/api/analytics/referrals/top?limit=10')
      ])

      const overview = await overviewRes.json()
      const topReferrers = await topRes.json()

      setData({
        overview,
        topReferrers,
        trends: [] // Would come from trends API
      })
    } catch (error) {
      console.error('Failed to fetch referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading referral analytics...</div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Referral Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total Referrers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.overview.totalReferrers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4 text-green-600" />
              Total Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.overview.totalDistributed} ETH
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Avg Reward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.overview.avgReward} ETH
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-600" />
              Reward Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.overview.totalRewards}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
          <CardDescription>
            Users with the most successful referrals and highest rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer Address</TableHead>
                <TableHead className="text-right">Total Rewards</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Avg Reward</TableHead>
                <TableHead className="text-right">Last Reward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topReferrers.map((referrer, index) => (
                <TableRow key={referrer.referrer_address}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      {referrer.referrer_address.slice(0, 6)}...{referrer.referrer_address.slice(-4)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {referrer.total_rewards}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-semibold">
                    {referrer.total_amount} ETH
                  </TableCell>
                  <TableCell className="text-right">
                    {referrer.avg_reward} ETH
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    {new Date(referrer.last_reward).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Referral Program Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Program Performance</CardTitle>
            <CardDescription>Key metrics for referral program effectiveness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="font-semibold">
                {data.overview.totalReferrers > 0
                  ? ((data.overview.totalRewards / data.overview.totalReferrers) * 100).toFixed(1)
                  : 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">First Reward</span>
              <span className="font-semibold">
                {new Date(data.overview.firstReward).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Reward</span>
              <span className="font-semibold">
                {new Date(data.overview.lastReward).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Program Duration</span>
              <span className="font-semibold">
                {Math.ceil((new Date(data.overview.lastReward).getTime() -
                           new Date(data.overview.firstReward).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reward Distribution</CardTitle>
            <CardDescription>How referral rewards are distributed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-900">NFT Minting</div>
                  <div className="text-sm text-blue-700">5% of mint price</div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-900">Marketplace Sales</div>
                  <div className="text-sm text-green-700">5% of sale price</div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>

              <div className="text-center text-sm text-gray-500 mt-4">
                Rewards are automatically distributed to referrers when referred users complete transactions
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
