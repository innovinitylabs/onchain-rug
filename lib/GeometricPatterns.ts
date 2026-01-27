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
 * Extended engraving mask interface that supports region classification
 */
export interface RegionalEngravingMask extends EngravingMask {
  /**
   * Returns the region name at this coordinate, or null if inactive
   * Used for conditional color/engraving behavior based on regions
   */
  getRegion?(x: number, y: number): string | null
}

/**
 * 2D vector for shape coordinates
 */
type Vec2 = { x: number, y: number }

/**
 * Block shape definitions for engraving masks
 */
type BlockShape =
  | { type: 'circle', cx: number, cy: number, r: number, stripeRotation?: number, booleanRole?: 'primary' | 'secondary', secondaryMode?: 'cut' | 'touch' }
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
    // Special handling for boolean mask types
    if ((this.maskType === 'circle_interference' || this.maskType === 'compass_cut') && this.booleanMode) {
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
   * circle_interference uses primary-minus-secondary only
   */
  private booleanStrength(x: number, y: number): number {
    if (this.maskType === 'compass_cut') {
      const primary = this.shapes.find(
        s => s.type === 'circle' && s.booleanRole === 'primary'
      ) as any
      if (!primary) return 0

      const inPrimary = this.isPointInCircle(x, y, primary.cx, primary.cy, primary.r)
      let inCutSecondary = false
      let touchSecondaryCount = 0

      for (const shape of this.shapes) {
        if (shape.type === 'circle' && shape.booleanRole === 'secondary') {
          if (this.isPointInCircle(x, y, shape.cx, shape.cy, shape.r)) {
            if (shape.secondaryMode === 'touch') {
              touchSecondaryCount++
            } else {
              inCutSecondary = true
            }
          }
        }
      }

      if (inPrimary) {
        return inCutSecondary ? 0 : 1
      }

      const dx = x - primary.cx
      const dy = y - primary.cy
      const distPrimary = Math.sqrt(dx * dx + dy * dy)
      const attachmentBand = Math.max(1, primary.r * 0.09)
      const nearPrimary = distPrimary <= primary.r + attachmentBand

      if (inCutSecondary && nearPrimary) return 1
      if (touchSecondaryCount >= 2 && nearPrimary) return 1
      return 0
    }

    const primary = this.shapes.find(
      s => s.type === 'circle' && s.booleanRole === 'primary'
    ) as any

    const secondary = this.shapes.find(
      s => s.type === 'circle' && s.booleanRole === 'secondary'
    ) as any

    if (!primary || !secondary) return 0

    const inPrimary = this.isPointInCircle(x, y, primary.cx, primary.cy, primary.r)

    const inSecondary = this.isPointInCircle(x, y, secondary.cx, secondary.cy, secondary.r)

    return inPrimary && !inSecondary ? 1 : 0
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

  private isPointInCircle(x: number, y: number, cx: number, cy: number, r: number): boolean {
    const dx = x - cx
    const dy = y - cy
    return dx * dx + dy * dy <= r * r
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
 * Circle partition cut mask - creates a dominant filled circle carved by secondary circles
 * and partitioned by one straight line. Regions are classified as "upper" or "lower".
 */
export class CirclePartitionCutMask implements RegionalEngravingMask {
  private primaryCircle: { cx: number, cy: number, r: number }
  private secondaryCircles: Array<{ cx: number, cy: number, r: number }>
  private partitionLine: { point: Vec2, normal: Vec2 }

  constructor(primaryCircle: { cx: number, cy: number, r: number },
              secondaryCircles: Array<{ cx: number, cy: number, r: number }>,
              partitionLine: { point: Vec2, normal: Vec2 }) {
    this.primaryCircle = primaryCircle
    this.secondaryCircles = secondaryCircles
    this.partitionLine = partitionLine
  }

  isActive(x: number, y: number): boolean {
    return this.strength(x, y) > 0
  }

  strength(x: number, y: number): number {
    // Check if point is inside primary circle
    const dx = x - this.primaryCircle.cx
    const dy = y - this.primaryCircle.cy
    const distPrimary = Math.sqrt(dx * dx + dy * dy)

    if (distPrimary > this.primaryCircle.r) {
      return 0 // Outside primary circle
    }

    // Check if point is inside any secondary circle (these carve out area)
    for (const secondary of this.secondaryCircles) {
      const dxSec = x - secondary.cx
      const dySec = y - secondary.cy
      const distSec = Math.sqrt(dxSec * dxSec + dySec * dySec)
      if (distSec <= secondary.r) {
        return 0 // Inside secondary circle - carved out
      }
    }

    // Point survives all boolean cuts
    return 1
  }

  getRegion(x: number, y: number): string | null {
    if (!this.isActive(x, y)) {
      return null
    }

    // Calculate signed distance to partition line
    const signedDistance = this.signedDistanceToLine(x, y, this.partitionLine.point, this.partitionLine.normal)

    // Classify as upper or lower based on signed distance
    // Positive distance = above line, negative = below line
    return signedDistance >= 0 ? "upper" : "lower"
  }

  /**
   * Calculate signed distance from point to infinite line
   * @param px Point x coordinate
   * @param py Point y coordinate
   * @param linePoint A point on the line
   * @param lineNormal Normalized normal vector of the line
   * @returns Signed distance (positive = above line, negative = below line)
   */
  private signedDistanceToLine(px: number, py: number, linePoint: Vec2, lineNormal: Vec2): number {
    const dx = px - linePoint.x
    const dy = py - linePoint.y
    return dx * lineNormal.x + dy * lineNormal.y
  }
}

/**
 * Circle boolean cut mask - primary circle minus secondary circles, then cut by straight line
 * Implements hard boolean geometry with one dominant primary circle and multiple secondary cut circles
 */
export class CircleBooleanCutMask implements RegionalEngravingMask {
  private primaryCircle: { cx: number, cy: number, r: number }
  private secondaryCircles: Array<{ cx: number, cy: number, r: number }>
  private partitionLine: { point: Vec2, normal: Vec2 }

  constructor(primaryCircle: { cx: number, cy: number, r: number },
              secondaryCircles: Array<{ cx: number, cy: number, r: number }>,
              partitionLine: { point: Vec2, normal: Vec2 }) {
    this.primaryCircle = primaryCircle
    this.secondaryCircles = secondaryCircles
    this.partitionLine = partitionLine
  }

  isActive(x: number, y: number): boolean {
    return this.strength(x, y) > 0
  }

  strength(x: number, y: number): number {
    // First apply circle boolean operation: primary minus all secondary circles
    const inPrimary = this.isPointInCircle(x, y, this.primaryCircle.cx, this.primaryCircle.cy, this.primaryCircle.r)

    if (!inPrimary) {
      return 0 // Outside primary circle
    }

    // Check if point is inside any secondary circle (these carve out area)
    for (const secondary of this.secondaryCircles) {
      if (this.isPointInCircle(x, y, secondary.cx, secondary.cy, secondary.r)) {
        return 0 // Inside secondary circle - carved out
      }
    }

    // Point survived circle boolean operation, now apply straight line constraint
    const signedDistance = this.signedDistanceToLine(x, y, this.partitionLine.point, this.partitionLine.normal)

    // Keep only one side of the line (upper side for consistency)
    return signedDistance >= 0 ? 1 : 0
  }

  getRegion(x: number, y: number): string | null {
    if (!this.isActive(x, y)) {
      return null
    }

    // Calculate signed distance to partition line
    const signedDistance = this.signedDistanceToLine(x, y, this.partitionLine.point, this.partitionLine.normal)

    // Classify as upper or lower based on signed distance
    return signedDistance >= 0 ? "upper" : "lower"
  }

  /**
   * Check if point is inside circle
   */
  private isPointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
    const dx = px - cx
    const dy = py - cy
    return dx * dx + dy * dy <= r * r
  }

  /**
   * Calculate signed distance from point to infinite line
   * @param px Point x coordinate
   * @param py Point y coordinate
   * @param linePoint A point on the line
   * @param lineNormal Normalized normal vector of the line
   * @returns Signed distance (positive = above line, negative = below line)
   */
  private signedDistanceToLine(px: number, py: number, linePoint: Vec2, lineNormal: Vec2): number {
    const dx = px - linePoint.x
    const dy = py - linePoint.y
    return dx * lineNormal.x + dy * lineNormal.y
  }
}

/**
 * Arc partition mask using signed distance fields for non-boolean geometry
 * Each point is assigned to exactly one region based on dominant geometric constraints
 */
export class ArcPartitionMask implements RegionalEngravingMask {
  private primaryCircle: { cx: number, cy: number, r: number }
  private secondaryCircles: Array<{ cx: number, cy: number, r: number }>
  private partitionLine: { point: Vec2, normal: Vec2 }

  constructor(primaryCircle: { cx: number, cy: number, r: number },
              secondaryCircles: Array<{ cx: number, cy: number, r: number }>,
              partitionLine: { point: Vec2, normal: Vec2 }) {
    this.primaryCircle = primaryCircle
    this.secondaryCircles = secondaryCircles
    this.partitionLine = partitionLine
  }

  isActive(x: number, y: number): boolean {
    return this.strength(x, y) > 0
  }

  strength(x: number, y: number): number {
    // Only active inside primary circle
    const dx = x - this.primaryCircle.cx
    const dy = y - this.primaryCircle.cy
    const distPrimary = Math.sqrt(dx * dx + dy * dy)

    return distPrimary <= this.primaryCircle.r ? 1 : 0
  }

  getRegion(x: number, y: number): string | null {
    if (!this.isActive(x, y)) {
      return null
    }

    // Compute signed distances for all constraints
    const distances: Array<{ value: number, regionId: string }> = []

    // Primary circle constraint: d_primary = primary_radius - distance_to_primary_center
    const dx = x - this.primaryCircle.cx
    const dy = y - this.primaryCircle.cy
    const distPrimary = Math.sqrt(dx * dx + dy * dy)
    distances.push({
      value: this.primaryCircle.r - distPrimary,
      regionId: "primary_core"
    })

    // Secondary circle constraints: d_secondary_i = distance_to_secondary_center_i - secondary_radius_i
    this.secondaryCircles.forEach((secondary, index) => {
      const dxSec = x - secondary.cx
      const dySec = y - secondary.cy
      const distSec = Math.sqrt(dxSec * dxSec + dySec * dySec)
      distances.push({
        value: distSec - secondary.r,
        regionId: `secondary_${index}_arc`
      })
    })

    // Line constraint: signed distance to line
    const lineDist = this.signedDistanceToLine(x, y, this.partitionLine.point, this.partitionLine.normal)
    distances.push({
      value: lineDist,
      regionId: lineDist >= 0 ? "line_upper" : "line_lower"
    })

    // Find the constraint with the smallest absolute value (dominant constraint)
    let minAbsValue = Infinity
    let dominantRegion = "primary_core" // fallback

    for (const dist of distances) {
      const absValue = Math.abs(dist.value)
      if (absValue < minAbsValue) {
        minAbsValue = absValue
        dominantRegion = dist.regionId
      }
    }

    return dominantRegion
  }

  /**
   * Calculate signed distance from point to infinite line
   * @param px Point x coordinate
   * @param py Point y coordinate
   * @param linePoint A point on the line
   * @param lineNormal Normalized normal vector of the line
   * @returns Signed distance (positive = above line, negative = below line)
   */
  private signedDistanceToLine(px: number, py: number, linePoint: Vec2, lineNormal: Vec2): number {
    const dx = px - linePoint.x
    const dy = py - linePoint.y
    return dx * lineNormal.x + dy * lineNormal.y
  }
}

/**
 * Arc Dominance Partition Mask
 * Divides space by which geometric boundary is closest using absolute distances
 * Primary circle defines the active region, secondary circles and line create partitions
 */
export class ArcDominancePartitionMask implements RegionalEngravingMask {
  private primaryCircle: { cx: number, cy: number, r: number }
  private secondaryCircles: Array<{ cx: number, cy: number, r: number }>
  private partitionLine: { point: Vec2, normal: Vec2 }

  constructor(primaryCircle: { cx: number, cy: number, r: number },
              secondaryCircles: Array<{ cx: number, cy: number, r: number }>,
              partitionLine: { point: Vec2, normal: Vec2 }) {
    this.primaryCircle = primaryCircle
    this.secondaryCircles = secondaryCircles
    this.partitionLine = partitionLine
  }

  isActive(x: number, y: number): boolean {
    return this.strength(x, y) > 0
  }

  strength(x: number, y: number): number {
    // Only active inside primary circle - this mask NEVER removes pixels from the primary circle
    const dx = x - this.primaryCircle.cx
    const dy = y - this.primaryCircle.cy
    const distPrimary = Math.sqrt(dx * dx + dy * dy)

    return distPrimary <= this.primaryCircle.r ? 1 : 0
  }

  getRegion(x: number, y: number): string | null {
    if (!this.isActive(x, y)) {
      return null
    }

    // Compute absolute distances for all constraints
    const distances: Array<{ value: number, regionId: string }> = []

    // Primary circle constraint: d_primary = abs(distance_to_primary_center - primary_radius)
    const dx = x - this.primaryCircle.cx
    const dy = y - this.primaryCircle.cy
    const distPrimary = Math.sqrt(dx * dx + dy * dy)
    distances.push({
      value: Math.abs(distPrimary - this.primaryCircle.r),
      regionId: "primary_core"
    })

    // Secondary circle constraints: d_secondary_i = abs(distance_to_secondary_center_i - secondary_radius_i)
    this.secondaryCircles.forEach((secondary, index) => {
      const dxSec = x - secondary.cx
      const dySec = y - secondary.cy
      const distSec = Math.sqrt(dxSec * dxSec + dySec * dySec)
      distances.push({
        value: Math.abs(distSec - secondary.r),
        regionId: `secondary_${index}_arc`
      })
    })

    // Line constraint: d_line = abs(signed_distance_to_infinite_line)
    const lineDist = this.signedDistanceToLine(x, y, this.partitionLine.point, this.partitionLine.normal)
    distances.push({
      value: Math.abs(lineDist),
      regionId: lineDist >= 0 ? "line_upper" : "line_lower"
    })

    // Find the constraint with the smallest absolute distance (dominant constraint)
    let minDistance = Infinity
    let dominantRegion = "primary_core" // fallback

    for (const dist of distances) {
      if (dist.value < minDistance) {
        minDistance = dist.value
        dominantRegion = dist.regionId
      }
    }

    return dominantRegion
  }

  /**
   * Calculate signed distance from point to infinite line
   * @param px Point x coordinate
   * @param py Point y coordinate
   * @param linePoint A point on the line
   * @param lineNormal Normalized normal vector of the line
   * @returns Signed distance (positive = above line, negative = below line)
   */
  private signedDistanceToLine(px: number, py: number, linePoint: Vec2, lineNormal: Vec2): number {
    const dx = px - linePoint.x
    const dy = py - linePoint.y
    return dx * lineNormal.x + dy * lineNormal.y
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
    // Only apply diagonal drift if mask is active at this position
    if (!mask || !mask.isActive(x, y)) {
      return baseStripeIndex
    }

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
    // Only apply two-stripe borrow if mask is active at this position
    if (!mask || !mask.isActive(x, y)) {
      return baseStripeIndex
    }

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
 * Arc region field - reacts to region identity from arc partition masks
 * Applies different stripe sampling behaviors based on geometric regions
 */
export class ArcRegionField implements StripeField {
  getSourceStripeIndex(
    x: number,
    y: number,
    baseStripeIndex: number,
    stripeData: any[],
    mask: EngravingMask | null,
    doormatData: any,
    evolutionStrength: number
  ): number {
    // Only apply effects if mask is active at this position
    if (!mask || !mask.isActive(x, y)) {
      return baseStripeIndex
    }

    // Check if mask has region information
    if ('getRegion' in mask) {
      const regionalMask = mask as RegionalEngravingMask
      const regionId = regionalMask.getRegion(x, y)

      if (regionId) {
        // Use region-based effects for regional masks
        return this.applyRegionEffect(regionId, x, y, baseStripeIndex, stripeData, evolutionStrength)
      }
    }

    // Fallback: Use position-based effects for non-regional masks
    return this.applyPositionEffect(x, y, baseStripeIndex, stripeData, evolutionStrength)
  }

  /**
   * Apply region-based effects for masks that provide region information
   */
  private applyRegionEffect(regionId: string, x: number, y: number, baseStripeIndex: number, stripeData: any[], evolutionStrength: number): number {
    // Apply different behaviors based on region identity
    switch (regionId) {
      case 'primary_core':
        // Primary core: keep base stripes but with subtle evolution
        if (evolutionStrength >= 0.3) {
          // Slight rotation effect for primary core
          const rotationOffset = Math.floor((x + y) * 0.01 * evolutionStrength)
          return (baseStripeIndex + rotationOffset) % stripeData.length
        }
        return baseStripeIndex

      case 'line_upper':
      case 'line_lower':
        // Line regions: borrow from adjacent stripes with evolution scaling
        if (evolutionStrength >= 0.2) {
          const direction = regionId === 'line_upper' ? 1 : -1
          const offset = Math.floor(evolutionStrength * 2) * direction
          const newIndex = baseStripeIndex + offset
          // Clamp to valid range
          return Math.max(0, Math.min(newIndex, stripeData.length - 1))
        }
        return baseStripeIndex

      case 'upper':
        // Upper region from circle partitions: upward borrowing
        if (evolutionStrength >= 0.15) {
          const offset = Math.floor(evolutionStrength * 3)
          const newIndex = baseStripeIndex - offset
          return Math.max(0, newIndex)
        }
        return baseStripeIndex

      case 'lower':
        // Lower region from circle partitions: downward borrowing
        if (evolutionStrength >= 0.15) {
          const offset = Math.floor(evolutionStrength * 3)
          const newIndex = baseStripeIndex + offset
          return Math.min(newIndex, stripeData.length - 1)
        }
        return baseStripeIndex

      default:
        // Generic region handling for any unknown region types
        // Use region name as seed for deterministic effects
        const regionHash = this.hashString(regionId)
        const effectType = regionHash % 4 // 4 different effect types

        if (evolutionStrength >= 0.1) {
          switch (effectType) {
            case 0: // Rotation effect
              const rotationDirection = (regionHash % 2) === 0 ? 1 : -1
              const rotationMagnitude = Math.floor(evolutionStrength * ((regionHash % 3) + 2))
              const rotatedIndex = baseStripeIndex + (rotationDirection * rotationMagnitude)
              return ((rotatedIndex % stripeData.length) + stripeData.length) % stripeData.length

            case 1: // Borrowing effect toward higher indices
              const borrowUp = Math.floor(evolutionStrength * ((regionHash % 2) + 2))
              return Math.min(baseStripeIndex + borrowUp, stripeData.length - 1)

            case 2: // Borrowing effect toward lower indices
              const borrowDown = Math.floor(evolutionStrength * ((regionHash % 2) + 2))
              return Math.max(baseStripeIndex - borrowDown, 0)

            case 3: // Position-based modulation
              const positionMod = Math.floor((x + y) * 0.01 * evolutionStrength * (regionHash % 3))
              return (baseStripeIndex + positionMod) % stripeData.length
          }
        }
        return baseStripeIndex
    }
  }

  /**
   * Apply position-based effects for non-regional masks
   */
  private applyPositionEffect(x: number, y: number, baseStripeIndex: number, stripeData: any[], evolutionStrength: number): number {
    // Use position to create deterministic effects for non-regional masks
    const positionHash = this.hashString(`${Math.floor(x / 50)}_${Math.floor(y / 50)}`)
    const effectType = positionHash % 3

    if (evolutionStrength >= 0.1) {
      switch (effectType) {
        case 0: // Position-based rotation
          const rotationOffset = Math.floor((x + y) * 0.01 * evolutionStrength)
          return (baseStripeIndex + rotationOffset) % stripeData.length

        case 1: // Radial borrowing effect
          const radialDistance = Math.sqrt(x * x + y * y)
          const direction = radialDistance > 500 ? 1 : -1
          const offset = Math.floor(evolutionStrength * 3 * direction)
          const newIndex = baseStripeIndex + offset
          return Math.max(0, Math.min(newIndex, stripeData.length - 1))

        case 2: // Quadrant-based effect
          const quadrant = (x > 400 ? 2 : 0) + (y > 600 ? 1 : 0)
          const quadrantOffset = Math.floor(evolutionStrength * 4)
          return (baseStripeIndex + quadrantOffset) % stripeData.length
      }
    }

    return baseStripeIndex
  }

  /**
   * Generate a simple hash from string for deterministic effects
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
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

  // Punk pixels override everything - check first
  if (params.x !== undefined && params.y !== undefined && params.doormatData) {
    const punkPixel = samplePunkPixel(params.x, params.y, params.doormatData)
    if (punkPixel) {
      return p.color(punkPixel.r, punkPixel.g, punkPixel.b)
    }
  }

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
 * Cryptopunk engraving resolver - uses actual punk pixel colors
 * Creates vibrant, pixel-perfect punk engravings on the rug base
 */
// Cache for loaded punk data to avoid re-parsing
const punkDataCache: { [key: number]: ({r: number, g: number, b: number} | null)[][] | null } = {}

/**
 * Parse Cryptopunk SVG into 24x24 pixel color array
 */
async function parsePunkSvg(svgString: string): Promise<({r: number, g: number, b: number} | null)[][]> {
  const pixels = Array(24).fill(null).map(() => Array(24).fill(null));

  try {
    // Create an offscreen canvas to rasterize the SVG
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      return pixels;
    }

    // Create a blob URL for the SVG
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create an image element to load the SVG
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      img.onload = () => {
        // Draw the SVG to the canvas at 24x24
        ctx.drawImage(img, 0, 0, 24, 24);

        // Read the pixel data
        const imageData = ctx.getImageData(0, 0, 24, 24);
        const data = imageData.data;

        let coloredPixels = 0;
        for (let y = 0; y < 24; y++) {
          for (let x = 0; x < 24; x++) {
            const index = (y * 24 + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            // Only consider pixels that are not transparent (keep all colors including black)
            if (a > 128) {
              pixels[y][x] = { r, g, b };
              coloredPixels++;
            }
          }
        }

        // Clean up
        URL.revokeObjectURL(svgUrl);

        console.log(`Parsed ${coloredPixels} colored pixels for punk`);
        resolve(pixels);
      };

      img.onerror = () => {
        console.error('Failed to load SVG image');
        URL.revokeObjectURL(svgUrl);
        resolve(pixels);
      };

      img.src = svgUrl;
    });

  } catch (error) {
    console.error('Failed to parse punk SVG:', error);
    return pixels;
  }
}

// Punk data stored in individual JSON files
const PUNK_SIZE = 24; // Each punk is 24x24 pixels
const PUNKS_PER_FILE = 25; // 25 punks per JSON file
const MAX_PUNKS = 10000; // Total punks available

// Punk engraving rendering constants
const PUNK_RENDER_SIZE = 240; // 10x scale of 24px punk
const PUNK_PIXEL_SCALE = PUNK_RENDER_SIZE / 24;

// Generate file path for a given punk ID
function getPunkFilePath(punkId: number): string {
  const batchIndex = Math.floor(punkId / PUNKS_PER_FILE);
  return `/data/cryptopunks/punks-${String(batchIndex).padStart(3, '0')}.json`;
}

/**
 * Load punk data from individual JSON files
 */
async function loadPunkDataFromJson(punkId: number): Promise<({r: number, g: number, b: number} | null)[][] | null> {
  try {
    const filePath = getPunkFilePath(punkId);
    const response = await fetch(filePath);

    if (!response.ok) {
      console.warn(`Punk file ${filePath} not found`);
      return null;
    }

    const data = await response.json();

    // Use ID lookup - data structure has id fields
    const punkData = data.find((p: any) => p.id === punkId);

    if (!punkData) {
      console.warn(`Punk ${punkId} not found in ${filePath}`);
      return null;
    }

    const pixelData = await parsePunkSvg(punkData.svg);
    return pixelData;

  } catch (error) {
    console.error(`Failed to load punk ${punkId}:`, error);
    return null;
  }
}

/**
 * Load punk data from JSON files
 */
export async function loadPunkData(punkId: number): Promise<({r: number, g: number, b: number} | null)[][] | null> {
  // Check cache first
  if (punkDataCache[punkId] !== undefined) {
    return punkDataCache[punkId];
  }

  try {
    const pixelData = await loadPunkDataFromJson(punkId);

    // Cache the result (including null to prevent re-attempts)
    punkDataCache[punkId] = pixelData;

    if (pixelData) {
      console.log(`✅ Loaded punk ${punkId} from JSON (${pixelData.flat().filter(p => p !== null).length} colored pixels)`);
    } else {
      console.warn(`❌ Failed to load punk ${punkId} from JSON`);
    }

    return pixelData;

  } catch (error) {
    console.error(`Failed to load punk ${punkId}:`, error);
    punkDataCache[punkId] = null;
    return null;
  }
}

/**
 * Preload punk data for a specific punk ID
 */
export async function preloadPunkData(punkId: number): Promise<boolean> {
  if (punkDataCache[punkId] !== undefined) {
    return punkDataCache[punkId] !== null;
  }

  const data = await loadPunkData(punkId);
  return data !== null;
}

/**
 * Get punk pixel color at canvas position
 * Returns actual RGB values from Cryptopunk SVG data
 */
/**
 * Get punk origin coordinates for engraving
 */
function getPunkOrigin(): { x: number; y: number } {
  const canvasWidth = (window as any).doormatData?.config?.DOORMAT_WIDTH || 800;
  const canvasHeight = (window as any).doormatData?.config?.DOORMAT_HEIGHT || 1200;

  const punkOriginX = Math.floor((canvasWidth - PUNK_RENDER_SIZE) / 2);
  const punkOriginY = Math.floor((canvasHeight - PUNK_RENDER_SIZE) / 2);

  return { x: punkOriginX, y: punkOriginY };
}

/**
 * Map rug coordinates to punk pixel coordinates with proper scaling
 */
export function getMappedPunkPixel(
  rugX: number,
  rugY: number,
  punkPixels: ({ r: number; g: number; b: number } | null)[][]
): { r: number; g: number; b: number } | null {
  const { x: punkOriginX, y: punkOriginY } = getPunkOrigin();

  // Check if we're within the punk engraving bounding box
  if (
    rugX < punkOriginX ||
    rugX >= punkOriginX + PUNK_RENDER_SIZE ||
    rugY < punkOriginY ||
    rugY >= punkOriginY + PUNK_RENDER_SIZE
  ) {
    return null; // Outside punk engraving area
  }

  // Convert to local coordinates within the engraving box
  const localX = rugX - punkOriginX;
  const localY = rugY - punkOriginY;

  // Map to 24x24 punk pixel coordinates with scaling
  const punkX = Math.floor(localX / PUNK_PIXEL_SCALE);
  const punkY = Math.floor(localY / PUNK_PIXEL_SCALE);

  // Bounds check for punk pixel coordinates
  if (punkX < 0 || punkX >= 24 || punkY < 0 || punkY >= 24) {
    return null;
  }

  // Return the punk pixel color (with 90-degree clockwise rotation for correct orientation)
  const rotatedPixelX = 23 - punkY;
  const rotatedPixelY = punkX;

  const result = punkPixels[rotatedPixelY][rotatedPixelX];

  // Debug: occasionally log mapping details
  if (Math.random() < 0.0001) { // 0.01% of the time
    console.log(`🗺️ Rug (${rugX}, ${rugY}) → Local (${localX}, ${localY}) → Punk (${punkX}, ${punkY}) → Rotated (${rotatedPixelX}, ${rotatedPixelY}) → Color:`, result)
  }

  return result;
}

/**
 * Legacy function for backward compatibility - DO NOT USE for new punk engraving
 * @deprecated Use getMappedPunkPixel with preloaded punk data instead
 */
export function getPunkPixelColorAtPosition(x: number, y: number, punkId: number): {r: number, g: number, b: number} | null {
  // Check if punk data is cached
  const punkPixelData = punkDataCache[punkId];
  if (punkPixelData === undefined) {
    return null; // Punk not loaded yet
  }
  if (punkPixelData === null) {
    return null; // Punk not available
  }

  return getMappedPunkPixel(x, y, punkPixelData);
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
  | 'compass_cut'
  | 'circle_partition_cut'
  | 'circle_boolean_cut'
  | 'arc_partition'
  | 'arc_dominance_partition'
  | 'rug_area'
  | 'crypto_punk'

/**
 * Field types define how stripe sampling behaves inside masks
 */
export type FieldType =
  | 'none'
  | 'stripe_rotation'
  | 'diagonal_drift'
  | 'two_stripe_borrow'
  | 'arc_region_field'

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
      case 'compass_cut': {
        const shapes = this.generateCompassCutCircles(canvasWidth, canvasHeight)
        return new BlockPatternMask(shapes, undefined, 'compass_cut', 'difference')
      }
      case 'circle_partition_cut': {
        return this.generateCirclePartitionCutShapes(canvasWidth, canvasHeight)
      }
      case 'circle_boolean_cut': {
        return this.generateCircleBooleanCutShapes(canvasWidth, canvasHeight)
      }
      case 'arc_partition': {
        return this.generateArcPartitionShapes(canvasWidth, canvasHeight)
      }
      case 'arc_dominance_partition': {
        return this.generateArcDominancePartitionShapes(canvasWidth, canvasHeight)
      }
      case 'rug_area': {
        return this.generateRugAreaMask(canvasWidth, canvasHeight)
      }
      case 'none':
      default:
        // Empty mask for 'none' type
        console.log('🎨 Creating empty mask')
        return new BlockPatternMask([])
    }
  }

  private generateRugAreaMask(canvasWidth: number, canvasHeight: number): EngravingMask {
    // Create a rectangular mask covering the main rug area (excluding fringe and background)
    // Based on rug-algo.js: canvas has 55px margins, rug has 2*f fringe area
    // Canvas: (R+110, F+110), Rug positioned with translate(2*f, 2*f)

    // Assuming typical frame width of 8 (wt = 8 from rug-algo.js)
    const frameWidth = 8
    const canvasMargin = 55
    const fringeMargin = 2 * frameWidth

    // Total margin from canvas edge to rug content: canvasMargin + fringeMargin
    const totalMargin = canvasMargin + fringeMargin

    // The main rug area rectangle (excluding margins on all sides)
    const rugArea = {
      x: totalMargin,
      y: totalMargin,
      width: canvasWidth - 2 * totalMargin,
      height: canvasHeight - 2 * totalMargin
    }

    console.log('🎨 Rug area mask:', rugArea)

    // Create a simple rectangular shape covering the main rug area
    const shapes: BlockShape[] = [{
      type: 'rect' as const,
      cx: rugArea.x + rugArea.width / 2,  // center x
      cy: rugArea.y + rugArea.height / 2, // center y
      cw: rugArea.width,                   // width
      ch: rugArea.height,                  // height
      rot: 0                               // no rotation
    }]

    return new BlockPatternMask(shapes, undefined, 'rug_area')
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

    // circle_interference uses primary-minus-secondary only
    return { shapes, booleanMode: 'difference' }
  }

  private generateCompassCutCircles(width: number, height: number): BlockShape[] {
    const shapes: BlockShape[] = []

    const baseRadius = Math.min(width, height) * (0.28 + this.prng.next() * 0.05)

    const cx = width * 0.5
    const cy = height * 0.5

    // Primary circle (kept)
    shapes.push({
      type: 'circle',
      cx,
      cy,
      r: baseRadius,
      booleanRole: 'primary'
    })

    // Primary retention target (adjustable)
    const primaryRetentionBase = 0.42
    const primaryRetentionJitter = 0.06
    const primaryRetentionRaw = primaryRetentionBase + (this.prng.next() - 0.5) * primaryRetentionJitter
    const primaryRetention = Math.max(0.4, Math.min(0.55, primaryRetentionRaw))
    const maxCutArea = (1 - primaryRetention) * Math.PI * baseRadius * baseRadius

    // Total circles in composition: 5-6 (1 primary + 4-5 secondary)
    const secondaryCount = 4 + Math.floor(this.prng.next() * 2)
    const cutCount = Math.min(secondaryCount, 2 + Math.floor(this.prng.next() * 2))
    const touchCount = secondaryCount - cutCount
    const baseAngle = this.prng.next() * Math.PI * 2
    const cutAngleSpread = Math.PI / 3
    const touchAngleSpread = Math.PI / 2

    const mainCutRadius = baseRadius * (0.95 + this.prng.next() * 0.15)
    const mainAngle = baseAngle
    const mainCutShare = 0.8
    const mainOverlapTarget = Math.min(0.65, (maxCutArea * mainCutShare) / (Math.PI * mainCutRadius * mainCutRadius))
    const mainDistance = this.distanceForOverlapRatio(baseRadius, mainCutRadius, Math.max(0.3, mainOverlapTarget))
    const mainOverlapArea = this.circleIntersectionArea(baseRadius, mainCutRadius, mainDistance)
    let remainingCutArea = Math.max(0, maxCutArea - mainOverlapArea)

    const secondaryConfigs: Array<{ radius: number; angle: number }> = []
    let sumSecondaryArea = 0

    // Remaining cut secondaries
    for (let i = 1; i < cutCount; i++) {
      const radiusScale = 0.6 + this.prng.next() * 0.3 // equal or lesser dimension
      const cutRadius = baseRadius * radiusScale
      const angleJitter = (this.prng.next() - 0.5) * cutAngleSpread
      const angle = mainAngle + angleJitter

      secondaryConfigs.push({ radius: cutRadius, angle })
      sumSecondaryArea += Math.PI * cutRadius * cutRadius
    }

    // Maintain equal cut/expose area by targeting a 0.5 overlap ratio
    const overlapRatioBase = 0.5
    const overlapRatioJitter = 0.05
    const overlapRatioRaw = overlapRatioBase + (this.prng.next() - 0.5) * overlapRatioJitter
    const overlapRatioTarget = Math.max(0.42, Math.min(0.56, overlapRatioRaw))
    const overlapRatioLimit = sumSecondaryArea > 0 ? remainingCutArea / sumSecondaryArea : overlapRatioTarget
    const overlapRatio = Math.max(0.2, Math.min(overlapRatioTarget, overlapRatioLimit))

    // Add main cut circle first for a crescent-like primary arc
    shapes.push({
      type: 'circle',
      cx: cx + Math.cos(mainAngle) * mainDistance,
      cy: cy + Math.sin(mainAngle) * mainDistance,
      r: mainCutRadius,
      booleanRole: 'secondary',
      secondaryMode: 'cut'
    })

    for (const config of secondaryConfigs) {
      const cutDistance = this.distanceForOverlapRatio(baseRadius, config.radius, overlapRatio)
      shapes.push({
        type: 'circle',
        cx: cx + Math.cos(config.angle) * cutDistance,
        cy: cy + Math.sin(config.angle) * cutDistance,
        r: config.radius,
        booleanRole: 'secondary',
        secondaryMode: 'cut'
      })
    }

    // Touching circles (no cut) used for lens gaps between circles
    const touchClusterAngle = baseAngle + Math.PI + (this.prng.next() - 0.5) * 0.35
    for (let i = 0; i < touchCount; i++) {
      const radiusScale = 0.55 + this.prng.next() * 0.3
      const touchRadius = baseRadius * radiusScale
      const angleJitter = (this.prng.next() - 0.5) * touchAngleSpread
      const angle = touchClusterAngle + (i - (touchCount - 1) / 2) * (Math.PI / 8) + angleJitter
      const touchOverlap = Math.min(touchRadius, baseRadius) * 0.01
      const touchDistance = baseRadius + touchRadius - touchOverlap

      shapes.push({
        type: 'circle',
        cx: cx + Math.cos(angle) * touchDistance,
        cy: cy + Math.sin(angle) * touchDistance,
        r: touchRadius,
        booleanRole: 'secondary',
        secondaryMode: 'touch'
      })
    }

    return shapes
  }

  private generateCirclePartitionCutShapes(width: number, height: number): CirclePartitionCutMask {
    // Generate ONE primary circle (cx, cy, r) - defines maximum drawable area
    const primaryRadius = Math.min(width, height) * (0.25 + this.prng.next() * 0.15)
    const primaryCx = width * 0.5 + (this.prng.next() - 0.5) * width * 0.1  // Slight centering jitter
    const primaryCy = height * 0.5 + (this.prng.next() - 0.5) * height * 0.1

    const primaryCircle = {
      cx: primaryCx,
      cy: primaryCy,
      r: primaryRadius
    }

    // Generate 3–6 secondary circles placed around or overlapping the primary circle
    const secondaryCount = 3 + Math.floor(this.prng.next() * 4) // 3-6 circles
    const secondaryCircles: Array<{ cx: number, cy: number, r: number }> = []

    for (let i = 0; i < secondaryCount; i++) {
      // Secondary circles should be smaller than primary and can overlap
      const secondaryRadius = primaryRadius * (0.2 + this.prng.next() * 0.4) // 20-60% of primary radius

      // Place around the primary circle with some overlap potential
      const angle = (i / secondaryCount) * Math.PI * 2 + (this.prng.next() - 0.5) * Math.PI * 0.5
      const distance = primaryRadius * (0.3 + this.prng.next() * 0.8) // 30-110% of primary radius for overlap

      const secondaryCx = primaryCx + Math.cos(angle) * distance
      const secondaryCy = primaryCy + Math.sin(angle) * distance

      // Add slight jitter to placement
      const jitterAmount = primaryRadius * 0.1
      const jitteredCx = secondaryCx + (this.prng.next() - 0.5) * jitterAmount
      const jitteredCy = secondaryCy + (this.prng.next() - 0.5) * jitterAmount

      secondaryCircles.push({
        cx: jitteredCx,
        cy: jitteredCy,
        r: secondaryRadius
      })
    }

    // Generate ONE straight infinite line (defined by point + normal)
    // The line should be independent of circle geometry
    // Place a random point on the canvas and create a random normal vector
    const linePoint: Vec2 = {
      x: width * (0.2 + this.prng.next() * 0.6),   // 20-80% across canvas
      y: height * (0.2 + this.prng.next() * 0.6)   // 20-80% down canvas
    }

    // Random normal vector (direction perpendicular to line)
    const lineAngle = this.prng.next() * Math.PI * 2
    const lineNormal: Vec2 = {
      x: Math.cos(lineAngle),
      y: Math.sin(lineAngle)
    }

    const partitionLine = {
      point: linePoint,
      normal: lineNormal
    }

    // Ensure at least one secondary circle intersects the straight line to create asymmetric regions
    // (This happens naturally due to random placement, but we could add logic to guarantee it)

    return new CirclePartitionCutMask(primaryCircle, secondaryCircles, partitionLine)
  }

  private generateCircleBooleanCutShapes(width: number, height: number): CircleBooleanCutMask {
    // Generate ONE primary circle - dominant circle
    // Radius = 28%–35% of min(canvasWidth, canvasHeight)
    const minDim = Math.min(width, height)
    const primaryRadius = minDim * (0.28 + this.prng.next() * 0.07)

    // Center near canvas center (±8% jitter)
    const primaryCx = width * 0.5 + (this.prng.next() - 0.5) * width * 0.08
    const primaryCy = height * 0.5 + (this.prng.next() - 0.5) * height * 0.08

    const primaryCircle = {
      cx: primaryCx,
      cy: primaryCy,
      r: primaryRadius
    }

    // Generate 2–4 secondary circles
    const secondaryCount = 2 + Math.floor(this.prng.next() * 3) // 2-4 circles
    const secondaryCircles: Array<{ cx: number, cy: number, r: number }> = []

    for (let i = 0; i < secondaryCount; i++) {
      // Secondary radius = 40%–75% of primary radius
      const secondaryRadius = primaryRadius * (0.4 + this.prng.next() * 0.35)

      // Placement rule: center MUST be outside OR near the edge of primary
      // Distance from primary center must be in range [primary.r * 0.7, primary.r * 1.2]
      // This guarantees partial intersection, never full containment
      const minDistance = primaryRadius * 0.7
      const maxDistance = primaryRadius * 1.2
      const distance = minDistance + this.prng.next() * (maxDistance - minDistance)

      // Random angle for placement
      const angle = this.prng.next() * Math.PI * 2

      const secondaryCx = primaryCx + Math.cos(angle) * distance
      const secondaryCy = primaryCy + Math.sin(angle) * distance

      secondaryCircles.push({
        cx: secondaryCx,
        cy: secondaryCy,
        r: secondaryRadius
      })
    }

    // Generate ONE straight infinite line constraint
    // Angle randomized but biased to near-horizontal or near-vertical
    const angleBias = Math.floor(this.prng.next() * 4) // 0,1,2,3 for four quadrants
    const baseAngles = [0, Math.PI/2, Math.PI, 3*Math.PI/2] // horizontal, vertical
    const angleJitter = (this.prng.next() - 0.5) * Math.PI * 0.3 // ±15° jitter
    const lineAngle = baseAngles[angleBias] + angleJitter

    // Place line point near canvas center with some jitter
    const linePoint: Vec2 = {
      x: width * (0.4 + this.prng.next() * 0.2),   // 40-60% across canvas
      y: height * (0.4 + this.prng.next() * 0.2)   // 40-60% down canvas
    }

    // Normal vector (direction perpendicular to line)
    const lineNormal: Vec2 = {
      x: Math.cos(lineAngle),
      y: Math.sin(lineAngle)
    }

    const partitionLine = {
      point: linePoint,
      normal: lineNormal
    }

    return new CircleBooleanCutMask(primaryCircle, secondaryCircles, partitionLine)
  }

  private circleIntersectionArea(r1: number, r2: number, d: number): number {
    if (d >= r1 + r2) return 0
    if (d <= Math.abs(r1 - r2)) {
      const rMin = Math.min(r1, r2)
      return Math.PI * rMin * rMin
    }

    const r1Sq = r1 * r1
    const r2Sq = r2 * r2
    const dSq = d * d

    const alpha = Math.acos((dSq + r1Sq - r2Sq) / (2 * d * r1))
    const beta = Math.acos((dSq + r2Sq - r1Sq) / (2 * d * r2))

    const term =
      (-d + r1 + r2) *
      (d + r1 - r2) *
      (d - r1 + r2) *
      (d + r1 + r2)

    return r1Sq * alpha + r2Sq * beta - 0.5 * Math.sqrt(Math.max(0, term))
  }

  private distanceForOverlapRatio(rPrimary: number, rSecondary: number, overlapRatio: number): number {
    const clampedRatio = Math.max(0.15, Math.min(0.85, overlapRatio))
    const targetArea = clampedRatio * Math.PI * rSecondary * rSecondary

    const minD = Math.abs(rPrimary - rSecondary) + 1e-4
    const maxD = rPrimary + rSecondary - 1e-4

    let low = minD
    let high = maxD

    for (let i = 0; i < 30; i++) {
      const mid = (low + high) * 0.5
      const area = this.circleIntersectionArea(rPrimary, rSecondary, mid)
      if (area > targetArea) {
        low = mid
      } else {
        high = mid
      }
    }

    return (low + high) * 0.5
  }

  private generateArcPartitionShapes(width: number, height: number): ArcPartitionMask {
    // Generate ONE primary circle (cx, cy, r) - defines maximum drawable area
    const primaryRadius = Math.min(width, height) * (0.25 + this.prng.next() * 0.15)
    const primaryCx = width * 0.5 + (this.prng.next() - 0.5) * width * 0.1  // Slight centering jitter
    const primaryCy = height * 0.5 + (this.prng.next() - 0.5) * height * 0.1

    const primaryCircle = {
      cx: primaryCx,
      cy: primaryCy,
      r: primaryRadius
    }

    // Generate 3–6 secondary circles placed radially around primary circle
    const secondaryCount = 3 + Math.floor(this.prng.next() * 4) // 3-6 circles
    const secondaryCircles: Array<{ cx: number, cy: number, r: number }> = []

    for (let i = 0; i < secondaryCount; i++) {
      // Secondary circles should be smaller than primary and overlap primary
      const secondaryRadius = primaryRadius * (0.2 + this.prng.next() * 0.4) // 20-60% of primary radius

      // Place radially around primary circle, overlapping it
      const angle = (i / secondaryCount) * Math.PI * 2 + (this.prng.next() - 0.5) * Math.PI * 0.5
      const distance = primaryRadius * (0.3 + this.prng.next() * 0.8) // 30-110% of primary radius for overlap

      const secondaryCx = primaryCx + Math.cos(angle) * distance
      const secondaryCy = primaryCy + Math.sin(angle) * distance

      // Add slight jitter to placement
      const jitterAmount = primaryRadius * 0.1
      const jitteredCx = secondaryCx + (this.prng.next() - 0.5) * jitterAmount
      const jitteredCy = secondaryCy + (this.prng.next() - 0.5) * jitterAmount

      secondaryCircles.push({
        cx: jitteredCx,
        cy: jitteredCy,
        r: secondaryRadius
      })
    }

    // Generate ONE infinite straight line with random angle and slight offset
    const linePoint: Vec2 = {
      x: width * (0.2 + this.prng.next() * 0.6),   // 20-80% across canvas
      y: height * (0.2 + this.prng.next() * 0.6)   // 20-80% down canvas
    }

    // Random normal vector (direction perpendicular to line)
    const lineAngle = this.prng.next() * Math.PI * 2
    const lineNormal: Vec2 = {
      x: Math.cos(lineAngle),
      y: Math.sin(lineAngle)
    }

    const partitionLine = {
      point: linePoint,
      normal: lineNormal
    }

    return new ArcPartitionMask(primaryCircle, secondaryCircles, partitionLine)
  }

  private generateArcDominancePartitionShapes(width: number, height: number): ArcDominancePartitionMask {
    // Generate ONE primary circle (cx, cy, r) - defines maximum drawable area
    const primaryRadius = Math.min(width, height) * (0.25 + this.prng.next() * 0.15)
    const primaryCx = width * 0.5 + (this.prng.next() - 0.5) * width * 0.1  // Slight centering jitter
    const primaryCy = height * 0.5 + (this.prng.next() - 0.5) * height * 0.1

    const primaryCircle = {
      cx: primaryCx,
      cy: primaryCy,
      r: primaryRadius
    }

    // Generate 2–4 secondary circles that intersect with primary circle boundary
    const secondaryCount = 2 + Math.floor(this.prng.next() * 3) // 2-4 circles
    const secondaryCircles: Array<{ cx: number, cy: number, r: number }> = []

    for (let i = 0; i < secondaryCount; i++) {
      // Secondary radius = 20%–50% of primary radius (smaller than original to create tighter arcs)
      const secondaryRadius = primaryRadius * (0.2 + this.prng.next() * 0.3)

      // Placement rule: center positioned so circles intersect primary boundary
      // Distance from primary center must guarantee intersection: [primary.r - secondary.r, primary.r + secondary.r]
      const minDistance = Math.abs(primaryRadius - secondaryRadius) + secondaryRadius * 0.1 // slight overlap
      const maxDistance = primaryRadius + secondaryRadius * 0.8 // partial containment
      const distance = minDistance + this.prng.next() * (maxDistance - minDistance)

      // Random angle for placement
      const angle = (i / secondaryCount) * Math.PI * 2 + (this.prng.next() - 0.5) * Math.PI * 0.5

      const secondaryCx = primaryCx + Math.cos(angle) * distance
      const secondaryCy = primaryCy + Math.sin(angle) * distance

      secondaryCircles.push({
        cx: secondaryCx,
        cy: secondaryCy,
        r: secondaryRadius
      })
    }

    // Generate ONE infinite straight line crossing through the primary circle
    // Angle randomized but biased to create interesting intersections
    const angleBias = Math.floor(this.prng.next() * 4) // 0,1,2,3 for four quadrants
    const baseAngles = [0, Math.PI/2, Math.PI, 3*Math.PI/2] // horizontal, vertical
    const angleJitter = (this.prng.next() - 0.5) * Math.PI * 0.4 // ±20° jitter
    const lineAngle = baseAngles[angleBias] + angleJitter

    // Place line point near primary circle center with some jitter
    const linePoint: Vec2 = {
      x: primaryCx + (this.prng.next() - 0.5) * primaryRadius * 0.5,
      y: primaryCy + (this.prng.next() - 0.5) * primaryRadius * 0.5
    }

    // Normal vector (direction perpendicular to line)
    const lineNormal: Vec2 = {
      x: Math.cos(lineAngle),
      y: Math.sin(lineAngle)
    }

    const partitionLine = {
      point: linePoint,
      normal: lineNormal
    }

    return new ArcDominancePartitionMask(primaryCircle, secondaryCircles, partitionLine)
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


  /**
   * Fetch punk SVG from CryptoPunksData contract (for development/testing)
   * Note: This requires a real RPC endpoint with API key for production use
   */
  async fetchPunkSvg(punkId: number): Promise<string> {
    try {
      // For demo purposes, return a simple SVG. In production, you'd use:
      // const response = await fetch('https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY', { ... })

      console.log(`🎨 Fetching punk ${punkId} SVG...`);

      // For now, return empty string. Load real SVGs from files instead
      return '';

      /* Production code would be:
      const response = await fetch('https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: '0x16f5a35647d6f03d5d3da7b35409d65ba03af3b2', // CryptoPunksData
            data: `0xc87b56dd${punkId.toString(16).padStart(64, '0')}` // punkImageSvg(uint16)
          }, 'latest'],
          id: 1
        })
      });

      const result = await response.json();
      const svgData = result.result;

      // Decode the returned bytes to string
      let svg = '';
      for (let i = 2; i < svgData.length; i += 2) {
        svg += String.fromCharCode(parseInt(svgData.substr(i, 2), 16));
      }
      return svg;
      */
    } catch (error) {
      console.warn(`Failed to fetch punk ${punkId}:`, error);
      return ''; // No fallback - use loadPunksFromFiles instead
    }
  }



  /**
   * Batch load real Cryptopunk SVGs (use with caution - rate limited)
   */
  async loadRealPunks(punkIds: number[], rpcUrl?: string) {
    console.log('🎨 Loading real Cryptopunk SVGs from blockchain...');

    for (const punkId of punkIds) {
      try {
        const svg = await this.fetchRealPunkSvg(punkId, rpcUrl);
        if (svg) {
          // this.loadPunkSvg(punkId, svg); // Removed - using hardcoded data now
          console.log(`✅ Loaded real punk ${punkId}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to load real punk ${punkId}:`, error);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  /**
   * Fetch real punk SVG from CryptoPunksData contract
   */
  private async fetchRealPunkSvg(punkId: number, rpcUrl?: string): Promise<string> {
    const endpoint = rpcUrl || 'https://eth-mainnet.g.alchemy.com/v2/demo';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: '0x16f5a35647d6f03d5d3da7b35409d65ba03af3b2', // CryptoPunksData
            data: `0xc87b56dd${punkId.toString(16).padStart(64, '0')}` // punkImageSvg(uint16)
          }, 'latest'],
          id: 1
        })
      });

      const result = await response.json();
      const svgData = result.result;

      // The result is already a string (SVG), not hex-encoded bytes for this function
      return svgData;
    } catch (error) {
      console.warn(`Failed to fetch real punk ${punkId}:`, error);
      return '';
    }
  }

  /**
   * Load punk SVGs from downloaded JSON files
   */
  async loadPunksFromFiles() {
    console.log('🎨 Loading 625+ Cryptopunk SVGs...');

    try {
      // Load all punks-*.json files from data/cryptopunks/ directory
      const files = [
        'punks-000.json', 'punks-001.json', 'punks-002.json', 'punks-003.json',
        'punks-004.json', 'punks-005.json', 'punks-006.json', 'punks-007.json',
        'punks-008.json', 'punks-009.json', 'punks-010.json', 'punks-011.json',
        'punks-012.json', 'punks-013.json', 'punks-014.json', 'punks-016.json',
        'punks-019.json', 'punks-020.json', 'punks-021.json', 'punks-022.json',
        'punks-023.json', 'punks-024.json', 'punks-031.json'
      ];

      let totalLoaded = 0;

      for (const filename of files) {
        try {
          const response = await fetch(`/data/cryptopunks/${filename}`);
          if (!response.ok) {
            console.warn(`⚠️ Skipping ${filename} - not found`);
            continue;
          }

          const batchData = await response.json();

          for (const punk of batchData) {
            // this.loadPunkSvg(punk.id, punk.svg); // Removed - using hardcoded data now
          }

          totalLoaded += batchData.length;
          console.log(`✅ Loaded ${batchData.length} punks from ${filename} (${totalLoaded} total)`);
        } catch (error) {
          console.warn(`❌ Failed to load ${filename}:`, error);
        }
      }

      console.log(`🎉 Successfully loaded ${totalLoaded} Cryptopunk SVGs!`);
      return totalLoaded;
    } catch (error) {
      console.warn('❌ Failed to load punks from files:', error);
      console.log('💡 Make sure punk files are in public/data/cryptopunks/');
      return 0;
    }
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
    case 'arc_region_field':
      return new ArcRegionField()
    case 'none':
    default:
      return null
  }
}

