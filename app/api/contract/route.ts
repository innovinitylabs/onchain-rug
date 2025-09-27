import { NextRequest, NextResponse } from 'next/server'

// Direct contract call API to avoid Alchemy caching
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const method = searchParams.get('method')
  const contractAddress = searchParams.get('contractAddress')
  const args = searchParams.get('args')

  const alchemyApiKey = process.env.ALCHEMY_API_KEY

  if (!alchemyApiKey) {
    console.error('❌ ALCHEMY_API_KEY not configured in environment variables')
    return NextResponse.json(
      { error: 'Alchemy API key not configured' },
      { status: 500 }
    )
  }

  if (!method || !contractAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters: method and contractAddress' },
      { status: 400 }
    )
  }

  try {
    console.log(`🔄 Making direct contract call: ${method} on ${contractAddress}`)

    let callData: any

    // Handle different contract methods
    if (method === 'tokenURI') {
      if (!args) {
        return NextResponse.json(
          { error: 'args required for tokenURI (tokenId)' },
          { status: 400 }
        )
      }

      // Encode tokenURI(uint256) call
      const functionSignature = '0xc87b56dd' // tokenURI(uint256)
      const encodedTokenId = BigInt(args).toString(16).padStart(64, '0')
      const data = functionSignature + encodedTokenId

      callData = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: data
        }, 'latest']
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported method' },
        { status: 400 }
      )
    }

    const url = `https://shape-sepolia.g.alchemy.com/v2/${alchemyApiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(callData),
    })

    if (!response.ok) {
      console.error(`❌ Contract call error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Contract call error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (method === 'tokenURI') {
      if (data.result) {
        console.log(`✅ tokenURI call success`)
        return NextResponse.json({
          result: data.result,
          success: true
        })
      } else {
        return NextResponse.json({
          error: 'No result from tokenURI call',
          success: false
        })
      }
    }

    console.log(`✅ Contract call success: ${method}`)
    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Contract call error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
