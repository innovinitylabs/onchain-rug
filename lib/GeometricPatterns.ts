/**
 * Geometric Pattern Library for Rug Canvas Overlays
 * Provides deterministic geometric patterns using p5.js
 * Designed to work as overlay on flipped rug canvases
 */

export interface PatternParameters {
  scale: number
  opacity: number
  rotation: number
  xOffset: number
  yOffset: number
}

export interface ColorPalette {
  colors: Array<{
    r: number
    g: number
    b: number
  }>
}

export type PatternType =
  | 'sacred_geometry'
  | 'fractal_spirals'
  | 'kaleidoscope'
  | 'tessellation'
  | 'minimalist_networks'
  | 'dot_matrix'
  | 'human_presence'

export type HumanPose =
  | 'standing_calm'
  | 'walking_forward'
  | 'leaning'
  | 'kneeling'
  | 'sitting_folded'
  | 'reaching_up'
  | 'twisting'

/**
 * Main geometric pattern renderer
 */
export class GeometricPatternRenderer {
  private p: any
  private prng: any

  constructor(p5Instance: any, prngInstance: any) {
    this.p = p5Instance
    this.prng = prngInstance
  }

  /**
   * Render a geometric pattern overlay
   */
  renderPattern(
    patternType: PatternType,
    params: PatternParameters,
    palette: ColorPalette,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    console.log('🎨 renderPattern called with type:', patternType, 'palette:', palette.colors.length)

    this.p.push()

    // Set blend mode for overlay (try different modes for testing)
    this.p.blendMode(this.p.ADD)  // Changed to ADD for better visibility
    console.log('🎨 Blend mode set to ADD')

    // RULE 4: Pattern renderer assumes center-origin (0,0 is center)
    // Generator has already positioned us at rug centroid, so just apply user adjustments
    this.p.translate(params.xOffset, params.yOffset)
    this.p.rotate(params.rotation)
    this.p.scale(params.scale)
    console.log('🎨 Pattern centered at origin (0,0) - user offset:', params.xOffset, 'scale:', params.scale)

    // Set opacity
    this.p.push()
    this.p.fill(255, params.opacity * 255)
    this.p.stroke(255, params.opacity * 255)
    console.log('🎨 Opacity set to:', params.opacity)

    // Render specific pattern
    console.log('🎨 Switching to pattern type:', patternType)
    switch (patternType) {
      case 'sacred_geometry':
        this.renderSacredGeometry(palette, canvasWidth, canvasHeight)
        break
      case 'fractal_spirals':
        this.renderFractalSpirals(palette, canvasWidth, canvasHeight)
        break
      case 'kaleidoscope':
        this.renderKaleidoscope(palette, canvasWidth, canvasHeight)
        break
      case 'tessellation':
        this.renderTessellation(palette, canvasWidth, canvasHeight)
        break
      case 'minimalist_networks':
        this.renderMinimalistNetworks(palette, canvasWidth, canvasHeight)
        break
      case 'dot_matrix':
        this.renderDotMatrix(palette, canvasWidth, canvasHeight)
        break
      case 'human_presence':
        this.renderHumanPresence(palette, canvasWidth, canvasHeight)
        break
      default:
        // Test pattern - draw a big visible circle
        console.log('🎨 Drawing test pattern - BIG RED CIRCLE')
        this.p.fill(255, 0, 0, 255) // Bright red with full opacity
        this.p.stroke(0, 255, 0, 255) // Green stroke
        this.p.strokeWeight(5)
        this.p.circle(0, 0, Math.min(canvasWidth, canvasHeight) * 0.4) // Bigger circle
        console.log('🎨 Test circle drawn at center with radius:', Math.min(canvasWidth, canvasHeight) * 0.4)
        break
    }

    this.p.pop()
    this.p.pop()
  }