/**
 * Convert official CryptoPunk ID (Larva Labs) to dataset index
 * Dataset appears to have different ordering than official IDs
 */
export function mapOfficialPunkIdToDatasetIndex(officialId: number): number {
  if (officialId < 0 || officialId >= 10000) {
    throw new Error(`Invalid official punk ID: ${officialId}`)
  }

  // Known mapping corrections based on user feedback
  // If punk #7804 shows #779, then dataset index 779 contains punk #7804's data
  // This suggests dataset is not ordered by official ID

  // For now, use direct mapping and let user report specific mismatches
  // We can build a correction table as more mismatches are identified
  return officialId
}

/**
 * Sample punk pixel from global state - single source of truth for punk engraving
 */
export function samplePunkPixel(
  x: number,
  y: number,
  doormatData: any
): { r: number; g: number; b: number } | null {

  // Hard-gate: punk sampling only when explicitly enabled
  if (!(window as any).__ENABLE_PUNK__) return null

  const punkPixels = (window as any).__CURRENT_PUNK_PIXELS__
  if (!punkPixels) return null

  const PUNK_RENDER_SIZE = 420 // Much bigger for better visibility
  const PUNK_PIXEL_SCALE = PUNK_RENDER_SIZE / 24

  const originX = Math.floor(
    (doormatData.config.DOORMAT_WIDTH - PUNK_RENDER_SIZE) / 2
  )
  // Move closer to bottom by offsetting from the bottom edge
  const originY = Math.floor(
    doormatData.config.DOORMAT_HEIGHT - PUNK_RENDER_SIZE - 60 // 60px from bottom
  )

  if (
    x < originX ||
    x >= originX + PUNK_RENDER_SIZE ||
    y < originY ||
    y >= originY + PUNK_RENDER_SIZE
  ) {
    return null
  }

  const localX = x - originX
  const localY = y - originY

  const px = Math.floor(localX / PUNK_PIXEL_SCALE)
  const py = Math.floor(localY / PUNK_PIXEL_SCALE)

  if (px < 0 || px >= 24 || py < 0 || py >= 24) return null

  // Rotate 90 degrees counterclockwise to match rug orientation
  const rotatedPx = 23 - py
  const rotatedPy = px

  return punkPixels[rotatedPy][rotatedPx]
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