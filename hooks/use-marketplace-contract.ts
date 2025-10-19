import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseEther } from 'viem'
import { config } from '@/lib/config'
import { contractAddresses, shapeSepolia, shapeMainnet } from '@/lib/web3'

// Marketplace ABI - only the functions we need
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
  {
    name: 'bulkCreateListings',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'prices', type: 'uint256[]' },
      { name: 'durations', type: 'uint256[]' }
    ],
    outputs: []
  },
  // Auctions
  {
    name: 'createAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'startPrice', type: 'uint256' },
      { name: 'reservePrice', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'autoExtend', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'placeBid',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'finalizeAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'cancelAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  // Offers
  {
    name: 'makeOffer',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'makeCollectionOffer',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'expiresAt', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'acceptOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'offerId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'cancelOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'offerId', type: 'uint256' }],
    outputs: []
  },
  // Bundles
  {
    name: 'createBundle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'price', type: 'uint256' },
      { name: 'duration', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'buyBundle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'bundleId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'cancelBundle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'bundleId', type: 'uint256' }],
    outputs: []
  }
] as const

/**
 * Hook for creating a fixed-price listing
 */
export function useCreateListing() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createListing = async (tokenId: number, priceInEth: string, durationInDays: number) => {
    if (!address) throw new Error('Wallet not connected')

    const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
    const price = parseEther(priceInEth)
    const duration = durationInDays * 24 * 60 * 60 // Convert days to seconds
    const chain = chainId === 360 ? shapeMainnet : shapeSepolia

    console.log('Creating listing with approval...')

    // Create listing (the smart contract should handle approval internally)
    // Note: In a production system, approval would be handled separately
    await writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'createListing',
      args: [BigInt(tokenId), price, BigInt(duration)],
      chain,
      account: address
    })
  }

  return { createListing, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Hook for buying a listed NFT
 */
export function useBuyListing() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const buyListing = async (tokenId: number, priceInEth: string) => {
    if (!address) throw new Error('Wallet not connected')

    const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
    const price = parseEther(priceInEth)
    const chain = chainId === 360 ? shapeMainnet : shapeSepolia

    console.log('BuyListing Debug:', {
      tokenId,
      priceInEth,
      price: price.toString(),
      contractAddress,
      chainId,
      userAddress: address
    })

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: marketplaceABI,
        functionName: 'buyListing',
        args: [BigInt(tokenId)],
        value: price,
        chain,
        account: address
      })
    } catch (error) {
      console.error('BuyListing Transaction Error:', error)
      throw error
    }
  }

  return { buyListing, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Hook for canceling a listing
 */
export function useCancelListing() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const cancelListing = async (tokenId: number) => {
    if (!address) throw new Error('Wallet not connected')
    
    const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
    const chain = chainId === 360 ? shapeMainnet : shapeSepolia

    await writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'cancelListing',
      args: [BigInt(tokenId)],
      chain,
      account: address
    })
  }

  return { cancelListing, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Hook for updating listing price
 */
export function useUpdateListingPrice() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const updatePrice = async (tokenId: number, newPriceInEth: string) => {
    if (!address) throw new Error('Wallet not connected')
    
    const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
    const newPrice = parseEther(newPriceInEth)
    const chain = chainId === 360 ? shapeMainnet : shapeSepolia

    await writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'updateListingPrice',
      args: [BigInt(tokenId), newPrice],
      chain,
      account: address
    })
  }

  return { updatePrice, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Hook for creating an auction
 */
export function useCreateAuction() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createAuction = async (
    tokenId: number,
    startPriceInEth: string,
    reservePriceInEth: string,
    durationInDays: number,
    autoExtend: boolean
  ) => {
    if (!address) throw new Error('Wallet not connected')
    
    const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
    const startPrice = parseEther(startPriceInEth)
    const reservePrice = reservePriceInEth ? parseEther(reservePriceInEth) : BigInt(0)
    const duration = durationInDays * 24 * 60 * 60
    const chain = chainId === 360 ? shapeMainnet : shapeSepolia

    await writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'createAuction',
      args: [BigInt(tokenId), startPrice, reservePrice, BigInt(duration), autoExtend],
      chain,
      account: address
    })
  }

  return { createAuction, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Hook for placing a bid
 */
export function usePlaceBid() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const placeBid = async (tokenId: number, bidAmountInEth: string) => {
    if (!address) throw new Error('Wallet not connected')
    
    const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
    const bidAmount = parseEther(bidAmountInEth)
    const chain = chainId === 360 ? shapeMainnet : shapeSepolia

    await writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'placeBid',
      args: [BigInt(tokenId)],
      value: bidAmount,
      chain,
      account: address
    })
  }

  return { placeBid, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Hook for making an offer
 */
export function useMakeOffer() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const makeOffer = async (tokenId: number, offerAmountInEth: string, expiresInDays: number) => {
    if (!address) throw new Error('Wallet not connected')
    
    const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
    const offerAmount = parseEther(offerAmountInEth)
    const expiresAt = expiresInDays > 0 
      ? Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60)
      : 0
    const chain = chainId === 360 ? shapeMainnet : shapeSepolia

    await writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'makeOffer',
      args: [BigInt(tokenId), BigInt(expiresAt)],
      value: offerAmount,
      chain,
      account: address
    })
  }

  return { makeOffer, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Hook for accepting an offer
 */
export function useAcceptOffer() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const acceptOffer = async (tokenId: number, offerId: number) => {
    if (!address) throw new Error('Wallet not connected')
    
    const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
    const chain = chainId === 360 ? shapeMainnet : shapeSepolia

    await writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'acceptOffer',
      args: [BigInt(tokenId), BigInt(offerId)],
      chain,
      account: address
    })
  }

  return { acceptOffer, isPending, isConfirming, isSuccess, error, hash }
}

/**
 * Hook for bulk listing multiple NFTs
 */
export function useBulkCreateListings() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const bulkList = async (
    tokenIds: number[],
    pricesInEth: string[],
    durationsInDays: number[]
  ) => {
    if (!address) throw new Error('Wallet not connected')
    if (tokenIds.length !== pricesInEth.length || tokenIds.length !== durationsInDays.length) {
      throw new Error('Array lengths must match')
    }
    
    const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
    const prices = pricesInEth.map(p => parseEther(p))
    const durations = durationsInDays.map(d => BigInt(d * 24 * 60 * 60))
    const chain = chainId === 360 ? shapeMainnet : shapeSepolia

    await writeContract({
      address: contractAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'bulkCreateListings',
      args: [tokenIds.map(BigInt), prices, durations],
      chain,
      account: address
    })
  }

  return { bulkList, isPending, isConfirming, isSuccess, error, hash }
}

