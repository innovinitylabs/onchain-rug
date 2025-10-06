/**
 * Parsing utilities for contract data
 */

// Base64 JSON parsing
export function parseBase64Json(tokenURI: string): any {
  if (!tokenURI) {
    throw new Error('tokenURI is required')
  }

  try {
    // Handle base64 encoded data URI
    const jsonString = tokenURI.replace('data:application/json;base64,', '')
    const decoded = atob(jsonString)
    return JSON.parse(decoded)
  } catch (error) {
    throw new Error(`Failed to parse base64 JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Extract aging data from tokenURI attributes
export function parseAgingDataFromAttributes(attributes: any[]): {
  dirtLevel: number
  agingLevel: number
  lastCleaned: bigint | null
  mintTime: number
} {
  if (!attributes || !Array.isArray(attributes)) {
    return {
      dirtLevel: 0,
      agingLevel: 0,
      lastCleaned: null,
      mintTime: 0,
    }
  }

  let dirtLevel = 0
  let agingLevel = 0
  let lastCleaned: bigint | null = null
  let mintTime = 0

  for (const attr of attributes) {
    if (!attr || !attr.trait_type) continue

    switch (attr.trait_type) {
      case 'Dirt Level':
        dirtLevel = parseInt(attr.value) || 0
        break
      case 'Aging Level':
        agingLevel = parseInt(attr.value) || 0
        break
      case 'Last Cleaned':
        lastCleaned = attr.value ? BigInt(attr.value) : null
        break
      case 'Mint Time':
        mintTime = attr.value ? parseInt(attr.value) : 0
        break
    }
  }

  return {
    dirtLevel,
    agingLevel,
    lastCleaned,
    mintTime,
  }
}

// Extract rug traits from metadata
export function parseRugTraits(metadata: any): {
  seed?: string
  paletteName?: string
  minifiedPalette?: string
  minifiedStripeData?: string
  textRows?: string[]
  warpThickness?: number
  complexity?: number
  characterCount?: number
  stripeCount?: number
  mintTime?: number
} {
  if (!metadata) {
    return {}
  }

  return {
    seed: metadata.seed,
    paletteName: metadata.paletteName,
    minifiedPalette: metadata.minifiedPalette,
    minifiedStripeData: metadata.minifiedStripeData,
    textRows: metadata.textRows,
    warpThickness: metadata.warpThickness,
    complexity: metadata.complexity,
    characterCount: metadata.characterCount,
    stripeCount: metadata.stripeCount,
    mintTime: metadata.mintTime,
  }
}

// Complete tokenURI data parsing
export function parseTokenURIData(tokenURI: string): {
  tokenURI: string
  metadata: any
  aging: ReturnType<typeof parseAgingDataFromAttributes>
  traits: ReturnType<typeof parseRugTraits>
  animationUrl?: string
  image?: string
  name?: string
} {
  const metadata = parseBase64Json(tokenURI)
  const aging = parseAgingDataFromAttributes(metadata.attributes || [])
  const traits = parseRugTraits(metadata.rugData || metadata)

  return {
    tokenURI,
    metadata,
    aging,
    traits: {
      ...traits,
      mintTime: aging.mintTime, // Include mintTime from aging data in traits
    },
    animationUrl: metadata.animation_url,
    image: metadata.image,
    name: metadata.name,
  }
}

// Validate tokenURI format
export function isValidTokenURI(tokenURI: string): boolean {
  if (!tokenURI || typeof tokenURI !== 'string') {
    return false
  }

  return tokenURI.startsWith('data:application/json;base64,')
}

// Get dirt description based on level
export function getDirtDescription(dirtLevel: number): string {
  switch (dirtLevel) {
    case 0:
      return 'Clean'
    case 1:
      return 'Lightly Dirty'
    case 2:
      return 'Heavily Dirty'
    default:
      return 'Unknown'
  }
}

// Get aging description based on level
export function getAgingDescription(agingLevel: number): string {
  switch (agingLevel) {
    case 0:
      return 'Brand New'
    case 1:
      return 'Slightly Aged'
    case 2:
      return 'Moderately Aged'
    case 3:
      return 'Well Aged'
    case 4:
      return 'Significantly Aged'
    case 5:
      return 'Very Aged'
    case 6:
      return 'Extremely Aged'
    case 7:
      return 'Heavily Aged'
    case 8:
      return 'Severely Aged'
    case 9:
      return 'Critically Aged'
    case 10:
      return 'Maximum Age'
    default:
      return 'Unknown'
  }
}
