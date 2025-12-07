/**
 * Blockchain Data Fetcher for Rug Market
 *
 * Fetches NFT data from blockchain when Redis cache misses
 */

import { RugMarketNFT, RugPermanentData, RugDynamicData } from './rug-market-types'
import { fetchNFTBatchDirect, fetchDynamicTraits } from './direct-contract-fetcher'

// Temporary function until we implement full blockchain fetching
export async function fetchNFTFromBlockchain(
  chainId: number,
  contractAddress: string,
  tokenId: number
): Promise<RugMarketNFT | null> {
  try {
    console.log(`🔗 fetchNFTFromBlockchain called for token ${tokenId} on chain ${chainId}`)

    // Fetch basic NFT data
    const nftBatch = await fetchNFTBatchDirect(chainId, [tokenId])
    if (!nftBatch || nftBatch.length === 0) {
      return null
    }

    const nftData = nftBatch[0]

    // If rugData is null, we couldn't decode it properly
    if (!nftData.rugData) {
      console.log(`No rug data available for token ${tokenId} - may not be minted or decoding failed`)
      return null
    }

    // Build permanent data from actual contract data
    const permanent: RugPermanentData = {
      tokenId: nftData.tokenId,
      seed: nftData.rugData.seed,
      paletteName: nftData.rugData.paletteName,
      minifiedPalette: nftData.rugData.minifiedPalette,
      minifiedStripeData: nftData.rugData.minifiedStripeData,
      textRows: nftData.rugData.textRows,
      warpThickness: nftData.rugData.warpThickness,
      curator: nftData.rugData.curator,
      mintTime: nftData.rugData.mintTime,
      name: `OnchainRug #${nftData.tokenId}`,
      description: 'OnchainRugs by valipokkann',
      image: '/logo.png',
      characterCount: nftData.rugData.characterCount,
      stripeCount: nftData.rugData.stripeCount
    }

    // Build dynamic data from contract data
    const dynamic: RugDynamicData = {
      dirtLevel: nftData.dirtLevel || 0,
      agingLevel: nftData.textureLevel || 0,
      frameLevel: nftData.frameLevel === 0 ? 'None' :
                 nftData.frameLevel === 1 ? 'Bronze' :
                 nftData.frameLevel === 2 ? 'Silver' :
                 nftData.frameLevel === 3 ? 'Gold' : 'Diamond',
      maintenanceScore: BigInt(0), // Will need to fetch from contract
      lastCleaned: BigInt(Date.now()), // Will need to fetch from contract
      currentOwner: nftData.owner,
      ownershipHistory: [{
        owner: nftData.owner,
        acquiredAt: permanent.mintTime,
        acquiredVia: 'mint',
        txHash: '' // We'll need to fetch this from events
      }],
      saleHistory: [],
      isListed: false, // Will need to fetch marketplace data
      lastUpdated: BigInt(Date.now())
    }

    return { permanent, dynamic }

  } catch (error) {
    console.error(`Failed to fetch NFT ${tokenId} from blockchain:`, error)
    return null
  }
}

/**
 * Fetch multiple NFTs from blockchain (for batch operations)
 */
export async function fetchNFTsFromBlockchain(
  chainId: number,
  contractAddress: string,
  tokenIds: number[]
): Promise<RugMarketNFT[]> {
  try {
    const results = await Promise.all(
      tokenIds.map(tokenId => fetchNFTFromBlockchain(chainId, contractAddress, tokenId))
    )

    return results.filter((nft): nft is RugMarketNFT => nft !== null)
  } catch (error) {
    console.error('Failed to batch fetch NFTs from blockchain:', error)
    return []
  }
}
