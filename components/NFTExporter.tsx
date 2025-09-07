import React, { useState } from 'react';

interface NFTExporterProps {
  currentSeed: number;
  currentPalette: any;
  currentStripeData: any[];
  textRows: string[];
}

const NFTExporter: React.FC<NFTExporterProps> = ({
  currentSeed,
  currentPalette,
  currentStripeData,
  textRows
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Add default values and null checks
  const safeSeed = currentSeed || 42;
  const safePalette = currentPalette || { name: 'Default', colors: ['#000000', '#FFFFFF'] };
  const safeStripeData = currentStripeData || [];
  const safeTextRows = textRows || [];

  const exportNFT = async () => {
    setIsExporting(true);

    try {
      // Get the current values from the global scope (same as live generator)
      const currentPalette = (window as any).selectedPalette;
      const currentStripeData = (window as any).stripeData || [];
      
      
      
      // Create the NFT HTML content with current live data
      const nftHTML = createNFTHTML(safeSeed, currentPalette, currentStripeData, safeTextRows);
      
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

  const createNFTHTML = (seed: number, palette: any, stripeData: any[], textRows: string[]) => {
    // Get the current configuration from the live generator, with fallback
    const liveConfig = (window as any).DOORMAT_CONFIG || {};
    
    // Get the actual current warpThickness from the live generator
    const currentWarpThickness = (window as any).warpThickness || liveConfig.WARP_THICKNESS || 2;
    
    const config = {
      DOORMAT_WIDTH: liveConfig.DOORMAT_WIDTH || 800,
      DOORMAT_HEIGHT: liveConfig.DOORMAT_HEIGHT || 1200,
      FRINGE_LENGTH: liveConfig.FRINGE_LENGTH || 30,
      WEFT_THICKNESS: liveConfig.WEFT_THICKNESS || 8,
      WARP_THICKNESS: currentWarpThickness, // Use the actual live generator value
      TEXT_SCALE: liveConfig.TEXT_SCALE || 2,
      MAX_CHARS: liveConfig.MAX_CHARS || 11,
      MAX_TEXT_ROWS: liveConfig.MAX_TEXT_ROWS || 5
    };
    
    // Debug: Log what we're actually passing to the template
      // Function called with parameters (logging removed for production)
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Doormat NFT #${seed}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #f0f0f0;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .nft-container {
            text-align: center;
        }
        .nft-info {
            margin-bottom: 20px;
            color: #333;
        }
        .nft-seed {
            font-weight: bold;
            color: #0066cc;
        }
        
        .traits-section {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        
        .traits-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
            font-weight: bold;
        }
        
        .traits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .trait-item {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 10px;
        }
        
        .trait-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .trait-name {
            font-size: 12px;
            font-weight: 600;
            color: #495057;
            text-transform: capitalize;
        }
        
        .trait-rarity {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
        }
        
        .trait-value {
            font-size: 14px;
            color: #212529;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="nft-container">
        <div class="nft-info">
            <h2>Doormat NFT #<span class="nft-seed">${seed}</span></h2>
            <p>Seed: ${seed}</p>
            <p>Palette: ${palette?.name || 'Custom'}</p>
            <p>Text: ${textRows.join(', ') || 'None'}</p>
            
            <div class="traits-section">
                <h3>NFT Traits & Rarity</h3>
                <div class="traits-grid" id="traits-container">
                    <!-- Traits will be populated by JavaScript -->
                </div>
            </div>
        </div>
        <div id="canvas-container"></div>
    </div>

    <script>
        // Configuration from the live generator
        const config = ${JSON.stringify(config)};
        
        // Dimensions
        let doormatWidth = config.DOORMAT_WIDTH || 800;
        let doormatHeight = config.DOORMAT_HEIGHT || 1200;
        let fringeLength = config.FRINGE_LENGTH || 30;
        let weftThickness = config.WEFT_THICKNESS || 8;
        let warpThickness = config.WARP_THICKNESS || 2; // Use config instead of parameter
        let TEXT_SCALE = config.TEXT_SCALE || 2;
        let MAX_CHARS = config.MAX_CHARS || 11;
        
        // Current settings
        let selectedPalette = ${JSON.stringify(palette)};
        let stripeData = ${JSON.stringify(stripeData)};
let doormatTextRows = ${JSON.stringify(textRows)};
let textData = [];

        // Colors
let lightTextColor, darkTextColor;

        // COMPREHENSIVE TRAIT CALCULATION SYSTEM
        function getPaletteRarity(paletteName) {
            const legendaryPalettes = ["Buddhist", "Maurya Empire", "Chola Dynasty", "Indigo Famine", "Bengal Famine", "Jamakalam"];
            const epicPalettes = ["Indian Peacock", "Flamingo", "Toucan", "Madras Checks", "Kanchipuram Silk", "Natural Dyes", "Bleeding Vintage"];
            const rarePalettes = ["Tamil Classical", "Sangam Era", "Pandya Dynasty", "Maratha Empire", "Rajasthani"];
            const uncommonPalettes = ["Tamil Nadu Temple", "Kerala Onam", "Chettinad Spice", "Chennai Monsoon", "Bengal Indigo"];
            
            if (legendaryPalettes.includes(paletteName)) return "Legendary";
            if (epicPalettes.includes(paletteName)) return "Epic";
            if (rarePalettes.includes(paletteName)) return "Rare";
            if (uncommonPalettes.includes(paletteName)) return "Uncommon";
            return "Common";
        }

        function calculateStripeComplexity(stripeData) {
            if (!stripeData || stripeData.length === 0) return "Basic";
            
            let complexityScore = 0;
            let mixedCount = 0;
            let texturedCount = 0;
            let solidCount = 0;
            let secondaryColorCount = 0;
            
            for (let stripe of stripeData) {
                if (stripe.weaveType === 'mixed') {
                    mixedCount++;
                    complexityScore += 2;
                } else if (stripe.weaveType === 'textured') {
                    texturedCount++;
                    complexityScore += 1.5;
                } else {
                    solidCount++;
                }
                
                if (stripe.secondaryColor) {
                    secondaryColorCount++;
                    complexityScore += 1;
                }
            }
            
            const solidRatio = solidCount / stripeData.length;
            const normalizedComplexity = complexityScore / (stripeData.length * 3);
            
            if (solidRatio > 0.9) return "Basic";
            if (solidRatio > 0.75 && normalizedComplexity < 0.15) return "Simple";
            if (solidRatio > 0.6 && normalizedComplexity < 0.3) return "Moderate";
            if (normalizedComplexity < 0.5) return "Complex";
            return "Very Complex";
        }

        function getTextLinesRarity(textLines) {
            if (textLines === 0) return "Common";
            if (textLines === 1) return "Uncommon";
            if (textLines === 2) return "Rare";
            if (textLines === 3) return "Epic";
            if (textLines >= 4) return "Legendary";
            return "Common";
        }

        function getCharacterRarity(totalChars) {
            if (totalChars === 0) return "Common";
            if (totalChars <= 5) return "Uncommon";
            if (totalChars <= 15) return "Rare";
            if (totalChars <= 30) return "Epic";
            if (totalChars >= 31) return "Legendary";
            return "Common";
        }

        function getStripeCountRarity(count) {
            if (count < 20) return "Legendary";
            if (count < 25) return "Epic";
            if (count < 32) return "Rare";
            if (count < 40) return "Uncommon";
            return "Common";
        }

        function getStripeComplexityRarity(complexity) {
            switch (complexity) {
                case "Basic": return "Common";
                case "Simple": return "Uncommon";
                case "Moderate": return "Rare";
                case "Complex": return "Epic";
                case "Very Complex": return "Legendary";
                default: return "Common";
            }
        }

        function calculateTraits() {
            const textLines = doormatTextRows.length;
            const totalCharacters = doormatTextRows.reduce((sum, row) => sum + row.length, 0);
            const stripeCount = stripeData.length;
            const stripeComplexity = calculateStripeComplexity(stripeData);
            const paletteName = selectedPalette ? selectedPalette.name : "Unknown";
            
            return {
                textLines: {
                    value: textLines,
                    rarity: getTextLinesRarity(textLines)
                },
                totalCharacters: {
                    value: totalCharacters,
                    rarity: getCharacterRarity(totalCharacters)
                },
                paletteName: {
                    value: paletteName,
                    rarity: getPaletteRarity(paletteName)
                },
                stripeCount: {
                    value: stripeCount,
                    rarity: getStripeCountRarity(stripeCount)
                },
                stripeComplexity: {
                    value: stripeComplexity,
                    rarity: getStripeComplexityRarity(stripeComplexity)
                },
                warpThickness: {
                    value: warpThickness,
                    rarity: getWarpThicknessRarity(warpThickness)
                }
            };
        }

        function getRarityColor(rarity) {
            switch (rarity) {
                case "Legendary": return "#ff6b35";
                case "Epic": return "#8a2be2";
                case "Rare": return "#007bff";
                case "Uncommon": return "#28a745";
                case "Common": return "#6c757d";
                default: return "#6c757d";
            }
        }

        // Warp thickness rarity calculation (metadata only)
        function getWarpThicknessRarity(thickness) {
            switch (thickness) {
                case 1: return "Legendary"; // Very thin
                case 2: return "Uncommon";  // Thin
                case 3: return "Common";    // Medium-thin
                case 4: return "Common";    // Medium (most common)
                case 5: return "Uncommon";  // Thick
                case 6: return "Legendary"; // Very thick
                default: return "Common";
            }
        }

        // Calculate traits for this NFT
        const nftTraits = calculateTraits();

        // Populate traits display
        function populateTraitsDisplay() {
            const traitsContainer = document.getElementById('traits-container');
            if (!traitsContainer) return;
            
            const traits = calculateTraits();
            let html = '';
            Object.entries(traits).forEach(([key, trait]) => {
                const rarity = trait.rarity || 'Common';
                const value = trait.value;
                const rarityColor = getRarityColor(rarity);
                html += '<div class="trait-item">' +
                    '<div class="trait-header">' +
                        '<span class="trait-name">' + key.replace(/([A-Z])/g, ' $1').trim() + '</span>' +
                        '<span class="trait-rarity" style="background-color: ' + rarityColor + '20; color: ' + rarityColor + '; border: 1px solid ' + rarityColor + '40;">' + rarity + '</span>' +
                    '</div>' +
                    '<div class="trait-value">' + (typeof value === 'string' ? value : value.toString()) + '</div>' +
                '</div>';
            });
            traitsContainer.innerHTML = html;
        }

function setup() {
            // Set the random seed to recreate the exact same doormat
    randomSeed(${seed});
    noiseSeed(${seed});
    
            // Create canvas with swapped dimensions for 90-degree rotation
            let canvas = createCanvas(doormatHeight + (fringeLength * 4), doormatWidth + (fringeLength * 4));
            canvas.parent('canvas-container');
            
            // Set high DPR for crisp rendering on high-DPI displays
            pixelDensity(2.5);
            
            // Initialize text colors
    updateTextColors();
            
            // Generate text data
    generateTextData();
    
            noLoop();
            
            // Populate traits display after setup
            setTimeout(() => {
                populateTraitsDisplay();
            }, 100);
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
            
            // Make text colors more prominent
            darkTextColor = lerpColor(color(darkest), color(0), 0.4);
            lightTextColor = lerpColor(color(lightest), color(255), 0.3);
}

function draw() {
            // Use a background that won't create visible bands after rotation
            background(222, 222, 222);
    
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
            // Top fringe (warp ends)
            // Top fringe - adjusted for larger canvas buffer
            drawFringeSection(fringeLength * 2, fringeLength, doormatWidth, fringeLength, 'top');
            
            // Bottom fringe - adjusted for larger canvas buffer
            drawFringeSection(fringeLength * 2, fringeLength * 2 + doormatHeight, doormatWidth, fringeLength, 'bottom');
            
            // Draw selvedge edges (weft loops) on left and right sides
            drawSelvedgeEdges();
}

function drawSelvedgeEdges() {
            let weftSpacing = weftThickness + 1;
            let isFirst = true;
            let isLast = false;
            
            // Left selvedge edge - flowing semicircular weft threads
            for (let stripe of stripeData) {
                for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
                    // Skip the very first and very last weft threads of the entire doormat
                    if (isFirst) {
                        isFirst = false;
                        continue;
                    }
                    
                    // Check if this is the last weft thread
                    if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
                        isLast = true;
                        continue; // Skip this last weft thread instead of breaking
                    }
                    
                    // Get the color from the current stripe
                    let selvedgeColor = color(stripe.primaryColor);
                    
                    // Check if there's a secondary color for blending
                    if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
                        let secondaryColor = color(stripe.secondaryColor);
                        // Blend the colors based on noise for variation
                        let blendFactor = noise(y * 0.1) * 0.5 + 0.5;
                        selvedgeColor = lerpColor(selvedgeColor, secondaryColor, blendFactor);
                    }
                    
                    let r = red(selvedgeColor) * 0.8;
                    let g = green(selvedgeColor) * 0.8;
                    let b = blue(selvedgeColor) * 0.8;
                    
                    fill(r, g, b);
                    noStroke();
                    
                    let radius = weftThickness * random(1.2, 1.8); // Vary size slightly
                    let centerX = fringeLength * 2 + random(-2, 2); // Slight position variation
                    let centerY = fringeLength * 2 + y + weftThickness/2 + random(-1, 1); // Slight vertical variation
                    
                    // Vary the arc angles for more natural look
                    let startAngle = HALF_PI + random(-0.2, 0.2);
                    let endAngle = -HALF_PI + random(-0.2, 0.2);
                    
                    // Draw textured semicircle with individual thread details
                    drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, 'left');
                }
            }
            
            // Right selvedge edge - flowing semicircular weft threads
            let isFirstWeftRight = true;
            let isLastWeftRight = false;
            
            for (let stripe of stripeData) {
                for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
                    // Skip the very first and very last weft threads of the entire doormat
                    if (isFirstWeftRight) {
                        isFirstWeftRight = false;
                        continue;
                    }
                    
                    // Check if this is the last weft thread
                    if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
                        isLastWeftRight = true;
                        continue; // Skip this last weft thread instead of breaking
                    }
                    
                    // Get the color from the current stripe
                    let selvedgeColor = color(stripe.primaryColor);
                    
                    // Check if there's a secondary color for blending
                    if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
                        let secondaryColor = color(stripe.secondaryColor);
                        // Blend the colors based on noise for variation
                        let blendFactor = noise(y * 0.1) * 0.5 + 0.5;
                        selvedgeColor = lerpColor(selvedgeColor, secondaryColor, blendFactor);
                    }
                    
                    let r = red(selvedgeColor) * 0.8;
                    let g = green(selvedgeColor) * 0.8;
                    let b = blue(selvedgeColor) * 0.8;
                    
                    fill(r, g, b);
                    noStroke();
                    
                    let radius = weftThickness * random(1.2, 1.8); // Vary size slightly
                    let centerX = fringeLength * 2 + doormatWidth + random(-2, 2); // Slight position variation
                    let centerY = fringeLength * 2 + y + weftThickness/2 + random(-1, 1); // Slight vertical variation
                    
                    // Vary the arc angles for more natural look
                    let startAngle = -HALF_PI + random(-0.2, 0.2);
                    let endAngle = HALF_PI + random(-0.2, 0.2);
                    
                    // Draw textured semicircle with individual thread details
                    drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right');
                }
            }
        }
        
        function drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, side) {
            // Draw a realistic textured selvedge arc with visible woven texture
            let threadCount = max(6, floor(radius / 1.2)); // More threads for visible texture
            let threadSpacing = radius / threadCount;
            
            // Draw individual thread arcs to create visible woven texture
            for (let i = 0; i < threadCount; i++) {
                let threadRadius = radius - (i * threadSpacing);
                
                // Create distinct thread colors for visible texture
                let threadR, threadG, threadB;
                
                if (i % 2 === 0) {
                    // Lighter threads
                    threadR = constrain(r + 25, 0, 255);
                    threadG = constrain(g + 25, 0, 255);
                    threadB = constrain(b + 25, 0, 255);
                } else {
                    // Darker threads
                    threadR = constrain(r - 20, 0, 255);
                    threadG = constrain(g - 20, 0, 255);
                    threadB = constrain(b - 20, 0, 255);
                }
                
                // Add some random variation for natural look
                threadR = constrain(threadR + random(-10, 10), 0, 255);
                threadG = constrain(threadG + random(-10, 10), 0, 255);
                threadB = constrain(threadB + random(-10, 10), 0, 255);
                
                fill(threadR, threadG, threadB, 88); // More transparent for better blending
                
                // Draw individual thread arc with slight position variation
                let threadX = centerX + random(-1, 1);
                let threadY = centerY + random(-1, 1);
                let threadStartAngle = startAngle + random(-0.1, 0.1);
                let threadEndAngle = endAngle + random(-0.1, 0.1);
                
                arc(threadX, threadY, threadRadius * 2, threadRadius * 2, threadStartAngle, threadEndAngle);
            }
            
            // Add a few more detailed texture layers
            for (let i = 0; i < 3; i++) {
                let detailRadius = radius * (0.3 + i * 0.2);
                let detailAlpha = 180 - (i * 40);
                
                // Create contrast for visibility
                let detailR = constrain(r + (i % 2 === 0 ? 15 : -15), 0, 255);
                let detailG = constrain(g + (i % 2 === 0 ? 15 : -15), 0, 255);
                let detailB = constrain(b + (i % 2 === 0 ? 15 : -15), 0, 255);
                
                fill(detailR, detailG, detailB, detailAlpha * 0.7); // More transparent detail layers
                
                let detailX = centerX + random(-0.5, 0.5);
                let detailY = centerY + random(-0.5, 0.5);
                let detailStartAngle = startAngle + random(-0.05, 0.05);
                let detailEndAngle = endAngle + random(-0.05, 0.05);
                
                arc(detailX, detailY, detailRadius * 2, detailRadius * 2, detailStartAngle, detailEndAngle);
            }
            
            // Add subtle shadow for depth
            fill(r * 0.6, g * 0.6, b * 0.6, 70); // More transparent shadow
            let shadowOffset = side === 'left' ? 1 : -1;
            arc(centerX + shadowOffset, centerY + 1, radius * 2, radius * 2, startAngle, endAngle);
            
            // Add small transparent hole in the center
            noFill();
            arc(centerX, centerY, radius * 0.5, radius * 0.5, startAngle, endAngle);
            
            // Add visible texture details - small bumps and knots
            for (let i = 0; i < 8; i++) {
                let detailAngle = random(startAngle, endAngle);
                let detailRadius = radius * random(0.2, 0.7);
                let detailX = centerX + cos(detailAngle) * detailRadius;
                let detailY = centerY + sin(detailAngle) * detailRadius;
                
                // Alternate between light and dark for visible contrast
                if (i % 2 === 0) {
                    fill(r + 20, g + 20, b + 20, 120); // More transparent light bumps
                } else {
                    fill(r - 15, g - 15, b - 15, 120); // More transparent dark bumps
                }
                
                noStroke();
                ellipse(detailX, detailY, random(1.5, 3.5), random(1.5, 3.5));
            }
        }
        
        function drawFringeSection(x, y, w, h, side) {
            let fringeStrands = w / 12; // More fringe strands for thinner threads
            let strandWidth = w / fringeStrands;
            
            for (let i = 0; i < fringeStrands; i++) {
                let strandX = x + i * strandWidth;
                
                // Safety check for selectedPalette
                if (!selectedPalette || !selectedPalette.colors) {
                    return;
                }
                
                let strandColor = random(selectedPalette.colors);
                
                // Draw individual fringe strand with thin threads
                for (let j = 0; j < 12; j++) { // More but thinner threads per strand
                    let threadX = strandX + random(-strandWidth/6, strandWidth/6);
                    let startY = side === 'top' ? y + h : y;
                    let endY = side === 'top' ? y : y + h;
                    
                    // Add natural curl/wave to the fringe with more variation
                    let waveAmplitude = random(1, 4);
                    let waveFreq = random(0.2, 0.8);
                    
                    // Randomize the direction and intensity for each thread
                    let direction = random([-1, 1]); // Random left or right direction
                    let curlIntensity = random(0.5, 2.0);
                    let threadLength = random(0.8, 1.2); // Vary thread length
                    
                    // Use darker version of strand color for fringe
                    let fringeColor = color(strandColor);
                    let r = red(fringeColor) * 0.7;
                    let g = green(fringeColor) * 0.7;
                    let b = blue(fringeColor) * 0.7;
                    
                    stroke(r, g, b);
                    strokeWeight(random(0.5, 1.2)); // Vary thread thickness
                    
                    noFill();
                    beginShape();
                    for (let t = 0; t <= 1; t += 0.1) {
                        let yPos = lerp(startY, endY, t * threadLength);
                        let xOffset = sin(t * PI * waveFreq) * waveAmplitude * t * direction * curlIntensity;
                        // Add more randomness and natural variation
                        xOffset += random(-1, 1);
                        // Add occasional kinks and bends
                        if (random() < 0.3) {
                            xOffset += random(-2, 2);
                        }
                        vertex(threadX + xOffset, yPos);
                    }
                    endShape();
                }
            }
}

