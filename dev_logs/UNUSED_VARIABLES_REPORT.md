# 🔍 UNUSED VARIABLES ANALYSIS REPORT

## 📊 **CURRENT VARIABLE DECLARATION:**
```javascript
let w=800,h=1200,f=30,wt=8,wp=${currentWarpThickness},ts=2,mc=11,lt,dt,p=${JSON.stringify(palette)},sd=${JSON.stringify(shortenedStripeData)},tr=${JSON.stringify(textRows)},td=[],sdirt=false,dl=0,stex=false,tl=0,s=${seed};
```

## ❌ **UNUSED VARIABLE DETECTED:**

### **Variable: `mc` (max characters)**
- **Value:** `11`
- **Status:** ❌ **UNUSED**
- **Location:** Only in declaration (line 948)
- **Function:** Was likely intended to limit text characters
- **Impact:** Safe to remove

## ✅ **CONFIRMED USED VARIABLES:**

### **Core Dimensions:**
- ✅ **`w`** (width) - Used in createCanvas, calculations
- ✅ **`h`** (height) - Used in createCanvas, calculations  
- ✅ **`f`** (frame/border) - Used in translate, createCanvas

### **Thread Properties:**
- ✅ **`wt`** (weft thickness) - Used in ds() function
- ✅ **`wp`** (warp thickness) - Used in ds() function

### **Text Properties:**
- ✅ **`ts`** (text scale) - Used in gtd() and gcp() functions
- ❌ **`mc`** (max characters) - **UNUSED** ⚠️

### **Color Properties:**
- ✅ **`lt`** (light text) - Used in ds() for text coloring
- ✅ **`dt`** (dark text) - Used in ds() for text coloring

### **Data Properties:**
- ✅ **`p`** (palette) - Used in dfs() function
- ✅ **`sd`** (stripe data) - Used in draw() function
- ✅ **`tr`** (text rows) - Used in gtd() function
- ✅ **`td`** (text data) - Used in ds() function

### **Feature Flags:**
- ✅ **`sdirt`** (show dirt) - Used in draw() function
- ✅ **`dl`** (dirt level) - Used in ddo() function
- ✅ **`stex`** (show texture) - Used in draw() function
- ✅ **`tl`** (texture level) - Used in dtol() function

### **System Properties:**
- ✅ **`s`** (seed) - Used for PRNG initialization
- ✅ **`cm`** (character map) - Used in gcp() function

## 💰 **OPTIMIZATION OPPORTUNITY:**

### **Remove Unused Variable:**
```javascript
// Current:
let w=800,h=1200,f=30,wt=8,wp=${currentWarpThickness},ts=2,mc=11,lt,dt,...

// Optimized:
let w=800,h=1200,f=30,wt=8,wp=${currentWarpThickness},ts=2,lt,dt,...
```
**Savings:** `mc=11,` → **6 characters removed**

## 🎯 **CONCLUSION:**

**Only 1 unused variable found:** `mc=11`

- ✅ **Safe to remove** (not used anywhere)
- ✅ **6 character savings** per NFT
- ✅ **No functionality impact**
- ✅ **All other variables are essential**

**This is a small but valid optimization!** 🚀💰

**Recommendation: Remove the unused `mc=11` variable.** 🎯
