'use client'

import { Agent } from './AgentLeaderboard'

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100'
    if (rating >= 4.0) return 'text-blue-600 bg-blue-100'
    if (rating >= 3.5) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 90) return 'text-blue-600'
    if (rate >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg border ${
      agent.isOfficial ? 'border-blue-400/30 bg-blue-900/10' : 'border-slate-700/50'
    } overflow-hidden hover:bg-slate-800/70 transition-all backdrop-blur-sm`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white truncate">
                {agent.name}
              </h3>
              {agent.isOfficial && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Official
                </span>
              )}
              {!agent.active && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-400/30">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-mono">{formatAddress(agent.address)}</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-4 line-clamp-2">
          {agent.description}
        </p>

        {/* Capabilities */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-white mb-2">Capabilities</h4>
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.map((capability) => (
              <span
                key={capability}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30"
              >
                {capability.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ERC-8004 Performance Stats */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold ${getRatingColor(agent.performance.averageRating)}`}>
              ⭐ {(agent.reputation.reputationScore / 20).toFixed(1)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Overall Rating</p>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${getSuccessRateColor(agent.performance.successRate)}`}>
              {agent.reputation.totalFeedback}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total Reviews</p>
          </div>
        </div>

        {/* ERC-8004 Detailed Metrics */}
        <div className="space-y-2 text-sm text-slate-400 mb-3">
          <div className="flex justify-between">
            <span>Accuracy:</span>
            <span className="font-medium text-white">{agent.reputation.averageAccuracy.toFixed(1)}/5</span>
          </div>
          <div className="flex justify-between">
            <span>Timeliness:</span>
            <span className="font-medium text-white">{agent.reputation.averageTimeliness.toFixed(1)}/5</span>
          </div>
          <div className="flex justify-between">
            <span>Reliability:</span>
            <span className="font-medium text-white">{agent.reputation.averageReliability.toFixed(1)}/5</span>
          </div>
          <div className="flex justify-between">
            <span>Total Tasks:</span>
            <span className="font-medium text-white">{agent.reputation.totalTasks}</span>
          </div>
        </div>

        {/* Validation Proofs Indicator */}
        {agent.validationProofs.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>{agent.validationProofs.filter(p => p.verified).length} Verified Proofs</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Registered {formatDate(agent.registeredAt)}</span>
          <div className="flex gap-2">
            <button className="text-blue-400 hover:text-blue-300 font-medium">
              View Details
            </button>
            {agent.metadataURI && (
              <a
                href={agent.metadataURI}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Metadata ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
