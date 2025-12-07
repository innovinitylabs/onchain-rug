/**
 * Trait Registry and Normalization System
 *
 * Manages normalized trait definitions with:
 * - Automatic trait discovery and registration
 * - Rarity calculation based on usage frequency
 * - Owner address trait (replacing rarity scores)
 * - Efficient trait querying and filtering
 */

import { TraitOperations, TokenOperations, AnalyticsOperations, normalizeTraitId } from './redis-operations'
import type { TraitSchema } from './redis-schema'

export interface TraitDefinition {
  type: string
  value: string | number | bigint
  displayName?: string
  category?: 'color' | 'numeric' | 'address' | 'text' | 'boolean'
}

export interface TraitStats {
  traitId: string
  type: string
  value: string
  count: number
  rarity: number
  percentage: number
}

export class TraitRegistry {
  /**
   * Register or update a trait definition
   */
  static async registerTrait(definition: TraitDefinition, contractId: string): Promise<string> {
    const { type, value, displayName, category } = definition

    // Normalize the value for consistent storage
    const normalizedValue = this.normalizeValue(value)
    const traitId = normalizeTraitId(type, normalizedValue)

    // Check if trait already exists
    let trait = await TraitOperations.getTrait(type, normalizedValue)

    if (!trait) {
      // Create new trait
      trait = {
        id: traitId,
        type,
        value: String(value),
        normalizedValue,
        displayName: displayName || this.generateDisplayName(type, value),
        category: category || this.inferCategory(type, value),
        rarity: 0,
        tokenCount: 0,
        createdAt: new Date().toISOString()
      }

      await TraitOperations.storeTrait(trait)
    }

    // Update usage analytics
    await AnalyticsOperations.trackTraitUsage(contractId, traitId)

    return traitId
  }

  /**
   * Register traits for a token
   */
  static async registerTokenTraits(
    tokenId: string,
    traits: TraitDefinition[],
    contractId: string
  ): Promise<string[]> {
    const traitIds: string[] = []

    for (const trait of traits) {
      const traitId = await this.registerTrait(trait, contractId)
      traitIds.push(traitId)

      // Update trait token count
      await TraitOperations.updateTraitCount(traitId, 1)
    }

    return traitIds
  }

  /**
   * Get all traits for a contract with statistics
   */
  static async getContractTraits(contractId: string): Promise<TraitStats[]> {
    const analytics = await TraitOperations.getTraitAnalytics(contractId)
    const totalTokens = await this.getContractTokenCount(contractId)

    const traitStats: TraitStats[] = []

    for (const { traitId, count } of analytics) {
      const trait = await this.getTraitById(traitId)
      if (trait) {
        traitStats.push({
          traitId,
          type: trait.type,
          value: trait.value,
          count,
          rarity: count / totalTokens,
          percentage: (count / totalTokens) * 100
        })
      }
    }

    return traitStats
  }

  /**
   * Get trait by ID
   */
  static async getTraitById(traitId: string): Promise<TraitSchema | null> {
    // Parse trait ID to extract type and normalized value
    const parts = traitId.split('_')
    if (parts.length < 3) return null

    const type = parts[1]
    const normalizedValue = parts.slice(2).join('_')

    return await TraitOperations.getTrait(type, normalizedValue)
  }

  /**
   * Find tokens by trait filters
   */
  static async findTokensByTraits(
    contractId: string,
    traitFilters: Array<{ type: string, value: string }>,
    limit: number = 50
  ): Promise<string[]> {
    if (traitFilters.length === 0) return []

    const tokenSets: string[][] = []

    // Get token sets for each trait filter
    for (const filter of traitFilters) {
      const traitId = normalizeTraitId(filter.type, this.normalizeValue(filter.value))
      const tokens = await TokenOperations.getTokensByTrait(traitId)
      tokenSets.push(tokens)
    }

    // Find intersection of all token sets (tokens that have ALL the specified traits)
    if (tokenSets.length === 0) return []

    let result = tokenSets[0]
    for (let i = 1; i < tokenSets.length; i++) {
      result = result.filter(token => tokenSets[i].includes(token))
    }

    return result.slice(0, limit)
  }

  /**
   * Create owner address trait (replaces rarity scores)
   */
  static async createOwnerTrait(ownerAddress: string): Promise<string> {
    return await this.registerTrait({
      type: 'owner',
      value: ownerAddress,
      displayName: `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`,
      category: 'address'
    }, 'global') // Owner traits are global across contracts
  }

