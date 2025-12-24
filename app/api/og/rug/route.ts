/**
 * Dynamic Open Graph Image Generation for Rug NFTs
 * 
 * This endpoint generates OG images on-demand using the same JavaScript
 * rug-rendering logic used in the marketplace, but executed server-side.
 * 
 * CRITICAL CONSTRAINTS:
 * - NO image storage (images generated per request)
 * - NO base64 in URLs
 * - NO client-side rendering
 * - Images generated in < 3 seconds
 * - Twitter/X crawler compatible
 * 
 * HOW IT WORKS:
 * 1. Fetches NFT metadata from Redis (already exists)
 * 2. Creates Node.js VM context with node-canvas
 * 3. Provides browser-compatible APIs (document, window, etc.)
 * 4. Executes same rug rendering scripts as client
 * 5. In OG mode: disables dirt (dl=0), aging (tl=0), frames (fl='None')
 * 6. Returns PNG buffer (never stored)
 */

/**
 * Dynamic Open Graph Image Generation for Rug NFTs
 * 
 * This endpoint generates OG images on-demand using the EXACT SAME
 * rug-rendering pipeline used by Rug Market previews.
 * 
 * CRITICAL: Uses shared renderRug() function from lib/rug-renderer/render-rug.ts
 * This ensures OG images match Rug Market previews exactly.
 * 
 * CRITICAL CONSTRAINTS:
 * - NO image storage (images generated per request)
 * - NO base64 in URLs
 * - NO client-side rendering
 * - Images generated in < 3 seconds
 * - Twitter/X crawler compatible
 * 
 * HOW IT WORKS:
 * 1. Fetches NFT metadata from Redis (already exists)
 * 2. Calls shared renderRug() with renderMode='og'
 * 3. renderRug() executes EXACT same pipeline as Rug Market:
 *    - rug-p5.js (custom p5 implementation)
 *    - rug-algo.js (drawing logic)
 *    - rug-frame.js (disabled in OG mode)
 * 4. Returns PNG buffer (never stored)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCanvas } from 'canvas'
import { RugMarketRedis } from '@/app/api/rug-market/collection/rug-market-redis'
import { getContractAddress } from '@/app/api/rug-market/collection/networks'
import { renderRug } from '@/lib/rug-renderer/render-rug'

// OG Image dimensions (Twitter/X standard)
const OG_WIDTH = 1200
const OG_HEIGHT = 630

// Rate limiting (in-memory, per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requests per minute

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return ip
}

function checkRateLimit(request: NextRequest): boolean {
  const key = getRateLimitKey(request)
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

export async function GET(
  request: NextRequest
) {
  const startTime = Date.now()
  
  try {
    // Rate limiting
    if (!checkRateLimit(request)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const tokenIdParam = searchParams.get('tokenId')
    const chainId = parseInt(searchParams.get('chainId') || '84532')

    if (!tokenIdParam) {
      return NextResponse.json(
        { error: 'tokenId is required' },
        { status: 400 }
      )
    }

    const tokenId = parseInt(tokenIdParam)
    if (isNaN(tokenId) || tokenId <= 0 || tokenId > 100000) {
      return NextResponse.json(
        { error: 'Invalid token ID' },
        { status: 400 }
      )
    }

    // Fetch NFT metadata from Redis
    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      )
    }

    const nftData = await RugMarketRedis.getNFTData(chainId, contractAddress, tokenId)
    if (!nftData) {
      // Fallback to generic OG image
      return generateFallbackImage(tokenId)
    }

    // Extract rendering parameters (same structure as Rug Market)
    const permanent = nftData.permanent
    const seed = permanent.seed || tokenId
    
    // Parse palette and stripeData (handles both strings and objects)
    const palette = typeof permanent.minifiedPalette === 'string'
      ? JSON.parse(permanent.minifiedPalette)
      : permanent.minifiedPalette
    const stripeData = typeof permanent.minifiedStripeData === 'string'
      ? JSON.parse(permanent.minifiedStripeData)
      : permanent.minifiedStripeData
    const textRows = permanent.textRows || []
    const warpThickness = permanent.warpThickness || 4
    
    // Parse character map (handles both string and object)
    const characterMap = typeof permanent.filteredCharacterMap === 'string'
      ? JSON.parse(permanent.filteredCharacterMap)
      : (permanent.filteredCharacterMap || {})

    // Use shared renderRug() function with renderMode='og'
    // This executes the EXACT same pipeline as Rug Market previews
    // Note: renderMode='og' will force tl=0, dl=0, fl='None' regardless of input values
    const renderResult = await renderRug({
      seed: Number(seed.toString()),
      palette,
      stripeData,
      textRows,
      characterMap,
      warpThickness,
      renderMode: 'og' // OG mode: tl=0, dl=0, fl='None' (applied inside renderRug)
    })

    // Create canvas for OG image (1200x630)
    const ogCanvas = createCanvas(OG_WIDTH, OG_HEIGHT)
    const ogCtx = ogCanvas.getContext('2d')

    // Fill with neutral background
    ogCtx.fillStyle = '#DEDEDE'
    ogCtx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT)

    // Calculate scaling and positioning
    const rugCanvas = renderResult.canvas
    const rugWidth = rugCanvas.width
    const rugHeight = rugCanvas.height
    const scale = Math.min(
      (OG_WIDTH * 0.7) / rugWidth,
      (OG_HEIGHT * 0.9) / rugHeight
    )
    const scaledWidth = rugWidth * scale
    const scaledHeight = rugHeight * scale
    const offsetX = (OG_WIDTH - scaledWidth) / 2
    const offsetY = (OG_HEIGHT - scaledHeight) / 2

    // Draw rendered rug onto OG canvas
    ogCtx.drawImage(rugCanvas, offsetX, offsetY, scaledWidth, scaledHeight)

    // Add token ID text overlay
    ogCtx.fillStyle = '#000000'
    ogCtx.font = 'bold 48px Arial'
    ogCtx.textAlign = 'center'
    ogCtx.fillText(`OnchainRug #${tokenId}`, OG_WIDTH / 2, OG_HEIGHT - 40)

    // Convert to PNG buffer
    const buffer = ogCanvas.toBuffer('image/png')

    // Buffer already created above

    // Check timeout
    const elapsed = Date.now() - startTime
    if (elapsed > 3000) {
      console.warn(`OG image generation took ${elapsed}ms (exceeded 3s limit)`)
    }

    // Return PNG - NextResponse accepts Buffer directly
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // 24 hours
        'X-Generation-Time': `${elapsed}ms`
      }
    })

  } catch (error) {
    console.error('Error generating OG image:', error)
    const tokenId = parseInt(new URL(request.url).searchParams.get('tokenId') || '0')
    return generateFallbackImage(tokenId)
  }
}

function generateFallbackImage(tokenId: number): NextResponse {
  const canvas = createCanvas(OG_WIDTH, OG_HEIGHT)
  const ctx = canvas.getContext('2d')

  // Simple fallback design
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 72px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('OnchainRug', OG_WIDTH / 2, OG_HEIGHT / 2 - 40)
  ctx.font = '48px Arial'
  ctx.fillText(`#${tokenId}`, OG_WIDTH / 2, OG_HEIGHT / 2 + 40)

  const buffer = canvas.toBuffer('image/png')
  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
