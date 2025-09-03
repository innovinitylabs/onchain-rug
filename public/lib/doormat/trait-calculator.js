// Trait Calculator Functions - NFT rarity and attribute calculation
// Used for computing doormat characteristics for NFT metadata

// Helper function to access doormat data from external context
function getTraitData() {
    // These will be passed in or accessed globally when calculating traits
    return {
        doormatTextRows: window.doormatTextRows || [],
        selectedPalette: window.selectedPalette || null,
        stripeData: window.stripeData || []
    };
}

function calculateTraits() {
    const data = getTraitData();
    
    const traits = {
        // Text traits
        textLines: data.doormatTextRows.length,
        totalCharacters: data.doormatTextRows.reduce((sum, row) => sum + row.length, 0),
        
        // Palette traits
        paletteName: data.selectedPalette ? data.selectedPalette.name : "Unknown",
        paletteRarity: getPaletteRarity(data.selectedPalette ? data.selectedPalette.name : ""),
        
        // Visual traits
        stripeCount: data.stripeData.length,
        stripeComplexity: calculateStripeComplexity(data.stripeData)
    };
    
    console.log("Calculated traits:", traits);
    return traits;
}

function getPaletteRarity(paletteName) {
    // Define rarity tiers for different palette categories
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
    
    // Count different pattern types
    for (let stripe of stripeData) {
        if (stripe.weaveType === 'mixed') {
            mixedCount++;
            complexityScore += 2; // Mixed weave adds more complexity
        } else if (stripe.weaveType === 'textured') {
            texturedCount++;
            complexityScore += 1.5; // Textured adds medium complexity
        } else {
            solidCount++;
            // Solid adds no complexity
        }
        
        if (stripe.secondaryColor) {
            secondaryColorCount++;
            complexityScore += 1; // Secondary colors add complexity
        }
    }
    
    // Calculate ratios
    const mixedRatio = mixedCount / stripeData.length;
    const texturedRatio = texturedCount / stripeData.length;
    const solidRatio = solidCount / stripeData.length;
    const secondaryRatio = secondaryColorCount / stripeData.length;
    
    // Normalize complexity score
    const normalizedComplexity = complexityScore / (stripeData.length * 3); // Max possible is 3 per stripe
    
    // Much more strict classification
    if (solidRatio > 0.9) return "Basic"; // Almost all solid
    if (solidRatio > 0.75 && normalizedComplexity < 0.15) return "Simple"; // Mostly solid with minimal complexity
    if (solidRatio > 0.6 && normalizedComplexity < 0.3) return "Moderate"; // Good amount of solid with some complexity
    if (normalizedComplexity < 0.5) return "Complex"; // Significant complexity
    return "Very Complex"; // High complexity
}

// Additional helper functions for rarity classification
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

// Make functions globally available
if (typeof window !== 'undefined') {
    window.calculateTraits = calculateTraits;
    window.getPaletteRarity = getPaletteRarity;
    window.calculateStripeComplexity = calculateStripeComplexity;
    window.getTextLinesRarity = getTextLinesRarity;
    window.getCharacterRarity = getCharacterRarity;
    window.getStripeCountRarity = getStripeCountRarity;
    window.getStripeComplexityRarity = getStripeComplexityRarity;
    window.getRarityColor = getRarityColor;
}
