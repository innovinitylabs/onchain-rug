/**
 * Direct contract fetching utility for OnchainRugs
 * Bypasses caching layers and fetches directly from blockchain
 */

import { getContractAddress, callContractMultiFallback, onchainRugsABI } from './web3'
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
  curator: string
  characterCount: bigint
  stripeCount: bigint
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
 * Decode rug data from contract return value
 */
function decodeRugDataFromContract(contractData: any, tokenId: number): RugData | null {
  try {
    // The contract data should already be decoded by callContractMultiFallback
    // We just need to map it to our RugData interface
    if (!contractData || typeof contractData !== 'object') {
      console.log(`⚠️ Invalid contract data for token ${tokenId}:`, contractData)
      return null
    }

    // Map the contract return to our RugData structure
    // Based on the ABI, getRugData returns: (uint256, string[], string, string, string, uint8, uint256, string, address, uint256, uint256)
    const [
      seed,
      textRows,
      paletteName,
      minifiedPalette,
      minifiedStripeData,
      warpThickness,
      mintTime,
      filteredCharacterMap,
      curator,
      characterCount,
      stripeCount
    ] = contractData

    return {
      seed: BigInt(seed),
      paletteName: String(paletteName),
      minifiedPalette: String(minifiedPalette),
      minifiedStripeData: String(minifiedStripeData),
      textRows: Array.isArray(textRows) ? textRows.map(String) : [],
      warpThickness: Number(warpThickness),
      mintTime: BigInt(mintTime),
      filteredCharacterMap: String(filteredCharacterMap),
      curator: String(curator),
      characterCount: BigInt(characterCount),
      stripeCount: BigInt(stripeCount)
    }
  } catch (error) {
    console.error(`Failed to decode rug data for token ${tokenId}:`, error)
    return null
  }
}

/**
 * Fetch total supply from contract
 */
export async function fetchTotalSupply(chainId: number): Promise<number> {
  const contractAddress = getContractAddress(chainId)

  console.log(`[fetchTotalSupply] Chain: ${chainId}, Contract: ${contractAddress}`)

  if (!contractAddress) {
    throw new Error('Contract address not configured')
  }

  try {
    const result = await callContractMultiFallback(
      contractAddress,
      onchainRugsABI,
      'totalSupply',
      [],
      { chainId }
    ) as unknown as bigint

    console.log(`[fetchTotalSupply] Result: ${result}`)
    return Number(result)
  } catch (error) {
    console.error(`[fetchTotalSupply] Error:`, error)
    throw error
  }
}

/**
 * Fetch NFT data for a batch of tokens using individual RPC calls (bypassing multicall)
 */
