import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId, CONTRACT_ADDRESSES } from '@/lib/networks'
import { createPaymentRequiredResponse } from '@/lib/x402'
import { formatEther } from 'viem'

// Simple in-memory cache for quote results (prevents repeated expensive calls)
const quoteCache = new Map<string, { result: any, timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds

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

export async function GET(_request: NextRequest, context: { params: Promise<{ tokenId: string, action: Action }> }) {
  try {
    const params = await context.params
    const tokenId = params.tokenId
    const action = params.action
    const chainId = DEFAULT_CHAIN_ID
    const contract = getContractAddress(chainId)
    if (!contract) {
      return NextResponse.json({ error: 'Contract not configured for this network' }, { status: 500 })
    }

    // 🛡️ QUOTE ENDPOINT PROTECTION: Prevent abuse by hallucinating agents
    const agentAddress = _request.headers.get('x-agent-address')

    if (!agentAddress) {
      console.log(`🚫 Quote request rejected: Missing agent address`)
      return NextResponse.json({
        error: 'Agent address required for quotes',
        details: 'x-agent-address header required even for informational quotes'
      }, { status: 400 })
    }

    // Validate agent address format
    if (!agentAddress.startsWith('0x') || agentAddress.length !== 42) {
      console.log(`🚫 Quote request rejected: Invalid agent address format: ${agentAddress}`)
      return NextResponse.json({
        error: 'Invalid agent address format',
        details: 'Agent address must be a valid 42-character hex string starting with 0x'
      }, { status: 400 })
    }

    // ✅ Agent validation passed - now safe to do expensive operations

    // 📦 Check cache first to avoid repeated expensive calls
    const cacheKey = `${tokenId}-${action}-${chainId}`
    const cached = quoteCache.get(cacheKey)
    const now = Date.now()

    let canClean: boolean, canRestore: boolean, needsMaster: boolean
    let cleaningCost: bigint, restorationCost: bigint, masterCost: bigint
    let serviceFee: bigint, feeRecipient: string

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`📦 Using cached quote for ${cacheKey}`)
      ;({ canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost, serviceFee, feeRecipient } = cached.result)
    } else {
      console.log(`🔄 Fetching fresh quote for ${cacheKey}`)

      const [canCleanResult, canRestoreResult, needsMasterResult, cleaningCostResult, restorationCostResult, masterCostResult] = await callContractMultiFallback(
        contract,
        maintenanceAbi as any,
        'getMaintenanceOptions',
        [BigInt(tokenId)],
        { chainId }
      ) as [boolean, boolean, boolean, bigint, bigint, bigint]

      const feesResult = await callContractMultiFallback(
        contract,
        adminFeesAbi as any,
        'getAgentServiceFee',
        [],
        { chainId }
      ) as [bigint, string]

      canClean = canCleanResult
      canRestore = canRestoreResult
      needsMaster = needsMasterResult
      cleaningCost = cleaningCostResult
      restorationCost = restorationCostResult
      masterCost = masterCostResult
      serviceFee = feesResult[0]
      feeRecipient = feesResult[1]

      // Cache the result
      const cacheData = { canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost, serviceFee, feeRecipient }
      quoteCache.set(cacheKey, { result: cacheData, timestamp: now })

      // Clean old cache entries (simple cleanup)
      for (const [key, value] of quoteCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          quoteCache.delete(key)
        }
      }
    }

    let maintenanceWei = BigInt(0)
    const serviceFeeWei = serviceFee // Flat fee for all actions
    let functionName = ''
    if (action === 'clean') {
      maintenanceWei = cleaningCost
      functionName = 'cleanRugAgent'
      if (!canClean && maintenanceWei === BigInt(0)) {
        return NextResponse.json({ error: 'Cleaning not needed' }, { status: 400 })
      }
    } else if (action === 'restore') {
      maintenanceWei = restorationCost
      functionName = 'restoreRugAgent'
      if (!canRestore || maintenanceWei === BigInt(0)) {
        return NextResponse.json({ error: 'Restoration not available' }, { status: 400 })
      }
    } else if (action === 'master') {
      maintenanceWei = masterCost
      functionName = 'masterRestoreRugAgent'
      if (!needsMaster || maintenanceWei === BigInt(0)) {
        return NextResponse.json({ error: 'Master restoration not needed' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const totalWei = maintenanceWei + serviceFeeWei
    const price = (Number(totalWei) / 1e18).toString() // Convert to ETH

    // Use X402 facilitator to generate proper payment requirement
    const paymentRequired = await createPaymentRequiredResponse({
      price: price,
      description: `Rug ${action} service (agent single-tx)`,
      contractAddress: contract,
      functionName: functionName,
      tokenId: tokenId,
      maintenanceCost: formatEther(maintenanceWei),
      serviceFee: formatEther(serviceFeeWei)
    })

    // Add extra metadata for agent UX
    if (paymentRequired.x402?.accepts?.[0]) {
      paymentRequired.x402.accepts[0].extra = {
        ...paymentRequired.x402.accepts[0].extra,
        functionName: functionName,
              maintenanceWei: maintenanceWei.toString(),
              serviceFeeWei: serviceFeeWei.toString(),
        totalWei: totalWei.toString()
      }
    }

    console.log(`💰 X402 quote generated for ${action} on rug #${tokenId}: ${price} ETH`)
    return NextResponse.json(paymentRequired, { status: 402 })
  } catch (err) {
    console.error('quote route error:', err)
    return NextResponse.json({ error: 'Failed to generate quote' }, { status: 500 })
  }
}


