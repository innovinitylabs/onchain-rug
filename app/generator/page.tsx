"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Download, FileText, Plus, X, Copy } from 'lucide-react'
import Navigation from '@/components/Navigation'
import NFTExporter from '@/components/NFTExporter'
import Web3Minting from '@/components/Web3Minting'
import SimpleMinting from '@/components/SimpleMinting'
import Footer from '@/components/Footer'
import { initPRNG, getPRNG, createDerivedPRNG } from '@/lib/DeterministicPRNG'
import { config } from '@/lib/config'
import { useChainId } from 'wagmi'
import { contractAddresses } from '@/lib/web3'
import { getChainDisplayName } from '@/lib/networks'
import { Metadata } from 'next'
import Head from 'next/head'

// SEO metadata for the generator page
const metadata: Metadata = {
  title: "Rug Factory - Create Living Onchain Generative NFT Rugs | OnchainRugs",
  description: "Create living onchain generative NFT rugs that require your care. Each rug is a living NFT - completely onchain, generative, and dynamic. Custom text, 102 palettes, authentic physics. Mint directly on Shape L2 blockchain.",
  keywords: [
    "NFT generator", "create NFT", "generative art", "custom NFT", "rug NFT",
    "textile NFT", "woven art NFT", "blockchain art generator", "Shape L2 NFT",
    "living NFT", "aging NFT", "NFT minting", "custom text NFT"
  ],
  openGraph: {
    title: "Rug Factory - Create Fully Onchain Living Generative NFT Rugs",
    description: "Design and mint living onchain generative NFT rugs that require your care. Each rug is a living NFT - completely onchain, generative, and dynamic. Custom text, 102 palettes, authentic physics.",
    url: 'https://onchainrugs.xyz/generator',
    type: 'website',
    images: [
      {
        url: '/generator-og.png',
        width: 1200,
        height: 630,
        alt: 'Rug Factory - Create Onchain Rug NFTs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Rug Factory - Create Fully Onchain Living Generative NFT Rugs",
    description: "Design and mint living onchain generative NFT rugs that require your care. Each rug is a living NFT.",
    images: ['/generator-og.png'],
  },
}

export default function GeneratorPage() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId] // No fallback - safer to show error than use wrong contract
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSeed, setCurrentSeed] = useState(42)
  const [textInputs, setTextInputs] = useState([''])
  const [currentRowCount, setCurrentRowCount] = useState(1)
  const [palette, setPalette] = useState<any>(null)
  const [traits, setTraits] = useState<any>(null)
  const [stripeData, setStripeData] = useState<any[]>([])
  const [showDirt, setShowDirt] = useState(false)
  const [dirtLevel, setDirtLevel] = useState(0) // 0 = clean, 1 = 50% dirty, 2 = full dirty
  const [showTexture, setShowTexture] = useState(false)
  const [textureLevel, setTextureLevel] = useState(0) // 0 = none, 1 = 7 days, 2 = 30 days
  const [selectedFrameLevel, setSelectedFrameLevel] = useState(4) // 0=None, 1=Bronze, 2=Silver, 3=Gold, 4=Diamond (default to diamond)
  const [warpThickness, setWarpThickness] = useState(2) // Default warp thickness

  // Debounce timer for live updates
  const liveUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (liveUpdateTimerRef.current) {
        clearTimeout(liveUpdateTimerRef.current)
      }
    }
  }, [])

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
      console.log(`${label} copied to clipboard`)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const scriptsLoadedRef = useRef<Set<string>>(new Set())

  // Clean P5.js loading - no global pollution
  const loadP5 = () => {
    return new Promise<void>((resolve) => {
      // Check if P5.js is already loaded
      if (typeof window !== 'undefined' && (window as any).p5) {
        console.log('✅ P5.js already available')
        resolve()
        return
      }

      // Load P5.js from CDN
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/p5@1.11.10/lib/p5.min.js'
      script.onload = () => {
        console.log('✅ P5.js loaded successfully')
        resolve()
      }
      script.onerror = () => {
        console.error('❌ Failed to load P5.js from CDN')
        resolve() // Continue anyway
      }

      document.head.appendChild(script)
    })
  }

  // Load palette data (keeping it simple and accessible)
  const loadPaletteData = () => {
    return new Promise<void>((resolve) => {
      // For transparency and simplicity, we'll just use embedded palettes
      // This avoids loading issues and keeps everything in one place
      if (typeof window !== 'undefined') {
        ;(window as any).paletteCollections = getEmbeddedPalettes()
        console.log(`✅ Loaded ${getEmbeddedPalettes().length} palettes`)
      }
      resolve()
    })
  }

  // Get all available palettes (transparently accessible)
  const getEmbeddedPalettes = () => {
    return [
      // ===== GLOBAL PALETTES =====
      { name: "Classic Red & Black", colors: ['#8B0000', '#DC143C', '#B22222', '#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D'] },
      { name: "Natural Jute & Hemp", colors: ['#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#8B7355', '#A0522D', '#654321', '#2F2F2F'] },
      { name: "Coastal Blue & White", colors: ['#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#F8F8FF', '#F0F8FF', '#E6E6FA', '#B0C4DE'] },
      { name: "Rustic Farmhouse", colors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#F5DEB3', '#F4E4BC'] },
      { name: "Modern Gray & White", colors: ['#F5F5F5', '#FFFFFF', '#D3D3D3', '#C0C0C0', '#A9A9A9', '#808080', '#696969', '#2F2F2F'] },
      { name: "Autumn Harvest", colors: ['#8B4513', '#D2691E', '#CD853F', '#F4A460', '#8B0000', '#B22222', '#FF8C00', '#FFA500'] },
      { name: "Spring Garden", colors: ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#FF69B4', '#FFB6C1', '#87CEEB', '#F0E68C'] },
      { name: "Industrial Metal", colors: ['#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#000000'] },
      { name: "Mediterranean", colors: ['#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#F4A460', '#DEB887', '#87CEEB', '#4682B4'] },
      { name: "Scandinavian", colors: ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#6C757D', '#495057'] },
      { name: "Nordic Forest", colors: ['#2D5016', '#3A5F0B', '#4A7C59', '#5D8B66', '#6B8E23', '#8FBC8F', '#9ACD32', '#ADFF2F'] },
      { name: "Desert Sunset", colors: ['#CD853F', '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F', '#8B4513', '#A0522D', '#D2691E'] },
      { name: "Arctic Ice", colors: ['#F0F8FF', '#E6E6FA', '#B0C4DE', '#87CEEB', '#B0E0E6', '#F0FFFF', '#E0FFFF', '#F5F5F5'] },
      { name: "Tropical Paradise", colors: ['#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#32CD32', '#90EE90', '#98FB98', '#00CED1'] },
      { name: "Vintage Retro", colors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#BC8F8F', '#8B7355', '#F5DEB3', '#F4E4BC'] },
      { name: "Art Deco", colors: ['#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D', '#CD853F', '#F5DEB3', '#FFFFFF'] },
      { name: "Bohemian", colors: ['#8E44AD', '#9B59B6', '#E67E22', '#D35400', '#E74C3C', '#C0392B', '#16A085', '#1ABC9C'] },
      { name: "Minimalist", colors: ['#FFFFFF', '#F5F5F5', '#E0E0E0', '#CCCCCC', '#999999', '#666666', '#333333', '#000000'] },
      { name: "Corporate", colors: ['#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'] },
      { name: "Luxury", colors: ['#000000', '#2F2F2F', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F5DEB3', '#FFD700'] },
      { name: "Pastel Dreams", colors: ['#FFB6C1', '#FFC0CB', '#FFE4E1', '#F0E68C', '#98FB98', '#90EE90', '#87CEEB', '#E6E6FA'] },
      { name: "Ocean Depths", colors: ['#000080', '#191970', '#4169E1', '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#E0FFFF'] },
      { name: "Mountain Mist", colors: ['#2F4F4F', '#4A5D6B', '#5F7A7A', '#6B8E8E', '#87CEEB', '#B0C4DE', '#E6E6FA', '#F0F8FF'] },
      { name: "Sunset Glow", colors: ['#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#DC143C', '#8B0000', '#2F2F2F'] },

      // ===== INDIAN CULTURAL PALETTES =====
      { name: "Rajasthani", colors: ['#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'] },
      { name: "Kerala", colors: ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#00CED1', '#87CEEB', '#4682B4', '#000080'] },
      { name: "Gujarat", colors: ['#FF4500', '#FF6347', '#FFD700', '#FFA500', '#DC143C', '#4B0082', '#32CD32', '#FFFFFF'] },
      { name: "Bengal", colors: ['#228B22', '#32CD32', '#90EE90', '#F5DEB3', '#DEB887', '#8B4513', '#4682B4', '#000080'] },
      { name: "Kashmir", colors: ['#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'] },

      // ===== TAMIL CULTURAL PALETTES =====
      { name: "Chola Empire", colors: ['#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'] },
      { name: "Chera Dynasty", colors: ['#228B22', '#32CD32', '#90EE90', '#8B4513', '#A0522D', '#FFD700', '#00CED1', '#000080'] },
      { name: "Jamakalam", colors: ['#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#4B0082', '#000000'] },

      // ===== NATURAL DYE PALETTES =====
      { name: "Madder Root", colors: ['#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF6347', '#CD5C5C', '#F08080', '#FA8072'] },
      { name: "Turmeric", colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#DAA520', '#B8860B', '#CD853F'] },
      { name: "Neem", colors: ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'] },
      { name: "Marigold", colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#FF1493', '#FF69B4', '#FFB6C1'] },

      // ===== MADRAS CHECKS & TAMIL NADU INSPIRED PALETTES =====
      { name: "Madras Checks", colors: ['#8B0000', '#DC143C', '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#228B22', '#006400'] },
      { name: "Thanjavur Fresco", colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'] },

      // ===== WESTERN GHATS BIRDS PALETTES =====
      { name: "Indian Peacock", colors: ['#000080', '#191970', '#4169E1', '#4682B4', '#00CED1', '#40E0D0', '#48D1CC', '#20B2AA'] },
      { name: "Flamingo", colors: ['#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB', '#FF6347', '#FF4500', '#FF8C00', '#FFA500'] },
      { name: "Toucan", colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#000000', '#FFFFFF', '#FF1493'] },
      { name: "Malabar Trogon", colors: ['#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#000000', '#FFFFFF'] },

      // ===== HISTORICAL DYNASTY & CULTURAL PALETTES =====
      { name: "Pandyas", colors: ['#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'] },
      { name: "Maurya Empire", colors: ['#000080', '#191970', '#4169E1', '#4682B4', '#FFD700', '#FFA500', '#8B4513', '#A0522D'] },
      { name: "Buddhist", colors: ['#FFD700', '#FFA500', '#8B4513', '#A0522D', '#228B22', '#32CD32', '#90EE90', '#FFFFFF'] },

      // ===== FAMINE & HISTORICAL PERIOD PALETTES =====
      { name: "Indigo Famine", colors: ['#000080', '#191970', '#4169E1', '#4682B4', '#2F4F4F', '#696969', '#808080', '#A9A9A9'] },
      { name: "Bengal Famine", colors: ['#8B0000', '#DC143C', '#B22222', '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#000000'] },

      // ===== MADRAS GENERATOR GLOBAL PALETTES =====
      { name: "Natural Dyes", colors: ['#405BAA', '#B33A3A', '#D9A43B', '#1F1E1D', '#5A7A5A', '#8C5832', '#A48E7F', '#FAF1E3'] },
      { name: "Bleeding Vintage", colors: ['#3A62B3', '#C13D3D', '#D9A43B', '#7DAC9B', '#D87BA1', '#7A4E8A', '#F2E4BE', '#1F1E1D'] },
      { name: "Warm Tamil Madras", colors: ['#C13D3D', '#F5C03A', '#3E5F9A', '#88B0D3', '#ADC178', '#E77F37', '#FAF3EB', '#F2E4BE'] },
      { name: "Classic Red-Green", colors: ['#cc0033', '#ffee88', '#004477', '#ffffff', '#e63946', '#f1faee', '#a8dadc', '#457b9d'] },
      { name: "Vintage Tamil", colors: ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#ffd700', '#b8860b', '#8b0000', '#f7c873'] },
      { name: "Sunset Pondicherry", colors: ['#ffb347', '#ff6961', '#6a0572', '#fff8e7', '#1d3557', '#e63946', '#f7cac9', '#92a8d1'] },
      { name: "Madras Monsoon", colors: ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#ffd700', '#e94f37', '#393e41', '#3f88c5'] },
      { name: "Kanchipuram Gold", colors: ['#ffd700', '#b8860b', '#8b0000', '#fff8e7', '#cc0033', '#004477', '#e63946', '#f1faee'] },
      { name: "Madras Summer", colors: ['#f7c873', '#e94f37', '#393e41', '#3f88c5', '#fff8e7', '#ffb347', '#ff6961', '#1d3557'] },
      { name: "Pondy Pastel", colors: ['#f7cac9', '#92a8d1', '#034f84', '#f7786b', '#fff8e7', '#393e41', '#ffb347', '#e94f37'] },
      { name: "Tamil Sunrise", colors: ['#ffb347', '#ff6961', '#fff8e7', '#1d3557', '#e63946', '#f7c873', '#e94f37', '#393e41'] },
      { name: "Chettinad Spice", colors: ['#d72631', '#a2d5c6', '#077b8a', '#5c3c92', '#f4f4f4', '#ffd700', '#8b0000', '#1a2634'] },
      { name: "Kerala Onam", colors: ['#fff8e7', '#ffd700', '#e94f37', '#393e41', '#3f88c5', '#f7c873', '#ffb347', '#ff6961'] },
      { name: "Bengal Indigo", colors: ['#1a2634', '#3f88c5', '#f7c873', '#e94f37', '#fff8e7', '#ffd700', '#393e41', '#1d3557'] },
      { name: "Goa Beach", colors: ['#f7cac9', '#f7786b', '#034f84', '#fff8e7', '#393e41', '#ffb347', '#e94f37', '#3f88c5'] },
      { name: "Sri Lankan Tea", colors: ['#a8dadc', '#457b9d', '#e63946', '#f1faee', '#fff8e7', '#ffd700', '#8b0000', '#1d3557'] },
      { name: "African Madras", colors: ['#ffb347', '#e94f37', '#393e41', '#3f88c5', '#ffd700', '#f7c873', '#ff6961', '#1d3557'] },
      { name: "Ivy League", colors: ['#002147', '#a6192e', '#f4f4f4', '#ffd700', '#005a9c', '#00356b', '#ffffff', '#8c1515'] },

      // ===== ADDITIONAL UNIQUE PALETTES =====
      { name: "Yale Blue", colors: ['#00356b', '#ffffff', '#c4d8e2', '#8c1515'] },
      { name: "Harvard Crimson", colors: ['#a51c30', '#ffffff', '#000000', '#b7a57a'] },
      { name: "Cornell Red", colors: ['#b31b1b', '#ffffff', '#222222', '#e5e5e5'] },
      { name: "Princeton Orange", colors: ['#ff8f1c', '#000000', '#ffffff', '#e5e5e5'] },
      { name: "Dartmouth Green", colors: ['#00693e', '#ffffff', '#000000', '#a3c1ad'] },
      { name: "Indian Flag", colors: ['#ff9933', '#ffffff', '#138808', '#000080'] },
      { name: "Oxford Tartan", colors: ['#002147', '#c8102e', '#ffd700', '#ffffff', '#008272'] },
      { name: "Black Watch", colors: ['#1c2a3a', '#2e4a62', '#1e2d24', '#3a5f0b'] },
      { name: "Royal Stewart", colors: ['#e10600', '#ffffff', '#000000', '#ffd700', '#007a3d'] },
      { name: "Scottish Highland", colors: ['#005eb8', '#ffd700', '#e10600', '#ffffff', '#000000'] },
      { name: "French Riviera", colors: ['#0055a4', '#ffffff', '#ef4135', '#f7c873'] },
      { name: "Tokyo Metro", colors: ['#e60012', '#0089a7', '#f6aa00', '#ffffff'] },
      { name: "Cape Town Pastel", colors: ['#f7cac9', '#92a8d1', '#034f84', '#f7786b'] },
      { name: "Black & Red", colors: ['#000000', '#cc0033'] }
    ]
  }

  // Self-contained doormat generation (no external scripts needed)
  const initializeDoormat = () => {
    console.log('🎨 Initializing self-contained doormat generator...')

    // Configuration
    const config = {
      DOORMAT_WIDTH: 800,
      DOORMAT_HEIGHT: 1200,
      FRINGE_LENGTH: 30,
      WEFT_THICKNESS: 8,
      WARP_THICKNESS: 2,
      TEXT_SCALE: 2,
      MAX_CHARS: 11,
      MAX_TEXT_ROWS: 5
    }

    // Load color palettes from external file or fallback
    let colorPalettes = getEmbeddedPalettes() // Start with embedded as fallback

    if (typeof window !== 'undefined' && (window as any).paletteCollections) {
      colorPalettes = (window as any).paletteCollections
      console.log(`✅ Loaded external palettes: ${colorPalettes.length} palettes`)
    } else {
      console.log(`📦 Using embedded fallback palettes: ${colorPalettes.length} palettes`)
    }

    console.log(`🎨 Total palettes available: ${colorPalettes.length}`)

    // Character map for text embedding
    const characterMap = {
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
    
    // Global variables for NFTExporter
    const selectedPalette = colorPalettes[0]
    const stripeData: any[] = []
    const textData: any[] = []
    const doormatTextRows: string[] = []
    const warpThickness = config.WARP_THICKNESS
    
    // Text colors (chosen from palette) - MISSING FROM ORIGINAL
    const lightTextColor: any = null
    const darkTextColor: any = null
    
    // Expose minimal globals for NFTExporter
    if (typeof window !== 'undefined') {
      ;(window as any).selectedPalette = selectedPalette
      ;(window as any).stripeData = stripeData
      ;(window as any).DOORMAT_CONFIG = config
      ;(window as any).warpThickness = warpThickness
      ;(window as any).textData = textData
      ;(window as any).doormatTextRows = doormatTextRows
    }
    
    console.log('✅ Self-contained doormat generator initialized')
    return { config, colorPalettes, characterMap, selectedPalette, stripeData, textData, doormatTextRows, warpThickness }
  }

  // Create P5.js instance using original doormat.js logic
  const createP5Instance = () => {
    return new Promise<void>((resolve) => {
      if (typeof window !== 'undefined' && !(window as any).p5) {
        console.error('❌ P5.js not available')
        resolve()
        return
      }

      // Prevent multiple instances
      if (typeof window !== 'undefined' && (window as any).p5Instance) {
        console.log('⚠️ P5.js instance already exists, removing old one')
        ;(window as any).p5Instance.remove()
        delete (window as any).p5Instance
      }

      try {
        // Use original doormat.js setup and draw functions
        const p5Instance = typeof window !== 'undefined' ? new (window as any).p5((p: any) => {
          // Original setup function from doormat.js
      p.setup = () => {
            // Get config from window.doormatData (set during initialization)
            const baseDoormatData = (window as any).doormatData
            if (!baseDoormatData) {
              console.error('❌ Base doormatData not found in window')
              return
            }

            // Create canvas with swapped dimensions for 90-degree rotation (original logic)
            const canvas = p.createCanvas(baseDoormatData.config.DOORMAT_HEIGHT + (baseDoormatData.config.FRINGE_LENGTH * 4),
                                       baseDoormatData.config.DOORMAT_WIDTH + (baseDoormatData.config.FRINGE_LENGTH * 4))
            canvas.parent('canvas-container')
            // Let CSS handle positioning - don't set styles here
        p.pixelDensity(2)
        p.noLoop()

            // Initialize flip state from external injection (for smart contracts) - read once only
            const defaultFlipped = (window as any).__DEFAULT_FLIPPED__ === true
            ;(window as any).__RUG_FLIPPED__ = defaultFlipped

            console.log('🎨 P5.js canvas created with original dimensions')
            console.log('🔄 Default flip state:', defaultFlipped)

            // Trigger initial render
            p.redraw()
          }


          // Full rug drawing function (with true mirror flip)
          const drawFullRug = (p: any, doormatData: any, seed: number, isFlipped: boolean = false) => {
            // Use original doormat.js draw logic
            p.background(222, 222, 222)

            // Ensure PRNG is initialized with current seed before drawing
            initPRNG(seed)

            // Create derived PRNG for drawing operations
            const drawingPRNG = createDerivedPRNG(2000)

            // Apply transforms: translate to center, rotate 90°, mirror if flipped, translate back
            p.push()
            p.translate(p.width/2, p.height/2)
            p.rotate(p.PI/2)
            if (isFlipped) p.scale(1, -1)  // Vertical mirror flip for correct physical axis
            p.translate(-p.height/2, -p.width/2)

            // Draw the main doormat area
            p.push()
            p.translate(doormatData.config.FRINGE_LENGTH * 2, doormatData.config.FRINGE_LENGTH * 2)

            // Draw stripes (always in front order - transform handles flipping)
            for (const stripe of doormatData.stripeData) {
              drawStripeOriginal(p, stripe, doormatData, drawingPRNG, false) // Always front logic
            }

            // Add overall texture overlay if enabled
            const currentShowTexture = (window as any).showTexture || false
            const currentTextureLevel = (window as any).textureLevel || 0
            if (currentShowTexture && currentTextureLevel > 0) {
              drawTextureOverlayWithLevel(p, doormatData, currentTextureLevel)
            }

            // Draw fringe and selvedge (always front orientation - transform handles flipping)
            drawFringeOriginal(p, doormatData, drawingPRNG, false) // Always front logic
            drawSelvedgeEdgesOriginal(p, doormatData, drawingPRNG, false) // Always front logic

            p.pop()

            // Draw dirt overlay if enabled
            const currentShowDirt = (window as any).showDirt || false
            const currentDirtLevel = (window as any).dirtLevel || 0
            if (currentShowDirt && currentDirtLevel > 0) {
              drawDirtOverlay(p, doormatData, drawingPRNG, currentDirtLevel)
            }

            p.pop() // End all transforms

          }

          // P5 immediate-mode rendering - read ALL data from window
      p.draw = () => {
            // Read ALL data from authoritative window objects
            const doormatData = (window as any).__DOORMAT_DATA__
            const isFlipped = (window as any).__RUG_FLIPPED__ || false

            if (doormatData) {
              // Set authoritative text gate - no text on flipped side
              doormatData.__ALLOW_TEXT__ = !isFlipped

              // drawFullRug expects complete doormatData object with config
              drawFullRug(p, doormatData, doormatData.seed || 42, isFlipped)
            }
          }









          // Get intelligent pattern colors (same as text colors)
          const getPatternColors = (doormatData: any, prng: any) => {
            if (!doormatData.selectedPalette?.colors) return [p.color(100, 100, 100)]

            const palette = doormatData.selectedPalette.colors
            const intelligentColors = []

            // Use the same color theory as text - select high contrast colors
            for (let i = 0; i < Math.min(4, palette.length); i++) {
              const colorIndex = (i * 2 + prng.range(0, 2)) % palette.length
              intelligentColors.push(p.color(palette[colorIndex]))
            }

            return intelligentColors.length > 0 ? intelligentColors : [p.color(100, 100, 100)]
          }

        }) : null

        // Store instance for later use
        if (typeof window !== 'undefined') {
          ;(window as any).p5Instance = p5Instance
        }
        resolve()
      } catch (error) {
        console.error('❌ Failed to create P5.js instance:', error)
        resolve()
      }
    })
  }

// Wrong generateDoormatCore removed - correct one defined later
  const generateDoormatCore = (seed: number, doormatData: any) => {
    console.log('🎨 Generating doormat with seed:', seed)
    
    // Store seed globally for drawing function access
    if (typeof window !== 'undefined') {
      ;(window as any).currentSeed = seed
    }
    // Initialize deterministic PRNG for this generation
    initPRNG(seed)
    const prng = getPRNG()
    
    // Test PRNG determinism - log first few values
    console.log('🧪 PRNG Test - First 5 values:', [
      prng.next().toFixed(6),
      prng.next().toFixed(6), 
      prng.next().toFixed(6),
      prng.next().toFixed(6),
      prng.next().toFixed(6)
    ])
    
    // RARITY-BASED WARP THICKNESS SELECTION
    // Limited to 1-4 to prevent text clipping with 5 lines
    const warpThicknessWeights = {
      1: 0.10,  // 10% - Very thin
      2: 0.25,  // 25% chance (rare)
      3: 0.35,  // 35% chance (most common)
      4: 0.30   // 30% chance
    }
    
    const warpThicknessRoll = prng.next()
    let cumulativeWeight = 0
    let selectedWarpThickness = 3 // Default to most common
    
    console.log(`🎲 Warp Thickness Roll: ${warpThicknessRoll.toFixed(4)} (seed: ${seed})`)
    
    for (const [thickness, weight] of Object.entries(warpThicknessWeights)) {
      cumulativeWeight += weight
      console.log(`  Thickness ${thickness}: ${(weight * 100).toFixed(1)}% chance (cumulative: ${(cumulativeWeight * 100).toFixed(1)}%)`)
      if (warpThicknessRoll <= cumulativeWeight) {
        selectedWarpThickness = parseInt(thickness)
        console.log(`  ✅ SELECTED: Thickness ${thickness} (roll ${warpThicknessRoll.toFixed(4)} <= ${cumulativeWeight.toFixed(4)})`)
        break
      }
    }
    
    doormatData.warpThickness = selectedWarpThickness
    
    // Generate stripes with seeded randomness
    doormatData.stripeData = generateStripes(doormatData, seed)
    setStripeData(doormatData.stripeData) // Update React state
    setPalette(doormatData.selectedPalette) // Update palette React state


    // Update text colors and generate text data (MISSING FROM ORIGINAL)
    if (typeof window !== 'undefined' && (window as any).p5Instance) {
      updateTextColors((window as any).p5Instance, doormatData)
      generateTextData(doormatData)
    }
    
    // Write COMPLETE doormatData to single authoritative window object
    if (typeof window !== 'undefined') {
      ;(window as any).__DOORMAT_DATA__ = {
        // Include ALL necessary data for drawFullRug
        ...doormatData, // config, characterMap, etc.
        seed: seed,
        stripeData: doormatData.stripeData,
        selectedPalette: doormatData.selectedPalette,
        warpThickness: doormatData.warpThickness,
        textData: doormatData.textData,
        textRows: doormatData.doormatTextRows,
        traits: doormatData.traits || {}
      }

      // Keep legacy properties for backward compatibility
      ;(window as any).selectedPalette = doormatData.selectedPalette
      ;(window as any).stripeData = doormatData.stripeData
      ;(window as any).DOORMAT_CONFIG = doormatData.config
      ;(window as any).warpThickness = doormatData.warpThickness
      ;(window as any).textData = doormatData.textData
      ;(window as any).doormatTextRows = doormatData.doormatTextRows
    }
    
    // Trigger p5 redraw (only redraw mechanism)
    if (typeof window !== 'undefined' && (window as any).p5Instance) {
      (window as any).p5Instance.redraw()
    }
  }

  // Generate stripes with seeded randomness (complete original logic)
  const generateStripes = (doormatData: any, seed: number) => {
    const stripes = []
    const { config, colorPalettes } = doormatData
    
    // Use derived PRNG for stripe generation (based on actual seed)
    const stripePRNG = createDerivedPRNG(seed)
    
    // OBSCURED RARITY SYSTEM - Multi-layer mathematical transformations
    // Rarity emerges from complex calculations, not explicit percentage labels
    const rarityRoll = stripePRNG.next()
    const secondaryRoll = stripePRNG.next()
    const tertiaryRoll = stripePRNG.next()

    // Seed transformation layer (makes input-output relationship non-obvious)
    const seedTransform = Math.sin(seed * 0.001) * Math.cos(seed * 0.002) + Math.sin(seed * 0.003)
    const transformedSeed = (seedTransform + 1) / 2 // Normalize to 0-1

    // Complex transformation using multiple trigonometric and exponential functions
    const transformedRarity = Math.sin(rarityRoll * Math.PI * 2.3) * Math.cos(secondaryRoll * Math.PI * 1.7) +
                              Math.sin(tertiaryRoll * Math.PI * 3.1) * 0.3 +
                              transformedSeed * 0.2
    const normalizedRarity = (transformedRarity + 1.3) / 2.6 // Normalize to 0-1 range

    const complexityFactor = Math.pow(tertiaryRoll, 2.718) % 1
    const dynamicFactor = Math.sin(rarityRoll * secondaryRoll * Math.PI) * 0.1

    // Dynamic tier determination using non-obvious, shifting thresholds
    let selectedRarity = 'Common'
    const baseThresholds = {
      legendary: 0.085 + (complexityFactor * 0.03) + (dynamicFactor * 2),
      epic: 0.22 + (secondaryRoll * 0.05) - (complexityFactor * 0.02),
      rare: 0.42 + (tertiaryRoll * 0.04) + (dynamicFactor * 1.5),
      uncommon: 0.65 + (rarityRoll * 0.03) - (secondaryRoll * 0.02)
    }

    if (normalizedRarity < baseThresholds.legendary) {
      selectedRarity = 'Legendary'
    } else if (normalizedRarity < baseThresholds.epic) {
      selectedRarity = 'Epic'
    } else if (normalizedRarity < baseThresholds.rare) {
      selectedRarity = 'Rare'
    } else if (normalizedRarity < baseThresholds.uncommon) {
      selectedRarity = 'Uncommon'
    }

    // MANUAL PALETTE CONTROL - Explicit arrays for precise rarity tuning
    const getTierPalettes = (tier: string, seed: number) => {
      // Manually curated palette assignments for each rarity tier
      // Easy to modify during development and testing
      const legendaryPalettes = [
        "Buddhist", "Maurya Empire", "Chola Empire", "Indigo Famine", "Bengal Famine", "Jamakalam"
      ]
      const epicPalettes = [
        "Indian Peacock", "Flamingo", "Toucan", "Madras Checks", "Kanchipuram Gold", "Natural Dyes",
        "Bleeding Vintage", "Tamil Classical", "Sangam Era", "Pandyas", "Maratha Empire"
      ]
      const rarePalettes = [
        "Rajasthani", "Kerala", "Gujarat", "Bengal", "Kashmir", "Chera Dynasty", "Madder Root",
        "Turmeric", "Neem", "Marigold", "Thanjavur Fresco", "Malabar Trogon", "Maurya Empire"
      ]
      const uncommonPalettes = [
        "Tamil Nadu Temple", "Kerala Onam", "Chettinad Spice", "Madras Monsoon", "Bengal Indigo",
        "Goa Beach", "Sri Lankan Tea", "African Madras", "Ivy League", "Tamil Sunrise", "Chettinad Spice"
      ]

      switch(tier) {
        case 'Legendary':
          return legendaryPalettes
        case 'Epic':
          return epicPalettes
        case 'Rare':
          return rarePalettes
        case 'Uncommon':
          return uncommonPalettes
        default:
          // Common: all palettes not assigned to higher tiers
          const allHigherTierPalettes = [
            ...legendaryPalettes,
            ...epicPalettes,
            ...rarePalettes,
            ...uncommonPalettes
          ]
          return colorPalettes
            .map(p => p.name)
            .filter(paletteName => !allHigherTierPalettes.includes(paletteName))
      }
    }

    const tierPalettes = getTierPalettes(selectedRarity, seed)
    
    // Select random palette from the rarity tier using PRNG
    const tierPaletteIndex = Math.floor(stripePRNG.next() * tierPalettes.length)
    const selectedPaletteName = tierPalettes[tierPaletteIndex]
    const palette = colorPalettes.find(p => p.name === selectedPaletteName) || colorPalettes[0]
    
    doormatData.selectedPalette = palette
    console.log(`🎯 Generated ${selectedRarity} rarity doormat with palette: ${palette.name}`)
    console.log(`📊 Available ${selectedRarity} palettes: ${tierPalettes.length} options`)
    console.log(`🎨 Selected palette index: ${tierPaletteIndex}/${tierPalettes.length - 1}`)
    
    // Original doormat.js stripe generation logic
    const totalHeight = config.DOORMAT_HEIGHT
    let currentY = 0

    // Track previous stripe's weave type to prevent consecutive mixed stripes
    let previousWeaveType = null
    
    // Decide stripe density pattern for this doormat
    const densityType = stripePRNG.next()
    let minHeight, maxHeight
    
    if (densityType < 0.2) {
      // 20% chance: High density (many thin stripes)
      minHeight = 15
      maxHeight = 35
    } else if (densityType < 0.4) {
      // 20% chance: Low density (fewer thick stripes) 
      minHeight = 50
      maxHeight = 90
    } else {
      // 60% chance: Mixed density (varied stripe sizes)
      minHeight = 20
      maxHeight = 80
    }
    
    while (currentY < totalHeight) {
      // Dynamic stripe height based on density type
      let stripeHeight
      if (densityType >= 0.4) {
        // Mixed density: add more randomization within the range
        const variationType = stripePRNG.next()
        if (variationType < 0.3) {
          // 30% thin stripes within mixed
          stripeHeight = minHeight + (stripePRNG.next() * 20)
        } else if (variationType < 0.6) {
          // 30% medium stripes within mixed
          stripeHeight = minHeight + 15 + (stripePRNG.next() * (maxHeight - minHeight - 30))
        } else {
          // 40% thick stripes within mixed
          stripeHeight = maxHeight - 25 + (stripePRNG.next() * 25)
        }
      } else {
        // High/Low density: more consistent sizing
        stripeHeight = minHeight + (stripePRNG.next() * (maxHeight - minHeight))
      }
      
      // Ensure we don't exceed the total height
      if (currentY + stripeHeight > totalHeight) {
        stripeHeight = totalHeight - currentY
      }
      
      // Select colors for this stripe
      const primaryColor = palette.colors[Math.floor(stripePRNG.next() * palette.colors.length)]
      
      // RARITY-BASED SECONDARY COLOR GENERATION
      // Make blended colors rarer based on overall rarity
      let secondaryColorChance = 0.15 // Base 15% chance
      
      if (selectedRarity === 'Legendary') {
        secondaryColorChance = 0.4 // 40% chance for Legendary
      } else if (selectedRarity === 'Epic') {
        secondaryColorChance = 0.3 // 30% chance for Epic
      } else if (selectedRarity === 'Rare') {
        secondaryColorChance = 0.25 // 25% chance for Rare
      } else if (selectedRarity === 'Uncommon') {
        secondaryColorChance = 0.2 // 20% chance for Uncommon
      }
      // Common keeps 15% chance
      
      // Log secondary color chance for first stripe only
      if (currentY === 0) {
        console.log(`🎨 ${selectedRarity} Secondary Color Chance: ${(secondaryColorChance * 100).toFixed(1)}%`)
      }
      
      const hasSecondaryColor = stripePRNG.next() < secondaryColorChance
      const secondaryColor = hasSecondaryColor ? palette.colors[Math.floor(stripePRNG.next() * palette.colors.length)] : null
      
      // RARITY-BASED WEAVE PATTERN SELECTION
      // Make complex patterns rarer based on overall rarity
      const weaveRand = stripePRNG.next()
      let weaveType
      
      // Adjust probabilities based on palette rarity
      let solidChance = 0.6, texturedChance = 0.2, mixedChance = 0.2
      
      if (selectedRarity === 'Legendary') {
        // Legendary: More complex patterns
        solidChance = 0.3
        texturedChance = 0.3
        mixedChance = 0.4
      } else if (selectedRarity === 'Epic') {
        // Epic: Balanced with more complexity
        solidChance = 0.4
        texturedChance = 0.3
        mixedChance = 0.3
      } else if (selectedRarity === 'Rare') {
        // Rare: Slightly more complex
        solidChance = 0.5
        texturedChance = 0.25
        mixedChance = 0.25
      } else if (selectedRarity === 'Uncommon') {
        // Uncommon: Slightly more complex
        solidChance = 0.55
        texturedChance = 0.25
        mixedChance = 0.2
      }
      // Common keeps original probabilities
      
      // Log weave pattern probabilities for first stripe only
      if (currentY === 0) {
        console.log(`🎨 ${selectedRarity} Weave Pattern Probabilities:`)
        console.log(`  Solid: ${(solidChance * 100).toFixed(1)}%, Textured: ${(texturedChance * 100).toFixed(1)}%, Mixed: ${(mixedChance * 100).toFixed(1)}%`)
      }
      
      // Prevent consecutive mixed stripes to avoid text obfuscation
      if (weaveRand < solidChance) {
        weaveType = 's'  // solid
      } else if (weaveRand < solidChance + texturedChance) {
        weaveType = 't'  // textured
      } else {
        // Only use mixed if we actually have a secondary color AND previous stripe wasn't mixed
        const wantsMixed = hasSecondaryColor && previousWeaveType !== 'm'
        weaveType = wantsMixed ? 'm' : 's'  // mixed only if secondary color exists AND not consecutive, otherwise fallback to solid
      }
      
      // Create stripe object (original structure)
      const stripe = {
        y: currentY,
        height: stripeHeight,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        weaveType: weaveType,
        warpVariation: stripePRNG.next() * 0.4 + 0.1 // How much the weave varies
      }
      
      stripes.push(stripe)
      previousWeaveType = weaveType  // Track for preventing consecutive mixed stripes
      currentY += stripeHeight
    }
    
    return stripes
  }

  // Original doormat.js drawStripe function
  const drawStripeOriginal = (p: any, stripe: any, doormatData: any, drawingPRNG: any, isFlipped: boolean = false) => {
    const config = doormatData.config
    const warpSpacing = doormatData.warpThickness + 1
    const weftSpacing = config.WEFT_THICKNESS + 1

    // Draw character outlines first (for mixed weaves)
    drawCharacterOutlines(p, stripe, doormatData)

    // First, draw the warp threads (vertical) as the foundation
    for (let x = 0; x < config.DOORMAT_WIDTH; x += warpSpacing) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        const warpColor = p.color(stripe.primaryColor)
        
        // Check if this position should be modified for text (only on front side)
        let isTextPixel = false
        if (doormatData.__ALLOW_TEXT__ && doormatData.textData && doormatData.textData.length > 0) {
          for (const textPixel of doormatData.textData) {
            if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                y >= textPixel.y && y < textPixel.y + textPixel.height) {
              isTextPixel = true
              break
            }
          }
        }
        
        // Add subtle variation to warp threads
        let r = p.red(warpColor) + drawingPRNG.range(-15, 15)
        let g = p.green(warpColor) + drawingPRNG.range(-15, 15)
        let b = p.blue(warpColor) + drawingPRNG.range(-15, 15)
        
        // Handle text pixels in warp threads
        if (isTextPixel) {
          // Draw shadow for text
          p.fill(0, 0, 0, 120)
          p.noStroke()
          const warpCurve = p.sin(y * 0.05) * 0.5
          p.rect(x + warpCurve + 0.5, y + 0.5, doormatData.warpThickness, weftSpacing)

          // Use intelligent text color selection for warp threads
          if (stripe.weaveType === 'm' && stripe.secondaryColor) {
            // For mixed weaves, choose text color that contrasts best with BOTH colors
            const primaryBrightness = (p.red(p.color(stripe.primaryColor)) + p.green(p.color(stripe.primaryColor)) + p.blue(p.color(stripe.primaryColor))) / 3
            const secondaryBrightness = (p.red(p.color(stripe.secondaryColor)) + p.green(p.color(stripe.secondaryColor)) + p.blue(p.color(stripe.secondaryColor))) / 3

            // Test contrast with black vs white
            const blackContrastPrimary = Math.abs(primaryBrightness - 0)
            const blackContrastSecondary = Math.abs(secondaryBrightness - 0)
            const whiteContrastPrimary = Math.abs(primaryBrightness - 255)
            const whiteContrastSecondary = Math.abs(secondaryBrightness - 255)

            // Use the color that gives better minimum contrast
            const blackMinContrast = Math.min(blackContrastPrimary, blackContrastSecondary)
            const whiteMinContrast = Math.min(whiteContrastPrimary, whiteContrastSecondary)

            if (whiteMinContrast > blackMinContrast) {
              r = 255; g = 255; b = 255 // White
            } else {
              r = 0; g = 0; b = 0 // Black
            }
          } else {
            r = 0; g = 0; b = 0 // Black for warp threads
          }
        } else {
          // Normal warp thread color
          r = p.red(warpColor) + drawingPRNG.range(-15, 15)
          g = p.green(warpColor) + drawingPRNG.range(-15, 15)
          b = p.blue(warpColor) + drawingPRNG.range(-15, 15)
        }

        r = p.constrain(r, 0, 255)
        g = p.constrain(g, 0, 255)
        b = p.constrain(b, 0, 255)

        p.fill(r, g, b)
        p.noStroke()

        // Draw warp thread with slight curve for natural look
        const warpCurve = p.sin(y * 0.05) * 0.5
        p.rect(x + warpCurve, y, doormatData.warpThickness, weftSpacing)
      }
    }
    
    // Now draw the weft threads (horizontal) that interlace with warp
    for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
      for (let x = 0; x < config.DOORMAT_WIDTH; x += warpSpacing) {
        let weftColor = p.color(stripe.primaryColor)

        // Add variation based on weave type
        if (stripe.weaveType === 'm' && stripe.secondaryColor) {
          if (p.noise(x * 0.1, y * 0.1) > 0.5) {
            weftColor = p.color(stripe.secondaryColor)
          }
        } else if (stripe.weaveType === 't') {
          const noiseVal = p.noise(x * 0.05, y * 0.05)
          weftColor = p.lerpColor(p.color(stripe.primaryColor), p.color(255), noiseVal * 0.15)
        }
        
        // Check if this position should be modified for text (only on front side)
        let isTextPixel = false
        if (doormatData.__ALLOW_TEXT__ && doormatData.textData && doormatData.textData.length > 0) {
          for (const textPixel of doormatData.textData) {
            if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                y >= textPixel.y && y < textPixel.y + textPixel.height) {
              isTextPixel = true
              break
            }
          }
        }
        
        // Add fabric irregularities
        let r = p.red(weftColor) + drawingPRNG.range(-20, 20)
        let g = p.green(weftColor) + drawingPRNG.range(-20, 20)
        let b = p.blue(weftColor) + drawingPRNG.range(-20, 20)

        // Handle text pixels with special rendering
        if (isTextPixel) {
          // Draw shadow for text (works on all backgrounds)
          p.fill(0, 0, 0, 120) // Semi-transparent black shadow
          p.noStroke()
          const weftCurve = p.cos(x * 0.05) * 0.5
          p.rect(x + 0.5, y + weftCurve + 0.5, warpSpacing, config.WEFT_THICKNESS)

          // Use high contrast text color
          if (stripe.weaveType === 'm' && stripe.secondaryColor) {
            // For mixed weaves: analyse local background and choose a high-contrast colour
            const sampleColors: any[] = []
            const checkRadius = 2
            const stripeWidth = doormatData.config?.DOORMAT_WIDTH || config.DOORMAT_WIDTH

            // Always include the current weft colour
            sampleColors.push(p.color(weftColor))

            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
              for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                if (dx === 0 && dy === 0) continue

                const checkX = x + dx
                const checkY = y + dy

                if (checkY < stripe.y || checkY >= stripe.y + stripe.height) continue
                if (checkX < 0 || checkX >= stripeWidth) continue

                let checkWeftColor = p.color(stripe.primaryColor)
                const noiseVal = p.noise(checkX * 0.1, checkY * 0.1)
                if (noiseVal > 0.5) {
                  checkWeftColor = p.color(stripe.secondaryColor)
                }
                sampleColors.push(checkWeftColor)
              }
            }

            if (sampleColors.length === 0) {
              sampleColors.push(p.color(stripe.primaryColor))
            }

            const toKey = (colorObj: any) => {
              return [Math.round(p.red(colorObj)), Math.round(p.green(colorObj)), Math.round(p.blue(colorObj))].join('-')
            }

            const toRelativeLuminance = (colorObj: any) => {
              const convert = (value: number) => {
                const channel = value / 255
                return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
              }
              const rLum = convert(p.red(colorObj))
              const gLum = convert(p.green(colorObj))
              const bLum = convert(p.blue(colorObj))
              return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum
            }

            const contrastRatio = (a: any, b: any) => {
              const lumA = toRelativeLuminance(a)
              const lumB = toRelativeLuminance(b)
              const lighter = Math.max(lumA, lumB)
              const darker = Math.min(lumA, lumB)
              return (lighter + 0.05) / (darker + 0.05)
            }

            // CIE Lab color space conversion for better perceptual color differences
            const rgbToXyz = (r: number, g: number, b: number) => {
              // Normalize RGB to 0-1
              r = r / 255
              g = g / 255
              b = b / 255

              // Linearize RGB
              r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
              g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
              b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

              // Convert to XYZ
              const x = r * 0.4124 + g * 0.3576 + b * 0.1805
              const y = r * 0.2126 + g * 0.7152 + b * 0.0722
              const z = r * 0.0193 + g * 0.1192 + b * 0.9505

              return { x, y, z }
            }

            const xyzToLab = (x: number, y: number, z: number) => {
              // Normalize by D65 white point
              x = x / 0.95047
              y = y / 1.00000
              z = z / 1.08883

              // Lab function
              const f = (t: number) => t > Math.pow(6/29, 3) ? Math.pow(t, 1/3) : (1/3) * Math.pow(29/6, 2) * t + 4/29

              const L = 116 * f(y) - 16
              const a = 500 * (f(x) - f(y))
              const b_lab = 200 * (f(y) - f(z))

              return { L, a, b: b_lab }
            }

            const rgbToLab = (color: any) => {
              const { x, y, z } = rgbToXyz(p.red(color), p.green(color), p.blue(color))
              return xyzToLab(x, y, z)
            }

            // CIEDE2000 color difference formula
            const deltaE2000 = (lab1: any, lab2: any) => {
              const { L: L1, a: a1, b: b1 } = lab1
              const { L: L2, a: a2, b: b2 } = lab2

              const kL = 1, kC = 1, kH = 1

              const deltaLPrime = L2 - L1
              const LBar = (L1 + L2) / 2

              const C1 = Math.sqrt(a1 * a1 + b1 * b1)
              const C2 = Math.sqrt(a2 * a2 + b2 * b2)
              const CBar = (C1 + C2) / 2

              const aPrime1 = a1 * (1 + 0.5 * (Math.sqrt(Math.pow(CBar, 7) / (Math.pow(CBar, 7) + Math.pow(25, 7)))))
              const aPrime2 = a2 * (1 + 0.5 * (Math.sqrt(Math.pow(CBar, 7) / (Math.pow(CBar, 7) + Math.pow(25, 7)))))

              const CPrime1 = Math.sqrt(aPrime1 * aPrime1 + b1 * b1)
              const CPrime2 = Math.sqrt(aPrime2 * aPrime2 + b2 * b2)
              const CBarPrime = (CPrime1 + CPrime2) / 2

              const deltaCPrime = CPrime2 - CPrime1

              const hPrime1 = Math.atan2(b1, aPrime1) * 180 / Math.PI
              const hPrime2 = Math.atan2(b2, aPrime2) * 180 / Math.PI
              const deltahPrime = Math.abs(hPrime1 - hPrime2) <= 180 ? hPrime2 - hPrime1 : (hPrime2 - hPrime1 > 180 ? hPrime2 - hPrime1 - 360 : hPrime2 - hPrime1 + 360)
              const deltaHPrime = 2 * Math.sqrt(CPrime1 * CPrime2) * Math.sin(deltahPrime * Math.PI / 360)

              const HBarPrime = Math.abs(hPrime1 - hPrime2) <= 180 ? (hPrime1 + hPrime2) / 2 : (hPrime1 + hPrime2 >= 360 ? (hPrime1 + hPrime2) / 2 : (hPrime1 + hPrime2 + 360) / 2)

              const T = 1 - 0.17 * Math.cos(HBarPrime * Math.PI / 180 - 30) + 0.24 * Math.cos(2 * HBarPrime * Math.PI / 180) + 0.32 * Math.cos(3 * HBarPrime * Math.PI / 180 + 6) - 0.20 * Math.cos(4 * HBarPrime * Math.PI / 180 - 63)

              const SL = 1 + (0.015 * Math.pow(LBar - 50, 2)) / Math.sqrt(20 + Math.pow(LBar - 50, 2))
              const SC = 1 + 0.045 * CBarPrime
              const SH = 1 + 0.015 * CBarPrime * T

              const RT = -Math.sin(2 * (HBarPrime * Math.PI / 180 - 55) * Math.PI / 180) * (2 * Math.sqrt(Math.pow(CBarPrime, 7) / (Math.pow(CBarPrime, 7) + Math.pow(25, 7))))

              const kL_SL = kL * SL
              const kC_SC = kC * SC
              const kH_SH = kH * SH

              const termL = deltaLPrime / kL_SL
              const termC = deltaCPrime / kC_SC
              const termH = deltaHPrime / kH_SH

              return Math.sqrt(termL * termL + termC * termC + termH * termH + RT * termC * termH)
            }

            const perceptualColorDistance = (a: any, b: any) => {
              const lab1 = rgbToLab(a)
              const lab2 = rgbToLab(b)
              return deltaE2000(lab1, lab2)
            }

            const primaryColor = p.color(stripe.primaryColor)
            const secondaryColor = p.color(stripe.secondaryColor)

            // Use perceptual distance threshold (delta E > 20 is considered different colors)
            const distinctThreshold = 20
            const isDistinct = (candidate: any) => {
              return perceptualColorDistance(candidate, primaryColor) > distinctThreshold &&
                     perceptualColorDistance(candidate, secondaryColor) > distinctThreshold
            }

            // BULLETPROOF SOLUTION: For mixed weaves, use palette colors NOT used in stripe
            const candidateColors: any[] = []
            const candidateKeys = new Set<string>()

            // Simple function to add color to candidates
            const addColor = (color: any) => {
              const key = Math.round(p.red(color)) + '-' + Math.round(p.green(color)) + '-' + Math.round(p.blue(color))
              if (!candidateKeys.has(key)) {
                candidateKeys.add(key)
                candidateColors.push(color)
              }
            }

            // Get all palette colors as p5.Color objects
            const allPaletteColors: any[] = []
            if (doormatData.selectedPalette?.colors?.length) {
              for (const paletteColor of doormatData.selectedPalette.colors) {
                allPaletteColors.push(p.color(paletteColor))
              }
            }

            // Create a simple set of used colors (primary + secondary)
            const usedColors = new Set<string>()
            const primaryKey = Math.round(p.red(primaryColor)) + '-' + Math.round(p.green(primaryColor)) + '-' + Math.round(p.blue(primaryColor))
            const secondaryKey = Math.round(p.red(secondaryColor)) + '-' + Math.round(p.green(secondaryColor)) + '-' + Math.round(p.blue(secondaryColor))
            usedColors.add(primaryKey)
            usedColors.add(secondaryKey)

            // Find unused palette colors
            const unusedPaletteColors: any[] = []
            for (const paletteColor of allPaletteColors) {
              const colorKey = Math.round(p.red(paletteColor)) + '-' + Math.round(p.green(paletteColor)) + '-' + Math.round(p.blue(paletteColor))
              if (!usedColors.has(colorKey)) {
                unusedPaletteColors.push(paletteColor)
              }
            }

            // Use unused colors with subtle adjustment for contrast
            for (const unusedColor of unusedPaletteColors) {
              // Use much more subtle darkening to preserve color identity
              const lightness = (p.red(unusedColor) + p.green(unusedColor) + p.blue(unusedColor)) / (3 * 255)
              const darkenAmount = lightness > 0.7 ? 0.15 : lightness > 0.4 ? 0.2 : 0.25 // Less darkening for lighter colors
              const adjusted = p.lerpColor(unusedColor, p.color(0, 0, 0), darkenAmount)
              addColor(adjusted)
            }

            // If no unused colors, use ALL palette colors with subtle adjustment as fallback
            if (candidateColors.length === 0) {
              for (const paletteColor of allPaletteColors) {
                const lightness = (p.red(paletteColor) + p.green(paletteColor) + p.blue(paletteColor)) / (3 * 255)
                const darkenAmount = lightness > 0.7 ? 0.15 : lightness > 0.4 ? 0.2 : 0.25
                const adjusted = p.lerpColor(paletteColor, p.color(0, 0, 0), darkenAmount)
                addColor(adjusted)
              }
            }

            // Enhanced evaluation using multiple contrast metrics
            const evaluateCandidates = (pool: any[]) => {
              let bestCandidate = pool[0]
              let bestScore = -1

              for (const candidate of pool) {
                // Calculate multiple contrast metrics
                let minContrastRatio = Infinity
                let avgColorDistance = 0
                let minPerceptualDistance = Infinity

                for (const sampleColor of sampleColors) {
                  // WCAG contrast ratio (brightness-based)
                  const ratio = contrastRatio(candidate, sampleColor)
                  if (ratio < minContrastRatio) {
                    minContrastRatio = ratio
                  }

                  // Perceptual color distance (CIEDE2000)
                  const perceptualDist = perceptualColorDistance(candidate, sampleColor)
                  if (perceptualDist < minPerceptualDistance) {
                    minPerceptualDistance = perceptualDist
                  }

                  avgColorDistance += perceptualDist
                }
                avgColorDistance /= sampleColors.length

                // Combined score: prioritize perceptual distance, then WCAG contrast
                // Weight perceptual distance more heavily as it's more accurate
                const perceptualWeight = 0.7
                const contrastWeight = 0.3

                // Normalize perceptual distance (higher is better for contrast)
                const normalizedPerceptual = Math.min(minPerceptualDistance / 50, 1)
                // Normalize contrast ratio (WCAG AA requires 4.5:1, AAA requires 7:1)
                const normalizedContrast = Math.min(minContrastRatio / 7, 1)

                const combinedScore = perceptualWeight * normalizedPerceptual + contrastWeight * normalizedContrast

                if (combinedScore > bestScore) {
                  bestScore = combinedScore
                  bestCandidate = candidate
                }
              }
              return { bestCandidate, bestScore }
            }

            // For mixed weaves, we already filtered to only palette colors above
            // Just evaluate what we have
            let { bestCandidate, bestScore } = evaluateCandidates(candidateColors)

            // Enhanced fallback logic: If still no good contrast, use ALL palette colors with multiple variations
            const desiredCombinedScore = 0.6 // Require at least 60% of maximum possible contrast
            if (bestScore < desiredCombinedScore && allPaletteColors.length > 0) {
              const allPaletteCandidates: any[] = []

              // Try multiple variations of palette colors with subtle adjustments
              for (const paletteColor of allPaletteColors) {
                const lightness = (p.red(paletteColor) + p.green(paletteColor) + p.blue(paletteColor)) / (3 * 255)

                // Darkened version (for light backgrounds) - much more subtle
                const darkenAmount = lightness > 0.7 ? 0.15 : lightness > 0.4 ? 0.2 : 0.25
                const darkenedColor = p.lerpColor(paletteColor, p.color(0, 0, 0), darkenAmount)
                allPaletteCandidates.push(darkenedColor)

                // Lightened version (for dark backgrounds) - subtle lightening
                const lightenAmount = lightness < 0.3 ? 0.2 : lightness < 0.6 ? 0.15 : 0.1
                const lightenedColor = p.lerpColor(paletteColor, p.color(255, 255, 255), lightenAmount)
                allPaletteCandidates.push(lightenedColor)

                // High contrast colors using simple HSV-based complementary approach
                const r = p.red(paletteColor) / 255
                const g = p.green(paletteColor) / 255
                const b = p.blue(paletteColor) / 255

                // Calculate brightness and create high contrast alternatives
                const brightness = (r + g + b) / 3

                // Create high contrast color by inverting brightness while keeping hue
                const contrastR = brightness > 0.5 ? Math.max(0, r - 0.4) : Math.min(1, r + 0.4)
                const contrastG = brightness > 0.5 ? Math.max(0, g - 0.4) : Math.min(1, g + 0.4)
                const contrastB = brightness > 0.5 ? Math.max(0, b - 0.4) : Math.min(1, b + 0.4)

                allPaletteCandidates.push(p.color(contrastR * 255, contrastG * 255, contrastB * 255))
              }

              ;({ bestCandidate } = evaluateCandidates(allPaletteCandidates))
            }

            // For mixed weaves: Use shadow effect (matching rug-algo.js)
            r = p.red(bestCandidate)
            g = p.green(bestCandidate)
            b = p.blue(bestCandidate)
          } else {
            // For solid and textured weaves, use current logic
            const bgBrightness = (p.red(weftColor) + p.green(weftColor) + p.blue(weftColor)) / 3
            const tc = bgBrightness < 128 ? doormatData.lightTextColor : doormatData.darkTextColor
            r = p.red(tc); g = p.green(tc); b = p.blue(tc)
          }
        } else {
          // Normal thread color
          r = p.red(weftColor) + drawingPRNG.range(-20, 20)
          g = p.green(weftColor) + drawingPRNG.range(-20, 20)
          b = p.blue(weftColor) + drawingPRNG.range(-20, 20)
        }

        r = p.constrain(r, 0, 255)
        g = p.constrain(g, 0, 255)
        b = p.constrain(b, 0, 255)

        p.fill(r, g, b)
        p.noStroke()

        // Draw weft thread with slight curve
        const weftCurve = p.cos(x * 0.05) * 0.5
        p.rect(x, y + weftCurve, warpSpacing, config.WEFT_THICKNESS)
      }
    }
    
    // Add the interlacing effect - make some threads appear to go over/under
    for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing * 2) {
      for (let x = 0; x < config.DOORMAT_WIDTH; x += warpSpacing * 2) {
        // Create shadow effect for threads that appear to go under
        p.fill(0, 0, 0, 40)
        p.noStroke()
        p.rect(x + 1, y + 1, warpSpacing - 2, weftSpacing - 2)
      }
    }
    
    // Add subtle highlights for threads that appear to go over
    for (let y = stripe.y + weftSpacing; y < stripe.y + stripe.height; y += weftSpacing * 2) {
      for (let x = warpSpacing; x < config.DOORMAT_WIDTH; x += warpSpacing * 2) {
        p.fill(255, 255, 255, 30)
        p.noStroke()
        p.rect(x, y, warpSpacing - 1, weftSpacing - 1)
      }
    }
  }

  // Original doormat.js drawTextureOverlay function
  const drawTextureOverlayOriginal = (p: any, doormatData: any) => {
    const config = doormatData.config
    p.push()
    p.blendMode(p.MULTIPLY)
    
    // Create subtle hatching effect like in the diagram
    for (let x = 0; x < config.DOORMAT_WIDTH; x += 2) {
      for (let y = 0; y < config.DOORMAT_HEIGHT; y += 2) {
        const noiseVal = p.noise(x * 0.02, y * 0.02)
        const hatchingIntensity = p.map(noiseVal, 0, 1, 0, 50)
        
        p.fill(0, 0, 0, hatchingIntensity)
        p.noStroke()
        p.rect(x, y, 2, 2)
      }
    }
    
    // Add subtle relief effect to show the bumpy, cloth-like surface
    for (let x = 0; x < config.DOORMAT_WIDTH; x += 6) {
      for (let y = 0; y < config.DOORMAT_HEIGHT; y += 6) {
        const reliefNoise = p.noise(x * 0.03, y * 0.03)
        if (reliefNoise > 0.6) {
          p.fill(255, 255, 255, 25)
          p.noStroke()
          p.rect(x, y, 6, 6)
        } else if (reliefNoise < 0.4) {
          p.fill(0, 0, 0, 20)
          p.noStroke()
          p.rect(x, y, 6, 6)
        }
      }
    }
    
    p.pop()
  }

  // Enhanced texture overlay with 10-level intensity progression
  const drawTextureOverlayWithLevel = (p: any, doormatData: any, textureLevel: number) => {
    const config = doormatData.config

    // Scale all effects based on 10-level system (0-10)
    const intensityMultiplier = textureLevel / 10 // 0.0 to 1.0

    // Progressive intensity scaling
    const hatchingIntensity = p.map(intensityMultiplier, 0, 1, 0, 120)  // 0 to 120 opacity
    const reliefIntensity = p.map(intensityMultiplier, 0, 1, 0, 60)     // 0 to 60 opacity
    const reliefThreshold = p.map(intensityMultiplier, 0, 1, 0.8, 0.3)  // 0.8 to 0.3 (more relief as wear increases)
    const wearLineDensity = p.map(intensityMultiplier, 0, 1, 0.9, 0.4)   // 0.9 to 0.4 (more wear lines)
    const fringeWear = textureLevel >= 5 // Fringe wear starts at level 5
    const cornerDamage = textureLevel >= 8 // Corner damage starts at level 8

    p.push()
    p.blendMode(p.MULTIPLY)

    // Base hatching effect - scales with level
    for (let x = 0; x < config.DOORMAT_WIDTH; x += 2) {
      for (let y = 0; y < config.DOORMAT_HEIGHT; y += 2) {
        const noiseVal = p.noise(x * 0.02, y * 0.02)
        const intensity = p.map(noiseVal, 0, 1, 0, hatchingIntensity)

        p.fill(0, 0, 0, intensity)
        p.noStroke()
        p.rect(x, y, 2, 2)
      }
    }

    // Relief effect - more prominent with higher levels
    for (let x = 0; x < config.DOORMAT_WIDTH; x += 6) {
      for (let y = 0; y < config.DOORMAT_HEIGHT; y += 6) {
        const reliefNoise = p.noise(x * 0.03, y * 0.03)
        if (reliefNoise > reliefThreshold) {
          p.fill(255, 255, 255, reliefIntensity)
          p.noStroke()
          p.rect(x, y, 6, 6)
        } else if (reliefNoise < (1 - reliefThreshold)) {
          p.fill(0, 0, 0, reliefIntensity * 0.8)
          p.noStroke()
          p.rect(x, y, 6, 6)
        }
      }
    }

    // Progressive wear patterns based on level
    if (textureLevel >= 1) {
      // Level 1+: Basic wear lines
      for (let x = 0; x < config.DOORMAT_WIDTH; x += 12) {
        for (let y = 0; y < config.DOORMAT_HEIGHT; y += 12) {
          const wearNoise = p.noise(x * 0.008, y * 0.008)
          if (wearNoise > wearLineDensity) {
            const lineOpacity = p.map(textureLevel, 1, 10, 8, 25)
            p.fill(0, 0, 0, lineOpacity)
            p.noStroke()
            p.rect(x, y, 12, 1) // Horizontal wear lines
          }
        }
      }
    }

    if (textureLevel >= 3) {
      // Level 3+: Vertical wear patterns
      for (let x = 0; x < config.DOORMAT_WIDTH; x += 15) {
        for (let y = 0; y < config.DOORMAT_HEIGHT; y += 15) {
          const verticalNoise = p.noise(x * 0.006, y * 0.006)
          if (verticalNoise > wearLineDensity + 0.1) {
            const lineOpacity = p.map(textureLevel, 3, 10, 6, 20)
            p.fill(0, 0, 0, lineOpacity)
            p.noStroke()
            p.rect(x, y, 1, 15) // Vertical wear lines
          }
        }
      }
    }

    if (textureLevel >= 5) {
      // Level 5+: Fringe wear (edges of rug)
      const fringeWidth = 20
      for (let x = 0; x < config.DOORMAT_WIDTH; x += 4) {
        // Top fringe
        if (p.noise(x * 0.05) > 0.6) {
          p.fill(0, 0, 0, p.map(textureLevel, 5, 10, 10, 35))
          p.noStroke()
          p.rect(x, 0, 4, p.random(2, 6))
        }
        // Bottom fringe
        if (p.noise(x * 0.05, 100) > 0.6) {
          p.fill(0, 0, 0, p.map(textureLevel, 5, 10, 10, 35))
          p.noStroke()
          p.rect(x, config.DOORMAT_HEIGHT - 8, 4, p.random(2, 6))
        }
      }
    }

    if (textureLevel >= 7) {
      // Level 7+: Patchy wear areas
      for (let x = 0; x < config.DOORMAT_WIDTH; x += 25) {
        for (let y = 0; y < config.DOORMAT_HEIGHT; y += 25) {
          const patchNoise = p.noise(x * 0.004, y * 0.004)
          if (patchNoise > 0.75) {
            const patchOpacity = p.map(textureLevel, 7, 10, 15, 40)
            p.fill(0, 0, 0, patchOpacity)
            p.noStroke()
            p.rect(x, y, 25, 25)
          }
        }
      }
    }

    if (textureLevel >= 9) {
      // Level 9+: Heavy concentrated wear
      for (let x = 0; x < config.DOORMAT_WIDTH; x += 30) {
        for (let y = 0; y < config.DOORMAT_HEIGHT; y += 30) {
          const heavyNoise = p.noise(x * 0.003, y * 0.003)
          if (heavyNoise > 0.8) {
            const heavyOpacity = p.map(textureLevel, 9, 10, 20, 50)
            p.fill(0, 0, 0, heavyOpacity)
            p.noStroke()
            p.rect(x, y, 30, 30)
          }
        }
      }
    }

    if (textureLevel === 10) {
      // Level 10: Maximum degradation - add some highlight damage
      for (let x = 0; x < config.DOORMAT_WIDTH; x += 20) {
        for (let y = 0; y < config.DOORMAT_HEIGHT; y += 20) {
          const damageNoise = p.noise(x * 0.02, y * 0.02)
          if (damageNoise > 0.85) {
            // Add some white highlights for extreme wear
            p.fill(255, 255, 255, 30)
            p.noStroke()
            p.rect(x, y, 20, 20)
          }
        }
      }
    }

    p.pop()
  }

  // Original doormat.js drawFringe function
  const drawFringeOriginal = (p: any, doormatData: any, drawingPRNG: any, isFlipped: boolean = false) => {
    const config = doormatData.config
    // Top fringe (warp ends) - relative to rug translation
    drawFringeSectionOriginal(p, 0, -config.FRINGE_LENGTH, config.DOORMAT_WIDTH, config.FRINGE_LENGTH, 'top', doormatData, drawingPRNG, isFlipped)
    
    // Bottom fringe (warp ends) - relative to rug translation, minimal gap to avoid overlay
    drawFringeSectionOriginal(p, 0, config.DOORMAT_HEIGHT + 1, config.DOORMAT_WIDTH, config.FRINGE_LENGTH, 'bottom', doormatData, drawingPRNG, isFlipped)
  }

  // Original doormat.js drawFringeSection function
  const drawFringeSectionOriginal = (p: any, x: number, y: number, w: number, h: number, side: string, doormatData: any, drawingPRNG: any, isFlipped: boolean = false) => {
    const fringeStrands = w / 12
    const strandWidth = w / fringeStrands
    
    for (let i = 0; i < fringeStrands; i++) {
      let strandX = x + i * strandWidth

      const strandColor = drawingPRNG.randomChoice(doormatData.selectedPalette.colors)
      
      // Draw individual fringe strand with thin threads
      for (let j = 0; j < 12; j++) {
        let threadX = strandX + drawingPRNG.range(-strandWidth/6, strandWidth/6)

        const startY = side === 'top' ? y + h : y
        const endY = side === 'top' ? y : y + h
        
        // Add natural curl/wave to the fringe with more variation
        const waveAmplitude = drawingPRNG.range(1, 4)
        const waveFreq = drawingPRNG.range(0.2, 0.8)
        
        // Randomize the direction and intensity for each thread
        const direction = drawingPRNG.randomChoice([-1, 1])
        const curlIntensity = drawingPRNG.range(0.5, 2.0)
        const threadLength = drawingPRNG.range(0.8, 1.2)
        
        // Use darker version of strand color for fringe
        const fringeColor = p.color(strandColor)
        const r = p.red(fringeColor) * 0.7
        const g = p.green(fringeColor) * 0.7
        const b = p.blue(fringeColor) * 0.7
        
        p.stroke(r, g, b)
        p.strokeWeight(drawingPRNG.range(0.5, 1.2))
        
        p.noFill()
        p.beginShape()
        for (let t = 0; t <= 1; t += 0.1) {
          const yPos = p.lerp(startY, endY, t * threadLength)
          let xOffset = p.sin(t * p.PI * waveFreq) * waveAmplitude * t * direction * curlIntensity
          // Add more randomness and natural variation
          xOffset += drawingPRNG.range(-1, 1)
          // Add occasional kinks and bends
          if (drawingPRNG.next() < 0.3) {
            xOffset += drawingPRNG.range(-2, 2)
          }
          p.vertex(threadX + xOffset, yPos)
        }
        p.endShape()
      }
    }
  }

  // Original doormat.js drawSelvedgeEdges function
  const drawSelvedgeEdgesOriginal = (p: any, doormatData: any, drawingPRNG: any, isFlipped: boolean = false) => {
    const config = doormatData.config
    const weftSpacing = config.WEFT_THICKNESS + 1
    let isFirstWeft = true
    
    // Left/Right selvedge edge - flowing semicircular weft threads
    const leftEdgeX = 0
    const rightEdgeX = config.DOORMAT_WIDTH

    // Process stripes in normal order
    const stripeOrder = doormatData.stripeData

    // Left selvedge edge
    let isFirstWeftLeft = true
    for (const stripe of stripeOrder) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        // Skip the very first weft thread
        if (isFirstWeft) {
          isFirstWeft = false
          continue
        }
        
        // Get the color from the current stripe
        let selvedgeColor = p.color(stripe.primaryColor)
        
        // Check if there's a secondary color for blending
        if (stripe.secondaryColor && stripe.weaveType === 'm') {
          const secondaryColor = p.color(stripe.secondaryColor)
          const blendFactor = p.noise(y * 0.1) * 0.5 + 0.5
          selvedgeColor = p.lerpColor(selvedgeColor, secondaryColor, blendFactor)
        }
        
        const r = p.red(selvedgeColor) * 0.8
        const g = p.green(selvedgeColor) * 0.8
        const b = p.blue(selvedgeColor) * 0.8
        
        p.fill(r, g, b)
        p.noStroke()
        
        const radius = config.WEFT_THICKNESS * drawingPRNG.range(1.2, 1.8)
        const centerX = leftEdgeX + drawingPRNG.range(-2, 2)  // Relative to rug translation
        const centerY = y + config.WEFT_THICKNESS/2 + drawingPRNG.range(-1, 1)  // Relative to rug translation
        
        // Vary the arc angles for more natural look (flip direction for flipped rug)
        const angleOffset = isFlipped ? p.PI : 0
        const startAngle = p.HALF_PI + drawingPRNG.range(-0.2, 0.2) + angleOffset
        const endAngle = -p.HALF_PI + drawingPRNG.range(-0.2, 0.2) + angleOffset
        
        // Draw textured semicircle with individual thread details
        drawTexturedSelvedgeArcOriginal(p, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'left', drawingPRNG)
      }
    }
    
    // Right selvedge edge
    let isFirstWeftRight = true
    for (const stripe of stripeOrder) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        // Skip the very first weft thread
        if (isFirstWeftRight) {
          isFirstWeftRight = false
          continue
        }
        
        // Get the color from the current stripe
        let selvedgeColor = p.color(stripe.primaryColor)
        
        // Check if there's a secondary color for blending
        if (stripe.secondaryColor && stripe.weaveType === 'm') {
          const secondaryColor = p.color(stripe.secondaryColor)
          const blendFactor = p.noise(y * 0.1) * 0.5 + 0.5
          selvedgeColor = p.lerpColor(selvedgeColor, secondaryColor, blendFactor)
        }
        
        const r = p.red(selvedgeColor) * 0.8
        const g = p.green(selvedgeColor) * 0.8
        const b = p.blue(selvedgeColor) * 0.8
        
        p.fill(r, g, b)
        p.noStroke()
        
        const radius = config.WEFT_THICKNESS * drawingPRNG.range(1.2, 1.8)
        const centerX = rightEdgeX + drawingPRNG.range(-2, 2)  // Relative to rug translation
        const centerY = y + config.WEFT_THICKNESS/2 + drawingPRNG.range(-1, 1)  // Relative to rug translation
        
        // Vary the arc angles for more natural look (flip direction for flipped rug)
        const angleOffset = isFlipped ? p.PI : 0
        const startAngle = -p.HALF_PI + drawingPRNG.range(-0.2, 0.2) + angleOffset
        const endAngle = p.HALF_PI + drawingPRNG.range(-0.2, 0.2) + angleOffset
        
        // Draw textured semicircle with individual thread details
        drawTexturedSelvedgeArcOriginal(p, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right', drawingPRNG)
      }
    }
  }

  // Original doormat.js drawTexturedSelvedgeArc function
  const drawTexturedSelvedgeArcOriginal = (p: any, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, r: number, g: number, b: number, side: string, drawingPRNG: any) => {
    // Draw a realistic textured selvedge arc with visible woven texture
    const threadCount = p.max(6, p.floor(radius / 1.2))
    const threadSpacing = radius / threadCount
    
    // Draw individual thread arcs to create visible woven texture
    for (let i = 0; i < threadCount; i++) {
      const threadRadius = radius - (i * threadSpacing)
      
      // Create distinct thread colors for visible texture
      let threadR, threadG, threadB
      
      if (i % 2 === 0) {
        // Lighter threads
        threadR = p.constrain(r + 25, 0, 255)
        threadG = p.constrain(g + 25, 0, 255)
        threadB = p.constrain(b + 25, 0, 255)
      } else {
        // Darker threads
        threadR = p.constrain(r - 20, 0, 255)
        threadG = p.constrain(g - 20, 0, 255)
        threadB = p.constrain(b - 20, 0, 255)
      }
      
      // Add some random variation for natural look
      threadR = p.constrain(threadR + drawingPRNG.range(-10, 10), 0, 255)
      threadG = p.constrain(threadG + drawingPRNG.range(-10, 10), 0, 255)
      threadB = p.constrain(threadB + drawingPRNG.range(-10, 10), 0, 255)
      
      p.fill(threadR, threadG, threadB, 88)
      
      // Draw individual thread arc with slight position variation
      const threadX = centerX + drawingPRNG.range(-1, 1)
      const threadY = centerY + drawingPRNG.range(-1, 1)
      const threadStartAngle = startAngle + drawingPRNG.range(-0.1, 0.1)
      const threadEndAngle = endAngle + drawingPRNG.range(-0.1, 0.1)
      
      p.arc(threadX, threadY, threadRadius * 2, threadRadius * 2, threadStartAngle, threadEndAngle)
    }
    
    // Add a few more detailed texture layers
    for (let i = 0; i < 3; i++) {
      const detailRadius = radius * (0.3 + i * 0.2)
      const detailAlpha = 180 - (i * 40)
      
      // Create contrast for visibility
      const detailR = p.constrain(r + (i % 2 === 0 ? 15 : -15), 0, 255)
      const detailG = p.constrain(g + (i % 2 === 0 ? 15 : -15), 0, 255)
      const detailB = p.constrain(b + (i % 2 === 0 ? 15 : -15), 0, 255)
      
      p.fill(detailR, detailG, detailB, detailAlpha * 0.7)
      
      const detailX = centerX + drawingPRNG.range(-0.5, 0.5)
      const detailY = centerY + drawingPRNG.range(-0.5, 0.5)
      const detailStartAngle = startAngle + drawingPRNG.range(-0.05, 0.05)
      const detailEndAngle = endAngle + drawingPRNG.range(-0.05, 0.05)
      
      p.arc(detailX, detailY, detailRadius * 2, detailRadius * 2, detailStartAngle, detailEndAngle)
    }
    
    // Add subtle shadow for depth
    p.fill(r * 0.6, g * 0.6, b * 0.6, 70)
    const shadowOffset = side === 'left' ? 1 : -1
    p.arc(centerX + shadowOffset, centerY + 1, radius * 2, radius * 2, startAngle, endAngle)
    
    // Add small transparent hole in the center
    p.noFill()
    p.arc(centerX, centerY, radius * 0.5, radius * 0.5, startAngle, endAngle)
    
    // Add visible texture details - small bumps and knots
    for (let i = 0; i < 8; i++) {
      const detailAngle = drawingPRNG.range(startAngle, endAngle)
      const detailRadius = radius * drawingPRNG.range(0.2, 0.7)
      const detailX = centerX + p.cos(detailAngle) * detailRadius
      const detailY = centerY + p.sin(detailAngle) * detailRadius
      
      // Alternate between light and dark for visible contrast
      if (i % 2 === 0) {
        p.fill(r + 20, g + 20, b + 20, 120)
      } else {
        p.fill(r - 15, g - 15, b - 15, 120)
      }
      
      p.noStroke()
      p.ellipse(detailX, detailY, drawingPRNG.range(1.5, 3.5), drawingPRNG.range(1.5, 3.5))
    }
  }

  // DIRT OVERLAY SYSTEM - Dynamic dirt accumulation based on time and maintenance
  const drawDirtOverlay = (p: any, doormatData: any, drawingPRNG: any, dirtLevel: number) => {
    const config = doormatData.config
    
    // Dirt intensity based on level (0 = clean, 1 = 50% dirty, 2 = full dirty)
    const dirtIntensity = dirtLevel === 1 ? 0.5 : 1.0
    const dirtOpacity = dirtLevel === 1 ? 30 : 60
    
    // Create dirt pattern using PRNG for consistency
    p.push()
    p.translate(config.FRINGE_LENGTH * 2, config.FRINGE_LENGTH * 2)
    
    // Draw dirt spots and stains
    for (let x = 0; x < config.DOORMAT_WIDTH; x += 3) {
      for (let y = 0; y < config.DOORMAT_HEIGHT; y += 3) {
        // Use PRNG for consistent dirt pattern
        const dirtNoise = drawingPRNG.range(0, 1)
        const dirtThreshold = 0.85 * dirtIntensity // Higher threshold = less dirt
        
        if (dirtNoise > dirtThreshold) {
          // Create dirt spot
          const dirtSize = drawingPRNG.range(1, 4)
          const dirtAlpha = drawingPRNG.range(dirtOpacity * 0.5, dirtOpacity)
          
          // Brown/dark dirt color
          const dirtR = drawingPRNG.range(60, 90)
          const dirtG = drawingPRNG.range(40, 60)
          const dirtB = drawingPRNG.range(20, 40)
          
          p.fill(dirtR, dirtG, dirtB, dirtAlpha)
          p.noStroke()
          p.ellipse(x, y, dirtSize, dirtSize)
        }
      }
    }
    
    // Add larger dirt stains for more realistic effect
    for (let i = 0; i < 15 * dirtIntensity; i++) {
      const stainX = drawingPRNG.range(0, config.DOORMAT_WIDTH)
      const stainY = drawingPRNG.range(0, config.DOORMAT_HEIGHT)
      const stainSize = drawingPRNG.range(8, 20)
      const stainAlpha = drawingPRNG.range(dirtOpacity * 0.3, dirtOpacity * 0.7)
      
      // Darker stain color
      const stainR = drawingPRNG.range(40, 70)
      const stainG = drawingPRNG.range(25, 45)
      const stainB = drawingPRNG.range(15, 30)
      
      p.fill(stainR, stainG, stainB, stainAlpha)
      p.noStroke()
      p.ellipse(stainX, stainY, stainSize, stainSize)
    }
    
    // Add edge wear and tear
    for (let x = 0; x < config.DOORMAT_WIDTH; x += 2) {
      for (let y = 0; y < config.DOORMAT_HEIGHT; y += 2) {
        // Check if near edges
        const edgeDistance = Math.min(x, y, config.DOORMAT_WIDTH - x, config.DOORMAT_HEIGHT - y)
        if (edgeDistance < 10) {
          const edgeDirt = drawingPRNG.range(0, 1)
          if (edgeDirt > 0.7 * dirtIntensity) {
            const edgeAlpha = drawingPRNG.range(dirtOpacity * 0.2, dirtOpacity * 0.5)
            p.fill(80, 60, 40, edgeAlpha)
            p.noStroke()
            p.ellipse(x, y, 1, 1)
          }
        }
      }
    }
    
    p.pop()
  }

  // MISSING TEXT FUNCTIONS FROM ORIGINAL DOORMAT.JS

  // Draw character outlines for all text (new function)
  const drawCharacterOutlines = (p: any, stripe: any, doormatData: any) => {

    // Find all text pixels in this stripe
    const textPixels: any[] = []

    for (let y = stripe.y; y < stripe.y + stripe.height; y++) {
      for (let x = 0; x < doormatData.width; x++) {
        let isTextPixel = false
        if (doormatData.__ALLOW_TEXT__ && doormatData.textData && doormatData.textData.length > 0) {
          for (const textPixel of doormatData.textData) {
            if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                y >= textPixel.y && y < textPixel.y + textPixel.height) {
              isTextPixel = true
              break
            }
          }
        }
        if (isTextPixel) {
          textPixels.push({x, y})
        }
      }
    }

    if (textPixels.length === 0) return

    // Find bounding box for all text pixels in this stripe
    let minX = Math.min(...textPixels.map(p => p.x))
    let maxX = Math.max(...textPixels.map(p => p.x))
    let minY = Math.min(...textPixels.map(p => p.y))
    let maxY = Math.max(...textPixels.map(p => p.y))

    // Expand bounding box slightly
    minX -= 2
    maxX += 3
    minY -= 2
    maxY += 3

    const width = maxX - minX
    const height = maxY - minY

    // Draw outline around all text (thick border)
    p.fill(0, 0, 0, 180) // Dark outline
    p.noStroke()
    p.rect(minX, minY, width, height)

    // Inner lighter border for depth
    p.fill(255, 255, 255, 80)
    p.noStroke()
    p.rect(minX + 1, minY + 1, width - 2, height - 2)
  }

  // Update text colors based on palette (original function)
  const updateTextColors = (p: any, doormatData: any) => {
    if (!doormatData.selectedPalette || !doormatData.selectedPalette.colors) return
    
    let darkest = doormatData.selectedPalette.colors[0]
    let lightest = doormatData.selectedPalette.colors[0]
    let darkestVal = 999, lightestVal = -1
    
    for (const hex of doormatData.selectedPalette.colors) {
      const c = p.color(hex)
      const bright = (p.red(c) + p.green(c) + p.blue(c)) / 3
      if (bright < darkestVal) { darkestVal = bright; darkest = hex }
      if (bright > lightestVal) { lightestVal = bright; lightest = hex }
    }
    
    doormatData.darkTextColor = p.color(darkest)
    // Make colours more contrasted
    doormatData.lightTextColor = p.lerpColor(p.color(lightest), p.color(255), 0.3)
    doormatData.darkTextColor = p.lerpColor(p.color(darkest), p.color(0), 0.4)
  }

  // Generate text data (original function)
  const generateTextData = (doormatData: any) => {
    doormatData.textData = []
    const textRows = doormatData.doormatTextRows || []
    if (!textRows || textRows.length === 0) return
    
    // Use actual thread spacing for text
    const warpSpacing = doormatData.warpThickness + 1
    const weftSpacing = doormatData.config.WEFT_THICKNESS + 1
    const scaledWarp = warpSpacing * doormatData.config.TEXT_SCALE
    const scaledWeft = weftSpacing * doormatData.config.TEXT_SCALE
    
    // Character dimensions based on thread spacing
    const charWidth = 7 * scaledWarp // width after rotation (7 columns)
    const charHeight = 5 * scaledWeft // height after rotation (5 rows)
    const spacing = scaledWeft // vertical gap between stacked characters
    
    // Calculate spacing between rows (horizontal spacing after rotation)
    const rowSpacing = charWidth * 1.5 // Space between rows
    
    // Calculate total width needed for all rows
    const totalRowsWidth = textRows.length * charWidth + (textRows.length - 1) * rowSpacing
    
    // Calculate starting X position to center all rows
    const baseStartX = (doormatData.config.DOORMAT_WIDTH - totalRowsWidth) / 2
    
    // Generate text data for each row
    for (let rowIndex = 0; rowIndex < textRows.length; rowIndex++) {
      const doormatText = textRows[rowIndex]
      if (!doormatText) continue
      
      // Calculate text dimensions for this row
      const textWidth = charWidth
      const textHeight = doormatText.length * (charHeight + spacing) - spacing
      
      // Position for this row (left to right becomes after rotation)
      const startX = baseStartX + rowIndex * (charWidth + rowSpacing)
      const startY = (doormatData.config.DOORMAT_HEIGHT - textHeight) / 2
      
      // Generate character data vertically bottom-to-top for this row
      for (let i = 0; i < doormatText.length; i++) {
        const char = doormatText.charAt(i)
        const charY = startY + (doormatText.length - 1 - i) * (charHeight + spacing)
        const charPixels = generateCharacterPixels(char, startX, charY, textWidth, charHeight, doormatData)
        doormatData.textData.push(...charPixels)
      }
    }
  }

  // Generate character pixels (original function)
  const generateCharacterPixels = (char: string, x: number, y: number, width: number, height: number, doormatData: any) => {
    const pixels: any[] = []
    // Use actual thread spacing
    const warpSpacing = doormatData.warpThickness + 1
    const weftSpacing = doormatData.config.WEFT_THICKNESS + 1
    const scaledWarp = warpSpacing * doormatData.config.TEXT_SCALE
    const scaledWeft = weftSpacing * doormatData.config.TEXT_SCALE

    // Character definitions
    const charDef = doormatData.characterMap[char] || doormatData.characterMap[' ']

    const numRows = charDef.length
    const numCols = charDef[0].length

    // Since canvas is rotated 90° clockwise, characters need to be rotated accordingly
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (charDef[row][col] === '1') {
          // For 90° canvas rotation, we need to transpose coordinates
          const newCol = row
          const newRow = numCols - 1 - col
          pixels.push({
            x: x + newCol * scaledWarp,
            y: y + newRow * scaledWeft,
            width: scaledWarp,
            height: scaledWeft
          })
        }
      }
    }
    return pixels
  }

  // Initialize the generator
  const init = async () => {
    console.log('🚀 Starting initialization...')

    try {
      // Load P5.js first
      await loadP5()
      console.log('✅ P5.js loaded')

      // Load palette data
      await loadPaletteData()
      console.log('✅ Palette data loaded')

      // Initialize self-contained doormat generator
      const doormatData = initializeDoormat()
      if (typeof window !== 'undefined') {
        ;(window as any).doormatData = doormatData // Store globally for access
      }
      console.log('✅ Doormat generator initialized')

      // Create P5.js instance
      await createP5Instance()
      console.log('✅ P5.js instance created')

      // Generate initial doormat (will be replaced by auto-generation cycle after page loads)
      generateDoormatCore(currentSeed, doormatData)

      // Update warp thickness and complexity state from generated doormat data
      setWarpThickness(doormatData.warpThickness)

      // Update UI
      setIsLoaded(true)

    } catch (error) {
      console.error('❌ Initialization failed:', error)
      setIsLoaded(true) // Show UI anyway
    }
  }

  // Update palette display
  const updatePaletteDisplay = () => {
    if (typeof window !== 'undefined' && (window as any).selectedPalette) {
      setPalette((window as any).selectedPalette)
      console.log('🎨 Palette updated:', (window as any).selectedPalette)
    }
  }

  // COMPREHENSIVE TRAIT CALCULATION SYSTEM (from original trait-calculator.js)

  // Get palette rarity classification (matches generation algorithm exactly)
  const getPaletteRarity = (paletteName: string) => {
    // Use the same explicit arrays as the generation function
    const legendaryPalettes = [
      "Buddhist", "Maurya Empire", "Chola Empire", "Indigo Famine", "Bengal Famine", "Jamakalam"
    ]
    const epicPalettes = [
      "Indian Peacock", "Flamingo", "Toucan", "Madras Checks", "Kanchipuram Gold", "Natural Dyes",
      "Bleeding Vintage", "Tamil Classical", "Sangam Era", "Pandyas", "Maratha Empire"
    ]
    const rarePalettes = [
      "Rajasthani", "Kerala", "Gujarat", "Bengal", "Kashmir", "Chera Dynasty", "Madder Root",
      "Turmeric", "Neem", "Marigold", "Thanjavur Fresco", "Malabar Trogon", "Maurya Empire"
    ]
    const uncommonPalettes = [
      "Tamil Nadu Temple", "Kerala Onam", "Chettinad Spice", "Madras Monsoon", "Bengal Indigo",
      "Goa Beach", "Sri Lankan Tea", "African Madras", "Ivy League", "Tamil Sunrise", "Chettinad Spice"
    ]

    if (legendaryPalettes.includes(paletteName)) return "Legendary"
    if (epicPalettes.includes(paletteName)) return "Epic"
    if (rarePalettes.includes(paletteName)) return "Rare"
    if (uncommonPalettes.includes(paletteName)) return "Uncommon"
    return "Common"
  }

  // Calculate numeric complexity for minting (1-5 scale)

  // Calculate stripe complexity (for display purposes)
  const calculateStripeComplexity = (stripeData: any[]) => {
    if (!stripeData || stripeData.length === 0) return "Basic"
    
    let complexityScore = 0
    let mixedCount = 0
    let texturedCount = 0
    let solidCount = 0
    let secondaryColorCount = 0
    
    // Count different pattern types
    for (const stripe of stripeData) {
      if (stripe.weaveType === 'm') {
        mixedCount++
        complexityScore += 2 // Mixed weave adds more complexity
      } else if (stripe.weaveType === 't') {
        texturedCount++
        complexityScore += 1.5 // Textured adds medium complexity
      } else {
        solidCount++
        // Solid adds no complexity
      }
      
      if (stripe.secondaryColor) {
        secondaryColorCount++
        complexityScore += 1 // Secondary colors add complexity
      }
    }
    
    // Calculate ratios
    const solidRatio = solidCount / stripeData.length
    const normalizedComplexity = complexityScore / (stripeData.length * 3) // Max possible is 3 per stripe
    
    // Much more strict classification
    if (solidRatio > 0.9) return "Basic" // Almost all solid
    if (solidRatio > 0.75 && normalizedComplexity < 0.15) return "Simple" // Mostly solid with minimal complexity
    if (solidRatio > 0.6 && normalizedComplexity < 0.3) return "Moderate" // Good amount of solid with some complexity
    if (normalizedComplexity < 0.5) return "Complex" // Significant complexity
    return "Very Complex" // High complexity
  }

  // Get text lines rarity
  const getTextLinesRarity = (textLines: number) => {
    if (textLines === 0) return "Common"
    if (textLines === 1) return "Uncommon"
    if (textLines === 2) return "Rare"
    if (textLines === 3) return "Epic"
    if (textLines >= 4) return "Legendary"
    return "Common"
  }

  // Get character count rarity
  const getCharacterRarity = (totalChars: number) => {
    if (totalChars === 0) return "Common"
    if (totalChars <= 5) return "Uncommon"
    if (totalChars <= 15) return "Rare"
    if (totalChars <= 30) return "Epic"
    if (totalChars >= 31) return "Legendary"
    return "Common"
  }

  // Get stripe count rarity
  const getStripeCountRarity = (count: number) => {
    if (count < 20) return "Legendary"
    if (count < 25) return "Epic"
    if (count < 32) return "Rare"
    if (count < 40) return "Uncommon"
    return "Common"
  }

  // Get stripe complexity rarity
  const getStripeComplexityRarity = (complexity: string) => {
    switch (complexity) {
      case "Basic": return "Common"
      case "Simple": return "Uncommon"
      case "Moderate": return "Rare"
      case "Complex": return "Epic"
      case "Very Complex": return "Legendary"
      default: return "Common"
    }
  }

  // Get warp thickness rarity
  const getWarpThicknessRarity = (thickness: number) => {
    switch (thickness) {
      case 1: return "Legendary" // 10% chance (rare)
      case 2: return "Uncommon"  // 25% chance
      case 3: return "Common"    // 35% chance (most common)
      case 4: return "Common"    // 30% chance
      default: return "Common"
    }
  }

  // Get back pattern rarity - now based on palette rarity since it's a flipped version
  const getBackPatternRarity = (patternType: string) => {
    // Since back is flipped front, it inherits the palette's rarity
    const paletteName = typeof window !== 'undefined' ? (window as any).selectedPalette?.name || 'Unknown' : 'Unknown'
    return getPaletteRarity(paletteName)
  }

  // Calculate comprehensive traits
  const calculateTraits = () => {
    const data = {
      doormatTextRows: typeof window !== 'undefined' ? (window as any).doormatTextRows || [] : [],
      selectedPalette: typeof window !== 'undefined' ? (window as any).selectedPalette || null : null,
      stripeData: typeof window !== 'undefined' ? (window as any).stripeData || [] : []
    }
    
    const textLines = data.doormatTextRows.length
    const totalCharacters = data.doormatTextRows.reduce((sum: number, row: string) => sum + row.length, 0)
    const stripeCount = data.stripeData.length
    const stripeComplexity = calculateStripeComplexity(data.stripeData)
    const paletteName = data.selectedPalette ? data.selectedPalette.name : "Unknown"

    // Calculate back pattern type - now represents flipped front patterns
    const backPatternType = 'Flipped Front Design'
    
    const traits = {
      // Text traits
      textLines: {
        value: textLines,
        rarity: getTextLinesRarity(textLines)
      },
      totalCharacters: {
        value: totalCharacters,
        rarity: getCharacterRarity(totalCharacters)
      },
      
      // Palette traits
      paletteName: {
        value: paletteName,
        rarity: getPaletteRarity(paletteName)
      },
      
      // Visual traits
      stripeCount: {
        value: stripeCount,
        rarity: getStripeCountRarity(stripeCount)
      },
      stripeComplexity: {
        value: stripeComplexity,
        rarity: getStripeComplexityRarity(stripeComplexity)
      },

      // Back pattern traits
      backPattern: {
        value: backPatternType,
        rarity: getBackPatternRarity(backPatternType)
      },
      
      // Additional traits
      warpThickness: {
        value: typeof window !== 'undefined' ? (window as any).warpThickness || 2 : 2,
        rarity: getWarpThicknessRarity(typeof window !== 'undefined' ? (window as any).warpThickness || 2 : 2)
      },
      seed: currentSeed
    }
    
    return traits
  }

  // Update traits display
  const updateTraitsDisplay = () => {
    const traits = calculateTraits()
    setTraits(traits)
    console.log('🏷️ Comprehensive traits calculated:', traits)
  }

  // Update flip state - authoritative handler for flip toggling
  const updateFlipState = (newIsFlipped: boolean) => {
    // Set window state (authoritative source)
    ;(window as any).__RUG_FLIPPED__ = newIsFlipped

    // Trigger p5 redraw
    if (typeof window !== 'undefined' && (window as any).p5Instance) {
      (window as any).p5Instance.redraw()
    }
  }

  // Generate new doormat
  const generateNew = () => {
    // Generate a random seed like before
    const seed = Math.floor(Math.random() * 1000000)
    setCurrentSeed(seed)
    
    if (typeof window !== 'undefined' && (window as any).p5Instance) {
      // Reset flip state to front side before generating new rug
      ;(window as any).__RUG_FLIPPED__ = false

      // Force redraw to show front side immediately
      ;(window as any).p5Instance.redraw()

      console.log('🎨 Generating new doormat with seed:', seed)
      generateDoormatCore(seed, (window as any).doormatData)

      // Reapply existing text to the new rug
      updateTextLive(textInputs)

      // Update UI
      setTimeout(() => {
        updatePaletteDisplay()
        updateTraitsDisplay()
      }, 100)
    } else {
      console.error('❌ Cannot generate: P5.js instance not available')
    }
  }

  // Update dirt state and redraw
  const updateDirtState = (newShowDirt: boolean, newDirtLevel: number) => {
    setShowDirt(newShowDirt)
    setDirtLevel(newDirtLevel)
    
    // Store globally for P5.js access
    if (typeof window !== 'undefined') {
      ;(window as any).showDirt = newShowDirt
      ;(window as any).dirtLevel = newDirtLevel
    }
    
    // Redraw canvas if P5.js instance exists
    if (typeof window !== 'undefined' && (window as any).p5Instance) {
      ;(window as any).p5Instance.redraw()
    }
  }

  // Update texture state and redraw
  const updateTextureState = (newShowTexture: boolean, newTextureLevel: number) => {
    setShowTexture(newShowTexture)
    setTextureLevel(newTextureLevel)
    
    // Store globally for P5.js access
    if (typeof window !== 'undefined') {
      ;(window as any).showTexture = newShowTexture
      ;(window as any).textureLevel = newTextureLevel
    }
    
    // Redraw canvas if P5.js instance exists
    if (typeof window !== 'undefined' && (window as any).p5Instance) {
      ;(window as any).p5Instance.redraw()
    }
  }

  // Update flip state and redraw

  // Generate from seed
  const generateFromSeed = () => {
    if (typeof window !== 'undefined' && (window as any).p5Instance) {
      console.log('🎨 Generating doormat from seed:', currentSeed)
      generateDoormatCore(currentSeed, (window as any).doormatData)
      
      // Update UI
      setTimeout(() => {
        updatePaletteDisplay()
        updateTraitsDisplay()
      }, 100)
    } else {
      console.error('❌ Cannot generate: P5.js instance not available')
    }
  }

  // Save doormat
  const saveDoormat = () => {
    if (typeof window !== 'undefined' && (window as any).p5Instance) {
      (window as any).p5Instance.saveCanvas(`doormat-${Date.now()}`, 'png')
    } else {
      alert('Save function not available')
    }
  }

  // Add text row
  const addTextRow = () => {
    if (currentRowCount < 5) {
      setCurrentRowCount(prev => prev + 1)
      setTextInputs(prev => [...prev, ''])
    }
  }

  // Remove text row
  const removeTextRow = (index: number) => {
    if (index > 0 && currentRowCount > 1) {
      const nextTextInputs = textInputs.filter((_, i) => i !== index)
      setCurrentRowCount(prev => prev - 1)
      setTextInputs(nextTextInputs)

      // Update doormat with new text immediately (removes texture from removed row)
      updateTextLive(nextTextInputs)
    }
  }

  // Live text update - recomputes only text data for immediate canvas updates
  const updateTextLive = (textRows: string[]) => {
    if (typeof window !== 'undefined' && (window as any).__DOORMAT_DATA__) {
      const doormatData = (window as any).__DOORMAT_DATA__
      const validTexts = textRows.filter(text => text.trim().length > 0)

      // Update only text-related data
      doormatData.doormatTextRows = validTexts

      // Recompute text data and colors
      if (typeof window !== 'undefined' && (window as any).p5Instance) {
        updateTextColors((window as any).p5Instance, doormatData)
        generateTextData(doormatData)
      }

      // Update window data
      ;(window as any).__DOORMAT_DATA__.textData = doormatData.textData
      ;(window as any).__DOORMAT_DATA__.doormatTextRows = doormatData.doormatTextRows

      // Trigger immediate redraw
      if ((window as any).p5Instance) {
        (window as any).p5Instance.redraw()
      }
    }
  }

  // Update text input with automatic embedding
  const updateTextInput = (index: number, value: string) => {
    // Allow all characters from the characterMap: A-Z, 0-9, space, ?, _, !, @, #, $, &, %, +, -, (, ), [, ], *, =, ', ", ., <, >
    const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ?_!@#$&%+-()[]*=\'"\\.><'.split('')
    const filteredValue = value.toUpperCase()
      .split('')
      .filter(char => allowedChars.includes(char))
      .join('')
      .slice(0, 11)

    // Compute next text inputs manually
    const nextTextInputs = [...textInputs]
    nextTextInputs[index] = filteredValue

    // Update state and immediately update canvas with computed value
    setTextInputs(nextTextInputs)
    updateTextLive(nextTextInputs)
  }

  // Add text to doormat
  const addTextToDoormat = (inputs?: string[]) => {
    const inputsToUse = inputs || textInputs
    const validTexts = inputsToUse.filter(text => text.trim().length > 0)
    
    if (validTexts.length > 0 && typeof window !== 'undefined' && (window as any).doormatData) {
      (window as any).doormatData.doormatTextRows = validTexts
      console.log('📝 Text added to doormat:', validTexts)
      
      // Update text colors and generate text data
      if (typeof window !== 'undefined' && (window as any).p5Instance) {
        updateTextColors((window as any).p5Instance, (window as any).doormatData)
        generateTextData((window as any).doormatData)
      }
      
      // Update global text data
      if (typeof window !== 'undefined') {
        ;(window as any).textData = (window as any).doormatData.textData
        ;(window as any).doormatTextRows = (window as any).doormatData.doormatTextRows
      }
      
      // Redraw
      if ((window as any).p5Instance) {
        (window as any).p5Instance.redraw()
      }
    }
  }

  // Clear text
  const clearText = () => {
    const clearedTextInputs = ['']
    setTextInputs(clearedTextInputs)
    setCurrentRowCount(1)
    updateTextLive(clearedTextInputs)
    
    if (typeof window !== 'undefined' && (window as any).doormatData) {
      (window as any).doormatData.doormatTextRows = []
      ;(window as any).doormatData.textData = []
      
      // Update global text data
      if (typeof window !== 'undefined') {
        ;(window as any).textData = []
        ;(window as any).doormatTextRows = []
      }
      
      // Redraw
      if ((window as any).p5Instance) {
        (window as any).p5Instance.redraw()
      }
    }
  }

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'Legendary': return '#ff6b35'
      case 'Epic': return '#9b59b6'
      case 'Rare': return '#3498db'
      case 'Uncommon': return '#2ecc71'
      case 'Common': return '#95a5a6'
      default: return '#666'
    }
  }

  // Memoized aging days calculations for performance
  const agingDaysData = useMemo(() => {
    const baseRate = 14
    const getAgingMultiplier = (frame: number) => {
      if (frame >= 4) return 10 // Diamond: 90% slower (10x longer)
      if (frame >= 3) return 20 // Gold: 80% slower (5x longer)
      if (frame >= 2) return 50 // Silver: 50% slower (2x longer)
      if (frame >= 1) return 75 // Bronze: 25% slower (1.3x longer)
      return 100 // None: normal speed
    }

    const multiplier = getAgingMultiplier(selectedFrameLevel)
    const adjustedRate = (baseRate * 100) / multiplier

    // Pre-calculate all levels for performance
    const days: number[] = []
    for (let i = 0; i <= 10; i++) {
      days[i] = i * adjustedRate
    }

    return days
  }, [selectedFrameLevel])

  // Get aging days for texture level (now instant lookup)
  const getAgingDays = (level: number) => {
    return agingDaysData[level] || 0
  }

  // Get frame name for display
  const getFrameName = (frameLevel: number) => {
    switch(frameLevel) {
      case 0: return 'None'
      case 1: return 'Bronze'
      case 2: return 'Silver'
      case 3: return 'Gold'
      case 4: return 'Diamond'
      default: return 'None'
    }
  }

  // Initialize on mount
  useEffect(() => {
    let isInitialized = false
    
    const initializeOnce = async () => {
      if (isInitialized) return
      isInitialized = true
      await init()
    }
    
    initializeOnce()
    
    // Cleanup function
    return () => {
      // Clean up any existing P5.js instances
      const existingCanvas = document.querySelector('canvas')
      if (existingCanvas) {
        existingCanvas.remove()
      }
      // Clear global P5.js instance
      if (typeof window !== 'undefined' && (window as any).p5Instance) {
        (window as any).p5Instance.remove()
        delete (window as any).p5Instance
      }
    }
  }, [])

  // Check if P5.js canvas is visible - Robust positioning
  useEffect(() => {
    if (isLoaded) {
      const positionCanvas = () => {
        const canvas = document.querySelector('canvas')
        if (canvas && canvas.width > 0 && canvas.height > 0 && canvasContainerRef.current) {
          console.log('🎯 Positioning canvas - dimensions ready:', canvas.width, 'x', canvas.height)
          
          canvas.style.position = 'absolute'
          canvas.style.top = '0'
          canvas.style.left = '0'
          canvas.style.width = '100%'
          canvas.style.height = '100%'
          canvas.style.objectFit = 'fill'
          console.log('✅ Canvas positioned perfectly - robust approach')
        } else {
          // Canvas not ready yet, check again in 100ms
          setTimeout(positionCanvas, 100)
        }
      }
      
      // Start positioning with a small delay to ensure P5.js is ready
      setTimeout(positionCanvas, 200)
    }
  }, [isLoaded])

  // Auto-generate rugs after page completely loads (rolling dice effect)
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      // Delay auto-generation to ensure canvas is fully positioned and rendered
      const startAutoGeneration = () => {
        console.log('🎲 Starting auto-generation cycle after page load...')

        const doormatData = (window as any).doormatData
        if (!doormatData) {
          console.log('⚠️ Doormat data not available, skipping auto-generation')
          return
        }

        const generationCount = Math.floor(Math.random() * 3) + 3 // 3-5 generations
        let currentGeneration = 0

        const autoGenerate = () => {
          if (currentGeneration < generationCount) {
            const randomSeed = Math.floor(Math.random() * 100000)
            console.log(`🎲 Auto-generation ${currentGeneration + 1}/${generationCount} with seed: ${randomSeed}`)
            generateDoormatCore(randomSeed, doormatData)
            setWarpThickness(doormatData.warpThickness) // Update warp thickness state
 // Update complexity state
            currentGeneration++

            // Schedule next generation with increasing delay for visual effect
            setTimeout(autoGenerate, 111 + (currentGeneration * 200))
          } else {
            // Final generation - update state so minting works
            const finalSeed = Math.floor(Math.random() * 100000)
            console.log(`🎯 Final generation with seed: ${finalSeed}`)
            generateDoormatCore(finalSeed, doormatData)
            setCurrentSeed(finalSeed) // Update the state so minting works
            setWarpThickness(doormatData.warpThickness) // Update warp thickness state
 // Update complexity state
            console.log('✅ Auto-generation cycle complete - page fully ready!')
          }
        }

        // Start the auto-generation cycle after canvas positioning is complete
        setTimeout(autoGenerate, 690) // Wait 3 seconds for page to fully load and canvas to be positioned
      }

      startAutoGeneration()
    }
  }, [isLoaded]) // Only run when isLoaded changes to true

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Spacebar to randomise (only when loaded and not typing in inputs)
      if (event.code === 'Space' && isLoaded && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault()
        generateNew()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isLoaded, generateNew])

  return (
    <>
      <Head>
        <title>Rug Factory - Create Your Onchain Rug NFT | OnchainRugs</title>
        <meta name="description" content="Create unique, living Onchain Rug NFTs with custom text, 102 color palettes, and authentic cloth physics. Each rug ages over time and requires maintenance. Mint directly on Shape L2 blockchain." />
        <meta name="keywords" content="NFT generator, create NFT, generative art, custom NFT, rug NFT, textile NFT, woven art NFT, blockchain art generator, Shape L2 NFT, living NFT, aging NFT, NFT minting, custom text NFT" />
        <meta property="og:title" content="Rug Factory - Create Your Living Onchain Rug NFT" />
        <meta property="og:description" content="Design and mint unique generative rug NFTs that age over time. Custom text, 102 palettes, authentic physics. Shape L2 blockchain." />
        <meta property="og:url" content="https://onchainrugs.xyz/generator" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://onchainrugs.xyz/generator-og.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rug Factory - Create Your Living Onchain Rug NFT" />
        <meta name="twitter:description" content="Design and mint unique generative rug NFTs that age over time. Custom text, 102 palettes, authentic physics." />
        <meta name="twitter:image" content="https://onchainrugs.xyz/generator-og.jpg" />
        <link rel="canonical" href="https://onchainrugs.xyz/generator" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col">
        <Navigation />
      <main className="flex-grow pt-28">
        <div className="max-w-[1800px] mx-auto px-4">
      {/* Header */}

        {/* New Side-by-Side Layout - Art Preview (70%) on Left, Controls (30%) on Right */}
        <div className="grid lg:grid-cols-[70%_30%] gap-6 space-y-6 lg:space-y-0">
          {/* Canvas Display - Left Side (70% width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full"
          >
            <div className="p-2">
                            {/* Old-School CRT Monitor Box */}
              <div className="relative mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8">
                {/* Monitor Bezel - Yellowed Plastic */}
                <div className="bg-amber-100 border-6 border-amber-200 rounded-t-2xl rounded-b-xl p-2 md:p-3 lg:p-4 shadow-2xl">
                  {/* Monitor Screen Area */}
                  <div className="rounded-lg px-1 md:px-2 py-1">
                    {/* Canvas Display Area */}
                    <div className="rounded-lg px-1 relative overflow-hidden">
                      
                                                                    {/* Canvas Container - Match P5.js canvas dimensions exactly */}
                                                 <div
                           ref={canvasContainerRef}
                           id="canvas-container"
                           className="rug-canvas-container rounded-lg relative mx-auto cursor-pointer"
                           onClick={() => updateFlipState(!(window as any).__RUG_FLIPPED__ || false)}
                          style={{
                            width: '100%',     // Responsive width
                            height: '0',       // Height will be set by padding-bottom
                            paddingBottom: '69.7%', // 920/1320 * 100% = 69.7% (maintains 1320:920 aspect ratio)
                            maxWidth: '100%',  // Responsive constraint
                            overflow: 'hidden', // Prevent canvas overflow
                            position: 'relative', // Ensure proper positioning context for loading overlay
                            zIndex: 2 // Above scan lines
                          }}
                        >
                        {!isLoaded && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-green-400 rounded-lg">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mb-4"
                            />
                            <div className="text-lg font-medium font-mono">Loading P5.js...</div>
                            <div className="text-sm text-green-500 mt-2 font-mono">
                              Initializing rug generator
                            </div>
                          </div>
                        )}
                        
                        {/* P5.js Canvas Styling Override */}
                        <style jsx>{`
                          #defaultCanvas0 {
                            width: 100% !important;
                            height: 100% !important;
                            max-width: 100% !important;
                            max-height: 100% !important;
                            object-fit: fill !important;
                            position: relative !important;
                          }

                          .rug-canvas-container {
                            /* No CSS transforms - flipping handled by canvas re-rendering */
                          }
                        `}</style>
                      </div>
                </div>
              </div>

                  {/* Monitor Base - Taller Frame with Logo */}
                  <div className="bg-amber-100 mt-1 pt-1 pb-1 rounded-b-xl border-t-1 border-amber-200">
                    {/* Rugpull Computer Logo and Text */}
                    <div className="flex flex-col items-center space-y-0.5 md:space-y-1">
                      <div className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 bg-amber-200 rounded-full p-0.5 md:p-1 lg:p-1 xl:p-1">
                        <img 
                          src="/rugpull_computer_logo.png" 
                          alt="Rugpull Computer Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xs md:text-xs lg:text-sm xl:text-sm font-medium text-amber-800" style={{ fontFamily: 'EB Garamond, Apple Garamond, Garamond, serif' }}>
                          Rugpull Computer
                        </h3>
                      </div>
                    </div>

              </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Terminal Interface - Right Side (30% width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full pb-8"
          >
            <div className="relative w-full px-2 md:px-3 lg:px-4">
              <div className="bg-black text-green-400 font-mono border-t-2 border-green-500 py-3 md:py-4 px-4 md:px-6">
              {/* Terminal Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-green-500/30">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">$</span>
                  <span className="text-green-300">rug-terminal</span>
                  <span className="text-green-500">&gt;</span>
                </div>
                <div className="text-sm text-green-500">
                  {isLoaded ? 'READY' : 'LOADING...'}
                  </div>
              </div>

              {/* NFT Traits Display - Hidden */}
              {false && traits && (
                <div className="mt-2 pt-2 border-t border-green-500/30">
                  <div className="text-green-300 text-sm mb-3">NFT Traits & Rarity:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(traits).map(([key, trait]: [string, any]) => {
                      if (key === 'seed') return null // Skip seed display

                      const rarity = trait.rarity || 'Common'
                      const value = trait.value
                      const rarityColor = getRarityColor(rarity)

                      return (
                        <div key={key} className="bg-gray-900/50 border border-green-500/30 rounded p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-green-400 text-sm font-mono capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span
                              className="text-xs px-2 py-1 rounded font-mono font-bold"
                              style={{
                                backgroundColor: rarityColor + '20',
                                color: rarityColor,
                                border: `1px solid ${rarityColor}40`
                              }}
                            >
                              {rarity}
                            </span>
                          </div>
                          <div className="text-green-300 text-sm mt-1 font-mono">
                            {typeof value === 'string' ? value : value.toString()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Revamped Terminal Interface */}
              <div className="space-y-4">
                {/* Seed Input Section - Hidden but can be restored */}
                {/*
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-green-300 text-sm font-mono font-medium">SEED</h4>
                    <span className="text-green-500 text-xs font-mono">Deterministic generation</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={currentSeed}
                      onChange={(e) => setCurrentSeed(parseInt(e.target.value) || 42)}
                      placeholder="Enter seed number"
                      className="flex-1 px-3 py-2 bg-gray-900 border border-green-500/50 text-green-400 rounded text-sm font-mono focus:ring-1 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <button
                      onClick={() => setCurrentSeed(Math.floor(Math.random() * 100000))}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded font-mono text-sm transition-colors border border-purple-400"
                    >
                      RANDOM
                    </button>
                  </div>

                  <div className="text-green-400 text-xs font-mono bg-gray-900/50 p-2 rounded border border-green-500/30">
                    Same seed = identical doormat. Try: 4241, 1234, 9999
                  </div>
                </div>
                */}

                {/* Primary Actions - Top Priority */}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={generateNew}
                    disabled={!isLoaded}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-black font-bold px-6 py-3 rounded font-mono transition-all duration-200 border border-green-400 flex items-center justify-center gap-2 text-sm w-full"
                    title="Press SPACEBAR to randomise"
                  >
                    <Shuffle className="w-4 h-4" />
                    RANDOMISE
                  </button>
                </div>

                {/* Stacked Layout: Text Embedding (Top) | Systems (Bottom) */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Left Panel - Text Embedding */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-green-300 text-sm font-mono font-medium">TEXT EMBEDDING</h4>
                      <span className="text-green-500 text-xs font-mono">{currentRowCount}/5 rows</span>
                    </div>

                    <div className="text-green-400 text-xs font-mono bg-gray-900/50 p-2 rounded">
                      Allowed: A-Z, 0-9, space, ? _ ! @ # $ & % + - ( ) [ ] * = &apos; &quot; . &lt; &gt;
                    </div>

                    {/* Compact Text Inputs */}
                    <div className="space-y-2">
                      {textInputs.map((text, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-green-400 font-mono text-sm min-w-[20px]">{index + 1}.</span>
                          <input
                            type="text"
                            value={text}
                            onChange={(e) => updateTextInput(index, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Tab' && currentRowCount < 5) {
                                e.preventDefault()
                                addTextRow()
                              }
                            }}
                            placeholder={`Row ${index + 1}`}
                            maxLength={11}
                            className="flex-1 px-2 py-1.5 bg-gray-900 text-green-400 rounded text-sm font-mono focus:ring-1 focus:ring-green-500 transition-all"
                          />
                          {index > 0 && (
                            <button
                              onClick={() => removeTextRow(index)}
                              className="bg-red-600/80 hover:bg-red-600 text-white p-1 rounded transition-colors"
                              title="Remove row"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Text Control Actions */}
                    <div className="flex flex-wrap gap-2">
                      {currentRowCount < 5 && (
                        <button
                          onClick={addTextRow}
                          className="bg-green-600/80 hover:bg-green-600 text-black font-bold px-3 py-1.5 rounded font-mono transition-all duration-200 border border-green-400 flex items-center gap-1.5 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                          ADD ROW
                        </button>
                      )}
                      <button
                        onClick={clearText}
                        className="bg-gray-600/80 hover:bg-gray-600 text-white px-3 py-1.5 rounded font-mono transition-all duration-200 border border-gray-400 text-xs"
                      >
                        CLEAR
                      </button>
                    </div>
                  </div>

                  {/* Right Panel - Dirt & Texture Systems */}
                  <div className="space-y-4">
                    {/* Dirt System Controls */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-green-300 text-sm font-mono font-medium">DIRT SYSTEM</h4>
                        <span className="text-green-500 text-xs font-mono">
                          {!showDirt ? '🧼 Clean' : dirtLevel === 1 ? '🟡 50% Dusty' : '🔴 100% Filthy'}
                        </span>
                      </div>

                      <div className="text-green-400 text-xs font-mono bg-gray-900/50 p-2 rounded">
                        Dynamic dirt accumulation: 50% after 3 days, 100% after 7 days. Clean with onchain transaction.
                      </div>

                      {/* Dirt Accumulation Meter */}
                      <div className="space-y-3">
                        <div className="text-xs text-green-400 font-mono">Dirt Accumulation Level:</div>
                        <div className="flex gap-1">
                          {/* Clean Level */}
                          <button
                            onClick={() => updateDirtState(false, 0)}
                            className={`flex-1 px-2 py-2 rounded font-mono text-xs transition-all duration-200 border-2 ${
                              !showDirt
                                ? 'bg-green-600 text-white border-green-400 shadow-lg shadow-green-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                            }`}
                            title="Clean as new"
                          >
                            <div className="text-center font-bold">
                              CLEAN
                            </div>
                          </button>

                          {/* Dusty Level */}
                          <button
                            onClick={() => updateDirtState(true, 1)}
                            className={`flex-1 px-2 py-2 rounded font-mono text-xs transition-all duration-200 border-2 ${
                              showDirt && dirtLevel === 1
                                ? 'bg-yellow-600 text-white border-yellow-400 shadow-lg shadow-yellow-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                            }`}
                            title="3 days of wear"
                          >
                            <div className="text-center font-bold">
                              DUSTY
                            </div>
                          </button>

                          {/* Filthy Level */}
                          <button
                            onClick={() => updateDirtState(true, 2)}
                            className={`flex-1 px-2 py-2 rounded font-mono text-xs transition-all duration-200 border-2 ${
                              showDirt && dirtLevel === 2
                                ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                            }`}
                            title="7 days of neglect"
                          >
                            <div className="text-center font-bold">
                              FILTHY
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Aging System Controls */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-green-300 text-sm font-mono font-medium">AGING SYSTEM</h4>
                        <span className="text-green-500 text-xs font-mono">
                          {!showTexture ? '🏭 Brand New' : `${getAgingDays(textureLevel)} days old (${getFrameName(selectedFrameLevel)} frame)`}
                        </span>
                      </div>

                      <div className="text-green-400 text-xs font-mono bg-gray-900/50 p-2 rounded">
                        11-level aging progression: Level 0 (brand new) to Level 10 (maximum age). Aging rate depends on frame level. Diamond frame requires 200 maintenance points.
                      </div>

                      {/* Frame Selector */}
                      <div className="space-y-2">
                        <div className="text-xs text-green-400 font-mono">Frame Level (affects aging speed):</div>
                        <div className="flex gap-1">
                          {[
                            { level: 0, name: 'NONE', color: 'bg-gray-600', desc: 'Normal aging' },
                            { level: 1, name: 'BRONZE', color: 'bg-amber-600', desc: '25% slower' },
                            { level: 2, name: 'SILVER', color: 'bg-slate-400', desc: '50% slower' },
                            { level: 3, name: 'GOLD', color: 'bg-yellow-500', desc: '80% slower' },
                            { level: 4, name: 'DIAMOND', color: 'bg-cyan-500', desc: '90% slower' }
                          ].map((frame) => (
                            <button
                              key={frame.level}
                              onClick={() => setSelectedFrameLevel(frame.level)}
                              className={`flex-1 px-1.5 py-2 rounded font-mono text-xs transition-all duration-200 border-2 ${
                                selectedFrameLevel === frame.level
                                  ? `${frame.color} text-white border-white shadow-lg`
                                  : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                              }`}
                              title={frame.desc}
                            >
                              <div className="text-center font-bold text-xs">
                                {frame.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Aging Level Slider with Preview */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-green-300 text-xs font-mono">Aging Level</label>
                          <span className="text-green-500 text-xs font-mono">{textureLevel}/10 ({getAgingDays(textureLevel)} days)</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={textureLevel}
                          onChange={(e) => updateTextureState(textureLevel > 0 || parseInt(e.target.value) > 0, parseInt(e.target.value))}
                          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-purple"
                        />
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                          <span>0 (Fresh)</span>
                          <span>5 ({getAgingDays(5)} days)</span>
                          <span>10 ({getAgingDays(10)} days)</span>
                        </div>

                        {/* Aging Level Preview */}
                        <div className="text-xs text-green-400 font-mono bg-gray-900/30 p-3 rounded border border-gray-600">
                          {textureLevel === 0 && `✨ Brand New - pristine condition (0 days)`}
                          {textureLevel === 1 && `🧵 Slightly Aged - subtle signs of use (${getAgingDays(1)} days)`}
                          {textureLevel === 2 && `📅 Moderately Aged - light aging (${getAgingDays(2)} days)`}
                          {textureLevel === 3 && `🏠 Well Aged - well-used but functional (${getAgingDays(3)} days)`}
                          {textureLevel === 4 && `📆 Significantly Aged - shows character (${getAgingDays(4)} days)`}
                          {textureLevel === 5 && `🪶 Very Aged - vintage appearance (${getAgingDays(5)} days)`}
                          {textureLevel === 6 && `🎭 Extremely Aged - distinctive patina (${getAgingDays(6)} days)`}
                          {textureLevel === 7 && `🏺 Heavily Aged - rich texture (${getAgingDays(7)} days)`}
                          {textureLevel === 8 && `🏛️ Severely Aged - extreme character (${getAgingDays(8)} days)`}
                          {textureLevel === 9 && `🎨 Critically Aged - legendary status (${getAgingDays(9)} days)`}
                          {textureLevel === 10 && `💎 Maximum Age - ultimate degradation (${getAgingDays(10)} days)`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Minting Data */}
                {false && (
                <div className="border-t border-gray-500/30 pt-3 mt-4">
                  <div className="text-gray-300 text-sm mb-3 font-mono">🔧 Contract Minting Data</div>

                  <div className="bg-gray-900/30 border border-gray-500/30 rounded p-3">
                    <div className="text-gray-400 text-xs font-mono mb-2">Exact Data Sent to Contract:</div>
                    <div className="space-y-2 text-xs">
                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">textRows:</div>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(textInputs.filter(row => row.trim() !== '')), 'textRows')}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs">
                          {JSON.stringify(textInputs.filter(row => row.trim() !== ''))}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">seed:</div>
                          <button
                            onClick={() => copyToClipboard(currentSeed.toString(), 'seed')}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs">{currentSeed}</div>
                      </div>

                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">paletteName:</div>
                          <button
                            onClick={() => copyToClipboard(palette?.name || 'Unknown', 'paletteName')}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs">&ldquo;{palette?.name || 'Unknown'}&rdquo;</div>
                      </div>

                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">minifiedPalette:</div>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(palette), 'minifiedPalette')}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs max-h-16 overflow-y-auto">
                          {JSON.stringify(palette)}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">minifiedStripeData:</div>
                          <button
                            onClick={() => copyToClipboard(
                              typeof window !== 'undefined' && (window as any).stripeData
                                ? JSON.stringify((window as any).stripeData)
                                : '[]',
                              'minifiedStripeData'
                            )}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs max-h-16 overflow-y-auto">
                          {typeof window !== 'undefined' && (window as any).stripeData
                            ? JSON.stringify((window as any).stripeData)
                            : '[]'
                          }
                        </div>
                      </div>

                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">filteredCharacterMap:</div>
                          <button
                            onClick={() => {
                              const usedCharMap = (() => {
                                if (typeof window === 'undefined' || !(window as any).doormatData?.characterMap) return {};

                                const used = new Set<string>();
                                textInputs.forEach(row => {
                                  for (const char of row.toUpperCase()) {
                                    used.add(char);
                                  }
                                });

                                // Only include space if there are actually used characters
                                if (used.size > 0) {
                                used.add(' ');
                                }

                                const usedCharMap: any = {};
                                used.forEach((char) => {
                                  if ((window as any).doormatData.characterMap[char]) {
                                    usedCharMap[char] = (window as any).doormatData.characterMap[char];
                                  }
                                });
                                return usedCharMap;
                              })();
                              copyToClipboard(JSON.stringify(usedCharMap), 'filteredCharacterMap');
                            }}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs max-h-16 overflow-y-auto">
                          {(() => {
                            if (typeof window === 'undefined' || !(window as any).doormatData?.characterMap) return '{}';

                            const used = new Set<string>();
                            textInputs.forEach(row => {
                              for (const char of row.toUpperCase()) {
                                used.add(char);
                              }
                            });

                            // Only include space if there are actually used characters
                            if (used.size > 0) {
                            used.add(' ');
                            }

                            const usedCharMap: any = {};
                            used.forEach((char) => {
                              if ((window as any).doormatData.characterMap[char]) {
                                usedCharMap[char] = (window as any).doormatData.characterMap[char];
                              }
                            });
                            return JSON.stringify(usedCharMap);
                          })()}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">warpThickness:</div>
                          <button
                            onClick={() => copyToClipboard('3', 'warpThickness')}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs">3</div>
                      </div>

                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">complexity:</div>
                          <button
                            onClick={() => copyToClipboard('2', 'complexity')}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs">2</div>
                      </div>

                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">characterCount:</div>
                          <button
                            onClick={() => copyToClipboard(textInputs.filter(row => row.trim() !== '').join('').length.toString(), 'characterCount')}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs">{textInputs.filter(row => row.trim() !== '').join('').length}</div>
                      </div>

                      <div className="bg-gray-800/50 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-gray-400">stripeCount:</div>
                          <button
                            onClick={() => copyToClipboard(
                              typeof window !== 'undefined' && (window as any).stripeData
                                ? (window as any).stripeData.length.toString()
                                : '0',
                              'stripeCount'
                            )}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-300/50 transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="text-white font-mono text-xs">
                          {typeof window !== 'undefined' && (window as any).stripeData
                            ? (window as any).stripeData.length
                            : 0
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Mint Button Section */}
                <div className="border-t border-green-500/30 pt-3 mt-4">
                  {/* Contract Address Display - Moved here for proximity to mint button */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-green-300 text-sm font-mono font-medium">CONTRACT ADDRESS</h4>
                    <div className="bg-gray-900/50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-green-400 text-xs font-mono break-all flex-1">
                          {contractAddress || 'Not deployed on this network'}
                        </div>
                        {contractAddress && (
                        <Copy
                            onClick={() => copyToClipboard(contractAddress, 'contract address')}
                          className="text-green-500 hover:text-green-300 cursor-pointer transition-colors w-4 h-4"
                        />
                        )}
                      </div>
                      <div className="text-green-500 text-xs font-mono mt-1">
                        Network: {getChainDisplayName(chainId)}
                      </div>
                    </div>
                  </div>

                  <div className="text-green-300 text-sm mb-3 font-mono">🚀 Mint Your Onchain Rug</div>

                  {/* Minting Status */}
                  <div className="bg-green-900/20 border border-green-500/30 rounded p-3 mb-3">
                    <div className="text-green-400 text-xs font-mono mb-2">Minting Status:</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <div className="text-green-300 text-xs">Ready to Mint</div>
                      </div>
                      <div className="text-green-400 text-xs font-mono">
                        {(() => {
                          const nonEmptyRows = textInputs.filter(row => row.trim() !== '').length
                          if (nonEmptyRows === 0) return '0.0001 ETH'
                          if (nonEmptyRows === 1) return '0.0001 ETH'
                          if (nonEmptyRows <= 3) return `${(0.0001 + (nonEmptyRows - 1) * 0.00111).toFixed(4)} ETH`
                          return `${(0.0001 + 2 * 0.00111 + (nonEmptyRows - 3) * 0.00222).toFixed(4)} ETH`
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* NFT Exporter Component */}
                  {isLoaded && (
                  <NFTExporter
                    currentSeed={currentSeed}
                    currentPalette={palette}
                    currentStripeData={stripeData}
                    textRows={textInputs}
                    characterMap={typeof window !== 'undefined' ? (window as any).doormatData?.characterMap || {} : {}}
                  />
                  )}

                  {/* Web3 Minting Component */}
                  <Web3Minting
                    textRows={textInputs}
                    currentPalette={palette}
                    currentStripeData={stripeData}
                    characterMap={typeof window !== 'undefined' ? (window as any).doormatData?.characterMap || {} : {}}
                    warpThickness={warpThickness}
                    seed={currentSeed}
                  />

                </div>

                </div>
              </div>
            </div>
          </motion.div>
        </div>


        {/* Hidden elements for P5.js compatibility */}
        <div style={{ display: 'none' }}>
          <div id="paletteName"></div>
          <div id="colorSwatches"></div>
          <div id="traitsContainer"></div>
          <div id="additionalRows"></div>
          <button id="toggleRowsBtn"></button>
        </div>
      </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
    </>
  )
}

