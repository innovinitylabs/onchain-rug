/**
 * Comprehensive Monitoring and Metrics System
 *
 * Tracks:
 * - Cache performance and hit rates
 * - Query performance and bottlenecks
 * - System health and error rates
 * - User behavior analytics
 * - Resource usage metrics
 */

import { redis } from './redis-schema'
import { MultiLevelCache } from './multi-level-cache'

export interface PerformanceMetrics {
  timestamp: number
  operation: string
  duration: number
  success: boolean
  metadata?: Record<string, any>
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  avgResponseTime: number
  memoryCacheSize: number
  redisCacheSize: number
}

export interface SystemHealth {
  redis: 'healthy' | 'degraded' | 'unavailable'
  memory: 'healthy' | 'degraded'
  overall: 'healthy' | 'degraded' | 'critical'
  uptime: number
  lastIncident?: string
}

export class MonitoringSystem {
  private static startTime = Date.now()

  // =============================================================================
  // PERFORMANCE TRACKING
  // =============================================================================

  /**
   * Track operation performance
   */
  static async trackPerformance(
    operation: string,
    duration: number,
    success: boolean = true,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      operation,
      duration,
      success,
      metadata
    }

    // Store in Redis for aggregation
    const key = `metrics:performance:${operation}`
    await redis.zadd(key, {
      score: Date.now(),
      member: JSON.stringify(metrics)
    })

    // Keep only last 1000 entries per operation
    await redis.zremrangebyrank(key, 0, -1001)

    // Track error rates
    if (!success) {
      await this.trackError(operation, metadata.error || 'Unknown error')
    }

