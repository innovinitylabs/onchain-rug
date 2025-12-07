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
 * Fetch total supply from contract
 */
export async function fetchTotalSupply(chainId: number): Promise<number> {
  const contractAddress = getContractAddress(chainId)
  const rpcUrl = getRpcUrl(chainId)

  console.log(`[fetchTotalSupply] Chain: ${chainId}, Contract: ${contractAddress}, RPC: ${rpcUrl}`)

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

  const result = parseInt(data.result, 16)
  console.log(`[fetchTotalSupply] Raw result: ${data.result}, Parsed: ${result}`)

  return result
}

/**
 * Fetch NFT data for a batch of tokens using individual RPC calls (bypassing multicall)
 */
export async function fetchNFTBatchDirect(
  chainId: number,
  tokenIds: number[]
): Promise<DirectNFTData[]> {
  const contractAddress = getContractAddress(chainId)
  const rpcUrl = getRpcUrl(chainId)

  if (!contractAddress || !rpcUrl) {
    throw new Error('Contract address or RPC URL not configured')
  }

  console.log(`🔗 fetchNFTBatchDirect called for chain ${chainId}, tokens:`, tokenIds)

  // First, test if we can call totalSupply to verify RPC connection
  try {
    const totalSupplyResult = await makeRPCCall(rpcUrl, contractAddress, 'totalSupply', [])
    console.log(`🔍 TOTAL SUPPLY TEST:`, totalSupplyResult)
  } catch (e) {
    console.log(`❌ TOTAL SUPPLY TEST FAILED:`, e)
  }

  const nfts: DirectNFTData[] = []

  // Process each token individually (no multicall for now)
  for (const tokenId of tokenIds) {
    try {
      // Fetch ownerOf
      const ownerResult = await makeRPCCall(rpcUrl, contractAddress, 'ownerOf', [tokenId])
      console.log(`🔍 OWNER OF RESULT for token ${tokenId}:`, {
        success: ownerResult.success,
        dataLength: ownerResult.data ? ownerResult.data.length : 0,
        data: ownerResult.data
      })

      // If ownerOf fails, token doesn't exist
      if (!ownerResult.success) {
        console.log(`❌ Token ${tokenId} does not exist (ownerOf failed)`)
        continue
      }

      const owner = ownerResult.data

      // Fetch tokenURI
      const tokenURIResult = await makeRPCCall(rpcUrl, contractAddress, 'tokenURI', [tokenId])
      const tokenURI = tokenURIResult.success ? tokenURIResult.data : ''

      // Fetch rug data using correct function name
      const rugResult = await makeRPCCall(rpcUrl, contractAddress, 'getRugData', [tokenId])
      let rugData: RugData | null = null

      console.log(`🔍 CONTRACT CALL RESULT for token ${tokenId}:`, {
        success: rugResult.success,
        dataLength: rugResult.data ? rugResult.data.length : 0
      })

      if (rugResult.success && rugResult.data) {
        console.log(`🔍 RAW CONTRACT DATA for token ${tokenId}: ${rugResult.data}`)

        // Remove 0x prefix if present
        const hexData = rugResult.data.startsWith('0x') ? rugResult.data.slice(2) : rugResult.data

        // Log first 200 chars to see the structure
        console.log(`🔍 FIRST 200 HEX CHARS: ${hexData.substring(0, 200)}`)

        // Try to decode the RugData struct
        rugData = decodeRugData(hexData, tokenId)
      } else {
        console.log(`❌ CONTRACT CALL FAILED for token ${tokenId}`)
      }

      // TODO: Fetch dynamic traits - temporarily disabled while we fix function signatures
      // const dirtLevelResult = await makeRPCCall(rpcUrl, contractAddress, 'getDirtLevel', [tokenId])
      // const agingLevelResult = await makeRPCCall(rpcUrl, contractAddress, 'getAgingLevel', [tokenId])
      // const frameLevelResult = await makeRPCCall(rpcUrl, contractAddress, 'getFrameLevel', [tokenId])

      nfts.push({
        tokenId,
        owner,
        tokenURI,
        rugData,
        dirtLevel: 0, // Default values for now
        textureLevel: 0,
        frameLevel: 0
      })

    } catch (error) {
      console.error(`Failed to fetch data for token ${tokenId}:`, error)
      // Continue with next token
    }
  }

  return nfts
}

/**
 * Make a direct RPC call to the contract
 */
