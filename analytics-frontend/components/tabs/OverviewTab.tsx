'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Coins, Bot } from 'lucide-react'

interface OverviewTabProps {
  data: any
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export function OverviewTab({ data }: OverviewTabProps) {
  // Prepare data for transaction type breakdown
  const transactionData = [
    { name: 'NFT Mints', value: data.attribution.mintEvents, color: '#3B82F6' },
    { name: 'Marketplace', value: data.attribution.marketplaceEvents, color: '#10B981' },
    { name: 'Maintenance', value: data.attribution.maintenanceEvents, color: '#F59E0B' }
  ]

  // Sample attribution trends (would come from API)
  const attributionTrends = [
    { date: '2024-12-01', attributed: 45, total: 67 },
    { date: '2024-12-02', attributed: 52, total: 78 },
    { date: '2024-12-03', attributed: 38, total: 61 },
    { date: '2024-12-04', attributed: 61, total: 89 },
    { date: '2024-12-05', attributed: 55, total: 82 },
    { date: '2024-12-06', attributed: 67, total: 94 },
    { date: '2024-12-07', attributed: 58, total: 85 }
  ]

  return (
    <div className="space-y-6">
      {/* Transaction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Transaction Types
            </CardTitle>
            <CardDescription>
              Breakdown of attributed transactions by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={transactionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {transactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4 space-x-4">
              {transactionData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attribution Trends
            </CardTitle>
            <CardDescription>
              Daily attributed vs total transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attributionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar dataKey="total" fill="#E5E7EB" name="Total" />
                <Bar dataKey="attributed" fill="#3B82F6" name="Attributed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              User Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Attribution Rate</span>
                <span className="font-semibold text-blue-600">
                  {data.attribution.attributionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Attributed Transactions</span>
                <span className="font-semibold">
                  {data.attribution.attributedEvents}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Transactions</span>
                <span className="font-semibold">
                  {data.attribution.totalEvents}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-green-600" />
              Referral Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Referrers</span>
                <span className="font-semibold text-green-600">
                  {data.referrals.totalReferrers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Rewards</span>
                <span className="font-semibold">
                  {data.referrals.totalDistributed} ETH
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Reward</span>
                <span className="font-semibold">
                  {data.referrals.avgReward} ETH
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-purple-600" />
              AI Agent Ecosystem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Registered Agents</span>
                <span className="font-semibold text-purple-600">
                  {data.agents.totalAgents}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Rating</span>
                <span className="font-semibold">
                  {data.agents.avgRating.toFixed(1)}/5
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="font-semibold">
                  {data.agents.totalTasks}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
