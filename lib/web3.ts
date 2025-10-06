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
      http: ['https://sepolia.shape.network'],
    },
    public: {
      http: ['https://sepolia.shape.network'],
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
      http: ['https://mainnet.shape.network'],
    },
    public: {
      http: ['https://mainnet.shape.network'],
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

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: [shapeSepolia, shapeMainnet],
  transports: {
    [shapeSepolia.id]: http(),
    [shapeMainnet.id]: http(),
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

// Contract addresses
export const contractAddresses = {
  [shapeSepolia.id]: appConfig.contracts.onchainRugs,
  [shapeMainnet.id]: appConfig.contracts.onchainRugs,
}

// Alchemy NFT API Configuration
export const alchemyConfig = {
  apiKey: appConfig.alchemyApiKey,
  network: 'shape-sepolia', // Shape Sepolia testnet
  baseUrl: 'https://shape-sepolia.g.alchemy.com/nft/v3'
}

// Utility functions
export function getContractAddress(chainId: number): string {
  return contractAddresses[chainId] || ''
}

export function isSupportedChain(chainId: number): boolean {
  return chainId === shapeSepolia.id || chainId === shapeMainnet.id
}

export function getChainName(chainId: number): string {
  switch (chainId) {
    case shapeSepolia.id:
      return 'Shape Sepolia'
    case shapeMainnet.id:
      return 'Shape Mainnet'
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
    // Use public Alchemy RPC endpoint for Shape Sepolia (no API key needed)
    const alchemyRpcUrl = chainId === shapeSepolia.id
      ? 'https://shape-sepolia.g.alchemy.com/public'
      : `https://shape-mainnet.g.alchemy.com/v2/${appConfig.alchemyApiKey}`

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

    // Fallback to Shape RPC
    try {
      const publicClient = createPublicClient({
        chain: chainId === shapeSepolia.id ? shapeSepolia : shapeMainnet,
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
}) {
  const { pageKey, limit = 100, withMetadata = true } = options || {}

  const params = new URLSearchParams({
    withMetadata: withMetadata.toString(),
    ...(limit && { limit: limit.toString() }),
    ...(pageKey && { pageKey })
  })

  const url = `${alchemyConfig.baseUrl}/${alchemyConfig.apiKey}/getNFTsForCollection?contractAddress=${contractAddress}&${params}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`)
  }

  return response.json()
}

export async function getNftMetadata(contractAddress: string, tokenId: string, refreshCache = false) {
  const params = new URLSearchParams({
    ...(refreshCache && { refreshCache: 'true' })
  })

  const url = `${alchemyConfig.baseUrl}/${alchemyConfig.apiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&${params}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`)
  }

  return response.json()
}

export async function getContractMetadata(contractAddress: string) {
  const url = `${alchemyConfig.baseUrl}/${alchemyConfig.apiKey}/getContractMetadata?contractAddress=${contractAddress}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Alchemy API error: ${response.status}`)
  }

  return response.json()
}

export default wagmiConfig
