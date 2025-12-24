# Root Cause Analysis: Puppeteer OG Image Generation Issues

**Date:** December 24, 2024  
**Issue:** OG image preview not working properly - either test-og page or Puppeteer generation failing  
**Status:** INVESTIGATING

---

## Problem Statement

The Puppeteer-based OG image generation is not working properly. The preview either:
1. Doesn't render at all
2. Shows blank/placeholder image
3. Times out waiting for `__OG_READY__` flag
4. Can't find the canvas iframe

---

## Potential Root Causes

### 🔴 CRITICAL ISSUE #1: __OG_READY__ Flag Timing

**Problem:** The `__OG_READY__` flag is set AFTER `draw()` completes AND `noLoopCalled` is true. However:

1. **Script Execution Order:**
   ```
   rug-p5.js executes → sets up window.createCanvas, window.noLoop
   Variables set (w, h, p, sd, tr, s, cm, tl, dl, fl)
   rug-algo.js executes → defines window.setup() and window.draw()
   rug-frame.js executes (if needed)
   ogReadyScript executes → tries to override window.draw()
   ```

2. **Race Condition:**
   - `ogReadyScript` runs AFTER `rug-algo.js` defines `draw()`
   - But `rug-p5.js`'s `addEventListener('load')` might fire BEFORE `ogReadyScript` runs
   - The original `draw()` might be called before our override is in place

3. **Flag Check Logic:**
   ```javascript
   if (!drawCalled && window.noLoopCalled) {
     drawCalled = true;
     window.__OG_READY__ = true;
   }
   ```
   - Requires BOTH `draw()` to be called AND `noLoopCalled` to be true
   - If `noLoop()` is called in `setup()`, but `draw()` hasn't been called yet, flag won't set
   - If `draw()` is called but `noLoopCalled` isn't true yet, flag won't set

**Evidence:**
- Puppeteer waits for `__OG_READY__` but times out
- Console shows "flag not detected within timeout"

---

### 🔴 CRITICAL ISSUE #2: Iframe Blob URL Access

**Problem:** Puppeteer tries to access canvas inside an iframe with blob URL:

1. **Blob URL Creation:**
   - `NFTDisplay` creates HTML blob → `URL.createObjectURL(blob)` → blob:http://...
   - This blob URL is only valid in the browser context that created it
   - Puppeteer's page context might not have access to the blob URL

2. **Cross-Context Access:**
   - Main page context creates blob URL
   - Iframe loads blob URL (same origin, but different context)
   - Puppeteer tries to access iframe content
   - Blob URL might not resolve correctly in Puppeteer's context

3. **Selector Timing:**
   ```javascript
   const canvasSelector = 'iframe[src^="blob:"]'
   await page.waitForSelector(canvasSelector, { timeout: 5000 })
   ```
   - Iframe might not be in DOM yet
   - Blob URL might not be loaded yet
   - Canvas inside iframe might not be rendered yet

**Evidence:**
- Error: "Canvas iframe not found"
- Error: "Could not access iframe content"

---

### 🔴 CRITICAL ISSUE #3: Page Rendering in OG Mode

**Problem:** The rug-market page might not be rendering correctly in OG mode:

1. **NFT Selection:**
   ```javascript
   {isOGMode && tokenIdFromUrl && selectedNFT && (
     <NFTDisplay renderMode="og" ... />
   )}
   ```
   - `selectedNFT` might be null if NFT hasn't loaded yet
   - `fetchNFTById` is async, Puppeteer might navigate before NFT loads
   - Page shows nothing if `selectedNFT` is null

2. **Loading State:**
   - Page might be in loading state when Puppeteer screenshots
   - NFT data might not be fetched yet
   - Canvas might not be rendered yet

3. **React Hydration:**
   - Puppeteer navigates to page
   - React hydrates client-side
   - NFTDisplay component mounts
   - Scripts load asynchronously
   - Canvas renders in iframe
   - All of this takes time, but Puppeteer might screenshot too early

**Evidence:**
- Blank page in Puppeteer
- No NFTDisplay component visible
- `selectedNFT` is null

---

### 🔴 CRITICAL ISSUE #4: Base URL Configuration

**Problem:** Puppeteer navigates to production URL, but might need local URL:

```javascript
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.onchainrugs.xyz'
const pageUrl = `${baseUrl}/rug-market?tokenId=${tokenId}&renderMode=og`
```

1. **Local Development:**
   - `NEXT_PUBLIC_BASE_URL` might not be set
   - Falls back to production URL
   - Puppeteer tries to navigate to production, but dev server is local
   - Production might not have latest code

2. **Vercel Deployment:**
   - In Vercel, `NEXT_PUBLIC_BASE_URL` should be set
   - But Puppeteer might try to navigate to external URL
   - This adds network latency
   - Should navigate to `localhost` or same origin

**Evidence:**
- Puppeteer navigates to wrong URL
- Network errors in Puppeteer console
- Timeout waiting for page load

---

### 🔴 CRITICAL ISSUE #5: Puppeteer Browser Launch

**Problem:** Puppeteer might fail to launch or have configuration issues:

