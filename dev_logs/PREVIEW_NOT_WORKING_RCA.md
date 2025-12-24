# Root Cause Analysis: Preview Still Not Working

**Date:** December 24, 2024  
**Issue:** Rug market previews still not rendering correctly after `renderMode` fix  
**Status:** INVESTIGATING

---

## Problem Statement

After fixing the `renderMode` prop destructuring issue, the previews in the rug marketplace are still not working. The previews may be:
- Showing blank/placeholder images
- Not rendering the actual rug artwork
- Stuck in loading state
- Showing error states

---

## Code Flow Analysis

### Expected Flow (How It Should Work)

1. **Component Mount:**
   ```
   RugMarketGrid renders RugCard
   → RugCard renders NFTDisplay with renderMode="interactive"
   → NFTDisplay component mounts
   ```

2. **Script Loading:**
   ```
   RugGenerator instance created
   → loadScripts() called asynchronously
   → Fetches rug-p5.js, rug-algo.js, rug-frame.js
   → Sets scriptsLoaded = true
   → Calls onScriptsLoaded callback
   → NFTDisplay sets scriptsLoaded state = true
   ```

3. **Preview Generation:**
   ```
   useEffect triggers when scriptsLoaded = true
   → Calls rugGenerator.generatePreview(traits, tokenId, renderMode)
   → generatePreview() calls generateHTMLPreview(traits, tokenId, renderMode)
   → generateHTMLPreview() creates HTML string with scripts
   → Creates Blob from HTML
   → Creates blob: URL
   → Returns blob URL
   → Sets previewImage state = blob URL
   ```

4. **Rendering:**
   ```
   previewImage is set to blob URL
   → Component re-renders
   → Renders <iframe src={blobUrl}>
   → Browser loads blob URL
   → Scripts execute in iframe
   → Canvas is drawn
   → Preview displays
   ```

---

## Potential Root Causes

### 🔴 CRITICAL ISSUE #1: Script Loading Race Condition

**Problem:** The `scriptsLoaded` state might not be set correctly or in time.

**Analysis:**
```typescript
const rugGenerator = useMemo(() => new RugGenerator(() => {
  console.log('Scripts loaded, updating state')
  setScriptsLoaded(true)
}), [])
```

