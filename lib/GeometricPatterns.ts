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

/**
 * Generic interface for engraving masks that influence thread colors
 * Masks are pure, deterministic functions that return engraving strength at any coordinate
 */
export interface EngravingMask {
  /**
   * Returns true if engraving should be applied at this coordinate
   */
  isActive(x: number, y: number): boolean

  /**
   * Returns engraving strength from 0-1 at this coordinate
   * 0 = no engraving, 1 = full engraving strength
   */
  strength(x: number, y: number): number
}

/**
 * 2D vector for shape coordinates
 */
type Vec2 = { x: number, y: number }

/**
 * Block shape definitions for engraving masks
 */
type BlockShape =
  | { type: 'circle', cx: number, cy: number, r: number, stripeRotation?: number, booleanRole?: 'primary' | 'secondary' }
  | { type: 'rect', cx: number, cy: number, cw: number, ch: number, rot: number }
  | { type: 'triangle', p1: Vec2, p2: Vec2, p3: Vec2 }

/**
 * Block pattern mask that combines multiple shapes
 */
export class BlockPatternMask implements EngravingMask {
  private shapes: BlockShape[]
  private patternType?: PatternType
  private maskType?: MaskType
  private booleanMode?: 'intersection' | 'difference'

  constructor(shapes: BlockShape[], patternType?: PatternType, maskType?: MaskType, booleanMode?: 'intersection' | 'difference') {
    this.shapes = shapes
    this.patternType = patternType
    this.maskType = maskType
    this.booleanMode = booleanMode
  }

  isActive(x: number, y: number): boolean {
    return this.strength(x, y) > 0
  }

  strength(x: number, y: number): number {
    // Special handling for circle_interference with boolean operations
    if (this.maskType === 'circle_interference' && this.booleanMode) {
      return this.booleanStrength(x, y)
    }

    // Default behavior for all other mask types
    let maxStrength = 0
    for (const shape of this.shapes) {
      const s = this.shapeStrengthAt(shape, x, y)
      if (s > maxStrength) maxStrength = s
    }
    return maxStrength
  }

  /**
   * Calculate strength for circle_interference using boolean operations
   */
  private booleanStrength(x: number, y: number): number {
    // Find primary and secondary circles
    const primaryCircle = this.shapes.find(shape =>
      shape.type === 'circle' && shape.booleanRole === 'primary'
    ) as (BlockShape & { type: 'circle' }) | undefined

    const secondaryCircle = this.shapes.find(shape =>
      shape.type === 'circle' && shape.booleanRole === 'secondary'
    ) as (BlockShape & { type: 'circle' }) | undefined

    if (!primaryCircle || !secondaryCircle) {
      return 0
    }

    // Check if point is inside each circle
    const inPrimary = this.isPointInCircle(x, y, primaryCircle.cx, primaryCircle.cy, primaryCircle.r)
    const inSecondary = this.isPointInCircle(x, y, secondaryCircle.cx, secondaryCircle.cy, secondaryCircle.r)

    // Apply boolean operation
    if (this.booleanMode === 'intersection') {
      return (inPrimary && inSecondary) ? 1 : 0
    } else if (this.booleanMode === 'difference') {
      return (inPrimary && !inSecondary) ? 1 : 0
    }

    return 0
  }

  /**
   * Helper to check if point is inside circle
   */
  private isPointInCircle(x: number, y: number, cx: number, cy: number, r: number): boolean {
    const dx = x - cx
    const dy = y - cy
    return dx * dx + dy * dy <= r * r
  }

  /**
   * Get rotation angle at a specific point (for circle-based patterns)
   */
  getRotationAt(x: number, y: number): number | null {
    // For circle_interference, find the smallest circle that contains this point
    let smallestRadius = Infinity
    let rotationAngle: number | null = null

    for (const shape of this.shapes) {
      if (shape.type === 'circle') {
        const dx = x - shape.cx
        const dy = y - shape.cy
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Check if point is inside this circle and it's smaller than previous candidates
        if (distance <= shape.r && shape.r < smallestRadius) {
          smallestRadius = shape.r
          // Access stripeRotation property
          rotationAngle = shape.stripeRotation ?? 0
        }
      }
    }

    return rotationAngle
  }

