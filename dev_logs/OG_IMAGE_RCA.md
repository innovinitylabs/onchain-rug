# Root Cause Analysis: OG Image Generation Failure

**Date:** December 24, 2024  
**Issue:** OG images show placeholder text ("OnchainRug #8") instead of rendered rug artwork  
**Status:** CRITICAL - OG images not rendering correctly

---

## Executive Summary

The OG image generation endpoint (`/api/og/rug`) is failing to render rug artwork, falling back to a placeholder image. While the Rug Market preview pipeline works perfectly in the browser, the server-side VM execution environment is not properly executing the rug rendering scripts.

---

## Pipeline Comparison Analysis

### ✅ WORKING: Rug Market Preview Pipeline

**Location:** `components/NFTDisplay.tsx` → `RugGenerator.generateHTMLPreview()`

**Execution Flow:**
1. **Input:** NFT metadata from Redis (same as OG)
2. **HTML Generation:** Creates HTML string with:
   ```html
   <head>
     <script>rug-p5.js</script>  <!-- Custom p5 implementation -->
   </head>
   <body>
     <div id="rug"></div>
     <script>
       let w=800, h=1200, p={...}, sd=[...], tr=[...], s=..., cm={...}, tl=0, dl=0, fl="None";
     </script>
     <script>rug-algo.js</script>  <!-- Defines setup() and draw() -->
     <script>rug-frame.js</script>  <!-- Optional frame rendering -->
   </body>
   ```
3. **Blob URL Creation:** HTML → Blob → Blob URL
4. **Iframe Loading:** Blob URL loaded in `<iframe>` element
5. **Browser Execution:** 
   - Real browser environment
   - Real DOM APIs (`document.createElement`, `document.body.appendChild`)
   - Real Canvas API (`HTMLCanvasElement.getContext('2d')`)
   - Real `window.addEventListener('load')` event
6. **Script Execution:**
   - `rug-p5.js` executes → Sets up `window.createCanvas`, `window.fill`, `window.rect`, etc.
   - Variables are set in global scope
   - `rug-algo.js` executes → Defines `window.setup()` and `window.draw()`
   - `rug-frame.js` executes (if needed)
   - Browser fires `load` event → Calls `setup()` → Calls `draw()`
7. **Rendering:** Canvas is drawn to in the iframe
8. **Result:** ✅ Perfect rug preview displayed

**Key Success Factors:**
- ✅ Real browser environment with full DOM/Canvas APIs
- ✅ Scripts execute in natural order
- ✅ `window.addEventListener('load')` fires automatically
- ✅ Canvas operations work with real browser Canvas API
- ✅ All global variables accessible to scripts
- ✅ `Object.defineProperty` works on real `window` object

---

### ❌ FAILING: OG Image Generation Pipeline

**Location:** `lib/rug-renderer/render-rug.ts` → `app/api/og/rug/route.ts`

**Execution Flow:**
1. **Input:** NFT metadata from Redis ✅ (SAME as Rug Market)
2. **VM Sandbox Creation:** Creates Node.js VM context with mock APIs
3. **Script Execution:**
   - Loads `rug-p5.js`, `rug-algo.js`, `rug-frame.js` ✅
   - Executes scripts in VM context using `runInContext()`
4. **Manual Function Calls:**
   - Calls `setup()` manually
   - Calls `draw()` manually
5. **Canvas Extraction:** Returns `sandbox._p5.canvas`
6. **Result:** ❌ Blank/placeholder image

**Key Failure Points:**

#### 🔴 CRITICAL ISSUE #1: Canvas Creation Mismatch

**Problem:** `rug-p5.js`'s `createCanvas()` function does this:
```javascript
function createCanvas(e,t){
  const l=document.createElement("canvas");  // Creates NEW canvas
  _p5.canvas=l;                              // Assigns to _p5
  _p5.ctx=l.getContext("2d");               // Gets context
  document.body.appendChild(l);              // Appends to DOM
  return {elt:l, parent:function(e){...}};
}
```

