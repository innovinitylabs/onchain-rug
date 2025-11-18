/**
 * Rate Limit Handler for AI Agents
 * Handles 429 rate limit responses and provides retry logic
 */

import chalk from 'chalk';

/**
 * Check if response is a rate limit error
 */
function isRateLimitError(response) {
  return response.status === 429;
}

/**
 * Extract rate limit information from response headers
 */
function getRateLimitInfo(response) {
  return {
    limit: parseInt(response.headers.get('X-RateLimit-Limit') || '10', 10),
    remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10),
    resetAt: parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10),
    retryAfter: parseInt(response.headers.get('Retry-After') || '60', 10)
  };
}

/**
 * Handle rate limit error with helpful messaging
 */
function handleRateLimitError(response, result) {
  const rateLimitInfo = getRateLimitInfo(response);
  const resetInSeconds = rateLimitInfo.retryAfter;
  // resetAt is already in milliseconds (from Date.now())
  const resetTime = new Date(rateLimitInfo.resetAt).toLocaleTimeString();
  
  const errorMessage = result?.error || 'Rate limit exceeded';
  const details = result?.details || `Maximum ${rateLimitInfo.limit} requests per minute`;
  
  console.log(chalk.yellow(`\n⚠️  Rate Limit Exceeded`));
  console.log(chalk.gray(`   ${details}`));
  console.log(chalk.gray(`   Remaining requests: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}`));
  console.log(chalk.gray(`   Reset in: ${resetInSeconds} seconds (at ${resetTime})`));
  console.log(chalk.gray(`   Please wait before making more requests.\n`));
  
  return {
    error: errorMessage,
    details: details,
    rateLimit: {
      remaining: rateLimitInfo.remaining,
      limit: rateLimitInfo.limit,
      resetInSeconds: resetInSeconds,
      resetAt: rateLimitInfo.resetAt
    }
  };
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute fetch with rate limit handling and automatic retry
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {object} retryConfig - Retry configuration { maxRetries: number, baseDelay: number }
 * @returns {Promise<Response>} - The fetch response
 */
async function fetchWithRateLimitHandling(url, options = {}, retryConfig = { maxRetries: 0, baseDelay: 1000 }) {
  const { maxRetries = 0, baseDelay = 1000 } = retryConfig;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    // If not rate limited, return immediately
    if (!isRateLimitError(response)) {
      return response;
    }
    
    // Rate limited - handle it
    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { error: 'Rate limit exceeded', details: 'Too many requests' };
    }
    
    const rateLimitInfo = getRateLimitInfo(response);
    
    // If this is the last attempt, throw error
    if (attempt >= maxRetries) {
      const error = new Error(result.error || 'Rate limit exceeded');
      error.rateLimit = rateLimitInfo;
      error.response = response;
      error.result = result;
      throw error;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(baseDelay * Math.pow(2, attempt), rateLimitInfo.retryAfter * 1000);
    
    console.log(chalk.yellow(`⚠️  Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries + 1})`));
    await sleep(delay);
  }
  
  // Should never reach here, but just in case
  throw new Error('Rate limit retry failed');
}

export {
  isRateLimitError,
  getRateLimitInfo,
  handleRateLimitError,
  fetchWithRateLimitHandling,
  sleep
};

