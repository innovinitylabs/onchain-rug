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
  textureLevel: number
  lastCleaned: bigint | null
  mintTime: number
} {
  if (!attributes || !Array.isArray(attributes)) {
    return {
      dirtLevel: 0,
      textureLevel: 0,
      lastCleaned: null,
      mintTime: 0,
    }
  }

  let dirtLevel = 0
  let textureLevel = 0
  let lastCleaned: bigint | null = null
  let mintTime = 0

  for (const attr of attributes) {
    if (!attr || !attr.trait_type) continue

    switch (attr.trait_type) {
      case 'Dirt Level':
        dirtLevel = parseInt(attr.value) || 0
        break
      case 'Texture Level':
        textureLevel = parseInt(attr.value) || 0
        break
      case 'Last Cleaned':
        lastCleaned = attr.value ? BigInt(Math.floor(new Date(attr.value).getTime() / 1000)) : null
        break
      case 'Mint Time':
        mintTime = attr.value ? new Date(attr.value).getTime() / 1000 : 0
        break
    }
  }

  return {
    dirtLevel,
    textureLevel,
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
    traits,
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

// Get texture description based on level
export function getTextureDescription(textureLevel: number): string {
  switch (textureLevel) {
    case 0:
      return 'Smooth'
    case 1:
      return 'Moderate Wear'
    case 2:
      return 'Heavy Wear'
    default:
      return 'Unknown'
  }
}
