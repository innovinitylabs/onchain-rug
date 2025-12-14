import React, { useEffect, useRef } from 'react'
import { RugMarketNFT } from '../../lib/rug-market-types'

interface RugPreviewCanvasProps {
  rug: RugMarketNFT
  className?: string
}

// Sample rugs for testing - hardcoded from sample_token_uri files
const SAMPLE_RUGS = {
  1: {
    name: "OnchainRug #1",
    palette: ["#8B0000", "#DC143C", "#B22222", "#FF4500", "#FF6347", "#C04000", "#FA8072"],
    stripeCount: 20,
    dirtLevel: 2,
    frameLevel: 0
  },
  2: {
    name: "OnchainRug #2",
    palette: ["#F0F8FF", "#E6E6FA", "#B0C4DE", "#87CEEB", "#4682B4", "#4169E1", "#0000CD"],
    stripeCount: 26,
    dirtLevel: 2,
    frameLevel: 0
  },
  3: {
    name: "OnchainRug #3",
    palette: ["#8B4513", "#A0522D", "#CD853F", "#F4A460", "#DEB887", "#D2B48C"],
    stripeCount: 15,
    dirtLevel: 1,
    frameLevel: 1
  },
  4: {
    name: "OnchainRug #4",
    palette: ["#228B22", "#32CD32", "#90EE90", "#98FB98", "#00FF00", "#7CFC00"],
    stripeCount: 18,
    dirtLevel: 0,
    frameLevel: 2
  },
  5: {
    name: "OnchainRug #5",
    palette: ["#4B0082", "#6A5ACD", "#9370DB", "#BA55D3", "#DA70D6", "#EE82EE"],
    stripeCount: 12,
    dirtLevel: 1,
    frameLevel: 0
  }
}

const RugPreviewCanvas: React.FC<RugPreviewCanvasProps> = ({ rug, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // For now, use hardcoded sample rugs based on tokenId
    const sampleRug = SAMPLE_RUGS[rug.permanent.tokenId as keyof typeof SAMPLE_RUGS]

    if (sampleRug) {
      // Use the sample rug data
      generateRugPreviewFromSample(rug, sampleRug)
    } else {
      // Generate based on traits for new rugs
      generateRugPreviewFromTraits(rug)
    }
  }, [rug])

  const generateRugPreviewFromSample = (rug: RugMarketNFT, sample: any) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Generate stripes using sample palette
    const stripeCount = sample.stripeCount || rug.permanent.stripeCount || 8
    const stripeHeight = canvas.height / stripeCount

    for (let i = 0; i < stripeCount; i++) {
      const colorIndex = i % sample.palette.length
      ctx.fillStyle = sample.palette[colorIndex]
      ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight)
    }

    // Add subtle texture variation
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = Math.random() * 2 + 0.5
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'

    // Add dirt overlay
    const dirtLevel = sample.dirtLevel !== undefined ? sample.dirtLevel : rug.dynamic.dirtLevel || 0
    if (dirtLevel > 0) {
      const dirtOpacity = dirtLevel === 1 ? 0.4 : 0.7
      ctx.fillStyle = `rgba(101, 67, 33, ${dirtOpacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Add frame glow
    const frameLevel = sample.frameLevel !== undefined ? sample.frameLevel : rug.dynamic.frameLevel || 0
    if (frameLevel > 0) {
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + frameLevel * 0.1})`
      ctx.lineWidth = 3
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)
    }
  }

  const generateRugPreviewFromColors = (rug: RugMarketNFT, colors: string[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Generate stripes using extracted colors
    const stripeCount = rug.permanent.stripeCount || 8
    const stripeHeight = canvas.height / stripeCount

    for (let i = 0; i < stripeCount; i++) {
      const colorIndex = i % colors.length
      ctx.fillStyle = colors[colorIndex]
      ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight)
    }

    // Add subtle texture variation
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = Math.random() * 2 + 0.5
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'

    // Add dirt overlay
    if (rug.dynamic.dirtLevel > 0) {
      const dirtOpacity = rug.dynamic.dirtLevel === 1 ? 0.4 : 0.7
      ctx.fillStyle = `rgba(101, 67, 33, ${dirtOpacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Add frame glow
    if (rug.dynamic.frameLevel > 0) {
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + rug.dynamic.frameLevel * 0.1})`
      ctx.lineWidth = 3
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)
    }
  }

  const generateRugPreviewFromTraits = (rug: RugMarketNFT) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Generate based on palette name
    const palette = rug.permanent.paletteName || '#8B4513,#A0522D,#CD853F'
    const colors = palette.split(',')

    // Clear and generate stripes
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const stripeCount = rug.permanent.stripeCount || 8
    const stripeHeight = canvas.height / stripeCount

    for (let i = 0; i < stripeCount; i++) {
      const colorIndex = i % colors.length
      ctx.fillStyle = colors[colorIndex]
      ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight)
    }

    // Add dirt overlay
    if (rug.dynamic.dirtLevel > 0) {
      const dirtOpacity = rug.dynamic.dirtLevel === 1 ? 0.4 : 0.7
      ctx.fillStyle = `rgba(101, 67, 33, ${dirtOpacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={90}
      className={`w-full h-full object-cover rounded ${className}`}
      style={{ imageRendering: 'auto' }}
    />
  )
}

export default RugPreviewCanvas
