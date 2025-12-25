# Root Cause Analysis: Preview Still Not Working - Final Investigation

**Date:** December 24, 2024  
**Issue:** Rug market previews still not rendering after multiple fixes  
**Status:** CRITICAL - Preview generation completely broken

---

## File Responsible for Preview Creation

### PRIMARY FILE: `components/NFTDisplay.tsx`

**This is the AUTHORITATIVE file responsible for creating all rug previews.**

**Key Components:**

1. **`RugGenerator` class** (lines 118-403)
   - Loads scripts: `rug-p5.js`, `rug-algo.js`, `rug-frame.js`
   - Generates HTML preview: `generateHTMLPreview()`
   - Creates blob URL: `generatePreview()`

2. **`NFTDisplay` component** (lines 405-654)
   - Manages preview state
   - Calls `RugGenerator.generatePreview()`
   - Renders iframe with blob URL

**Supporting Files:**
- `components/RugMarketGrid.tsx` - Uses NFTDisplay component (line 116)
- `utils/rug-market-data-adapter.ts` - Converts RugMarketNFT to NFTData format (line 69)
- `public/data/rug-p5.js` - Custom p5.js implementation
- `public/data/rug-algo.js` - Rug drawing algorithm
- `public/data/rug-frame.js` - Frame rendering logic

---

## Complete Preview Generation Flow

### Step-by-Step Execution Path

```
1. RugMarketGrid renders RugCard
   ↓
2. RugCard calls rugMarketNFTToNFTData(nft) (line 61)
   ↓
3. RugCard renders <NFTDisplay nftData={nftData} renderMode="interactive" /> (line 116)
   ↓
4. NFTDisplay component mounts (line 405)
   ↓
5. RugGenerator instance created (useMemo, line 428)
   ↓
6. RugGenerator constructor calls loadScripts() (line 128)
   ↓
7. loadScripts() fetches sequentially:
   - /data/rug-p5.js (line 146)
   - /data/rug-algo.js (line 151)
   - /data/rug-frame.js (line 156)
   ↓
8. Scripts loaded → onScriptsLoaded() callback → setScriptsLoaded(true) (line 163)
   ↓
9. useEffect triggers (line 493) when scriptsLoaded = true
   ↓
10. Calls rugGenerator.generatePreview(nftData.traits, tokenId, renderMode) (line 512)
    ↓
11. generatePreview() calls generateHTMLPreview() (line 393)
    ↓
12. generateHTMLPreview() creates HTML string with embedded scripts (line 282-320)
    ↓
13. Creates Blob from HTML (line 394)
    ↓
14. Creates blob: URL (line 395)
    ↓
15. Returns blob URL (line 396)
    ↓
16. Sets previewImage state = blob URL (line 521)
    ↓
17. Component re-renders
    ↓
18. Renders <iframe src={blobUrl}> (line 596)
    ↓
19. Browser loads blob URL
    ↓
20. Scripts execute in iframe
    ↓
21. Canvas is drawn
    ↓
22. Preview displays ✅
```

---

## Critical Issues Identified

### 🔴 CRITICAL ISSUE #1: Script Loading Still Sequential (NOT Using Promise.all)

**Location:** `components/NFTDisplay.tsx:136-168`

**Problem:** The `loadScripts()` method uses OLD sequential fetching code, NOT the parallel `Promise.all()` version.

**Current Code:**
```typescript
const p5Response = await fetch(p5Url)
if (!p5Response.ok) throw new Error(`rug-p5.js fetch failed: ${p5Response.status}`)
this.rugP5Script = await p5Response.text()
console.log('Loaded custom rug-p5.js, length:', this.rugP5Script.length)

const algoResponse = await fetch(algoUrl)
if (!algoResponse.ok) throw new Error(`rug-algo.js fetch failed: ${algoResponse.status}`)
this.rugAlgoScript = await algoResponse.text()
// ... sequential
```

**Expected Code (from our fixes):**
```typescript
const [p5Response, algoResponse, frameResponse] = await Promise.all([
  fetch(p5Url),
  fetch(algoUrl),
  fetch(frameUrl)
])
```

**Impact:** 
- Scripts load sequentially (slower)
- If first script fails, others don't load
- Less robust error handling
- No validation that scripts are not empty

**Evidence:** Line 146-159 shows sequential `await fetch()` calls

---

### 🔴 CRITICAL ISSUE #2: generatePreview Missing Validation

**Location:** `components/NFTDisplay.tsx:390-401`

**Problem:** The `generatePreview()` method doesn't validate scripts are loaded or check for empty content.

