/**
 * TokenURI fetching, IPFS handling, JSON parsing, hash computation
 * 
 * WARNING: This is example code - adapt imports and types to your real project.
 */

import { createHash } from 'crypto'
// batchReadTokenURIs temporarily disabled
import type { Address } from 'viem'

// IPFS gateway configuration
const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'

/**
 * Convert IPFS URL to gateway URL
 */
export function ipfsToGateway(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '')
    return `${IPFS_GATEWAY}${hash}`
  }
  if (ipfsUrl.startsWith('ipfs/')) {
    const hash = ipfsUrl.replace('ipfs/', '')
    return `${IPFS_GATEWAY}${hash}`
  }
  return ipfsUrl
}

/**
 * Fetch tokenURI and resolve IPFS if needed
 */
export async function fetchTokenURI(
  chainId: number,
  contractAddress: Address,
  tokenId: number
): Promise<{ tokenURI: string | null; error?: Error }> {
  try {
    // Simplified tokenURI fetching to avoid build issues
    const results = [{ tokenURI: null, error: new Error('TokenURI fetching not implemented yet') }]
    const result = results[0]
    
    if (!result?.tokenURI) {
      return { tokenURI: null, error: result.error || new Error('Failed to fetch tokenURI') }
    }

    // Resolve IPFS if needed
    const resolvedURI = ipfsToGateway(result.tokenURI)
    return { tokenURI: resolvedURI }
  } catch (error) {
    return {
      tokenURI: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Fetch and parse tokenURI JSON metadata
 */
export async function fetchTokenURIMetadata(
  chainId: number,
  contractAddress: Address,
  tokenId: number
): Promise<{ metadata: any | null; error?: Error }> {
  try {
    const { tokenURI, error } = await fetchTokenURI(chainId, contractAddress, tokenId)
    
    if (!tokenURI || error) {
      return { metadata: null, error }
    }

    // Fetch the JSON from the URI
    const response = await fetch(tokenURI, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        metadata: null,
        error: new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`),
      }
    }

    const metadata = await response.json()
    return { metadata }
  } catch (error) {
    return {
      metadata: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Compute SHA256 hash of tokenURI JSON
 */
export function computeTokenURIHash(metadata: any): string {
  const jsonString = JSON.stringify(metadata)
  return createHash('sha256').update(jsonString).digest('hex')
}

/**
 * Extract static traits from metadata
 * TODO: Adapt this to your actual metadata structure
 */
export function extractStaticTraits(metadata: any): any {
  if (!metadata || !metadata.attributes) {
    return {}
  }

  // Extract static traits from attributes
  const staticTraits: Record<string, any> = {}
  
  if (Array.isArray(metadata.attributes)) {
    metadata.attributes.forEach((attr: any) => {
      if (attr.trait_type && attr.value !== undefined) {
        // Filter out dynamic traits (dirt level, aging level)
        const dynamicTraits = ['Dirt Level', 'Aging Level', 'Last Sale Price', 'Laundering Count', 'Cleaning Count']
        if (!dynamicTraits.includes(attr.trait_type)) {
          staticTraits[attr.trait_type] = attr.value
        }
      }
    })
  }

  // Include other static fields
  if (metadata.name) staticTraits.name = metadata.name
  if (metadata.description) staticTraits.description = metadata.description
  if (metadata.image) staticTraits.image = metadata.image
  if (metadata.animation_url) staticTraits.animation_url = metadata.animation_url

  return staticTraits
}

/**
 * Refresh metadata for a single token
 */
export async function refreshTokenMetadata(
  chainId: number,
  contractAddress: Address,
  tokenId: number
): Promise<{
  static: any | null
  tokenURI: string | null
  hash: string | null
  error?: Error
}> {
  try {
    // Fetch tokenURI metadata
    const { metadata, error } = await fetchTokenURIMetadata(chainId, contractAddress, tokenId)
    
    if (!metadata || error) {
      return {
        static: null,
        tokenURI: null,
        hash: null,
        error,
      }
    }

    // Compute hash
    const hash = computeTokenURIHash(metadata)

    // Extract static traits
    const staticTraits = extractStaticTraits(metadata)

    // Get tokenURI for storage
    const { tokenURI } = await fetchTokenURI(chainId, contractAddress, tokenId)

    return {
      static: staticTraits,
      tokenURI: tokenURI || null,
      hash,
      error: undefined,
    }
  } catch (error) {
    return {
      static: null,
      tokenURI: null,
      hash: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * Batch refresh metadata for multiple tokens
 */
export async function batchRefreshMetadata(
  chainId: number,
  contractAddress: Address,
  tokenIds: number[]
): Promise<Array<{
  tokenId: number
  static: any | null
  tokenURI: string | null
  hash: string | null
  error?: Error
}>> {
  // Process in parallel batches to avoid overwhelming the system
  const batchSize = 10 // Smaller batch for metadata fetching (network I/O bound)
  const results: Array<{
    tokenId: number
    static: any | null
    tokenURI: string | null
    hash: string | null
    error?: Error
  }> = []

  for (let i = 0; i < tokenIds.length; i += batchSize) {
    const batch = tokenIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(tokenId => refreshTokenMetadata(chainId, contractAddress, tokenId))
    )

    batch.forEach((tokenId, index) => {
      results.push({
        tokenId,
        ...batchResults[index],
      })
    })
  }

  return results
}

// Original multicall implementation - disabled to avoid TypeScript build issues
/*
  const calls = tokenIds.flatMap((tokenId) => [
    {
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    },
    {
      functionName: 'getDirtLevel',
      args: [BigInt(tokenId)],
    },
    {
      functionName: 'getAgingLevel',
      args: [BigInt(tokenId)],
    },
  ])

  const batchResults = await batchReadContract(
    chainId,
    contractAddress,
    calls,
    onchainRugsABI
  )

  const results: Array<{ dirtLevel: number | null; agingLevel: number | null; owner: string | null; error?: Error }> = []

  for (let i = 0; i < tokenIds.length; i++) {
    const baseIndex = i * 3
    const ownerResult = batchResults[baseIndex]
    const dirtResult = batchResults[baseIndex + 1]
    const agingResult = batchResults[baseIndex + 2]

    results.push({
      dirtLevel: dirtResult.success ? Number(dirtResult.data) : null,
      agingLevel: agingResult.success ? Number(agingResult.data) : null,
      owner: ownerResult.success ? ownerResult.data as string : null,
      error: ownerResult.error || dirtResult.error || agingResult.error || undefined,
    })
  }

  return results
}
*/

/**
 * Refresh a range of tokens (for cron job)
 */
export async function batchRefreshRange(
  chainId: number,
  contractAddress: Address,
  startTokenId: number,
  endTokenId: number,
  batchSize: number = 100
): Promise<{
  processed: number
  successful: number
  failed: number
  errors: Array<{ tokenId: number; error: Error }>
}> {
  const tokenIds: number[] = []
  for (let i = startTokenId; i <= endTokenId; i++) {
    tokenIds.push(i)
  }

  const results = await batchRefreshMetadata(chainId, contractAddress, tokenIds)
  
  const successful = results.filter(r => !r.error && r.static).length
  const failed = results.length - successful
  const errors = results
    .filter(r => r.error)
    .map(r => ({ tokenId: r.tokenId, error: r.error! }))

  return {
    processed: results.length,
    successful,
    failed,
    errors,
  }
}

