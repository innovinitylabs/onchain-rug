import { RugMarketNFT } from '../../lib/rug-market-types'

/**
 * Game statistics calculated from rug traits
 * Clean rugs = better performance (encourages maintenance)
 */
export interface FlightStats {
  maxSpeed: number
  acceleration: number
  turnSensitivity: number
  stability: number
  boostPower: number
  boostRecovery: number
  airResistance: number
  wobbleAmount: number
}

/**
 * Calculate flight statistics from rug traits
 * All traits affect performance, with clean/maintained rugs performing best
 */
export function calculateFlightStats(rug: RugMarketNFT): FlightStats {
  const { permanent, dynamic } = rug

  // Base stats
  const BASE_MAX_SPEED = 40
  const BASE_ACCELERATION = 25
  const BASE_TURN_SENSITIVITY = 2.5
  const BASE_STABILITY = 0.9
  const BASE_BOOST_POWER = 1.5
  const BASE_BOOST_RECOVERY = 8
  const BASE_AIR_RESISTANCE = 0.05
  const BASE_WOBBLE = 0.02

  // Dirt level multipliers (clean = best)
  const dirtMultipliers = {
    0: { speed: 1.0, accel: 1.0, turn: 1.0, stability: 1.0, boost: 1.0 }, // Clean
    1: { speed: 0.85, accel: 0.9, turn: 0.95, stability: 0.95, boost: 0.9 }, // Dirty
    2: { speed: 0.7, accel: 0.8, turn: 0.9, stability: 0.9, boost: 0.8 }   // Very Dirty
  }

  const dirtLevel = Math.min(2, Math.max(0, dynamic.dirtLevel || 0))
  const dirtMult = dirtMultipliers[dirtLevel as keyof typeof dirtMultipliers]

  // Aging level penalties (younger = better)
  const agingPenalty = Math.max(0.7, 1.0 - (dynamic.agingLevel || 0) * 0.015)

  // Frame level bonuses (higher frames = better)
  const frameBonus = 1.0 + (dynamic.frameLevel || 0) * 0.08

  // Maintenance score bonuses (higher maintenance = better)
  const maintenanceBonus = Math.max(0.8, 1.0 + ((dynamic.maintenanceScore || 0) / 10000) * 0.2)

  // Cleaning count bonuses (more cleanings = better experience)
  const cleaningBonus = 1.0 + Math.min(0.15, (dynamic.cleaningCount || 0) * 0.02)

  // Rug-specific trait bonuses (micro-adjustments)
  const warpThicknessBonus = 1.0 + ((permanent.warpThickness || 2) - 2) * 0.01
  const stripeCountBonus = 1.0 + ((permanent.stripeCount || 8) / 100) * 0.02
  const characterCountBonus = 1.0 + ((permanent.characterCount || 50) / 1000) * 0.01

  // Calculate final stats
  const maxSpeed = BASE_MAX_SPEED *
    dirtMult.speed *
    agingPenalty *
    frameBonus *
    maintenanceBonus *
    cleaningBonus *
    warpThicknessBonus *
    stripeCountBonus

  const acceleration = BASE_ACCELERATION *
    dirtMult.accel *
    agingPenalty *
    frameBonus *
    maintenanceBonus

  const turnSensitivity = BASE_TURN_SENSITIVITY *
    dirtMult.turn *
    frameBonus *
    stripeCountBonus *
    characterCountBonus

  const stability = Math.min(1.0, BASE_STABILITY *
    dirtMult.stability *
    frameBonus *
    maintenanceBonus *
    warpThicknessBonus)

  const boostPower = BASE_BOOST_POWER *
    dirtMult.boost *
    frameBonus *
    maintenanceBonus

  const boostRecovery = BASE_BOOST_RECOVERY / (
    dirtMult.boost *
    maintenanceBonus *
    cleaningBonus
  )

  const airResistance = BASE_AIR_RESISTANCE *
    (2 - dirtMult.speed) * // More resistance when dirty
    (1 / frameBonus) // Better frames = less resistance

  const wobbleAmount = BASE_WOBBLE *
    (2 - dirtMult.stability) * // More wobble when unstable
    (1 / maintenanceBonus) // Better maintenance = less wobble

  return {
    maxSpeed: Math.max(15, maxSpeed), // Minimum speed
    acceleration: Math.max(10, acceleration),
    turnSensitivity: Math.max(1.0, turnSensitivity),
    stability: Math.max(0.5, stability),
    boostPower: Math.max(1.1, boostPower),
    boostRecovery: Math.max(3, boostRecovery),
    airResistance: Math.max(0.01, airResistance),
    wobbleAmount: Math.max(0.005, wobbleAmount)
  }
}

/**
 * Calculate betting odds based on rug stats
 * Clean rugs get better odds (lower multiplier = better odds)
 */
export function calculateBettingOdds(rug: RugMarketNFT): number {
  const stats = calculateFlightStats(rug)

  // Base odds calculation
  let odds = 2.0 // Default 2x multiplier

  // Clean rugs get better odds
  if (rug.dynamic.dirtLevel === 0) odds *= 0.8
  else if (rug.dynamic.dirtLevel === 1) odds *= 0.9
  else if (rug.dynamic.dirtLevel === 2) odds *= 1.1

  // High frames improve odds
  odds *= (1.0 - (rug.dynamic.frameLevel || 0) * 0.02)

  // Maintenance score improves odds
  odds *= (1.0 - Math.min(0.1, (rug.dynamic.maintenanceScore || 0) / 20000))

  // High stats improve odds
  const statBonus = (stats.maxSpeed + stats.turnSensitivity + stats.stability) / 120
  odds *= (1.0 - statBonus * 0.05)

  return Math.max(1.1, odds) // Minimum 1.1x
}

/**
 * Get visual effect multipliers based on rug condition
 */
export interface VisualEffects {
  brightness: number
  glowIntensity: number
  trailLength: number
  particleDensity: number
}

export function calculateVisualEffects(rug: RugMarketNFT): VisualEffects {
  const dirtLevel = Math.min(2, Math.max(0, rug.dynamic.dirtLevel || 0))
  const maintenanceScore = rug.dynamic.maintenanceScore || 0
  const frameLevel = rug.dynamic.frameLevel || 0

  // Clean rugs look better
  const cleanliness = dirtLevel === 0 ? 1.0 : dirtLevel === 1 ? 0.7 : 0.4

  return {
    brightness: 0.5 + cleanliness * 0.5,
    glowIntensity: cleanliness * 0.3 + (frameLevel * 0.1) + (maintenanceScore / 50000),
    trailLength: cleanliness * 2.0 + (frameLevel * 0.5),
    particleDensity: cleanliness * 0.8 + (frameLevel * 0.2)
  }
}

/**
 * Debug function to log trait calculations
 */
export function debugRugStats(rug: RugMarketNFT): void {
  const stats = calculateFlightStats(rug)
  const odds = calculateBettingOdds(rug)
  const visuals = calculateVisualEffects(rug)

  console.log(`🏃 Rug #${rug.permanent.tokenId} Stats:`, {
    traits: {
      dirtLevel: rug.dynamic.dirtLevel,
      agingLevel: rug.dynamic.agingLevel,
      frameLevel: rug.dynamic.frameLevel,
      maintenanceScore: rug.dynamic.maintenanceScore,
      cleaningCount: rug.dynamic.cleaningCount
    },
    flight: stats,
    betting: { odds: `${odds.toFixed(2)}x` },
    visual: visuals
  })
}
