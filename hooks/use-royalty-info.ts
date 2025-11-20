import { useReadContract, useChainId } from 'wagmi'
import { contractAddresses } from '@/lib/web3'
import { formatEth } from '@/utils/marketplace-utils'

// Commerce ABI for royalty functions
const commerceABI = [
  {
    name: 'royaltyInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'salePrice', type: 'uint256' }
    ],
    outputs: [
      { name: 'receiver', type: 'address' },
      { name: 'royaltyAmount', type: 'uint256' }
    ]
  },
  {
    name: 'getRoyaltyConfig',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'royaltyPercentage', type: 'uint256' },
      { name: 'recipients', type: 'address[]' },
      { name: 'splits', type: 'uint256[]' }
    ]
  }
] as const

/**
 * Hook to get royalty information for an NFT
 */
export function useRoyaltyInfo(tokenId: number, salePrice: bigint = BigInt('1000000000000000000')) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  const { data: royaltyInfo, isLoading: royaltyLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: commerceABI,
    functionName: 'royaltyInfo',
    args: [BigInt(tokenId), salePrice]
  })

  const { data: royaltyConfig, isLoading: configLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: commerceABI,
    functionName: 'getRoyaltyConfig',
    args: []
  })

  const royaltyRecipient = royaltyInfo?.[0] as `0x${string}`
  const royaltyAmount = royaltyInfo?.[1] as bigint
  const royaltyPercentage = royaltyConfig?.[0] as bigint
  const recipients = royaltyConfig?.[1] as `0x${string}`[]
  const splits = royaltyConfig?.[2] as bigint[]

  // Calculate royalty percentage from config (basis points to percentage)
  const royaltyPercent = royaltyPercentage ? Number(royaltyPercentage) / 100 : 0

  // Helper function to calculate royalty for any price
  const calculateRoyalty = (price: bigint) => {
    if (!royaltyPercentage) return BigInt(0)
    return (price * royaltyPercentage) / BigInt(10000) // Divide by 10000 for basis points
  }

  // Format royalty amount for display
  const formatRoyaltyAmount = (price: bigint) => {
    const royalty = calculateRoyalty(price)
    return formatEth(royalty)
  }

  return {
    royaltyRecipient,
    royaltyAmount,
    royaltyPercentage: royaltyPercent,
    recipients,
    splits,
    isLoading: royaltyLoading || configLoading,
    calculateRoyalty,
    formatRoyaltyAmount
  }
}

/**
 * Hook to get marketplace fee information
 */
export function useMarketplaceFee() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  const { data: marketplaceStats } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        name: 'getMarketplaceStats',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
          { name: 'totalFeesCollected', type: 'uint256' },
          { name: 'totalVolume', type: 'uint256' },
          { name: 'totalSales', type: 'uint256' },
          { name: 'marketplaceFeeBPS', type: 'uint256' }
        ]
      }
    ],
    functionName: 'getMarketplaceStats',
    args: []
  })

  const marketplaceFeeBPS = marketplaceStats?.[3] as bigint
  const marketplaceFeePercent = marketplaceFeeBPS ? Number(marketplaceFeeBPS) / 100 : 0

  return {
    marketplaceFeeBPS,
    marketplaceFeePercent,
    // Calculate marketplace fee for any price
    calculateMarketplaceFee: (price: bigint) => {
      if (!marketplaceFeeBPS) return BigInt(0)
      return (price * marketplaceFeeBPS) / BigInt(10000)
    }
  }
}

/**
 * Hook to get Diamond Frame Pool information
 */
export function useDiamondFramePoolInfo() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  const { data: poolConfig } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        name: 'getPoolConfig',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
          { name: 'poolContract', type: 'address' },
          { name: 'poolPercentage', type: 'uint256' }
        ]
      }
    ],
    functionName: 'getPoolConfig',
    args: []
  })

  const poolContract = poolConfig?.[0] as `0x${string}`
  const poolPercentage = poolConfig?.[1] as bigint
  const poolPercent = poolPercentage ? Number(poolPercentage) / 100 : 1 // Default 1%

  return {
    poolContract,
    poolPercentage,
    poolPercent,
    // Calculate pool fee for any price
    calculatePoolFee: (price: bigint) => {
      if (!poolPercentage) return (price * BigInt(100)) / BigInt(10000) // Default 1%
      return (price * poolPercentage) / BigInt(10000)
    }
  }
}
