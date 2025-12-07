/**
 * GET /api/rug-market/collection/stats
 *
 * Get collection statistics for the marketplace
 */

import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from '@/lib/rug-market-redis'
import { fetchTotalSupply } from '@/lib/direct-contract-fetcher'
import { getContractAddress, getRpcUrl } from '@/lib/networks'
import { createPublicClient, http, formatEther } from 'viem'
import { baseSepolia, shapeSepolia, sepolia } from 'viem/chains'

// Marketplace ABI
const marketplaceABI = [
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
  }
] as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || '84532')

    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 })
    }

    console.log(`📊 Fetching collection stats for chain ${chainId}`)

    // Try to get stats from Redis first (optional - we'll recalculate from blockchain for accuracy)
    const cachedStats = await RugMarketRedis.getCollectionStats(chainId, contractAddress)
    if (cachedStats) {
      console.log('✅ Found cached collection stats, but recalculating from blockchain')
    }

    // Calculate stats from blockchain data
    console.log('🔄 Calculating collection stats from blockchain')

    let totalSupply: number
    try {
      totalSupply = await fetchTotalSupply(chainId)
      console.log(`Total supply: ${totalSupply}`)
    } catch (error) {
      console.error('Failed to fetch total supply:', error)
      totalSupply = cachedStats?.totalSupply || 0
    }

    // Get marketplace stats from contract
    let marketplaceStats = null
    let floorPrice = '0'
    let volume24h = '0'
    let sales24h = 0

    try {
      const rpcUrl = getRpcUrl(chainId)
      if (rpcUrl) {
        // Map chain IDs to viem chain objects
        const chainMap: Record<number, any> = {
          84532: baseSepolia,
          11011: shapeSepolia,
          11155111: sepolia
        }

        const chain = chainMap[chainId] || baseSepolia
        const publicClient = createPublicClient({
          chain,
          transport: http(rpcUrl)
        })

        // Get marketplace stats
        const statsData = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: marketplaceABI,
          functionName: 'getMarketplaceStats',
          authorizationList: []
        })

        marketplaceStats = {
          totalFeesCollected: statsData[0],
          totalVolume: statsData[1],
          totalSales: statsData[2],
          marketplaceFeeBPS: statsData[3]
        }

        volume24h = formatEther(marketplaceStats.totalVolume)
        sales24h = Number(marketplaceStats.totalSales)

        // Calculate floor price by checking all active listings
        // For now, we'll use a simplified approach - check first few NFTs
        let minPrice: bigint | null = null
        const checkCount = Math.min(totalSupply, 100) // Check up to 100 NFTs
        
        for (let i = 1; i <= checkCount; i++) {
          try {
            const listing = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: marketplaceABI,
              functionName: 'getListing',
              args: [BigInt(i)],
              authorizationList: []
            })
            
            if (listing[3] && listing[1] > 0n) { // isActive && price > 0
              if (minPrice === null || listing[1] < minPrice) {
                minPrice = listing[1]
              }
            }
          } catch (error) {
            // NFT might not exist or not listed, skip
            continue
          }
        }

        if (minPrice !== null) {
          floorPrice = formatEther(minPrice)
        }
      }
    } catch (error) {
      console.error('Failed to fetch marketplace stats from contract:', error)
      // Use cached stats if available
      if (cachedStats) {
        floorPrice = cachedStats.floorPrice || '0'
        volume24h = cachedStats.volume24h || '0'
        sales24h = cachedStats.sales24h || 0
      }
    }

    const stats = {
      totalSupply: Math.max(totalSupply, cachedStats?.totalSupply || 0),
      maxSupply: 10000,
      floorPrice,
      volume24h,
      sales24h,
      uniqueOwners: cachedStats?.uniqueOwners || 1,
      lastUpdated: BigInt(Date.now())
    }

    // Cache the stats
    await RugMarketRedis.setCollectionStats(chainId, contractAddress, stats)
    console.log('✅ Stats calculated and cached')

    return NextResponse.json({
      totalNFTs: stats.totalSupply,
      floorPrice: stats.floorPrice,
      volume24h: stats.volume24h,
      sales24h: stats.sales24h,
      uniqueOwners: stats.uniqueOwners,
      lastUpdated: stats.lastUpdated.toString()
    })

  } catch (error) {
    console.error('Collection stats API Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      totalNFTs: 0,
      floorPrice: '0',
      volume24h: '0',
      sales24h: 0,
      uniqueOwners: 0,
      lastUpdated: Date.now().toString()
    }, { status: 500 })
  }
}