  private shapeStrengthAt(shape: BlockShape, x: number, y: number): number {
    switch (shape.type) {
      case 'circle':
        const dx = x - shape.cx
        const dy = y - shape.cy
        return (dx * dx + dy * dy <= shape.r * shape.r) ? 1 : 0

      case 'rect':
        // Transform point relative to rectangle center and rotation
        const cos = Math.cos(-shape.rot)
        const sin = Math.sin(-shape.rot)
        const localX = (x - shape.cx) * cos - (y - shape.cy) * sin
        const localY = (x - shape.cx) * sin + (y - shape.cy) * cos

        // Check if point is inside axis-aligned rectangle
        return (Math.abs(localX) <= shape.cw / 2 && Math.abs(localY) <= shape.ch / 2) ? 1 : 0

      case 'triangle':
        return this.pointInTriangle(x, y, shape.p1, shape.p2, shape.p3) ? 1 : 0

      default:
        return 0
    }
  }

  private pointInTriangle(px: number, py: number, p1: Vec2, p2: Vec2, p3: Vec2): boolean {
    // Barycentric coordinate method
    const denominator = (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y)
    if (Math.abs(denominator) < 1e-10) return false // Degenerate triangle

    const a = ((p2.y - p3.y) * (px - p3.x) + (p3.x - p2.x) * (py - p3.y)) / denominator
    const b = ((p3.y - p1.y) * (px - p3.x) + (p1.x - p3.x) * (py - p3.y)) / denominator
    const c = 1 - a - b

    return a >= 0 && b >= 0 && c >= 0
  }
}

/**
 * Text mask implementation that checks if coordinates fall within text pixels
 */
export class TextMask implements EngravingMask {
  private textPixels: Array<{x: number, y: number, width: number, height: number}>

  constructor(textPixels: Array<{x: number, y: number, width: number, height: number}>) {
    this.textPixels = textPixels
  }

  isActive(x: number, y: number): boolean {
    for (const textPixel of this.textPixels) {
      if (x >= textPixel.x && x < textPixel.x + textPixel.width &&
          y >= textPixel.y && y < textPixel.y + textPixel.height) {
        return true
      }
    }
    return false
  }

  strength(x: number, y: number): number {
    // Text pixels are always fully engraved
    return this.isActive(x, y) ? 1 : 0
  }
}

/**
 * Parameters for resolving engraved thread colors
 */
export interface EngravingResolverParams {
  baseColor: any // p5.Color
  stripe: any
  isWarp: boolean
  maskStrength: number
  p: any // p5 instance
  x?: number // For text locality
  y?: number // For text locality
  doormatData?: any // For text locality
}

/**
 * Interface for stripe field effects that modify stripe sampling inside masks
 */
export interface StripeField {
  /**
   * Returns the source stripe index to sample from at the given coordinates
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param baseStripeIndex - Original stripe index that would be used
   * @param stripeData - Array of all stripe data
   * @param mask - The engraving mask (for rotation hints, etc.)
   * @param doormatData - Full doormat data context
   * @param evolutionStrength - Evolution strength from 0-1
   * @returns The stripe index to sample from
   */
  getSourceStripeIndex(
    x: number,
    y: number,
    baseStripeIndex: number,
    stripeData: any[],
    mask: EngravingMask | null,
    doormatData: any,
    evolutionStrength: number
  ): number
}

/**
 * Stripe rotation field - creates diagonal band illusions by rotating stripe sampling
 */
export class StripeRotationField implements StripeField {
  getSourceStripeIndex(
    x: number,
    y: number,
    baseStripeIndex: number,
    stripeData: any[],
    mask: EngravingMask | null,
    doormatData: any,
    evolutionStrength: number
  ): number {
    // Only apply rotation if mask is active at this position
    if (!mask || !mask.isActive(x, y)) {
      return baseStripeIndex
    }

    // Calculate average stripe height for consistent rotation illusion
    const averageStripeHeight = stripeData.reduce((sum, s) => sum + s.height, 0) / stripeData.length

    // Get rotation angle - prefer mask-specific angle, fallback to global angle
    const angle =
      (mask as any).getRotationAt?.(x, y) ??
      doormatData.__stripeRotationAngle

    if (angle !== null && angle !== undefined) {
      // Project point onto rotated stripe normal to get stripe coordinate
      // This creates infinite parallel diagonal bands independent of current stripe
      const rotatedStripeCoord = (x * Math.sin(angle)) + (y * Math.cos(angle))

      // Map rotated coordinate to virtual stripe index using average stripe height
      // This ensures ALL stripes inside mask participate, not just some
      const virtualStripeIndex = Math.floor(rotatedStripeCoord / averageStripeHeight)

      // Blend between base and rotated based on evolution strength
      if (evolutionStrength < 1) {
        return evolutionStrength < 0.5 ? baseStripeIndex : virtualStripeIndex
      }

      return virtualStripeIndex
    }

    // Fallback to base stripe index if no angle available
    return baseStripeIndex
  }
}

