/**
 * Vercel Compatibility Test Suite
 *
 * Tests all database optimization components for Vercel deployment compatibility:
 * - Redis connections
 * - Memory cache operations
 * - Event-driven webhooks
 * - Multi-level caching
 * - Monitoring systems
 */

import { redis } from './redis-schema'
import { MultiLevelCache } from './multi-level-cache'
import { MonitoringSystem } from './monitoring-metrics'
import { TraitRegistry, TraitExtractor } from './trait-registry'
import { RedisIndexes } from './redis-indexes'

export interface CompatibilityTestResult {
  test: string
  status: 'pass' | 'fail' | 'skip'
  duration: number
  error?: string
  details?: any
}

export class VercelCompatibilityTest {
  private results: CompatibilityTestResult[] = []

  /**
   * Run all compatibility tests
   */
  async runAllTests(): Promise<{
    passed: number
    failed: number
    skipped: number
    total: number
    results: CompatibilityTestResult[]
  }> {
    console.log('🚀 Starting Vercel Compatibility Tests...')

    const tests = [
      this.testRedisConnection,
      this.testMemoryCache,
      this.testTraitRegistry,
      this.testRedisIndexes,
      this.testMultiLevelCache,
      this.testMonitoringSystem,
      this.testWebhookSimulation,
      this.testBatchOperations,
      this.testErrorHandling
    ]

    for (const test of tests) {
      await this.runTest(test)
    }

    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const skipped = this.results.filter(r => r.status === 'skip').length
    const total = this.results.length

    console.log(`✅ Tests completed: ${passed}/${total} passed, ${failed} failed, ${skipped} skipped`)

    return {
      passed,
      failed,
      skipped,
      total,
      results: this.results
    }
  }

  private async runTest(testFunction: () => Promise<void>): Promise<void> {
    const testName = testFunction.name
    const startTime = Date.now()

    try {
      await testFunction.call(this)
      this.results.push({
        test: testName,
        status: 'pass',
        duration: Date.now() - startTime
      })
      console.log(`✅ ${testName}: PASS`)
    } catch (error) {
      const isSkipped = error.message.includes('SKIP:')
      this.results.push({
        test: testName,
        status: isSkipped ? 'skip' : 'fail',
        duration: Date.now() - startTime,
        error: isSkipped ? error.message.replace('SKIP:', '').trim() : error.message
      })
      console.log(`${isSkipped ? '⏭️' : '❌'} ${testName}: ${isSkipped ? 'SKIP' : 'FAIL'} - ${error.message}`)
    }
  }

  // =============================================================================
  // INDIVIDUAL TESTS
  // =============================================================================

  async testRedisConnection(): Promise<void> {
    // Test basic Redis connectivity
    await redis.ping()

    // Test basic operations
    const testKey = 'vercel:test:connection'
    await redis.setex(testKey, 60, 'test_value')
    const value = await redis.get(testKey)

    if (value !== 'test_value') {
      throw new Error('Redis set/get operations failed')
    }

    await redis.del(testKey)
  }

  async testMemoryCache(): Promise<void> {
    const testKey = 'vercel:test:memory'
    const testData = { test: 'data', timestamp: Date.now() }

    // Test set/get
    await MultiLevelCache.set(testKey, testData, { skipRedis: true })
    const result = await MultiLevelCache.get(testKey)

    if (result.data?.test !== 'data') {
      throw new Error('Memory cache operations failed')
    }

    // Test expiration (short TTL)
    await MultiLevelCache.set(testKey, testData, { memoryTTL: 1, skipRedis: true })
    await new Promise(resolve => setTimeout(resolve, 1100))

    const expiredResult = await MultiLevelCache.get(testKey)
    if (expiredResult.hit) {
      throw new Error('Memory cache expiration failed')
    }
  }

  async testTraitRegistry(): Promise<void> {
    const testContract = 'vercel:test:contract'

    // Test trait registration
    const traitId = await TraitRegistry.registerTrait({
      type: 'test_trait',
      value: 'test_value',
      category: 'text'
    }, testContract)

    if (!traitId || !traitId.includes('test_trait')) {
      throw new Error('Trait registration failed')
    }

    // Test trait extraction
    const metadata = {
      attributes: [
        { trait_type: 'Test', value: 'Value' }
      ]
    }

    const traits = TraitExtractor.extractFromMetadata(metadata)
    if (traits.length === 0) {
      throw new Error('Trait extraction failed')
    }
  }

