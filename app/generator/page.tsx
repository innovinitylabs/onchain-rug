"use client"

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shuffle, 
  Download, 
  FileText, 
  Plus, 
  X, 
  Zap, 
  Palette, 
  Hash,
  Sparkles,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import NFTExporter from '@/components/NFTExporter'
import { generateDoormatCore, addTextToDoormatInSketch, clearTextFromDoormat, getCurrentPalette, initializeDoormat } from '@/lib/doormat/doormat'
import { calculateTraits } from '@/lib/doormat/trait-calculator'

// TypeScript interfaces for type safety
interface Traits {
  textLines: number;
  totalCharacters: number;
  paletteName: string;
  paletteRarity: string;
  stripeCount: number;
  stripeComplexity: string;
}

interface DoormatFunctions {
  addTextToDoormatInSketch: (textRows: string | string[]) => void;
  clearTextFromDoormat: () => void;
  getCurrentPalette: () => string | undefined;
  generateDoormat: (seed: string) => void;
  updateTraitsFromSketch: () => void;
  calculateTraits: () => Traits;
}

export default function GeneratorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSeed, setCurrentSeed] = useState<number>(42) // Fixed seed to prevent hydration mismatch
  const [textInput, setTextInput] = useState<string>('')
  const [textRows, setTextRows] = useState<string[]>([])
  const [palette, setPalette] = useState<string>('')
  const [traits, setTraits] = useState<Traits | null>(null)
  const [showTraits, setShowTraits] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize the generator
  const init = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Set loading to false first so canvas renders
      setIsLoading(false)
      
      // Wait for canvas to be available
      let attempts = 0
      while (!canvasRef.current && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      // Initialize doormat with canvas
      if (canvasRef.current) {
        await initializeDoormat(canvasRef.current)
      }
      
      setIsInitialized(true)
      // Generate initial doormat
      generateNewDoormat()
    } catch (err) {
      console.error('❌ Initialization failed:', err)
      setError('Failed to initialize generator. Please refresh the page.')
      setIsLoading(false)
    }
  }

  // Generate a new doormat
  const generateNewDoormat = () => {
    if (!isInitialized) return

    try {
      setIsGenerating(true)
      setError('')
      
      // Generate new seed
      const newSeed = Math.floor(Math.random() * 1000000)
      setCurrentSeed(newSeed)
      
      // Generate doormat directly
      generateDoormatCore(newSeed)
      
      // Update palette
      const currentPalette = getCurrentPalette()
      setPalette(currentPalette || '')
      
      // Update traits
      const newTraits = calculateTraits()
      setTraits(newTraits)
      
    } catch (err) {
      console.error('❌ Generation failed:', err)
      setError('Failed to generate doormat. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Add text to doormat
  const addTextToDoormat = () => {
    if (!textInput.trim() || !isInitialized) return

    try {
      const newTextRows = textInput.split('\n').filter(row => row.trim())
      setTextRows(prev => [...prev, ...newTextRows])
      
      // Add text to doormat directly
      addTextToDoormatInSketch(newTextRows)
      
      setTextInput('')
      
      // Update traits
      const newTraits = calculateTraits()
      setTraits(newTraits)
      
    } catch (err) {
      console.error('❌ Failed to add text:', err)
      setError('Failed to add text to doormat.')
    }
  }

  // Clear text from doormat
  const clearTextFromDoormatHandler = () => {
    if (!isInitialized) return

    try {
      setTextRows([])
      
      // Clear text from doormat directly
      clearTextFromDoormat()
      
      // Update traits
      const newTraits = calculateTraits()
      setTraits(newTraits)
      
    } catch (err) {
      console.error('❌ Failed to clear text:', err)
      setError('Failed to clear text from doormat.')
    }
  }

  // Initialize on mount
  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      init()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4"
          >
            🚀 NFT Rug Generator
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Generate unique, algorithmically created NFT rugs with custom text and traits
          </motion.p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6"
          >
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <Eye className="w-6 h-6 text-purple-400" />
                  Canvas Preview
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Seed: {currentSeed}</span>
                  <button
                    onClick={generateNewDoormat}
                    disabled={isGenerating || !isInitialized}
                    className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Canvas Container */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                    />
                  </div>
                ) : (
                  <canvas 
                    ref={canvasRef} 
                    width={600} 
                    height={400} 
                    className="w-full h-96 border-0" 
                  />
                )}
                </div>

              {/* Generation Controls */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={generateNewDoormat}
                  disabled={isGenerating || !isInitialized}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Shuffle className="w-5 h-5" />
                  {isGenerating ? 'Generating...' : 'Generate New Rug'}
                </button>
                
                <button
                  onClick={() => setShowTraits(!showTraits)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  {showTraits ? 'Hide' : 'Show'} Traits
                </button>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Text Input */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-400" />
                Add Text
              </h3>
              
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text to embed in your rug..."
                className="w-full h-24 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                disabled={!isInitialized}
              />
              
              <div className="flex gap-2 mt-3">
                  <button
                  onClick={addTextToDoormat}
                  disabled={!textInput.trim() || !isInitialized}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Text
                  </button>
                
                        <button
                  onClick={clearTextFromDoormatHandler}
                  disabled={textRows.length === 0 || !isInitialized}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                  Clear
                        </button>
              </div>

              {/* Text Rows Display */}
              {textRows.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Current Text:</h4>
                  <div className="space-y-1">
                    {textRows.map((row, index) => (
                      <div key={index} className="text-sm text-gray-400 bg-gray-800 rounded px-2 py-1">
                        {row}
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>

            {/* Palette Info */}
            {palette && (
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-400" />
                  Current Palette
                </h3>
                <div className="text-lg font-medium text-pink-300">{palette}</div>
              </div>
            )}

            {/* Traits Display */}
            {showTraits && traits && (
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  NFT Traits
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Text Lines:</span>
                    <span className="text-white font-medium">{traits.textLines}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Characters:</span>
                    <span className="text-white font-medium">{traits.totalCharacters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Palette:</span>
                    <span className="text-white font-medium">{traits.paletteName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rarity:</span>
                    <span className="text-white font-medium">{traits.paletteRarity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stripe Count:</span>
                    <span className="text-white font-medium">{traits.stripeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Complexity:</span>
                    <span className="text-white font-medium">{traits.stripeComplexity}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Export Section */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-green-400" />
                Export NFT
              </h3>
              <NFTExporter 
                currentSeed={currentSeed}
                currentPalette={palette}
                currentStripeData={[]}
                textRows={textRows}
              />
            </div>
        </div>
        </div>
      </div>
    </div>
  )
}