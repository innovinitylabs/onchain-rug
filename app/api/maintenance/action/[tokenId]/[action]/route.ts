import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId } from '@/lib/networks'
import { createPaymentRequiredResponse, verifyAndSettlePayment } from '@/lib/x402'
import { formatEther, keccak256, encodePacked, createPublicClient, http } from 'viem'

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

    console.log(`✅ Agent validation passed: ${agentAddress}`)

    // Check for X402 payment headers
    const paymentPayload = request.headers.get('x402-payment-payload')
    const paymentStatus = request.headers.get('x402-payment-status')

    console.log(`💳 Payment headers - payload: ${!!paymentPayload}, status: ${paymentStatus}`)

    // If no payment headers, return payment requirements (quote mode)
    if (!paymentPayload || paymentStatus !== 'payment-submitted') {
      console.log(`💰 Request for payment requirements (quote mode)`)
      return NextResponse.json({
        x402: {
          x402Version: 1,
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

    // Generate authorization token using same algorithm as smart contract
    console.log(`🔑 Generating cryptographic authorization token...`)

    const expires = Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes
    const uniqueId = `x402_${Math.random().toString(36).substring(2)}_${Date.now()}`

    console.log(`🔑 Token generation - agent: ${agentAddress}, tokenId: ${tokenId}, action: ${action}, expires: ${expires}, nonce: ${uniqueId}`)

    // Use same cryptographic algorithm as smart contract: keccak256(abi.encodePacked(agent, tokenId, action, expires, nonce))
    const tokenData = encodePacked(
      ['address', 'uint256', 'string', 'uint256', 'string'],
      [agentAddress as `0x${string}`, BigInt(tokenId), action, BigInt(expires), uniqueId]
    )
    const authorizationToken = keccak256(tokenData)

    console.log(`✅ Authorization token generated: ${authorizationToken}`)

    return NextResponse.json({
      authorizationToken: authorizationToken,
      action,
      tokenId,
      nonce: uniqueId,
      expires
    })

  } catch (err) {
    console.error('maintenance action error:', err)
    return NextResponse.json({
      error: 'Failed to execute maintenance action',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
