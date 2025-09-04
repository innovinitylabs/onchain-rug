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
        const centerX = offsetX - radius + (random() * 4 - 2) // Slight position variation like your generator
        const centerY = offsetY + y + weftThickness/2 + (random() * 2 - 1) // Slight vertical variation like your generator
        
        // CRITICAL FIX: Use EXACT angles from your original P5.js generator
        // Left selvedge: P5.js uses 90° to -90°, but Canvas needs -90° to 90° for semicircle
        const startAngle = (-Math.PI / 2) + (random() * 0.4 - 0.2) // Start from bottom (-90°)
        const endAngle = (Math.PI / 2) + (random() * 0.4 - 0.2)    // End at top (90°)
        
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
        const centerX = offsetX + doormatWidth + radius + (random() * 4 - 2) // Slight position variation like your generator
        const centerY = offsetY + y + weftThickness/2 + (random() * 2 - 1) // Slight vertical variation like your generator
        
        // CRITICAL FIX: Use EXACT angles from your original P5.js generator
        // Right selvedge: P5.js uses -90° to 90°, Canvas also uses -90° to 90° = perfect semicircle
        const startAngle = (-Math.PI / 2) + (random() * 0.4 - 0.2) // Start from bottom (-90°)
        const endAngle = (Math.PI / 2) + (random() * 0.4 - 0.2)    // End at top (90°)
        
        console.log('🎯 RIGHT Selvedge angles:', { startAngle: startAngle.toFixed(3), endAngle: endAngle.toFixed(3), startDegrees: (startAngle * 180 / Math.PI).toFixed(1), endDegrees: (endAngle * 180 / Math.PI).toFixed(1) })
        
        // Draw textured selvedge arc with multiple layers (EXACT COPY) - RIGHT SIDE semicircle
        drawTexturedSelvedgeArc(ctx, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right', random)
      }
    }
  }
  
  // COMPLETELY REWRITTEN: Use HTML5 Canvas native semicircle drawing instead of trying to replicate P5.js
  const drawTexturedSelvedgeArc = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, r: number, g: number, b: number, side: string, random: () => number) => {
    console.log('🎨 Drawing selvedge arc (REWRITTEN):', { centerX, centerY, radius, startAngle: startAngle.toFixed(3), endAngle: endAngle.toFixed(3), side })
    
    // Draw a realistic textured selvedge arc with visible woven texture
    const threadCount = Math.max(6, Math.floor(radius / 1.2)) // More threads for visible texture
    const threadSpacing = radius / threadCount
    
    // Draw individual thread arcs to create visible woven texture
    for (let i = 0; i < threadCount; i++) {
      const threadRadius = radius - (i * threadSpacing)
      
      // Create distinct thread colors for visible texture
      let threadR, threadG, threadB
      
      if (i % 2 === 0) {
        // Lighter threads
        threadR = Math.max(0, Math.min(255, r + 25))
        threadG = Math.max(0, Math.min(255, g + 25))
        threadB = Math.max(0, Math.min(255, b + 25))
      } else {
        // Darker threads
        threadR = Math.max(0, Math.min(255, r - 20))
        threadG = Math.max(0, Math.min(255, g - 20))
        threadB = Math.max(0, Math.min(255, b - 20))
      }
      
      // Add some random variation for natural look
      threadR = Math.max(0, Math.min(255, threadR + random() * 20 - 10))
      threadG = Math.max(0, Math.min(255, threadG + random() * 20 - 10))
      threadB = Math.max(0, Math.min(255, threadB + random() * 20 - 10))
      
      ctx.fillStyle = `rgba(${Math.round(threadR)}, ${Math.round(threadG)}, ${Math.round(threadB)}, 0.35)` // More transparent for better blending
      
      // Draw individual thread arc with slight position variation
      const threadX = centerX + random() * 2 - 1
      const threadY = centerY + random() * 2 - 1
      
      // CRITICAL FIX: Use HTML5 Canvas's native semicircle drawing
      ctx.beginPath()
      ctx.arc(threadX, threadY, threadRadius * 2, threadRadius * 2, startAngle, endAngle)
      ctx.fill()
    }
    
    // Add a few more detailed texture layers
    for (let i = 0; i < 3; i++) {
      const detailRadius = radius * (0.3 + i * 0.2)
      const detailAlpha = 180 - (i * 40)
      
      // Create contrast for visibility
      let detailR = Math.max(0, Math.min(255, r + (i % 2 === 0 ? 15 : -15)))
      let detailG = Math.max(0, Math.min(255, g + (i % 2 === 0 ? 15 : -15)))
      let detailB = Math.max(0, Math.min(255, b + (i % 2 === 0 ? 15 : -15)))
      
      ctx.fillStyle = `rgba(${Math.round(detailR)}, ${Math.round(detailG)}, ${Math.round(detailB)}, ${(detailAlpha * 0.7) / 255})` // More transparent detail layers
      
      const detailX = centerX + random() * 1 - 0.5
      const detailY = centerY + random() * 1 - 0.5
      
      // CRITICAL FIX: Use HTML5 Canvas's native semicircle drawing
      ctx.beginPath()
      ctx.arc(detailX, detailY, detailRadius * 2, detailRadius * 2, startAngle, endAngle)
      ctx.fill()
    }
    
    // Add subtle shadow for depth
    ctx.fillStyle = `rgba(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)}, 0.27)` // More transparent shadow
    const shadowOffset = side === 'left' ? 1 : -1
    
    // CRITICAL FIX: Use HTML5 Canvas's native semicircle drawing
    ctx.beginPath()
    ctx.arc(centerX + shadowOffset, centerY + 1, radius * 2, radius * 2, startAngle, endAngle)
    ctx.fill()
    
    // Add small transparent hole in the center
    ctx.clearRect(centerX - radius * 0.5, centerY - radius * 0.5, radius, radius)
    
    // Add visible texture details - small bumps and knots
    for (let i = 0; i < 8; i++) {
      const detailAngle = random() * (endAngle - startAngle) + startAngle
      const detailRadius = radius * (random() * 0.5 + 0.2)
      const detailX = centerX + Math.cos(detailAngle) * detailRadius
      const detailY = centerY + Math.sin(detailAngle) * detailRadius
      
      // Alternate between light and dark for visible contrast
      if (i % 2 === 0) {
        ctx.fillStyle = `rgba(${Math.round(r + 20)}, ${Math.round(g + 20)}, ${Math.round(b + 20)}, 0.47)` // More transparent light bumps
      } else {
        ctx.fillStyle = `rgba(${Math.round(r - 15)}, ${Math.round(g - 15)}, ${Math.round(b - 15)}, 0.47)` // More transparent dark bumps
      }
      
      const bumpSize = random() * 2 + 1.5
      ctx.beginPath()
      ctx.arc(detailX, detailY, bumpSize, bumpSize, 0, Math.PI * 2)
      ctx.fill()
    }
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
  
  // Text generation function using your P5.js logic
  const generateTextDataForRug = (text: string, doormatWidth: number, doormatHeight: number, fringeLength: number) => {
    if (!window.characterMap) return []
    
    const textData: Array<{x: number, y: number, width: number, height: number}> = []
    
    // Use your existing text generation logic
    const warpThickness = window.warpThickness || 2
    const weftThickness = window.DOORMAT_CONFIG?.WEFT_THICKNESS || 8
    const TEXT_SCALE = window.DOORMAT_CONFIG?.TEXT_SCALE || 2
    
    // Calculate spacing based on your generator logic
    const warpSpacing = warpThickness + 1
    const weftSpacing = weftThickness + 1
    const scaledWarp = warpSpacing * TEXT_SCALE
    const scaledWeft = weftSpacing * TEXT_SCALE
    
    // Character dimensions
    const charWidth = 7 * scaledWarp
    const charHeight = 5 * scaledWeft
    const spacing = scaledWeft
    
    // Center the text on the rug
    const textWidth = text.length * charWidth
    const startX = (doormatWidth - textWidth) / 2 + fringeLength * 2
    const startY = (doormatHeight - charHeight) / 2 + fringeLength * 2
    
    // Generate character pixels for each character
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i)
      const charDef = window.characterMap[char] || window.characterMap[' ']
      
      if (charDef) {
        const charX = startX + i * charWidth
        
        // Generate pixels for this character
        for (let row = 0; row < charDef.length; row++) {
          for (let col = 0; col < charDef[0].length; col++) {
            if (charDef[row][col] === '1') {
              // Apply rotation and positioning like your generator
              const newCol = row
              const newRow = charDef[0].length - 1 - col
              
              textData.push({
                x: charX + newCol * scaledWarp,
                y: startY + newRow * scaledWeft,
                width: scaledWarp,
                height: scaledWeft
              })
            }
          }
        }
      }
    }
    
    return textData
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
    
    // Set a transparent background to ensure no artifacts
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Set random seed for consistent generation
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
    const randomInt = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min
    
    // Simulate P5.js color function
    const color = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
    }
    
    // Simulate P5.js lerpColor function
    const lerpColor = (c1: any, c2: any, amt: number) => {
      const r = Math.round(c1.r + (c2.r - c1.r) * amt)
      const g = Math.round(c1.g + (c2.g - c1.g) * amt)
      const b = Math.round(c1.b + (c2.b - c1.b) * amt)
      return { r, g, b }
    }
    
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
    
    // Draw base doormat (centered)
    ctx.fillStyle = selectedPalette.colors[0]
    ctx.fillRect(offsetX, offsetY, doormatWidth, doormatHeight)
    
    // Draw stripes with proper weaving structure (centered)
    stripeData.forEach(stripe => {
      drawStripeWithWeaving(ctx, stripe, doormatWidth, doormatHeight, random, offsetX, offsetY)
    })
    
    // Generate and draw text on the rug
    const selectedWord = rugWords[seed % rugWords.length]
    console.log('📝 Adding text to rug:', selectedWord, 'for seed:', seed)
    
    // Generate text data using your P5.js logic
    const textData = generateTextDataForRug(selectedWord, doormatWidth, doormatHeight, fringeLength)
    
    // Draw the text pixels (centered)
    if (textData.length > 0) {
      ctx.fillStyle = '#FFFFFF' // White text for visibility
      textData.forEach(pixel => {
        ctx.fillRect(pixel.x + offsetX, pixel.y + offsetY, pixel.width, pixel.height)
      })
    }
    
    // Draw proper fringe and selvedge as part of the art (EXACTLY like your generator)
    drawFringeAndSelvedge(ctx, stripeData, doormatWidth, doormatHeight, fringeLength, random, offsetX, offsetY)
    
    // Add subtle fabric texture noise (much more subtle to avoid black bands)
    for (let x = 0; x < canvas.width; x += 8) {
      for (let y = 0; y < canvas.height; y += 8) {
        const noise = random() * 0.1 - 0.05  // Reduced intensity
        if (Math.abs(noise) > 0.02) {  // Only add noise if it's significant
          // Use a very light color instead of black
          const lightness = 0.95 + (noise * 0.1)
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
        
        // Multiple wave layers for realistic cloth movement
        const wave1 = Math.sin(x * 1.5 + time * 2) * 0.15
        const wave2 = Math.sin(y * 1.2 + time * 1.8) * 0.08
        const wave3 = Math.sin((x + y) * 0.8 + time * 2.5) * 0.05
        const ripple = Math.sin(Math.sqrt(x*x + y*y) * 2 - time * 3) * 0.03
        
        // Wind effect simulation
        const windX = Math.sin(time * 0.7 + x * 0.5) * 0.04
        const windY = Math.cos(time * 0.9 + y * 0.3) * 0.03
        
        // Edge effects for natural cloth behavior
        const edgeFactorX = Math.abs(x) / 2
        const edgeFactorY = Math.abs(y) / 3
        const edgeAmplification = 1 + (edgeFactorX + edgeFactorY) * 0.5
        
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
          <planeGeometry args={[4, 6, 48, 48]} />
          <meshStandardMaterial 
            map={rugTexture} 
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
        
        {/* Enhanced glow with multiple layers */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[4.3, 6.3]} />
          <meshBasicMaterial 
            color="#8B4513" 
            transparent 
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Magical shimmer effect */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[4.1, 6.1]} />
          <meshBasicMaterial 
            color="#ffd700" 
            transparent 
            opacity={0.1}
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
        if (!window.generateDoormatCore) {
          console.log('🎨 Loading main P5.js doormat.js file...')
          const script = document.createElement('script')
          script.src = '/lib/doormat/doormat.js'
          script.onload = () => {
            console.log('✅ Main P5.js doormat.js loaded successfully!')
            console.log('🎯 Available functions:', Object.keys(window).filter(key => key.includes('generate') || key.includes('draw')))
            // Small delay to ensure all functions are available
            setTimeout(() => {
              setDependenciesLoaded(true)
            }, 100)
          }
          script.onerror = () => {
            console.error('❌ Failed to load main P5.js doormat.js file')
            setDependenciesLoaded(true)
          }
          document.head.appendChild(script)
        } else {
          console.log('✅ Main P5.js doormat.js already loaded')
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
      
      {/* Environment */}
      <Environment preset="sunset" />
      
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
