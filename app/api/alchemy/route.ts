import { NextRequest, NextResponse } from 'next/server'

// Server-side Alchemy API proxy to keep API key secure
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const contractAddress = searchParams.get('contractAddress')
  const tokenId = searchParams.get('tokenId')
  const owner = searchParams.get('owner')
  const index = searchParams.get('index')

  const alchemyApiKey = process.env.ALCHEMY_API_KEY

  if (!alchemyApiKey) {
    console.error('❌ ALCHEMY_API_KEY not configured in environment variables')
    return NextResponse.json(
      { error: 'Alchemy API key not configured' },
      { status: 500 }
    )
  }

  if (!endpoint || !contractAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters: endpoint and contractAddress' },
      { status: 400 }
    )
  }

  try {
    let url: string

    switch (endpoint) {
      case 'getNFTsForCollection':
        url = `https://shape-sepolia.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=false&limit=100`
        break

      case 'getNFTMetadata':
        if (!tokenId) {
          return NextResponse.json(
            { error: 'tokenId required for getNFTMetadata endpoint' },
            { status: 400 }
          )
        }
        url = `https://shape-sepolia.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&refreshCache=false`
        break

      case 'getTokenIdByIndex':
        if (!owner || index === null) {
          return NextResponse.json(
            { error: 'owner and index required for getTokenIdByIndex endpoint' },
            { status: 400 }
          )
        }
        // This would require a direct contract call, but for now we'll use Alchemy's owner NFTs
        url = `https://shape-sepolia.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTsForOwner?owner=${owner}&contractAddresses[]=${contractAddress}&withMetadata=false`
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
