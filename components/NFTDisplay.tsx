'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'

export interface RugTraits {
  seed: bigint
  paletteName: string
  minifiedPalette: string
  minifiedStripeData: string
  textRows: string[]
  warpThickness: number
  mintTime: bigint
  filteredCharacterMap: string
  characterCount: bigint
  stripeCount: bigint
  textLinesCount: number
  dirtLevel: number
  agingLevel: number
  frameLevel?: string
  maintenanceScore?: bigint
  curator?: string
  cleaningCount?: number
  restorationCount?: number
  masterRestorationCount?: number
  launderingCount?: number
  lastSalePrice?: string
  lastCleaned?: bigint
}

export interface TokenURIAttribute {
  trait_type: string
  value: string | number
}

export interface NFTData {
  tokenId: number
  traits?: RugTraits
  attributes?: TokenURIAttribute[]
  owner?: string
  name?: string
  description?: string
  image?: string
  animation_url?: string
  rarityScore?: number
  listingPrice?: string
  isListed?: boolean
  lastSalePrice?: string
  marketplaceData?: any
  processedPreviewUrl?: string
}

function extractDisplayTraitsFromAttributes(attributes: TokenURIAttribute[]): Partial<RugTraits> {
  try {
    const attrMap = new Map<string, string | number>()
    attributes.forEach(attr => {
      attrMap.set(attr.trait_type, attr.value)
    })

    const dirtLevel = Number(attrMap.get('Dirt Level') || 0)
    const agingLevel = Number(attrMap.get('Aging Level') || 0)
    const frameLevel = String(attrMap.get('Frame') || 'None')
    const maintenanceScore = BigInt(attrMap.get('Maintenance Score') || 0)

    // Extract additional traits from attributes
    const paletteName = String(attrMap.get('Palette Name') || '')
    const characterCount = BigInt(attrMap.get('Character Count') || 0)
    const stripeCount = BigInt(attrMap.get('Stripe Count') || 0)
    const warpThickness = Number(attrMap.get('Warp Thickness') || 1)
    const curator = String(attrMap.get('Curator') || '')
    const textLinesCount = Number(attrMap.get('Text Lines') || 0)
    const cleaningCount = Number(attrMap.get('Cleaning Count') || 0)
    const restorationCount = Number(attrMap.get('Restoration Count') || 0)
    const masterRestorationCount = Number(attrMap.get('Master Restoration Count') || 0)
    const launderingCount = Number(attrMap.get('Laundering Count') || 0)
    const lastSalePrice = String(attrMap.get('Last Sale Price') || '0')
    const lastCleaned = BigInt(attrMap.get('Last Cleaned') || 0)

    return {
      dirtLevel,
      agingLevel,
      frameLevel,
      maintenanceScore,
      paletteName,
      characterCount,
      stripeCount,
      warpThickness,
      curator,
      textLinesCount,
      cleaningCount,
      restorationCount,
      masterRestorationCount,
      launderingCount,
      lastSalePrice,
      lastCleaned
    }
  } catch (error) {
    console.error('Failed to extract display traits from attributes:', error)
    return {}
  }
}

export interface NFTDisplayProps {
  nftData: NFTData
  size?: 'small' | 'medium' | 'large'
  interactive?: boolean
  onClick?: () => void
  className?: string
  renderMode?: 'og' | 'interactive' // OG mode: disables dirt, aging, frames, animations
  // Deprecated props - kept for backward compatibility but unused
  showControls?: boolean
  onFavoriteToggle?: (tokenId: number) => void
  onRefreshData?: (tokenId: number) => void
  onCopyLink?: (tokenId: number) => void
}


class RugGenerator {
  private width = 800
  private height = 1200
  private rugP5Script: string = ''
  private rugAlgoScript: string = ''
  private rugFrameScript: string = ''
  private scriptsLoaded: boolean = false
  private onScriptsLoaded?: () => void

  constructor(onLoaded?: () => void) {
    this.onScriptsLoaded = onLoaded
    this.loadScripts().catch(console.error)
  }

  isScriptsLoaded(): boolean {
    return this.scriptsLoaded
  }

