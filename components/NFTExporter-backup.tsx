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

  // Obfuscation map using Tamil letters (EXACT same as Doormat reference)
  const obfuscationMap: { [key: string]: string } = {
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
    'darkTextColor': 'ஓ',
    
    // Stripe and weaving variables
    'primaryColor': 'ம',
    'secondaryColor': 'ய',
    'warpColor': 'ர',
    'weftColor': 'ல',
    'selvedgeColor': 'வ',
    'fringeColor': 'ஶ',
    'isTextPixel': 'ப',
    'warpSpacing': 'த',
    'weftSpacing': 'ந',
    'scaledWarp': 'ஷ',
    'scaledWeft': 'ஸ',
    'charWidth': 'ஹ',
    'charHeight': 'தா',
    'textPixel': 'தி',
    'noiseVal': 'தீ',
    'blendFactor': 'து',
    'threadRadius': 'தூ',
    'threadColor': 'தெ',
    'strandColor': 'தே',
    'waveAmplitude': 'தை',
    'curlIntensity': 'தொ',
    'threadLength': 'தோ',
    'reliefNoise': 'தௌ',
    
    // Missing long variables from reference
    'weaveType': 'ᄀ',
    'warpVariation': 'ᄁ',
    'totalWidth': 'ᄃ',
    'totalHeight': 'ᄄ',
    'characterMap': 'ᄅ',
    'fringeStrands': 'ᄆ',
    'strandWidth': 'ᄇ',
    'threadCount': 'ᄈ',
    'threadSpacing': 'ᄉ',
    'startAngle': 'ᄊ',
    'endAngle': 'ᄋ',
    'centerX': 'ᄌ',
    'centerY': 'ᄍ',
    'strandX': 'ᄎ',
    'threadX': 'ᄏ',
    'threadY': 'ᄐ',
    'detailRadius': 'ᄑ',
    'detailAngle': 'ᄒ',
    'shadowOffset': 'ᄓ',
    'hatchingIntensity': 'ᄔ',
    'bgBrightness': 'ᄕ',
    'warpCurve': 'ᄖ',
    'weftCurve': 'ᄗ',
    
    // Additional long variables from reference - using 2-letter Tamil combinations
    'threadR': 'கஅ',
    'threadG': 'கஆ', 
    'threadB': 'கஇ',
    'detailX': 'கஈ',
    'detailY': 'கஉ',
    'detailAlpha': 'கஊ',
    'detailR': 'கஎ',
    'detailG': 'கஏ',
    'detailB': 'கஐ',
    'threadStartAngle': 'கஒ',
    'threadEndAngle': 'கஓ',
    'direction': 'கஔஅ',
    'waveFreq': 'கங',
    'spacing': 'கச',
    'rowSpacing': 'கஜ',
    'totalRowsWidth': 'கஞ',
    'baseStartX': 'கட',
    'textWidth': 'கண',
    'textHeight': 'கத',
    'startY': 'கந',
    'charY': 'கப',
    'charPixels': 'கம',
    'doormatText': 'கய',
    'pixels': 'கர',
    'charDef': 'கல',
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
    
    // Function names (be careful with these - EXACT same as reference)
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
    // Ultra-minimal minification to prevent all syntax errors (EXACT same as reference)
    return code
      // Remove all comments only
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, '') // Remove // comments
      
      // Replace multiple whitespace with single space only
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      
      // Final cleanup
      .trim()
  }

  const obfuscateWithTamilLetters = (code: string): string => {
    let obfuscatedCode = code
    
    // Use simple string replacement instead of regex for better performance and safety
    Object.entries(obfuscationMap).forEach(([original, replacement]) => {
      if (obfuscatedCode.includes(original)) {
        // Use word boundary replacement to avoid partial matches
        const regex = new RegExp('\\b' + original + '\\b', 'g')
        obfuscatedCode = obfuscatedCode.replace(regex, replacement)
      }
    })
    
    return obfuscatedCode
  }

  const getUsedCharacters = (textRows: string[]) => {
    const used = new Set<string>()
    textRows.forEach(row => {
      for (let char of row.toUpperCase()) {
        used.add(char)
      }
    })
    used.add(' ') // Always include space
    
    // Get the actual character map from the loaded scripts (EXACT same as Doormat reference)
    const actualCharMap = (window as any).characterMap || {}
    const usedCharMap: { [key: string]: any } = {}
    
    used.forEach(char => {
      if (actualCharMap[char]) {
        usedCharMap[char] = actualCharMap[char]
      }
    })
    
    return usedCharMap
  }

  const extractCoreAlgorithmFromSource = async (): Promise<string> => {
    // Dynamically extract functions from doormat.js source (EXACT same as Doormat reference)
    try {
      const response = await fetch('/lib/doormat/doormat.js')
      const sourceCode = await response.text()
      
      // Extract specific functions using regex patterns (EXACT same as Doormat reference)
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
      ]
      
      let extractedCode = ''
      
      functions.forEach(funcName => {
        // More robust regex to capture function definitions (EXACT same as Doormat reference)
        const regex = new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?\\n}`, 'm')
        const match = sourceCode.match(regex)
        if (match) {
          extractedCode += match[0] + '\n\n'
        } else {
          console.warn(`Function ${funcName} not found in source`)
        }
      })
      
      return extractedCode
    } catch (error) {
      console.error('Failed to extract core algorithm:', error)
      // Fallback to a minimal implementation (EXACT same as Doormat reference)
      return `
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
function generateCharacterPixels() { return []; }`
    }
  }

  const createCompressedNFTHTML = (seed: number, palette: any, traits: any, obfuscatedCode: string) => {
    // Create ultra-compressed NFT HTML with minimal structure (EXACT same as reference)
    const traitsText = Object.entries(traits || {}).map(entry => entry[0] + ':' + entry[1]).join('|')
    
    // Build HTML safely with string concatenation to avoid template literal issues
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
    
    // Add the "under-the-rug" div (EXACT same as reference)
    html += '<div class="under-the-rug" style="position:absolute;left:0;top:calc(100% + 920px + 20px);width:100%;height:auto;opacity:0;pointer-events:none;user-select:none;font-size:1px;color:transparent;z-index:-1;">Bengal Famine 1770 Bengal Famine 1873 Bengal Famine 1943 Irish Famine Orissa Famine 1866 Madras Famine 1876 Jallianwala Bagh Amritsar Massacre Salt Tax Partition of India Indian Rebellion 1857 Mau Mau Uprising Boer Camps Malayan Emergency Opium Wars Drain of Wealth Deindustrialisation Indigo Revolt Forced Opium Farming Enfield Cartridges Tasmanian Genocide Aboriginal Massacres Caribbean Slavery Atlantic Slave Trade Plantation Famines Benin Bronzes Looting Koh-i-Noor Plunder Scramble for Africa Native American Genocide Congo Free State Armenian Genocide Khmer Rouge Unit 731 Apartheid Iraq War Toll Guantanamo Torture Climate Colonialism Corporate Colonialism Resource Plunder Indigenous Land Theft Highland Clearances Criminal Tribes Act Suppression of Irish Gaelic Banning Indian Languages Cultural Erasure Māori Colonial Amnesia Decolonize Looted Erased Suppressed Censored Plunder DIVIDE AND RULE And Its Long Lasting Effects Cultural Theft Stolen Voices Swept Under the Rug Colonialism Famine Partition Exploitation Resistance Independence Slavery Oppression Resilience Diaspora Identity Justice Healing Memory Heritage Tradition Land Language Culture Freedom Unity Struggle Rebellion Revolution Community Self-Determination Ancestry Displacement Survival Trauma Reparations Solidarity Decolonization British Engineered Famines Changing Genetics And Indian Diabetes As Its Result Gaza Israel Palestine Genocide Occupation Imperialism Global South Solidarity Decolonial Resistance Imperial Echoes Structural Violence Tanzanian Maji-Maji Rebellion Britishgenocides Colonial barbarisms Britishgenocides Colonial barbarisms Abolition Of Slavery After Institutionalising It And Profiting For Centuries When Its No Longer Profitable After Losing America And REINVENTION OF SLAVERY With INDIAN INDENTURE Paying Slave Owners Reparations Chauri Chaura Massacre 1922 Vellore Mutiny 1806 Kuki Rebellion Khasi Uprising Moplah Rebellion 1921 Calico Ban 1700s Indentured Labour Caribbean Fiji Mauritius Black Hole of Calcutta Propaganda Partition of Bengal 1905 Vernacular Press Act 1878 Suppression of Indian Press Shipbuilding Ban Indian Steel Ban Systemic Raj Famines Herero Nama Genocide Zanzibar Revolution 1964 Rohingya Persecution Rwandan Genocide 1994 Bosnia Srebrenica 1995 Hiroshima Nagasaki Vietnam Napalm Agent Orange Afghanistan War Toll Yemen Famine Syrian Civil War Ashokan Pillar Theft Nalanda Burning Tipu Sultan Treasures Dravidian Suppression Witch Hunts Britain Colonies And Imposing Victorian Morals Which Opressed Women Spanish Inquisition Conquest of the Americas Aztec Empire destruction Inca Empire destruction Mayan cultural destruction Encomienda system Forced Christian conversions Missionary violence Destruction of Taino people Hispaniola genocide Portuguese Brazil slavery Amazon rubber atrocities Dutch East Indies massacres Banda Islands massacre 1621 Aceh wars Java War 1825–1830 Cultivation System forced farming Belgian Congo atrocities Rubber terror Hand amputations Leopold II exploitation French Algeria massacres Sétif massacre 1945 Madagascar uprising repression 1947 Paris massacre 1961 FLN torture by French army Indochina exploitation Vietnam colonization Cambodian forced labor Laos exploitation Opium monopolies Italian invasion of Libya Cyrenaica concentration camps 1920s Graziani massacres Ethiopia invasion 1935 Yekatit 12 massacre Eritrea exploitation Somali coast colonization German Herero genocide 1904 Nama genocide German East Africa Maji-Maji rebellion suppression Italian East Africa atrocities Portuguese Angola forced labor Portuguese Mozambique forced labor Guinea-Bissau colonial war Cape Verde famine under Portugal Spanish Sahara repression Western Sahara occupation Timor-Leste massacre Santa Cruz 1991 Dutch South Africa Cape Colony slavery Boer wars Dutch slave trade Suriname plantations Aruba Curacao exploitation Neo-colonial IMF debt traps Structural Adjustment Programs European resource extraction Africa French CFA FRANC control Neocolonial military coups Francafrique network EU fishing exploitation Senegal Mauritania African debt peonage NATO Libya intervention 2011 Iraq sanctions civilian toll Afghanistan endless war Kosovo bombings Serbia 1999 Greece austerity imposed by EU Economic structural violence Colonial exhibitions Human zoos 19th century Skull collecting Phrenology Racial science Apartheid roots Dutch British German complicity Namibia uranium mining exploitation Uranium mining Niger by French Areva Gold and diamond plunder Sierra Leone Blood diamonds De Beers cartel Neo-colonial corporate land grab Bio-piracy Monsanto seed colonialism Rare earth extraction Africa Exploitation of Congo cobalt Modern sweatshops Bangladesh supply chains EU border fortress Refugee drownings Mediterranean arms trade profiteering Yemen arms sales by UK France Germany Neocolonial climate debt Carbon offset colonialism Green colonialism Land grabbing Ethiopia Kenya Tanzania Tourism colonial gaze UN Security Council dominated by colonial powers IMF World Bank debt slavery Structural Adjustment Programs Neocolonial monetary control Dollar hegemony FED money printing global inflation WTO trade rules favoring West Permanent members old empires Global South voiceless India excluded despite one fourth humanity G7 economic cartel NATO military arm of empire Sanctions as warfare Resource extraction disguised as aid Climate debt imposed on South Vaccine apartheid Intellectual property colonialism Unequal internet governance Colonial masters rebranded as international community ElonMusk neoNazi dogwhistles Grok logo SS symbolism Techfascism whitewashing SiliconValley eugenics echoes KresyMassacres Volhynia EasternGalicia PolishRetaliationMassacres PolishLithuanianCommonwealthExpansion ForcedCatholicization Serfdom JewishPogroms KielcePogrom1946 ExpulsionOfGermans PostWWIIDeaths OperationVistula1947 UkrainianDeportations LemkoDisplacement AntiRomaViolence AntiSemiticCampaign1968 HolocaustSurvivorsAttacked HolocaustRevisionism FarRightMovements RefugeePushbacks BelarusBorder Ukraine War As NATO Weapons Testing Bed Royal Family Same Family UK gov same gov which carried TheGreatBritishGenocides</div>'
    
    html += '<script>' + obfuscatedCode + '</' + 'script>'
    html += '</body>'
    html += '</html>'
    
    return html
  }

  // Function to create clean working doormat code (ADAPTED for current modified algorithm)
  const createPureAlgorithmCode = (seed: number, currentPalette: any, currentStripeData: any[], textRows: string[]) => {
    const usedChars = getUsedCharacters(textRows);
    
    const pureCode = `
// Doormat NFT #${seed} - EXACT Algorithm from Live Generator
// This is a direct copy of the algorithm running in lib/doormat/doormat.js

// Configuration from lib/doormat/doormat-config.js
const config = {
    DOORMAT_WIDTH: ${(window as any).DOORMAT_CONFIG?.DOORMAT_WIDTH || 800},
    DOORMAT_HEIGHT: ${(window as any).DOORMAT_CONFIG?.DOORMAT_HEIGHT || 1200},
    FRINGE_LENGTH: ${(window as any).DOORMAT_CONFIG?.FRINGE_LENGTH || 30},
    WEFT_THICKNESS: ${(window as any).DOORMAT_CONFIG?.WEFT_THICKNESS || 8},
    TEXT_SCALE: ${(window as any).DOORMAT_CONFIG?.TEXT_SCALE || 2},
    MAX_CHARS: ${(window as any).DOORMAT_CONFIG?.MAX_CHARS || 11},
    MAX_TEXT_ROWS: ${(window as any).DOORMAT_CONFIG?.MAX_TEXT_ROWS || 5}
};

// Dimensions
let doormatWidth = config.DOORMAT_WIDTH;
let doormatHeight = config.DOORMAT_HEIGHT;
let fringeLength = config.FRINGE_LENGTH;
let weftThickness = config.WEFT_THICKNESS;
let warpThickness = 2;
let TEXT_SCALE = config.TEXT_SCALE;
let MAX_CHARS = config.MAX_CHARS;

// Embedded data
let selectedPalette = ${JSON.stringify(currentPalette)};
let stripeData = ${JSON.stringify(currentStripeData)};
let doormatTextRows = ${JSON.stringify(textRows)};
let textData = [];

// Colors
let lightTextColor, darkTextColor;

// Character map (only used characters)
const characterMap = ${JSON.stringify(usedChars)};

function setup() {
    let totalWidth = doormatWidth + fringeLength * 4;
    let totalHeight = doormatHeight + fringeLength * 4;
    createCanvas(totalHeight, totalWidth);
    pixelDensity(1);
    noLoop();
    
    randomSeed(${seed});
    noiseSeed(${seed});
    
    updateTextColors();
    generateTextData();
    
    draw();
}

function draw() {
    // Use a background that won't create visible bands after rotation
    background(222, 222, 222); // Pure white background to avoid visible bands
    
    // Rotate canvas 90 degrees clockwise
    push();
    translate(width/2, height/2);
    rotate(PI/2);
    translate(-height/2, -width/2);
    
    // Draw the main doormat area
    push();
    // Center the doormat within the larger canvas buffer
    translate(fringeLength * 2, fringeLength * 2);
    
    // Draw stripes
    for (let stripe of stripeData) {
        drawStripe(stripe);
    }
    
    // Add overall texture overlay
    drawTextureOverlay();
    
    pop();
    
    // Draw fringe with adjusted positioning for larger canvas
    drawFringe();
    
    pop(); // End rotation
}

function updateTextColors() {
    if (!selectedPalette || !selectedPalette.colors) return;
    
    let darkest = selectedPalette.colors[0];
    let lightest = selectedPalette.colors[0];
    let darkestVal = 999, lightestVal = -1;
    
    for (let hex of selectedPalette.colors) {
        let c = color(hex);
        let bright = (red(c) + green(c) + blue(c)) / 3;
        if (bright < darkestVal) { darkestVal = bright; darkest = hex; }
        if (bright > lightestVal) { lightestVal = bright; lightest = hex; }
    }
    
    darkTextColor = color(darkest);
    lightTextColor = lerpColor(color(lightest), color(255), 0.3);
    darkTextColor = lerpColor(color(darkest), color(0), 0.4);
}

function drawStripe(stripe) {
    // Create a proper plain weave structure like the diagram
    let warpSpacing = warpThickness + 1; // Space between warp threads
    let weftSpacing = weftThickness + 1; // Space between weft threads
    
    // First, draw the warp threads (vertical) as the foundation
    for (let x = 0; x < doormatWidth; x += warpSpacing) {
        for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
            let warpColor = color(stripe.primaryColor);
            
            // Check if this position should be modified for text
            let isTextPixel = false;
            if (textData.length > 0) {
                for (let textPixel of textData) {
                    if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                        y >= textPixel.y && y < textPixel.y + textPixel.height) {
                        isTextPixel = true;
                        break;
                    }
                }
            }
            
            // Add subtle variation to warp threads
            let r = red(warpColor) + random(-15, 15);
            let g = green(warpColor) + random(-15, 15);
            let b = blue(warpColor) + random(-15, 15);
            
            // Modify color for text pixels (vertical lines use weft thickness)
            if (isTextPixel) {
                const bgBrightness = (r + g + b) / 3;
                let tc = bgBrightness < 128 ? lightTextColor : darkTextColor;
                r = red(tc); g = green(tc); b = blue(tc);
            }
            
            r = constrain(r, 0, 255);
            g = constrain(g, 0, 255);
            b = constrain(b, 0, 255);
            
            fill(r, g, b);
            noStroke();
            
            // Draw warp thread with slight curve for natural look
            let warpCurve = sin(y * 0.05) * 0.5;
            rect(x + warpCurve, y, warpThickness, weftSpacing);
        }
    }
    
    // Now draw the weft threads (horizontal) that interlace with warp
    for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        for (let x = 0; x < doormatWidth; x += warpSpacing) {
            let weftColor = color(stripe.primaryColor);
            
            // Check if this position should be modified for text
            let isTextPixel = false;
            if (textData.length > 0) {
                for (let textPixel of textData) {
                    if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                        y >= textPixel.y && y < textPixel.y + textPixel.height) {
                        isTextPixel = true;
                        break;
                    }
                }
            }
            
            // Add variation based on weave type
            if (stripe.weaveType === 'mixed' && stripe.secondaryColor) {
                if (noise(x * 0.1, y * 0.1) > 0.5) {
                    weftColor = color(stripe.secondaryColor);
                }
            } else if (stripe.weaveType === 'textured') {
                let noiseVal = noise(x * 0.05, y * 0.05);
                weftColor = lerpColor(color(stripe.primaryColor), color(255), noiseVal * 0.15);
            }
            
            // Add fabric irregularities
            let r = red(weftColor) + random(-20, 20);
            let g = green(weftColor) + random(-20, 20);
            let b = blue(weftColor) + random(-20, 20);
            
            // Modify color for text pixels (horizontal lines use warp thickness)
            if (isTextPixel) {
                const bgBrightness = (r + g + b) / 3;
                let tc = bgBrightness < 128 ? lightTextColor : darkTextColor;
                r = red(tc); g = green(tc); b = blue(tc);
            }
            
            r = constrain(r, 0, 255);
            g = constrain(g, 0, 255);
            b = constrain(b, 0, 255);
            
            fill(r, g, b);
            noStroke();
            
            // Draw weft thread with slight curve
            let weftCurve = cos(x * 0.05) * 0.5;
            rect(x, y + weftCurve, warpSpacing, weftThickness);
        }
    }
    
    // Add the interlacing effect - make some threads appear to go over/under
    for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing * 2) {
        for (let x = 0; x < doormatWidth; x += warpSpacing * 2) {
            // Create shadow effect for threads that appear to go under
            fill(0, 0, 0, 40);
            noStroke();
            rect(x + 1, y + 1, warpSpacing - 2, weftSpacing - 2);
        }
    }
    
    // Add subtle highlights for threads that appear to go over
    for (let y = stripe.y + weftSpacing; y < stripe.y + stripe.height; y += weftSpacing * 2) {
        for (let x = warpSpacing; x < doormatWidth; x += warpSpacing * 2) {
            fill(255, 255, 255, 30);
            noStroke();
            rect(x, y, warpSpacing - 1, weftSpacing - 1);
        }
    }
}

