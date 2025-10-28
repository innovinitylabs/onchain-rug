/**
 * Web3 configuration and utilities
 */

import { createConfig, http } from 'wagmi'
import { createPublicClient, encodeFunctionData, decodeFunctionResult } from 'viem'
import { config as appConfig } from './config'

// Chain configurations
export const shapeSepolia = {
  id: 11011, // Shape Sepolia testnet chain ID
  name: 'Shape Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_SHAPE_SEPOLIA_RPC || 'https://sepolia.shape.network'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_SHAPE_SEPOLIA_RPC || 'https://sepolia.shape.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shape Sepolia Explorer',
      url: 'https://sepolia.shapescan.xyz',
    },
  },
  testnet: true,
}

export const shapeMainnet = {
  id: 360, // Shape mainnet chain ID
  name: 'Shape Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_SHAPE_MAINNET_RPC || 'https://mainnet.shape.network'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_SHAPE_MAINNET_RPC || 'https://mainnet.shape.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shape Explorer',
      url: 'https://shapescan.xyz',
    },
  },
  testnet: false,
}

export const baseSepolia = {
  id: 84532, // Base Sepolia testnet chain ID
  name: 'Base Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Base Sepolia Explorer',
      url: 'https://sepolia-explorer.base.org',
    },
  },
  testnet: true,
}

export const baseMainnet = {
  id: 8453, // Base mainnet chain ID
  name: 'Base Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || 'https://mainnet.base.org'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || 'https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Base Explorer',
      url: 'https://basescan.org',
    },
  },
  testnet: false,
}

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: [shapeSepolia, shapeMainnet, baseSepolia, baseMainnet],
  transports: {
    [shapeSepolia.id]: http(),
    [shapeMainnet.id]: http(),
    [baseSepolia.id]: http(),
    [baseMainnet.id]: http(),
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

// Contract addresses per network
// No fallback - safer to fail than use wrong contract on wrong network
export const contractAddresses: Record<number, string | undefined> = {
  [shapeSepolia.id]: process.env.NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT,
  [shapeMainnet.id]: process.env.NEXT_PUBLIC_SHAPE_MAINNET_CONTRACT,
  [baseSepolia.id]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT,
  [baseMainnet.id]: process.env.NEXT_PUBLIC_BASE_MAINNET_CONTRACT,
}

// Alchemy NFT API Configuration
export const alchemyConfig = {
  apiKey: appConfig.alchemyApiKey,
  network: 'base-sepolia', // Base Sepolia testnet (default - changed from shape-sepolia)
  baseUrl: 'https://base-sepolia.g.alchemy.com/nft/v3'
}

// Helper function to get Alchemy NFT API URL based on chain ID
export function getAlchemyNftApiUrl(chainId: number): string {
  const apiKey = appConfig.alchemyApiKey
  
  switch (chainId) {
    case shapeSepolia.id: // 11011
      return `https://shape-sepolia.g.alchemy.com/nft/v3/${apiKey}`
    case shapeMainnet.id: // 360
      return `https://shape-mainnet.g.alchemy.com/nft/v3/${apiKey}`
    case baseSepolia.id: // 84532
      return `https://base-sepolia.g.alchemy.com/nft/v3/${apiKey}`
    case baseMainnet.id: // 8453
      return `https://base-mainnet.g.alchemy.com/nft/v3/${apiKey}`
    default:
      // Default to Base Sepolia
      return `https://base-sepolia.g.alchemy.com/nft/v3/${apiKey}`
  }
}

// Utility functions
export function getContractAddress(chainId: number): string {
  return contractAddresses[chainId] || ''
}

export function isSupportedChain(chainId: number): boolean {
  return chainId === shapeSepolia.id || chainId === shapeMainnet.id || 
         chainId === baseSepolia.id || chainId === baseMainnet.id
}

export function getChainName(chainId: number): string {
  switch (chainId) {
    case shapeSepolia.id:
      return 'Shape Sepolia'
    case shapeMainnet.id:
      return 'Shape Mainnet'
    case baseSepolia.id:
      return 'Base Sepolia'
    case baseMainnet.id:
      return 'Base Mainnet'
    default:
      return 'Unknown'
  }
}

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
    let alchemyRpcUrl: string
    if (chainId === shapeSepolia.id) {
      alchemyRpcUrl = 'https://shape-sepolia.g.alchemy.com/public'
    } else if (chainId === shapeMainnet.id) {
      alchemyRpcUrl = `https://shape-mainnet.g.alchemy.com/v2/${appConfig.alchemyApiKey}`
    } else if (chainId === baseSepolia.id) {
      alchemyRpcUrl = `https://base-sepolia.g.alchemy.com/v2/${appConfig.alchemyApiKey}`
    } else if (chainId === baseMainnet.id) {
      alchemyRpcUrl = `https://base-mainnet.g.alchemy.com/v2/${appConfig.alchemyApiKey}`
    } else {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }

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

    // Fallback to native RPC (Shape or Base)
    try {
      let chain
      if (chainId === shapeSepolia.id) {
        chain = shapeSepolia
      } else if (chainId === shapeMainnet.id) {
        chain = shapeMainnet
      } else if (chainId === baseSepolia.id) {
        chain = baseSepolia
      } else if (chainId === baseMainnet.id) {
        chain = baseMainnet
      } else {
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
      throw new Error(`All RPC endpoints failed: ${alchemyError.message} | ${shapeError.message}`)
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
