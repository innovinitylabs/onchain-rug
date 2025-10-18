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
    name: 'getAuction',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'startPrice', type: 'uint256' },
      { name: 'reservePrice', type: 'uint256' },
      { name: 'currentBid', type: 'uint256' },
      { name: 'highestBidder', type: 'address' },
      { name: 'endTime', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'autoExtend', type: 'bool' }
    ]
  },
  {
    name: 'getOffer',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'offerId', type: 'uint256' }],
    outputs: [
      { name: 'offerer', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'isActive', type: 'bool' }
    ]
  },
  {
    name: 'getTokenOffers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'getCollectionOffers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'getBundle',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'bundleId', type: 'uint256' }],
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'tokenIds', type: 'uint256[]' },
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
      { name: 'totalSales', type: 'uint256' },
      { name: 'totalVolume', type: 'uint256' },
      { name: 'totalFeesCollected', type: 'uint256' },
      { name: 'marketplaceFeePercent', type: 'uint256' }
    ]
  },
  {
    name: 'getMarketplaceConfig',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'marketplaceFeePercent', type: 'uint256' },
      { name: 'maxAuctionDuration', type: 'uint256' },
      { name: 'minBidIncrementPercent', type: 'uint256' },
      { name: 'autoExtendDuration', type: 'uint256' },
      { name: 'autoExtendThreshold', type: 'uint256' }
    ]
  }
] as const

/**
 * Hook to get listing data for a token
 */
export function useListingData(tokenId: number) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceViewABI,
    functionName: 'getListing',
    args: [BigInt(tokenId)]
  })

  return {
    listing: data ? {
      seller: data[0],
      price: data[1],
      expiresAt: Number(data[2]),
      isActive: data[3]
    } : null,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook to get auction data for a token
 */
export function useAuctionData(tokenId: number) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceViewABI,
    functionName: 'getAuction',
    args: [BigInt(tokenId)]
  })

  return {
    auction: data ? {
      seller: data[0],
      startPrice: data[1],
      reservePrice: data[2],
      currentBid: data[3],
      highestBidder: data[4],
      endTime: Number(data[5]),
      isActive: data[6],
      autoExtend: data[7]
    } : null,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook to get all offer IDs for a token
 */
export function useTokenOffers(tokenId: number) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceViewABI,
    functionName: 'getTokenOffers',
    args: [BigInt(tokenId)]
  })

  return {
    offerIds: data ? data.map(id => Number(id)) : [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook to get collection-wide offer IDs
 */
export function useCollectionOffers() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceViewABI,
    functionName: 'getCollectionOffers',
    args: []
  })

  return {
    offerIds: data ? data.map(id => Number(id)) : [],
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook to get offer details by ID
 */
export function useOfferData(offerId: number) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceViewABI,
    functionName: 'getOffer',
    args: [BigInt(offerId)]
  })

  return {
    offer: data ? {
      offerer: data[0],
      tokenId: Number(data[1]),
      price: data[2],
      expiresAt: Number(data[3]),
      isActive: data[4]
    } : null,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook to get marketplace statistics
 */
export function useMarketplaceStats() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceViewABI,
    functionName: 'getMarketplaceStats',
    args: []
  })

  return {
    stats: data ? {
      totalSales: Number(data[0]),
      totalVolume: data[1],
      totalFeesCollected: data[2],
      marketplaceFeePercent: Number(data[3])
    } : null,
    isLoading,
    error,
    refetch
  }
}

/**
 * Hook to get marketplace configuration
 */
export function useMarketplaceConfig() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const { data, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: marketplaceViewABI,
    functionName: 'getMarketplaceConfig',
    args: []
  })

  return {
    config: data ? {
      marketplaceFeePercent: Number(data[0]),
      maxAuctionDuration: Number(data[1]),
      minBidIncrementPercent: Number(data[2]),
      autoExtendDuration: Number(data[3]),
      autoExtendThreshold: Number(data[4])
    } : null,
    isLoading,
    error
  }
}

/**
 * Hook to get all offers for multiple tokens (batch fetch)
 */
