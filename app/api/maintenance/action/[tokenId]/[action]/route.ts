import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId } from '@/lib/networks'
import { createPaymentRequiredResponse, verifyAndSettlePayment } from '@/lib/x402'
import { formatEther, keccak256, encodePacked } from 'viem'

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
  console.log(`🚀 Action route called`)
  try {
    console.log(`📋 Parsing request params...`)
    const params = await context.params
    const tokenId = params.tokenId
    const action = params.action
    const chainId = DEFAULT_CHAIN_ID

    console.log(`📋 Params: tokenId=${tokenId}, action=${action}, chainId=${chainId}`)
    console.log(`📋 DEFAULT_CHAIN_ID value:`, DEFAULT_CHAIN_ID)

    // Use the configured contract address
    console.log(`🏠 Looking up contract address for chain ${chainId}...`)
    const contract = getContractAddress(chainId)
    console.log(`🏠 Contract address: ${contract}`)

    if (!contract) {
      console.error(`❌ No contract configured for chainId ${chainId}`)
      return NextResponse.json({
        error: 'Contract not configured for this network',
        details: `chainId: ${chainId}, contract: ${contract}`
      }, { status: 500 })
    }

    // 🚨 EARLY VALIDATION: Check for X402 payment headers BEFORE expensive operations
    const paymentPayload = request.headers.get('x402-payment-payload')
    const paymentStatus = request.headers.get('x402-payment-status')
    const agentAddress = request.headers.get('x-agent-address')

    console.log(`💳 Payment headers - payload: ${!!paymentPayload}, status: ${paymentStatus}, agent: ${agentAddress}`)

    // 🚨 FAIL FAST: Reject requests without proper payment setup
    if (!paymentPayload || paymentStatus !== 'payment-submitted') {
      console.log(`🚫 Request rejected: Missing or invalid payment headers`)
      return NextResponse.json({
        error: 'Payment required',
        details: 'Valid x402-payment-payload and x402-payment-status=payment-submitted required'
      }, { status: 402 })
    }

    if (!agentAddress) {
      console.log(`🚫 Request rejected: Missing agent address`)
      return NextResponse.json({
        error: 'Agent address required',
        details: 'x-agent-address header required'
      }, { status: 400 })
    }

    // ✅ PAYMENT VALIDATION PASSED - Now safe to do expensive operations

    // Get maintenance options first
    const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await callContractMultiFallback(
      contract,
      maintenanceAbi as any,
      'getMaintenanceOptions',
      [BigInt(tokenId)],
      { chainId }
    ) as [boolean, boolean, boolean, bigint, bigint, bigint]

    // Get service fee
    const feesResult = await callContractMultiFallback(
      contract,
      adminFeesAbi as any,
      'getAgentServiceFee',
      [],
      { chainId }
    ) as [bigint, string]

    const [serviceFee] = feesResult

    // Determine cost and function name
    let maintenanceWei = BigInt(0)
    let functionName = ''
    let description = ''
    if (action === 'clean') {
      maintenanceWei = cleaningCost
      functionName = 'cleanRugAgent'
      description = `Clean rug #${tokenId}`
      if (!canClean && maintenanceWei === BigInt(0)) {
        return NextResponse.json({ error: 'Cleaning not needed' }, { status: 400 })
      }
    } else if (action === 'restore') {
      maintenanceWei = restorationCost
      functionName = 'restoreRugAgent'
      description = `Restore rug #${tokenId}`
      if (!canRestore || maintenanceWei === BigInt(0)) {
        return NextResponse.json({ error: 'Restoration not available' }, { status: 400 })
      }
    } else if (action === 'master') {
      maintenanceWei = masterCost
      functionName = 'masterRestoreRugAgent'
      description = `Master restore rug #${tokenId}`
      if (!needsMaster || maintenanceWei === BigInt(0)) {
        return NextResponse.json({ error: 'Master restoration not needed' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const totalWei = maintenanceWei + serviceFee
    const price = (Number(totalWei) / 1e18).toString() // Convert to ETH

    // ✅ Payment validation already passed above, proceed with verification

    // Verify X402 payment (skip settlement for direct contract payments)
    console.log(`🔍 Verifying X402 payment...`)
    console.log(`🔍 Payment payload present: ${!!paymentPayload}`)

    let paymentResult
    try {
      paymentResult = await verifyAndSettlePayment(paymentPayload)
      console.log(`🔍 Payment verification result:`, paymentResult)
    } catch (verificationError) {
      console.error(`❌ Payment verification threw exception:`, verificationError)
      return NextResponse.json({
        error: 'Payment verification failed',
        reason: verificationError instanceof Error ? verificationError.message : 'Unknown verification error'
      }, { status: 402 })
    }

    if (!paymentResult.isValid) {
      console.log(`❌ X402 payment verification failed: ${paymentResult.invalidReason}`)
      return NextResponse.json({
        error: 'Payment verification failed',
        reason: paymentResult.invalidReason
      }, { status: 402 })
    }

    // For our setup, payment is sent directly to contract, so settlement is not needed
    console.log(`✅ Payment verification successful - settlement not required for direct contract payments`)

    // Generate authorization token for agent to execute transaction
    console.log(`🔑 Generating authorization token for ${action} on rug #${tokenId}...`)

console.log(`🔑 Token generation - agentAddress: ${agentAddress}, tokenId: ${tokenId}, action: ${action}`)

// Create unique authorization token hash
// This hash is unique per transaction and will be marked as used by the contract
const expires = Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes from now
const uniqueId = Math.random().toString(36) + Date.now().toString(36)

console.log(`🔑 Token params - expires: ${expires}, uniqueId: ${uniqueId}`)

// Validate all parameters before encoding
if (!agentAddress || !tokenId || !action) {
  console.error(`🔑 Token generation failed - missing params:`, {
    agentAddress: !!agentAddress,
    tokenId: !!tokenId,
    action: !!action
  })
  return NextResponse.json({ error: 'Invalid token parameters' }, { status: 500 })
}

try {
  // Validate agentAddress format
  if (!agentAddress.startsWith('0x') || agentAddress.length !== 42) {
    throw new Error(`Invalid agent address format: ${agentAddress}`)
  }

  // Use encodePacked to match Solidity's abi.encodePacked behavior
  const tokenData = encodePacked(
    ['address', 'uint256', 'string', 'uint256', 'string'],
    [agentAddress as `0x${string}`, BigInt(tokenId), action, BigInt(expires), uniqueId]
  )

  const authorizationToken = keccak256(tokenData)

  console.log(`✅ Payment verified - authorization token generated: ${authorizationToken}`)

  return NextResponse.json({
    authorizationToken: authorizationToken,
    action,
    tokenId,
    nonce: uniqueId,
    expires
  })
} catch (tokenError) {
  console.error(`❌ Token generation failed:`, tokenError)
  return NextResponse.json({
    error: 'Token generation failed',
    details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
  }, { status: 500 })
}

  } catch (err) {
    console.error('maintenance action error:', err)
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace')
    return NextResponse.json({
      error: 'Failed to execute maintenance action',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
