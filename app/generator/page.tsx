"use client"

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Download, FileText, Plus, X, Eye } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { initializeDoormat, generateDoormatCore, addTextToDoormatInSketch, clearTextFromDoormat, getCurrentPalette } from '@/lib/doormat/doormat'
import { calculateTraits } from '@/lib/doormat/trait-calculator'

export default function GeneratorPage() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSeed, setCurrentSeed] = useState(42)
  const [textInputs, setTextInputs] = useState([''])
  const [currentRowCount, setCurrentRowCount] = useState(1)
  const [palette, setPalette] = useState<string>('')
  const [traits, setTraits] = useState<any>(null)
  const [showTraits, setShowTraits] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize doormat when canvas is available
  const initializeCanvas = async (canvas: HTMLCanvasElement) => {
    console.log('🚀 Starting generator initialization...')
    console.log('✅ Canvas element received:', canvas)
    
    setIsLoading(true)
    
    try {
      // Initialize doormat with canvas
      console.log('🔄 Calling initializeDoormat...')
      await initializeDoormat(canvas)
      console.log('✅ initializeDoormat completed successfully')
      
      setIsInitialized(true)
      setIsLoading(false)
      console.log('✅ Generator initialized successfully')
      
      // Generate a new seed
      const newSeed = Math.floor(Math.random() * 1_000_000)
      console.log('🎲 Generated new seed:', newSeed)
      
      // Call generateDoormatCore
      console.log('🎨 Calling generateDoormatCore...')
      generateDoormatCore(newSeed)
      console.log('✅ generateDoormatCore completed')
      
      // Save newSeed to state
      setCurrentSeed(newSeed)
      
      // Get the current palette and set its name into state
      const currentPalette = getCurrentPalette()
      if (currentPalette) {
        setPalette(currentPalette.name)
      }
      
      console.log('✅ Initial generation completed')
    } catch (error) {
      console.error('❌ Failed to initialize canvas:', error)
      console.error('❌ Error details:', error)
      console.error('❌ Error stack:', error.stack)
      setIsLoading(false)
      // Don't set isInitialized to true on error
    }
  }

  // Callback ref to initialize when canvas is mounted
  const canvasCallbackRef = (canvas: HTMLCanvasElement | null) => {
    if (canvas && !isInitialized) {
      canvasRef.current = canvas
      initializeCanvas(canvas)
    }
  }

  const generateNewDoormat = () => {
    console.log('🎲 generateNewDoormat called, isInitialized:', isInitialized)
    if (!isInitialized) {
      console.log('❌ Not initialized, skipping generation')
      return
    }
    
    // Generate new seed
    const newSeed = Math.floor(Math.random() * 1000000)
    console.log('🎲 Generated new seed:', newSeed)
    setCurrentSeed(newSeed)
    
    // Generate doormat directly
    console.log('🎨 Calling generateDoormatCore...')
    generateDoormatCore(newSeed)
    
    // Update palette
    const currentPalette = getCurrentPalette()
    console.log('🎨 Current palette:', currentPalette?.name)
    setPalette(currentPalette?.name || '')
    
    // Update traits
    const newTraits = calculateTraits()
    console.log('📊 New traits:', newTraits)
    setTraits(newTraits)
  }

  const addTextToDoormat = () => {
    if (!isInitialized) return
    
    // Filter out empty strings
    const nonEmptyTexts = textInputs.filter(text => text.trim() !== '')
    
    if (nonEmptyTexts.length > 0) {
      addTextToDoormatInSketch(nonEmptyTexts)
    }
  }

  const clearText = () => {
    if (!isInitialized) return
    clearTextFromDoormat()
  }

  const addTextRow = () => {
    if (currentRowCount < 5) {
      setTextInputs([...textInputs, ''])
      setCurrentRowCount(currentRowCount + 1)
    }
  }

  const removeTextRow = (index: number) => {
    if (textInputs.length > 1) {
      const newInputs = textInputs.filter((_, i) => i !== index)
      setTextInputs(newInputs)
      setCurrentRowCount(currentRowCount - 1)
    }
  }

  const updateTextInput = (index: number, value: string) => {
    // Limit to 11 characters per line
    if (value.length <= 11) {
      const newInputs = [...textInputs]
      newInputs[index] = value
      setTextInputs(newInputs)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Doormat Generator
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create unique, algorithmically generated doormats with custom text and colors
            </p>
          </div>

          {/* Canvas Section - Top */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Canvas Preview
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Seed: {currentSeed}</span>
                <button
                  onClick={generateNewDoormat}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <canvas 
                  ref={canvasCallbackRef} 
                  width={800} 
                  height={600} 
                  className="w-full h-auto border-0" 
                />
              )}
            </div>

            {/* Generation Controls */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={generateNewDoormat}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Generate New Rug
              </button>
              <button
                onClick={() => setShowTraits(!showTraits)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {showTraits ? 'Hide' : 'Show'} Traits
              </button>
            </div>
          </div>

          {/* Traits Display - Development Only */}
          {showTraits && traits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Traits (Development)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Palette:</span>
                  <span className="text-white ml-2">{traits.paletteName}</span>
                </div>
                <div>
                  <span className="text-gray-400">Rarity:</span>
                  <span className="text-white ml-2">{traits.paletteRarity}</span>
                </div>
                <div>
                  <span className="text-gray-400">Stripe Count:</span>
                  <span className="text-white ml-2">{traits.stripeCount}</span>
                </div>
                <div>
                  <span className="text-gray-400">Warp Thickness:</span>
                  <span className="text-white ml-2">{traits.warpThickness}</span>
                </div>
                <div>
                  <span className="text-gray-400">Weft Thickness:</span>
                  <span className="text-white ml-2">{traits.weftThickness}</span>
                </div>
                <div>
                  <span className="text-gray-400">Text Lines:</span>
                  <span className="text-white ml-2">{traits.textLines}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Characters:</span>
                  <span className="text-white ml-2">{traits.totalCharacters}</span>
                </div>
                <div>
                  <span className="text-gray-400">Stripe Complexity:</span>
                  <span className="text-white ml-2">{traits.stripeComplexity}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Controls Section - Bottom */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text Input Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold text-white mb-4">Add Custom Text</h2>
              <p className="text-gray-400 text-sm mb-4">
                Add up to 5 lines of text (11 characters per line). Additional lines will cost more in NFT.
              </p>
              
              <div className="space-y-4">
                {textInputs.map((text, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => updateTextInput(index, e.target.value)}
                      placeholder={`Text line ${index + 1} (${text.length}/11)`}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      maxLength={11}
                    />
                    {textInputs.length > 1 && (
                      <button
                        onClick={() => removeTextRow(index)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={addTextRow}
                  disabled={currentRowCount >= 5}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Line ({currentRowCount}/5)
                </button>
                <button
                  onClick={addTextToDoormat}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Text to Doormat
                </button>
                <button
                  onClick={clearText}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Clear Text
                </button>
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold text-white mb-4">Export Options</h2>
              <p className="text-gray-400 text-sm mb-4">
                Export your doormat as a self-contained minified JavaScript file.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    // TODO: Implement export functionality
                    console.log('Export to minified JS - TODO')
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export to Minified JS
                </button>
                
                <div className="text-xs text-gray-500">
                  <p>• Self-contained HTML file</p>
                  <p>• Includes all dependencies</p>
                  <p>• Ready for NFT metadata</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
