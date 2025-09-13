# 🔍 PRNG FUNCTION USAGE ANALYSIS REPORT

## 📊 **FUNCTION ORIGIN:**

### **Custom Functions (We Created):**
- ✅ `window.prngRange(min, max)` - **Custom function**
- ✅ `window.prngNext()` - **Custom function** 
- ✅ `window.prngChoice(array)` - **Custom function**
- ✅ `window.initPRNG(seed)` - **Custom function**

**All PRNG functions are custom implementations, not built-in browser functions.**

## 📈 **USAGE FREQUENCY ANALYSIS:**

### **Most Common Ranges (Duplicates Found):**

#### **TOP REPEATED RANGES:**
```
5x window.prngRange(-1, 1)     // Position variations (fringe, selvedge)
5x window.prngRange(-1,1)      // Same as above (no space formatting)
4x window.prngRange(-0.2, 0.2) // Angle variations (fringe arcs)
4x window.prngRange(-0.2,0.2)  // Same as above
3x window.prngRange(-20, 20)   // Weft color noise (±20 RGB)
3x window.prngRange(-20,20)    // Same as above
3x window.prngRange(-2, 2)     // Position variations (selvedge)
3x window.prngRange(-2,2)      // Same as above
3x window.prngRange(-15, 15)   // Warp color noise (±15 RGB)
3x window.prngRange(-15,15)    // Same as above
3x window.prngRange(-10, 10)   // Thread color variations (±10 RGB)
3x window.prngRange(-10,10)    // Same as above
```

#### **DUPLICATE PATTERNS IDENTIFIED:**
- **Color noise:** `(-15,15)`, `(-20,20)`, `(-10,10)` used 3x each
- **Position:** `(-1,1)`, `(-2,2)` used 5x and 3x respectively  
- **Angles:** `(-0.2,0.2)` used 4x
- **Formatting:** Some calls have spaces, some don't (cosmetic difference)

### **Unique Ranges (Used Once):**
```
1x window.prngRange(0, w)              // Full width dirt placement
1x window.prngRange(0, h)              // Full height dirt placement
1x window.prngRange(0, doormatWidth)   // Dynamic width (commented)
1x window.prngRange(0, doormatHeight)  // Dynamic height (commented)
1x window.prngRange(0.2, 0.7)          // Radius scaling
1x window.prngRange(0.5, 2.0)          // Curl intensity
1x window.prngRange(0.8, 1.2)          // Thread length
1x window.prngRange(1, 4)              // Wave amplitude
1x window.prngRange(1.2, 1.8)          // Size scaling
1x window.prngRange(1.5, 3.5)          // Detail ellipse size
1x window.prngRange(8, 20)             // Stain size
1x window.prngRange(10, 25)            // Edge dirt alpha
1x window.prngRange(15, 30)            // Stain blue channel
1x window.prngRange(20, 40)            // Dirt blue channel
1x window.prngRange(25, 45)            // Stain green channel
1x window.prngRange(40, 60)            // Dirt green channel
1x window.prngRange(40, 70)            // Stain red channel
1x window.prngRange(60, 90)            // Dirt red channel
```

### **Dynamic Ranges (Variable Parameters):**
```
1x window.prngRange(dirtOpacity * 0.5, dirtOpacity)
1x window.prngRange(dirtOpacity * 0.3, dirtOpacity * 0.7)
1x window.prngRange(doo * 0.5, doo)
1x window.prngRange(doo * 0.3, doo * 0.7)
1x window.prngRange(-sw/6, sw/6)                    // Dynamic strand width
1x window.prngRange(-strandWidth/6, strandWidth/6) // Dynamic strand width
1x window.prngRange(startAngle, endAngle)           // Dynamic angles
1x window.prngRange(sa, ea)                         // Dynamic angles
```

## 🎯 **KEY FINDINGS:**

### **Heavy Reuse Patterns:**
- **Color variations:** ±10, ±15, ±20 RGB ranges used extensively
- **Position offsets:** -2 to +2, -1 to +1 ranges very common
- **Angle variations:** -0.2 to +0.2 radians frequently used

### **Optimization Opportunities:**
1. **Constants:** Could define common ranges as constants to reduce repetition
2. **Formatting:** Inconsistent spacing (some calls have spaces, some don't)
3. **Dynamic ranges:** Some ranges are calculated repeatedly

### **Function Usage:**
- **prngRange:** 58+ calls (most used)
- **prngNext:** 6 calls (used for conditional logic)
- **prngChoice:** 4 calls (used for color selection and direction)

## 💡 **RECOMMENDATIONS:**

1. **Standardize formatting:** Choose consistent spacing in function calls
2. **Extract constants:** Define frequently used ranges as named constants
3. **Consider caching:** Dynamic ranges could be pre-calculated
4. **Keep PRNG:** The 280-byte overhead is worth the deterministic benefits

**The analysis shows extensive but well-structured PRNG usage with clear patterns of reuse!** 🔬
