/**
 * Refresh metadata for a single token (idempotent, safe)
 * 
 * WARNING: This is example code - adapt imports and types to your real project.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  redis,
  getStaticKey,
  getDynamicKey,
  getTokenURIKey,
  getHashKey,
  STATIC_TTL,
  DYNAMIC_TTL,
  TOKENURI_TTL,
} from '@/lib/redis'
import { batchReadDynamicData } from '@/lib/refresh-utils'
import { refreshTokenMetadata } from '@/lib/refresh-utils'
import { getContractAddress } from '@/lib/networks'
import type { Address } from 'viem'

export async function POST(request: NextRequest) {
  try {
    const tokenId = parseInt(request.nextUrl.searchParams.get('tokenId') || '')
    const chainId = parseInt(request.nextUrl.searchParams.get('chainId') || '84532')
    const contractAddress = getContractAddress(chainId) as Address

    console.log(`Refresh One API: Refreshing token ${tokenId} on chain ${chainId}, contract ${contractAddress}`)

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address not found for chain' },
        { status: 400 }
      )
    }

    if (isNaN(tokenId)) {
      return NextResponse.json(
        { error: 'Invalid token ID' },
        { status: 400 }
      )
    }

    // Refresh static metadata (tokenURI, traits)
    console.log(`Refresh One API: Fetching static metadata`)
    const staticRefresh = await refreshTokenMetadata(chainId, contractAddress, tokenId)
    console.log(`Refresh One API: Static refresh result:`, { hasStatic: !!staticRefresh.static, hasTokenURI: !!staticRefresh.tokenURI, error: staticRefresh.error?.message })

    // Refresh dynamic data (dirt level, aging level, owner)
    console.log(`Refresh One API: Fetching dynamic data`)
    const dynamicRefresh = await batchReadDynamicData(chainId, contractAddress, [tokenId])
    const dynamicData = dynamicRefresh[0]
    console.log(`Refresh One API: Dynamic refresh result:`, { dirtLevel: dynamicData?.dirtLevel, agingLevel: dynamicData?.agingLevel, owner: dynamicData?.owner, error: dynamicData?.error?.message })

    // Prepare cache entries
    const cacheEntries: Array<{ key: string; value: any; ttl: number }> = []

    // Cache static data if available
    if (staticRefresh.static && !staticRefresh.error) {
      cacheEntries.push({
        key: getStaticKey(chainId, contractAddress, tokenId),
        value: staticRefresh.static,
        ttl: STATIC_TTL,
      })
    }

    // Cache tokenURI if available
    if (staticRefresh.tokenURI) {
      cacheEntries.push({
        key: getTokenURIKey(chainId, contractAddress, tokenId),
        value: staticRefresh.tokenURI,
        ttl: TOKENURI_TTL,
      })
    }

    // Cache hash if available
    if (staticRefresh.hash) {
      cacheEntries.push({
        key: getHashKey(chainId, contractAddress, tokenId),
        value: staticRefresh.hash,
        ttl: STATIC_TTL, // Hash doesn't change, use static TTL
      })
    }

    // Cache dynamic data
    if (dynamicData && !dynamicData.error) {
      cacheEntries.push({
        key: getDynamicKey(chainId, contractAddress, tokenId),
        value: {
          dirtLevel: dynamicData.dirtLevel,
          agingLevel: dynamicData.agingLevel,
          owner: dynamicData.owner,
        },
        ttl: DYNAMIC_TTL,
      })
    }

    // Write to cache
    console.log(`Refresh One API: Writing ${cacheEntries.length} cache entries`)
    if (cacheEntries.length > 0) {
      const pipeline = redis.pipeline()
      for (const entry of cacheEntries) {
        console.log(`Refresh One API: Caching key ${entry.key} for ${entry.ttl}s`)
        pipeline.setex(entry.key, entry.ttl, entry.value)
      }
      await pipeline.exec()
      console.log(`Refresh One API: Cache write complete`)
    }

    return NextResponse.json({
      success: true,
      tokenId,
      static: staticRefresh.static ? true : false,
      dynamic: dynamicData && !dynamicData.error,
      errors: {
        static: staticRefresh.error?.message,
        dynamic: dynamicData?.error?.message,
      },
    })
  } catch (error) {
    console.error('Refresh one API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

