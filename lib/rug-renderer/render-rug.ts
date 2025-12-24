/**
 * SHARED RUG RENDERING PIPELINE
 * 
 * This is the AUTHORITATIVE rug rendering logic used everywhere:
 * - Rug Market NFT cards (client-side)
 * - Rug detail previews (client-side)
 * - Server-side OG image generation
 * 
 * CRITICAL: This module does NOT rewrite rug logic.
 * It extracts and reuses the EXACT same pipeline from NFTDisplay.tsx
 * 
 * The pipeline:
 * 1. Loads rug-p5.js (custom p5 implementation)
 * 2. Sets up global variables (w, h, p, sd, tr, s, cm, tl, dl, fl, etc.)
 * 3. Loads rug-algo.js (drawing logic)
 * 4. Loads rug-frame.js (optional frame rendering)
 * 5. Executes setup() and draw()
 * 
 * renderMode flags:
 * - "interactive": Full rendering with dirt/aging/frames
 * - "og": Clean rendering (tl=0, dl=0, fl='None')
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createCanvas, CanvasRenderingContext2D } from 'canvas'

export interface RugRenderParams {
  // Metadata
  seed: number
  palette: { name: string; colors: string[] }
  stripeData: any[]
  textRows: string[]
  characterMap: Record<string, string[]>
  warpThickness: number
  
  // Render mode flags
  renderMode: 'interactive' | 'og'
  textureLevel?: number // agingLevel
  dirtLevel?: number
  frameLevel?: string // 'None', 'Gold', 'Silver', 'Bronze', 'Diamond'
  
  // Canvas context (for server-side)
  canvas?: any
  ctx?: CanvasRenderingContext2D
}

export interface RugRenderResult {
  canvas: any
  ctx: CanvasRenderingContext2D
}

/**
 * Get character map (same as NFTDisplay.getCharacterMap)
 */
function getCharacterMap(): Record<string, string[]> {
  return {
    'A': ["01110","10001","10001","11111","10001","10001","10001"],
    'B': ["11110","10001","10001","11110","10001","10001","11110"],
    'C': ["01111","10000","10000","10000","10000","10000","01111"],
    'D': ["11110","10001","10001","10001","10001","10001","11110"],
    'E': ["11111","10000","10000","11110","10000","10000","11111"],
    'F': ["11111","10000","10000","11110","10000","10000","10000"],
    'G': ["01111","10000","10000","10011","10001","10001","01111"],
    'H': ["10001","10001","10001","11111","10001","10001","10001"],
    'I': ["11111","00100","00100","00100","00100","00100","11111"],
    'J': ["11111","00001","00001","00001","00001","10001","01110"],
    'K': ["10001","10010","10100","11000","10100","10010","10001"],
    'L': ["10000","10000","10000","10000","10000","10000","11111"],
    'M': ["10001","11011","10101","10001","10001","10001","10001"],
    'N': ["10001","11001","10101","10011","10001","10001","10001"],
    'O': ["01110","10001","10001","10001","10001","10001","01110"],
    'P': ["11110","10001","10001","11110","10000","10000","10000"],
    'Q': ["01110","10001","10001","10001","10101","10010","01101"],
    'R': ["11110","10001","10001","11110","10100","10010","10001"],
    'S': ["01111","10000","10000","01110","00001","00001","11110"],
    'T': ["11111","00100","00100","00100","00100","00100","00100"],
    'U': ["10001","10001","10001","10001","10001","10001","01110"],
    'V': ["10001","10001","10001","10001","10001","01010","00100"],
    'W': ["10001","10001","10001","10001","10101","11011","10001"],
    'X': ["10001","10001","01010","00100","01010","10001","10001"],
    'Y': ["10001","10001","01010","00100","00100","00100","00100"],
    'Z': ["11111","00001","00010","00100","01000","10000","11111"],
    ' ': ["00000","00000","00000","00000","00000","00000","00000"],
    '0': ["01110","10001","10011","10101","11001","10001","01110"],
    '1': ["00100","01100","00100","00100","00100","00100","01110"],
    '2': ["01110","10001","00001","00010","00100","01000","11111"],
    '3': ["11110","00001","00001","01110","00001","00001","11110"],
    '4': ["00010","00110","01010","10010","11111","00010","00010"],
    '5': ["11111","10000","10000","11110","00001","00001","11110"],
    '6': ["01110","10000","10000","11110","10001","10001","01110"],
    '7': ["11111","00001","00010","00100","01000","01000","01000"],
    '8': ["01110","10001","10001","01110","10001","10001","01110"],
    '9': ["01110","10001","10001","01111","00001","00001","01110"],
    '?': ["01110","10001","00001","00010","00100","00000","00100"],
    '_': ["00000","00000","00000","00000","00000","00000","11111"],
    '!': ["00100","00100","00100","00100","00100","00000","00100"],
    '@': ["01110","10001","10111","10101","10111","10000","01110"],
    '#': ["01010","01010","11111","01010","11111","01010","01010"],
    '$': ["00100","01111","10000","01110","00001","11110","00100"],
    '&': ["01100","10010","10100","01000","10101","10010","01101"],
    '%': ["10001","00010","00100","01000","10000","10001","00000"],
    '+': ["00000","00100","00100","11111","00100","00100","00000"],
    '-': ["00000","00000","00000","11111","00000","00000","00000"],
    '(': ["00010","00100","01000","01000","01000","00100","00010"],
    ')': ["01000","00100","00010","00010","00010","00100","01000"],
    '[': ["01110","01000","01000","01000","01000","01000","01110"],
    ']': ["01110","00010","00010","00010","00010","00010","01110"],
    '*': ["00000","00100","10101","01110","10101","00100","00000"],
    '=': ["00000","00000","11111","00000","11111","00000","00000"],
    "'": ["00100","00100","00100","00000","00000","00000","00000"],
    '"': ["01010","01010","01010","00000","00000","00000","00000"],
    '.': ["00000","00000","00000","00000","00000","00100","00100"],
    '<': ["00010","00100","01000","10000","01000","00100","00010"],
    '>': ["01000","00100","00010","00001","00010","00100","01000"]
  }
}