  /**
   * Update trait rarity scores after batch operations
   */
  static async recalculateRarities(contractId: string): Promise<void> {
    const traits = await this.getContractTraits(contractId)

    for (const traitStats of traits) {
      const trait = await this.getTraitById(traitStats.traitId)
      if (trait) {
        // Update rarity in trait definition
        await TraitOperations.storeTrait({
          ...trait,
          rarity: traitStats.rarity
        })
      }
    }
  }

  /**
   * Get popular traits for a contract
   */
  static async getPopularTraits(contractId: string, limit: number = 10): Promise<TraitStats[]> {
    const allTraits = await this.getContractTraits(contractId)
    return allTraits
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * Get tokens owned by a specific address
   */
  static async getTokensByOwner(ownerAddress: string): Promise<string[]> {
    const ownerTraitId = normalizeTraitId('owner', ownerAddress.toLowerCase())
    return await TraitOperations.getTraitTokens(ownerTraitId)
  }

  /**
   * Get owner distribution for a contract
   */
  static async getOwnershipDistribution(contractId: string): Promise<Array<{ owner: string, tokenCount: number }>> {
    const analytics = await TraitOperations.getTraitAnalytics(contractId)

    const ownerStats: Array<{ owner: string, tokenCount: number }> = []

    for (const { traitId, count } of analytics) {
      const trait = await this.getTraitById(traitId)
      if (trait && trait.type === 'owner') {
        ownerStats.push({
          owner: trait.value,
          tokenCount: count
        })
      }
    }

    return ownerStats.sort((a, b) => b.tokenCount - a.tokenCount)
  }

  /**
   * Get top owners by token count
   */
  static async getTopOwners(contractId: string, limit: number = 10): Promise<Array<{ owner: string, tokenCount: number, displayName: string }>> {
    const ownershipStats = await this.getOwnershipDistribution(contractId)

    return ownershipStats.slice(0, limit).map(stat => ({
      ...stat,
      displayName: `${stat.owner.slice(0, 6)}...${stat.owner.slice(-4)}`
    }))
  }

  // =============================================================================
  // PRIVATE UTILITY METHODS
  // =============================================================================

  private static normalizeValue(value: string | number | bigint): string {
    if (typeof value === 'string') {
      return value.toLowerCase().trim()
    }
    return String(value).toLowerCase().trim()
  }

  private static generateDisplayName(type: string, value: string | number | bigint): string {
    // Generate human-readable display names
    switch (type) {
      case 'owner':
        const addr = String(value)
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
      case 'complexity':
        return `Complexity ${value}`
      case 'palette':
        return String(value).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      case 'characterCount':
        return `${value} Characters`
      case 'stripeCount':
        return `${value} Stripes`
      default:
        return String(value)
    }
  }

  private static inferCategory(type: string, value: string | number | bigint): TraitSchema['category'] {
    if (type === 'owner' || (typeof value === 'string' && value.startsWith('0x'))) {
      return 'address'
    }
    if (typeof value === 'number' || typeof value === 'bigint' || !isNaN(Number(value))) {
      return 'numeric'
    }
    if (typeof value === 'boolean' || value === 'true' || value === 'false') {
      return 'boolean'
    }
    if (type === 'palette' || type.includes('color')) {
      return 'color'
    }
    return 'text'
  }

  private static async getContractTokenCount(contractId: string): Promise<number> {
    const tokens = await TokenOperations.getTokensByContract(contractId)
    return tokens.length
  }
}

// =============================================================================
// TRAIT EXTRACTION UTILITIES
// =============================================================================

export class TraitExtractor {
  /**
   * Extract traits from NFT metadata
   */
  static extractFromMetadata(metadata: any, ownerAddress?: string): TraitDefinition[] {
    const traits: TraitDefinition[] = []

    // Extract from attributes array
    if (metadata.attributes && Array.isArray(metadata.attributes)) {
      for (const attr of metadata.attributes) {
        if (attr.trait_type && attr.value !== undefined) {
          // Skip dynamic traits that change with maintenance
          const dynamicTraits = ['Dirt Level', 'Aging Level', 'Last Cleaned', 'Last Maintenance']
          if (!dynamicTraits.includes(attr.trait_type)) {
            traits.push({
              type: this.normalizeTraitType(attr.trait_type),
              value: attr.value,
              displayName: attr.trait_type
            })
          }
        }
      }
    }

    // Add owner address trait (REPLACES rarity scores - no more rarity calculations)
    if (ownerAddress) {
      traits.push({
        type: 'owner',
        value: ownerAddress,
        displayName: `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`,
        category: 'address'
      })

      // Add ownership verification trait
      traits.push({
        type: 'ownership_verified',
        value: 'true',
        displayName: 'Ownership Verified',
        category: 'boolean'
      })
    }

    return traits
  }

