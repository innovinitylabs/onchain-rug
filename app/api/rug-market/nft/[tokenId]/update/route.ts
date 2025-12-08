/**
 * POST /api/rug-market/nft/[tokenId]/update
 *
 * Update NFT data after user actions (maintenance, marketplace, etc.)
 * Updates Redis cache and triggers blockchain transaction if needed
 */

import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from '../../../collection/rug-market-redis'
import { RugDynamicData, MarketplaceActivity } from '../../../collection/rug-market-types'
import { getContractAddress } from '../../../collection/networks'

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
    const chainId = parseInt(searchParams.get('chainId') || '84532')

    const contractAddress = getContractAddress(chainId)
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

    // Filter out calculated fields - only update stored fields
    // Remove dirtLevel and agingLevel if they're in the data (they're calculated, not stored)
    const { dirtLevel, agingLevel, ...storedData } = data as any
    
    if (dirtLevel !== undefined || agingLevel !== undefined) {
      console.warn(`[Update API] Attempted to update calculated fields (dirtLevel=${dirtLevel}, agingLevel=${agingLevel}). These will be ignored.`)
    }

    // Ensure we're only updating stored fields
    // Convert string BigInt values back to BigInt
    const updateData: Partial<RugDynamicData> = {
      ...storedData,
      // Explicitly ensure calculated fields are not included
    }
    delete (updateData as any).dirtLevel
    delete (updateData as any).agingLevel
    
    // Convert lastCleaned from string to BigInt if provided
    if ((updateData as any).lastCleaned !== undefined) {
      const lastCleanedValue = (updateData as any).lastCleaned
      if (typeof lastCleanedValue === 'string') {
        (updateData as any).lastCleaned = BigInt(lastCleanedValue)
      } else if (typeof lastCleanedValue === 'number') {
        (updateData as any).lastCleaned = BigInt(lastCleanedValue)
      }
    }

    // Update Redis data (only stored fields)
    await RugMarketRedis.updateDynamicData(chainId, contractAddress, tokenId, updateData)

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
