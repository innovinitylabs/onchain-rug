import { NextRequest, NextResponse } from 'next/server'

// Server-side Alchemy API proxy to keep API key secure
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const contractAddress = searchParams.get('contractAddress')
  const tokenId = searchParams.get('tokenId')
  const owner = searchParams.get('owner')
  const index = searchParams.get('index')
  const contractAddresses = searchParams.getAll('contractAddresses[]')
  const chainId = searchParams.get('chainId') || '84532' // Default to Base Sepolia

  console.log('Alchemy API params:', { endpoint, contractAddress, tokenId, owner, index, contractAddresses, chainId })

  const alchemyApiKey = process.env.ALCHEMY_API_KEY

  if (!alchemyApiKey) {
    console.error('❌ ALCHEMY_API_KEY not configured in environment variables')
    return NextResponse.json(
      { error: 'Alchemy API key not configured' },
      { status: 500 }
    )
  }

  // Helper function to get Alchemy base URL based on chain ID
  function getAlchemyBaseUrl(chainId: string): string {
    switch (chainId) {
      case '11011': // Shape Sepolia
        return 'https://shape-sepolia.g.alchemy.com/nft/v3'
      case '360': // Shape Mainnet
        return 'https://shape-mainnet.g.alchemy.com/nft/v3'
      case '84532': // Base Sepolia
        return 'https://base-sepolia.g.alchemy.com/nft/v3'
      case '8453': // Base Mainnet
        return 'https://base-mainnet.g.alchemy.com/nft/v3'
      default:
        // Default to Base Sepolia
        return 'https://base-sepolia.g.alchemy.com/nft/v3'
    }
  }

  const alchemyBaseUrl = getAlchemyBaseUrl(chainId)

  if (!endpoint || (!contractAddress && contractAddresses.length === 0)) {
    return NextResponse.json(
      { error: 'Missing required parameters: endpoint and contractAddress' },
      { status: 400 }
    )
  }

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
      console.error(`❌ Alchemy API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Alchemy API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`✅ Alchemy proxy success: ${endpoint} returned ${data.nfts?.length || 'data'}`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Alchemy proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
