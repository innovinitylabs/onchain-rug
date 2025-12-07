'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
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
      console.log('Loading rug generation scripts...')

      // Use absolute URLs to ensure they work in blob contexts
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const p5Url = `${baseUrl}/data/rug-p5.js`
      const algoUrl = `${baseUrl}/data/rug-algo.js`
      const frameUrl = `${baseUrl}/data/rug-frame.js`

      const p5Response = await fetch(p5Url)
      if (!p5Response.ok) throw new Error(`rug-p5.js fetch failed: ${p5Response.status}`)
      this.rugP5Script = await p5Response.text()
      console.log('Loaded custom rug-p5.js, length:', this.rugP5Script.length)

      const algoResponse = await fetch(algoUrl)
      if (!algoResponse.ok) throw new Error(`rug-algo.js fetch failed: ${algoResponse.status}`)
      this.rugAlgoScript = await algoResponse.text()
      console.log('Loaded rug-algo.js script, length:', this.rugAlgoScript.length)

      const frameResponse = await fetch(frameUrl)
      if (!frameResponse.ok) throw new Error(`rug-frame.js fetch failed: ${frameResponse.status}`)
      this.rugFrameScript = await frameResponse.text()
      console.log('Loaded rug-frame.js script, length:', this.rugFrameScript.length)

      console.log('All scripts loaded successfully!')
      this.scriptsLoaded = true
      this.onScriptsLoaded?.()
    } catch (error) {
      console.error('Failed to load rug generation scripts:', error)
      this.scriptsLoaded = false
    }
  }

  private generateHTMLPreview(traits: RugTraits, tokenId?: number): string {
    const displayTokenId = tokenId || (traits?.seed ? Number(traits.seed.toString()) : 'Preview')
    
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
    const textureLevel = traits?.agingLevel || 0
    const dirtLevel = traits?.dirtLevel || 0
    
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

    const frameLevel = (() => {
      const level = traits?.frameLevel || ''
      if (level === 'Gold') return 'G'
      if (level === 'Bronze') return 'B'
      if (level === 'Silver') return 'S'
      if (level === 'Diamond') return 'D'
      return ''
    })()

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
  </script>
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


  generatePreview(traits: RugTraits, tokenId?: number): string {
    try {
      console.log('Generating HTML preview from traits for token', tokenId)
      const htmlContent = this.generateHTMLPreview(traits, tokenId)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const blobUrl = URL.createObjectURL(blob)
      return blobUrl
    } catch (error) {
      console.error('Failed to generate HTML preview:', error)
      return ''
    }
  }

}

// Module-level cache for previews - persists across component unmounts/remounts
interface PreviewCacheEntry {
  previewImage: string
  blobUrl: string | null
  isGenerating: boolean
}

const previewCache = new Map<number, PreviewCacheEntry>()

function NFTDisplay({
  nftData,
  size = 'medium',
  interactive = true,
  onClick,
  className = ''
}: NFTDisplayProps) {
  const currentTokenId = nftData?.tokenId
  
  // Initialize state from cache if available, otherwise use defaults
  const cachedPreview = currentTokenId !== undefined ? previewCache.get(currentTokenId) : undefined
  const [previewImage, setPreviewImage] = useState<string>(cachedPreview?.previewImage || '')
  const [isGenerating, setIsGenerating] = useState<boolean>(cachedPreview?.isGenerating ?? true)
  const [blobUrl, setBlobUrl] = useState<string | null>(cachedPreview?.blobUrl || null)
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
    console.log('Scripts loaded, updating state')
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

  // Update cache whenever state changes
  useEffect(() => {
    if (currentTokenId !== undefined) {
      previewCache.set(currentTokenId, {
        previewImage,
        blobUrl,
        isGenerating
      })
    }
  }, [currentTokenId, previewImage, blobUrl, isGenerating])

  useEffect(() => {
    const generatePreview = async () => {
      if (currentTokenId === undefined) {
        return
      }

      // Check cache first - if we have a valid cached preview, use it
      const cached = previewCache.get(currentTokenId)
      if (cached && cached.previewImage && cached.previewImage !== '/rug-loading-mid.webp' && cached.previewImage !== '' && !cached.isGenerating) {
        // Use cached preview
        setPreviewImage(cached.previewImage)
        setBlobUrl(cached.blobUrl)
        setIsGenerating(false)
        return
      }

      // If we already have a valid preview in state, skip regeneration
      if (previewImage && previewImage !== '/rug-loading-mid.webp' && previewImage !== '' && !isGenerating) {
        return
      }

      try {
        if (displayTraits && nftData.traits) {
          if (!scriptsLoaded) {
            // Scripts required to generate client-side previews haven't loaded yet.
            // Show a lightweight placeholder so the card/modal doesn't render blank
            // — we'll retry generation automatically when `scriptsLoaded` flips true.
            setPreviewImage('/rug-loading-mid.webp')
            setIsGenerating(true)
            return
          }

          setIsGenerating(true)
          const imageData = rugGenerator.generatePreview(nftData.traits, nftData.tokenId)

          let newBlobUrl: string | null = null
          if (imageData.startsWith('blob:')) {
            newBlobUrl = imageData
            setBlobUrl(newBlobUrl)
          }

          setPreviewImage(imageData)
          setIsGenerating(false)
        } else if (nftData.animation_url) {
          // Use the animation_url directly as iframe src
          setPreviewImage(nftData.animation_url)
          setIsGenerating(false)
        } else {
          setPreviewImage('/rug-loading-mid.webp')
          setIsGenerating(false)
        }
      } catch (error) {
        console.error('Failed to generate rug preview:', error)
        setPreviewImage(nftData.animation_url || '/rug-loading-mid.webp')
        setIsGenerating(false)
      }
    }

    generatePreview()
    // Only regenerate when tokenId, data, or scripts change - not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTokenId, displayTraits, nftData.animation_url, rugGenerator, scriptsLoaded])


  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
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
        {previewImage && previewImage !== '' ? (
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
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  overflow: 'hidden',
                  border: 'none'
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
            />
          )
        ) : isGenerating ? null : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-500">No preview available</span>
          </div>
        )}

      </motion.div>
    </>
  )
}

// Memoize component to prevent unnecessary re-renders when sorting (props haven't changed)
// Return true if props are equal (should skip re-render), false if different (should re-render)
export default React.memo(NFTDisplay, (prevProps, nextProps) => {
  // Compare tokenId (the important prop) - if same, don't re-render
  const tokenIdSame = prevProps.nftData?.tokenId === nextProps.nftData?.tokenId
  const sizeSame = prevProps.size === nextProps.size
  const classNameSame = prevProps.className === nextProps.className
  
  // Only re-render if tokenId, size, or className changed
  // Note: onClick may change reference but that's okay, we only care about tokenId
  return tokenIdSame && sizeSame && classNameSame
})

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