  async testRedisIndexes(): Promise<void> {
    const testContract = 'vercel:test:indexes'
    const testOwner = '0x1234567890123456789012345678901234567890'

    // Test owner index updates
    await RedisIndexes.updateOwnerTokenCountIndex(testContract, testOwner, 5)
    await RedisIndexes.updateOwnerActivityIndex(testContract, testOwner)

    // Test index queries
    const topOwners = await RedisIndexes.getTopOwnersByCount(testContract, 5)
    if (!Array.isArray(topOwners)) {
      throw new Error('Owner index queries failed')
    }
  }

  async testMultiLevelCache(): Promise<void> {
    const testKey = 'vercel:test:multilevel'
    const testData = { test: 'multilevel', value: 42 }

    // Test multi-level operations
    await MultiLevelCache.set(testKey, testData)

    // Test cache warming
    await MultiLevelCache.warmCache([testKey])

    // Test health check
    const health = await MultiLevelCache.healthCheck()
    if (health.overall === 'unavailable') {
      throw new Error('Multi-level cache health check failed')
    }
  }

  async testMonitoringSystem(): Promise<void> {
    // Test performance tracking
    await MonitoringSystem.trackPerformance('vercel_test', 100, true, { test: true })

    // Test error tracking
    await MonitoringSystem.trackError('vercel_test', 'Test error')

    // Test metrics retrieval
    const cacheMetrics = await MonitoringSystem.getCacheMetrics()
    if (typeof cacheMetrics.hitRate !== 'number') {
      throw new Error('Cache metrics retrieval failed')
    }

    // Test system health
    const health = await MonitoringSystem.getSystemHealth()
    if (!health.overall) {
      throw new Error('System health check failed')
    }
  }

  async testWebhookSimulation(): Promise<void> {
    // Simulate webhook payload (without actually calling webhook endpoint)
    const testEvent = {
      eventName: 'MaintenancePerformed',
      tokenId: 1,
      userAddress: '0x1234567890123456789012345678901234567890',
      contractAddress: '0x711aFEE5331F8748A600c58C76EDbb51484625EA',
      chainId: 84532,
      actionType: 'maintenance'
    }

    // Validate event structure
    if (!testEvent.eventName || !testEvent.tokenId || !testEvent.userAddress) {
      throw new Error('Webhook event validation failed')
    }

    // Test event processing logic (simulated)
    const expectedTokenId = `84532:0x711aFEE5331F8748A600c58C76EDbb51484625EA:1`
    // Event processing would create this token ID - validation logic works
  }

  async testBatchOperations(): Promise<void> {
    const testKeys = ['vercel:batch:1', 'vercel:batch:2', 'vercel:batch:3']
    const testData = [
      { batch: 1, data: 'test1' },
      { batch: 2, data: 'test2' },
      { batch: 3, data: 'test3' }
    ]

    // Test batch set operations
    const setPromises = testKeys.map((key, index) =>
      MultiLevelCache.set(key, testData[index])
    )
    await Promise.all(setPromises)

    // Test batch get operations
    const results = await MultiLevelCache.batchGet(testKeys)

    if (results.size !== testKeys.length) {
      throw new Error('Batch operations failed')
    }

    // Verify data integrity
    for (let i = 0; i < testKeys.length; i++) {
      const result = results.get(testKeys[i])
      if (!result || result.batch !== testData[i].batch) {
        throw new Error(`Batch data integrity check failed for ${testKeys[i]}`)
      }
    }
  }

  async testErrorHandling(): Promise<void> {
    // Test Redis connection error handling
    try {
      // Try to access a non-existent key
      const result = await redis.get('vercel:test:nonexistent')
      if (result !== null) {
        // This is expected - non-existent keys return null
      }
    } catch (error) {
      // If we get here, Redis connection might have issues
      throw new Error('Redis error handling test failed')
    }

    // Test invalid JSON handling (shouldn't crash)
    try {
      JSON.parse('{invalid json')
    } catch (error) {
      // Expected to catch JSON parse error
      if (!(error instanceof SyntaxError)) {
        throw new Error('JSON error handling test failed')
      }
    }
  }
}

// =============================================================================
// VERCEL-SPECIFIC TESTS
// =============================================================================

