import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback, onchainRugsABI } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId } from '@/lib/networks'
import { createPaymentRequiredResponse } from '@/lib/x402'
import { checkRateLimit, getRateLimitStatus } from '@/utils/rate-limiter'

// Minimal ABI fragment for getMaintenanceOptions if not included
const maintenanceAbi = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getMaintenanceOptions',
    outputs: [
      { name: 'canClean', type: 'bool' },
      { name: 'canRestore', type: 'bool' },
      { name: 'needsMaster', type: 'bool' },
      { name: 'cleaningCost', type: 'uint256' },
      { name: 'restorationCost', type: 'uint256' },
      { name: 'masterCost', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export async function GET(request: NextRequest, context: { params: Promise<{ tokenId: string }> }) {
  try {
    const params = await context.params
    const tokenId = params.tokenId
    const chainId = DEFAULT_CHAIN_ID
    
    // 🛡️ Input validation: Validate tokenId
    const tokenIdNum = parseInt(tokenId, 10)
    if (isNaN(tokenIdNum) || tokenIdNum < 0 || tokenIdNum > 1000000) {
      return NextResponse.json({
        error: 'Invalid tokenId',
        details: 'TokenId must be a valid number between 0 and 1000000'
      }, { status: 400 })
    }
    
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown'
    
    // Rate limit by IP address (10 requests/minute per IP)
    // Use IP with prefix to work with rate limiter (which expects 0x addresses)
    const rateLimitKey = `ip:${clientIp}`
    const rateLimitCheck = checkRateLimit(rateLimitKey)
    if (!rateLimitCheck.allowed) {
      const resetInSeconds = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)
      console.log(`🚫 Rate limit exceeded for IP ${clientIp}. Reset in ${resetInSeconds}s`)
      return NextResponse.json({
        error: 'Rate limit exceeded',
        details: `Maximum 10 requests per minute. Try again in ${resetInSeconds} seconds.`,
        resetAt: rateLimitCheck.resetAt,
        resetInSeconds
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitCheck.resetAt.toString(),
          'Retry-After': resetInSeconds.toString()
        }
      })
    }

    const currentRateLimit = getRateLimitStatus(rateLimitKey)
    
    // For testing, use hardcoded Base Sepolia contract
    const contract = getContractAddress(chainId)
    if (!contract) {
      return NextResponse.json({ error: 'Contract not configured for this network' }, { status: 500 })
    }

    // Status queries are FREE - no X402 payment required for reading from blockchain
    console.log(`📖 Getting maintenance status for rug #${tokenId} (free read operation)`)
    const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await callContractMultiFallback(
      contract,
      maintenanceAbi as any,
      'getMaintenanceOptions',
      [BigInt(tokenIdNum)],
      { chainId }
    ) as [boolean, boolean, boolean, bigint, bigint, bigint]

    const network = getNetworkByChainId(chainId)
    return NextResponse.json({
      chainId,
      network: network?.name,
      tokenId: tokenIdNum,
      maintenance: {
        canClean,
        canRestore,
        needsMaster,
        cleaningCostWei: cleaningCost.toString(),
        restorationCostWei: restorationCost.toString(),
        masterCostWei: masterCost.toString()
      }
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': currentRateLimit.remaining.toString(),
        'X-RateLimit-Reset': currentRateLimit.resetAt.toString()
      }
    })
  } catch (err) {
    console.error('status route error', err)
    return NextResponse.json({ error: 'Failed to fetch maintenance status' }, { status: 500 })
  }
}