  private async loadScripts() {
    try {
      console.log('[RugGenerator] Loading rug generation scripts...')

      // Use absolute URLs to ensure they work in blob contexts
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const p5Url = `${baseUrl}/data/rug-p5.js`
      const algoUrl = `${baseUrl}/data/rug-algo.js`
      const frameUrl = `${baseUrl}/data/rug-frame.js`

      console.log('[RugGenerator] Fetching scripts from:', { p5Url, algoUrl, frameUrl })

      const [p5Response, algoResponse, frameResponse] = await Promise.all([
        fetch(p5Url),
        fetch(algoUrl),
        fetch(frameUrl)
      ])

      if (!p5Response.ok) {
        throw new Error(`rug-p5.js fetch failed: ${p5Response.status} ${p5Response.statusText}`)
      }
      if (!algoResponse.ok) {
        throw new Error(`rug-algo.js fetch failed: ${algoResponse.status} ${algoResponse.statusText}`)
      }
      if (!frameResponse.ok) {
        throw new Error(`rug-frame.js fetch failed: ${frameResponse.status} ${frameResponse.statusText}`)
      }

      this.rugP5Script = await p5Response.text()
      this.rugAlgoScript = await algoResponse.text()
      this.rugFrameScript = await frameResponse.text()

      // Validate scripts are not empty
      if (!this.rugP5Script || this.rugP5Script.length === 0) {
        throw new Error('rug-p5.js is empty')
      }
      if (!this.rugAlgoScript || this.rugAlgoScript.length === 0) {
        throw new Error('rug-algo.js is empty')
      }
      if (!this.rugFrameScript || this.rugFrameScript.length === 0) {
        throw new Error('rug-frame.js is empty')
      }

      console.log('[RugGenerator] Loaded scripts successfully:', {
        p5: this.rugP5Script.length,
        algo: this.rugAlgoScript.length,
        frame: this.rugFrameScript.length
      })

      this.scriptsLoaded = true
      this.onScriptsLoaded?.()
    } catch (error) {
      console.error('[RugGenerator] Failed to load rug generation scripts:', error)
      if (error instanceof Error) {
        console.error('[RugGenerator] Error stack:', error.stack)
      }
      this.scriptsLoaded = false
      // Don't call onScriptsLoaded callback on error - let component handle retry
    }
  }

  private generateHTMLPreview(traits: RugTraits, tokenId?: number, renderMode?: 'og' | 'interactive'): string {
    const displayTokenId = tokenId || (traits?.seed ? Number(traits.seed.toString()) : 'Preview')
    const isOGMode = renderMode === 'og'
    
    // Helper to safely parse JSON - handles both strings and objects/arrays
    const safeParseJson = (value: any, fallback: any): any => {
      if (!value) return fallback
      
      // If it's already an object or array, return it
      if (typeof value === 'object' && value !== null) {
        return value
      }
      
      // If it's a string, try to parse it
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return fallback
        }
      }
      
