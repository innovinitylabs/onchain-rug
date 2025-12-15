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
    const chainId = DEFAULT_CHAIN_ID
    const contract = getContractAddress(chainId)
    if (!contract) {
      return NextResponse.json({ error: 'Contract not configured for this network' }, { status: 500 })
    }
    console.log(`📋 Params: tokenId=${tokenId}, action=${action}, contract=${contract}`)

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

    try {
      // Check for required environment variables
      const agentPrivateKey = process.env.AGENT_PRIVATE_KEY
      if (!agentPrivateKey) {
        return NextResponse.json({
          error: 'Server configuration error',
          details: 'Agent private key not configured'
        }, { status: 500 })
      }

      // Use viem to call contract directly with payment
      const { createWalletClient, http } = await import('viem')
      const { privateKeyToAccount } = await import('viem/accounts')
      const { baseSepolia } = await import('viem/chains')

      // Create wallet client for the transaction
      const account = privateKeyToAccount(agentPrivateKey as `0x${string}`)
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(process.env.RPC_URL || 'https://sepolia.base.org')
      })

      // Execute the maintenance action with payment
      const txHash = await walletClient.writeContract({
        address: contract as `0x${string}`,
        abi: maintenanceAbi,
        functionName,
        args: [BigInt(tokenId)],
        value: BigInt(paymentAmount),
        chain: baseSepolia,
        account
      })

      console.log(`✅ Maintenance action successful`)
      console.log(`📋 Transaction hash: ${txHash}`)

      // Wait for confirmation
      const publicClient = await import('viem').then(m => m.createPublicClient({
        chain: baseSepolia,
        transport: http(process.env.RPC_URL || 'https://sepolia.base.org')
      }))

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      console.log(`📊 Gas used: ${receipt.gasUsed}`)

      return NextResponse.json({
        success: true,
        txHash,
        gasUsed: receipt.gasUsed.toString(),
        message: `Rug ${action} completed successfully`,
        payment: {
          amount: paymentAmount,
          agent: agentAddress
        }
      })

    } catch (error) {
      console.error('❌ Contract execution error:', error)

      // Check for specific contract errors
      if (error.message?.includes('Not authorized')) {
        return NextResponse.json({
          error: 'Agent not authorized',
          details: `Agent ${agentAddress} is not authorized for this NFT owner`
        }, { status: 403 })
      }

      if (error.message?.includes('Insufficient payment')) {
        return NextResponse.json({
          error: 'Insufficient payment',
          details: 'Payment amount does not cover maintenance + service fees'
        }, { status: 400 })
      }

      return NextResponse.json({
        error: 'Contract execution failed',
        details: error.message || 'Unknown contract error'
      }, { status: 500 })
    }

  } catch (err) {
    console.error('maintenance action error:', err)
    return NextResponse.json({
      error: 'Failed to execute maintenance action',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
