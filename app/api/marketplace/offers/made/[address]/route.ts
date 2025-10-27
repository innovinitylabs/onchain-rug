import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const resolvedParams = await params
    const userAddress = resolvedParams.address.toLowerCase()

    // For now, return empty array as we don't have efficient user offer lookup
    // In a production system, you'd need an indexer or off-chain database
    // The smart contract only has token-centric mappings, not user-centric ones
    const offers: any[] = []

    return NextResponse.json({
      offers,
      totalCount: offers.length
    })
  } catch (error) {
    console.error('Error fetching user offers made:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers', offers: [], totalCount: 0 },
      { status: 500 }
    )
  }
}
