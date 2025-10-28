import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const resolvedParams = await params
    const userAddress = resolvedParams.address.toLowerCase()

    // For now, return empty array as we don't have efficient user listing lookup
    // In a production system, you'd need an indexer or off-chain database
    // The smart contract only has token-centric mappings, not user-centric ones
    const listings: any[] = []

    return NextResponse.json({
      listings,
      totalCount: listings.length
    })
  } catch (error) {
    console.error('Error fetching user listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings', listings: [], totalCount: 0 },
      { status: 500 }
    )
  }
}
