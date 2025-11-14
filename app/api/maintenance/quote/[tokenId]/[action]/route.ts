import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId, CONTRACT_ADDRESSES } from '@/lib/networks'
import { createPaymentRequiredResponse } from '@/lib/x402'
import { formatEther } from 'viem'

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

    // 🚨 VULNERABILITY NOTE: Quote endpoint does expensive contract calls without validation
    // This can be abused by hallucinating agents. Consider adding rate limiting for production.

    const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await callContractMultiFallback(
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

    const [serviceFee, feeRecipient] = feesResult

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


