import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from './rug-market-redis'
import { fetchNFTsFromBlockchain } from './blockchain-fetcher'
import { fetchTotalSupply } from './direct-contract-fetcher'
import { getContractAddress } from './networks'

// BigInt serialization fix for JSON responses
// Polyfill BigInt.prototype.toJSON for JSON serialization
const originalBigIntToJSON = (BigInt.prototype as any).toJSON
;(BigInt.prototype as any).toJSON = function() {
  return this.toString()
}

export async function GET(request: NextRequest) {
  console.log('[Collection API] ===== REQUEST RECEIVED =====')

  try {
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || '84532')
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')
    const clearCache = searchParams.get('clearCache') === 'true'

    console.log(`[Collection API] chainId: ${chainId}, limit: ${limit}, offset: ${offset}, clearCache: ${clearCache}`)

    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      console.error(`[Collection API] No contract address for chain ${chainId}`)
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 })
    }

    console.log(`[Collection API] Contract: ${contractAddress}`)

    // Get total supply from blockchain
    console.log(`[Collection API] Fetching total supply from blockchain...`)
    const totalSupply = await fetchTotalSupply(chainId)
    console.log(`[Collection API] Total supply from blockchain: ${totalSupply}`)

    if (totalSupply === 0) {
      console.log('[Collection API] No NFTs in collection')
  return NextResponse.json({
        nfts: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
          offset: 0
        },
        stats: {
          totalNFTs: 0,
          floorPrice: '0',
          volume24h: '0',
          sales24h: 0
        },
        filters: {}
      })
    }

    // Calculate pagination
    const allTokenIds = Array.from({ length: totalSupply }, (_, i) => i + 1)
    const paginatedTokenIds = allTokenIds.slice(offset, offset + limit)
    const totalPages = Math.ceil(totalSupply / limit)
    const currentPage = Math.floor(offset / limit) + 1

    console.log(`[Collection API] Fetching ${paginatedTokenIds.length} NFTs (tokens ${paginatedTokenIds[0]}-${paginatedTokenIds[paginatedTokenIds.length - 1]})`)

    // Clear cache if requested
    if (clearCache) {
      console.log(`[Collection API] Clearing Redis cache for ${paginatedTokenIds.length} NFTs`)
      await RugMarketRedis.clearNFTDataBatch(chainId, contractAddress, paginatedTokenIds)
    }

    // Try to get NFTs from Redis first
    console.log(`[Collection API] Checking Redis cache...`)
    const cachedNFTs = await RugMarketRedis.getNFTDataBatch(chainId, contractAddress, paginatedTokenIds)
    const validCachedNFTs = cachedNFTs.filter((nft): nft is NonNullable<typeof nft> => nft !== null)

    console.log(`[Collection API] Found ${validCachedNFTs.length} NFTs in Redis cache`)

    let nfts: any[] = []
    const missingTokenIds = paginatedTokenIds.filter((_, index) => cachedNFTs[index] === null)
    const nftMap = new Map<number, any>()

    if (missingTokenIds.length > 0) {
      console.log(`[Collection API] Fetching ${missingTokenIds.length} missing NFTs from blockchain...`)
      console.log(`[Collection API] About to call fetchNFTsFromBlockchain with tokens:`, missingTokenIds)
      try {
        const blockchainNFTs = await fetchNFTsFromBlockchain(chainId, contractAddress, missingTokenIds)
        console.log(`[Collection API] Fetched ${blockchainNFTs.length} NFTs from blockchain`)

        // Store fetched NFTs in Redis
        for (const nft of blockchainNFTs) {
          await RugMarketRedis.setNFTData(chainId, contractAddress, nft.permanent.tokenId, nft)
        }
        console.log(`[Collection API] Stored ${blockchainNFTs.length} NFTs in Redis cache`)

        // Combine cached and fresh NFTs in correct order
        validCachedNFTs.forEach(nft => nftMap.set(nft.permanent.tokenId, nft))
        blockchainNFTs.forEach(nft => nftMap.set(nft.permanent.tokenId, nft))

        nfts = paginatedTokenIds.map(tokenId => nftMap.get(tokenId)).filter(Boolean)
      } catch (blockchainError) {
        console.error('[Collection API] Failed to fetch from blockchain:', blockchainError)
        console.error('[Collection API] Error details:', {
          message: blockchainError instanceof Error ? blockchainError.message : String(blockchainError),
          stack: blockchainError instanceof Error ? blockchainError.stack : undefined
        })
        // FAIL COMPLETELY - no hardcoded fallbacks
        throw new Error(`Blockchain data fetching failed: ${blockchainError instanceof Error ? blockchainError.message : String(blockchainError)}`)
      }
    } else {
      // All NFTs were cached
      nfts = validCachedNFTs
    }

    console.log(`[Collection API] Returning ${nfts.length} NFTs`)

    // Calculate collection stats
    const stats = {
      totalNFTs: totalSupply,
      floorPrice: '0.01',
      volume24h: '0.05',
      sales24h: 1
    }

    return NextResponse.json({
      nfts,
      pagination: {
        page: currentPage,
        limit,
        total: totalSupply,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        offset
      },
      stats,
      filters: {}
    })

  } catch (error) {
    console.error('[Collection API] ===== ERROR =====')
    console.error('Collection API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({
      error: 'Failed to fetch collection data',
      errorDetails: error instanceof Error ? error.message : String(error),
      nfts: [],
    pagination: {
      page: 1,
      limit: 24,
        total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    },
      stats: {
        totalNFTs: 0,
        floorPrice: '0',
        volume24h: '0',
        sales24h: 0
      },
    filters: {}
    }, { status: 500 })
  }
}
