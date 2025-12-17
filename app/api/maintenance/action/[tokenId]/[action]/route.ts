import { NextRequest, NextResponse } from 'next/server'
import { getContractAddress, DEFAULT_CHAIN_ID } from '@/lib/networks'
import { checkRateLimit } from '@/utils/rate-limiter'

type Action = 'clean' | 'restore' | 'master'

export async function POST(request: NextRequest, context: { params: Promise<{ tokenId: string, action: Action }> }) {
  try {
    console.log(`🚀 ===== ACTION ROUTE START =====`)

    // Parse request parameters
    const params = await context.params
    const { tokenId, action } = params
    
    // Get chain ID from query params or use default
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || DEFAULT_CHAIN_ID.toString())
    
    // Get Diamond contract address dynamically (all calls go through Diamond proxy)
    const contract = getContractAddress(chainId)
    if (!contract) {
      return NextResponse.json({
        error: 'Unsupported chain',
        details: `No contract address configured for chain ${chainId}`
      }, { status: 400 })
    }

    console.log(`📋 Params: tokenId=${tokenId}, action=${action}, chainId=${chainId}, contract=${contract} (Diamond proxy)`)

    // Check for agent address (required for all requests)
    const agentAddress = request.headers.get('x-agent-address')
    if (!agentAddress) {
      console.log(`🚫 Request rejected: Missing agent address`)
      return NextResponse.json({
        error: 'Agent address required',
        details: 'x-agent-address header required'
      }, { status: 400 })
    }

    // Validate agent address format
    if (!agentAddress.startsWith('0x') || agentAddress.length !== 42) {
      console.log(`🚫 Request rejected: Invalid agent address format: ${agentAddress}`)
      return NextResponse.json({
        error: 'Invalid agent address format',
        details: 'Agent address must be a valid 42-character hex string starting with 0x'
      }, { status: 400 })
    }

    // Check rate limit (10 requests/minute per agent)
    const rateLimitCheck = checkRateLimit(agentAddress)
    if (!rateLimitCheck.allowed) {
      const resetInSeconds = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)
      console.log(`🚫 Rate limit exceeded for agent ${agentAddress}. Reset in ${resetInSeconds}s`)
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

    console.log(`✅ Agent validation passed: ${agentAddress} (${rateLimitCheck.remaining} requests remaining)`)

    // Parse payment amount from request body
    let paymentAmount: string
    try {
      const body = await request.json()
      paymentAmount = body.paymentAmount
      if (!paymentAmount) {
        return NextResponse.json({
          error: 'Payment amount required',
          details: 'paymentAmount field required in request body'
        }, { status: 400 })
      }
    } catch (e) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: 'Failed to parse JSON request body'
      }, { status: 400 })
    }

    console.log(`💰 Direct payment amount: ${paymentAmount} wei`)

    // Execute the maintenance action directly
    console.log(`🔧 ===== EXECUTING MAINTENANCE ACTION =====`)
    console.log(`🔧 Executing ${action} on rug #${tokenId} via authorized agent ${agentAddress}`)

    // Map action to function name
    const functionNameMap = {
      'clean': 'cleanRugAgent',
      'restore': 'restoreRugAgent',
      'master': 'masterRestoreRugAgent'
    }

    const functionName = functionNameMap[action] as 'cleanRugAgent' | 'restoreRugAgent' | 'masterRestoreRugAgent'
    if (!functionName) {
      console.log(`❌ Invalid action: ${action}`)
      return NextResponse.json({
        error: 'Invalid action',
        details: `Action '${action}' not supported`
      }, { status: 400 })
    }

    console.log(`🔧 Calling contract function: ${functionName}(${tokenId}) with ${paymentAmount} wei`)

    // X402 v2: No facilitator - agents execute transactions directly
    // This endpoint is for informational purposes only - agents should use their own API servers
    console.log(`ℹ️ X402 v2: Agents must execute transactions directly via their own API servers`)
    return NextResponse.json({
      error: 'Direct execution required',
      details: 'With x402 v2, agents execute transactions directly using their own wallet. This endpoint does not execute transactions on behalf of agents.',
      instructions: {
        message: 'Use your local agent API server to execute the transaction',
        agentApiEndpoint: `/rug/${tokenId}/execute-direct`,
        contractCall: {
          address: contract,
          function: functionName,
          args: [tokenId],
          value: paymentAmount
        },
        note: 'The payment amount has been validated. Execute the transaction with this amount as the value.'
      }
    }, { status: 503 }) // Service Unavailable - agent should use their own API server

  } catch (err) {
    console.error('maintenance action error:', err)
    return NextResponse.json({
      error: 'Failed to execute maintenance action',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
