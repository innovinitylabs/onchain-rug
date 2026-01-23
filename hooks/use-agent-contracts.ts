import { useAccount, useReadContract, useChainId } from 'wagmi'
import { contractAddresses } from '@/lib/web3'

// Agent Registry ABI - ERC-8004 Identity Registry
const agentRegistryABI = [
  {
    inputs: [],
    name: 'getAllAgents',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getActiveAgents',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'agentAddress', type: 'address' }],
    name: 'getAgentCard',
    outputs: [
      {
        components: [
          { name: 'agentId', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'evmAddress', type: 'address' },
          { name: 'capabilities', type: 'string[]' },
          { name: 'metadataURI', type: 'string' },
          { name: 'registeredAt', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'agentAddress', type: 'address' }],
    name: 'isAgentRegistered',
    outputs: [{ name: 'isRegistered', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Agent Reputation ABI - ERC-8004 Reputation Registry
const agentReputationABI = [
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'getReputation',
    outputs: [
      {
        components: [
          { name: 'totalTasks', type: 'uint256' },
          { name: 'totalFeedback', type: 'uint256' },
          { name: 'averageAccuracy', type: 'uint256' },
          { name: 'averageTimeliness', type: 'uint256' },
          { name: 'averageReliability', type: 'uint256' },
          { name: 'reputationScore', type: 'uint256' },
        ],
        name: 'reputation',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'getFeedbackHistory',
    outputs: [
      {
        components: [
          { name: 'client', type: 'address' },
          { name: 'taskId', type: 'uint256' },
          { name: 'accuracy', type: 'uint8' },
          { name: 'timeliness', type: 'uint8' },
          { name: 'reliability', type: 'uint8' },
          { name: 'comment', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
        ],
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Agent Validation ABI - ERC-8004 Validation Registry
const agentValidationABI = [
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'getAgentProofs',
    outputs: [
      {
        components: [
          { name: 'proofId', type: 'bytes32' },
          { name: 'taskId', type: 'uint256' },
          { name: 'proofType', type: 'string' },
          { name: 'proofData', type: 'bytes' },
          { name: 'validator', type: 'address' },
          { name: 'verified', type: 'bool' },
          { name: 'timestamp', type: 'uint256' },
        ],
        name: 'proofs',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ERC-8004 Agent Card Structure
export interface AgentCard {
  agentId: string
  name: string
  description: string
  evmAddress: string
  capabilities: string[]
  metadataURI: string
  registeredAt: number
  updatedAt: number
  active: boolean
}

// ERC-8004 Reputation Structure
export interface AgentReputation {
  totalTasks: number
  totalFeedback: number
  averageAccuracy: number // 1-5 scale (scaled to basis points)
  averageTimeliness: number // 1-5 scale (scaled to basis points)
  averageReliability: number // 1-5 scale (scaled to basis points)
  reputationScore: number // Calculated composite score
}

// ERC-8004 Feedback Structure
export interface AgentFeedback {
  client: string
  taskId: number
  accuracy: number // 1-5
  timeliness: number // 1-5
  reliability: number // 1-5
  comment: string
  timestamp: number
}

// ERC-8004 Validation Proof Structure
export interface ValidationProof {
  proofId: string
  taskId: number
  proofType: string
  proofData: string
  validator: string
  verified: boolean
  timestamp: number
}

// Combined Agent Data Structure (for leaderboard)
export interface AgentData {
  address: string
  card: AgentCard
  reputation: AgentReputation
  feedbackHistory: AgentFeedback[]
  validationProofs: ValidationProof[]
}

// ========== HOOKS ==========

/**
 * Hook to get all registered agents
 */
export function useAllAgents() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: agentRegistryABI,
    functionName: 'getAllAgents',
    query: {
      enabled: !!contractAddress,
    },
  })
}

/**
 * Hook to get all active agents
 */
export function useActiveAgents() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: agentRegistryABI,
    functionName: 'getActiveAgents',
    query: {
      enabled: !!contractAddress,
    },
  })
}

/**
 * Hook to get agent card for a specific agent
 */
export function useAgentCard(agentAddress: string) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: agentRegistryABI,
    functionName: 'getAgentCard',
    args: [agentAddress as `0x${string}`],
    query: {
      enabled: !!contractAddress && !!agentAddress,
    },
  })
}

/**
 * Hook to check if an agent is registered
 */
export function useIsAgentRegistered(agentAddress: string) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: agentRegistryABI,
    functionName: 'isAgentRegistered',
    args: [agentAddress as `0x${string}`],
    query: {
      enabled: !!contractAddress && !!agentAddress,
    },
  })
}

/**
 * Hook to get agent reputation
 */
export function useAgentReputation(agentAddress: string) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: agentReputationABI,
    functionName: 'getReputation',
    args: [agentAddress as `0x${string}`],
    query: {
      enabled: !!contractAddress && !!agentAddress,
    },
  })
}