**Current Code:**
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
    return ''
  }
}
```

**Missing:**
- ❌ No check for `this.scriptsLoaded`
- ❌ No validation that `this.rugP5Script`, `this.rugAlgoScript`, `this.rugFrameScript` are not empty
- ❌ No validation that `htmlContent` is not empty
- ❌ No logging of blob URL creation

**Impact:** 
- Preview generation might fail silently
- Empty blob URLs might be created
- No way to debug why generation fails

**Evidence:** Lines 390-401 show no validation checks

---

### 🔴 CRITICAL ISSUE #3: Iframe Rendering Missing Error Handlers

**Location:** `components/NFTDisplay.tsx:593-633`

**Problem:** The iframe rendering code doesn't have error handlers or min-height.

**Current Code:**
```typescript
{isGenerating ? null : previewImage ? (
  previewImage.startsWith('blob:') || previewImage.startsWith('data:') ? (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
    <iframe
      src={previewImage}
      className="border-0 pointer-events-none"
      title={`NFT ${nftData.tokenId}`}
      sandbox="allow-scripts"
      scrolling="no"
      style={{ 
        width: '100%', 
        height: '100%', 
        // ❌ No minHeight
        // ❌ No onLoad handler
        // ❌ No onError handler
      }}
    />
```

**Missing:**
- ❌ No `onLoad` handler to detect when iframe loads
- ❌ No `onError` handler to catch load failures
- ❌ No `minHeight: '200px'` to prevent 0x0 iframe
- ❌ No loading state display

**Impact:**
- Iframe might render as 0x0 (invisible)
- Load errors go undetected
- No way to debug iframe issues

**Evidence:** Lines 596-612 show basic iframe without handlers

---

### 🔴 CRITICAL ISSUE #4: State Management - previewImage Check Logic

**Location:** `components/NFTDisplay.tsx:495`

**Problem:** The check for existing preview might be too strict.

**Current Code:**
```typescript
if (traitsKey && traitsKey === lastTraitsKey && previewImage) {
  return  // Skip generation
}
```

**Issues:**
- If `previewImage` is empty string `''`, this check passes (empty string is falsy)
- But if `previewImage` is `'/rug-loading-mid.webp'` (placeholder), it also skips
- Should check `previewImage.length > 0 && previewImage.startsWith('blob:')`

**Impact:**
- Might skip generation when it should regenerate
- Placeholder images might prevent regeneration

**Evidence:** Line 495 shows simple truthiness check

---

### 🔴 CRITICAL ISSUE #5: Empty String Handling in generatePreview

**Location:** `components/NFTDisplay.tsx:512-521`

**Problem:** If `generatePreview()` returns empty string, it's still set as `previewImage`.

**Current Code:**
```typescript
const imageData = rugGenerator.generatePreview(nftData.traits, nftData.tokenId, renderMode)

if (imageData.startsWith('blob:')) {
  // Handle blob URL
}
setPreviewImage(imageData)  // ⚠️ Sets empty string if imageData is ''
```

**Issues:**
- If `generatePreview()` returns `''` (empty string), it's set as `previewImage`
- Empty string is falsy, so `previewImage ? ...` check fails
- Component shows "No preview available" instead of placeholder

**Impact:**
- Silent failures show "No preview available" instead of placeholder
- No retry logic if generation fails

**Evidence:** Line 521 sets `previewImage` without checking if `imageData` is empty

---

### 🔴 CRITICAL ISSUE #6: Script Loading Error Not Propagated

**Location:** `components/NFTDisplay.tsx:164-167`

**Problem:** If script loading fails, `scriptsLoaded` stays `false` but component doesn't retry.

**Current Code:**
```typescript
} catch (error) {
  console.error('Failed to load rug generation scripts:', error)
  this.scriptsLoaded = false
  // ❌ No retry logic
  // ❌ Callback not called, so setScriptsLoaded(true) never happens
}
```

**Issues:**
- Script loading failure leaves `scriptsLoaded = false` forever
- Component shows placeholder forever
- No retry mechanism
- No way to recover from script load failure

**Impact:**
- If scripts fail to load once, preview never works
- No recovery mechanism

**Evidence:** Lines 164-167 show error handling but no retry

---

### 🔴 CRITICAL ISSUE #7: Data Conversion - Missing Traits Fields

**Location:** `utils/rug-market-data-adapter.ts:81-104`

**Problem:** The `rugMarketNFTToNFTData()` function might not populate all required fields correctly.

**Analysis:**
```typescript
const traits: RugTraits = {
  seed: permanent.seed,
  minifiedPalette: permanent.minifiedPalette,  // Might be string or object
  minifiedStripeData: permanent.minifiedStripeData,  // Might be string or object
  filteredCharacterMap: permanent.filteredCharacterMap,  // Might be string or object
  // ...
}
```

**Potential Issues:**
1. **`minifiedPalette` might be empty string** → `safeParseJson()` returns default, but might cause issues
2. **`minifiedStripeData` might be empty** → Same issue
3. **`filteredCharacterMap` might be empty string** → Uses local character map, but might fail
4. **`textRows` might be empty array** → Falls back to ["BACKEND", "RUGGED"]

**Impact:**
- Preview generation might fail if required fields are missing
- Fallback values might not work correctly

**Evidence:** `generateHTMLPreview()` uses `safeParseJson()` but might still fail

---

## Most Likely Root Causes (Priority Order)

### 1. **Script Loading Failure** (HIGHEST PROBABILITY)
- Scripts fail to load from `/data/rug-p5.js` etc.
- `scriptsLoaded` never becomes `true`
- Preview stays in loading state showing `/rug-loading-mid.webp`
- **Check:** Browser Network tab for 404 errors

### 2. **generatePreview Returns Empty String** (HIGH PROBABILITY)
- `generatePreview()` fails silently
- Returns empty string `''`
- `previewImage` is set to empty string
- Component shows "No preview available"
- **Check:** Console for "Failed to generate HTML preview" errors

### 3. **Traits Data Missing or Invalid** (MEDIUM PROBABILITY)
- `nftData.traits` is null or missing required fields
- `generateHTMLPreview()` fails or generates invalid HTML
- **Check:** Console for "[Adapter]" logs showing traits data

### 4. **Iframe Not Loading Blob URL** (MEDIUM PROBABILITY)
- Blob URL is created but iframe doesn't load it
- Iframe renders as blank
- **Check:** Iframe's console for errors

### 5. **State Race Condition** (LOW PROBABILITY)
- Multiple useEffects conflict
- State resets before preview can render
- **Check:** React DevTools for state values

---

## Diagnostic Steps

### Step 1: Check Browser Console
Look for:
- `[RugGenerator] Loading rug generation scripts...`
- `[RugGenerator] Loaded scripts successfully`
- `[NFTDisplay] Scripts loaded callback fired`
- `[NFTDisplay] Generating preview for tokenId: X`
- `[NFTDisplay] Preview generated successfully`
- Any errors

### Step 2: Check Network Tab
Verify these requests succeed:
- `GET /data/rug-p5.js` → Status 200
- `GET /data/rug-algo.js` → Status 200
- `GET /data/rug-frame.js` → Status 200

### Step 3: Check React DevTools
Verify state values:
- `scriptsLoaded` → Should be `true`
- `previewImage` → Should be `"blob:http://..."`
- `isGenerating` → Should be `false`
- `nftData.traits` → Should be populated object

### Step 4: Check Iframe Console
- Right-click iframe → Inspect
- Check iframe's console for errors
- Verify canvas element exists: `document.getElementById('defaultCanvas0')`

### Step 5: Check Traits Data
Look for:
- `[Adapter] Token X: dirtLevel=Y, agingLevel=Z`
- Verify traits object has all required fields

---

## Expected vs Actual Behavior

### Expected:
1. Scripts load → `scriptsLoaded = true`
2. Preview generates → `previewImage = "blob:http://..."`
3. Iframe loads → Canvas renders → Preview displays ✅

### Actual (Suspected):
1. Scripts might not load → `scriptsLoaded = false` → Shows placeholder
2. OR: Scripts load but preview generation fails → `previewImage = ""` → Shows "No preview available"
3. OR: Preview generates but iframe doesn't render → Blank iframe

---

## File Responsibility Map

### Preview Creation Pipeline:

```
RugMarketGrid.tsx (line 116)
  ↓ uses
NFTDisplay.tsx (line 405)
  ↓ uses
RugGenerator class (line 118)
  ↓ loads
public/data/rug-p5.js
public/data/rug-algo.js
public/data/rug-frame.js
  ↓ generates
HTML blob → blob URL → iframe → canvas
```

### Data Flow:

```
RugMarketNFT (from API)
  ↓ converted by
rugMarketNFTToNFTData() (utils/rug-market-data-adapter.ts:69)
  ↓ creates
NFTData with traits
  ↓ passed to
NFTDisplay component
  ↓ uses
RugGenerator.generatePreview()
  ↓ creates
Blob URL
  ↓ renders
Iframe
```

---

## Conclusion

The preview doesn't work due to multiple issues:

1. **Script loading** - Sequential fetching, no validation, no retry
2. **Preview generation** - No validation, silent failures
3. **Iframe rendering** - No error handlers, no min-height
4. **State management** - Empty string handling issues
5. **Data conversion** - Potential missing fields

**PRIMARY FILE:** `components/NFTDisplay.tsx` (lines 118-654)

**Most Likely Issue:** Scripts not loading OR `generatePreview()` returning empty string

**Next Step:** Check browser console and Network tab to identify exact failure point.
