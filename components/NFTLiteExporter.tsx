import React, { useState } from 'react';
import { initPRNG, getPRNG, createDerivedPRNG } from '@/lib/DeterministicPRNG';

interface NFTExporterProps {
  currentSeed: number;
  currentPalette: any;
  currentStripeData: any[];
  textRows: string[];
}

const NFTExporter: React.FC<NFTExporterProps> = ({
  currentSeed,
  currentPalette,
  currentStripeData,
  textRows
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Add default values and null checks
  const safeSeed = currentSeed || 42;
  const safePalette = currentPalette || { name: 'Default', colors: ['#000000', '#FFFFFF'] };
  const safeStripeData = currentStripeData || [];
  const safeTextRows = textRows || [];

  // COMPLETE ALGORITHM FROM PAGE.TSX - SYNCHRONIZED VERSION
  
  // Complete color palettes array (100+ palettes from page.tsx)
  const colorPalettes = [
    // ===== GLOBAL PALETTES (25) =====
    {
        name: "Classic Red & Black",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D'
        ]
    },
    {
        name: "Natural Jute & Hemp",
        colors: [
            '#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#8B7355', '#A0522D', '#654321', '#2F2F2F'
        ]
    },
    {
        name: "Coastal Blue & White",
        colors: [
            '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#F8F8FF', '#F0F8FF', '#E6E6FA', '#B0C4DE'
        ]
    },
    {
        name: "Rustic Farmhouse",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#F5DEB3', '#F4E4BC'
        ]
    },
    {
        name: "Modern Gray & White",
        colors: [
            '#F5F5F5', '#FFFFFF', '#D3D3D3', '#C0C0C0', '#A9A9A9', '#808080', '#696969', '#2F2F2F'
        ]
    },
    {
        name: "Autumn Harvest",
        colors: [
            '#8B4513', '#D2691E', '#CD853F', '#F4A460', '#8B0000', '#B22222', '#FF8C00', '#FFA500'
        ]
    },
    {
        name: "Spring Garden",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#FF69B4', '#FFB6C1', '#87CEEB', '#F0E68C'
        ]
    },
    {
        name: "Industrial Metal",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#000000'
        ]
    },
    {
        name: "Mediterranean",
        colors: [
            '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#F4A460', '#DEB887', '#87CEEB', '#4682B4'
        ]
    },
    {
        name: "Scandinavian",
        colors: [
            '#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#6C757D', '#495057'
        ]
    },
    {
        name: "Nordic Forest",
        colors: [
            '#2D5016', '#3A5F0B', '#4A7C59', '#5D8B66', '#6B8E23', '#8FBC8F', '#9ACD32', '#ADFF2F'
        ]
    },
    {
        name: "Desert Sunset",
        colors: [
            '#CD853F', '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F', '#8B4513', '#A0522D', '#D2691E'
        ]
    },
    {
        name: "Arctic Ice",
        colors: [
            '#F0F8FF', '#E6E6FA', '#B0C4DE', '#87CEEB', '#B0E0E6', '#F0FFFF', '#E0FFFF', '#F5F5F5'
        ]
    },
    {
        name: "Tropical Paradise",
        colors: [
            '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#32CD32', '#90EE90', '#98FB98', '#00CED1'
        ]
    },
    {
        name: "Vintage Retro",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#BC8F8F', '#8B7355', '#F5DEB3', '#F4E4BC'
        ]
    },
    {
        name: "Art Deco",
        colors: [
            '#000000', '#2F2F2F', '#696969', '#8B4513', '#A0522D', '#CD853F', '#F5DEB3', '#FFFFFF'
        ]
    },
    {
        name: "Bohemian",
        colors: [
            '#8E44AD', '#9B59B6', '#E67E22', '#D35400', '#E74C3C', '#C0392B', '#16A085', '#1ABC9C'
        ]
    },
    {
        name: "Minimalist",
        colors: [
            '#FFFFFF', '#F5F5F5', '#E0E0E0', '#CCCCCC', '#999999', '#666666', '#333333', '#000000'
        ]
    },
    {
        name: "Corporate",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
        ]
    },
    {
        name: "Luxury",
        colors: [
            '#000000', '#2F2F2F', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F5DEB3', '#FFD700'
        ]
    },
    {
        name: "Pastel Dreams",
        colors: [
            '#FFB6C1', '#FFC0CB', '#FFE4E1', '#F0E68C', '#98FB98', '#90EE90', '#87CEEB', '#E6E6FA'
        ]
    },
    {
        name: "Earth Tones",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    {
        name: "Ocean Depths",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#E0FFFF'
        ]
    },
    {
        name: "Mountain Mist",
        colors: [
            '#2F4F4F', '#4A5D6B', '#5F7A7A', '#6B8E8E', '#87CEEB', '#B0C4DE', '#E6E6FA', '#F0F8FF'
        ]
    },
    {
        name: "Sunset Glow",
        colors: [
            '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#DC143C', '#8B0000', '#2F2F2F'
        ]
    },
    
    // ===== INDIAN CULTURAL PALETTES (18) =====
    {
        name: "Rajasthani",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    {
        name: "Kerala",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    {
        name: "Gujarat",
        colors: [
            '#FF4500', '#FF6347', '#FFD700', '#FFA500', '#DC143C', '#4B0082', '#32CD32', '#FFFFFF'
        ]
    },
    {
        name: "Punjab",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'
        ]
    },
    {
        name: "Bengal",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#F5DEB3', '#DEB887', '#8B4513', '#4682B4', '#000080'
        ]
    },
    {
        name: "Kashmir",
        colors: [
            '#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'
        ]
    },
    {
        name: "Maharashtra",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    {
        name: "Tamil Nadu",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    {
        name: "Karnataka",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    {
        name: "Andhra Pradesh",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    {
        name: "Telangana",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
        ]
    },
    {
        name: "Odisha",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    {
        name: "Madhya Pradesh",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    {
        name: "Uttar Pradesh",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    {
        name: "Bihar",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    {
        name: "West Bengal",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    {
        name: "Assam",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    {
        name: "Himachal Pradesh",
        colors: [
            '#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'
        ]
    },
    
    // ===== TAMIL CULTURAL PALETTES (11) =====
    {
        name: "Tamil Classical",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    {
        name: "Sangam Era",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    {
        name: "Chola Dynasty",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    {
        name: "Pandya Kingdom",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    {
        name: "Chera Dynasty",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#8B4513', '#A0522D', '#FFD700', '#00CED1', '#000080'
        ]
    },
    {
        name: "Pallava Empire",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    {
        name: "Vijayanagara",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'
        ]
    },
    {
        name: "Nayak Dynasty",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    {
        name: "Maratha Rule",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    {
        name: "British Colonial",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
        ]
    },
    {
        name: "Modern Tamil",
        colors: [
            '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F5F5F5', '#FFFFFF'
        ]
    },
    {
        name: "Jamakalam",
        colors: [
            '#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#4B0082', '#000000'
        ]
    },
    
    // ===== NATURAL DYE PALETTES (8) =====
    {
        name: "Indigo Dye",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#E0FFFF'
        ]
    },
    {
        name: "Madder Root",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF6347', '#CD5C5C', '#F08080', '#FA8072'
        ]
    },
    {
        name: "Turmeric",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#DAA520', '#B8860B', '#CD853F'
        ]
    },
    {
        name: "Henna",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    {
        name: "Pomegranate",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF6347', '#CD5C5C', '#F08080', '#FA8072'
        ]
    },
    {
        name: "Neem",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    {
        name: "Saffron",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#DAA520', '#B8860B', '#CD853F'
        ]
    },
    {
        name: "Marigold",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#FF1493', '#FF69B4', '#FFB6C1'
        ]
    },
    
    // ===== MADRAS CHECKS & TAMIL NADU INSPIRED PALETTES (8) =====
    {
        name: "Madras Checks",
        colors: [
            '#8B0000', '#DC143C', '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    {
        name: "Tamil Nadu Temple",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    {
        name: "Kanchipuram Silk",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    {
        name: "Thanjavur Art",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#8B0000', '#228B22', '#006400'
        ]
    },
    {
        name: "Chettinad Architecture",
        colors: [
            '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F'
        ]
    },
    {
        name: "Madurai Meenakshi",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FF1493', '#8B0000', '#4B0082', '#000080'
        ]
    },
    {
        name: "Coimbatore Cotton",
        colors: [
            '#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#8B7355', '#A0522D', '#654321', '#2F2F2F'
        ]
    },
    {
        name: "Salem Silk",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    
    // ===== WESTERN GHATS BIRDS PALETTES (6) =====
    {
        name: "Indian Peacock",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#00CED1', '#40E0D0', '#48D1CC', '#20B2AA'
        ]
    },
    {
        name: "Flamingo",
        colors: [
            '#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB', '#FF6347', '#FF4500', '#FF8C00', '#FFA500'
        ]
    },
    {
        name: "Toucan",
        colors: [
            '#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500', '#000000', '#FFFFFF', '#FF1493'
        ]
    },
    {
        name: "Malabar Trogon",
        colors: [
            '#8B0000', '#DC143C', '#FFD700', '#FFA500', '#228B22', '#32CD32', '#000000', '#FFFFFF'
        ]
    },
    {
        name: "Nilgiri Flycatcher",
        colors: [
            '#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF', '#E6E6FA', '#B0C4DE', '#4682B4', '#000080'
        ]
    },
    {
        name: "Malabar Parakeet",
        colors: [
            '#228B22', '#32CD32', '#90EE90', '#98FB98', '#8B4513', '#A0522D', '#CD853F', '#D2691E'
        ]
    },
    
    // ===== HISTORICAL DYNASTY & CULTURAL PALETTES (6) =====
    {
        name: "Pandya Dynasty",
        colors: [
            '#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#00CED1', '#87CEEB', '#4682B4', '#000080'
        ]
    },
    {
        name: "Maratha Empire",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#FF4500', '#FF8C00', '#FFD700', '#228B22', '#006400'
        ]
    },
    {
        name: "Maurya Empire",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#FFD700', '#FFA500', '#8B4513', '#A0522D'
        ]
    },
    {
        name: "Buddhist",
        colors: [
            '#FFD700', '#FFA500', '#8B4513', '#A0522D', '#228B22', '#32CD32', '#90EE90', '#FFFFFF'
        ]
    },
    
    // ===== FAMINE & HISTORICAL PERIOD PALETTES (2) =====
    {
        name: "Indigo Famine",
        colors: [
            '#000080', '#191970', '#4169E1', '#4682B4', '#2F4F4F', '#696969', '#808080', '#A9A9A9'
        ]
    },
    {
        name: "Bengal Famine",
        colors: [
            '#8B0000', '#DC143C', '#B22222', '#2F4F4F', '#696969', '#808080', '#A9A9A9', '#000000'
        ]
    },
    
    // ===== MADRAS GENERATOR GLOBAL PALETTES (20) =====
    {
        name: "Natural Dyes",
        colors: [
            '#405BAA', '#B33A3A', '#D9A43B', '#1F1E1D', '#5A7A5A', '#8C5832', '#A48E7F', '#FAF1E3'
        ]
    },
    {
        name: "Expanded Traditional",
        colors: [
            '#405BAA', '#B33A3A', '#D9A43B', '#5A7A5A', '#8C5832', '#A48E7F', '#1F1E1D', '#FAF1E3'
        ]
    },
    {
        name: "Bleeding Vintage",
        colors: [
            '#3A62B3', '#C13D3D', '#D9A43B', '#7DAC9B', '#D87BA1', '#7A4E8A', '#F2E4BE', '#1F1E1D'
        ]
    },
    {
        name: "Warm Tamil Madras",
        colors: [
            '#C13D3D', '#F5C03A', '#3E5F9A', '#88B0D3', '#ADC178', '#E77F37', '#FAF3EB', '#F2E4BE'
        ]
    },
    {
        name: "Classic Red-Green",
        colors: [
            '#cc0033', '#ffee88', '#004477', '#ffffff', '#e63946', '#f1faee', '#a8dadc', '#457b9d'
        ]
    },
    {
        name: "Vintage Tamil",
        colors: [
            '#e63946', '#f1faee', '#a8dadc', '#457b9d', '#ffd700', '#b8860b', '#8b0000', '#f7c873'
        ]
    },
    {
        name: "Sunset Pondicherry",
        colors: [
            '#ffb347', '#ff6961', '#6a0572', '#fff8e7', '#1d3557', '#e63946', '#f7cac9', '#92a8d1'
        ]
    },
    {
        name: "Chennai Monsoon",
        colors: [
            '#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#ffd700', '#e94f37', '#393e41', '#3f88c5'
        ]
    },
    {
        name: "Kanchipuram Gold",
        colors: [
            '#ffd700', '#b8860b', '#8b0000', '#fff8e7', '#cc0033', '#004477', '#e63946', '#f1faee'
        ]
    },
    {
        name: "Madras Summer",
        colors: [
            '#f7c873', '#e94f37', '#393e41', '#3f88c5', '#fff8e7', '#ffb347', '#ff6961', '#1d3557'
        ]
    },
    {
        name: "Pondy Pastel",
        colors: [
            '#f7cac9', '#92a8d1', '#034f84', '#f7786b', '#fff8e7', '#393e41', '#ffb347', '#e94f37'
        ]
    },
    {
        name: "Tamil Sunrise",
        colors: [
            '#ffb347', '#ff6961', '#fff8e7', '#1d3557', '#e63946', '#f7c873', '#e94f37', '#393e41'
        ]
    },
    {
        name: "Chettinad Spice",
        colors: [
            '#d72631', '#a2d5c6', '#077b8a', '#5c3c92', '#f4f4f4', '#ffd700', '#8b0000', '#1a2634'
        ]
    },
    {
        name: "Kerala Onam",
        colors: [
            '#fff8e7', '#ffd700', '#e94f37', '#393e41', '#3f88c5', '#f7c873', '#ffb347', '#ff6961'
        ]
    },
    {
        name: "Bengal Indigo",
        colors: [
            '#1a2634', '#3f88c5', '#f7c873', '#e94f37', '#fff8e7', '#ffd700', '#393e41', '#1d3557'
        ]
    },
    {
        name: "Goa Beach",
        colors: [
            '#f7cac9', '#f7786b', '#034f84', '#fff8e7', '#393e41', '#ffb347', '#e94f37', '#3f88c5'
        ]
    },
    {
        name: "Sri Lankan Tea",
        colors: [
            '#a8dadc', '#457b9d', '#e63946', '#f1faee', '#fff8e7', '#ffd700', '#8b0000', '#1d3557'
        ]
    },
    {
        name: "African Madras",
        colors: [
            '#ffb347', '#e94f37', '#393e41', '#3f88c5', '#ffd700', '#f7c873', '#ff6961', '#1d3557'
        ]
    },
    {
        name: "Mumbai Monsoon",
        colors: [
            '#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#ffd700', '#e94f37', '#393e41', '#3f88c5'
        ]
    },
    {
        name: "Ivy League",
        colors: [
            '#002147', '#a6192e', '#f4f4f4', '#ffd700', '#005a9c', '#00356b', '#ffffff', '#8c1515'
        ]
    }
  ];

  // Character map for text embedding (complete from page.tsx)
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
  };

  // Calculate traits in the generator (not in exported HTML)
  const calculateTraitsInGenerator = (palette: any, stripeData: any[], textRows: string[]) => {
    const textLines = textRows.filter(row => row && row.trim() !== '').length;
    const totalCharacters = textRows.reduce((sum, row) => sum + row.length, 0);
    const stripeCount = stripeData.length;
    const paletteName = palette ? palette.name : "Unknown";
    const currentWarpThickness = (window as any).warpThickness || 2;

    // Calculate stripe complexity (exact same logic as page.tsx)
    let complexityScore = 0;
    let mixedCount = 0;
    let texturedCount = 0;
    let solidCount = 0;
    let secondaryColorCount = 0;
    
    // Count different pattern types
    for (let stripe of stripeData) {
      if (stripe.weaveType === 'mixed') {
        mixedCount++;
        complexityScore += 2; // Mixed weave adds more complexity
      } else if (stripe.weaveType === 'textured') {
        texturedCount++;
        complexityScore += 1.5; // Textured adds medium complexity
      } else {
        solidCount++;
        // Solid adds no complexity
      }
      
      if (stripe.secondaryColor) {
        secondaryColorCount++;
        complexityScore += 1; // Secondary colors add complexity
      }
    }
    
    // Calculate ratios
    const solidRatio = solidCount / stripeData.length;
    const normalizedComplexity = complexityScore / (stripeData.length * 3); // Max possible is 3 per stripe
    
    // Much more strict classification (exact same as page.tsx)
    let stripeComplexity = "Basic";
    if (solidRatio > 0.9) stripeComplexity = "Basic"; // Almost all solid
    else if (solidRatio > 0.75 && normalizedComplexity < 0.15) stripeComplexity = "Simple"; // Mostly solid with minimal complexity
    else if (solidRatio > 0.6 && normalizedComplexity < 0.3) stripeComplexity = "Moderate"; // Good amount of solid with some complexity
    else if (normalizedComplexity < 0.5) stripeComplexity = "Complex"; // Significant complexity
    else stripeComplexity = "Very Complex"; // High complexity

    // Rarity calculations
    const getPaletteRarity = (name: string) => {
      const legendaryPalettes = ["Buddhist", "Maurya Empire", "Chola Dynasty", "Indigo Famine", "Bengal Famine", "Jamakalam"];
      const epicPalettes = ["Indian Peacock", "Flamingo", "Toucan", "Madras Checks", "Kanchipuram Silk", "Natural Dyes", "Bleeding Vintage"];
      const rarePalettes = ["Tamil Classical", "Sangam Era", "Pandya Dynasty", "Maratha Empire", "Rajasthani"];
      const uncommonPalettes = ["Tamil Nadu Temple", "Kerala Onam", "Chettinad Spice", "Chennai Monsoon", "Bengal Indigo"];
      
      if (legendaryPalettes.includes(name)) return "Legendary";
      if (epicPalettes.includes(name)) return "Epic";
      if (rarePalettes.includes(name)) return "Rare";
      if (uncommonPalettes.includes(name)) return "Uncommon";
      return "Common";
    };

    const getTextLinesRarity = (lines: number) => {
      if (lines === 0) return "Common";
      if (lines === 1) return "Uncommon";
      if (lines === 2) return "Rare";
      if (lines === 3) return "Epic";
      if (lines >= 4) return "Legendary";
      return "Common";
    };

    const getCharacterRarity = (chars: number) => {
      if (chars === 0) return "Common";
      if (chars <= 5) return "Uncommon";
      if (chars <= 15) return "Rare";
      if (chars <= 30) return "Epic";
      if (chars >= 31) return "Legendary";
      return "Common";
    };

    const getStripeCountRarity = (count: number) => {
      if (count < 20) return "Legendary";
      if (count < 25) return "Epic";
      if (count < 32) return "Rare";
      if (count < 40) return "Uncommon";
      return "Common";
    };

    const getStripeComplexityRarity = (complexity: string) => {
      switch (complexity) {
        case "Basic": return "Common";
        case "Simple": return "Uncommon";
        case "Moderate": return "Rare";
        case "Complex": return "Epic";
        case "Very Complex": return "Legendary";
        default: return "Common";
      }
    };

    const getWarpThicknessRarity = (thickness: number) => {
      switch (thickness) {
        case 1: return "Legendary"; // 10% chance (rare)
        case 2: return "Uncommon";  // 25% chance
        case 3: return "Common";    // 35% chance (most common)
        case 4: return "Common";    // 30% chance
        default: return "Common";
      }
    };

    return {
      textLines: { value: textLines, rarity: getTextLinesRarity(textLines) },
      totalCharacters: { value: totalCharacters, rarity: getCharacterRarity(totalCharacters) },
      paletteName: { value: paletteName, rarity: getPaletteRarity(paletteName) },
      stripeCount: { value: stripeCount, rarity: getStripeCountRarity(stripeCount) },
      stripeComplexity: { value: stripeComplexity, rarity: getStripeComplexityRarity(stripeComplexity) },
      warpThickness: { value: currentWarpThickness, rarity: getWarpThicknessRarity(currentWarpThickness) }
    };
  };

  // COMPLETE ALGORITHM FUNCTIONS FROM PAGE.TSX
  
  // Generate doormat core logic (complete original logic)
  const generateDoormatCore = (seed: number) => {
    // Initialize deterministic PRNG for this generation
    initPRNG(seed);
    const prng = getPRNG();
    
    // RARITY-BASED WARP THICKNESS SELECTION
    // Limited to 1-4 to prevent text clipping with 5 lines
    const warpThicknessWeights = {
      1: 0.10,  // 10% - Very thin
      2: 0.25,  // 25% - Thin
      3: 0.35,  // 35% - Medium-thin (most common)
      4: 0.30   // 30% - Medium
    };
    
    const warpThicknessRoll = prng.next();
    let cumulativeWeight1 = 0;
    let selectedWarpThickness = 3; // Default to most common
    
    for (const [thickness, weight] of Object.entries(warpThicknessWeights)) {
      cumulativeWeight1 += weight;
      if (warpThicknessRoll <= cumulativeWeight1) {
        selectedWarpThickness = parseInt(thickness);
        break;
      }
    }
    
    // RARITY-BASED PALETTE SELECTION
    // Weighted generation for true rarity distribution
    const rarityWeights = {
      Legendary: 0.01,    // 1% chance
      Epic: 0.05,         // 5% chance  
      Rare: 0.15,         // 15% chance
      Uncommon: 0.25,     // 25% chance
      Common: 0.54        // 54% chance
    };
    
    // Roll for rarity tier first
    const rarityRoll = prng.next();
    let selectedRarity = 'Common';
    let cumulativeWeight2 = 0;
    
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      cumulativeWeight2 += weight;
      if (rarityRoll <= cumulativeWeight2) {
        selectedRarity = rarity;
        break;
      }
    }
    
    // Get palettes for the selected rarity tier
    const legendaryPalettes = ["Buddhist", "Maurya Empire", "Chola Dynasty", "Indigo Famine", "Bengal Famine", "Jamakalam"];
    const epicPalettes = ["Indian Peacock", "Flamingo", "Toucan", "Madras Checks", "Kanchipuram Silk", "Natural Dyes", "Bleeding Vintage"];
    const rarePalettes = ["Tamil Classical", "Sangam Era", "Pandya Dynasty", "Maratha Empire", "Rajasthani"];
    const uncommonPalettes = ["Tamil Nadu Temple", "Kerala Onam", "Chettinad Spice", "Chennai Monsoon", "Bengal Indigo"];
    
    let tierPalettes: string[] = [];
    switch (selectedRarity) {
      case 'Legendary':
        tierPalettes = legendaryPalettes;
        break;
      case 'Epic':
        tierPalettes = epicPalettes;
        break;
      case 'Rare':
        tierPalettes = rarePalettes;
        break;
      case 'Uncommon':
        tierPalettes = uncommonPalettes;
        break;
      default:
        // Common - all other palettes
        tierPalettes = colorPalettes
          .filter(p => !legendaryPalettes.includes(p.name) && 
                      !epicPalettes.includes(p.name) && 
                      !rarePalettes.includes(p.name) && 
                      !uncommonPalettes.includes(p.name))
          .map(p => p.name);
    }
    
    // Select random palette from the rarity tier
    const tierPaletteIndex = Math.floor(prng.next() * tierPalettes.length);
    const selectedPaletteName = tierPalettes[tierPaletteIndex];
    const palette = colorPalettes.find(p => p.name === selectedPaletteName) || colorPalettes[0];
    
    // Generate stripes with seeded randomness
    const stripeData = generateStripes(palette, selectedWarpThickness, seed);
    
    return {
      config: {
        DOORMAT_WIDTH: 800,
        DOORMAT_HEIGHT: 1200,
        FRINGE_LENGTH: 30,
        WEFT_THICKNESS: 8,
        WARP_THICKNESS: 2,
        TEXT_SCALE: 2,
        MAX_CHARS: 11,
        MAX_TEXT_ROWS: 5
      },
      selectedPalette: palette,
      warpThickness: selectedWarpThickness,
      stripeData: stripeData,
      textLines: safeTextRows || []
    };
  };

  // Generate stripes with seeded randomness (complete original logic)
  const generateStripes = (palette: any, warpThickness: number, seed: number) => {
    const stripes = [];
    
    // Use derived PRNG for stripe generation
    const stripePRNG = createDerivedPRNG(1000);
    
    // Original doormat.js stripe generation logic
    let totalHeight = 1200; // DOORMAT_HEIGHT
    let currentY = 0;
    
    // Decide stripe density pattern for this doormat
    let densityType = stripePRNG.next();
    let minHeight, maxHeight;
    
    if (densityType < 0.2) {
      // 20% chance: High density (many thin stripes)
      minHeight = 15;
      maxHeight = 35;
    } else if (densityType < 0.4) {
      // 20% chance: Low density (fewer thick stripes) 
      minHeight = 50;
      maxHeight = 90;
    } else {
      // 60% chance: Mixed density (varied stripe sizes)
      minHeight = 20;
      maxHeight = 80;
    }
    
    while (currentY < totalHeight) {
      // Dynamic stripe height based on density type
      let stripeHeight;
      if (densityType >= 0.4) {
        // Mixed density: add more randomization within the range
        let variationType = stripePRNG.next();
        if (variationType < 0.3) {
          // 30% thin stripes within mixed
          stripeHeight = minHeight + (stripePRNG.next() * 20);
        } else if (variationType < 0.6) {
          // 30% medium stripes within mixed
          stripeHeight = minHeight + 15 + (stripePRNG.next() * (maxHeight - minHeight - 30));
        } else {
          // 40% thick stripes within mixed
          stripeHeight = maxHeight - 25 + (stripePRNG.next() * 25);
        }
      } else {
        // High/Low density: more consistent sizing
        stripeHeight = minHeight + (stripePRNG.next() * (maxHeight - minHeight));
      }
      
      // Ensure we don't exceed the total height
      if (currentY + stripeHeight > totalHeight) {
        stripeHeight = totalHeight - currentY;
      }
      
      // Select colors for this stripe
      let primaryColor = palette.colors[Math.floor(stripePRNG.next() * palette.colors.length)];
      
      // RARITY-BASED SECONDARY COLOR GENERATION
      // Make blended colors rarer based on overall rarity
      let secondaryColorChance = 0.15; // Base 15% chance
      
      let hasSecondaryColor = stripePRNG.next() < secondaryColorChance;
      let secondaryColor = hasSecondaryColor ? palette.colors[Math.floor(stripePRNG.next() * palette.colors.length)] : null;
      
      // RARITY-BASED WEAVE PATTERN SELECTION
      // Make complex patterns rarer based on overall rarity
      let weaveRand = stripePRNG.next();
      let weaveType;
      
      // Adjust probabilities based on palette rarity
      let solidChance = 0.6, texturedChance = 0.2, mixedChance = 0.2;
      
      if (weaveRand < solidChance) {
        weaveType = 'solid';
      } else if (weaveRand < solidChance + texturedChance) {
        weaveType = 'textured';
      } else {
        weaveType = 'mixed';
      }
      
      // Create stripe object (original structure)
      const stripe = {
        y: currentY,
        height: stripeHeight,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        weaveType: weaveType,
        warpVariation: stripePRNG.next() * 0.4 + 0.1 // How much the weave varies
      };
      
      stripes.push(stripe);
      currentY += stripeHeight;
    }
    
    return stripes;
  };

  const exportNFT = async () => {
    setIsExporting(true);

    try {
      // Generate doormat data using the same algorithm as page.tsx
      const doormatData = generateDoormatCore(safeSeed);
      
      // Calculate traits in the generator (not in exported HTML)
      const calculatedTraits = calculateTraitsInGenerator(doormatData.selectedPalette, doormatData.stripeData, safeTextRows);
      
      // Create the NFT HTML content with generated data and pre-calculated traits
      const nftHTML = createNFTHTML(safeSeed, doormatData.selectedPalette, doormatData.stripeData, safeTextRows, calculatedTraits, doormatData);
      
      // Debug logging removed for production
      
      // Create and download the file
      const blob = new Blob([nftHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doormat-nft-${safeSeed}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting NFT:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const createNFTHTML = (seed: number, palette: any, stripeData: any[], textRows: string[], preCalculatedTraits: any, doormatData: any) => {
    // Use the generated doormat data configuration
    const config = doormatData.config;
    
    // Debug: Log what we're actually passing to the template
      // Function called with parameters (logging removed for production)
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Doormat NFT #${seed}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #f0f0f0;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .nft-container {
            text-align: center;
        }
        .nft-info {
            margin-bottom: 20px;
            color: #333;
        }
        .nft-seed {
            font-weight: bold;
            color: #0066cc;
        }
        
        .traits-section {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        
        .traits-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
            font-weight: bold;
        }
        
        .traits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .trait-item {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 10px;
        }
        
        .trait-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .trait-name {
            font-size: 12px;
            font-weight: 600;
            color: #495057;
            text-transform: capitalize;
        }
        
        .trait-rarity {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
        }
        
        .trait-value {
            font-size: 14px;
            color: #212529;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="nft-container">
        <div class="nft-info">
            <h2>Doormat NFT #<span class="nft-seed">${seed}</span></h2>
            <p>Seed: ${seed}</p>
            <p>Palette: ${palette?.name || 'Custom'}</p>
            <p>Text: ${textRows.join(', ') || 'None'}</p>
            
            <div class="traits-section">
                <h3>NFT Traits & Rarity</h3>
                <div class="traits-grid" id="traits-container">
                    <!-- Traits will be populated by JavaScript -->
                </div>
            </div>
        </div>
        <div id="canvas-container"></div>
    </div>

    <script>
        // COMPLETE ALGORITHM FROM PAGE.TSX - SYNCHRONIZED VERSION
        
        // Configuration from the generated doormat data
        const config = ${JSON.stringify(config)};
        
        // Dimensions
        let doormatWidth = config.DOORMAT_WIDTH || 800;
        let doormatHeight = config.DOORMAT_HEIGHT || 1200;
        let fringeLength = config.FRINGE_LENGTH || 30;
        let weftThickness = config.WEFT_THICKNESS || 8;
        let warpThickness = ${doormatData.warpThickness}; // Use the dynamically generated warp thickness
        let TEXT_SCALE = config.TEXT_SCALE || 2;
        let MAX_CHARS = config.MAX_CHARS || 11;
        
        // Current settings
        let selectedPalette = ${JSON.stringify(palette)};
        let stripeData = ${JSON.stringify(stripeData)};
        let doormatTextRows = ${JSON.stringify(textRows)};
        let textData = ${JSON.stringify(doormatData.textData) || '[]'};

        // Colors - use the generated doormat data colors
        let lightTextColor = ${JSON.stringify(doormatData.lightTextColor)};
        let darkTextColor = ${JSON.stringify(doormatData.darkTextColor)};

        // Pre-calculated traits metadata (calculated in generator)
        const nftTraits = ${JSON.stringify(preCalculatedTraits)};

        // COMPLETE COLOR PALETTES ARRAY (100+ palettes from page.tsx)
        const colorPalettes = ${JSON.stringify(colorPalettes)};

        // COMPLETE CHARACTER MAP (from page.tsx)
        const characterMap = ${JSON.stringify(characterMap)};

        // COMPLETE DETERMINISTIC PRNG SYSTEM (from page.tsx) - GLOBAL SCOPE
        class DeterministicPRNG {
            constructor(seed) {
                this.seed = seed;
                this.current = seed;
            }
            
            next() {
                this.current = (this.current * 1664525 + 1013904223) % Math.pow(2, 32);
                return this.current / Math.pow(2, 32);
            }
            
            range(min, max) {
                return min + (max - min) * this.next();
            }
            
            choice(array) {
                return array[Math.floor(this.next() * array.length)];
            }
        }
        
        // Initialize PRNG with seed - GLOBAL SCOPE
        let currentSeed = ${seed};
        let prng = new DeterministicPRNG(currentSeed);
        
        // Create derived PRNG for drawing operations - GLOBAL SCOPE
        let drawingPRNG = new DeterministicPRNG(currentSeed + 2000);

        // Simple rarity color function
        function getRarityColor(rarity) {
            switch (rarity) {
                case "Legendary": return "#ff6b35";
                case "Epic": return "#8a2be2";
                case "Rare": return "#007bff";
                case "Uncommon": return "#28a745";
                case "Common": return "#6c757d";
                default: return "#6c757d";
            }
        }

        // Populate traits display with pre-calculated data
        function populateTraitsDisplay() {
            const traitsContainer = document.getElementById('traits-container');
            if (!traitsContainer) return;
            
            let html = '';
            Object.entries(nftTraits).forEach(([key, trait]) => {
                const rarity = trait.rarity || 'Common';
                const value = trait.value;
                const rarityColor = getRarityColor(rarity);
                html += '<div class="trait-item">' +
                    '<div class="trait-header">' +
                        '<span class="trait-name">' + key.replace(/([A-Z])/g, ' $1').trim() + '</span>' +
                        '<span class="trait-rarity" style="background-color: ' + rarityColor + '20; color: ' + rarityColor + '; border: 1px solid ' + rarityColor + '40;">' + rarity + '</span>' +
                    '</div>' +
                    '<div class="trait-value">' + (typeof value === 'string' ? value : value.toString()) + '</div>' +
                '</div>';
            });
            traitsContainer.innerHTML = html;
        }

function setup() {
            // Initialize deterministic PRNG to recreate the exact same doormat
    // Note: PRNG is initialized in the generation phase, not here
    noiseSeed(${seed});
    
    // PRNG system is now declared in global scope above
    
            // Create canvas with swapped dimensions for 90-degree rotation
            let canvas = createCanvas(doormatHeight + (fringeLength * 4), doormatWidth + (fringeLength * 4));
            canvas.parent('canvas-container');
            
            // Set high DPR for crisp rendering on high-DPI displays
            pixelDensity(2.5);
            
            // Text colors and text data are pre-calculated from doormat data
    
            noLoop();
            
            // Populate traits display after setup
            setTimeout(() => {
                populateTraitsDisplay();
            }, 100);
        }
        
        // updateTextColors function removed - using pre-calculated colors from doormat data

function draw() {
            // Use a background that won't create visible bands after rotation
            background(222, 222, 222);
    
            // Rotate canvas 90 degrees clockwise
            push();
            translate(width/2, height/2);
            rotate(PI/2);
            translate(-height/2, -width/2);
    
            // Draw the main doormat area
            push();
            // Center the doormat within the larger canvas buffer
            translate(fringeLength * 2, fringeLength * 2);
    
            // Draw stripes using the complete algorithm
            for (let stripe of stripeData) {
                drawStripe(stripe);
            }
            
            // Add overall texture overlay
            drawTextureOverlay();
            
            pop();
    
            // Draw fringe with adjusted positioning for larger canvas
            drawFringe();
            
            pop(); // End rotation
        }
        
        function drawStripe(stripe) {
            // Create a proper plain weave structure like the diagram
            let warpSpacing = warpThickness + 1; // Space between warp threads
            let weftSpacing = weftThickness + 1; // Space between weft threads
            
            // First, draw the warp threads (vertical) as the foundation
            for (let x = 0; x < doormatWidth; x += warpSpacing) {
                for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
                    let warpColor = color(stripe.primaryColor);
                    
                    // Check if this position should be modified for text
                    let isTextPixel = false;
                    if (textData.length > 0) {
                        for (let textPixel of textData) {
                            if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                                y >= textPixel.y && y < textPixel.y + textPixel.height) {
                                isTextPixel = true;
                                break;
                            }
                        }
                    }
                    
                    // Add subtle variation to warp threads
                    let r = red(warpColor) + drawingPRNG.range(-15, 15);
                    let g = green(warpColor) + drawingPRNG.range(-15, 15);
                    let b = blue(warpColor) + drawingPRNG.range(-15, 15);
                    
                    // Modify color for text pixels (vertical lines use weft thickness)
                    if (isTextPixel) {
                        const bgBrightness = (r + g + b) / 3;
                        let tc = bgBrightness < 128 ? lightTextColor : darkTextColor;
                        r = red(tc); g = green(tc); b = blue(tc);
                    }
                    
                    r = constrain(r, 0, 255);
                    g = constrain(g, 0, 255);
                    b = constrain(b, 0, 255);
                    
                    fill(r, g, b);
                    noStroke();
                    
                    // Draw warp thread with slight curve for natural look
                    let warpCurve = sin(y * 0.05) * 0.5;
                    rect(x + warpCurve, y, warpThickness, weftSpacing);
                }
            }
            
            // Now draw the weft threads (horizontal) that interlace with warp
            for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
                for (let x = 0; x < doormatWidth; x += warpSpacing) {
                    let weftColor = color(stripe.primaryColor);
                    
                    // Check if this position should be modified for text
                    let isTextPixel = false;
                    if (textData.length > 0) {
                        for (let textPixel of textData) {
                            if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                                y >= textPixel.y && y < textPixel.y + textPixel.height) {
                                isTextPixel = true;
                                break;
                            }
                        }
                    }
                    
                    // Add variation based on weave type
                    if (stripe.weaveType === 'mixed' && stripe.secondaryColor) {
                        if (noise(x * 0.1, y * 0.1) > 0.5) {
                            weftColor = color(stripe.secondaryColor);
                        }
                    } else if (stripe.weaveType === 'textured') {
                        let noiseVal = noise(x * 0.05, y * 0.05);
                        weftColor = lerpColor(color(stripe.primaryColor), color(255), noiseVal * 0.15);
                    }
                    
                    // Add fabric irregularities
                    let r = red(weftColor) + drawingPRNG.range(-20, 20);
                    let g = green(weftColor) + drawingPRNG.range(-20, 20);
                    let b = blue(weftColor) + drawingPRNG.range(-20, 20);
                    
                    // Modify color for text pixels (horizontal lines use warp thickness)
                    if (isTextPixel) {
                        const bgBrightness = (r + g + b) / 3;
                        let tc = bgBrightness < 128 ? lightTextColor : darkTextColor;
                        r = red(tc); g = green(tc); b = blue(tc);
                    }
                    
                    r = constrain(r, 0, 255);
                    g = constrain(g, 0, 255);
                    b = constrain(b, 0, 255);
                    
                    fill(r, g, b);
                    noStroke();
                    
                    // Draw weft thread with slight curve
                    let weftCurve = cos(x * 0.05) * 0.5;
                    rect(x, y + weftCurve, warpSpacing, weftThickness);
                }
            }
            
            // Add the interlacing effect - make some threads appear to go over/under
            for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing * 2) {
                for (let x = 0; x < doormatWidth; x += warpSpacing * 2) {
                    // Create shadow effect for threads that appear to go under
                    fill(0, 0, 0, 40);
                    noStroke();
                    rect(x + 1, y + 1, warpSpacing - 2, weftSpacing - 2);
                }
            }
            
            // Add subtle highlights for threads that appear to go over
            for (let y = stripe.y + weftSpacing; y < stripe.y + stripe.height; y += weftSpacing * 2) {
                for (let x = warpSpacing; x < doormatWidth; x += warpSpacing * 2) {
                    fill(255, 255, 255, 30);
                    noStroke();
                    rect(x, y, warpSpacing - 1, weftSpacing - 1);
                }
    }
}

function drawTextureOverlay() {
            push();
            blendMode(MULTIPLY);
            
            // Fine texture
            for (let x = 0; x < doormatWidth; x += 2) {
                for (let y = 0; y < doormatHeight; y += 2) {
                    let noiseValue = noise(x * 0.02, y * 0.02);
                    let alpha = map(noiseValue, 0, 1, 0, 50);
                    fill(0, 0, 0, alpha);
                    noStroke();
                    rect(x, y, 2, 2);
                }
            }
            
            // Coarse texture
            for (let x = 0; x < doormatWidth; x += 6) {
                for (let y = 0; y < doormatHeight; y += 6) {
                    let noiseValue = noise(x * 0.03, y * 0.03);
                    if (noiseValue > 0.6) {
                        fill(255, 255, 255, 25);
                        noStroke();
                        rect(x, y, 6, 6);
                    } else if (noiseValue < 0.4) {
                        fill(0, 0, 0, 20);
                        noStroke();
                        rect(x, y, 6, 6);
                    }
                }
            }
            
            pop();
}

function drawFringe() {
            // Top fringe (warp ends)
            // Top fringe - adjusted for larger canvas buffer
            drawFringeSection(fringeLength * 2, fringeLength, doormatWidth, fringeLength, 'top');
            
            // Bottom fringe - adjusted for larger canvas buffer
            drawFringeSection(fringeLength * 2, fringeLength * 2 + doormatHeight, doormatWidth, fringeLength, 'bottom');
            
            // Draw selvedge edges (weft loops) on left and right sides
            drawSelvedgeEdges();
}

function drawSelvedgeEdges() {
            let weftSpacing = weftThickness + 1;
            let isFirst = true;
            let isLast = false;
            
            // Left selvedge edge - flowing semicircular weft threads
            for (let stripe of stripeData) {
                for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
                    // Skip the very first and very last weft threads of the entire doormat
                    if (isFirst) {
                        isFirst = false;
                        continue;
                    }
                    
                    // Check if this is the last weft thread
                    if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
                        isLast = true;
                        continue; // Skip this last weft thread instead of breaking
                    }
                    
                    // Get the color from the current stripe
                    let selvedgeColor = color(stripe.primaryColor);
                    
                    // Check if there's a secondary color for blending
                    if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
                        let secondaryColor = color(stripe.secondaryColor);
                        // Blend the colors based on noise for variation
                        let blendFactor = noise(y * 0.1) * 0.5 + 0.5;
                        selvedgeColor = lerpColor(selvedgeColor, secondaryColor, blendFactor);
                    }
                    
                    let r = red(selvedgeColor) * 0.8;
                    let g = green(selvedgeColor) * 0.8;
                    let b = blue(selvedgeColor) * 0.8;
                    
                    fill(r, g, b);
                    noStroke();
                    
                    let radius = weftThickness * drawingPRNG.range(1.2, 1.8); // Vary size slightly
                    let centerX = fringeLength * 2 + drawingPRNG.range(-2, 2); // Slight position variation
                    let centerY = fringeLength * 2 + y + weftThickness/2 + drawingPRNG.range(-1, 1); // Slight vertical variation
                    
                    // Vary the arc angles for more natural look
                    let startAngle = HALF_PI + drawingPRNG.range(-0.2, 0.2);
                    let endAngle = -HALF_PI + drawingPRNG.range(-0.2, 0.2);
                    
                    // Draw textured semicircle with individual thread details
                    drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, 'left');
                }
            }
            
            // Right selvedge edge - flowing semicircular weft threads
            let isFirstWeftRight = true;
            let isLastWeftRight = false;
            
            for (let stripe of stripeData) {
                for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
                    // Skip the very first and very last weft threads of the entire doormat
                    if (isFirstWeftRight) {
                        isFirstWeftRight = false;
                        continue;
                    }
                    
                    // Check if this is the last weft thread
                    if (stripe === stripeData[stripeData.length - 1] && y + weftSpacing >= stripe.y + stripe.height) {
                        isLastWeftRight = true;
                        continue; // Skip this last weft thread instead of breaking
                    }
                    
                    // Get the color from the current stripe
                    let selvedgeColor = color(stripe.primaryColor);
                    
                    // Check if there's a secondary color for blending
                    if (stripe.secondaryColor && stripe.weaveType === 'mixed') {
                        let secondaryColor = color(stripe.secondaryColor);
                        // Blend the colors based on noise for variation
                        let blendFactor = noise(y * 0.1) * 0.5 + 0.5;
                        selvedgeColor = lerpColor(selvedgeColor, secondaryColor, blendFactor);
                    }
                    
                    let r = red(selvedgeColor) * 0.8;
                    let g = green(selvedgeColor) * 0.8;
                    let b = blue(selvedgeColor) * 0.8;
                    
                    fill(r, g, b);
                    noStroke();
                    
                    let radius = weftThickness * drawingPRNG.range(1.2, 1.8); // Vary size slightly
                    let centerX = fringeLength * 2 + doormatWidth + drawingPRNG.range(-2, 2); // Slight position variation
                    let centerY = fringeLength * 2 + y + weftThickness/2 + drawingPRNG.range(-1, 1); // Slight vertical variation
                    
                    // Vary the arc angles for more natural look
                    let startAngle = -HALF_PI + drawingPRNG.range(-0.2, 0.2);
                    let endAngle = HALF_PI + drawingPRNG.range(-0.2, 0.2);
                    
                    // Draw textured semicircle with individual thread details
                    drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, 'right');
                }
            }
        }
        
        function drawTexturedSelvedgeArc(centerX, centerY, radius, startAngle, endAngle, r, g, b, side) {
            // Draw a realistic textured selvedge arc with visible woven texture
            let threadCount = max(6, floor(radius / 1.2)); // More threads for visible texture
            let threadSpacing = radius / threadCount;
            
            // Draw individual thread arcs to create visible woven texture
            for (let i = 0; i < threadCount; i++) {
                let threadRadius = radius - (i * threadSpacing);
                
                // Create distinct thread colors for visible texture
                let threadR, threadG, threadB;
                
                if (i % 2 === 0) {
                    // Lighter threads
                    threadR = constrain(r + 25, 0, 255);
                    threadG = constrain(g + 25, 0, 255);
                    threadB = constrain(b + 25, 0, 255);
                } else {
                    // Darker threads
                    threadR = constrain(r - 20, 0, 255);
                    threadG = constrain(g - 20, 0, 255);
                    threadB = constrain(b - 20, 0, 255);
                }
                
                // Add some random variation for natural look
                threadR = constrain(threadR + drawingPRNG.range(-10, 10), 0, 255);
                threadG = constrain(threadG + drawingPRNG.range(-10, 10), 0, 255);
                threadB = constrain(threadB + drawingPRNG.range(-10, 10), 0, 255);
                
                fill(threadR, threadG, threadB, 88); // More transparent for better blending
                
                // Draw individual thread arc with slight position variation
                let threadX = centerX + drawingPRNG.range(-1, 1);
                let threadY = centerY + drawingPRNG.range(-1, 1);
                let threadStartAngle = startAngle + drawingPRNG.range(-0.1, 0.1);
                let threadEndAngle = endAngle + drawingPRNG.range(-0.1, 0.1);
                
                arc(threadX, threadY, threadRadius * 2, threadRadius * 2, threadStartAngle, threadEndAngle);
            }
            
            // Add a few more detailed texture layers
            for (let i = 0; i < 3; i++) {
                let detailRadius = radius * (0.3 + i * 0.2);
                let detailAlpha = 180 - (i * 40);
                
                // Create contrast for visibility
                let detailR = constrain(r + (i % 2 === 0 ? 15 : -15), 0, 255);
                let detailG = constrain(g + (i % 2 === 0 ? 15 : -15), 0, 255);
                let detailB = constrain(b + (i % 2 === 0 ? 15 : -15), 0, 255);
                
                fill(detailR, detailG, detailB, detailAlpha * 0.7); // More transparent detail layers
                
                let detailX = centerX + drawingPRNG.range(-0.5, 0.5);
                let detailY = centerY + drawingPRNG.range(-0.5, 0.5);
                let detailStartAngle = startAngle + drawingPRNG.range(-0.05, 0.05);
                let detailEndAngle = endAngle + drawingPRNG.range(-0.05, 0.05);
                
                arc(detailX, detailY, detailRadius * 2, detailRadius * 2, detailStartAngle, detailEndAngle);
            }
            
            // Add subtle shadow for depth
            fill(r * 0.6, g * 0.6, b * 0.6, 70); // More transparent shadow
            let shadowOffset = side === 'left' ? 1 : -1;
            arc(centerX + shadowOffset, centerY + 1, radius * 2, radius * 2, startAngle, endAngle);
            
            // Add small transparent hole in the center
            noFill();
            arc(centerX, centerY, radius * 0.5, radius * 0.5, startAngle, endAngle);
            
            // Add visible texture details - small bumps and knots
            for (let i = 0; i < 8; i++) {
                let detailAngle = drawingPRNG.range(startAngle, endAngle);
                let detailRadius = radius * drawingPRNG.range(0.2, 0.7);
                let detailX = centerX + cos(detailAngle) * detailRadius;
                let detailY = centerY + sin(detailAngle) * detailRadius;
                
                // Alternate between light and dark for visible contrast
                if (i % 2 === 0) {
                    fill(r + 20, g + 20, b + 20, 120); // More transparent light bumps
                } else {
                    fill(r - 15, g - 15, b - 15, 120); // More transparent dark bumps
                }
                
                noStroke();
                ellipse(detailX, detailY, drawingPRNG.range(1.5, 3.5), drawingPRNG.range(1.5, 3.5));
            }
        }
        
        function drawFringeSection(x, y, w, h, side) {
            let fringeStrands = w / 12; // More fringe strands for thinner threads
            let strandWidth = w / fringeStrands;
            
            for (let i = 0; i < fringeStrands; i++) {
                let strandX = x + i * strandWidth;
                
                // Safety check for selectedPalette
                if (!selectedPalette || !selectedPalette.colors) {
                    return;
                }
                
                let strandColor = drawingPRNG.choice(selectedPalette.colors);
                
                // Draw individual fringe strand with thin threads
                for (let j = 0; j < 12; j++) { // More but thinner threads per strand
                    let threadX = strandX + drawingPRNG.range(-strandWidth/6, strandWidth/6);
                    let startY = side === 'top' ? y + h : y;
                    let endY = side === 'top' ? y : y + h;
                    
                    // Add natural curl/wave to the fringe with more variation
                    let waveAmplitude = drawingPRNG.range(1, 4);
                    let waveFreq = drawingPRNG.range(0.2, 0.8);
                    
                    // Randomize the direction and intensity for each thread
                    let direction = drawingPRNG.choice([-1, 1]); // Random left or right direction
                    let curlIntensity = drawingPRNG.range(0.5, 2.0);
                    let threadLength = drawingPRNG.range(0.8, 1.2); // Vary thread length
                    
                    // Use darker version of strand color for fringe
                    let fringeColor = color(strandColor);
                    let r = red(fringeColor) * 0.7;
                    let g = green(fringeColor) * 0.7;
                    let b = blue(fringeColor) * 0.7;
                    
                    stroke(r, g, b);
                    strokeWeight(drawingPRNG.range(0.5, 1.2)); // Vary thread thickness
                    
                    noFill();
                    beginShape();
                    for (let t = 0; t <= 1; t += 0.1) {
                        let yPos = lerp(startY, endY, t * threadLength);
                        let xOffset = sin(t * PI * waveFreq) * waveAmplitude * t * direction * curlIntensity;
                        // Add more randomness and natural variation
                        xOffset += drawingPRNG.range(-1, 1);
                        // Add occasional kinks and bends
                        if (drawingPRNG.next() < 0.3) {
                            xOffset += drawingPRNG.range(-2, 2);
                        }
                        vertex(threadX + xOffset, yPos);
                    }
                    endShape();
                }
            }
}

