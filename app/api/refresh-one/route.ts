import { NextRequest, NextResponse } from 'next/server'
import {
  redis,
  getStaticKey,
  getDynamicKey,
  getTokenURIKey,
  getHashKey,
  STATIC_TTL,
  TOKENURI_TTL,
} from '@/lib/redis'
import { refreshTokenMetadata, computeTokenURIHash } from '@/lib/refresh-utils'
import { getContractAddress } from '@/lib/networks'
import type { Address } from 'viem'

export async function POST(request: NextRequest) {
  try {
    const tokenId = parseInt(request.nextUrl.searchParams.get('tokenId') || '')
    const chainId = parseInt(request.nextUrl.searchParams.get('chainId') || '84532')
    const contractAddress = getContractAddress(chainId)

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

    console.log(`Refresh One API: Refreshing token ${tokenId} on chain ${chainId}`)
    console.log(`Refresh One API: Contract address: ${contractAddress}`)
    console.log(`Refresh One API: Static key:`, getStaticKey(chainId, contractAddress, tokenId))

    // Fetch real metadata from blockchain
    console.log(`Refresh One API: Fetching real blockchain data for token ${tokenId}`)
    const staticRefresh = await refreshTokenMetadata(chainId, contractAddress, tokenId)
    console.log(`Refresh One API: Blockchain data result:`, {
      hasStatic: !!staticRefresh.static,
      hasTokenURI: !!staticRefresh.tokenURI,
      hasError: !!staticRefresh.error,
      error: staticRefresh.error?.message
    })

    if (staticRefresh.error) {
      console.error(`Refresh One API: Blockchain fetch failed:`, staticRefresh.error)
      return NextResponse.json(
        { error: `Failed to fetch NFT data: ${staticRefresh.error.message}` },
        { status: 500 }
      )
    }

    console.log(`Refresh One API: Real data loaded:`, staticRefresh.static)

    // Write to cache
    const cacheEntries: Array<{ key: string; value: any; ttl: number }> = []

    // Cache static data if available
    if (staticRefresh.static) {
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
        ttl: STATIC_TTL,
      })
    }

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
      staticCached: !!staticRefresh.static,
      tokenURICached: !!staticRefresh.tokenURI,
      hashCached: !!staticRefresh.hash,
      totalCached: cacheEntries.length,
    })

  } catch (error) {
    console.error('Refresh One API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