  private renderSacredGeometry(palette: ColorPalette, width: number, height: number): void {
    console.log('🎨 Rendering Indian mandala sacred geometry with palette:', palette.colors.length)
    const centerX = 0
    const centerY = 0
    const maxRadius = Math.min(width, height) * 0.45

    // Ensure clean state - no fill/stroke carryover
    this.p.strokeWeight(1)

    // 1. Central bindu (dot) - the seed of creation
    this.p.fill(palette.colors[0].r, palette.colors[0].g, palette.colors[0].b, 255) // Solid, not transparent
    this.p.noStroke()
    this.p.circle(centerX, centerY, 6) // Smaller, solid dot

    // 2. Flower of Life - overlapping circles (stroke only, no fill)
    const flowerCircles = 5 + Math.floor(this.prng.next() * 3) // 5-7 circles, fewer for clarity
    this.p.strokeWeight(1.5)
    this.p.noFill()

    for (let i = 0; i < flowerCircles; i++) {
      const radius = maxRadius * (0.2 + i * 0.15) // More structured spacing
      const color = palette.colors[i % palette.colors.length]
      this.p.stroke(color.r, color.g, color.b, 180) // Higher opacity for visibility
      this.p.circle(centerX, centerY, radius * 2)
    }

    // 3. Simplified lotus petals - essential curved elements only
    const petals = 6 + Math.floor(this.prng.next() * 4) // 6-9 petals, fewer for performance
    this.p.strokeWeight(2)

    for (let i = 0; i < petals; i++) {
      const angle = (this.p.TWO_PI / petals) * i
      const petalRadius = maxRadius * (0.5 + this.prng.next() * 0.2)
      const color = palette.colors[i % palette.colors.length]

      this.p.stroke(color.r, color.g, color.b, 160)
      this.p.noFill() // No fill to prevent canvas accumulation

      // Draw simplified curved petal outline
      this.p.push()
      this.p.translate(centerX, centerY)
      this.p.rotate(angle)

      this.p.beginShape()
      // Single smooth curve for the petal
      for (let t = 0; t <= this.p.PI; t += 0.15) { // Fewer points for performance
        const curveOffset = Math.sin(t * 1.5) * petalRadius * 0.2
        const x = Math.cos(t) * (petalRadius + curveOffset)
        const y = Math.sin(t) * petalRadius * 0.8
        this.p.vertex(x, y)
      }
      this.p.endShape()
      this.p.pop()
    }

    // 4. Essential sacred triangles only (stroke only)
    const color = palette.colors[Math.floor(this.prng.next() * palette.colors.length)]
    this.p.stroke(color.r, color.g, color.b, 140)
    this.p.strokeWeight(1)
    this.p.noFill()

    // Single upward triangle
    const triangleRadius = maxRadius * 0.7
    this.p.push()
    this.p.translate(centerX, centerY)
    for (let i = 0; i < 3; i++) {
      const angle1 = (this.p.TWO_PI / 3) * i - this.p.PI/2
      const angle2 = (this.p.TWO_PI / 3) * ((i + 1) % 3) - this.p.PI/2

      const x1 = Math.cos(angle1) * triangleRadius
      const y1 = Math.sin(angle1) * triangleRadius
      const x2 = Math.cos(angle2) * triangleRadius
      const y2 = Math.sin(angle2) * triangleRadius

      this.p.line(x1, y1, x2, y2)
    }
    this.p.pop()

    // 5. Minimal curved flourishes (stroke only)
    const flourishes = 8 + Math.floor(this.prng.next() * 6) // 8-13 flourishes, reduced

    for (let i = 0; i < flourishes; i++) {
      const angle = (this.p.TWO_PI / flourishes) * i
      const radius = maxRadius * (0.75 + this.prng.next() * 0.15)
      const color = palette.colors[i % palette.colors.length]

      this.p.stroke(color.r, color.g, color.b, 120)
      this.p.strokeWeight(1)
      this.p.noFill()

      // Simple curved line
      this.p.push()
      this.p.translate(centerX, centerY)
      this.p.rotate(angle)

      this.p.beginShape()
      for (let t = 0; t <= 1; t += 0.1) {
        const curveRadius = radius * (1 + Math.sin(t * this.p.PI) * 0.2)
        const x = Math.cos(t * this.p.PI * 0.6) * curveRadius
        const y = Math.sin(t * this.p.PI * 0.6) * curveRadius * 0.5
        this.p.vertex(x, y)
      }
      this.p.endShape()
      this.p.pop()
    }

    // Reset to clean state
    this.p.noFill()
    this.p.strokeWeight(1)
  }

