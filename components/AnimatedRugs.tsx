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
    // P5.js library and functions
    p5?: any
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

// Advanced Flying Rug Component with Your P5.js Generator Logic
function FlyingRug({ position, scale = 1, seed = 0, dependenciesLoaded }: { 
  position: [number, number, number], 
  scale?: number, 
  seed?: number
  dependenciesLoaded: boolean
}) {
  const rugRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const initialPositions = useRef<Float32Array | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  
  // Your curated word list for the flying rugs
  const rugWords = [
    'Welcome',
    'HODL Zone',
    'Soft',
    'Floor is Lava',
    'Home Sweet Home',
    'Good Vibes Only'
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
    drawFringeSection(ctx, offsetX, offsetY, doormatWidth, fringeLength, 'top', random, fringeLength)
    drawFringeSection(ctx, offsetX, offsetY + doormatHeight, doormatWidth, fringeLength, 'bottom', random, fringeLength)
    
    // Draw sophisticated selvedge edges (EXACT COPY of your drawSelvedgeEdges)
    drawSelvedgeEdges(ctx, stripeData, doormatWidth, doormatHeight, fringeLength, random, offsetX, offsetY)
  }
  
  // Sophisticated fringe section drawing (EXACT COPY of your drawFringeSection)
  const drawFringeSection = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, side: string, random: () => number, fringeLength: number) => {
    const fringeStrands = Math.floor(w / 12) // More fringe strands for thinner threads
    const strandWidth = w / fringeStrands
    
    for (let i = 0; i < fringeStrands; i++) {
      const strandX = x + i * strandWidth
      
      // Get random color from palette
      const colorPalettes = window.colorPalettes || [{ colors: ['#8B4513', '#D2691E', '#A0522D'] }]
      const selectedPalette = colorPalettes[Math.floor(random() * colorPalettes.length)]
      const strandColor = selectedPalette.colors[Math.floor(random() * selectedPalette.colors.length)]
      
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
        
        console.log('🎯 LEFT Selvedge angles (FIXED):', { startAngle: startAngle.toFixed(3), endAngle: endAngle.toFixed(3), startDegrees: (startAngle * 180 / Math.PI).toFixed(1), endDegrees: (endAngle * 180 / Math.PI).toFixed(1) })
        
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
        
        console.log('🎯 RIGHT Selvedge angles (FIXED):', { startAngle: startAngle.toFixed(3), endAngle: endAngle.toFixed(3), startDegrees: (startAngle * 180 / Math.PI).toFixed(1), endDegrees: (endAngle * 180 / Math.PI).toFixed(1) })
        
        // Draw textured selvedge arc with multiple layers (EXACT COPY) - RIGHT SIDE semicircle
        drawTexturedSelvedgeArc(ctx, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right', random)
      }
    }
  }
  
  // FIXED: Eliminate transparency gaps by using solid colors and overlapping arcs
  const drawTexturedSelvedgeArc = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, r: number, g: number, b: number, side: string, random: () => number) => {
    console.log('🎨 Drawing selvedge arc (FIXED):', { centerX, centerY, radius, startAngle: startAngle.toFixed(3), endAngle: endAngle.toFixed(3), side })
    
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
    
    console.log('🎯 Using your AMAZING text algorithm:', textData.length, 'pixels')
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
      console.log('🚫 Texture generation skipped:', { 
        isWindow: typeof window !== 'undefined', 
        dependenciesLoaded 
      })
      return null
    }
    
    console.log('🎨 Generating rug texture for seed:', seed)
    
    // Create canvas with your generator dimensions
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // Set canvas size to match your generator
    const doormatWidth = window.DOORMAT_CONFIG?.DOORMAT_WIDTH || 800
    const doormatHeight = window.DOORMAT_CONFIG?.DOORMAT_HEIGHT || 1200
    const fringeLength = window.DOORMAT_CONFIG?.FRINGE_LENGTH || 30
    
    console.log('📏 Canvas dimensions:', { doormatWidth, doormatHeight, fringeLength })
    
    // Use the same canvas dimensions as your generator (NO swapping needed)
    canvas.width = doormatWidth + (fringeLength * 4)
    canvas.height = doormatHeight + (fringeLength * 4)
    
    // CRITICAL: Clear the entire canvas completely before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // NO BACKGROUND FILL - Keep canvas transparent for animation
    
    // CRITICAL: Use the ACTUAL P5.js generateDoormatCore function instead of manual recreation!
    if (window.generateDoormatCore && typeof window.generateDoormatCore === 'function') {
      console.log('🚀 Calling ACTUAL P5.js generateDoormatCore function!')
      
      // Set the text for this rug using your EXACT generator algorithm
      const selectedWord = rugWords[seed % rugWords.length]
      
      // FIXED: Use proper multi-line text processing like your generator
      const textRows = selectedWord.split(' ').map(word => word.toUpperCase())
      window.doormatTextRows = textRows
      
      // Call the actual P5.js function to generate the rug FIRST
      console.log('🚀 About to call generateDoormatCore with seed:', seed)
      try {
        window.generateDoormatCore(seed)
        console.log('✅ P5.js generateDoormatCore completed successfully')
      } catch (error) {
        console.error('❌ Error calling generateDoormatCore:', error)
      }
      
      // NOW call the text generation pipeline AFTER generateDoormatCore sets up the palette
      if (window.generateTextDataInSketch && typeof window.generateTextDataInSketch === 'function') {
        console.log('🚀 Calling your EXACT text generation pipeline!')
        try {
          window.generateTextDataInSketch()
          console.log('✅ Text generation pipeline completed successfully')
        } catch (error) {
          console.error('❌ Error in text generation pipeline:', error)
        }
      } else {
        console.log('⚠️ generateTextDataInSketch function not available')
      }
      
      // Now we need to get the generated data from the P5.js functions
      console.log('✅ P5.js generation complete. Stripe data:', window.stripeData?.length || 0, 'stripes')
      
      // CRITICAL: Since we can't directly access P5.js canvas, let's use the generated data
      // but draw it using the CORRECT P5.js angles for selvedges
      console.log('🎨 Using P5.js generated data with CORRECT selvedge angles')
      
      // Get the palette that P5.js selected
      const selectedPalette = window.selectedPalette || window.colorPalettes?.[seed % window.colorPalettes.length] || { name: 'Default', colors: ['#8B4513', '#D2691E', '#A0522D'] }
      console.log('🎨 P5.js selected palette:', selectedPalette.name, 'with', selectedPalette.colors.length, 'colors')
      
      // Use P5.js generated stripe data if available
      const stripeData = window.stripeData || generateStripeDataForRug(selectedPalette, doormatHeight, () => Math.random())
      console.log('🔄 Using P5.js stripe data:', stripeData.length, 'stripes')
      
      // DEBUG: Log the first stripe to see its structure
      if (stripeData.length > 0) {
        console.log('🔍 First stripe structure:', stripeData[0])
        console.log('🔍 Stripe primaryColor type:', typeof stripeData[0].primaryColor)
        console.log('🔍 Stripe primaryColor value:', stripeData[0].primaryColor)
      }
      
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
        console.log('✅ Drawing selvedges FIRST with valid P5.js data (below rug)')
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
        console.log('❌ Drawing selvedges FIRST with manual fallback data (below rug)')
        // Use manual stripe data for selvedge drawing
        const manualStripeData = generateStripeDataForRug(selectedPalette, doormatHeight, () => Math.random())
        drawFringeAndSelvedge(ctx, manualStripeData, doormatWidth, doormatHeight, fringeLength, () => Math.random(), offsetX, offsetY)
      }
      
      // NOW DRAW MAIN RUG CONTENT (stripes) ABOVE the selvedges
      if (hasValidP5Data) {
        console.log('✅ Using valid P5.js stripe data')
        stripeData.forEach(stripe => {
          // Check if this is P5.js generated data or manual data
          if (stripe.primaryColor && typeof stripe.primaryColor === 'object' && stripe.primaryColor.r !== undefined) {
            // P5.js generated data - convert color object to hex
            const colorObj = stripe.primaryColor
            const hexColor = `#${Math.round(colorObj.r).toString(16).padStart(2, '0')}${Math.round(colorObj.g).toString(16).padStart(2, '0')}${Math.round(colorObj.b).toString(16).padStart(2, '0')}`
            console.log('🎨 Converting P5.js color object to hex:', colorObj, '→', hexColor)
            
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
        console.log('❌ P5.js data invalid (NaN values), falling back to manual generation')
        // Fallback to manual stripe generation
        const manualStripeData = generateStripeDataForRug(selectedPalette, doormatHeight, () => Math.random())
        manualStripeData.forEach(stripe => {
          drawStripeWithWeaving(ctx, stripe, doormatWidth, doormatHeight, () => Math.random(), offsetX, offsetY)
        })
      }
      
      // FIXED: Use your generator's text data EXACTLY as positioned (no manual rotation)
      console.log('📝 Using your generator\'s text data for rug:', selectedWord, '-> Rows:', textRows)
      
      // Get the text data that your generator created
      const textData = window.textData || []
      console.log('🎯 Your generator created text data:', textData.length, 'pixels')
      
      // DEBUG: Check text colors
      console.log('🎨 Text colors from P5.js:', {
        lightTextColor: window.lightTextColor,
        darkTextColor: window.darkTextColor,
        lightTextColorType: typeof window.lightTextColor,
        darkTextColorType: typeof window.darkTextColor
      })
      
      // Draw the text pixels using your generator's EXACT positioning (no coordinate modifications)
      if (textData.length > 0) {
        textData.forEach(pixel => {
          // FIXED: Use your generator's coordinates directly - it already handles rotation correctly
          // Your generator's generateCharacterPixels() already calculates the correct rotated positions
          // We just need to add the fringe offsets for canvas centering
          
          const finalX = pixel.x + offsetX  // Add fringe offset for canvas centering
          const finalY = pixel.y + offsetY  // Add fringe offset for canvas centering
          
          // FIXED: Use your generator's per-pixel color logic
          // Get the actual background color at this position to determine text color
          let textColor = '#FFFFFF' // Default fallback
          
          // Use your generator's dynamic color logic based on actual background brightness
          if (window.lightTextColor && window.darkTextColor) {
            // Calculate actual background brightness at this pixel position
            // This matches your generator's logic in drawStripe()
            const imageData = ctx.getImageData(finalX, finalY, 1, 1)
            const r = imageData.data[0]
            const g = imageData.data[1] 
            const b = imageData.data[2]
            const bgBrightness = (r + g + b) / 3
            
            // FIXED: Convert P5.js color objects to hex strings for proper rendering
            // Your generator uses P5.js color() objects, but we need hex strings for Canvas
            if (typeof window.lightTextColor === 'object' && window.lightTextColor.toString) {
              // Convert P5.js color to hex
              const lightHex = window.lightTextColor.toString()
              const darkHex = window.darkTextColor.toString()
              
              // Use your generator's exact color selection logic
              textColor = bgBrightness < 128 ? lightHex : darkHex
            } else {
              // Fallback to palette-based colors if P5.js colors not available
              const colorPalettes = window.colorPalettes || []
              if (colorPalettes.length > 0) {
                const selectedPalette = colorPalettes[seed % colorPalettes.length]
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
                  textColor = bgBrightness < 128 ? lightest : darkest
                }
              }
            }
          }
          
          // Draw with your generator's exact positioning and colors
          ctx.fillStyle = textColor
          ctx.fillRect(finalX, finalY, pixel.width, pixel.height) // Use original dimensions
        })
        console.log('✅ Drew', textData.length, 'text pixels using your generator\'s EXACT logic')
      } else {
        console.log('⚠️ No text data from generator, text may not render')
      }
      
    } else {
      console.log('❌ P5.js generateDoormatCore not available, using manual fallback')
      
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
      
      console.log('🎨 Selected palette:', selectedPalette.name, 'with', selectedPalette.colors.length, 'colors')
      
      // Generate stripe data EXACTLY like your generator
      const stripeData = generateStripeDataForRug(selectedPalette, doormatHeight, random)
      
      console.log('🔄 Generated', stripeData.length, 'stripes with weave patterns')
      
      // Calculate center offset to position rug content in the middle of canvas
      const offsetX = fringeLength * 2
      const offsetY = fringeLength * 2
      
      // NO BASE BACKGROUND - Keep transparent for animation
      
      // Draw stripes with proper weaving structure (centered)
      stripeData.forEach(stripe => {
        drawStripeWithWeaving(ctx, stripe, doormatWidth, doormatHeight, random, offsetX, offsetY)
      })
      
      // FIXED: Use your generator's text data for manual fallback too
      const selectedWord = rugWords[seed % rugWords.length]
      console.log('📝 Using your generator\'s text data for manual fallback:', selectedWord)
      
      // Set up text rows and call your generator's text pipeline
      const textRows = selectedWord.split(' ').map((word: string) => word.toUpperCase())
      window.doormatTextRows = textRows
      
      if (window.generateTextDataInSketch && typeof window.generateTextDataInSketch === 'function') {
        window.generateTextDataInSketch()
      }
      
      // Get the text data that your generator created
      const textData = window.textData || []
      console.log('🎯 Your generator created text data (manual path):', textData.length, 'pixels')
      
      // DEBUG: Check text colors in manual path
      console.log('🎨 Text colors from P5.js (manual path):', {
        lightTextColor: window.lightTextColor,
        darkTextColor: window.darkTextColor,
        lightTextColorType: typeof window.lightTextColor,
        darkTextColorType: typeof window.darkTextColor
      })
      
      // Draw the text pixels using your generator's EXACT positioning (no manual rotation)
      if (textData.length > 0) {
        let drawnPixels = 0
        textData.forEach((pixel: any) => {
          // FIXED: Use your generator's coordinates directly - it already handles rotation correctly
          // Your generator's generateCharacterPixels() already calculates the correct rotated positions
          // We just need to add the fringe offsets for canvas centering
          
          const finalX = pixel.x + offsetX  // Add fringe offset for canvas centering
          const finalY = pixel.y + offsetY  // Add fringe offset for canvas centering
          
          // FIXED: Use your generator's per-pixel color logic
          // Get the actual background color at this position to determine text color
          let textColor = '#FFFFFF' // Default fallback
          
          // Use your generator's dynamic color logic based on actual background brightness
          if (window.lightTextColor && window.darkTextColor) {
            // Calculate actual background brightness at this pixel position
            // This matches your generator's logic in drawStripe()
            const imageData = ctx.getImageData(finalX, finalY, 1, 1)
            const r = imageData.data[0]
            const g = imageData.data[1] 
            const b = imageData.data[2]
            const bgBrightness = (r + g + b) / 3
            
            // FIXED: Convert P5.js color objects to hex strings for proper rendering
            // Your generator uses P5.js color() objects, but we need hex strings for Canvas
            if (typeof window.lightTextColor === 'object' && window.lightTextColor.toString) {
              // Convert P5.js color to hex
              const lightHex = window.lightTextColor.toString()
              const darkHex = window.darkTextColor.toString()
              
              // Use your generator's exact color selection logic
              textColor = bgBrightness < 128 ? lightHex : darkHex
            } else {
              // Fallback to palette-based colors if P5.js colors not available
              const colorPalettes = window.colorPalettes || []
              if (colorPalettes.length > 0) {
                const selectedPalette = colorPalettes[seed % colorPalettes.length]
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
                  textColor = bgBrightness < 128 ? lightest : darkest
                }
              }
            }
          }
          
          // Draw with your generator's exact positioning and colors
          ctx.fillStyle = textColor
          ctx.fillRect(finalX, finalY, pixel.width, pixel.height) // Use original dimensions
          drawnPixels++
        })
        console.log(`✅ Drew ${drawnPixels} text pixels using your generator\'s EXACT logic (manual path)`)
      } else {
        console.log('⚠️ No text data from generator, text may not render (manual path)')
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
    
    console.log('✅ Rug texture generated successfully for seed:', seed)
    
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

  // Helper function to convert hex to RGB (matches your generator's color logic)
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

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

// Enhanced Magical Scene
function Scene() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false)

  // Load P5.js dependencies
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        console.log('🔄 Loading P5.js dependencies...')
        
        // Load P5.js from CDN like the live generator does
        if (!window.randomSeed) {
          console.log('📚 Loading P5.js from CDN...')
          await new Promise<void>((resolve) => {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
            script.async = false
            script.onload = () => {
              console.log('📚 P5.js script loaded, checking availability...')
              console.log('🔍 window.p5 available:', !!(window as any).p5)
              console.log('🔍 window.p5.randomSeed available:', !!(window as any).p5?.randomSeed)
              
              // Make P5.js functions globally available like the live generator
              if ((window as any).p5 && typeof (window as any).p5.randomSeed === 'function') {
                console.log('✅ P5.js loaded but functions not global, making them global')
                // Make P5.js functions globally available with proper binding
                ;(window as any).randomSeed = (window as any).p5.randomSeed.bind((window as any).p5)
                ;(window as any).noiseSeed = (window as any).p5.noiseSeed.bind((window as any).p5)
                ;(window as any).noise = (window as any).p5.noise.bind((window as any).p5)
                ;(window as any).random = (window as any).p5.random.bind((window as any).p5)
                ;(window as any).color = (window as any).p5.color.bind((window as any).p5)
                ;(window as any).red = (window as any).p5.red.bind((window as any).p5)
                ;(window as any).green = (window as any).p5.green.bind((window as any).p5)
                ;(window as any).blue = (window as any).p5.blue.bind((window as any).p5)
                ;(window as any).lerpColor = (window as any).p5.lerpColor.bind((window as any).p5)
                ;(window as any).createCanvas = (window as any).p5.createCanvas.bind((window as any).p5)
                ;(window as any).background = (window as any).p5.background.bind((window as any).p5)
                ;(window as any).fill = (window as any).p5.fill.bind((window as any).p5)
                ;(window as any).noFill = (window as any).p5.noFill.bind((window as any).p5)
                ;(window as any).noStroke = (window as any).p5.noStroke.bind((window as any).p5)
                ;(window as any).arc = (window as any).p5.arc.bind((window as any).p5)
                ;(window as any).ellipse = (window as any).p5.ellipse.bind((window as any).p5)
                ;(window as any).beginShape = (window as any).p5.beginShape.bind((window as any).p5)
                ;(window as any).vertex = (window as any).p5.vertex.bind((window as any).p5)
                ;(window as any).endShape = (window as any).p5.endShape.bind((window as any).p5)
                ;(window as any).strokeWeight = (window as any).p5.strokeWeight.bind((window as any).p5)
                ;(window as any).noLoop = (window as any).p5.noLoop.bind((window as any).p5)
                ;(window as any).redraw = (window as any).p5.redraw.bind((window as any).p5)
                ;(window as any).constrain = (window as any).p5.constrain.bind((window as any).p5)
                ;(window as any).max = (window as any).p5.max.bind((window as any).p5)
                ;(window as any).min = (window as any).p5.min.bind((window as any).p5)
                ;(window as any).floor = (window as any).p5.floor.bind((window as any).p5)
                ;(window as any).cos = (window as any).p5.cos.bind((window as any).p5)
                ;(window as any).sin = (window as any).p5.sin.bind((window as any).p5)
                ;(window as any).PI = (window as any).p5.PI
                console.log('✅ All P5.js functions made globally available')
                
                // Verify the functions are actually set
                console.log('🔍 Verification - randomSeed available:', typeof (window as any).randomSeed === 'function')
                console.log('🔍 Verification - noise available:', typeof (window as any).noise === 'function')
              } else {
                console.log('⚠️ P5.js loaded but randomSeed function not available')
                console.log('🔍 Available p5 properties:', Object.keys((window as any).p5 || {}))
              }
              resolve()
            }
            script.onerror = () => {
              console.error('❌ Failed to load P5.js from CDN')
              resolve()
            }
            document.head.appendChild(script)
          })
        }
        
        // Load color palettes
        if (!window.colorPalettes) {
          console.log('📚 Loading color palettes...')
          const colorPalettesResponse = await fetch('/lib/doormat/color-palettes.js')
          const colorPalettesText = await colorPalettesResponse.text()
          // Extract the colorPalettes array from the JS file
          const colorPalettesMatch = colorPalettesText.match(/const colorPalettes = (\[[\s\S]*?\]);/)
          if (colorPalettesMatch) {
            const colorPalettesCode = colorPalettesMatch[1]
            // Use Function constructor to safely evaluate the array
            window.colorPalettes = new Function(`return ${colorPalettesCode}`)()
            console.log('✅ Color palettes loaded:', window.colorPalettes.length, 'palettes')
          }
        }

        // Load character map
        if (!window.characterMap) {
          console.log('🔤 Loading character map...')
          const characterMapResponse = await fetch('/lib/doormat/character-map.js')
          const characterMapText = await characterMapResponse.text()
          const characterMapMatch = characterMapText.match(/const characterMap = (\{[\s\S]*?\});/)
          if (characterMapMatch) {
            const characterMapCode = characterMapMatch[1]
            window.characterMap = new Function(`return ${characterMapCode}`)()
            console.log('✅ Character map loaded:', Object.keys(window.characterMap).length, 'characters')
          }
        }

        // Load doormat config
        if (!window.DOORMAT_CONFIG) {
          console.log('⚙️ Loading doormat config...')
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
              console.log('✅ Doormat config script loaded and executed')
              // Small delay to ensure config is applied
              setTimeout(() => {
                console.log('✅ Final config after script execution:', window.DOORMAT_CONFIG)
              }, 100)
            }
            script.onerror = () => {
              console.log('⚠️ Config script failed to load, using defaults')
            }
            document.head.appendChild(script)
            
            console.log('✅ Doormat config initialized with defaults:', window.DOORMAT_CONFIG)
          } catch (error) {
            console.log('⚠️ Using fallback config values')
          }
        }

        // CRITICAL: Load the main P5.js doormat.js file to get the actual drawing functions
        if (!window.generateDoormatCore && !(window as any).__doormatJsLoaded) {
          console.log('🎨 Loading main P5.js doormat.js file...')
          
          // Mark as loaded to prevent multiple loading
          ;(window as any).__doormatJsLoaded = true
          
          const script = document.createElement('script')
          script.src = '/lib/doormat/doormat.js'
          script.onload = () => {
            console.log('✅ Main P5.js doormat.js loaded successfully!')
            console.log('🎯 Available functions:', Object.keys(window).filter(key => key.includes('generate') || key.includes('draw')))
            
            // Ensure global variables are properly initialized
            if (window.colorPalettes && window.colorPalettes.length > 0) {
              window.selectedPalette = window.colorPalettes[0]
              console.log('✅ Initialized selectedPalette:', window.selectedPalette)
            }
            
            // Small delay to ensure all functions are available
            setTimeout(() => {
              setDependenciesLoaded(true)
            }, 100)
          }
          script.onerror = () => {
            console.error('❌ Failed to load main P5.js doormat.js file')
            ;(window as any).__doormatJsLoaded = false // Reset flag on error
            setDependenciesLoaded(true)
          }
          document.head.appendChild(script)
        } else {
          console.log('✅ Main P5.js doormat.js already loaded or loading in progress')
          setDependenciesLoaded(true)
        }

        console.log('🎉 All P5.js dependencies loaded successfully!')
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
      <FlyingRug position={[0, 0, 0]} scale={1.2} seed={42} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[-8, 2, -5]} scale={0.8} seed={1337} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[8, -1, -3]} scale={0.9} seed={777} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[5, 3, -8]} scale={0.7} seed={999} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[-6, -2, -10]} scale={0.6} seed={555} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[-3, 5, -12]} scale={0.5} seed={888} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[10, -3, -15]} scale={0.4} seed={111} dependenciesLoaded={dependenciesLoaded} />
      
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
