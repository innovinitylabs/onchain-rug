import { NextRequest, NextResponse } from 'next/server'
import { TokenOperations } from '@/lib/redis-operations'
import { refreshTokenMetadata } from '@/lib/refresh-utils'
import { getContractAddress } from '@/lib/networks'
import { makeTokenId } from '@/lib/redis-schema'

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

    // Fetch real metadata from blockchain
    console.log(`Refresh One API: Fetching real blockchain data for token ${tokenId}`)
    const staticRefresh = await refreshTokenMetadata(chainId, contractAddress as `0x${string}`, tokenId)
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

    // Store using new TokenOperations system
    if (staticRefresh.static && staticRefresh.tokenURI) {
      const tokenData = {
        contractId: `${chainId}:${contractAddress}`,
        tokenId,
        owner: staticRefresh.static.owner || '0x0000000000000000000000000000000000000000',
        name: staticRefresh.static.name || `NFT #${tokenId}`,
        description: staticRefresh.static.description || '',
        image: staticRefresh.static.image || '',
        animation_url: staticRefresh.static.animation_url || '',
        traits: [], // Will be populated by trait extraction
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
        metadataHash: staticRefresh.hash || '',
        createdAt: new Date().toISOString()
      }

      await TokenOperations.storeToken(tokenData)
      console.log(`Refresh One API: Successfully cached token using new schema`)
    }

    return NextResponse.json({
      success: true,
      tokenId,
      chainId,
      cached: !!(staticRefresh.static && staticRefresh.tokenURI),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Refresh One API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
