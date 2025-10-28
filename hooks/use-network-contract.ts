import { useChainId } from 'wagmi'
import { getContractAddress } from '@/lib/web3'

/**
 * Hook to get the correct contract address for the current network
 * Automatically detects user's connected network and returns appropriate contract
 */
export function useNetworkContract() {
  const chainId = useChainId()
  
  // Get contract address for current chain
  const contractAddress = getContractAddress(chainId)
  
  // Determine network name
  let networkName = 'Unknown'
  switch (chainId) {
    case 11011:
      networkName = 'Shape Sepolia'
      break
    case 360:
      networkName = 'Shape Mainnet'
      break
    case 84532:
      networkName = 'Base Sepolia'
      break
    case 8453:
      networkName = 'Base Mainnet'
      break
  }
  
  return {
    contractAddress,
    chainId,
    networkName,
    isSupported: !!contractAddress,
    isShape: chainId === 11011 || chainId === 360,
    isBase: chainId === 84532 || chainId === 8453,
    isTestnet: chainId === 11011 || chainId === 84532,
    isMainnet: chainId === 360 || chainId === 8453,
  }
}

export default useNetworkContract

