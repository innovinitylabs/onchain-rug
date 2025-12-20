'use client'

import { useState, useEffect } from 'react'
import { AgentCard } from './AgentCard'
import { LeaderboardTable } from './LeaderboardTable'
import { EducationalInsights } from './EducationalInsights'
import { X402Showcase } from './X402Showcase'

interface Agent {
  id: string
  name: string
  creator: string
  capabilities: string[]
  performance: {
    successRate: number
    averageRating: number
    totalOperations: number
    lastActive: string
    averageCost: string
    averageTime: string
  }
  isOfficial: boolean
  description: string
  metadataURI?: string
  registeredAt: string
}

// Mock data - replace with actual contract calls
const mockAgents: Agent[] = [
  {
    id: 'onchainrug-official-v1',
    name: 'OnchainRug Official Agent',
    creator: 'OnchainRugs Team',
    capabilities: ['rug_cleaning', 'rug_restoration', 'rug_analysis', 'rug_maintenance'],
    performance: {
      successRate: 95.2,
      averageRating: 4.8,
      totalOperations: 1247,
      lastActive: '2024-12-20T10:30:00Z',
      averageCost: '0.0008 ETH',
      averageTime: '2.3 minutes'
    },
    isOfficial: true,
    description: 'Official AI agent for OnchainRugs NFT maintenance. Uses advanced analysis for optimal cleaning strategies.',
    registeredAt: '2024-12-15T00:00:00Z'
  }
]

export function AgentLeaderboard() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [sortBy, setSortBy] = useState<'rating' | 'operations' | 'successRate'>('rating')
  const [loading, setLoading] = useState(false)

  // Sort agents based on selected criteria
  const sortedAgents = [...agents].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.performance.averageRating - a.performance.averageRating
      case 'operations':
        return b.performance.totalOperations - a.performance.totalOperations
      case 'successRate':
        return b.performance.successRate - a.performance.successRate
      default:
        return 0
    }
  })

  const fetchAgents = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual contract calls
      // const agentsData = await contract.getAllAgents()
      // const reputationData = await contract.getAllReputations()
      // const validationData = await contract.getAllValidations()

      // For now, keep mock data
      setAgents(mockAgents)
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  return (
    <div className="space-y-8">
      {/* View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Agent Rankings</h2>
          <p className="text-gray-600">Performance-based leaderboard for educational insights</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="operations">Sort by Operations</option>
            <option value="successRate">Sort by Success Rate</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'cards'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } ${viewMode === 'cards' ? 'rounded-l-md' : ''} border-r border-gray-300`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } ${viewMode === 'table' ? 'rounded-r-md' : ''}`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Agent Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent leaderboard...</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <LeaderboardTable agents={sortedAgents} />
      )}

      {/* Educational Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EducationalInsights />
        <X402Showcase />
      </div>

      {/* Community Call-to-Action */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-8 text-white">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">🚀 Build Your Own Agent</h3>
          <p className="text-lg mb-6 opacity-90">
            Fork our open-source agent, customize it, and register it here.
            Help drive x402 adoption and NFT AI innovation!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/innovinitylabs/onchain-rug/tree/main/standalone-ai-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              📖 View Agent Code
            </a>
            <a
              href="/docs/agent-api"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
            >
              🛠️ API Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
