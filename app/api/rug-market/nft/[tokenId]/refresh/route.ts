/**
 * POST /api/rug-market/nft/[tokenId]/refresh
 *
 * Force refresh NFT data from blockchain and update Redis cache
 * Used when users want to ensure they have latest data
 */

import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from '../../../collection/rug-market-redis'
import { fetchNFTFromBlockchain } from '../../../collection/blockchain-fetcher'
import { getContractAddress } from '../../../collection/networks'
import { redis } from '../../../collection/redis'

interface RouteParams {
  params: Promise<{
    tokenId: string
  }>
}

export async function POST(
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

    // Rate limiting: 5 second cooldown per tokenId
    const rateLimitKey = `rugmarket:refresh:ratelimit:${chainId}:${contractAddress}:${tokenId}`
    const now = Date.now()
    
    try {
      const lastRefresh = await redis.get<number>(rateLimitKey)
      const cooldownMs = 5000 // 5 seconds
      
      if (lastRefresh && (now - lastRefresh) < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - (now - lastRefresh)) / 1000)
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: `Please wait ${remainingSeconds} second(s) before refreshing again`,
            retryAfter: remainingSeconds
          },
          { status: 429 }
        )
      }
    } catch (rateLimitError) {
      console.error(`[Refresh API] Rate limit check failed:`, rateLimitError)
      // Continue anyway - don't block refresh if rate limiting fails
    }

    // Deduplication: Check if there's already a refresh in progress
    const refreshLockKey = `rugmarket:refresh:lock:${chainId}:${contractAddress}:${tokenId}`
    try {
      const lockExists = await redis.get(refreshLockKey)
      if (lockExists) {
        return NextResponse.json(
          { 
            error: 'Refresh already in progress',
            message: 'A refresh for this NFT is already being processed'
          },
          { status: 409 }
        )
      }
      
      // Set lock (expires in 30 seconds)
      await redis.setex(refreshLockKey, 30, '1')
    } catch (lockError) {
      console.error(`[Refresh API] Lock check failed:`, lockError)
      // Continue anyway
    }

    console.log(`🔄 Force refreshing NFT ${tokenId} from blockchain`)

    try {
      // Always fetch fresh data from blockchain
      const freshData = await fetchNFTFromBlockchain(chainId, contractAddress, tokenId)

      if (!freshData) {
        // Release lock
        await redis.del(refreshLockKey).catch(() => {})
        return NextResponse.json(
          { error: 'NFT not found on blockchain' },
          { status: 404 }
        )
      }

      // Update Redis with fresh data (only stored fields, calculated values will be added on read)
      await RugMarketRedis.setNFTData(chainId, contractAddress, tokenId, freshData)

      // Get fresh data back with calculated values
      const dataWithCalculated = await RugMarketRedis.getNFTData(chainId, contractAddress, tokenId)

      // Update rate limit timestamp
      await redis.setex(rateLimitKey, 5, now.toString())

      // Release lock
      await redis.del(refreshLockKey).catch(() => {})

      console.log(`✅ Successfully refreshed and cached NFT ${tokenId}`)

      return NextResponse.json({
        success: true,
        message: `NFT ${tokenId} refreshed successfully`,
        data: dataWithCalculated,
        refreshedAt: new Date().toISOString()
      })
    } catch (error) {
      // Release lock on error
      await redis.del(refreshLockKey).catch(() => {})
      throw error
    }

  } catch (error) {
    console.error('Refresh API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}
