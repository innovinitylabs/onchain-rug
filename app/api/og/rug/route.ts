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

import { NextRequest, NextResponse } from 'next/server'
import { createCanvas } from 'canvas'
import { createContext, runInContext, Script } from 'vm'
import { readFileSync } from 'fs'
import { join } from 'path'
import { RugMarketRedis } from '@/app/api/rug-market/collection/rug-market-redis'
import { getContractAddress } from '@/app/api/rug-market/collection/networks'

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

    // Extract rendering parameters
    const permanent = nftData.permanent
    const seed = permanent.seed || tokenId
    const palette = typeof permanent.minifiedPalette === 'string'
      ? JSON.parse(permanent.minifiedPalette)
      : permanent.minifiedPalette
    const stripeData = typeof permanent.minifiedStripeData === 'string'
      ? JSON.parse(permanent.minifiedStripeData)
      : permanent.minifiedStripeData
    const textRows = permanent.textRows || []
    const warpThickness = permanent.warpThickness || 4
    const characterMap = permanent.filteredCharacterMap || {}

    // In OG mode: disable dirt, aging, frames for clean preview
    const textureLevel = 0 // Disabled for OG
    const dirtLevel = 0 // Disabled for OG
    const frameLevel = 'None' // Disabled for OG

    // Create canvas for OG image
    const canvas = createCanvas(OG_WIDTH, OG_HEIGHT)
    const ctx = canvas.getContext('2d')

    // Fill with neutral background
    ctx.fillStyle = '#DEDEDE' // Neutral gray background
    ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT)

    // Calculate rug dimensions and position for OG layout
    const rugWidth = 800
    const rugHeight = 1200
    const scale = Math.min(
      (OG_WIDTH * 0.7) / rugWidth,
      (OG_HEIGHT * 0.9) / rugHeight
    )
    const scaledWidth = rugWidth * scale
    const scaledHeight = rugHeight * scale
    const offsetX = (OG_WIDTH - scaledWidth) / 2
    const offsetY = (OG_HEIGHT - scaledHeight) / 2

    // Create a temporary larger canvas for rug rendering
    const rugCanvas = createCanvas(rugWidth + 220, rugHeight + 220) // Add padding for fringe
    const rugCtx = rugCanvas.getContext('2d')

    // Load scripts
    const p5ScriptContent = readFileSync(join(process.cwd(), 'public/data/rug-p5.js'), 'utf-8')
    const algoScriptContent = readFileSync(join(process.cwd(), 'public/data/rug-algo.js'), 'utf-8')

    // Create VM context with browser-compatible APIs
    const sandbox: any = {
      // Canvas API - provide node-canvas compatible interface
      createCanvas: (w: number, h: number) => {
        const c = createCanvas(w, h)
        return {
          getContext: () => c.getContext('2d'),
          width: c.width,
          height: c.height,
          parent: () => {},
          elt: c
        }
      },
      document: {
        createElement: (tag: string) => {
          if (tag === 'canvas') {
            return rugCanvas
          }
          return {}
        },
        getElementById: () => null,
        body: { appendChild: () => {} },
        querySelector: () => null
      },
      window: {
        width: rugCanvas.width,
        height: rugCanvas.height,
        prngSeed: seed,
        cm: characterMap,
        rW: rugWidth + 220,
        rH: rugHeight + 220,
        noLoopCalled: false,
        addEventListener: () => {}
      },
      // Rug parameters (OG mode: no dirt, no aging, no frames)
      w: rugWidth,
      h: rugHeight,
      f: 30,
      wt: 8,
      wp: warpThickness,
      ts: 2,
      p: palette,
      sd: stripeData,
      tr: textRows,
      td: [], // Text data (will be populated by script)
      s: seed,
      tl: textureLevel, // 0 in OG mode
      dl: dirtLevel, // 0 in OG mode
      fl: frameLevel, // 'None' in OG mode
      lt: null, // Will be set by script
      dt: null, // Will be set by script
      // Math functions
      Math,
      console: { log: () => {}, error: () => {} },
      // RequestAnimationFrame stub
      requestAnimationFrame: () => {},
      // Object.defineProperty for width/height getters
      Object
    }

    const vmContext = createContext(sandbox)

    // Execute scripts with timeout
    try {
      const p5Script = new Script(p5ScriptContent)
      const algoScript = new Script(algoScriptContent)

      // Execute p5 script first
      runInContext(p5Script, vmContext, { timeout: 2000 })
      
      // Execute algo script
      runInContext(algoScript, vmContext, { timeout: 2000 })

      // Trigger draw if setup was called
      if (sandbox.window.setup && typeof sandbox.window.setup === 'function') {
        sandbox.window.setup()
      }
      if (sandbox.window.draw && typeof sandbox.window.draw === 'function') {
        sandbox.window.draw()
      }

      // Draw rug onto OG canvas
      ctx.drawImage(rugCanvas, offsetX, offsetY, scaledWidth, scaledHeight)

      // Add token ID text overlay
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`OnchainRug #${tokenId}`, OG_WIDTH / 2, OG_HEIGHT - 40)

    } catch (error) {
      console.error('Error rendering rug:', error)
      return generateFallbackImage(tokenId)
    }

    // Convert to PNG buffer
    const buffer = canvas.toBuffer('image/png')

    // Check timeout
    const elapsed = Date.now() - startTime
    if (elapsed > 3000) {
      console.warn(`OG image generation took ${elapsed}ms (exceeded 3s limit)`)
    }

    // Return PNG
    return new NextResponse(buffer, {
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
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