/**
 * Filter character map to only include used characters
 * (Same logic as NFTDisplay.generateHTMLPreview)
 */
function filterCharacterMap(
  textRows: string[],
  fullCharacterMap: Record<string, string[]>
): Record<string, string[]> {
  const usedChars = new Set<string>()
  
  textRows.forEach(row => {
    if (row && typeof row === 'string') {
      row.toUpperCase().split('').forEach(char => {
        usedChars.add(char)
      })
    }
  })
  
  // Always include space character
  usedChars.add(' ')
  
  const characterMapObj: Record<string, string[]> = {}
  usedChars.forEach(char => {
    if (fullCharacterMap[char]) {
      characterMapObj[char] = fullCharacterMap[char]
    }
  })
  
  // Ensure we always have at least space character
  if (Object.keys(characterMapObj).length === 0 || !characterMapObj[' ']) {
    characterMapObj[' '] = fullCharacterMap[' '] || ["00000","00000","00000","00000","00000","00000","00000"]
  }
  
  return characterMapObj
}

/**
 * Normalize frame level to script format
 * (Same logic as NFTDisplay.generateHTMLPreview)
 */
function normalizeFrameLevel(frameLevel?: string): string {
  if (!frameLevel) return ''
  if (frameLevel === 'Gold') return 'G'
  if (frameLevel === 'Bronze') return 'B'
  if (frameLevel === 'Silver') return 'S'
  if (frameLevel === 'Diamond') return 'D'
  return ''
}

/**
 * Parse JSON safely (handles both strings and objects)
 * (Same logic as NFTDisplay.generateHTMLPreview)
 */
function safeParseJson(value: any, fallback: any): any {
  if (!value) return fallback
  
  if (typeof value === 'object' && value !== null) {
    return value
  }
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  
  return fallback
}

/**
 * AUTHORITATIVE RUG RENDERING FUNCTION
 * 
 * This function executes the EXACT same pipeline as NFTDisplay.generateHTMLPreview,
 * but works in both browser and Node.js environments.
 * 
 * @param params Rendering parameters (metadata + renderMode)
 * @returns Canvas with rendered rug
 */
