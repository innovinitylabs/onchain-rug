'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Shuffle, Save, Wand2, Plus, X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function GeneratorPage() {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSeed, setCurrentSeed] = useState(42)
  const [textInputs, setTextInputs] = useState([''])
  const [palette, setPalette] = useState<any>(null)
  const [traits, setTraits] = useState<any>(null)

  useEffect(() => {
    // Load P5.js first
    const loadP5 = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).p5) {
          resolve()
          return
        }
        
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
        script.onload = () => resolve()
        document.head.appendChild(script)
      })
    }

    // Load doormat scripts in order
    const loadDoormatScripts = async () => {
      const scripts = [
        '/lib/doormat/doormat-config.js',
        '/lib/doormat/color-palettes.js',
        '/lib/doormat/character-map.js',
        '/lib/doormat/trait-calculator.js',
        '/lib/doormat/doormat.js',
        '/lib/doormat/html-interface.js'
      ]

      for (const src of scripts) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = src
          script.onload = () => resolve()
          script.onerror = () => resolve() // Continue even if one script fails
          document.head.appendChild(script)
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
        // Remove any characters that are not A-Z, 0-9, or space
        input.value = input.value.replace(/[^A-Za-z0-9\s]/g, '')
        // Convert to uppercase
        input.value = input.value.toUpperCase()
      }

      setIsLoaded(true)
    }

    // Initialize everything
    const init = async () => {
      await loadP5()
      await loadDoormatScripts()
      
      setupGlobalFunctions()
      
      // Wait a bit for everything to load, then initialize
      setTimeout(() => {
        if (typeof (window as any).generateFromSeed === 'function') {
          (window as any).generateFromSeed()
          
          // Update palette and traits after initial generation
          setTimeout(() => {
            if (typeof (window as any).getCurrentPalette === 'function') {
              const currentPalette = (window as any).getCurrentPalette()
              if (currentPalette) {
                setPalette(currentPalette)
              }
            }
            if (typeof (window as any).updateTraitsFromSketch === 'function') {
              (window as any).updateTraitsFromSketch()
            }
          }, 200)
        }
      }, 1000)
    }

    init()
  }, [])

  const generateNew = () => {
    const newSeed = Math.floor(Math.random() * 10000)
    setCurrentSeed(newSeed)
    
    if (typeof (window as any).generateDoormat === 'function') {
      (window as any).generateDoormat(newSeed)
      
      // Update the seed input in the DOM
      const seedInput = document.getElementById('seedInput') as HTMLInputElement
      if (seedInput) seedInput.value = newSeed.toString()
      
      // Update palette and traits after generation
      setTimeout(() => {
        if (typeof (window as any).getCurrentPalette === 'function') {
          const currentPalette = (window as any).getCurrentPalette()
          if (currentPalette) {
            setPalette(currentPalette)
          }
        }
        if (typeof (window as any).updateTraitsFromSketch === 'function') {
          (window as any).updateTraitsFromSketch()
        }
      }, 200)
    }
  }

  const generateFromSeed = () => {
    if (typeof (window as any).generateDoormat === 'function') {
      (window as any).generateDoormat(currentSeed)
      
      // Update the seed input in the DOM
      const seedInput = document.getElementById('seedInput') as HTMLInputElement
      if (seedInput) seedInput.value = currentSeed.toString()
      
      // Update palette and traits after generation
      setTimeout(() => {
        if (typeof (window as any).getCurrentPalette === 'function') {
          const currentPalette = (window as any).getCurrentPalette()
          if (currentPalette) {
            setPalette(currentPalette)
          }
        }
        if (typeof (window as any).updateTraitsFromSketch === 'function') {
          (window as any).updateTraitsFromSketch()
        }
      }, 200)
    }
  }

  const addTextRow = () => {
    if (textInputs.length < 5) {
      setTextInputs([...textInputs, ''])
    }
  }

  const removeTextRow = (index: number) => {
    if (textInputs.length > 1) {
      const newInputs = textInputs.filter((_, i) => i !== index)
      setTextInputs(newInputs)
    }
  }

  const updateTextInput = (index: number, value: string) => {
    const newInputs = [...textInputs]
    newInputs[index] = value.toUpperCase().replace(/[^A-Z0-9\s]/g, '').slice(0, 11)
    setTextInputs(newInputs)
    
    // Update the DOM input for P5.js compatibility
    const domInput = document.getElementById(`textInput${index + 1}`) as HTMLInputElement
    if (domInput) domInput.value = newInputs[index]
  }

  const addText = () => {
    const textRows = textInputs.filter(text => text.trim() !== '')
    if (typeof (window as any).addTextToDoormatInSketch === 'function') {
      (window as any).addTextToDoormatInSketch(textRows)
    }
  }

  const clearText = () => {
    setTextInputs([''])
    if (typeof (window as any).clearTextFromDoormat === 'function') {
      (window as any).clearTextFromDoormat()
    }
  }

  const saveDoormat = () => {
    if (typeof (window as any).saveCanvas === 'function') {
      (window as any).saveCanvas('onchain-rug-' + Date.now(), 'png')
    }
  }

  const exportNFT = () => {
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            🧶 Onchain Rug Generator
          </h1>
          
          <div className="w-24" /> {/* Spacer */}
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
                    id="seedInput"
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
                    <Wand2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                onClick={generateNew}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200 mb-6 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Shuffle className="w-5 h-5" />
                Generate New Rug
              </motion.button>

              {/* Text Inputs */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Custom Text (Max 11 chars each)
                </label>
                {textInputs.map((text, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      id={`textInput${index + 1}`}
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
                    onClick={addText}
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
                  <Save className="w-4 h-4" />
                  Save Image
                </motion.button>
                
                <motion.button
                  onClick={exportNFT}
                  className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
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
                    Loading onchain rug generator...
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
  )
}
