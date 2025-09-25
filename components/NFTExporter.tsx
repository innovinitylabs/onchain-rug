import React, { useState } from 'react';
import { initPRNG, getPRNG, createDerivedPRNG } from '@/lib/DeterministicPRNG';

interface NFTExporterProps {
  currentSeed: number;
  currentPalette: any;
  currentStripeData: any[];
  textRows: string[];
  characterMap: any;
}

const NFTExporter: React.FC<NFTExporterProps> = ({
  currentSeed,
  currentPalette,
  currentStripeData,
  textRows,
  characterMap,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Add default values and null checks
  const safeSeed = currentSeed || 42;
  const safePalette = currentPalette || { name: 'Default', colors: ['#000000', '#FFFFFF'] };
  const safeStripeData = currentStripeData || [];
  const safeTextRows = textRows || [];

  // Calculate basic traits for NFT metadata (rarity handled at generation time and by marketplace indexers)
  const calculateTraitsInGenerator = (palette: any, stripeData: any[], textRows: string[]) => {
    const textLines = textRows.filter(row => row && row.trim() !== '').length;
    const totalCharacters = textRows.reduce((sum, row) => sum + row.length, 0);
    const stripeCount = stripeData.length;
    const paletteName = palette ? palette.name : "Unknown";
    const currentWarpThickness = (window as any).warpThickness || 2;

    // Calculate stripe complexity
    let complexityScore = 0;
    let solidCount = 0;
    for (let stripe of stripeData) {
      if (stripe.weaveType === 'mixed') complexityScore += 2;
      else if (stripe.weaveType === 'textured') complexityScore += 1.5;
      else solidCount++;
      if (stripe.secondaryColor) complexityScore += 1;
    }
    const solidRatio = solidCount / stripeData.length;
    const normalizedComplexity = complexityScore / (stripeData.length * 3);
    let stripeComplexity = "Basic";
    if (solidRatio > 0.9) stripeComplexity = "Basic";
    else if (solidRatio > 0.75 && normalizedComplexity < 0.15) stripeComplexity = "Simple";
    else if (solidRatio > 0.6 && normalizedComplexity < 0.3) stripeComplexity = "Moderate";
    else if (normalizedComplexity < 0.5) stripeComplexity = "Complex";
    else stripeComplexity = "Very Complex";

    // Return basic trait values for metadata (no rarity calculation)
    return {
      textLines: textLines,
      totalCharacters: totalCharacters,
      paletteName: paletteName,
      stripeCount: stripeCount,
      stripeComplexity: stripeComplexity,
      warpThickness: currentWarpThickness
    };
  };

  const exportNFT = async () => {
    setIsExporting(true);

    try {
      // Use the passed props instead of global variables
      const currentPalette = safePalette;
      const currentStripeData = safeStripeData;
      
      // Get the full character map from global doormatData (since it's now stored globally in contract)
      const fullCharacterMap = (typeof window !== 'undefined' && (window as any).doormatData?.characterMap) || {};
      
      // Create the NFT HTML content with current live data (no traits display)
        const nftHTML = createNFTHTML(safeSeed, currentPalette, currentStripeData, safeTextRows, fullCharacterMap);
      
      // Debug logging removed for production
      
      // Create and download the file
      const blob = new Blob([nftHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doormat-nft-${safeSeed}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting NFT:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const createNFTHTML = (s: number, palette: any, stripeData: any[], textRows: string[], characterMap: any) => {
    // 🔥 ULTRA-OPTIMIZATION: Extract only used characters from textRows
    const usedChars = new Set<string>();
    textRows.forEach(row => {
      if (row && row.trim()) {
        row.toUpperCase().split('').forEach(char => {
          usedChars.add(char);
        });
      }
    });

    // Debug: Log extracted characters
    console.log('Text rows:', textRows);
    console.log('Extracted characters:', Array.from(usedChars));
    console.log('Character map keys:', Object.keys(characterMap));

    // Create minimal character map with only used characters
    const optimizedCharacterMap: any = {};
    usedChars.forEach(char => {
      if (characterMap[char]) {
        optimizedCharacterMap[char] = characterMap[char];
      }
    });
    // Always include space as fallback
    if (characterMap[' ']) {
      optimizedCharacterMap[' '] = characterMap[' '];
    }

    const optimizedCharacterMapFinal = optimizedCharacterMap;

    // Debug: Log final optimized character map
    console.log('Optimized character map keys:', Object.keys(optimizedCharacterMapFinal));
    console.log('Optimized character map size:', JSON.stringify(optimizedCharacterMapFinal).length);
    console.log('Full character map size:', JSON.stringify(characterMap).length);
    console.log('Space saved:', JSON.stringify(characterMap).length - JSON.stringify(optimizedCharacterMapFinal).length, 'characters');

    // Get the actual current warpThickness from the live generator
    const currentWarpThickness = (window as any).warpThickness || 2;

    // 🔥 ULTRA-OPTIMIZATION: Truncate decimals and shorten property names
    const truncateTo3Decimals = (value) => {
      return Math.round(value * 1000) / 1000;
    };

    const shortenedStripeData = stripeData.map(stripe => ({
      y: truncateTo3Decimals(stripe.y),               // Truncate y values for consistency (potential chars saved)
      h: truncateTo3Decimals(stripe.height),           // 17 digits → 3 digits (14 chars saved)
      pc: stripe.primaryColor,            // primaryColor → pc (10 chars saved)
      sc: stripe.secondaryColor,          // secondaryColor → sc (12 chars saved)
      wt: stripe.weaveType,               // Already shortened in generator
      wv: truncateTo3Decimals(stripe.warpVariation)    // 16 digits → 3 digits (13 chars saved)
    }));

    // Debug: Log what we're actually passing to the template
      // Function called with parameters (logging removed for production)
    //   return `<!DOCTYPE html>
    //   <html lang="en">
    //   <head>
    //       <meta charset="UTF-8">
    //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //       <title>Doormat NFT #${s}</title>
    //       <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
    //       <style>
    //           body {
    //               margin: 0;
    //               padding: 20px;
    //               background: #f0f0f0;
    //               font-family: monospace;
    //               display: flex;
    //               justify-content: center;
    //               align-items: center;
    //               min-height: 100vh;
    //           }
    //           .nft-container {
    //               text-align: center;
    //           }
    //           .nft-info {
    //               margin-bottom: 20px;
    //               color: #333;
    //           }
    //           .nft-s {
    //               font-weight: bold;
    //               color: #0066cc;
    //           }
              
    //       </style>
    //   </head>
    //   <body>
    //       <div class="nft-container">
    //           <div class="nft-info">
    //               <h2>Doormat NFT #<span class="nft-s">${s}</span></h2>
    //           </div>
    //           <div id="canvas-container"></div>
    //       </div>
      
    //       <script>
    //           // Hardcoded constants (never change in the algorithm)
    //           let doormatWidth = 800;
    //           let doormatHeight = 1200;
    //           let fringeLength = 30;
    //           let weftThickness = 8;
    //           let warpThickness = ${currentWarpThickness}; // Only this changes dynamically
    //           let TEXT_SCALE = 2;
    //           let MAX_CHARS = 11;
              
      
    //           // Colors
    //   let lightTextColor, darkTextColor;
      
      
    //           // Embedded current state (following original pattern)
    //           let selectedPalette = ${JSON.stringify(palette)};
    //           let stripeData = ${JSON.stringify(stripeData)};
    //           let doormatTextRows = ${JSON.stringify(textRows)};
    //           let textData = [];
              
    //           // Dirt and texture state (captured from generator)
    //           let showDirt = ${showDirt};
    //           let dirtLevel = ${dirtLevel};
    //           let showTexture = ${showTexture};
    //           let textureLevel = ${textureLevel};
              
    //           // Embedded character map (only used characters)
    //           const characterMap = ${JSON.stringify(usedChars)};
      
      
      
    //   function setup() {
    //               // Initialize deterministic PRNG to recreate the exact same doormat
    //       // Note: PRNG is initialized in the generation phase, not here
    //       noiseSeed(${s});
          
    //       // Initialize deterministic PRNG for drawing operations
    //       // This ensures the exported NFT uses the same deterministic system
    //       window.d = function(s) {
    //           // Simple LCG implementation for exported HTML
    //           window.prngSeed = s % 2147483647;
    //           if (window.prngSeed <= 0) window.prngSeed += 2147483646;
    //       };
          
    //       window.b = function() {
    //           window.prngSeed = (window.prngSeed * 16807) % 2147483647;
    //           return (window.prngSeed - 1) / 2147483646;
    //       };
          
    //       window.a = function(min, max) {
    //           return min + window.b() * (max - min);
    //       };
          
    //       window.c = function(array) {
    //           return array[Math.floor(window.b() * array.length)];
    //       };
          
    //       // Initialize with the s
    //       window.d(${s});
          
    //               // Create canvas with swapped dimensions for 90-degree rotation
    //               let canvas = createCanvas(doormatHeight + (fringeLength * 4), doormatWidth + (fringeLength * 4));
    //               canvas.parent('canvas-container');
                  
    //               // Set high DPR for crisp rendering on high-DPI displays
    //               pixelDensity(2.5);
                  
    //               // Initialize text colors
    //       updateTextColors();
                  
    //               // Generate text data
    //       generateTextData();
          
    //               noLoop();
                  
    //           }
              
    //           function updateTextColors() {
    //               if (!selectedPalette || !selectedPalette.colors) return;
                  
    //               let darkest = selectedPalette.colors[0];
    //               let lightest = selectedPalette.colors[0];
    //               let darkestVal = 999, lightestVal = -1;
                  
    //               for (let hex of selectedPalette.colors) {
    //                   let c = color(hex);
    //                   let bright = (red(c) + green(c) + blue(c)) / 3;
    //                   if (bright < darkestVal) { darkestVal = bright; darkest = hex; }
    //                   if (bright > lightestVal) { lightestVal = bright; lightest = hex; }
    //               }
                  
    //               // Make text colors more prominent
    //               darkTextColor = lerpColor(color(darkest), color(0), 0.4);
    //               lightTextColor = lerpColor(color(lightest), color(255), 0.3);
    //   }
      
    //   function draw() {
    //               // Use a background that won't create visible bands after rotation
    //               background(222, 222, 222);
          
    //               // Rotate canvas 90 degrees clockwise
    //       push();
    //       translate(width/2, height/2);
    //       rotate(PI/2);
    //       translate(-height/2, -width/2);
          
    //               // Draw the main doormat area
    //       push();
    //               // Center the doormat within the larger canvas buffer
    //       translate(fringeLength * 2, fringeLength * 2);
          
    //               // Draw stripes
    //               for (let stripe of stripeData) {
    //                   drawStripe(stripe);
    //               }
                  
    //               // Add overall texture overlay if enabled (using captured state)
    //               if (showTexture && textureLevel > 0) {
    //                   drawTextureOverlayWithLevel(Math.floor(textureLevel));
    //               }
                  
    //       pop();
          
    //               // Draw fringe with adjusted positioning for larger canvas
    //       drawFringe();
                  
    //               // Draw dirt overlay if enabled (using captured state)
    //               if (showDirt && dirtLevel > 0) {
    //                   drawDirtOverlay(Math.floor(dirtLevel));
    //               }
                  
    //               pop(); // End rotation
    //           }
              
    //           function drawStripe(stripe) {
    //               // Create a proper plain weave structure like the diagram
    //               let warpSpacing = warpThickness + 1; // Space between warp threads
    //               let weftSpacing = weftThickness + 1; // Space between weft threads
                  
    //               // First, draw the warp threads (vertical) as the foundation
    //               for (let x = 0; x < doormatWidth; x += warpSpacing) {
    //                   for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
    //                       let warpColor = color(stripe.primaryColor);
                          
    //                       // Check if this position should be modified for text
    //                       let isTextPixel = false;
    //                       if (textData.length > 0) {
    //                           for (let textPixel of textData) {
    //                               if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
    //                                   y >= textPixel.y && y < textPixel.y + textPixel.height) {
    //                                   isTextPixel = true;
    //                                   break;
    //                               }
    //                           }
    //                       }
                          
    //                       // Add subtle variation to warp threads
    //                       let r = red(warpColor) + window.a(-15, 15);
    //                       let g = green(warpColor) + window.a(-15, 15);
    //                       let b = blue(warpColor) + window.a(-15, 15);
                          
    //                       // Modify color for text pixels (vertical lines use weft thickness)
    //                       if (isTextPixel) {
    //                           const bgBrightness = (r + g + b) / 3;
    //                           let tc = bgBrightness < 128 ? lightTextColor : darkTextColor;
    //                           r = red(tc); g = green(tc); b = blue(tc);
    //                       }
                          
    //                       r = constrain(r, 0, 255);
    //                       g = constrain(g, 0, 255);
    //                       b = constrain(b, 0, 255);
                          
    //                       fill(r, g, b);
    //                       noStroke();
                          
    //                       // Draw warp thread with slight curve for natural look
    //                       let warpCurve = sin(y * 0.05) * 0.5;
    //                       rect(x + warpCurve, y, warpThickness, weftSpacing);
    //                   }
    //               }
                  
    //               // Now draw the weft threads (horizontal) that interlace with warp
    //               for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
    //                   for (let x = 0; x < doormatWidth; x += warpSpacing) {
    //                       let weftColor = color(stripe.primaryColor);
                          
    //                       // Check if this position should be modified for text
    //                       let isTextPixel = false;
    //                       if (textData.length > 0) {
    //                           for (let textPixel of textData) {
    //                               if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
    //                                   y >= textPixel.y && y < textPixel.y + textPixel.height) {
    //                                   isTextPixel = true;
    //                                   break;
    //                               }
    //                           }
    //                       }
                          
    //                       // Add variation based on weave type
    //                       if (stripe.weaveType === 'mixed' && stripe.secondaryColor) {
    //                           if (noise(x * 0.1, y * 0.1) > 0.5) {
    //                               weftColor = color(stripe.secondaryColor);
    //                           }
    //                       } else if (stripe.weaveType === 'textured') {
    //                           let noiseVal = noise(x * 0.05, y * 0.05);
    //                           weftColor = lerpColor(color(stripe.primaryColor), color(255), noiseVal * 0.15);
    //                       }
                          
    //                       // Add fabric irregularities
    //                       let r = red(weftColor) + window.a(-20, 20);
    //                       let g = green(weftColor) + window.a(-20, 20);
    //                       let b = blue(weftColor) + window.a(-20, 20);
                          
    //                       // Modify color for text pixels (horizontal lines use warp thickness)
    //                       if (isTextPixel) {
    //                           const bgBrightness = (r + g + b) / 3;
    //                           let tc = bgBrightness < 128 ? lightTextColor : darkTextColor;
    //                           r = red(tc); g = green(tc); b = blue(tc);
    //                       }
                          
    //                       r = constrain(r, 0, 255);
    //                       g = constrain(g, 0, 255);
    //                       b = constrain(b, 0, 255);
                          
    //                       fill(r, g, b);
    //                       noStroke();
                          
    //                       // Draw weft thread with slight curve
    //                       let weftCurve = cos(x * 0.05) * 0.5;
    //                       rect(x, y + weftCurve, warpSpacing, weftThickness);
    //                   }
    //               }
                  
    //               // Add the interlacing effect - make some threads appear to go over/under
    //               for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing * 2) {
    //                   for (let x = 0; x < doormatWidth; x += warpSpacing * 2) {
    //                       // Create shadow effect for threads that appear to go under
    //                       fill(0, 0, 0, 40);
    //                       noStroke();
    //                       rect(x + 1, y + 1, warpSpacing - 2, weftSpacing - 2);
    //                   }
    //               }
                  
    //               // Add subtle highlights for threads that appear to go over
    //               for (let y = stripe.y + weftSpacing; y < stripe.y + stripe.height; y += weftSpacing * 2) {
    //                   for (let x = warpSpacing; x < doormatWidth; x += warpSpacing * 2) {
    //                       fill(255, 255, 255, 30);
    //                       noStroke();
    //                       rect(x, y, warpSpacing - 1, weftSpacing - 1);
    //                   }
    //       }
    //   }
      
    //   function drawTextureOverlay() {
    //               push();
    //               blendMode(MULTIPLY);
                  
    //               // Fine texture
    //               for (let x = 0; x < doormatWidth; x += 2) {
    //                   for (let y = 0; y < doormatHeight; y += 2) {
    //                       let noiseValue = noise(x * 0.02, y * 0.02);
    //                       let alpha = map(noiseValue, 0, 1, 0, 50);
    //                       fill(0, 0, 0, alpha);
    //                       noStroke();
    //                       rect(x, y, 2, 2);
    //                   }
    //               }
                  
    //               // Coarse texture
    //               for (let x = 0; x < doormatWidth; x += 6) {
    //                   for (let y = 0; y < doormatHeight; y += 6) {
    //                       let noiseValue = noise(x * 0.03, y * 0.03);
    //                       if (noiseValue > 0.6) {
    //                           fill(255, 255, 255, 25);
    //                           noStroke();
    //                           rect(x, y, 6, 6);
    //                       } else if (noiseValue < 0.4) {
    //                           fill(0, 0, 0, 20);
    //                           noStroke();
    //                           rect(x, y, 6, 6);
    //                       }
    //                   }
    //               }
                  
    //               pop();
    //   }
      
    //   // Enhanced texture overlay with time-based intensity levels
    //   function drawTextureOverlayWithLevel(textureLevel) {
    //       // Texture intensity based on level (1 = 7 days, 2 = 30 days)
    //       const hatchingIntensity = textureLevel === 1 ? 30 : 80;  // More intense after 30 days
    //       const reliefIntensity = textureLevel === 1 ? 20 : 40;    // More relief after 30 days
    //       const reliefThreshold = textureLevel === 1 ? 0.6 : 0.5;  // Lower threshold = more relief
          
    //       push();
    //       blendMode(MULTIPLY);
          
    //       // Create hatching effect with variable intensity (same as generator)
    //       for (let x = 0; x < doormatWidth; x += 2) {
    //           for (let y = 0; y < doormatHeight; y += 2) {
    //               let noiseVal = noise(x * 0.02, y * 0.02);
    //               let intensity = map(noiseVal, 0, 1, 0, hatchingIntensity);
                  
    //               fill(0, 0, 0, intensity);
    //               noStroke();
    //               rect(x, y, 2, 2);
    //           }
    //       }
          
    //       // Add relief texture for worn areas (same as generator)
    //       for (let x = 0; x < doormatWidth; x += 6) {
    //           for (let y = 0; y < doormatHeight; y += 6) {
    //               let reliefNoise = noise(x * 0.03, y * 0.03);
    //               if (reliefNoise > reliefThreshold) {
    //                   fill(255, 255, 255, reliefIntensity);
    //                   noStroke();
    //                   rect(x, y, 6, 6);
    //               } else if (reliefNoise < (1 - reliefThreshold)) {
    //                   fill(0, 0, 0, reliefIntensity * 0.8);
    //                   noStroke();
    //                   rect(x, y, 6, 6);
    //               }
    //           }
    //       }
          
    //       // Add additional wear patterns for 30-day level (same as generator)
    //       if (textureLevel === 2) {
    //           for (let x = 0; x < doormatWidth; x += 8) {
    //               for (let y = 0; y < doormatHeight; y += 8) {
    //                   let wearNoise = noise(x * 0.01, y * 0.01);
    //                   if (wearNoise > 0.7) {
    //                       fill(0, 0, 0, 15);
    //                       noStroke();
    //                       rect(x, y, 8, 2); // Horizontal wear lines
    //                   }
    //               }
    //           }
    //       }
          
    //       pop();
    //   }
      
    //   // DIRT OVERLAY SYSTEM - Dynamic dirt accumulation based on time and maintenance
    //   function drawDirtOverlay(dirtLevel) {
    //       // Dirt intensity based on level (0 = clean, 1 = 50% dirty, 2 = full dirty)
    //       const dirtIntensity = dirtLevel === 1 ? 0.5 : 1.0;
    //       const dirtOpacity = dirtLevel === 1 ? 30 : 60;
          
    //       // Create dirt pattern using PRNG for consistency
    //       push();
    //       translate(fringeLength * 2, fringeLength * 2);
          
    //       // Draw dirt spots and stains
    //       for (let x = 0; x < doormatWidth; x += 3) {
    //           for (let y = 0; y < doormatHeight; y += 3) {
    //               // Use PRNG for consistent dirt pattern
    //               const dirtNoise = window.a(0, 1);
    //               const dirtThreshold = 0.85 * dirtIntensity; // Higher threshold = less dirt
                  
    //               if (dirtNoise > dirtThreshold) {
    //                   // Create dirt spot
    //                   const dirtSize = window.a(1, 4);
    //                   const dirtAlpha = window.a(dirtOpacity * 0.5, dirtOpacity);
                      
    //                   // Brown/dark dirt color
    //                   const dirtR = window.a(60, 90);
    //                   const dirtG = window.a(40, 60);
    //                   const dirtB = window.a(20, 40);
                      
    //                   fill(dirtR, dirtG, dirtB, dirtAlpha);
    //                   noStroke();
    //                   ellipse(x, y, dirtSize, dirtSize);
    //               }
    //           }
    //       }
          
    //       // Add larger dirt stains for more realistic effect
    //       for (let i = 0; i < 15 * dirtIntensity; i++) {
    //           const stainX = window.a(0, doormatWidth);
    //           const stainY = window.a(0, doormatHeight);
    //           const stainSize = window.a(8, 20);
    //           const stainAlpha = window.a(dirtOpacity * 0.3, dirtOpacity * 0.7);
              
    //           // Darker stain color
    //           const stainR = window.a(40, 70);
    //           const stainG = window.a(25, 45);
    //           const stainB = window.a(15, 30);
              
    //           fill(stainR, stainG, stainB, stainAlpha);
    //           noStroke();
    //           ellipse(stainX, stainY, stainSize, stainSize);
    //       }
          
    //       // Add edge wear and tear
    //       for (let x = 0; x < doormatWidth; x += 2) {
    //           for (let y = 0; y < doormatHeight; y += 2) {
    //               // Check if near edges
    //               const edgeDistance = Math.min(x, y, doormatWidth - x, doormatHeight - y);
    //               if (edgeDistance < 10) {
    //                   const edgeDirt = window.a(0, 1);
    //                   if (edgeDirt > 0.7 * dirtIntensity) {
    //                       const edgeAlpha = window.a(10, 25);
    //                       fill(80, 50, 20, edgeAlpha);
    //                       noStroke();
    //                       rect(x, y, 2, 2);
    //                   }
    //               }
    //           }
    //       }
          
    //       pop();
    //   }
      
    //   function drawFringe() {
    //               // Top fringe (warp ends)
    //               // Top fringe - adjusted for larger canvas buffer
    //               drawFringeSection(fringeLength * 2, fringeLength, doormatWidth, fringeLength, 'top');
                  
    //               // Bottom fringe - adjusted for larger canvas buffer
    //               drawFringeSection(fringeLength * 2, fringeLength * 2 + doormatHeight, doormatWidth, fringeLength, 'bottom');
                  
    //               // Draw selvedge edges (weft loops) on left and right sides
    //               drawSelvedgeEdges();
    //   }
      
    //   function drawSelvedgeEdges() {
    //               let weftSpacing = weftThickness + 1;
    //               let isFirst = true;
    //               let isLast = false;
                  
    //               // Left selvedge edge - flowing semicircular weft threads
    //               for (let stripe of stripeData) {
    //                   for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
    //                       // Skip the very first and very last weft threads of the entire doormat
    //                       if (isFirst) {
    //                           isFirst = false;
    //                           continue;
    //                       }
                          
    //                       // Check if this is the last weft thread
    //                       if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
    //                           isLast = true;
    //                           continue; // Skip this last weft thread instead of breaking
    //                       }
                          
    //                       // Get the color from the current stripe
    //                       let selvedgeColor = color(stripe.primaryColor);
                          
    //                       // Check if there's a secondary color for blending
    //                       if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
    //                           let secondaryColor = color(stripe.secondaryColor);
    //                           // Blend the colors based on noise for variation
    //                           let blendFactor = noise(y * 0.1) * 0.5 + 0.5;
    //                           selvedgeColor = lerpColor(selvedgeColor, secondaryColor, blendFactor);
    //                       }
                          
    //                       let r = red(selvedgeColor) * 0.8;
    //                       let g = green(selvedgeColor) * 0.8;
    //                       let b = blue(selvedgeColor) * 0.8;
                          
    //                       fill(r, g, b);
    //                       noStroke();
                          
    //                       let radius = weftThickness * window.a(1.2, 1.8); // Vary size slightly
    //                       let centerX = fringeLength * 2 + window.a(-2, 2); // Slight position variation
    //                       let centerY = fringeLength * 2 + y + weftThickness/2 + window.a(-1, 1); // Slight vertical variation
                          
    //                       // Vary the arc angles for more natural look
    //                       let startAngle = HALF_PI + window.a(-0.2, 0.2);
    //                       let endAngle = -HALF_PI + window.a(-0.2, 0.2);
                          
    //                       // Draw textured semicircle with individual thread details
    //                       drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, 'left');
    //                   }
    //               }
                  
    //               // Right selvedge edge - flowing semicircular weft threads
    //               let isFirstWeftRight = true;
    //               let isLastWeftRight = false;
                  
    //               for (let stripe of stripeData) {
    //                   for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
    //                       // Skip the very first and very last weft threads of the entire doormat
    //                       if (isFirstWeftRight) {
    //                           isFirstWeftRight = false;
    //                           continue;
    //                       }
                          
    //                       // Check if this is the last weft thread
    //                       if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
    //                           isLastWeftRight = true;
    //                           continue; // Skip this last weft thread instead of breaking
    //                       }
                          
    //                       // Get the color from the current stripe
    //                       let selvedgeColor = color(stripe.primaryColor);
                          
    //                       // Check if there's a secondary color for blending
    //                       if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
    //                           let secondaryColor = color(stripe.secondaryColor);
    //                           // Blend the colors based on noise for variation
    //                           let blendFactor = noise(y * 0.1) * 0.5 + 0.5;
    //                           selvedgeColor = lerpColor(selvedgeColor, secondaryColor, blendFactor);
    //                       }
                          
    //                       let r = red(selvedgeColor) * 0.8;
    //                       let g = green(selvedgeColor) * 0.8;
    //                       let b = blue(selvedgeColor) * 0.8;
                          
    //                       fill(r, g, b);
    //                       noStroke();
                          
    //                       let radius = weftThickness * window.a(1.2, 1.8); // Vary size slightly
    //                       let centerX = fringeLength * 2 + doormatWidth + window.a(-2, 2); // Slight position variation
    //                       let centerY = fringeLength * 2 + y + weftThickness/2 + window.a(-1, 1); // Slight vertical variation
                          
    //                       // Vary the arc angles for more natural look
    //                       let startAngle = -HALF_PI + window.a(-0.2, 0.2);
    //                       let endAngle = HALF_PI + window.a(-0.2, 0.2);
                          
    //                       // Draw textured semicircle with individual thread details
    //                       drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right');
    //                   }
    //               }
    //           }
              
    //           function drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, side) {
    //               // Draw a realistic textured selvedge arc with visible woven texture
    //               let threadCount = max(6, floor(radius / 1.2)); // More threads for visible texture
    //               let threadSpacing = radius / threadCount;
                  
    //               // Draw individual thread arcs to create visible woven texture
    //               for (let i = 0; i < threadCount; i++) {
    //                   let threadRadius = radius - (i * threadSpacing);
                      
    //                   // Create distinct thread colors for visible texture
    //                   let threadR, threadG, threadB;
                      
    //                   if (i % 2 === 0) {
    //                       // Lighter threads
    //                       threadR = constrain(r + 25, 0, 255);
    //                       threadG = constrain(g + 25, 0, 255);
    //                       threadB = constrain(b + 25, 0, 255);
    //                   } else {
    //                       // Darker threads
    //                       threadR = constrain(r - 20, 0, 255);
    //                       threadG = constrain(g - 20, 0, 255);
    //                       threadB = constrain(b - 20, 0, 255);
    //                   }
                      
    //                   // Add some random variation for natural look
    //                   threadR = constrain(threadR + window.a(-10, 10), 0, 255);
    //                   threadG = constrain(threadG + window.a(-10, 10), 0, 255);
    //                   threadB = constrain(threadB + window.a(-10, 10), 0, 255);
                      
    //                   fill(threadR, threadG, threadB, 88); // More transparent for better blending
                      
    //                   // Draw individual thread arc with slight position variation
    //                   let threadX = centerX + window.a(-1, 1);
    //                   let threadY = centerY + window.a(-1, 1);
    //                   let threadStartAngle = startAngle + window.a(-0.1, 0.1);
    //                   let threadEndAngle = endAngle + window.a(-0.1, 0.1);
                      
    //                   arc(threadX, threadY, threadRadius * 2, threadRadius * 2, threadStartAngle, threadEndAngle);
    //               }
                  
    //               // Add a few more detailed texture layers
    //               for (let i = 0; i < 3; i++) {
    //                   let detailRadius = radius * (0.3 + i * 0.2);
    //                   let detailAlpha = 180 - (i * 40);
                      
    //                   // Create contrast for visibility
    //                   let detailR = constrain(r + (i % 2 === 0 ? 15 : -15), 0, 255);
    //                   let detailG = constrain(g + (i % 2 === 0 ? 15 : -15), 0, 255);
    //                   let detailB = constrain(b + (i % 2 === 0 ? 15 : -15), 0, 255);
                      
    //                   fill(detailR, detailG, detailB, detailAlpha * 0.7); // More transparent detail layers
                      
    //                   let detailX = centerX + window.a(-0.5, 0.5);
    //                   let detailY = centerY + window.a(-0.5, 0.5);
    //                   let detailStartAngle = startAngle + window.a(-0.05, 0.05);
    //                   let detailEndAngle = endAngle + window.a(-0.05, 0.05);
                      
    //                   arc(detailX, detailY, detailRadius * 2, detailRadius * 2, detailStartAngle, detailEndAngle);
    //               }
                  
    //               // Add subtle shadow for depth
    //               fill(r * 0.6, g * 0.6, b * 0.6, 70); // More transparent shadow
    //               let shadowOffset = side === 'left' ? 1 : -1;
    //               arc(centerX + shadowOffset, centerY + 1, radius * 2, radius * 2, startAngle, endAngle);
                  
    //               // Add small transparent hole in the center
    //               noFill();
    //               arc(centerX, centerY, radius * 0.5, radius * 0.5, startAngle, endAngle);
                  
    //               // Add visible texture details - small bumps and knots
    //               for (let i = 0; i < 8; i++) {
    //                   let detailAngle = window.a(startAngle, endAngle);
    //                   let detailRadius = radius * window.a(0.2, 0.7);
    //                   let detailX = centerX + cos(detailAngle) * detailRadius;
    //                   let detailY = centerY + sin(detailAngle) * detailRadius;
                      
    //                   // Alternate between light and dark for visible contrast
    //                   if (i % 2 === 0) {
    //                       fill(r + 20, g + 20, b + 20, 120); // More transparent light bumps
    //                   } else {
    //                       fill(r - 15, g - 15, b - 15, 120); // More transparent dark bumps
    //                   }
                      
    //                   noStroke();
    //                   ellipse(detailX, detailY, window.a(1.5, 3.5), window.a(1.5, 3.5));
    //               }
    //           }
              
    //           function drawFringeSection(x, y, w, h, side) {
    //               let fringeStrands = w / 12; // More fringe strands for thinner threads
    //               let strandWidth = w / fringeStrands;
                  
    //               for (let i = 0; i < fringeStrands; i++) {
    //                   let strandX = x + i * strandWidth;
                      
    //                   // Safety check for selectedPalette
    //                   if (!selectedPalette || !selectedPalette.colors) {
    //                       return;
    //                   }
                      
    //                   let strandColor = window.c(selectedPalette.colors);
                      
    //                   // Draw individual fringe strand with thin threads
    //                   for (let j = 0; j < 12; j++) { // More but thinner threads per strand
    //                       let threadX = strandX + window.a(-strandWidth/6, strandWidth/6);
    //                       let startY = side === 'top' ? y + h : y;
    //                       let endY = side === 'top' ? y : y + h;
                          
    //                       // Add natural curl/wave to the fringe with more variation
    //                       let waveAmplitude = window.a(1, 4);
    //                       let waveFreq = window.a(0.2, 0.8);
                          
    //                       // Randomize the direction and intensity for each thread
    //                       let direction = window.c([-1, 1]); // Random left or right direction
    //                       let curlIntensity = window.a(0.5, 2.0);
    //                       let threadLength = window.a(0.8, 1.2); // Vary thread length
                          
    //                       // Use darker version of strand color for fringe
    //                       let fringeColor = color(strandColor);
    //                       let r = red(fringeColor) * 0.7;
    //                       let g = green(fringeColor) * 0.7;
    //                       let b = blue(fringeColor) * 0.7;
                          
    //                       stroke(r, g, b);
    //                       strokeWeight(window.a(0.5, 1.2)); // Vary thread thickness
                          
    //                       noFill();
    //                       beginShape();
    //                       for (let t = 0; t <= 1; t += 0.1) {
    //                           let yPos = lerp(startY, endY, t * threadLength);
    //                           let xOffset = sin(t * PI * waveFreq) * waveAmplitude * t * direction * curlIntensity;
    //                           // Add more randomness and natural variation
    //                           xOffset += window.a(-1, 1);
    //                           // Add occasional kinks and bends
    //                           if (window.b() < 0.3) {
    //                               xOffset += window.a(-2, 2);
    //                           }
    //                           vertex(threadX + xOffset, yPos);
    //                       }
    //                       endShape();
    //                   }
    //               }
    //   }
      
    //   function generateTextData() {
    //       textData = [];
    //               const textRows = doormatTextRows || [];
    //               if (!textRows || textRows.length === 0) return;
                  
    //               // Filter out empty text rows (same as live generator)
    //               const nonEmptyTextRows = textRows.filter(row => row && row.trim() !== '');
    //               if (nonEmptyTextRows.length === 0) return;
                  
    //               const warpSpacing = warpThickness + 1;
    //               const weftSpacing = weftThickness + 1;
    //               const scaledWarp = warpSpacing * TEXT_SCALE;
    //               const scaledWeft = weftSpacing * TEXT_SCALE;
                  
    //               // Character dimensions based on thread spacing (EXACT same as live generator)
    //               const charWidth = 7 * scaledWarp; // width after rotation (7 columns)
    //               const charHeight = 5 * scaledWeft; // height after rotation (5 rows)
    //               const spacing = scaledWeft; // vertical gap between stacked characters
                  
    //               // Calculate spacing between rows (horizontal spacing after rotation)
    //               const rowSpacing = charWidth * 1.5; // Space between rows
                  
    //               // Calculate total width needed for all NON-EMPTY rows
    //               const totalRowsWidth = nonEmptyTextRows.length * charWidth + (nonEmptyTextRows.length - 1) * rowSpacing;
                  
    //               // Calculate starting X position to center all NON-EMPTY rows
    //               const baseStartX = (doormatWidth - totalRowsWidth) / 2;
                  
    //               let currentRowIndex = 0;
    //               for (let rowIndex = 0; rowIndex < textRows.length; rowIndex++) {
    //                   const rowText = textRows[rowIndex];
    //                   if (!rowText || rowText.trim() === '') continue; // Skip empty rows
                      
    //                   // Calculate text dimensions for this row
    //                   const textWidth = charWidth;
    //                   const textHeight = rowText.length * (charHeight + spacing) - spacing;
                      
    //                   // Position for this NON-EMPTY row (left to right becomes after rotation)
    //                   const startX = baseStartX + currentRowIndex * (charWidth + rowSpacing);
    //                   const startY = (doormatHeight - textHeight) / 2;
                      
    //                   // Generate character data vertically bottom-to-top for this row
    //                   for (let i = 0; i < rowText.length; i++) {
    //                       const char = rowText.charAt(i);
    //                       const charY = startY + (rowText.length - 1 - i) * (charHeight + spacing);
    //                       const charPixels = generateCharacterPixels(char, startX, charY, textWidth, charHeight);
    //                       textData.push(...charPixels);
    //                   }
                      
    //                   currentRowIndex++; // Only increment for non-empty rows
    //               }
    //           }
              
              
    //           function generateCharacterPixels(char, x, y, width, height) {
    //               const pixels = [];
    //               const warpSpacing = warpThickness + 1;
    //               const weftSpacing = weftThickness + 1;
    //               const scaledWarp = warpSpacing * TEXT_SCALE;
    //               const scaledWeft = weftSpacing * TEXT_SCALE;
      
    //               // Character definitions - use the EXACT same format as live generator
    //               const charDef = characterMap[char.toUpperCase()] || characterMap[' '];
      
    //               const numRows = charDef.length;
    //               const numCols = charDef[0].length;
      
    //               // Rotate 90° CCW: newX = col, newY = numRows - 1 - row
    //               for (let row = 0; row < numRows; row++) {
    //                   for (let col = 0; col < numCols; col++) {
    //                       if (charDef[row][col] === '1') {
    //                           // Rotate 180°: flip both axes
    //                           const newCol = row;
    //                           const newRow = numCols - 1 - col;
    //                           pixels.push({
    //                               x: x + newCol * scaledWarp,
    //                               y: y + newRow * scaledWeft,
    //                               width: scaledWarp,
    //                               height: scaledWeft
    //                           });
    //                       }
    //                   }
    //               }
      
    //               return pixels;
    //           }
    //       </script>
    //   </body>
    //   </html>`;
    //     };
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Onchain Rug #${s}</title><script src="https://cdn.jsdelivr.net/npm/p5@1.11.10/lib/p5.min.js"></script><style>body{display:flex;justify-content:center;align-items:center}#defaultCanvas0{width:100%!important;height:auto!important;}</style></head><body><div id="rug"></div><script>let w=800,h=1200,f=30,wt=8,wp=${currentWarpThickness},ts=2,lt,dt,p=${JSON.stringify(palette)},sd=${JSON.stringify(shortenedStripeData)},tr=${JSON.stringify(textRows)},td=[],dl=0,tl=0,s=${s};
let cm=${JSON.stringify(optimizedCharacterMapFinal)};
function setup(){noiseSeed(${s});window.d=function(s){window.prngSeed=s%2147483647;if(window.prngSeed<=0)window.prngSeed+=2147483646};window.b=function(){window.prngSeed=(window.prngSeed*16807)%2147483647;return(window.prngSeed-1)/2147483646};window.a=function(min,max){return min+window.b()*(max-min)};window.c=function(array){return array[Math.floor(window.b()*array.length)]};window.d(${s});let canvas=createCanvas(h+(f*4),w+(f*4));canvas.parent("rug");pixelDensity(2.5);u();gtd();noLoop()}
function u(){if(!p||!p.colors)return;let d=p.colors[0],l=p.colors[0],dv=999,lv=-1;for(let hex of p.colors){let c=color(hex),b=(red(c)+green(c)+blue(c))/3;if(b<dv){dv=b;d=hex}if(b>lv){lv=b;l=hex}}dt=lerpColor(color(d),color(0),0.4);lt=lerpColor(color(l),color(255),0.3)}
function draw(){background(222,222,222);push();translate(width/2,height/2);rotate(PI/2);translate(-height/2,-width/2);push();translate(f*2,f*2);for(let stripe of sd)ds(stripe);if(tl>0)dtol(Math.floor(tl));pop();df();if(dl>0)ddo(Math.floor(dl));pop()} 
function ds(s){
  let ws=wp+1,we=wt+1;
  for(let x=0;x<w;x+=ws){
    for(let y=s.y;y<s.y+s.h;y+=we){
      let wc=color(s.pc),itp=false;
      if(td.length>0){
        for(let tp of td){
          if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){
            itp=true;
            break;
          }
        }
      }
      let r=red(wc)+window.a(-15,15),
          g=green(wc)+window.a(-15,15),
          b=blue(wc)+window.a(-15,15);
      if(itp){
        fill(0,0,0,120);
        noStroke();
        let wcv=sin(y*0.05)*0.5;
        rect(x+wcv+0.5,y+0.5,wp,we);
        if(s.wt==="m"&&s.sc){
          const pb=(red(color(s.pc))+green(color(s.pc))+blue(color(s.pc)))/3,
                sb=(red(color(s.sc))+green(color(s.sc))+blue(color(s.sc)))/3,
                ab=(pb+sb)/2,
                tc=ab<128?lerpColor(lt,color(0,0,0),0.2):lerpColor(dt,color(255,255,255),0.2);
          r=red(tc);
          g=green(tc);
          b=blue(tc);
        }else{
          const bb=(r+g+b)/3,
                tc=bb<128?lt:dt;
          r=red(tc);
          g=green(tc);
          b=blue(tc);
        }
      }
      r=constrain(r,0,255);
      g=constrain(g,0,255);
      b=constrain(b,0,255);
      fill(r,g,b);
      noStroke();
      let wcv=sin(y*0.05)*0.5;
      rect(x+wcv,y,wp,we);
    }
  }
  for(let y=s.y;y<s.y+s.h;y+=we){
    for(let x=0;x<w;x+=ws){
      let wc=color(s.pc),itp=false;
      if(td.length>0){
        for(let tp of td){
          if(x>=tp.x&&x<tp.x+tp.width&&y>=tp.y&&y<tp.y+tp.height){
            itp=true;
            break;
          }
        }
      }
      if(s.wt==="m"&&s.sc){
        if(noise(x*0.1,y*0.1)>0.5)wc=color(s.sc);
      }else if(s.wt==="t"){
        let nv=noise(x*0.05,y*0.05);
        wc=lerpColor(color(s.pc),color(255),nv*0.15);
      }
      let r=red(wc)+window.a(-20,20),
          g=green(wc)+window.a(-20,20),
          b=blue(wc)+window.a(-20,20);
      if(itp){
        fill(0,0,0,120);
        noStroke();
        let wcv=cos(x*0.05)*0.5;
        rect(x+0.5,y+wcv+0.5,ws,wt);
        if(s.wt==="m"&&s.sc){
          let sampleColors=[color(wc)], radius=2;
          for(let dx=-radius;dx<=radius;dx++){
            for(let dy=-radius;dy<=radius;dy++){
              if(dx===0&&dy===0)continue;
              let cx=x+dx,cy=y+dy;
              if(cx>=0&&cx<w&&cy>=s.y&&cy<s.y+s.h){
                let cWeft=color(s.pc);
                if(noise(cx*0.1,cy*0.1)>0.5)cWeft=color(s.sc);
                sampleColors.push(cWeft);
              }
            }
          }
          if(sampleColors.length===0)sampleColors.push(color(s.pc));

          const relLum=(col)=>{const conv=(val)=>{const ch=val/255;return ch<=0.03928?ch/12.92:pow((ch+0.055)/1.055,2.4);};return 0.2126*conv(red(col))+0.7152*conv(green(col))+0.0722*conv(blue(col));};
          const contrastRatio=(a,b)=>{const la=relLum(a),lb=relLum(b),light=max(la,lb),dark=min(la,lb);return(light+0.05)/(dark+0.05);};
          const colorDistance=(a,b)=>Math.abs(red(a)-red(b))+Math.abs(green(a)-green(b))+Math.abs(blue(a)-blue(b));

          const primary=color(s.pc),secondary=color(s.sc),white=color(255,255,255),black=color(0,0,0);
          const distinctThreshold=90;
          const isDistinct=(candidate)=>colorDistance(candidate,primary)>distinctThreshold&&colorDistance(candidate,secondary)>distinctThreshold;

          // BULLETPROOF SOLUTION: For mixed weaves, use palette colors NOT used in stripe
          const candidates=[],candidateKeys=new Set();
          const addColor=(col)=>{
            const key=Math.round(red(col))+'-'+Math.round(green(col))+'-'+Math.round(blue(col));
            if(!candidateKeys.has(key)){
              candidateKeys.add(key);
              candidates.push(col);
            }
          };

          // Get all palette colors as p5.Color objects
          const allPaletteColors=p.colors&&p.colors.length?[]:[];
          if(p.colors&&p.colors.length){
            for(const palColor of p.colors){
              allPaletteColors.push(color(palColor));
            }
          }

          // Create a simple set of used colors (primary + secondary)
          const usedColors=new Set();
          const primary=color(s.pc),secondary=color(s.sc);
          usedColors.add(Math.round(red(primary))+'-'+Math.round(green(primary))+'-'+Math.round(blue(primary)));
          usedColors.add(Math.round(red(secondary))+'-'+Math.round(green(secondary))+'-'+Math.round(blue(secondary)));

          // Find unused palette colors
          const unusedPaletteColors=[];
          for(const paletteColor of allPaletteColors){
            const colorKey=Math.round(red(paletteColor))+'-'+Math.round(green(paletteColor))+'-'+Math.round(blue(paletteColor));
            if(!usedColors.has(colorKey)){
              unusedPaletteColors.push(paletteColor);
            }
          }

          // Use unused colors (darkened) as primary choice
          for(const unusedColor of unusedPaletteColors){
            const darkened=lerpColor(unusedColor,color(0,0,0),0.4);
            addColor(darkened);
          }

          // If no unused colors, use ALL palette colors (darkened) as fallback
          if(candidates.length===0&&allPaletteColors.length>0){
            for(const paletteColor of allPaletteColors){
              const darkened=lerpColor(paletteColor,color(0,0,0),0.4);
              addColor(darkened);
            }
          }

          const evaluate=(pool)=>{
            if(pool.length===0)return {best:white,bestScore:-1};
            let best=pool[0],bestScore=-1;
            for(const candidate of pool){
              let minContrast=Infinity;
              for(const background of sampleColors){
                const ratio=contrastRatio(candidate,background);
                if(ratio<minContrast)minContrast=ratio;
              }
              if(minContrast>bestScore){bestScore=minContrast;best=candidate;}
            }
            return {best,bestScore};
          };

          // For mixed weaves, we already filtered to only palette colors above
          // Just evaluate what we have
          let {best:bestCandidate,bestScore}=evaluate(candidates);

          // If still no good contrast, use ALL palette colors (darkened) as final fallback
          if(bestScore<4.5&&allPaletteColors.length>0){
            const allPaletteCandidates=[];
            for(const paletteColor of allPaletteColors){
              const darkenedColor=lerpColor(paletteColor,color(0,0,0),0.4);
              allPaletteCandidates.push(darkenedColor);
            }
            ({best:bestCandidate}=evaluate(allPaletteCandidates));
          }

          // For mixed weaves: Use thicker outline/border effect for maximum readability
          const mainTextColor=bestCandidate;
          const outlineColor=color(0,0,0); // Black outline

          // Draw thicker outline first (offset by 1-2 pixels)
          fill(outlineColor);
          noStroke();
          let outlineCurve=cos(x*0.05)*0.5;

          // Draw border in all 8 directions for thicker outline
          // Primary offsets (±1, ±1)
          rect(x+0.5+1,y+outlineCurve+0.5+1,ws,wt);
          rect(x+0.5-1,y+outlineCurve+0.5-1,ws,wt);
          rect(x+0.5+1,y+outlineCurve+0.5-1,ws,wt);
          rect(x+0.5-1,y+outlineCurve+0.5+1,ws,wt);

          // Additional border pixels for extra thickness (±2, ±0), (±0, ±2), (±2, ±2)
          rect(x+0.5+2,y+outlineCurve+0.5,ws,wt);
          rect(x+0.5-2,y+outlineCurve+0.5,ws,wt);
          rect(x+0.5,y+outlineCurve+0.5+2,ws,wt);
          rect(x+0.5,y+outlineCurve+0.5-2,ws,wt);
          rect(x+0.5+2,y+outlineCurve+0.5+2,ws,wt);
          rect(x+0.5-2,y+outlineCurve+0.5-2,ws,wt);
          rect(x+0.5+2,y+outlineCurve+0.5-2,ws,wt);
          rect(x+0.5-2,y+outlineCurve+0.5+2,ws,wt);

          // Now draw main text color on top
          r=red(mainTextColor);
          g=green(mainTextColor);
          b=blue(mainTextColor);
        }else{
          const bb=(r+g+b)/3,
                tc=bb<128?lt:dt;
          r=red(tc);
          g=green(tc);
          b=blue(tc);
        }
      }
      r=constrain(r,0,255);
      g=constrain(g,0,255);
      b=constrain(b,0,255);
      fill(r,g,b);
      noStroke();
      let wcv=cos(x*0.05)*0.5;
      rect(x,y+wcv,ws,wt);
    }
  }
  for(let y=s.y;y<s.y+s.h;y+=we*2){
    for(let x=0;x<w;x+=ws*2){
      fill(0,0,0,40);
      noStroke();
      rect(x+1,y+1,ws-2,we-2);
    }
  }
  for(let y=s.y+we;y<s.y+s.h;y+=we*2){
    for(let x=ws;x<w;x+=ws*2){
      fill(255,255,255,30);
      noStroke();
      rect(x,y,ws-1,we-1);
    }
  }
}
function dto(){push();blendMode(MULTIPLY);for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){let nv=noise(x*0.02,y*0.02),a=map(nv,0,1,0,50);fill(0,0,0,a);noStroke();rect(x,y,2,2)}}for(let x=0;x<w;x+=6){for(let y=0;y<h;y+=6){let nv=noise(x*0.03,y*0.03);if(nv>0.6){fill(255,255,255,25);noStroke();rect(x,y,6,6)}else if(nv<0.4){fill(0,0,0,20);noStroke();rect(x,y,6,6)}}}pop()}
function dtol(tl){const hi=tl===1?30:tl===2?80:120,ri=tl===1?20:tl===2?40:60,rt=tl===1?0.6:tl===2?0.5:0.4;push();blendMode(MULTIPLY);for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){let nv=noise(x*0.02,y*0.02),i=map(nv,0,1,0,hi);fill(0,0,0,i);noStroke();rect(x,y,2,2)}}for(let x=0;x<w;x+=6){for(let y=0;y<h;y+=6){let rn=noise(x*0.03,y*0.03);if(rn>rt){fill(255,255,255,ri);noStroke();rect(x,y,6,6)}else if(rn<(1-rt)){fill(0,0,0,ri*0.8);noStroke();rect(x,y,6,6)}}}if(tl>=2){for(let x=0;x<w;x+=8){for(let y=0;y<h;y+=8){let wn=noise(x*0.01,y*0.01);if(wn>0.7){fill(0,0,0,15);noStroke();rect(x,y,8,2)}}}}if(tl>=3){for(let x=0;x<w;x+=4){for(let y=0;y<h;y+=4){let wn=noise(x*0.005,y*0.005);if(wn>0.8){fill(0,0,0,25);noStroke();rect(x,y,4,1)}}}}pop()}
function ddo(dl){const di=dl===1?0.5:1.0,doo=dl===1?30:60;push();translate(f*2,f*2);for(let x=0;x<w;x+=3){for(let y=0;y<h;y+=3){const dn=window.a(0,1),dt=0.85*di;if(dn>dt){const ds=window.a(1,4),da=window.a(doo*0.5,doo),dr=window.a(60,90),dg=window.a(40,60),db=window.a(20,40);fill(dr,dg,db,da);noStroke();ellipse(x,y,ds,ds)}}}for(let i=0;i<15*di;i++){const sx=window.a(0,w),sy=window.a(0,h),ss=window.a(8,20),sa=window.a(doo*0.3,doo*0.7),sr=window.a(40,70),sg=window.a(25,45),sb=window.a(15,30);fill(sr,sg,sb,sa);noStroke();ellipse(sx,sy,ss,ss)}for(let x=0;x<w;x+=2){for(let y=0;y<h;y+=2){const ed=Math.min(x,y,w-x,h-y);if(ed<10){const edirt=window.a(0,1);if(edirt>0.7*di){const ea=window.a(10,25);fill(80,50,20,ea);noStroke();rect(x,y,2,2)}}}}pop()}
function df(){dfs(f*2,f,w,f,"top");dfs(f*2,f*2+h,w,f,"bottom");dse()}
function dfs(x,y,w,h,side){let fs=w/12,sw=w/fs;for(let i=0;i<fs;i++){let sx=x+i*sw;if(!p||!p.colors)return;let sc=window.c(p.colors);for(let j=0;j<12;j++){let tx=sx+window.a(-sw/6,sw/6),sy=side==="top"?y+h:y,ey=side==="top"?y:y+h,wa=window.a(1,4),wf=window.a(0.2,0.8),d=window.c([-1,1]),ci=window.a(0.5,2.0),tl=window.a(0.8,1.2),fc=color(sc),r=red(fc)*0.7,g=green(fc)*0.7,b=blue(fc)*0.7;stroke(r,g,b);strokeWeight(window.a(0.5,1.2));noFill();beginShape();for(let t=0;t<=1;t+=0.1){let yp=lerp(sy,ey,t*tl),xo=sin(t*PI*wf)*wa*t*d*ci;xo+=window.a(-1,1);if(window.b()<0.3)xo+=window.a(-2,2);vertex(tx+xo,yp)}endShape()}}}
function dse(){let ws=wt+1;function rs(side){const xo=side==="left"?0:w,ao=side==="left"?0:PI;for(let s of sd){for(let y=s.y;y<s.y+s.h;y+=ws){if(y===s.y)continue;if(s===sd[sd.length-1]&&y+ws>=s.y+s.h)continue;let sc=color(s.pc);if(s.sc&&s.wt==="m"){let sc2=color(s.sc),bf=noise(y*0.1)*0.5+0.5;sc=lerpColor(sc,sc2,bf)}let r=red(sc)*0.8,g=green(sc)*0.8,b=blue(sc)*0.8;fill(r,g,b);noStroke();let rad=wt*window.a(1.2,1.8),cx=f*2+xo+window.a(-2,2),cy=f*2+y+wt/2+window.a(-1,1),sa=ao+HALF_PI+window.a(-0.2,0.2),ea=ao-HALF_PI+window.a(-0.2,0.2);dtsa(cx,cy,rad,sa,ea,r,g,b,side)}}}rs("left");rs("right")}
function dtsa(cx,cy,rad,sa,ea,r,g,b,s){let tc=max(6,floor(rad/1.2)),ts=rad/tc;for(let i=0;i<tc;i++){let tr=rad-(i*ts),trr,trg,tb;if(i%2===0){trr=constrain(r+25,0,255);trg=constrain(g+25,0,255);tb=constrain(b+25,0,255)}else{trr=constrain(r-20,0,255);trg=constrain(g-20,0,255);tb=constrain(b-20,0,255)}fill(trr,trg,tb,88);arc(cx,cy,tr*2,tr*2,sa,ea)}fill(r*0.6,g*0.6,b*0.6,70);let so=s==="left"?1:-1;arc(cx+so,cy+1,rad*2,rad*2,sa,ea);for(let i=0;i<5;i++){let da=window.a(sa,ea),dr=rad*window.a(0.2,0.7),dx=cx+cos(da)*dr,dy=cy+sin(da)*dr;fill(r,g,b,120);ellipse(dx,dy,window.a(1.5,3.5),window.a(1.5,3.5))}}
function gtd(){td=[];const trr=tr||[];if(!trr||trr.length===0)return;const netr=trr.filter(row=>row&&row.trim()!=="");if(netr.length===0)return;const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cw=7*sw,ch=5*se,s=se,rs=cw*1.5,trw=netr.length*cw+(netr.length-1)*rs,bsx=(w-trw)/2;let cri=0;for(let ri=0;ri<trr.length;ri++){const rt=trr[ri];if(!rt||rt.trim()==="")continue;const tw=cw,th=rt.length*(ch+s)-s,sx=bsx+cri*(cw+rs),sy=(h-th)/2;for(let i=0;i<rt.length;i++){const c=rt.charAt(i),cy=sy+(rt.length-1-i)*(ch+s),cp=gcp(c,sx,cy,tw,ch);td.push(...cp)}cri++}}
function gcp(c,x,y,w,h){const p=[];const ws=wp+1,we=wt+1,sw=ws*ts,se=we*ts,cd=cm[c.toUpperCase()]||cm[" "],nr=cd.length,nc=cd[0].length;for(let r=0;r<nr;r++){for(let col=0;col<nc;col++){if(cd[r][col]==="1"){const ncol=r,nrow=nc-1-col;p.push({x:x+ncol*sw,y:y+nrow*se,width:sw,height:se})}}}return p}
    </script>
</body>
</html>`;

  // ===== FULL SOPHISTICATED ALGORITHM FROM FRONTEND =====
  // This now includes all the advanced features like:
  // - Rarity-based palette selection
  // - Complex stripe generation with density patterns
  // - Advanced dirt and texture overlays
  // - Sophisticated text embedding
  // - Character map generation
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <h3 className="text-green-400 font-mono text-lg mb-3">NFT Exporter</h3>
      <div className="space-y-3">
        <div className="text-gray-300 text-sm">
          <p><strong>Seed:</strong> {safeSeed}</p>
          <p><strong>Palette:</strong> {safePalette?.name || 'Custom'}</p>
          <p><strong>Text:</strong> {safeTextRows.join(', ') || 'None'}</p>
      </div>
        <button
          onClick={exportNFT}
          disabled={isExporting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-mono py-2 px-4 rounded transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export NFT'}
        </button>
      </div>
    </div>
  );
};

export default NFTExporter;
