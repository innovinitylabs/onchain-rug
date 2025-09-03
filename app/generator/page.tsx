"use client"

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Download, FileText, Plus, X } from 'lucide-react'
import Navigation from '@/components/Navigation'

export default function GeneratorPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSeed, setCurrentSeed] = useState(42)
  const [textInputs, setTextInputs] = useState([''])
  const [currentRowCount, setCurrentRowCount] = useState(1)
  const [palette, setPalette] = useState<any>(null)
  const [traits, setTraits] = useState<any>(null)

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const scriptsLoadedRef = useRef<Set<string>>(new Set())

    // Load P5.js synchronously like the original HTML
  const loadP5 = () => {
    return new Promise<void>((resolve) => {
      // Check if P5.js is already loaded
      if ((window as any).p5 && typeof (window as any).randomSeed === 'function') {
        console.log('✅ P5.js already available')
        resolve()
        return
      }
      
      // Create script element exactly like original HTML - synchronous loading
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
      script.async = false // Force synchronous loading like original HTML
      script.onload = () => {
        // P5.js loads synchronously, but we need to create an instance to get functions
        if ((window as any).randomSeed && typeof (window as any).randomSeed === 'function') {
          console.log('✅ P5.js loaded synchronously - functions globally available')
          resolve()
        } else if ((window as any).p5 && typeof (window as any).p5.randomSeed === 'function') {
          console.log('✅ P5.js loaded but functions not global, making them global')
          // Make P5.js functions globally available
          ;(window as any).randomSeed = (window as any).p5.randomSeed
          ;(window as any).noiseSeed = (window as any).p5.noiseSeed
          ;(window as any).saveCanvas = (window as any).p5.saveCanvas
          ;(window as any).createCanvas = (window as any).p5.createCanvas
          ;(window as any).background = (window as any).p5.background
          ;(window as any).fill = (window as any).p5.fill
          ;(window as any).noFill = (window as any).p5.noFill
          ;(window as any).stroke = (window as any).p5.stroke
          ;(window as any).noStroke = (window as any).p5.noStroke
          ;(window as any).rect = (window as any).p5.rect
          ;(window as any).ellipse = (window as any).p5.ellipse
          ;(window as any).line = (window as any).p5.line
          ;(window as any).text = (window as any).p5.text
          ;(window as any).textSize = (window as any).p5.textSize
          ;(window as any).textAlign = (window as any).p5.textAlign
          ;(window as any).push = (window as any).p5.push
          ;(window as any).pop = (window as any).p5.pop
          ;(window as any).translate = (window as any).p5.translate
          ;(window as any).rotate = (window as any).p5.rotate
          ;(window as any).scale = (window as any).p5.scale
          ;(window as any).random = (window as any).p5.random
          ;(window as any).map = (window as any).p5.map
          ;(window as any).constrain = (window as any).p5.constrain
          ;(window as any).dist = (window as any).p5.dist
          ;(window as any).sin = (window as any).p5.sin
          ;(window as any).cos = (window as any).p5.cos
          ;(window as any).PI = (window as any).p5.PI
          ;(window as any).TWO_PI = (window as any).p5.TWO_PI
          ;(window as any).HALF_PI = (window as any).p5.HALF_PI
          // Add color utility functions
          ;(window as any).color = (window as any).p5.color
          ;(window as any).red = (window as any).p5.red
          ;(window as any).green = (window as any).p5.green
          ;(window as any).blue = (window as any).p5.blue
          ;(window as any).lerpColor = (window as any).p5.lerpColor
          // Add drawing control functions
          ;(window as any).redraw = (window as any).p5.redraw
          ;(window as any).loop = (window as any).p5.loop
          ;(window as any).noLoop = (window as any).p5.noLoop
          ;(window as any).frameRate = (window as any).p5.frameRate
          // Add utility functions
          ;(window as any).width = (window as any).p5.width
          ;(window as any).height = (window as any).p5.height
          ;(window as any).windowWidth = (window as any).p5.windowWidth
          ;(window as any).windowHeight = (window as any).p5.windowHeight
          console.log('✅ All P5.js functions made globally available')
          resolve()
        } else if ((window as any).p5) {
          console.log('✅ P5.js loaded, creating instance to get functions')
          // Create a P5.js instance to get access to functions
          try {
                      // Use the proper P5.js initialization - this will call setup() automatically
          const p5Instance = new (window as any).p5((p: any) => {
            // This is the setup function that gets called automatically
                         p.setup = () => {
               // Get the canvas container
               const container = document.getElementById('canvas-container')
               if (!container) return
               
               // Create P5.js canvas with fixed dimensions that we know work
               const canvasWidth = 1080
               const canvasHeight = 760
               
               let canvas = p.createCanvas(canvasWidth, canvasHeight)
               
               // Set the container to exactly match the canvas size
               container.style.width = `${canvasWidth}px`
               container.style.height = `${canvasHeight}px`
               
               // Set canvas styles to match container exactly
               canvas.style.width = `${canvasWidth}px`
               canvas.style.height = `${canvasHeight}px`
               
               // Append canvas to container
               container.appendChild(canvas)
               
               p.pixelDensity(2.5)
               p.noLoop()
               console.log(`🎨 P5.js setup completed, canvas ${canvasWidth}x${canvasHeight} fits container perfectly`)
             }
            
            // Bind the global draw function to this P5.js instance
            p.draw = () => {
              // Call the global draw function that's defined in doormat.js
              if (typeof (window as any).draw === 'function') {
                (window as any).draw()
              } else {
                console.log('⚠️ Global draw function not available yet, waiting...')
              }
            }
          })
            
            // Now expose the instance functions globally
            ;(window as any).randomSeed = p5Instance.randomSeed.bind(p5Instance)
            ;(window as any).noiseSeed = p5Instance.noiseSeed.bind(p5Instance)
            ;(window as any).noise = p5Instance.noise.bind(p5Instance) // Add missing noise function
            ;(window as any).blendMode = p5Instance.blendMode.bind(p5Instance) // Add missing blendMode function
            ;(window as any).saveCanvas = p5Instance.saveCanvas.bind(p5Instance)
            ;(window as any).createCanvas = p5Instance.createCanvas.bind(p5Instance)
            ;(window as any).pixelDensity = p5Instance.pixelDensity.bind(p5Instance) // Add missing pixelDensity function
            ;(window as any).background = p5Instance.background.bind(p5Instance)
            ;(window as any).fill = p5Instance.fill.bind(p5Instance)
            ;(window as any).noFill = p5Instance.noFill.bind(p5Instance)
            ;(window as any).stroke = p5Instance.stroke.bind(p5Instance)
            ;(window as any).noStroke = p5Instance.noStroke.bind(p5Instance)
            ;(window as any).strokeWeight = p5Instance.strokeWeight.bind(p5Instance) // Add missing strokeWeight
            ;(window as any).rect = p5Instance.rect.bind(p5Instance)
            ;(window as any).ellipse = p5Instance.ellipse.bind(p5Instance)
            ;(window as any).line = p5Instance.line.bind(p5Instance)
            ;(window as any).arc = p5Instance.arc.bind(p5Instance) // Add missing arc function
            ;(window as any).beginShape = p5Instance.beginShape.bind(p5Instance) // Add missing beginShape
            ;(window as any).vertex = p5Instance.vertex.bind(p5Instance) // Add missing vertex
            ;(window as any).endShape = p5Instance.endShape.bind(p5Instance) // Add missing endShape
            ;(window as any).text = p5Instance.text.bind(p5Instance)
            ;(window as any).textSize = p5Instance.textSize.bind(p5Instance)
            ;(window as any).textAlign = p5Instance.textAlign.bind(p5Instance)
            ;(window as any).push = p5Instance.push.bind(p5Instance)
            ;(window as any).pop = p5Instance.pop.bind(p5Instance)
            ;(window as any).translate = p5Instance.translate.bind(p5Instance)
            ;(window as any).rotate = p5Instance.rotate.bind(p5Instance)
            ;(window as any).scale = p5Instance.scale.bind(p5Instance)
            ;(window as any).random = p5Instance.random.bind(p5Instance)
            ;(window as any).map = p5Instance.map.bind(p5Instance)
            ;(window as any).constrain = p5Instance.constrain.bind(p5Instance)
            ;(window as any).dist = p5Instance.dist.bind(p5Instance)
            ;(window as any).sin = p5Instance.sin.bind(p5Instance)
            ;(window as any).cos = p5Instance.cos.bind(p5Instance)
            // Add missing utility functions
            ;(window as any).max = p5Instance.max.bind(p5Instance)
            ;(window as any).min = p5Instance.min.bind(p5Instance)
            ;(window as any).abs = p5Instance.abs.bind(p5Instance)
            ;(window as any).floor = p5Instance.floor.bind(p5Instance)
            ;(window as any).ceil = p5Instance.ceil.bind(p5Instance)
            ;(window as any).round = p5Instance.round.bind(p5Instance)
            ;(window as any).PI = p5Instance.PI
            ;(window as any).TWO_PI = p5Instance.TWO_PI
            ;(window as any).HALF_PI = p5Instance.HALF_PI
            // Add blend mode constants
            ;(window as any).MULTIPLY = p5Instance.MULTIPLY
            ;(window as any).ADD = p5Instance.ADD
            ;(window as any).SUBTRACT = p5Instance.SUBTRACT
            ;(window as any).DARKEST = p5Instance.DARKEST
            ;(window as any).LIGHTEST = p5Instance.LIGHTEST
            ;(window as any).DIFFERENCE = p5Instance.DIFFERENCE
            ;(window as any).EXCLUSION = p5Instance.EXCLUSION
            ;(window as any).OVERLAY = p5Instance.OVERLAY
            ;(window as any).SOFT_LIGHT = p5Instance.SOFT_LIGHT
            ;(window as any).HARD_LIGHT = p5Instance.HARD_LIGHT
            ;(window as any).COLOR_DODGE = p5Instance.COLOR_DODGE
            ;(window as any).COLOR_BURN = p5Instance.COLOR_BURN
            ;(window as any).SCREEN = p5Instance.SCREEN
            // Add color utility functions
            ;(window as any).color = p5Instance.color.bind(p5Instance)
            ;(window as any).red = p5Instance.red.bind(p5Instance)
            ;(window as any).green = p5Instance.green.bind(p5Instance)
            ;(window as any).blue = p5Instance.blue.bind(p5Instance)
            ;(window as any).lerpColor = p5Instance.lerpColor.bind(p5Instance)
            ;(window as any).lerp = p5Instance.lerp.bind(p5Instance) // Add missing lerp function
            // Add drawing control functions
            ;(window as any).redraw = p5Instance.redraw.bind(p5Instance)
            ;(window as any).loop = p5Instance.loop.bind(p5Instance)
            ;(window as any).noLoop = p5Instance.noLoop.bind(p5Instance)
            ;(window as any).frameRate = p5Instance.frameRate.bind(p5Instance)
            // Add utility functions
            ;(window as any).width = p5Instance.width
            ;(window as any).height = p5Instance.height
            ;(window as any).windowWidth = p5Instance.windowWidth
            ;(window as any).windowHeight = p5Instance.windowHeight
            console.log('✅ All P5.js functions made globally available via instance')
            resolve()
          } catch (error) {
            console.error('❌ Failed to create P5.js instance:', error)
            resolve()
          }
        } else {
          console.log('❌ P5.js loaded but functions not accessible')
          resolve()
        }
      }
      script.onerror = () => {
        console.error('❌ Failed to load P5.js from CDN')
        resolve() // Continue anyway
      }
      
      // Append to head like original HTML
      document.head.appendChild(script)
    })
  }

  // Load doormat scripts sequentially
  const loadDoormatScripts = async () => {
      const scripts = [
      { src: '/lib/doormat/doormat-config.js', id: 'doormat-config' },
      { src: '/lib/doormat/color-palettes.js', id: 'color-palettes' },
      { src: '/lib/doormat/character-map.js', id: 'character-map' },
      { src: '/lib/doormat/trait-calculator.js', id: 'trait-calculator' },
      { src: '/lib/doormat/doormat.js', id: 'doormat' },
      { src: '/lib/doormat/html-interface.js', id: 'html-interface' }
    ]

    for (const script of scripts) {
      if (scriptsLoadedRef.current.has(script.id) || document.getElementById(script.id)) {
        console.log(`📜 Script ${script.id} already loaded, skipping`)
        continue
      }

      await new Promise<void>((resolve) => {
        const scriptElement = document.createElement('script')
        scriptElement.src = script.src
        scriptElement.id = script.id
        scriptElement.onload = () => {
          scriptsLoadedRef.current.add(script.id)
          console.log(`✅ Loaded script: ${script.id}`)
          resolve()
        }
        scriptElement.onerror = () => {
          console.error(`❌ Failed to load script: ${script.id}`)
          resolve() // Continue with other scripts
        }
        document.head.appendChild(scriptElement)
      })
    }
  }

  // Initialize the generator
  const init = async () => {
    console.log('🚀 Starting initialization...')
    
    try {
      // Load P5.js first
      await loadP5()
      console.log('✅ P5.js loaded')
      
      // Load doormat scripts
      await loadDoormatScripts()
      console.log('✅ Doormat scripts loaded')
      
      // Wait a bit for scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if key functions are available
      if (typeof (window as any).generateDoormat === 'function' && typeof (window as any).draw === 'function') {
        console.log('✅ generateDoormat function available')
        
        // Generate initial doormat
        ;(window as any).generateDoormat(currentSeed)
        
        // Update UI after generation
      setTimeout(() => {
          updatePaletteDisplay()
          updateTraitsDisplay()
          setIsLoaded(true)
      }, 500)
        
      } else {
        console.error('❌ Required functions not available:')
        console.error('  - generateDoormat:', typeof (window as any).generateDoormat)
        console.error('  - draw:', typeof (window as any).draw)
        console.error('  - Available global functions:', Object.keys(window).filter(key => typeof (window as any)[key] === 'function'))
        setIsLoaded(true) // Show UI anyway
      }
      
    } catch (error) {
      console.error('❌ Initialization failed:', error)
      setIsLoaded(true) // Show UI anyway
    }
  }

  // Update palette display
  const updatePaletteDisplay = () => {
    if (typeof (window as any).getCurrentPalette === 'function') {
      const currentPalette = (window as any).getCurrentPalette()
      if (currentPalette) {
        setPalette(currentPalette)
        console.log('🎨 Palette updated:', currentPalette)
      }
    }
  }

  // Update traits display
  const updateTraitsDisplay = () => {
    if (typeof (window as any).calculateTraits === 'function') {
      const currentTraits = (window as any).calculateTraits()
      if (currentTraits) {
        setTraits(currentTraits)
        console.log('🏷️ Traits updated:', currentTraits)
      }
    }
  }

  // Generate new doormat
  const generateNew = () => {
    const seed = Math.floor(Math.random() * 10000)
    setCurrentSeed(seed)
    
    if (typeof (window as any).generateDoormat === 'function' && typeof (window as any).draw === 'function') {
      console.log('🎨 Generating new doormat with seed:', seed)
      ;(window as any).generateDoormat(seed)
      
      // Update UI after generation
      setTimeout(() => {
        updatePaletteDisplay()
        updateTraitsDisplay()
      }, 500)
    } else {
      console.error('❌ Cannot generate: required functions not available')
      console.error('  - generateDoormat:', typeof (window as any).generateDoormat)
      console.error('  - draw:', typeof (window as any).draw)
    }
  }

  // Generate from seed
  const generateFromSeed = () => {
    if (typeof (window as any).generateDoormat === 'function' && typeof (window as any).draw === 'function') {
      console.log('🎨 Generating doormat from seed:', currentSeed)
      ;(window as any).generateDoormat(currentSeed)
      
      // Update UI after generation
      setTimeout(() => {
        updatePaletteDisplay()
        updateTraitsDisplay()
      }, 500)
    } else {
      console.error('❌ Cannot generate: required functions not available')
      console.error('  - generateDoormat:', typeof (window as any).generateDoormat)
      console.error('  - draw:', typeof (window as any).draw)
    }
  }

  // Save doormat
  const saveDoormat = () => {
    if (typeof (window as any).saveCanvas === 'function') {
      ;(window as any).saveCanvas(`doormat-${Date.now()}`, 'png')
    } else {
      alert('Save function not available')
    }
  }

  // Add text row
  const addTextRow = () => {
    if (currentRowCount < 5) {
      setCurrentRowCount(prev => prev + 1)
      setTextInputs(prev => [...prev, ''])
    }
  }

  // Remove text row
  const removeTextRow = (index: number) => {
    if (index > 0 && currentRowCount > 1) {
      setCurrentRowCount(prev => prev - 1)
      setTextInputs(prev => prev.filter((_, i) => i !== index))
    }
  }

  // Update text input
  const updateTextInput = (index: number, value: string) => {
    const newInputs = [...textInputs]
    newInputs[index] = value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 11)
    setTextInputs(newInputs)
  }

  // Add text to doormat
  const addTextToDoormat = () => {
    const validTexts = textInputs.filter(text => text.trim().length > 0)
    
    if (validTexts.length > 0 && typeof (window as any).addTextToDoormatInSketch === 'function') {
      ;(window as any).addTextToDoormatInSketch(validTexts)
      console.log('📝 Text added to doormat:', validTexts)
    }
  }

  // Clear text
  const clearText = () => {
    setTextInputs([''])
    setCurrentRowCount(1)
    
    if (typeof (window as any).clearTextFromDoormat === 'function') {
      ;(window as any).clearTextFromDoormat()
    }
  }

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'Legendary': return '#ff6b35'
      case 'Epic': return '#9b59b6'
      case 'Rare': return '#3498db'
      case 'Uncommon': return '#2ecc71'
      case 'Common': return '#95a5a6'
      default: return '#666'
    }
  }

  // Initialize on mount
  useEffect(() => {
    init()
  }, [])

  // Check if P5.js canvas is visible
  useEffect(() => {
    if (isLoaded) {
      // Wait a bit for P5.js to create canvas, then check
      const timer = setTimeout(() => {
        const canvas = document.querySelector('canvas')
        if (canvas) {
          console.log('🎨 P5.js canvas found:', canvas)
          console.log('Canvas dimensions:', canvas.width, 'x', canvas.height)
          console.log('Canvas container:', canvasContainerRef.current)
          
          // Move canvas to our container if it's not there
          if (canvasContainerRef.current && !canvasContainerRef.current.contains(canvas)) {
            console.log('🔄 Moving P5.js canvas to our container')
            canvasContainerRef.current.appendChild(canvas)
          }
          
          // Check if canvas dimensions are correct
          if (canvas.width === 200 && canvas.height === 200) {
            console.log('⚠️ Canvas has default dimensions, trying to fix...')
            // Try to trigger P5.js setup function
            if (typeof (window as any).setup === 'function') {
              console.log('🔄 Calling P5.js setup function')
              ;(window as any).setup()
            }
          }
        } else {
          console.log('❌ No P5.js canvas found in DOM')
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navigation />
      <div className="max-w-[1800px] mx-auto px-4 pt-24">
      {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-amber-800 mb-4">
            🎨 Generative Rug Generator
          </h1>
          <p className="text-lg text-amber-700 max-w-2xl mx-auto">
            Create unique, on-chain generative art rugs with custom text embedding. 
            Each generation creates unique patterns, colors, and textures.
          </p>
        </motion.div>

        {/* Old-School Terminal Layout - Art on Top, Terminal on Bottom */}
        <div className="space-y-0">
          {/* Canvas Display - Full Width at Top */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full mb-0"
          >
            <div className="bg-black border-b border-green-500/50 p-4">
              <h2 className="text-lg font-bold text-green-400 text-center font-mono mb-6">🎨 RUG GENERATOR v1.0</h2>
              
                            {/* Old-School CRT Monitor Box */}
              <div className="relative mx-auto w-full max-w-7xl">
                {/* Monitor Bezel - Yellowed Plastic */}
                <div className="bg-amber-100 border-6 border-amber-200 rounded-t-2xl rounded-b-xl p-8 shadow-2xl">
                  {/* Monitor Screen Area */}
                  <div className="bg-gray-800 rounded-lg p-2 border-3 border-gray-700 shadow-inner">
                    {/* CRT Screen with Scan Lines Effect */}
                    <div className="bg-black rounded-lg p-1 border-2 border-gray-600 relative overflow-hidden">
                      {/* Scan Lines Overlay */}
                      <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
                        zIndex: 1
                      }}></div>
                      
                      {/* Canvas Container - P5.js will control dimensions */}
                      <div 
                        ref={canvasContainerRef}
                        id="canvas-container"
                        className="bg-gray-900 rounded-lg flex items-center justify-center relative mx-auto border border-green-500/30"
                        style={{ 
                          overflow: 'hidden',      // Prevent canvas overflow
                          boxShadow: '0 0 20px rgba(0, 255, 0, 0.1)',
                          position: 'relative',    // Ensure proper positioning context for loading overlay
                          zIndex: 2               // Above scan lines
                        }}
                      >
                        {!isLoaded && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-green-400 bg-gray-900 rounded-lg">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mb-4"
                            />
                            <div className="text-lg font-medium font-mono">Loading P5.js...</div>
                            <div className="text-sm text-green-500 mt-2 font-mono">
                              Initializing rug generator
                            </div>
                          </div>
                        )}
                      </div>
                </div>
              </div>

                  {/* Monitor Base - Taller Frame with Logo */}
                  <div className="bg-amber-100 mt-4 pt-6 pb-8 rounded-b-xl border-t-6 border-amber-200">
                    {/* Rugpull Computer Logo and Text */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-20 h-20 bg-white rounded-full p-2 shadow-lg border-2 border-amber-300">
                        <img 
                          src="/rugpull_computer_logo.png" 
                          alt="Rugpull Computer Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-amber-800" style={{ fontFamily: 'Apple Garamond, Garamond, serif' }}>
                          Rugpull Computer
                        </h3>
                        <p className="text-xs text-amber-700 mt-1" style={{ fontFamily: 'Apple Garamond, Garamond, serif' }}>
                          Generative Art Terminal
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Terminal Interface - Fixed at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <div className="bg-black text-green-400 p-6 font-mono border-t-2 border-green-500">
              {/* Terminal Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-green-500/30">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">$</span>
                  <span className="text-green-300">rug-generator</span>
                  <span className="text-green-500">&gt;</span>
                </div>
                <div className="text-sm text-green-500">
                  {isLoaded ? 'READY' : 'LOADING...'}
                  </div>
              </div>
              
              {/* Simple Terminal Commands */}
              <div className="space-y-4">
                {/* Generate and Save */}
                <div className="flex gap-3">
                  <button
                    onClick={generateNew}
                    disabled={!isLoaded}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-black font-bold px-6 py-3 rounded font-mono transition-colors border border-green-400"
                  >
                    <Shuffle className="w-5 h-5 mr-2" />
                    GENERATE
                  </button>
                  <button
                    onClick={saveDoormat}
                    disabled={!isLoaded}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-3 rounded font-mono transition-colors border border-blue-400"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    SAVE
                  </button>
                </div>
                
                {/* Text Input */}
                <div className="space-y-3">
                  <div className="text-green-300 text-sm">Add text to rug (max 11 chars per row):</div>
                  {textInputs.map((text, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-green-400 font-mono">$</span>
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => updateTextInput(index, e.target.value)}
                        placeholder={`text_${index + 1}`}
                        maxLength={11}
                        className="flex-1 px-3 py-2 bg-gray-900 border border-green-500/50 text-green-400 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                      />
                      {index > 0 && (
                        <button
                          onClick={() => removeTextRow(index)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-mono transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Text Control Buttons */}
                  <div className="flex gap-3 pt-2">
                    {currentRowCount < 5 && (
                      <button
                        onClick={addTextRow}
                        className="bg-green-600 hover:bg-green-700 text-black font-bold px-4 py-2 rounded font-mono transition-colors border border-green-400"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        ADD ROW
                      </button>
                    )}
                    <button
                      onClick={addTextToDoormat}
                      disabled={!isLoaded}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-4 py-2 rounded font-mono transition-colors border border-purple-400"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      EMBED TEXT
                    </button>
                    <button
                      onClick={clearText}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-mono transition-colors border border-gray-400"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>


        {/* Hidden elements for P5.js compatibility */}
        <div style={{ display: 'none' }}>
          <div id="paletteName"></div>
          <div id="colorSwatches"></div>
          <div id="traitsContainer"></div>
          <div id="additionalRows"></div>
          <button id="toggleRowsBtn"></button>
        </div>
      </div>
    </div>
  )
}
