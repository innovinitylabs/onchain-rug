/**
 * Data Adapter Utilities
 * 
 * Converts between RugMarketNFT (rug market format) and NFTData (NFTDisplay format)
 * Ensures data consistency across the application
 */

import { RugMarketNFT } from '@/lib/rug-market-types'
import type { NFTData, RugTraits } from '@/components/NFTDisplay'

/**
 * Convert RugMarketNFT to NFTData format for NFTDisplay component
 */
export function rugMarketNFTToNFTData(nft: RugMarketNFT): NFTData {
  const { permanent, dynamic } = nft

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
    dirtLevel: dynamic.dirtLevel,
    agingLevel: dynamic.agingLevel,
    frameLevel: dynamic.frameLevel,
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