export async function fetchNFTBatchDirect(
  chainId: number,
  tokenIds: number[]
): Promise<DirectNFTData[]> {
  const contractAddress = getContractAddress(chainId)

  if (!contractAddress) {
    throw new Error('Contract address not configured')
  }

  console.log(`🔗 fetchNFTBatchDirect called for chain ${chainId}, tokens:`, tokenIds)
  console.log(`🔗 Using contract address:`, contractAddress)

  const nfts: DirectNFTData[] = []

  // Process each token individually
  for (const tokenId of tokenIds) {
    try {
      console.log(`🔍 Processing token ${tokenId}...`)

      // Fetch ownerOf - this will fail for non-existent tokens
      let owner: string
      try {
        owner = await callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'ownerOf',
          [BigInt(tokenId)],
          { chainId }
        ) as unknown as string
      } catch (ownerError) {
        console.log(`⚠️ Token ${tokenId} does not exist (ownerOf failed)`)
        continue // Skip this token
      }

      // Fetch tokenURI
      let tokenURI: string
      try {
        tokenURI = await callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'tokenURI',
          [BigInt(tokenId)],
          { chainId }
        ) as unknown as string
      } catch (tokenURIError) {
        console.log(`⚠️ Failed to fetch tokenURI for token ${tokenId}`)
        tokenURI = ''
      }

      // Fetch rug data
      let rugData: RugData | null = null
      try {
        console.log(`🔍 [RAW RPC] Fetching getRugData for token ${tokenId}...`)
        const rawRugData = await callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'getRugData',
          [BigInt(tokenId)],
          { chainId }
        )

        console.log(`🔍 [RAW RPC] Raw contract data for token ${tokenId}:`, JSON.stringify(rawRugData, null, 2))

        // The rawRugData should be decoded already by callContractMultiFallback
        // But we need to parse it into our RugData structure
        if (rawRugData) {
          rugData = decodeRugDataFromContract(rawRugData, tokenId)
          console.log(`🔍 [RAW RPC] Decoded rugData for token ${tokenId}:`, JSON.stringify(rugData, null, 2))
        }
      } catch (rugError) {
        console.log(`⚠️ Failed to fetch rug data for token ${tokenId}:`, rugError)
      }

      // Fetch dynamic traits
      let dirtLevel: number = 0
      let textureLevel: number = 0
      let frameLevel: number = 0

      try {
        const rawDirtLevel = await callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'getDirtLevel',
          [BigInt(tokenId)],
          { chainId }
        )
        console.log(`🔍 [RAW RPC] getDirtLevel for token ${tokenId}:`, rawDirtLevel)
        dirtLevel = rawDirtLevel as unknown as number
      } catch (error) {
        console.log(`⚠️ Failed to fetch dirt level for token ${tokenId}`)
      }

      try {
        const rawAgingLevel = await callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'getAgingLevel',
          [BigInt(tokenId)],
          { chainId }
        )
        console.log(`🔍 [RAW RPC] getAgingLevel for token ${tokenId}:`, rawAgingLevel)
        textureLevel = rawAgingLevel as unknown as number
      } catch (error) {
        console.log(`⚠️ Failed to fetch aging level for token ${tokenId}`)
      }

      try {
        const rawFrameLevel = await callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'getFrameLevel',
          [BigInt(tokenId)],
          { chainId }
        )
        console.log(`🔍 [RAW RPC] getFrameLevel for token ${tokenId}:`, rawFrameLevel)
        frameLevel = rawFrameLevel as unknown as number
      } catch (error) {
        console.log(`⚠️ Failed to fetch frame level for token ${tokenId}`)
      }

      nfts.push({
        tokenId,
        owner,
        tokenURI,
        rugData,
        dirtLevel,
        textureLevel,
        frameLevel
      })

      console.log(`✅ Successfully fetched data for token ${tokenId}`)

    } catch (error) {
      console.error(`Failed to fetch data for token ${tokenId}:`, error)
      // Continue with next token
    }
  }

  return nfts
}


/**
 * Decode a string from ABI-encoded data at the given offset
 */
function decodeString(hexData: string, offset: number): string {
  // String encoding: length (32 bytes) + data
  const lengthHex = hexData.slice(offset, offset + 64)
  const length = parseInt(lengthHex, 16) * 2  // multiply by 2 for hex chars
  const dataStart = offset + 64
  const dataEnd = dataStart + length
  const hexString = hexData.slice(dataStart, dataEnd)

  // Convert hex to UTF-8 string
  let result = ''
  for (let i = 0; i < hexString.length; i += 2) {
    const byte = parseInt(hexString.slice(i, i + 2), 16)
    if (byte !== 0) {  // Skip null bytes
      result += String.fromCharCode(byte)
    }
  }
  return result
}

/**
 * Decode a string array from ABI-encoded data at the given offset
 */
function decodeStringArray(hexData: string, offset: number): string[] {
  // Array encoding: length (32 bytes) + elements
  const lengthHex = hexData.slice(offset, offset + 64)
  const length = parseInt(lengthHex, 16)

  const result: string[] = []
  let currentOffset = offset + 64  // Skip array length

  for (let i = 0; i < length; i++) {
    // Each string element is encoded as: offset (32 bytes) + string data
    const stringOffsetHex = hexData.slice(currentOffset, currentOffset + 64)
    const stringOffset = parseInt(stringOffsetHex, 16) * 2 + offset  // Relative to array start

    const stringData = decodeString(hexData, stringOffset)
    result.push(stringData)

    currentOffset += 64  // Move to next element offset
  }

  return result
}

/**
 * Get different placeholder data for each token to test if decoding works
 */

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
