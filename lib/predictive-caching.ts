/**
 * Predictive Caching Based on User Behavior
 *
 * Analyzes user behavior patterns to predict and pre-load frequently accessed data:
 * - User session analysis
 * - Behavioral pattern recognition
 * - Collaborative filtering
 * - Trend-based predictions
 */

import { redis } from './redis-schema'
import { MultiLevelCache } from './multi-level-cache'
import { MonitoringSystem } from './monitoring-metrics'

export interface UserBehavior {
  userAddress: string
  actions: Array<{
    action: string
    timestamp: number
    metadata?: any
  }>
  sessionStart: number
  currentSession: string
}

export interface PredictionResult {
  predictedTokens: string[]
  confidence: number
  reasoning: string
}

export class PredictiveCaching {
  /**
   * Analyze user behavior and generate cache predictions
   */
  static async analyzeUserBehavior(userAddress: string): Promise<UserBehavior> {
    const behaviorKey = `analytics:user_behavior:${userAddress}`

    // Get user's recent actions
    const actions = await redis.zrevrange(behaviorKey, 0, 49, { withScores: true }) // Last 50 actions
    const parsedActions = actions.map(([data, score]) => ({
      ...JSON.parse(data as string),
      timestamp: parseFloat(score)
    }))

    // Determine session start (actions within 30 minutes)
    const now = Date.now()
    const recentActions = parsedActions.filter(action =>
      now - action.timestamp < 30 * 60 * 1000
    )

    const sessionStart = recentActions.length > 0 ?
      Math.min(...recentActions.map(a => a.timestamp)) : now

    return {
      userAddress,
      actions: parsedActions,
      sessionStart,
      currentSession: `session:${userAddress}:${Math.floor(sessionStart / (24 * 60 * 60 * 1000))}`
    }
  }

  /**
   * Generate predictions for what the user might access next
   */
  static async generatePredictions(userAddress: string): Promise<PredictionResult> {
    const behavior = await this.analyzeUserBehavior(userAddress)

    if (behavior.actions.length === 0) {
      return {
        predictedTokens: [],
        confidence: 0,
        reasoning: 'No user behavior data available'
      }
    }

    // Analyze patterns
    const patterns = this.analyzePatterns(behavior.actions)

    // Generate predictions based on patterns
    const predictions = await this.predictFromPatterns(patterns, userAddress)

    return {
      predictedTokens: predictions.tokens,
      confidence: predictions.confidence,
      reasoning: predictions.reasoning
    }
  }

  /**
   * Pre-warm cache with predicted data
   */
  static async warmPredictedCache(userAddress: string): Promise<void> {
    const predictions = await this.generatePredictions(userAddress)

    if (predictions.confidence > 0.3 && predictions.predictedTokens.length > 0) {
      console.log(`🔮 Warming cache for ${userAddress}: ${predictions.predictedTokens.length} tokens (confidence: ${(predictions.confidence * 100).toFixed(1)}%)`)

      await MultiLevelCache.warmCache(predictions.predictedTokens, 'conservative')

      // Track prediction accuracy for future improvement
      await this.trackPrediction(predictions, userAddress)
    }
  }

  // =============================================================================
  // PATTERN ANALYSIS
  // =============================================================================

  private static analyzePatterns(actions: UserBehavior['actions']): {
    tokenViews: string[]
    traitFilters: Record<string, number>
    timePatterns: Record<string, number>
    sequences: string[][]
  } {
    const tokenViews: string[] = []
    const traitFilters: Record<string, number> = {}
    const timePatterns: Record<string, number> = {}
    const sequences: string[][] = []

    for (const action of actions) {
      // Track token views
      if (action.action === 'view_token' && action.metadata?.tokenId) {
        tokenViews.push(action.metadata.tokenId)
      }

      // Track trait filtering
      if (action.action === 'filter_by_trait' && action.metadata?.trait) {
        traitFilters[action.metadata.trait] = (traitFilters[action.metadata.trait] || 0) + 1
      }

      // Track time patterns
      const hour = new Date(action.timestamp).getHours()
      timePatterns[hour.toString()] = (timePatterns[hour.toString()] || 0) + 1

      // Build action sequences (last 5 actions)
      sequences.push(actions.slice(-5).map(a => a.action))
    }

    return {
      tokenViews: [...new Set(tokenViews)], // Unique tokens
      traitFilters,
      timePatterns,
      sequences
    }
  }

