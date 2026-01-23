import { useMemo } from 'react'
import {
  useAllAgents,
  useAgentCard,
  useAgentReputation,
  useAgentFeedbackHistory,
  useAgentValidationProofs,
  transformAgentCard,
  transformAgentReputation,
  transformAgentFeedback,
  transformValidationProofs,
  calculateReputationScore,
  type AgentData,
} from './use-agent-contracts'

// Re-export for component usage
export type { AgentData }

// Combined hook for fetching complete agent leaderboard data
export function useAgentLeaderboard() {
  const { data: agentAddresses, isLoading: addressesLoading, error: addressesError } = useAllAgents()

  // Fetch data for all agents
  const agentData = useMemo(() => {
    if (!agentAddresses) return []

    return agentAddresses.map((address: string) => {
      const { data: cardData } = useAgentCard(address)
      const { data: reputationData } = useAgentReputation(address)
      const { data: feedbackData } = useAgentFeedbackHistory(address)
      const { data: validationData } = useAgentValidationProofs(address)

      return {
        address,
        card: cardData ? transformAgentCard(cardData) : null,
        reputation: reputationData ? transformAgentReputation(reputationData) : null,
        feedbackHistory: feedbackData ? transformAgentFeedback(feedbackData) : [],
        validationProofs: validationData ? transformValidationProofs(validationData) : [],
      }
    })
  }, [agentAddresses])

  // Process and filter complete agent data
  const processedAgents = useMemo(() => {
    return agentData
      .filter((agent: any) => agent.card && agent.reputation) // Only include agents with complete data
      .map((agent: any) => ({
        ...agent,
        reputation: {
          ...agent.reputation,
          reputationScore: calculateReputationScore(agent.reputation),
        },
      }))
  }, [agentData])

  return {
    agents: processedAgents,
    isLoading: addressesLoading,
    error: addressesError,
    totalAgents: processedAgents.length,
  }
}

// Hook for individual agent details
export function useAgentDetails(agentAddress: string) {
  const { data: cardData, isLoading: cardLoading } = useAgentCard(agentAddress)
  const { data: reputationData, isLoading: reputationLoading } = useAgentReputation(agentAddress)
  const { data: feedbackData, isLoading: feedbackLoading } = useAgentFeedbackHistory(agentAddress)
  const { data: validationData, isLoading: validationLoading } = useAgentValidationProofs(agentAddress)

  const agentDetails = useMemo(() => {
    if (!cardData || !reputationData) return null

    const reputation = transformAgentReputation(reputationData)
    const reputationScore = calculateReputationScore(reputation)

    return {
      address: agentAddress,
      card: transformAgentCard(cardData),
      reputation: {
        ...reputation,
        reputationScore,
      },
      feedbackHistory: feedbackData ? transformAgentFeedback(feedbackData) : [],
      validationProofs: validationData ? transformValidationProofs(validationData) : [],
    }
  }, [agentAddress, cardData, reputationData, feedbackData, validationData])

  return {
    agent: agentDetails,
    isLoading: cardLoading || reputationLoading || feedbackLoading || validationLoading,
  }
}

// Hook for filtering and sorting agents
export function useFilteredAgents(agents: AgentData[], filters?: {
  capabilities?: string[]
  minRating?: number
  activeOnly?: boolean
  sortBy?: 'rating' | 'operations' | 'successRate' | 'registration'
}) {
  const { capabilities, minRating = 0, activeOnly = true, sortBy = 'rating' } = filters || {}

  const filteredAgents = useMemo(() => {
    let filtered = agents

    // Filter by active status
    if (activeOnly) {
      filtered = filtered.filter(agent => agent.card.active)
    }

    // Filter by minimum rating
    if (minRating > 0) {
      filtered = filtered.filter(agent => agent.reputation.reputationScore >= minRating)
    }

    // Filter by capabilities
    if (capabilities && capabilities.length > 0) {
      filtered = filtered.filter(agent =>
        capabilities.some(cap => agent.card.capabilities.includes(cap))
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
          return b.card.registeredAt - a.card.registeredAt
        default:
          return 0
      }
    })

    return filtered
  }, [agents, capabilities, minRating, activeOnly, sortBy])

  return filteredAgents
}