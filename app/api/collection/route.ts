/**
 * Paginated collection API using MGET for efficient batch reads
 * 
 * WARNING: This is example code - adapt imports and types to your real project.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  redis,
  getStaticKeys,
  getDynamicKeys,
  getTokenURIKeys,
  getCollectionKey,
  getCachedBatch,
  STATIC_TTL,
} from '@/lib/redis'
import { getContractAddress } from '@/lib/networks'
import { getRpcUrl } from '@/lib/networks'

const ITEMS_PER_PAGE = 24

export async function GET(request: NextRequest) {
  try {
    const chainId = parseInt(request.nextUrl.searchParams.get('chainId') || '84532')
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const contractAddress = getContractAddress(chainId)

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address not found for chain' },
        { status: 400 }
      )
    }

    // Check if we have cached collection page
    const collectionKey = getCollectionKey(chainId, contractAddress, page)
    const cachedCollection = await redis.get<any>(collectionKey)

    console.log(`Collection API: Checking cache for key ${collectionKey}`)

    // If we have a cached collection but it has null data, don't use it
    // This allows fresh individual NFT data to be displayed
    if (cachedCollection && cachedCollection.nfts && cachedCollection.nfts.every((nft: any) => nft.cached === true)) {
      console.log(`Collection API: Cache hit with all cached data! Returning cached data`)
      return NextResponse.json(cachedCollection)
    } else if (cachedCollection) {
      console.log(`Collection API: Cache hit but data is stale, clearing cache and fetching fresh data`)
      // Clear the stale cache
      await redis.del(collectionKey)
    }

    console.log(`Collection API: Cache miss, fetching from blockchain`)

    // Get total supply from blockchain
    const rpcUrl = getRpcUrl(chainId)
    if (!rpcUrl) {
      return NextResponse.json(
        { error: 'RPC URL not configured' },
        { status: 500 }
      )
    }

    // Fetch totalSupply from contract
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

    const totalPages = Math.ceil(totalSupply / ITEMS_PER_PAGE)

    if (page > totalPages || page < 1) {
      return NextResponse.json(
        { error: 'Page out of range' },
        { status: 400 }
      )
    }

    // Calculate token IDs for this page
    const startTokenId = (page - 1) * ITEMS_PER_PAGE
    const endTokenId = Math.min(startTokenId + ITEMS_PER_PAGE - 1, totalSupply - 1)
    const tokenIds: number[] = []
    for (let i = startTokenId; i <= endTokenId; i++) {
      tokenIds.push(i)
    }

    // Batch fetch from cache
    console.log(`Collection API: Contract address: ${contractAddress}`)
    console.log(`Collection API: Static keys:`, getStaticKeys(chainId, contractAddress, tokenIds))

    const [staticData, dynamicData, tokenURIData] = await Promise.all([
      getCachedBatch<any>(getStaticKeys(chainId, contractAddress, tokenIds)),
      getCachedBatch<any>(getDynamicKeys(chainId, contractAddress, tokenIds)),
      getCachedBatch<string>(getTokenURIKeys(chainId, contractAddress, tokenIds)),
    ])

    console.log(`Collection API: Static data results:`, staticData)

    // Combine data
    const nfts = tokenIds.map((tokenId, index) => {
      const staticItem = staticData[index]
      const dynamicItem = dynamicData[index]
      const tokenURI = tokenURIData[index]

      return {
        tokenId,
        static: staticItem || null,
        dynamic: dynamicItem || null,
        tokenURI: tokenURI || null,
        cached: !!(staticItem || dynamicItem || tokenURI),
      }
    })

    // Build response
    const response = {
      page,
      totalPages,
      totalSupply,
      itemsPerPage: ITEMS_PER_PAGE,
      nfts,
      hasMore: page < totalPages,
    }

    // Cache the collection page (shorter TTL since it's a view)
    // Skip caching in development to allow testing
    if (process.env.NODE_ENV === 'production') {
      await redis.setex(collectionKey, 300, response) // 5 minutes
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Collection API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

