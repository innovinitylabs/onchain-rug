'use client'

// Global palette tracker to ensure unique palettes for each rug
let usedPaletteIndices = new Set<number>()
let shuffledPaletteIndices: number[] = []

// Function to reset global state
const resetGlobalState = () => {
  usedPaletteIndices.clear()
  shuffledPaletteIndices = []
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
import { OrbitControls, Float, Text3D, Environment } from '@react-three/drei'
import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

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
function FlyingRug({ position, scale = 1, seed = 0, dependenciesLoaded, isFirstRug = false }: { 
  position: [number, number, number], 
  scale?: number, 
  seed?: number,
  dependenciesLoaded: boolean,
  isFirstRug?: boolean
}) {
  const rugRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const initialPositions = useRef<Float32Array | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const startTimeRef = useRef<number | null>(null)
  
  // Your curated word list for the flying rugs
  // NOTE: First rug (isFirstRug=true) always shows WELCOME (hardcoded), other rugs randomly select from this array
  // To add more words: just add them to this array after 'DIAMOND HANDS'
  const rugWords = [
    'WELCOME',
    'HODL ZONE',
    'SOFT RUG',
    'FLOOR IS LAVA',
    'HOME SWEET HOME',
    'GOOD VIBES ONLY',
    'DIAMOND HANDS'
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
    
    let totalHeight = doormatHeight
    let currentY = 0
    
    // Decide stripe density pattern for this doormat (EXACTLY like your generator)
    let densityType = random()
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
        let variationType = random()
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
      let primaryColor = aniSelectedPalette.colors[Math.floor(random() * aniSelectedPalette.colors.length)]
      let hasSecondaryColor = random() < 0.15 // 15% chance of blended colors
      let secondaryColor = hasSecondaryColor ? aniSelectedPalette.colors[Math.floor(random() * aniSelectedPalette.colors.length)] : null
      
      // Determine weave pattern type with weighted probabilities (EXACTLY like your generator)
      let weaveRand = random()
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
    for (let stripe of stripeData) {
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
    for (let stripe of stripeData) {
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
      let detailR = Math.max(0, Math.min(255, r + (i % 2 === 0 ? 15 : -15)))
      let detailG = Math.max(0, Math.min(255, g + (i % 2 === 0 ? 15 : -15)))
      let detailB = Math.max(0, Math.min(255, b + (i % 2 === 0 ? 15 : -15)))
      
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
    
    let animWarpSpacing = animWarpThickness + 1
    let animWeftSpacing = animWeftThickness + 1
    
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
  const localColorPalettes = [
    // ===== GLOBAL PALETTES (25) =====
    
    // Classic Red & Black - most common doormat colors
    {
        name: "Classic Red & Black",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D'
        ]
    },
    // Natural Jute & Hemp - eco-friendly doormat colors
    {
        name: "Natural Jute & Hemp",
        colors: [
            '#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#8B7355', '#A0522D', '#654321', '#2F2F2F'
        ]
    },
    // Coastal Blue & White - beach house style
    {
        name: "Coastal Blue & White",
        colors: [
            '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#F8F8FF', '#F0F8FF', '#E6E6FA', '#B0C4DE'
        ]
    },
    // Rustic Farmhouse - warm, earthy tones
    {
        name: "Rustic Farmhouse",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#F5DEB3', '#F4E4BC'
        ]
    },
    // Modern Gray & White - contemporary minimalist
    {
        name: "Modern Gray & White",
        colors: [
            '#F5F5F5', '#FFFFFF', '#D3D3D3', '#C0C0C0', '#A9A9A9', '#808080', '#696969', '#2F2F2F'
        ]
    },
    // Autumn Harvest - warm fall colors
    {
        name: "Autumn Harvest",
        colors: [
            '#8B4513', '#D2691E', '#CD853F', '#F4A460', '#8B0000', '#B22222', '#FF8C00', '#FFA500'
        ]
    },
    // Spring Garden - fresh, vibrant colors
    {
        name: "Spring Garden",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#FF69B4', '#FFB6C1', '#87CEEB', '#F0E68C'
        ]
    },
    // Industrial Metal - urban, modern look
    {
        name: "Industrial Metal",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#000000'
        ]
    },
    // Mediterranean - warm, sun-baked colors
    {
        name: "Mediterranean",
        colors: [
            '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#F4A460', '#DEB887', '#87CEEB', '#4682B4'
        ]
    },
    // Scandinavian - clean, light colors
    {
        name: "Scandinavian",
        colors: [
            '#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#6C757D', '#495057'
        ]
    },
    // Nordic Forest - deep greens and browns
    {
        name: "Nordic Forest",
        colors: [
            '#2D5016', '#3A5F0B', '#4A7C59', '#5D8B66', '#6B8E23', '#8FBC8F', '#9ACD32', '#ADFF2F'
        ]
    },
    // Desert Sunset - warm, sandy tones
    {
        name: "Desert Sunset",
        colors: [
            '#CD853F', '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F', '#8B4513', '#A0522D', '#D2691E'
        ]
    },
    // Arctic Ice - cool, icy colors
    {
        name: "Arctic Ice",
        colors: [
            '#F0F8FF', '#E6E6FA', '#B0C4DE', '#87CEEB', '#B0E0E6', '#F0FFFF', '#E0FFFF', '#F5F5F5'
        ]
    },
    // Tropical Paradise - vibrant, warm colors
    {
        name: "Tropical Paradise",
        colors: [
            '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#32CD32', '#90EE90', '#98FB98', '#00CED1'
        ]
    },
    // Vintage Retro - muted, nostalgic colors
    {
        name: "Vintage Retro",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#BC8F8F', '#8B7355', '#F5DEB3', '#F4E4BC'
        ]
    },
    // Art Deco - elegant, sophisticated colors
    {
        name: "Art Deco",
        colors: [
            '#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D', '#CD853F', '#F5DEB3', '#FFFFFF'
        ]
    },
    // Bohemian - eclectic, artistic colors
    {
        name: "Bohemian",
        colors: [
            '#8E44AD', '#9B59B6', '#E67E22', '#D35400', '#E74C3C', '#C0392B', '#16A085', '#1ABC9C'
        ]
    },
    // Minimalist - clean, simple colors
    {
        name: "Minimalist",
        colors: [
            '#FFFFFF', '#F5F5F5', '#E0E0E0', '#CCCCCC', '#999999', '#666666', '#333333', '#000000'
        ]
    },
    // Corporate - professional, business colors
    {
        name: "Corporate",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
        ]
    },
    // Luxury - rich, premium colors
    {
        name: "Luxury",
        colors: [
            '#000000', '#2F2F2F', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F5DEB3', '#FFD700'
        ]
    },
    // Pastel Dreams - soft, gentle colors
    {
        name: "Pastel Dreams",
        colors: [
            '#FFB6C1', '#FFC0CB', '#FFE4E1', '#F0E68C', '#98FB98', '#90EE90', '#87CEEB', '#E6E6FA'
        ]
    },
    // Earth Tones - natural, organic colors
    {
        name: "Earth Tones",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    // Ocean Depths - deep, marine colors
    {
        name: "Ocean Depths",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#E0FFFF'
        ]
    },
    // Mountain Mist - cool, natural colors
    {
        name: "Mountain Mist",
        colors: [
            '#2F4F4F', '#4A5D6B', '#5F7A7A', '#6B8E8E', '#87CEEB', '#B0C4DE', '#E6E6FA', '#F0F8FF'
        ]
    },
    // Sunset Glow - warm, radiant colors
    {
        name: "Sunset Glow",
        colors: [
            '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#DC143C', '#8B0000', '#2F2F2F'
        ]
    },
    
    // ===== INDIAN CULTURAL PALETTES (18) =====
    
    // Rajasthani - vibrant, royal colors
    {
        name: "Rajasthani",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },

    // Kerala - coastal, tropical colors
    {
        name: "Kerala",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    // Gujarat - colorful, festive colors
    {
        name: "Gujarat",
        colors: [
            '#FF4500', '#FF6347', '#FFD700', '#FFA500', '#DC143C', '#4B0082', '#32CD32', '#FFFFFF'
        ]
    },
    // Punjab - warm, harvest colors
    {
        name: "Punjab",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'
        ]
    },
    // Bengal - monsoon, lush colors
    {
        name: "Bengal",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#F5DEB3', '#DEB887', '#8B4513', '#4682B4', '#000080'
        ]
    },
    // Kashmir - cool, mountain colors
    {
        name: "Kashmir",
        colors: [
            '#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'
        ]
    },
    // Maharashtra - earthy, warm colors
    {
        name: "Maharashtra",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    // Tamil Nadu - traditional, cultural colors
    {
        name: "Tamil Nadu",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    // Karnataka - forest, nature colors
    {
        name: "Karnataka",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    // Andhra Pradesh - coastal, vibrant colors
    {
        name: "Andhra Pradesh",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    // Telangana - modern, urban colors
    {
        name: "Telangana",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
        ]
    },
    // Odisha - tribal, earthy colors
    {
        name: "Odisha",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    // Madhya Pradesh - central, balanced colors
    {
        name: "Madhya Pradesh",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    // Uttar Pradesh - northern, traditional colors
    {
        name: "Uttar Pradesh",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    // Bihar - eastern, cultural colors
    {
        name: "Bihar",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    // West Bengal - eastern, artistic colors
    {
        name: "West Bengal",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    // Assam - northeastern, natural colors
    {
        name: "Assam",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    // Himachal Pradesh - mountain, cool colors
    {
        name: "Himachal Pradesh",
        colors: [
            '#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'
        ]
    },
    
    // ===== TAMIL CULTURAL PALETTES (11) =====
    
    // Tamil Classical - traditional, ancient colors
    {
        name: "Tamil Classical",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    // Sangam Era - literary, cultural colors
    {
        name: "Sangam Era",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    // Chola Dynasty - royal, imperial colors
    {
        name: "Chola Dynasty",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    // Pandya Kingdom - southern, coastal colors
    {
        name: "Pandya Kingdom",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    // Chera Dynasty - western coast, spice trade colors
    {
        name: "Chera Dynasty",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#8B4513', '#A0522D', '#FFD700', '#00CED1', '#000080'
        ]
    },
    // Pallava Empire - architectural, stone colors
    {
        name: "Pallava Empire",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    // Vijayanagara - golden, prosperous colors
    {
        name: "Vijayanagara",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'
        ]
    },
    // Nayak Dynasty - artistic, temple colors
    {
        name: "Nayak Dynasty",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    // Maratha Rule - warrior, strong colors
    {
        name: "Maratha Rule",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    // British Colonial - mixed, hybrid colors
    {
        name: "British Colonial",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
        ]
    },
    // Modern Tamil - contemporary, urban colors
    {
        name: "Modern Tamil",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
        ]
    },
    // Jamakalam - traditional Tamil floor mat colors
    {
        name: "Jamakalam",
        colors: [
            '#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#4B0082', '#000000'
        ]
    },
    
    // ===== NATURAL DYE PALETTES (8) =====
    
    // Indigo Dye - deep blue, natural colors
    {
        name: "Indigo Dye",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#E0FFFF'
        ]
    },
    // Madder Root - red, earthy colors
    {
        name: "Madder Root",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF6347', '#CD5C5C', '#F08080', '#FA8072'
        ]
    },
    // Turmeric - golden, warm colors
    {
        name: "Turmeric",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#DAA520', '#B8860B', '#CD853F'
        ]
    },
    // Henna - reddish-brown, natural colors
    {
        name: "Henna",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    // Pomegranate - deep red, rich colors
    {
        name: "Pomegranate",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF6347', '#CD5C5C', '#F08080', '#FA8072'
        ]
    },
    // Neem - green, natural colors
    {
        name: "Neem",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    // Saffron - golden, precious colors
    {
        name: "Saffron",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#DAA520', '#B8860B', '#CD853F'
        ]
    },
    // Marigold - bright, cheerful colors
    {
        name: "Marigold",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#FF1493', '#FF69B4', '#FFB6C1'
        ]
    },
    
    // ===== MADRAS CHECKS & TAMIL NADU INSPIRED PALETTES (8) =====
    
    // Madras Checks - traditional plaid colors
    {
        name: "Madras Checks",
        colors: [
            '#8B0000', '#DC143C', '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    // Tamil Nadu Temple - sacred, vibrant colors
    {
        name: "Tamil Nadu Temple",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    // Kanchipuram Silk - luxurious, traditional colors
    {
        name: "Kanchipuram Silk",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    // Thanjavur Art - classical, artistic colors
    {
        name: "Thanjavur Art",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'
        ]
    },
    // Chettinad Architecture - heritage, warm colors
    {
        name: "Chettinad Architecture",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    // Madurai Meenakshi - divine, colorful palette
    {
        name: "Madurai Meenakshi",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    // Coimbatore Cotton - natural, earthy colors
    {
        name: "Coimbatore Cotton",
        colors: [
            '#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#8B7355', '#A0522D', '#654321', '#2F2F2F'
        ]
    },
    // Salem Silk - traditional, refined colors
    {
        name: "Salem Silk",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    
    // ===== WESTERN GHATS BIRDS PALETTES (6) =====
    
    // Indian Peacock - majestic, iridescent colors
    {
        name: "Indian Peacock",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#00CED1', '#40E0D0', '#48D1CC', '#20B2AA'
        ]
    },
    // Flamingo - tropical, pink-orange colors
    {
        name: "Flamingo",
        colors: [
            '#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB', '#FF6347', '#FF4500', '#FF8C00', '#FFA500'
        ]
    },
    // Toucan - vibrant, tropical colors
    {
        name: "Toucan",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#000000', '#FFFFFF', '#FF1493'
        ]
    },
    // Malabar Trogon - forest, jewel colors
    {
        name: "Malabar Trogon",
        colors: [
            '#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#000000', '#FFFFFF'
        ]
    },
    // Nilgiri Flycatcher - mountain, cool colors
    {
        name: "Nilgiri Flycatcher",
        colors: [
            '#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'
        ]
    },
    // Malabar Parakeet - forest, green colors
    {
        name: "Malabar Parakeet",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    
    // ===== HISTORICAL DYNASTY & CULTURAL PALETTES (6) =====
    
    // Pandya Dynasty - southern, maritime colors
    {
        name: "Pandya Dynasty",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    // Maratha Empire - warrior, strong colors
    {
        name: "Maratha Empire",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    // Maurya Empire - imperial, ancient colors
    {
        name: "Maurya Empire",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#FFD700', '#FFA500', '#8B4513', '#A0522D'
        ]
    },
    // Buddhist - peaceful, spiritual colors
    {
        name: "Buddhist",
        colors: [
            '#FFD700', '#FFA500', '#8B4513', '#A0522D', '#228B22', '#32CD32', '#90EE90', '#FFFFFF'
        ]
    },
    
    // ===== FAMINE & HISTORICAL PERIOD PALETTES (2) =====
    
    // Indigo Famine - colonial, oppressive colors
    {
        name: "Indigo Famine",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#2F4F4F', '#696969', '#808080', '#A9A9A9'
        ]
    },
    // Bengal Famine - tragic, somber colors
    {
        name: "Bengal Famine",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#000000'
        ]
    },
    
    // ===== MADRAS GENERATOR GLOBAL PALETTES (20) =====
    
    // Natural Dyes - authentic traditional colors
    {
        name: "Natural Dyes",
        colors: [
            '#405BAA', '#B33A3A', '#D9A43B', '#1F1E1D', '#5A7A5A', '#8C5832', '#A48E7F', '#FAF1E3'
        ]
    },
    // Expanded Traditional - extended Madras palette
    {
        name: "Expanded Traditional",
        colors: [
            '#405BAA', '#B33A3A', '#D9A43B', '#5A7A5A', '#8C5832', '#A48E7F', '#1F1E1D', '#FAF1E3'
        ]
    },
    // Bleeding Vintage - aged, worn Madras colors
    {
        name: "Bleeding Vintage",
        colors: [
            '#3A62B3', '#C13D3D', '#D9A43B', '#7DAC9B', '#D87BA1', '#7A4E8A', '#F2E4BE', '#1F1E1D'
        ]
    },
    // Warm Tamil Madras - warm South Indian tones
    {
        name: "Warm Tamil Madras",
        colors: [
            '#C13D3D', '#F5C03A', '#3E5F9A', '#88B0D3', '#ADC178', '#E77F37', '#FAF3EB', '#F2E4BE'
        ]
    },
    // Classic Red-Green - traditional Madras contrast
    {
        name: "Classic Red-Green",
        colors: [
            '#cc0033', '#ffee88', '#004477', '#ffffff', '#e63946', '#f1faee', '#a8dadc', '#457b9d'
        ]
    },
    // Vintage Tamil 04 - retro South Indian style
    {
        name: "Vintage Tamil",
        colors: [
            '#e63946', '#f1faee', '#a8dadc', '#457b9d', '#ffd700', '#b8860b', '#8b0000', '#f7c873'
        ]
    },
    // Sunset Pondicherry - French colonial colors
    {
        name: "Sunset Pondicherry",
        colors: [
            '#ffb347', '#ff6961', '#6a0572', '#fff8e7', '#1d3557', '#e63946', '#f7cac9', '#92a8d1'
        ]
    },
    // Chennai Monsoon - rainy season palette
    {
        name: "Chennai Monsoon",
        colors: [
            '#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#ffd700', '#e94f37', '#393e41', '#3f88c5'
        ]
    },
    // Kanchipuram Gold - luxurious silk colors
    {
        name: "Kanchipuram Gold",
        colors: [
            '#ffd700', '#b8860b', '#8b0000', '#fff8e7', '#cc0033', '#004477', '#e63946', '#f1faee'
        ]
    },
    // Madras Summer - hot season vibes
    {
        name: "Madras Summer",
        colors: [
            '#f7c873', '#e94f37', '#393e41', '#3f88c5', '#fff8e7', '#ffb347', '#ff6961', '#1d3557'
        ]
    },
    // Pondy Pastel - soft colonial colors
    {
        name: "Pondy Pastel",
        colors: [
            '#f7cac9', '#92a8d1', '#034f84', '#f7786b', '#fff8e7', '#393e41', '#ffb347', '#e94f37'
        ]
    },
    // Tamil Sunrise - morning light palette
    {
        name: "Tamil Sunrise",
        colors: [
            '#ffb347', '#ff6961', '#fff8e7', '#1d3557', '#e63946', '#f7c873', '#e94f37', '#393e41'
        ]
    },
    // Chettinad Spice - aromatic spice colors
    {
        name: "Chettinad Spice",
        colors: [
            '#d72631', '#a2d5c6', '#077b8a', '#5c3c92', '#f4f4f4', '#ffd700', '#8b0000', '#1a2634'
        ]
    },
    // Kerala Onam - festival celebration colors
    {
        name: "Kerala Onam",
        colors: [
            '#fff8e7', '#ffd700', '#e94f37', '#393e41', '#3f88c5', '#f7c873', '#ffb347', '#ff6961'
        ]
    },
    // Bengal Indigo - traditional dye colors
    {
        name: "Bengal Indigo",
        colors: [
            '#1a2634', '#3f88c5', '#f7c873', '#e94f37', '#fff8e7', '#ffd700', '#393e41', '#1d3557'
        ]
    },
    // Goa Beach - coastal vacation colors
    {
        name: "Goa Beach",
        colors: [
            '#f7cac9', '#f7786b', '#034f84', '#fff8e7', '#393e41', '#ffb347', '#e94f37', '#3f88c5'
        ]
    },
    // Sri Lankan Tea - island tea plantation colors
    {
        name: "Sri Lankan Tea",
        colors: [
            '#a8dadc', '#457b9d', '#e63946', '#f1faee', '#fff8e7', '#ffd700', '#8b0000', '#1d3557'
        ]
    },
    // African Madras - continental connection colors
    {
        name: "African Madras",
        colors: [
            '#ffb347', '#e94f37', '#393e41', '#3f88c5', '#ffd700', '#f7c873', '#ff6961', '#1d3557'
        ]
    },
    // Mumbai Monsoon - western coastal rains
    {
        name: "Mumbai Monsoon",
        colors: [
            '#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#ffd700', '#e94f37', '#393e41', '#3f88c5'
        ]
    },
    // Ivy League - academic prestige colors
    {
        name: "Ivy League",
        colors: [
            '#002147', '#a6192e', '#f4f4f4', '#ffd700', '#005a9c', '#00356b', '#ffffff', '#8c1515'
        ]
    }

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
  
  // --- P5.js-style Perlin noise implementation for overlays ---
  // Adapted from https://github.com/processing/p5.js/blob/main/src/math/noise.js
  function makePerlin(seed: number) {
    // Perlin noise permutation table
    let p = new Uint8Array(512)
    let permutation = new Uint8Array(256)
    // Deterministic shuffle
    let rand = new AniSeededRandom(seed)
    for (let i = 0; i < 256; i++) permutation[i] = i
    for (let i = 255; i > 0; i--) {
      let j = Math.floor(rand.next() * (i + 1))
      let temp = permutation[i]; permutation[i] = permutation[j]; permutation[j] = temp
    }
    for (let i = 0; i < 512; i++) p[i] = permutation[i & 255]
    function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10) }
    function lerp(a: number, b: number, t: number) { return a + t * (b - a) }
    function grad(hash: number, x: number, y: number) {
      // 2D gradients
      const h = hash & 3
      const u = h < 2 ? x : y
      const v = h < 2 ? y : x
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
    }
    // 2D Perlin noise
    return function perlin2(x: number, y: number) {
      let X = Math.floor(x) & 255
      let Y = Math.floor(y) & 255
      x -= Math.floor(x)
      y -= Math.floor(y)
      let u = fade(x)
      let v = fade(y)
      let aa = p[p[X] + Y]
      let ab = p[p[X] + Y + 1]
      let ba = p[p[X + 1] + Y]
      let bb = p[p[X + 1] + Y + 1]
      return lerp(
        lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
        lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
        v
      ) * 0.5 + 0.5
    }
  }

  // P5.js-style lerpColor for text
  function lerpColorHex(hexA: string, hexB: string, amt: number) {
    // Accepts hex strings, amt in [0,1]
    function hexToRgbObj(hex: string) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return m
        ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
        : { r: 0, g: 0, b: 0 }
    }
    const a = hexToRgbObj(hexA)
    const b = hexToRgbObj(hexB)
    const r = Math.round(a.r + (b.r - a.r) * amt)
    const g = Math.round(a.g + (b.g - a.g) * amt)
    const b_ = Math.round(a.b + (b.b - a.b) * amt)
    return `rgb(${r},${g},${b_})`
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

    // Use deterministic word selection
    const aniSelectedWord = isFirstRug
      ? 'WELCOME'
      : rugWords[aniRandom.nextInt(0, rugWords.length)]
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

    // --- P5.js-accurate texture overlays using Perlin noise and multiply blend ---
    // Simple on/off switch: no texture for 1 minute, then full texture appears
    const textureDelay = 120000 // 60 seconds (1 minute) delay
    const textureOpacity = currentTime >= textureDelay ? 1 : 0
    
    if (textureOpacity > 0) {
      // Perlin noise seeded by rug seed
      const perlin = makePerlin(seed)
      // Save state
      ctx.save()
      // Texture overlay with multiply blend, CLIPPED to doormat area only
      ctx.save()
      ctx.beginPath()
      ctx.rect(offsetX, offsetY, 800, doormatHeight)
      ctx.clip()
      ctx.globalCompositeOperation = 'multiply'
      for (let x = offsetX; x < offsetX + 800; x += 2) {
        for (let y = offsetY; y < offsetY + doormatHeight; y += 2) {
          // P5.js: noise(x*0.02, y*0.02), map to [0,50] alpha
          const noiseVal = perlin(x * 0.02, y * 0.02)
          const baseAlpha = Math.round(noiseVal * 50)
          // Apply animated opacity to the base alpha
          const animatedAlpha = (baseAlpha * textureOpacity) / 255
          // Use black with animated alpha (as in P5.js)
          ctx.fillStyle = `rgba(0,0,0,${animatedAlpha})`
          ctx.fillRect(x, y, 2, 2)
        }
      }
      // Relief overlay (P5.js logic), CLIPPED to doormat area only
      for (let x = offsetX; x < offsetX + 800; x += 6) {
        for (let y = offsetY; y < offsetY + doormatHeight; y += 6) {
          const reliefNoise = perlin(x * 0.03, y * 0.03)
          if (reliefNoise > 0.6) {
            // Apply animated opacity to relief highlights
            ctx.fillStyle = `rgba(255,255,255,${0.098 * textureOpacity})` // 25/255 ≈ 0.098
            ctx.fillRect(x, y, 6, 6)
          } else if (reliefNoise < 0.4) {
            // Apply animated opacity to relief shadows
            ctx.fillStyle = `rgba(0,0,0,${0.078 * textureOpacity})` // 20/255 ≈ 0.078
            ctx.fillRect(x, y, 6, 6)
          }
        }
      }
      // Restore blend mode and clipping
      ctx.globalCompositeOperation = 'source-over'
      ctx.restore()
      }
      
      // Fringe and selvages already drawn above before doormat texture
    
    // Subtle extra fabric noise (optional, can keep or remove)
    for (let x = 0; x < canvas.width; x += 8) {
      for (let y = 0; y < canvas.height; y += 8) {
        const noise = Math.random() * 0.1 - 0.05
        if (Math.abs(noise) > 0.02) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(noise) * 0.3})`
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }

    // --- 180-degree rotation before creating the THREE.CanvasTexture ---
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(Math.PI)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)
    ctx.drawImage(canvas, 0, 0)
    ctx.restore()

    canvasRef.current = canvas
    if (textureRef.current) {
      textureRef.current.dispose()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    textureRef.current = texture
    return texture
  }

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose()
      }
    }
  }, [])



  // Advanced cloth physics animation (keeping your existing animation)
  useFrame((state) => {
    if (rugRef.current && groupRef.current) {
      const time = state.clock.getElapsedTime()
      const geometry = rugRef.current.geometry as THREE.PlaneGeometry
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

  // Don't render until dependencies are loaded
  const rugTexture = createRugTexture(0) // Start with no texture overlay
  if (!dependenciesLoaded || !rugTexture) {
    return null
  }
  
  // Store texture reference for updates
  if (!textureRef.current) {
    textureRef.current = rugTexture
  }

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      <Float speed={0.3} rotationIntensity={0.08} floatIntensity={0.15}>
        <mesh ref={rugRef} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <planeGeometry args={[5, 7, 48, 48]} />
          <meshStandardMaterial 
            map={textureRef.current} 
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
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
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Magical shimmer effect - TRANSPARENT */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[4.1, 6.1]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.03}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Float>
    </group>
  )
}

// Floating particles
function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < 100; i++) {
      temp.push([
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 50
      ])
    }
    return temp
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
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
      <pointsMaterial size={0.1} color="#f59e0b" transparent opacity={0.6} />
    </points>
  )
}

// Enhanced Magical Scene
function Scene({ onLoaded }: { onLoaded?: () => void }) {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false)

  useEffect(() => {
    // Reset global state when component mounts
    resetGlobalState()
    
    // Always set as loaded and trigger callback
          setDependenciesLoaded(true)
    if (onLoaded) {
      setTimeout(onLoaded, 100) // Small delay to ensure everything is rendered
    }
  }, [onLoaded])
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    // Animate lighting for magical effect
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(time * 0.5) * 0.2
      lightRef.current.position.x = Math.sin(time * 0.3) * 5
      lightRef.current.position.z = Math.cos(time * 0.3) * 5
    }
  })

  return (
    <>
      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={0.6} color="#ffeaa7" />
      <directionalLight 
        ref={lightRef}
        position={[10, 10, 5]} 
        intensity={1.2} 
        color="#ffb347"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -5]} color="#f59e0b" intensity={0.8} />
      <pointLight position={[15, 5, 10]} color="#ff6b35" intensity={0.4} />
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.3} 
        penumbra={1} 
        intensity={0.5}
        color="#ffd700"
        castShadow
      />
      
      {/* Environment - TRANSPARENT */}
      <Environment preset="sunset" background={false} />
      
      {/* Flying Rugs with Your Generator Logic - Each with unique seeds */}
      <FlyingRug position={[0, 0, 0]} scale={1.2} seed={42} dependenciesLoaded={dependenciesLoaded} isFirstRug={true} />
      <FlyingRug position={[-8, 2, -5]} scale={0.8} seed={1337} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} />
      <FlyingRug position={[8, -1, -3]} scale={0.9} seed={777} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} />
      <FlyingRug position={[5, 3, -8]} scale={0.7} seed={999} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} />
      <FlyingRug position={[-6, -2, -10]} scale={0.6} seed={555} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} />
      <FlyingRug position={[-3, 5, -12]} scale={0.5} seed={888} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} />
      <FlyingRug position={[10, -3, -15]} scale={0.4} seed={111} dependenciesLoaded={dependenciesLoaded} isFirstRug={false} />
      
      {/* Enhanced Floating Particles */}
      <FloatingParticles />
      
      {/* Magical Dust Effect */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={200}
              array={new Float32Array(Array.from({ length: 600 }, () => (Math.random() - 0.5) * 100))}
              itemSize={3}
              args={[new Float32Array(Array.from({ length: 600 }, () => (Math.random() - 0.5) * 100)), 3]}
            />
          </bufferGeometry>
          <pointsMaterial size={0.05} color="#ffd700" transparent opacity={0.8} />
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
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60 }}
        style={{ 
          background: 'transparent',
          transform: isVisible ? 'scale(1)' : 'scale(0.3)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 1.5s ease-out, opacity 1.2s ease-out',
          transformOrigin: 'center center'
        }}
      >
        <Suspense fallback={null}>
          <Scene onLoaded={() => setIsVisible(true)} />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Fallback generator helpers with ani prefix to avoid clashing with main generator
function drawAniStripe(ctx: CanvasRenderingContext2D, stripe: any, doormatWidth: number, doormatHeight: number, random: () => number, offsetX: number, offsetY: number) {
  // Direct copy of drawStripeWithWeaving, but with ani prefix
  const animWarpThickness = 2
  const animWeftThickness = 8

  let animWarpSpacing = animWarpThickness + 1
  let animWeftSpacing = animWeftThickness + 1

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
  for (let stripe of stripeData) {
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
  for (let stripe of stripeData) {
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
    let detailR = Math.max(0, Math.min(255, r + (i % 2 === 0 ? 15 : -15)))
    let detailG = Math.max(0, Math.min(255, g + (i % 2 === 0 ? 15 : -15)))
    let detailB = Math.max(0, Math.min(255, b + (i % 2 === 0 ? 15 : -15)))
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