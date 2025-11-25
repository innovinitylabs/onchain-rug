import { NextRequest, NextResponse } from 'next/server'
import {
  redis,
  getRefreshOffsetKey,
  getRefreshOffset,
  setRefreshOffset,
} from '@/lib/redis'
import { batchRefreshRange } from '@/lib/refresh-utils'
import { getContractAddress, getRpcUrl } from '@/lib/networks'

// Configuration
const TOKENS_PER_CRON = parseInt(process.env.TOKENS_PER_CRON || '200')

export async function GET(request: NextRequest) {
  try {
    console.log('Cron API: Request received')

    const chainId = parseInt(request.nextUrl.searchParams.get('chainId') || '84532')
    const contractAddress = getContractAddress(chainId)

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address not found for chain' },
        { status: 400 }
      )
    }

    // Get total supply from blockchain
    const rpcUrl = getRpcUrl(chainId)
    if (!rpcUrl) {
      return NextResponse.json(
        { error: 'RPC URL not configured' },
        { status: 500 }
      )
    }

    const totalSupplyResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: contractAddress.toLowerCase(),
          data: '0x18160ddd' // totalSupply()
        }, 'latest']
      })
    })

    if (!totalSupplyResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch total supply' },
        { status: 500 }
      )
    }

    const totalSupplyData = await totalSupplyResponse.json()
    const totalSupply = totalSupplyData.result ? parseInt(totalSupplyData.result, 16) : 0

    // Get current offset
    const offset = await getRefreshOffset(chainId, contractAddress)
    const startTokenId = offset
    const endTokenId = Math.min(offset + TOKENS_PER_CRON - 1, totalSupply - 1)

    console.log(`Cron API: Refreshing tokens ${startTokenId} to ${endTokenId} (total: ${totalSupply})`)

    // Refresh static metadata
    console.log(`Cron API: Calling batchRefreshRange with range ${startTokenId}-${endTokenId}`)
    const staticRefreshResults = await batchRefreshRange(
      chainId,
      contractAddress as `0x${string}`,
      startTokenId,
      endTokenId
    )

    console.log(`Cron API: batchRefreshRange returned:`, typeof staticRefreshResults, Array.isArray(staticRefreshResults) ? staticRefreshResults.length : 'not array')

    // Update offset for next cron run
    const newOffset = endTokenId + 1
    console.log(`Cron API: Updating offset to ${newOffset}`)
    await setRefreshOffset(chainId, contractAddress, newOffset)

    // Ensure it's an array
    const results = Array.isArray(staticRefreshResults) ? staticRefreshResults : []
    const successful = results.filter(r => !r.error).length
    const failed = results.length - successful

    console.log(`Cron API: Final results`, {
      processed: results.length,
      successful,
      failed,
      newOffset
    })

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      staticCached: results.filter(r => r.static).length,
      offset: newOffset,
      totalSupply,
      nextRange: {
        start: newOffset,
        end: Math.min(newOffset + TOKENS_PER_CRON - 1, totalSupply - 1),
      },
    })

  } catch (error) {
    console.error('Cron API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
