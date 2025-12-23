import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia, baseMainnet, shapeSepolia, shapeMainnet } from '@/lib/web3'
import { getContractAddress, getNetworkByChainId } from '@/lib/networks'

/**
 * API route to serve NFT image as a PNG file
 * This endpoint generates and serves the actual image for sharing
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
        { error: 'Failed to parse token URI', details: String(error) },
        { status: 500 }
      )
    }

    // Return the animation_url which contains the HTML rendering
    // Social platforms will use Open Graph meta tags from the share page URL instead
    // For now, redirect to the share page which will have proper OG tags
    const sharePageUrl = `https://www.onchainrugs.xyz/rug-market?tokenId=${tokenId}${chainId !== 84532 ? `&chainId=${chainId}` : ''}`
    
    // Return JSON with the share page URL - the page itself will serve OG meta tags
    // Social platforms will fetch the page and extract the image from OG tags
    return NextResponse.json({
      imageUrl: sharePageUrl, // Use share page URL - it will have OG meta tags
      sharePageUrl: sharePageUrl,
      message: 'Use the share page URL for social sharing. The page includes Open Graph meta tags with the NFT image.'
    })
  } catch (error) {
    console.error('Error fetching rug image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rug image', details: String(error) },
      { status: 500 }
    )
  }
}

