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
              // Create canvas with proper dimensions
              let canvas = p.createCanvas(1200 + (30 * 4), 800 + (30 * 4)) // doormatHeight + fringe, doormatWidth + fringe
              canvas.parent('canvas-container')
              
              // Set canvas to exact dimensions to match container
              canvas.style.width = '1320px'
              canvas.style.height = '920px'
              
              p.pixelDensity(2.5)
              p.noLoop()
              console.log('🎨 P5.js setup completed, canvas created with proper dimensions')
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

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50">
              <h2 className="text-xl font-bold text-amber-800 mb-4">🎛️ Controls</h2>
              
              {/* Generation Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                  <button
                    onClick={generateNew}
                    disabled={!isLoaded}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Generate New
                  </button>
                  <button
                    onClick={saveDoormat}
                    disabled={!isLoaded}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={currentSeed}
                    onChange={(e) => setCurrentSeed(parseInt(e.target.value) || 42)}
                    className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Seed"
                  />
                  <button
                    onClick={generateFromSeed}
                    disabled={!isLoaded}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Use Seed
                  </button>
                </div>
              </div>

              {/* Text Input Controls */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-amber-800">📝 Text Embedding</h3>
                
                {textInputs.map((text, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => updateTextInput(index, e.target.value)}
                      placeholder={`Row ${index + 1} (A-Z, 0-9, space)`}
                      maxLength={11}
                      className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    {index > 0 && (
                      <button
                        onClick={() => removeTextRow(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-2">
                  {currentRowCount < 5 && (
                    <button
                      onClick={addTextRow}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Row
                    </button>
                  )}
                  <button
                    onClick={addTextToDoormat}
                    disabled={!isLoaded}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Add Text
                  </button>
                  <button
                    onClick={clearText}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-sm text-amber-700 space-y-2">
                <p><strong>Instructions:</strong></p>
                <p>• Click "Generate New" for random patterns</p>
                <p>• Enter a seed for reproducible results</p>
                <p>• Add text (max 11 chars, A-Z, 0-9, space)</p>
                <p>• Click "Save" to download your rug</p>
              </div>
            </div>
          </motion.div>

          {/* Canvas and Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50">
              <h2 className="text-xl font-bold text-amber-800 mb-4">🎨 Your Onchain Rug</h2>
              
              {/* Canvas Container - Match P5.js canvas dimensions exactly */}
              <div 
                ref={canvasContainerRef}
                id="canvas-container"
                className="bg-gray-100 rounded-lg flex items-center justify-center relative mx-auto"
                style={{ 
                  width: '1320px',  // Fixed width to match P5.js canvas exactly
                  height: '920px',   // Fixed height to match P5.js canvas exactly
                  maxWidth: '100%',  // Responsive constraint
                  overflow: 'hidden', // Prevent canvas overflow
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  border: '1px solid #e5e7eb',
                  position: 'relative' // Ensure proper positioning context
                }}
              >
                {!isLoaded && (
                  <div className="text-center text-amber-700">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <div>Loading P5.js and doormat generator...</div>
                    <div className="text-sm text-amber-600 mt-2">
                      This may take a few seconds
                    </div>
                  </div>
                )}
                
                {/* Debug info */}
                {isLoaded && (
                  <div className="text-center text-amber-700 text-sm">
                    <div>✅ P5.js loaded and ready</div>
                    <div>Canvas should appear above</div>
                    <div>Check browser console for any errors</div>
                  </div>
                )}
              </div>
              
              {/* Palette & Traits Info */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">Current Palette</h3>
                  <div className="text-amber-700 mb-2">{palette?.name || 'Loading...'}</div>
                  <div className="flex gap-2 flex-wrap">
                    {palette?.colors?.map((color: string, index: number) => (
                      <motion.div
                        key={index}
                        className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                        style={{ backgroundColor: color }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigator.clipboard.writeText(color)}
                        title={`Click to copy: ${color}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">NFT Traits</h3>
                  <div className="space-y-1 text-sm">
                    {traits ? (
                      <>
                        <div className="flex justify-between">
                          <span>Text Lines:</span>
                          <span className="font-medium">{traits.textLines || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Characters:</span>
                          <span className="font-medium">{traits.totalCharacters || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Palette:</span>
                          <span className="font-medium">{traits.paletteName || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rarity:</span>
                          <span 
                            className="font-bold text-xs uppercase"
                            style={{ color: getRarityColor(traits.paletteRarity || 'Common') }}
                          >
                            {traits.paletteRarity || 'Common'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-amber-600">Loading traits...</div>
                    )}
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