function drawTextureOverlay() {
    push();
    blendMode(MULTIPLY);
    
    // Fine texture
    for (let x = 0; x < doormatWidth; x += 2) {
        for (let y = 0; y < doormatHeight; y += 2) {
            let noiseValue = noise(x * 0.02, y * 0.02);
            let alpha = map(noiseValue, 0, 1, 0, 50);
            fill(0, 0, 0, alpha);
            noStroke();
            rect(x, y, 2, 2);
        }
    }
    
    // Coarse texture
    for (let x = 0; x < doormatWidth; x += 6) {
        for (let y = 0; y < doormatHeight; y += 6) {
            let noiseValue = noise(x * 0.03, y * 0.03);
            if (noiseValue > 0.6) {
                fill(255, 255, 255, 25);
                noStroke();
                rect(x, y, 6, 6);
            } else if (noiseValue < 0.4) {
                fill(0, 0, 0, 20);
                noStroke();
                rect(x, y, 6, 6);
            }
        }
    }
    
    pop();
}

function drawFringe() {
    // Draw top and bottom fringe with frayed edges
    drawFringeSection(fringeLength * 2, fringeLength, doormatWidth, fringeLength, 'top');
    drawFringeSection(fringeLength * 2, fringeLength * 2 + doormatHeight, doormatWidth, fringeLength, 'bottom');
    
    // Draw left and right fringe with frayed edges
    drawFringeSection(fringeLength, fringeLength * 2, fringeLength, doormatHeight, 'left');
    drawFringeSection(fringeLength * 2 + doormatWidth, fringeLength * 2, fringeLength, doormatHeight, 'right');
    
    drawBorder();
}

