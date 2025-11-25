/**
 * Event-Driven Webhook for NFT Maintenance Actions
 *
 * Receives real-time notifications when users perform maintenance actions
 * and immediately updates the NFT cache, eliminating 24-hour cron delays.
 *
 * Expected payload from contract events:
 * - MaintenancePerformed(tokenId, userAddress, actionType)
 * - CleaningPerformed(tokenId, userAddress)
 * - RestorationPerformed(tokenId, userAddress, level)
 */

import { NextRequest, NextResponse } from 'next/server'
import { TokenOperations, UserOperations, CacheOperations, AnalyticsOperations } from '@/lib/redis-operations'
import { makeTokenId, redis } from '@/lib/redis-schema'

// Supported maintenance event types
const MAINTENANCE_EVENTS = {
  MAINTENANCE_PERFORMED: 'MaintenancePerformed',
  CLEANING_PERFORMED: 'CleaningPerformed',
  RESTORATION_PERFORMED: 'RestorationPerformed',
  TRANSFER: 'Transfer' // For ownership changes
} as const

interface MaintenanceEvent {
  eventName: keyof typeof MAINTENANCE_EVENTS
  tokenId: number
  userAddress: string
  contractAddress: string
  chainId: number
  actionType?: string
  level?: number
  transactionHash?: string
  blockNumber?: number
  timestamp?: number
}