function generateTextData() {
    textData = [];
            const textRows = doormatTextRows || [];
            if (!textRows || textRows.length === 0) return;
            
            // Filter out empty text rows (same as live generator)
            const nonEmptyTextRows = textRows.filter(row => row && row.trim() !== '');
            if (nonEmptyTextRows.length === 0) return;
            
            const warpSpacing = warpThickness + 1;
            const weftSpacing = weftThickness + 1;
            const scaledWarp = warpSpacing * TEXT_SCALE;
            const scaledWeft = weftSpacing * TEXT_SCALE;
            
            // Character dimensions based on thread spacing (EXACT same as live generator)
            const charWidth = 7 * scaledWarp; // width after rotation (7 columns)
            const charHeight = 5 * scaledWeft; // height after rotation (5 rows)
            const spacing = scaledWeft; // vertical gap between stacked characters
            
            // Calculate spacing between rows (horizontal spacing after rotation)
            const rowSpacing = charWidth * 1.5; // Space between rows
            
            // Calculate total width needed for all NON-EMPTY rows
            const totalRowsWidth = nonEmptyTextRows.length * charWidth + (nonEmptyTextRows.length - 1) * rowSpacing;
            
            // Calculate starting X position to center all NON-EMPTY rows
            const baseStartX = (doormatWidth - totalRowsWidth) / 2;
            
            let currentRowIndex = 0;
            for (let rowIndex = 0; rowIndex < textRows.length; rowIndex++) {
                const rowText = textRows[rowIndex];
                if (!rowText || rowText.trim() === '') continue; // Skip empty rows
                
                // Calculate text dimensions for this row
                const textWidth = charWidth;
                const textHeight = rowText.length * (charHeight + spacing) - spacing;
                
                // Position for this NON-EMPTY row (left to right becomes after rotation)
                const startX = baseStartX + currentRowIndex * (charWidth + rowSpacing);
                const startY = (doormatHeight - textHeight) / 2;
                
                // Generate character data vertically bottom-to-top for this row
                for (let i = 0; i < rowText.length; i++) {
                    const char = rowText.charAt(i);
                    const charY = startY + (rowText.length - 1 - i) * (charHeight + spacing);
                    const charPixels = generateCharacterPixels(char, startX, charY, textWidth, charHeight);
                    textData.push(...charPixels);
                }
                
                currentRowIndex++; // Only increment for non-empty rows
            }
        }
        
        // Character Map Data - 5x7 pixel grid for text embedding (EXACT same as live generator)
        const characterMap = {
            'A': ["01110","10001","10001","11111","10001","10001","10001"],
            'B': ["11110","10001","10001","11110","10001","10001","11110"],
            'C': ["01111","10000","10000","10000","10000","10000","01111"],
            'D': ["11110","10001","10001","10001","10001","10001","11110"],
            'E': ["11111","10000","10000","11110","10000","10000","11111"],
            'F': ["11111","10000","10000","11110","10000","10000","10000"],
            'G': ["01111","10000","10000","10011","10001","10001","01111"],
            'H': ["10001","10001","10001","11111","10001","10001","10001"],
            'I': ["11111","00100","00100","00100","00100","00100","11111"],
            'J': ["11111","00001","00001","00001","00001","10001","01110"],
            'K': ["10001","10010","10100","11000","10100","10010","10001"],
            'L': ["10000","10000","10000","10000","10000","10000","11111"],
            'M': ["10001","11011","10101","10001","10001","10001","10001"],
            'N': ["10001","11001","10101","10011","10001","10001","10001"],
            'O': ["01110","10001","10001","10001","10001","10001","01110"],
            'P': ["11110","10001","10001","11110","10000","10000","10000"],
            'Q': ["01110","10001","10001","10001","10101","10010","01101"],
            'R': ["11110","10001","10001","11110","10100","10010","10001"],
            'S': ["01111","10000","10000","01110","00001","00001","11110"],
            'T': ["11111","00100","00100","00100","00100","00100","00100"],
            'U': ["10001","10001","10001","10001","10001","10001","01110"],
            'V': ["10001","10001","10001","10001","10001","01010","00100"],
            'W': ["10001","10001","10001","10001","10101","11011","10001"],
            'X': ["10001","10001","01010","00100","01010","10001","10001"],
            'Y': ["10001","10001","01010","00100","00100","00100","00100"],
            'Z': ["11111","00001","00010","00100","01000","10000","11111"],
            ' ': ["00000","00000","00000","00000","00000","00000","00000"],
            '0': ["01110","10001","10011","10101","11001","10001","01110"],
            '1': ["00100","01100","00100","00100","00100","00100","01110"],
            '2': ["01110","10001","00001","00010","00100","01000","11111"],
            '3': ["11110","00001","00001","01110","00001","00001","11110"],
            '4': ["00010","00110","01010","10010","11111","00010","00010"],
            '5': ["11111","10000","10000","11110","00001","00001","11110"],
            '6': ["01110","10000","10000","11110","10001","10001","01110"],
            '7': ["11111","00001","00010","00100","01000","01000","01000"],
            '8': ["01110","10001","10001","01110","10001","10001","01110"],
            '9': ["01110","10001","10001","01111","00001","00001","01110"]
        };
        
        function generateCharacterPixels(char, x, y, width, height) {
            const pixels = [];
            const warpSpacing = warpThickness + 1;
            const weftSpacing = weftThickness + 1;
            const scaledWarp = warpSpacing * TEXT_SCALE;
            const scaledWeft = weftSpacing * TEXT_SCALE;

            // Character definitions - use the EXACT same format as live generator
            const charDef = characterMap[char.toUpperCase()] || characterMap[' '];

            const numRows = charDef.length;
            const numCols = charDef[0].length;

            // Rotate 90° CCW: newX = col, newY = numRows - 1 - row
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < numCols; col++) {
                    if (charDef[row][col] === '1') {
                        // Rotate 180°: flip both axes
                        const newCol = row;
                        const newRow = numCols - 1 - col;
                        pixels.push({
                            x: x + newCol * scaledWarp,
                            y: y + newRow * scaledWeft,
                            width: scaledWarp,
                            height: scaledWeft
                        });
                    }
                }
            }

            return pixels;
        }
    </script>
</body>
</html>`;
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
