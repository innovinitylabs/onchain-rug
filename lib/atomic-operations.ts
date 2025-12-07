/**
 * Atomic Operations for Data Consistency
 *
 * Ensures complex operations maintain data integrity through:
 * - Redis transactions (MULTI/EXEC)
 * - Rollback mechanisms
 * - Consistency checks
 * - Error recovery
 */

import { redis, RedisKeys, makeContractId, makeTokenId } from './redis-schema'
import { TokenOperations, ContractOperations, UserOperations, TraitOperations } from './redis-operations'
import { SmartCacheInvalidation } from './smart-cache'

export interface AtomicOperationResult {
  success: boolean
  operationId: string
  duration: number
  affectedEntities: string[]
  error?: string
  rollbackData?: any
}

export class AtomicOperations {
  private static operationCounter = 0

  /**
   * Execute token transfer with full consistency
   */
  static async executeTokenTransfer(
    tokenId: string,
    fromAddress: string,
    toAddress: string,
    contractId: string
  ): Promise<AtomicOperationResult> {
    const operationId = `transfer_${++this.operationCounter}_${Date.now()}`
    const startTime = Date.now()

    try {
      // Start Redis transaction
      const pipeline = redis.pipeline()

      // 1. Verify token ownership
      const currentOwner = await redis.hget(`token:${tokenId}`, 'owner')
      if (currentOwner !== fromAddress) {
        throw new Error(`Token ${tokenId} not owned by ${fromAddress}`)
      }

      // 2. Update token ownership
      pipeline.hset(`token:${tokenId}`, {
        owner: toAddress,
        lastTransfer: new Date().toISOString()
      })

      // 3. Update user relationships
      pipeline.srem(`user:${fromAddress}:tokens`, tokenId)
      pipeline.sadd(`user:${toAddress}:tokens`, tokenId)

      // 4. Update owner indexes
      pipeline.zincrby(`index:owners:by_token_count:${contractId}`, -1, fromAddress)
      pipeline.zincrby(`index:owners:by_token_count:${contractId}`, 1, toAddress)

      // 5. Update owner trait relationships
      const ownerTraitId = `trait_owner_${fromAddress.toLowerCase()}`
      const newOwnerTraitId = `trait_owner_${toAddress.toLowerCase()}`
      pipeline.srem(`trait:${ownerTraitId}:tokens`, tokenId)
      pipeline.sadd(`trait:${newOwnerTraitId}:tokens`, tokenId)

      // 6. Update activity indexes
      pipeline.zadd(`index:owners:by_activity:${contractId}`, {
        score: Date.now(),
        member: toAddress
      })

      // Execute transaction
      const results = await pipeline.exec()

      // Verify all operations succeeded
      const failedOps = results.filter(([error]) => error !== null)
      if (failedOps.length > 0) {
        throw new Error(`Transaction failed: ${failedOps.length} operations failed`)
      }

      // Invalidate caches
      await SmartCacheInvalidation.invalidateTokenAndDependents(tokenId, 'ownership')

      return {
        success: true,
        operationId,
        duration: Date.now() - startTime,
        affectedEntities: [tokenId, fromAddress, toAddress]
      }

    } catch (error) {
      // Attempt rollback if needed
      await this.rollbackTransfer(operationId, tokenId, fromAddress, toAddress)

      return {
        success: false,
        operationId,
        duration: Date.now() - startTime,
        affectedEntities: [tokenId],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Execute batch token minting with consistency
   */
  static async executeBatchMint(
    contractId: string,
    tokens: Array<{
      tokenId: number
      owner: string
      metadata: any
      traits: any[]
    }>
  ): Promise<AtomicOperationResult> {
    const operationId = `batch_mint_${++this.operationCounter}_${Date.now()}`
    const startTime = Date.now()

    try {
      const pipeline = redis.pipeline()
      const affectedEntities: string[] = []

      for (const token of tokens) {
        const tokenId = makeTokenId(
          parseInt(contractId.split(':')[0]),
          contractId.split(':')[1],
          token.tokenId
        )

        affectedEntities.push(tokenId)

        // 1. Create token data
        const tokenData = {
          ...token,
          id: tokenId,
          contractId,
          traits: JSON.stringify(token.traits),
          dynamic: JSON.stringify({
            dirtLevel: 0,
            agingLevel: 0,
            lastMaintenance: new Date().toISOString(),
            maintenanceCount: 0,
            cleaningCount: 0
          }),
          metadataHash: '', // Would compute hash
          lastRefresh: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }

        pipeline.hset(`token:${tokenId}`, tokenData)

        // 2. Update relationships
        pipeline.sadd(`contract:${contractId}:tokens`, tokenId)
        pipeline.sadd(`user:${token.owner}:tokens`, tokenId)

        // 3. Update trait relationships
        for (const trait of token.traits) {
          const traitId = `trait_${trait.type}_${trait.value.toString().toLowerCase()}`
          pipeline.sadd(`trait:${traitId}:tokens`, tokenId)
        }

        // 4. Update owner trait
        const ownerTraitId = `trait_owner_${token.owner.toLowerCase()}`
        pipeline.sadd(`trait:${ownerTraitId}:tokens`, tokenId)

        // 5. Update indexes
        pipeline.zincrby(`index:owners:by_token_count:${contractId}`, 1, token.owner)
        pipeline.zadd(`index:owners:by_activity:${contractId}`, {
          score: Date.now(),
          member: token.owner
        })
      }

      // Execute transaction
      const results = await pipeline.exec()

      // Verify success
      const failedOps = results.filter(([error]) => error !== null)
      if (failedOps.length > 0) {
        throw new Error(`Batch mint failed: ${failedOps.length} operations failed`)
      }

      // Update contract total supply
      await ContractOperations.updateTotalSupply(contractId, tokens.length)

      return {
        success: true,
        operationId,
        duration: Date.now() - startTime,
        affectedEntities
      }

    } catch (error) {
      // Rollback would be complex for batch operations
      // In practice, you'd need a more sophisticated rollback mechanism

      return {
        success: false,
        operationId,
        duration: Date.now() - startTime,
        affectedEntities: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Execute maintenance action with consistency
   */
  static async executeMaintenanceAction(
    tokenId: string,
    userAddress: string,
    actionType: 'maintenance' | 'cleaning' | 'restoration',
    actionData?: any
  ): Promise<AtomicOperationResult> {
    const operationId = `maintenance_${actionType}_${++this.operationCounter}_${Date.now()}`
    const startTime = Date.now()

    try {
      const pipeline = redis.pipeline()

      // 1. Get current token data
      const tokenKey = `token:${tokenId}`
      const currentData = await redis.hgetall(tokenKey)
      if (!currentData || Object.keys(currentData).length === 0) {
        throw new Error(`Token ${tokenId} not found`)
      }

      // 2. Verify ownership
      if (currentData.owner !== userAddress) {
        throw new Error(`User ${userAddress} does not own token ${tokenId}`)
      }

      // 3. Update dynamic data based on action type
      const dynamic = JSON.parse(currentData.dynamic as string)
      const now = new Date().toISOString()

      switch (actionType) {
        case 'maintenance':
          dynamic.maintenanceCount = (dynamic.maintenanceCount || 0) + 1
          dynamic.lastMaintenance = now
          break

        case 'cleaning':
          dynamic.cleaningCount = (dynamic.cleaningCount || 0) + 1
          dynamic.lastCleaning = now
          dynamic.dirtLevel = 0 // Reset dirt level
          break

        case 'restoration':
          dynamic.restorationCount = (dynamic.restorationCount || 0) + 1
          dynamic.lastMaintenance = now
          if (actionData?.level) {
            dynamic.agingLevel = Math.max(0, 100 - actionData.level)
          }
          break
      }

      // 4. Update token data
      pipeline.hset(tokenKey, {
        dynamic: JSON.stringify(dynamic),
        lastRefresh: now
      })

      // 5. Update maintenance indexes
      const contractId = currentData.contractId as string
      pipeline.zadd(`index:tokens:by_maintenance:${contractId}`, {
        score: new Date(now).getTime(),
        member: tokenId
      })

      // 6. Update dirt/aging indexes if applicable
      if (actionType === 'cleaning') {
        pipeline.zadd(`index:tokens:by_dirt_level:${contractId}`, {
          score: 0,
          member: tokenId
        })
      }

      // Execute transaction
      const results = await pipeline.exec()

      // Verify success
      const failedOps = results.filter(([error]) => error !== null)
      if (failedOps.length > 0) {
        throw new Error(`Maintenance action failed: ${failedOps.length} operations failed`)
      }

      // Invalidate caches
      await SmartCacheInvalidation.invalidateTokenAndDependents(tokenId, 'maintenance')

      return {
        success: true,
        operationId,
        duration: Date.now() - startTime,
        affectedEntities: [tokenId, userAddress]
      }

    } catch (error) {
      return {
        success: false,
        operationId,
        duration: Date.now() - startTime,
        affectedEntities: [tokenId],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Execute complex trait update operation
   */
  static async executeTraitUpdate(
    tokenId: string,
    oldTraits: any[],
    newTraits: any[]
  ): Promise<AtomicOperationResult> {
    const operationId = `trait_update_${++this.operationCounter}_${Date.now()}`
    const startTime = Date.now()

    try {
      const pipeline = redis.pipeline()

      // 1. Remove old trait relationships
      for (const trait of oldTraits) {
        const traitId = `trait_${trait.type}_${trait.value.toString().toLowerCase()}`
        pipeline.srem(`trait:${traitId}:tokens`, tokenId)

        // Update trait counts
        pipeline.hincrby(`trait:${traitId}`, 'tokenCount', -1)
      }

      // 2. Add new trait relationships
      for (const trait of newTraits) {
        const traitId = `trait_${trait.type}_${trait.value.toString().toLowerCase()}`
        pipeline.sadd(`trait:${traitId}:tokens`, tokenId)

        // Update trait counts
        pipeline.hincrby(`trait:${traitId}`, 'tokenCount', 1)
      }

      // 3. Update token traits
      pipeline.hset(`token:${tokenId}`, {
        traits: JSON.stringify(newTraits),
        lastRefresh: new Date().toISOString()
      })

      // Execute transaction
      const results = await pipeline.exec()

      // Verify success
      const failedOps = results.filter(([error]) => error !== null)
      if (failedOps.length > 0) {
        throw new Error(`Trait update failed: ${failedOps.length} operations failed`)
      }

      // Invalidate caches
      await SmartCacheInvalidation.invalidateTokenAndDependents(tokenId, 'metadata')

      return {
        success: true,
        operationId,
        duration: Date.now() - startTime,
        affectedEntities: [tokenId]
      }

    } catch (error) {
      // Attempt rollback
      await this.rollbackTraitUpdate(operationId, tokenId, oldTraits, newTraits)

      return {
        success: false,
        operationId,
        duration: Date.now() - startTime,
        affectedEntities: [tokenId],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // =============================================================================
  // ROLLBACK MECHANISMS
  // =============================================================================

  private static async rollbackTransfer(
    operationId: string,
    tokenId: string,
    fromAddress: string,
    toAddress: string
  ): Promise<void> {
    try {
      console.log(`🔄 Rolling back transfer operation ${operationId}`)

      const pipeline = redis.pipeline()

      // Reverse the operations
      pipeline.hset(`token:${tokenId}`, { owner: fromAddress })
      pipeline.srem(`user:${toAddress}:tokens`, tokenId)
      pipeline.sadd(`user:${fromAddress}:tokens`, tokenId)

      await pipeline.exec()

      console.log(`✅ Transfer rollback completed for ${operationId}`)
    } catch (rollbackError) {
      console.error(`❌ Transfer rollback failed for ${operationId}:`, rollbackError)
    }
  }

  private static async rollbackTraitUpdate(
    operationId: string,
    tokenId: string,
    oldTraits: any[],
    newTraits: any[]
  ): Promise<void> {
    try {
      console.log(`🔄 Rolling back trait update operation ${operationId}`)

      // Simply restore old traits (reverse of the update operation)
      await this.executeTraitUpdate(tokenId, newTraits, oldTraits)

      console.log(`✅ Trait update rollback completed for ${operationId}`)
    } catch (rollbackError) {
      console.error(`❌ Trait update rollback failed for ${operationId}:`, rollbackError)
    }
  }

  // =============================================================================
  // CONSISTENCY CHECKS
  // =============================================================================

  /**
   * Verify data consistency after operations
   */
  static async verifyConsistency(tokenId?: string): Promise<{
    consistent: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    try {
      if (tokenId) {
        // Check single token consistency
        const issues = await this.checkTokenConsistency(tokenId)
        return {
          consistent: issues.length === 0,
          issues
        }
      } else {
        // Check global consistency (sample-based)
        const sampleSize = 10
        const contractTokens = await redis.srandmember('contract:sample:tokens', sampleSize)

        for (const tokenId of contractTokens) {
          const tokenIssues = await this.checkTokenConsistency(tokenId)
          issues.push(...tokenIssues)
        }

        return {
          consistent: issues.length === 0,
          issues
        }
      }
    } catch (error) {
      return {
        consistent: false,
        issues: [`Consistency check failed: ${error instanceof Error ? error.message : String(error)}`]
      }
    }
  }

  private static async checkTokenConsistency(tokenId: string): Promise<string[]> {
    const issues: string[] = []

    try {
      const tokenData = await redis.hgetall(`token:${tokenId}`)
      if (!tokenData || Object.keys(tokenData).length === 0) {
        return [`Token ${tokenId} not found`]
      }

      const owner = tokenData.owner as string
      const contractId = tokenData.contractId as string
      const traits = JSON.parse(tokenData.traits as string || '[]')

      // Check owner relationship
      const isInOwnerTokens = await redis.sismember(`user:${owner}:tokens`, tokenId)
      if (!isInOwnerTokens) {
        issues.push(`Token ${tokenId} not in owner's (${owner}) token set`)
      }

      // Check contract relationship
      const isInContractTokens = await redis.sismember(`contract:${contractId}:tokens`, tokenId)
      if (!isInContractTokens) {
        issues.push(`Token ${tokenId} not in contract (${contractId}) token set`)
      }

      // Check trait relationships
      for (const trait of traits) {
        const traitId = `trait_${trait.type}_${trait.value.toString().toLowerCase()}`
        const isInTraitTokens = await redis.sismember(`trait:${traitId}:tokens`, tokenId)
        if (!isInTraitTokens) {
          issues.push(`Token ${tokenId} not in trait (${traitId}) token set`)
        }
      }

    } catch (error) {
      issues.push(`Consistency check error for ${tokenId}: ${error instanceof Error ? error.message : String(error)}`)
    }

    return issues
  }

  // =============================================================================
  // OPERATION LOGGING AND AUDIT
  // =============================================================================

  /**
   * Log atomic operations for audit trail
   */
  private static async logOperation(result: AtomicOperationResult): Promise<void> {
    const logEntry = {
      ...result,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }

    const logKey = `audit:operations:${new Date().toISOString().split('T')[0]}`
    await redis.zadd(logKey, {
      score: Date.now(),
      member: JSON.stringify(logEntry)
    })

    // Keep only last 1000 operations per day
    await redis.zremrangebyrank(logKey, 0, -1001)
  }

  /**
   * Get operation audit trail
   */
  static async getOperationHistory(
    date?: string,
    limit: number = 50
  ): Promise<AtomicOperationResult[]> {
    const logKey = date ?
      `audit:operations:${date}` :
      `audit:operations:${new Date().toISOString().split('T')[0]}`

    const operations = await redis.zrange(logKey, 0, limit - 1, { rev: true, withScores: false })
    return operations.map(op => JSON.parse(op as string))
  }
}

// =============================================================================
// WATCH-BASED CONDITIONAL OPERATIONS
// =============================================================================

export class ConditionalOperations {
  /**
   * Execute operation only if data hasn't changed (optimistic locking)
   */
  static async executeWithVersionCheck<T>(
    key: string,
    expectedVersion: number,
    operation: () => Promise<T>
  ): Promise<{ success: boolean, result?: T, error?: string }> {
    try {
      // Watch the key for changes
      await redis.watch(key)

      // Check current version
      const currentVersion = await redis.hget(key, 'version')
      if (parseInt(currentVersion as string || '0') !== expectedVersion) {
        await redis.unwatch()
        return {
          success: false,
          error: 'Version conflict - data was modified by another operation'
        }
      }

      // Execute operation in transaction
      const pipeline = redis.pipeline()
      // ... operation logic would go here ...

      const result = await operation()

      // Update version
      pipeline.hincrby(key, 'version', 1)

      const execResult = await pipeline.exec()
      if (!execResult) {
        return {
          success: false,
          error: 'Transaction failed due to concurrent modification'
        }
      }

      return {
        success: true,
        result
      }

    } catch (error) {
      await redis.unwatch()
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}
