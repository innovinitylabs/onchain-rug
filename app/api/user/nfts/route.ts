import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from '@/app/api/rug-market/collection/rug-market-redis'
import { fetchNFTsFromBlockchain } from '@/app/api/rug-market/collection/blockchain-fetcher'
import { getContractAddress } from '@/app/api/rug-market/collection/networks'
import { RugMarketNFTWithCalculated } from '@/app/api/rug-market/collection/rug-market-types'
import { callContractMultiFallback, onchainRugsABI } from '@/lib/web3'

// BigInt serialization fix for JSON responses
const originalBigIntToJSON = (BigInt.prototype as any).toJSON
;(BigInt.prototype as any).toJSON = function() {
  return this.toString()
}

export async function GET(request: NextRequest) {
  console.log('[User NFTs API] ===== REQUEST RECEIVED =====')

  try {
    const { searchParams } = new URL(request.url)
    const ownerAddress = searchParams.get('owner')
    const chainId = parseInt(searchParams.get('chainId') || '84532')

    if (!ownerAddress) {
      return NextResponse.json(
        { error: 'Owner address required', details: 'Provide owner address as query parameter: ?owner=0x...' },
        { status: 400 }
      )
    }

    if (!ownerAddress.startsWith('0x') || ownerAddress.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid owner address format' },
        { status: 400 }
      )
    }

    console.log(`[User NFTs API] Fetching NFTs for owner ${ownerAddress} on chain ${chainId}`)

    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      console.error(`[User NFTs API] No contract address for chain ${chainId}`)
      return NextResponse.json({ error: 'Unsupported chain' }, { status: 400 })
    }

    // First, get the list of owned token IDs efficiently
    const ownedTokenIds = await getOwnedTokenIds(ownerAddress, contractAddress, chainId)

    if (ownedTokenIds.length === 0) {
      console.log(`[User NFTs API] No NFTs found for owner ${ownerAddress}`)
      return NextResponse.json({
        ownedNfts: []
      })
    }

    console.log(`[User NFTs API] Found ${ownedTokenIds.length} NFTs owned by ${ownerAddress}`)

    // Now fetch NFT data using the SAME Redis infrastructure as marketplace
    const cachedNFTs = await RugMarketRedis.getNFTDataBatch(chainId, contractAddress, ownedTokenIds)
    const validCachedNFTs = cachedNFTs.filter((nft): nft is NonNullable<typeof nft> => nft !== null)

    console.log(`[User NFTs API] Found ${validCachedNFTs.length} NFTs in Redis cache`)

    let nfts: any[] = []
    const missingTokenIds = ownedTokenIds.filter((_, index) => cachedNFTs[index] === null)

    if (missingTokenIds.length > 0) {
      console.log(`[User NFTs API] Fetching ${missingTokenIds.length} missing NFTs from blockchain...`)

      try {
        const blockchainNFTs = await fetchNFTsFromBlockchain(chainId, contractAddress, missingTokenIds)
        console.log(`[User NFTs API] Fetched ${blockchainNFTs.length} NFTs from blockchain`)

        // Store fetched NFTs in Redis using SAME logic as marketplace
        for (const nft of blockchainNFTs) {
          await RugMarketRedis.setNFTData(chainId, contractAddress, nft.permanent.tokenId, nft)
        }
        console.log(`[User NFTs API] Stored ${blockchainNFTs.length} NFTs in Redis cache`)

        // Get stored NFTs back from Redis to get calculated values
        const storedNFTs = await RugMarketRedis.getNFTDataBatch(chainId, contractAddress, missingTokenIds)
        const validStoredNFTs = storedNFTs.filter((nft): nft is RugMarketNFTWithCalculated => {
          if (!nft) return false
          if (!('dirtLevel' in nft.dynamic) || !('agingLevel' in nft.dynamic)) {
            console.warn(`[User NFTs API] NFT ${nft.permanent.tokenId} missing calculated values after storage`)
            return false
          }
          return true
        })

        // Combine cached and fresh NFTs in correct order
        validCachedNFTs.forEach(nft => {
          if (nft.permanent.owner?.toLowerCase() === ownerAddress.toLowerCase()) {
            nfts.push(nft)
          }
        })
        validStoredNFTs.forEach(nft => {
          if (nft.permanent.owner?.toLowerCase() === ownerAddress.toLowerCase()) {
            nfts.push(nft)
          }
        })

      } catch (blockchainError) {
        console.error('[User NFTs API] Failed to fetch from blockchain:', blockchainError)
        // Return cached NFTs only if blockchain fetch fails
        // Since we already verified ownership, we can return all cached NFTs
        nfts = validCachedNFTs
      }
    } else {
      // All NFTs were cached - we already verified ownership through multicall
      // No need to filter again since we only fetched owned token IDs
      nfts = validCachedNFTs
    }

    console.log(`[User NFTs API] Returning ${nfts.length} NFTs for owner ${ownerAddress}`)

    // Transform to match dashboard expected format (same as Alchemy response)
    const ownedNfts = nfts.map(nft => ({
      tokenId: nft.permanent.tokenId.toString(),
      id: {
        tokenId: nft.permanent.tokenId.toString()
      },
      contract: {
        address: contractAddress
      },
      title: nft.permanent.name || `Rug #${nft.permanent.tokenId}`,
      description: nft.permanent.description,
      tokenType: 'ERC721',
      media: [{
        gateway: nft.permanent.image,
        thumbnail: nft.permanent.image,
        raw: nft.permanent.image,
        format: 'png',
        bytes: 0
      }],
      metadata: {
        name: nft.permanent.name,
        description: nft.permanent.description,
        image: nft.permanent.image,
        animation_url: nft.dynamic.animationUrl,
        attributes: [
          { trait_type: 'Complexity', value: nft.dynamic.complexity },
          { trait_type: 'Character Count', value: nft.permanent.characterCount?.toString() },
          { trait_type: 'Stripe Count', value: nft.permanent.stripeCount?.toString() },
          { trait_type: 'Warp Thickness', value: nft.permanent.warpThickness },
          { trait_type: 'Palette', value: nft.permanent.paletteName },
          { trait_type: 'Dirt Level', value: nft.dynamic.dirtLevel },
          { trait_type: 'Aging Level', value: nft.dynamic.agingLevel },
          { trait_type: 'Last Sale Price', value: nft.dynamic.lastSalePrice?.toString() },
          { trait_type: 'Laundering Count', value: nft.dynamic.launderingCount?.toString() },
          { trait_type: 'Cleaning Count', value: nft.dynamic.cleaningCount?.toString() },
          { trait_type: 'Restoration Count', value: nft.dynamic.restorationCount?.toString() },
          { trait_type: 'Master Restoration Count', value: nft.dynamic.masterRestorationCount?.toString() },
          { trait_type: 'Maintenance Score', value: nft.dynamic.maintenanceScore?.toString() },
          { trait_type: 'Frame Level', value: nft.dynamic.frameLevelString || 'None' },
          { trait_type: 'Museum Piece', value: nft.dynamic.isMuseumPiece ? 'true' : 'false' }
        ],
        rugData: {
          seed: nft.permanent.seed?.toString(),
          paletteName: nft.permanent.paletteName,
          minifiedPalette: nft.permanent.minifiedPalette,
          minifiedStripeData: nft.permanent.minifiedStripeData,
          textRows: nft.permanent.textRows,
          warpThickness: nft.permanent.warpThickness,
          curator: nft.permanent.curator,
          mintTime: nft.permanent.mintTime?.toString(),
          filteredCharacterMap: nft.permanent.filteredCharacterMap,
          characterCount: nft.permanent.characterCount?.toString(),
          stripeCount: nft.permanent.stripeCount?.toString()
        }
      },
      timeLastUpdated: Date.now().toString()
    }))

    // Return in same format as Alchemy API for minimal dashboard changes
    return NextResponse.json({
      ownedNfts
    })

  } catch (error) {
    console.error('[User NFTs API] ===== ERROR =====')
    console.error('User NFTs API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({
      error: 'Failed to fetch user NFTs',
      errorDetails: error instanceof Error ? error.message : String(error),
      ownedNfts: [],
    }, { status: 500 })
  }
}