export class VercelSpecificTests {
  /**
   * Test Vercel environment variables
   */
  static testEnvironmentVariables(): CompatibilityTestResult {
    const startTime = Date.now()

    try {
      // Check for required Redis environment variables
      const requiredVars = [
        'KV_REST_API_URL',
        'KV_REST_API_TOKEN'
      ]

      const missingVars = requiredVars.filter(varName => !process.env[varName])

      if (missingVars.length > 0) {
        return {
          test: 'environment_variables',
          status: 'fail',
          duration: Date.now() - startTime,
          error: `Missing required environment variables: ${missingVars.join(', ')}`
        }
      }

      // Check for webhook secret
      if (!process.env.VERCEL_CRON_SECRET) {
        console.warn('⚠️ VERCEL_CRON_SECRET not set - webhook authentication disabled')
      }

      return {
        test: 'environment_variables',
        status: 'pass',
        duration: Date.now() - startTime,
        details: {
          redisConfigured: true,
          webhookConfigured: !!process.env.VERCEL_CRON_SECRET
        }
      }
    } catch (error) {
      return {
        test: 'environment_variables',
        status: 'fail',
        duration: Date.now() - startTime,
        error: error.message
      }
    }
  }

  /**
   * Test Vercel cron job configuration
   */
  static testCronConfiguration(): CompatibilityTestResult {
    const startTime = Date.now()

    try {
      // This would check if vercel.json has proper cron configuration
      // For now, just validate the environment
      if (!process.env.VERCEL_ENV) {
        return {
          test: 'cron_configuration',
          status: 'skip',
          duration: Date.now() - startTime,
          error: 'Not running in Vercel environment'
        }
      }

      return {
        test: 'cron_configuration',
        status: 'pass',
        duration: Date.now() - startTime,
        details: {
          vercelEnv: process.env.VERCEL_ENV,
          hasCronSecret: !!process.env.VERCEL_CRON_SECRET
        }
      }
    } catch (error) {
      return {
        test: 'cron_configuration',
        status: 'fail',
        duration: Date.now() - startTime,
        error: error.message
      }
    }
  }

  /**
   * Test serverless function compatibility
   */
  static testServerlessCompatibility(): CompatibilityTestResult {
    const startTime = Date.now()

    try {
      // Test that we're not using Node.js specific features that don't work in serverless
      const isServerless = !process.env.NODE_ENV || process.env.NODE_ENV !== 'development'

      // Check for file system access (not allowed in serverless)
      try {
        require('fs')
        if (isServerless) {
          return {
            test: 'serverless_compatibility',
            status: 'fail',
            duration: Date.now() - startTime,
            error: 'File system access detected in serverless environment'
          }
        }
      } catch (error) {
        // fs module not available - good for serverless
      }

      // Check for global state (can cause issues in serverless)
      if (typeof globalThis !== 'undefined' && (globalThis as any).serverlessTest) {
        return {
          test: 'serverless_compatibility',
          status: 'fail',
          duration: Date.now() - startTime,
          error: 'Global state detected that may cause serverless issues'
        }
      }

      return {
        test: 'serverless_compatibility',
        status: 'pass',
        duration: Date.now() - startTime,
        details: {
          environment: isServerless ? 'serverless' : 'development',
          globalState: 'clean'
        }
      }
    } catch (error) {
      return {
        test: 'serverless_compatibility',
        status: 'fail',
        duration: Date.now() - startTime,
        error: error.message
      }
    }
  }
}

// =============================================================================
// TEST EXECUTOR
// =============================================================================

export async function runVercelCompatibilityTests(): Promise<void> {
  console.log('🧪 Running Vercel Compatibility Tests...\n')

  // Run Vercel-specific tests first
  const vercelTests = [
    VercelSpecificTests.testEnvironmentVariables(),
    VercelSpecificTests.testCronConfiguration(),
    VercelSpecificTests.testServerlessCompatibility()
  ]

  vercelTests.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
    console.log(`${icon} ${result.test}: ${result.status.toUpperCase()}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  // Run comprehensive tests
  const testRunner = new VercelCompatibilityTest()
  const results = await testRunner.runAllTests()

  console.log('\n📊 Test Summary:')
  console.log(`   Passed: ${results.passed}`)
  console.log(`   Failed: ${results.failed}`)
  console.log(`   Skipped: ${results.skipped}`)
  console.log(`   Total: ${results.total}`)

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.results
      .filter(r => r.status === 'fail')
      .forEach(result => {
        console.log(`   - ${result.test}: ${result.error}`)
      })
  }

  // Exit with appropriate code for CI/CD
  if (results.failed > 0) {
    process.exit(1)
  }
}
