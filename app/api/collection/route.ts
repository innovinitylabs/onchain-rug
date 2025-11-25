/**
 * Paginated collection API using MGET for efficient batch reads
 * 
 * WARNING: This is example code - adapt imports and types to your real project.
 */

import { NextRequest, NextResponse } from 'next/server'
import { TokenOperations } from '@/lib/redis-operations'
import { getContractAddress, getRpcUrl } from '@/lib/networks'
import { makeTokenId } from '@/lib/redis-schema'
import { refreshTokenMetadata } from '@/lib/refresh-utils'

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

    // Fetch token data using new TokenOperations system with blockchain fallback
    console.log(`Collection API: Contract address: ${contractAddress}`)
    console.log(`Collection API: Fetching ${tokenIds.length} tokens with blockchain fallback`)

    // Fetch all tokens in parallel with fallback logic
    const tokenPromises = tokenIds.map(async (tokenId) => {
      const tokenIdStr = makeTokenId(chainId, contractAddress, tokenId)

      // First, try to get from cache
      let token = await TokenOperations.getToken(tokenIdStr)

      // If not in cache, fetch from blockchain and cache it
      if (!token) {
        console.log(`Collection API: Token ${tokenId} not in cache, fetching from blockchain`)
        try {
          const blockchainData = await refreshTokenMetadata(chainId, contractAddress as `0x${string}`, tokenId)

          if (blockchainData.static && blockchainData.tokenURI) {
            // Cache the freshly fetched data
            const tokenData = {
              contractId: `${chainId}:${contractAddress}`,
              tokenId,
              owner: blockchainData.static.owner || '0x0000000000000000000000000000000000000000',
              name: blockchainData.static.name || `NFT #${tokenId}`,
              description: blockchainData.static.description || '',
              image: blockchainData.static.image || '',
              animation_url: blockchainData.static.animation_url || '',
              traits: [], // Will be populated by trait extraction if needed
              dynamic: {
                dirtLevel: 0,
                agingLevel: 0,
                lastMaintenance: new Date().toISOString(),
                maintenanceCount: 0,
                lastCleaning: new Date().toISOString(),
                cleaningCount: 0,
                lastRestoration: undefined,
                restorationCount: undefined
              },
              metadataHash: blockchainData.hash || '',
              lastRefresh: new Date().toISOString(),
              createdAt: new Date().toISOString()
            }

            await TokenOperations.storeToken(tokenData)
            token = tokenData // Use the newly cached data
            console.log(`Collection API: Successfully cached token ${tokenId} from blockchain`)
          }
        } catch (error) {
          console.error(`Collection API: Failed to fetch token ${tokenId} from blockchain:`, error)
        }
      }

      return token
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
        // Token not available (cache miss and blockchain fetch failed)
        return {
          tokenId,
          static: null,
          dynamic: null,
          tokenURI: null,
          cached: false,
        }
      }
    })

    const cachedCount = nfts.filter(n => n.cached).length
    console.log(`Collection API: Retrieved ${cachedCount}/${nfts.length} tokens (${cachedCount - tokenIds.length + nfts.filter(n => !n.cached).length} were cached from blockchain)`)

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

