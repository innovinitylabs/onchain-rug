/**
 * Web3 configuration and utilities
 */

import { createConfig, http } from 'wagmi'
import { createPublicClient, encodeFunctionData, decodeFunctionResult } from 'viem'
import { config as appConfig } from './config'
import { NETWORKS, getRpcUrl, getNetworkByChainId } from './networks'

// Helper function to create Wagmi chain config from network config
function createChainConfig(networkKey: keyof typeof NETWORKS) {
  const network = NETWORKS[networkKey]
  return {
    id: network.chainId,
    name: network.displayName,
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: [getRpcUrl(network.chainId)],
      },
      public: {
        http: [getRpcUrl(network.chainId)],
      },
    },
    blockExplorers: {
      default: {
        name: network.blockExplorerName,
        url: network.explorerUrl,
      },
    },
    testnet: network.isTestnet,
  }
}

// Chain configurations (generated from centralized config)
export const ethereumSepolia = createChainConfig('ethereumSepolia')
export const shapeSepolia = createChainConfig('shapeSepolia')
export const shapeMainnet = createChainConfig('shapeMainnet')
export const baseSepolia = createChainConfig('baseSepolia')
export const baseMainnet = createChainConfig('baseMainnet')
export const testNet = createChainConfig('testNet')

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: [ethereumSepolia, shapeSepolia, shapeMainnet, baseSepolia, baseMainnet, testNet],
  transports: {
    [ethereumSepolia.id]: http(),
    [shapeSepolia.id]: http(),
    [shapeMainnet.id]: http(),
    [baseSepolia.id]: http(),
    [baseMainnet.id]: http(),
    [testNet.id]: http(),
  },
})