  /**
   * Extract dynamic traits from contract data
   */
  static extractDynamicTraits(dirtLevel: number, agingLevel: number, lastMaintenance: string): TraitDefinition[] {
    return [
      {
        type: 'dirtLevel',
        value: dirtLevel,
        category: 'numeric'
      },
      {
        type: 'agingLevel',
        value: agingLevel,
        category: 'numeric'
      },
      {
        type: 'lastMaintenance',
        value: lastMaintenance,
        category: 'text'
      }
    ]
  }

  private static normalizeTraitType(traitType: string): string {
    return traitType
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }
}

// =============================================================================
// TRAIT QUERYING UTILITIES
// =============================================================================

export class TraitQueries {
  /**
   * Advanced trait-based filtering
   */
  static async filterTokens(
    contractId: string,
    filters: {
      includeTraits?: Array<{ type: string, value: string }>
      excludeTraits?: Array<{ type: string, value: string }>
      ownerAddress?: string
      ownedBy?: string[] // Multiple owner addresses
      hasMaintenance?: boolean // Has been maintained recently
      sortBy?: 'owner' | 'count' | 'type' | 'lastMaintenance'
      sortOrder?: 'asc' | 'desc'
      limit?: number
      offset?: number
    }
  ): Promise<{
    tokens: string[]
    totalCount: number
    appliedFilters: any
  }> {
    let candidateTokens: string[] = []

    // Start with include filters (must have ALL these traits)
    if (filters.includeTraits && filters.includeTraits.length > 0) {
      candidateTokens = await TraitRegistry.findTokensByTraits(contractId, filters.includeTraits)
    } else {
      // If no include filters, start with all contract tokens
      candidateTokens = await this.getAllContractTokens(contractId)
    }

    // Apply exclude filters (must NOT have ANY of these traits)
    if (filters.excludeTraits && filters.excludeTraits.length > 0) {
      for (const excludeFilter of filters.excludeTraits) {
        const excludeTokens = await TraitRegistry.findTokensByTraits(contractId, [excludeFilter])
        candidateTokens = candidateTokens.filter(token => !excludeTokens.includes(token))
      }
    }

    // Apply owner filter (PRIMARY filtering method - replaces rarity)
    if (filters.ownerAddress) {
      const ownerTokens = await TraitRegistry.getTokensByOwner(filters.ownerAddress)
      candidateTokens = candidateTokens.filter(token => ownerTokens.includes(token))
    }

    // Apply multiple owners filter
    if (filters.ownedBy && filters.ownedBy.length > 0) {
      const allOwnerTokens: string[] = []
      for (const owner of filters.ownedBy) {
        const ownerTokens = await TraitRegistry.getTokensByOwner(owner)
        allOwnerTokens.push(...ownerTokens)
      }
      // Remove duplicates
      const uniqueOwnerTokens = [...new Set(allOwnerTokens)]
      candidateTokens = candidateTokens.filter(token => uniqueOwnerTokens.includes(token))
    }

    // Apply maintenance filter
    if (filters.hasMaintenance) {
      const maintainedTokens = await this.getRecentlyMaintainedTokens(contractId)
      candidateTokens = candidateTokens.filter(token => maintainedTokens.includes(token))
    }

    // Sort results (OWNER-FOCUSED sorting)
    if (filters.sortBy) {
      candidateTokens = await this.sortTokensByOwnerCriteria(candidateTokens, filters.sortBy, filters.sortOrder || 'desc')
    }

    // Apply pagination
    const totalCount = candidateTokens.length
    const offset = filters.offset || 0
    const limit = filters.limit || 50
    const paginatedTokens = candidateTokens.slice(offset, offset + limit)

    return {
      tokens: paginatedTokens,
      totalCount,
      appliedFilters: filters
    }
  }

  private static async getAllContractTokens(contractId: string): Promise<string[]> {
    // This would need to be implemented in ContractOperations
    return []
  }

  private static async getRecentlyMaintainedTokens(contractId: string): Promise<string[]> {
    // Get tokens that have been maintained in the last 30 days
    // This would require querying maintenance analytics
    // For now, return empty array - implement based on your maintenance tracking
    return []
  }

  private static async sortTokensByOwnerCriteria(
    tokens: string[],
    sortBy: 'owner' | 'count' | 'type' | 'lastMaintenance',
    order: 'asc' | 'desc'
  ): Promise<string[]> {
    // This would require loading token data and sorting by owner-based criteria
    // For now, return tokens as-is - implement based on your specific sorting needs
    return tokens
  }

  private static async sortTokensByTrait(
    tokens: string[],
    sortBy: string,
    order: 'asc' | 'desc'
  ): Promise<string[]> {
    // Legacy method for backward compatibility
    return tokens
  }
}