**In Browser (WORKING):**
- `document.createElement("canvas")` → Returns real `HTMLCanvasElement`
- `getContext("2d")` → Returns real `CanvasRenderingContext2D`
- Canvas operations work perfectly

**In VM Sandbox (FAILING):**
- `document.createElement("canvas")` → Returns our pre-created node-canvas
- BUT: `rug-p5.js` creates its OWN canvas reference
- The script's `_p5.canvas` might not match our `canvasRef.canvas`
- When `setup()` calls `createCanvas()`, it creates a NEW canvas via `document.createElement`
- Our sandbox returns the same canvas, but `_p5` state might be inconsistent

#### 🔴 CRITICAL ISSUE #2: Object.defineProperty Not Working

**Problem:** `rug-p5.js` does this:
```javascript
Object.defineProperty(window,"width",{get:()=>_p5.width})
Object.defineProperty(window,"height",{get:()=>_p5.height})
```

**In Browser (WORKING):**
- `window` is a real object
- `Object.defineProperty` works on real `window`
- `window.width` and `window.height` return `_p5.width` and `_p5.height`

**In VM Sandbox (FAILING):**
- `sandbox.window` is a plain object
- `Object.defineProperty` might not work correctly on sandbox objects
- When `rug-algo.js`'s `draw()` function accesses `width` and `height`, it might get `0` instead of actual canvas dimensions
- This causes rendering to fail or render at wrong size

#### 🔴 CRITICAL ISSUE #3: Canvas Context Transform Not Applied

**Problem:** `rug-p5.js` does this:
```javascript
_p5.ctx.setTransform(1,0,0,1,0,0)
_p5.ctx.scale(r,r)  // r = pixelDensity
```

**In Browser (WORKING):**
- Transform is applied to real Canvas context
- All drawing operations respect the transform

**In VM Sandbox (FAILING):**
- Transform might not be applied correctly to node-canvas context
- Or transform is applied but then reset
- Drawing operations might be at wrong scale or position

#### 🔴 CRITICAL ISSUE #4: Global Variable Access

**Problem:** `rug-algo.js` accesses global variables:
```javascript
function setup(){
  const R=h+4*f;  // Accesses h, f from global scope
  const F=w+4*f;  // Accesses w, f from global scope
  createCanvas(R+2*55,F+2*55).parent("rug");
  // ...
}
```

**In Browser (WORKING):**
- Variables `w`, `h`, `f`, `p`, `sd`, `tr`, `s`, `cm`, `tl`, `dl`, `fl` are in global scope
- Scripts can access them directly

**In VM Sandbox (FAILING):**
- Variables are in `sandbox` object
- Scripts execute in VM context, so they SHOULD access sandbox variables
- BUT: If scripts use `let` or `const`, they create LOCAL variables
- The HTML preview uses `let w=800, h=1200, ...` which creates globals
- Our VM sandbox has them as properties: `sandbox.w`, `sandbox.h`
- Scripts might not be accessing them correctly

#### 🔴 CRITICAL ISSUE #5: Load Event Timing

**Problem:** `rug-p5.js` sets up:
```javascript
window.addEventListener("load",()=>{
  if("function"==typeof window.setup) window.setup()
  if("function"==typeof window.draw) window.draw()
})
```

**In Browser (WORKING):**
- Browser fires `load` event after all scripts execute
- `setup()` and `draw()` are called automatically

**In VM Sandbox (FAILING):**
- We call `setup()` and `draw()` manually
- BUT: The `addEventListener('load')` callback might execute BEFORE `rug-algo.js` defines `setup()` and `draw()`
- Or the callback might not execute at all
- We're calling functions manually, but timing might be wrong

#### 🔴 CRITICAL ISSUE #6: Canvas Reference Mismatch

**Problem:** Multiple canvas references:
- `canvasRef.canvas` (our pre-created canvas)
- `sandbox._p5.canvas` (canvas created by script)
- `document.createElement("canvas")` return value

**In Browser (WORKING):**
- All references point to the SAME canvas object
- `_p5.canvas` === canvas from `createElement`

