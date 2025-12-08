/**
 * Data Adapter Utilities
 * 
 * Converts between RugMarketNFT (rug market format) and NFTData (NFTDisplay format)
 * Ensures data consistency across the application
 */

import { RugMarketNFT } from '@/lib/rug-market-types'
import type { RugMarketNFTWithCalculated } from '@/app/api/rug-market/collection/rug-market-types'
import type { NFTData, RugTraits } from '@/components/NFTDisplay'

/**
 * Helper to safely extract calculated dirt/aging levels from dynamic data
 * Exported for use in components
 */
export function getCalculatedLevels(dynamic: any): { dirtLevel: number; agingLevel: number } {
  // Check if calculated values exist (from RugMarketNFTWithCalculated)
  let dirtLevel = 0
  let agingLevel = 0

  if ('dirtLevel' in dynamic && dynamic.dirtLevel !== undefined && dynamic.dirtLevel !== null) {
    const dirt = dynamic.dirtLevel
    if (typeof dirt === 'number') {
      dirtLevel = dirt
    } else if (typeof dirt === 'bigint') {
      dirtLevel = Number(dirt)
    } else if (typeof dirt === 'string') {
      const parsed = parseInt(dirt, 10)
      dirtLevel = isNaN(parsed) ? 0 : parsed
    } else {
      dirtLevel = Number(dirt) || 0
    }
    // Ensure dirtLevel is 0-2
    dirtLevel = Math.min(Math.max(dirtLevel, 0), 2)
  }

  if ('agingLevel' in dynamic && dynamic.agingLevel !== undefined && dynamic.agingLevel !== null) {
    const aging = dynamic.agingLevel
    if (typeof aging === 'number') {
      agingLevel = aging
    } else if (typeof aging === 'bigint') {
      agingLevel = Number(aging)
    } else if (typeof aging === 'string') {
      const parsed = parseInt(aging, 10)
      agingLevel = isNaN(parsed) ? 0 : parsed
    } else {
      agingLevel = Number(aging) || 0
    }
    // Cap at 10 and ensure it's not a timestamp (if it's > 10, it's probably wrong)
    if (agingLevel > 10) {
      console.warn(`[getCalculatedLevels] Aging level ${agingLevel} is > 10, capping to 10. This might be a timestamp or baseAgingLevel.`)
      agingLevel = 10
    }
    agingLevel = Math.min(Math.max(agingLevel, 0), 10)
  } else {
    // If agingLevel is missing, check if baseAgingLevel exists (shouldn't be displayed, but log it)
    if ('baseAgingLevel' in dynamic && dynamic.baseAgingLevel !== undefined) {
      console.warn(`[getCalculatedLevels] agingLevel missing but baseAgingLevel=${dynamic.baseAgingLevel} exists. This suggests calculated values weren't added.`)
    }
  }

  return { dirtLevel, agingLevel }
}

/**
 * Convert RugMarketNFT to NFTData format for NFTDisplay component
 * Handles both RugMarketNFT (without calculated values) and RugMarketNFTWithCalculated (with calculated values)
 */
export function rugMarketNFTToNFTData(nft: RugMarketNFT | RugMarketNFTWithCalculated): NFTData {
  const { permanent, dynamic } = nft

  // Extract calculated values safely
  const { dirtLevel, agingLevel } = getCalculatedLevels(dynamic)
  
  // Log for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Adapter] Token ${permanent.tokenId}: dirtLevel=${dirtLevel}, agingLevel=${agingLevel}, hasDirtLevel=${'dirtLevel' in dynamic}, hasAgingLevel=${'agingLevel' in dynamic}`)
  }

  // Build RugTraits from permanent and dynamic data
  const traits: RugTraits = {
    seed: permanent.seed,
    paletteName: permanent.paletteName,
    minifiedPalette: permanent.minifiedPalette,
    minifiedStripeData: permanent.minifiedStripeData,
    textRows: permanent.textRows,
    warpThickness: permanent.warpThickness,
    mintTime: permanent.mintTime,
    filteredCharacterMap: permanent.filteredCharacterMap,
    characterCount: permanent.characterCount,
    stripeCount: permanent.stripeCount,
    textLinesCount: permanent.textRows?.length || 0,
    dirtLevel,
    agingLevel,
    frameLevel: typeof dynamic.frameLevel === 'string' ? dynamic.frameLevel : String(dynamic.frameLevel),
    maintenanceScore: dynamic.maintenanceScore,
    curator: permanent.curator,
    cleaningCount: dynamic.cleaningCount,
    restorationCount: dynamic.restorationCount,
    masterRestorationCount: dynamic.masterRestorationCount,
    launderingCount: dynamic.launderingCount,
    lastSalePrice: dynamic.lastSalePrice,
    lastCleaned: dynamic.lastCleaned
  }

  return {
    tokenId: permanent.tokenId,
    traits,
    owner: dynamic.currentOwner,
    name: permanent.name,
    description: permanent.description,
    image: permanent.image,
    listingPrice: dynamic.listingPrice,
    isListed: dynamic.isListed,
    lastSalePrice: dynamic.lastSalePrice
  }
}

/**
 * Convert NFTData to RugMarketNFT format (for cases where we have NFTData but need RugMarketNFT)
 * Note: This is a partial conversion as NFTData may not have all RugMarketNFT fields
 */
export function nftDataToRugMarketNFT(nftData: NFTData): Partial<RugMarketNFT> {
  if (!nftData.traits) {
    throw new Error('NFTData must have traits to convert to RugMarketNFT')
  }

  const traits = nftData.traits

  return {
    permanent: {
      tokenId: nftData.tokenId,
      seed: traits.seed,
      paletteName: traits.paletteName || '',
      minifiedPalette: traits.minifiedPalette || '',
      minifiedStripeData: traits.minifiedStripeData || '',
      textRows: traits.textRows || [],
      warpThickness: traits.warpThickness || 1,
      curator: traits.curator || '0x0',
      mintTime: traits.mintTime,
      filteredCharacterMap: traits.filteredCharacterMap || '',
      characterCount: traits.characterCount || BigInt(0),
      stripeCount: traits.stripeCount || BigInt(0),
      name: nftData.name || `OnchainRug #${nftData.tokenId}`,
      description: nftData.description || '',
      image: nftData.image || ''
    },
    dynamic: {
      dirtLevel: traits.dirtLevel || 0,
      agingLevel: traits.agingLevel || 0,
      frameLevel: traits.frameLevel || 'None',
      maintenanceScore: traits.maintenanceScore || BigInt(0),
      lastCleaned: traits.lastCleaned || BigInt(0),
      cleaningCount: traits.cleaningCount,
      restorationCount: traits.restorationCount,
      masterRestorationCount: traits.masterRestorationCount,
      launderingCount: traits.launderingCount,
      currentOwner: nftData.owner || '0x0',
      ownershipHistory: [],
      saleHistory: [],
      isListed: nftData.isListed || false,
      listingPrice: nftData.listingPrice,
      lastSalePrice: traits.lastSalePrice,
      lastUpdated: BigInt(Date.now())
    }
  }
}

/**
 * Create a standardized NFTData from RugMarketNFT with preview URL
 */
export function createNFTDataWithPreview(nft: RugMarketNFT, previewUrl?: string): NFTData {
  const nftData = rugMarketNFTToNFTData(nft)
  
  if (previewUrl) {
    nftData.processedPreviewUrl = previewUrl
  }

  return nftData
}