/**
 * Diagonal drift field - creates subtle diagonal movement effects
 */
export class DiagonalDriftField implements StripeField {
  getSourceStripeIndex(
    x: number,
    y: number,
    baseStripeIndex: number,
    stripeData: any[],
    mask: EngravingMask | null,
    doormatData: any,
    evolutionStrength: number
  ): number {
    // Diagonal drift creates a subtle phase shift based on x position
    // This creates a gentle diagonal wave effect
    const drift = Math.sin(x * 0.015) * 0.6
    const phase = doormatData.patternEvolutionPhase || 0
    const effectivePhase = Math.max(0, Math.min(phase + drift, phase + 0.99))

    // Simple borrowing logic based on effective phase
    if (effectivePhase >= 1 && effectivePhase < 2) {
      // Phase 1: borrow from previous stripe
      const prevIndex = baseStripeIndex > 0 ? baseStripeIndex - 1 : baseStripeIndex
      return prevIndex
    } else if (effectivePhase >= 2) {
      // Phase 2+: borrow from next stripe
      const nextIndex = baseStripeIndex < stripeData.length - 1 ? baseStripeIndex + 1 : baseStripeIndex
      return nextIndex
    }

    return baseStripeIndex
  }
}

/**
 * Two-stripe borrow field - borrows colors from adjacent stripes
 */
export class TwoStripeBorrowField implements StripeField {
  getSourceStripeIndex(
    x: number,
    y: number,
    baseStripeIndex: number,
    stripeData: any[],
    mask: EngravingMask | null,
    doormatData: any,
    evolutionStrength: number
  ): number {
    // Two-stripe borrow uses a deterministic hash to choose between prev2 and next2 stripes
    const hash01 = (x: number, y: number, seed: number): number => {
      const h = (x * 73856093) ^ (y * 19349663) ^ (seed * 83492791)
      return (h & 0x7fffffff) / 0x7fffffff
    }

    const phase = doormatData.patternEvolutionPhase || 0
    const prev2Index = baseStripeIndex > 1 ? baseStripeIndex - 2 : baseStripeIndex
    const next2Index = baseStripeIndex < stripeData.length - 2 ? baseStripeIndex + 2 : baseStripeIndex

    // Use hash to deterministically choose between prev2 and next2
    const choice = hash01(x, y, phase * 131)
    return choice < 0.5 ? prev2Index : next2Index
  }
}

/**
 * Precompute engraving profile for a stripe (called once per stripe)
 * Samples representative points and caches engraving colors for performance
 */
