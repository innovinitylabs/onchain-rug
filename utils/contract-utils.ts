/**
 * Contract utilities and shared functions
 */

import { ethers } from 'ethers'
import { contractAddresses, onchainRugsABI, shapeSepolia, shapeMainnet, baseSepolia, baseMainnet } from '@/lib/web3'

// Contract address getter
export function getContractAddress(chainId: number): string {
  return contractAddresses[chainId] || '' // No fallback - safer to fail than use wrong contract
}

// Chain configurations
export const SUPPORTED_CHAINS = {
  [shapeSepolia.id]: shapeSepolia,
  [shapeMainnet.id]: shapeMainnet,
  [baseSepolia.id]: baseSepolia,
  [baseMainnet.id]: baseMainnet,
} as const

// Function selectors for manual eth_call
export const FUNCTION_SELECTORS = {
  tokenURI: '0xc87b56dd',
  getDirtLevel: '0x12345678', // This would need to be looked up from contract
  ownerOf: '0x6352211e',
  totalSupply: '0x18160ddd',
} as const

// ABI fragments for specific functions
export const CONTRACT_ABIS = {
  tokenURI: [
    {
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'tokenURI',
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
  ],
  getDirtLevel: [
    {
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'getDirtLevel',
      outputs: [{ name: '', type: 'uint8' }],
      stateMutability: 'view',
      type: 'function',
    },
  ],
  ownerOf: [
    {
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'ownerOf',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
  ],
} as const

// RPC URL getters
export function getAlchemyRpcUrl(chainId: number, apiKey: string): string {
  if (!apiKey) {
    throw new Error('ALCHEMY_API_KEY not configured')
  }

  switch (chainId) {
    case shapeSepolia.id:
      return `https://shape-sepolia.g.alchemy.com/v2/${apiKey}`
    case shapeMainnet.id:
      return `https://shape-mainnet.g.alchemy.com/v2/${apiKey}`
    case baseSepolia.id:
      return `https://base-sepolia.g.alchemy.com/v2/${apiKey}`
    case baseMainnet.id:
      return `https://base-mainnet.g.alchemy.com/v2/${apiKey}`
    default:
      return `https://base-sepolia.g.alchemy.com/v2/${apiKey}` // Default to Base Sepolia
  }
}

// Manual eth_call function
export async function manualEthCall(
  functionName: keyof typeof FUNCTION_SELECTORS,
  tokenId: number,
  chainId: number,
  apiKey: string
): Promise<string> {
  const contractAddress = getContractAddress(chainId)
  if (!contractAddress) {
    throw new Error(`Contract address not found for chain ${chainId}`)
  }

  const rpcUrl = getAlchemyRpcUrl(chainId, apiKey)
  const provider = new ethers.JsonRpcProvider(rpcUrl)

  const selector = FUNCTION_SELECTORS[functionName]
  const paddedTokenId = ethers.zeroPadValue(ethers.toBeHex(tokenId), 32).slice(2)
  const data = selector + paddedTokenId

  const result = await provider.call({
    to: contractAddress,
    data: data,
  })

  return result
}

// Decode contract call results
export function decodeContractResult(functionName: keyof typeof FUNCTION_SELECTORS, result: string): any {
  switch (functionName) {
    case 'tokenURI':
      // tokenURI returns a string, so decode as ["string"]
      return ethers.AbiCoder.defaultAbiCoder().decode(['string'], result)[0]
    case 'getDirtLevel':
      // getDirtLevel returns uint8
      return ethers.AbiCoder.defaultAbiCoder().decode(['uint8'], result)[0]
    case 'ownerOf':
      // ownerOf returns address
      return ethers.AbiCoder.defaultAbiCoder().decode(['address'], result)[0]
    default:
      throw new Error(`Unknown function: ${functionName}`)
  }
}