1. **Missing Chromium:**
   - Puppeteer needs Chromium binary
   - Might not be installed correctly
   - Vercel Hobby plan might not support Puppeteer

2. **Sandbox Issues:**
   - `--no-sandbox` flag might not be enough
   - Vercel serverless functions have restrictions
   - Puppeteer might not work in serverless environment

3. **Memory/Timeout:**
   - Puppeteer uses significant memory
   - Vercel functions have memory limits
   - 10s timeout might not be enough for first launch

**Evidence:**
- Error: "Failed to launch browser"
- Error: "Browser closed unexpectedly"
- Timeout errors

---

## Recommended Solutions (Priority Order)

### Solution 1: Fix __OG_READY__ Flag Logic (HIGH PRIORITY)

**Change:** Set flag more reliably by checking canvas state instead of relying on `noLoopCalled`:

```javascript
const ogReadyScript = isOGMode ? `
<script>
  (function() {
    let checkCount = 0;
    const maxChecks = 50; // 5 seconds max
    
    function checkReady() {
      checkCount++;
      
      // Check if canvas exists and has content
      const canvas = document.getElementById('defaultCanvas0');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Check if canvas has been drawn to (not just blank)
          const imageData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
          const hasContent = imageData.data.some((pixel, index) => {
            if (index % 4 === 0) {
              return pixel !== 222; // Not default background color
            }
            return false;
          });
          
          if (hasContent && window.noLoopCalled) {
            window.__OG_READY__ = true;
            return;
          }
        }
      }
      
      if (checkCount < maxChecks) {
        setTimeout(checkReady, 100);
      } else {
        // Timeout - set flag anyway
        window.__OG_READY__ = true;
      }
    }
    
    // Start checking after scripts load
    window.addEventListener('load', function() {
      setTimeout(checkReady, 500);
    });
  })();
</script>` : ''
```

**Why:** More reliable - checks actual canvas content instead of relying on function call timing.

---

### Solution 2: Use Direct Canvas Access Instead of Iframe (HIGH PRIORITY)

**Change:** Instead of accessing canvas through iframe, render canvas directly in OG mode:

1. **Option A:** Create a dedicated OG route that renders canvas directly (no iframe)
2. **Option B:** Use `page.evaluate()` to access canvas from iframe content window
3. **Option C:** Screenshot the entire page and crop to canvas area

**Why:** Iframe blob URLs are unreliable in Puppeteer context.

---

### Solution 3: Fix Base URL for Local Development (MEDIUM PRIORITY)

**Change:** Detect environment and use appropriate URL:

```javascript
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
```

**Why:** Ensures Puppeteer navigates to correct URL in all environments.

---

### Solution 4: Add Better Error Handling and Logging (MEDIUM PRIORITY)

**Change:** Add detailed logging at each step:

```javascript
console.log('[OG] Step 1: Launching browser...')
console.log('[OG] Step 2: Navigating to:', pageUrl)
console.log('[OG] Step 3: Waiting for page load...')
console.log('[OG] Step 4: Checking for __OG_READY__ flag...')
console.log('[OG] Step 5: Looking for canvas iframe...')
console.log('[OG] Step 6: Accessing iframe content...')
console.log('[OG] Step 7: Finding canvas element...')
console.log('[OG] Step 8: Taking screenshot...')
```

**Why:** Helps identify exactly where the process fails.

---

### Solution 5: Consider Alternative Approach (LOW PRIORITY)

**Change:** Instead of Puppeteer, use a simpler approach:

1. **Option A:** Pre-render OG images on mint (store in Redis/CDN)
2. **Option B:** Use Vercel OG Image Generation (if available)
3. **Option C:** Use a dedicated rendering service (separate from main app)

**Why:** Puppeteer might be overkill and unreliable in serverless environment.

---

## Immediate Action Items

1. ✅ **Add detailed logging** to identify failure point
2. ✅ **Fix __OG_READY__ flag logic** to be more reliable
3. ✅ **Test locally** with `http://localhost:3002` instead of production URL
4. ✅ **Add fallback** if Puppeteer fails (return placeholder)
5. ✅ **Verify Puppeteer works** in Vercel environment

---

## Testing Checklist

- [ ] Test locally: `/test-og?tokenId=1`
- [ ] Check browser console for errors
- [ ] Check server logs for Puppeteer errors
- [ ] Verify `__OG_READY__` flag is set
- [ ] Verify iframe is found
- [ ] Verify canvas is accessible
- [ ] Verify screenshot is taken
- [ ] Test on Vercel deployment
- [ ] Test with different tokenIds
- [ ] Test timeout scenarios

---

## Expected Behavior

1. Puppeteer launches successfully
2. Navigates to rug-market page with renderMode=og
3. Page loads and React hydrates
4. NFT data is fetched
5. NFTDisplay component renders with renderMode=og
6. HTML blob is created and loaded in iframe
7. Scripts execute and canvas is drawn
8. `__OG_READY__` flag is set
9. Puppeteer detects flag
10. Puppeteer finds iframe
11. Puppeteer accesses canvas from iframe
12. Screenshot is taken
13. Image is composited onto OG canvas
14. PNG buffer is returned

**Current State:** Failing somewhere in steps 3-12.

