'use client'

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
    { name: 'Earth Tones', colors: ['#8B4513', '#D2691E', '#CD853F'] },
    { name: 'Slate Gray', colors: ['#2F4F4F', '#708090', '#A9A9A9'] },
    { name: 'Crimson', colors: ['#8B0000', '#DC143C', '#FF6347'] },
    { name: 'Forest Green', colors: ['#006400', '#32CD32', '#90EE90'] },
    { name: 'Purple', colors: ['#4B0082', '#8A2BE2', '#DA70D6'] },
    { name: 'Gold', colors: ['#FFD700', '#FFA500', '#FF8C00'] },
    { name: 'Buddhist', colors: ['#8B4513', '#D2691E', '#CD853F'] },
    { name: 'Indian Peacock', colors: ['#0066CC', '#FF6B6B', '#4ECDC4'] },
    { name: 'Tamil Classical', colors: ['#FF8C00', '#FFD700', '#FF6347'] },
    { name: 'Tamil Nadu Temple', colors: ['#8B0000', '#32CD32', '#FF1493'] }
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

    // Set up doormatTextRows for your proper text algorithm
    const textRows = [text.toUpperCase()]

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

  // Create rug texture using your P5.js generator logic
  const createRugTexture = () => {
    if (typeof window === 'undefined' || !dependenciesLoaded) {
      return null
    }

    // Create canvas with your generator dimensions
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!

    // Set canvas size to match your generator
    const doormatHeight = 1200
    const fringeLength = 30

    // Use the same canvas dimensions as your generator (NO swapping needed)
    canvas.width = 800 + (fringeLength * 4)
    canvas.height = doormatHeight + (fringeLength * 4)

    // CRITICAL: Clear the entire canvas completely before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // NO BACKGROUND FILL - Keep canvas transparent for animation

    // Only use local ani* generator logic (no window.* or P5.js globals)
    // Use deterministic seeded random generator for rug features
    const aniRandom = new AniSeededRandom(seed);

    // Get palette and generate colors
    const aniColorPalettes = localColorPalettes || [
      { name: 'Default', colors: ['#8B4513', '#D2691E', '#A0522D', '#CD853F', '#DEB887'] }
    ]
    const aniSelectedPalette = aniColorPalettes[seed % aniColorPalettes.length]

    // Generate stripe data EXACTLY like your generator, using seeded random
    const aniStripeData = generateAniStripeData(aniSelectedPalette, doormatHeight, () => aniRandom.next())

    // Calculate center offset to position rug content in the middle of canvas
    const offsetX = fringeLength * 2
    const offsetY = fringeLength * 2

    // NO BASE BACKGROUND - Keep transparent for animation

    // Draw selvedge edge rectangles and woven effect (before stripes)
    drawAniSelvedgeEdges(ctx, aniStripeData, 800, doormatHeight, () => aniRandom.next(), offsetX, offsetY);
    // Draw stripes with proper weaving structure (centered)
    aniStripeData.forEach(stripe => {
      drawAniStripe(ctx, stripe, 800, doormatHeight, () => aniRandom.next(), offsetX, offsetY)
    })

    // Use local text generation logic
    // Use deterministic seeded random for word selection as well (for full determinism)
    const aniSelectedWord = isFirstRug
      ? 'WELCOME'
      : rugWords[aniRandom.nextInt(0, rugWords.length)]
    // Set up text data using local character map and generator
    const aniTextData = generateTextDataForRug(aniSelectedWord, 800, doormatHeight, fringeLength)

    // Draw the text pixels using your generator's EXACT positioning (no manual rotation)
    if (aniTextData.length > 0) {
      aniTextData.forEach((pixel: any) => {
        const finalX = pixel.x + offsetX
        const finalY = pixel.y + offsetY
        // Use local text colors instead of window globals
        const lightTextColor = '#FFFFFF';
        const darkTextColor = '#000000';
        let textColor = '#FFFFFF'
        if (lightTextColor && darkTextColor) {
          const imageData = ctx.getImageData(finalX, finalY, 1, 1)
          const r = imageData.data[0]
          const g = imageData.data[1]
          const b = imageData.data[2]
          const bgBrightness = (r + g + b) / 3
          textColor = bgBrightness < 128 ? lightTextColor : darkTextColor
        } else {
          // fallback to palette
          const imageData = ctx.getImageData(finalX, finalY, 1, 1)
          const r = imageData.data[0]
          const g = imageData.data[1]
          const b = imageData.data[2]
          const bgBrightness = (r + g + b) / 3
          textColor = getDynamicTextColor(bgBrightness, aniSelectedPalette)
        }
        ctx.fillStyle = textColor
        ctx.fillRect(finalX, finalY, pixel.width, pixel.height)
      })
    }

    // Draw proper fringe and selvedge as part of the art (EXACTLY like your generator)
    drawAniFringe(ctx, aniStripeData, 800, doormatHeight, fringeLength, () => aniRandom.next(), offsetX, offsetY)

    // Add subtle fabric texture noise (much more subtle to avoid black bands)
    for (let x = 0; x < canvas.width; x += 8) {
      for (let y = 0; y < canvas.height; y += 8) {
        const noise = Math.random() * 0.1 - 0.05  // Reduced intensity
        if (Math.abs(noise) > 0.02) {  // Only add noise if it's significant
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(noise) * 0.3})`
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }

    // Store canvas reference for potential updates
    canvasRef.current = canvas

    // Rug texture generated successfully

    // Dispose of old texture to prevent memory leaks and artifacts
    if (textureRef.current) {
      textureRef.current.dispose()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping

    // Store reference to new texture
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
    }
  })

  // Don't render until dependencies are loaded
  const rugTexture = createRugTexture()
  if (!dependenciesLoaded || !rugTexture) {
    return null
  }

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      <Float speed={0.3} rotationIntensity={0.08} floatIntensity={0.15}>
        <mesh ref={rugRef} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <planeGeometry args={[5, 7, 48, 48]} />
          <meshStandardMaterial
            map={rugTexture}
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

// Global loading state to prevent multiple script loads
let globalDependenciesLoading = false
let globalDependenciesLoaded = false

// Enhanced Magical Scene
function Scene() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false)

  // Global loading state to prevent multiple renders
  let globalDependenciesLoaded = false
  useEffect(() => {
    if (globalDependenciesLoaded) {
      setDependenciesLoaded(true)
      return
    }
    // Directly mark as loaded
    globalDependenciesLoaded = true
    setDependenciesLoaded(true)
  }, [])

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
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
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