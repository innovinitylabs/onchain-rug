'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Shuffle, Save, Wand2 } from 'lucide-react'
import Link from 'next/link'

export default function GeneratorPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSeed, setCurrentSeed] = useState(42)
  const [textInputs, setTextInputs] = useState([''])
  const [traits, setTraits] = useState<any>(null)

  useEffect(() => {
    // Load P5.js and doormat scripts
    const loadScripts = async () => {
      // Load P5.js
      if (!(window as any).p5) {
        const p5Script = document.createElement('script')
        p5Script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
        document.head.appendChild(p5Script)
        
        await new Promise((resolve) => {
          p5Script.onload = resolve
        })
      }

      // Load doormat scripts in order
      const scripts = [
        '/lib/doormat/doormat-config.js',
        '/lib/doormat/color-palettes.js', 
        '/lib/doormat/character-map.js',
        '/lib/doormat/trait-calculator.js',
        '/lib/doormat/doormat.js',
        '/lib/doormat/html-interface.js'
      ]

      for (const src of scripts) {
        const script = document.createElement('script')
        script.src = src
        document.head.appendChild(script)
        
        await new Promise((resolve) => {
          script.onload = resolve
        })
      }

      // Initialize the doormat generator
      setTimeout(() => {
        if ((window as any).generateDoormatCore) {
          (window as any).generateDoormatCore(currentSeed)
          setIsLoaded(true)
        }
      }, 500)
    }

    loadScripts()
  }, [])

  const generateNew = () => {
    const newSeed = Math.floor(Math.random() * 10000)
    setCurrentSeed(newSeed)
    if ((window as any).generateDoormatCore) {
      (window as any).generateDoormatCore(newSeed)
    }
  }

  const generateFromSeed = () => {
    if ((window as any).generateDoormatCore) {
      (window as any).generateDoormatCore(currentSeed)
    }
  }

  const addText = () => {
    const textRows = textInputs.filter(text => text.trim() !== '')
    if ((window as any).addTextToDoormatInSketch) {
      (window as any).doormatTextRows = textRows
      ;(window as any).addTextToDoormatInSketch(textRows)
    }
  }

  const clearText = () => {
    setTextInputs([''])
    if ((window as any).clearTextFromDoormat) {
      (window as any).clearTextFromDoormat()
    }
  }

  const saveDoormat = () => {
    if ((window as any).saveCanvas) {
      (window as any).saveCanvas('doormat-' + Date.now(), 'png')
    }
  }

  const exportNFT = () => {
    if ((window as any).exportNFT) {
      (window as any).exportNFT()
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
                Generate New Doormat
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
                      <button
                        onClick={() => removeTextRow(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-2 mt-3">
                  {textInputs.length < 5 && (
                    <button
                      onClick={addTextRow}
                      className="flex-1 px-3 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      + Add Row
                    </button>
                  )}
                  <button
                    onClick={addText}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Apply Text
                  </button>
                  <button
                    onClick={clearText}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
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
                ref={containerRef}
                id="canvas-container"
                className="w-full bg-gray-100 rounded-lg min-h-[600px] flex items-center justify-center"
              >
                {!isLoaded && (
                  <div className="text-center text-amber-700">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    Loading doormat generator...
                  </div>
                )}
              </div>
              
              {/* Palette & Traits Info */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">Current Palette</h3>
                  <div id="paletteName" className="text-amber-700">Loading...</div>
                  <div id="colorSwatches" className="flex gap-2 mt-2">
                    {/* Color swatches will be populated by the doormat generator */}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">NFT Traits</h3>
                  <div id="traitsContainer" className="space-y-1 text-sm text-amber-700">
                    {/* Traits will be populated by the doormat generator */}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
