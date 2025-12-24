# Dynamic Open Graph Image Generation Implementation

## Overview

This document describes the implementation of dynamic, server-side Open Graph (OG) image generation for rug NFTs. The system generates OG images on-demand without storing any images, using the same JavaScript rug-rendering logic as the client-side marketplace.

## Architecture

### Key Principles

1. **NO Image Storage**: Images are generated per request and never stored
2. **NO Base64 in URLs**: Uses proper image endpoints, not data URLs
3. **Server-Side Only**: All rendering happens server-side, no client dependencies
4. **Same Rendering Logic**: Executes the exact same JavaScript scripts as client
5. **OG Mode**: Clean previews without dirt/aging/frames for social sharing

### Components

#### 1. API Route: `/api/og/rug`

**Location**: `app/api/og/rug/route.ts`

**Purpose**: Generates OG images on-demand

**Query Parameters**:
- `tokenId` (required): The NFT token ID
- `chainId` (optional): Chain ID, defaults to 84532 (Base Sepolia)

**Process**:
1. Validates tokenId and chainId
2. Rate limits requests (10 per minute per IP)
3. Fetches NFT metadata from Redis
4. Extracts rendering parameters (palette, stripeData, textRows, etc.)
5. Sets OG mode parameters (dl=0, tl=0, fl='None')
6. Creates Node.js VM context with browser-compatible APIs
7. Executes rug-p5.js and rug-algo.js scripts
8. Renders rug to canvas
9. Returns PNG buffer with proper headers

**Performance**:
- Timeout: 2.5 seconds per script execution
- Total timeout: 3 seconds
- Fallback: Generic OG image if rendering fails

**Headers**:
- `Content-Type: image/png`
- `Cache-Control: public, max-age=86400` (24 hours)
- `X-Generation-Time: {ms}`

#### 2. Shared Renderer Module

**Location**: `lib/rug-renderer/`

**Files**:
- `types.ts`: Type definitions for render modes and parameters
- `node-p5.ts`: Node.js-compatible p5.js utilities
- `core.ts`: Core rendering logic and validation

**Purpose**: Provides shared types and utilities for both client and server rendering

#### 3. OG Meta Tags

**Location**: `app/rug-market/page.tsx`

**Implementation**: Client-side dynamic meta tags using Next.js Head component

**When tokenId is present in URL**:
- Sets `og:image` to `/api/og/rug?tokenId=X&chainId=Y`
- Includes Twitter card meta tags
- Sets proper title, description, and canonical URL

## OG Mode Behavior

When `renderMode = "og"`:

- **Dirt Level (dl)**: Set to 0 - no dirt overlay
- **Texture Level (tl)**: Set to 0 - no aging texture
- **Frame Level (fl)**: Set to 'None' - no frame rendering

This ensures:
- Clean, consistent preview images
- Deterministic rendering (same input = same output)
- Fast generation (skips expensive overlay operations)
- Professional appearance for social sharing

## Why This Approach?

### Problem
- NFTs are HTML-generated, not static images
- Social platforms need static images for previews
- Client-side rendering doesn't work for crawlers
- Storing images would require infrastructure and cost

### Solution
- Generate images server-side on-demand
- Use same JavaScript logic as client (no rewrites)
- Execute scripts in Node.js VM with browser API mocks
- Return PNG buffers directly (never stored)

### Benefits
- Zero storage costs
- Always up-to-date (generated from current NFT state)
- Works with Twitter/X, Warpcast, Lens crawlers
- Same visual identity as marketplace
- No infrastructure changes needed

## Technical Details

### VM Execution

The OG route uses Node.js `vm` module to execute browser JavaScript:

1. Creates sandbox with browser-compatible APIs:
   - `document.createElement()` → returns node-canvas
   - `window` object with p5.js methods
   - Global variables (`_p5`, `w`, `h`, `p`, `sd`, etc.)

2. Executes scripts in order:
   - `rug-p5.js`: Sets up canvas APIs
   - `rug-algo.js`: Defines `setup()` and `draw()` functions

3. Triggers rendering:
   - Calls `window.setup()` and `window.draw()`
   - Canvas is rendered to PNG buffer

### Browser API Mocks

Key mocks provided:

- **Canvas**: node-canvas `createCanvas()` 
- **Document**: Mock DOM APIs
- **Window**: p5.js functions (fill, rect, translate, etc.)
- **Math**: Standard Math functions
- **Noise**: Perlin noise implementation from p5 script

### Error Handling

- Rate limiting: 429 if exceeded
- Timeout: Falls back to generic image
- Invalid tokenId: Returns 400 error
- Rendering failure: Returns fallback image
- All errors logged but don't break page load

## Testing

### Manual Testing

1. Visit: `https://www.onchainrugs.xyz/api/og/rug?tokenId=1`
2. Should return PNG image
3. Check headers for cache-control and generation time

### Social Platform Testing

1. Share URL: `https://www.onchainrugs.xyz/rug-market?tokenId=1`
2. Check preview on:
   - Twitter/X
   - Warpcast
   - Lens Protocol
3. Verify image appears correctly

### Performance Testing

- Monitor generation times (should be < 3s)
- Check rate limiting behavior
- Verify fallback images work

## Future Improvements

1. **Caching**: Could add Redis caching for frequently accessed NFTs
2. **CDN**: Could use Vercel Edge Functions for faster generation
3. **Optimization**: Could optimize script execution for faster rendering
4. **Monitoring**: Add metrics for generation times and success rates

## Notes

- The VM execution approach is complex but necessary to reuse existing scripts
- TypeScript types for VM may need type assertions
- Script execution may need refinement based on actual runtime behavior
- Fallback images ensure graceful degradation

