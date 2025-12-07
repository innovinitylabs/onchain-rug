/**
 * Direct contract fetching utility for OnchainRugs
 * Bypasses caching layers and fetches directly from blockchain
 */

import { getContractAddress, getRpcUrl } from './networks'
import { callContractMultiFallback, onchainRugsABI } from '@/lib/web3'

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

  if (!contractAddress) {
    throw new Error('Contract address not configured')
  }

  console.log(`🔗 fetchNFTBatchDirect called for chain ${chainId}, tokens:`, tokenIds)

  const nfts: DirectNFTData[] = []

  // Process each token individually
  for (const tokenId of tokenIds) {
    try {
      console.log(`🔍 Processing token ${tokenId}...`)

      // Fetch ownerOf using callContractMultiFallback (same as dashboard)
      let owner: string
      try {
        owner = await callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'ownerOf',
          [BigInt(tokenId)],
          { chainId }
        ) as unknown as string

        // If owner is zero address, token doesn't exist
        if (!owner || owner === '0x0000000000000000000000000000000000000000') {
          console.log(`⚠️ Token ${tokenId} does not exist (zero address owner)`)
          continue
        }
      } catch (ownerError: any) {
        const errorMsg = ownerError?.message || String(ownerError)
        if (errorMsg.includes('token does not exist') || 
            errorMsg.includes('ERC721: invalid token ID') || 
            errorMsg.includes('execution reverted')) {
          console.log(`⚠️ Token ${tokenId} does not exist (ownerOf failed)`)
          continue
        }
        throw ownerError
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

      // Fetch rug data from contract using callContractMultiFallback (same as dashboard)
      let rugData: RugData | null = null
      console.log(`🔍 [RPC] Fetching getRugData for token ${tokenId}...`)

      try {
        // Use callContractMultiFallback exactly like the dashboard does
        const decodedRugData = await callContractMultiFallback(
          contractAddress,
          onchainRugsABI,
          'getRugData',
          [BigInt(tokenId)],
          { chainId }
        ) as any

        console.log(`🔍 [DEBUG] Raw decoded result for token ${tokenId}:`, JSON.stringify(decodedRugData, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value, 2))
        console.log(`🔍 [DEBUG] Decoded result type:`, typeof decodedRugData, Array.isArray(decodedRugData) ? 'array' : 'object')
        console.log(`🔍 [DEBUG] Decoded result keys:`, typeof decodedRugData === 'object' && decodedRugData !== null ? Object.keys(decodedRugData) : 'N/A')

        // callContractMultiFallback returns decoded result
        // With tuple format, it might be:
        // - An array with one element (the tuple object): [rugData]
        // - An object with rugData property: { rugData: {...} }
        // - The tuple object directly: { seed, textRows, ... }
        
        let rugDataObj: any = decodedRugData
        
        // If it's an array, get the first element (the tuple)
        if (Array.isArray(decodedRugData)) {
          rugDataObj = decodedRugData[0] || decodedRugData
        }
        
        // If it has a rugData property, extract it
        if (rugDataObj && typeof rugDataObj === 'object' && 'rugData' in rugDataObj) {
          rugDataObj = rugDataObj.rugData
        }
        
        // Now map the struct fields
        rugData = {
          seed: BigInt(rugDataObj?.seed ?? rugDataObj?.[0] ?? 0),
          textRows: rugDataObj?.textRows ?? rugDataObj?.[1] ?? [],
          paletteName: String(rugDataObj?.paletteName ?? rugDataObj?.[2] ?? ''),
          minifiedPalette: String(rugDataObj?.minifiedPalette ?? rugDataObj?.[3] ?? ''),
          minifiedStripeData: String(rugDataObj?.minifiedStripeData ?? rugDataObj?.[4] ?? ''),
          warpThickness: Number(rugDataObj?.warpThickness ?? rugDataObj?.[5] ?? 1),
          mintTime: BigInt(rugDataObj?.mintTime ?? rugDataObj?.[6] ?? 0),
          filteredCharacterMap: String(rugDataObj?.filteredCharacterMap ?? rugDataObj?.[7] ?? '{}'),
          curator: String(rugDataObj?.curator ?? rugDataObj?.[8] ?? '0x0'),
          characterCount: BigInt(rugDataObj?.characterCount ?? rugDataObj?.[9] ?? 0),
          stripeCount: BigInt(rugDataObj?.stripeCount ?? rugDataObj?.[10] ?? 0)
        }

        console.log(`✅ Successfully fetched real blockchain data for token ${tokenId}: text="${rugData.textRows?.[0] || 'N/A'}"`)
      } catch (error) {
        console.error(`❌ Failed to fetch rug data for token ${tokenId}:`, error)
        console.error(`❌ Error details:`, {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
        throw new Error(`Unable to fetch rug data from contract for token ${tokenId}: ${error instanceof Error ? error.message : String(error)}`)
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
 * Decode Solidity struct from hex response using viem ABI decoding
 */
function decodeRugDataStruct(hexData: string): RugData | null {
  try {
    console.log(`🔍 [DECODE] Starting to decode hex data of length: ${hexData.length}`)

    // Define the ABI parameters for getRugData return type as a tuple
    // Returns: (uint256, string[], string, string, string, uint8, uint256, string, address, uint256, uint256)
    const returnAbi: AbiParameter = {
      type: 'tuple',
      components: [
        { name: 'seed', type: 'uint256' },
        { name: 'textRows', type: 'string[]' },
        { name: 'paletteName', type: 'string' },
        { name: 'minifiedPalette', type: 'string' },
        { name: 'minifiedStripeData', type: 'string' },
        { name: 'warpThickness', type: 'uint8' },
        { name: 'mintTime', type: 'uint256' },
        { name: 'filteredCharacterMap', type: 'string' },
        { name: 'curator', type: 'address' },
        { name: 'characterCount', type: 'uint256' },
        { name: 'stripeCount', type: 'uint256' }
      ]
    }

    // Decode using viem - the hexData is already the encoded tuple
    const decoded = decodeAbiParameters([returnAbi], hexData as `0x${string}`)
    const tuple = decoded[0] as any

    const seed = tuple.seed
    const textRows = tuple.textRows
    const paletteName = tuple.paletteName
    const minifiedPalette = tuple.minifiedPalette
    const minifiedStripeData = tuple.minifiedStripeData
    const warpThickness = tuple.warpThickness
    const mintTime = tuple.mintTime
    const filteredCharacterMap = tuple.filteredCharacterMap
    const curator = tuple.curator
    const characterCount = tuple.characterCount
    const stripeCount = tuple.stripeCount

    const rugData: RugData = {
      seed: BigInt(seed as bigint),
      textRows: textRows as string[],
      paletteName: String(paletteName),
      minifiedPalette: String(minifiedPalette),
      minifiedStripeData: String(minifiedStripeData),
      warpThickness: Number(warpThickness),
      mintTime: BigInt(mintTime as bigint),
      filteredCharacterMap: String(filteredCharacterMap),
      curator: String(curator),
      characterCount: BigInt(characterCount as bigint),
      stripeCount: BigInt(stripeCount as bigint)
    }

    console.log(`✅ Successfully decoded struct for token - textRows: ${rugData.textRows.join(', ')}`)
    return rugData

  } catch (error) {
    console.error('Failed to decode rug data struct:', error)
    return null
  }
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