**Issues:**
1. **RugGenerator.loadScripts() is async** but the callback might fire before scripts are actually ready
2. **Multiple NFTDisplay instances** might share the same RugGenerator instance (if useMemo doesn't create new instances)
3. **Script fetch might fail** silently, leaving `scriptsLoaded` false
4. **Callback might not fire** if scripts fail to load

**Evidence:**
- Console shows "Scripts loaded, updating state" but preview doesn't render
- `scriptsLoaded` stays `false`
- Preview shows placeholder `/rug-loading-mid.webp`

**Location:** `components/NFTDisplay.tsx:428-431`

---

### 🔴 CRITICAL ISSUE #2: Blob URL Generation Failure

**Problem:** `generatePreview()` might return empty string or fail silently.

**Analysis:**
```typescript
generatePreview(traits: RugTraits, tokenId?: number, renderMode?: 'og' | 'interactive'): string {
  try {
    console.log('Generating HTML preview from traits for token', tokenId)
    const htmlContent = this.generateHTMLPreview(traits, tokenId, renderMode)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    return blobUrl
  } catch (error) {
    console.error('Failed to generate HTML preview:', error)
    return ''  // ⚠️ Returns empty string on error
  }
}
```

**Issues:**
1. **If `generateHTMLPreview()` throws**, returns empty string
2. **Empty string is falsy**, so `previewImage` might not be set correctly
3. **Blob creation might fail** if HTML content is invalid
4. **No error handling** in the calling code - empty string is treated as valid

**Evidence:**
- Console shows "Generating HTML preview" but no blob URL
- `previewImage` is empty string
- Component shows fallback placeholder

**Location:** `components/NFTDisplay.tsx:390-401`

---

### 🔴 CRITICAL ISSUE #3: HTML Generation Issues

**Problem:** `generateHTMLPreview()` might generate invalid HTML or have script execution issues.

**Analysis:**
```typescript
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <script>${this.rugP5Script}</script>
</head>
<body>
  <div id="rug"></div>
  <script>
    let w = 800, h = 1200, ...
  </script>
  <script>${this.rugAlgoScript}</script>
  <script>${this.rugFrameScript}</script>${ogReadyScript}
</body>
</html>`
```

**Issues:**
1. **Scripts might not be loaded** (`this.rugP5Script` might be empty string)
2. **Template literal injection** might break if scripts contain backticks or `${}`
3. **Script execution order** might be wrong
4. **OG ready script** might interfere with normal rendering (even in interactive mode)

**Evidence:**
- HTML blob is created but iframe shows blank
- Console errors in iframe context
- Scripts not executing

**Location:** `components/NFTDisplay.tsx:282-320`

---

### 🔴 CRITICAL ISSUE #4: Iframe Rendering Issues

**Problem:** The iframe might not load the blob URL correctly.

**Analysis:**
```typescript
<iframe
  src={previewImage}
  className="border-0 pointer-events-none"
  title={`NFT ${nftData.tokenId}`}
  sandbox="allow-scripts"
  scrolling="no"
  style={{ width: '100%', height: '100%', ... }}
/>
```

**Issues:**
1. **Blob URL might be revoked** before iframe loads it
2. **Sandbox restrictions** might prevent script execution
3. **Iframe might not have dimensions** (0x0) if parent container has no size
4. **CORS issues** with blob URLs (unlikely but possible)

**Evidence:**
- Iframe exists but is blank
- Iframe has dimensions but no content
- Console shows iframe load errors

**Location:** `components/NFTDisplay.tsx:596-610`

---

### 🔴 CRITICAL ISSUE #5: State Management Race Conditions

**Problem:** Multiple useEffects might conflict or reset state incorrectly.

**Analysis:**
```typescript
// Effect 1: Reset state when tokenId/traits change
useEffect(() => {
  if (currentTokenId !== lastGeneratedTokenId) {
    setPreviewImage('')
    setIsGenerating(true)
    // ...
  }
}, [nftData?.tokenId, lastGeneratedTokenId, blobUrl, traitsKey, lastTraitsKey])

// Effect 2: Generate preview
useEffect(() => {
  if (traitsKey && traitsKey === lastTraitsKey && previewImage) {
    return  // Skip if already generated
  }
  const generatePreview = async () => {
    // ...
  }
  generatePreview()
}, [nftData.tokenId, traitsKey, nftData.animation_url, rugGenerator, scriptsLoaded, renderMode])
```

**Issues:**
1. **Effect 1 resets `previewImage`** to empty string
2. **Effect 2 checks `previewImage`** and might skip generation
3. **Race condition:** Effect 1 runs, sets `previewImage = ''`, then Effect 2 runs but `previewImage` is empty so it generates, but Effect 1 might run again
4. **`isGenerating` state** might prevent rendering even when preview is ready

**Evidence:**
- Preview flickers or resets
- Preview never appears
- `isGenerating` stays `true`

**Location:** `components/NFTDisplay.tsx:467-548`

---

### 🔴 CRITICAL ISSUE #6: Traits Data Missing or Invalid

**Problem:** `nftData.traits` might be null, undefined, or missing required fields.

**Analysis:**
```typescript
if (nftData.traits) {
  if (!scriptsLoaded) {
    setPreviewImage('/rug-loading-mid.webp')
    return
  }
  const imageData = rugGenerator.generatePreview(nftData.traits, nftData.tokenId, renderMode)
  // ...
}
```

**Issues:**
1. **`nftData.traits` might be null** → falls through to `animation_url` check
2. **Required fields missing** → `generateHTMLPreview()` might fail or generate invalid HTML
3. **Traits might be stale** → preview shows old data
4. **Traits format mismatch** → parsing fails silently

**Evidence:**
- Console shows "nftData.traits is null"
- Preview shows placeholder
- `generatePreview()` called but returns empty string

**Location:** `components/NFTDisplay.tsx:501-512`

---

### 🔴 CRITICAL ISSUE #7: RenderMode Logic Affecting Interactive Mode

**Problem:** The OG mode logic might be interfering with interactive mode rendering.

**Analysis:**
```typescript
const isOGMode = renderMode === 'og'
const textureLevel = isOGMode ? 0 : (traits?.agingLevel || 0)
const dirtLevel = isOGMode ? 0 : (traits?.dirtLevel || 0)
const frameLevel = isOGMode ? '' : (() => { /* ... */ })()
```

**Issues:**
1. **OG ready script** is only injected when `isOGMode` is true, so this shouldn't affect interactive mode
2. **BUT:** If `renderMode` is undefined or null, `isOGMode` would be false, which is correct
3. **However:** The script injection logic might have syntax errors that break the HTML

**Evidence:**
- Interactive mode previews don't work
- OG mode previews don't work
- Both modes fail

**Location:** `components/NFTDisplay.tsx:170-280`

---

## Diagnostic Steps Needed

### Step 1: Check Script Loading
```javascript
// Add to browser console:
// Check if scripts are loaded
console.log('RugGenerator scripts:', window.rugGenerator?.rugP5Script?.length)
```

### Step 2: Check Blob URL Generation
```javascript
// Add logging to generatePreview():
console.log('HTML Content length:', htmlContent.length)
console.log('Blob URL:', blobUrl)
```

### Step 3: Check Iframe Loading
```javascript
// Add to iframe onLoad:
console.log('Iframe loaded:', iframe.contentWindow?.document?.readyState)
```

### Step 4: Check State Values
```javascript
// Add to component:
console.log('scriptsLoaded:', scriptsLoaded)
console.log('previewImage:', previewImage)
console.log('isGenerating:', isGenerating)
console.log('renderMode:', renderMode)
```

### Step 5: Check Traits Data
```javascript
// Add to component:
console.log('nftData.traits:', nftData.traits)
console.log('traitsKey:', traitsKey)
```

---

## Most Likely Root Causes (Priority Order)

### 1. **Script Loading Failure** (HIGHEST PROBABILITY)
- Scripts fail to load from `/data/rug-p5.js` etc.
- `scriptsLoaded` never becomes `true`
- Preview stays in loading state

### 2. **Blob URL Generation Failure** (HIGH PROBABILITY)
- `generateHTMLPreview()` throws error
- Returns empty string
- Preview never sets

### 3. **State Race Condition** (MEDIUM PROBABILITY)
- Multiple useEffects conflict
- State resets before preview can render
- Preview flickers or never appears

### 4. **Iframe Rendering Issue** (MEDIUM PROBABILITY)
- Blob URL revoked too early
- Iframe sandbox restrictions
- Canvas not rendering in iframe

### 5. **Traits Data Missing** (LOW PROBABILITY)
- `nftData.traits` is null
- Falls back to placeholder
- But this should show placeholder, not blank

---

## Recommended Investigation Order

1. **Check browser console** for errors
2. **Check Network tab** - are scripts loading? (rug-p5.js, rug-algo.js, rug-frame.js)
3. **Check React DevTools** - what is `scriptsLoaded` state?
4. **Check `previewImage` state** - is it a blob URL or empty?
5. **Check iframe** - does it have content? Check iframe's console for errors
6. **Check `nftData.traits`** - is it populated correctly?

---

## Expected vs Actual Behavior

### Expected:
- Scripts load → `scriptsLoaded = true`
- Preview generates → `previewImage = "blob:http://..."`
- Iframe loads → Canvas renders → Preview displays

### Actual (Suspected):
- Scripts might not load → `scriptsLoaded = false` → Shows placeholder
- OR: Scripts load but preview generation fails → `previewImage = ""` → Shows placeholder
- OR: Preview generates but iframe doesn't render → Blank iframe

---

## Next Steps

1. **Add comprehensive logging** to identify exact failure point
2. **Check browser console** for specific errors
3. **Verify script URLs** are accessible
4. **Test blob URL generation** in isolation
5. **Check iframe sandbox permissions**
6. **Verify traits data structure**

---

## Conclusion

The preview not working is likely due to one of these issues:
1. Scripts not loading (most likely)
2. Blob URL generation failing
3. State management race conditions
4. Iframe rendering issues

**Immediate Action:** Check browser console and Network tab to identify the exact failure point.
