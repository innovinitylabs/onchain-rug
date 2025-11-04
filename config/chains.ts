import { NETWORKS, getNetworkByChainId, CONTRACT_ADDRESSES } from '@/lib/networks'
import { shapeSepolia, shapeMainnet, baseMainnet, baseSepolia } from '@/lib/web3'

export type ChainMetadata = {
  name: string
  chainId: number
  rpcUrl: string
  nativeSymbol: string
  contractAddress?: string
}

export const CHAINS: Record<string, ChainMetadata> = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    nativeSymbol: 'ETH',
  },
  base: {
    name: 'Base Mainnet',
    chainId: NETWORKS.baseMainnet.chainId,
    rpcUrl: NETWORKS.baseMainnet.rpcUrl,
    nativeSymbol: 'ETH',
    contractAddress: CONTRACT_ADDRESSES[NETWORKS.baseMainnet.chainId],
  },
  shapeMainnet: {
    name: 'Shape Mainnet',
    chainId: NETWORKS.shapeMainnet.chainId,
    rpcUrl: NETWORKS.shapeMainnet.rpcUrl,
    nativeSymbol: 'ETH',
    contractAddress: CONTRACT_ADDRESSES[NETWORKS.shapeMainnet.chainId],
  },
  shapeSepolia: {
    name: 'Shape Sepolia',
    chainId: NETWORKS.shapeSepolia.chainId,
    rpcUrl: NETWORKS.shapeSepolia.rpcUrl,
    nativeSymbol: 'ETH',
    contractAddress: CONTRACT_ADDRESSES[NETWORKS.shapeSepolia.chainId],
  },
}

export function getChainById(chainId: number): ChainMetadata | undefined {
  const net = getNetworkByChainId(chainId)
  if (!net) return undefined
  return {
    name: net.displayName,
    chainId: net.chainId,
    rpcUrl: net.rpcUrl,
    nativeSymbol: 'ETH',
    contractAddress: CONTRACT_ADDRESSES[net.chainId],
  }
}

export function getDestinationShapeChainId(): number {
  const target = (process.env.NEXT_PUBLIC_SHAPE_TARGET || '').toLowerCase()
  if (target === 'mainnet') return shapeMainnet.id
  return shapeSepolia.id
}

export function getDestinationContractAddress(): string | undefined {
  const destId = getDestinationShapeChainId()
  return CONTRACT_ADDRESSES[destId]
}

export const DESTINATION_SHAPE_ID = getDestinationShapeChainId()

export function getWagmiChainById(chainId: number) {
  const map: Record<number, any> = {
    [shapeSepolia.id]: shapeSepolia,
    [shapeMainnet.id]: shapeMainnet,
    [baseMainnet.id]: baseMainnet,
    [baseSepolia.id]: baseSepolia,
  }
  return map[chainId]
}