**In VM Sandbox (FAILING):**
- `canvasRef.canvas` might not be the same object as `sandbox._p5.canvas`
- When we return `sandbox._p5.canvas`, it might be a different canvas than what was drawn to
- Or the canvas we return is blank because drawing happened on a different canvas

---

## Root Cause Identification

### PRIMARY ROOT CAUSE: VM Sandbox Environment Mismatch

The Node.js VM sandbox cannot perfectly replicate the browser environment. Key mismatches:

1. **Canvas Object Identity:** Browser creates real `HTMLCanvasElement`, VM uses `node-canvas` instance. These are different object types with different behaviors.

2. **Object.defineProperty on Sandbox Objects:** VM sandbox objects might not support property descriptors correctly, causing `window.width` and `window.height` getters to fail.

3. **Global Variable Scope:** Browser scripts use true global scope, VM scripts use sandbox scope. Variable access patterns differ.

4. **Canvas Context Behavior:** Browser `CanvasRenderingContext2D` vs node-canvas `CanvasRenderingContext2D` might have subtle differences in transform handling, drawing operations, or state management.

### SECONDARY ROOT CAUSE: Script Execution Order

The manual calling of `setup()` and `draw()` might happen before:
- All scripts have fully executed
- Global state is properly initialized
- Canvas is properly set up in `_p5` object

---

## Evidence Analysis

### What Works:
- ✅ Metadata fetching from Redis
- ✅ Script loading (`rug-p5.js`, `rug-algo.js`, `rug-frame.js`)
- ✅ Script execution (no syntax errors)
- ✅ Canvas creation (canvas object exists)
- ✅ Function definitions (`setup()` and `draw()` exist)

