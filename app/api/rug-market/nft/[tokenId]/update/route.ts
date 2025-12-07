/**
 * POST /api/rug-market/nft/[tokenId]/update
 *
 * Update NFT data after user actions (maintenance, marketplace, etc.)
 * Updates Redis cache and triggers blockchain transaction if needed
 */

import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from '@/lib/rug-market-redis'
import { RugDynamicData, MarketplaceActivity } from '@/lib/rug-market-types'
import { contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'

interface UpdateRequest {
  action: 'maintenance' | 'listing' | 'delisting' | 'sale' | 'transfer'
  data: Partial<RugDynamicData>
  txHash?: string
  maintenanceType?: 'cleaning' | 'restoration' | 'laundering'
}

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
    const chainId = parseInt(searchParams.get('chainId') || config.chainId.toString())

    const contractAddress = contractAddresses[chainId]
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      )
    }

    // Parse request body
    const body: UpdateRequest = await request.json()
    const { action, data, txHash, maintenanceType } = body

    if (!action || !data) {
      return NextResponse.json(
        { error: 'Missing action or data' },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating NFT ${tokenId} for action: ${action}`)

    // Validate action type
    const validActions = ['maintenance', 'listing', 'delisting', 'sale', 'transfer']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    // Update Redis data
    await RugMarketRedis.updateDynamicData(chainId, contractAddress, tokenId, data)

    // Log activity for certain actions
    if (['maintenance', 'listing', 'delisting', 'sale'].includes(action)) {
      const activity: MarketplaceActivity = {
        id: `${action}-${tokenId}-${Date.now()}`,
        type: action as any,
        tokenId,
        timestamp: BigInt(Date.now()),
        txHash: txHash || '',
        price: data.listingPrice,
        from: data.currentOwner,
        to: action === 'sale' ? data.ownershipHistory?.[data.ownershipHistory.length - 1]?.owner : undefined
      }

      await RugMarketRedis.addActivity(chainId, contractAddress, activity)
    }

    // Special handling for maintenance actions
    if (action === 'maintenance' && maintenanceType) {
      console.log(`🧹 Maintenance action: ${maintenanceType} for NFT ${tokenId}`)

      // Here we would trigger the blockchain transaction
      // For now, we'll just update the cache
      // TODO: Integrate with actual maintenance contract calls
    }

    console.log(`✅ Successfully updated NFT ${tokenId} for ${action}`)

    return NextResponse.json({
      success: true,
      message: `NFT ${tokenId} updated successfully`,
      action,
      tokenId
    })

  } catch (error) {
    console.error('Update API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
