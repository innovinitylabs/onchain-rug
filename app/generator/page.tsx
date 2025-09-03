"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Download, FileText, X, Plus, Minus } from 'lucide-react'

export default function GeneratorPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSeed, setCurrentSeed] = useState(42)
  const [textInputs, setTextInputs] = useState([''])
  const [currentRowCount, setCurrentRowCount] = useState(1)

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

      for (const scriptSrc of scripts) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = scriptSrc
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }
    }

    // Initialize everything
    const init = async () => {
      await loadP5()
      await loadDoormatScripts()
      
      // Wait for everything to load, then initialize
      setTimeout(() => {
        if (typeof (window as any).generateFromSeed === 'function') {
          (window as any).generateFromSeed()
          
          // Update traits after initial generation
          setTimeout(() => {
            if (typeof (window as any).updateTraitsFromSketch === 'function') {
              (window as any).updateTraitsFromSketch()
            }
          }, 200)
        }
        setIsLoaded(true)
      }, 1000)
    }

    init()
  }, [])

  // Functions copied exactly from the original HTML
  const generateNew = () => {
    const seed = Math.floor(Math.random() * 10000)
    setCurrentSeed(seed)
    const seedInput = document.getElementById('seedInput') as HTMLInputElement
    if (seedInput) seedInput.value = seed.toString()
    
    if (typeof (window as any).generateDoormat === 'function') {
      (window as any).generateDoormat(seed)
      
      // Update palette and traits display after a short delay to ensure the sketch has updated
      setTimeout(() => {
        if (typeof (window as any).updatePaletteDisplay === 'function' && typeof (window as any).getCurrentPalette === 'function') {
          const currentPalette = (window as any).getCurrentPalette()
          if (currentPalette) {
            (window as any).updatePaletteDisplay(currentPalette.name, currentPalette.colors)
          }
        }
        // Force traits update as backup
        if (typeof (window as any).updateTraitsFromSketch === 'function') {
          (window as any).updateTraitsFromSketch()
        }
      }, 150)
    }
  }

  const generateFromSeed = () => {
    const seed = parseInt((document.getElementById('seedInput') as HTMLInputElement)?.value || '42')
    setCurrentSeed(seed)
    
    if (typeof (window as any).generateDoormat === 'function') {
      (window as any).generateDoormat(seed)
      
      // Update palette and traits display after a short delay to ensure the sketch has updated
      setTimeout(() => {
        if (typeof (window as any).updatePaletteDisplay === 'function' && typeof (window as any).getCurrentPalette === 'function') {
          const currentPalette = (window as any).getCurrentPalette()
          if (currentPalette) {
            (window as any).updatePaletteDisplay(currentPalette.name, currentPalette.colors)
          }
        }
        // Force traits update as backup
        if (typeof (window as any).updateTraitsFromSketch === 'function') {
          (window as any).updateTraitsFromSketch()
        }
      }, 150)
    }
  }

  const saveDoormat = () => {
    if (typeof (window as any).saveCanvas === 'function') {
      (window as any).saveCanvas('onchain-rug-' + Date.now(), 'png')
    }
  }

  const addTextToDoormat = () => {
    const textRows = []
    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById('textInput' + i) as HTMLInputElement
      if (input) {
        const text = input.value.trim()
        if (text) {
          textRows.push(text)
        }
      }
    }
    if (textRows.length > 0 && typeof (window as any).addTextToDoormatInSketch === 'function') {
      (window as any).addTextToDoormatInSketch(textRows)
    }
  }

  const toggleAdditionalRows = () => {
    if (currentRowCount < 5) {
      addRow()
    } else {
      // Hide all additional rows
      const additionalRows = document.getElementById('additionalRows')
      if (additionalRows) {
        additionalRows.innerHTML = ''
        additionalRows.style.display = 'none'
      }
      setCurrentRowCount(1)

      const toggleBtn = document.getElementById('toggleRowsBtn')
      if (toggleBtn) {
        toggleBtn.textContent = '+ Add More Rows'
        toggleBtn.style.backgroundColor = '#4CAF50'
      }

      // Clear all additional row inputs
      for (let i = 2; i <= 5; i++) {
        const input = document.getElementById('textInput' + i) as HTMLInputElement
        if (input) input.value = ''
      }
    }
  }

  const addRow = () => {
    if (currentRowCount >= 5) return // Maximum 5 rows

    setCurrentRowCount(prev => prev + 1)
    const additionalRows = document.getElementById('additionalRows')
    if (!additionalRows) return

    // Create new row element
    const newRow = document.createElement('div')
    newRow.style.display = 'flex'
    newRow.style.gap = '5px'
    newRow.style.alignItems = 'center'
    newRow.id = 'row' + (currentRowCount + 1)

    newRow.innerHTML = `
      <label style="font-size: 12px; width: 60px;">Row ${currentRowCount + 1}:</label>
      <input type="text" id="textInput${currentRowCount + 1}" class="text-input" placeholder="Enter text (A-Z, 0-9, space)" maxlength="11" oninput="validateTextInput(this)">
      <button onclick="removeRow(${currentRowCount + 1})" style="background-color: #f44336; font-size: 10px; padding: 4px 8px;">×</button>
    `

    additionalRows.appendChild(newRow)
    additionalRows.style.display = 'block'

    // Update button text
    updateAddRowButton()
  }

  const removeRow = (rowNumber: number) => {
    if (rowNumber <= 1) return // Can't remove first row

    const rowElement = document.getElementById('row' + rowNumber)
    if (rowElement) {
      rowElement.remove()
      setCurrentRowCount(prev => prev - 1)

      // Clear the input value
      const input = document.getElementById('textInput' + rowNumber) as HTMLInputElement
      if (input) input.value = ''

      // Update button text and hide container if no additional rows
      updateAddRowButton()
    }
  }

  const updateAddRowButton = () => {
    const toggleBtn = document.getElementById('toggleRowsBtn')
    if (!toggleBtn) return

    if (currentRowCount >= 5) {
      toggleBtn.textContent = '− Hide All Rows'
      toggleBtn.style.backgroundColor = '#f44336'
    } else {
      toggleBtn.textContent = '+ Add Row'
      toggleBtn.style.backgroundColor = '#4CAF50'
    }
  }

  const clearText = () => {
    // Clear all input values
    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById('textInput' + i) as HTMLInputElement
      if (input) input.value = ''
    }

    // Remove all additional rows and reset to single row
    const additionalRows = document.getElementById('additionalRows')
    if (additionalRows) {
      additionalRows.innerHTML = ''
      additionalRows.style.display = 'none'
    }

    // Reset row count and button
    setCurrentRowCount(1)
    updateAddRowButton()

    if (typeof (window as any).clearTextFromDoormat === 'function') {
      (window as any).clearTextFromDoormat()
    }
  }

  const validateTextInput = (input: HTMLInputElement) => {
    // Remove any characters that are not A-Z, 0-9, or space
    input.value = input.value.replace(/[^A-Za-z0-9\s]/g, '')
    // Convert to uppercase
    input.value = input.value.toUpperCase()
  }

  const exportNFT = () => {
    if (typeof (window as any).exportNFT === 'function') {
      (window as any).exportNFT()
    }
  }

  // Make functions globally available for the P5.js sketch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).validateTextInput = validateTextInput
      ;(window as any).removeRow = removeRow
      ;(window as any).updateAddRowButton = updateAddRowButton
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-amber-800 mb-4"
          >
            Generative Doormat Art
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-amber-700 max-w-3xl mx-auto"
          >
            A P5.js generative art piece inspired by traditional woven doormats.<br />
            Each generation creates unique stripe patterns, colors, and textures with fringe details.
          </motion.p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <motion.button
            onClick={generateNew}
            className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Shuffle className="w-5 h-5" />
            Generate New Doormat
          </motion.button>
          
          <motion.button
            onClick={saveDoormat}
            className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-5 h-5" />
            Save as Image
          </motion.button>
          
          <input
            type="number"
            id="seedInput"
            className="border-2 border-amber-700 rounded-lg px-4 py-3 text-center font-mono text-lg w-32"
            placeholder="Seed"
            defaultValue={42}
          />
          
          <motion.button
            onClick={generateFromSeed}
            className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FileText className="w-5 h-5" />
            Use Seed
          </motion.button>
          
          <motion.button
            onClick={exportNFT}
            className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Export NFT
          </motion.button>
        </div>

        {/* Text Inputs */}
        <div className="flex flex-col gap-3 items-center mb-6">
          <div className="flex flex-col gap-3 items-center">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-amber-800 w-16">Row 1:</label>
              <input
                type="text"
                id="textInput1"
                className="border-2 border-amber-700 rounded-lg px-4 py-2 w-48 text-center uppercase"
                placeholder="Enter text (A-Z, 0-9, space)"
                maxLength={11}
                onInput={(e) => validateTextInput(e.target as HTMLInputElement)}
              />
            </div>
            
            <div id="additionalRows" style={{ display: 'none' }}>
              {/* Additional rows will be added here dynamically */}
            </div>
            
            <div className="flex gap-3 items-center">
              <button
                id="toggleRowsBtn"
                onClick={toggleAdditionalRows}
                className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                + Add More Rows
              </button>
              
              <motion.button
                onClick={addTextToDoormat}
                className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add Text
              </motion.button>
              
              <motion.button
                onClick={clearText}
                className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear Text
              </motion.button>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex justify-center mb-8">
          <div 
            id="canvas-container"
            className="shadow-lg rounded-lg overflow-hidden bg-white"
            style={{
              width: '1320px',
              height: '920px',
              maxWidth: '100%'
            }}
          >
            {!isLoaded && (
              <div className="flex items-center justify-center h-64 text-amber-700">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mr-4"
                />
                Loading doormat generator...
              </div>
            )}
          </div>
        </div>

        {/* Palette Display */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-amber-800 mb-4">Current Color Palette</h3>
          <div id="paletteName" className="font-bold text-amber-700 mb-4">Loading...</div>
          <div id="colorSwatches" className="flex gap-2 justify-center flex-wrap max-w-2xl mx-auto">
            {/* Color swatches will be displayed here */}
          </div>
        </div>

        {/* Traits Display */}
        <div className="text-center mb-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-amber-800 mb-6">NFT Traits</h3>
          <div id="traitsContainer" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {/* Traits will be displayed here */}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-amber-700 max-w-3xl mx-auto">
          <p className="text-lg">
            <strong>Instructions:</strong><br />
            • Click "Generate New Doormat" for a random pattern<br />
            • Enter a seed number and click "Use Seed" for reproducible results<br />
            • Enter text to embed it into the doormat pattern (max 11 characters, A-Z, 0-9, space only)<br />
            • Click "Save as Image" to download your doormat
          </p>
        </div>
      </div>
    </div>
  )
}