      return fallback
    }
    
    // Parse JSON strings to objects/arrays so we can embed them directly as JavaScript values
    const defaultPalette = {name:"Arctic Ice",colors:["#F0F8FF","#E6E6FA","#B0C4DE","#87CEEB","#B0E0E6","#F0FFFF","#E0FFFF","#F5F5F5"]}
    const defaultStripe = [{y:0,h:70.76905641704798,pc:"#B0E0E6",wt:"s",wv:0.2441620133817196}]
    
    const paletteObj = safeParseJson(traits?.minifiedPalette, defaultPalette)
    const stripeObj = safeParseJson(traits?.minifiedStripeData, defaultStripe)
    
    // Ensure textRows is always a valid non-empty array
    const textRowsRaw = traits?.textRows
    const textRowsArray = Array.isArray(textRowsRaw) && textRowsRaw.length > 0 
      ? textRowsRaw.filter(row => row && typeof row === 'string' && row.trim().length > 0)
      : ["BACKEND", "RUGGED"]
    
    // If after filtering we have empty array, use default
    const finalTextRows = textRowsArray.length > 0 ? textRowsArray : ["BACKEND", "RUGGED"]
    
    const seed = traits?.seed ? Number(traits.seed.toString()) : 348430
    // In OG mode: disable dirt, aging, and frames
    const textureLevel = isOGMode ? 0 : (traits?.agingLevel || 0)
    const dirtLevel = isOGMode ? 0 : (traits?.dirtLevel || 0)
    
    // Use local character map (not from contract/Redis to save space)
    // Filter to only include characters used in textRows for optimization
    const fullCharacterMap = this.getCharacterMap()
    const usedChars = new Set<string>()
    finalTextRows.forEach(row => {
      if (row && typeof row === 'string') {
        row.toUpperCase().split('').forEach(char => {
          usedChars.add(char)
        })
      }
    })
    
    // Always include space character
    usedChars.add(' ')
    
    // Create filtered character map with only used characters
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

    // In OG mode: disable frames
    const frameLevel = isOGMode ? '' : (() => {
      const level = traits?.frameLevel || ''
      if (level === 'Gold') return 'G'
      if (level === 'Bronze') return 'B'
      if (level === 'Silver') return 'S'
      if (level === 'Diamond') return 'D'
      return ''
    })()

    // OG mode: inject code to set __OG_READY__ flag after draw completes
    const ogReadyScript = isOGMode ? `
  <script>
    // Override draw function to set ready flag after first complete render
    (function() {
      const originalDraw = window.draw;
      if (typeof originalDraw === 'function') {
        let drawCalled = false;
        window.draw = function() {
          originalDraw.apply(this, arguments);
          if (!drawCalled && window.noLoopCalled) {
            drawCalled = true;
            // Set ready flag after draw completes and noLoop was called
            window.__OG_READY__ = true;
          }
        };
      }
      // Also check on load event completion
      window.addEventListener('load', function() {
        setTimeout(function() {
          if (typeof window.draw === 'function' && window.noLoopCalled) {
            window.__OG_READY__ = true;
          }
        }, 100);
      });
    })();
  </script>` : ''

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>OnchainRug #${displayTokenId}</title>
  <style>body{display:flex;justify-content:center;align-items:center}#defaultCanvas0{width:100%!important;height:auto!important;}</style>
  <script>
    ${this.rugP5Script}
  </script>
</head>
<body>
  <div id="rug"></div>
  <script>
    let w = 800,
        h = 1200,
        f = 30,
        wt = 8,
        wp = ${traits?.warpThickness || 4},
        ts = 2,
        lt, dt,
        p = ${JSON.stringify(paletteObj)},
        sd = ${JSON.stringify(stripeObj)},
        tr = ${JSON.stringify(finalTextRows)},
        td = [],
        s = ${seed},
        cm = ${JSON.stringify(characterMapObj)},
        tl = ${textureLevel},
        dl = ${dirtLevel},
        fl = "${frameLevel}";
  </script>
  <script>
    ${this.rugAlgoScript}
  </script>
  <script>
    ${this.rugFrameScript}
  </script>${ogReadyScript}