export function precomputeEngravingProfile(stripe: any, palette: ColorPalette, p: any, doormatData: any): void {
  const samplePoints = 32 // Sample 32 representative points per stripe
  const sampleColors: any[] = []

  // Sample representative points across the stripe
  for (let i = 0; i < samplePoints; i++) {
    const sampleX = Math.floor((i / samplePoints) * doormatData.config.DOORMAT_WIDTH)
    const sampleY = stripe.y + Math.floor((i % 4) / 4 * stripe.height)

    // Bounds checking
    if (sampleX >= 0 && sampleX < doormatData.config.DOORMAT_WIDTH &&
        sampleY >= stripe.y && sampleY < stripe.y + stripe.height) {

      // Determine thread color at this position
      let threadColor = p.color(stripe.primaryColor)
      if (stripe.weaveType === 'm' && stripe.secondaryColor) {
        const noiseVal = p.noise(sampleX * 0.1, sampleY * 0.1)
        if (noiseVal > 0.5) {
          threadColor = p.color(stripe.secondaryColor)
        }
      }
      sampleColors.push(threadColor)
    }
  }

  if (sampleColors.length === 0) {
    sampleColors.push(p.color(stripe.primaryColor))
  }

  // Compute average background luminance
  const luminance = (c: any) =>
    (p.red(c) * 0.2126 + p.green(c) * 0.7152 + p.blue(c) * 0.0722) / 255

  const avgBackgroundLum = sampleColors.reduce((sum, c) => sum + luminance(c), 0) / sampleColors.length

  // Find best contrast colors from palette
  const paletteColors = palette.colors.map(c => p.color(c.r, c.g, c.b))
  let darkerColor = paletteColors[0]
  let lighterColor = paletteColors[0]

  let bestDarkerDelta = 0
  let bestLighterDelta = 0

  for (const paletteColor of paletteColors) {
    const paletteLum = luminance(paletteColor)
    const lumDelta = paletteLum - avgBackgroundLum

    // Find darkest color below background
    if (lumDelta < 0 && Math.abs(lumDelta) > bestDarkerDelta) {
      darkerColor = paletteColor
      bestDarkerDelta = Math.abs(lumDelta)
    }

    // Find lightest color above background
    if (lumDelta > 0 && lumDelta > bestLighterDelta) {
      lighterColor = paletteColor
      bestLighterDelta = lumDelta
    }
  }

  // If no good contrast found, use subtle adjustments
  if (bestDarkerDelta === 0) {
    darkerColor = p.lerpColor(paletteColors[0], p.color(0, 0, 0), 0.15)
  }
  if (bestLighterDelta === 0) {
    lighterColor = p.lerpColor(paletteColors[0], p.color(255, 255, 255), 0.2)
  }

  // Create vivid pattern colors - no desaturation for patterns
  const warpBiasColor = p.lerpColor(darkerColor, p.color(0, 0, 0), 0.1) // Warp: slightly darker, rich
  const weftBiasColor = p.lerpColor(lighterColor, p.color(255, 255, 255), 0.1) // Weft: slightly brighter, vivid

  // Store on stripe - patterns don't use desaturated colors
  stripe.__engravingProfile = {
    warpBiasColor,
    weftBiasColor
  }
}

/**
 * Legacy text engraving resolver - restores old text rendering system
 * Uses base thread color as starting point, modifies via luminance/desaturation
 */

/**
 * Pattern engraving resolver - vivid palette-driven engraving
 * Handles geometric patterns with saturated, dyed-thread appearance
 */
export function resolvePatternThreadColor(params: EngravingResolverParams): any {
  const { baseColor, stripe, isWarp, maskStrength, p } = params

  if (maskStrength <= 0) {
    return baseColor
  }

  // Use precomputed engraving profile for this stripe
  const profile = stripe.__engravingProfile
  if (!profile) {
    // Fallback if profile not computed
    return p.lerpColor(baseColor, p.color(0, 0, 0), maskStrength * 0.3)
  }

  // Select appropriate vivid bias color - patterns don't use desaturated colors
  const targetColor = isWarp ? profile.warpBiasColor : profile.weftBiasColor

  // Assertive blending for patterns - stronger presence, not faded
  const assertiveStrength = Math.min(maskStrength * 1.2, 1.0)

  // Blend with vivid pattern color
  let blended = p.lerpColor(baseColor, targetColor, assertiveStrength)

  // Add micro-variation for woven feel (deterministic noise) - subtle for patterns
  const noiseInput = stripe.y * 0.01 + (isWarp ? 1000 : 2000) + maskStrength * 10
  const variation = (p.noise(noiseInput) - 0.5) * 0.04 // ±2% variation - less than text
  const variedStrength = Math.max(0, Math.min(1, assertiveStrength + variation))

  return p.lerpColor(baseColor, targetColor, variedStrength)
}

/**
 * Legacy pattern type - kept for backward compatibility
 * Will be deprecated in favor of separate MaskType and FieldType
 */
export type PatternType =
  | 'block_circles'
  | 'block_rectangles'
  | 'block_triangles'
  | 'circle_interference'
  | 'stripe_rotation_illusion'

/**
 * Mask types define where geometric effects apply
 */
export type MaskType =
  | 'none'
  | 'block_circles'
  | 'block_rectangles'
  | 'block_triangles'
  | 'circle_interference'

/**
 * Field types define how stripe sampling behaves inside masks
 */
