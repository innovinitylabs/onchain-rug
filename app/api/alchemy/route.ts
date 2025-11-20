import { NextRequest, NextResponse } from 'next/server'
import { getAlchemyBaseUrl, DEFAULT_CHAIN_ID } from '@/lib/networks'

// Server-side Alchemy API proxy to keep API key secure
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const contractAddress = searchParams.get('contractAddress')
  const tokenId = searchParams.get('tokenId')
  const owner = searchParams.get('owner')
  const index = searchParams.get('index')
  const contractAddresses = searchParams.getAll('contractAddresses[]')
  const chainId = searchParams.get('chainId') || DEFAULT_CHAIN_ID.toString()

  console.log('Alchemy API params:', { endpoint, contractAddress, tokenId, owner, index, contractAddresses, chainId })

  const alchemyApiKey = process.env.ALCHEMY_API_KEY

  if (!alchemyApiKey) {
    console.error('❌ ALCHEMY_API_KEY not configured in environment variables')
    return NextResponse.json(
      { error: 'Alchemy API key not configured' },
      { status: 500 }
    )
  }

  const alchemyBaseUrl = getAlchemyBaseUrl(parseInt(chainId))

  if (!endpoint || (!contractAddress && contractAddresses.length === 0)) {
    return NextResponse.json(
      { error: 'Missing required parameters: endpoint and contractAddress' },
      { status: 400 }
    )
  }

  // Log contract configuration for debugging
  const chainIdNum = parseInt(chainId)
  const primaryContract = contractAddress || contractAddresses[0] || 'unknown'
  console.log(`🔍 Chain ${chainIdNum} contract:`, primaryContract)

  try {
    let url: string

    switch (endpoint) {
      case 'getNFTsForCollection':
        url = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=false&limit=100`
        break

      case 'getNFTMetadata':
        if (!tokenId) {
          return NextResponse.json(
            { error: 'tokenId required for getNFTMetadata endpoint' },
            { status: 400 }
          )
        }
        url = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&refreshCache=false`
        break

      case 'getTokenIdByIndex':
        if (!owner || index === null) {
          return NextResponse.json(
            { error: 'owner and index required for getTokenIdByIndex endpoint' },
            { status: 400 }
          )
        }
        // Use contractAddresses array or fallback to contractAddress
        const indexContracts = contractAddresses.length > 0 ? contractAddresses : (contractAddress ? [contractAddress] : [])
        if (indexContracts.length === 0) {
          return NextResponse.json(
            { error: 'contract address required for getTokenIdByIndex endpoint' },
            { status: 400 }
          )
        }
        // Build the contract addresses parameter
        const indexContractParams = indexContracts.map(addr => `contractAddresses[]=${addr}`).join('&')
        url = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForOwner?owner=${owner}&${indexContractParams}&withMetadata=false`
        break

      case 'getNFTsForOwner':
        if (!owner) {
          return NextResponse.json(
            { error: 'owner required for getNFTsForOwner endpoint' },
            { status: 400 }
          )
        }
        // Use contractAddresses array or fallback to contractAddress
        const ownerContracts = contractAddresses.length > 0 ? contractAddresses : (contractAddress ? [contractAddress] : [])
        if (ownerContracts.length === 0) {
          return NextResponse.json(
            { error: 'contract address required for getNFTsForOwner endpoint' },
            { status: 400 }
          )
        }
        // Build the contract addresses parameter
        const ownerContractParams = ownerContracts.map(addr => `contractAddresses[]=${addr}`).join('&')
        url = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForOwner?owner=${owner}&${ownerContractParams}&withMetadata=true`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 400 }
        )
    }

    console.log(`🔄 Proxying Alchemy request: ${endpoint} for ${contractAddress}${tokenId ? ` token ${tokenId}` : ''}`)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      // Handle common Alchemy errors gracefully
      if (response.status === 500) {
        console.warn(`⚠️ Alchemy returned 500 for contract ${contractAddress} on chain ${chainId} - likely no contract deployed there`)
        // Return empty result instead of error
        return NextResponse.json({
          nfts: [],
          totalCount: 0,
          note: 'No NFTs found on this network'
        })
      }

      console.error(`❌ Alchemy API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Alchemy API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Log correct field based on endpoint
    const itemCount = endpoint === 'getNFTsForOwner' 
      ? (data.ownedNfts?.length || 0)
      : (data.nfts?.length || 0)
    console.log(`✅ Alchemy proxy success: ${endpoint} returned ${itemCount} items`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Alchemy proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
