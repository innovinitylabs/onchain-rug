/**
 * Dynamic Calculator
 * 
 * Calculates time-based NFT traits (dirtLevel, agingLevel) on the fly.
 * Matches contract logic exactly from RugMaintenanceFacet._getDirtLevel and _getAgingLevel
 */

import { ContractConfig } from './contract-config-cache'

/**
 * Convert frame level string to number
 * 
 * @param frameLevel Frame level as string ("None", "Bronze", "Silver", "Gold", "Diamond") or number (0-4)
 * @returns Frame level as number (0=None, 1=Bronze, 2=Silver, 3=Gold, 4=Diamond)
 */
export function frameLevelToNumber(frameLevel: string | number): number {
  if (typeof frameLevel === 'number') {
    return frameLevel
  }

  switch (frameLevel) {
    case 'Diamond':
      return 4
    case 'Gold':
      return 3
    case 'Silver':
      return 2
    case 'Bronze':
      return 1
    case 'None':
    default:
      return 0
  }
}

/**
 * Get aging multiplier based on frame level
 * 
 * Matches LibRugStorage.getAgingMultiplier exactly
 * 
 * @param frameLevel Frame level (0-4)
 * @returns Aging multiplier (higher = slower aging)
 */
function getAgingMultiplier(frameLevel: number): bigint {
  if (frameLevel >= 4) return BigInt(10)  // Diamond: 90% slower (10x longer)
  if (frameLevel >= 3) return BigInt(20)  // Gold: 80% slower (5x longer)
  if (frameLevel >= 2) return BigInt(50)  // Silver: 50% slower (2x longer)
  if (frameLevel >= 1) return BigInt(75)  // Bronze: 25% slower (1.3x longer)
  return BigInt(100)                       // None: normal speed
}

/**
 * Calculate dirt level based on time and frame level
 * 
 * Matches contract RugMaintenanceFacet._getDirtLevel logic exactly
 * 
 * @param lastCleaned Last cleaned timestamp (in seconds, as BigInt)
 * @param frameLevel Frame level (0-4 or string)
 * @param contractConfig Contract configuration
 * @returns Dirt level (0=Clean, 1=Dirty, 2=Very Dirty)
 */
export function calculateDirtLevel(
  lastCleaned: bigint,
  frameLevel: string | number,
  contractConfig: ContractConfig
): number {
  const frameLevelNum = frameLevelToNumber(frameLevel)
  const now = BigInt(Math.floor(Date.now() / 1000))
  
  // Normalize lastCleaned - if it's > 1e10, it's likely in milliseconds, convert to seconds
  let normalizedLastCleaned = lastCleaned
  if (lastCleaned > BigInt(10000000000)) {
    // Likely in milliseconds, convert to seconds
    normalizedLastCleaned = lastCleaned / BigInt(1000)
    console.warn(`[calculateDirtLevel] lastCleaned appears to be in milliseconds (${lastCleaned}), converting to seconds (${normalizedLastCleaned})`)
  }
  
  const timeSinceCleaned = now - normalizedLastCleaned
  
  // Protect against negative time
  if (timeSinceCleaned < BigInt(0)) {
    console.warn(`[calculateDirtLevel] Negative timeSinceCleaned: ${timeSinceCleaned}, now=${now}, lastCleaned=${normalizedLastCleaned}. Returning 0.`)
    return 0
  }

  // Gold+ frames (frameLevel >= 3) never get dirty
  if (frameLevelNum >= 3) {
    return 0
  }

  // Pre-calculate adjusted thresholds based on frame level
  let level1Threshold: bigint
  let level2Threshold: bigint

  if (frameLevelNum === 2) {
    // Silver: 2x slower
    level1Threshold = contractConfig.dirtLevel1Days * BigInt(2)
    level2Threshold = contractConfig.dirtLevel2Days * BigInt(2)
  } else if (frameLevelNum === 1) {
    // Bronze: 1.5x slower (multiply by 3/2)
    level1Threshold = (contractConfig.dirtLevel1Days * BigInt(3)) / BigInt(2)
    level2Threshold = (contractConfig.dirtLevel2Days * BigInt(3)) / BigInt(2)
  } else {
    // None (frameLevelNum === 0): normal speed
    level1Threshold = contractConfig.dirtLevel1Days
    level2Threshold = contractConfig.dirtLevel2Days
  }

  if (timeSinceCleaned >= level2Threshold) return 2
  if (timeSinceCleaned >= level1Threshold) return 1
  return 0
}

/**
 * Calculate aging level based on time, frame level, and base level
 * 
 * Matches contract RugMaintenanceFacet._getAgingLevel logic exactly
 * 
 * @param lastCleaned Last cleaned timestamp (in seconds, as BigInt)
 * @param frameLevel Frame level (0-4 or string)
 * @param baseAgingLevel Stored base aging level from contract (0-10)
 * @param contractConfig Contract configuration
 * @returns Calculated aging level (0-10, capped at 10)
 */
export function calculateAgingLevel(
  lastCleaned: bigint,
  frameLevel: string | number,
  baseAgingLevel: number,
  contractConfig: ContractConfig
): number {
  const frameLevelNum = frameLevelToNumber(frameLevel)
  const now = BigInt(Math.floor(Date.now() / 1000))
  
  // Normalize lastCleaned - if it's > 1e10, it's likely in milliseconds, convert to seconds
  let normalizedLastCleaned = lastCleaned
  if (lastCleaned > BigInt(10000000000)) {
    // Likely in milliseconds, convert to seconds
    normalizedLastCleaned = lastCleaned / BigInt(1000)
    console.warn(`[calculateAgingLevel] lastCleaned appears to be in milliseconds (${lastCleaned}), converting to seconds (${normalizedLastCleaned})`)
  }
  
  const timeSinceLevelStart = now - normalizedLastCleaned
  
  // Protect against negative time (lastCleaned in future or data corruption)
  if (timeSinceLevelStart < BigInt(0)) {
    console.warn(`[calculateAgingLevel] Negative timeSinceLevelStart: ${timeSinceLevelStart}, now=${now}, lastCleaned=${normalizedLastCleaned}. Using baseAgingLevel only.`)
    return Math.min(Math.max(baseAgingLevel, 0), 10)
  }
  
  const baseInterval = contractConfig.agingAdvanceDays

  // Apply frame-based aging multiplier (higher frames age slower)
  const agingMultiplier = getAgingMultiplier(frameLevelNum)
  const adjustedInterval = (baseInterval * BigInt(100)) / agingMultiplier

  // Calculate how many levels we should have advanced
  const levelsAdvanced = Number(timeSinceLevelStart / adjustedInterval)

  // Cap at max level 10
  const calculatedLevel = baseAgingLevel + levelsAdvanced
  return calculatedLevel > 10 ? 10 : calculatedLevel
}