export function useBatchOffers(tokenIds: number[]) {
  const [offers, setOffers] = useState<Record<number, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoading(true)
      const offersMap: Record<number, any[]> = {}
      
      // This would ideally be a multicall, but for now we'll do sequential
      for (const tokenId of tokenIds) {
        try {
          // In production, use a multicall contract or batch RPC requests
          const response = await fetch(`/api/marketplace/offers/${tokenId}`)
          const data = await response.json()
          offersMap[tokenId] = data.offers || []
        } catch (error) {
          console.error(`Failed to fetch offers for token ${tokenId}:`, error)
          offersMap[tokenId] = []
        }
      }
      
      setOffers(offersMap)
      setIsLoading(false)
    }

    if (tokenIds.length > 0) {
      fetchOffers()
    }
  }, [tokenIds, contractAddress])

  return { offers, isLoading }
}

/**
 * Hook to get user's active listings
 */
export function useUserListings(address?: string) {
  const { address: connectedAddress } = useAccount()
  const userAddress = address || connectedAddress
  const [listings, setListings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchListings = async () => {
      if (!userAddress) return
      
      setIsLoading(true)
      try {
        // Fetch from API/indexer
        const response = await fetch(`/api/marketplace/listings/${userAddress}`)
        const data = await response.json()
        setListings(data.listings || [])
      } catch (error) {
        console.error('Failed to fetch user listings:', error)
        setListings([])
      }
      setIsLoading(false)
    }

    fetchListings()
  }, [userAddress])

  return { listings, isLoading, refetch: () => {} }
}

/**
 * Hook to get user's active offers (made by user)
 */
export function useUserOffers(address?: string) {
  const { address: connectedAddress } = useAccount()
  const userAddress = address || connectedAddress
  const [offers, setOffers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOffers = async () => {
      if (!userAddress) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/marketplace/offers/made/${userAddress}`)
        const data = await response.json()
        setOffers(data.offers || [])
      } catch (error) {
        console.error('Failed to fetch user offers:', error)
        setOffers([])
      }
      setIsLoading(false)
    }

    fetchOffers()
  }, [userAddress])

  return { offers, isLoading, refetch: () => {} }
}

/**
 * Hook to get offers received on user's NFTs
 */
export function useOffersReceived(address?: string) {
  const { address: connectedAddress } = useAccount()
  const userAddress = address || connectedAddress
  const [offers, setOffers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOffers = async () => {
      if (!userAddress) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/marketplace/offers/received/${userAddress}`)
        const data = await response.json()
        setOffers(data.offers || [])
      } catch (error) {
        console.error('Failed to fetch received offers:', error)
        setOffers([])
      }
      setIsLoading(false)
    }

    fetchOffers()
  }, [userAddress])

  return { offers, isLoading, refetch: () => {} }
}

/**
 * Hook for activity feed (recent marketplace events)
 */
export function useActivityFeed(limit: number = 20) {
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const chainId = useChainId()

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/marketplace/activity?limit=${limit}&chain=${chainId}`)
        const data = await response.json()
        setActivities(data.activities || [])
      } catch (error) {
        console.error('Failed to fetch activity feed:', error)
        setActivities([])
      }
      setIsLoading(false)
    }

    fetchActivity()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [limit, chainId])

  return { activities, isLoading, refetch: () => {} }
}

/**
 * Hook to calculate floor price from active listings
 */
export function useFloorPrice() {
  const [floorPrice, setFloorPrice] = useState<bigint | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const chainId = useChainId()

  useEffect(() => {
    const fetchFloorPrice = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/marketplace/floor-price?chain=${chainId}`)
        const data = await response.json()
        setFloorPrice(data.floorPrice ? BigInt(data.floorPrice) : null)
      } catch (error) {
        console.error('Failed to fetch floor price:', error)
        setFloorPrice(null)
      }
      setIsLoading(false)
    }

    fetchFloorPrice()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchFloorPrice, 60000)
    return () => clearInterval(interval)
  }, [chainId])

  return { floorPrice, isLoading }
}

