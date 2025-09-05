'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import Navigation from '@/components/Navigation'
import NFTExporter from '@/components/NFTExporter'
import { useP5RugGenerator, type RugConfig, type RugTraits } from '@/hooks/useP5RugGenerator'
import { colorPalettes, type ColorPalette } from '@/data/colorPalettes'

export default function GeneratorPage() {
  const [currentSeed, setCurrentSeed] = useState(42)
  const [textInputs, setTextInputs] = useState([''])
  const [currentRowCount, setCurrentRowCount] = useState(1)
  const [selectedPalette] = useState<ColorPalette>(colorPalettes[0])
  const [currentTraits, setCurrentTraits] = useState<RugTraits | null>(null)

  // P5.js rug generator hook
  const rugConfig: RugConfig = {
    width: 900,
    height: 600,
    seed: currentSeed,
    palette: selectedPalette.colors,
    textInputs
  }

  const { canvasRef, generateRug, getTraits } = useP5RugGenerator(rugConfig)

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

  // Clean up any existing canvases on mount (from any source)
  useEffect(() => {
    // Clean up Three.js WebGL canvases from AnimatedRugs component
    const animatedRugsCanvases = document.querySelectorAll('canvas[data-component="animated-rugs"]')
    animatedRugsCanvases.forEach(canvas => {
      canvas.remove()
    })
    
    // Also clean up any canvases without IDs that might be from Three.js
    const unnamedCanvases = document.querySelectorAll('canvas:not([id]):not([data-component])')
    unnamedCanvases.forEach(canvas => {
      canvas.remove()
    })
  }, []) // Empty dependency array - only run once on mount

  // Update traits when rug is generated
  useEffect(() => {
    const traits = getTraits()
    if (traits) {
      setCurrentTraits(traits)
    }
  }, [getTraits])

  // Generate new random seed and rug
  const generateNewSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000)
    setCurrentSeed(newSeed)
    // Generate rug with the new seed directly
    if (window.generateDoormatCore) {
      window.generateDoormatCore(newSeed)
    }
  }

  // Add new text row
  const addTextRow = () => {
    setTextInputs([...textInputs, ''])
    setCurrentRowCount(currentRowCount + 1)
  }

  // Remove text row
  const removeTextRow = (index: number) => {
    if (currentRowCount > 1) {
      const newInputs = textInputs.filter((_, i) => i !== index)
      setTextInputs(newInputs)
      setCurrentRowCount(currentRowCount - 1)
    }
  }

  // Update text input
  const updateTextInput = (index: number, value: string) => {
    const newInputs = [...textInputs]
    newInputs[index] = value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 11)
    setTextInputs(newInputs)
  }

  // Add text to rug
  const addTextToRug = () => {
    const validTexts = textInputs.filter(text => text.trim().length > 0)
    if (validTexts.length > 0) {
      // Regenerate rug with new text
      generateRug()
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navigation />
      <div className="max-w-[2000px] mx-auto px-4 pt-24">
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
              <div className="relative mx-auto" style={{ width: '1400px', maxWidth: '100%' }}>
                {/* Monitor Bezel - Yellowed Plastic */}
                <div className="bg-amber-100 border-6 border-amber-200 rounded-t-2xl rounded-b-xl p-8 shadow-2xl">
                  {/* Monitor Screen Area */}
                  <div className="bg-gray-800 rounded-lg px-4 py-2 border-3 border-gray-700 shadow-inner">
                    {/* CRT Screen with Scan Lines Effect */}
                    <div className="bg-black rounded-lg px-2 border-2 border-gray-600 relative overflow-hidden">
                      {/* Scan Lines Overlay */}
                      <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
                        zIndex: 1
                      }}></div>
                      
                                                                    {/* Canvas Container - Match P5.js canvas dimensions exactly */}
                                                 <div 
                        ref={canvasRef}
                           id="canvas-container"
                           className="bg-gray-900 rounded-lg relative mx-auto border border-green-500/30"
                        style={{ width: '1320px', height: '920px' }}
                      >
                        {/* Loading state - will be replaced by canvas */}
                        <div className="absolute inset-0 flex items-center justify-center text-green-400 font-mono">
                          <div className="text-center">
                            <div className="animate-pulse">INITIALIZING RUG GENERATOR...</div>
                            <div className="text-sm mt-2 opacity-70">Loading doormat.js engine...</div>
                          </div>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Terminal Controls - Full Width at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-black border-t border-green-500/50 p-6"
          >
            <div className="max-w-[1400px] mx-auto">
              <h3 className="text-green-400 font-mono text-lg mb-4">⚡ CONTROL TERMINAL</h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* Seed Control */}
                <div className="bg-gray-900 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-mono text-sm mb-3">RUG GENERATOR</h4>
                  <div className="space-y-3">
                    <div className="text-green-300 font-mono text-xs">
                      Current Seed: <span className="text-yellow-400">{currentSeed}</span>
                    </div>
                    <div className="flex gap-2">
                  <button
                        onClick={generateNewSeed}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded font-mono text-xs transition-colors"
                  >
                        GENERATE NEW RUG
                  </button>
                    </div>
                  </div>
                </div>
                
                {/* Text Input */}
                <div className="bg-gray-900 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-mono text-sm mb-3">TEXT EMBEDDING</h4>
                <div className="space-y-3">
                  {textInputs.map((text, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => updateTextInput(index, e.target.value)}
                          placeholder={`ROW_${index + 1}`}
                          className="flex-1 px-2 py-1 bg-black border border-green-500/50 rounded text-green-300 font-mono text-xs focus:outline-none focus:border-green-400"
                        maxLength={11}
                      />
                        {currentRowCount > 1 && (
                        <button
                          onClick={() => removeTextRow(index)}
                            className="p-1 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                    <button
                      onClick={addTextRow}
                      className="w-full flex items-center justify-center gap-2 text-green-400 hover:bg-green-900/30 py-2 rounded border border-dashed border-green-500/50 transition-colors font-mono text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      ADD ROW
                    </button>
                    <button
                      onClick={addTextToRug}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-mono text-xs transition-colors"
                    >
                      EMBED TEXT
                    </button>
                  </div>
                </div>
                
                {/* Current Traits */}
                {currentTraits && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 border border-green-500/30 rounded-lg p-4"
                  >
                    <h4 className="text-green-400 font-mono text-sm mb-3">NFT TRAITS</h4>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-green-300">
                        <span>Text Lines:</span>
                        <span className="text-yellow-400">{currentTraits.textLines}</span>
                      </div>
                      <div className="flex justify-between text-green-300">
                        <span>Characters:</span>
                        <span className="text-yellow-400">{currentTraits.totalCharacters}</span>
                      </div>
                      <div className="flex justify-between text-green-300">
                        <span>Palette:</span>
                        <span className="text-yellow-400">{currentTraits.paletteName}</span>
                      </div>
                      <div className="flex justify-between text-green-300">
                        <span>Rarity:</span>
                        <span 
                          className="px-1 py-0.5 rounded text-xs"
                          style={{ 
                            backgroundColor: getRarityColor(currentTraits.rarity) + '20',
                            color: getRarityColor(currentTraits.rarity)
                          }}
                        >
                          {currentTraits.rarity}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-300">
                        <span>Complexity:</span>
                        <span className="text-yellow-400">{currentTraits.complexity}</span>
                      </div>
                      <div className="flex justify-between text-green-300">
                        <span>Colors:</span>
                        <span className="text-yellow-400">{currentTraits.colorVariety}</span>
                      </div>
                      <div className="flex justify-between text-green-300">
                        <span>Density:</span>
                        <span className="text-yellow-400">{currentTraits.textDensity}</span>
                      </div>
                      <div className="flex justify-between text-green-300">
                        <span>Pattern:</span>
                        <span className="text-yellow-400">{currentTraits.patternType}</span>
                      </div>
                </div>
                  </motion.div>
                )}
              </div>

              {/* Export Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-6"
              >
                <NFTExporter 
                  currentSeed={currentSeed}
                  currentPalette={selectedPalette}
                  textRows={textInputs}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