  private static async predictFromPatterns(
    patterns: ReturnType<typeof PredictiveCaching.analyzePatterns>,
    userAddress: string
  ): Promise<{
    tokens: string[]
    confidence: number
    reasoning: string
  }> {
    const predictions: string[] = []
    let confidence = 0
    const reasons: string[] = []

    // 1. Recently viewed tokens (high confidence)
    if (patterns.tokenViews.length > 0) {
      predictions.push(...patterns.tokenViews.slice(0, 3))
      confidence += 0.4
      reasons.push('recently viewed tokens')
    }

    // 2. Tokens owned by the user (very high confidence)
    const ownedTokens = await this.getUserOwnedTokens(userAddress)
    if (ownedTokens.length > 0) {
      predictions.push(...ownedTokens.slice(0, 5))
      confidence += 0.6
      reasons.push('user-owned tokens')
    }

    // 3. Popular tokens among similar users (medium confidence)
    const similarUserTokens = await this.getSimilarUserTokens(userAddress, patterns.traitFilters)
    if (similarUserTokens.length > 0) {
      predictions.push(...similarUserTokens.slice(0, 2))
      confidence += 0.2
      reasons.push('tokens popular among similar users')
    }

    // 4. Trending tokens (low-medium confidence)
    const trendingTokens = await this.getTrendingTokens()
    if (trendingTokens.length > 0) {
      predictions.push(...trendingTokens.slice(0, 2))
      confidence += 0.1
      reasons.push('currently trending tokens')
    }

    // Remove duplicates and limit
    const uniquePredictions = [...new Set(predictions)].slice(0, 10)

    return {
      tokens: uniquePredictions,
      confidence: Math.min(confidence, 1.0),
      reasoning: reasons.join(', ')
    }
  }

  // =============================================================================
  // PREDICTION HELPERS
  // =============================================================================

  private static async getUserOwnedTokens(userAddress: string): Promise<string[]> {
    try {
      const userTokensKey = `user:${userAddress}:tokens`
      return await redis.smembers(userTokensKey)
    } catch (error) {
      console.warn('Failed to get user owned tokens:', error)
      return []
    }
  }

  private static async getSimilarUserTokens(
    userAddress: string,
    traitFilters: Record<string, number>
  ): Promise<string[]> {
    // Find users with similar trait preferences
    const similarTokens: string[] = []

    try {
      // This is a simplified implementation
      // In production, you'd use more sophisticated similarity algorithms
      const popularTraits = Object.entries(traitFilters)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([trait]) => trait)

      for (const trait of popularTraits) {
        const traitTokens = await redis.smembers(`trait:${trait}:tokens`)
        similarTokens.push(...traitTokens.slice(0, 3))
      }
    } catch (error) {
      console.warn('Failed to get similar user tokens:', error)
    }

    return [...new Set(similarTokens)].slice(0, 5)
  }

  private static async getTrendingTokens(): Promise<string[]> {
    try {
      // Get tokens with recent activity
      const trendingKey = 'analytics:trending:tokens'
      return await redis.zrevrange(trendingKey, 0, 4)
    } catch (error) {
      console.warn('Failed to get trending tokens:', error)
      return []
    }
  }

  private static async trackPrediction(
    prediction: PredictionResult,
    userAddress: string
  ): Promise<void> {
    // Track prediction for accuracy measurement
    const trackingKey = `analytics:predictions:${userAddress}`
    await redis.zadd(trackingKey, {
      score: Date.now(),
      member: JSON.stringify({
        tokens: prediction.predictedTokens,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        tracked: false // Will be marked as accurate when user actually views predicted tokens
      })
    })

    // Keep only last 20 predictions per user
    await redis.zremrangebyrank(trackingKey, 0, -21)
  }

  // =============================================================================
  // PREDICTION ACCURACY TRACKING
  // =============================================================================

  /**
   * Track when predicted tokens are actually accessed
   */
  static async trackPredictionAccuracy(
    userAddress: string,
    accessedToken: string
  ): Promise<void> {
    const trackingKey = `analytics:predictions:${userAddress}`

    // Get recent predictions
    const predictions = await redis.zrevrange(trackingKey, 0, 9, { withScores: false })
    const parsedPredictions = predictions.map(p => JSON.parse(p as string))

    // Mark matching predictions as accurate
    for (const prediction of parsedPredictions) {
      if (prediction.tokens.includes(accessedToken) && !prediction.tracked) {
        prediction.tracked = true
        prediction.accuracy = true

        // Update the prediction record
        await redis.zadd(trackingKey, {
          score: Date.now(),
          member: JSON.stringify(prediction)
        })

        break // Only mark one prediction per access
      }
    }
  }

  /**
   * Get prediction accuracy statistics
   */
  static async getPredictionStats(userAddress?: string): Promise<{
    overallAccuracy: number
    totalPredictions: number
    accuratePredictions: number
    averageConfidence: number
  }> {
    let predictions: any[] = []

    if (userAddress) {
      // Get user's predictions
      const trackingKey = `analytics:predictions:${userAddress}`
      const userPredictions = await redis.zrange(trackingKey, 0, -1)
      predictions = userPredictions.map(p => JSON.parse(p as string))
    } else {
      // Get all users' predictions (expensive operation)
      const allKeys = await redis.keys('analytics:predictions:*')
      for (const key of allKeys.slice(0, 10)) { // Limit for performance
        const userPredictions = await redis.zrange(key, 0, -1)
        predictions.push(...userPredictions.map(p => JSON.parse(p as string)))
      }
    }

    const trackedPredictions = predictions.filter(p => p.tracked)
    const accuratePredictions = trackedPredictions.filter(p => p.accuracy).length
    const totalTracked = trackedPredictions.length

    return {
      overallAccuracy: totalTracked > 0 ? accuratePredictions / totalTracked : 0,
      totalPredictions: predictions.length,
      accuratePredictions,
      averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    }
  }
}

