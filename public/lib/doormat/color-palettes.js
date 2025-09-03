// Color Palettes Data - Comprehensive collection for doormat generation
// Global, Indian Cultural, Tamil Cultural, Natural Dye, Historical Dynasty, and Madras Generator palettes

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
    },

];