  private renderFractalSpirals(palette: ColorPalette, width: number, height: number): void {
    const centerX = 0
    const centerY = 0
    const maxRadius = Math.min(width, height) * 0.5

    // Pingala spiral (Indian mathematics, predecessor to Fibonacci)
    const spirals = 3 + Math.floor(this.prng.next() * 3) // 3-5 spirals

    for (let s = 0; s < spirals; s++) {
      const color = palette.colors[s % palette.colors.length]
      this.p.stroke(color.r, color.g, color.b, 120)
      this.p.strokeWeight(2)
      this.p.noFill()

      const points = []
      const angleOffset = (this.p.TWO_PI / spirals) * s
      const turns = 3 + this.prng.next() * 2 // 3-5 turns

      for (let i = 0; i < 100; i++) {
        const t = (i / 99) * turns
        const angle = t * this.p.TWO_PI + angleOffset
        const radius = (maxRadius / turns) * t * 0.382 // Golden ratio

        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        points.push({ x, y })
      }

      // Draw spiral
      for (let i = 1; i < points.length; i++) {
        this.p.line(points[i-1].x, points[i-1].y, points[i].x, points[i].y)
      }
    }
  }

  private renderKaleidoscope(palette: ColorPalette, width: number, height: number): void {
    const segments = 6 + Math.floor(this.prng.next() * 4) // 6-9 segments
    const maxRadius = Math.min(width, height) * 0.4

    for (let segment = 0; segment < segments; segment++) {
      const angleStep = this.p.TWO_PI / segments
      const startAngle = segment * angleStep
      const endAngle = (segment + 1) * angleStep

      // Create mirrored pattern within segment
      this.p.push()

      // Define clipping region (pie slice)
      this.p.clip(() => {
        this.p.arc(0, 0, maxRadius * 2, maxRadius * 2, startAngle, endAngle)
      })

      // Now draw elements within the clipped region
      const color = palette.colors[segment % palette.colors.length]
      this.p.fill(color.r, color.g, color.b, 100)
      this.p.stroke(color.r, color.g, color.b, 150)

      const elements = 8 + Math.floor(this.prng.next() * 8) // 8-15 elements

      for (let i = 0; i < elements; i++) {
        const angle = startAngle + (this.prng.next() * angleStep)
        const radius = this.prng.next() * maxRadius

        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        const size = 5 + this.prng.next() * 15
        this.p.circle(x, y, size)
      }

      this.p.pop()
    }
  }

  private renderTessellation(palette: ColorPalette, width: number, height: number): void {
    const gridSize = 20 + Math.floor(this.prng.next() * 20) // 20-40
    const halfWidth = width / 2
    const halfHeight = height / 2

    for (let x = -halfWidth; x < halfWidth; x += gridSize) {
      for (let y = -halfHeight; y < halfHeight; y += gridSize) {
        const colorIndex = Math.floor(this.prng.next() * palette.colors.length)
        const color = palette.colors[colorIndex]

        this.p.fill(color.r, color.g, color.b, 80)
        this.p.stroke(color.r, color.g, color.b, 120)
        this.p.strokeWeight(1)

        // Random shape selection
        const shapeType = Math.floor(this.prng.next() * 4)

        switch (shapeType) {
          case 0: // Triangle
            this.p.triangle(
              x, y,
              x + gridSize, y,
              x + gridSize/2, y + gridSize
            )
            break
          case 1: // Hexagon
            this.p.push()
            this.p.translate(x + gridSize/2, y + gridSize/2)
            this.p.beginShape()
            for (let i = 0; i < 6; i++) {
              const angle = (i * this.p.TWO_PI) / 6
              const hx = Math.cos(angle) * (gridSize * 0.4)
              const hy = Math.sin(angle) * (gridSize * 0.4)
              this.p.vertex(hx, hy)
            }
            this.p.endShape(this.p.CLOSE)
            this.p.pop()
            break
          case 2: // Circle
            this.p.circle(x + gridSize/2, y + gridSize/2, gridSize * 0.8)
            break
          case 3: // Square
            this.p.rect(x, y, gridSize, gridSize)
            break
        }
      }
    }
  }