export type FieldType =
  | 'none'
  | 'stripe_rotation'
  | 'diagonal_drift'
  | 'two_stripe_borrow'

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
   * Create a geometric pattern engraving mask (legacy method - deprecated)
   * @deprecated Use createMask with MaskType instead
   */
  createPatternMask(
    patternType: PatternType,
    params: PatternParameters,
    palette: ColorPalette,
    canvasWidth: number,
    canvasHeight: number
  ): EngravingMask {
    console.log('🎨 createPatternMask called with type:', patternType, 'palette:', palette.colors.length)

    // Convert legacy pattern type to mask type for backward compatibility
    let maskType: MaskType = 'none'
    switch (patternType) {
      case 'block_circles':
        maskType = 'block_circles'
        break
      case 'block_rectangles':
        maskType = 'block_rectangles'
        break
      case 'block_triangles':
        maskType = 'block_triangles'
        break
      case 'circle_interference':
        maskType = 'circle_interference'
        break
      case 'stripe_rotation_illusion':
        // For backward compatibility, stripe_rotation_illusion maps to circle_interference
        // since stripe rotation is now a field effect, not a mask type
        maskType = 'circle_interference'
        break
    }

    return this.createMask(maskType, params, palette, canvasWidth, canvasHeight)
  }

  /**
   * Create a geometric engraving mask
   */
  createMask(
    maskType: MaskType,
    params: PatternParameters,
    palette: ColorPalette,
    canvasWidth: number,
    canvasHeight: number
  ): EngravingMask {
    console.log('🎨 createMask called with type:', maskType, 'palette:', palette.colors.length)

    switch (maskType) {
      case 'block_circles': {
        const shapes = this.generateBlockCircleShapes(canvasWidth, canvasHeight)
        return new BlockPatternMask(shapes, undefined, maskType)
      }
      case 'block_rectangles': {
        const shapes = this.generateBlockRectangleShapes(canvasWidth, canvasHeight)
        return new BlockPatternMask(shapes, undefined, maskType)
      }
      case 'block_triangles': {
        const shapes = this.generateBlockTriangleShapes(canvasWidth, canvasHeight)
        return new BlockPatternMask(shapes, undefined, maskType)
      }
      case 'circle_interference': {
        const { shapes, booleanMode } = this.generateInterferenceCircles(canvasWidth, canvasHeight)
        return new BlockPatternMask(shapes, undefined, maskType, booleanMode)
      }
      case 'none':
      default:
        // Empty mask for 'none' type
        console.log('🎨 Creating empty mask')
        return new BlockPatternMask([])
    }
  }

  private generateBlockCircleShapes(width: number, height: number): BlockShape[] {
    // BIG BLOCK CIRCLES - 3-7 massive circles, no finesse
    const count = 3 + Math.floor(this.prng.next() * 5) // 3-7 circles
    const shapes: BlockShape[] = []
    const maxAttempts = 50 // Prevent infinite loops

    for (let i = 0; i < count; i++) {
      let attempts = 0
      let placed = false

      while (!placed && attempts < maxAttempts) {
        // Random position centered on canvas, accounting for circle radius
        const radius = Math.min(width, height) * (0.15 + this.prng.next() * 0.25)
        // Center the circles around the middle 60% of the canvas
        const centerZoneWidth = width * 0.6
        const centerZoneHeight = height * 0.6
        const x = width/2 + (this.prng.next() - 0.5) * (centerZoneWidth - radius * 2)
        const y = height/2 + (this.prng.next() - 0.5) * (centerZoneHeight - radius * 2)

        // Generate a random rotation angle for stripe rotation effect
        const rotationAngles = [-Math.PI / 12, -Math.PI / 8, Math.PI / 12, Math.PI / 8]
        const randomRotation = rotationAngles[Math.floor(this.prng.next() * rotationAngles.length)]

        const newShape = {
          type: 'circle' as const,
          cx: x,
          cy: y,
          r: radius,
          stripeRotation: randomRotation
        }

        // Check for overlap with existing shapes
        let overlaps = false
        for (const existingShape of shapes) {
          if (this.shapesOverlap(newShape, existingShape)) {
            overlaps = true
            break
          }
        }

        if (!overlaps) {
          shapes.push(newShape)
          placed = true
        }

        attempts++
      }

      // If we couldn't place the shape after max attempts, skip it
      if (!placed) {
        console.warn('Could not place circle without overlap, skipping')
      }
    }

    return shapes
  }

  private shapesOverlap(shape1: BlockShape, shape2: BlockShape): boolean {
    if (shape1.type === 'circle' && shape2.type === 'circle') {
      // Circle-circle collision
      const dx = shape1.cx - shape2.cx
      const dy = shape1.cy - shape2.cy
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < (shape1.r + shape2.r)
    } else if (shape1.type === 'rect' && shape2.type === 'rect') {
      // Rectangle-rectangle collision (axis-aligned bounding box)
      return !(shape1.cx + shape1.cw/2 < shape2.cx - shape2.cw/2 ||
               shape1.cx - shape1.cw/2 > shape2.cx + shape2.cw/2 ||
               shape1.cy + shape1.ch/2 < shape2.cy - shape2.ch/2 ||
               shape1.cy - shape1.ch/2 > shape2.cy + shape2.ch/2)
    } else if (shape1.type === 'triangle' && shape2.type === 'triangle') {
      // Triangle-triangle collision (simplified bounding box)
      const bounds1 = this.getTriangleBounds(shape1)
      const bounds2 = this.getTriangleBounds(shape2)
      return !(bounds1.maxX < bounds2.minX || bounds1.minX > bounds2.maxX ||
               bounds1.maxY < bounds2.minY || bounds1.minY > bounds2.maxY)
    } else {
      // Mixed shape types - use bounding circles for simplicity
      const bounds1 = this.getShapeBoundingCircle(shape1)
      const bounds2 = this.getShapeBoundingCircle(shape2)
      const dx = bounds1.cx - bounds2.cx
      const dy = bounds1.cy - bounds2.cy
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < (bounds1.r + bounds2.r)
    }
  }

  private getShapeBoundingCircle(shape: BlockShape): { cx: number, cy: number, r: number } {
    switch (shape.type) {
      case 'circle':
        return { cx: shape.cx, cy: shape.cy, r: shape.r }
      case 'rect':
        return {
          cx: shape.cx,
          cy: shape.cy,
          r: Math.sqrt((shape.cw/2) ** 2 + (shape.ch/2) ** 2)
        }
      case 'triangle':
        const bounds = this.getTriangleBounds(shape)
        const cx = (bounds.minX + bounds.maxX) / 2
        const cy = (bounds.minY + bounds.maxY) / 2
        const r = Math.sqrt((bounds.maxX - bounds.minX) ** 2 + (bounds.maxY - bounds.minY) ** 2) / 2
        return { cx, cy, r }
    }
  }

  private getTriangleBounds(shape: BlockShape & { type: 'triangle' }): { minX: number, maxX: number, minY: number, maxY: number } {
    const { p1, p2, p3 } = shape
    const xs = [p1.x, p2.x, p3.x]
    const ys = [p1.y, p2.y, p3.y]
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    }
  }

  private generateBlockRectangleShapes(width: number, height: number): BlockShape[] {
    // BIG BLOCK RECTANGLES - 3-6 massive rectangles, no finesse
    const count = 3 + Math.floor(this.prng.next() * 4) // 3-6 rectangles
    const shapes: BlockShape[] = []
    const maxAttempts = 50 // Prevent infinite loops

    for (let i = 0; i < count; i++) {
      let attempts = 0
      let placed = false

      while (!placed && attempts < maxAttempts) {
        // MASSIVE size - 15-40% of canvas size
        const rectWidth = width * (0.15 + this.prng.next() * 0.25)
        const rectHeight = height * (0.15 + this.prng.next() * 0.25)

        // Random position centered on canvas, accounting for rectangle size
        const centerZoneWidth = width * 0.6
        const centerZoneHeight = height * 0.6
        const x = width/2 + (this.prng.next() - 0.5) * (centerZoneWidth - rectWidth)
        const y = height/2 + (this.prng.next() - 0.5) * (centerZoneHeight - rectHeight)

        // Small random rotation only
        const rotation = (this.prng.next() - 0.5) * 0.3 // ±0.15 radians

        const newShape = {
          type: 'rect' as const,
          cx: x,
          cy: y,
          cw: rectWidth,
          ch: rectHeight,
          rot: rotation
        }

        // Check for overlap with existing shapes
        let overlaps = false
        for (const existingShape of shapes) {
          if (this.shapesOverlap(newShape, existingShape)) {
            overlaps = true
            break
          }
        }

        if (!overlaps) {
          shapes.push(newShape)
          placed = true
        }

        attempts++
      }

      // If we couldn't place the shape after max attempts, skip it
      if (!placed) {
        console.warn('Could not place rectangle without overlap, skipping')
      }
    }

    return shapes
  }

  private generateBlockTriangleShapes(width: number, height: number): BlockShape[] {
    // BIG BLOCK TRIANGLES - 3-8 massive triangles, no finesse
    const count = 3 + Math.floor(this.prng.next() * 6) // 3-8 triangles
    const shapes: BlockShape[] = []
    const maxAttempts = 50 // Prevent infinite loops

    for (let i = 0; i < count; i++) {
      let attempts = 0
      let placed = false

      while (!placed && attempts < maxAttempts) {
        // MASSIVE size - 15-40% of canvas size
        const size = Math.min(width, height) * (0.15 + this.prng.next() * 0.25)

        // Calculate triangle bounding box
        const h = size * Math.sqrt(3) / 2
        const boundingWidth = size
        const boundingHeight = h

        // Random position centered on canvas, accounting for triangle size
        const centerZoneWidth = width * 0.6
        const centerZoneHeight = height * 0.6
        const x = width/2 + (this.prng.next() - 0.5) * (centerZoneWidth - boundingWidth)
        const y = height/2 + (this.prng.next() - 0.5) * (centerZoneHeight - boundingHeight)

        // Random orientation
        const rotation = this.prng.next() * Math.PI * 2

        // Calculate rotated triangle points
        const cos = Math.cos(rotation)
        const sin = Math.sin(rotation)

        const p1 = {
          x: x + (0) * cos - (-h/2) * sin,
          y: y + (0) * sin + (-h/2) * cos
        }
        const p2 = {
          x: x + (-size/2) * cos - (h/2) * sin,
          y: y + (-size/2) * sin + (h/2) * cos
        }
        const p3 = {
          x: x + (size/2) * cos - (h/2) * sin,
          y: y + (size/2) * sin + (h/2) * cos
        }

        const newShape = {
          type: 'triangle' as const,
          p1,
          p2,
          p3
        }

        // Check for overlap with existing shapes
        let overlaps = false
        for (const existingShape of shapes) {
          if (this.shapesOverlap(newShape, existingShape)) {
            overlaps = true
            break
          }
        }

        if (!overlaps) {
          shapes.push(newShape)
          placed = true
        }

        attempts++
      }

      // If we couldn't place the shape after max attempts, skip it
      if (!placed) {
        console.warn('Could not place triangle without overlap, skipping')
      }
    }

    return shapes
  }

  private generateInterferenceCircles(width: number, height: number): { shapes: BlockShape[], booleanMode: 'intersection' | 'difference' } {
    const shapes: BlockShape[] = []

    // Base radius derived from canvas
    const baseRadius = Math.min(width, height) * 0.25

    // Primary (dominant) circle near canvas center
    const primaryCx = width * 0.5 + (this.prng.next() - 0.5) * width * 0.1
    const primaryCy = height * 0.5 + (this.prng.next() - 0.5) * height * 0.08

    const rotationAngles = [-Math.PI / 12, -Math.PI / 8, Math.PI / 12, Math.PI / 8]
    shapes.push({
      type: 'circle',
      cx: primaryCx,
      cy: primaryCy,
      r: baseRadius,
      stripeRotation: rotationAngles[Math.floor(this.prng.next() * rotationAngles.length)],
      booleanRole: 'primary'
    })

    // Secondary (intruder) circle with overlap
    const secondaryRadius = baseRadius * (0.6 + this.prng.next() * 0.4) // 60-100% of primary radius
    const overlapDistance = (baseRadius + secondaryRadius) * (0.3 + this.prng.next() * 0.4) // 30-70% overlap

    const angle = this.prng.next() * Math.PI * 2
    const secondaryCx = primaryCx + Math.cos(angle) * overlapDistance
    const secondaryCy = primaryCy + Math.sin(angle) * overlapDistance

    shapes.push({
      type: 'circle',
      cx: secondaryCx,
      cy: secondaryCy,
      r: secondaryRadius,
      stripeRotation: rotationAngles[Math.floor(this.prng.next() * rotationAngles.length)],
      booleanRole: 'secondary'
    })

    // Choose boolean mode
    const booleanMode: 'intersection' | 'difference' = this.prng.next() < 0.5 ? 'intersection' : 'difference'

    return { shapes, booleanMode }
  }

  private generateStripeRotationIllusion(width: number, height: number): BlockShape[] {
    const shapes: BlockShape[] = []

    const r = Math.min(width, height) * (0.22 + this.prng.next() * 0.12)

    const cx = width * 0.5 + (this.prng.next() - 0.5) * width * 0.2
    const cy = height * 0.5 + (this.prng.next() - 0.5) * height * 0.2

    // Generate continuous rotation angles for visual richness
    // Base angle range: [π/9, 17π/36] (~20° to 85° for clearly visible diagonal bands)
    // Minimum 20° ensures illusion is obviously intentional, not mistaken for error
    // Maximum ~85° provides dramatic near-vertical diagonal effects
    const minAngle = Math.PI / 9  // ~20°
    const maxAngle = 17 * Math.PI / 36  // ~85°

    // Randomly choose positive or negative direction
    const direction = this.prng.next() < 0.5 ? -1 : 1
    const baseAngle = minAngle + (this.prng.next() * (maxAngle - minAngle))

    // Add small deterministic jitter: ±π/36 (~5°)
    const jitterRange = Math.PI / 36
    const jitter = (this.prng.next() - 0.5) * 2 * jitterRange

    const finalAngle = direction * (baseAngle + jitter)

    shapes.push({
      type: 'circle',
      cx,
      cy,
      r,
      stripeRotation: finalAngle
    })

    return shapes
  }
}

