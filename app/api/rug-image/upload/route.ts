import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to upload a base64 image and return a shareable URL
 * This converts base64 data URLs to proper image URLs for sharing
 */
export async function POST(request: NextRequest) {
  try {
    const { imageData, tokenId } = await request.json()

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      )
    }

    // If it's already a data URL, we can't upload it directly
    // Instead, return the share page URL which will use Open Graph
    // For actual image sharing, we'll rely on the share page's OG meta tags
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.onchainrugs.xyz'
    const sharePageUrl = tokenId 
      ? `${baseUrl}/rug-market?tokenId=${tokenId}`
      : baseUrl

    // Return the share page URL - social platforms will fetch OG meta tags from there
    return NextResponse.json({
      imageUrl: sharePageUrl,
      sharePageUrl: sharePageUrl,
      message: 'Use share page URL for social sharing. The page includes Open Graph meta tags.'
    })
  } catch (error) {
    console.error('Error processing image upload:', error)
    return NextResponse.json(
      { error: 'Failed to process image', details: String(error) },
      { status: 500 }
    )
  }
}

