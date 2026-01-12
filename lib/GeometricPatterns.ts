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
  | 'reaching'

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
    console.log('🎨 Rendering anatomical Bézier human silhouette')

    // Select one pose deterministically via PRNG
    const poseIndex = Math.floor(this.prng.next() * 5)
    const poseTypes: HumanPose[] = ['standing', 'walking', 'leaning', 'kneeling', 'reaching']
    const selectedPose = poseTypes[poseIndex]

    // Scale to 70-85% of rug height, normalize to 100-unit height for curves
    const scaleFactor = 0.7 + this.prng.next() * 0.15
    const silhouetteHeight = height * scaleFactor
    const scaleRatio = silhouetteHeight / 100 // Normalize curves to 100-unit height

    // Position: center X ±5-10%, slightly lower than vertical center for weight
    const offsetX = (this.prng.next() - 0.5) * width * 0.1 // ±10% of width
    const offsetY = height * 0.1 // 10% down from center for grounded feel

    // Start with outline debugging - remove this after anatomy is correct
    this.p.blendMode(this.p.BLEND)
    this.p.noFill()
    this.p.stroke(0)
    this.p.strokeWeight(2)

    // Uncomment for final fill rendering:
    // this.p.blendMode(this.p.BLEND)
    // this.p.fill(0, 180)
    // this.p.noStroke()

    this.p.push()
    this.p.translate(offsetX, offsetY)
    this.p.scale(scaleRatio, scaleRatio) // Scale to actual size

    this.drawHumanSilhouette(selectedPose)
    this.p.pop()

    // Reset blend mode
    this.p.blendMode(this.p.BLEND)
  }


  private drawHumanSilhouette(pose: HumanPose): void {
    // Get anatomical Bézier control points for this pose (NO PRNG noise)
    const poseData = this.getAnatomicalPoseData(pose)

    // Draw head + torso as one continuous path
    this.p.beginShape()
    this.drawBezierPath(poseData.headTorso)
    this.p.endShape(this.p.CLOSE)

    // Draw left leg as separate path
    this.p.beginShape()
    this.drawBezierPath(poseData.leftLeg)
    this.p.endShape(this.p.CLOSE)

    // Draw right leg as separate path
    this.p.beginShape()
    this.drawBezierPath(poseData.rightLeg)
    this.p.endShape(this.p.CLOSE)
  }

  private drawBezierPath(path: any[]): void {
    // First element is starting vertex
    const startVertex = path[0]
    this.p.vertex(startVertex.v[0], startVertex.v[1])

    // Remaining elements are Bézier segments (NO PRNG perturbations)
    for (let i = 1; i < path.length; i++) {
      const segment = path[i]
      if (segment.b) {
        this.p.bezierVertex(
          segment.b[0], segment.b[1], // control point 1
          segment.b[2], segment.b[3], // control point 2
          segment.b[4], segment.b[5]  // end point
        )
      }
    }
  }

  private getAnatomicalPoseData(pose: HumanPose): any {
    // 8-unit classical proportions: head=1, torso=3, legs=4 (total 8 units)
    // Normalized to 100-unit height space, chest center at (0,0)
    // Y-coordinates: head (-45 to -35), torso (-35 to 25), legs (25 to 100)

    switch (pose) {
      case 'standing':
        return {
          headTorso: [
            { v: [0, -45] },        // Top of head
            { b: [-6, -45, -12, -42, -15, -35] }, // Head right side
            { b: [-18, -28, -16, -22, -12, -18] }, // Neck right
            { b: [-20, -10, -24, -2, -22, 8] },   // Shoulder right
            { b: [-25, 18, -22, 28, -18, 35] },   // Torso right side
            { b: [-14, 45, -8, 52, 0, 55] },      // Hip right
            { b: [8, 52, 14, 45, 18, 35] },       // Hip left
            { b: [22, 28, 25, 18, 22, 8] },       // Torso left side
            { b: [24, -2, 20, -10, 16, -18] },    // Shoulder left
            { b: [18, -22, 12, -28, 6, -35] },    // Neck left
            { b: [12, -42, 6, -45, 0, -45] }      // Head left side back to top
          ],
          leftLeg: [
            { v: [-8, 55] },       // Top of left leg (hip joint)
            { b: [-12, 65, -14, 75, -12, 85] },  // Thigh outer
            { b: [-10, 95, -6, 100, -2, 95] },   // Knee articulation (forward bulge)
            { b: [2, 85, 6, 75, 8, 65] },        // Calf inner
            { b: [10, 55, 9, 45, 6, 40] },       // Ankle taper inward
            { b: [2, 42, -2, 45, -6, 50] },      // Foot base
            { b: [-10, 48, -12, 52, -10, 55] }   // Back to hip joint
          ],
          rightLeg: [
            { v: [8, 55] },        // Top of right leg (hip joint)
            { b: [12, 65, 14, 75, 12, 85] },    // Thigh outer
            { b: [10, 95, 6, 100, 2, 95] },     // Knee articulation (forward bulge)
            { b: [-2, 85, -6, 75, -8, 65] },    // Calf inner
            { b: [-10, 55, -9, 45, -6, 40] },   // Ankle taper inward
            { b: [-2, 42, 2, 45, 6, 50] },      // Foot base
            { b: [10, 48, 12, 52, 10, 55] }     // Back to hip joint
          ]
        }

      case 'walking':
        return {
          headTorso: [
            { v: [3, -45] },        // Head slightly forward
            { b: [-3, -45, -9, -42, -12, -35] }, // Head right
            { b: [-15, -28, -13, -22, -9, -18] }, // Neck right
            { b: [-17, -10, -21, -2, -19, 8] },  // Shoulder right
            { b: [-22, 18, -19, 28, -15, 35] },  // Torso right (leaning forward)
            { b: [-11, 45, -5, 52, 3, 55] },     // Hip right
            { b: [11, 52, 17, 45, 21, 35] },    // Hip left
            { b: [25, 28, 28, 18, 25, 8] },     // Torso left
            { b: [27, -2, 23, -10, 19, -18] },  // Shoulder left
            { b: [21, -22, 15, -28, 9, -35] },  // Neck left
            { b: [15, -42, 9, -45, 3, -45] }    // Head left back to top
          ],
          leftLeg: [
            { v: [-5, 55] },       // Back leg (hip joint)
            { b: [-9, 65, -11, 75, -9, 85] },  // Thigh outer
            { b: [-7, 95, -3, 100, 1, 95] },   // Knee articulation
            { b: [5, 85, 9, 75, 11, 65] },     // Calf inner
            { b: [13, 55, 12, 45, 9, 40] },    // Ankle taper
            { b: [5, 42, 1, 45, -3, 50] },     // Foot base
            { b: [-7, 48, -9, 52, -7, 55] }    // Back to hip
          ],
          rightLeg: [
            { v: [11, 55] },       // Forward leg (hip joint)
            { b: [15, 65, 17, 75, 15, 85] },  // Thigh outer
            { b: [13, 95, 9, 100, 5, 95] },   // Knee forward
            { b: [1, 85, -3, 75, -5, 65] },   // Calf inner
            { b: [-7, 55, -6, 45, -3, 40] },  // Ankle taper
            { b: [1, 42, 5, 45, 9, 50] },     // Foot base
            { b: [13, 48, 15, 52, 13, 55] }   // Back to hip
          ]
        }

      case 'leaning':
        return {
          headTorso: [
            { v: [8, -47] },        // Head tilted
            { b: [2, -47, -4, -44, -7, -37] }, // Head right
            { b: [-10, -30, -8, -24, -4, -20] }, // Neck right
            { b: [-12, -12, -16, -4, -14, 4] }, // Shoulder right
            { b: [-17, 14, -14, 24, -10, 32] }, // Torso right
            { b: [-6, 42, 0, 49, 8, 53] },      // Hip right
            { b: [16, 49, 22, 42, 26, 32] },    // Hip left
            { b: [30, 24, 33, 14, 31, 4] },     // Torso left
            { b: [33, -4, 29, -12, 25, -20] },  // Shoulder left
            { b: [27, -24, 21, -30, 17, -37] }, // Neck left
            { b: [21, -44, 17, -47, 11, -47] }, // Head left
            { b: [11, -47, 8, -47, 8, -47] }    // Back to top
          ],
          leftLeg: [
            { v: [0, 53] },        // Hip joint
            { b: [-4, 63, -6, 73, -4, 83] },   // Thigh
            { b: [-2, 93, 2, 98, 6, 93] },     // Knee
            { b: [10, 83, 14, 73, 16, 63] },   // Calf
            { b: [18, 53, 17, 43, 14, 38] },   // Ankle
            { b: [10, 40, 6, 43, 2, 48] },     // Foot
            { b: [-2, 46, -4, 50, -2, 53] }    // Back to hip
          ],
          rightLeg: [
            { v: [16, 53] },       // Hip joint
            { b: [20, 63, 22, 73, 20, 83] },  // Thigh
            { b: [18, 93, 14, 98, 10, 93] },  // Knee
            { b: [6, 83, 2, 73, 0, 63] },     // Calf
            { b: [-2, 53, -1, 43, 2, 38] },   // Ankle
            { b: [6, 40, 10, 43, 14, 48] },   // Foot
            { b: [18, 46, 20, 50, 18, 53] }   // Back to hip
          ]
        }

      case 'kneeling':
        return {
          headTorso: [
            { v: [0, -45] },        // Head upright
            { b: [-6, -45, -12, -42, -15, -37] }, // Head right
            { b: [-18, -30, -16, -24, -12, -20] }, // Neck right
            { b: [-20, -12, -24, -4, -22, 4] },   // Shoulder right
            { b: [-25, 14, -22, 24, -18, 32] },  // Torso right
            { b: [-14, 42, -8, 48, 0, 50] },     // Hip right (lower)
            { b: [8, 48, 14, 42, 18, 32] },      // Hip left
            { b: [22, 24, 25, 14, 22, 4] },      // Torso left
            { b: [24, -4, 20, -12, 16, -20] },   // Shoulder left
            { b: [18, -24, 12, -30, 6, -37] },   // Neck left
            { b: [12, -42, 6, -45, 0, -45] }     // Head left back to top
          ],
          leftLeg: [
            { v: [-8, 50] },       // Lower hip joint
            { b: [-12, 58, -14, 66, -12, 74] }, // Thigh bent
            { b: [-10, 82, -6, 86, -2, 82] },   // Knee bent
            { b: [2, 74, 6, 66, 8, 58] },       // Lower leg
            { b: [10, 50, 9, 42, 6, 38] },      // Ankle
            { b: [2, 40, -2, 42, -6, 46] },     // Foot on ground
            { b: [-10, 44, -12, 48, -10, 50] }  // Back to hip
          ],
          rightLeg: [
            { v: [8, 50] },        // Lower hip joint
            { b: [12, 58, 14, 66, 12, 74] },   // Thigh extended
            { b: [10, 82, 6, 86, 2, 82] },     // Knee
            { b: [-2, 74, -6, 66, -8, 58] },   // Lower leg
            { b: [-10, 50, -9, 42, -6, 38] },  // Ankle
            { b: [-2, 40, 2, 42, 6, 46] },     // Foot
            { b: [10, 44, 12, 48, 10, 50] }    // Back to hip
          ]
        }

      case 'reaching':
        return {
          headTorso: [
            { v: [-2, -55] },       // Head back looking up
            { b: [-8, -55, -14, -52, -17, -45] }, // Head right
            { b: [-20, -38, -18, -32, -14, -28] }, // Neck right
            { b: [-22, -20, -26, -12, -24, -4] },  // Shoulder right
            { b: [-27, 6, -24, 16, -20, 24] },    // Torso right
            { b: [-16, 34, -10, 40, -2, 43] },    // Hip right
            { b: [6, 40, 12, 34, 16, 24] },       // Hip left
            { b: [20, 16, 23, 6, 21, -4] },       // Torso left
            { b: [23, -12, 19, -20, 15, -28] },   // Shoulder left
            { b: [17, -32, 11, -38, 7, -45] },    // Neck left
            { b: [13, -52, 7, -55, 1, -55] },     // Head left
            { b: [1, -55, -2, -55, -2, -55] }     // Back to top
          ],
          leftLeg: [
            { v: [-10, 43] },      // Hip joint
            { b: [-14, 51, -16, 59, -14, 67] }, // Thigh
            { b: [-12, 75, -8, 79, -4, 75] },   // Knee
            { b: [0, 67, 4, 59, 6, 51] },       // Calf
            { b: [8, 43, 7, 35, 4, 31] },       // Ankle
            { b: [0, 33, -4, 35, -8, 39] },     // Foot
            { b: [-12, 37, -14, 41, -12, 43] }  // Back to hip
          ],
          rightLeg: [
            { v: [6, 43] },        // Hip joint
            { b: [10, 51, 12, 59, 10, 67] },   // Thigh
            { b: [8, 75, 4, 79, 0, 75] },      // Knee
            { b: [-4, 67, -8, 59, -10, 51] },  // Calf
            { b: [-12, 43, -11, 35, -8, 31] }, // Ankle
            { b: [-4, 33, 0, 35, 4, 39] },     // Foot
            { b: [8, 37, 10, 41, 8, 43] }      // Back to hip
          ]
        }

      default:
        return this.getAnatomicalPoseData('standing')
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