  private renderMinimalistNetworks(palette: ColorPalette, width: number, height: number): void {
    const nodes = 12 + Math.floor(this.prng.next() * 12) // 12-23 nodes
    const connections = Math.floor(nodes * 1.5) // 1.5x connections per node

    const nodePositions: Array<{x: number, y: number}> = []

    // Generate node positions
    for (let i = 0; i < nodes; i++) {
      nodePositions.push({
        x: (this.prng.next() - 0.5) * width * 0.8,
        y: (this.prng.next() - 0.5) * height * 0.8
      })
    }

    // Draw connections
    this.p.strokeWeight(1)
    for (let i = 0; i < connections; i++) {
      const node1 = nodePositions[Math.floor(this.prng.next() * nodes)]
      const node2 = nodePositions[Math.floor(this.prng.next() * nodes)]

      if (node1 !== node2) {
        const color = palette.colors[i % palette.colors.length]
        this.p.stroke(color.r, color.g, color.b, 100)
        this.p.line(node1.x, node1.y, node2.x, node2.y)
      }
    }

    // Draw nodes
    for (let i = 0; i < nodes; i++) {
      const node = nodePositions[i]
      const color = palette.colors[i % palette.colors.length]
      this.p.fill(color.r, color.g, color.b, 150)
      this.p.stroke(color.r, color.g, color.b, 200)
      this.p.strokeWeight(2)
      this.p.circle(node.x, node.y, 4 + this.prng.next() * 6)
    }
  }

