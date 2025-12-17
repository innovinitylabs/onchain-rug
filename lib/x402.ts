import { parseEther } from 'viem'

// X402 V2 Direct Payment Implementation
// No facilitator - agents execute transactions directly with their own wallets

interface X402Config {
  payToAddress: string
  network: string
  assetAddress: string
  assetName: string
  rpcUrl?: string
}

export function getX402Config(): X402Config {
  const config = {
    payToAddress: process.env.X402_PAY_TO_ADDRESS || '',
    network: process.env.X402_NETWORK || 'base-sepolia',
    assetAddress: '0x0000000000000000000000000000000000000000', // ETH
    assetName: 'ETH',
    rpcUrl: process.env.RPC_URL
  }

  console.log(`🔧 X402 V2 Config: payTo=${!!config.payToAddress}, network=${config.network}`)

  return config
}

// Create V2 payment requirements using V2-compatible format
export async function createPaymentRequiredResponse(options: {
  price: string
  description: string
  contractAddress?: string
  function?: string
  functionName?: string
  tokenId?: string
  maintenanceCost?: string
  serviceFee?: string
}) {
  const config = getX402Config()

  console.log(`🔧 X402 V2 createPaymentRequiredResponse: ${options.price} ETH for ${options.description}`)

  try {
    // Use official V2 paywall for HTML generation (client-side)
    const paywall = require('@x402/paywall').createPaywall()
      .withNetwork(require('@x402/paywall').evmPaywall)
      .build()

    // For server-side, create V2-compatible payment requirement manually
    // The @x402 packages are primarily client-side, so we maintain server-side logic
    const paymentRequirement = {
      scheme: 'exact',
      network: config.network,
      asset: config.assetAddress,
      payTo: options.contractAddress || config.payToAddress,
      maxAmountRequired: (parseFloat(options.price || '0') * 1e18).toString(),
      resource: `/api/maintenance/action/${options.tokenId}/${options.functionName}`,
      description: options.description,
      mimeType: 'application/json',
      maxTimeoutSeconds: 900,
      extra: {
        functionName: options.functionName,
        tokenId: options.tokenId,
        maintenanceCost: options.maintenanceCost,
        serviceFee: options.serviceFee
      }
    }

    return {
      x402Version: 2,
      paymentRequired: paymentRequirement
    }

  } catch (error) {
    console.error('❌ Failed to create V2 payment requirement:', error)

    // Fallback to basic V2-compatible format
    console.log('🔄 Using V2-compatible fallback format')
    return {
      x402Version: 2,
      paymentRequired: {
        scheme: 'exact',
        network: config.network,
        asset: config.assetAddress,
        payTo: options.contractAddress || config.payToAddress || '0x0000000000000000000000000000000000000000',
        maxAmountRequired: (parseFloat(options.price || '0') * 1e18).toString(),
        resource: `/api/maintenance/action/${options.tokenId}/${options.functionName}`,
        description: options.description,
        mimeType: 'application/json',
        maxTimeoutSeconds: 900,
        extra: {
          functionName: options.functionName,
          tokenId: options.tokenId,
          maintenanceCost: options.maintenanceCost,
          serviceFee: options.serviceFee,
          fallback: true,
          migrationNote: 'V2 SDK integration in progress'
        }
      }
    }
  }
}


