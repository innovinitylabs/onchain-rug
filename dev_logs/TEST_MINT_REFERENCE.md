# 🔄 STANDARD TEST MINT DATA REFERENCE

## 📋 Official Test Mint Values (DO NOT USE SLOPPY VALUES)

**Always use these exact values for test minting instead of random/made-up data.**

### 🎯 MintRug Function Parameters

```solidity
// EXACT VALUES TO USE FOR TESTING
mintRug(
    textRows: ["VALIPOKKANN"],           // ✅ User's name
    seed: 8463,                          // ✅ Fixed seed for consistency
    visual: {
        warpThickness: 1,                // ✅ uint8 (1-5 range)
        stripeCount: 24                  // ✅ uint256 (matches actual data)
    },
    art: {
        paletteName: "Royal Stewart",    // ✅ Named palette
        minifiedPalette: "{\"name\":\"Royal Stewart\",\"colors\":[\"#e10600\",\"#ffffff\",\"#000000\",\"#ffd700\",\"#007a3d\"]}",
        minifiedStripeData: "[{\"y\":0,\"h\":72.2,\"pc\":\"#000000\",\"sc\":null,\"wt\":\"s\",\"wv\":0.406},...]", // Full 24 stripes
        filteredCharacterMap: "{\"V\":[\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"01010\",\"00100\"],...}" // VALIPOKKANN chars
    },
    complexity: 2,                       // ✅ uint8
    characterCount: 10                   // ✅ uint256 (VALIPOKKANN = 10 chars)
)
```

### 🎨 Complete Art Data

#### Palette: Royal Stewart
- Red: `#e10600`
- White: `#ffffff`
- Black: `#000000`
- Gold: `#ffd700`
- Green: `#007a3d`

#### Characters: VALIPOKKANN (10 characters)
- V, A, L, I, P, O, K, K, A, N, N

#### Stripe Count: 24 detailed stripes
- Full positional data with colors, heights, patterns

### 💰 Minting Cost
- **Price**: `0.00003 ETH` (30,000 wei)
- **Formula**: `basePrice (0.000005) + linePrice1 (0.000001) = 0.000006 ETH`

### ✅ Why These Values?
- **Production-ready**: Real user data, not random junk
- **Consistent**: Same results every time with seed 8463
- **Complete**: All required fields properly formatted
- **Tested**: Works with current ERC721-C integration

### 🚫 NEVER USE:
- Random strings like `["TEST"]`
- Random numbers like `12345`
- Placeholder data like `"test"`
- Incomplete struct data

### 📁 Reference Files
- `test_mint_data.json` - Complete JSON with all data
- `TEST_MINT_REFERENCE.md` - This documentation

---

**REMINDER: When testing mint functionality, ALWAYS use these exact values from `test_mint_data.json`. No exceptions!** 🎯
