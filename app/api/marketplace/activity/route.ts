import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_CHAIN_ID, getContractAddress } from '@/lib/networks'
import { getCachedActivityFeed } from '@/lib/marketplace-cache'

/**
 * Marketplace Activity Feed API
 * Returns recent marketplace events (sales, listings, bids, offers) from Redis cache
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const chainId = parseInt(searchParams.get('chain') || DEFAULT_CHAIN_ID.toString())
    const contractAddress = getContractAddress(chainId)

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address not found for chain' },
        { status: 400 }
      )
    }

    // Get cached activity feed from Redis
    const activities = await getCachedActivityFeed(chainId, contractAddress, limit)

    return NextResponse.json({
      activities,
      count: activities.length,
      chainId,
      contractAddress
    })
  } catch (error) {
    console.error('Activity feed error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

