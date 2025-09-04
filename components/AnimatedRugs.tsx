'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, Text3D, Environment } from '@react-three/drei'
import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Import P5.js functions from your generator
declare global {
  interface Window {
    DOORMAT_CONFIG: any
    stripeData: any[]
    characterMap: any
    colorPalettes: any[]
    selectedPalette: any
    warpThickness: number
    generateDoormatCore: (seed: number) => void
    drawTexturedSelvedgeArc: (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, r: number, g: number, b: number, side: string) => void
    doormatTextRows: string[]
    generateTextDataInSketch?: () => void
    textData?: Array<{x: number, y: number, width: number, height: number}>
    lightTextColor?: any
    darkTextColor?: any
    // P5.js functions that need to be mocked
    randomSeed: (seed: number) => () => number
    noise: (x: number) => number
    noiseSeed: (seed: number) => void
    random: (min?: number | any[], max?: number) => any
    color: (r: number | string, g?: number, b?: number, a?: number) => any
    red: (c: any) => number
    green: (c: any) => number
    blue: (c: any) => number
    lerpColor: (c1: any, c2: any, amt: number) => any
    constrain: (n: number, low: number, high: number) => number
    max: (...args: number[]) => number
    min: (...args: number[]) => number
    floor: (x: number) => number
    cos: (x: number) => number
    sin: (x: number) => number
    fill: (r: number, g?: number, b?: number, a?: number) => void
    noStroke: () => void
    noFill: () => void
    background: (r: number, g?: number, b?: number, a?: number) => void
    arc: (x: number, y: number, w: number, h: number, start: number, stop: number) => void
    ellipse: (x: number, y: number, w: number, h: number) => void
    beginShape: () => void
    vertex: (x: number, y: number) => void
    endShape: () => void
    strokeWeight: (weight: number) => void
    noLoop: () => void
    createCanvas: (w: number, h: number) => any
    redraw: () => void
    PI: number
  }
}

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
  const getDynamicTextColor = (bgBrightness: number, selectedPalette: any) => {
  if (selectedPalette && selectedPalette.colors) {
    // Find darkest and lightest colors from palette (matching your generator's updateTextColors logic)
    let darkest = selectedPalette.colors[0]
    let lightest = selectedPalette.colors[0]
    let darkestVal = 999, lightestVal = -1
    
    selectedPalette.colors.forEach((hex: string) => {
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
  const generateStripeDataForRug = (selectedPalette: any, doormatHeight: number, random: () => number) => {
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
      let primaryColor = selectedPalette.colors[Math.floor(random() * selectedPalette.colors.length)]
      let hasSecondaryColor = random() < 0.15 // 15% chance of blended colors
      let secondaryColor = hasSecondaryColor ? selectedPalette.colors[Math.floor(random() * selectedPalette.colors.length)] : null
      
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
    const warpThickness = window.warpThickness || 2
    const weftThickness = window.DOORMAT_CONFIG?.WEFT_THICKNESS || 8
    
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
        const threadX = strandX + random() * strandWidth/3 - strandWidth/6
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
    const weftThickness = window.DOORMAT_CONFIG?.WEFT_THICKNESS || 8
    const weftSpacing = weftThickness + 1
    
    // Left selvedge edge - flowing semicircular weft threads (EXACT COPY)
    let isFirstWeft = true
    for (let stripe of stripeData) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        // Skip the very first and very last weft threads (EXACT COPY)
        if (isFirstWeft) {
          isFirstWeft = false
          continue
        }
        
        // Check if this is the last weft thread (EXACT COPY)
        if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
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
        const radius = weftThickness * (random() * 0.6 + 1.2)
        // FIXED: Move 2 pixels closer to rug edges to eliminate gaps
        const centerX = offsetX + radius * 0.6 + (random() * 2 - 1) // 2 pixels closer to edge
        const centerY = offsetY + y + weftThickness/2 + (random() * 2 - 1) // Slight vertical variation like your generator
        
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
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        // Skip the very first and very last weft threads (EXACT COPY)
        if (isFirstWeftRight) {
          isFirstWeftRight = false
          continue
        }
        
        // Check if this is the last weft thread (EXACT COPY)
        if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
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
        const radius = weftThickness * (random() * 0.6 + 1.2)
        // FIXED: Move 2 pixels closer to rug edges to eliminate gaps
        const centerX = offsetX + doormatWidth - radius * 0.6 + (random() * 2 - 1) // 2 pixels closer to edge
        const centerY = offsetY + y + weftThickness/2 + (random() * 2 - 1) // Slight vertical variation like your generator
        
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
    const warpThickness = window.warpThickness || 2
    const weftThickness = window.DOORMAT_CONFIG?.WEFT_THICKNESS || 8
    
    let warpSpacing = warpThickness + 1
    let weftSpacing = weftThickness + 1
    
    // Draw warp threads (vertical) as the foundation (EXACTLY like your generator)
    for (let x = 0; x < doormatWidth; x += warpSpacing) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        // Parse hex color directly
        let r = parseInt(stripe.primaryColor.slice(1, 3), 16) + (random() * 30 - 15)
        let g = parseInt(stripe.primaryColor.slice(3, 5), 16) + (random() * 30 - 15)
        let b = parseInt(stripe.primaryColor.slice(5, 7), 16) + (random() * 30 - 15)
        
        r = Math.max(0, Math.min(255, r))
        g = Math.max(0, Math.min(255, g))
        b = Math.max(0, Math.min(255, b))
        
        ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
        ctx.fillRect(x + offsetX, y + offsetY, warpThickness, weftSpacing)
      }
    }
    
    // Draw weft threads (horizontal) that interlace with warp (EXACTLY like your generator)
    for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
      for (let x = 0; x < doormatWidth; x += warpSpacing) {
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
        ctx.fillRect(x + offsetX, y + offsetY, warpSpacing, weftThickness)
      }
    }
  }
  
  // Use your AMAZING text algorithm from the generator instead of low-effort stuff
  const generateTextDataForRug = (text: string, doormatWidth: number, doormatHeight: number, fringeLength: number) => {
    if (!window.characterMap) return []
    
    // Set up doormatTextRows for your proper text algorithm
    const textRows = [text.toUpperCase()]
    window.doormatTextRows = textRows
    
    // Use your actual thread spacing from the generator
    const warpThickness = window.warpThickness || 2
    const weftThickness = window.DOORMAT_CONFIG?.WEFT_THICKNESS || 8
    const TEXT_SCALE = window.DOORMAT_CONFIG?.TEXT_SCALE || 2
    
    // Use your exact spacing calculations
    const warpSpacing = warpThickness + 1
    const weftSpacing = weftThickness + 1
    const scaledWarp = warpSpacing * TEXT_SCALE
    const scaledWeft = weftSpacing * TEXT_SCALE
    
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
    
    const textData: Array<{x: number, y: number, width: number, height: number}> = []
    
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
        textData.push(...charPixels)
      }
    }
    
    
    return textData
  }
  
  // Your exact character pixel generation function
  const generateCharacterPixels = (char: string, x: number, y: number, width: number, height: number) => {
    const pixels: Array<{x: number, y: number, width: number, height: number}> = []
    
    // Use your actual thread spacing
    const warpThickness = window.warpThickness || 2
    const weftThickness = window.DOORMAT_CONFIG?.WEFT_THICKNESS || 8
    const TEXT_SCALE = window.DOORMAT_CONFIG?.TEXT_SCALE || 2
    const warpSpacing = warpThickness + 1
    const weftSpacing = weftThickness + 1
    const scaledWarp = warpSpacing * TEXT_SCALE
    const scaledWeft = weftSpacing * TEXT_SCALE

    // Character definitions from your character map
    const charDef = window.characterMap[char] || window.characterMap[' ']
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
  const rugTexture = useMemo(() => {
    if (typeof window === 'undefined' || !dependenciesLoaded) {
      return null
    }
    
    // Create canvas with your generator dimensions
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    
    // Set canvas size to match your generator
    const doormatWidth = window.DOORMAT_CONFIG?.DOORMAT_WIDTH || 800
    const doormatHeight = window.DOORMAT_CONFIG?.DOORMAT_HEIGHT || 1200
    const fringeLength = window.DOORMAT_CONFIG?.FRINGE_LENGTH || 30
    
    // Use the same canvas dimensions as your generator (NO swapping needed)
    canvas.width = doormatWidth + (fringeLength * 4)
    canvas.height = doormatHeight + (fringeLength * 4)
    
    // CRITICAL: Clear the entire canvas completely before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // NO BACKGROUND FILL - Keep canvas transparent for animation
    
                // CRITICAL: Use the ACTUAL P5.js generateDoormatCore function instead of manual recreation!
      if (window.generateDoormatCore && typeof window.generateDoormatCore === 'function') {
        // Set the text for this rug - First rug always gets WELCOME, others randomly from array
        const selectedWord = isFirstRug ? 'WELCOME' : rugWords[Math.floor(Math.random() * rugWords.length)]
        
        // FIXED: Use proper multi-line text processing like your generator
        const textRows = selectedWord.split(' ').map(word => word.toUpperCase())
        window.doormatTextRows = textRows
        
        // FIXED: Call the proper text generation pipeline
        if (window.generateTextDataInSketch && typeof window.generateTextDataInSketch === 'function') {
          try {
            window.generateTextDataInSketch()
          } catch (error) {
            console.error('❌ Error in text generation pipeline:', error)
          }
        }
        
        // Call the actual P5.js function to generate the rug
        try {
          window.generateDoormatCore(seed)
        } catch (error) {
          console.error('❌ Error calling generateDoormatCore:', error)
        }
        
        // Get the palette that P5.js selected
        const selectedPalette = window.selectedPalette || window.colorPalettes?.[seed % window.colorPalettes.length] || { name: 'Default', colors: ['#8B4513', '#D2691E', '#A0522D'] }
        
        // Use P5.js generated stripe data if available
        const stripeData = window.stripeData || generateStripeDataForRug(selectedPalette, doormatHeight, () => Math.random())
      
      // Calculate center offset to position rug content in the middle of canvas
      const offsetX = fringeLength * 2
      const offsetY = fringeLength * 2
      
      // NO BASE BACKGROUND - Keep transparent for animation
      
      // CRITICAL: Handle P5.js stripe data structure vs manual structure
      // Check if P5.js data is valid and properly populated
      const hasValidP5Data = stripeData.length > 0 && 
        stripeData[0].primaryColor && 
        stripeData[0].primaryColor !== null &&
        (typeof stripeData[0].primaryColor === 'string' || 
         (typeof stripeData[0].primaryColor === 'object' && stripeData[0].primaryColor.r !== undefined))
      
      // DRAW SELVEDGES FIRST (BELOW THE RUG) to prevent edge glitches
      if (hasValidP5Data) {
        // Convert stripe data to compatible format for selvedge drawing
        const compatibleStripeData = stripeData.map(stripe => {
          if (stripe.primaryColor && typeof stripe.primaryColor === 'object' && stripe.primaryColor.r !== undefined) {
            // P5.js generated data - convert color object to hex
            const colorObj = stripe.primaryColor
            const hexColor = `#${Math.round(colorObj.r).toString(16).padStart(2, '0')}${Math.round(colorObj.g).toString(16).padStart(2, '0')}${Math.round(colorObj.b).toString(16).padStart(2, '0')}`
            
            return {
              ...stripe,
              primaryColor: hexColor,
              secondaryColor: stripe.secondaryColor ? 
                `#${Math.round(stripe.secondaryColor.r).toString(16).padStart(2, '0')}${Math.round(stripe.secondaryColor.g).toString(16).padStart(2, '0')}${Math.round(stripe.secondaryColor.b).toString(16).padStart(2, '0')}` : null
            }
          } else {
            // Manual data - use as is
            return stripe
          }
        })
        
        drawFringeAndSelvedge(ctx, compatibleStripeData, doormatWidth, doormatHeight, fringeLength, () => Math.random(), offsetX, offsetY)
      } else {
        // Use manual stripe data for selvedge drawing
        const manualStripeData = generateStripeDataForRug(selectedPalette, doormatHeight, () => Math.random())
        drawFringeAndSelvedge(ctx, manualStripeData, doormatWidth, doormatHeight, fringeLength, () => Math.random(), offsetX, offsetY)
      }
      
      // NOW DRAW MAIN RUG CONTENT (stripes) ABOVE the selvedges
      if (hasValidP5Data) {
        stripeData.forEach(stripe => {
          // Check if this is P5.js generated data or manual data
          if (stripe.primaryColor && typeof stripe.primaryColor === 'object' && stripe.primaryColor.r !== undefined) {
            // P5.js generated data - convert color object to hex
            const colorObj = stripe.primaryColor
            const hexColor = `#${Math.round(colorObj.r).toString(16).padStart(2, '0')}${Math.round(colorObj.g).toString(16).padStart(2, '0')}${Math.round(colorObj.b).toString(16).padStart(2, '0')}`
            
            // Create a compatible stripe object
            const compatibleStripe = {
              ...stripe,
              primaryColor: hexColor,
              secondaryColor: stripe.secondaryColor ? 
                `#${Math.round(stripe.secondaryColor.r).toString(16).padStart(2, '0')}${Math.round(stripe.secondaryColor.g).toString(16).padStart(2, '0')}${Math.round(stripe.secondaryColor.b).toString(16).padStart(2, '0')}` : null
            }
            
            drawStripeWithWeaving(ctx, compatibleStripe, doormatWidth, doormatHeight, () => Math.random(), offsetX, offsetY)
          } else {
            // Manual data - use as is
            drawStripeWithWeaving(ctx, stripe, doormatWidth, doormatHeight, () => Math.random(), offsetX, offsetY)
          }
        })
      } else {
        // Fallback to manual stripe generation
        const manualStripeData = generateStripeDataForRug(selectedPalette, doormatHeight, () => Math.random())
        manualStripeData.forEach(stripe => {
          drawStripeWithWeaving(ctx, stripe, doormatWidth, doormatHeight, () => Math.random(), offsetX, offsetY)
        })
      }
      
      // FIXED: Use your generator's text data EXACTLY as positioned (no manual rotation)
      
      // Get the text data that your generator created
      const textData = window.textData || []
      
      // Draw the text pixels using your generator's EXACT positioning (no coordinate modifications)
      if (textData.length > 0) {
        textData.forEach(pixel => {
          // FIXED: Use your generator's coordinates directly - it already handles rotation correctly
          // Your generator's generateCharacterPixels() already calculates the correct rotated positions
          // We just need to add the fringe offsets for canvas centering
          
          const finalX = pixel.x + offsetX  // Add fringe offset for canvas centering
          const finalY = pixel.y + offsetY  // Add fringe offset for canvas centering
          
          // HYBRID APPROACH: Try P5.js colors first, then fallback to direct palette logic
          let textColor = '#FFFFFF' // Default fallback
          
          if (window.lightTextColor && window.darkTextColor) {
            // Calculate actual background brightness at this pixel position
            const imageData = ctx.getImageData(finalX, finalY, 1, 1)
            const r = imageData.data[0]
            const g = imageData.data[1] 
            const b = imageData.data[2]
            const bgBrightness = (r + g + b) / 3
            
            // Try P5.js color objects first
            if (typeof window.lightTextColor === 'object' && window.lightTextColor.toString) {
              const lightHex = window.lightTextColor.toString()
              const darkHex = window.darkTextColor.toString()
              textColor = bgBrightness < 128 ? lightHex : darkHex
            } else {
              // P5.js colors not working, use direct palette logic
              textColor = getDynamicTextColor(bgBrightness, selectedPalette)
            }
          } else {
            // P5.js colors not available, use direct palette logic
            const imageData = ctx.getImageData(finalX, finalY, 1, 1)
            const r = imageData.data[0]
            const g = imageData.data[1] 
            const b = imageData.data[2]
            const bgBrightness = (r + g + b) / 3
            textColor = getDynamicTextColor(bgBrightness, selectedPalette)
          }
          
          // Draw with your generator's exact positioning and colors
          ctx.fillStyle = textColor
          ctx.fillRect(finalX, finalY, pixel.width, pixel.height) // Use original dimensions
        })
        // Text pixels drawn successfully
      } else {
        // No text data from generator
      }
      
    } else {
      // P5.js generateDoormatCore not available, using manual fallback
      
      // Fallback to manual generation (keeping existing code)
      const randomSeed = (seed: number) => {
        let m = 0x80000000
        let a = 1103515245
        let c = 12345
        let state = seed ? seed : Math.floor(Math.random() * (m - 1))
        return () => {
          state = (a * state + c) % m
          return state / m
        }
      }
      
      const random = randomSeed(seed)
      
      // Get palette and generate colors
      const colorPalettes = window.colorPalettes || [
        { name: 'Default', colors: ['#8B4513', '#D2691E', '#A0522D', '#CD853F', '#DEB887'] }
      ]
      const selectedPalette = colorPalettes[seed % colorPalettes.length]
      
      // Generate stripe data EXACTLY like your generator
      const stripeData = generateStripeDataForRug(selectedPalette, doormatHeight, random)
      
      // Calculate center offset to position rug content in the middle of canvas
      const offsetX = fringeLength * 2
      const offsetY = fringeLength * 2
      
      // NO BASE BACKGROUND - Keep transparent for animation
      
      // Draw stripes with proper weaving structure (centered)
      stripeData.forEach(stripe => {
        drawStripeWithWeaving(ctx, stripe, doormatWidth, doormatHeight, random, offsetX, offsetY)
      })
      
      // FIXED: Use your generator's text data for manual fallback too
      const selectedWord = isFirstRug ? 'WELCOME' : rugWords[Math.floor(Math.random() * rugWords.length)]
      
      // Set up text rows and call your generator's text pipeline
      const textRows = selectedWord.split(' ').map(word => word.toUpperCase())
      window.doormatTextRows = textRows
      
      if (window.generateTextDataInSketch && typeof window.generateTextDataInSketch === 'function') {
        window.generateTextDataInSketch()
      }
      
      // Get the text data that your generator created
      const textData = window.textData || []
      
      // Draw the text pixels using your generator's EXACT positioning (no manual rotation)
      if (textData.length > 0) {
        let drawnPixels = 0
        textData.forEach((pixel: any) => {
          // FIXED: Use your generator's coordinates directly - it already handles rotation correctly
          // Your generator's generateCharacterPixels() already calculates the correct rotated positions
          // We just need to add the fringe offsets for canvas centering
          
          const finalX = pixel.x + offsetX  // Add fringe offset for canvas centering
          const finalY = pixel.y + offsetY  // Add fringe offset for canvas centering
          
          // HYBRID APPROACH: Try P5.js colors first, then fallback to direct palette logic
          let textColor = '#FFFFFF' // Default fallback
          
          if (window.lightTextColor && window.darkTextColor) {
            // Calculate actual background brightness at this pixel position
            const imageData = ctx.getImageData(finalX, finalY, 1, 1)
            const r = imageData.data[0]
            const g = imageData.data[1] 
            const b = imageData.data[2]
            const bgBrightness = (r + g + b) / 3
            
            // Try P5.js color objects first
            if (typeof window.lightTextColor === 'object' && window.lightTextColor.toString) {
              const lightHex = window.lightTextColor.toString()
              const darkHex = window.darkTextColor.toString()
              textColor = bgBrightness < 128 ? lightHex : darkHex
            } else {
              // P5.js colors not working, use direct palette logic
              textColor = getDynamicTextColor(bgBrightness, selectedPalette)
            }
          } else {
            // P5.js colors not available, use direct palette logic
            const imageData = ctx.getImageData(finalX, finalY, 1, 1)
            const r = imageData.data[0]
            const g = imageData.data[1] 
            const b = imageData.data[2]
            const bgBrightness = (r + g + b) / 3
            textColor = getDynamicTextColor(bgBrightness, selectedPalette)
          }
          
          // Draw with your generator's exact positioning and colors
          ctx.fillStyle = textColor
          ctx.fillRect(finalX, finalY, pixel.width, pixel.height) // Use original dimensions
          drawnPixels++
        })
        // Text pixels drawn successfully
      } else {
        // No text data from generator
      }
      
      // Draw proper fringe and selvedge as part of the art (EXACTLY like your generator)
      drawFringeAndSelvedge(ctx, stripeData, doormatWidth, doormatHeight, fringeLength, random, offsetX, offsetY)
    }
    
    // Add subtle fabric texture noise (much more subtle to avoid black bands)
    for (let x = 0; x < canvas.width; x += 8) {
      for (let y = 0; y < canvas.height; y += 8) {
        const noise = Math.random() * 0.1 - 0.05  // Reduced intensity
        if (Math.abs(noise) > 0.02) {  // Only add noise if it's significant
          // Use a very light color instead of black
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(noise) * 0.3})`
          ctx.fillRect(x, y, 1, 1)  // Smaller dots
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
  }, [seed, dependenciesLoaded])

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
        const ripple = Math.sin(Math.sqrt(y*y + x*x) * 2 - time * 3) * 0.03 // Radial flow
        
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

  // Load P5.js dependencies
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        // Prevent multiple simultaneous loading attempts
        if (globalDependenciesLoading) {
          // Wait for loading to complete
          const checkLoaded = () => {
            if (globalDependenciesLoaded) {
              setDependenciesLoaded(true)
            } else {
              setTimeout(checkLoaded, 100)
            }
          }
          checkLoaded()
          return
        }
        
        // If already loaded globally, just set local state
        if (globalDependenciesLoaded) {
          setDependenciesLoaded(true)
          return
        }
        
        globalDependenciesLoading = true
        
        // Load color palettes
        if (!window.colorPalettes) {
          const colorPalettesResponse = await fetch('/lib/doormat/color-palettes.js')
          const colorPalettesText = await colorPalettesResponse.text()
          // Extract the colorPalettes array from the JS file
          const colorPalettesMatch = colorPalettesText.match(/const colorPalettes = (\[[\s\S]*?\]);/)
          if (colorPalettesMatch) {
            const colorPalettesCode = colorPalettesMatch[1]
            // Use Function constructor to safely evaluate the array
            window.colorPalettes = new Function(`return ${colorPalettesCode}`)()
          }
        }

        // Load character map
        if (!window.characterMap) {
          const characterMapResponse = await fetch('/lib/doormat/character-map.js')
          const characterMapText = await characterMapResponse.text()
          const characterMapMatch = characterMapText.match(/const characterMap = (\{[\s\S]*?\});/)
          if (characterMapMatch) {
            const characterMapCode = characterMapMatch[1]
            window.characterMap = new Function(`return ${characterMapCode}`)()
          }
        }

        // Load doormat config
        if (!window.DOORMAT_CONFIG) {
          try {
            // Since the config file is wrapped in an IIFE, we'll set default values
            // and let the config file execute to override them
            window.DOORMAT_CONFIG = {
              DOORMAT_WIDTH: 800,
              DOORMAT_HEIGHT: 1200,
              FRINGE_LENGTH: 30,
              WEFT_THICKNESS: 8,
              WARP_THICKNESS: 2,
              TEXT_SCALE: 2,
              MAX_CHARS: 11,
              MAX_TEXT_ROWS: 5
            }
            
            // Load the config script to override our defaults
            const script = document.createElement('script')
            script.src = '/lib/doormat/doormat-config.js'
            script.onload = () => {
              // Config loaded silently
            }
            script.onerror = () => {
              // Using defaults silently
            }
            document.head.appendChild(script)
          } catch (error) {
            // Using fallback config values silently
          }
        }

                // CRITICAL: Load the main P5.js doormat.js file to get the actual drawing functions
        if (!window.generateDoormatCore && !document.querySelector('script[src="/lib/doormat/doormat.js"]')) {
          // CRITICAL: Mock P5.js functions before loading doormat.js
          
          // Mock P5.js randomSeed function
          window.randomSeed = (seed: number) => {
            // Return a seeded random function
            let m = 0x80000000
            let a = 1103515245
            let c = 12345
            let state = seed
            return () => {
              state = (a * state + c) % m
              return state / m
            }
          }
          
          // Mock P5.js noise function
          window.noise = (x: number) => {
            // Simple noise implementation
            return (Math.sin(x * 12.9898) + Math.sin(x * 78.233)) * 43758.5453 % 1
          }
          
          // Mock P5.js noiseSeed function
          window.noiseSeed = (seed: number) => {
            // Silent implementation
          }
          
          // Mock P5.js random function
          window.random = (min?: number | any[], max?: number) => {
            // Handle array input (random element selection)
            if (Array.isArray(min)) {
              const array = min
              return array[Math.floor(Math.random() * array.length)]
            }
            // Handle number ranges
            if (min !== undefined && max !== undefined) {
              return Math.random() * (max - min) + min
            } else if (min !== undefined && typeof min === 'number') {
              return Math.random() * min
            } else {
              return Math.random()
            }
          }
          
          // Mock P5.js color function to return hex strings for compatibility
          window.color = (r: number | string, g?: number, b?: number, a?: number) => {
            if (typeof r === 'string') {
              // Hex color - return as is for compatibility
              return r
            } else {
              // RGB values - convert to hex
              const hex = `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g || 0).toString(16).padStart(2, '0')}${Math.round(b || 0).toString(16).padStart(2, '0')}`
              return hex
            }
          }
          
 
          
          // Mock P5.js red, green, blue functions
          window.red = (c: any) => {
            if (typeof c === 'string' && c.startsWith('#')) {
              return parseInt(c.slice(1, 3), 16)
            }
            return c.r || 0
          }
          window.green = (c: any) => {
            if (typeof c === 'string' && c.startsWith('#')) {
              return parseInt(c.slice(3, 5), 16)
            }
            return c.g || 0
          }
          window.blue = (c: any) => {
            if (typeof c === 'string' && c.startsWith('#')) {
              return parseInt(c.slice(5, 7), 16)
            }
            return c.b || 0
          }
          
          // Mock P5.js lerpColor function
          window.lerpColor = (c1: any, c2: any, amt: number) => {
            // Convert hex colors to RGB if needed
            const getRGB = (c: any) => {
              if (typeof c === 'string' && c.startsWith('#')) {
                return {
                  r: parseInt(c.slice(1, 3), 16),
                  g: parseInt(c.slice(3, 5), 16),
                  b: parseInt(c.slice(5, 7), 16)
                }
              }
              return c
            }
            
            const rgb1 = getRGB(c1)
            const rgb2 = getRGB(c2)
            
            return {
              r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * amt),
              g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * amt),
              b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * amt)
            }
          }
          
          // Mock P5.js constrain function
          window.constrain = (n: number, low: number, high: number) => {
            return Math.max(low, Math.min(high, n))
          }
          
          // Mock P5.js max, min, floor functions
          window.max = Math.max
          window.min = Math.min
          window.floor = Math.floor
          
          // Mock P5.js PI constant
          window.PI = Math.PI
          
          // Mock P5.js cos, sin functions
          window.cos = Math.cos
          window.sin = Math.sin
          
          // Mock P5.js fill function
          window.fill = (r: number, g?: number, b?: number, a?: number) => {
            // This will be handled by the drawing context
          }
          
          // Mock P5.js noStroke function
          window.noStroke = () => {
            // This will be handled by the drawing context
          }
          
          // Mock P5.js noFill function
          window.noFill = () => {
            // This will be handled by the drawing context
          }
          
          // Mock P5.js arc function
          window.arc = (x: number, y: number, w: number, h: number, start: number, stop: number) => {
            // This will be handled by the drawing context
          }
          
          // Mock P5.js ellipse function
          window.ellipse = (x: number, y: number, w: number, h: number) => {
            // This will be handled by the drawing context
          }
          
          // Mock P5.js beginShape, vertex, endShape functions
          window.beginShape = () => {}
          window.vertex = (x: number, y: number) => {}
          window.endShape = () => {}
          
          // Mock P5.js strokeWeight function
          window.strokeWeight = (weight: number) => {}
          
          // Mock P5.js noLoop function
          window.noLoop = () => {}
          
          // Mock P5.js createCanvas function
          window.createCanvas = (w: number, h: number) => {
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            return canvas
          }
          
          // Mock P5.js canvas.parent function
          const originalCreateCanvas = window.createCanvas
          window.createCanvas = (w: number, h: number) => {
            const canvas = originalCreateCanvas(w, h)
            canvas.parent = (container: string) => {
              // Silent implementation
            }
            return canvas
          }
          
          // Mock P5.js background function
          window.background = (r: number, g?: number, b?: number, a?: number) => {
            // Silent implementation
          }
          
          // Mock P5.js redraw function
          window.redraw = () => {
            // Silent implementation
          }
          
          const script = document.createElement('script')
          script.src = '/lib/doormat/doormat.js'
          script.onload = () => {
            // Ensure global variables are properly initialized
            if (window.colorPalettes && window.colorPalettes.length > 0) {
              window.selectedPalette = window.colorPalettes[0]
            }
            
            // Small delay to ensure all functions are available
            setTimeout(() => {
              globalDependenciesLoaded = true
              globalDependenciesLoading = false
              setDependenciesLoaded(true)
            }, 100)
          }
          script.onerror = () => {
            console.error('❌ Failed to load main P5.js doormat.js file')
            globalDependenciesLoaded = false
            globalDependenciesLoading = false
            setDependenciesLoaded(true)
          }
          document.head.appendChild(script)
        } else {
          setDependenciesLoaded(true)
        }
      } catch (error) {
        console.error('❌ Failed to load P5.js dependencies:', error)
        // Fallback to default values
        setDependenciesLoaded(true)
      }
    }

    loadDependencies()
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
              array={new Float32Array(Array.from({length: 600}, () => (Math.random() - 0.5) * 100))}
              itemSize={3}
              args={[new Float32Array(Array.from({length: 600}, () => (Math.random() - 0.5) * 100)), 3]}
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