    // Track slow operations
    if (duration > 1000) { // Operations taking > 1 second
      await this.trackSlowOperation(operation, duration, metadata)
    }
  }

  /**
   * Track errors with context
   */
  static async trackError(operation: string, error: string | Error, context?: any): Promise<void> {
    const errorData = {
      timestamp: Date.now(),
      operation,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context
    }

    const key = 'metrics:errors'
    await redis.zadd(key, {
      score: Date.now(),
      member: JSON.stringify(errorData)
    })

    // Keep only last 500 errors
    await redis.zremrangebyrank(key, 0, -501)

    // Update error rate counters
    const dateKey = new Date().toISOString().split('T')[0]
    await redis.hincrby(`metrics:error_rates:${dateKey}`, operation, 1)
  }

  /**
   * Track slow operations
   */
  private static async trackSlowOperation(
    operation: string,
    duration: number,
    metadata: any
  ): Promise<void> {
    const slowOp = {
      timestamp: Date.now(),
      operation,
      duration,
      metadata
    }

    const key = 'metrics:slow_operations'
    await redis.zadd(key, {
      score: duration,
      member: JSON.stringify(slowOp)
    })

    // Keep only top 100 slowest operations
    await redis.zremrangebyrank(key, 0, -101)
  }

  // =============================================================================
  // CACHE METRICS
  // =============================================================================

  /**
   * Get comprehensive cache metrics
   */
  static async getCacheMetrics(timeRangeHours: number = 24): Promise<CacheMetrics> {
    const cutoff = Date.now() - (timeRangeHours * 60 * 60 * 1000)

    // Get cache performance data
    const cacheData = await redis.hgetall('metrics:cache_performance')
    const hits = parseInt(cacheData?.hits as string || '0')
    const misses = parseInt(cacheData?.misses as string || '0')
    const totalTime = parseFloat(cacheData?.total_response_time as string || '0')

    // Calculate metrics
    const totalRequests = hits + misses
    const hitRate = totalRequests > 0 ? hits / totalRequests : 0
    const avgResponseTime = totalRequests > 0 ? totalTime / totalRequests : 0

    // Get cache sizes (approximate)
    const memoryStats = MultiLevelCache.getCacheStats()
    const redisCacheSize = await this.getRedisCacheSize()

    return {
      hits,
      misses,
      hitRate,
      avgResponseTime,
      memoryCacheSize: memoryStats.memoryCache.size,
      redisCacheSize
    }
  }

  /**
   * Get Redis cache size approximation
   */
  private static async getRedisCacheSize(): Promise<number> {
    try {
      // Count cache keys (this is expensive, use sparingly)
      const cacheKeys = await redis.keys('cache:*')
      return cacheKeys.length
    } catch (error) {
      console.warn('Failed to get Redis cache size:', error)
      return 0
    }
  }

  // =============================================================================
  // SYSTEM HEALTH MONITORING
  // =============================================================================

  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const health = await MultiLevelCache.healthCheck()

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy'
    let lastIncident: string | undefined

    // Check error rates
    const errorRate = await this.getErrorRate(1) // Last hour
    if (errorRate > 0.1) { // > 10% error rate
      overall = 'degraded'
    } else if (errorRate > 0.25) { // > 25% error rate
      overall = 'critical'
    }

    // Check cache performance
    const cacheMetrics = await this.getCacheMetrics(1)
    if (cacheMetrics.hitRate < 0.5) { // < 50% hit rate
      overall = overall === 'critical' ? 'critical' : 'degraded'
    }

    // Check for recent incidents
    const recentErrors = await redis.zrange('metrics:errors', -1, -1)
    if (recentErrors.length > 0) {
      const lastError = JSON.parse(recentErrors[0] as string)
      const errorTime = new Date(lastError.timestamp)
      const hoursSinceError = (Date.now() - errorTime.getTime()) / (1000 * 60 * 60)

      if (hoursSinceError < 1) {
        lastIncident = `Error ${hoursSinceError.toFixed(1)}h ago: ${lastError.error}`
        overall = overall === 'critical' ? 'critical' : 'degraded'
      }
    }

    return {
      redis: health.redisCache,
      memory: health.memoryCache,
      overall,
      uptime: Date.now() - this.startTime,
      lastIncident
    }
  }

  /**
   * Get error rate for time period
   */
  private static async getErrorRate(hours: number): Promise<number> {
    const dateKey = new Date().toISOString().split('T')[0]
    const errorCounts = await redis.hgetall(`metrics:error_rates:${dateKey}`)

    const totalErrors = Object.values(errorCounts).reduce((sum: number, count: unknown): number =>
      sum + parseInt(count as string, 10), 0) as number

    // Estimate total operations (rough approximation)
    const totalOperations: number = Number(await this.getEstimatedOperationCount(hours))

    return totalOperations > 0 ? totalErrors / totalOperations : 0
  }

  /**
   * Get estimated operation count
   */
  private static async getEstimatedOperationCount(hours: number): Promise<number> {
    // This would need to track total operations
    // For now, return a placeholder
    return 1000 // Placeholder
  }

  // =============================================================================
  // USER BEHAVIOR ANALYTICS
  // =============================================================================

  /**
   * Track user behavior patterns
   */
  static async trackUserBehavior(
    userAddress: string,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const behavior = {
      timestamp: Date.now(),
      userAddress,
      action,
      metadata
    }

    // Store user behavior
    const userKey = `analytics:user_behavior:${userAddress}`
    await redis.zadd(userKey, {
      score: Date.now(),
      member: JSON.stringify(behavior)
    })

    // Keep only last 100 actions per user
    await redis.zremrangebyrank(userKey, 0, -101)

    // Track global behavior patterns
    const globalKey = 'analytics:behavior_patterns'
    await redis.zincrby(globalKey, 1, action)

    // Track session data
    const sessionKey = `session:${userAddress}:${new Date().toISOString().split('T')[0]}`
    await redis.hincrby(sessionKey, action, 1)
    await redis.expire(sessionKey, 86400 * 7) // Expire after 7 days
  }

  /**
   * Get user behavior insights
   */
  static async getUserInsights(userAddress: string): Promise<{
    totalActions: number
    favoriteActions: string[]
    sessionCount: number
    lastActivity: number
  }> {
    const userKey = `analytics:user_behavior:${userAddress}`

    // Get user's actions
    const actions = await redis.zrange(userKey, 0, -1, { withScores: false })
    const parsedActions = actions.map(a => JSON.parse(a as string))

    // Count actions by type
    const actionCounts: Record<string, number> = {}
    parsedActions.forEach(action => {
      actionCounts[action.action] = (actionCounts[action.action] || 0) + 1
    })

    const favoriteActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action]) => action)

    return {
      totalActions: parsedActions.length,
      favoriteActions,
      sessionCount: 1, // Would need to track sessions properly
      lastActivity: parsedActions.length > 0 ?
        Math.max(...parsedActions.map(a => a.timestamp)) : 0
    }
  }

  // =============================================================================
  // PERFORMANCE ANALYSIS
  // =============================================================================

  /**
   * Get performance bottlenecks
   */
  static async getPerformanceBottlenecks(): Promise<{
    slowOperations: Array<{ operation: string, avgDuration: number, count: number }>
    errorProneOperations: Array<{ operation: string, errorRate: number }>
    cacheInefficiencies: Array<{ cacheType: string, issue: string }>
  }> {
    // Get slow operations
    const slowOps = await redis.zrange('metrics:slow_operations', 0, 9, { rev: true, withScores: true })
    const slowOperations = slowOps.map(([data, score]) => {
      const op = JSON.parse(data as string)
      return {
        operation: op.operation,
        avgDuration: parseFloat(score),
        count: 1
      }
    })

    // Get error-prone operations
    const errorRates = await redis.hgetall(`metrics:error_rates:${new Date().toISOString().split('T')[0]}`)
    const errorProneOperations = Object.entries(errorRates).map(([operation, count]) => ({
      operation,
      errorRate: parseInt(count as string) / 1000 // Rough approximation
    })).sort((a, b) => b.errorRate - a.errorRate).slice(0, 5)

    // Check cache inefficiencies
    const cacheMetrics = await this.getCacheMetrics()
    const cacheInefficiencies = []

    if (cacheMetrics.hitRate < 0.7) {
      cacheInefficiencies.push({
        cacheType: 'overall',
        issue: `Low hit rate: ${(cacheMetrics.hitRate * 100).toFixed(1)}%`
      })
    }

    if (cacheMetrics.avgResponseTime > 200) {
      cacheInefficiencies.push({
        cacheType: 'response_time',
        issue: `Slow responses: ${cacheMetrics.avgResponseTime.toFixed(0)}ms avg`
      })
    }

    return {
      slowOperations,
      errorProneOperations,
      cacheInefficiencies
    }
  }

  // =============================================================================
  // ALERTING AND NOTIFICATIONS
  // =============================================================================

  /**
   * Check for alert conditions
   */
  static async checkAlerts(): Promise<Array<{
    level: 'warning' | 'error' | 'critical'
    message: string
    metric: string
    value: number
    threshold: number
  }>> {
    const alerts: Array<{
      level: 'warning' | 'error' | 'critical'
      message: string
      metric: string
      value: number
      threshold: number
    }> = []

    // Check cache hit rate
    const cacheMetrics = await this.getCacheMetrics(1)
    if (cacheMetrics.hitRate < 0.5) {
      alerts.push({
        level: 'warning',
        message: 'Cache hit rate is below acceptable threshold',
        metric: 'cache_hit_rate',
        value: cacheMetrics.hitRate,
        threshold: 0.5
      })
    }

    // Check error rate
    const errorRate = await this.getErrorRate(1)
    if (errorRate > 0.1) {
      alerts.push({
        level: 'error',
        message: 'Error rate is above acceptable threshold',
        metric: 'error_rate',
        value: errorRate,
        threshold: 0.1
      })
    }

    // Check response time
    if (cacheMetrics.avgResponseTime > 1000) {
      alerts.push({
        level: 'warning',
        message: 'Average response time is too high',
        metric: 'avg_response_time',
        value: cacheMetrics.avgResponseTime,
        threshold: 1000
      })
    }

    return alerts
  }

  // =============================================================================
  // METRICS DASHBOARD DATA
  // =============================================================================

  /**
   * Get dashboard data for monitoring UI
   */
  static async getDashboardData(): Promise<{
    health: SystemHealth
    performance: {
      cacheMetrics: CacheMetrics
      bottlenecks: any
    }
    alerts: any[]
    recentActivity: any[]
  }> {
    const [health, cacheMetrics, bottlenecks, alerts] = await Promise.all([
      this.getSystemHealth(),
      this.getCacheMetrics(),
      this.getPerformanceBottlenecks(),
      this.checkAlerts()
    ])

    // Get recent activity (last 10 errors/operations)
    const recentErrors = await redis.zrange('metrics:errors', 0, 9, { rev: true, withScores: false })
    const recentActivity = recentErrors.map(error => JSON.parse(error as string))

    return {
      health,
      performance: {
        cacheMetrics,
        bottlenecks
      },
      alerts,
      recentActivity
    }
  }

  // =============================================================================
  // CLEANUP AND MAINTENANCE
  // =============================================================================

  /**
   * Clean up old metrics data
   */
  static async cleanupOldMetrics(retentionDays: number = 30): Promise<void> {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)

    // Clean up old performance data
    const perfKeys = await redis.keys('metrics:performance:*')
    for (const key of perfKeys) {
      await redis.zremrangebyscore(key, 0, cutoff)
    }

    // Clean up old error data
    await redis.zremrangebyscore('metrics:errors', 0, cutoff)
    await redis.zremrangebyscore('metrics:slow_operations', 0, cutoff)

    // Clean up old error rates (keep only last 7 days)
    const errorRateKeys = await redis.keys('metrics:error_rates:*')
    const keepKeys = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      keepKeys.push(`metrics:error_rates:${date.toISOString().split('T')[0]}`)
    }

    for (const key of errorRateKeys) {
      if (!keepKeys.includes(key)) {
        await redis.del(key)
      }
    }
  }
}

// =============================================================================
// PERFORMANCE DECORATOR
// =============================================================================

/**
 * Decorator to automatically track method performance
 */
export function trackPerformance(operation?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      const opName = operation || `${target.constructor.name}.${propertyKey}`

      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime

        await MonitoringSystem.trackPerformance(opName, duration, true)
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        await MonitoringSystem.trackPerformance(opName, duration, false, { error: error.message })
        throw error
      }
    }

    return descriptor
  }
}