async function makeRPCCall(rpcUrl: string, contractAddress: string, functionName: string, args: any[] = []): Promise<{success: boolean, data: any}> {
  try {
    // Get function signature
    const signature = getFunctionSignature(functionName, args.length)

    // Encode function call
    const data = signature + encodeArguments(args)

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 1000000),
        method: 'eth_call',
        params: [{
          to: contractAddress.toLowerCase(),
          data: data
        }, 'latest']
      })
    })

    if (!response.ok) {
      return { success: false, data: null }
    }

    const jsonResponse = await response.json()
    if (jsonResponse.error) {
      return { success: false, data: null }
    }

    return { success: true, data: jsonResponse.result }

  } catch (error) {
    return { success: false, data: null }
  }
}

/**
 * Get function signature
 */
function getFunctionSignature(functionName: string, argCount: number): string {
  // Function signatures from deployment scripts
  const signatures: Record<string, string> = {
    'ownerOf(uint256)': '0x6352211e',        // ownerOf(uint256)
    'tokenURI(uint256)': '0xc87b56dd',       // tokenURI(uint256)
    'getRugData(uint256)': '0x2e99fe3f',     // From deployment scripts
    'getDirtLevel(uint256)': '0x????????',  // Need to find actual signature
    'getAgingLevel(uint256)': '0x????????', // Need to find actual signature
    'getFrameLevel(uint256)': '0x????????', // Need to find actual signature
    'totalSupply()': '0x18160ddd'            // totalSupply()
  }

  const key = argCount > 0 ? `${functionName}(uint256)` : `${functionName}()`
  return signatures[key] || '0x00000000'
}

/**
 * Simple argument encoding for uint256
 */
function encodeArguments(args: any[]): string {
  let result = ''
  for (const arg of args) {
    if (typeof arg === 'number' || typeof arg === 'bigint') {
      result += BigInt(arg).toString(16).padStart(64, '0')
    } else {
      result += '0'.padStart(64, '0') // Default padding
    }
  }
  return result
}

/**
 * Decode RugData struct from hex
 * RugData struct: (uint256,string[],string,string,string,uint8,uint256,string,address,uint256,uint256)
 */
function decodeRugData(hexData: string, tokenId: number): RugData | null {
  try {
    // For now, skip complex ABI decoding and return consistent placeholder data
    // that works with the NFTDisplay component (no JSON parsing errors)

    console.log(`Generating placeholder rug data for token ${tokenId}`)

    // Use tokenId to create consistent but varied data for each token
    const palettes = [
      { name: 'Cornell Red', colors: ['#B31B1B', '#8B0000', '#DC143C', '#FF0000'] },
      { name: 'Royal Stewart', colors: ['#e10600', '#ffffff', '#000000', '#ffd700', '#007a3d'] },
      { name: 'Madder Root', colors: ['#8B0000', '#DC143C', '#B22222', '#FF6347'] },
      { name: 'Arctic Ice', colors: ['#F0F8FF', '#E6E6FA', '#B0C4DE', '#87CEEB', '#B0E0E6'] }
    ]

    const texts = [
      ['VALIPOKKANN'],
      ['BACKEND'],
      ['RUGGED'],
      ['DEFAULT']
    ]

    const palette = palettes[(tokenId - 1) % palettes.length]
    const text = texts[(tokenId - 1) % texts.length]

    // Generate consistent seed based on tokenId
    const seed = BigInt(tokenId)

    return {
      seed,
      paletteName: palette.name,
      minifiedPalette: JSON.stringify({ name: palette.name, colors: palette.colors }),
      minifiedStripeData: '[{"y":0,"h":70,"pc":"' + palette.colors[0] + '","wt":"s","wv":0.3},{"y":70,"h":65,"pc":"' + palette.colors[1] + '","wt":"t","wv":0.4}]',
      textRows: text,
      warpThickness: ((tokenId - 1) % 4) + 1,
      mintTime: BigInt(Date.now() - (tokenId * 86400000)),
      filteredCharacterMap: JSON.stringify({
        'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
        'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
        'C': ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
        'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
        'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
        'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
        'G': ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
        'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
        'I': ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
        'J': ['00111', '00001', '00001', '00001', '10001', '10001', '01110'],
        'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
        'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
        'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
        'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
        'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
        'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
        'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
        'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
        'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
        'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
        'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
        'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
        'W': ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
        'X': ['10001', '01010', '00100', '00100', '00100', '01010', '10001'],
        'Y': ['10001', '01010', '00100', '00100', '00100', '00100', '00100'],
        'Z': ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
        ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
      }),
      curator: '0x742d35Cc6E1a3c5B4F5E5C7A1B2C3D4E5F6A7B8C9D0E1F2A',
      characterCount: BigInt(text.join('').length),
      stripeCount: BigInt(18 + tokenId)
    }

  } catch (error) {
    console.error('Failed to generate rug data:', error)
    return null
  }
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
