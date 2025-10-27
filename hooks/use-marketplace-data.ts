import { useReadContract, useChainId, useAccount } from 'wagmi'
import { config } from '@/lib/config'
import { contractAddresses } from '@/lib/web3'
import { useState, useEffect } from 'react'

// View functions ABI
const marketplaceViewABI = [
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
 * Hook to fetch listing data for a token
 */
export function useListingData(tokenId: number) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const { data: listingData, isLoading, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceViewABI,
    functionName: 'getListing',
    args: [BigInt(tokenId)]
  })

  // Transform the data to match expected format
  const listing = listingData ? {
    seller: listingData[0],
    price: listingData[1],
    expiresAt: listingData[2],
    isActive: listingData[3]
  } : null

  return { listing, isLoading, refetch }
}

/**
 * Hook to fetch marketplace statistics
 */
export function useMarketplaceStats() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const { data: statsData, isLoading, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceViewABI,
    functionName: 'getMarketplaceStats',
    args: []
  })

  // Transform the data to match expected format
  const stats = statsData ? {
    totalFeesCollected: statsData[0],
    totalVolume: statsData[1],
    totalSales: statsData[2],
    marketplaceFeeBPS: statsData[3]
  } : null

  return { stats, isLoading, refetch }
}
