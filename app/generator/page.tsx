"use client"

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Download, FileText, Plus, X } from 'lucide-react'

export default function GeneratorPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSeed, setCurrentSeed] = useState(42)
  const [textInputs, setTextInputs] = useState([''])
  const [currentRowCount, setCurrentRowCount] = useState(1)
  const [palette, setPalette] = useState<any>(null)
  const [traits, setTraits] = useState<any>(null)
  
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const scriptsLoadedRef = useRef<Set<string>>(new Set())

  // Load P5.js and ensure it's properly available globally
  const loadP5 = () => {
    return new Promise<void>((resolve) => {
      if ((window as any).p5 && typeof (window as any).randomSeed === 'function') {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
      script.onload = () => {
        // Wait for P5.js to be fully initialized
        const checkP5 = () => {
          if ((window as any).p5 && typeof (window as any).randomSeed === 'function') {
            console.log('✅ P5.js loaded successfully with randomSeed available')
            resolve()
          } else if ((window as any).p5 && typeof (window as any).p5.randomSeed === 'function') {
            console.log('✅ P5.js loaded with p5.randomSeed available')
            // Make randomSeed globally available
            ;(window as any).randomSeed = (window as any).p5.randomSeed
            ;(window as any).noiseSeed = (window as any).p5.noiseSeed
            ;(window as any).saveCanvas = (window as any).p5.saveCanvas
            resolve()
          } else if (typeof (window as any).randomSeed === 'function') {
            console.log('✅ randomSeed already available globally')
            resolve()
          } else {
            console.log('⏳ P5.js loading, waiting for randomSeed...')
            setTimeout(checkP5, 100)
          }
        }
        
        // Start checking after a short delay
        setTimeout(checkP5, 100)
      }
      
      script.onerror = () => {
        console.error('❌ Failed to load P5.js from CDN, creating fallback')
        // Create a basic fallback P5.js environment
        ;(window as any).p5 = {}
        ;(window as any).randomSeed = (seed: number) => {
          console.log('Fallback randomSeed called with:', seed)
        }
        ;(window as any).noiseSeed = (seed: number) => {
          console.log('Fallback noiseSeed called with:', seed)
        }
        ;(window as any).saveCanvas = (filename: string, format: string) => {
          console.log('Fallback saveCanvas called:', filename, format)
          alert('Canvas save not available in fallback mode')
        }
        resolve()
      }
      
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
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check if key functions are available
      if (typeof (window as any).generateDoormat === 'function') {
        console.log('✅ generateDoormat function available')
        
        // Generate initial doormat
        ;(window as any).generateDoormat(currentSeed)
        
        // Update UI after generation
        setTimeout(() => {
          updatePaletteDisplay()
          updateTraitsDisplay()
          setIsLoaded(true)
        }, 1000)
        
      } else {
        console.error('❌ generateDoormat function not available')
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
    
    if (typeof (window as any).generateDoormat === 'function') {
      ;(window as any).generateDoormat(seed)
      
      // Update UI after generation
      setTimeout(() => {
        updatePaletteDisplay()
        updateTraitsDisplay()
      }, 500)
    }
  }

  // Generate from seed
  const generateFromSeed = () => {
    if (typeof (window as any).generateDoormat === 'function') {
      ;(window as any).generateDoormat(currentSeed)
      
      // Update UI after generation
      setTimeout(() => {
        updatePaletteDisplay()
        updateTraitsDisplay()
      }, 500)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
            className="lg:col-span-2"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50">
              <h2 className="text-xl font-bold text-amber-800 mb-4">🎨 Your Onchain Rug</h2>
              
              {/* Canvas Container */}
              <div 
                ref={canvasContainerRef}
                id="canvas-container"
                className="w-full bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{ 
                  width: '100%',
                  maxWidth: '1320px',
                  height: '600px',
                  margin: '0 auto'
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
