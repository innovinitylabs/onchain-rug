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

      case 'getAgingData':
        // Call contract directly for aging data
        if (!tokenId) {
          return NextResponse.json(
            { error: 'tokenId required for getAgingData endpoint' },
            { status: 400 }
          )
        }

        // Import ethers for contract calls
        const { ethers } = await import('ethers')

        // Create provider for Shape Sepolia
        const provider = new ethers.JsonRpcProvider('https://sepolia.shape.network')

        // Contract ABI for getAgingData function
        const contractAbi = [
          "function getAgingData(uint256 tokenId) external view returns (tuple(uint256 lastCleaned, uint256 lastTextureReset, uint256 lastSalePrice, uint256[3] recentSalePrices, uint8 dirtLevel, uint8 textureLevel, uint256 launderingCount, uint256 lastLaundered, uint256 cleaningCount, uint256 restorationCount, uint256 masterRestorationCount, uint256 maintenanceScore, string currentFrameLevel, uint256 frameAchievedTime, bool gracePeriodActive, uint256 gracePeriodEnd, bool isMuseumPiece))"
        ]

        const contract = new ethers.Contract(contractAddress, contractAbi, provider)

        try {
          const agingData = await contract.getAgingData(tokenId)
          console.log(`✅ Contract call success: getAgingData for token ${tokenId}`)

          return NextResponse.json({
            lastCleaned: agingData[0].toString(),
            lastTextureReset: agingData[1].toString(),
            lastSalePrice: agingData[2].toString(),
            recentSalePrices: agingData[3].map((price: any) => price.toString()),
            dirtLevel: Number(agingData[4]),
            textureLevel: Number(agingData[5]),
            launderingCount: agingData[6].toString(),
            lastLaundered: agingData[7].toString(),
            cleaningCount: agingData[8].toString(),
            restorationCount: agingData[9].toString(),
            masterRestorationCount: agingData[10].toString(),
            maintenanceScore: agingData[11].toString(),
            currentFrameLevel: agingData[12],
            frameAchievedTime: agingData[13].toString(),
            gracePeriodActive: agingData[14],
            gracePeriodEnd: agingData[15].toString(),
            isMuseumPiece: agingData[16]
          })
        } catch (error) {
          console.error(`❌ Contract call failed for getAgingData:`, error)
          return NextResponse.json(
            { error: 'Failed to fetch aging data from contract' },
            { status: 500 }
          )
        }

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
