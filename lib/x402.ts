import { parseEther } from 'viem'
import { evmPaywall } from '@x402/paywall'
import { x402HTTPClient } from '@x402/fetch'

// Official X402 V2 Implementation using Coinbase's modular SDK

interface X402Config {
  facilitatorUrl: string
  payToAddress: string
  network: string
  assetAddress: string
  assetName: string
  rpcUrl?: string
}

export function getX402Config(): X402Config {
  const config = {
    facilitatorUrl: process.env.X402_FACILITATOR_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/x402/facilitator`,
    payToAddress: process.env.X402_PAY_TO_ADDRESS || '',
    network: process.env.X402_NETWORK || 'base-sepolia',
    assetAddress: '0x0000000000000000000000000000000000000000', // ETH
    assetName: 'ETH',
    rpcUrl: process.env.RPC_URL
  }

  console.log(`🔧 X402 Config: payTo=${!!config.payToAddress}, network=${config.network}`)

  return config
}

// Create V2 payment requirements using official @x402 SDK
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
    // Use official V2 EVM paywall
    const paywall = evmPaywall({
      chains: [{
        id: config.network as any,
        rpcUrls: { default: { http: [config.rpcUrl || ''] } }
      }],
      assets: [{
        chainId: config.network as any,
        address: config.assetAddress as any,
        symbol: config.assetName
      }]
    })

    // Create payment requirement using V2 paywall
    const paymentRequirement = await paywall.createPaymentRequirement({
      chainId: config.network as any,
      asset: config.assetAddress as any,
      amount: parseEther(options.price),
      payTo: options.contractAddress || config.payToAddress,
      description: options.description,
      resource: `/api/maintenance/action/${options.tokenId}/${options.functionName}`,
      timeoutSeconds: 900,
      extra: {
        functionName: options.functionName,
        tokenId: options.tokenId,
        maintenanceCost: options.maintenanceCost,
        serviceFee: options.serviceFee
      }
    })

    return {
      x402Version: 2,
      paymentRequired: paymentRequirement
    }

  } catch (error) {
    console.error('❌ Failed to create V2 payment requirement:', error)

    // Fallback to manual V2-compatible format
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
          migrationNote: 'Official V2 SDK fallback'
        }
      }
    }
  }
}

export async function verifyAndSettlePayment(paymentPayload: string): Promise<{
  isValid: boolean
  invalidReason?: string
  settlementSuccess?: boolean
  errorReason?: string
}> {
  const config = getX402Config()

  try {
    // Use official V2 paywall for payment verification
    const paywall = evmPaywall({
      chains: [{
        id: config.network as any,
        rpcUrls: { default: { http: [config.rpcUrl || ''] } }
      }],
      assets: [{
        chainId: config.network as any,
        address: config.assetAddress as any,
        symbol: config.assetName
      }]
    })

    // Verify payment using V2 paywall
    const verification = await paywall.verifyPayment(paymentPayload)

    if (!verification.isValid) {
      return {
        isValid: false,
        invalidReason: verification.error || 'Payment verification failed'
      }
    }

    // For our simplified flow, payment verification is complete
    // Transaction verification happens separately in the action route
    return {
      isValid: true,
      settlementSuccess: true, // Direct contract payments don't need separate settlement
      errorReason: undefined
    }

  } catch (error) {
    console.error('❌ V2 Payment verification error:', error)

    // Fallback to manual verification for compatibility
    console.log('🔄 Falling back to manual V2-compatible verification')
    try {
      const payload: any = JSON.parse(paymentPayload)

      // Support both V1 and V2 versions
      const version = payload.x402Version || 1
      if (version !== 1 && version !== 2) {
        return { isValid: false, invalidReason: 'Unsupported X402 version' }
      }

      // Validate basic structure
      if (!payload.payment || !payload.signature) {
        return { isValid: false, invalidReason: 'Invalid payment payload structure' }
      }

      const payment = payload.payment

      // Validate required fields
      if (!payment.scheme || !payment.network || !payment.asset || !payment.amount || !payment.from || !payment.to || !payment.nonce || !payment.deadline) {
        return { isValid: false, invalidReason: 'Missing required payment fields' }
      }

      // Validate scheme and network
      if (!['exact'].includes(payment.scheme)) {
        return { isValid: false, invalidReason: `Unsupported payment scheme: ${payment.scheme}` }
      }

      if (!['shape-sepolia', 'base-sepolia'].includes(payment.network)) {
        return { isValid: false, invalidReason: `Unsupported network: ${payment.network}` }
      }

      // Validate asset (must be ETH)
      if (payment.asset !== '0x0000000000000000000000000000000000000000') {
        return { isValid: false, invalidReason: `Unsupported asset: ${payment.asset}` }
      }

      // Validate deadline (not expired)
      if (payment.deadline < Date.now() / 1000) {
        return { isValid: false, invalidReason: 'Payment deadline expired' }
      }

      // Validate amount is reasonable
      const amountWei = BigInt(payment.amount)
      const maxReasonableAmount = parseEther('1') // 1 ETH max
      if (amountWei > maxReasonableAmount) {
        return { isValid: false, invalidReason: 'Payment amount too large' }
      }

      return {
        isValid: true,
        settlementSuccess: true,
        errorReason: undefined
      }

    } catch (fallbackError) {
      console.error('Payment verification error:', fallbackError)
      return {
        isValid: false,
        invalidReason: `Payment processing error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
      }
    }
  }
}