export async function POST(request: NextRequest) {
  try {
    const event: MaintenanceEvent = await request.json()

    console.log('🔄 Maintenance Webhook Received:', {
      eventName: event.eventName,
      tokenId: event.tokenId,
      userAddress: event.userAddress,
      contractAddress: event.contractAddress,
      chainId: event.chainId
    })

    // Validate required fields
    if (!event.eventName || !event.tokenId || !event.userAddress || !event.contractAddress || !event.chainId) {
      console.error('❌ Invalid webhook payload - missing required fields')
      return NextResponse.json(
        { error: 'Invalid payload - missing required fields' },
        { status: 400 }
      )
    }

    // Process the maintenance event
    await processMaintenanceEvent(event)

    console.log('✅ Maintenance event processed successfully')

    return NextResponse.json({
      success: true,
      message: 'Maintenance event processed',
      event: event.eventName,
      tokenId: event.tokenId
    })

  } catch (error) {
    console.error('❌ Maintenance webhook error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// MAINTENANCE EVENT PROCESSING
// =============================================================================

async function processMaintenanceEvent(event: MaintenanceEvent): Promise<void> {
  const tokenId = makeTokenId(event.chainId, event.contractAddress, event.tokenId)

  console.log(`🔧 Processing ${event.eventName} for token ${tokenId}`)

  switch (event.eventName) {
    case 'MAINTENANCE_PERFORMED':
      await handleMaintenancePerformed(tokenId, event)
      break

    case 'CLEANING_PERFORMED':
      await handleCleaningPerformed(tokenId, event)
      break

    case 'RESTORATION_PERFORMED':
      await handleRestorationPerformed(tokenId, event)
      break

    case 'TRANSFER':
      await handleTransfer(tokenId, event)
      break

    default:
      console.warn(`⚠️ Unknown maintenance event: ${event.eventName}`)
      return
  }

  // Update user activity
  await UserOperations.updateUserActivity(event.userAddress, event.eventName.toLowerCase())

  // Track analytics
  await AnalyticsOperations.trackUserActivity(event.userAddress, `maintenance_${event.eventName.toLowerCase()}`)

  // Invalidate related caches immediately
  await CacheOperations.invalidateTokenCache(tokenId)

  console.log(`✅ ${event.eventName} processed and cache invalidated for token ${tokenId}`)
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

async function handleMaintenancePerformed(tokenId: string, event: MaintenanceEvent): Promise<void> {
  const dynamicUpdate = {
    maintenanceCount: undefined as number | undefined, // Will be incremented
    lastMaintenance: new Date().toISOString()
  }

  // Get current maintenance count and increment
  const token = await TokenOperations.getToken(tokenId)
  if (token) {
    dynamicUpdate.maintenanceCount = (token.dynamic.maintenanceCount || 0) + 1
  }

  await TokenOperations.updateTokenDynamic(tokenId, dynamicUpdate)

  console.log(`🔧 Maintenance performed: count increased to ${dynamicUpdate.maintenanceCount}`)
}

async function handleCleaningPerformed(tokenId: string, event: MaintenanceEvent): Promise<void> {
  const dynamicUpdate = {
    cleaningCount: undefined as number | undefined, // Will be incremented
    lastCleaning: new Date().toISOString(),
    dirtLevel: 0 // Assume cleaning resets dirt level
  }

  // Get current cleaning count and increment
  const token = await TokenOperations.getToken(tokenId)
  if (token) {
    dynamicUpdate.cleaningCount = (token.dynamic.cleaningCount || 0) + 1
  }

  await TokenOperations.updateTokenDynamic(tokenId, dynamicUpdate)

  console.log(`🧼 Cleaning performed: dirt level reset, cleaning count increased to ${dynamicUpdate.cleaningCount}`)
}

async function handleRestorationPerformed(tokenId: string, event: MaintenanceEvent): Promise<void> {
  const dynamicUpdate = {
    restorationCount: undefined as number | undefined, // Will be incremented
    lastMaintenance: new Date().toISOString()
  }

  // Get current restoration count and increment
  const token = await TokenOperations.getToken(tokenId)
  if (token) {
    dynamicUpdate.restorationCount = (token.dynamic.restorationCount || 0) + 1
  }

  // If restoration level is provided, update aging level
  if (event.level !== undefined) {
    (dynamicUpdate as any).agingLevel = Math.max(0, 100 - event.level) // Assume level reduces aging
  }

  await TokenOperations.updateTokenDynamic(tokenId, dynamicUpdate)

  console.log(`🔨 Restoration performed: level ${event.level}, restoration count increased to ${dynamicUpdate.restorationCount}`)
}

async function handleTransfer(tokenId: string, event: MaintenanceEvent): Promise<void> {
  // Note: This would typically be handled by a separate transfer webhook
  // but including here for completeness

  // For transfers, we need to know the old owner (not provided in event)
  // This might require querying the blockchain or having the old owner in the payload

  console.log(`🔄 Transfer detected for token ${tokenId} to ${event.userAddress}`)
  // Transfer handling would be more complex and might be better in a separate endpoint
}

// =============================================================================
// BATCH EVENT PROCESSING (for high-volume scenarios)
// =============================================================================

export async function PUT(request: NextRequest) {
  /**
   * Batch endpoint for processing multiple maintenance events
   * Useful when contract emits multiple events in a single transaction
   */
  try {
    const events: MaintenanceEvent[] = await request.json()

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Expected array of events' },
        { status: 400 }
      )
    }

    console.log(`🔄 Processing batch of ${events.length} maintenance events`)

    // Process events in parallel for better performance
    const results = await Promise.allSettled(
      events.map(event => processMaintenanceEvent(event))
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - successful

    console.log(`✅ Batch processing complete: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      processed: events.length,
      successful,
      failed,
      results: results.map((result, index) => ({
        event: index,
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? (result as PromiseRejectedResult).reason : null
      }))
    })

  } catch (error) {
    console.error('❌ Batch maintenance webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =============================================================================
// WEBHOOK VERIFICATION & SECURITY
// =============================================================================

async function verifyWebhookSignature(request: NextRequest, body: string): Promise<boolean> {
  /**
   * Implement webhook signature verification for security
   * This prevents unauthorized parties from triggering cache updates
   */

  // Example implementation (customize based on your webhook provider)
  const signature = request.headers.get('x-webhook-signature')
  const secret = process.env.WEBHOOK_SECRET

  if (!signature || !secret) {
    console.warn('⚠️ Webhook signature verification disabled - missing configuration')
    return true // Allow in development
  }

  // Implement actual signature verification logic
  // const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')
  // return signature === `sha256=${expectedSignature}`

  return true // Placeholder
}

// =============================================================================
// MONITORING & HEALTH CHECKS
// =============================================================================

export async function GET(request: NextRequest) {
  /**
   * Health check endpoint for webhook monitoring
   */
  try {
    // Check Redis connectivity
    const redisHealth = await checkRedisHealth()

    // Get webhook processing stats
    const stats = await getWebhookStats()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      redis: redisHealth,
      stats
    })

  } catch (error) {
    console.error('❌ Webhook health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 503 }
    )
  }
}

async function checkRedisHealth(): Promise<{ connected: boolean, ping: number }> {
  const start = Date.now()
  try {
    // Simple Redis ping
    await redis.ping()
    return { connected: true, ping: Date.now() - start }
  } catch (error) {
    return { connected: false, ping: -1 }
  }
}

async function getWebhookStats(): Promise<any> {
  // Get recent webhook processing statistics
  // This would track metrics in Redis
  return {
    eventsProcessed: 0, // Placeholder
    avgProcessingTime: 0,
    errorRate: 0
  }
}
