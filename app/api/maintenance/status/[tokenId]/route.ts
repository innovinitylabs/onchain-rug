import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback, onchainRugsABI } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId } from '@/lib/networks'
import { createPaymentRequiredResponse, verifyAndSettlePayment } from '@/lib/x402'

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
    // For testing, use hardcoded Base Sepolia contract
    const contract = chainId === 84532 ? '0xa43532205Fc90b286Da98389a9883347Cc4064a8' : getContractAddress(chainId)
    if (!contract) {
      return NextResponse.json({ error: 'Contract not configured for this network' }, { status: 500 })
    }

    // Status queries are FREE - no X402 payment required for reading from blockchain
    console.log(`📖 Getting maintenance status for rug #${tokenId} (free read operation)`)
    const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await callContractMultiFallback(
      contract,
      maintenanceAbi as any,
      'getMaintenanceOptions',
      [BigInt(tokenId)],
      { chainId }
    ) as [boolean, boolean, boolean, bigint, bigint, bigint]

    const network = getNetworkByChainId(chainId)
    return NextResponse.json({
      chainId,
      network: network?.name,
      tokenId,
      maintenance: {
        canClean,
        canRestore,
        needsMaster,
        cleaningCostWei: cleaningCost.toString(),
        restorationCostWei: restorationCost.toString(),
        masterCostWei: masterCost.toString()
      }
    })
  } catch (err) {
    console.error('status route error', err)
    return NextResponse.json({ error: 'Failed to fetch maintenance status' }, { status: 500 })
  }
}


