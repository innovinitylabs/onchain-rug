/**
 * POST /api/rug-market/nft/[tokenId]/refresh
 *
 * Force refresh NFT data from blockchain and update Redis cache
 * Used when users want to ensure they have latest data
 */

import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from '@/lib/rug-market-redis'
import { contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'
import { fetchNFTFromBlockchain } from '@/lib/blockchain-fetcher'

interface RouteParams {
  params: {
    tokenId: string
  }
}

export async function POST(
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

    // Get chain ID from query params or use default
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || config.defaultChainId.toString())

    const contractAddress = contractAddresses[chainId]
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      )
    }

    console.log(`🔄 Force refreshing NFT ${tokenId} from blockchain`)

    // Always fetch fresh data from blockchain
    const freshData = await fetchNFTFromBlockchain(chainId, contractAddress, tokenId)

    if (!freshData) {
      return NextResponse.json(
        { error: 'NFT not found on blockchain' },
        { status: 404 }
      )
    }

    // Update Redis with fresh data
    await RugMarketRedis.setNFTData(chainId, contractAddress, tokenId, freshData)

    // Check if marketplace data needs updating (listing status, etc.)
    // TODO: Fetch current marketplace state from contracts

    console.log(`✅ Successfully refreshed and cached NFT ${tokenId}`)

    return NextResponse.json({
      success: true,
      message: `NFT ${tokenId} refreshed successfully`,
      data: freshData,
      refreshedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Refresh API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