/**
 * Extract color palette from rug data
 */
export function extractRugPalette(rugData: any, p?: any): ColorPalette {
  console.log('🎨 Extracting palette from rugData:', !!rugData, 'palette exists:', !!rugData?.selectedPalette)
  const colors: ColorPalette['colors'] = []

  if (rugData?.selectedPalette?.colors) {
    console.log('🎨 Found selectedPalette with', rugData.selectedPalette.colors.length, 'colors')
    // Extract from palette - supports both hex strings and RGB objects
    rugData.selectedPalette.colors.forEach((color: any, index: number) => {
      console.log('🎨 Color', index, ':', color)
      if (typeof color === 'string') {
        // Handle hex strings by converting to RGB
        const p5Color = p.color(color)
        colors.push({
          r: Math.round(p.red(p5Color)),
          g: Math.round(p.green(p5Color)),
          b: Math.round(p.blue(p5Color))
        })
      } else if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
        // Handle RGB objects
        colors.push({ r: color.r, g: color.g, b: color.b })
      }
    })
  }

  // Only fall back to brown if palette data structure doesn't exist at all
  if (colors.length === 0 && !rugData?.selectedPalette) {
    console.log('🎨 No palette data found, using minimal fallback')
    colors.push({ r: 139, g: 69, b: 19 }) // Saddle brown
    colors.push({ r: 160, g: 82, b: 45 }) // Sienna
  }

  console.log('🎨 Final palette:', colors.length, 'colors')
  return { colors }
}

/**
 * Get evolution strength multiplier for a stripe based on phase and parity
 * @param phase - Evolution phase (0-3)
 * @param stripeIndex - Index of the stripe
 * @returns Strength multiplier (0-1)
 */
export function getEvolutionStrength(phase: number, stripeIndex: number): number {
  if (phase <= 0) return 0
  if (phase === 1) return stripeIndex % 2 === 0 ? 0.4 : 0
  if (phase === 2) return stripeIndex % 2 === 0 ? 0.8 : 0.3
  return 1.0 // Phase 3: full strength
}

/**
 * Create a stripe field based on field type
 * @param fieldType - The type of field to create
 * @returns StripeField instance or null if none
 */
export function createStripeField(fieldType: FieldType): StripeField | null {
  switch (fieldType) {
    case 'stripe_rotation':
      return new StripeRotationField()
    case 'diagonal_drift':
      return new DiagonalDriftField()
    case 'two_stripe_borrow':
      return new TwoStripeBorrowField()
    case 'none':
    default:
      return null
  }
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