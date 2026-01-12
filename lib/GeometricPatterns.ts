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
    // Anatomical hard points with alternating convex-concave signals
    // Coordinate system: pelvis center at (0,0), head at -50, feet at +50
    // 8-unit proportions: head=1, torso=3, legs=4 (normalized to 100 units)

    switch (pose) {
      case 'standing':
        return {
          headTorso: [
            { v: [-10, -40] },        // Left neck start
            { b: [-25, -35, -30, -10, -22, 0] },   // Shoulder expansion (convex)
            { b: [-18, 10, -12, 18, -8, 22] },     // Waist pinch (concave)
            { b: [-6, 26, -4, 30, 0, 30] },        // Hip flare (convex)
            { b: [4, 30, 6, 26, 8, 22] },          // Right hip
            { b: [12, 18, 18, 10, 22, 0] },        // Right waist
            { b: [30, -10, 25, -35, 10, -40] },    // Right shoulder
            { b: [6, -48, -6, -48, -10, -40] }     // Head top (back to neck)
          ],
          leftLeg: [
            { v: [-6, 30] },         // Hip attachment
            { b: [-12, 35, -16, 45, -14, 55] },   // Thigh (convex)
            { b: [-12, 65, -8, 70, -4, 65] },     // Knee bulge (sharp convex)
            { b: [0, 55, 4, 45, 6, 35] },         // Calf (concave)
            { b: [8, 25, 7, 15, 4, 10] },         // Ankle taper (sharp concave)
            { b: [0, 12, -4, 15, -6, 20] },       // Foot
            { b: [-8, 18, -7, 22, -6, 30] }       // Back to hip
          ],
          rightLeg: [
            { v: [6, 30] },          // Hip attachment
            { b: [12, 35, 16, 45, 14, 55] },     // Thigh (convex)
            { b: [12, 65, 8, 70, 4, 65] },       // Knee bulge (sharp convex)
            { b: [0, 55, -4, 45, -6, 35] },      // Calf (concave)
            { b: [-8, 25, -7, 15, -4, 10] },     // Ankle taper (sharp concave)
            { b: [0, 12, 4, 15, 6, 20] },        // Foot
            { b: [8, 18, 7, 22, 6, 30] }         // Back to hip
          ]
        }

      case 'walking':
        return {
          headTorso: [
            { v: [2, -42] },         // Head forward (slightly lower)
            { b: [-12, -38, -18, -18, -16, -2] },   // Left shoulder expansion
            { b: [-12, 8, -8, 16, -4, 20] },        // Waist pinch (concave)
            { b: [-2, 24, 0, 28, 4, 26] },          // Hip flare (convex)
            { b: [8, 20, 12, 12, 16, -2] },         // Right shoulder
            { b: [18, -18, 12, -38, 2, -42] },      // Right neck
            { b: [-2, -50, -8, -50, -12, -46] },    // Head top
            { b: [-16, -38, -14, -42, -12, -46] }   // Head left (back to shoulder)
          ],
          leftLeg: [
            { v: [0, 26] },          // Back leg hip
            { b: [-6, 32, -10, 42, -8, 52] },     // Thigh bent back
            { b: [-6, 62, -2, 66, 2, 62] },       // Bent knee (sharp convex)
            { b: [6, 52, 10, 42, 8, 32] },        // Calf
            { b: [10, 22, 9, 12, 6, 8] },         // Ankle sharp taper
            { b: [2, 10, -2, 12, -6, 16] },       // Foot planted
            { b: [-8, 14, -6, 18, 0, 26] }        // Back to hip
          ],
          rightLeg: [
            { v: [8, 26] },          // Forward leg hip
            { b: [14, 32, 18, 42, 16, 52] },     // Thigh forward
            { b: [14, 62, 10, 66, 6, 62] },      // Forward knee (sharp convex)
            { b: [2, 52, -2, 42, -4, 32] },      // Calf
            { b: [-6, 22, -5, 12, -2, 8] },      // Ankle taper
            { b: [2, 10, 6, 12, 10, 16] },       // Foot forward
            { b: [12, 14, 10, 18, 8, 26] }       // Back to hip
          ]
        }

      case 'leaning':
        return {
          headTorso: [
            { v: [12, -45] },        // Head tilted right
            { b: [6, -48, 0, -46, -6, -40] },     // Head left side
            { b: [-18, -32, -22, -14, -20, 2] },  // Left shoulder expansion
            { b: [-16, 12, -10, 20, -4, 24] },    // Waist pinch (concave)
            { b: [0, 28, 6, 32, 12, 28] },        // Right hip flare (convex)
            { b: [18, 20, 22, 12, 20, 2] },       // Right shoulder
            { b: [18, -14, 12, -32, 6, -40] },    // Right neck
            { b: [0, -46, -6, -48, -12, -46] },   // Head top
            { b: [-18, -40, -16, -44, -12, -46] } // Head back to left shoulder
          ],
          leftLeg: [
            { v: [-6, 24] },         // Weight-bearing leg
            { b: [-14, 30, -18, 40, -16, 50] },   // Thigh (straight)
            { b: [-14, 60, -10, 64, -6, 60] },    // Knee articulation
            { b: [-2, 50, 2, 40, 6, 30] },        // Calf
            { b: [8, 20, 7, 10, 4, 6] },          // Ankle taper
            { b: [0, 8, -4, 10, -8, 14] },        // Foot planted
            { b: [-10, 12, -8, 16, -6, 24] }      // Back to hip
          ],
          rightLeg: [
            { v: [10, 28] },         // Bent leg
            { b: [16, 34, 20, 44, 18, 54] },     // Thigh bent
            { b: [16, 64, 12, 68, 8, 64] },      // Knee sharply bent
            { b: [4, 54, 0, 44, -2, 34] },       // Calf
            { b: [-4, 24, -3, 14, 0, 10] },      // Ankle taper
            { b: [4, 12, 8, 14, 12, 18] },       // Foot raised
            { b: [14, 16, 12, 20, 10, 28] }      // Back to hip
          ]
        }

      case 'kneeling':
        return {
          headTorso: [
            { v: [0, -45] },         // Head upright
            { b: [-8, -45, -14, -42, -16, -36] }, // Head right
            { b: [-18, -28, -16, -20, -12, -16] }, // Neck right
            { b: [-18, -8, -22, 0, -20, 8] },     // Shoulder right
            { b: [-22, 18, -18, 26, -12, 30] },   // Torso right
            { b: [-8, 34, -2, 36, 0, 34] },       // Hip center (lower)
            { b: [2, 36, 8, 34, 12, 30] },        // Hip left
            { b: [18, 26, 22, 18, 20, 8] },       // Torso left
            { b: [22, 0, 18, -8, 12, -16] },      // Shoulder left
            { b: [16, -20, 10, -28, 4, -36] },    // Neck left
            { b: [10, -42, 4, -45, 0, -45] }      // Head left back to top
          ],
          leftLeg: [
            { v: [-4, 34] },         // Knee on ground
            { b: [-8, 38, -12, 42, -10, 46] },   // Lower thigh
            { b: [-8, 50, -4, 52, 0, 48] },      // Ground contact
            { b: [4, 42, 8, 38, 6, 34] },        // Back up
            { b: [4, 30, 2, 26, 0, 24] },        // Calf taper
            { b: [-2, 26, -4, 28, -4, 34] }      // Back to knee
          ],
          rightLeg: [
            { v: [4, 34] },          // Extended leg hip
            { b: [8, 38, 12, 48, 10, 58] },     // Thigh extended
            { b: [8, 68, 4, 72, 0, 68] },       // Knee articulation
            { b: [-4, 58, -8, 48, -6, 38] },    // Calf
            { b: [-4, 28, -2, 18, 1, 14] },     // Ankle taper
            { b: [4, 16, 8, 18, 10, 22] },      // Foot extended
            { b: [8, 26, 6, 30, 4, 34] }        // Back to hip
          ]
        }

      case 'reaching':
        return {
          headTorso: [
            { v: [0, -55] },         // Head back looking up
            { b: [-8, -55, -16, -52, -20, -45] }, // Head right
            { b: [-24, -36, -22, -28, -16, -24] }, // Neck right
            { b: [-22, -16, -28, -8, -26, 0] },   // Shoulder right + arm extension
            { b: [-24, 10, -20, 20, -14, 28] },   // Torso right
            { b: [-10, 36, -4, 40, 0, 38] },      // Hip center
            { b: [4, 40, 10, 36, 14, 28] },       // Hip left
            { b: [20, 20, 24, 10, 26, 0] },       // Torso left + arm extension
            { b: [28, -8, 22, -16, 16, -24] },    // Shoulder left
            { b: [22, -28, 16, -36, 8, -45] },    // Neck left
            { b: [14, -52, 6, -55, 0, -55] }      // Head left back to top
          ],
          leftLeg: [
            { v: [-6, 38] },         // Hip joint
            { b: [-12, 44, -16, 54, -14, 64] },   // Thigh
            { b: [-12, 74, -8, 78, -4, 74] },     // Knee articulation
            { b: [0, 64, 4, 54, 8, 44] },         // Calf
            { b: [10, 34, 9, 24, 6, 20] },        // Ankle taper
            { b: [2, 22, -2, 24, -6, 28] },       // Foot
            { b: [-8, 26, -7, 30, -6, 38] }       // Back to hip
          ],
          rightLeg: [
            { v: [6, 38] },          // Hip joint
            { b: [12, 44, 16, 54, 14, 64] },     // Thigh
            { b: [12, 74, 8, 78, 4, 74] },       // Knee articulation
            { b: [0, 64, -4, 54, -8, 44] },      // Calf
            { b: [-10, 34, -9, 24, -6, 20] },    // Ankle taper
            { b: [-2, 22, 2, 24, 6, 28] },       // Foot
            { b: [8, 26, 7, 30, 6, 38] }         // Back to hip
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