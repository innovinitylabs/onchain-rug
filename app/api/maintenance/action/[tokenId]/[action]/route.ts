import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId } from '@/lib/networks'
import { createPaymentRequiredResponse, verifyAndSettlePayment } from '@/lib/x402'
import { formatEther, keccak256, encodePacked, createPublicClient, http, parseEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { randomBytes } from 'crypto'
import { checkRateLimit, getRateLimitStatus } from '@/utils/rate-limiter'

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
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'cleanRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'restoreRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'masterRestoreRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  }
] as const

const adminFeesAbi = [
  {
    inputs: [],
    name: 'getAgentServiceFee',
    outputs: [
      { name: 'serviceFee', type: 'uint256' },
      { name: 'feeRecipient', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

type Action = 'clean' | 'restore' | 'master'

export async function POST(request: NextRequest, context: { params: Promise<{ tokenId: string, action: Action }> }) {
  try {
    console.log(`🚀 ===== ACTION ROUTE START =====`)

    // Parse request parameters
    const params = await context.params
    const { tokenId, action } = params
    console.log(`📋 Params: tokenId=${tokenId}, action=${action}`)

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

    // Check for X402 payment headers
    const paymentSignature = request.headers.get('PAYMENT-SIGNATURE')
    const paymentPayloadStr = request.headers.get('PAYMENT-REQUIRED') || request.headers.get('x402-payment-payload') // Support both V2 and V1 during migration

    console.log(`💳 Payment headers - signature: ${!!paymentSignature}, payload: ${!!paymentPayloadStr}`)

    // If no payment headers, return payment requirements (quote mode)
    if (!paymentPayloadStr || !paymentSignature) {
      console.log(`💰 Request for payment requirements (quote mode)`)
      return NextResponse.json({
        x402: {
          x402Version: 2, // Updated to V2
          accepts: [{
            scheme: 'exact',
            network: 'base-sepolia',
            asset: '0x0000000000000000000000000000000000000000',
            payTo: '0x15c5a551b8aA39a3A4E73643a681E71F76093b62',
            maxAmountRequired: '430000000000000',
            resource: `/api/maintenance/action/${tokenId}/${action}`,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} rug #${tokenId}`,
            mimeType: 'application/json',
            maxTimeoutSeconds: 900,
            extra: {
              tokenId: tokenId,
              action: action,
              maintenanceCost: '0.00001',
              serviceFee: '0.00042',
              totalWei: '430000000000000'
            }
          }]
        }
      }, { status: 402 })
    }

    // Payment headers detected - process payment
    console.log(`🔍 ===== PAYMENT HEADERS DETECTED =====`)
    console.log(`🔍 Processing payment for ${action} on rug #${tokenId}`)

    // Verify payment transaction on-chain before generating token
    const paymentTxHash = request.headers.get('PAYMENT-RESPONSE') || request.headers.get('x402-payment-tx') // Support both V2 and V1 during migration
    if (!paymentTxHash) {
      console.log(`❌ No payment transaction hash provided`)
      return NextResponse.json({
        error: 'Payment transaction hash required',
        details: 'PAYMENT-RESPONSE or x402-payment-tx header required for payment verification'
      }, { status: 400 })
    }

    // Parse payment payload for verification
    let paymentPayload: any
    try {
      if (!paymentPayloadStr) {
        return NextResponse.json({
          error: 'Payment payload required',
          details: 'x402-payment-payload header required'
        }, { status: 400 })
      }
      paymentPayload = JSON.parse(paymentPayloadStr)
    } catch (e) {
      return NextResponse.json({
        error: 'Invalid payment payload',
        details: 'Failed to parse payment payload'
      }, { status: 400 })
    }

    // Verify payment transaction on-chain (reuse facilitator logic)
    console.log(`🔍 Verifying payment transaction on blockchain: ${paymentTxHash}`)
    
    const rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org'
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl)
    })

    try {
      // Retry logic with exponential backoff to handle race conditions
      // Transaction might not be confirmed yet when API is called
      let receipt = null
      const maxRetries = 3
      for (let i = 0; i < maxRetries; i++) {
        receipt = await publicClient.getTransactionReceipt({
          hash: paymentTxHash as `0x${string}`
        })
        if (receipt) break
        
        // Wait before retry (exponential backoff: 1s, 2s, 3s)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }

      if (!receipt) {
        console.log('❌ Payment transaction not found on blockchain after retries')
        return NextResponse.json({
          error: 'Payment transaction not found',
          details: 'Transaction not found on blockchain after multiple attempts. Please wait a few seconds and try again.'
        }, { status: 400 })
      }

      if (receipt.status !== 'success') {
        console.log('❌ Payment transaction failed')
        return NextResponse.json({
          error: 'Payment transaction failed',
          details: 'Transaction status indicates failure'
        }, { status: 400 })
      }

      // Verify transaction details match payment payload
      const tx = await publicClient.getTransaction({
        hash: paymentTxHash as `0x${string}`
      })

      if (!tx) {
        console.log('❌ Could not retrieve transaction details')
        return NextResponse.json({
          error: 'Could not verify transaction details',
          details: 'Failed to retrieve transaction'
        }, { status: 400 })
      }

      // Verify transaction matches payment request
      const expectedFrom = paymentPayload.payment?.from?.toLowerCase()
      const expectedTo = paymentPayload.payment?.to?.toLowerCase()
      const expectedAmount = BigInt(paymentPayload.payment?.amount || '0')

      const actualFrom = tx.from.toLowerCase()
      const actualTo = tx.to?.toLowerCase()
      const actualAmount = tx.value

      if (expectedFrom && actualFrom !== expectedFrom) {
        console.log(`❌ Transaction from address mismatch: expected ${expectedFrom}, got ${actualFrom}`)
        return NextResponse.json({
          error: 'Transaction sender mismatch',
          details: 'Transaction sender does not match payment payload'
        }, { status: 400 })
      }

      if (expectedTo && actualTo !== expectedTo) {
        console.log(`❌ Transaction to address mismatch: expected ${expectedTo}, got ${actualTo}`)
        return NextResponse.json({
          error: 'Transaction recipient mismatch',
          details: 'Transaction recipient does not match payment payload'
        }, { status: 400 })
      }

      if (expectedAmount > 0 && actualAmount !== expectedAmount) {
        console.log(`❌ Transaction amount mismatch: expected ${expectedAmount}, got ${actualAmount}`)
        return NextResponse.json({
          error: 'Transaction amount mismatch',
          details: 'Transaction amount does not match payment payload'
        }, { status: 400 })
      }

      console.log('✅ Payment transaction verified on blockchain')
    } catch (verificationError: any) {
      console.log(`❌ Payment verification error: ${verificationError.message}`)
      console.log('🚫 SECURITY: NOT issuing token due to verification failure')
      return NextResponse.json({
        error: 'Payment verification failed',
        details: verificationError.message || 'Failed to verify payment transaction'
      }, { status: 400 })
    }

    // Payment verified - generate authorization token
    console.log(`🔑 Generating cryptographic authorization token...`)

    // Use cryptographically secure random bytes instead of Math.random()
    const randomNonce = randomBytes(16).toString('hex')
    const expires = Math.floor(Date.now() / 1000) + (2 * 60) // 2 minutes (reduced from 5)
    const uniqueId = `x402_${randomNonce}_${Date.now()}`

    console.log(`🔑 Token generation - agent: ${agentAddress}, tokenId: ${tokenId}, action: ${action}, expires: ${expires}, nonce: ${uniqueId}`)

    // Use same cryptographic algorithm as smart contract: keccak256(abi.encodePacked(agent, tokenId, action, expires, nonce))
    const tokenData = encodePacked(
      ['address', 'uint256', 'string', 'uint256', 'string'],
      [agentAddress as `0x${string}`, BigInt(tokenId), action, BigInt(expires), uniqueId]
    )
    const authorizationToken = keccak256(tokenData)

    console.log(`✅ Authorization token generated: ${authorizationToken}`)

    // Get current rate limit status for headers (without incrementing counter)
    const currentRateLimit = getRateLimitStatus(agentAddress)

    return NextResponse.json({
      authorizationToken: authorizationToken,
      action,
      tokenId,
      nonce: uniqueId,
      expires
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': currentRateLimit.remaining.toString(),
        'X-RateLimit-Reset': currentRateLimit.resetAt.toString()
      }
    })

  } catch (err) {
    console.error('maintenance action error:', err)
    return NextResponse.json({
      error: 'Failed to execute maintenance action',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
