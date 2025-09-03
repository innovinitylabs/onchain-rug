'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function GeneratorPage() {
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

    // Initialize everything
    const init = async () => {
      await loadP5()
      await loadDoormatScripts()
      
      // Wait a bit for everything to load, then initialize
      setTimeout(() => {
        if (typeof (window as any).generateFromSeed === 'function') {
          (window as any).generateFromSeed()
        }
      }, 500)
    }

    init()
  }, [])

  return (
    <div style={{
      margin: 0,
      padding: '20px',
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      {/* Back Button */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1000 }}>
        <Link href="/" className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>

      <div style={{ textAlign: 'center', maxWidth: '1400px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>🧶 Onchain Rug Generator</h1>
        <p style={{ color: '#666', marginBottom: '20px', lineHeight: 1.4 }}>
          A P5.js generative art piece inspired by traditional woven doormats.<br />
          Each generation creates unique stripe patterns, colors, and textures with fringe details.
        </p>

        <div style={{ margin: '20px 0', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => (window as any).generateNew && (window as any).generateNew()} style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}>Generate New Onchain Rug</button>
          <button onClick={() => (window as any).saveDoormat && (window as any).saveDoormat()} style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}>Save as Image</button>
          <input type="number" id="seedInput" style={{
            padding: '8px',
            border: '2px solid #8B4513',
            borderRadius: '5px',
            fontSize: '14px',
            width: '100px'
          }} placeholder="Seed" defaultValue="42" />
          <button onClick={() => (window as any).generateFromSeed && (window as any).generateFromSeed()} style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}>Use Seed</button>
          <button onClick={() => (window as any).exportNFT && (window as any).exportNFT()} style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}>Export NFT</button>
        </div>

        <div style={{ margin: '20px 0', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', width: '60px' }}>Row 1:</label>
              <input type="text" id="textInput1" style={{
                padding: '8px',
                border: '2px solid #8B4513',
                borderRadius: '5px',
                fontSize: '14px',
                width: '200px',
                margin: '0 10px'
              }} placeholder="Enter text (A-Z, 0-9, space)" maxLength={11} onInput={(e) => (window as any).validateTextInput && (window as any).validateTextInput(e.target)} />
            </div>
            <div id="additionalRows" style={{ display: 'none' }}>
              {/* Additional rows will be added here dynamically */}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button id="toggleRowsBtn" onClick={() => (window as any).toggleAdditionalRows && (window as any).toggleAdditionalRows()} style={{
                backgroundColor: '#4CAF50',
                fontSize: '12px',
                padding: '8px 16px',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>
                + Add More Rows
              </button>
              <button onClick={() => (window as any).addTextToDoormat && (window as any).addTextToDoormat()} style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#8B4513',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>Add Text</button>
              <button onClick={() => (window as any).clearText && (window as any).clearText()} style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#8B4513',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>Clear Text</button>
            </div>
          </div>
        </div>

        <div id="canvas-container" style={{
          margin: '20px 0',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'white',
          display: 'inline-block',
          width: '1320px', /* DOORMAT_HEIGHT + (FRINGE_LENGTH * 4) = 1200 + 120 = 1320 */
          height: '920px' /* DOORMAT_WIDTH + (FRINGE_LENGTH * 4) = 800 + 120 = 920 */
        }}>
          {/* P5.js canvas will be inserted here */}
        </div>

        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Current Color Palette</h3>
          <div id="paletteName" style={{ fontWeight: 'bold', color: '#666', marginBottom: '10px' }}>Loading...</div>
          <div id="colorSwatches" style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {/* Color swatches will be displayed here */}
          </div>
        </div>

        <div style={{
          margin: '20px 0',
          textAlign: 'center',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>NFT Traits</h3>
          <div id="traitsContainer" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            textAlign: 'left'
          }}>
            {/* Traits will be displayed here */}
          </div>
        </div>

        <p style={{ color: '#666', marginBottom: '20px', lineHeight: 1.4 }}>
          <strong>Instructions:</strong><br />
          • Click "Generate New Onchain Rug" for a random pattern<br />
          • Enter a seed number and click "Use Seed" for reproducible results<br />
          • Enter text to embed it into the rug pattern (max 11 characters, A-Z, 0-9, space only)<br />
          • Click "Save as Image" to download your rug
        </p>
      </div>

      {/* All the working JavaScript functions copied from your perfect implementation */}
      <script dangerouslySetInnerHTML={{
        __html: `
        let currentRowCount = 1; // Track how many rows are currently visible

        function generateNew() {
            const seed = Math.floor(Math.random() * 10000);
            document.getElementById('seedInput').value = seed;
            generateDoormat(seed);

            // Update palette and traits display after a short delay to ensure the sketch has updated
            setTimeout(() => {
                if (typeof window.updatePaletteDisplay === 'function' && typeof window.getCurrentPalette === 'function') {
                    const currentPalette = window.getCurrentPalette();
                    if (currentPalette) {
                        window.updatePaletteDisplay(currentPalette.name, currentPalette.colors);
                    }
                }
                // Force traits update as backup
                updateTraitsFromSketch();
            }, 150);
        }

        function generateFromSeed() {
            const seed = parseInt(document.getElementById('seedInput').value) || 42;
            generateDoormat(seed);

            // Update palette and traits display after a short delay to ensure the sketch has updated
            setTimeout(() => {
                if (typeof window.updatePaletteDisplay === 'function' && typeof window.getCurrentPalette === 'function') {
                    const currentPalette = window.getCurrentPalette();
                    if (currentPalette) {
                        window.updatePaletteDisplay(currentPalette.name, currentPalette.colors);
                    }
                }
                // Force traits update as backup
                updateTraitsFromSketch();
            }, 150);
        }

        function saveDoormat() {
            saveCanvas('doormat-' + Date.now(), 'png');
        }

        function addTextToDoormat() {
            const textRows = [];
            for (let i = 1; i <= 5; i++) {
                const input = document.getElementById('textInput' + i);
                if (input) {
                    const text = input.value.trim();
                    if (text) {
                        textRows.push(text);
                    }
                }
            }
            if (textRows.length > 0 && typeof window.addTextToDoormatInSketch === 'function') {
                window.addTextToDoormatInSketch(textRows);
            }
        }

        function toggleAdditionalRows() {
            if (currentRowCount < 5) {
                addRow();
            } else {
                // Hide all additional rows
                const additionalRows = document.getElementById('additionalRows');
                additionalRows.innerHTML = '';
                additionalRows.style.display = 'none';
                currentRowCount = 1;

                const toggleBtn = document.getElementById('toggleRowsBtn');
                toggleBtn.textContent = '+ Add More Rows';
                toggleBtn.style.backgroundColor = '#4CAF50';

                // Clear all additional row inputs
                for (let i = 2; i <= 5; i++) {
                    const input = document.getElementById('textInput' + i);
                    if (input) input.value = '';
                }
            }
        }

        function addRow() {
            if (currentRowCount >= 5) return; // Maximum 5 rows

            currentRowCount++;
            const additionalRows = document.getElementById('additionalRows');

            // Create new row element
            const newRow = document.createElement('div');
            newRow.style.display = 'flex';
            newRow.style.gap = '5px';
            newRow.style.alignItems = 'center';
            newRow.id = 'row' + currentRowCount;

            newRow.innerHTML = \`
                <label style="font-size: 12px; width: 60px;">Row \${currentRowCount}:</label>
                <input type="text" id="textInput\${currentRowCount}" style="padding: 8px; border: 2px solid #8B4513; border-radius: 5px; font-size: 14px; width: 200px; margin: 0 10px;" placeholder="Enter text (A-Z, 0-9, space)" maxlength="11" oninput="validateTextInput(this)">
                <button onclick="removeRow(\${currentRowCount})" style="background-color: #f44336; font-size: 10px; padding: 4px 8px; color: white; border: none; border-radius: 5px; cursor: pointer;">×</button>
            \`;

            additionalRows.appendChild(newRow);
            additionalRows.style.display = 'block';

            // Update button text
            updateAddRowButton();
        }

        function removeRow(rowNumber) {
            if (rowNumber <= 1) return; // Can't remove first row

            const rowElement = document.getElementById('row' + rowNumber);
            if (rowElement) {
                rowElement.remove();
                currentRowCount--;

                // Clear the input value
                const input = document.getElementById('textInput' + rowNumber);
                if (input) input.value = '';

                // Update button text and hide container if no additional rows
                updateAddRowButton();
            }
        }

        function updateAddRowButton() {
            const toggleBtn = document.getElementById('toggleRowsBtn');

            if (currentRowCount >= 5) {
                toggleBtn.textContent = '− Hide All Rows';
                toggleBtn.style.backgroundColor = '#f44336';
            } else {
                toggleBtn.textContent = '+ Add Row';
                toggleBtn.style.backgroundColor = '#4CAF50';
            }
        }

        function clearText() {
            // Clear all input values
            for (let i = 1; i <= 5; i++) {
                const input = document.getElementById('textInput' + i);
                if (input) input.value = '';
            }

            // Remove all additional rows and reset to single row
            const additionalRows = document.getElementById('additionalRows');
            additionalRows.innerHTML = '';
            additionalRows.style.display = 'none';

            // Reset row count and button
            currentRowCount = 1;
            updateAddRowButton();

            if (typeof window.clearTextFromDoormat === 'function') {
                window.clearTextFromDoormat();
            }
        }

        function validateTextInput(input) {
            // Remove any characters that are not A-Z, 0-9, or space
            input.value = input.value.replace(/[^A-Za-z0-9\\s]/g, '');
            // Convert to uppercase
            input.value = input.value.toUpperCase();
        }

        // Function to update the palette display
        function updatePaletteDisplay(paletteName, colors) {
            const nameElement = document.getElementById('paletteName');
            const swatchesElement = document.getElementById('colorSwatches');

            if (nameElement && swatchesElement) {
                nameElement.textContent = paletteName;

                // Clear existing swatches
                swatchesElement.innerHTML = '';

                // Create color swatches
                colors.forEach(color => {
                    const swatch = document.createElement('div');
                    swatch.style.cssText = \`
                        width: 40px;
                        height: 40px;
                        background-color: \${color};
                        border: 2px solid #333;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: transform 0.2s;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    \`;

                    // Add hover effect
                    swatch.addEventListener('mouseenter', () => {
                        swatch.style.transform = 'scale(1.1)';
                    });

                    swatch.addEventListener('mouseleave', () => {
                        swatch.style.transform = 'scale(1)';
                    });

                    // Add click to copy functionality
                    swatch.addEventListener('click', () => {
                        navigator.clipboard.writeText(color).then(() => {
                            // Show a brief "copied" message
                            const originalColor = swatch.style.backgroundColor;
                            swatch.style.backgroundColor = '#4CAF50';
                            swatch.style.borderColor = '#4CAF50';
                            setTimeout(() => {
                                swatch.style.backgroundColor = originalColor;
                                swatch.style.borderColor = '#333';
                            }, 500);
                        });
                    });

                    // Add tooltip with color code
                    swatch.title = \`Click to copy: \${color}\`;

                    swatchesElement.appendChild(swatch);
                });
            }
        }

        // Function to update the traits display
        function updateTraitsDisplay(traits) {
            const traitsContainer = document.getElementById('traitsContainer');

            if (traitsContainer && traits) {
                // Clear existing traits
                traitsContainer.innerHTML = '';

                // Create trait cards
                const traitItems = [
                    { label: 'Text Lines', value: traits.textLines, rarity: getTextLinesRarity(traits.textLines) },
                    { label: 'Total Characters', value: traits.totalCharacters, rarity: getCharacterRarity(traits.totalCharacters) },
                    { label: 'Palette Name', value: traits.paletteName, rarity: traits.paletteRarity },
                    { label: 'Palette Rarity', value: traits.paletteRarity, rarity: traits.paletteRarity },
                    { label: 'Stripe Count', value: traits.stripeCount, rarity: getStripeCountRarity(traits.stripeCount) },
                    { label: 'Stripe Complexity', value: traits.stripeComplexity, rarity: getStripeComplexityRarity(traits.stripeComplexity) }
                ];

                traitItems.forEach(trait => {
                    const traitCard = document.createElement('div');
                    traitCard.style.cssText = \`
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 8px;
                        padding: 12px;
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                    \`;

                    const rarityColor = getRarityColor(trait.rarity);

                    traitCard.innerHTML = \`
                        <div style="font-weight: bold; color: #333; font-size: 14px;">\${trait.label}</div>
                        <div style="color: #666; font-size: 16px;">\${trait.value}</div>
                        <div style="color: \${rarityColor}; font-weight: bold; font-size: 12px; text-transform: uppercase;">\${trait.rarity}</div>
                    \`;

                    traitsContainer.appendChild(traitCard);
                });
            }
        }

        // Helper functions for rarity calculation
        function getTextLinesRarity(lines) {
            if (lines >= 5) return "Legendary";
            if (lines >= 4) return "Epic";
            if (lines >= 3) return "Rare";
            if (lines >= 2) return "Uncommon";
            return "Common";
        }

        function getCharacterRarity(chars) {
            if (chars >= 40) return "Legendary";
            if (chars >= 30) return "Epic";
            if (chars >= 20) return "Rare";
            if (chars >= 10) return "Uncommon";
            return "Common";
        }

        function getStripeComplexityRarity(complexity) {
            switch(complexity) {
                case 'Very Complex': return "Legendary";
                case 'Complex': return "Epic";
                case 'Moderate': return "Rare";
                case 'Simple': return "Uncommon";
                case 'Basic': return "Common";
                default: return "Common";
            }
        }

        function getStripeCountRarity(count) {
            if (count >= 40) return "Legendary";
            if (count >= 32) return "Epic";
            if (count >= 25) return "Rare";
            if (count >= 18) return "Uncommon";
            return "Common";
        }

        function getRarityColor(rarity) {
            switch(rarity) {
                case 'Legendary': return '#ff6b35';
                case 'Epic': return '#9b59b6';
                case 'Rare': return '#3498db';
                case 'Uncommon': return '#2ecc71';
                case 'Common': return '#95a5a6';
                default: return '#666';
            }
        }

        // Function to update traits from the sketch
        function updateTraitsFromSketch() {
            console.log("updateTraitsFromSketch called");
            if (typeof window.calculateTraits === 'function') {
                console.log("calculateTraits function found");
                const traits = window.calculateTraits();
                console.log("About to update traits display with:", traits);
                updateTraitsDisplay(traits);
            } else {
                console.log("calculateTraits function not found");
            }
        }

        // Make the functions globally available for the P5.js sketch
        window.updatePaletteDisplay = updatePaletteDisplay;
        window.updateTraitsFromSketch = updateTraitsFromSketch;
        window.generateNew = generateNew;
        window.generateFromSeed = generateFromSeed;
        window.saveDoormat = saveDoormat;
        window.addTextToDoormat = addTextToDoormat;
        window.toggleAdditionalRows = toggleAdditionalRows;
        window.clearText = clearText;
        window.validateTextInput = validateTextInput;
        window.exportNFT = exportNFT;

        // Function to create clean working doormat code
        async function createPureAlgorithmCode(seed, currentPalette, currentStripeData, textRows) {
            // Get only the characters actually used in text
            const usedChars = getUsedCharacters(textRows);
            
            // Dynamically extract functions from doormat.js
            const coreAlgorithm = await extractCoreAlgorithmFromSource();
            
            // Create pure, self-contained algorithm with dynamic extraction
            const pureCode = \`
// Doormat NFT #\${seed} - Self-contained algorithm
const config = \${JSON.stringify(window.DOORMAT_CONFIG)};
let doormatWidth = config.DOORMAT_WIDTH;
let doormatHeight = config.DOORMAT_HEIGHT;
let fringeLength = config.FRINGE_LENGTH;
let weftThickness = config.WEFT_THICKNESS;
let warpThickness = 2;
let TEXT_SCALE = config.TEXT_SCALE;

// Embedded current state
let selectedPalette = \${JSON.stringify(currentPalette)};
let stripeData = \${JSON.stringify(currentStripeData)};
let doormatTextRows = \${JSON.stringify(textRows)};
let textData = [];

// Text colors
let lightTextColor, darkTextColor;

// Embedded character map (only used characters)
const characterMap = \${JSON.stringify(usedChars)};

function setup() {
    let totalWidth = doormatWidth + fringeLength * 4;
    let totalHeight = doormatHeight + fringeLength * 4;
    createCanvas(totalHeight, totalWidth);
    pixelDensity(2.5);
    noLoop();
    
    randomSeed(\${seed});
    noiseSeed(\${seed});
    
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
    
    for (let stripe of stripeData) {
        drawStripe(stripe);
    }
    
    drawTextureOverlay();
    pop();
    
    drawFringe();
    drawSelvedgeEdges();
    
    pop();
}

\${coreAlgorithm}
\`;
            return pureCode;
        }

        function getUsedCharacters(textRows) {
            const used = new Set();
            textRows.forEach(row => {
                for (let char of row.toUpperCase()) {
                    used.add(char);
                }
            });
            used.add(' '); // Always include space
            
            const usedCharMap = {};
            used.forEach(char => {
                if (window.characterMap && window.characterMap[char]) {
                    usedCharMap[char] = window.characterMap[char];
                }
            });
            return usedCharMap;
        }

        async function extractCoreAlgorithmFromSource() {
            // Dynamically extract functions from doormat.js source
            try {
                const response = await fetch('/lib/doormat/doormat.js');
                const sourceCode = await response.text();
                
                // Extract specific functions using regex patterns
                const functions = [
                    'updateTextColors',
                    'drawStripe', 
                    'drawTextureOverlay',
                    'drawFringe',
                    'drawSelvedgeEdges', 
                    'drawFringeSection',
                    'drawTexturedSelvedgeArc',
                    'generateTextData',
                    'generateCharacterPixels'
                ];
                
                let extractedCode = '';
                
                functions.forEach(funcName => {
                    // More robust regex to capture function definitions
                    const regex = new RegExp(\`function\\\\s+\${funcName}\\\\s*\\\\([^)]*\\\\)\\\\s*{[\\\\s\\\\S]*?\\\\n}\`, 'm');
                    const match = sourceCode.match(regex);
                    if (match) {
                        extractedCode += match[0] + '\\n\\n';
                    } else {
                        console.warn(\`Function \${funcName} not found in source\`);
                    }
                });
                
                return extractedCode;
            } catch (error) {
                console.error('Failed to extract core algorithm:', error);
                // Fallback to a minimal implementation
                return \`
function updateTextColors() {
    if (!selectedPalette || !selectedPalette.colors) return;
    lightTextColor = color(255);
    darkTextColor = color(0);
}
function drawStripe() { /* Fallback implementation */ }
function drawTextureOverlay() { /* Fallback implementation */ }
function drawFringe() { /* Fallback implementation */ }
function drawSelvedgeEdges() { /* Fallback implementation */ }
function drawFringeSection() { /* Fallback implementation */ }
function generateTextData() { textData = []; }
function generateCharacterPixels() { return []; }\`;
            }
        }

        function minifyCode(code) {
            // Ultra-minimal minification to prevent all syntax errors
            return code
                // Remove all comments only
                .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '') // Remove /* */ comments
                .replace(/\\/\\/.*$/gm, '') // Remove // comments
                
                // Replace multiple whitespace with single space only
                .replace(/\\s+/g, ' ') // Replace multiple whitespace with single space
                
                // Final cleanup
                .trim();
        }

        function obfuscateWithTamilLetters(code) {
            // Tamil letters for variable obfuscation
            const tamilLetters = ['அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','ஔ','க','ங','ச','ஜ','ஞ','ட','ண','த','ந','ப','ம','ய','ர','ல','வ','ஶ','ஷ','ஸ','ஹ','ா','ி','ீ','ு','ூ','ெ','ே','ை','ொ','ோ','ௌ'];
            
            // Comprehensive list of variables to obfuscate using dictionary replacement
            const obfuscationMap = {
                // Core variables
                'doormatWidth': 'அ',
                'doormatHeight': 'ஆ', 
                'fringeLength': 'இ',
                'weftThickness': 'ஈ',
                'warpThickness': 'உ',
                'selectedPalette': 'ஊ',
                'stripeData': 'எ',
                'doormatTextRows': 'ஏ',
                'textData': 'ஐ',
                'lightTextColor': 'ஒ',
                'darkTextColor': 'ஓ'
            };
            
            let obfuscatedCode = code;
            
            // Use simple string replacement instead of regex for better performance and safety
            Object.entries(obfuscationMap).forEach(([original, replacement]) => {
                if (obfuscatedCode.includes(original)) {
                    // Use word boundary replacement to avoid partial matches
                    const regex = new RegExp('\\\\b' + original + '\\\\b', 'g');
                    obfuscatedCode = obfuscatedCode.replace(regex, replacement);
                }
            });
            
            return obfuscatedCode;
        }

        function createCompressedNFTHTML(seed, palette, traits, obfuscatedCode) {
            // Create ultra-compressed NFT HTML with minimal structure
            const traitsText = Object.entries(traits).map(entry => entry[0] + ':' + entry[1]).join('|');
            
            // Build HTML safely with string concatenation to avoid template literal issues
            let html = '<!DOCTYPE html>';
            html += '<html>';
            html += '<head>';
            html += '<meta charset="UTF-8">';
            html += '<title>NFT#' + seed + '</title>';
            html += '<style>';
            html += 'body{margin:0;padding:0;background:#f5f2ee;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:Arial,sans-serif}';
            html += 'canvas{border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15)}';
            html += '.i{position:absolute;bottom:10px;left:10px;color:#4a4a4a;font-size:10px;opacity:0.8}';
            html += '.t{position:absolute;bottom:10px;right:10px;color:#4a4a4a;font-size:8px;opacity:0.8;text-align:right}';
            html += '</style>';
            html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></' + 'script>';
            html += '</head>';
            html += '<body>';
            html += '<div class="i">S:' + seed + '|P:' + palette.name + '</div>';
            html += '<div class="t">' + traitsText + '</div>';
            html += '<div id="c"></div>';
            html += '<script>' + obfuscatedCode + '</' + 'script>';
            html += '</body>';
            html += '</html>';
            
            return html;
        }

        async function exportNFT() {
            // Get current state
            const seed = document.getElementById('seedInput').value;
            const textRows = [];
            for (let i = 1; i <= 5; i++) {
                const input = document.getElementById('textInput' + i);
                if (input && input.value.trim()) {
                    textRows.push(input.value.trim());
                }
            }
            
            // Get current palette and traits
            const palette = window.getCurrentPalette ? window.getCurrentPalette() : { name: 'Unknown', colors: [] };
            const traits = window.calculateTraits ? window.calculateTraits() : {};
            
            // Get current stripe data from the live sketch
            const currentStripeData = window.stripeData || [];
            
            try {
                // Create pure algorithm code with current state (async)
                const pureAlgorithmCode = await createPureAlgorithmCode(parseInt(seed), palette, currentStripeData, textRows);
                
                // Minify and obfuscate
                const minifiedCode = minifyCode(pureAlgorithmCode);
                const obfuscatedCode = obfuscateWithTamilLetters(minifiedCode);
                
                // Create ultra-compressed NFT HTML
                const compressedHTML = createCompressedNFTHTML(seed, palette, traits, obfuscatedCode);
                
                // Download the self-contained file
                const blob = new Blob([compressedHTML], { type: 'text/html' });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'doormat-nft-' + seed + '.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log('NFT file size:', Math.round(compressedHTML.length / 1024) + 'KB');
                alert('NFT HTML exported! File size: ' + Math.round(compressedHTML.length / 1024) + 'KB - ready for on-chain storage.');
                
            } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed: ' + error.message);
            }
        }

        // Generate initial doormat
        window.addEventListener('load', () => {
            setTimeout(() => {
                generateFromSeed();
                // Update traits after initial generation
                setTimeout(() => {
                    updateTraitsFromSketch();
                }, 200);
            }, 1000);
        });
        `
      }} />
    </div>
  )
}
