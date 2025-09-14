/**
 * Web3 configuration and utilities
 */

import { createConfig, http } from 'wagmi'
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
      url: 'https://explorer-sepolia.shape.network',
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