  private renderDotMatrix(palette: ColorPalette, width: number, height: number): void {
    const dotSpacing = 15 + Math.floor(this.prng.next() * 10) // 15-25
    const maxDotSize = 8 + this.prng.next() * 8 // 8-16

    const cols = Math.ceil(width / dotSpacing)
    const rows = Math.ceil(height / dotSpacing)

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = (col * dotSpacing) - width/2 + (this.prng.next() - 0.5) * dotSpacing * 0.5
        const y = (row * dotSpacing) - height/2 + (this.prng.next() - 0.5) * dotSpacing * 0.5

        const color = palette.colors[(col + row) % palette.colors.length]
        this.p.fill(color.r, color.g, color.b, 120)
        this.p.noStroke()

        const dotSize = this.prng.next() * maxDotSize
        this.p.circle(x, y, dotSize)
      }
    }
  }

  private renderHumanPresence(palette: ColorPalette, width: number, height: number): void {
    console.log('🎨 Rendering human presence silhouette')

    // Select one pose deterministically via PRNG
    const poseIndex = Math.floor(this.prng.next() * 7)
    const poseTypes: HumanPose[] = ['standing_calm', 'walking_forward', 'leaning', 'kneeling', 'sitting_folded', 'reaching_up', 'twisting']
    const selectedPose = poseTypes[poseIndex]

    // Scale to 70-85% of rug height
    const scaleFactor = 0.7 + this.prng.next() * 0.15
    const silhouetteHeight = height * scaleFactor
    const silhouetteWidth = width * (0.3 + this.prng.next() * 0.15) // 30-45% of rug width

    // Position: center X ±5-10%, slightly lower than vertical center for weight
    const offsetX = (this.prng.next() - 0.5) * width * 0.1 // ±10% of width
    const offsetY = height * 0.1 // 10% down from center for grounded feel

    // Use MULTIPLY blend mode for overlay effect
    this.p.blendMode(this.p.MULTIPLY)
    this.p.fill(0, 160 + this.prng.next() * 40) // Dark gray with slight variation, not pure black
    this.p.noStroke()

    this.p.push()
    this.p.translate(offsetX, offsetY)
    this.p.scale(silhouetteWidth / 100, silhouetteHeight / 100) // Normalize to reasonable coords

    this.drawHumanPose(selectedPose)
    this.p.pop()

    // Reset blend mode
    this.p.blendMode(this.p.BLEND)
  }

  private drawCapsule(p: any, x: number, y: number, angle: number, w: number, h: number): void {
    p.push()
    p.translate(x, y)
    p.rotate(angle)
    p.rect(-w/2, 0, w, h, w) // Rounded rectangle with corner radius = width
    p.pop()
  }

  private drawHumanPose(pose: HumanPose): void {
    const torsoLength = 60
    const armLength = 35
    const legLength = 45
    const headSize = 16

    switch (pose) {
      case 'standing_calm':
        // Balanced, centered pose with slight asymmetry
        this.drawCapsule(this.p, 0, 20, -0.1, 25, torsoLength)     // Torso with slight lean
        this.p.ellipse(0, 5, 22, 18)                               // Pelvis
        this.drawCapsule(this.p, -12, 15, -0.8, 8, armLength)     // Left arm down
        this.drawCapsule(this.p, 12, 18, 0.6, 8, armLength)       // Right arm relaxed
        this.drawCapsule(this.p, -8, 55, 0.1, 10, legLength)      // Left leg
        this.drawCapsule(this.p, 8, 58, -0.1, 10, legLength)      // Right leg
        this.p.ellipse(4, -8, headSize, headSize)                  // Head slightly offset
        break

      case 'walking_forward':
        // Dynamic walking pose with forward momentum
        this.drawCapsule(this.p, -5, 18, -0.3, 28, torsoLength)    // Leaning forward torso
        this.p.ellipse(-3, 3, 24, 16)                              // Forward pelvis
        this.drawCapsule(this.p, -18, 12, -1.2, 9, armLength)     // Left arm swinging back
        this.drawCapsule(this.p, 8, 15, 0.8, 9, armLength)        // Right arm swinging forward
        this.drawCapsule(this.p, -12, 50, -0.2, 11, legLength)    // Left leg back
        this.drawCapsule(this.p, 4, 55, 0.3, 11, legLength)       // Right leg forward
        this.p.ellipse(-8, -12, headSize, headSize)                // Head forward
        break

      case 'leaning':
        // Weight shifted to one side, contemplative
        this.drawCapsule(this.p, 8, 22, 0.4, 26, torsoLength)      // Torso leaning right
        this.p.ellipse(12, 8, 20, 22)                              // Pelvis shifted
        this.drawCapsule(this.p, -5, 20, -0.9, 8, armLength)      // Left arm crossed
        this.drawCapsule(this.p, 25, 25, 0.3, 8, armLength)       // Right arm out
        this.drawCapsule(this.p, 2, 58, 0.1, 10, legLength)       // Left leg straight
        this.drawCapsule(this.p, 20, 62, -0.2, 10, legLength)     // Right leg bent
        this.p.ellipse(18, -6, headSize, headSize)                 // Head tilted
        break

      case 'kneeling':
        // One knee down, humble/meditative pose
        this.drawCapsule(this.p, 0, 15, -0.2, 24, torsoLength)     // Slightly bowed torso
        this.p.ellipse(0, 0, 26, 14)                               // Pelvis level
        this.drawCapsule(this.p, -15, 10, -1.0, 9, armLength)     // Left arm back
        this.drawCapsule(this.p, 15, 12, 0.7, 9, armLength)       // Right arm forward
        this.drawCapsule(this.p, -8, 45, -0.3, 11, legLength)     // Left leg bent (knee down)
        this.drawCapsule(this.p, 8, 55, 0.0, 11, legLength)       // Right leg extended
        this.p.ellipse(0, -10, headSize, headSize)                 // Head centered, bowed
        // Optional ground shadow for weight
        this.p.ellipse(0, 75, 40, 8)
        break

      case 'sitting_folded':
        // Sitting cross-legged, contemplative
        this.drawCapsule(this.p, 0, 8, 0.1, 22, torsoLength * 0.9) // Shorter, upright torso
        this.p.ellipse(0, -2, 28, 12)                              // Pelvis on ground
        this.drawCapsule(this.p, -14, 5, -0.8, 8, armLength)      // Left arm resting
        this.drawCapsule(this.p, 14, 7, 0.5, 8, armLength)        // Right arm relaxed
        this.drawCapsule(this.p, -12, 35, -1.2, 12, legLength * 0.8) // Left leg folded
        this.drawCapsule(this.p, 12, 35, 1.0, 12, legLength * 0.8)   // Right leg folded
        this.p.ellipse(0, -18, headSize, headSize)                 // Head upright
        break

      case 'reaching_up':
        // Stretching upward, aspirational pose
        this.drawCapsule(this.p, 0, 25, 0.0, 20, torsoLength)      // Upright torso
        this.p.ellipse(0, 10, 18, 20)                              // Pelvis
        this.drawCapsule(this.p, -20, 18, -1.8, 10, armLength * 1.2) // Left arm reaching up high
        this.drawCapsule(this.p, 20, 18, 1.8, 10, armLength * 1.2)   // Right arm reaching up high
        this.drawCapsule(this.p, -6, 60, 0.0, 9, legLength)       // Left leg stable
        this.drawCapsule(this.p, 6, 60, 0.0, 9, legLength)        // Right leg stable
        this.p.ellipse(0, -12, headSize, headSize)                 // Head back, looking up
        break

      case 'twisting':
        // Torso twisted, dynamic turning motion
        this.drawCapsule(this.p, 8, 20, 0.6, 25, torsoLength)      // Torso twisted right
        this.p.ellipse(6, 5, 21, 19)                               // Pelvis following twist
        this.drawCapsule(this.p, -8, 18, -0.5, 9, armLength)      // Left arm across
        this.drawCapsule(this.p, 22, 22, 1.2, 9, armLength)       // Right arm back
        this.drawCapsule(this.p, -4, 55, 0.2, 10, legLength)      // Left leg planted
        this.drawCapsule(this.p, 12, 58, -0.1, 10, legLength)     // Right leg following
        this.p.ellipse(16, -8, headSize, headSize)                 // Head turned
        break
    }
  }
}

