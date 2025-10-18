import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { shapeSepolia } from '@/lib/web3'

/**
 * Floor Price API
 * Returns the lowest active listing price
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chain = searchParams.get('chain') || '360'

    // TODO: Query all active listings and find minimum price
    // For now, return null - will calculate from on-chain data
    
    return NextResponse.json({
      floorPrice: null,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Floor price error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch floor price' },
      { status: 500 }
    )
  }
}