function drawFringeSection(x, y, w, h, side) {
    let segments = w / 12;
    let segmentWidth = w / segments;
    
    for (let i = 0; i < segments; i++) {
        let segmentX = x + i * segmentWidth;
        let baseColor = random(selectedPalette.colors);
        
        for (let j = 0; j < 12; j++) {
            let threadX = segmentX + random(-segmentWidth/6, segmentWidth/6);
            let startY = side === 'top' ? y + h : y;
            let endY = side === 'top' ? y : y + h;
            let amplitude = random(1, 4);
            let frequency = random(0.2, 0.8);
            let direction = random([-1, 1]);
            let phase = random(0.5, 2.0);
            let stretch = random(0.8, 1.2);
            
            let threadColor = color(baseColor);
            let r = red(threadColor) * 0.7;
            let g = green(threadColor) * 0.7;
            let b = blue(threadColor) * 0.7;
            
            stroke(r, g, b);
            strokeWeight(random(0.5, 1.2));
            noFill();
            
            beginShape();
            for (let t = 0; t <= 1; t += 0.1) {
                let threadY = lerp(startY, endY, t * stretch);
                let threadX = sin(t * PI * frequency) * amplitude * t * direction * phase;
                threadX += random(-1, 1);
                if (random() < 0.3) {
                    threadX += random(-2, 2);
                }
                vertex(threadX, threadY);
            }
            endShape();
        }
    }
    
    // Add extra frayed threads for more realistic appearance
    for (let i = 0; i < 8; i++) {
        let threadX = x + random(0, w);
        let threadY = side === 'top' ? y + h + random(0, 5) : y - random(0, 5);
        let threadLength = random(8, 15);
        let threadColor = random(selectedPalette.colors);
        
        stroke(threadColor);
        strokeWeight(random(0.3, 0.8));
        noFill();
        
        beginShape();
        for (let t = 0; t <= 1; t += 0.2) {
            let offsetX = random(-2, 2);
            let offsetY = side === 'top' ? threadLength * t : -threadLength * t;
            vertex(threadX + offsetX, threadY + offsetY);
        }
        endShape();
    }
}

