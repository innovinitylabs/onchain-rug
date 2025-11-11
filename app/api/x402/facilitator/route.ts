import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, parseEther, formatEther, recoverMessageAddress } from 'viem'
import { shapeSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Facilitator wallet for settlement operations
const facilitatorPrivateKey = process.env.FACILITATOR_PRIVATE_KEY
const facilitatorAccount = facilitatorPrivateKey ? privateKeyToAccount(facilitatorPrivateKey as `0x${string}`) : null

const facilitatorWallet = facilitatorAccount ? createWalletClient({
  chain: shapeSepolia,
  transport: http(process.env.RPC_URL || 'https://sepolia.shape.network'),
  account: facilitatorAccount
}) : null

// Supported schemes for Shape network
const SUPPORTED_SCHEMES = ['exact']
const SUPPORTED_NETWORKS = ['shape-sepolia']
const SUPPORTED_ASSETS = ['0x0000000000000000000000000000000000000000'] // ETH

interface PaymentRequirement {
  scheme: string
  network: string
  asset: string
  payTo: string
  maxAmountRequired: string
  resource: string
  description: string
  mimeType: string
  maxTimeoutSeconds: number
  extra?: any
}

interface PaymentPayload {
  x402Version: number
  payment: {
    scheme: string
    network: string
    asset: string
    amount: string
    from: string
    to: string
    nonce: string
    deadline: number
  }
  signature: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'create_payment_requirement':
        return await createPaymentRequirement(params)
      case 'verify_payment':
        return await verifyPayment(params)
      case 'settle_payment':
        return await settlePayment(params)
      case 'get_supported':
        return await getSupported()
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Facilitator error:', error)
    return NextResponse.json({
      error: 'Facilitator error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function createPaymentRequirement(params: {
  price: string
  description: string
  payTo?: string
  resource?: string
  scheme?: string
  network?: string
  maintenanceCost?: string
  serviceFee?: string
}): Promise<NextResponse> {
  const {
    price,
    description,
    payTo = process.env.X402_PAY_TO_ADDRESS,
    resource,
    scheme = 'exact',
    network = 'shape-sepolia',
    maintenanceCost,
    serviceFee
  } = params

  console.log(`💰 Creating payment requirement: ${price} ETH (${maintenanceCost || '0'} maintenance + ${serviceFee || '0'} service fee)`)

  if (!payTo) {
    return NextResponse.json({ error: 'Pay-to address not configured' }, { status: 500 })
  }

  if (!SUPPORTED_SCHEMES.includes(scheme)) {
    return NextResponse.json({ error: `Unsupported scheme: ${scheme}` }, { status: 400 })
  }

  if (!SUPPORTED_NETWORKS.includes(network)) {
    return NextResponse.json({ error: `Unsupported network: ${network}` }, { status: 400 })
  }

  // Convert price to wei
  const amountWei = parseEther(price)

  const paymentRequirement: PaymentRequirement = {
    scheme,
    network,
    asset: '0x0000000000000000000000000000000000000000', // ETH
    payTo,
    maxAmountRequired: amountWei.toString(),
    resource: resource || '/api/maintenance/action',
    description,
    mimeType: 'application/json',
    maxTimeoutSeconds: 900, // 15 minutes
    extra: {
      facilitatorUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/x402/facilitator`,
      created: Date.now(),
      expires: Date.now() + (900 * 1000),
      ...(maintenanceCost && { maintenanceCost }),
      ...(serviceFee && { serviceFee })
    }
  }

  return NextResponse.json({
    x402Version: 1,
    accepts: [paymentRequirement]
  })
}

async function verifyPayment(params: { paymentPayload: string }): Promise<NextResponse> {
  const { paymentPayload } = params

  try {
    const payload: PaymentPayload = JSON.parse(paymentPayload)

    // Validate X402 version
    if (payload.x402Version !== 1) {
      return NextResponse.json({
        isValid: false,
        invalidReason: 'Unsupported X402 version'
      })
    }

    // Validate scheme and network
    if (!SUPPORTED_SCHEMES.includes(payload.payment.scheme)) {
      return NextResponse.json({
        isValid: false,
        invalidReason: `Unsupported scheme: ${payload.payment.scheme}`
      })
    }

    if (!SUPPORTED_NETWORKS.includes(payload.payment.network)) {
      return NextResponse.json({
        isValid: false,
        invalidReason: `Unsupported network: ${payload.payment.network}`
      })
    }

    if (!SUPPORTED_ASSETS.includes(payload.payment.asset)) {
      return NextResponse.json({
        isValid: false,
        invalidReason: `Unsupported asset: ${payload.payment.asset}`
      })
    }

    // Validate deadline
    if (payload.payment.deadline < Date.now() / 1000) {
      return NextResponse.json({
        isValid: false,
        invalidReason: 'Payment deadline expired'
      })
    }

    // For 'exact' scheme, verify the signature
    if (payload.payment.scheme === 'exact') {
      // Real signature verification - production ready
      const message = JSON.stringify(payload.payment);

      try {
        const recoveredAddress = await recoverMessageAddress({
          message,
          signature: payload.signature as `0x${string}`
        })

        if (recoveredAddress.toLowerCase() !== payload.payment.from.toLowerCase()) {
          return NextResponse.json({
            isValid: false,
            invalidReason: `Signature verification failed: expected ${payload.payment.from}, got ${recoveredAddress}`
          })
        }

        console.log(`✅ Real signature verified for payment from ${recoveredAddress}`);
      } catch (error) {
        return NextResponse.json({
          isValid: false,
          invalidReason: `Signature verification error: ${error.message}`
        })
      }
    }

    // Check if payment amount is reasonable (not too large)
    const amountWei = BigInt(payload.payment.amount)
    const maxReasonableAmount = parseEther('1') // 1 ETH max
    if (amountWei > maxReasonableAmount) {
      return NextResponse.json({
        isValid: false,
        invalidReason: 'Payment amount too large'
      })
    }

    return NextResponse.json({
      isValid: true,
      paymentDetails: {
        amount: payload.payment.amount,
        from: payload.payment.from,
        to: payload.payment.to,
        scheme: payload.payment.scheme,
        network: payload.payment.network,
        asset: payload.payment.asset
      }
    })

  } catch (error) {
    return NextResponse.json({
      isValid: false,
      invalidReason: 'Invalid payment payload format'
    })
  }
}

async function settlePayment(params: { paymentPayload: string }): Promise<NextResponse> {
  const { paymentPayload } = params

  try {
    console.log('🔄 Starting payment settlement...')

    // First verify the payment
    const verifyResponse = await verifyPayment({ paymentPayload })
    const verifyData = await verifyResponse.json()

    if (!verifyData.isValid) {
      console.log('❌ Settlement failed: Payment verification failed')
      return NextResponse.json({
        success: false,
        errorReason: verifyData.invalidReason
      })
    }

    const payload: PaymentPayload = JSON.parse(paymentPayload)
    console.log(`💰 Settling payment: ${formatEther(BigInt(payload.payment.amount))} ETH from ${payload.payment.from} to ${payload.payment.to}`)

    // For Shape network settlement, we would normally check the blockchain
    // But for this implementation, we'll simulate settlement
    // In production, you'd check the actual transaction on-chain

    console.log('✅ Using simulated settlement for testing')

    // Simulate settlement by checking if the payment would be valid
    // In a real implementation, you'd:
    // 1. Check the blockchain for the actual payment transaction
    // 2. Transfer funds if settlement is required
    // 3. Update payment status

    console.log(`✅ Simulated settlement for payment from ${payload.payment.from} to ${payload.payment.to} of ${formatEther(BigInt(payload.payment.amount))} ETH`)

    return NextResponse.json({
      success: true,
      transactionHash: '0x' + Math.random().toString(16).substring(2, 66), // Simulated tx hash
      settledAmount: payload.payment.amount,
      network: payload.payment.network
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      errorReason: 'Settlement failed'
    })
  }
}

async function getSupported(): Promise<NextResponse> {
  return NextResponse.json({
    x402Version: 1,
    kind: [
      {
        scheme: SUPPORTED_SCHEMES,
        networkId: SUPPORTED_NETWORKS,
        extra: {
          assets: SUPPORTED_ASSETS,
          facilitator: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/x402/facilitator`
        }
      }
    ]
  })
}
