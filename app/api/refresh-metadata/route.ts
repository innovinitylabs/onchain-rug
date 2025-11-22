/**
 * Cron endpoint for batch refresh of metadata
 * Processes collection in bounded batches using offset stored in Redis
 * 
 * WARNING: This is example code - adapt imports and types to your real project.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  redis,
  getRefreshOffsetKey,
  getRefreshOffset,
  setRefreshOffset,
} from '@/lib/redis'
import { batchRefreshRange } from '@/lib/refresh-utils'
import { batchReadDynamicData } from '@/lib/multicall'
import { getContractAddress } from '@/lib/networks'
import { createChainClient } from '@/lib/multicall'
import { onchainRugsABI } from '@/lib/web3'
import type { Address } from 'viem'

// Configuration
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100')
const TOKENS_PER_CRON = parseInt(process.env.TOKENS_PER_CRON || '200') // Tokens to process per cron run

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.VERCEL_CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
    } as any)

    const totalSupply = Number(totalSupplyResult)
    if (totalSupply === 0) {
      return NextResponse.json({
        success: true,
        message: 'No NFTs to refresh',
        processed: 0,
      })
    }

    // Get current offset
    const offset = await getRefreshOffset(chainId, contractAddress)
    
    // Calculate range to process
    const startTokenId = offset
    const endTokenId = Math.min(offset + TOKENS_PER_CRON - 1, totalSupply - 1)

    if (startTokenId >= totalSupply) {
      // Reset offset if we've processed all tokens
      await setRefreshOffset(chainId, contractAddress, 0)
      return NextResponse.json({
        success: true,
        message: 'All tokens processed, reset offset',
        processed: 0,
        offset: 0,
      })
    }

    console.log(`Refreshing tokens ${startTokenId} to ${endTokenId} (total: ${totalSupply})`)

    // Refresh static metadata (tokenURI, traits)
    const { batchRefreshMetadata } = await import('@/lib/refresh-utils')
    const tokenIds: number[] = []
    for (let i = startTokenId; i <= endTokenId; i++) {
      tokenIds.push(i)
    }

    const staticRefreshResults = await batchRefreshMetadata(
      chainId,
      contractAddress,
      tokenIds
    )

    // Refresh dynamic data (dirt level, aging level, owner)
    const dynamicRefresh = await batchReadDynamicData(chainId, contractAddress, tokenIds)

    // Cache the results
    const cacheEntries: Array<{ key: string; value: any; ttl: number }> = []
    const {
      getStaticKey,
      getDynamicKey,
      getTokenURIKey,
      getHashKey,
      STATIC_TTL,
      DYNAMIC_TTL,
      TOKENURI_TTL,
    } = await import('@/lib/redis')

    // Process static refresh results
    for (const result of staticRefreshResults) {
      if (result.static && !result.error) {
        cacheEntries.push({
          key: getStaticKey(chainId, contractAddress, result.tokenId),
          value: result.static,
          ttl: STATIC_TTL,
        })
      }
      if (result.tokenURI) {
        cacheEntries.push({
          key: getTokenURIKey(chainId, contractAddress, result.tokenId),
          value: result.tokenURI,
          ttl: TOKENURI_TTL,
        })
      }
      if (result.hash) {
        cacheEntries.push({
          key: getHashKey(chainId, contractAddress, result.tokenId),
          value: result.hash,
          ttl: STATIC_TTL,
        })
      }
    }

    // Process dynamic refresh results
    for (const dynamicData of dynamicRefresh) {
      if (!dynamicData.error) {
        cacheEntries.push({
          key: getDynamicKey(chainId, contractAddress, dynamicData.tokenId),
          value: {
            dirtLevel: dynamicData.dirtLevel,
            agingLevel: dynamicData.agingLevel,
            owner: dynamicData.owner,
          },
          ttl: DYNAMIC_TTL,
        })
      }
    }

    // Write dynamic data to cache
    if (cacheEntries.length > 0) {
      const pipeline = redis.pipeline()
      for (const entry of cacheEntries) {
        pipeline.setex(entry.key, entry.ttl, entry.value)
      }
      await pipeline.exec()
    }

    // Update offset for next cron run
    const newOffset = endTokenId + 1
    await setRefreshOffset(chainId, contractAddress, newOffset)

    const successful = staticRefreshResults.filter(r => !r.error && r.static).length
    const failed = staticRefreshResults.length - successful
    const errors = staticRefreshResults
      .filter(r => r.error)
      .map(r => ({ tokenId: r.tokenId, error: r.error!.message }))
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      processed: staticRefreshResults.length,
      successful,
      failed,
      staticCached: staticRefreshResults.filter(r => r.static).length,
      dynamicCached: dynamicRefresh.filter(r => !r.error).length,
      totalCached: cacheEntries.length,
      offset: newOffset,
      totalSupply,
      nextRange: {
        start: newOffset,
        end: Math.min(newOffset + TOKENS_PER_CRON - 1, totalSupply - 1),
      },
      errors,
    })
  } catch (error) {
    console.error('Refresh metadata API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