function drawBorder() {
    // Simple border drawing
    stroke(100);
    strokeWeight(2);
    noFill();
    rect(-fringeLength * 2, -fringeLength * 2, doormatWidth + fringeLength * 4, doormatHeight + fringeLength * 4);
}

function generateTextData() {
    textData = [];
    const textRows = doormatTextRows || [];
    if (!textRows || textRows.length === 0) return;
    
    const warpSpacing = warpThickness + 1;
    const weftSpacing = weftThickness + 1;
    const charWidth = warpSpacing * TEXT_SCALE;
    const charHeight = weftSpacing * TEXT_SCALE;
    const charSpacing = charWidth * 1.5;
    const rowSpacing = charHeight * 1.5;
    const totalWidth = textRows.length * charWidth + (textRows.length - 1) * charSpacing;
    const startX = (doormatWidth - totalWidth) / 2;
    
    for (let rowIndex = 0; rowIndex < textRows.length; rowIndex++) {
        const rowText = textRows[rowIndex];
        if (!rowText) continue;
        
        const rowWidth = charWidth;
        const rowHeight = rowText.length * (charHeight + charSpacing) - charSpacing;
        const startY = (doormatHeight - rowHeight) / 2;
        
        for (let i = 0; i < rowText.length; i++) {
            const char = rowText.charAt(i);
            const charY = startY + (rowText.length - 1 - i) * (charHeight + charSpacing);
            const charPixels = generateCharacterPixels(char, startX, charY, rowWidth, charHeight);
            textData.push(...charPixels);
        }
    }
}

