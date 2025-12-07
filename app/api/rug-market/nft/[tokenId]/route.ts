/**
 * GET /api/rug-market/nft/[tokenId]
 *
 * Get complete NFT data for the Rug Market
 * Falls back to blockchain if Redis data is missing/invalid
 */

import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from '../../../../../src/lib/rug-market-redis'

interface RouteParams {
  params: {
    tokenId: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const tokenId = parseInt(params.tokenId)
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
    const contractAddress = '0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff'

    console.log(`[Individual NFT API] Chain ${chainId}, Contract ${contractAddress}`)

    // Try to get data from Redis first
    console.log(`🔍 Checking Redis for NFT ${tokenId}`)
    const redisData = await RugMarketRedis.getNFTData(chainId, contractAddress, tokenId)
    console.log(`🔍 Redis data result: ${redisData !== null}`)

    if (redisData) {
      console.log(`✅ Found NFT ${tokenId} in Redis`)
      return NextResponse.json({
        source: 'redis',
        data: redisData
      })
    }

    console.log(`❌ NFT ${tokenId} not found in Redis`)
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
