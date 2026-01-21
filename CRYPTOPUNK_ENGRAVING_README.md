# Cryptopunk Rug Engraving System

This feature allows OnchainRugs to display Cryptopunk engravings on the back of rugs when owned by Cryptopunk holders.

## 🎨 How It Works

1. **Dynamic Display**: When a rug NFT is viewed, the system checks if the current owner also owns any Cryptopunks
2. **Automatic Engraving**: If they do, their Cryptopunk is engraved on the rug's back
3. **Test Mode**: During development, you can test different punk patterns locally

## 🛠️ Local Testing Setup

### Option 1: Test Patterns (Recommended for Development)

1. Open the generator page
2. Select "Crypto Punk" from the Mask Type dropdown
3. Choose from preset punk patterns:
   - **Classic**: Basic face
   - **Beanie**: Punk with beanie hat
   - **Cap**: Baseball cap
   - **Hoodie**: Hoodie strings
   - **Pipe**: Smoking pipe
   - **Crazy Hair**: Spiky hair
   - **Mohawk**: Shaved sides, mohawk
   - **Wild Hair**: Flowing hair
   - **Nerd Glasses**: Thick glasses
   - **Regular Shades**: Sunglasses
   - **Custom**: Enter specific Punk ID (0-9999)

4. Click "Load Real SVGs from Files" to see authentic Cryptopunk engravings

### Option 2: Real Cryptopunk SVGs

1. **Download all punk SVGs**:
   ```bash
   # Replace YOUR_RPC_URL with your Alchemy or Infura endpoint
   node scripts/download-punks.js "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
   ```

2. **Load into generator**:
   - Click "Load Real SVGs from Files"
   - Select any punk ID to see the actual engraving

## 📁 File Structure

```
data/cryptopunks/           # Downloaded punk SVG batches
├── index.json             # Batch index file
├── punks-000.json         # Punks 0-99
├── punks-001.json         # Punks 100-199
└── ...

scripts/
└── download-punks.js       # SVG downloader script

lib/GeometricPatterns.ts    # Pattern rendering with punk support
app/generator/page.tsx      # UI controls for punk selection
```

## 🔧 Technical Implementation

### SVG Parsing
- Parses `<rect>` elements from Cryptopunk SVGs
- Converts to 24x24 boolean pixel arrays
- Supports real-time engraving generation

### Pattern Generation
- **Real SVGs**: Exact pixel-perfect reproduction
- **Test Patterns**: Algorithmic generation of punk features
- **Positioning**: Centered on rug back, 15% of canvas size

### Performance
- **Lazy Loading**: SVGs loaded only when needed
- **Caching**: Pixel arrays cached after parsing
- **Rate Limiting**: Built-in delays for RPC calls

## 🚀 Onchain Implementation

For production deployment:

1. **Contract Integration**: Modify `tokenURI()` to check punk ownership
2. **SVG Embedding**: Include punk SVG in HTML generation
3. **Gas Optimization**: Cache ownership checks and SVG data

## 🎯 Usage Examples

```typescript
// Load test patterns
await patternRenderer.loadPunksFromFiles();

// Load real punks from files
await patternRenderer.loadPunksFromFiles();

// Create engraving mask
const mask = patternRenderer.createMask('crypto_punk', params, palette, width, height, punkId);
```

## ⚠️ Important Notes

- **Copyright**: Cryptopunk SVGs are owned by Larva Labs
- **Rate Limits**: Respect RPC provider limits when downloading
- **Storage**: 10k SVGs = ~50MB of JSON data
- **Performance**: Real SVG parsing is slower than test patterns

## 🔮 Future Enhancements

- **Dynamic Ownership**: Real-time punk ownership checking
- **Multiple Punks**: Support for multiple punk engravings
- **Engraving Styles**: Different engraving depths and effects
- **Animation**: Punk animations on rug hover

---

**Ready to test?** Select "Crypto Punk" in the generator and try different patterns! 🎨✨