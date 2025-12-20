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
    <div className={`bg-white rounded-lg shadow-sm border-2 ${
      agent.isOfficial ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
    } overflow-hidden hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {agent.name}
              </h3>
              {agent.isOfficial && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Official
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">by {agent.creator}</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {agent.description}
        </p>

        {/* Capabilities */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Capabilities</h4>
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.map((capability) => (
              <span
                key={capability}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
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

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total Operations:</span>
            <span className="font-medium">{agent.performance.totalOperations.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Average Cost:</span>
            <span className="font-medium">{agent.performance.averageCost}</span>
          </div>
          <div className="flex justify-between">
            <span>Average Time:</span>
            <span className="font-medium">{agent.performance.averageTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Active:</span>
            <span className="font-medium">{formatDate(agent.performance.lastActive)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Registered {formatDate(agent.registeredAt)}</span>
          <div className="flex gap-2">
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              View Details
            </button>
            {agent.metadataURI && (
              <a
                href={agent.metadataURI}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
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
