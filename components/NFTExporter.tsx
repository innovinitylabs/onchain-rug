"use client"

import { useState } from 'react'
import { Download, FileText, AlertCircle } from 'lucide-react'

interface NFTExporterProps {
  currentSeed: number
  textInputs: string[]
  isLoaded: boolean
}

export default function NFTExporter({ currentSeed, textInputs, isLoaded }: NFTExporterProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<string>('')

  // Obfuscation map using Tamil letters (same as reference)
  const obfuscationMap: { [key: string]: string } = {
    // Variables
    'config': 'அ',
    'doormatWidth': 'ஆ',
    'doormatHeight': 'இ',
    'fringeLength': 'ஈ',
    'weftThickness': 'உ',
    'warpThickness': 'ஊ',
    'TEXT_SCALE': 'எ',
    'selectedPalette': 'ஏ',
    'stripeData': 'ஐ',
    'doormatTextRows': 'ஒ',
    'textData': 'ஓ',
    'lightTextColor': 'க',
    'darkTextColor': 'ங',
    'characterMap': 'ச',
    'totalWidth': 'ஜ',
    'totalHeight': 'ஞ',
    'numRows': 'கவ',
    'numCols': 'கஶ',
    'newCol': 'கஷ',
    'newRow': 'கஸ',
    'yPos': 'கஹ',
    'xOffset': 'கா',
    'isFirstWeft': 'கிஅ',
    'isLastWeft': 'கீஅ',
    'isFirstWeftRight': 'குஅ',
    'isLastWeftRight': 'கூஅ',
    'darkest': 'கெ',
    'lightest': 'கே',
    'darkestVal': 'கைஅ',
    'lightestVal': 'கொஅ',
    'bright': 'கோஅ',
    
    // Function names
    'drawStripe': 'ஔ',
    'drawTextureOverlay': 'க',
    'drawFringe': 'ங',
    'drawSelvedgeEdges': 'ச',
    'drawFringeSection': 'ஜ',
    'updateTextColors': 'ஞ',
    'generateTextData': 'ட',
    'generateCharacterPixels': 'ண'
  }

  const minifyCode = (code: string): string => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, '') // Remove // comments
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim()
  }

  const obfuscateWithTamilLetters = (code: string): string => {
    let obfuscatedCode = code
    
    Object.entries(obfuscationMap).forEach(([original, replacement]) => {
      if (obfuscatedCode.includes(original)) {
        const regex = new RegExp('\\b' + original + '\\b', 'g')
        obfuscatedCode = obfuscatedCode.replace(regex, replacement)
      }
    })
    
    return obfuscatedCode
  }

  const getUsedCharacters = (textRows: string[]) => {
    const used = new Set<string>()
    textRows.forEach(row => {
      for (const char of row.toUpperCase()) {
        used.add(char)
      }
    })
    used.add(' ') // Always include space
    
    // This would need to be imported from character-map.js
    // For now, return a basic character map
    const usedCharMap: { [key: string]: { pixels: number[] } } = {}
    used.forEach(char => {
      // Placeholder - would need actual character map data
      usedCharMap[char] = { pixels: [] }
    })
    return usedCharMap
  }

  const createCompressedNFTHTML = (seed: number, palette: { name?: string; colors?: string[] } | null, traits: { [key: string]: string } | null, obfuscatedCode: string) => {
    const traitsText = Object.entries(traits || {}).map(entry => entry[0] + ':' + entry[1]).join('|')
    
    let html = '<!DOCTYPE html>'
    html += '<html>'
    html += '<head>'
    html += '<meta charset="UTF-8">'
    html += '<title>NFT#' + seed + '</title>'
    html += '<style>'
    html += 'body{margin:0;padding:0;background:#f5f2ee;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:Arial,sans-serif}'
    html += 'canvas{border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15)}'
    html += '.i{position:absolute;bottom:10px;left:10px;color:#4a4a4a;font-size:10px;opacity:0.8}'
    html += '.t{position:absolute;bottom:10px;right:10px;color:#4a4a4a;font-size:8px;opacity:0.8;text-align:right}'
    html += '</style>'
    html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></' + 'script>'
    html += '</head>'
    html += '<body>'
    html += '<div class="i">S:' + seed + '|P:' + (palette?.name || 'Default') + '</div>'
    html += '<div class="t">' + traitsText + '</div>'
    html += '<div id="c"></div>'
    html += '<script>' + obfuscatedCode + '</' + 'script>'
    html += '</body>'
    html += '</html>'
    
    return html
  }

  const createPureAlgorithmCode = async (seed: number, palette: { name?: string; colors?: string[] } | null, textRows: string[]) => {
    const usedChars = getUsedCharacters(textRows)
    
    // Create pure, self-contained algorithm
    const pureCode = `
// Doormat NFT #${seed} - Self-contained algorithm
const config = {
  DOORMAT_WIDTH: 1200,
  DOORMAT_HEIGHT: 800,
  FRINGE_LENGTH: 30,
  WEFT_THICKNESS: 4,
  TEXT_SCALE: 0.8
};

let doormatWidth = config.DOORMAT_WIDTH;
let doormatHeight = config.DOORMAT_HEIGHT;
let fringeLength = config.FRINGE_LENGTH;
let weftThickness = config.WEFT_THICKNESS;
let warpThickness = 2;
let TEXT_SCALE = config.TEXT_SCALE;

// Embedded current state
let selectedPalette = ${JSON.stringify(palette || { name: 'Default', colors: ['#000000', '#FFFFFF'] })};
let doormatTextRows = ${JSON.stringify(textRows)};
let textData = [];

// Text colors
let lightTextColor, darkTextColor;

// Embedded character map (only used characters)
const characterMap = ${JSON.stringify(usedChars)};

function setup() {
    let totalWidth = doormatWidth + fringeLength * 4;
    let totalHeight = doormatHeight + fringeLength * 4;
    createCanvas(totalHeight, totalWidth);
    pixelDensity(2.5);
    noLoop();
    
    randomSeed(${seed});
    noiseSeed(${seed});
    
    updateTextColors();
    generateTextData();
    
    draw();
}

function draw() {
    background(245, 242, 238); // Warm, mellow cream background
    
    push();
    translate(width/2, height/2);
    rotate(PI/2);
    translate(-height/2, -width/2);
    
    push();
    translate(fringeLength * 2, fringeLength * 2);
    
    // Draw basic stripes (simplified for export)
    drawBasicStripes();
    
    drawTextureOverlay();
    pop();
    
    drawFringe();
    drawSelvedgeEdges();
    
    pop();
}

function updateTextColors() {
    if (!selectedPalette || !selectedPalette.colors) return;
    lightTextColor = color(255);
    darkTextColor = color(0);
}

function drawBasicStripes() {
    // Simplified stripe drawing for export
    for (let i = 0; i < 10; i++) {
        fill(random(100, 200));
        rect(i * 120, 0, 120, doormatHeight);
    }
}

function drawTextureOverlay() {
    // Simplified texture overlay
    stroke(0, 50);
    strokeWeight(1);
    for (let i = 0; i < doormatWidth; i += 20) {
        line(i, 0, i, doormatHeight);
    }
}

function drawFringe() {
    // Simplified fringe drawing
    fill(150);
    rect(-fringeLength * 2, -fringeLength * 2, doormatWidth + fringeLength * 4, fringeLength * 2);
    rect(-fringeLength * 2, doormatHeight + fringeLength * 2, doormatWidth + fringeLength * 4, fringeLength * 2);
}

function drawSelvedgeEdges() {
    // Simplified selvedge edges
    fill(100);
    rect(-fringeLength * 2, -fringeLength * 2, fringeLength * 2, doormatHeight + fringeLength * 4);
    rect(doormatWidth + fringeLength * 2, -fringeLength * 2, fringeLength * 2, doormatHeight + fringeLength * 4);
}

function generateTextData() {
    textData = [];
    // Simplified text data generation
}
`
    return pureCode
  }

  const exportNFT = async () => {
    if (!isLoaded) {
      setExportStatus('Please wait for the generator to load...')
      return
    }

    setIsExporting(true)
    setExportStatus('Creating NFT export...')

    try {
      // Get current text inputs
      const textRows = textInputs.filter(text => text.trim().length > 0)
      
      // Get current palette and traits from global scope
      const palette = (window as any).getCurrentPalette?.() || { name: 'Default', colors: ['#000000', '#FFFFFF'] }
      const traits = (window as any).calculateTraits?.() || { Seed: currentSeed, Style: 'Generative' }
      
      setExportStatus('Generating algorithm code...')
      
      // Create pure algorithm code with current state
      const pureAlgorithmCode = await createPureAlgorithmCode(currentSeed, palette, textRows)
      
      setExportStatus('Minifying and obfuscating...')
      
      // Minify and obfuscate
      const minifiedCode = minifyCode(pureAlgorithmCode)
      const obfuscatedCode = obfuscateWithTamilLetters(minifiedCode)
      
      setExportStatus('Creating HTML file...')
      
      // Create ultra-compressed NFT HTML
      const compressedHTML = createCompressedNFTHTML(currentSeed, palette, traits, obfuscatedCode)
      
      // Download the self-contained file
      const blob = new Blob([compressedHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `doormat-nft-${currentSeed}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      const fileSize = Math.round(compressedHTML.length / 1024)
      setExportStatus(`✅ NFT exported! File size: ${fileSize}KB`)
      
      console.log('NFT file size:', fileSize + 'KB')
      
    } catch (error) {
      console.error('Export failed:', error)
      setExportStatus(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FileText className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-green-400">NFT Export</h3>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
        <p className="text-sm text-gray-300 mb-4">
          Export your generated rug as a standalone HTML file. The file will be obfuscated and compressed for on-chain storage.
        </p>
        
        <button
          onClick={exportNFT}
          disabled={!isLoaded || isExporting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold px-6 py-3 rounded font-mono transition-colors border border-blue-400 flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>{isExporting ? 'EXPORTING...' : 'EXPORT NFT'}</span>
        </button>
        
        {exportStatus && (
          <div className="mt-3 p-3 rounded bg-gray-700 border border-gray-600">
            <div className="flex items-center space-x-2">
              {exportStatus.includes('✅') ? (
                <span className="text-green-400">✓</span>
              ) : exportStatus.includes('❌') ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              <span className="text-sm text-gray-300">{exportStatus}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