</body>
</html>`


    return htmlContent
  }

  private getCharacterMap() {
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


  generatePreview(traits: RugTraits, tokenId?: number, renderMode?: 'og' | 'interactive'): string {
    try {
      if (!this.scriptsLoaded) {
        console.warn('Scripts not loaded yet, cannot generate preview')
        return ''
      }
      
      // Validate scripts are loaded
      if (!this.rugP5Script || !this.rugAlgoScript || !this.rugFrameScript) {
        console.error('Scripts are not loaded:', {
          p5: !!this.rugP5Script,
          algo: !!this.rugAlgoScript,
          frame: !!this.rugFrameScript
        })
        return ''
      }
      
      console.log('Generating HTML preview from traits for token', tokenId, 'renderMode:', renderMode)
      const htmlContent = this.generateHTMLPreview(traits, tokenId, renderMode)
      
      if (!htmlContent || htmlContent.length === 0) {
        console.error('Generated HTML content is empty')
        return ''
      }
      
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const blobUrl = URL.createObjectURL(blob)
      console.log('Generated blob URL:', blobUrl.substring(0, 50) + '...')
      return blobUrl
    } catch (error) {
      console.error('Failed to generate HTML preview:', error)
      if (error instanceof Error) {
        console.error('Error stack:', error.stack)
      }
      return ''
    }
  }

}

export default function NFTDisplay({
  nftData,
  size = 'medium',
  interactive = true,
  onClick,
  className = '',
  renderMode = 'interactive'
}: NFTDisplayProps) {
  const [previewImage, setPreviewImage] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)

  const displayTraits = useMemo(() => {
    if (nftData.traits) {
      return nftData.traits
    }
    if (nftData.attributes) {
      return extractDisplayTraitsFromAttributes(nftData.attributes)
    }
    return null
  }, [nftData.traits, nftData.attributes])

  const rugGenerator = useMemo(() => new RugGenerator(() => {
    console.log('[NFTDisplay] Scripts loaded callback fired, updating state')
    setScriptsLoaded(true)
  }), [])

  const sizeConfig = {
    small: { width: 200, height: 150 },
    medium: { width: 320, height: 240 },
    large: { width: 480, height: 360 }
  }

  const config = sizeConfig[size]

  // For card usage, we want to be fully responsive and ignore fixed sizes
  const isResponsive = className?.includes('w-full') || className?.includes('h-full')

  // Track the last generated tokenId to avoid unnecessary regenerations
  const [lastGeneratedTokenId, setLastGeneratedTokenId] = useState<number | null>(null)
  
  // Create a stable key for traits to detect actual changes
  // Include dynamic traits (dirtLevel, agingLevel, frameLevel) so preview regenerates when they change
  const traitsKey = useMemo(() => {
    if (!nftData?.traits) return null
    return JSON.stringify({
      tokenId: nftData.tokenId,
      seed: nftData.traits.seed?.toString(),
      paletteName: nftData.traits.paletteName,
      minifiedPalette: nftData.traits.minifiedPalette,
      minifiedStripeData: nftData.traits.minifiedStripeData,
      dirtLevel: nftData.traits.dirtLevel ?? 0,
      agingLevel: nftData.traits.agingLevel ?? 0,
      frameLevel: nftData.traits.frameLevel ?? 'None'
    })
  }, [nftData?.traits])

  // Track the last traits key to detect changes in dynamic traits
  const [lastTraitsKey, setLastTraitsKey] = useState<string | null>(null)

  // Reset state when tokenId changes OR when traits key changes (dynamic traits updated)
  useEffect(() => {
    const currentTokenId = nftData?.tokenId
    const currentTraitsKey = traitsKey
    
    // If tokenId changed, always reset
    if (currentTokenId !== lastGeneratedTokenId && currentTokenId !== undefined) {
      console.log('[NFTDisplay] TokenId changed, resetting preview', { 
        old: lastGeneratedTokenId, 
        new: currentTokenId 
      })
      setPreviewImage('')
      setIsGenerating(true)
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
        setBlobUrl(null)
      }
      setLastTraitsKey(null) // Reset traits key tracking
    }
    // If traits key changed (dynamic traits updated), reset preview
    else if (currentTraitsKey && currentTraitsKey !== lastTraitsKey) {
      console.log('[NFTDisplay] Traits changed, regenerating preview', { 
        currentTraitsKey, 
        lastTraitsKey 
      })
      setPreviewImage('')
      setIsGenerating(true)
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
        setBlobUrl(null)
      }
    }
  }, [nftData?.tokenId, lastGeneratedTokenId, blobUrl, traitsKey, lastTraitsKey])

  useEffect(() => {
    // Skip if we already have a preview for this exact traits key
    if (traitsKey && traitsKey === lastTraitsKey && previewImage && previewImage.length > 0) {
      return
    }

    const generatePreview = async () => {
      try {
        if (nftData.traits) {
          if (!scriptsLoaded) {
            // Scripts required to generate client-side previews haven't loaded yet.
            // Show a lightweight placeholder so the card/modal doesn't render blank
            // — we'll retry generation automatically when `scriptsLoaded` flips true.
            console.log('[NFTDisplay] Scripts not loaded yet, showing placeholder')
            setPreviewImage('/rug-loading-mid.webp')
            setIsGenerating(true)
            return
          }

          console.log('[NFTDisplay] Generating preview for tokenId:', nftData.tokenId, 'renderMode:', renderMode)
          setIsGenerating(true)
          
          const imageData = rugGenerator.generatePreview(nftData.traits, nftData.tokenId, renderMode)

          if (!imageData || imageData.length === 0) {
            console.error('[NFTDisplay] generatePreview returned empty string')
            setPreviewImage('/rug-loading-mid.webp')
            setIsGenerating(false)
            return
          }

          if (imageData.startsWith('blob:')) {
            // Revoke old blob URL if it exists
            if (blobUrl && blobUrl.startsWith('blob:')) {
              URL.revokeObjectURL(blobUrl)
            }
            setBlobUrl(imageData)
            console.log('[NFTDisplay] Preview generated successfully, blob URL:', imageData.substring(0, 50) + '...')
          }

          setPreviewImage(imageData)
          setIsGenerating(false)
          setLastGeneratedTokenId(nftData.tokenId)
          setLastTraitsKey(traitsKey || null)
        } else if (nftData.animation_url) {
          // Use the animation_url directly as iframe src
          console.log('[NFTDisplay] Using animation_url:', nftData.animation_url)
          setPreviewImage(nftData.animation_url)
          setIsGenerating(false)
          setLastGeneratedTokenId(nftData.tokenId)
          setLastTraitsKey(traitsKey || null)
        } else {
          console.log('[NFTDisplay] No traits or animation_url, showing placeholder')
          setPreviewImage('/rug-loading-mid.webp')
          setIsGenerating(false)
          setLastGeneratedTokenId(nftData.tokenId)
          setLastTraitsKey(traitsKey || null)
        }
      } catch (error) {
        console.error('[NFTDisplay] Failed to generate rug preview:', error)
        if (error instanceof Error) {
          console.error('[NFTDisplay] Error stack:', error.stack)
        }
        setPreviewImage(nftData.animation_url || '/rug-loading-mid.webp')
        setIsGenerating(false)
        setLastGeneratedTokenId(nftData.tokenId)
        setLastTraitsKey(traitsKey || null)
      }
    }

    generatePreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nftData.tokenId, traitsKey, nftData.animation_url, rugGenerator, scriptsLoaded, renderMode])


  // Cleanup blob URLs on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        // Don't revoke immediately - give iframe time to load
        // The iframe will keep the blob URL alive as long as it's loaded
        setTimeout(() => {
          try {
            URL.revokeObjectURL(blobUrl)
          } catch (e) {
            // Ignore errors if URL was already revoked
          }
        }, 1000)
      }
    }
  }, [blobUrl])


  return (
    <>
      {/* NFT Preview - Clean, just the art */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={interactive ? { scale: 1.02 } : {}}
        className={`relative rounded-lg ${onClick ? 'cursor-pointer pointer-events-auto' : ''} ${className} flex items-center justify-center`}
        style={isResponsive ? {
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'absolute',
          inset: 0
        } : {
          width: config.width,
          height: config.height,
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
        onClick={onClick}
      >
        {/* NFT Content */}
        {isGenerating ? (
          <div className="w-full h-full flex items-center justify-center bg-black/20">
            <div className="text-white/50 text-sm">Generating preview...</div>
          </div>
        ) : previewImage && previewImage.length > 0 ? (
          previewImage.startsWith('blob:') || previewImage.startsWith('data:') ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: '200px' }}>
              <iframe
                src={previewImage}
                className="border-0 pointer-events-none"
                title={`NFT ${nftData.tokenId}`}
                sandbox="allow-scripts"
                scrolling="no"
                onLoad={() => {
                  console.log('[NFTDisplay] Iframe loaded for tokenId:', nftData.tokenId)
                }}
                onError={(e) => {
                  console.error('[NFTDisplay] Iframe load error for tokenId:', nftData.tokenId, e)
                }}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  overflow: 'hidden',
                  border: 'none',
                  minHeight: '200px'
                }}
              />
            </div>
          ) : (
            <img
              src={previewImage}
              alt={nftData.name || `NFT ${nftData.tokenId}`}
              className="object-contain"
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              loading="lazy"
              onError={(e) => {
                console.error('[NFTDisplay] Image load error for tokenId:', nftData.tokenId, e)
              }}
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/20">
            <span className="text-white/50 text-sm">No preview available</span>
          </div>
        )}

      </motion.div>
    </>
  )
}

// Simple skeleton used by the demo page while previews are generating
export function NFTDisplaySkeleton({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeConfig = {
    small: { width: 200, height: 150 },
    medium: { width: 320, height: 240 },
    large: { width: 480, height: 360 }
  }
  const config = sizeConfig[size]
  return (
    <div
      className="animate-pulse bg-gray-800 rounded-lg"
      style={{ width: config.width, height: config.height }}
    />
  )
}