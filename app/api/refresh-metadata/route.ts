import { NextRequest, NextResponse } from 'next/server'
import {
  redis,
  getRefreshOffsetKey,
  getRefreshOffset,
  setRefreshOffset,
} from '@/lib/redis'
import { batchRefreshRange } from '@/lib/refresh-utils'
import { getContractAddress } from '@/lib/networks'
import { createChainClient } from '@/lib/multicall'
import { onchainRugsABI } from '@/lib/web3'
import type { Address } from 'viem'

// Configuration
const TOKENS_PER_CRON = parseInt(process.env.TOKENS_PER_CRON || '200')

export async function GET(request: NextRequest) {
  try {
    console.log('Cron API: Request received')

    const chainId = parseInt(request.nextUrl.searchParams.get('chainId') || '84532')
    const contractAddress = getContractAddress(chainId) as Address

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address not found for chain' },
        { status: 400 }
      )
    }

    // Get total supply
    const client = createChainClient(chainId)
    const totalSupplyResult = await client.readContract({
      address: contractAddress,
      abi: onchainRugsABI,
      functionName: 'totalSupply',
      authorizationList: [],
    })
    const totalSupply = Number(totalSupplyResult)

    // Get current offset
    const offset = await getRefreshOffset(chainId, contractAddress)
    const startTokenId = offset
    const endTokenId = Math.min(offset + TOKENS_PER_CRON - 1, totalSupply - 1)

    console.log(`Cron API: Refreshing tokens ${startTokenId} to ${endTokenId} (total: ${totalSupply})`)

    // Refresh static metadata
    const staticRefreshResults = await batchRefreshRange(
      chainId,
      contractAddress,
      startTokenId,
      endTokenId
    )

    // Update offset for next cron run
    const newOffset = endTokenId + 1
    console.log(`Cron API: Updating offset to ${newOffset}`)
    await setRefreshOffset(chainId, contractAddress, newOffset)

    const successful = staticRefreshResults.filter(r => !r.error).length
    const failed = staticRefreshResults.length - successful

    console.log(`Cron API: Final results`, {
      processed: staticRefreshResults.length,
      successful,
      failed,
      newOffset
    })

    return NextResponse.json({
      success: true,
      processed: staticRefreshResults.length,
      successful,
      failed,
      staticCached: staticRefreshResults.filter(r => r.static).length,
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
