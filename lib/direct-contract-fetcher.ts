/**
 * Direct contract fetching utility for OnchainRugs
 * Bypasses caching layers and fetches directly from blockchain
 */

import { getContractAddress, getRpcUrl } from './networks'
import { batchReadContract } from './multicall'

// Rug data structure from contract
interface RugData {
  seed: bigint
  paletteName: string
  minifiedPalette: string
  minifiedStripeData: string
  textRows: string[]
  warpThickness: number
  mintTime: bigint
  filteredCharacterMap: string
}

// NFT data structure
export interface DirectNFTData {
  tokenId: number
  owner: string
  tokenURI: string
  rugData: RugData | null
  dirtLevel: number | null
  textureLevel: number | null
  frameLevel: number | null
}

/**
 * Fetch total supply from contract
 */
export async function fetchTotalSupply(chainId: number): Promise<number> {
  const contractAddress = getContractAddress(chainId)
  const rpcUrl = getRpcUrl(chainId)

  if (!contractAddress || !rpcUrl) {
    throw new Error('Contract address or RPC URL not configured')
  }

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{
        to: contractAddress.toLowerCase(),
        data: '0x18160ddd' // totalSupply()
      }, 'latest']
    })
  })

  if (!response.ok) {
    throw new Error(`RPC call failed: ${response.status}`)
  }

  const data = await response.json()
  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`)
  }

  return parseInt(data.result, 16)
}

/**
 * Fetch NFT data for a batch of tokens using direct contract calls
 */
export async function fetchNFTBatchDirect(
  chainId: number,
  tokenIds: number[]
): Promise<DirectNFTData[]> {
  const contractAddress = getContractAddress(chainId)

  if (!contractAddress) {
    throw new Error('Contract address not configured')
  }

  // Build multicall calls for each token
  const calls = tokenIds.flatMap(tokenId => [
    {
      functionName: 'ownerOf',
      args: [tokenId]
    },
    {
      functionName: 'tokenURI',
      args: [tokenId]
    },
    {
      functionName: 'rugs',
      args: [tokenId]
    }
  ])

  // Use the multicall utility to batch these calls
  const results = await batchReadContract(chainId, contractAddress, calls, [
    // ownerOf(uint256) returns address
    {
      inputs: [{ name: '', type: 'uint256' }],
      name: 'ownerOf',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    // tokenURI(uint256) returns string
    {
      inputs: [{ name: '', type: 'uint256' }],
      name: 'tokenURI',
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function'
    },
    // rugs(uint256) returns Rug struct
    {
      inputs: [{ name: '', type: 'uint256' }],
      name: 'rugs',
      outputs: [
        { name: 'seed', type: 'uint256' },
        { name: 'paletteName', type: 'string' },
        { name: 'minifiedPalette', type: 'string' },
        { name: 'minifiedStripeData', type: 'string' },
        { name: 'textRows', type: 'string[]' },
        { name: 'warpThickness', type: 'uint8' },
        { name: 'mintTime', type: 'uint256' },
        { name: 'filteredCharacterMap', type: 'string' }
      ],
      stateMutability: 'view',
      type: 'function'
    }
  ])

  // Process results - each token has 3 calls (ownerOf, tokenURI, rugs)
  const nfts: DirectNFTData[] = []

  for (let i = 0; i < tokenIds.length; i++) {
    const tokenId = tokenIds[i]
    const baseIndex = i * 3

    const ownerResult = results[baseIndex]
    const tokenURIResult = results[baseIndex + 1]
    const rugResult = results[baseIndex + 2]

    // Only include NFTs that exist (have valid owner)
    if (ownerResult.success && ownerResult.data) {
      // Decode owner address (remove 0x prefix, pad to 40 chars)
      const owner = '0x' + ownerResult.data.slice(-40)

      // Decode tokenURI (it's a string, so we need to decode it properly)
      let tokenURI = ''
      if (tokenURIResult.success && tokenURIResult.data) {
        // For now, just use the raw data - we'll decode it properly later
        tokenURI = tokenURIResult.data
      }

      // Decode rug data
      let rugData: RugData | null = null
      if (rugResult.success && rugResult.data) {
        // Decode the tuple data from multicall
        // This is simplified - in practice we'd need proper ABI decoding
        rugData = {
          seed: BigInt(tokenId), // Placeholder
          paletteName: 'Default', // Placeholder
          minifiedPalette: '',
          minifiedStripeData: '',
          textRows: [],
          warpThickness: 3,
          mintTime: BigInt(Date.now()),
          filteredCharacterMap: ''
        }
      }

      nfts.push({
        tokenId,
        owner,
        tokenURI,
        rugData,
        dirtLevel: null, // Will be fetched separately
        textureLevel: null, // Will be fetched separately
        frameLevel: null // Will be fetched separately
      })
    }
  }

  return nfts
}

/**
 * Fetch dynamic traits (dirt, texture, frame levels) for NFTs
 * These are stored in separate mappings and may change over time
 */
export async function fetchDynamicTraits(
  chainId: number,
  tokenIds: number[]
): Promise<Record<number, { dirtLevel: number; textureLevel: number; frameLevel: number }>> {
  const contractAddress = getContractAddress(chainId)

  if (!contractAddress) {
    throw new Error('Contract address not configured')
  }

  // For now, return placeholder data
  // In a real implementation, these would be separate contract calls
  const traits: Record<number, { dirtLevel: number; textureLevel: number; frameLevel: number }> = {}

  tokenIds.forEach(tokenId => {
    traits[tokenId] = {
      dirtLevel: Math.floor(Math.random() * 10), // Placeholder
      textureLevel: Math.floor(Math.random() * 5), // Placeholder
      frameLevel: Math.floor(Math.random() * 3) // Placeholder
    }
  })

  return traits
}
