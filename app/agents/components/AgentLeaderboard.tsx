'use client'

import { useState, useMemo } from 'react'
import { AgentCard } from './AgentCard'
import { LeaderboardTable } from './LeaderboardTable'
import { EducationalInsights } from './EducationalInsights'
import { X402Showcase } from './X402Showcase'
import { useAgentLeaderboard, type AgentData } from '@/hooks/use-agent-leaderboard'

// ERC-8004 compliant Agent interface
export interface Agent {
  // Core ERC-8004 AgentCard fields
  id: string // agentId from contract
  name: string // Human-readable name
  description: string // Agent description
  address: string // EVM address
  capabilities: string[] // Array of capability strings
  metadataURI?: string // Optional off-chain metadata
  registeredAt: number // Registration timestamp
  updatedAt: number // Last update timestamp
  active: boolean // Active status

  // Reputation data (ERC-8004 Reputation Registry)
  performance: {
    successRate: number // Combined metric (0-100)
    averageRating: number // Overall reputation score (0-100)
    totalOperations: number // totalTasks from contract
    lastActive: string // From latest feedback timestamp
    averageCost: string // Placeholder for future pricing data
    averageTime: string // Placeholder for future performance data
  }

  // Additional data
  isOfficial: boolean // For highlighting official agents
  reputation: {
    totalTasks: number
    totalFeedback: number
    averageAccuracy: number
    averageTimeliness: number
    averageReliability: number
    reputationScore: number
  }
  feedbackHistory: Array<{
    client: string
    taskId: number
    accuracy: number
    timeliness: number
    reliability: number
    comment: string
    timestamp: number
  }>
  validationProofs: Array<{
    proofId: string
    taskId: number
    proofType: string
    proofData: string
    validator: string
    verified: boolean
    timestamp: number
  }>
}

// Transform contract data to component interface
function transformToAgentInterface(agentData: AgentData): Agent {
  // Calculate derived metrics
  const successRate = (agentData.reputation.averageAccuracy + agentData.reputation.averageTimeliness + agentData.reputation.averageReliability) / 3
  const averageRating = agentData.reputation.reputationScore / 20 // Convert 0-100 to 0-5 scale

  // Find last active timestamp from feedback
  const lastActive = agentData.feedbackHistory.length > 0
    ? new Date(Math.max(...agentData.feedbackHistory.map(f => f.timestamp * 1000))).toISOString()
    : new Date(agentData.card.registeredAt * 1000).toISOString()

  return {
    id: agentData.card.agentId,
    name: agentData.card.name,
    description: agentData.card.description,
    address: agentData.card.evmAddress,
    capabilities: agentData.card.capabilities,
    metadataURI: agentData.card.metadataURI || undefined,
    registeredAt: agentData.card.registeredAt,
    updatedAt: agentData.card.updatedAt,
    active: agentData.card.active,

    performance: {
      successRate: successRate * 20, // Convert to percentage
      averageRating: averageRating,
      totalOperations: agentData.reputation.totalTasks,
      lastActive: lastActive,
      averageCost: 'TBD', // TODO: Add pricing data when available
      averageTime: 'TBD', // TODO: Add performance metrics when available
    },

    isOfficial: agentData.card.agentId.includes('onchainrug') || agentData.card.agentId.includes('official'),
    reputation: agentData.reputation,
    feedbackHistory: agentData.feedbackHistory,
    validationProofs: agentData.validationProofs,
  }
}

export function AgentLeaderboard() {
  const { agents: rawAgents, isLoading, error } = useAgentLeaderboard()
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [sortBy, setSortBy] = useState<'rating' | 'operations' | 'successRate' | 'registration'>('rating')
  const [capabilityFilter, setCapabilityFilter] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number>(0)

  // Transform raw contract data to component interface
  const agents = useMemo(() => {
    return rawAgents.map(transformToAgentInterface)
  }, [rawAgents])

  // Apply filtering and sorting locally
  const filteredAgents = useMemo(() => {
    let filtered = agents

    // Filter by minimum rating
    if (minRating > 0) {
      filtered = filtered.filter(agent => agent.reputation.reputationScore >= minRating * 20) // Convert back to 0-100 scale
    }

    // Filter by capabilities
    if (capabilityFilter.length > 0) {
      filtered = filtered.filter(agent =>
        capabilityFilter.some(cap => agent.capabilities.includes(cap))
      )
    }

    // Sort agents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.reputation.reputationScore - a.reputation.reputationScore
        case 'operations':
          return b.reputation.totalTasks - a.reputation.totalTasks
        case 'successRate':
          // Calculate success rate based on feedback metrics
          const aSuccessRate = (a.reputation.averageAccuracy + a.reputation.averageTimeliness + a.reputation.averageReliability) / 3
          const bSuccessRate = (b.reputation.averageAccuracy + b.reputation.averageTimeliness + b.reputation.averageReliability) / 3
          return bSuccessRate - aSuccessRate
        case 'registration':
          return b.registeredAt - a.registeredAt
        default:
          return 0
      }
    })

    return filtered
  }, [agents, capabilityFilter, minRating, sortBy])

  // Get unique capabilities for filter dropdown
  const availableCapabilities = useMemo(() => {
    const capabilities = new Set<string>()
    agents.forEach(agent => {
      agent.capabilities.forEach(cap => capabilities.add(cap))
    })
    return Array.from(capabilities).sort()
  }, [agents])

  return (
    <div className="space-y-8">
      {/* View Controls */}
      <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Agent Rankings</h2>
            <p className="text-slate-400">ERC-8004 compliant agent leaderboard with real performance data</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-slate-600 rounded-md text-sm bg-slate-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">Sort by Rating</option>
              <option value="operations">Sort by Operations</option>
              <option value="successRate">Sort by Success Rate</option>
              <option value="registration">Sort by Registration</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-md border border-slate-600">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'cards'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                } ${viewMode === 'cards' ? 'rounded-l-md' : ''} border-r border-slate-600`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'table'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                } ${viewMode === 'table' ? 'rounded-r-md' : ''}`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-600/50">
          {/* Capability Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Filter by Capabilities
            </label>
            <select
              multiple
              value={capabilityFilter}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value)
                setCapabilityFilter(selected)
              }}
              className="w-full px-3 py-2 border border-slate-600 rounded-md text-sm bg-slate-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-24"
            >
              {availableCapabilities.map(cap => (
                <option key={cap} value={cap}>{cap}</option>
              ))}
            </select>
          </div>

          {/* Minimum Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Min Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-3 py-2 border border-slate-600 rounded-md text-sm bg-slate-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Any Rating</option>
              <option value={20}>2+ Stars</option>
              <option value={30}>3+ Stars</option>
              <option value={40}>4+ Stars</option>
              <option value={45}>4.5+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agent Display */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading ERC-8004 agent leaderboard...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-400 mb-2">Failed to load agent data</div>
          <p className="text-slate-400 text-sm">{error.message}</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400">No agents found matching your criteria</div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <LeaderboardTable agents={filteredAgents} />
      )}

      {/* Educational Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EducationalInsights />
        <X402Showcase />
      </div>

      {/* Community Call-to-Action */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
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
