import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback, onchainRugsABI } from '@/lib/web3'
import { getContractAddress, getRpcUrl } from '@/lib/networks'

// Helper function to safely stringify objects with BigInt values
function safeStringify(obj: any, space?: number): string {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , space)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || '84532')
    const tokenId = parseInt(searchParams.get('tokenId') || '1')

    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      return NextResponse.json({ error: 'Contract address not found' }, { status: 400 })
    }

    const rpcUrl = getRpcUrl(chainId)
    if (!rpcUrl) {
      return NextResponse.json({ error: 'RPC URL not found' }, { status: 400 })
    }

    console.log(`[RAW RPC TEST] Chain: ${chainId}, Contract: ${contractAddress}, Token: ${tokenId}`)

    const results: any = {
      chainId,
      contractAddress,
      tokenId,
      rpcUrl
    }

    // Test 1: totalSupply
    try {
      const totalSupply = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'totalSupply',
        [],
        { chainId }
      )
      results.totalSupply = {
        raw: totalSupply,
        type: typeof totalSupply,
        isArray: Array.isArray(totalSupply),
        stringified: JSON.stringify(totalSupply, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      }
    } catch (error: any) {
      results.totalSupply = {
        error: error.message,
        stack: error.stack
      }
    }

    // Test 2: ownerOf
    try {
      const ownerOf = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'ownerOf',
        [BigInt(tokenId)],
        { chainId }
      )
      results.ownerOf = {
        raw: ownerOf,
        type: typeof ownerOf,
        isArray: Array.isArray(ownerOf),
        stringified: JSON.stringify(ownerOf, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      }
    } catch (error: any) {
      results.ownerOf = {
        error: error.message,
        stack: error.stack
      }
    }

    // Test 3: tokenURI
    try {
      const tokenURI = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'tokenURI',
        [BigInt(tokenId)],
        { chainId }
      )
      results.tokenURI = {
        raw: tokenURI,
        type: typeof tokenURI,
        isArray: Array.isArray(tokenURI),
        stringified: JSON.stringify(tokenURI, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      }
    } catch (error: any) {
      results.tokenURI = {
        error: error.message,
        stack: error.stack
      }
    }

    // Test 4: getRugData - THE MAIN ONE
    try {
      const getRugData = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'getRugData',
        [BigInt(tokenId)],
        { chainId }
      )
      
      results.getRugData = {
        raw: getRugData,
        type: typeof getRugData,
        isArray: Array.isArray(getRugData),
        length: Array.isArray(getRugData) ? getRugData.length : 'N/A',
        keys: typeof getRugData === 'object' && getRugData !== null ? Object.keys(getRugData) : 'N/A',
        stringified: JSON.stringify(getRugData, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        , 2),
        // Show first level properties
        firstLevel: typeof getRugData === 'object' && getRugData !== null ? 
          Object.keys(getRugData).reduce((acc: any, key) => {
            const val = (getRugData as any)[key]
            acc[key] = {
              type: typeof val,
              isArray: Array.isArray(val),
              value: typeof val === 'bigint' ? val.toString() : 
                     Array.isArray(val) ? `Array(${val.length})` :
                     typeof val === 'string' ? val.substring(0, 100) : val
            }
            return acc
          }, {}) : 'N/A'
      }
    } catch (error: any) {
      results.getRugData = {
        error: error.message,
        stack: error.stack
      }
    }

    // Test 5: getDirtLevel
    try {
      const getDirtLevel = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'getDirtLevel',
        [BigInt(tokenId)],
        { chainId }
      )
      results.getDirtLevel = {
        raw: getDirtLevel,
        type: typeof getDirtLevel,
        stringified: safeStringify(getDirtLevel)
      }
    } catch (error: any) {
      results.getDirtLevel = {
        error: error.message
      }
    }

    // Test 6: getAgingLevel
    try {
      const getAgingLevel = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'getAgingLevel',
        [BigInt(tokenId)],
        { chainId }
      )
      results.getAgingLevel = {
        raw: getAgingLevel,
        type: typeof getAgingLevel,
        stringified: safeStringify(getAgingLevel)
      }
    } catch (error: any) {
      results.getAgingLevel = {
        error: error.message
      }
    }

    // Test 7: getFrameLevel
    try {
      const getFrameLevel = await callContractMultiFallback(
        contractAddress,
        onchainRugsABI,
        'getFrameLevel',
        [BigInt(tokenId)],
        { chainId }
      )
      results.getFrameLevel = {
        raw: getFrameLevel,
        type: typeof getFrameLevel,
        stringified: safeStringify(getFrameLevel)
      }
    } catch (error: any) {
      results.getFrameLevel = {
        error: error.message
      }
    }

    return NextResponse.json(results, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