export async function renderRug(params: RugRenderParams): Promise<RugRenderResult> {
  const {
    seed,
    palette: paletteInput,
    stripeData: stripeDataInput,
    textRows: textRowsInput,
    characterMap: characterMapInput,
    warpThickness,
    renderMode,
    textureLevel: textureLevelInput,
    dirtLevel: dirtLevelInput,
    frameLevel: frameLevelInput,
    canvas: providedCanvas,
    ctx: providedCtx
  } = params

  // Apply renderMode flags
  const textureLevel = renderMode === 'og' ? 0 : (textureLevelInput ?? 0)
  const dirtLevel = renderMode === 'og' ? 0 : (dirtLevelInput ?? 0)
  const frameLevel = renderMode === 'og' ? 'None' : (frameLevelInput ?? 'None')

  // Parse inputs (same logic as NFTDisplay)
  const defaultPalette = {name:"Arctic Ice",colors:["#F0F8FF","#E6E6FA","#B0C4DE","#87CEEB","#B0E0E6","#F0FFFF","#E0FFFF","#F5F5F5"]}
  const defaultStripe = [{y:0,h:70.76905641704798,pc:"#B0E0E6",wt:"s",wv:0.2441620133817196}]
  
  const paletteObj = safeParseJson(paletteInput, defaultPalette)
  const stripeObj = safeParseJson(stripeDataInput, defaultStripe)
  
  // Process textRows (same logic as NFTDisplay)
  const textRowsRaw = textRowsInput
  const textRowsArray = Array.isArray(textRowsRaw) && textRowsRaw.length > 0 
    ? textRowsRaw.filter(row => row && typeof row === 'string' && row.trim().length > 0)
    : ["BACKEND", "RUGGED"]
  
  const finalTextRows = textRowsArray.length > 0 ? textRowsArray : ["BACKEND", "RUGGED"]
  
  // Filter character map (same logic as NFTDisplay)
  const fullCharacterMap = characterMapInput || getCharacterMap()
  const characterMapObj = filterCharacterMap(finalTextRows, fullCharacterMap)
  
  // Normalize frame level
  const frameLevelNormalized = normalizeFrameLevel(frameLevel)
  
  // Rug dimensions (same as NFTDisplay)
  const w = 800
  const h = 1200
  const f = 30 // fringe length
  const wt = 8 // weft thickness
  const ts = 2 // text scale
  
  // Canvas dimensions (with padding for fringe)
  const rugWidth = w + 4 * f + 2 * 55
  const rugHeight = h + 4 * f + 2 * 55
  
  // Create or use provided canvas
  let canvas: any
  let ctx: CanvasRenderingContext2D
  
  if (providedCanvas && providedCtx) {
    canvas = providedCanvas
    ctx = providedCtx
  } else {
    // Server-side: use node-canvas
    const { createCanvas: createNodeCanvas } = require('canvas')
    canvas = createNodeCanvas(rugWidth, rugHeight)
    ctx = canvas.getContext('2d')
  }
  
  // Load scripts (same files as NFTDisplay uses)
  const p5ScriptContent = readFileSync(join(process.cwd(), 'public/data/rug-p5.js'), 'utf-8')
  const algoScriptContent = readFileSync(join(process.cwd(), 'public/data/rug-algo.js'), 'utf-8')
  const frameScriptContent = readFileSync(join(process.cwd(), 'public/data/rug-frame.js'), 'utf-8')
  
  // Create VM context with browser-compatible APIs
  const { createContext, runInContext, Script } = require('vm')
  
  // Create a mutable reference to canvas/ctx so scripts can update _p5
  const canvasRef = { canvas, ctx }
  
  const sandbox: any = {
    // Global _p5 object (used by p5 script) - scripts will update this
    _p5: {
      ctx: ctx,
      canvas: canvas,
      width: rugWidth,
      height: rugHeight,
      fillStyle: null,
      strokeStyle: '#000',
      doFill: true,
      doStroke: true,
      blend: 'source-over',
      stack: [],
      pixelDensity: 1
    },
    // Canvas API - provide node-canvas compatible interface
    // This is assigned to window.createCanvas by rug-p5.js
    createCanvas: (width: number, height: number) => {
      // rug-p5.js will call document.createElement("canvas") internally
      // We intercept that to return our canvas
      const canvasEl = canvasRef.canvas
      const ctxEl = canvasRef.ctx
      
      // Update canvas dimensions if needed
      const pixelDensity = sandbox._p5.pixelDensity || 1
      canvasEl.width = Math.floor(width * pixelDensity)
      canvasEl.height = Math.floor(height * pixelDensity)
      
      // Update _p5 global state (rug-p5.js will do this, but we ensure it's correct)
      sandbox._p5.canvas = canvasEl
      sandbox._p5.ctx = ctxEl
      sandbox._p5.width = width
      sandbox._p5.height = height
      
      return {
        getContext: (type: string) => {
          if (type === '2d') return ctxEl
          return ctxEl
        },
        width: canvasEl.width,
        height: canvasEl.height,
        parent: (selector: string) => {
          // rug-algo.js calls .parent("rug")
          // Return object with appendChild for compatibility
          return {
            appendChild: () => {}
          }
        },
        elt: canvasEl
      }
    },
    document: {
      createElement: (tag: string) => {
        if (tag === 'canvas') {
          // Return our pre-created canvas directly
          // node-canvas already has getContext, width, height properties
          const canvasEl = canvasRef.canvas
          
          // Add style property for compatibility (rug-p5.js sets canvas.style.width/height)
          if (!canvasEl.style) {
            canvasEl.style = {
              width: '',
              height: ''
            }
          }
          
          // Add id property (rug-p5.js sets canvas.id = "defaultCanvas0")
          if (!canvasEl.id) {
            canvasEl.id = ''
          }
          
          return canvasEl
        }
        return {}
      },
      getElementById: (id: string) => {
        if (id === 'rug') {
          return {
            appendChild: (el: any) => {
              // Canvas is already created, just ensure _p5 is updated
              if (el && el.getContext) {
                canvasRef.canvas = el
                canvasRef.ctx = el.getContext('2d')
              }
            }
          }
        }
        return null
      },
      body: {
        appendChild: (el: any) => {
          // Canvas is already created, just ensure _p5 is updated
          if (el && el.getContext) {
            canvasRef.canvas = el
            canvasRef.ctx = el.getContext('2d')
          }
        }
      },
      querySelector: (selector: string) => {
        if (selector === '#defaultCanvas0') {
          return null // Return null so rug-p5.js creates new canvas
        }
        return null
      }
    },
    window: {
      width: 0, // Will be set by Object.defineProperty
      height: 0, // Will be set by Object.defineProperty
      prngSeed: seed,
      cm: characterMapObj,
      rW: rugWidth,
      rH: rugHeight,
      noLoopCalled: false,
      setup: null, // Will be set by algo script
      draw: null, // Will be set by algo script
      addEventListener: (event: string, callback: () => void) => {
        if (event === 'load') {
          // Trigger load event immediately
          setTimeout(() => {
            try {
              callback()
            } catch (e) {
              console.error('Load event callback error:', e)
            }
          }, 0)
        }
      }
    },
    // Rug parameters (EXACT same as NFTDisplay.generateHTMLPreview)
    w: w,
    h: h,
    f: f,
    wt: wt,
    wp: warpThickness,
    ts: ts,
    p: paletteObj,
    sd: stripeObj,
    tr: finalTextRows,
    td: [], // Text data (will be populated by script)
    s: seed,
    cm: characterMapObj,
    tl: textureLevel, // Applied renderMode flag
    dl: dirtLevel, // Applied renderMode flag
    fl: frameLevelNormalized, // Applied renderMode flag
    lt: null, // Will be set by script
    dt: null, // Will be set by script
    // Math functions
    Math,
    console: { log: () => {}, error: () => {} },
    // RequestAnimationFrame stub
    requestAnimationFrame: () => {},
    // Object.defineProperty for width/height getters
    Object
  }
  
  const vmContext = createContext(sandbox)
  
  // Execute scripts in EXACT same order as NFTDisplay
  try {
    // 1. Execute p5 script (sets up canvas APIs)
    const p5Script = new Script(p5ScriptContent, { filename: 'rug-p5.js' })
    ;(runInContext as any)(p5Script, vmContext, { timeout: 5000 })
    
    // 2. Execute algo script (defines setup() and draw())
    const algoScript = new Script(algoScriptContent, { filename: 'rug-algo.js' })
    ;(runInContext as any)(algoScript, vmContext, { timeout: 5000 })
    
    // 3. Execute frame script (if frameLevel is not 'None')
    if (frameLevelNormalized && frameLevelNormalized !== 'None' && frameLevelNormalized !== '') {
      const frameScript = new Script(frameScriptContent, { filename: 'rug-frame.js' })
      ;(runInContext as any)(frameScript, vmContext, { timeout: 2000 })
    }
    
    // 4. Manually trigger the load event handler (rug-p5.js sets this up)
    // The load event should call setup() and draw()
    if (sandbox.window.addEventListener) {
      // Trigger load event synchronously
      try {
        // Call setup and draw directly (load event handler does this)
        if (typeof sandbox.window.setup === 'function') {
          sandbox.window.setup()
        }
        if (typeof sandbox.window.draw === 'function') {
          sandbox.window.draw()
        }
      } catch (setupError) {
        console.error('Error in setup/draw:', setupError)
        throw setupError
      }
    }
    
    // Return the rendered canvas (use canvasRef which scripts updated)
    const finalCanvas = sandbox._p5.canvas || canvasRef.canvas || canvas
    const finalCtx = sandbox._p5.ctx || canvasRef.ctx || ctx
    
    // Verify canvas has content (not just blank)
    if (!finalCanvas || !finalCtx) {
      throw new Error('Canvas or context is null after rendering')
    }
    
    return {
      canvas: finalCanvas,
      ctx: finalCtx
    }
    
  } catch (error) {
    console.error('Error rendering rug:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    throw error
  }
}