/**
 * Hook to get agent feedback history
 */
export function useAgentFeedbackHistory(agentAddress: string) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: agentReputationABI,
    functionName: 'getFeedbackHistory',
    args: [agentAddress as `0x${string}`],
    query: {
      enabled: !!contractAddress && !!agentAddress,
    },
  })
}

/**
 * Hook to get agent validation proofs
 */
export function useAgentValidationProofs(agentAddress: string) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  return useReadContract({
    address: contractAddress as `0x${string}`,
    abi: agentValidationABI,
    functionName: 'getAgentProofs',
    args: [agentAddress as `0x${string}`],
    query: {
      enabled: !!contractAddress && !!agentAddress,
    },
  })
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Transform raw contract data to AgentCard interface
 */
export function transformAgentCard(rawData: any): AgentCard {
  return {
    agentId: rawData.agentId,
    name: rawData.name,
    description: rawData.description,
    evmAddress: rawData.evmAddress,
    capabilities: rawData.capabilities,
    metadataURI: rawData.metadataURI,
    registeredAt: Number(rawData.registeredAt),
    updatedAt: Number(rawData.updatedAt),
    active: rawData.active,
  }
}

/**
 * Transform raw contract data to AgentReputation interface
 */
export function transformAgentReputation(rawData: any): AgentReputation {
  return {
    totalTasks: Number(rawData.totalTasks),
    totalFeedback: Number(rawData.totalFeedback),
    averageAccuracy: Number(rawData.averageAccuracy) / 100, // Convert from basis points to 1-5 scale
    averageTimeliness: Number(rawData.averageTimeliness) / 100, // Convert from basis points to 1-5 scale
    averageReliability: Number(rawData.averageReliability) / 100, // Convert from basis points to 1-5 scale
    reputationScore: Number(rawData.reputationScore),
  }
}

/**
 * Transform raw contract data to AgentFeedback array
 */
export function transformAgentFeedback(rawData: readonly any[]): AgentFeedback[] {
  return rawData.map((feedback: any) => ({
    client: feedback.client,
    taskId: Number(feedback.taskId),
    accuracy: Number(feedback.accuracy),
    timeliness: Number(feedback.timeliness),
    reliability: Number(feedback.reliability),
    comment: feedback.comment,
    timestamp: Number(feedback.timestamp),
  }))
}

/**
 * Transform raw contract data to ValidationProof array
 */
export function transformValidationProofs(rawData: readonly any[]): ValidationProof[] {
  return rawData.map((proof: any) => ({
    proofId: proof.proofId,
    taskId: Number(proof.taskId),
    proofType: proof.proofType,
    proofData: proof.proofData,
    validator: proof.validator,
    verified: proof.verified,
    timestamp: Number(proof.timestamp),
  }))
}

/**
 * Calculate combined reputation score (0-100 scale)
 * Based on ERC-8004 reputation algorithm
 */
export function calculateReputationScore(reputation: AgentReputation): number {
  if (reputation.totalFeedback === 0) return 0

  // Weight the three metrics equally (33.33% each)
  const accuracyScore = (reputation.averageAccuracy / 5) * 33.33
  const timelinessScore = (reputation.averageTimeliness / 5) * 33.33
  const reliabilityScore = (reputation.averageReliability / 5) * 33.33

  // Add volume bonus (up to 10% for high task completion)
  const volumeBonus = Math.min(reputation.totalTasks / 100, 1) * 10

  return Math.min(accuracyScore + timelinessScore + reliabilityScore + volumeBonus, 100)
}