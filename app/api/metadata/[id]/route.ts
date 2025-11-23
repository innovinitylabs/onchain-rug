/**
 * Get cached metadata for a single NFT
 * Returns cached data immediately, enqueues refresh if stale or missing
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
import { getContractAddress } from '@/lib/networks'
import type { Address } from 'viem'

interface MetadataResponse {
  tokenId: number
  static?: any
  dynamic?: {
    dirtLevel: number | null
    agingLevel: number | null
    owner: string | null
  }
  tokenURI?: string
  hash?: string
  loading?: boolean
  error?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokenId = parseInt(id)
    const chainId = parseInt(request.nextUrl.searchParams.get('chainId') || '84532')
    const contractAddress = getContractAddress(chainId) as Address

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

    // Try to get cached data
    const [staticData, dynamicData, tokenURIData, hashData] = await Promise.all([
      redis.get(getStaticKey(chainId, contractAddress, tokenId)),
      redis.get(getDynamicKey(chainId, contractAddress, tokenId)),
      redis.get(getTokenURIKey(chainId, contractAddress, tokenId)),
      redis.get(getHashKey(chainId, contractAddress, tokenId)),
    ])

    const response: MetadataResponse = {
      tokenId,
    }

    // Add cached static data
    if (staticData) {
      response.static = staticData
    }

    // Add cached dynamic data
    if (dynamicData) {
      response.dynamic = dynamicData as any
    }

    // Add cached tokenURI
    if (tokenURIData) {
      response.tokenURI = tokenURIData as string
    }

    // Add cached hash
    if (hashData) {
      response.hash = hashData as string
    }

    // If we have some data, return it (stale-while-revalidate)
    if (staticData || dynamicData) {
      // Enqueue background refresh if data is stale or missing
      const needsRefresh = !staticData || !dynamicData || !tokenURIData

      if (needsRefresh) {
        // Trigger background refresh (non-blocking)
        fetch(`${request.nextUrl.origin}/api/refresh-one?tokenId=${tokenId}&chainId=${chainId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(err => {
          console.error('Background refresh failed:', err)
        })
      }

      return NextResponse.json(response)
    }

    // No cached data - return 202 and trigger refresh
    response.loading = true

    // Trigger refresh in background
    fetch(`${request.nextUrl.origin}/api/refresh-one?tokenId=${tokenId}&chainId=${chainId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(err => {
      console.error('Background refresh failed:', err)
    })

    return NextResponse.json(response, { status: 202 })
  } catch (error) {
    console.error('Metadata API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

