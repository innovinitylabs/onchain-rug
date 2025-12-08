/**
 * Blockchain Data Fetcher for Rug Market
 *
 * Fetches NFT data from blockchain when Redis cache misses
 */

import { RugMarketNFT, RugPermanentData, RugDynamicData } from './rug-market-types'
import { fetchNFTBatchDirect, fetchDynamicTraits } from './direct-contract-fetcher'
import { callContractMultiFallback, onchainRugsABI } from '@/lib/web3'
import { getContractAddress } from './networks'

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
      filteredCharacterMap: nftData.rugData.filteredCharacterMap,
      name: `OnchainRug #${nftData.tokenId}`,
      description: 'OnchainRugs by valipokkann',
      image: '/logo.png',
      characterCount: nftData.rugData.characterCount,
      stripeCount: nftData.rugData.stripeCount
    }

    // Fetch aging data from contract (includes lastCleaned, baseAgingLevel, frameLevel, etc.)
    let agingData: any = null
    try {
      const agingDataResult = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'getAgingData',
        [BigInt(tokenId)],
        { chainId }
      )
      
      // getAgingData returns a tuple matching the AgingData struct
      agingData = {
        lastCleaned: BigInt(agingDataResult[0] as bigint),
        dirtLevel: agingDataResult[1] as number,  // Not stored, but available for migration
        agingLevel: agingDataResult[2] as number,  // This is baseAgingLevel (stored)
        frameLevel: agingDataResult[3] as number,
        frameAchievedTime: BigInt(agingDataResult[4] as bigint),
        cleaningCount: BigInt(agingDataResult[5] as bigint),
        restorationCount: BigInt(agingDataResult[6] as bigint),
        masterRestorationCount: BigInt(agingDataResult[7] as bigint),
        launderingCount: BigInt(agingDataResult[8] as bigint),
        lastLaundered: BigInt(agingDataResult[9] as bigint),
        lastSalePrice: BigInt(agingDataResult[10] as bigint),
        recentSalePrices: agingDataResult[11] as bigint[]
      }
      console.log(`✅ Fetched aging data for token ${tokenId}`)
    } catch (error) {
      console.error(`⚠️ Failed to fetch aging data for token ${tokenId}:`, error)
      // Fallback: use frameLevel from nftData if available
    }

    // Fetch maintenance score from contract
    let maintenanceScore = BigInt(0)
    try {
      console.log(`🔍 [Blockchain Fetcher] Fetching maintenance score for token ${tokenId} from contract ${contractAddress} on chain ${chainId}`)
      const maintenanceScoreResult = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'getMaintenanceScore',
        [BigInt(tokenId)],
        { chainId }
      )
      console.log(`🔍 [Blockchain Fetcher] Raw maintenance score result for token ${tokenId}:`, maintenanceScoreResult, typeof maintenanceScoreResult)
      
      // Handle different return types
      if (typeof maintenanceScoreResult === 'bigint') {
        maintenanceScore = maintenanceScoreResult
      } else if (typeof maintenanceScoreResult === 'string') {
        maintenanceScore = BigInt(maintenanceScoreResult)
      } else if (typeof maintenanceScoreResult === 'number') {
        maintenanceScore = BigInt(maintenanceScoreResult)
      } else {
        // Try to convert
        maintenanceScore = BigInt(String(maintenanceScoreResult))
      }
      
      console.log(`✅ [Blockchain Fetcher] Successfully fetched maintenance score for token ${tokenId}: ${maintenanceScore}`)
    } catch (error) {
      console.error(`⚠️ [Blockchain Fetcher] Failed to fetch maintenance score for token ${tokenId}:`, error)
      console.error(`⚠️ [Blockchain Fetcher] Error details:`, {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractAddress,
        chainId,
        tokenId
      })
      // Fallback to 0 if fetch fails
      maintenanceScore = BigInt(0)
    }

    // Convert frame level number to string
    const frameLevelNum = agingData?.frameLevel ?? nftData.frameLevel ?? 0
    const frameLevelString = frameLevelNum === 0 ? 'None' :
                            frameLevelNum === 1 ? 'Bronze' :
                            frameLevelNum === 2 ? 'Silver' :
                            frameLevelNum === 3 ? 'Gold' : 'Diamond'

    // Fetch marketplace listing data
    let listingData: { isListed: boolean; listingPrice?: string; listingSeller?: string; listingExpiresAt?: bigint } = {
      isListed: false
    }
    try {
      // Marketplace ABI for getListing function
      const marketplaceABI = [
        {
          name: 'getListing',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'tokenId', type: 'uint256' }],
          outputs: [
            { name: 'seller', type: 'address' },
            { name: 'price', type: 'uint256' },
            { name: 'expiresAt', type: 'uint256' },
            { name: 'isActive', type: 'bool' }
          ]
        }
      ] as const

      // Try to fetch listing data from marketplace facet (diamond contract)
      const listingResult = await callContractMultiFallback(
        contractAddress,
        marketplaceABI as any,
        'getListing',
        [BigInt(tokenId)],
        { chainId }
      ) as [string, bigint, bigint, boolean] | null
      
      if (listingResult && Array.isArray(listingResult) && listingResult.length >= 4 && listingResult[3] === true) {
        // Listing is active
        listingData = {
          isListed: true,
          listingPrice: listingResult[1].toString(),
          listingSeller: listingResult[0],
          listingExpiresAt: listingResult[2]
        }
        console.log(`✅ [Blockchain Fetcher] Fetched active listing for token ${tokenId}:`, listingData)
      } else {
        console.log(`ℹ️ [Blockchain Fetcher] No active listing found for token ${tokenId}`)
      }
    } catch (error) {
      // getListing might not exist or might fail - that's okay, just log it
      console.log(`ℹ️ [Blockchain Fetcher] Could not fetch listing data for token ${tokenId} (marketplace may not be available):`, error instanceof Error ? error.message : String(error))
    }

    // Format lastSalePrice from agingData
    const lastSalePriceString = agingData?.lastSalePrice 
      ? (agingData.lastSalePrice > BigInt(0) ? agingData.lastSalePrice.toString() : undefined)
      : undefined

    // Build dynamic data from contract data (stored values only, no calculated fields)
    const dynamic: RugDynamicData = {
      baseAgingLevel: agingData?.agingLevel ?? 0,  // Stored base aging level
      frameLevel: frameLevelString,  // Store as string for compatibility
      maintenanceScore: maintenanceScore,  // Fetched from getMaintenanceScore
      lastCleaned: agingData?.lastCleaned ?? BigInt(Math.floor(Date.now() / 1000)),
      cleaningCount: agingData?.cleaningCount ? Number(agingData.cleaningCount) : undefined,
      restorationCount: agingData?.restorationCount ? Number(agingData.restorationCount) : undefined,
      masterRestorationCount: agingData?.masterRestorationCount ? Number(agingData.masterRestorationCount) : undefined,
      launderingCount: agingData?.launderingCount ? Number(agingData.launderingCount) : undefined,
      currentOwner: nftData.owner,
      ownershipHistory: [{
        owner: nftData.owner,
        acquiredAt: permanent.mintTime,
        acquiredVia: 'mint',
        txHash: '' // We'll need to fetch this from events
      }],
      saleHistory: [], // Would need to fetch from events
      isListed: listingData.isListed,
      listingPrice: listingData.listingPrice,
      listingSeller: listingData.listingSeller,
      listingExpiresAt: listingData.listingExpiresAt,
      lastSalePrice: lastSalePriceString,
      lastUpdated: BigInt(Math.floor(Date.now() / 1000)) // Use seconds, not milliseconds
    }

    // Log the final dynamic data to verify all fields are set
    console.log(`📊 [Blockchain Fetcher] Final dynamic data for token ${tokenId}:`, {
      maintenanceScore: dynamic.maintenanceScore.toString(),
      baseAgingLevel: dynamic.baseAgingLevel,
      frameLevel: dynamic.frameLevel,
      lastCleaned: dynamic.lastCleaned.toString(),
      cleaningCount: dynamic.cleaningCount,
      restorationCount: dynamic.restorationCount,
      masterRestorationCount: dynamic.masterRestorationCount,
      launderingCount: dynamic.launderingCount,
      isListed: dynamic.isListed,
      listingPrice: dynamic.listingPrice,
      lastSalePrice: dynamic.lastSalePrice,
      currentOwner: dynamic.currentOwner
    })

    // Note: dirtLevel and agingLevel are NOT stored - they will be calculated on read
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
    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled(
      tokenIds.map(tokenId => fetchNFTFromBlockchain(chainId, contractAddress, tokenId))
    )

    const validResults: RugMarketNFT[] = []
    const errors: Array<{ tokenId: number; error: string }> = []

    results.forEach((result, index) => {
      const tokenId = tokenIds[index]
      if (result.status === 'fulfilled' && result.value !== null) {
        validResults.push(result.value)
      } else {
        const errorMsg = result.status === 'rejected' 
          ? result.reason?.message || String(result.reason)
          : 'NFT not found'
        errors.push({ tokenId, error: errorMsg })
        console.error(`[Blockchain Fetcher] Failed to fetch NFT ${tokenId}:`, errorMsg)
      }
    })

    // Log partial failures but don't fail completely
    if (errors.length > 0) {
      console.warn(`[Blockchain Fetcher] Partial failure: ${errors.length} of ${tokenIds.length} NFTs failed to fetch`, errors)
    }

    // Return partial results if we got at least some NFTs
    // Only fail completely if ALL NFTs failed
    if (validResults.length === 0) {
      throw new Error(`Failed to fetch any NFTs from blockchain for tokens: ${tokenIds.join(', ')}. Errors: ${errors.map(e => `${e.tokenId}: ${e.error}`).join('; ')}`)
    }

    return validResults
  } catch (error) {
    console.error('Failed to batch fetch NFTs from blockchain:', error)
    throw error // Re-throw instead of returning empty array
  }
}
