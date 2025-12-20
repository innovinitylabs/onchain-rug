'use client'

// Global palette tracker to ensure unique palettes for each rug
const usedPaletteIndices = new Set<number>()
let shuffledPaletteIndices: number[] = []

// Global word tracker to ensure unique words for each rug (excluding WELCOME)
const usedWordIndices = new Set<number>()
let shuffledWordIndices: number[] = []

// Function to reset global state
const resetGlobalState = () => {
  usedPaletteIndices.clear()
  shuffledPaletteIndices = []
  usedWordIndices.clear()
  shuffledWordIndices = []
}

// --- ani-seeded RNG utilities ---
class AniSeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // returns a float [0,1)
  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // returns integer [min, max)
  nextInt(min: number, max: number) {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, Environment } from '@react-three/drei'
import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { 
  Texture, 
  CanvasTexture, 
  Mesh, 
  Group, 
  PlaneGeometry, 
  Points, 
  DirectionalLight,
  RepeatWrapping, 
  DoubleSide 
} from 'three'

// Helper function to create circular sprite texture for particles
const createCircleSprite = (size = 64): Texture => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')!

  // Create radial gradient for smooth circular sprite
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)') // Bright center
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)') // Transparent edges

  // Fill with gradient
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

    const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// Import P5.js functions from your generator
// Global declarations removed - now using ES modules

// Helper function to convert hex to RGB (matches your generator's color logic)
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

  // Helper function to get dynamic text color using your generator's exact logic
const getDynamicTextColor = (bgBrightness: number, aniSelectedPalette: any) => {
  if (aniSelectedPalette && aniSelectedPalette.colors) {
    // Find darkest and lightest colors from palette (matching your generator's updateTextColors logic)
    let darkest = aniSelectedPalette.colors[0]
    let lightest = aniSelectedPalette.colors[0]
    let darkestVal = 999, lightestVal = -1
    
    aniSelectedPalette.colors.forEach((hex: string) => {
      const c = hexToRgb(hex)
      if (c) {
        const bright = (c.r + c.g + c.b) / 3
        if (bright < darkestVal) { darkestVal = bright; darkest = hex }
        if (bright > lightestVal) { lightestVal = bright; lightest = hex }
      }
    })
    
    // Use your generator's exact color selection logic
    return bgBrightness < 128 ? lightest : darkest
  }
  return '#FFFFFF' // Fallback
}

