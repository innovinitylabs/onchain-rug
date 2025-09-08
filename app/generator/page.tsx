"use client"

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Download, FileText, Plus, X } from 'lucide-react'
import Navigation from '@/components/Navigation'
import NFTExporter from '@/components/NFTExporter'

export default function GeneratorPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSeed, setCurrentSeed] = useState(42)
  const [textInputs, setTextInputs] = useState([''])
  const [currentRowCount, setCurrentRowCount] = useState(1)
  const [palette, setPalette] = useState<any>(null)
  const [traits, setTraits] = useState<any>(null)

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const scriptsLoadedRef = useRef<Set<string>>(new Set())

  // Clean P5.js loading - no global pollution
  const loadP5 = () => {
    return new Promise<void>((resolve) => {
      // Check if P5.js is already loaded
      if ((window as any).p5) {
        console.log('✅ P5.js already available')
        resolve()
        return
      }
      
      // Load P5.js from CDN
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
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
    
    // Color palettes
    const colorPalettes = [
      // ===== GLOBAL PALETTES (25) =====
      
      // Classic Red & Black - most common doormat colors
      {
          name: "Classic Red & Black",
          colors: [
              '#8B0000', '#DC143C', '#B22222', '#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D'
          ]
      },
      // Natural Jute & Hemp - eco-friendly doormat colors
      {
          name: "Natural Jute & Hemp",
          colors: [
              '#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#8B7355', '#A0522D', '#654321', '#2F2F2F'
          ]
      },
      // Coastal Blue & White - beach house style
      {
          name: "Coastal Blue & White",
          colors: [
              '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#F8F8FF', '#F0F8FF', '#E6E6FA', '#B0C4DE'
          ]
      },
      // Rustic Farmhouse - warm, earthy tones
      {
          name: "Rustic Farmhouse",
          colors: [
              '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#F5DEB3', '#F4E4BC'
          ]
      },
      // Modern Gray & White - contemporary minimalist
      {
          name: "Modern Gray & White",
          colors: [
              '#F5F5F5', '#FFFFFF', '#D3D3D3', '#C0C0C0', '#A9A9A9', '#808080', '#696969', '#2F2F2F'
          ]
      },
      // Autumn Harvest - warm fall colors
      {
          name: "Autumn Harvest",
          colors: [
              '#8B4513', '#D2691E', '#CD853F', '#F4A460', '#8B0000', '#B22222', '#FF8C00', '#FFA500'
          ]
      },
      // Spring Garden - fresh, vibrant colors
      {
          name: "Spring Garden",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#98FB98', '#FF69B4', '#FFB6C1', '#87CEEB', '#F0E68C'
          ]
      },
      // Industrial Metal - urban, modern look
      {
          name: "Industrial Metal",
          colors: [
              '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#000000'
          ]
      },
      // Mediterranean - warm, sun-baked colors
      {
          name: "Mediterranean",
          colors: [
              '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#F4A460', '#DEB887', '#87CEEB', '#4682B4'
          ]
      },
      // Scandinavian - clean, light colors
      {
          name: "Scandinavian",
          colors: [
              '#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#6C757D', '#495057'
          ]
      },
      // Nordic Forest - deep greens and browns
      {
          name: "Nordic Forest",
          colors: [
              '#2D5016', '#3A5F0B', '#4A7C59', '#5D8B66', '#6B8E23', '#8FBC8F', '#9ACD32', '#ADFF2F'
          ]
      },
      // Desert Sunset - warm, sandy tones
      {
          name: "Desert Sunset",
          colors: [
              '#CD853F', '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F', '#8B4513', '#A0522D', '#D2691E'
          ]
      },
      // Arctic Ice - cool, icy colors
      {
          name: "Arctic Ice",
          colors: [
              '#F0F8FF', '#E6E6FA', '#B0C4DE', '#87CEEB', '#B0E0E6', '#F0FFFF', '#E0FFFF', '#F5F5F5'
          ]
      },
      // Tropical Paradise - vibrant, warm colors
      {
          name: "Tropical Paradise",
          colors: [
              '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#32CD32', '#90EE90', '#98FB98', '#00CED1'
          ]
      },
      // Vintage Retro - muted, nostalgic colors
      {
          name: "Vintage Retro",
          colors: [
              '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#BC8F8F', '#8B7355', '#F5DEB3', '#F4E4BC'
          ]
      },
      // Art Deco - elegant, sophisticated colors
      {
          name: "Art Deco",
          colors: [
              '#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D', '#CD853F', '#F5DEB3', '#FFFFFF'
          ]
      },
      // Bohemian - eclectic, artistic colors
      {
          name: "Bohemian",
          colors: [
              '#8E44AD', '#9B59B6', '#E67E22', '#D35400', '#E74C3C', '#C0392B', '#16A085', '#1ABC9C'
          ]
      },
      // Minimalist - clean, simple colors
      {
          name: "Minimalist",
          colors: [
              '#FFFFFF', '#F5F5F5', '#E0E0E0', '#CCCCCC', '#999999', '#666666', '#333333', '#000000'
          ]
      },
      // Corporate - professional, business colors
      {
          name: "Corporate",
          colors: [
              '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
          ]
      },
      // Luxury - rich, premium colors
      {
          name: "Luxury",
          colors: [
              '#000000', '#2F2F2F', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F5DEB3', '#FFD700'
          ]
      },
      // Pastel Dreams - soft, gentle colors
      {
          name: "Pastel Dreams",
          colors: [
              '#FFB6C1', '#FFC0CB', '#FFE4E1', '#F0E68C', '#98FB98', '#90EE90', '#87CEEB', '#E6E6FA'
          ]
      },
      // Earth Tones - natural, organic colors
      {
          name: "Earth Tones",
          colors: [
              '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
          ]
      },
      // Ocean Depths - deep, marine colors
      {
          name: "Ocean Depths",
          colors: [
              '#000080', '#191970', '#4169E1', '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#E0FFFF'
          ]
      },
      // Mountain Mist - cool, natural colors
      {
          name: "Mountain Mist",
          colors: [
              '#2F4F4F', '#4A5D6B', '#5F7A7A', '#6B8E8E', '#87CEEB', '#B0C4DE', '#E6E6FA', '#F0F8FF'
          ]
      },
      // Sunset Glow - warm, radiant colors
      {
          name: "Sunset Glow",
          colors: [
              '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#DC143C', '#8B0000', '#2F2F2F'
          ]
      },
      
      // ===== INDIAN CULTURAL PALETTES (18) =====
      
      // Rajasthani - vibrant, royal colors
      {
          name: "Rajasthani",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
          ]
      },
  
      // Kerala - coastal, tropical colors
      {
          name: "Kerala",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#98FB98', '#00CED1', '#87CEEB', '#4682B4', '#000080'
          ]
      },
      // Gujarat - colorful, festive colors
      {
          name: "Gujarat",
          colors: [
              '#FF4500', '#FF6347', '#FFD700', '#FFA500', '#DC143C', '#4B0082', '#32CD32', '#FFFFFF'
          ]
      },
      // Punjab - warm, harvest colors
      {
          name: "Punjab",
          colors: [
              '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'
          ]
      },
      // Bengal - monsoon, lush colors
      {
          name: "Bengal",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#F5DEB3', '#DEB887', '#8B4513', '#4682B4', '#000080'
          ]
      },
      // Kashmir - cool, mountain colors
      {
          name: "Kashmir",
          colors: [
              '#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'
          ]
      },
      // Maharashtra - earthy, warm colors
      {
          name: "Maharashtra",
          colors: [
              '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
          ]
      },
      // Tamil Nadu - traditional, cultural colors
      {
          name: "Tamil Nadu",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
          ]
      },
      // Karnataka - forest, nature colors
      {
          name: "Karnataka",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
          ]
      },
      // Andhra Pradesh - coastal, vibrant colors
      {
          name: "Andhra Pradesh",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'
          ]
      },
      // Telangana - modern, urban colors
      {
          name: "Telangana",
          colors: [
              '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
          ]
      },
      // Odisha - tribal, earthy colors
      {
          name: "Odisha",
          colors: [
              '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
          ]
      },
      // Madhya Pradesh - central, balanced colors
      {
          name: "Madhya Pradesh",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
          ]
      },
      // Uttar Pradesh - northern, traditional colors
      {
          name: "Uttar Pradesh",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
          ]
      },
      // Bihar - eastern, cultural colors
      {
          name: "Bihar",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
          ]
      },
      // West Bengal - eastern, artistic colors
      {
          name: "West Bengal",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#98FB98', '#00CED1', '#87CEEB', '#4682B4', '#000080'
          ]
      },
      // Assam - northeastern, natural colors
      {
          name: "Assam",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
          ]
      },
      // Himachal Pradesh - mountain, cool colors
      {
          name: "Himachal Pradesh",
          colors: [
              '#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'
          ]
      },
      
      // ===== TAMIL CULTURAL PALETTES (11) =====
      
      // Tamil Classical - traditional, ancient colors
      {
          name: "Tamil Classical",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
          ]
      },
      // Sangam Era - literary, cultural colors
      {
          name: "Sangam Era",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
          ]
      },
      // Chola Dynasty - royal, imperial colors
      {
          name: "Chola Dynasty",
          colors: [
              '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
          ]
      },
      // Pandya Kingdom - southern, coastal colors
      {
          name: "Pandya Kingdom",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'
          ]
      },
      // Chera Dynasty - western coast, spice trade colors
      {
          name: "Chera Dynasty",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#8B4513', '#A0522D', '#FFD700', '#00CED1', '#000080'
          ]
      },
      // Pallava Empire - architectural, stone colors
      {
          name: "Pallava Empire",
          colors: [
              '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
          ]
      },
      // Vijayanagara - golden, prosperous colors
      {
          name: "Vijayanagara",
          colors: [
              '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'
          ]
      },
      // Nayak Dynasty - artistic, temple colors
      {
          name: "Nayak Dynasty",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
          ]
      },
      // Maratha Rule - warrior, strong colors
      {
          name: "Maratha Rule",
          colors: [
              '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
          ]
      },
      // British Colonial - mixed, hybrid colors
      {
          name: "British Colonial",
          colors: [
              '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
          ]
      },
      // Modern Tamil - contemporary, urban colors
      {
          name: "Modern Tamil",
          colors: [
              '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
          ]
      },
      // Jamakalam - traditional Tamil floor mat colors
      {
          name: "Jamakalam",
          colors: [
              '#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#4B0082', '#000000'
          ]
      },
      
      // ===== NATURAL DYE PALETTES (8) =====
      
      // Indigo Dye - deep blue, natural colors
      {
          name: "Indigo Dye",
          colors: [
              '#000080', '#191970', '#4169E1', '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#E0FFFF'
          ]
      },
      // Madder Root - red, earthy colors
      {
          name: "Madder Root",
          colors: [
              '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF6347', '#CD5C5C', '#F08080', '#FA8072'
          ]
      },
      // Turmeric - golden, warm colors
      {
          name: "Turmeric",
          colors: [
              '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#DAA520', '#B8860B', '#CD853F'
          ]
      },
      // Henna - reddish-brown, natural colors
      {
          name: "Henna",
          colors: [
              '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
          ]
      },
      // Pomegranate - deep red, rich colors
      {
          name: "Pomegranate",
          colors: [
              '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF6347', '#CD5C5C', '#F08080', '#FA8072'
          ]
      },
      // Neem - green, natural colors
      {
          name: "Neem",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
          ]
      },
      // Saffron - golden, precious colors
      {
          name: "Saffron",
          colors: [
              '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#DAA520', '#B8860B', '#CD853F'
          ]
      },
      // Marigold - bright, cheerful colors
      {
          name: "Marigold",
          colors: [
              '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#FF1493', '#FF69B4', '#FFB6C1'
          ]
      },
      
      // ===== MADRAS CHECKS & TAMIL NADU INSPIRED PALETTES (8) =====
      
      // Madras Checks - traditional plaid colors
      {
          name: "Madras Checks",
          colors: [
              '#8B0000', '#DC143C', '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#228B22', '#006400'
          ]
      },
      // Tamil Nadu Temple - sacred, vibrant colors
      {
          name: "Tamil Nadu Temple",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
          ]
      },
      // Kanchipuram Silk - luxurious, traditional colors
      {
          name: "Kanchipuram Silk",
          colors: [
              '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
          ]
      },
      // Thanjavur Art - classical, artistic colors
      {
          name: "Thanjavur Art",
          colors: [
              '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'
          ]
      },
      // Chettinad Architecture - heritage, warm colors
      {
          name: "Chettinad Architecture",
          colors: [
              '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
          ]
      },
      // Madurai Meenakshi - divine, colorful palette
      {
          name: "Madurai Meenakshi",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
          ]
      },
      // Coimbatore Cotton - natural, earthy colors
      {
          name: "Coimbatore Cotton",
          colors: [
              '#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#8B7355', '#A0522D', '#654321', '#2F2F2F'
          ]
      },
      // Salem Silk - traditional, refined colors
      {
          name: "Salem Silk",
          colors: [
              '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
          ]
      },
      
      // ===== WESTERN GHATS BIRDS PALETTES (6) =====
      
      // Indian Peacock - majestic, iridescent colors
      {
          name: "Indian Peacock",
          colors: [
              '#000080', '#191970', '#4169E1', '#4682B4', '#00CED1', '#40E0D0', '#48D1CC', '#20B2AA'
          ]
      },
      // Flamingo - tropical, pink-orange colors
      {
          name: "Flamingo",
          colors: [
              '#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB', '#FF6347', '#FF4500', '#FF8C00', '#FFA500'
          ]
      },
      // Toucan - vibrant, tropical colors
      {
          name: "Toucan",
          colors: [
              '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#000000', '#FFFFFF', '#FF1493'
          ]
      },
      // Malabar Trogon - forest, jewel colors
      {
          name: "Malabar Trogon",
          colors: [
              '#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#000000', '#FFFFFF'
          ]
      },
      // Nilgiri Flycatcher - mountain, cool colors
      {
          name: "Nilgiri Flycatcher",
          colors: [
              '#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'
          ]
      },
      // Malabar Parakeet - forest, green colors
      {
          name: "Malabar Parakeet",
          colors: [
              '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
          ]
      },
      
      // ===== HISTORICAL DYNASTY & CULTURAL PALETTES (6) =====
      
      // Pandya Dynasty - southern, maritime colors
      {
          name: "Pandya Dynasty",
          colors: [
              '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'
          ]
      },
      // Maratha Empire - warrior, strong colors
      {
          name: "Maratha Empire",
          colors: [
              '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
          ]
      },
      // Maurya Empire - imperial, ancient colors
      {
          name: "Maurya Empire",
          colors: [
              '#000080', '#191970', '#4169E1', '#4682B4', '#FFD700', '#FFA500', '#8B4513', '#A0522D'
          ]
      },
      // Buddhist - peaceful, spiritual colors
      {
          name: "Buddhist",
          colors: [
              '#FFD700', '#FFA500', '#8B4513', '#A0522D', '#228B22', '#32CD32', '#90EE90', '#FFFFFF'
          ]
      },
      
      // ===== FAMINE & HISTORICAL PERIOD PALETTES (2) =====
      
      // Indigo Famine - colonial, oppressive colors
      {
          name: "Indigo Famine",
          colors: [
              '#000080', '#191970', '#4169E1', '#4682B4', '#2F4F4F', '#696969', '#808080', '#A9A9A9'
          ]
      },
      // Bengal Famine - tragic, somber colors
      {
          name: "Bengal Famine",
          colors: [
              '#8B0000', '#DC143C', '#B22222', '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#000000'
          ]
      },
      
      // ===== MADRAS GENERATOR GLOBAL PALETTES (20) =====
      
      // Natural Dyes - authentic traditional colors
      {
          name: "Natural Dyes",
          colors: [
              '#405BAA', '#B33A3A', '#D9A43B', '#1F1E1D', '#5A7A5A', '#8C5832', '#A48E7F', '#FAF1E3'
          ]
      },
      // Expanded Traditional - extended Madras palette
      {
          name: "Expanded Traditional",
          colors: [
              '#405BAA', '#B33A3A', '#D9A43B', '#5A7A5A', '#8C5832', '#A48E7F', '#1F1E1D', '#FAF1E3'
          ]
      },
      // Bleeding Vintage - aged, worn Madras colors
      {
          name: "Bleeding Vintage",
          colors: [
              '#3A62B3', '#C13D3D', '#D9A43B', '#7DAC9B', '#D87BA1', '#7A4E8A', '#F2E4BE', '#1F1E1D'
          ]
      },
      // Warm Tamil Madras - warm South Indian tones
      {
          name: "Warm Tamil Madras",
          colors: [
              '#C13D3D', '#F5C03A', '#3E5F9A', '#88B0D3', '#ADC178', '#E77F37', '#FAF3EB', '#F2E4BE'
          ]
      },
      // Classic Red-Green - traditional Madras contrast
      {
          name: "Classic Red-Green",
          colors: [
              '#cc0033', '#ffee88', '#004477', '#ffffff', '#e63946', '#f1faee', '#a8dadc', '#457b9d'
          ]
      },
      // Vintage Tamil 04 - retro South Indian style
      {
          name: "Vintage Tamil",
          colors: [
              '#e63946', '#f1faee', '#a8dadc', '#457b9d', '#ffd700', '#b8860b', '#8b0000', '#f7c873'
          ]
      },
      // Sunset Pondicherry - French colonial colors
      {
          name: "Sunset Pondicherry",
          colors: [
              '#ffb347', '#ff6961', '#6a0572', '#fff8e7', '#1d3557', '#e63946', '#f7cac9', '#92a8d1'
          ]
      },
      // Chennai Monsoon - rainy season palette
      {
          name: "Chennai Monsoon",
          colors: [
              '#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#ffd700', '#e94f37', '#393e41', '#3f88c5'
          ]
      },
      // Kanchipuram Gold - luxurious silk colors
      {
          name: "Kanchipuram Gold",
          colors: [
              '#ffd700', '#b8860b', '#8b0000', '#fff8e7', '#cc0033', '#004477', '#e63946', '#f1faee'
          ]
      },
      // Madras Summer - hot season vibes
      {
          name: "Madras Summer",
          colors: [
              '#f7c873', '#e94f37', '#393e41', '#3f88c5', '#fff8e7', '#ffb347', '#ff6961', '#1d3557'
          ]
      },
      // Pondy Pastel - soft colonial colors
      {
          name: "Pondy Pastel",
          colors: [
              '#f7cac9', '#92a8d1', '#034f84', '#f7786b', '#fff8e7', '#393e41', '#ffb347', '#e94f37'
          ]
      },
      // Tamil Sunrise - morning light palette
      {
          name: "Tamil Sunrise",
          colors: [
              '#ffb347', '#ff6961', '#fff8e7', '#1d3557', '#e63946', '#f7c873', '#e94f37', '#393e41'
          ]
      },
      // Chettinad Spice - aromatic spice colors
      {
          name: "Chettinad Spice",
          colors: [
              '#d72631', '#a2d5c6', '#077b8a', '#5c3c92', '#f4f4f4', '#ffd700', '#8b0000', '#1a2634'
          ]
      },
      // Kerala Onam - festival celebration colors
      {
          name: "Kerala Onam",
          colors: [
              '#fff8e7', '#ffd700', '#e94f37', '#393e41', '#3f88c5', '#f7c873', '#ffb347', '#ff6961'
          ]
      },
      // Bengal Indigo - traditional dye colors
      {
          name: "Bengal Indigo",
          colors: [
              '#1a2634', '#3f88c5', '#f7c873', '#e94f37', '#fff8e7', '#ffd700', '#393e41', '#1d3557'
          ]
      },
      // Goa Beach - coastal vacation colors
      {
          name: "Goa Beach",
          colors: [
              '#f7cac9', '#f7786b', '#034f84', '#fff8e7', '#393e41', '#ffb347', '#e94f37', '#3f88c5'
          ]
      },
      // Sri Lankan Tea - island tea plantation colors
      {
          name: "Sri Lankan Tea",
          colors: [
              '#a8dadc', '#457b9d', '#e63946', '#f1faee', '#fff8e7', '#ffd700', '#8b0000', '#1d3557'
          ]
      },
      // African Madras - continental connection colors
      {
          name: "African Madras",
          colors: [
              '#ffb347', '#e94f37', '#393e41', '#3f88c5', '#ffd700', '#f7c873', '#ff6961', '#1d3557'
          ]
      },
      // Mumbai Monsoon - western coastal rains
      {
          name: "Mumbai Monsoon",
          colors: [
              '#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#ffd700', '#e94f37', '#393e41', '#3f88c5'
          ]
      },
      // Ivy League - academic prestige colors
      {
          name: "Ivy League",
          colors: [
              '#002147', '#a6192e', '#f4f4f4', '#ffd700', '#005a9c', '#00356b', '#ffffff', '#8c1515'
          ]
      }
  
  ]
    
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
      '"': ["01010","01010","01010","00000","00000","00000","00000"]
    }
    
    // Global variables for NFTExporter
    let selectedPalette = colorPalettes[0]
    let stripeData: any[] = []
    let textData: any[] = []
    let doormatTextRows: string[] = []
    let warpThickness = config.WARP_THICKNESS
    
    // Text colors (chosen from palette) - MISSING FROM ORIGINAL
    let lightTextColor: any = null
    let darkTextColor: any = null
    
    // Expose minimal globals for NFTExporter
    ;(window as any).selectedPalette = selectedPalette
    ;(window as any).stripeData = stripeData
    ;(window as any).DOORMAT_CONFIG = config
    ;(window as any).warpThickness = warpThickness
    ;(window as any).textData = textData
    ;(window as any).doormatTextRows = doormatTextRows
    
    console.log('✅ Self-contained doormat generator initialized')
    return { config, colorPalettes, characterMap, selectedPalette, stripeData, textData, doormatTextRows, warpThickness }
  }

  // Create P5.js instance using original doormat.js logic
  const createP5Instance = (doormatData: any) => {
    return new Promise<void>((resolve) => {
      if (!(window as any).p5) {
        console.error('❌ P5.js not available')
        resolve()
        return
      }

      // Prevent multiple instances
      if ((window as any).p5Instance) {
        console.log('⚠️ P5.js instance already exists, removing old one')
        ;(window as any).p5Instance.remove()
        delete (window as any).p5Instance
      }

      try {
        // Use original doormat.js setup and draw functions
        const p5Instance = new (window as any).p5((p: any) => {
          // Original setup function from doormat.js
      p.setup = () => {
            // Create canvas with swapped dimensions for 90-degree rotation (original logic)
            let canvas = p.createCanvas(doormatData.config.DOORMAT_HEIGHT + (doormatData.config.FRINGE_LENGTH * 4), 
                                       doormatData.config.DOORMAT_WIDTH + (doormatData.config.FRINGE_LENGTH * 4))
            canvas.parent('canvas-container')
            // Let CSS handle positioning - don't set styles here
        p.pixelDensity(1)
        p.noLoop()
            console.log('🎨 P5.js canvas created with original dimensions')
          }

          // Original draw function from doormat.js
      p.draw = () => {
            // Use original doormat.js draw logic
            p.background(222, 222, 222)
            
            // Rotate canvas 90 degrees clockwise (original)
            p.push()
            p.translate(p.width/2, p.height/2)
            p.rotate(p.PI/2)
            p.translate(-p.height/2, -p.width/2)
            
            // Draw the main doormat area
            p.push()
            p.translate(doormatData.config.FRINGE_LENGTH * 2, doormatData.config.FRINGE_LENGTH * 2)
            
            // Draw stripes using original logic
            for (const stripe of doormatData.stripeData) {
              drawStripeOriginal(p, stripe, doormatData)
            }
            
            // Add overall texture overlay
            drawTextureOverlayOriginal(p, doormatData)
            p.pop()
            
            // Draw fringe with adjusted positioning
            drawFringeOriginal(p, doormatData)
            drawSelvedgeEdgesOriginal(p, doormatData)
            
            p.pop() // End rotation
          }
        })

        // Store instance for later use
        ;(window as any).p5Instance = p5Instance
        resolve()
      } catch (error) {
        console.error('❌ Failed to create P5.js instance:', error)
        resolve()
      }
    })
  }

  // Generate doormat core logic (complete original logic)
  const generateDoormatCore = (seed: number, doormatData: any) => {
    console.log('🎨 Generating doormat with seed:', seed)
    
    // Set random warp thickness between 1 and 6 (like original)
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    
    // RARITY-BASED WARP THICKNESS SELECTION
    // Limited to 1-4 to prevent text clipping with 5 lines
    const warpThicknessWeights = {
      1: 0.10,  // 10% - Very thin
      2: 0.25,  // 25% - Thin
      3: 0.35,  // 35% - Medium-thin (most common)
      4: 0.30   // 30% - Medium
    }
    
    const warpThicknessRoll = seededRandom(seed * 100)
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
    
    // Update text colors and generate text data (MISSING FROM ORIGINAL)
    if ((window as any).p5Instance) {
      updateTextColors((window as any).p5Instance, doormatData)
      generateTextData(doormatData)
    }
    
    // Update global variables for NFTExporter
    ;(window as any).selectedPalette = doormatData.selectedPalette
    ;(window as any).stripeData = doormatData.stripeData
    ;(window as any).DOORMAT_CONFIG = doormatData.config
    ;(window as any).warpThickness = doormatData.warpThickness
    ;(window as any).textData = doormatData.textData
    ;(window as any).doormatTextRows = doormatData.doormatTextRows
    
    // Redraw
    if ((window as any).p5Instance) {
      (window as any).p5Instance.redraw()
    }
  }

  // Generate stripes with seeded randomness (complete original logic)
  const generateStripes = (doormatData: any, seed: number) => {
    const stripes = []
    const { config, colorPalettes } = doormatData
    
    // Simple seeded random function
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    
    // RARITY-BASED PALETTE SELECTION
    // Weighted generation for true rarity distribution
    const rarityWeights = {
      Legendary: 0.01,    // 1% chance
      Epic: 0.05,         // 5% chance  
      Rare: 0.15,         // 15% chance
      Uncommon: 0.25,     // 25% chance
      Common: 0.54        // 54% chance
    }
    
    // Roll for rarity tier first
    const rarityRoll = seededRandom(seed * 2)
    let selectedRarity = 'Common'
    let cumulativeWeight = 0
    
    console.log(`🎲 Rarity Roll: ${rarityRoll.toFixed(4)} (seed: ${seed})`)
    
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      cumulativeWeight += weight
      console.log(`  ${rarity}: ${(weight * 100).toFixed(1)}% chance (cumulative: ${(cumulativeWeight * 100).toFixed(1)}%)`)
      if (rarityRoll <= cumulativeWeight) {
        selectedRarity = rarity
        console.log(`  ✅ SELECTED: ${rarity} (roll ${rarityRoll.toFixed(4)} <= ${cumulativeWeight.toFixed(4)})`)
        break
      }
    }
    
    // Get palettes for the selected rarity tier
    const legendaryPalettes = ["Buddhist", "Maurya Empire", "Chola Dynasty", "Indigo Famine", "Bengal Famine", "Jamakalam"]
    const epicPalettes = ["Indian Peacock", "Flamingo", "Toucan", "Madras Checks", "Kanchipuram Silk", "Natural Dyes", "Bleeding Vintage"]
    const rarePalettes = ["Tamil Classical", "Sangam Era", "Pandya Dynasty", "Maratha Empire", "Rajasthani"]
    const uncommonPalettes = ["Tamil Nadu Temple", "Kerala Onam", "Chettinad Spice", "Chennai Monsoon", "Bengal Indigo"]
    
    let tierPalettes: string[] = []
    switch (selectedRarity) {
      case 'Legendary':
        tierPalettes = legendaryPalettes
        break
      case 'Epic':
        tierPalettes = epicPalettes
        break
      case 'Rare':
        tierPalettes = rarePalettes
        break
      case 'Uncommon':
        tierPalettes = uncommonPalettes
        break
      default:
        // Common - all other palettes
        tierPalettes = colorPalettes
          .filter(p => !legendaryPalettes.includes(p.name) && 
                      !epicPalettes.includes(p.name) && 
                      !rarePalettes.includes(p.name) && 
                      !uncommonPalettes.includes(p.name))
          .map(p => p.name)
    }
    
    // Select random palette from the rarity tier
    const tierPaletteIndex = Math.floor(seededRandom(seed * 3) * tierPalettes.length)
    const selectedPaletteName = tierPalettes[tierPaletteIndex]
    const palette = colorPalettes.find(p => p.name === selectedPaletteName) || colorPalettes[0]
    
    doormatData.selectedPalette = palette
    console.log(`🎯 Generated ${selectedRarity} rarity doormat with palette: ${palette.name}`)
    console.log(`📊 Available ${selectedRarity} palettes: ${tierPalettes.length} options`)
    console.log(`🎨 Selected palette index: ${tierPaletteIndex}/${tierPalettes.length - 1}`)
    
    // Original doormat.js stripe generation logic
    let totalHeight = config.DOORMAT_HEIGHT
    let currentY = 0
    
    // Decide stripe density pattern for this doormat
    let densityType = seededRandom(seed * 2)
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
        let variationType = seededRandom(seed * 3 + currentY)
        if (variationType < 0.3) {
          // 30% thin stripes within mixed
          stripeHeight = minHeight + (seededRandom(seed * 4 + currentY) * 20)
        } else if (variationType < 0.6) {
          // 30% medium stripes within mixed
          stripeHeight = minHeight + 15 + (seededRandom(seed * 5 + currentY) * (maxHeight - minHeight - 30))
        } else {
          // 40% thick stripes within mixed
          stripeHeight = maxHeight - 25 + (seededRandom(seed * 6 + currentY) * 25)
        }
      } else {
        // High/Low density: more consistent sizing
        stripeHeight = minHeight + (seededRandom(seed * 7 + currentY) * (maxHeight - minHeight))
      }
      
      // Ensure we don't exceed the total height
      if (currentY + stripeHeight > totalHeight) {
        stripeHeight = totalHeight - currentY
      }
      
      // Select colors for this stripe
      let primaryColor = palette.colors[Math.floor(seededRandom(seed * 8 + currentY) * palette.colors.length)]
      
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
      
      let hasSecondaryColor = seededRandom(seed * 9 + currentY) < secondaryColorChance
      let secondaryColor = hasSecondaryColor ? palette.colors[Math.floor(seededRandom(seed * 10 + currentY) * palette.colors.length)] : null
      
      // RARITY-BASED WEAVE PATTERN SELECTION
      // Make complex patterns rarer based on overall rarity
      let weaveRand = seededRandom(seed * 11 + currentY)
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
      
      if (weaveRand < solidChance) {
        weaveType = 'solid'
      } else if (weaveRand < solidChance + texturedChance) {
        weaveType = 'textured'
      } else {
        weaveType = 'mixed'
      }
      
      // Create stripe object (original structure)
      const stripe = {
        y: currentY,
        height: stripeHeight,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        weaveType: weaveType,
        warpVariation: seededRandom(seed * 12 + currentY) * 0.4 + 0.1 // How much the weave varies
      }
      
      stripes.push(stripe)
      currentY += stripeHeight
    }
    
    return stripes
  }

  // Original doormat.js drawStripe function
  const drawStripeOriginal = (p: any, stripe: any, doormatData: any) => {
    const config = doormatData.config
    const warpSpacing = doormatData.warpThickness + 1
    const weftSpacing = config.WEFT_THICKNESS + 1
    
    // First, draw the warp threads (vertical) as the foundation
    for (let x = 0; x < config.DOORMAT_WIDTH; x += warpSpacing) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        let warpColor = p.color(stripe.primaryColor)
        
        // Check if this position should be modified for text
        let isTextPixel = false
        if (doormatData.textData && doormatData.textData.length > 0) {
          for (let textPixel of doormatData.textData) {
            if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                y >= textPixel.y && y < textPixel.y + textPixel.height) {
              isTextPixel = true
              break
            }
          }
        }
        
        // Add subtle variation to warp threads
        let r = p.red(warpColor) + p.random(-15, 15)
        let g = p.green(warpColor) + p.random(-15, 15)
        let b = p.blue(warpColor) + p.random(-15, 15)
        
        // Modify color for text pixels (vertical lines use weft thickness)
        if (isTextPixel) {
          const bgBrightness = (r + g + b) / 3
          let tc = bgBrightness < 128 ? doormatData.lightTextColor : doormatData.darkTextColor
          r = p.red(tc); g = p.green(tc); b = p.blue(tc)
        }
        
        r = p.constrain(r, 0, 255)
        g = p.constrain(g, 0, 255)
        b = p.constrain(b, 0, 255)
        
        p.fill(r, g, b)
        p.noStroke()
        
        // Draw warp thread with slight curve for natural look
        let warpCurve = p.sin(y * 0.05) * 0.5
        p.rect(x + warpCurve, y, doormatData.warpThickness, weftSpacing)
      }
    }
    
    // Now draw the weft threads (horizontal) that interlace with warp
    for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
      for (let x = 0; x < config.DOORMAT_WIDTH; x += warpSpacing) {
        let weftColor = p.color(stripe.primaryColor)
        
        // Add variation based on weave type
        if (stripe.weaveType === 'mixed' && stripe.secondaryColor) {
          if (p.noise(x * 0.1, y * 0.1) > 0.5) {
            weftColor = p.color(stripe.secondaryColor)
          }
        } else if (stripe.weaveType === 'textured') {
          let noiseVal = p.noise(x * 0.05, y * 0.05)
          weftColor = p.lerpColor(p.color(stripe.primaryColor), p.color(255), noiseVal * 0.15)
        }
        
        // Check if this position should be modified for text
        let isTextPixel = false
        if (doormatData.textData && doormatData.textData.length > 0) {
          for (let textPixel of doormatData.textData) {
            if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                y >= textPixel.y && y < textPixel.y + textPixel.height) {
              isTextPixel = true
              break
            }
          }
        }
        
        // Add fabric irregularities
        let r = p.red(weftColor) + p.random(-20, 20)
        let g = p.green(weftColor) + p.random(-20, 20)
        let b = p.blue(weftColor) + p.random(-20, 20)
        
        // Modify color for text pixels (horizontal lines use warp thickness)
        if (isTextPixel) {
          const bgBrightness = (r + g + b) / 3
          let tc = bgBrightness < 128 ? doormatData.lightTextColor : doormatData.darkTextColor
          r = p.red(tc); g = p.green(tc); b = p.blue(tc)
        }
        
        r = p.constrain(r, 0, 255)
        g = p.constrain(g, 0, 255)
        b = p.constrain(b, 0, 255)
        
        p.fill(r, g, b)
        p.noStroke()
        
        // Draw weft thread with slight curve
        let weftCurve = p.cos(x * 0.05) * 0.5
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
        let noiseVal = p.noise(x * 0.02, y * 0.02)
        let hatchingIntensity = p.map(noiseVal, 0, 1, 0, 50)
        
        p.fill(0, 0, 0, hatchingIntensity)
        p.noStroke()
        p.rect(x, y, 2, 2)
      }
    }
    
    // Add subtle relief effect to show the bumpy, cloth-like surface
    for (let x = 0; x < config.DOORMAT_WIDTH; x += 6) {
      for (let y = 0; y < config.DOORMAT_HEIGHT; y += 6) {
        let reliefNoise = p.noise(x * 0.03, y * 0.03)
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

  // Original doormat.js drawFringe function
  const drawFringeOriginal = (p: any, doormatData: any) => {
    const config = doormatData.config
    // Top fringe (warp ends)
    drawFringeSectionOriginal(p, config.FRINGE_LENGTH * 2, config.FRINGE_LENGTH, config.DOORMAT_WIDTH, config.FRINGE_LENGTH, 'top', doormatData)
    
    // Bottom fringe (warp ends)
    drawFringeSectionOriginal(p, config.FRINGE_LENGTH * 2, config.FRINGE_LENGTH * 2 + config.DOORMAT_HEIGHT, config.DOORMAT_WIDTH, config.FRINGE_LENGTH, 'bottom', doormatData)
  }

  // Original doormat.js drawFringeSection function
  const drawFringeSectionOriginal = (p: any, x: number, y: number, w: number, h: number, side: string, doormatData: any) => {
    let fringeStrands = w / 12
    let strandWidth = w / fringeStrands
    
    for (let i = 0; i < fringeStrands; i++) {
      let strandX = x + i * strandWidth
      
      let strandColor = p.random(doormatData.selectedPalette.colors)
      
      // Draw individual fringe strand with thin threads
      for (let j = 0; j < 12; j++) {
        let threadX = strandX + p.random(-strandWidth/6, strandWidth/6)
        let startY = side === 'top' ? y + h : y
        let endY = side === 'top' ? y : y + h
        
        // Add natural curl/wave to the fringe with more variation
        let waveAmplitude = p.random(1, 4)
        let waveFreq = p.random(0.2, 0.8)
        
        // Randomize the direction and intensity for each thread
        let direction = p.random([-1, 1])
        let curlIntensity = p.random(0.5, 2.0)
        let threadLength = p.random(0.8, 1.2)
        
        // Use darker version of strand color for fringe
        let fringeColor = p.color(strandColor)
        let r = p.red(fringeColor) * 0.7
        let g = p.green(fringeColor) * 0.7
        let b = p.blue(fringeColor) * 0.7
        
        p.stroke(r, g, b)
        p.strokeWeight(p.random(0.5, 1.2))
        
        p.noFill()
        p.beginShape()
        for (let t = 0; t <= 1; t += 0.1) {
          let yPos = p.lerp(startY, endY, t * threadLength)
          let xOffset = p.sin(t * p.PI * waveFreq) * waveAmplitude * t * direction * curlIntensity
          // Add more randomness and natural variation
          xOffset += p.random(-1, 1)
          // Add occasional kinks and bends
          if (p.random() < 0.3) {
            xOffset += p.random(-2, 2)
          }
          p.vertex(threadX + xOffset, yPos)
        }
        p.endShape()
      }
    }
  }

  // Original doormat.js drawSelvedgeEdges function
  const drawSelvedgeEdgesOriginal = (p: any, doormatData: any) => {
    const config = doormatData.config
    let weftSpacing = config.WEFT_THICKNESS + 1
    let isFirstWeft = true
    
    // Left selvedge edge - flowing semicircular weft threads
    for (const stripe of doormatData.stripeData) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        // Skip the very first weft thread
        if (isFirstWeft) {
          isFirstWeft = false
          continue
        }
        
        // Get the color from the current stripe
        let selvedgeColor = p.color(stripe.primaryColor)
        
        // Check if there's a secondary color for blending
        if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
          let secondaryColor = p.color(stripe.secondaryColor)
          let blendFactor = p.noise(y * 0.1) * 0.5 + 0.5
          selvedgeColor = p.lerpColor(selvedgeColor, secondaryColor, blendFactor)
        }
        
        let r = p.red(selvedgeColor) * 0.8
        let g = p.green(selvedgeColor) * 0.8
        let b = p.blue(selvedgeColor) * 0.8
        
        p.fill(r, g, b)
        p.noStroke()
        
        let radius = config.WEFT_THICKNESS * p.random(1.2, 1.8)
        let centerX = config.FRINGE_LENGTH * 2 + p.random(-2, 2)
        let centerY = config.FRINGE_LENGTH * 2 + y + config.WEFT_THICKNESS/2 + p.random(-1, 1)
        
        // Vary the arc angles for more natural look
        let startAngle = p.HALF_PI + p.random(-0.2, 0.2)
        let endAngle = -p.HALF_PI + p.random(-0.2, 0.2)
        
        // Draw textured semicircle with individual thread details
        drawTexturedSelvedgeArcOriginal(p, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'left')
      }
    }
    
    // Right selvedge edge - flowing semicircular weft threads
    let isFirstWeftRight = true
    for (const stripe of doormatData.stripeData) {
      for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
        // Skip the very first weft thread
        if (isFirstWeftRight) {
          isFirstWeftRight = false
          continue
        }
        
        // Get the color from the current stripe
        let selvedgeColor = p.color(stripe.primaryColor)
        
        // Check if there's a secondary color for blending
        if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
          let secondaryColor = p.color(stripe.secondaryColor)
          let blendFactor = p.noise(y * 0.1) * 0.5 + 0.5
          selvedgeColor = p.lerpColor(selvedgeColor, secondaryColor, blendFactor)
        }
        
        let r = p.red(selvedgeColor) * 0.8
        let g = p.green(selvedgeColor) * 0.8
        let b = p.blue(selvedgeColor) * 0.8
        
        p.fill(r, g, b)
        p.noStroke()
        
        let radius = config.WEFT_THICKNESS * p.random(1.2, 1.8)
        let centerX = config.FRINGE_LENGTH * 2 + config.DOORMAT_WIDTH + p.random(-2, 2)
        let centerY = config.FRINGE_LENGTH * 2 + y + config.WEFT_THICKNESS/2 + p.random(-1, 1)
        
        // Vary the arc angles for more natural look
        let startAngle = -p.HALF_PI + p.random(-0.2, 0.2)
        let endAngle = p.HALF_PI + p.random(-0.2, 0.2)
        
        // Draw textured semicircle with individual thread details
        drawTexturedSelvedgeArcOriginal(p, centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right')
      }
    }
  }

  // Original doormat.js drawTexturedSelvedgeArc function
  const drawTexturedSelvedgeArcOriginal = (p: any, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, r: number, g: number, b: number, side: string) => {
    // Draw a realistic textured selvedge arc with visible woven texture
    let threadCount = p.max(6, p.floor(radius / 1.2))
    let threadSpacing = radius / threadCount
    
    // Draw individual thread arcs to create visible woven texture
    for (let i = 0; i < threadCount; i++) {
      let threadRadius = radius - (i * threadSpacing)
      
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
      threadR = p.constrain(threadR + p.random(-10, 10), 0, 255)
      threadG = p.constrain(threadG + p.random(-10, 10), 0, 255)
      threadB = p.constrain(threadB + p.random(-10, 10), 0, 255)
      
      p.fill(threadR, threadG, threadB, 88)
      
      // Draw individual thread arc with slight position variation
      let threadX = centerX + p.random(-1, 1)
      let threadY = centerY + p.random(-1, 1)
      let threadStartAngle = startAngle + p.random(-0.1, 0.1)
      let threadEndAngle = endAngle + p.random(-0.1, 0.1)
      
      p.arc(threadX, threadY, threadRadius * 2, threadRadius * 2, threadStartAngle, threadEndAngle)
    }
    
    // Add a few more detailed texture layers
    for (let i = 0; i < 3; i++) {
      let detailRadius = radius * (0.3 + i * 0.2)
      let detailAlpha = 180 - (i * 40)
      
      // Create contrast for visibility
      let detailR = p.constrain(r + (i % 2 === 0 ? 15 : -15), 0, 255)
      let detailG = p.constrain(g + (i % 2 === 0 ? 15 : -15), 0, 255)
      let detailB = p.constrain(b + (i % 2 === 0 ? 15 : -15), 0, 255)
      
      p.fill(detailR, detailG, detailB, detailAlpha * 0.7)
      
      let detailX = centerX + p.random(-0.5, 0.5)
      let detailY = centerY + p.random(-0.5, 0.5)
      let detailStartAngle = startAngle + p.random(-0.05, 0.05)
      let detailEndAngle = endAngle + p.random(-0.05, 0.05)
      
      p.arc(detailX, detailY, detailRadius * 2, detailRadius * 2, detailStartAngle, detailEndAngle)
    }
    
    // Add subtle shadow for depth
    p.fill(r * 0.6, g * 0.6, b * 0.6, 70)
    let shadowOffset = side === 'left' ? 1 : -1
    p.arc(centerX + shadowOffset, centerY + 1, radius * 2, radius * 2, startAngle, endAngle)
    
    // Add small transparent hole in the center
    p.noFill()
    p.arc(centerX, centerY, radius * 0.5, radius * 0.5, startAngle, endAngle)
    
    // Add visible texture details - small bumps and knots
    for (let i = 0; i < 8; i++) {
      let detailAngle = p.random(startAngle, endAngle)
      let detailRadius = radius * p.random(0.2, 0.7)
      let detailX = centerX + p.cos(detailAngle) * detailRadius
      let detailY = centerY + p.sin(detailAngle) * detailRadius
      
      // Alternate between light and dark for visible contrast
      if (i % 2 === 0) {
        p.fill(r + 20, g + 20, b + 20, 120)
      } else {
        p.fill(r - 15, g - 15, b - 15, 120)
      }
      
      p.noStroke()
      p.ellipse(detailX, detailY, p.random(1.5, 3.5), p.random(1.5, 3.5))
    }
  }

  // MISSING TEXT FUNCTIONS FROM ORIGINAL DOORMAT.JS

  // Update text colors based on palette (original function)
  const updateTextColors = (p: any, doormatData: any) => {
    if (!doormatData.selectedPalette || !doormatData.selectedPalette.colors) return
    
    let darkest = doormatData.selectedPalette.colors[0]
    let lightest = doormatData.selectedPalette.colors[0]
    let darkestVal = 999, lightestVal = -1
    
    for (let hex of doormatData.selectedPalette.colors) {
      let c = p.color(hex)
      let bright = (p.red(c) + p.green(c) + p.blue(c)) / 3
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

    // Rotate 90° CCW: newX = col, newY = numRows - 1 - row
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (charDef[row][col] === '1') {
          // Rotate 180°: flip both axes
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
      
      // Initialize self-contained doormat generator
      const doormatData = initializeDoormat()
      ;(window as any).doormatData = doormatData // Store globally for access
      console.log('✅ Doormat generator initialized')
      
      // Create P5.js instance
      await createP5Instance(doormatData)
      console.log('✅ P5.js instance created')
      
      // Generate initial doormat
      generateDoormatCore(currentSeed, doormatData)
      
      // Update UI
      setIsLoaded(true)
      
    } catch (error) {
      console.error('❌ Initialization failed:', error)
      setIsLoaded(true) // Show UI anyway
    }
  }

  // Update palette display
  const updatePaletteDisplay = () => {
    if ((window as any).selectedPalette) {
      setPalette((window as any).selectedPalette)
      console.log('🎨 Palette updated:', (window as any).selectedPalette)
    }
  }

  // COMPREHENSIVE TRAIT CALCULATION SYSTEM (from original trait-calculator.js)

  // Get palette rarity classification
  const getPaletteRarity = (paletteName: string) => {
    const legendaryPalettes = ["Buddhist", "Maurya Empire", "Chola Dynasty", "Indigo Famine", "Bengal Famine", "Jamakalam"]
    const epicPalettes = ["Indian Peacock", "Flamingo", "Toucan", "Madras Checks", "Kanchipuram Silk", "Natural Dyes", "Bleeding Vintage"]
    const rarePalettes = ["Tamil Classical", "Sangam Era", "Pandya Dynasty", "Maratha Empire", "Rajasthani"]
    const uncommonPalettes = ["Tamil Nadu Temple", "Kerala Onam", "Chettinad Spice", "Chennai Monsoon", "Bengal Indigo"]
    
    if (legendaryPalettes.includes(paletteName)) return "Legendary"
    if (epicPalettes.includes(paletteName)) return "Epic"
    if (rarePalettes.includes(paletteName)) return "Rare"
    if (uncommonPalettes.includes(paletteName)) return "Uncommon"
    return "Common"
  }

  // Calculate stripe complexity
  const calculateStripeComplexity = (stripeData: any[]) => {
    if (!stripeData || stripeData.length === 0) return "Basic"
    
    let complexityScore = 0
    let mixedCount = 0
    let texturedCount = 0
    let solidCount = 0
    let secondaryColorCount = 0
    
    // Count different pattern types
    for (let stripe of stripeData) {
      if (stripe.weaveType === 'mixed') {
        mixedCount++
        complexityScore += 2 // Mixed weave adds more complexity
      } else if (stripe.weaveType === 'textured') {
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

  // Calculate comprehensive traits
  const calculateTraits = () => {
    const data = {
      doormatTextRows: (window as any).doormatTextRows || [],
      selectedPalette: (window as any).selectedPalette || null,
      stripeData: (window as any).stripeData || []
    }
    
    const textLines = data.doormatTextRows.length
    const totalCharacters = data.doormatTextRows.reduce((sum: number, row: string) => sum + row.length, 0)
    const stripeCount = data.stripeData.length
    const stripeComplexity = calculateStripeComplexity(data.stripeData)
    const paletteName = data.selectedPalette ? data.selectedPalette.name : "Unknown"
    
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
      
      // Additional traits
      warpThickness: {
        value: (window as any).warpThickness || 2,
        rarity: getWarpThicknessRarity((window as any).warpThickness || 2)
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

  // Generate new doormat
  const generateNew = () => {
    const seed = Math.floor(Math.random() * 10000)
    setCurrentSeed(seed)
    
    if ((window as any).p5Instance) {
      console.log('🎨 Generating new doormat with seed:', seed)
      generateDoormatCore(seed, (window as any).doormatData)
      
      // Update UI
      setTimeout(() => {
        updatePaletteDisplay()
        updateTraitsDisplay()
      }, 100)
    } else {
      console.error('❌ Cannot generate: P5.js instance not available')
    }
  }

  // Generate from seed
  const generateFromSeed = () => {
    if ((window as any).p5Instance) {
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
    if ((window as any).p5Instance) {
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
      setCurrentRowCount(prev => prev - 1)
      setTextInputs(prev => prev.filter((_, i) => i !== index))
    }
  }

  // Update text input
  const updateTextInput = (index: number, value: string) => {
    const newInputs = [...textInputs]
    // Allow A-Z, 0-9, space, and all expressive characters: ? _ ! @ # $ & % + - ( ) [ ] * = ' "
    newInputs[index] = value.toUpperCase().replace(/[^A-Z0-9 ?_!@#$&%+\-()[\]*='"]/g, '').slice(0, 11)
    setTextInputs(newInputs)
  }

  // Add text to doormat
  const addTextToDoormat = () => {
    const validTexts = textInputs.filter(text => text.trim().length > 0)
    
    if (validTexts.length > 0 && (window as any).doormatData) {
      (window as any).doormatData.doormatTextRows = validTexts
      console.log('📝 Text added to doormat:', validTexts)
      
      // Update text colors and generate text data
      if ((window as any).p5Instance) {
        updateTextColors((window as any).p5Instance, (window as any).doormatData)
        generateTextData((window as any).doormatData)
      }
      
      // Update global text data
      ;(window as any).textData = (window as any).doormatData.textData
      ;(window as any).doormatTextRows = (window as any).doormatData.doormatTextRows
      
      // Redraw
      if ((window as any).p5Instance) {
        (window as any).p5Instance.redraw()
      }
    }
  }

  // Clear text
  const clearText = () => {
    setTextInputs([''])
    setCurrentRowCount(1)
    
    if ((window as any).doormatData) {
      (window as any).doormatData.doormatTextRows = []
      ;(window as any).doormatData.textData = []
      
      // Update global text data
      ;(window as any).textData = []
      ;(window as any).doormatTextRows = []
      
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
      if ((window as any).p5Instance) {
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
          
          canvas.style.width = '100%'
          canvas.style.height = '100%'
          canvas.style.maxWidth = '100%'
          canvas.style.maxHeight = '100%'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navigation />
      <div className="max-w-[1800px] mx-auto px-4 pt-24">
      {/* Header */}

        {/* Old-School Terminal Layout - Art on Top, Terminal on Bottom */}
        <div className="space-y-0">
          {/* Canvas Display - Full Width at Top */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full mb-0"
          >
            <div className="bg-black border-b border-green-500/50 p-4">
              <h2 className="text-lg font-bold text-green-400 text-center font-mono mb-6">🎨 RUG GENERATOR v1.0</h2>
              
                            {/* Old-School CRT Monitor Box */}
              <div className="relative mx-auto w-full max-w-6xl">
                {/* Monitor Bezel - Yellowed Plastic */}
                <div className="bg-amber-100 border-6 border-amber-200 rounded-t-2xl rounded-b-xl p-4 md:p-6 lg:p-8 shadow-2xl">
                  {/* Monitor Screen Area */}
                  <div className="bg-gray-800 rounded-lg px-2 md:px-4 py-2 border-3 border-gray-700 shadow-inner">
                    {/* CRT Screen with Scan Lines Effect */}
                    <div className="bg-black rounded-lg px-2 border-2 border-gray-600 relative overflow-hidden">
                      {/* Scan Lines Overlay */}
                      <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
                        zIndex: 1
                      }}></div>
                      
                                                                    {/* Canvas Container - Match P5.js canvas dimensions exactly */}
                                                 <div 
                           ref={canvasContainerRef}
                           id="canvas-container"
                           className="bg-gray-900 rounded-lg relative mx-auto border border-green-500/30"
                          style={{ 
                            width: '100%',     // Responsive width
                            height: '600px',   // Fixed height for aspect ratio
                            maxWidth: '100%',  // Responsive constraint
                            overflow: 'hidden', // Prevent canvas overflow
                            boxShadow: '0 0 20px rgba(0, 255, 0, 0.1)',
                            position: 'relative', // Ensure proper positioning context for loading overlay
                            zIndex: 2 // Above scan lines
                          }}
                        >
                        {!isLoaded && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-green-400 bg-gray-900 rounded-lg">
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
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                          }
                        `}</style>
                      </div>
                </div>
              </div>

                  {/* Monitor Base - Taller Frame with Logo */}
                  <div className="bg-amber-100 mt-4 pt-6 pb-8 rounded-b-xl border-t-6 border-amber-200">
                    {/* Rugpull Computer Logo and Text */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-20 h-20 bg-white rounded-full p-2 shadow-lg border-2 border-amber-300">
                        <img 
                          src="/rugpull_computer_logo.png" 
                          alt="Rugpull Computer Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-amber-800" style={{ fontFamily: 'Apple Garamond, Garamond, serif' }}>
                          Rugpull Computer
                        </h3>
                        <p className="text-xs text-amber-700 mt-1" style={{ fontFamily: 'Apple Garamond, Garamond, serif' }}>
                          Generative Art Terminal
                        </p>
                      </div>
                    </div>

                {/* NFT Traits Display */}
                {traits && (
                  <div className="mt-6 pt-4 border-t border-green-500/30">
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
              </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Terminal Interface - Fixed at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <div className="bg-black text-green-400 p-6 font-mono border-t-2 border-green-500">
              {/* Terminal Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-green-500/30">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">$</span>
                  <span className="text-green-300">rug-generator</span>
                  <span className="text-green-500">&gt;</span>
                </div>
                <div className="text-sm text-green-500">
                  {isLoaded ? 'READY' : 'LOADING...'}
                  </div>
              </div>
              
              {/* Simple Terminal Commands */}
              <div className="space-y-4">
                {/* Generate and Save */}
                <div className="flex gap-3">
                  <button
                    onClick={generateNew}
                    disabled={!isLoaded}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-black font-bold px-6 py-3 rounded font-mono transition-colors border border-green-400"
                  >
                    <Shuffle className="w-5 h-5 mr-2" />
                    GENERATE
                  </button>
                  <button
                    onClick={saveDoormat}
                    disabled={!isLoaded}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-3 rounded font-mono transition-colors border border-blue-400"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    SAVE
                  </button>
                </div>
                
                {/* Text Input */}
                <div className="space-y-3">
                  <div className="text-green-300 text-sm">Add text to rug (max 11 chars per row): A-Z, 0-9, space, ? _ ! @ # $ & % + - ( ) [ ] * = &apos; &quot;</div>
                  {textInputs.map((text, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-green-400 font-mono">$</span>
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => updateTextInput(index, e.target.value)}
                        placeholder={`text_${index + 1}`}
                        maxLength={11}
                        className="flex-1 px-3 py-2 bg-gray-900 border border-green-500/50 text-green-400 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                      />
                      {index > 0 && (
                        <button
                          onClick={() => removeTextRow(index)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-mono transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Text Control Buttons */}
                  <div className="flex gap-3 pt-2">
                    {currentRowCount < 5 && (
                      <button
                        onClick={addTextRow}
                        className="bg-green-600 hover:bg-green-700 text-black font-bold px-4 py-2 rounded font-mono transition-colors border border-green-400"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        ADD ROW
                      </button>
                    )}
                    <button
                      onClick={addTextToDoormat}
                      disabled={!isLoaded}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-4 py-2 rounded font-mono transition-colors border border-purple-400"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      EMBED TEXT
                    </button>
                    <button
                      onClick={clearText}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-mono transition-colors border border-gray-400"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
                
                {/* NFT Export Section */}
                <div className="border-t border-green-500/30 pt-4">
                  <NFTExporter 
                    currentSeed={currentSeed}
                    currentPalette={null}
                    currentStripeData={[]}
                    textRows={textInputs}
                  />
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
    </div>
  )
}