// =============================================================================
// SESSION-BASED PREDICTIONS
// =============================================================================

export class SessionBasedPredictions {
  /**
   * Track user session behavior
   */
  static async startUserSession(userAddress: string): Promise<string> {
    const sessionId = `session:${userAddress}:${Date.now()}`
    const sessionKey = `session:active:${userAddress}`

    await redis.setex(sessionKey, 3600, sessionId) // 1 hour session

    // Initialize session analytics
    await redis.hset(`analytics:session:${sessionId}`, {
      startTime: Date.now(),
      actions: 0,
      tokensViewed: 0,
      filtersUsed: 0
    })

    return sessionId
  }

  /**
   * Update session with user action
   */
  static async updateSession(sessionId: string, action: string, metadata?: any): Promise<void> {
    const sessionKey = `analytics:session:${sessionId}`

    // Update session stats
    await redis.hincrby(sessionKey, 'actions', 1)

    if (action === 'view_token') {
      await redis.hincrby(sessionKey, 'tokensViewed', 1)
    }

    if (action.includes('filter')) {
      await redis.hincrby(sessionKey, 'filtersUsed', 1)
    }

    // Store action sequence for pattern analysis
    const sequenceKey = `session:sequence:${sessionId}`
    await redis.rpush(sequenceKey, JSON.stringify({ action, metadata, timestamp: Date.now() }))

    // Keep only last 20 actions
    await redis.ltrim(sequenceKey, -20, -1)
  }

  /**
   * Generate session-based predictions
   */
  static async predictFromSession(sessionId: string): Promise<string[]> {
    const sequenceKey = `session:sequence:${sessionId}`
    const actions = await redis.lrange(sequenceKey, 0, -1)

    if (actions.length < 3) return []

    const parsedActions = actions.map(a => JSON.parse(a as string))

    // Simple pattern: if user viewed tokens A, B, C, predict similar tokens
    const viewedTokens = parsedActions
      .filter(a => a.action === 'view_token')
      .map(a => a.metadata?.tokenId)
      .filter(Boolean)

    // Find tokens similar to recently viewed ones
    const similarTokens: string[] = []
    for (const tokenId of viewedTokens.slice(-2)) { // Last 2 viewed tokens
      const similar = await this.findSimilarTokens(tokenId)
      similarTokens.push(...similar)
    }

    return [...new Set(similarTokens)].slice(0, 5)
  }

  private static async findSimilarTokens(tokenId: string): Promise<string[]> {
    // Find tokens with similar traits
    try {
      const tokenTraits = await redis.smembers(`token:${tokenId}:traits`)
      const similarTokens: string[] = []

      for (const traitId of tokenTraits.slice(0, 2)) { // Use first 2 traits
        const traitTokens = await redis.smembers(`trait:${traitId}:tokens`)
        similarTokens.push(...traitTokens.filter(t => t !== tokenId))
      }

      return [...new Set(similarTokens)].slice(0, 3)
    } catch (error) {
      console.warn('Failed to find similar tokens:', error)
      return []
    }
  }
}