/**
 * Extract color palette from rug data
 */
export function extractRugPalette(rugData: any): ColorPalette {
  console.log('🎨 Extracting palette from rugData:', !!rugData, 'palette exists:', !!rugData?.selectedPalette)
  const colors: ColorPalette['colors'] = []

  if (rugData?.selectedPalette?.colors) {
    console.log('🎨 Found selectedPalette with', rugData.selectedPalette.colors.length, 'colors')
    // Extract from palette
    rugData.selectedPalette.colors.forEach((color: any, index: number) => {
      console.log('🎨 Color', index, ':', color)
      if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
        colors.push({ r: color.r, g: color.g, b: color.b })
      }
    })
  }

  // Fallback colors if no palette found
  if (colors.length === 0) {
    console.log('🎨 Using fallback colors')
    colors.push({ r: 139, g: 69, b: 19 }) // Saddle brown
    colors.push({ r: 160, g: 82, b: 45 }) // Sienna
    colors.push({ r: 205, g: 133, b: 63 }) // Peru
    colors.push({ r: 210, g: 180, b: 140 }) // Tan
  }

  console.log('🎨 Final palette:', colors.length, 'colors')
  return { colors }
}

/**
 * Create pattern parameters with defaults
 */
export function createDefaultPatternParams(): PatternParameters {
  return {
    scale: 1.0, // Default scale (overlay now sized for perfect fit)
    opacity: 0.8, // Increased for better visibility
    rotation: 0,
    xOffset: 0,
    yOffset: 0
  }
}