### What Fails:
- ❌ Canvas drawing operations (no pixels rendered)
- ❌ `_p5.ctx` operations (fill, rect, etc. don't draw)
- ❌ Global variable access (might be returning undefined/0)
- ❌ Canvas reference consistency (wrong canvas returned)

### Current Behavior:
- OG endpoint returns placeholder image (fallback)
- Canvas exists but is blank
- No errors thrown (silent failure)
- Logs show scripts execute but canvas is empty

---

## Impact Assessment

**Severity:** HIGH  
**User Impact:** 
- Twitter/X previews show placeholder instead of rug artwork
- Social sharing doesn't display correct NFT previews
- SEO/OG image previews are broken

**Technical Impact:**
- OG image generation fails silently
- Falls back to placeholder image
- No visual indication of failure to end users

---

## Recommended Solutions (Priority Order)

### Option 1: Use Puppeteer/Headless Browser (RECOMMENDED)
**Approach:** Execute the HTML preview in a real headless browser
- Generate the same HTML as `generateHTMLPreview()`
- Load it in Puppeteer
- Wait for canvas to render
- Screenshot the canvas
- Return PNG

**Pros:**
- ✅ Uses EXACT same pipeline as Rug Market
- ✅ Real browser environment
- ✅ Guaranteed to work

**Cons:**
- ❌ Requires Puppeteer dependency
- ❌ Slower execution (~2-3 seconds)
- ❌ Higher memory usage
- ❌ Might not work on Vercel Hobby plan

### Option 2: Fix VM Sandbox (CURRENT ATTEMPT)
**Approach:** Improve sandbox to better mimic browser
- Ensure `Object.defineProperty` works on sandbox.window
- Fix canvas reference consistency
- Fix global variable access
- Ensure transforms are applied correctly

**Pros:**
- ✅ No new dependencies
- ✅ Faster execution
- ✅ Works on Vercel Hobby

**Cons:**
- ❌ Complex to debug
- ❌ Might never perfectly match browser
- ❌ Ongoing maintenance burden

### Option 3: Pre-render and Cache (NOT VIABLE)
**Approach:** Generate images on mint and store them
- ❌ Violates "NO image storage" constraint
- ❌ Not dynamic (can't show dirt/aging changes)

---

## Detailed Technical Analysis

### Canvas Creation Flow Comparison

**Browser Flow:**
```
1. rug-p5.js executes
2. window.createCanvas = createCanvas (function defined)
3. rug-algo.js executes
4. setup() calls createCanvas(R+2*55, F+2*55)
5. createCanvas() calls document.createElement("canvas")
6. Browser returns HTMLCanvasElement
7. _p5.canvas = HTMLCanvasElement
8. _p5.ctx = HTMLCanvasElement.getContext("2d")
9. Drawing operations use _p5.ctx
10. Canvas is rendered
```

**VM Sandbox Flow:**
```
1. rug-p5.js executes in VM
2. window.createCanvas = createCanvas (function defined in sandbox)
3. rug-algo.js executes in VM
4. setup() calls createCanvas(R+2*55, F+2*55)
5. createCanvas() calls document.createElement("canvas")
6. Sandbox returns node-canvas instance
7. _p5.canvas = node-canvas instance
8. _p5.ctx = node-canvas.getContext("2d")
9. Drawing operations use _p5.ctx
10. ❌ Canvas is blank (drawing didn't work)
```

### Why Drawing Fails

**Hypothesis 1: Context Not Properly Initialized**
- `_p5.ctx` might be null or undefined
- Canvas operations fail silently
- No error thrown, just no pixels drawn

**Hypothesis 2: Transform State Lost**
- `setTransform()` and `scale()` are called
- But transform state is lost before drawing
- Drawing happens at wrong position/scale

**Hypothesis 3: Wrong Canvas Reference**
- Drawing happens on `sandbox._p5.canvas`
- But we return `canvasRef.canvas`
- These are different objects
- The drawn canvas is discarded

**Hypothesis 4: Global Variables Undefined**
- `w`, `h`, `f`, etc. are not accessible in script scope
- `setup()` calculates wrong dimensions
- Canvas created with wrong size
- Drawing happens off-canvas or at wrong scale

**Hypothesis 5: Script Execution Context**
- Scripts execute in VM but can't access sandbox properties correctly
- `this` context is wrong
- Global scope is isolated
- Variables defined in sandbox aren't accessible to scripts

---

## Verification Steps Needed

To confirm root cause, check server logs for:

1. **Canvas Dimensions:**
   - What size is `sandbox._p5.canvas` after `setup()`?
   - Does it match expected `(h+4*f+2*55) x (w+4*f+2*55)`?

2. **Context Validity:**
   - Is `sandbox._p5.ctx` non-null after `setup()`?
   - Can we call `sandbox._p5.ctx.fillRect()` manually?

3. **Global Variables:**
   - Are `sandbox.w`, `sandbox.h`, `sandbox.p` accessible in scripts?
   - Do they have correct values when `setup()` executes?

4. **Drawing Operations:**
   - Are `fill()`, `rect()`, `ellipse()` functions being called?
   - Do they execute without errors?
   - Do they modify the canvas?

5. **Canvas Content:**
   - After `draw()` completes, does `sandbox._p5.canvas` have pixels?
   - Is `sandbox._p5.canvas` the same object as `canvasRef.canvas`?

---

## Conclusion

The OG image generation fails because the Node.js VM sandbox cannot perfectly replicate the browser environment. The scripts execute, but canvas drawing operations fail silently, likely due to:

1. Canvas/context reference mismatches
2. Global variable access issues
3. Transform/state management problems
4. Object property descriptor limitations

**Recommended Next Step:** Implement Option 1 (Puppeteer) for guaranteed compatibility, or continue debugging Option 2 (VM Sandbox) with extensive logging to identify the exact failure point.

---

## Appendix: Key Code Locations

- **Working Pipeline:** `components/NFTDisplay.tsx:169-292` (generateHTMLPreview)
- **Failing Pipeline:** `lib/rug-renderer/render-rug.ts:199-537` (renderRug)
- **OG Endpoint:** `app/api/og/rug/route.ts:88-230` (GET handler)
- **Scripts:** `public/data/rug-p5.js`, `public/data/rug-algo.js`, `public/data/rug-frame.js`

