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

  useEffect(() => {
    // Load P5.js first and ensure it's fully loaded
    const loadP5 = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).p5 && typeof (window as any).randomSeed === 'function') {
          resolve()
          return
        }
        
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
        script.onload = () => {
          // Wait for P5.js to be fully initialized and available globally
          const checkP5 = () => {
            // Check multiple ways P5.js might be available
            if ((window as any).p5 && typeof (window as any).randomSeed === 'function') {
              console.log('P5.js loaded successfully with randomSeed available')
              resolve()
            } else if ((window as any).p5 && typeof (window as any).p5.randomSeed === 'function') {
              console.log('P5.js loaded with p5.randomSeed available')
              // Make randomSeed globally available
              ;(window as any).randomSeed = (window as any).p5.randomSeed
              resolve()
            } else if (typeof (window as any).randomSeed === 'function') {
              console.log('randomSeed already available globally')
              resolve()
            } else {
              console.log('P5.js loading, waiting for randomSeed...')
              // Add a timeout to prevent infinite waiting
              if (Date.now() - startTime > 10000) { // 10 second timeout
                console.error('P5.js loading timeout, proceeding anyway')
                resolve()
                return
              }
              setTimeout(checkP5, 100)
            }
          }
          
          const startTime = Date.now()
          checkP5()
        }
        script.onerror = () => {
          console.error('Failed to load P5.js from CDN, creating fallback')
          // Create a basic fallback P5.js environment
          ;(window as any).p5 = {}
          ;(window as any).randomSeed = (seed: number) => {
            // Simple fallback random seed implementation
            ;(Math as any).seedrandom = (Math as any).seedrandom || function(seed: number) {
              const x = Math.sin(seed) * 10000
              return x - Math.floor(x)
            }
          }
          ;(window as any).noiseSeed = (seed: number) => {
            // Simple fallback noise seed
            console.log('Noise seed set to:', seed)
          }
          ;(window as any).saveCanvas = (filename: string, format: string) => {
            console.log('Save canvas called:', filename, format)
            alert('Canvas save not available in fallback mode')
          }
          resolve()
        }
        document.head.appendChild(script)
      })
    }

    // Load doormat scripts only once
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
        // Check if script is already loaded
        if (scriptsLoadedRef.current.has(script.id) || document.getElementById(script.id)) {
          console.log(`Script ${script.id} already loaded, skipping`)
          continue
        }

        await new Promise<void>((resolve) => {
          const scriptElement = document.createElement('script')
          scriptElement.src = script.src
          scriptElement.id = script.id
          scriptElement.onload = () => {
            scriptsLoadedRef.current.add(script.id)
            console.log(`Loaded script: ${script.id}`)
            resolve()
          }
          scriptElement.onerror = () => {
            console.error(`Failed to load script: ${script.id}`)
            resolve() // Continue with other scripts
          }
          document.head.appendChild(scriptElement)
        })
      }
    }

    // Setup global functions for React integration
    const setupGlobalFunctions = () => {
      // Update palette display function
      ;(window as any).updatePaletteDisplay = (paletteName: string, colors: string[]) => {
        setPalette({ name: paletteName, colors })
      }

      // Update traits display function
      ;(window as any).updateTraitsFromSketch = () => {
        if (typeof (window as any).calculateTraits === 'function') {
          const calculatedTraits = (window as any).calculateTraits()
          setTraits(calculatedTraits)
        }
      }

      // Text input validation
      ;(window as any).validateTextInput = (input: HTMLInputElement) => {
        input.value = input.value.replace(/[^A-Za-z0-9\s]/g, '')
        input.value = input.value.toUpperCase()
      }
    }

    // Initialize everything
    const init = async () => {
      try {
        console.log('Starting initialization...')
        await loadP5()
        console.log('P5.js loaded, loading doormat scripts...')
        await loadDoormatScripts()
        console.log('All scripts loaded, setting up global functions...')
        setupGlobalFunctions()
        
        // Wait for everything to be fully loaded, then initialize
        setTimeout(() => {
          console.log('Checking if everything is ready...')
          console.log('P5.js available:', !!(window as any).p5)
          console.log('randomSeed available:', typeof (window as any).randomSeed)
          console.log('generateFromSeed available:', typeof (window as any).generateFromSeed)
          
          if ((window as any).p5 && typeof (window as any).randomSeed === 'function' && typeof (window as any).generateFromSeed === 'function') {
            console.log('All dependencies loaded, initializing generator...')
            try {
              (window as any).generateFromSeed()
            } catch (error) {
              console.error('Error calling generateFromSeed:', error)
            }
            
            // Update traits after initial generation
            setTimeout(() => {
              if (typeof (window as any).updateTraitsFromSketch === 'function') {
                try {
                  (window as any).updateTraitsFromSketch()
                } catch (error) {
                  console.error('Error calling updateTraitsFromSketch:', error)
                }
              }
            }, 300)
            
            setIsLoaded(true)
          } else {
            console.warn('Dependencies not fully loaded, will try again...')
            // Try again after another delay
            setTimeout(() => {
              if ((window as any).p5 && typeof (window as any).randomSeed === 'function' && typeof (window as any).generateFromSeed === 'function') {
                console.log('Second attempt: initializing generator...')
                try {
                  (window as any).generateFromSeed()
                } catch (error) {
                  console.error('Error calling generateFromSeed on second attempt:', error)
                }
                setIsLoaded(true)
              } else {
                console.error('Failed to load dependencies after multiple attempts')
                console.log('Final check - P5.js:', !!(window as any).p5)
                console.log('Final check - randomSeed:', typeof (window as any).randomSeed)
                console.log('Final check - generateFromSeed:', typeof (window as any).generateFromSeed)
                setIsLoaded(true) // Show UI anyway
              }
            }, 2000)
          }
        }, 1000)
      } catch (error) {
        console.error('Initialization failed:', error)
        setIsLoaded(true) // Show UI anyway
      }
    }

    init()
  }, [])

  // React functions that call the P5.js functions
  const generateNew = () => {
    // Check if P5.js is loaded
    if (!(window as any).p5 || typeof (window as any).randomSeed !== 'function') {
      console.warn('P5.js not loaded yet, skipping generation')
      return
    }

    const seed = Math.floor(Math.random() * 10000)
    setCurrentSeed(seed)
    
    if (typeof (window as any).generateDoormat === 'function') {
      (window as any).generateDoormat(seed)
      
      // Update palette and traits after generation
      setTimeout(() => {
        if (typeof (window as any).updateTraitsFromSketch === 'function') {
          (window as any).updateTraitsFromSketch()
        }
      }, 200)
    }
  }

  const generateFromSeed = () => {
    // Check if P5.js is loaded
    if (!(window as any).p5 || typeof (window as any).randomSeed !== 'function') {
      console.warn('P5.js not loaded yet, skipping generation')
      return
    }

    if (typeof (window as any).generateDoormat === 'function') {
      (window as any).generateDoormat(currentSeed)
      
      // Update palette and traits after generation
      setTimeout(() => {
        if (typeof (window as any).updateTraitsFromSketch === 'function') {
          (window as any).updateTraitsFromSketch()
        }
      }, 200)
    }
  }

  const saveDoormat = () => {
    // Check if P5.js is loaded
    if (!(window as any).p5 || typeof (window as any).saveCanvas !== 'function') {
      console.warn('P5.js or saveCanvas not available')
      return
    }
    
    (window as any).saveCanvas('onchain-rug-' + Date.now(), 'png')
  }

  const addTextToDoormat = () => {
    const textRows = textInputs.filter(text => text.trim() !== '')
    if (textRows.length > 0 && typeof (window as any).addTextToDoormatInSketch === 'function') {
      (window as any).addTextToDoormatInSketch(textRows)
    }
  }

  const addTextRow = () => {
    if (textInputs.length < 5) {
      setTextInputs([...textInputs, ''])
      setCurrentRowCount(prev => prev + 1)
    }
  }

  const removeTextRow = (index: number) => {
    if (textInputs.length > 1) {
      const newInputs = textInputs.filter((_, i) => i !== index)
      setTextInputs(newInputs)
      setCurrentRowCount(prev => prev - 1)
    }
  }

  const updateTextInput = (index: number, value: string) => {
    const newInputs = [...textInputs]
    newInputs[index] = value.toUpperCase().replace(/[^A-Z0-9\s]/g, '').slice(0, 11)
    setTextInputs(newInputs)
  }

  const clearText = () => {
    setTextInputs([''])
    setCurrentRowCount(1)
    
    if (typeof (window as any).clearTextFromDoormat === 'function') {
      (window as any).clearTextFromDoormat()
    }
  }

  const exportNFT = () => {
    // Check if P5.js is loaded
    if (!(window as any).p5) {
      console.warn('P5.js not loaded yet, cannot export NFT')
      return
    }
    
    if (typeof (window as any).exportNFT === 'function') {
      (window as any).exportNFT()
    }
  }

  // Helper function to get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return '#ff6b35'
      case 'Epic': return '#9b59b6'
      case 'Rare': return '#3498db'
      case 'Uncommon': return '#2ecc71'
      case 'Common': return '#95a5a6'
      default: return '#666'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            🧶 Onchain Rug Generator
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50 sticky top-24">
              <h2 className="text-xl font-bold text-amber-800 mb-6">🎛️ Controls</h2>
              
              {/* Seed Controls */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Seed Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={currentSeed}
                    onChange={(e) => setCurrentSeed(parseInt(e.target.value) || 42)}
                    className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="42"
                  />
                  <motion.button
                    onClick={generateFromSeed}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FileText className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                onClick={generateNew}
                disabled={!isLoaded}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 mb-6 flex items-center justify-center gap-2 ${
                  isLoaded 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                whileHover={isLoaded ? { scale: 1.02 } : {}}
                whileTap={isLoaded ? { scale: 0.98 } : {}}
              >
                <Shuffle className="w-5 h-5" />
                {isLoaded ? 'Generate New Rug' : 'Loading...'}
              </motion.button>

              {/* Text Inputs */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Custom Text (Max 11 chars each)
                </label>
                {textInputs.map((text, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => updateTextInput(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder={`Row ${index + 1}`}
                      maxLength={11}
                    />
                    {textInputs.length > 1 && (
                      <motion.button
                        onClick={() => removeTextRow(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-2 mt-3">
                  {textInputs.length < 5 && (
                    <motion.button
                      onClick={addTextRow}
                      className="flex-1 px-3 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors flex items-center justify-center gap-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Row
                    </motion.button>
                  )}
                  <motion.button
                    onClick={addTextToDoormat}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Apply Text
                  </motion.button>
                  <motion.button
                    onClick={clearText}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear
                  </motion.button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  onClick={saveDoormat}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  Save Image
                </motion.button>
                
                <motion.button
                  onClick={exportNFT}
                  className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Export NFT
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Canvas Area */}
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
