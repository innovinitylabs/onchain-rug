/**
 * Deterministic Pseudo-Random Number Generator
 * Ensures complete reproducibility of doormat generation
 */
export class DeterministicPRNG {
  private seed: number;
  private state: number;

  constructor(seed: number) {
    this.seed = seed;
    this.state = this.hashSeed(seed);
  }

  /**
   * Hash function to convert seed to initial state
   */
  private hashSeed(seed: number): number {
    let hash = seed;
    hash = ((hash << 5) - hash) & 0xffffffff;
    hash ^= hash >>> 16;
    hash = ((hash << 5) - hash) & 0xffffffff;
    hash ^= hash >>> 16;
    return Math.abs(hash) / 0xffffffff;
  }

  /**
   * Generate next random number (0 to 1)
   */
  next(): number {
    // Linear Congruential Generator (LCG)
    this.state = (this.state * 1664525 + 1013904223) % 0x100000000;
    return this.state / 0x100000000;
  }

  /**
   * Generate random number between min and max (inclusive)
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Pick random element from array
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) throw new Error('Cannot choose from empty array');
    return array[this.int(0, array.length - 1)];
  }

  /**
   * Shuffle array in place (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Generate random boolean
   */
  boolean(): boolean {
    return this.next() < 0.5;
  }

  /**
   * Generate random number with normal distribution (Box-Muller transform)
   */
  normal(mean: number = 0, stdDev: number = 1): number {
    if (this._spare !== null) {
      const value = this._spare;
      this._spare = null;
      return value * stdDev + mean;
    }

    const u1 = this.next();
    const u2 = this.next();
    const mag = stdDev * Math.sqrt(-2.0 * Math.log(u1));
    this._spare = mag * Math.cos(2.0 * Math.PI * u2);
    return mag * Math.sin(2.0 * Math.PI * u2) + mean;
  }

  private _spare: number | null = null;

  /**
   * Create a new PRNG instance with a derived seed
   */
  derive(additionalSeed: number): DeterministicPRNG {
    const newSeed = this.hashSeed(this.seed + additionalSeed) * 0xffffffff;
    return new DeterministicPRNG(newSeed);
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Reset to original seed
   */
  reset(): void {
    this.state = this.hashSeed(this.seed);
    this._spare = null;
  }
}

/**
 * Global PRNG instance for the current generation
 */
let globalPRNG: DeterministicPRNG | null = null;

/**
 * Initialize global PRNG with seed
 */
export function initPRNG(seed: number): DeterministicPRNG {
  globalPRNG = new DeterministicPRNG(seed);
  return globalPRNG;
}

/**
 * Get current global PRNG instance
 */
export function getPRNG(): DeterministicPRNG {
  if (!globalPRNG) {
    throw new Error('PRNG not initialized. Call initPRNG(seed) first.');
  }
  return globalPRNG;
}

/**
 * Create a derived PRNG for specific purposes
 */
export function createDerivedPRNG(additionalSeed: number): DeterministicPRNG {
  return getPRNG().derive(additionalSeed);
}