// Enhanced Contract ABI for Gallery functionality
export const onchainRugsABI = [
  // ERC721 Standard functions
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' }
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Custom functions for rug data
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'rugs',
    outputs: [
      { name: 'seed', type: 'uint256' },
      { name: 'paletteName', type: 'string' },
      { name: 'minifiedPalette', type: 'string' },
      { name: 'minifiedStripeData', type: 'string' },
      { name: 'textRows', type: 'string[]' },
      { name: 'warpThickness', type: 'uint8' },
      { name: 'mintTime', type: 'uint256' },
      { name: 'filteredCharacterMap', type: 'string' },
      { name: 'complexity', type: 'uint8' },
      { name: 'characterCount', type: 'uint256' },
      { name: 'stripeCount', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Minting function
  {
    inputs: [
      { name: 'textRows', type: 'string[]' },
      { name: 'palette', type: 'string' },
      { name: 'stripeData', type: 'string' },
      { name: 'characterMap', type: 'string' },
      { name: 'warpThickness', type: 'uint256' }
    ],
    name: 'mintWithText',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'cleanRug',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'restoreRug',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'masterRestoreRug',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Aging and maintenance view functions
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getDirtLevel',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getAgingLevel',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getFrameLevel',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getFrameName',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getMaintenanceScore',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getAgingState',
    outputs: [
      { name: 'lastCleaned', type: 'uint256' },
      { name: 'dirtLevel', type: 'uint8' },
      { name: 'agingLevel', type: 'uint8' },
      { name: 'frameLevel', type: 'uint8' },
      { name: 'frameName', type: 'string' },
      { name: 'maintenanceScore', type: 'uint256' },
      { name: 'hasDirt', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getServicePricing',
    outputs: [
      { name: 'cleaningCost', type: 'uint256' },
      { name: 'restorationCost', type: 'uint256' },
      { name: 'masterRestorationCost', type: 'uint256' },
      { name: 'launderingThreshold', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAgingThresholds',
    outputs: [
      { name: 'dirtLevel1Days', type: 'uint256' },
      { name: 'dirtLevel2Days', type: 'uint256' },
      { name: 'agingAdvanceDays', type: 'uint256' },
      { name: 'freeCleanDays', type: 'uint256' },
      { name: 'freeCleanWindow', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getMaintenanceOptions',
    outputs: [
      { name: 'canClean', type: 'bool' },
      { name: 'canRestore', type: 'bool' },
      { name: 'needsMaster', type: 'bool' },
      { name: 'cleaningCost', type: 'uint256' },
      { name: 'restorationCost', type: 'uint256' },
      { name: 'masterCost', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // AI Agent Authorization Functions
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'authorizeMaintenanceAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'revokeMaintenanceAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Agent Maintenance Functions
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'cleanRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'restoreRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'masterRestoreRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Fee Management Functions
  {
    inputs: [{ name: 'fee', type: 'uint256' }],
    name: 'setServiceFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAgentServiceFee',
    outputs: [
      { name: 'serviceFee', type: 'uint256' },
      { name: 'feeRecipient', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'recipient', type: 'address' }],
    name: 'setFeeRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events for listening to new mints
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event',
  },
] as const

// Contract addresses (imported from centralized config)
export { CONTRACT_ADDRESSES as contractAddresses } from './networks'

// Alchemy NFT API Configuration
export const alchemyConfig = {
  apiKey: appConfig.alchemyApiKey,
  network: 'base-sepolia', // Base Sepolia testnet (default - changed from shape-sepolia)
  baseUrl: 'https://base-sepolia.g.alchemy.com/nft/v3'
}

// Helper function to get Alchemy NFT API URL based on chain ID
export function getAlchemyNftApiUrl(chainId: number): string {
  const apiKey = appConfig.alchemyApiKey
  const alchemyNetwork = getNetworkByChainId(chainId)?.alchemyNetwork || 'base-sepolia'
  return `https://${alchemyNetwork}.g.alchemy.com/nft/v3/${apiKey}`
}

// Import utility functions from centralized config
import { getContractAddress, isSupportedChain, getChainName } from './networks'

// Re-export for backward compatibility
export { getContractAddress, isSupportedChain, getChainName }

// Alchemy RPC utilities for direct contract calls (Shape RPC as fallback)
export async function callContractWithAlchemyFallback(
  contractAddress: string,
  abi: readonly any[],
  functionName: string,
  args: any[] = [],
  chainId: number = shapeSepolia.id
) {
  // First try Alchemy RPC (primary)
  try {
    // Determine Alchemy RPC URL based on chain
    const network = getNetworkByChainId(chainId)
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }

    const alchemyNetwork = network.alchemyNetwork
    const alchemyRpcUrl = network.isTestnet
      ? `https://${alchemyNetwork}.g.alchemy.com/v2/${appConfig.alchemyApiKey}`
      : `https://${alchemyNetwork}.g.alchemy.com/public`

    const response = await fetch(alchemyRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: encodeFunctionData({
            abi,
            functionName,
            args
          })
        }, 'latest']
      })
    })

    if (!response.ok) {
      throw new Error(`Alchemy RPC error: ${response.status}`)
    }

    const result = await response.json()
    if (result.error) {
      throw new Error(`Alchemy RPC contract error: ${result.error.message}`)
    }

    // Decode the result based on the function's return type
    const functionAbi = abi.find(item => item.name === functionName && item.type === 'function')
    if (!functionAbi) {
      throw new Error(`Function ${functionName} not found in ABI`)
    }

    return decodeFunctionResult({
      abi: [functionAbi],
      functionName,
      data: result.result
    })
  } catch (alchemyError) {
    console.warn(`Alchemy RPC failed for ${functionName}, trying Shape fallback:`, alchemyError)

    // Fallback to native RPC
    try {
      const chains = { 
        [ethereumSepolia.id]: ethereumSepolia,
        [shapeSepolia.id]: shapeSepolia, 
        [shapeMainnet.id]: shapeMainnet, 
        [baseSepolia.id]: baseSepolia, 
        [baseMainnet.id]: baseMainnet 
      }
      const chain = chains[chainId]
      if (!chain) {
        throw new Error(`Unsupported chain ID: ${chainId}`)
      }

      const publicClient = createPublicClient({
        chain,
        transport: http()
      })

      const data = encodeFunctionData({
        abi,
        functionName,
        args
      })

      const result = await publicClient.call({
        to: contractAddress as `0x${string}`,
        data
      })

      // Decode the result
      const functionAbi = abi.find(item => item.name === functionName && item.type === 'function')
      if (!functionAbi) {
        throw new Error(`Function ${functionName} not found in ABI`)
      }

      return decodeFunctionResult({
        abi: [functionAbi],
        functionName,
        data: result.data
      })
    } catch (shapeError) {
      console.error(`Both Alchemy RPC and Shape RPC failed for ${functionName}:`, { alchemyError, shapeError })
      throw new Error(`All RPC endpoints failed: ${alchemyError instanceof Error ? alchemyError.message : String(alchemyError)} | ${shapeError instanceof Error ? shapeError.message : String(shapeError)}`)
    }
  }
}

// Enhanced contract call with multiple fallback options
export async function callContractMultiFallback(
  contractAddress: string,
  abi: readonly any[],
  functionName: string,
  args: any[] = [],
  options: {
    chainId?: number
    maxRetries?: number
    retryDelay?: number
  } = {}
) {
  const { chainId = shapeSepolia.id, maxRetries = 2, retryDelay = 1000 } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callContractWithAlchemyFallback(contractAddress, abi, functionName, args, chainId)
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      console.warn(`Contract call attempt ${attempt + 1} failed for ${functionName}, retrying in ${retryDelay}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
}

// Alchemy NFT API functions
export async function getNftsForCollection(contractAddress: string, options?: {
  pageKey?: string
  limit?: number
  withMetadata?: boolean
  chainId?: number
}) {
  const { pageKey, limit = 100, withMetadata = true, chainId = baseSepolia.id } = options || {}

  const params = new URLSearchParams({
    withMetadata: withMetadata.toString(),
    ...(limit && { limit: limit.toString() }),
    ...(pageKey && { pageKey })
  })

  const baseUrl = getAlchemyNftApiUrl(chainId)
  const url = `${baseUrl}/getNFTsForCollection?contractAddress=${contractAddress}&${params}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`)
  }

  return response.json()
}

export async function getNftMetadata(contractAddress: string, tokenId: string, options?: {
  refreshCache?: boolean
  chainId?: number
}) {
  const { refreshCache = false, chainId = baseSepolia.id } = options || {}
  
  const params = new URLSearchParams({
    ...(refreshCache && { refreshCache: 'true' })
  })

  const baseUrl = getAlchemyNftApiUrl(chainId)
  const url = `${baseUrl}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&${params}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`)
  }

  return response.json()
}

export async function getContractMetadata(contractAddress: string, chainId: number = baseSepolia.id) {
  const baseUrl = getAlchemyNftApiUrl(chainId)
  const url = `${baseUrl}/getContractMetadata?contractAddress=${contractAddress}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`)
  }

  return response.json()
}

export default wagmiConfig