function generateTextData() {
    textData = [];
            const textRows = doormatTextRows || [];
            if (!textRows || textRows.length === 0) return;
            
            // Filter out empty text rows (same as live generator)
            const nonEmptyTextRows = textRows.filter(row => row && row.trim() !== '');
            if (nonEmptyTextRows.length === 0) return;
            
            const warpSpacing = warpThickness + 1;
            const weftSpacing = weftThickness + 1;
            const scaledWarp = warpSpacing * TEXT_SCALE;
            const scaledWeft = weftSpacing * TEXT_SCALE;
            
            // Character dimensions based on thread spacing (EXACT same as live generator)
            const charWidth = 7 * scaledWarp; // width after rotation (7 columns)
            const charHeight = 5 * scaledWeft; // height after rotation (5 rows)
            const spacing = scaledWeft; // vertical gap between stacked characters
            
            // Calculate spacing between rows (horizontal spacing after rotation)
            const rowSpacing = charWidth * 1.5; // Space between rows
            
            // Calculate total width needed for all NON-EMPTY rows
            const totalRowsWidth = nonEmptyTextRows.length * charWidth + (nonEmptyTextRows.length - 1) * rowSpacing;
            
            // Calculate starting X position to center all NON-EMPTY rows
            const baseStartX = (doormatWidth - totalRowsWidth) / 2;
            
            let currentRowIndex = 0;
            for (let rowIndex = 0; rowIndex < textRows.length; rowIndex++) {
                const rowText = textRows[rowIndex];
                if (!rowText || rowText.trim() === '') continue; // Skip empty rows
                
                // Calculate text dimensions for this row
                const textWidth = charWidth;
                const textHeight = rowText.length * (charHeight + spacing) - spacing;
                
                // Position for this NON-EMPTY row (left to right becomes after rotation)
                const startX = baseStartX + currentRowIndex * (charWidth + rowSpacing);
                const startY = (doormatHeight - textHeight) / 2;
                
                // Generate character data vertically bottom-to-top for this row
                for (let i = 0; i < rowText.length; i++) {
                    const char = rowText.charAt(i);
                    const charY = startY + (rowText.length - 1 - i) * (charHeight + spacing);
                    const charPixels = generateCharacterPixels(char, startX, charY, textWidth, charHeight);
                    textData.push(...charPixels);
                }
                
                currentRowIndex++; // Only increment for non-empty rows
            }
        }
        
        // Character Map Data - already declared above in the template
        
        function generateCharacterPixels(char, x, y, width, height) {
            const pixels = [];
            const warpSpacing = warpThickness + 1;
            const weftSpacing = weftThickness + 1;
            const scaledWarp = warpSpacing * TEXT_SCALE;
            const scaledWeft = weftSpacing * TEXT_SCALE;

            // Character definitions - use the EXACT same format as live generator
            const charDef = characterMap[char.toUpperCase()] || characterMap[' '];

            const numRows = charDef.length;
            const numCols = charDef[0].length;

            // Rotate 90° CCW: newX = col, newY = numRows - 1 - row
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < numCols; col++) {
                    if (charDef[row][col] === '1') {
                        // Rotate 180°: flip both axes
                        const newCol = row;
                        const newRow = numCols - 1 - col;
                        pixels.push({
                            x: x + newCol * scaledWarp,
                            y: y + newRow * scaledWeft,
                            width: scaledWarp,
                            height: scaledWeft
                        });
                    }
                }
            }

            return pixels;
        }
    </script>
</body>
</html>`;
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <h3 className="text-green-400 font-mono text-lg mb-3">NFT Exporter</h3>
      <div className="space-y-3">
        <div className="text-gray-300 text-sm">
          <p><strong>Seed:</strong> {safeSeed}</p>
          <p><strong>Palette:</strong> {safePalette?.name || 'Custom'}</p>
          <p><strong>Text:</strong> {safeTextRows.join(', ') || 'None'}</p>
      </div>
        <button
          onClick={exportNFT}
          disabled={isExporting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-mono py-2 px-4 rounded transition-colors"
        >
          {isExporting ? 'Exporting...' : 'Export NFT'}
        </button>
      </div>
    </div>
  );
};

export default NFTExporter;
