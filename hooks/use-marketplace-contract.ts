import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract, useConfig } from 'wagmi'
import { parseEther } from 'viem'
import { config } from '@/lib/config'
import { contractAddresses, shapeSepolia, shapeMainnet, onchainRugsABI } from '@/lib/web3'

// Marketplace ABI - only the functions we need (simplified)
const marketplaceABI = [
  // Direct Listings
  {
    name: 'createListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'duration', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'cancelListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'updateListingPrice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'newPrice', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'buyListing',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  // Admin functions
  {
    name: 'setMarketplaceFee',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newFeeBPS', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'withdrawFees',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: []
  },
  // View functions
  {
    name: 'getListing',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'isActive', type: 'bool' }
    ]
  },
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
] as const

/**
 * Hook for checking if marketplace is approved for a token
 */
export function useApprovalStatus(tokenId: number) {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
  // In diamond pattern, marketplace is part of the main contract
  const marketplaceAddress = contractAddress

  const { data: approvedAddress, isLoading: approvedLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'getApproved',
    args: [BigInt(tokenId)]
  })

  const { data: isApprovedForAll, isLoading: approvedForAllLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'isApprovedForAll',
    args: [address ? (address as `0x${string}`) : '0x0000000000000000000000000000000000000000', marketplaceAddress as `0x${string}`]
  })

  const approved = approvedAddress === marketplaceAddress || isApprovedForAll
  const isLoading = approvedLoading || approvedForAllLoading

  return { approved, isLoading, approvedAddress, isApprovedForAll }
}

/**
 * Hook for approving marketplace to transfer tokens
 */
export function useApproveMarketplace(tokenId: number) {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
  const wagmiConfig = useConfig()

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const approve = () => {
    // @ts-ignore - wagmi v2 type checking issue
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: onchainRugsABI,
      functionName: 'approve',
      args: [contractAddress as `0x${string}`, BigInt(tokenId)]
    }, wagmiConfig)
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  })

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

/**
 * Hook for creating a listing
 */
export function useCreateListing() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
  const wagmiConfig = useConfig()

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const createListing = (tokenId: number, price: string, duration: number = 0) => {
    // @ts-ignore - wagmi v2 type checking issue
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'createListing',
      args: [BigInt(tokenId), parseEther(price), BigInt(duration)]
    }, wagmiConfig)
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  })

  return {
    createListing,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

/**
 * Hook for buying a listing
 */
export function useBuyListing() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
  const wagmiConfig = useConfig()

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const buyListing = (tokenId: number, price: string) => {
    // @ts-ignore - wagmi v2 type checking issue
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'buyListing',
      args: [BigInt(tokenId)],
      value: parseEther(price)
    }, wagmiConfig)
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  })

  return {
    buyListing,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

/**
 * Hook for cancelling a listing
 */
export function useCancelListing() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
  const wagmiConfig = useConfig()

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const cancelListing = (tokenId: number) => {
    // @ts-ignore - wagmi v2 type checking issue
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'cancelListing',
      args: [BigInt(tokenId)]
    }, wagmiConfig)
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  })

  return {
    cancelListing,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

/**
 * Hook for updating listing price
 */
export function useUpdateListingPrice() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
  const wagmiConfig = useConfig()

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const updateListingPrice = (tokenId: number, newPrice: string) => {
    // @ts-ignore - wagmi v2 type checking issue
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'updateListingPrice',
      args: [BigInt(tokenId), parseEther(newPrice)]
    }, wagmiConfig)
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  })

  return {
    updateListingPrice,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}
