import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId } from '@/lib/networks'
import { createPaymentRequiredResponse, verifyAndSettlePayment } from '@/lib/x402'
import { formatEther, keccak256, encodeAbiParameters } from 'viem'

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
    const params = await context.params
    const tokenId = params.tokenId
    const action = params.action
    const chainId = DEFAULT_CHAIN_ID

    // Use the configured contract address
    const contract = getContractAddress(chainId)
    if (!contract) {
      return NextResponse.json({ error: 'Contract not configured for this network' }, { status: 500 })
    }

    // Check for X402 payment headers
    const paymentPayload = request.headers.get('x402-payment-payload')
    const paymentStatus = request.headers.get('x402-payment-status')

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

    // If no payment headers, return payment required
    if (!paymentPayload || paymentStatus !== 'payment-submitted') {
      const paymentRequired = createPaymentRequiredResponse({
        price: price,
        description: description
      })

      console.log(`💰 X402 payment required for ${action} on rug #${tokenId}: ${price} ETH`)
      return NextResponse.json(paymentRequired, { status: 402 })
    }

    // Verify and settle X402 payment
    const paymentResult = await verifyAndSettlePayment(paymentPayload)
    if (!paymentResult.isValid) {
      console.log(`❌ X402 payment verification failed: ${paymentResult.invalidReason}`)
      return NextResponse.json({
        error: 'Payment verification failed',
        reason: paymentResult.invalidReason
      }, { status: 402 })
    }

    if (!paymentResult.settlementSuccess) {
      console.log(`❌ X402 payment settlement failed: ${paymentResult.errorReason}`)
      return NextResponse.json({
        error: 'Payment settlement failed',
        reason: paymentResult.errorReason
      }, { status: 402 })
    }

    // Generate authorization token for agent to execute transaction
    console.log(`🔑 Generating authorization token for ${action} on rug #${tokenId}...`)

    // Get agent address from headers (set by agent)
    const agentAddress = request.headers.get('x-agent-address')
    if (!agentAddress) {
      return NextResponse.json({ error: 'Agent address required' }, { status: 400 })
    }

    // Create unique authorization token hash
    // This hash is unique per transaction and will be marked as used by the contract
    const expires = Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes from now
    const uniqueId = Math.random().toString(36) + Date.now().toString(36)

    const tokenData = encodeAbiParameters(
      ['address', 'uint256', 'string', 'uint256', 'string'],
      [agentAddress as `0x${string}`, BigInt(tokenId), action, BigInt(expires), uniqueId]
    )

    const authorizationToken = keccak256(tokenData)

    console.log(`✅ Payment verified - authorization token generated: ${authorizationToken}`)

    return NextResponse.json({
      success: true,
      authorized: true,
      authorizationToken: authorizationToken,
      nonce: uniqueId,
      expires: expires,
      message: `Payment verified. Use this token to execute ${action} on rug #${tokenId}`
    })

  } catch (err) {
    console.error('maintenance action error:', err)
    return NextResponse.json({
      error: 'Failed to execute maintenance action',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
