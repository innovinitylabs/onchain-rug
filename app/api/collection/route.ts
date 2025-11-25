/**
 * Paginated collection API using MGET for efficient batch reads
 * 
 * WARNING: This is example code - adapt imports and types to your real project.
 */

import { NextRequest, NextResponse } from 'next/server'
import { TokenOperations } from '@/lib/redis-operations'
import { getContractAddress, getRpcUrl } from '@/lib/networks'
import { makeTokenId } from '@/lib/redis-schema'

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

    // TEMPORARILY DISABLE COLLECTION CACHING to ensure fresh data
    console.log(`Collection API: Skipping collection cache for fresh data`)

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

    // Calculate token IDs for this page (start from token 1 since token 0 doesn't exist)
    const startTokenId = Math.max((page - 1) * ITEMS_PER_PAGE, 1) // Start from token 1
    const endTokenId = Math.min(startTokenId + ITEMS_PER_PAGE - 1, totalSupply)
    const tokenIds: number[] = []
    for (let i = startTokenId; i <= endTokenId; i++) {
      tokenIds.push(i)
    }

    // Fetch token data using new TokenOperations system
    console.log(`Collection API: Contract address: ${contractAddress}`)
    console.log(`Collection API: Fetching ${tokenIds.length} tokens using TokenOperations`)

    // Fetch all tokens in parallel
    const tokenPromises = tokenIds.map(tokenId => {
      const tokenIdStr = makeTokenId(chainId, contractAddress, tokenId)
      return TokenOperations.getToken(tokenIdStr)
    })

    const tokenData = await Promise.all(tokenPromises)

    // Transform token data to match expected format
    const nfts = tokenIds.map((tokenId, index) => {
      const token = tokenData[index]

      if (token) {
        // Convert our token format to the format the gallery expects
        return {
          tokenId,
          static: {
            owner: token.owner,
            name: token.name,
            description: token.description,
            image: token.image,
            animation_url: token.animation_url,
            // Add other metadata as needed
          },
          dynamic: token.dynamic,
          tokenURI: '', // Could be derived if needed
          cached: true,
        }
      } else {
        // Token not cached - return null data
        return {
          tokenId,
          static: null,
          dynamic: null,
          tokenURI: null,
          cached: false,
        }
      }
    })

    console.log(`Collection API: Retrieved ${nfts.filter(n => n.cached).length}/${nfts.length} cached tokens`)

    // Build response
    const response = {
      page,
      totalPages,
      totalSupply,
      itemsPerPage: ITEMS_PER_PAGE,
      nfts,
      hasMore: page < totalPages,
    }

    // Collection caching disabled for fresh data

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

