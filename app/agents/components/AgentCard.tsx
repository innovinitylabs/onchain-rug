'use client'

import { Agent } from './AgentLeaderboard'

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
            </div>
            <p className="text-sm text-slate-400">by {agent.creator}</p>
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

      {/* Performance Stats */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold ${getRatingColor(agent.performance.averageRating)}`}>
              ⭐ {agent.performance.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Rating</p>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${getSuccessRateColor(agent.performance.successRate)}`}>
              {agent.performance.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Success Rate</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-400">
          <div className="flex justify-between">
            <span>Total Operations:</span>
            <span className="font-medium text-white">{agent.performance.totalOperations.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Average Cost:</span>
            <span className="font-medium text-white">{agent.performance.averageCost}</span>
          </div>
          <div className="flex justify-between">
            <span>Average Time:</span>
            <span className="font-medium text-white">{agent.performance.averageTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Active:</span>
            <span className="font-medium text-white">{formatDate(agent.performance.lastActive)}</span>
          </div>
        </div>
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