// Helper function to get owned token IDs efficiently using multicall
async function getOwnedTokenIds(ownerAddress: string, contractAddress: string, chainId: number): Promise<number[]> {
  // Get total supply first
  const totalSupply = await callContractMultiFallback(
    contractAddress,
    onchainRugsABI,
    'totalSupply',
    [],
    { chainId }
  ) as unknown as bigint

  console.log(`[User NFTs API] Total supply: ${totalSupply}, scanning tokens for owner ${ownerAddress}...`)

  const ownedRugs: number[] = []
  const batchSize = 50 // Smaller batch size for better error handling
  const maxTokenId = Number(totalSupply)

  // Token IDs typically start from 1, not 0
  for (let startTokenId = 1; startTokenId <= maxTokenId; startTokenId += batchSize) {
    const endTokenId = Math.min(startTokenId + batchSize - 1, maxTokenId)
    const tokenIds = Array.from({ length: endTokenId - startTokenId + 1 }, (_, i) => startTokenId + i)

    console.log(`[User NFTs API] Checking tokens ${startTokenId}-${endTokenId}...`)

    // Use Promise.allSettled to check ownership of multiple tokens efficiently
    const ownershipResults = await Promise.allSettled(
      tokenIds.map(tokenId =>
        callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'ownerOf',
          [BigInt(tokenId)],
          { chainId }
        )
      )
    )

    let foundInBatch = 0
    let skippedInBatch = 0

    for (let i = 0; i < ownershipResults.length; i++) {
      const result = ownershipResults[i]
      if (result.status === 'fulfilled') {
        const owner = result.value as string
        if (owner && owner.toLowerCase() === ownerAddress.toLowerCase()) {
          ownedRugs.push(tokenIds[i])
          foundInBatch++
        }
      } else {
        // Log but don't count as error - tokens may not exist
        skippedInBatch++
      }
    }

    console.log(`[User NFTs API] Batch ${startTokenId}-${endTokenId}: found ${foundInBatch} owned, skipped ${skippedInBatch}`)

    // Add small delay between batches to avoid rate limiting
    if (endTokenId < maxTokenId) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(`[User NFTs API] Total owned NFTs found: ${ownedRugs.length}`)
  return ownedRugs
}