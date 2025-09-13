# 🎲 PRNG vs DETERMINISTIC FEATURES IN PAGE.TSX

## 🎯 **FEATURE ANALYSIS BREAKDOWN:**

### **A. PRNG-BASED FEATURES (Seed-Dependent Randomness):**

#### **1. Warp Thickness Selection:**
```javascript
const warpThicknessRoll = prng.next()  // Uses PRNG
// Result: Same seed = same thickness every time
```
**Status:** ✅ **PRNG-controlled** - Deterministic per seed

#### **2. Stripe Generation (Density & Patterns):**
```javascript
let densityType = stripePRNG.next()     // Uses derived PRNG
let stripeHeight = minHeight + (stripePRNG.next() * range)  // Uses PRNG
let primaryColor = palette.colors[Math.floor(stripePRNG.next() * palette.colors.length)]
```
**Status:** ✅ **PRNG-controlled** - Same seed = identical stripe structure

#### **3. Secondary Color Probability:**
```javascript
let hasSecondaryColor = stripePRNG.next() < secondaryColorChance
```
**Status:** ✅ **PRNG-controlled** - Consistent per seed

#### **4. Weave Pattern Selection:**
```javascript
let weaveRand = stripePRNG.next()  // Uses PRNG
if (weaveRand < solidChance) weaveType = 'solid'
```
**Status:** ✅ **PRNG-controlled** - Same patterns per seed

#### **5. Warp Variation:**
```javascript
warpVariation: stripePRNG.next() * 0.4 + 0.1
```
**Status:** ✅ **PRNG-controlled** - Consistent per seed

#### **6. Drawing Functions (Color Variations):**
```javascript
let r = p.red(warpColor) + drawingPRNG.range(-15, 15)
let g = p.green(warpColor) + drawingPRNG.range(-15, 15)
```
**Status:** ✅ **PRNG-controlled** - Same variations per seed

### **B. MATH.RANDOM() FEATURES (True Randomness):**

#### **1. Palette Rarity Selection:**
```javascript
const rarityRoll = Math.random()  // TRUE randomness, not seed-based!
// This breaks seed determinism!
```
**Status:** ❌ **Math.random()** - Different every time, ignores seed!

#### **2. Palette Selection Within Rarity Tier:**
```javascript
const tierPaletteIndex = Math.floor(Math.random() * tierPalettes.length)
// Also uses Math.random(), not PRNG
```
**Status:** ❌ **Math.random()** - Not deterministic per seed

### **C. DETERMINISTIC FEATURES (No Randomness):**

#### **1. Text Processing:**
```javascript
const validTexts = textInputs.filter(text => text.trim().length > 0)
// No randomness - purely input-based
```
**Status:** ✅ **Deterministic** - Same input = same output

#### **2. Character Map Optimization:**
```javascript
const used = new Set<string>();
textInputs.forEach(row => {
  for (let char of row.toUpperCase()) {
    used.add(char);  // Deterministic character extraction
  }
});
```
**Status:** ✅ **Deterministic** - Based purely on text input

#### **3. Canvas Setup:**
```javascript
let canvas = p.createCanvas(DOORMAT_HEIGHT + FRINGE_LENGTH * 4, 
                           DOORMAT_WIDTH + FRINGE_LENGTH * 4)
// Fixed dimensions, no randomness
```
**Status:** ✅ **Deterministic** - Same dimensions every time

#### **4. Configuration Values:**
```javascript
DOORMAT_WIDTH: 800, DOORMAT_HEIGHT: 1200, FRINGE_LENGTH: 30
// Hardcoded values, no randomness
```
**Status:** ✅ **Deterministic** - Fixed configuration

#### **5. Text Scaling:**
```javascript
const scaledWarp = warpSpacing * TEXT_SCALE
const scaledWeft = weftSpacing * TEXT_SCALE
```
**Status:** ✅ **Deterministic** - Mathematical calculation, no randomness

## 🚨 **CRITICAL ISSUE DETECTED:**

### **Seed Determinism is BROKEN!**
```javascript
// In generateStripes function:
const rarityRoll = Math.random()  // ❌ NOT USING PRNG!

// This means:
// Same seed → Different palette selection ❌
// Breaks NFT reproducibility!
```

## 📊 **SUMMARY:**

### **PRNG Features (Seed-Consistent):**
- ✅ Warp thickness selection
- ✅ Stripe density & sizing  
- ✅ Weave pattern selection
- ✅ Color variations (±15 RGB)
- ✅ Dirt/stain placement
- ✅ Texture overlays

### **Math.random() Features (Non-Deterministic):**
- ❌ **Palette rarity selection** (breaks seed consistency!)
- ❌ **Palette choice within rarity tier**

### **Deterministic Features:**
- ✅ Text processing & embedding
- ✅ Character map optimization
- ✅ Canvas dimensions
- ✅ Configuration values
- ✅ Text scaling calculations

## 🎯 **RECOMMENDATION:**

**Replace Math.random() with PRNG for palette selection to restore seed determinism:**

```javascript
// Current (BROKEN):
const rarityRoll = Math.random()

// Fixed (Deterministic):
const rarityRoll = prng.next()
```

**This will ensure same seed = same palette every time!** 🔧
