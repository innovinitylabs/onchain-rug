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
}

export interface TokenURIAttribute {
  trait_type: string
  value: string | number
}

export interface NFTData {
  tokenId: number
  traits?: RugTraits
  attributes?: TokenURIAttribute[]
  owner: string
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

    return {
      dirtLevel,
      agingLevel,
      frameLevel,
      maintenanceScore
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

      const p5Response = await fetch('/data/rug-p5.js')
      if (!p5Response.ok) throw new Error(`rug-p5.js fetch failed: ${p5Response.status}`)
      this.rugP5Script = await p5Response.text()
      console.log('Loaded custom rug-p5.js, length:', this.rugP5Script.length)

      const algoResponse = await fetch('/data/rug-algo.js')
      if (!algoResponse.ok) throw new Error(`rug-algo.js fetch failed: ${algoResponse.status}`)
      this.rugAlgoScript = await algoResponse.text()
      console.log('Loaded rug-algo.js script, length:', this.rugAlgoScript.length)

      const frameResponse = await fetch('/data/rug-frame.js')
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
    const paletteJson = traits?.minifiedPalette ? JSON.stringify(JSON.parse(traits.minifiedPalette)) : '{"name":"Arctic Ice","colors":["#F0F8FF","#E6E6FA","#B0C4DE","#87CEEB","#B0E0E6","#F0FFFF","#E0FFFF","#F5F5F5"]}'
    const stripeJson = traits?.minifiedStripeData ? JSON.stringify(JSON.parse(traits.minifiedStripeData)) : '[{"y":0,"h":70.76905641704798,"pc":"#B0E0E6","wt":"s","wv":0.2441620133817196},{"y":70.76905641704798,"h":66.97513959370553,"pc":"#E0FFFF","wt":"t","wv":0.4486666376702487},{"y":137.7441960107535,"h":52.949525993317366,"pc":"#E6E6FA","wt":"s","wv":0.3614784942939878},{"y":190.69372200407088,"h":88.51418890990317,"pc":"#F5F5F5","wt":"s","wv":0.4601602298207581},{"y":279.20791091397405,"h":70.09695865213871,"pc":"#87CEEB","wt":"s","wv":0.18919947408139706},{"y":349.30486956611276,"h":54.90225265733898,"pc":"#B0C4DE","wt":"t","wv":0.10271521052345634},{"y":404.20712222345173,"h":53.02237452939153,"pc":"#F0FFFF","sc":"#E0FFFF","wt":"s","wv":0.3749437925405801},{"y":457.22949675284326,"h":61.070579811930656,"pc":"#F0FFFF","sc":"#E6E6FA","wt":"t","wv":0.14146835459396245},{"y":518.3000765647739,"h":50.73577044531703,"pc":"#F5F5F5","wt":"s","wv":0.24790364671498538},{"y":569.035847010091,"h":71.19754501618445,"pc":"#B0C4DE","wt":"s","wv":0.10568890692666173},{"y":640.2333920262754,"h":72.2229290753603,"pc":"#E0FFFF","wt":"t","wv":0.3288901265710592},{"y":712.4563211016357,"h":73.23578814975917,"pc":"#F5F5F5","wt":"t","wv":0.2201482846401632},{"y":785.6921092513949,"h":81.7917856760323,"pc":"#E0FFFF","wt":"s","wv":0.257676356099546},{"y":867.4838949274272,"h":83.10637858696282,"pc":"#F0F8FF","wt":"s","wv":0.11601038286462427},{"y":950.59027351439,"h":67.69649278372526,"pc":"#B0E0E6","sc":"#F0FFFF","wt":"t","wv":0.15098334243521094},{"y":1018.2867662981153,"h":84.24941586330533,"pc":"#87CEEB","sc":"#B0C4DE","wt":"s","wv":0.12075226726010442},{"y":1102.5361821614206,"h":86.20883144438267,"pc":"#E0FFFF","wt":"s","wv":0.2798375692218542},{"y":1188.7450136058033,"h":11.254986394196749,"pc":"#B0C4DE","wt":"s","wv":0.3258690937422216}]'
    const textRowsJson = traits?.textRows ? JSON.stringify(traits.textRows) : '["BACKEND", "RUGGED"]'
    const seed = traits?.seed ? Number(traits.seed.toString()) : 348430
    const characterMapJson = traits?.filteredCharacterMap ? JSON.stringify(JSON.parse(traits.filteredCharacterMap)) : '{"B":["11110","10001","10001","11110","10001","10001","11110"],"A":["01110","10001","10001","11111","10001","10001","10001"],"C":["01111","10000","10000","10000","10000","10000","01111"],"K":["10001","10010","10100","11000","10100","10010","10001"],"E":["11111","10000","10000","11110","10000","10000","11111"],"N":["10001","11001","10101","10011","10001","10001","10001"],"D":["11110","10001","10001","10001","10001","10001","11110"],"R":["11110","10001","10001","11110","10100","10010","10001"],"U":["10001","10001","10001","10001","10001","10001","01110"],"G":["01111","10000","10000","10011","10001","10001","01111"]," ":["00000","00000","00000","00000","00000","00000","00000"]}'
    const textureLevel = traits?.agingLevel || 0
    const dirtLevel = traits?.dirtLevel || 0

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
        p = '${paletteJson}',
        sd = '${stripeJson}',
        tr = ${textRowsJson},
        td = [],
        s = ${seed},
        cm = ${characterMapJson},
        tl = ${textureLevel},
        dl = ${dirtLevel},
        fl = "${frameLevel}";

    p = JSON.parse(p);
    sd = JSON.parse(sd);
    cm = JSON.parse(cm);
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
          setPreviewImage(nftData.animation_url)
          setIsGenerating(false)
        } else {
          setPreviewImage('/placeholder-rug.png')
          setIsGenerating(false)
        }
      } catch (error) {
        console.error('Failed to generate rug preview:', error)
        setPreviewImage(nftData.animation_url || '/placeholder-rug.png')
        setIsGenerating(false)
      }
    }

    generatePreview()
  }, [nftData.traits, nftData.animation_url, nftData.tokenId, rugGenerator, scriptsLoaded, previewImage, isGenerating, blobUrl])


  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

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
      processedPreviewUrl: previewImage
    }
    setSelectedNFT(nftDataWithPreview)
  }, [nftData, previewImage])

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
        onClick={interactive ? handleViewDetails : undefined}
      >
        {isGenerating ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : previewImage ? (
          <iframe
            src={previewImage}
            className="w-full h-full rounded-lg border-0"
            title={`OnchainRug #${nftData.tokenId}`}
            loading="lazy"
            sandbox="allow-scripts"
          />
        ) : (
          <div
            className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-100 to-white"
            style={{ minHeight: '200px' }}
          >
            <div className="text-center p-4">
              {isGenerating ? (
                <div>
                  <div className="text-lg font-bold text-blue-600 mb-2">Generating Preview...</div>
                  <div className="text-sm text-gray-600">Loading rug scripts and generating HTML</div>
                </div>
              ) : (
                <div>
                  <div className="text-lg font-bold text-red-600 mb-2">Preview Not Available</div>
                  <div className="text-sm text-gray-600 mb-1">Token ID: #{nftData.tokenId}</div>
                  <div className="text-sm text-gray-600 mb-1">Scripts Loaded: {scriptsLoaded ? 'Yes' : 'No'}</div>
                  <div className="text-sm text-gray-600">Has Traits: {nftData.traits ? 'Yes' : 'No'}</div>
                  <div className="text-sm text-gray-600">Has Animation URL: {nftData.animation_url ? 'Yes' : 'No'}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />

        <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {nftData.isListed && (
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">
              FOR SALE
            </div>
          )}
          <div className={`text-white text-xs px-2 py-1 rounded font-bold ${conditionColor}`}>
            {condition}
          </div>
        </div>

        <div className="absolute top-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded opacity-75">
          #{nftData.tokenId}
        </div>

        {nftData.listingPrice && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-sm px-2 py-1 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            {formatPrice(nftData.listingPrice)}
          </div>
        )}

        {showControls && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleFavoriteToggle()
              }}
              className={`p-2 rounded-full transition-colors ${
                isFavorited
                  ? 'bg-red-500 text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopyLink()
              }}
              className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-colors"
            >
              {copySuccess ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </motion.div>

      <NFTDetailModal
        nftData={selectedNFT}
        isOpen={!!selectedNFT}
        onClose={() => setSelectedNFT(null)}
        onFavoriteToggle={onFavoriteToggle}
        onRefreshData={onRefreshData}
        onCopyLink={onCopyLink}
      />
    </>
  )
}

export function NFTDisplaySkeleton({ size = 'medium', className = '' }: { size?: 'small' | 'medium' | 'large', className?: string }) {
  const sizeConfig = {
    small: { width: 200, height: 150 },
    medium: { width: 320, height: 240 },
    large: { width: 480, height: 360 }
  }

  const config = sizeConfig[size]

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 animate-pulse ${className}`}
      style={{ width: config.width }}
    >
      <div
        className="bg-gray-200"
        style={{ height: config.height }}
      />

      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>

        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}
