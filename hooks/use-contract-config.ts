import { useReadContract } from 'wagmi'
import { contractAddresses, onchainRugsABI } from '@/lib/web3'
import { config } from '@/lib/config'

/**
 * Hook to get contract configuration from blockchain
 */
export function useContractConfig(chainId?: number) {
  const contractAddress = contractAddresses[chainId || config.chainId] || config.contracts.onchainRugs

  // Get aging thresholds from contract
  const {
    data: agingThresholds,
    isLoading: agingLoading,
    error: agingError,
    refetch: refetchAging
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'getAgingThresholds',
    query: {
      enabled: !!contractAddress
    }
  })

  // Get service pricing from contract
  const {
    data: servicePricing,
    isLoading: pricingLoading,
    error: pricingError,
    refetch: refetchPricing
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'getServicePricing',
    query: {
      enabled: !!contractAddress
    }
  })

  // Parse the returned data
  const configData = agingThresholds && servicePricing ? {
    // Aging thresholds
    dirtLevel1Days: Number(agingThresholds[0]),
    dirtLevel2Days: Number(agingThresholds[1]),
    agingAdvanceDays: Number(agingThresholds[2]),
    freeCleanDays: Number(agingThresholds[3]),
    freeCleanWindow: Number(agingThresholds[4]),

    // Service pricing (in wei)
    cleaningCost: servicePricing[0].toString(),
    restorationCost: servicePricing[1].toString(),
    masterRestorationCost: servicePricing[2].toString(),
    launderingThreshold: servicePricing[3].toString(),
  } : null

  const refetch = () => {
    refetchAging()
    refetchPricing()
  }

  return {
    config: configData,
    isLoading: agingLoading || pricingLoading,
    error: agingError || pricingError,
    refetch
  }
}
