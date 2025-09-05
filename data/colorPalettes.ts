export interface ColorPalette {
  name: string
  colors: string[]
  description: string
}

export const colorPalettes: ColorPalette[] = [
  {
    name: "Desert Sunset",
    colors: ["#D2691E", "#CD853F", "#F4A460", "#DEB887", "#F5DEB3", "#8B4513"],
    description: "Warm earth tones inspired by desert landscapes"
  },
  {
    name: "Ocean Depths",
    colors: ["#191970", "#4169E1", "#4682B4", "#5F9EA0", "#87CEEB", "#B0E0E6"],
    description: "Deep blues and teals reminiscent of ocean waters"
  },
  {
    name: "Forest Floor",
    colors: ["#228B22", "#32CD32", "#90EE90", "#98FB98", "#006400", "#228B22"],
    description: "Rich greens inspired by forest vegetation"
  },
  {
    name: "Autumn Leaves",
    colors: ["#FF4500", "#FF6347", "#FF7F50", "#FF8C00", "#FFA500", "#DAA520"],
    description: "Warm oranges and reds like autumn foliage"
  },
  {
    name: "Midnight Mystery",
    colors: ["#2F2F2F", "#4A4A4A", "#696969", "#808080", "#A9A9A9", "#C0C0C0"],
    description: "Sophisticated grays and silvers"
  },
  {
    name: "Berry Patch",
    colors: ["#8B008B", "#9932CC", "#BA55D3", "#DA70D6", "#DDA0DD", "#E6E6FA"],
    description: "Rich purples and soft lavenders"
  },
  {
    name: "Golden Hour",
    colors: ["#FFD700", "#FFA500", "#FF8C00", "#FF6347", "#FF4500", "#FF1493"],
    description: "Warm golds and vibrant oranges"
  },
  {
    name: "Mountain Mist",
    colors: ["#F0F8FF", "#E6E6FA", "#D3D3D3", "#C0C0C0", "#A9A9A9", "#808080"],
    description: "Soft whites and cool grays"
  }
]

export const getRandomPalette = (): ColorPalette => {
  return colorPalettes[Math.floor(Math.random() * colorPalettes.length)]
}

export const getPaletteByName = (name: string): ColorPalette | undefined => {
  return colorPalettes.find(palette => palette.name === name)
}
