# Generative Doormat NFT Art Generator

A revolutionary P5.js generative art piece that creates unique, woven doormat designs with embedded text, comprehensive color palettes, and NFT-ready export capabilities.

## ✨ Features

🎨 **102 Color Palettes**: 
- **Global Palettes**: Classic, Natural, Coastal, Rustic, Modern, Autumn, Spring, Industrial, Mediterranean, Vivid Mellow
- **Cultural Palettes**: Indian Cultural, Tamil Cultural, Peacock, Flamingo, Toucan
- **Historical Palettes**: Pandya Dynasty, Maratha Empire, Maurya Empire, Buddhist
- **Natural Dye Palettes**: Indigo Famine, Bengal Famine, Madras Famine, Jamakalam
- **Rarity System**: Common, Uncommon, Rare, Epic, Legendary palettes

🧵 **Realistic Cloth-Like Weaving**:
- Both horizontal (weft) and vertical (warp) threads visible
- Organic thread curves and natural fabric irregularities
- Three weave types: solid, mixed, and textured
- Subtle highlights and shadows for depth
- Grain texture overlay for authentic fabric appearance

📝 **Text Embedding System**:
- Freemium model: 1 visible text row + up to 5 additional rows
- Custom pixel-based font rendering
- Dynamic color contrast for readability
- Maximum 11 characters per row (A-Z, 0-9, space)
- Text woven directly into the fabric pattern

🎯 **Advanced Stripe Patterns**:
- Random stripe heights with natural variation
- Primary and secondary color blending
- Noise-based texture variations
- Complex stripe complexity calculations

🌾 **Authentic Fringe & Selvedge**:
- Curved, flowing fringe strands at top and bottom
- Multiple threads per strand for realistic appearance
- Natural wave patterns and irregularities
- Textured selvedge edges with concentric circles
- Thread-like structures with varying shades and transparency

⚡ **PRNG (Pseudo Random Number Generator)**:
- Reproducible results using seed values
- Same seed always generates identical doormat
- Perfect for sharing and archiving designs

🏷️ **NFT Trait System**:
- **Text Lines**: Number of embedded text rows (0-5)
- **Total Characters**: Sum of all characters across rows
- **Palette Name**: Current color palette identifier
- **Palette Rarity**: Common to Legendary classification
- **Stripe Count**: Number of horizontal stripes
- **Stripe Complexity**: Simple, Moderate, or Complex

💾 **NFT Export System**:
- Self-contained HTML files for on-chain storage
- Ultra-compressed and minified code
- Variable obfuscation with Tamil letters
- Ready for minting on any blockchain
- Includes all traits and metadata

## 🚀 How to Use

1. Open `index.html` in a web browser
2. **Generate New Doormat**: Creates a random pattern with new colors
3. **Use Seed**: Enter a number to generate reproducible results
4. **Add Text**: Type custom text to weave into the doormat
5. **Export NFT**: Download self-contained HTML for blockchain minting
6. **View Traits**: See all NFT metadata and rarity calculations

## 🏗️ Technical Architecture

- **Modular Design**: Clean separation of concerns across multiple files
- **Canvas Size**: 800x1200 pixels (portrait orientation)
- **Weave Resolution**: Configurable warp/weft thickness
- **Color System**: 102 curated palettes with rarity classification
- **Text Rendering**: Custom pixel-based font system
- **Export System**: Dynamic code extraction and minification

## 📁 File Structure

```
/Doormat/
├── index.html              # Main HTML interface and NFT export logic
├── doormat.js              # Core P5.js generation algorithm
├── color-palettes.js       # 102 color palette definitions
├── character-map.js        # Pixel-based font character definitions
├── trait-calculator.js     # NFT trait calculation logic
├── html-interface.js       # UI interaction and HTML manipulation
├── doormat-config.js       # Shared configuration constants
└── README.md              # This file
```

## 🎨 Color Palette Categories

### Global Palettes
- **Classic**: Traditional doormat colors
- **Natural**: Earth tones and organic hues
- **Coastal**: Ocean-inspired blues and sands
- **Rustic**: Warm, weathered tones
- **Modern**: Contemporary color schemes
- **Autumn**: Fall foliage colors
- **Spring**: Fresh, blooming hues
- **Industrial**: Urban, metallic tones
- **Mediterranean**: Mediterranean Sea colors
- **Vivid Mellow**: Bright but soft colors

### Cultural Palettes
- **Indian Cultural**: Traditional Indian textile colors
- **Tamil Cultural**: Tamil Nadu heritage colors
- **Peacock**: Peacock feather-inspired palette
- **Flamingo**: Pink and coral tones
- **Toucan**: Tropical bird colors

### Historical Palettes
- **Pandya Dynasty**: Ancient South Indian empire colors
- **Maratha Empire**: Maratha warrior colors
- **Maurya Empire**: Mauryan dynasty heritage
- **Buddhist**: Spiritual and meditative tones

### Natural Dye Palettes
- **Indigo Famine**: Historical indigo cultivation colors
- **Bengal Famine**: Bengal region traditional dyes
- **Madras Famine**: Madras region heritage colors
- **Jamakalam**: Traditional Tamil weaving colors

## 🔧 Development

This project uses a modular architecture for maintainability and easy NFT export generation. The core algorithm is separated from UI logic, making it easy to extract and compress for blockchain storage.

## 🌟 Examples

Try these seeds for interesting patterns:
- **42**: Default earthy pattern
- **123**: Vibrant traditional colors
- **999**: Ocean-inspired blues and greens
- **777**: Sunset warmth
- **2024**: Modern industrial tones

## 📱 NFT Integration

Each exported doormat includes:
- Complete generative algorithm
- Current color palette and traits
- Embedded text data
- Rarity calculations
- Self-contained HTML for blockchain storage

Perfect for creating unique, on-chain generative art NFTs with rich metadata and reproducible generation! 🏠✨🚀
