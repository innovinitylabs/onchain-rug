'use client'

import { useEffect, useRef, useState } from 'react'

// Random text options for doormat generation
const DOORMAT_TEXTS = [
  "WELCOME",
  "HOME",
  "NAMASTE", 
  "PEACE",
  "LOVE",
  "JOY",
  "BLESSED",
  "STRENGTH",
  "HONOR",
  "LEGACY",
  "UNITY",
  "HOPE",
  "FAITH",
  "DREAM",
  "SMILE",
  "HAPPY",
  "FAMILY",
  "FRIENDS",
  "GRATITUDE",
  "SERENITY"
]

// Individual Doormat Component
function GeneratedRug({ seed, textRows, position, size = 200 }: {
  seed: number
  textRows: string[]
  position: { x: number, y: number }
  size?: number
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Create unique container ID
    const containerId = `doormat-${seed}-${Date.now()}`
    canvasRef.current.innerHTML = `<div id="${containerId}"></div>`

    // Load P5.js if not already loaded
    const loadP5AndGenerate = async () => {
      if (!(window as any).p5) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
        await new Promise((resolve) => {
          script.onload = resolve
          document.head.appendChild(script)
        })
      }

      // Load doormat generator scripts
      const scripts = [
        '/lib/doormat/doormat-config.js',
        '/lib/doormat/color-palettes.js',
        '/lib/doormat/character-map.js',
        '/lib/doormat/trait-calculator.js',
        '/lib/doormat/doormat.js'
      ]

      for (const src of scripts) {
        if (!document.querySelector(`script[src="${src}"]`)) {
          const script = document.createElement('script')
          script.src = src
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
      }

      // Generate doormat with scaled-down size
      const p5Instance = new (window as any).p5((p: any) => {
        let doormatWidth = 200
        let doormatHeight = 300
        let fringeLength = 15
        let selectedPalette: any
        let stripeData: any[] = []
        let doormatTextRows = textRows
        let textData: any[] = []
        let lightTextColor: any
        let darkTextColor: any

        p.setup = () => {
          const canvas = p.createCanvas(doormatHeight + (fringeLength * 4), doormatWidth + (fringeLength * 4))
          canvas.parent(containerId)
          p.pixelDensity(1)
          p.noLoop()

          // Initialize
          p.randomSeed(seed)
          p.noiseSeed(seed)
          
          if ((window as any).colorPalettes) {
            selectedPalette = p.random((window as any).colorPalettes)
            updateTextColors()
            generateStripeData()
            generateTextData()
            setIsLoaded(true)
          }
        }

        p.draw = () => {
          p.background(222, 222, 222)
          
          p.push()
          p.translate(p.width/2, p.height/2)
          p.rotate(p.PI/2)
          p.translate(-p.height/2, -p.width/2)
          
          p.push()
          p.translate(fringeLength * 2, fringeLength * 2)
          
          for (let stripe of stripeData) {
            drawStripe(stripe)
          }
          
          drawTextureOverlay()
          p.pop()
          
          drawFringe()
          p.pop()
        }

        function updateTextColors() {
          if (!selectedPalette || !selectedPalette.colors) return
          let darkest = selectedPalette.colors[0]
          let lightest = selectedPalette.colors[0]
          let darkestVal = 999, lightestVal = -1
          for (let hex of selectedPalette.colors) {
            let c = p.color(hex)
            let bright = (p.red(c) + p.green(c) + p.blue(c)) / 3
            if (bright < darkestVal) { darkestVal = bright; darkest = hex }
            if (bright > lightestVal) { lightestVal = bright; lightest = hex }
          }
          darkTextColor = p.color(darkest)
          lightTextColor = p.lerpColor(p.color(lightest), p.color(255), 0.3)
          darkTextColor = p.lerpColor(p.color(darkest), p.color(0), 0.4)
        }

        function generateStripeData() {
          stripeData = []
          let totalHeight = doormatHeight
          let currentY = 0
          
          while (currentY < totalHeight) {
            let stripeHeight = p.random(10, 30)
            if (currentY + stripeHeight > totalHeight) {
              stripeHeight = totalHeight - currentY
            }
            
            let primaryColor = p.random(selectedPalette.colors)
            let hasSecondaryColor = p.random() < 0.15
            let secondaryColor = hasSecondaryColor ? p.random(selectedPalette.colors) : null
            
            let weaveRand = p.random()
            let weaveType = weaveRand < 0.6 ? 'solid' : weaveRand < 0.8 ? 'textured' : 'mixed'
            
            stripeData.push({
              y: currentY,
              height: stripeHeight,
              primaryColor: primaryColor,
              secondaryColor: secondaryColor,
              weaveType: weaveType,
              warpVariation: p.random(0.1, 0.5)
            })
            
            currentY += stripeHeight
          }
        }

        function generateTextData() {
          textData = []
          if (!doormatTextRows || doormatTextRows.length === 0) return
          
          const warpSpacing = 3
          const weftSpacing = 4
          const scaledWarp = warpSpacing * 1
          const scaledWeft = weftSpacing * 1
          
          const charWidth = 7 * scaledWarp
          const charHeight = 5 * scaledWeft
          const spacing = scaledWeft
          
          const rowSpacing = charWidth * 1.5
          const totalRowsWidth = doormatTextRows.length * charWidth + (doormatTextRows.length - 1) * rowSpacing
          const baseStartX = (doormatWidth - totalRowsWidth) / 2
          
          for (let rowIndex = 0; rowIndex < doormatTextRows.length; rowIndex++) {
            const doormatText = doormatTextRows[rowIndex]
            if (!doormatText) continue
            
            const textHeight = doormatText.length * (charHeight + spacing) - spacing
            const startX = baseStartX + rowIndex * (charWidth + rowSpacing)
            const startY = (doormatHeight - textHeight) / 2
            
            for (let i = 0; i < doormatText.length; i++) {
              const char = doormatText.charAt(i)
              const charY = startY + (doormatText.length - 1 - i) * (charHeight + spacing)
              const charPixels = generateCharacterPixels(char, startX, charY, charWidth, charHeight)
              textData.push(...charPixels)
            }
          }
        }

        function generateCharacterPixels(char: string, x: number, y: number, width: number, height: number) {
          const pixels = []
          if (!(window as any).characterMap) return pixels
          
          const charDef = (window as any).characterMap[char] || (window as any).characterMap[' ']
          const numRows = charDef.length
          const numCols = charDef[0].length
          
          for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
              if (charDef[row][col] === '1') {
                const newCol = row
                const newRow = numCols - 1 - col
                pixels.push({
                  x: x + newCol * 2,
                  y: y + newRow * 2,
                  width: 2,
                  height: 2
                })
              }
            }
          }
          return pixels
        }

        function drawStripe(stripe: any) {
          const warpSpacing = 3
          const weftSpacing = 4
          
          for (let x = 0; x < doormatWidth; x += warpSpacing) {
            for (let y = stripe.y; y < stripe.y + stripe.height; y += weftSpacing) {
              let warpColor = p.color(stripe.primaryColor)
              
              let isTextPixel = false
              for (let textPixel of textData) {
                if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
                    y >= textPixel.y && y < textPixel.y + textPixel.height) {
                  isTextPixel = true
                  break
                }
              }
              
              let r = p.red(warpColor) + p.random(-10, 10)
              let g = p.green(warpColor) + p.random(-10, 10)
              let b = p.blue(warpColor) + p.random(-10, 10)
              
              if (isTextPixel) {
                const bgBrightness = (r + g + b) / 3
                let tc = bgBrightness < 128 ? lightTextColor : darkTextColor
                r = p.red(tc)
                g = p.green(tc)
                b = p.blue(tc)
              }
              
              r = p.constrain(r, 0, 255)
              g = p.constrain(g, 0, 255)
              b = p.constrain(b, 0, 255)
              
              p.fill(r, g, b)
              p.noStroke()
              p.rect(x, y, 2, weftSpacing)
            }
          }
        }

        function drawTextureOverlay() {
          p.push()
          p.blendMode(p.MULTIPLY)
          for (let x = 0; x < doormatWidth; x += 2) {
            for (let y = 0; y < doormatHeight; y += 2) {
              let noiseVal = p.noise(x * 0.02, y * 0.02)
              let hatchingIntensity = p.map(noiseVal, 0, 1, 0, 30)
              p.fill(0, 0, 0, hatchingIntensity)
              p.noStroke()
              p.rect(x, y, 2, 2)
            }
          }
          p.pop()
        }

        function drawFringe() {
          drawFringeSection(fringeLength * 2, fringeLength, doormatWidth, fringeLength, 'top')
          drawFringeSection(fringeLength * 2, fringeLength * 2 + doormatHeight, doormatWidth, fringeLength, 'bottom')
        }

        function drawFringeSection(x: number, y: number, w: number, h: number, side: string) {
          let fringeStrands = w / 8
          let strandWidth = w / fringeStrands
          
          for (let i = 0; i < fringeStrands; i++) {
            let strandX = x + i * strandWidth
            let strandColor = p.random(selectedPalette.colors)
            
            for (let j = 0; j < 6; j++) {
              let threadX = strandX + p.random(-strandWidth/6, strandWidth/6)
              let startY = side === 'top' ? y + h : y
              let endY = side === 'top' ? y : y + h
              
              let fringeColor = p.color(strandColor)
              let r = p.red(fringeColor) * 0.7
              let g = p.green(fringeColor) * 0.7
              let b = p.blue(fringeColor) * 0.7
              
              p.stroke(r, g, b)
              p.strokeWeight(p.random(0.5, 1))
              p.line(threadX, startY, threadX + p.random(-2, 2), endY)
            }
          }
        }
      }, containerId)
    }

    loadP5AndGenerate().catch(console.error)

    return () => {
      if (canvasRef.current) {
        canvasRef.current.innerHTML = ''
      }
    }
  }, [seed, textRows])

  return (
    <div 
      className="absolute transition-all duration-1000 hover:scale-110 hover:z-10"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${size}px`,
        height: `${size * 1.2}px`,
        opacity: isLoaded ? 1 : 0.5
      }}
    >
      <div 
        ref={canvasRef} 
        className="w-full h-full rounded-lg shadow-lg bg-white/10 backdrop-blur-sm border border-white/20"
      />
    </div>
  )
}

export default function AnimatedRugs() {
  const [rugs, setRugs] = useState<Array<{
    seed: number
    textRows: string[]
    position: { x: number, y: number }
    size: number
  }>>([])

  useEffect(() => {
    // Generate 6 random rugs on load
    const generateRandomRugs = () => {
      const newRugs = []
      for (let i = 0; i < 6; i++) {
        const seed = Math.floor(Math.random() * 10000)
        
        // Always include "WELCOME" + 1-2 random texts
        const randomTexts = [...DOORMAT_TEXTS].filter(t => t !== "WELCOME")
        const numAdditionalTexts = Math.floor(Math.random() * 3) // 0-2 additional texts
        const selectedTexts = ["WELCOME"]
        
        for (let j = 0; j < numAdditionalTexts; j++) {
          const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)]
          if (!selectedTexts.includes(randomText)) {
            selectedTexts.push(randomText)
          }
        }
        
        newRugs.push({
          seed,
          textRows: selectedTexts,
          position: {
            x: Math.random() * 80 + 10, // 10-90%
            y: Math.random() * 70 + 15  // 15-85%
          },
          size: Math.random() * 100 + 150 // 150-250px
        })
      }
      setRugs(newRugs)
    }

    generateRandomRugs()

    // Regenerate rugs every 30 seconds
    const interval = setInterval(generateRandomRugs, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Floating particles background */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({length: 50}).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Generated Rugs */}
      {rugs.map((rug, index) => (
        <GeneratedRug
          key={`${rug.seed}-${index}`}
          seed={rug.seed}
          textRows={rug.textRows}
          position={rug.position}
          size={rug.size}
        />
      ))}
    </div>
  )
}
