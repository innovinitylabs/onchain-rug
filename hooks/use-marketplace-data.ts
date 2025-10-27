import { useReadContract, useChainId, useAccount, usePublicClient } from 'wagmi'
import { config } from '@/lib/config'
import { contractAddresses } from '@/lib/web3'
import { useState, useEffect, useMemo } from 'react'

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

  // Transform the data to match expected format - memoize to prevent infinite loops
  const listing = useMemo(() => {
    if (!listingData) return null
    return {
      seller: listingData[0],
      price: listingData[1],
      expiresAt: listingData[2],
      isActive: listingData[3]
    }
  }, [listingData])

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

  // Transform the data to match expected format - memoize to prevent infinite loops
  const stats = useMemo(() => {
    if (!statsData) return null
    return {
      totalFeesCollected: statsData[0],
      totalVolume: statsData[1],
      totalSales: statsData[2],
      marketplaceFeeBPS: statsData[3]
    }
  }, [statsData])

  return { stats, isLoading, refetch }
}

/**
 * Hook to fetch recent marketplace activity from blockchain events
 */
export function useMarketplaceActivity(limit: number = 20) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
  const publicClient = usePublicClient()
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!publicClient || !contractAddress) return

    const fetchActivity = async () => {
      try {
        setIsLoading(true)
        
        // Fetch events from the last 7 days
        const fromBlock = await publicClient.getBlockNumber().then(num => num - BigInt(2100)) // Approx 7 days
        
        // Fetch ListingCreated events
        const createdLogs = await publicClient.getLogs({
          address: contractAddress as `0x${string}`,
          event: {
            name: 'ListingCreated',
            type: 'event',
            inputs: [
              { indexed: true, name: 'tokenId', type: 'uint256' },
              { indexed: true, name: 'seller', type: 'address' },
              { indexed: false, name: 'price', type: 'uint256' },
              { indexed: false, name: 'expiresAt', type: 'uint256' }
            ]
          },
          fromBlock,
        })
        
        // Fetch ListingSold events
        const soldLogs = await publicClient.getLogs({
          address: contractAddress as `0x${string}`,
          event: {
            name: 'ListingSold',
            type: 'event',
            inputs: [
              { indexed: true, name: 'tokenId', type: 'uint256' },
              { indexed: true, name: 'seller', type: 'address' },
              { indexed: true, name: 'buyer', type: 'address' },
              { indexed: false, name: 'price', type: 'uint256' }
            ]
          },
          fromBlock,
        })
        
        // Fetch ListingCancelled events
        const cancelledLogs = await publicClient.getLogs({
          address: contractAddress as `0x${string}`,
          event: {
            name: 'ListingCancelled',
            type: 'event',
            inputs: [
              { indexed: true, name: 'tokenId', type: 'uint256' },
              { indexed: true, name: 'seller', type: 'address' }
            ]
          },
          fromBlock,
        })

        // Transform events to activities
        const allActivities: any[] = []

        // Get unique block numbers to fetch timestamps
        const uniqueBlocks = new Set<bigint>()
        createdLogs.forEach((log: any) => uniqueBlocks.add(log.blockNumber))
        soldLogs.forEach((log: any) => uniqueBlocks.add(log.blockNumber))
        cancelledLogs.forEach((log: any) => uniqueBlocks.add(log.blockNumber))

        // Fetch block timestamps
        const blockTimestamps: Record<string, number> = {}
        for (const blockNum of uniqueBlocks) {
          try {
            const block = await publicClient.getBlock({ blockNumber: blockNum })
            blockTimestamps[blockNum.toString()] = Number(block.timestamp) * 1000 // Convert to milliseconds
          } catch (error) {
            console.error(`Error fetching block ${blockNum}:`, error)
            blockTimestamps[blockNum.toString()] = Date.now() // Fallback to now
          }
        }

        // Process ListingCreated events
        createdLogs.forEach((log: any) => {
          allActivities.push({
            id: `listing-${log.blockNumber}-${log.transactionIndex}`,
            type: 'listing',
            tokenId: Number(log.args.tokenId),
            price: log.args.price,
            from: log.args.seller,
            timestamp: blockTimestamps[log.blockNumber.toString()] || Date.now(),
            blockNumber: log.blockNumber,
            transactionIndex: log.transactionIndex
          })
        })

        // Process ListingSold events
        soldLogs.forEach((log: any) => {
          allActivities.push({
            id: `sale-${log.blockNumber}-${log.transactionIndex}`,
            type: 'sale',
            tokenId: Number(log.args.tokenId),
            price: log.args.price,
            from: log.args.seller,
            to: log.args.buyer,
            timestamp: blockTimestamps[log.blockNumber.toString()] || Date.now(),
            blockNumber: log.blockNumber,
            transactionIndex: log.transactionIndex
          })
        })

        // Process ListingCancelled events
        cancelledLogs.forEach((log: any) => {
          allActivities.push({
            id: `cancelled-${log.blockNumber}-${log.transactionIndex}`,
            type: 'cancelled',
            tokenId: Number(log.args.tokenId),
            from: log.args.seller,
            timestamp: blockTimestamps[log.blockNumber.toString()] || Date.now(),
            blockNumber: log.blockNumber,
            transactionIndex: log.transactionIndex
          })
        })

        // Sort by block number (newest first) and limit
        allActivities.sort((a, b) => {
          if (a.blockNumber === b.blockNumber) {
            return Number(b.transactionIndex) - Number(a.transactionIndex)
          }
          return Number(b.blockNumber) - Number(a.blockNumber)
        })

        setActivities(allActivities.slice(0, limit))
      } catch (error) {
        console.error('Error fetching marketplace activity:', error)
        setActivities([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivity()
  }, [publicClient, contractAddress, limit])

  return { activities, isLoading }
}