// Advanced Flying Rug Component with Your P5.js Generator Logic
function FlyingRug({ position, scale = 1, seed = 0, dependenciesLoaded, isFirstRug = false, rugsOpacity = 1 }: { 
  position: [number, number, number], 
  scale?: number, 
  seed?: number,
  dependenciesLoaded: boolean,
  isFirstRug?: boolean,
  rugsOpacity?: number
}) {
  const rugRef = useRef<Mesh>(null)
  const groupRef = useRef<Group>(null)
  const initialPositions = useRef<Float32Array | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<CanvasTexture | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const [textureReady, setTextureReady] = useState(false)
  
  // Your curated word list for the flying rugs
  // NOTE: First rug (isFirstRug=true) always shows WELCOME (hardcoded), other rugs randomly select from this array
  // To add more words: just add them to this array after 'DIAMOND HANDS'
  const rugWords = [
    'WELCOME',
    'HODL ZONE',
    'FLOOR IS LAVA',
    'HOME SWEET HOME',
    'GOOD VIBES ONLY',
    'DIAMOND HANDS',
    'ART ON BLOCKCHAIN',
    'DO YOUR OWN RUGS',
    'SOFT RUGS'
  ]

  // Function to get a unique palette index
  const getUniquePaletteIndex = (totalPalettes: number): number => {
    // If we've used all palettes, reset and shuffle again
    if (usedPaletteIndices.size >= totalPalettes) {
      usedPaletteIndices.clear()
      shuffledPaletteIndices = []
    }

    // If we need to shuffle, create a new shuffled array
    if (shuffledPaletteIndices.length === 0) {
      shuffledPaletteIndices = Array.from({ length: totalPalettes }, (_, i) => i)
      // Fisher-Yates shuffle
      for (let i = shuffledPaletteIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPaletteIndices[i], shuffledPaletteIndices[j]] = [shuffledPaletteIndices[j], shuffledPaletteIndices[i]]
      }
    }

    // Get the next unused palette index
    const nextIndex = shuffledPaletteIndices[usedPaletteIndices.size]
    usedPaletteIndices.add(nextIndex)
    return nextIndex
  }

  // Function to get a unique word index (excluding WELCOME for non-first rugs)
  const getUniqueWordIndex = (rugWords: string[], isFirstRug: boolean): number => {
    const totalWords = rugWords.length

    // If this is the first rug, always return WELCOME (index 0)
    if (isFirstRug) {
      return 0
    }

    // For non-first rugs, work with words excluding WELCOME
    const availableWords = totalWords - 1 // Exclude WELCOME

    // If we've used all available words, reset and shuffle again
    if (usedWordIndices.size >= availableWords) {
      usedWordIndices.clear()
      shuffledWordIndices = []
    }

    // If we need to shuffle, create a new shuffled array of indices 1+ (excluding WELCOME)
    if (shuffledWordIndices.length === 0) {
      shuffledWordIndices = Array.from({ length: availableWords }, (_, i) => i + 1) // Start from index 1
      // Fisher-Yates shuffle
      for (let i = shuffledWordIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledWordIndices[i], shuffledWordIndices[j]] = [shuffledWordIndices[j], shuffledWordIndices[i]]
      }
    }

    // Get the next unused word index
    const nextIndex = shuffledWordIndices[usedWordIndices.size]
    usedWordIndices.add(nextIndex)
    return nextIndex
  }
  
  // Stripe generation function EXACTLY like your generator
  const generateStripeDataForRug = (aniSelectedPalette: any, doormatHeight: number, random: () => number) => {
    const stripeData: Array<{
      y: number,
      height: number,
      primaryColor: string,
      secondaryColor: string | null,
      weaveType: 'solid' | 'textured' | 'mixed',
      warpVariation: number
    }> = []
    
    const totalHeight = doormatHeight
    let currentY = 0
    
    // Decide stripe density pattern for this doormat (EXACTLY like your generator)
    const densityType = random()
    let minHeight, maxHeight
    
    if (densityType < 0.2) {
      // 20% chance: High density (many thin stripes)
      minHeight = 15
      maxHeight = 35
    } else if (densityType < 0.4) {
      // 20% chance: Low density (fewer thick stripes) 
      minHeight = 50
      maxHeight = 90
    } else {
      // 60% chance: Mixed density (varied stripe sizes)
      minHeight = 20
      maxHeight = 80
    }
    
    while (currentY < totalHeight) {
      // Dynamic stripe height based on density type (EXACTLY like your generator)
      let stripeHeight
      if (densityType >= 0.4) {
        // Mixed density: add more randomization within the range
        const variationType = random()
        if (variationType < 0.3) {
          // 30% thin stripes within mixed
          stripeHeight = random() * 20 + minHeight
        } else if (variationType < 0.6) {
          // 30% medium stripes within mixed
          stripeHeight = random() * 30 + minHeight + 15
        } else {
          // 40% thick stripes within mixed
          stripeHeight = random() * 25 + maxHeight - 25
        }
      } else {
        // High/Low density: more consistent sizing
        stripeHeight = random() * (maxHeight - minHeight) + minHeight
      }
      
      // Ensure we don't exceed the total height
      if (currentY + stripeHeight > totalHeight) {
        stripeHeight = totalHeight - currentY
      }
      
      // Select colors for this stripe (EXACTLY like your generator)
      const primaryColor = aniSelectedPalette.colors[Math.floor(random() * aniSelectedPalette.colors.length)]
      const hasSecondaryColor = random() < 0.15 // 15% chance of blended colors
      const secondaryColor = hasSecondaryColor ? aniSelectedPalette.colors[Math.floor(random() * aniSelectedPalette.colors.length)] : null
      
      // Determine weave pattern type with weighted probabilities (EXACTLY like your generator)
      const weaveRand = random()
      let weaveType: 'solid' | 'textured' | 'mixed'
      if (weaveRand < 0.6) {          // 60% chance of solid (simple)
        weaveType = 'solid'
      } else if (weaveRand < 0.8) {   // 20% chance of textured 
        weaveType = 'textured'
      } else {                        // 20% chance of mixed (most complex)
        weaveType = 'mixed'
      }
      
      stripeData.push({
        y: currentY,
        height: stripeHeight,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        weaveType: weaveType,
        warpVariation: random() * 0.4 + 0.1 // How much the weave varies
      })
      
      currentY += stripeHeight
    }
    
    return stripeData
  }
  
  // Sophisticated fringe and selvedge drawing function (EXACT COPY of your generator)
  const drawFringeAndSelvedge = (ctx: CanvasRenderingContext2D, stripeData: any[], doormatWidth: number, doormatHeight: number, fringeLength: number, random: () => number, offsetX: number, offsetY: number) => {
    const animWarpThickness = 2
    const animWeftThickness = 8
    
    // Draw sophisticated fringe sections (EXACT COPY of your drawFringeSection)
    drawFringeSection(ctx, offsetX, offsetY, doormatWidth, fringeLength, 'top', random, fringeLength, stripeData)
    drawFringeSection(ctx, offsetX, offsetY + doormatHeight, doormatWidth, fringeLength, 'bottom', random, fringeLength, stripeData)
    
    // Draw sophisticated selvedge edges (EXACT COPY of your drawSelvedgeEdges)
    drawSelvedgeEdges(ctx, stripeData, doormatWidth, doormatHeight, fringeLength, random, offsetX, offsetY)
  }
  
  // Sophisticated fringe section drawing (EXACT COPY of your drawFringeSection)
  const drawFringeSection = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, side: string, random: () => number, fringeLength: number, stripeData: any[]) => {
    const fringeStrands = Math.floor(w / 12) // More fringe strands for thinner threads
    const strandWidth = w / fringeStrands
    
    for (let i = 0; i < fringeStrands; i++) {
      const strandX = x + i * strandWidth
      
      // FIXED: Use the rug's actual stripe colors instead of random palette colors
      // Map fringe strand position to corresponding rug stripe for color matching
      const strandPosition = (strandX - x) / w // 0 to 1 across the rug width
      const stripeIndex = Math.floor(strandPosition * stripeData.length)
      const stripe = stripeData[Math.min(stripeIndex, stripeData.length - 1)]
      
      // Get color from the actual rug stripe, with fallback to palette
      let strandColor = stripe?.primaryColor || '#8B4513'
      
      // Handle P5.js color objects (convert to hex)
      if (typeof strandColor === 'object' && strandColor.r !== undefined) {
        strandColor = `#${Math.round(strandColor.r).toString(16).padStart(2, '0')}${Math.round(strandColor.g).toString(16).padStart(2, '0')}${Math.round(strandColor.b).toString(16).padStart(2, '0')}`
      }
      
      // Draw individual fringe strand with thin threads (EXACT COPY of your logic)
      for (let j = 0; j < 12; j++) { // More but thinner threads per strand
        const threadX = strandX + random() * strandWidth / 3 - strandWidth / 6
        const startY = side === 'top' ? y : y
        const endY = side === 'top' ? y - fringeLength : y + fringeLength
        
        // Add natural curl/wave to the fringe with more variation (EXACT COPY)
        const waveAmplitude = random() * 3 + 1
        const waveFreq = random() * 0.6 + 0.2
        
        // Randomize the direction and intensity for each thread (EXACT COPY)
        const direction = random() < 0.5 ? -1 : 1 // Random left or right direction
        const curlIntensity = random() * 1.5 + 0.5
        const threadLength = random() * 0.4 + 0.8 // Vary thread length
        
        // Use darker version of strand color for fringe (EXACT COPY)
        const r = parseInt(strandColor.slice(1, 3), 16) * 0.7
        const g = parseInt(strandColor.slice(3, 5), 16) * 0.7
        const b = parseInt(strandColor.slice(5, 7), 16) * 0.7
        
        ctx.strokeStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
        ctx.lineWidth = random() * 0.7 + 0.5 // Vary thread thickness
        
        // Draw curved thread with natural variation (EXACT COPY of your beginShape logic)
        ctx.beginPath()
        for (let t = 0; t <= 1; t += 0.1) {
          const yPos = startY + (endY - startY) * t * threadLength
          let xOffset = Math.sin(t * Math.PI * waveFreq) * waveAmplitude * t * direction * curlIntensity
          // Add more randomness and natural variation (EXACT COPY)
          xOffset += random() * 2 - 1
          // Add occasional kinks and bends (EXACT COPY)
          if (random() < 0.3) {
            xOffset += random() * 4 - 2
          }
          
          if (t === 0) {
            ctx.moveTo(threadX + xOffset, yPos)
          } else {
            ctx.lineTo(threadX + xOffset, yPos)
          }
        }
        ctx.stroke()
      }
    }
  }
  
  // Sophisticated selvedge edges drawing (EXACT COPY of your drawSelvedgeEdges)
  const drawSelvedgeEdges = (ctx: CanvasRenderingContext2D, stripeData: any[], doormatWidth: number, doormatHeight: number, fringeLength: number, random: () => number, offsetX: number, offsetY: number) => {
    const animWeftThickness = 8
    const animWeftSpacing = animWeftThickness + 1
    
    // Left selvedge edge - flowing semicircular weft threads (EXACT COPY)
    let isFirstWeft = true
    for (const stripe of stripeData) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += animWeftSpacing) {
        // Skip the very first and very last weft threads (EXACT COPY)
        if (isFirstWeft) {
          isFirstWeft = false
          continue
        }
        
        // Check if this is the last weft thread (EXACT COPY)
        if (stripe === stripeData[stripeData.length - 1] && y + animWeftSpacing >= stripe.y + stripe.height) {
          continue
        }
        
        // Get the color from the current stripe (EXACT COPY)
        let selvedgeColor = stripe.primaryColor
        
        // Check if there's a secondary color for blending (EXACT COPY)
        if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
          // Blend the colors based on noise for variation (EXACT COPY)
          const blendFactor = random() * 0.5 + 0.5
          selvedgeColor = stripe.secondaryColor // Simplified blending
        }
        
        const r = parseInt(selvedgeColor.slice(1, 3), 16) * 0.8
        const g = parseInt(selvedgeColor.slice(3, 5), 16) * 0.8
        const b = parseInt(selvedgeColor.slice(5, 7), 16) * 0.8
        
        // Draw sophisticated selvedge arc (EXACT COPY of your drawTexturedSelvedgeArc)
        const radius = animWeftThickness * (random() * 0.6 + 1.2)
        // FIXED: Move 2 pixels closer to rug edges to eliminate gaps
        const centerX = offsetX + radius * 0.6 + (random() * 2 - 1) // 2 pixels closer to edge
        const centerY = offsetY + y + animWeftThickness / 2 + (random() * 2 - 1) // Slight vertical variation like your generator
        
        // FIXED: Use EXACT angles from your original P5.js generator
        // Left selvedge: P5.js uses 90° to -90°, Canvas needs 90° to -90° for correct semicircle
        const startAngle = (Math.PI / 2) + (random() * 0.4 - 0.2) // Start from top (90°)
        const endAngle = (-Math.PI / 2) + (random() * 0.4 - 0.2)    // End at bottom (-90°)
        
        
        
        // Draw textured selvedge arc with multiple layers (EXACT COPY) - LEFT SIDE semicircle
        drawTexturedSelvedgeArc(ctx, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'left', random)
      }
    }
    
    // Right selvedge edge - flowing semicircular weft threads (EXACT COPY)
    let isFirstWeftRight = true
    for (const stripe of stripeData) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += animWeftSpacing) {
        // Skip the very first and very last weft threads (EXACT COPY)
        if (isFirstWeftRight) {
          isFirstWeftRight = false
          continue
        }
        
        // Check if this is the last weft thread (EXACT COPY)
        if (stripe === stripeData[stripeData.length - 1] && y + animWeftSpacing >= stripe.y + stripe.height) {
          continue
        }
        
        // Get the color from the current stripe (EXACT COPY)
        let selvedgeColor = stripe.primaryColor
        
        // Check if there's a secondary color for blending (EXACT COPY)
        if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
          // Blend the colors based on noise for variation (EXACT COPY)
          const blendFactor = random() * 0.5 + 0.5
          selvedgeColor = stripe.secondaryColor // Simplified blending
        }
        
        const r = parseInt(selvedgeColor.slice(1, 3), 16) * 0.8
        const g = parseInt(selvedgeColor.slice(3, 5), 16) * 0.8
        const b = parseInt(selvedgeColor.slice(5, 7), 16) * 0.8
        
        // Draw sophisticated selvedge arc (EXACT COPY of your drawTexturedSelvedgeArc)
        const radius = animWeftThickness * (random() * 0.6 + 1.2)
        // FIXED: Move 2 pixels closer to rug edges to eliminate gaps
        const centerX = offsetX + doormatWidth - radius * 0.6 + (random() * 2 - 1) // 2 pixels closer to edge
        const centerY = offsetY + y + animWeftThickness / 2 + (random() * 2 - 1) // Slight vertical variation like your generator
        
        // FIXED: Use EXACT angles from your original P5.js generator
        // Right selvedge: P5.js uses -90° to 90°, Canvas needs -90° to 90° for correct semicircle
        const startAngle = (-Math.PI / 2) + (random() * 0.4 - 0.2) // Start from bottom (-90°)
        const endAngle = (Math.PI / 2) + (random() * 0.4 - 0.2)    // End at top (90°)
        
        
        
        // Draw textured selvedge arc with multiple layers (EXACT COPY) - RIGHT SIDE semicircle
        drawTexturedSelvedgeArc(ctx, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right', random)
      }
    }
  }
  
  // FIXED: Eliminate transparency gaps by using solid colors and overlapping arcs
  const drawTexturedSelvedgeArc = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, r: number, g: number, b: number, side: string, random: () => number) => {
    
    
    // Draw solid base arc first to eliminate gaps
    ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 2, startAngle, endAngle)
    ctx.fill()
    
    // Draw overlapping texture layers with solid colors to prevent gaps
    const threadCount = Math.max(4, Math.floor(radius / 1.5)) // Fewer threads, more overlap
    const threadSpacing = radius / (threadCount + 1) // Ensure overlap
    
    for (let i = 0; i < threadCount; i++) {
      const threadRadius = radius - (i * threadSpacing)
      
      // Create distinct thread colors for visible texture
      let threadR, threadG, threadB
      
      if (i % 2 === 0) {
        // Lighter threads
        threadR = Math.max(0, Math.min(255, r + 20))
        threadG = Math.max(0, Math.min(255, g + 20))
        threadB = Math.max(0, Math.min(255, b + 20))
      } else {
        // Darker threads
        threadR = Math.max(0, Math.min(255, r - 15))
        threadG = Math.max(0, Math.min(255, g - 15))
        threadB = Math.max(0, Math.min(255, b - 15))
      }
      
      // Use solid colors to prevent transparency gaps
      ctx.fillStyle = `rgb(${Math.round(threadR)}, ${Math.round(threadG)}, ${Math.round(threadB)})`
      
      // Draw overlapping thread arcs to eliminate gaps
      const threadX = centerX + random() * 1 - 0.5
      const threadY = centerY + random() * 1 - 0.5
      
      ctx.beginPath()
      ctx.arc(threadX, threadY, threadRadius * 2, startAngle, endAngle)
      ctx.fill()
    }
    
    // Add solid detail layers for depth without transparency
    for (let i = 0; i < 2; i++) {
      const detailRadius = radius * (0.4 + i * 0.3)
      
      // Create contrast for visibility
      const detailR = Math.max(0, Math.min(255, r + (i % 2 === 0 ? 15 : -15)))
      const detailG = Math.max(0, Math.min(255, g + (i % 2 === 0 ? 15 : -15)))
      const detailB = Math.max(0, Math.min(255, b + (i % 2 === 0 ? 15 : -15)))
      
      ctx.fillStyle = `rgb(${Math.round(detailR)}, ${Math.round(detailG)}, ${Math.round(detailB)})`
      
      const detailX = centerX + random() * 1 - 0.5
      const detailY = centerY + random() * 1 - 0.5
      
      ctx.beginPath()
      ctx.arc(detailX, detailY, detailRadius * 2, startAngle, endAngle)
      ctx.fill()
    }
    
    // Add solid shadow for depth
    ctx.fillStyle = `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.7)})`
    const shadowOffset = side === 'left' ? 1 : -1
    
    ctx.beginPath()
    ctx.arc(centerX + shadowOffset, centerY + 1, radius * 2, startAngle, endAngle)
    ctx.fill()
  }
  
  // Stripe drawing function with proper weaving (EXACTLY like your generator)
  const drawStripeWithWeaving = (ctx: CanvasRenderingContext2D, stripe: any, doormatWidth: number, doormatHeight: number, random: () => number, offsetX: number, offsetY: number) => {
    const animWarpThickness = 2
    const animWeftThickness = 8
    
    const animWarpSpacing = animWarpThickness + 1
    const animWeftSpacing = animWeftThickness + 1
    
    // Draw warp threads (vertical) as the foundation (EXACTLY like your generator)
    for (let x = 0; x < doormatWidth; x += animWarpSpacing) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += animWeftSpacing) {
        // Parse hex color directly
        let r = parseInt(stripe.primaryColor.slice(1, 3), 16) + (random() * 30 - 15)
        let g = parseInt(stripe.primaryColor.slice(3, 5), 16) + (random() * 30 - 15)
        let b = parseInt(stripe.primaryColor.slice(5, 7), 16) + (random() * 30 - 15)
        
        r = Math.max(0, Math.min(255, r))
        g = Math.max(0, Math.min(255, g))
        b = Math.max(0, Math.min(255, b))
        
        ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
        ctx.fillRect(x + offsetX, y + offsetY, animWarpThickness, animWeftSpacing)
      }
    }
    
    // Draw weft threads (horizontal) that interlace with warp (EXACTLY like your generator)
    for (let y = stripe.y; y < stripe.y + stripe.height; y += animWeftSpacing) {
      for (let x = 0; x < doormatWidth; x += animWarpSpacing) {
        // Parse hex color directly
        let r = parseInt(stripe.primaryColor.slice(1, 3), 16) + (random() * 20 - 10)
        let g = parseInt(stripe.primaryColor.slice(3, 5), 16) + (random() * 20 - 10)
        let b = parseInt(stripe.primaryColor.slice(5, 7), 16) + (random() * 20 - 10)
        
        // Add variation based on weave type (EXACTLY like your generator)
        if (stripe.weaveType === 'mixed' && stripe.secondaryColor) {
          r = parseInt(stripe.secondaryColor.slice(1, 3), 16) + (random() * 20 - 10)
          g = parseInt(stripe.secondaryColor.slice(3, 5), 16) + (random() * 20 - 10)
          b = parseInt(stripe.secondaryColor.slice(5, 7), 16) + (random() * 20 - 10)
        }
        
        r = Math.max(0, Math.min(255, r))
        g = Math.max(0, Math.min(255, g))
        b = Math.max(0, Math.min(255, b))
        
        ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
        ctx.fillRect(x + offsetX, y + offsetY, animWarpSpacing, animWeftThickness)
      }
    }
  }

  // --- ani-prefixed compatibility wrappers ---
  // These wrappers let the rest of AnimatedRugs use the ani* names
  // while delegating to the already-implemented generator functions.

  const generateAniStripeData = (aniSelectedPalette: any, doormatHeight: number, aniRandomFn: () => number) => {
    // Reuse the existing stripe generator (generateStripeDataForRug)
    // which already produces stripe objects matching the original algorithm.
    return generateStripeDataForRug(aniSelectedPalette, doormatHeight, aniRandomFn)
  }

  const drawAniStripe = (ctx: CanvasRenderingContext2D, stripe: any, doormatWidth: number, doormatHeight: number, aniRandomFn: () => number, offsetX: number, offsetY: number) => {
    // Delegate to the full weaving implementation already present
    drawStripeWithWeaving(ctx, stripe, doormatWidth, doormatHeight, aniRandomFn, offsetX, offsetY)
  }

  const drawAniFringe = (ctx: CanvasRenderingContext2D, stripeData: any[], doormatWidth: number, doormatHeight: number, fringeLength: number, aniRandomFn: () => number, offsetX: number, offsetY: number) => {
    // Delegate to the combined fringe + selvedge routine
    drawFringeAndSelvedge(ctx, stripeData, doormatWidth, doormatHeight, fringeLength, aniRandomFn, offsetX, offsetY)
  }

  // --- New helper for selvedge edge rectangles (binding) ---
  // Draws snug edge rectangles and subtle woven effect at the sides
  const drawAniSelvedgeEdges = (
    ctx: CanvasRenderingContext2D,
    aniStripeData: any[],
    doormatWidth: number,
    doormatHeight: number,
    aniRandomFn: () => number,
    offsetX: number,
    offsetY: number
  ) => {
    const selvedgeWidth = 5; // snug edge binding
    aniStripeData.forEach((stripe) => {
      const yStart = stripe.y;
      const yEnd = stripe.y + stripe.height;

      // Base selvedge rectangles (snug to stripe boundaries)
      ctx.fillStyle = stripe.color || stripe.primaryColor;
      ctx.fillRect(offsetX, offsetY + yStart, selvedgeWidth, stripe.height); // left
      ctx.fillRect(offsetX + doormatWidth - selvedgeWidth, offsetY + yStart, selvedgeWidth, stripe.height); // right

      // Subtle woven effect using secondary or darker color
      ctx.strokeStyle = stripe.secondaryColor || "#00000033";
      ctx.lineWidth = 1;
      for (let y = yStart; y < yEnd; y += 3) {
        ctx.beginPath();
        ctx.arc(offsetX + selvedgeWidth / 2, offsetY + y, 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(offsetX + doormatWidth - selvedgeWidth / 2, offsetY + y, 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  // Local color palettes for doormat generation
  const localColorPalettes = [// ===== GLOBAL PALETTES =====
    { name: "Classic Red & Black", colors: ['#8B0000', '#DC143C', '#B22222', '#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D'] },
    { name: "Natural Jute & Hemp", colors: ['#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#8B7355', '#A0522D', '#654321', '#2F2F2F'] },
    { name: "Coastal Blue & White", colors: ['#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#F8F8FF', '#F0F8FF', '#E6E6FA', '#B0C4DE'] },
    { name: "Rustic Farmhouse", colors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#F5DEB3', '#F4E4BC'] },
    { name: "Modern Gray & White", colors: ['#F5F5F5', '#FFFFFF', '#D3D3D3', '#C0C0C0', '#A9A9A9', '#808080', '#696969', '#2F2F2F'] },
    { name: "Autumn Harvest", colors: ['#8B4513', '#D2691E', '#CD853F', '#F4A460', '#8B0000', '#B22222', '#FF8C00', '#FFA500'] },
    { name: "Spring Garden", colors: ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#FF69B4', '#FFB6C1', '#87CEEB', '#F0E68C'] },
    { name: "Industrial Metal", colors: ['#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#000000'] },
    { name: "Mediterranean", colors: ['#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#F4A460', '#DEB887', '#87CEEB', '#4682B4'] },
    { name: "Scandinavian", colors: ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#6C757D', '#495057'] },
    { name: "Nordic Forest", colors: ['#2D5016', '#3A5F0B', '#4A7C59', '#5D8B66', '#6B8E23', '#8FBC8F', '#9ACD32', '#ADFF2F'] },
    { name: "Desert Sunset", colors: ['#CD853F', '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F', '#8B4513', '#A0522D', '#D2691E'] },
    { name: "Arctic Ice", colors: ['#F0F8FF', '#E6E6FA', '#B0C4DE', '#87CEEB', '#B0E0E6', '#F0FFFF', '#E0FFFF', '#F5F5F5'] },
    { name: "Tropical Paradise", colors: ['#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#32CD32', '#90EE90', '#98FB98', '#00CED1'] },
    { name: "Vintage Retro", colors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#BC8F8F', '#8B7355', '#F5DEB3', '#F4E4BC'] },
    { name: "Art Deco", colors: ['#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D', '#CD853F', '#F5DEB3', '#FFFFFF'] },
    { name: "Bohemian", colors: ['#8E44AD', '#9B59B6', '#E67E22', '#D35400', '#E74C3C', '#C0392B', '#16A085', '#1ABC9C'] },
    { name: "Minimalist", colors: ['#FFFFFF', '#F5F5F5', '#E0E0E0', '#CCCCCC', '#999999', '#666666', '#333333', '#000000'] },
    { name: "Corporate", colors: ['#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'] },
    { name: "Luxury", colors: ['#000000', '#2F2F2F', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F5DEB3', '#FFD700'] },
    { name: "Pastel Dreams", colors: ['#FFB6C1', '#FFC0CB', '#FFE4E1', '#F0E68C', '#98FB98', '#90EE90', '#87CEEB', '#E6E6FA'] },
    { name: "Ocean Depths", colors: ['#000080', '#191970', '#4169E1', '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#E0FFFF'] },
    { name: "Mountain Mist", colors: ['#2F4F4F', '#4A5D6B', '#5F7A7A', '#6B8E8E', '#87CEEB', '#B0C4DE', '#E6E6FA', '#F0F8FF'] },
    { name: "Sunset Glow", colors: ['#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#DC143C', '#8B0000', '#2F2F2F'] },

    // ===== INDIAN CULTURAL PALETTES =====
    { name: "Rajasthani", colors: ['#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'] },
    { name: "Kerala", colors: ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#00CED1', '#87CEEB', '#4682B4', '#000080'] },
    { name: "Gujarat", colors: ['#FF4500', '#FF6347', '#FFD700', '#FFA500', '#DC143C', '#4B0082', '#32CD32', '#FFFFFF'] },
    { name: "Bengal", colors: ['#228B22', '#32CD32', '#90EE90', '#F5DEB3', '#DEB887', '#8B4513', '#4682B4', '#000080'] },
    { name: "Kashmir", colors: ['#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'] },

    // ===== TAMIL CULTURAL PALETTES =====
    { name: "Chola Empire", colors: ['#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'] },
    { name: "Chera Dynasty", colors: ['#228B22', '#32CD32', '#90EE90', '#8B4513', '#A0522D', '#FFD700', '#00CED1', '#000080'] },
    { name: "Jamakalam", colors: ['#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#4B0082', '#000000'] },

    // ===== NATURAL DYE PALETTES =====
    { name: "Madder Root", colors: ['#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF6347', '#CD5C5C', '#F08080', '#FA8072'] },
    { name: "Turmeric", colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#DAA520', '#B8860B', '#CD853F'] },
    { name: "Neem", colors: ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'] },
    { name: "Marigold", colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#FF1493', '#FF69B4', '#FFB6C1'] },

    // ===== MADRAS CHECKS & TAMIL NADU INSPIRED PALETTES =====
    { name: "Madras Checks", colors: ['#8B0000', '#DC143C', '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#228B22', '#006400'] },
    { name: "Thanjavur Fresco", colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'] },

    // ===== WESTERN GHATS BIRDS PALETTES =====
    { name: "Indian Peacock", colors: ['#000080', '#191970', '#4169E1', '#4682B4', '#00CED1', '#40E0D0', '#48D1CC', '#20B2AA'] },
    { name: "Flamingo", colors: ['#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB', '#FF6347', '#FF4500', '#FF8C00', '#FFA500'] },
    { name: "Toucan", colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#000000', '#FFFFFF', '#FF1493'] },
    { name: "Malabar Trogon", colors: ['#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#000000', '#FFFFFF'] },

    // ===== HISTORICAL DYNASTY & CULTURAL PALETTES =====
    { name: "Pandyas", colors: ['#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'] },
    { name: "Maurya Empire", colors: ['#000080', '#191970', '#4169E1', '#4682B4', '#FFD700', '#FFA500', '#8B4513', '#A0522D'] },
    { name: "Buddhist", colors: ['#FFD700', '#FFA500', '#8B4513', '#A0522D', '#228B22', '#32CD32', '#90EE90', '#FFFFFF'] },

    // ===== FAMINE & HISTORICAL PERIOD PALETTES =====
    { name: "Indigo Famine", colors: ['#000080', '#191970', '#4169E1', '#4682B4', '#2F4F4F', '#696969', '#808080', '#A9A9A9'] },
    { name: "Bengal Famine", colors: ['#8B0000', '#DC143C', '#B22222', '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#000000'] },

    // ===== MADRAS GENERATOR GLOBAL PALETTES =====
    { name: "Natural Dyes", colors: ['#405BAA', '#B33A3A', '#D9A43B', '#1F1E1D', '#5A7A5A', '#8C5832', '#A48E7F', '#FAF1E3'] },
    { name: "Bleeding Vintage", colors: ['#3A62B3', '#C13D3D', '#D9A43B', '#7DAC9B', '#D87BA1', '#7A4E8A', '#F2E4BE', '#1F1E1D'] },
    { name: "Warm Tamil Madras", colors: ['#C13D3D', '#F5C03A', '#3E5F9A', '#88B0D3', '#ADC178', '#E77F37', '#FAF3EB', '#F2E4BE'] },
    { name: "Classic Red-Green", colors: ['#cc0033', '#ffee88', '#004477', '#ffffff', '#e63946', '#f1faee', '#a8dadc', '#457b9d'] },
    { name: "Vintage Tamil", colors: ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#ffd700', '#b8860b', '#8b0000', '#f7c873'] },
    { name: "Sunset Pondicherry", colors: ['#ffb347', '#ff6961', '#6a0572', '#fff8e7', '#1d3557', '#e63946', '#f7cac9', '#92a8d1'] },
    { name: "Madras Monsoon", colors: ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#ffd700', '#e94f37', '#393e41', '#3f88c5'] },
    { name: "Kanchipuram Gold", colors: ['#ffd700', '#b8860b', '#8b0000', '#fff8e7', '#cc0033', '#004477', '#e63946', '#f1faee'] },
    { name: "Madras Summer", colors: ['#f7c873', '#e94f37', '#393e41', '#3f88c5', '#fff8e7', '#ffb347', '#ff6961', '#1d3557'] },
    { name: "Pondy Pastel", colors: ['#f7cac9', '#92a8d1', '#034f84', '#f7786b', '#fff8e7', '#393e41', '#ffb347', '#e94f37'] },
    { name: "Tamil Sunrise", colors: ['#ffb347', '#ff6961', '#fff8e7', '#1d3557', '#e63946', '#f7c873', '#e94f37', '#393e41'] },
    { name: "Chettinad Spice", colors: ['#d72631', '#a2d5c6', '#077b8a', '#5c3c92', '#f4f4f4', '#ffd700', '#8b0000', '#1a2634'] },
    { name: "Kerala Onam", colors: ['#fff8e7', '#ffd700', '#e94f37', '#393e41', '#3f88c5', '#f7c873', '#ffb347', '#ff6961'] },
    { name: "Bengal Indigo", colors: ['#1a2634', '#3f88c5', '#f7c873', '#e94f37', '#fff8e7', '#ffd700', '#393e41', '#1d3557'] },
    { name: "Goa Beach", colors: ['#f7cac9', '#f7786b', '#034f84', '#fff8e7', '#393e41', '#ffb347', '#e94f37', '#3f88c5'] },
    { name: "Sri Lankan Tea", colors: ['#a8dadc', '#457b9d', '#e63946', '#f1faee', '#fff8e7', '#ffd700', '#8b0000', '#1d3557'] },
    { name: "African Madras", colors: ['#ffb347', '#e94f37', '#393e41', '#3f88c5', '#ffd700', '#f7c873', '#ff6961', '#1d3557'] },
    { name: "Ivy League", colors: ['#002147', '#a6192e', '#f4f4f4', '#ffd700', '#005a9c', '#00356b', '#ffffff', '#8c1515'] },

    // ===== ADDITIONAL UNIQUE PALETTES =====
    { name: "Yale Blue", colors: ['#00356b', '#ffffff', '#c4d8e2', '#8c1515'] },
    { name: "Harvard Crimson", colors: ['#a51c30', '#ffffff', '#000000', '#b7a57a'] },
    { name: "Cornell Red", colors: ['#b31b1b', '#ffffff', '#222222', '#e5e5e5'] },
    { name: "Princeton Orange", colors: ['#ff8f1c', '#000000', '#ffffff', '#e5e5e5'] },
    { name: "Dartmouth Green", colors: ['#00693e', '#ffffff', '#000000', '#a3c1ad'] },
    { name: "Indian Flag", colors: ['#ff9933', '#ffffff', '#138808', '#000080'] },
    { name: "Oxford Tartan", colors: ['#002147', '#c8102e', '#ffd700', '#ffffff', '#008272'] },
    { name: "Black Watch", colors: ['#1c2a3a', '#2e4a62', '#1e2d24', '#3a5f0b'] },
    { name: "Royal Stewart", colors: ['#e10600', '#ffffff', '#000000', '#ffd700', '#007a3d'] },
    { name: "Scottish Highland", colors: ['#005eb8', '#ffd700', '#e10600', '#ffffff', '#000000'] },
    { name: "French Riviera", colors: ['#0055a4', '#ffffff', '#ef4135', '#f7c873'] },
    { name: "Tokyo Metro", colors: ['#e60012', '#0089a7', '#f6aa00', '#ffffff'] },
    { name: "Cape Town Pastel", colors: ['#f7cac9', '#92a8d1', '#034f84', '#f7786b'] },
    { name: "Black & Red", colors: ['#000000', '#cc0033'] }
  ];

  // Local character map for text rendering
  const aniCharacterMap = {
    'A': ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    'B': ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    'C': ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    'D': ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    'E': ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    'F': ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    'G': ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
    'H': ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    'I': ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    'J': ["11111", "00001", "00001", "00001", "10001", "10001", "01110"],
    'K': ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    'L': ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    'M': ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
    'N': ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    'O': ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    'P': ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    'Q': ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    'R': ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    'S': ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    'T': ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    'U': ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    'V': ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
    'W': ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    'X': ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
    'Y': ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
    'Z': ["11111", "00010", "00100", "01000", "10000", "10000", "11111"],
    ' ': ["00000", "00000", "00000", "00000", "00000", "00000", "00000"]
  };
  
  // Use your AMAZING text algorithm from the generator instead of low-effort stuff
  const generateTextDataForRug = (text: string, doormatWidth: number, doormatHeight: number, fringeLength: number) => {
    if (!aniCharacterMap) return []
    
    // Set up doormatTextRows for your proper text algorithm (multi-line like doormat.js)
    const textRows = text.split(' ').map(word => word.toUpperCase())
    
    // Use your actual thread spacing from the generator
    const animWarpThickness = 2
    const animWeftThickness = 8
    const TEXT_SCALE = 2
    
    // Use your exact spacing calculations
    const animWarpSpacing = animWarpThickness + 1
    const animWeftSpacing = animWeftThickness + 1
    const scaledWarp = animWarpSpacing * TEXT_SCALE
    const scaledWeft = animWeftSpacing * TEXT_SCALE
    
    // Your exact character dimensions
    const charWidth = 7 * scaledWarp // width after rotation (7 columns)
    const charHeight = 5 * scaledWeft // height after rotation (5 rows)
    const spacing = scaledWeft // vertical gap between stacked characters
    
    // Your exact row spacing
    const rowSpacing = charWidth * 1.5 // Space between rows
    
    // Calculate total width needed for all rows (your algorithm)
    const totalRowsWidth = textRows.length * charWidth + (textRows.length - 1) * rowSpacing
    
    // Calculate starting X position to center all rows (your algorithm)
    const baseStartX = (doormatWidth - totalRowsWidth) / 2
    
    const aniTextData: Array<{ x: number, y: number, width: number, height: number }> = []
    
    // Generate text data for each row (your exact algorithm)
    for (let rowIndex = 0; rowIndex < textRows.length; rowIndex++) {
      const doormatText = textRows[rowIndex]
      if (!doormatText) continue
      
      // Calculate text dimensions for this row (your algorithm)
      const textWidth = charWidth
      const textHeight = doormatText.length * (charHeight + spacing) - spacing
      
      // Position for this row (your algorithm)
      const startX = baseStartX + rowIndex * (charWidth + rowSpacing)
      const startY = (doormatHeight - textHeight) / 2
      
      // Generate character data vertically bottom-to-top for this row (your algorithm)
      for (let i = 0; i < doormatText.length; i++) {
        const char = doormatText.charAt(i)
        const charY = startY + (doormatText.length - 1 - i) * (charHeight + spacing)
        const charPixels = generateCharacterPixels(char, startX, charY, charWidth, charHeight)
        aniTextData.push(...charPixels)
      }
    }
    
    
    return aniTextData
  }
  
  // Your exact character pixel generation function
  const generateCharacterPixels = (char: string, x: number, y: number, width: number, height: number) => {
    const pixels: Array<{ x: number, y: number, width: number, height: number }> = []
    
    // Use your actual thread spacing
    const animWarpThickness = 2
    const animWeftThickness = 8
    const TEXT_SCALE = 2
    const animWarpSpacing = animWarpThickness + 1
    const animWeftSpacing = animWeftThickness + 1
    const scaledWarp = animWarpSpacing * TEXT_SCALE
    const scaledWeft = animWeftSpacing * TEXT_SCALE

    // Character definitions from your character map
    const charDef = aniCharacterMap[char] || aniCharacterMap[' ']
    if (!charDef) return pixels

    const numRows = charDef.length
    const numCols = charDef[0].length

    // Your exact rotation logic: Rotate 90° CCW: newX = col, newY = numRows - 1 - row
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (charDef[row][col] === '1') {
          // Your exact rotation: Rotate 180°: flip both axes
          const newCol = row
          const newRow = numCols - 1 - col
          pixels.push({
            x: x + newCol * scaledWarp,
            y: y + newRow * scaledWeft,
            width: scaledWarp,
            height: scaledWeft
          })
        }
      }
    }
    return pixels
  }
  

  // Create rug texture using your P5.js generator logic, with P5.js-accurate overlays
  const createRugTexture = (currentTime: number = 0) => {
    if (typeof window === 'undefined' || !dependenciesLoaded) {
      return null
    }
    
    // Create canvas with your generator dimensions
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const doormatHeight = 1200
    const fringeLength = 30
    canvas.width = 800 + (fringeLength * 4)
    canvas.height = doormatHeight + (fringeLength * 4)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const aniRandom = new AniSeededRandom(seed)
    const aniColorPalettes = localColorPalettes || [
      { name: 'Default', colors: ['#8B4513', '#D2691E', '#A0522D', '#CD853F', '#DEB887'] }
    ]
    const aniSelectedPalette = aniColorPalettes[getUniquePaletteIndex(aniColorPalettes.length)]
    const aniStripeData = generateAniStripeData(aniSelectedPalette, doormatHeight, () => aniRandom.next())
      const offsetX = fringeLength * 2
      const offsetY = fringeLength * 2
    // Draw selvages first (with ragged edges)
    drawAniSelvedgeEdges(ctx, aniStripeData, 800, doormatHeight, () => aniRandom.next(), offsetX, offsetY)
    
    // Draw fringe (with ragged edges)
    drawAniFringe(ctx, aniStripeData, 800, doormatHeight, fringeLength, () => aniRandom.next(), offsetX, offsetY)
    
    // Draw doormat texture on top (with clean edges that cover ragged selvages and fringe)
    aniStripeData.forEach(stripe => {
      drawAniStripe(ctx, stripe, 800, doormatHeight, () => aniRandom.next(), offsetX, offsetY)
    })

    // --- Accurate text color using P5.js palette lerpColor logic ---
    // Determine darkest and lightest colors in the palette
    let darkest = aniSelectedPalette.colors[0]
    let lightest = aniSelectedPalette.colors[0]
    let darkestVal = 999, lightestVal = -1

    aniSelectedPalette.colors.forEach((hex: string) => {
      const c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      if (c) {
        const r = parseInt(c[1], 16)
        const g = parseInt(c[2], 16)
        const b = parseInt(c[3], 16)
        const brightness = (r + g + b)/3
        if (brightness < darkestVal) { darkestVal = brightness; darkest = hex }
        if (brightness > lightestVal) { lightestVal = brightness; lightest = hex }
      }
    })

    // Slightly adjust colors like doormat.js
    function lerpColorP5(hexA: string, hexB: string, t: number) {
      const hexToRgb = (h: string) => {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
        return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : { r:0,g:0,b:0 }
      }
      const rgbToHex = (r: number, g: number, b: number) =>
        `#${Math.round(r).toString(16).padStart(2,'0')}${Math.round(g).toString(16).padStart(2,'0')}${Math.round(b).toString(16).padStart(2,'0')}`
      const c1 = hexToRgb(hexA)
      const c2 = hexToRgb(hexB)
      const r = c1.r + (c2.r - c1.r) * t
      const g = c1.g + (c2.g - c1.g) * t
      const b = c1.b + (c2.b - c1.b) * t
      return rgbToHex(r, g, b)
    }

    const lightTextColor = lerpColorP5(lightest, '#ffffff', 0.3)
    const darkTextColor = lerpColorP5(darkest, '#000000', 0.4)

    // Use deterministic word selection with unique word tracking
    const wordIndex = getUniqueWordIndex(rugWords, isFirstRug)
    const aniSelectedWord = rugWords[wordIndex]
    const aniTextData = generateTextDataForRug(aniSelectedWord, 800, doormatHeight, fringeLength)

    // --- Draw text with per-pixel coloring and shadow using doormat.js logic ---
    // Use the already determined darkest and lightest colors from above
    // Use the already declared lightTextColor and darkTextColor from above

    aniTextData.forEach((pixel: any) => {
      const finalX = pixel.x + offsetX;
      const finalY = pixel.y + offsetY;
      // Determine the stripe corresponding to this pixel
      const stripe = aniStripeData.find(
        str => finalY - offsetY >= str.y && finalY - offsetY < str.y + str.height
      ) || aniStripeData[0];
      // Get stripe base color
      const stripeRgb = hexToRgb(stripe.primaryColor);
      const bgBrightness = (stripeRgb.r + stripeRgb.g + stripeRgb.b) / 3;
      // Per-pixel text color: blend with palette lightest/darkest and white/black as in doormat.js
      let textColor: string;
      if (bgBrightness < 128) {
        textColor = lerpColorP5(lightest, '#ffffff', 0.3);
            } else {
        textColor = lerpColorP5(darkest, '#000000', 0.4);
      }
      // Draw shadow first (as in doormat.js)
      ctx.fillStyle = 'rgba(0,0,0,0.47)';
      ctx.fillRect(finalX - 1, finalY - 1, pixel.width + 2, pixel.height + 2);
      // Draw text pixel
      ctx.fillStyle = textColor;
      ctx.fillRect(finalX, finalY, pixel.width, pixel.height);
    });

      
      // Fringe and selvages already drawn above before doormat texture

    // --- 180-degree rotation for THREE.js scene orientation ---
    // Create a new canvas with rotated content
    const rotatedCanvas = document.createElement('canvas')
    const rotatedCtx = rotatedCanvas.getContext('2d', { willReadFrequently: true })!
    rotatedCanvas.width = canvas.width
    rotatedCanvas.height = canvas.height

    // Rotate and copy the content (180-degree flip)
    rotatedCtx.save()
    rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2)
    rotatedCtx.rotate(Math.PI)
    rotatedCtx.translate(-rotatedCanvas.width / 2, -rotatedCanvas.height / 2)
    rotatedCtx.drawImage(canvas, 0, 0)
    rotatedCtx.restore()

    // Use the rotated canvas for the texture
    canvasRef.current = rotatedCanvas
    if (textureRef.current) {
      textureRef.current.dispose()
    }
    const texture = new CanvasTexture(rotatedCanvas)
    texture.wrapS = texture.wrapT = RepeatWrapping
    textureRef.current = texture
    return texture
  }


  // Cleanup textures and canvas elements on unmount
  useEffect(() => {
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose()
      }
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current)
      }
    }
  }, [])



  // Advanced cloth physics animation (keeping your existing animation)
  useFrame((state) => {
    if (rugRef.current && groupRef.current) {
      const time = state.clock.getElapsedTime()
      const geometry = rugRef.current.geometry as PlaneGeometry
      const positions = geometry.attributes.position
      
      // Store initial positions on first run
      if (!initialPositions.current) {
        initialPositions.current = new Float32Array(positions.array.length)
        for (let i = 0; i < positions.array.length; i++) {
          initialPositions.current[i] = positions.array[i]
        }
      }
      
      // Advanced cloth simulation with multiple wave patterns
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        
        // Multiple wave layers for realistic cloth movement - FLOWING ALONG LENGTH (Y-axis)
        const wave1 = Math.sin(y * 1.5 + time * 2) * 0.15        // Y-axis flow (length)
        const wave2 = Math.sin(x * 1.2 + time * 1.8) * 0.08     // X-axis flow (width) - secondary
        const wave3 = Math.sin((y + x) * 0.8 + time * 2.5) * 0.05 // Combined flow
        const ripple = Math.sin(Math.sqrt(y * y + x * x) * 2 - time * 3) * 0.03 // Radial flow
        
        // Wind effect simulation - PRIMARY FLOW ALONG LENGTH
        const windY = Math.sin(time * 0.7 + y * 0.5) * 0.04      // Y-axis wind (length)
        const windX = Math.cos(time * 0.9 + x * 0.3) * 0.03     // X-axis wind (width) - secondary
        
        // Edge effects for natural cloth behavior - ENHANCED ALONG LENGTH
        const edgeFactorY = Math.abs(y) / 2    // Primary edge effect along length
        const edgeFactorX = Math.abs(x) / 4    // Secondary edge effect along width
        const edgeAmplification = 1 + (edgeFactorY + edgeFactorX * 0.5) * 0.5
        
        const totalWave = (wave1 + wave2 + wave3 + ripple + windX + windY) * edgeAmplification
        positions.setZ(i, totalWave)
      }
      positions.needsUpdate = true
      
      // Enhanced floating motion with realistic physics
      const floatY = Math.sin(time * 0.4 + position[0]) * 0.4 + Math.cos(time * 0.6) * 0.2
      const driftX = Math.sin(time * 0.2) * 0.3
      const driftZ = Math.cos(time * 0.25) * 0.2
      
      groupRef.current.position.set(
        position[0] + driftX,
        position[1] + floatY,
        position[2] + driftZ
      )
      
      // Complex rotation for natural flying motion
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.15 + Math.cos(time * 0.5) * 0.05
      groupRef.current.rotation.x = Math.sin(time * 0.4) * 0.08 + Math.cos(time * 0.7) * 0.03
      groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.05
      
      // Initialize start time on first frame
      if (startTimeRef.current === null) {
        startTimeRef.current = time * 1000 // Convert to milliseconds
      }
      
      // Calculate elapsed time since start
      const elapsedTime = (time * 1000) - startTimeRef.current
      
      // Texture will appear automatically when elapsedTime >= textureDelay
      // No need for periodic updates - it happens naturally when condition is met
    }
  })

  // Generate texture asynchronously to avoid blocking main thread
  useEffect(() => {
    if (!dependenciesLoaded) return

    // Defer texture generation to next frame to avoid blocking
    const generateTexture = () => {
      requestAnimationFrame(() => {
        const rugTexture = createRugTexture(10)
        if (rugTexture) {
          textureRef.current = rugTexture
          setTextureReady(true)
        }
      })
    }

    // Small delay to let initial render complete
    const timer = setTimeout(generateTexture, 0)
    return () => clearTimeout(timer)
  }, [dependenciesLoaded])

  // Don't render until dependencies are loaded and texture is ready
  if (!dependenciesLoaded || !textureReady || !textureRef.current) {
    return null
  }

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      <Float speed={0.3} rotationIntensity={0.08} floatIntensity={0.15}>
        <mesh ref={rugRef} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5, 7, 16, 16]} />
          <meshStandardMaterial 
            map={textureRef.current} 
            side={DoubleSide}
            transparent
            opacity={0.95 * rugsOpacity}
            roughness={0.8}
            metalness={0.1}
            depthTest={false}
            depthWrite={false}
            alphaTest={0.1}
            clippingPlanes={[]}
          />
        </mesh>
        
        {/* Enhanced glow with multiple layers - TRANSPARENT */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[4.3, 6.3]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.05}
            side={DoubleSide}
          />
        </mesh>
        
        {/* Magical shimmer effect - TRANSPARENT */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[4.1, 6.1]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.03}
            side={DoubleSide}
          />
        </mesh>
      </Float>
    </group>
  )
}

// Studio Ghibli-style floating particles (circular, bluish-white) - EMITTER MATERIAL
function FloatingParticles() {
  const particlesRef = useRef<Points>(null)

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < 80; i++) { // Optimized count for performance
      temp.push([
        (Math.random() - 0.5) * 60, // Wider spread
        (Math.random() - 0.5) * 40, // Taller spread
        (Math.random() - 0.5) * 60  // Deeper spread
      ])
    }
    return temp
  }, [])

  // Create circular sprite texture once
  const circleSprite = useMemo(() => createCircleSprite(128), [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05 // Slower, more gentle rotation
      particlesRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.03) * 0.1 // Gentle wobble
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.flat())}
          itemSize={3}
          args={[new Float32Array(particles.flat()), 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        map={circleSprite} // Use circular sprite texture
        size={0.12} // Larger for better visibility
        color="#4fc3f7" // Bright cyan color
        transparent
        opacity={0.8} // More visible
        sizeAttenuation={true}
        alphaTest={0.01}
        depthWrite={false}
      />
    </points>
  )
}

// Enhanced Magical Scene
function Scene({ onLoaded }: { onLoaded?: () => void }) {
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false)
  const [rugsOpacity, setRugsOpacity] = useState(0)

  // Create circular sprite textures for particles
  const circleSprite = useMemo(() => createCircleSprite(128), [])

  useEffect(() => {
    // Reset global state when component mounts
    resetGlobalState()
    
    // Always set as loaded and trigger callback
          setDependenciesLoaded(true)
    
    // Smooth fade-in for all rugs together
    const timer = setTimeout(() => {
      console.log('🎭 Setting rugs opacity to 1 and calling onLoaded')
      setRugsOpacity(1)
      // Call onLoaded after rugs are ready to fade in
      if (onLoaded) {
        onLoaded()
      }
    }, 800) // Wait for initial canvas fade-in to complete
    
    return () => clearTimeout(timer)
  }, [onLoaded])
  

  return (
    <>
      {/* Essential Lighting Only */}
      <ambientLight intensity={0.6} color="#ffeaa7" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        color="#ffb347"
      />
      
      {/* Environment - TRANSPARENT */}
      <Environment preset="sunset" background={false} />
      
      {/* Flying Rugs with Your Generator Logic - Each with unique seeds */}
      <FlyingRug position={[0, 0, 0]} scale={1.2} seed={42} dependenciesLoaded={dependenciesLoaded} isFirstRug={true} rugsOpacity={rugsOpacity} />
      <FlyingRug position={[-8, 2, -5]} scale={0.8} seed={1337} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} rugsOpacity={rugsOpacity} />
      <FlyingRug position={[8, -1, -3]} scale={0.9} seed={777} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} rugsOpacity={rugsOpacity} />
      <FlyingRug position={[5, 3, -8]} scale={0.7} seed={999} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} rugsOpacity={rugsOpacity} />
      <FlyingRug position={[-6, -2, -10]} scale={0.6} seed={555} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} rugsOpacity={rugsOpacity} />
      <FlyingRug position={[-3, 5, -12]} scale={0.5} seed={888} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} rugsOpacity={rugsOpacity} />
      <FlyingRug position={[10, -3, -15]} scale={0.4} seed={111} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} rugsOpacity={rugsOpacity} />
      
      {/* Enhanced Floating Particles */}
      <FloatingParticles />

      {/* Additional Emissive Sprite Effects */}
      <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.4}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={40}
              array={new Float32Array(Array.from({ length: 120 }, () => (Math.random() - 0.5) * 50))}
              itemSize={3}
              args={[new Float32Array(Array.from({ length: 240 }, () => (Math.random() - 0.5) * 50)), 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            map={circleSprite} // Use circular sprite texture
            size={0.15}
            color="#ffd700" // Golden color
            transparent
            opacity={1.0}
            sizeAttenuation={true}
            alphaTest={0.01}
            depthWrite={false}
          />
        </points>
      </Float>

      {/* Studio Ghibli Magical Dust Effect - EMITTER MATERIAL */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={30}
              array={new Float32Array(Array.from({ length: 90 }, () => (Math.random() - 0.5) * 80))}
              itemSize={3}
              args={[new Float32Array(Array.from({ length: 450 }, () => (Math.random() - 0.5) * 80)), 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            map={circleSprite} // Use circular sprite texture
            size={0.1}
            color="#87ceeb" // Sky blue color
            transparent
            opacity={0.9} // More visible
            sizeAttenuation={true}
            alphaTest={0.01}
            depthWrite={false}
          />
        </points>
      </Float>
      
      {/* Camera Controls */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </>
  )
}

export default function AnimatedRugs() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Reset global state when component mounts
    resetGlobalState()
    // Reset visibility state
    setIsVisible(false)
    
    // Cleanup function
    return () => {
      // Reset global state when component unmounts
      resetGlobalState()
    }
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full">
      {typeof window !== 'undefined' && (
        <Canvas
          camera={{ position: [0, 5, 15], fov: 60 }}
          style={{
            background: 'transparent',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out'
          }}
      >
        <Suspense fallback={null}>
          <Scene onLoaded={() => {
            console.log('🎭 Scene loaded, setting isVisible to true')
            setIsVisible(true)
          }} />
        </Suspense>
        </Canvas>
      )}
    </div>
  )
}

// Fallback generator helpers with ani prefix to avoid clashing with main generator
function drawAniStripe(ctx: CanvasRenderingContext2D, stripe: any, doormatWidth: number, doormatHeight: number, random: () => number, offsetX: number, offsetY: number) {
  // Direct copy of drawStripeWithWeaving, but with ani prefix
  const animWarpThickness = 2
  const animWeftThickness = 8

  const animWarpSpacing = animWarpThickness + 1
  const animWeftSpacing = animWeftThickness + 1

  // Draw warp threads (vertical)
  for (let x = 0; x < doormatWidth; x += animWarpSpacing) {
    for (let y = stripe.y; y < stripe.y + stripe.height; y += animWeftSpacing) {
      let r = parseInt(stripe.primaryColor.slice(1, 3), 16) + (random() * 30 - 15)
      let g = parseInt(stripe.primaryColor.slice(3, 5), 16) + (random() * 30 - 15)
      let b = parseInt(stripe.primaryColor.slice(5, 7), 16) + (random() * 30 - 15)
      r = Math.max(0, Math.min(255, r))
      g = Math.max(0, Math.min(255, g))
      b = Math.max(0, Math.min(255, b))
      ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
      ctx.fillRect(x + offsetX, y + offsetY, animWarpThickness, animWeftSpacing)
    }
  }
  // Draw weft threads (horizontal)
  for (let y = stripe.y; y < stripe.y + stripe.height; y += animWeftSpacing) {
    for (let x = 0; x < doormatWidth; x += animWarpSpacing) {
      let r = parseInt(stripe.primaryColor.slice(1, 3), 16) + (random() * 20 - 10)
      let g = parseInt(stripe.primaryColor.slice(3, 5), 16) + (random() * 20 - 10)
      let b = parseInt(stripe.primaryColor.slice(5, 7), 16) + (random() * 20 - 10)
      if (stripe.weaveType === 'mixed' && stripe.secondaryColor) {
        r = parseInt(stripe.secondaryColor.slice(1, 3), 16) + (random() * 20 - 10)
        g = parseInt(stripe.secondaryColor.slice(3, 5), 16) + (random() * 20 - 10)
        b = parseInt(stripe.secondaryColor.slice(5, 7), 16) + (random() * 20 - 10)
      }
      r = Math.max(0, Math.min(255, r))
      g = Math.max(0, Math.min(255, g))
      b = Math.max(0, Math.min(255, b))
      ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
      ctx.fillRect(x + offsetX, y + offsetY, animWarpSpacing, animWeftThickness)
    }
  }
}

function drawAniFringe(ctx: CanvasRenderingContext2D, stripeData: any[], doormatWidth: number, doormatHeight: number, fringeLength: number, random: () => number, offsetX: number, offsetY: number) {
  // Draw fringe and selvedge for fallback generator
  drawAniFringeSection(ctx, offsetX, offsetY, doormatWidth, fringeLength, 'top', random, fringeLength, stripeData)
  drawAniFringeSection(ctx, offsetX, offsetY + doormatHeight, doormatWidth, fringeLength, 'bottom', random, fringeLength, stripeData)
  drawAniSelvedgeEdges(ctx, stripeData, doormatWidth, doormatHeight, fringeLength, random, offsetX, offsetY)
}

function drawAniFringeSection(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, side: string, random: () => number, fringeLength: number, stripeData: any[]) {
  const fringeStrands = Math.floor(w / 12)
  const strandWidth = w / fringeStrands
  for (let i = 0; i < fringeStrands; i++) {
    const strandX = x + i * strandWidth
    const strandPosition = (strandX - x) / w
    const stripeIndex = Math.floor(strandPosition * stripeData.length)
    const stripe = stripeData[Math.min(stripeIndex, stripeData.length - 1)]
    let strandColor = stripe?.primaryColor || '#8B4513'
    if (typeof strandColor === 'object' && strandColor.r !== undefined) {
      strandColor = `#${Math.round(strandColor.r).toString(16).padStart(2, '0')}${Math.round(strandColor.g).toString(16).padStart(2, '0')}${Math.round(strandColor.b).toString(16).padStart(2, '0')}`
    }
    for (let j = 0; j < 12; j++) {
      const threadX = strandX + random() * strandWidth / 3 - strandWidth / 6
      const startY = side === 'top' ? y : y
      const endY = side === 'top' ? y - fringeLength : y + fringeLength
      const waveAmplitude = random() * 3 + 1
      const waveFreq = random() * 0.6 + 0.2
      const direction = random() < 0.5 ? -1 : 1
      const curlIntensity = random() * 1.5 + 0.5
      const threadLength = random() * 0.4 + 0.8
      const r = parseInt(strandColor.slice(1, 3), 16) * 0.7
      const g = parseInt(strandColor.slice(3, 5), 16) * 0.7
      const b = parseInt(strandColor.slice(5, 7), 16) * 0.7
      ctx.strokeStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
      ctx.lineWidth = random() * 0.7 + 0.5
      ctx.beginPath()
      for (let t = 0; t <= 1; t += 0.1) {
        const yPos = startY + (endY - startY) * t * threadLength
        let xOffset = Math.sin(t * Math.PI * waveFreq) * waveAmplitude * t * direction * curlIntensity
        xOffset += random() * 2 - 1
        if (random() < 0.3) {
          xOffset += random() * 4 - 2
        }
        if (t === 0) {
          ctx.moveTo(threadX + xOffset, yPos)
        } else {
          ctx.lineTo(threadX + xOffset, yPos)
        }
      }
      ctx.stroke()
    }
  }
}

function drawAniSelvedgeEdges(ctx: CanvasRenderingContext2D, stripeData: any[], doormatWidth: number, doormatHeight: number, fringeLength: number, random: () => number, offsetX: number, offsetY: number) {
  const animWeftThickness = 8
  const animWeftSpacing = animWeftThickness + 1
  let isFirstWeft = true
  for (const stripe of stripeData) {
    for (let y = stripe.y; y < stripe.y + stripe.height; y += animWeftSpacing) {
      if (isFirstWeft) {
        isFirstWeft = false
        continue
      }
      if (stripe === stripeData[stripeData.length - 1] && y + animWeftSpacing >= stripe.y + stripe.height) {
        continue
      }
      let selvedgeColor = stripe.primaryColor
      if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
        selvedgeColor = stripe.secondaryColor
      }
      const r = parseInt(selvedgeColor.slice(1, 3), 16) * 0.8
      const g = parseInt(selvedgeColor.slice(3, 5), 16) * 0.8
      const b = parseInt(selvedgeColor.slice(5, 7), 16) * 0.8
      const radius = animWeftThickness * (random() * 0.6 + 1.2)
      const centerX = offsetX + radius * 0.6 + (random() * 2 - 1)
      const centerY = offsetY + y + animWeftThickness / 2 + (random() * 2 - 1)
      const startAngle = (Math.PI / 2) + (random() * 0.4 - 0.2)
      const endAngle = (-Math.PI / 2) + (random() * 0.4 - 0.2)
      drawAniTextureOverlay(ctx, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'left', random)
    }
  }
  let isFirstWeftRight = true
  for (const stripe of stripeData) {
    for (let y = stripe.y; y < stripe.y + stripe.height; y += animWeftSpacing) {
      if (isFirstWeftRight) {
        isFirstWeftRight = false
        continue
      }
      if (stripe === stripeData[stripeData.length - 1] && y + animWeftSpacing >= stripe.y + stripe.height) {
        continue
      }
      let selvedgeColor = stripe.primaryColor
      if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
        selvedgeColor = stripe.secondaryColor
      }
      const r = parseInt(selvedgeColor.slice(1, 3), 16) * 0.8
      const g = parseInt(selvedgeColor.slice(3, 5), 16) * 0.8
      const b = parseInt(selvedgeColor.slice(5, 7), 16) * 0.8
      const radius = animWeftThickness * (random() * 0.6 + 1.2)
      const centerX = offsetX + doormatWidth - radius * 0.6 + (random() * 2 - 1)
      const centerY = offsetY + y + animWeftThickness / 2 + (random() * 2 - 1)
      const startAngle = (-Math.PI / 2) + (random() * 0.4 - 0.2)
      const endAngle = (Math.PI / 2) + (random() * 0.4 - 0.2)
      drawAniTextureOverlay(ctx, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right', random)
    }
  }
}

function drawAniTextureOverlay(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, r: number, g: number, b: number, side: string, random: () => number) {
  // Draw solid base arc first to eliminate gaps
  ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius * 2, startAngle, endAngle)
  ctx.fill()
  const threadCount = Math.max(4, Math.floor(radius / 1.5))
  const threadSpacing = radius / (threadCount + 1)
  for (let i = 0; i < threadCount; i++) {
    const threadRadius = radius - (i * threadSpacing)
    let threadR, threadG, threadB
    if (i % 2 === 0) {
      threadR = Math.max(0, Math.min(255, r + 20))
      threadG = Math.max(0, Math.min(255, g + 20))
      threadB = Math.max(0, Math.min(255, b + 20))
    } else {
      threadR = Math.max(0, Math.min(255, r - 15))
      threadG = Math.max(0, Math.min(255, g - 15))
      threadB = Math.max(0, Math.min(255, b - 15))
    }
    ctx.fillStyle = `rgb(${Math.round(threadR)}, ${Math.round(threadG)}, ${Math.round(threadB)})`
    const threadX = centerX + random() * 1 - 0.5
    const threadY = centerY + random() * 1 - 0.5
    ctx.beginPath()
    ctx.arc(threadX, threadY, threadRadius * 2, startAngle, endAngle)
    ctx.fill()
  }
  for (let i = 0; i < 2; i++) {
    const detailRadius = radius * (0.4 + i * 0.3)
    const detailR = Math.max(0, Math.min(255, r + (i % 2 === 0 ? 15 : -15)))
    const detailG = Math.max(0, Math.min(255, g + (i % 2 === 0 ? 15 : -15)))
    const detailB = Math.max(0, Math.min(255, b + (i % 2 === 0 ? 15 : -15)))
    ctx.fillStyle = `rgb(${Math.round(detailR)}, ${Math.round(detailG)}, ${Math.round(detailB)})`
    const detailX = centerX + random() * 1 - 0.5
    const detailY = centerY + random() * 1 - 0.5
    ctx.beginPath()
    ctx.arc(detailX, detailY, detailRadius * 2, startAngle, endAngle)
    ctx.fill()
  }
  ctx.fillStyle = `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.7)})`
  const shadowOffset = side === 'left' ? 1 : -1
  ctx.beginPath()
  ctx.arc(centerX + shadowOffset, centerY + 1, radius * 2, startAngle, endAngle)
  ctx.fill()
}