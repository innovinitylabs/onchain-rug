# 🎯 FUNCTION RENAMING OPTIMIZATION PLAN

## 📊 CURRENT FUNCTION NAMES (that can be shortened):

### **Functions Called by p5.js (CANNOT rename):**
- `setup()` ✅ (p5.js required)
- `draw()` ✅ (p5.js required)

### **Functions We CAN Rename (internal helpers):**
- `updateTextColors()` → `u()` (9 → 3 chars)
- `drawStripe()` → `ds()` (10 → 4 chars)  
- `drawTextureOverlay()` → `dto()` (18 → 5 chars)
- `drawTextureOverlayWithLevel()` → `dtol()` (26 → 6 chars)
- `drawDirtOverlay()` → `ddo()` (15 → 5 chars)
- `drawFringe()` → `df()` (10 → 4 chars)
- `drawFringeSection()` → `dfs()` (17 → 5 chars)
- `drawSelvedgeEdges()` → `dse()` (17 → 5 chars)
- `drawTexturedSelvedgeArc()` → `dtsa()` (22 → 6 chars)
- `generateTextData()` → `gtd()` (16 → 5 chars)
- `generateCharacterPixels()` → `gcp()` (21 → 5 chars)

## 📏 CHARACTER SAVINGS:

### **Per Function Call:**
- `updateTextColors()` → `u()`: **6 chars saved per call**
- `drawStripe()` → `ds()`: **6 chars saved per call**
- `drawTextureOverlay()` → `dto()`: **13 chars saved per call**
- `drawTextureOverlayWithLevel()` → `dtol()`: **20 chars saved per call**
- `drawDirtOverlay()` → `ddo()`: **10 chars saved per call**
- `drawFringe()` → `df()`: **6 chars saved per call**
- `drawFringeSection()` → `dfs()`: **12 chars saved per call**
- `drawSelvedgeEdges()` → `dse()`: **12 chars saved per call**
- `drawTexturedSelvedgeArc()` → `dtsa()`: **16 chars saved per call**
- `generateTextData()` → `gtd()`: **11 chars saved per call**
- `generateCharacterPixels()` → `gcp()`: **16 chars saved per call**

## 🎯 IMPLEMENTATION STEPS:

### **1. Rename Function Definitions:**
```javascript
// BEFORE:
function updateTextColors(){...}
function drawStripe(s){...}

// AFTER:
function u(){...}
function ds(s){...}
```

### **2. Update All Function Calls:**
```javascript
// BEFORE:
updateTextColors();
for(let stripe of sd)drawStripe(stripe);

// AFTER:
u();
for(let stripe of sd)ds(stripe);
```

## 💰 EXPECTED SAVINGS:
- **Per NFT:** ~50-100 characters saved
- **Total Impact:** 0.1-0.2KB per NFT
- **Gas Savings:** Additional 5-10% reduction

## ✅ SAFE TO RENAME:
- Only internal helper functions
- Not p5.js system functions (setup, draw)
- All cross-references updated consistently
