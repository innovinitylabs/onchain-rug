/**
 * Centralized Network Configuration
 *
 * This file contains all network metadata that is public knowledge.
 * Only API keys and private contract addresses should be in .env files.
 */

export interface NetworkConfig {
  chainId: number
  name: string
  displayName: string
  rpcUrl: string
  envRpcKey: string
  explorerUrl: string
  explorerApiUrl?: string
  alchemyNetwork: string
  isTestnet: boolean
  blockExplorerName: string
}

// Supported networks configuration
export const NETWORKS: Record<string, NetworkConfig> = {
  ethereumSepolia: {
    chainId: 11155111,
    name: 'ethereum-sepolia',
    displayName: 'Ethereum Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    envRpcKey: 'NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC',
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
    alchemyNetwork: 'eth-sepolia',
    isTestnet: true,
    blockExplorerName: 'Etherscan Sepolia'
  },
  shapeSepolia: {
    chainId: 11011,
    name: 'shape-sepolia',
    displayName: 'Shape Sepolia',
    rpcUrl: 'https://sepolia.shape.network',
    envRpcKey: 'NEXT_PUBLIC_SHAPE_SEPOLIA_RPC',
    explorerUrl: 'https://sepolia.shapescan.xyz',
    explorerApiUrl: 'https://explorer-sepolia.shape.network/api',
    alchemyNetwork: 'shape-sepolia',
    isTestnet: true,
    blockExplorerName: 'Shape Sepolia Explorer'
  },
  shapeMainnet: {
    chainId: 360,
    name: 'shape-mainnet',
    displayName: 'Shape Mainnet',
    rpcUrl: 'https://mainnet.shape.network',
    envRpcKey: 'NEXT_PUBLIC_SHAPE_MAINNET_RPC',
    explorerUrl: 'https://shapescan.xyz',
    explorerApiUrl: 'https://shapescan.xyz/api',
    alchemyNetwork: 'shape-mainnet',
    isTestnet: false,
    blockExplorerName: 'Shape Explorer'
  },
  baseSepolia: {
    chainId: 84532,
    name: 'base-sepolia',
    displayName: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    envRpcKey: 'NEXT_PUBLIC_BASE_SEPOLIA_RPC',
    explorerUrl: 'https://sepolia-explorer.base.org',
    explorerApiUrl: 'https://api-sepolia.basescan.org/api',
    alchemyNetwork: 'base-sepolia',
    isTestnet: true,
    blockExplorerName: 'Base Sepolia Explorer'
  },
  baseMainnet: {
    chainId: 8453,
    name: 'base-mainnet',
    displayName: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    envRpcKey: 'NEXT_PUBLIC_BASE_MAINNET_RPC',
    explorerUrl: 'https://basescan.org',
    explorerApiUrl: 'https://api.basescan.org/api',
    alchemyNetwork: 'base-mainnet',
    isTestnet: false,
    blockExplorerName: 'Base Explorer'
  },
  // Example: Adding a new test network is now trivial
  testNet: {
    chainId: 99999,
    name: 'test-net',
    displayName: 'TestNet',
    rpcUrl: 'https://testnet.example.com',
    envRpcKey: 'NEXT_PUBLIC_TEST_NET_RPC',
    explorerUrl: 'https://testnetscan.example.com',
    alchemyNetwork: 'test-net',
    isTestnet: true,
    blockExplorerName: 'TestNet Explorer'
  }
}

// Array of all supported networks
export const SUPPORTED_NETWORKS = Object.values(NETWORKS)

// Array of supported chain IDs
export const SUPPORTED_CHAIN_IDS = SUPPORTED_NETWORKS.map(net => net.chainId)

// Default network (can be overridden via environment)
export const DEFAULT_NETWORK = NETWORKS.baseSepolia // Base Sepolia as default

// Utility functions
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return SUPPORTED_NETWORKS.find(net => net.chainId === chainId)
}

export function getNetworkByName(name: string): NetworkConfig | undefined {
  return NETWORKS[name]
}

export function isSupportedChain(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId)
}

export function getChainName(chainId: number): string {
  const network = getNetworkByChainId(chainId)
  return network?.displayName || 'Unknown Network'
}

export function getChainDisplayName(chainId: number): string {
  const network = getNetworkByChainId(chainId)
  return network?.displayName || `Chain ${chainId}`
}

export function isTestnet(chainId: number): boolean {
  const network = getNetworkByChainId(chainId)
  return network?.isTestnet || false
}

export function isMainnet(chainId: number): boolean {
  return !isTestnet(chainId)
}

export function getExplorerUrl(chainId: number): string {
  const network = getNetworkByChainId(chainId)
  return network?.explorerUrl || ''
}

export function getAlchemyNetwork(chainId: number): string {
  const network = getNetworkByChainId(chainId)
  return network?.alchemyNetwork || 'base-sepolia' // fallback
}

export function getAlchemyBaseUrl(chainId: number): string {
  const alchemyNetwork = getAlchemyNetwork(chainId)
  return `https://${alchemyNetwork}.g.alchemy.com/nft/v3`
}

export function getRpcUrl(chainId: number): string {
  const network = getNetworkByChainId(chainId)
  if (!network) return ''

  // Check for environment override
  const envRpc = process.env[network.envRpcKey]
  return envRpc || network.rpcUrl
}

// Contract addresses (still configurable via env vars for different deployments)
export const CONTRACT_ADDRESSES: Record<number, string | undefined> = {
  [NETWORKS.ethereumSepolia.chainId]: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_CONTRACT || process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT,
  [NETWORKS.shapeSepolia.chainId]: process.env.NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT || process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT,
  [NETWORKS.shapeMainnet.chainId]: process.env.NEXT_PUBLIC_SHAPE_MAINNET_CONTRACT || process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT,
  [NETWORKS.baseSepolia.chainId]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT || process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT,
  [NETWORKS.baseMainnet.chainId]: process.env.NEXT_PUBLIC_BASE_MAINNET_CONTRACT || process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT,
  [NETWORKS.testNet.chainId]: process.env.NEXT_PUBLIC_TEST_NET_CONTRACT || process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT,
}

export function getContractAddress(chainId: number): string {
  return CONTRACT_ADDRESSES[chainId] || ''
}

/**
 * Get multicall address for a specific chain
 * Uses the contract address from .env (same address as the NFT contract)
 * Falls back to default Multicall3 address if contract address not found
 */
export function getMulticallAddress(chainId: number): string {
  // Use the contract address as multicall address (same contract)
  const contractAddress = getContractAddress(chainId)
  if (contractAddress) {
    return contractAddress
  }
  // Fallback: Use env var if set
  if (process.env.MULTICALL_ADDRESS) {
    return process.env.MULTICALL_ADDRESS
  }
  // Final fallback: Default Multicall3 address (works on most modern EVM chains)
  return '0xcA11bde05977b3631167028862bE2a173976CA11'
}

// Default chain ID (configurable via env var)
export const DEFAULT_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || '') || DEFAULT_NETWORK.chainId
