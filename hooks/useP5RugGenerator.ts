// Generative Doormat Art - P5.js Integration
// Direct integration of doormat.js functionality

import { useRef, useState, useEffect, useCallback } from 'react'

// Export types for use in other components
export interface RugConfig {
  width: number
  height: number
  seed: number
  palette: string[]
  textInputs: string[]
}

export interface RugTraits {
  textLines: number
  totalCharacters: number
  paletteName: string
  paletteRarity: string
  stripeCount: number
  stripeComplexity: string
  rarity: string
  complexity: string
  colorVariety: string
  textDensity: string
  patternType: string
}

export function useP5RugGenerator(config: RugConfig) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isGenerating] = useState(false)
  const [, setCurrentSeed] = useState(config.seed)
  const p5InstanceRef = useRef<any>(null)

  // Initialize P5.js sketch
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Add wait time to ensure any previous async operations complete
    const initWithDelay = async () => {
      // Wait 100ms to let any previous async operations complete
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // ROBUST CHECK: If canvas already exists, don't create another one
      const existingCanvas = canvasRef.current?.querySelector('canvas[id^="defaultCanvas"]')
      if (existingCanvas) {
        console.log(`🎯 P5.js canvas already exists (${existingCanvas.id}), skipping creation`)
        return
      }
      
      // ROBUST CHECK: If instance already exists, don't create another one
      if (p5InstanceRef.current) {
        console.log('🎯 P5.js instance already exists, skipping creation')
        return
      }
      
      // ROBUST CHECK: Global flag to prevent multiple initializations
      if ((window as any).p5Initializing) {
        console.log('🎯 P5.js is already being initialized, skipping creation')
        return
      }
      
      // Set global flag immediately to prevent race conditions
      ;(window as any).p5Initializing = true

    const initP5 = async () => {
      // Load P5.js from CDN instead of dynamic import
      if (typeof window.p5 === 'undefined') {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load P5.js'))
          document.head.appendChild(script)
        })
      }
      
      const p5 = window.p5
      
      // Check if scripts are already loaded
      const scriptsLoaded = typeof window.generateDoormatCore === 'function' && 
                           typeof window.characterMap === 'object' && 
                           typeof window.colorPalettes === 'object'
      
      if (!scriptsLoaded) {
        console.log('🔄 Scripts not loaded, loading doormat scripts...')
        // Load scripts only if not already loaded
        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve()
              return
            }
            
            const script = document.createElement('script')
            script.src = src
            script.onload = () => resolve()
            script.onerror = () => reject(new Error(`Failed to load ${src}`))
            document.head.appendChild(script)
          })
        }

        try {
          await loadScript('/lib/doormat/character-map.js')
          console.log('✅ character-map.js loaded')
          
          await loadScript('/lib/doormat/color-palettes.js')
          console.log('✅ color-palettes.js loaded')
          
          await loadScript('/lib/doormat/trait-calculator.js')
          console.log('✅ trait-calculator.js loaded')
          
          await loadScript('/lib/doormat/doormat.js')
          console.log('✅ doormat.js loaded')
          
          // Wait a bit for scripts to initialize
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Verify scripts are loaded
          console.log('🔍 Verifying script loading:')
          console.log('  - generateDoormatCore:', typeof window.generateDoormatCore)
          console.log('  - characterMap:', typeof window.characterMap)
          console.log('  - colorPalettes:', typeof window.colorPalettes)
          
        } catch (error) {
          console.error('❌ Failed to load doormat scripts:', error)
          return
        }
      } else {
        console.log('✅ Scripts already loaded, skipping script loading')
      }

      // Verify that doormat functions are available before creating P5.js sketch
      if (typeof window.generateDoormatCore !== 'function') {
        console.error('❌ generateDoormatCore function not available, cannot create P5.js sketch')
        return
      }
      
      console.log('🎨 Creating P5.js sketch...')
      
      // Now create the P5.js sketch
      const sketch = (p: any) => {
        // Make P5.js functions available globally for doormat.js
        window.randomSeed = p.randomSeed.bind(p)
        window.noiseSeed = p.noiseSeed.bind(p)
        window.noise = p.noise.bind(p)
        window.random = p.random.bind(p)
        window.color = p.color.bind(p)
        window.red = p.red.bind(p)
        window.green = p.green.bind(p)
        window.blue = p.blue.bind(p)
        window.lerpColor = p.lerpColor.bind(p)
        window.constrain = p.constrain.bind(p)
        window.sin = p.sin.bind(p)
        window.cos = p.cos.bind(p)
        window.fill = p.fill.bind(p)
        window.noStroke = p.noStroke.bind(p)
        window.rect = p.rect.bind(p)
        window.arc = p.arc.bind(p)
        window.ellipse = p.ellipse.bind(p)
        window.stroke = p.stroke.bind(p)
        window.strokeWeight = p.strokeWeight.bind(p)
        window.noFill = p.noFill.bind(p)
        window.beginShape = p.beginShape.bind(p)
        window.endShape = p.endShape.bind(p)
        window.vertex = p.vertex.bind(p)
        window.push = p.push.bind(p)
        window.pop = p.pop.bind(p)
        window.translate = p.translate.bind(p)
        window.rotate = p.rotate.bind(p)
        window.background = p.background.bind(p)
        window.blendMode = p.blendMode.bind(p)
        window.map = p.map.bind(p)
        window.max = p.max.bind(p)
        window.floor = p.floor.bind(p)
        window.lerp = p.lerp.bind(p)
        window.line = p.line.bind(p)
        window.redraw = p.redraw.bind(p)
        window.pixelDensity = p.pixelDensity.bind(p)
        window.noLoop = p.noLoop.bind(p)
        window.PI = p.PI
        window.HALF_PI = p.HALF_PI
        window.TWO_PI = p.TWO_PI
        window.MULTIPLY = p.MULTIPLY
        window.BLEND = p.BLEND

        // Set up global configuration exactly like original doormat.js
        window.DOORMAT_CONFIG = {
          DOORMAT_WIDTH: 800,
          DOORMAT_HEIGHT: 1200,
          FRINGE_LENGTH: 30,
          WEFT_THICKNESS: 8,
          TEXT_SCALE: 2,
          MAX_CHARS: 11,
          WARP_THICKNESS: 2,
          CANVAS_WIDTH: 800,
          CANVAS_HEIGHT: 1200
        }

        // Initialize global variables exactly like original
        window.doormatWidth = window.DOORMAT_CONFIG.DOORMAT_WIDTH
        window.doormatHeight = window.DOORMAT_CONFIG.DOORMAT_HEIGHT
        window.fringeLength = window.DOORMAT_CONFIG.FRINGE_LENGTH
        window.currentSeed = 42
        window.warpThickness = 2
        window.weftThickness = window.DOORMAT_CONFIG.WEFT_THICKNESS
        window.TEXT_SCALE = window.DOORMAT_CONFIG.TEXT_SCALE
        window.MAX_CHARS = window.DOORMAT_CONFIG.MAX_CHARS
        window.lightTextColor = null
        window.darkTextColor = null
        window.selectedPalette = null
        window.stripeData = []
        window.doormatTextRows = []
        window.textData = []

        p.setup = () => {
          // Create canvas with swapped dimensions for 90-degree rotation (exactly like original)
          // After rotation: width becomes height, height becomes width
          // Increased buffer for frayed edges and selvedge variations
          const canvasWidth = window.doormatHeight + (window.fringeLength * 4)
          const canvasHeight = window.doormatWidth + (window.fringeLength * 4)
          const canvas = p.createCanvas(canvasWidth, canvasHeight)
          
          // Set canvas parent to our ref (instead of 'canvas-container')
          canvas.parent(canvasRef.current!)
          
          // Set high DPR for crisp rendering on high-DPI displays
          p.pixelDensity(2.5)
          
          // Set global width and height for the original functions
          window.width = canvasWidth
          window.height = canvasHeight
          
          // Initialize palette
          if (window.initializePalette) {
            window.initializePalette()
          }
          
          // Generate initial doormat
          if (window.generateDoormatCore) {
            window.generateDoormatCore(config.seed)
          }
          
          p.noLoop()
        }

        p.draw = () => {
          // Call the original draw function
          if (window.draw) {
            window.draw()
          }
        }
      }

      p5InstanceRef.current = new p5(sketch, canvasRef.current!)
      console.log('✅ P5.js instance created successfully')
    }

    initP5()
    }
    
    // Call the delayed initialization
    initWithDelay()

    return () => {
      // SIMPLE CLEANUP: Only clean up our own instance
      if (p5InstanceRef.current) {
        console.log('🧹 Cleaning up P5.js instance')
        p5InstanceRef.current.remove()
        p5InstanceRef.current = null
      }
      
      // Clear global flag
      ;(window as any).p5Initializing = false
    }
  }, [config.seed]) // Only re-run if seed changes

  // Generate from seed function (memoized to prevent infinite loops)
  const generateFromSeed = useCallback((seed: number) => {
    if (window.generateDoormatCore) {
      window.generateDoormatCore(seed)
    }
  }, [])

  // Generate new doormat function
  const generateNew = useCallback(() => {
    const seed = Math.floor(Math.random() * 10000)
    setCurrentSeed(seed)
    generateFromSeed(seed)
  }, [generateFromSeed])

  // Add text to doormat function (memoized to prevent infinite loops)
  const addTextToDoormatInSketch = useCallback((textRows: string[]) => {
    if (typeof textRows === 'string') {
      textRows = [textRows]
    }
    
    // Set the text rows globally
    window.doormatTextRows = textRows.map(text => 
      text.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 11)
    ).filter(text => text.length > 0)
    
    // Generate text data
    if (window.generateTextDataInSketch) {
      window.generateTextDataInSketch()
    }
    
    // Redraw
    if (p5InstanceRef.current) {
      p5InstanceRef.current.redraw()
    }
  }, []) // Empty dependency array since it only uses global functions

  // Clear text from doormat function (memoized to prevent infinite loops)
  const clearTextFromDoormat = useCallback(() => {
    window.doormatTextRows = []
    if (window.clearTextDataInSketch) {
      window.clearTextDataInSketch()
    }
    if (p5InstanceRef.current) {
      p5InstanceRef.current.redraw()
    }
  }, []) // Empty dependency array since it only uses global functions

  // Generate rug function for the interface (memoized to prevent infinite loops)
  const generateRug = useCallback(() => {
    // Use the provided seed from config, don't generate a new one
    if (config.seed) {
      generateFromSeed(config.seed)
    } else {
      // Only generate new seed if no seed is provided
      generateNew()
    }
  }, [config.seed, generateFromSeed, generateNew])

  // Get traits function for the interface (memoized to prevent infinite loops)
  const getTraits = useCallback((): RugTraits => {
    const textRows = window.doormatTextRows || []
    const selectedPalette = window.selectedPalette
    const stripeData = window.stripeData || []
    
    return {
      textLines: textRows.length,
      totalCharacters: textRows.reduce((sum, row) => sum + row.length, 0),
      paletteName: selectedPalette ? selectedPalette.name : "Unknown",
      paletteRarity: selectedPalette ? getPaletteRarity(selectedPalette.name) : "Common",
      stripeCount: stripeData.length,
      stripeComplexity: calculateStripeComplexity(stripeData),
      rarity: selectedPalette ? getPaletteRarity(selectedPalette.name) : "Common",
      complexity: calculateStripeComplexity(stripeData),
      colorVariety: calculateColorVariety(stripeData),
      textDensity: calculateTextDensity(textRows),
      patternType: calculatePatternType(stripeData)
    }
  }, []) // Empty dependency array since it only reads from global window variables

  // Helper function to get palette rarity
  const getPaletteRarity = (paletteName: string): string => {
    const legendaryPalettes = ["Buddhist", "Maurya Empire", "Chola Dynasty", "Indigo Famine", "Bengal Famine", "Jamakalam"]
    const epicPalettes = ["Indian Peacock", "Flamingo", "Toucan", "Madras Checks", "Kanchipuram Silk", "Natural Dyes", "Bleeding Vintage"]
    const rarePalettes = ["Tamil Classical", "Sangam Era", "Pandya Dynasty", "Maratha Empire", "Rajasthani"]
    const uncommonPalettes = ["Tamil Nadu Temple", "Kerala Onam", "Chettinad Spice", "Chennai Monsoon", "Bengal Indigo"]
    
    if (legendaryPalettes.includes(paletteName)) return "Legendary"
    if (epicPalettes.includes(paletteName)) return "Epic"
    if (rarePalettes.includes(paletteName)) return "Rare"
    if (uncommonPalettes.includes(paletteName)) return "Uncommon"
    return "Common"
  }

  // Helper function to calculate stripe complexity
  const calculateStripeComplexity = (stripeData: any[]): string => {
    if (!stripeData || stripeData.length === 0) return "Basic"
    
    let complexityScore = 0
    let mixedCount = 0
    let texturedCount = 0
    let solidCount = 0
    let secondaryColorCount = 0
    
    for (let stripe of stripeData) {
      if (stripe.weaveType === 'mixed') {
        mixedCount++
        complexityScore += 2
      } else if (stripe.weaveType === 'textured') {
        texturedCount++
        complexityScore += 1.5
      } else {
        solidCount++
      }
      
      if (stripe.secondaryColor) {
        secondaryColorCount++
        complexityScore += 1
      }
    }
    
    const solidRatio = solidCount / stripeData.length
    const normalizedComplexity = complexityScore / (stripeData.length * 3)
    
    if (solidRatio > 0.9) return "Basic"
    if (solidRatio > 0.75 && normalizedComplexity < 0.15) return "Simple"
    if (solidRatio > 0.6 && normalizedComplexity < 0.3) return "Moderate"
    if (normalizedComplexity < 0.5) return "Complex"
    return "Very Complex"
  }

  // Helper function to calculate color variety
  const calculateColorVariety = (stripeData: any[]): string => {
    if (!stripeData || stripeData.length === 0) return "Monochrome"
    
    const uniqueColors = new Set()
    let hasSecondary = false
    
    for (const stripe of stripeData) {
      uniqueColors.add(stripe.primaryColor)
      if (stripe.secondaryColor) hasSecondary = true
    }
    
    const colorCount = uniqueColors.size
    if (colorCount === 1) return "Monochrome"
    if (colorCount <= 3) return "Limited"
    if (colorCount <= 5) return "Moderate"
    if (hasSecondary) return "Complex"
    return "Rich"
  }

  // Helper function to calculate text density
  const calculateTextDensity = (textRows: string[]): string => {
    if (!textRows || textRows.length === 0) return "None"
    
    const totalChars = textRows.reduce((sum, row) => sum + row.length, 0)
    
    if (totalChars === 0) return "None"
    if (totalChars <= 5) return "Sparse"
    if (totalChars <= 15) return "Moderate"
    if (totalChars <= 30) return "Dense"
    return "Very Dense"
  }

  // Helper function to calculate pattern type
  const calculatePatternType = (stripeData: any[]): string => {
    if (!stripeData || stripeData.length === 0) return "Solid"
    
    let solidCount = 0
    let texturedCount = 0
    let mixedCount = 0
    
    for (let stripe of stripeData) {
      if (stripe.weaveType === 'solid') solidCount++
      else if (stripe.weaveType === 'textured') texturedCount++
      else if (stripe.weaveType === 'mixed') mixedCount++
    }
    
    const total = stripeData.length
    const solidRatio = solidCount / total
    const texturedRatio = texturedCount / total
    const mixedRatio = mixedCount / total
    
    if (solidRatio > 0.8) return "Solid"
    if (texturedRatio > 0.6) return "Textured"
    if (mixedRatio > 0.4) return "Mixed"
    if (texturedRatio > 0.3) return "Textured"
    return "Varied"
  }

  // Return the hook interface
  return {
    canvasRef,
    isGenerating,
    generateNew,
    generateFromSeed,
    addTextToDoormatInSketch,
    clearTextFromDoormat,
    generateRug,
    getTraits
  }
}
