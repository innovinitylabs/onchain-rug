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
  | 'standing'
  | 'walking'
  | 'leaning'
  | 'kneeling'
  | 'sitting'
  | 'reaching'
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
    console.log('🎨 Rendering curve-based human presence silhouette')

    // Select one pose deterministically via PRNG
    const poseIndex = Math.floor(this.prng.next() * 7)
    const poseTypes: HumanPose[] = ['standing', 'walking', 'leaning', 'kneeling', 'sitting', 'reaching', 'twisting']
    const selectedPose = poseTypes[poseIndex]

    // Scale to 70-85% of rug height, normalize to 100-unit height for curves
    const scaleFactor = 0.7 + this.prng.next() * 0.15
    const silhouetteHeight = height * scaleFactor
    const scaleRatio = silhouetteHeight / 100 // Normalize curves to 100-unit height

    // Position: center X ±5-10%, slightly lower than vertical center for weight
    const offsetX = (this.prng.next() - 0.5) * width * 0.1 // ±10% of width
    const offsetY = height * 0.1 // 10% down from center for grounded feel

    // Use MULTIPLY blend mode for authentic shadow overlay
    this.p.blendMode(this.p.MULTIPLY)
    this.p.fill(0, 160 + this.prng.next() * 40) // Deep charcoal, not pure black
    this.p.noStroke()

    this.p.push()
    this.p.translate(offsetX, offsetY)
    this.p.scale(scaleRatio, scaleRatio) // Scale to actual size

    this.drawHumanPoseCurved(selectedPose)
    this.p.pop()

    // Reset blend mode
    this.p.blendMode(this.p.BLEND)
  }


  private drawHumanPoseCurved(pose: HumanPose): void {
    // PRNG variations for subtle pose differences
    const leanOffset = (this.prng.next() - 0.5) * 4
    const asymmetry = (this.prng.next() - 0.5) * 3
    const weightShift = (this.prng.next() - 0.5) * 2

    this.p.beginShape()

    switch (pose) {
      case 'standing':
        // Balanced standing pose - subtle curves, natural weight distribution
        this.p.vertex(-8 + asymmetry, -35)     // Top of head (left side)
        this.p.bezierVertex(-12, -32, -14, -25, -12, -18)  // Head curve to neck
        this.p.bezierVertex(-10, -12, -8, -5, -6, 0)       // Neck to shoulder
        this.p.bezierVertex(-4, 5, -2, 15, 0, 25)           // Shoulder to torso center
        this.p.bezierVertex(2, 35, 4, 45, 6, 55)            // Torso to hip
        this.p.bezierVertex(8, 65, 10, 75, 8, 85)           // Hip to outer leg
        this.p.bezierVertex(6, 95, 4, 100, 0, 100)          // Leg bottom to foot
        this.p.bezierVertex(-4, 100, -6, 95, -8, 85)        // Foot to inner leg
        this.p.bezierVertex(-10, 75, -12, 65, -14, 55)      // Inner leg to hip
        this.p.bezierVertex(-16, 45, -18, 35, -16, 25)      // Hip to torso
        this.p.bezierVertex(-14, 15, -12, 5, -10, 0)        // Torso to shoulder
        this.p.bezierVertex(-12, -5, -14, -12, -12, -18)    // Shoulder to neck
        this.p.bezierVertex(-10, -25, -8, -32, -8 + asymmetry, -35) // Neck back to head
        break

      case 'walking':
        // Forward momentum - leaning forward, one leg forward
        this.p.vertex(-10 + asymmetry, -32)    // Head forward
        this.p.bezierVertex(-14, -28, -16, -20, -14, -12)  // Head to neck
        this.p.bezierVertex(-12, -6, -10, 2, -8, 10)       // Neck to forward shoulder
        this.p.bezierVertex(-6, 18, -4, 28, -2, 38)         // Shoulder to torso lean
        this.p.bezierVertex(0, 48, 2, 58, 4, 68)            // Torso to back hip
        this.p.bezierVertex(6, 78, 8, 88, 6, 98)            // Back hip to back leg
        this.p.bezierVertex(4, 100, 2, 95, 0, 90)           // Back leg to ground
        this.p.bezierVertex(-2, 95, -4, 100, -6, 98)        // Ground to front leg
        this.p.bezierVertex(-8, 88, -10, 78, -12, 68)       // Front leg to front hip
        this.p.bezierVertex(-14, 58, -16, 48, -14, 38)      // Front hip to torso
        this.p.bezierVertex(-12, 28, -10, 18, -8, 10)       // Torso to back shoulder
        this.p.bezierVertex(-6, 2, -4, -6, -2, -12)         // Back shoulder to neck
        this.p.bezierVertex(0, -20, 2, -28, -10 + asymmetry, -32) // Neck back to head
        break

      case 'leaning':
        // Weight shifted to one side
        this.p.vertex(-12 + asymmetry, -30)    // Head tilted
        this.p.bezierVertex(-16, -25, -18, -18, -16, -10)  // Head curve
        this.p.bezierVertex(-14, -4, -12, 4, -10, 12)      // To higher shoulder
        this.p.bezierVertex(-8, 20, -6, 30, -4, 40)         // Shoulder to torso
        this.p.bezierVertex(-2, 50, 0, 60, 2, 70)           // Torso to lower hip
        this.p.bezierVertex(4, 80, 6, 90, 4, 100)           // Lower hip to lower leg
        this.p.bezierVertex(2, 105, 0, 102, -2, 100)        // Leg to ground
        this.p.bezierVertex(-4, 102, -6, 105, -8, 100)      // Ground to upper leg
        this.p.bezierVertex(-10, 90, -12, 80, -14, 70)      // Upper leg to upper hip
        this.p.bezierVertex(-16, 60, -18, 50, -16, 40)      // Upper hip to torso
        this.p.bezierVertex(-14, 30, -12, 20, -10, 12)      // Torso to lower shoulder
        this.p.bezierVertex(-8, 4, -6, -4, -4, -10)         // Lower shoulder to neck
        this.p.bezierVertex(-2, -18, 0, -25, -12 + asymmetry, -30) // Neck to head
        break

      case 'kneeling':
        // One knee down, contemplative
        this.p.vertex(-8 + asymmetry, -28)     // Head bowed
        this.p.bezierVertex(-12, -22, -14, -14, -12, -6)   // Head to neck
        this.p.bezierVertex(-10, 0, -8, 8, -6, 16)         // Neck to shoulders
        this.p.bezierVertex(-4, 24, -2, 34, 0, 44)          // Shoulders to torso
        this.p.bezierVertex(2, 54, 4, 64, 2, 74)            // Torso to hips
        this.p.bezierVertex(0, 84, -2, 94, -4, 100)         // Hips to kneeling leg
        this.p.bezierVertex(-6, 95, -8, 90, -10, 85)        // Kneeling leg bend
        this.p.bezierVertex(-12, 75, -14, 65, -12, 55)      // Back to standing leg
        this.p.bezierVertex(-10, 45, -8, 35, -6, 25)        // Standing leg
        this.p.bezierVertex(-4, 15, -2, 5, 0, -5)           // Back to torso
        this.p.bezierVertex(2, -15, 4, -25, -8 + asymmetry, -28) // Torso to head
        break

      case 'sitting':
        // Cross-legged sitting pose
        this.p.vertex(-6 + asymmetry, -20)     // Head upright
        this.p.bezierVertex(-10, -12, -12, -4, -10, 4)     // Head to neck
        this.p.bezierVertex(-8, 12, -6, 20, -4, 28)         // Neck to shoulders
        this.p.bezierVertex(-2, 36, 0, 46, 2, 56)           // Shoulders to torso
        this.p.bezierVertex(4, 66, 6, 76, 4, 86)            // Torso to sitting hips
        this.p.bezierVertex(2, 96, 0, 100, -2, 98)          // Hips to folded legs
        this.p.bezierVertex(-4, 100, -6, 96, -8, 86)        // Legs continuation
        this.p.bezierVertex(-10, 76, -12, 66, -10, 56)      // Back to hips
        this.p.bezierVertex(-8, 46, -6, 36, -4, 26)         // Hips to torso
        this.p.bezierVertex(-2, 16, 0, 6, 2, -4)            // Torso to shoulders
        this.p.bezierVertex(4, -14, 6, -24, -6 + asymmetry, -20) // Shoulders to head
        break

      case 'reaching':
        // Arms extended upward
        this.p.vertex(-8 + asymmetry, -38)     // Head back looking up
        this.p.bezierVertex(-12, -30, -14, -22, -12, -14)  // Head curve
        this.p.bezierVertex(-10, -6, -8, 2, -6, 10)         // Neck to shoulders
        this.p.bezierVertex(-4, 18, -2, 28, 0, 38)           // Shoulders to torso
        this.p.bezierVertex(2, 48, 4, 58, 2, 68)             // Torso to hips
        this.p.bezierVertex(0, 78, -2, 88, -4, 98)           // Hips to legs
        this.p.bezierVertex(-6, 100, -8, 95, -10, 85)       // Legs to feet
        this.p.bezierVertex(-12, 75, -14, 65, -12, 55)      // Feet back to knees
        this.p.bezierVertex(-10, 45, -8, 35, -6, 25)        // Knees to hips
        this.p.bezierVertex(-4, 15, -2, 5, 0, -5)            // Hips to torso
        this.p.bezierVertex(2, -15, 4, -25, -8 + asymmetry, -38) // Torso to head
        break

      case 'twisting':
        // Torso twisted, dynamic motion
        this.p.vertex(-10 + asymmetry, -32)    // Head turned
        this.p.bezierVertex(-14, -24, -16, -16, -14, -8)   // Head to neck
        this.p.bezierVertex(-12, 0, -10, 8, -8, 16)         // Neck to twisted shoulders
        this.p.bezierVertex(-6, 24, -4, 34, -2, 44)         // Shoulders to torso
        this.p.bezierVertex(0, 54, 2, 64, 4, 74)            // Torso to hips
        this.p.bezierVertex(6, 84, 8, 94, 6, 100)           // Hips to back leg
        this.p.bezierVertex(4, 95, 2, 90, 0, 85)            // Back leg
        this.p.bezierVertex(-2, 90, -4, 95, -6, 100)        // To front leg
        this.p.bezierVertex(-8, 94, -10, 84, -8, 74)        // Front leg
        this.p.bezierVertex(-6, 64, -4, 54, -2, 44)         // Back to hips
        this.p.bezierVertex(0, 34, 2, 24, 4, 16)            // Hips to torso
        this.p.bezierVertex(6, 8, 8, 0, 6, -8)              // Torso to shoulders
        this.p.bezierVertex(4, -16, 2, -24, -10 + asymmetry, -32) // Shoulders to head
        break
    }

    this.p.endShape(this.p.CLOSE)
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