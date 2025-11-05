import { useChainId } from 'wagmi'
import { getContractAddress, getChainDisplayName, isSupportedChain, isTestnet, isMainnet, NETWORKS } from '@/lib/networks'

/**
 * Hook to get the correct contract address for the current network
 * Automatically detects user's connected network and returns appropriate contract
 */
export function useNetworkContract() {
  const chainId = useChainId()

  // Get contract address for current chain
  const contractAddress = getContractAddress(chainId)

  // Get network name from centralized config
  const networkName = getChainDisplayName(chainId)

  // Determine network types
  const isShape = chainId === NETWORKS.shapeSepolia.chainId || chainId === NETWORKS.shapeMainnet.chainId
  const isBase = chainId === NETWORKS.baseSepolia.chainId || chainId === NETWORKS.baseMainnet.chainId

  return {
    contractAddress,
    chainId,
    networkName,
    isSupported: isSupportedChain(chainId),
    isShape,
    isBase,
    isTestnet: isTestnet(chainId),
    isMainnet: isMainnet(chainId),
  }
}

export default useNetworkContract

