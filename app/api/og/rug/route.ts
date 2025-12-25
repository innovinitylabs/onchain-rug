/**
 * Dynamic Open Graph Image Generation for Rug NFTs
 * 
 * This endpoint generates OG images on-demand using Puppeteer to render
 * the EXACT SAME rug-rendering pipeline used in the marketplace.
 * 
 * CRITICAL CONSTRAINTS:
 * - NO image storage (images generated per request)
 * - NO base64 in URLs
 * - NO client-side rendering
 * - Images generated in < 3 seconds
 * - Twitter/X crawler compatible
 * 
 * HOW IT WORKS:
 * 1. Launches Puppeteer (headless Chromium)
 * 2. Navigates to rug-market page with renderMode=og
 * 3. Waits for window.__OG_READY__ flag
 * 4. Screenshots the canvas container
 * 5. Resizes/crops to 1200x630
 * 6. Returns PNG buffer (never stored)
 */

import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

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

async function processCanvasBuffer(canvasBuffer: Buffer, tokenId: number, startTime: number): Promise<NextResponse> {
  // TEMPORARILY DISABLED: Per-NFT preview generation for Twitter/OG
  // TODO: Re-enable when preview generation is fixed
  // For now, return default OG image
  
  // Return default market OG image instead of generating per-NFT preview
  const fs = require('fs')
  const path = require('path')
  const defaultImagePath = path.join(process.cwd(), 'public', 'market-og.png')
  
  if (fs.existsSync(defaultImagePath)) {
    const defaultImageBuffer = fs.readFileSync(defaultImagePath)
    return new NextResponse(defaultImageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
  
  // Fallback: Generate simple default image
  const { createCanvas } = require('canvas')
  const ogCanvas = createCanvas(OG_WIDTH, OG_HEIGHT)
  const ogCtx = ogCanvas.getContext('2d')
  
  // Fill with neutral background
  ogCtx.fillStyle = '#DEDEDE'
  ogCtx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT)
  
  // Add text overlay
  ogCtx.fillStyle = '#000000'
  ogCtx.font = 'bold 48px Arial'
  ogCtx.textAlign = 'center'
  ogCtx.fillText(`OnchainRug #${tokenId}`, OG_WIDTH / 2, OG_HEIGHT / 2)
  
  const buffer = ogCanvas.toBuffer('image/png')
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })

  /* COMMENTED OUT: Per-NFT preview generation code
  if (!canvasBuffer || !Buffer.isBuffer(canvasBuffer)) {
    throw new Error('Failed to capture canvas screenshot')
  }

  // Create OG canvas and composite
  const { createCanvas, loadImage } = require('canvas')
  const ogCanvas = createCanvas(OG_WIDTH, OG_HEIGHT)
  const ogCtx = ogCanvas.getContext('2d')

  // Fill with neutral background
  ogCtx.fillStyle = '#DEDEDE'
  ogCtx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT)

  // Load canvas image
  const canvasImage = await loadImage(canvasBuffer)
  
  // Calculate scaling and positioning
  const scale = Math.min(
    (OG_WIDTH * 0.7) / canvasImage.width,
    (OG_HEIGHT * 0.9) / canvasImage.height
  )
  const scaledWidth = canvasImage.width * scale
  const scaledHeight = canvasImage.height * scale
  const offsetX = (OG_WIDTH - scaledWidth) / 2
  const offsetY = (OG_HEIGHT - scaledHeight) / 2

  // Draw rug canvas onto OG canvas
  ogCtx.drawImage(canvasImage, offsetX, offsetY, scaledWidth, scaledHeight)

  // Add token ID text overlay
  ogCtx.fillStyle = '#000000'
  ogCtx.font = 'bold 48px Arial'
  ogCtx.textAlign = 'center'
  ogCtx.fillText(`OnchainRug #${tokenId}`, OG_WIDTH / 2, OG_HEIGHT - 40)

  // Convert to PNG buffer
  const buffer = ogCanvas.toBuffer('image/png')

  // Check timeout
  const elapsed = Date.now() - startTime
  if (elapsed > 3000) {
    console.warn(`OG image generation took ${elapsed}ms (exceeded 3s limit)`)
  }

  console.log(`[OG] Successfully generated OG image in ${elapsed}ms`)

  // Return PNG
  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // 24 hours
      'X-Generation-Time': `${elapsed}ms`
    }
  })
}

function generateFallbackImage(tokenId: number): NextResponse {
  // Simple fallback - return a basic image
  // In production, you might want to use a static fallback image
  const canvas = require('canvas').createCanvas(OG_WIDTH, OG_HEIGHT)
  const ctx = canvas.getContext('2d')

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

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // TEMPORARILY DISABLED: Per-NFT preview generation for Twitter/OG
    // TODO: Re-enable when preview generation is fixed
    // For now, return default market OG image
    
    // Get query params
    const { searchParams } = new URL(request.url)
    const tokenIdParam = searchParams.get('tokenId')
    
    const tokenId = tokenIdParam ? parseInt(tokenIdParam) : null
    
    // Return default market OG image
    const fs = require('fs')
    const path = require('path')
    const defaultImagePath = path.join(process.cwd(), 'public', 'market-og.png')
    
    if (fs.existsSync(defaultImagePath)) {
      const defaultImageBuffer = fs.readFileSync(defaultImagePath)
      console.log(`[OG] Returning default market OG image${tokenId ? ` for tokenId=${tokenId}` : ''}`)
      return new NextResponse(defaultImageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }
    
    // Fallback: Generate simple default image
    return generateFallbackImage(tokenId || 0)

    /* COMMENTED OUT: Puppeteer-based per-NFT preview generation
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
    const chainId = searchParams.get('chainId') || '84532'

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

    // Base URL - use production URL, never localhost
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.onchainrugs.xyz'
    
    // Construct URL with renderMode=og
    const pageUrl = `${baseUrl}/rug-market?tokenId=${tokenId}&renderMode=og${chainId !== '84532' ? `&chainId=${chainId}` : ''}`

    console.log(`[OG] Rendering rug for tokenId=${tokenId} via Puppeteer`)
    console.log(`[OG] Page URL: ${pageUrl}`)

    // Launch Puppeteer
    let browser
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1200,630'
        ],
        timeout: 5000
      })

      const page = await browser.newPage()
      
      // Set viewport to OG image size
      await page.setViewport({
        width: OG_WIDTH,
        height: OG_HEIGHT,
        deviceScaleFactor: 1
      })

      // Navigate to page
      await page.goto(pageUrl, {
        waitUntil: 'networkidle0',
        timeout: 10000
      })

      // Wait for __OG_READY__ flag (set by renderMode=og script)
      try {
        await page.waitForFunction(
          () => (window as any).__OG_READY__ === true,
          { timeout: 3000 }
        )
        console.log(`[OG] __OG_READY__ flag detected`)
      } catch (waitError) {
        console.warn(`[OG] __OG_READY__ flag not detected within timeout, proceeding anyway`)
        // Wait a bit more for rendering to complete
        await page.waitForTimeout(500)
      }

      // Find the canvas container (NFTDisplay renders in an iframe)
      // The canvas is inside an iframe, so we need to access it via the iframe
      const canvasSelector = 'iframe[src^="blob:"]'
      
      // Wait for iframe to load
      await page.waitForSelector(canvasSelector, { timeout: 5000 }).catch(() => {
        console.warn(`[OG] Canvas iframe not found, trying alternative selector`)
      })

      // Get the iframe element
      const iframeHandle = await page.$(canvasSelector)
      
      if (!iframeHandle) {
        throw new Error('Canvas iframe not found')
      }

      // Get the iframe's content frame
      const frame = await iframeHandle.contentFrame()
      
      if (!frame) {
        throw new Error('Could not access iframe content')
      }

      // Wait for canvas inside iframe
      await frame.waitForSelector('#defaultCanvas0', { timeout: 3000 })
      
      // Get canvas element from iframe
      const canvasElement = await frame.$('#defaultCanvas0')
      
      if (!canvasElement) {
        throw new Error('Canvas element not found in iframe')
      }

      // Screenshot the canvas
      const canvasBuffer = await canvasElement.screenshot({
        type: 'png',
        omitBackground: false
      })

      await browser.close()

      // Process canvas buffer and return OG image
      return await processCanvasBuffer(canvasBuffer as Buffer, tokenId, startTime)

    } catch (puppeteerError) {
      console.error(`[OG] Puppeteer error:`, puppeteerError)
      if (browser) {
        await browser.close().catch(() => {})
      }
      throw puppeteerError
    }
    */

  } catch (error) {
    console.error('[OG] Error generating OG image:', error)
    const tokenIdParam = new URL(request.url).searchParams.get('tokenId')
    const tokenId = tokenIdParam ? parseInt(tokenIdParam) : 0
    return generateFallbackImage(tokenId)
  }
}
