import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId } from '@/lib/networks'

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
    name: 'getAgentServiceFees',
    outputs: [
      { name: 'cleanFee', type: 'uint256' },
      { name: 'restoreFee', type: 'uint256' },
      { name: 'masterFee', type: 'uint256' },
      { name: 'feeRecipient', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

type Action = 'clean' | 'restore' | 'master'

export async function GET(_request: NextRequest, { params }: { params: { tokenId: string, action: Action } }) {
  try {
    const tokenId = params.tokenId
    const action = params.action
    const chainId = DEFAULT_CHAIN_ID
    // For testing, use hardcoded Base Sepolia contract
    const contract = chainId === 84532 ? '0xa43532205Fc90b286Da98389a9883347Cc4064a8' : getContractAddress(chainId)
    if (!contract) {
      return NextResponse.json({ error: 'Contract not configured for this network' }, { status: 500 })
    }

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
      'getAgentServiceFees',
      [],
      { chainId }
    ) as [bigint, bigint, bigint, string]

    const [cleanFee, restoreFee, masterFee, feeRecipient] = feesResult

    let maintenanceWei = 0n
    let serviceFeeWei = 0n
    let functionName = ''
    if (action === 'clean') {
      maintenanceWei = cleaningCost
      serviceFeeWei = cleanFee
      functionName = 'cleanRugAgent'
      if (!canClean && maintenanceWei === 0n) {
        return NextResponse.json({ error: 'Cleaning not needed' }, { status: 400 })
      }
    } else if (action === 'restore') {
      maintenanceWei = restorationCost
      serviceFeeWei = restoreFee
      functionName = 'restoreRugAgent'
      if (!canRestore || maintenanceWei === 0n) {
        return NextResponse.json({ error: 'Restoration not available' }, { status: 400 })
      }
    } else if (action === 'master') {
      maintenanceWei = masterCost
      serviceFeeWei = masterFee
      functionName = 'masterRestoreRugAgent'
      if (!needsMaster || maintenanceWei === 0n) {
        return NextResponse.json({ error: 'Master restoration not needed' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const totalWei = (maintenanceWei + serviceFeeWei).toString()
    const network = getNetworkByChainId(chainId)

    // Return x402-style 402 for agent UX (quote only; agent will call contract directly)
    return NextResponse.json({
      error: 'Payment Required',
      x402: {
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: network?.name || 'unknown',
            asset: '0x0000000000000000000000000000000000000000',
            payTo: contract,
            maxAmountRequired: totalWei,
            resource: `/api/maintenance/quote/${tokenId}/${action}`,
            description: `Rug ${action} service (agent single-tx)`,
            mimeType: 'application/json',
            maxTimeoutSeconds: 900,
            extra: {
              function: functionName,
              maintenanceWei: maintenanceWei.toString(),
              serviceFeeWei: serviceFeeWei.toString(),
              totalWei
            }
          }
        ]
      }
    }, { status: 402 })
  } catch (err) {
    console.error('quote route error:', err)
    return NextResponse.json({ error: 'Failed to generate quote' }, { status: 500 })
  }
}


