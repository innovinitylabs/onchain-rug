import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia, baseMainnet, shapeSepolia, shapeMainnet } from '@/lib/web3'
import { getContractAddress, getNetworkByChainId } from '@/lib/networks'

/**
 * API route to generate Open Graph image for social sharing
 * Returns HTML that renders the NFT, which social platforms will screenshot
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId: tokenIdParam } = await params
    const tokenId = parseInt(tokenIdParam)
    if (isNaN(tokenId)) {
      return NextResponse.json(
        { error: 'Invalid token ID' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const chainId = searchParams.get('chainId')
      ? parseInt(searchParams.get('chainId')!)
      : 84532

    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract not found for this chain' },
        { status: 404 }
      )
    }

    // Fetch tokenURI to get animation_url
    let publicClient
    if (chainId === 84532) {
      publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      })
    } else if (chainId === 8453) {
      publicClient = createPublicClient({
        chain: baseMainnet,
        transport: http()
      })
    } else if (chainId === 11011) {
      publicClient = createPublicClient({
        chain: shapeSepolia,
        transport: http()
      })
    } else if (chainId === 360) {
      publicClient = createPublicClient({
        chain: shapeMainnet,
        transport: http()
      })
    } else {
      return NextResponse.json(
        { error: 'Unsupported network' },
        { status: 400 }
      )
    }

    const tokenURI = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: [
        {
          inputs: [{ name: 'tokenId', type: 'uint256' }],
          name: 'tokenURI',
          outputs: [{ name: '', type: 'string' }],
          stateMutability: 'view',
          type: 'function'
        }
      ],
      functionName: 'tokenURI',
      args: [BigInt(tokenId)]
    })

    if (!tokenURI) {
      return NextResponse.json(
        { error: 'Token URI not found' },
        { status: 404 }
      )
    }

    // Parse tokenURI
    let metadata
    try {
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Data = tokenURI.split(',')[1]
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8')
        metadata = JSON.parse(jsonString)
      } else if (tokenURI.startsWith('data:application/json,')) {
        const jsonString = decodeURIComponent(tokenURI.split(',')[1])
        metadata = JSON.parse(jsonString)
      } else {
        metadata = JSON.parse(tokenURI)
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse token URI' },
        { status: 500 }
      )
    }

    // Return the animation_url which contains the HTML rendering
    // Social platforms will fetch this and render it
    const animationUrl = metadata.animation_url || null

    if (!animationUrl) {
      return NextResponse.json(
        { error: 'Animation URL not found' },
        { status: 404 }
      )
    }

    // Redirect to the animation_url so social platforms can fetch it
    // Or return a simple HTML page that embeds the NFT
    return NextResponse.redirect(animationUrl, { status: 302 })
  } catch (error) {
    console.error('Error generating OG image:', error)
    return NextResponse.json(
      { error: 'Failed to generate OG image' },
      { status: 500 }
    )
  }
}

