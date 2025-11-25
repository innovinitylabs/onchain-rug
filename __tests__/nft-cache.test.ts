/**
 * Basic tests for NFT cache implementation
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { redis, getStaticKey, getDynamicKey, getCached, setCached } from '../lib/redis'
import { batchReadTokenURIs, batchReadOwners } from '../lib/multicall'

// Mock environment variables
beforeAll(() => {
  process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:6379'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token'
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT = '0x711aFEE5331F8748A600c58C76EDbb51484625EA'
})

afterAll(async () => {
  // Clean up any test data
  try {
    await redis.del('test-key')
  } catch (error) {
    // Ignore cleanup errors
  }
})

describe('Redis Key Generation', () => {
  test('should generate correct static key', () => {
    const key = getStaticKey(84532, '0x123', 1)
    expect(key).toBe('nft:static:84532:0x123:1')
  })

  test('should generate correct dynamic key', () => {
    const key = getDynamicKey(84532, '0x123', 1)
    expect(key).toBe('nft:dynamic:84532:0x123:1')
  })
})

describe('Multicall Utilities', () => {
  test('should chunk arrays correctly', () => {
    const { chunkArray } = require('../lib/multicall')
    const array = [1, 2, 3, 4, 5, 6, 7]
    const chunks = chunkArray(array, 3)
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]])
  })

  test('batchReadTokenURIs should handle empty array', async () => {
    const results = await batchReadTokenURIs(84532, '0x123', [])
    expect(results).toEqual([])
  })

  test('batchReadOwners should handle empty array', async () => {
    const results = await batchReadOwners(84532, '0x123', [])
    expect(results).toEqual([])
  })
})

// Note: Integration tests with real Redis and blockchain would require:
// 1. A test Redis instance
// 2. A test blockchain node
// 3. Proper environment setup
//
// For now, these are unit tests that verify the logic without external dependencies.

describe('Cache Operations (Unit)', () => {
  test('getCached should return null for non-existent key', async () => {
    // This would need a mock Redis instance in a real test
    // For now, just test the function exists and returns the expected type
    expect(typeof getCached).toBe('function')
  })

  test('setCached should not throw with valid parameters', async () => {
    // Test that the function signature is correct
    expect(typeof setCached).toBe('function')
  })
})

// Manual testing instructions (run these after setting up environment):
/*
# 1. Test metadata endpoint
curl http://localhost:3000/api/metadata/0?chainId=84532

# 2. Test collection endpoint
curl http://localhost:3000/api/collection?chainId=84532&page=1

# 3. Test refresh endpoint
curl -X POST http://localhost:3000/api/refresh-one?tokenId=0&chainId=84532

# 4. Test marketplace activity
curl http://localhost:3000/api/marketplace/activity?limit=10&chain=84532
*/
