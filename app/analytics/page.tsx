'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { OverviewTab } from './components/tabs/OverviewTab'
import { ReferralsTab } from './components/tabs/ReferralsTab'
import { AgentsTab } from './components/tabs/AgentsTab'
import { AttributionTab } from './components/tabs/AttributionTab'

interface AnalyticsData {
  attribution: {
    totalEvents: number
    attributedEvents: number
    attributionRate: number
    mintEvents: number
    marketplaceEvents: number
    maintenanceEvents: number
  }
  referrals: {
    totalReferrers: number
    totalRewards: number
    totalDistributed: string
    avgReward: string
  }
  agents: {
    totalAgents: number
    totalFeedback: number
    avgRating: number
    totalTasks: number
  }
  timestamp: string
}

function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      // For now, show mock data since analytics API isn't deployed
      const mockData = {
        attribution: {
          totalEvents: 7, // NFTs minted
          attributedEvents: 0, // Will be populated when API is live
          attributionRate: 0,
          mintEvents: 7,
          marketplaceEvents: 0,
          maintenanceEvents: 0
        },
        referrals: {
          totalReferrers: 0,
          totalRewards: 0,
          totalDistributed: "0",
          avgReward: "0"
        },
        agents: {
          totalAgents: 0,
          totalFeedback: 0,
          avgRating: 0,
          totalTasks: 0
        },
        timestamp: new Date().toISOString()
      }

      setData(mockData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Analytics</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={fetchAnalyticsData}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[3200px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OnchainRugs Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            ERC-8021 Attribution & ERC-8004 Agent Analytics
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.attribution.totalEvents.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.attribution.attributedEvents} attributed ({data.attribution.attributionRate.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Referral Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.referrals.totalReferrers}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.referrals.totalDistributed} ETH distributed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                AI Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {data.agents.totalAgents}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.agents.totalFeedback} feedback entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Base Attribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                bc_os08vbrw
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Official Base builder code
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="attribution">Attribution</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab data={data} />
          </TabsContent>

          <TabsContent value="referrals" className="mt-6">
            <ReferralsTab />
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            <AgentsTab />
          </TabsContent>

          <TabsContent value="attribution" className="mt-6">
            <AttributionTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[3200px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OnchainRugs Analytics Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            ERC-8021 Attribution & ERC-8004 Agent Analytics
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Analytics API is not yet deployed. Showing sample data from Base Sepolia testnet.
                  7 NFTs have been minted so far. Live analytics will be available once the backend API is deployed.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Dashboard />
      </div>
    </div>
  )
}
