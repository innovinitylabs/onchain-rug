import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract, useConfig, useSendTransaction } from 'wagmi'
import { parseEther, encodeFunctionData } from 'viem'
import { config } from '@/lib/config'
import { contractAddresses, shapeSepolia, shapeMainnet, onchainRugsABI } from '@/lib/web3'
import { appendERC8021Suffix, getAllAttributionCodes } from '@/utils/erc8021-utils'

// Marketplace ABI - only the functions we need (simplified)
const marketplaceABI = [
  // ERC721 Approvals
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' }
    ],
    outputs: []
  },
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
  },
  // Royalty functions (from RugCommerceFacet)
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
  },
  // Offer functions
  {
    name: 'makeOffer',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'duration', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'acceptOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'offerId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'cancelOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'offerId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'getOffer',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'offerId', type: 'uint256' }],
    outputs: [
      { name: 'offerId', type: 'uint256' },
      { name: 'offerer', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'isActive', type: 'bool' }
    ]
  },
  {
    name: 'getActiveTokenOffers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  }
] as const

/**
 * Hook for checking if marketplace is approved for a token
 */
export function useApprovalStatus(tokenId: number) {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]
  // In diamond pattern, marketplace is part of the main contract
  const marketplaceAddress = contractAddress

  // Only check isApprovedForAll since we use setApprovalForAll for blanket approval
  const { data: isApprovedForAll, isLoading: approvedForAllLoading, refetch: refetchApprovedForAll } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'isApprovedForAll',
    args: [address ? (address as `0x${string}`) : '0x0000000000000000000000000000000000000000', marketplaceAddress as `0x${string}`]
  })

  const approved = Boolean(isApprovedForAll)
  const isLoading = approvedForAllLoading

  // Function to manually refresh approval status
  const refetch = () => {
    refetchApprovedForAll()
  }

  return { approved, isLoading, isApprovedForAll, refetch }
}

/**
 * Hook for approving marketplace to transfer tokens
 */
export function useApproveMarketplace(tokenId: number) {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]
  const wagmiConfig = useConfig()

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const approve = () => {
    // Use setApprovalForAll for blanket approval of all NFTs
    // @ts-ignore - wagmi v2 type checking issue
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'setApprovalForAll',
      args: [contractAddress as `0x${string}`, true]
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
  const contractAddress = contractAddresses[chainId]
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
 * Hook for buying a listing (with ERC-8021 attribution)
 */
export function useBuyListing() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]
  const wagmiConfig = useConfig()

  const { sendTransaction, data: hash, isPending, error } = useSendTransaction()

  const buyListing = (tokenId: number, price: string) => {
    if (!address || !contractAddress) return

    // Encode the function call
    const encodedData = encodeFunctionData({
      abi: marketplaceABI,
      functionName: 'buyListing',
      args: [BigInt(tokenId)],
    })

    // Get attribution codes (builder + referral + aggregator)
    const codes = getAllAttributionCodes({ walletAddress: address })

    // Append ERC-8021 suffix to calldata
    const dataWithAttribution = appendERC8021Suffix(encodedData, codes)

    // Send transaction with attribution
    sendTransaction({
      to: contractAddress as `0x${string}`,
      data: dataWithAttribution,
      value: parseEther(price),
    })
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
  const contractAddress = contractAddresses[chainId]
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
  const contractAddress = contractAddresses[chainId]
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

/**
 * Hook for making an offer on an NFT
 */
export function useMakeOffer() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]
  const wagmiConfig = useConfig()

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const makeOffer = (tokenId: number, price: string, duration: number = 0) => {
    // @ts-ignore - wagmi v2 type checking issue
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'makeOffer',
      args: [BigInt(tokenId), BigInt(duration)],
      value: parseEther(price)
    }, wagmiConfig)
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  })

  return {
    makeOffer,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

/**
 * Hook for accepting an offer (with ERC-8021 attribution)
 */
export function useAcceptOffer() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]
  const wagmiConfig = useConfig()

  const { sendTransaction, data: hash, isPending, error } = useSendTransaction()

  const acceptOffer = (offerId: number) => {
    if (!address || !contractAddress) return

    // Encode the function call
    const encodedData = encodeFunctionData({
      abi: marketplaceABI,
      functionName: 'acceptOffer',
      args: [BigInt(offerId)],
    })

    // Get attribution codes (builder + referral + aggregator)
    const codes = getAllAttributionCodes({ walletAddress: address })

    // Append ERC-8021 suffix to calldata
    const dataWithAttribution = appendERC8021Suffix(encodedData, codes)

    // Send transaction with attribution
    sendTransaction({
      to: contractAddress as `0x${string}`,
      data: dataWithAttribution,
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  })

  return {
    acceptOffer,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

/**
 * Hook for cancelling an offer
 */
export function useCancelOffer() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]
  const wagmiConfig = useConfig()

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const cancelOffer = (offerId: number) => {
    // @ts-ignore - wagmi v2 type checking issue
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'cancelOffer',
      args: [BigInt(offerId)]
    }, wagmiConfig)
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  })

  return {
    cancelOffer,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

/**
 * Hook for reading offer data
 */
export function useOfferData(offerId: number | null) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceABI,
    functionName: 'getOffer',
    args: offerId !== null ? [BigInt(offerId)] : undefined,
    query: {
      enabled: offerId !== null
    }
  })

  const offer = data ? {
    offerId: Number(data[0]),
    offerer: data[1] as string,
    tokenId: Number(data[2]),
    price: data[3].toString(),
    expiresAt: Number(data[4]),
    isActive: data[5]
  } : null

  return { offer, isLoading, error, refetch }
}

/**
 * Hook for reading active offers for a token
 */
export function useTokenOffers(tokenId: number | null) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  const { data: offerIds, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceABI,
    functionName: 'getActiveTokenOffers',
    args: tokenId !== null ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: tokenId !== null
    }
  })

  return { offerIds: offerIds as bigint[] | undefined, isLoading, error, refetch }
}
