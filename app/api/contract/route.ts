import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { shapeSepolia } from '@/lib/web3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const method = searchParams.get('method')
  const tokenId = searchParams.get('tokenId')
  const contractAddress = searchParams.get('contractAddress')

  if (!method || !contractAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters: method and contractAddress' },
      { status: 400 }
    )
  }

  try {
    const client = createPublicClient({
      chain: shapeSepolia,
      transport: http(shapeSepolia.rpcUrls.default.http[0])
    })

    let result: any

    switch (method) {
      case 'ownerOf':
        if (!tokenId) {
          return NextResponse.json(
            { error: 'tokenId required for ownerOf method' },
            { status: 400 }
          )
        }
        result = await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{
            inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
            name: "ownerOf",
            outputs: [{ internalType: "address", name: "", type: "address" }],
            stateMutability: "view",
            type: "function"
          }],
          functionName: 'ownerOf',
          args: [BigInt(tokenId)],
          authorizationList: []
        })
        return NextResponse.json({ owner: result })

      default:
        return NextResponse.json(
          { error: 'Unsupported method' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Contract call error:', error)
    return NextResponse.json(
      { error: 'Contract call failed' },
      { status: 500 }
    )
  }
}