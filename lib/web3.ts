/**
 * Web3 configuration and utilities
 */

import { createConfig, http } from 'wagmi'
import { config as appConfig } from './config'

// Chain configurations
export const shapeSepolia = {
  id: 11011,
  name: 'Shape Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-shape-sepolia.alt.technology'],
    },
    public: {
      http: ['https://rpc-shape-sepolia.alt.technology'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shape Sepolia Explorer',
      url: 'https://sepolia-explorer.shape.alt.technology',
    },
  },
  testnet: true,
}

export const shapeMainnet = {
  id: 11011,
  name: 'Shape Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-shape.alt.technology'],
    },
    public: {
      http: ['https://rpc-shape.alt.technology'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shape Explorer',
      url: 'https://explorer.shape.alt.technology',
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

// Contract ABI (minimal for now)
export const onchainRugsABI = [
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
] as const

// Contract addresses
export const contractAddresses = {
  [shapeSepolia.id]: appConfig.contracts.onchainRugs,
  [shapeMainnet.id]: appConfig.contracts.onchainRugs,
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

export default wagmiConfig
