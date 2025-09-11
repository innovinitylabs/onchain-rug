/**
 * Deterministic Pseudo-Random Number Generator
 * Provides consistent random number generation for reproducible art
 */

class DeterministicPRNG {
  private seed: number
  private state: number

  constructor(seed: number) {
    this.seed = seed
    this.state = seed
  }

  // Linear Congruential Generator (LCG)
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296
    return this.state / 4294967296
  }

  // Generate random number between min and max (inclusive)
  random(min: number = 0, max: number = 1): number {
    return min + this.next() * (max - min)
  }

  // Generate random integer between min and max (inclusive)
  randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1))
  }

  // Generate random boolean
  randomBool(): boolean {
    return this.next() < 0.5
  }

  // Pick random element from array
  randomChoice<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)]
  }

  // Generate random number in range (alias for random)
  range(min: number, max: number): number {
    return this.random(min, max)
  }

  // Shuffle array in place
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i)
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  // Reset to original seed
  reset(): void {
    this.state = this.seed
  }

  // Get current seed
  getSeed(): number {
    return this.seed
  }
}

// Global PRNG instance
let globalPRNG: DeterministicPRNG | null = null

/**
 * Initialize the global PRNG with a seed
 */
export function initPRNG(seed: number): void {
  globalPRNG = new DeterministicPRNG(seed)
}

/**
 * Get the global PRNG instance
 */
export function getPRNG(): DeterministicPRNG {
  if (!globalPRNG) {
    throw new Error('PRNG not initialized. Call initPRNG(seed) first.')
  }
  return globalPRNG
}

/**
 * Create a new PRNG instance with a derived seed
 */
export function createDerivedPRNG(baseSeed: number, offset: number = 0): DeterministicPRNG {
  return new DeterministicPRNG(baseSeed + offset)
}

/**
 * Generate a random seed
 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 4294967296)
}

/**
 * Hash a string to a number (for deterministic seeds from text)
 */
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export default DeterministicPRNG