function generateCharacterPixels(char, x, y, width, height) {
    const pixels = [];
    const warpSpacing = warpThickness + 1;
    const weftSpacing = weftThickness + 1;
    const charWarp = warpSpacing * TEXT_SCALE;
    const charWeft = weftSpacing * TEXT_SCALE;
    
    // Enhanced character map with more characters
    const charMap = {
        'A': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
        'B': [[1,1,1,1,0], [1,0,0,0,1], [1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,0]],
        'C': [[0,1,1,1,1], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [0,1,1,1,1]],
        'D': [[1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,0]],
        'E': [[1,1,1,1,1], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,0], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,1]],
        'F': [[1,1,1,1,1], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0]],
        'G': [[0,1,1,1,1], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,1,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,1]],
        'H': [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
        'I': [[1,1,1,1,1], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [1,1,1,1,1]],
        'J': [[0,0,0,0,1], [0,0,0,0,1], [0,0,0,0,1], [0,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
        'K': [[1,0,0,0,1], [1,0,0,1,0], [1,0,1,0,0], [1,1,0,0,0], [1,0,1,0,0], [1,0,0,1,0], [1,0,0,0,1]],
        'L': [[1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,1]],
        'M': [[1,0,0,0,1], [1,1,0,1,1], [1,0,1,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
        'N': [[1,0,0,0,1], [1,1,0,0,1], [1,0,1,0,1], [1,0,0,1,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
        'O': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
        'P': [[1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0]],
        'Q': [[0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,1,0,1], [1,0,0,1,0], [0,1,1,0,1]],
        'R': [[1,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,0], [1,0,1,0,0], [1,0,0,1,0], [1,0,0,0,1]],
        'S': [[0,1,1,1,1], [1,0,0,0,0], [1,0,0,0,0], [0,1,1,1,0], [0,0,0,0,1], [0,0,0,0,1], [1,1,1,1,0]],
        'T': [[1,1,1,1,1], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0]],
        'U': [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]],
        'V': [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,0,1,0], [0,1,0,1,0], [0,0,1,0,0]],
        'W': [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [1,0,1,0,1], [1,1,0,1,1], [1,0,0,0,1]],
        'X': [[1,0,0,0,1], [0,1,0,1,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,1,0,1,0], [1,0,0,0,1]],
        'Y': [[1,0,0,0,1], [0,1,0,1,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0], [0,0,1,0,0]],
        'Z': [[1,1,1,1,1], [0,0,0,0,1], [0,0,0,1,0], [0,0,1,0,0], [0,1,0,0,0], [1,0,0,0,0], [1,1,1,1,1]],
        ' ': [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]]
    };
    
    const charData = charMap[char.toUpperCase()] || charMap[' '];
    const rows = charData.length;
    const cols = charData[0].length;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (charData[row][col] === 1) {
                const pixelRow = row;
                const pixelCol = cols - 1 - col;
                pixels.push({
                    x: x + pixelRow * charWarp,
                    y: y + pixelCol * charWeft,
                    width: charWarp,
                    height: charWeft
                });
            }
        }
    }
    
    return pixels;
}
`;
    
    return pureCode;
  };

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
      
      // Get current palette and traits from global scope (ADAPTED for current setup)
      const palette = (window as any).getCurrentPalette?.() || (window as any).selectedPalette || { name: 'Default', colors: ['#000000', '#FFFFFF'] }
      const traits = (window as any).calculateTraits?.() || { Seed: currentSeed, Style: 'Generative' }
      
      // Get current stripe data from the live sketch (ADAPTED for current setup)
      const currentStripeData = (window as any).stripeData || []
      
      // Get color palettes for standalone use
      const colorPalettes = (window as any).colorPalettes || []
      
      setExportStatus('Generating algorithm code...')
      
      // Create pure algorithm code with current state (async) - ADAPTED for current algorithm
      const pureAlgorithmCode = createPureAlgorithmCode(currentSeed, palette, currentStripeData, textRows)
      
      setExportStatus('Minifying and obfuscating...')
      
      // Minify and obfuscate (EXACT same process as reference)
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
