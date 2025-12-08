/**
 * GET /api/rug-market/nft/[tokenId]
 *
 * Get complete NFT data for the Rug Market
 * Falls back to blockchain if Redis data is missing/invalid
 */

import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from '@/app/api/rug-market/collection/rug-market-redis'
import { fetchNFTFromBlockchain } from '@/app/api/rug-market/collection/blockchain-fetcher'
import { getContractAddress } from '@/app/api/rug-market/collection/networks'

interface RouteParams {
  params: Promise<{
    tokenId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { tokenId: tokenIdParam } = await params
    const tokenId = parseInt(tokenIdParam)
    if (isNaN(tokenId)) {
      return NextResponse.json(
        { error: 'Invalid token ID' },
        { status: 400 }
      )
    }

    console.log(`[Individual NFT API] Request for token ${tokenId}`)

    // Get chain ID from query params or use default
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || '84532')
    const contractAddress = getContractAddress(chainId)
    
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      )
    }

    console.log(`[Individual NFT API] Chain ${chainId}, Contract ${contractAddress}`)

    // Try to get data from Redis first (includes calculated values)
    console.log(`🔍 Checking Redis for NFT ${tokenId}`)
    const redisData = await RugMarketRedis.getNFTData(chainId, contractAddress, tokenId)
    console.log(`🔍 Redis data result: ${redisData !== null}`)

    if (redisData) {
      console.log(`✅ Found NFT ${tokenId} in Redis with calculated values`)
      return NextResponse.json({
        source: 'redis',
        data: redisData
      })
    }

    // Fallback to blockchain
    console.log(`❌ NFT ${tokenId} not found in Redis, fetching from blockchain`)
    try {
      const blockchainData = await fetchNFTFromBlockchain(chainId, contractAddress, tokenId)
      if (blockchainData) {
        // Store in Redis (will be calculated on next read)
        await RugMarketRedis.setNFTData(chainId, contractAddress, tokenId, blockchainData)
        
        // Get from Redis again to get calculated values
        const calculatedData = await RugMarketRedis.getNFTData(chainId, contractAddress, tokenId)
        if (calculatedData) {
          return NextResponse.json({
            source: 'blockchain',
            data: calculatedData
          })
        }
      }
    } catch (error) {
      console.error(`[Individual NFT API] Failed to fetch from blockchain:`, error)
    }

    return NextResponse.json(
      { error: 'NFT not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
