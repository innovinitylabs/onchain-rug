import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia, baseMainnet, shapeSepolia, shapeMainnet } from '@/lib/web3'
import { getContractAddress, getNetworkByChainId } from '@/lib/networks'

/**
 * API route to generate a shareable image URL for a rug NFT
 * Since NFTs are HTML-generated, this endpoint returns the animation_url
 * which can be used for Open Graph previews or converted to an image
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
      : 84532 // Default to Base Sepolia

    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract not found for this chain' },
        { status: 404 }
      )
    }

    // Get network config
    const network = getNetworkByChainId(chainId)
    if (!network) {
      return NextResponse.json(
        { error: 'Unsupported network' },
        { status: 400 }
      )
    }

    // Create public client
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

    // Fetch tokenURI
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

    // Parse tokenURI (it's base64 encoded JSON)
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
        // Try direct JSON parse
        metadata = JSON.parse(tokenURI)
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse token URI', details: String(error) },
        { status: 500 }
      )
    }

    // Return the animation_url (HTML) which contains the rendered NFT
    // For social sharing, platforms will render this HTML and extract preview images
    const animationUrl = metadata.animation_url || null
    const imageUrl = metadata.image || null

    // Generate share page URL
    const sharePageUrl = `https://www.onchainrugs.xyz/rug-market?tokenId=${tokenId}${chainId !== 84532 ? `&chainId=${chainId}` : ''}`

    return NextResponse.json({
      tokenId,
      chainId,
      imageUrl: imageUrl,
      animationUrl: animationUrl,
      // The animation_url is the HTML that renders the NFT - this is what we use for sharing
      shareImageUrl: animationUrl,
      sharePageUrl: sharePageUrl,
      // For Open Graph, we'll use the share page URL which will have meta tags
      ogImageUrl: sharePageUrl // The page itself will serve OG meta tags with the NFT
    })
  } catch (error) {
    console.error('Error fetching rug image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rug image', details: String(error) },
      { status: 500 }
    )
  }
}

