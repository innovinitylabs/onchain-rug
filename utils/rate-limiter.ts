/**
 * Rate Limiter Utility
 * Implements 10 requests/minute per agent using a sliding window algorithm
 */

interface RateLimitEntry {
  requests: number[]
  resetAt: number
}

// In-memory store for rate limit tracking
// In production, consider using Redis for distributed systems
const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const REQUESTS_PER_MINUTE = 10
const WINDOW_MS = 60 * 1000 // 1 minute in milliseconds

/**
 * Clean up old entries periodically to prevent memory leaks
 */
function cleanupOldEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEntries, 5 * 60 * 1000)
}

/**
 * Check if an agent has exceeded the rate limit
 * @param agentAddress - The agent's wallet address (from x-agent-address header)
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(agentAddress: string): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  if (!agentAddress || !agentAddress.startsWith('0x')) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + WINDOW_MS
    }
  }

  const now = Date.now()
  const normalizedAddress = agentAddress.toLowerCase()

  // Get or create rate limit entry
  let entry = rateLimitStore.get(normalizedAddress)

  if (!entry) {
    // First request for this agent
    entry = {
      requests: [now],
      resetAt: now + WINDOW_MS
    }
    rateLimitStore.set(normalizedAddress, entry)
    return {
      allowed: true,
      remaining: REQUESTS_PER_MINUTE - 1,
      resetAt: entry.resetAt
    }
  }

  // Remove requests outside the current window
  const windowStart = now - WINDOW_MS
  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart)

  // Check if limit exceeded
  if (entry.requests.length >= REQUESTS_PER_MINUTE) {
    // Update reset time to when the oldest request expires
    const oldestRequest = Math.min(...entry.requests)
    entry.resetAt = oldestRequest + WINDOW_MS

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }

  // Add current request
  entry.requests.push(now)
  entry.resetAt = now + WINDOW_MS

  return {
    allowed: true,
    remaining: REQUESTS_PER_MINUTE - entry.requests.length,
    resetAt: entry.resetAt
  }
}

/**
 * Get rate limit status for an agent (without incrementing the counter)
 * Useful for checking remaining requests before making a call
 */
export function getRateLimitStatus(agentAddress: string): {
  remaining: number
  resetAt: number
} {
  if (!agentAddress || !agentAddress.startsWith('0x')) {
    return {
      remaining: 0,
      resetAt: Date.now() + WINDOW_MS
    }
  }

  const now = Date.now()
  const normalizedAddress = agentAddress.toLowerCase()
  const entry = rateLimitStore.get(normalizedAddress)

  if (!entry) {
    return {
      remaining: REQUESTS_PER_MINUTE,
      resetAt: now + WINDOW_MS
    }
  }

  // Remove requests outside the current window
  const windowStart = now - WINDOW_MS
  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart)

  const remaining = Math.max(0, REQUESTS_PER_MINUTE - entry.requests.length)
  const oldestRequest = entry.requests.length > 0 ? Math.min(...entry.requests) : now
  const resetAt = oldestRequest + WINDOW_MS

  return {
    remaining,
    resetAt
  }
}

/**
 * Reset rate limit for an agent (useful for testing or admin actions)
 */
export function resetRateLimit(agentAddress: string): void {
  if (!agentAddress) return
  const normalizedAddress = agentAddress.toLowerCase()
  rateLimitStore.delete(normalizedAddress)
}

/**
 * Get all rate limit entries (useful for monitoring/debugging)
 */
export function getAllRateLimits(): Map<string, RateLimitEntry> {
  return new Map(rateLimitStore)
}

