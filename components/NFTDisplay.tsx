'use client'

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, RefreshCw, ExternalLink, Heart, Copy, CheckCircle, Maximize2, Minimize2 } from 'lucide-react'
import NFTDetailModal from './NFTDetailModal'

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
  showControls?: boolean
  interactive?: boolean
  onFavoriteToggle?: (tokenId: number) => void
  onRefreshData?: (tokenId: number) => void
  onCopyLink?: (tokenId: number) => void
  className?: string
}

interface Palette {
  name: string
  colors: string[]
}

interface CharacterMap {
  [key: string]: string[]
}

class RugGenerator {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private width = 800
  private height = 1200
  private rugP5Script: string = ''
  private rugAlgoScript: string = ''
  private rugFrameScript: string = ''
  private scriptsLoaded: boolean = false
  private onScriptsLoaded?: () => void

  constructor(onLoaded?: () => void) {
    this.onScriptsLoaded = onLoaded
    this.initializeCanvas()
    this.loadScripts().catch(console.error)
  }

  isScriptsLoaded(): boolean {
    return this.scriptsLoaded
  }

  private initializeCanvas() {
    if (typeof document === 'undefined') return

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d')

    if (this.ctx) {
      this.ctx.fillStyle = '#f8f9fa'
      this.ctx.fillRect(0, 0, this.width, this.height)
    }
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

export default function NFTDisplay({
  nftData,
  size = 'medium',
  showControls = true,
  interactive = true,
  onFavoriteToggle,
  onRefreshData,
  onCopyLink,
  className = ''
}: NFTDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
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
    console.log('Scripts loaded, updating state')
    setScriptsLoaded(true)
  }), [])

  const sizeConfig = {
    small: { width: 200, height: 150 },
    medium: { width: 320, height: 240 },
    large: { width: 480, height: 360 }
  }

  const config = sizeConfig[size]

  // Reset state when nftData changes
  useEffect(() => {
    setPreviewImage('')
    setIsGenerating(true)
    setBlobUrl(null)
  }, [nftData?.tokenId])

  useEffect(() => {
    const generatePreview = async () => {
      if (previewImage && !isGenerating) {
        return
      }

      try {
        if (blobUrl && blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl)
          setBlobUrl(null)
        }

        if (nftData.traits) {
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

          if (imageData.startsWith('blob:')) {
            setBlobUrl(imageData)
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
  }, [nftData.traits, nftData.animation_url, nftData.tokenId, rugGenerator, scriptsLoaded])


  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

  // Cleanup blob URL when component unmounts or data changes
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [])

  const handleFavoriteToggle = useCallback(() => {
    setIsFavorited(!isFavorited)
    onFavoriteToggle?.(nftData.tokenId)
  }, [isFavorited, nftData.tokenId, onFavoriteToggle])

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/rug-market/${nftData.tokenId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      onCopyLink?.(nftData.tokenId)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }, [nftData.tokenId, onCopyLink])

  const handleRefreshData = useCallback(() => {
    onRefreshData?.(nftData.tokenId)

    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
    }

    if (nftData.traits) {
      const imageData = rugGenerator.generatePreview(nftData.traits, nftData.tokenId)
    if (imageData.startsWith('blob:')) {
      setBlobUrl(imageData)
    }
    setPreviewImage(imageData)
    } else if (nftData.animation_url) {
      setPreviewImage(nftData.animation_url)
    }
  }, [nftData.tokenId, nftData.traits, nftData.animation_url, rugGenerator, onRefreshData, blobUrl])

  const handleViewDetails = useCallback(() => {
    const nftDataWithPreview = {
      ...nftData,
      traits: displayTraits as RugTraits, // Use the computed displayTraits which includes attributes data
      processedPreviewUrl: previewImage
    }
    setSelectedNFT(nftDataWithPreview)
  }, [nftData, displayTraits, previewImage])

  const formatPrice = (price?: string) => {
    if (!price) return null
    const num = parseFloat(price)
    return num >= 1 ? `${num.toFixed(3)} ETH` : `${(num * 1000).toFixed(1)}K WEI`
  }

  const getConditionBadge = () => {
    const dirt = displayTraits?.dirtLevel || 0
    const aging = displayTraits?.agingLevel || 0

    let condition = 'Excellent'
    let color = 'bg-green-100 text-green-800'

    if (dirt > 0 || aging > 0) {
      condition = `D${dirt} A${aging}`
      color = dirt > 1 || aging > 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
    }

    return { condition, color }
  }

  const { condition, color: conditionColor } = getConditionBadge()

  return (
    <>
      {/* NFT Preview - Clean, just the art */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={interactive ? { scale: 1.02 } : {}}
        className={`relative overflow-hidden rounded-lg cursor-pointer group ${className}`}
        style={{ width: config.width, height: config.height }}
        onClick={handleViewDetails}
      >
        {/* NFT Content */}
        {isGenerating ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : previewImage ? (
          previewImage.startsWith('blob:') || previewImage.startsWith('data:') ? (
            <iframe
              src={previewImage}
              className="w-full h-full border-0"
              title={`NFT ${nftData.tokenId}`}
              sandbox="allow-scripts"
            />
          ) : (
            <img
              src={previewImage}
              alt={nftData.name || `NFT ${nftData.tokenId}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-500">No preview available</span>
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRefreshData && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRefreshData()
                }}
                className="p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {onFavoriteToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // handleFavoriteToggle is defined above
                }}
                className={`p-1 rounded-full transition-colors ${
                  isFavorited
                    ? 'bg-red-500/80 text-white'
                    : 'bg-black/50 hover:bg-black/70 text-white'
                }`}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            )}
            {onCopyLink && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyLink()
                }}
                className="p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                title="Copy link"
              >
                {copySuccess ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Price Badge */}
        {nftData.listingPrice && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-sm px-2 py-1 rounded">
            {formatPrice(nftData.listingPrice)}
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute bottom-2 right-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${conditionColor}`}>
            {condition}
          </span>
        </div>
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