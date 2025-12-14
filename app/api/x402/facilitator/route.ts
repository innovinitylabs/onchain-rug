import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, formatEther, recoverMessageAddress } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Facilitator wallet for settlement operations
const facilitatorPrivateKey = process.env.FACILITATOR_PRIVATE_KEY
const facilitatorAccount = facilitatorPrivateKey ? privateKeyToAccount(facilitatorPrivateKey as `0x${string}`) : null

const facilitatorWallet = facilitatorAccount ? createWalletClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL || 'https://sepolia.base.org'),
  account: facilitatorAccount
}) : null

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL || 'https://sepolia.base.org')
})

// Supported schemes for Shape network
const SUPPORTED_SCHEMES = ['exact']
const SUPPORTED_NETWORKS = ['shape-sepolia', 'base-sepolia']
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
        return await settlePayment(params, request)
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
    x402Version: 2,
    accepts: [paymentRequirement]
  })
}

async function verifyPayment(params: { paymentPayload: string }): Promise<NextResponse> {
  const { paymentPayload } = params

  try {
    const payload: PaymentPayload = JSON.parse(paymentPayload)

    // Validate X402 version (support both V1 and V2 during migration)
    if (payload.x402Version !== 1 && payload.x402Version !== 2) {
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

async function settlePayment(params: { paymentPayload: string }, request: NextRequest): Promise<NextResponse> {
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
        error: 'Payment verification failed',
        details: verifyData.invalidReason
      }, { status: 400 })
    }

    const payload: PaymentPayload = JSON.parse(paymentPayload)
    console.log(`💰 Processing payment: ${formatEther(BigInt(payload.payment.amount))} ETH from ${payload.payment.from} to ${payload.payment.to}`)

    // Verify the actual payment transaction on-chain
    console.log('🔍 Verifying payment transaction on blockchain...')

    try {
      // Get the payment transaction hash from headers
      const paymentTxHash = request.headers.get('x402-payment-tx')
      if (!paymentTxHash) {
        console.log('❌ No payment transaction hash provided')
        return NextResponse.json({
          success: false,
          error: 'Payment transaction hash required'
        }, { status: 400 })
      }

      console.log(`🔍 Checking transaction: ${paymentTxHash}`)

      // Get the transaction receipt
      const receipt = await publicClient.getTransactionReceipt({
        hash: paymentTxHash as `0x${string}`
      })

      if (!receipt) {
        console.log('❌ Payment transaction not found on blockchain')
        return NextResponse.json({
          success: false,
          error: 'Payment transaction not found'
        }, { status: 400 })
      }

      if (receipt.status !== 'success') {
        console.log('❌ Payment transaction failed')
        return NextResponse.json({
          success: false,
          error: 'Payment transaction failed'
        }, { status: 400 })
      }

      // Verify transaction details match the payment request
      const tx = await publicClient.getTransaction({
        hash: paymentTxHash as `0x${string}`
      })

      if (!tx) {
        console.log('❌ Could not retrieve transaction details')
        return NextResponse.json({
          success: false,
          error: 'Could not verify transaction details'
        }, { status: 400 })
      }

      // Verify the transaction matches our payment request
      const expectedFrom = payload.payment.from.toLowerCase()
      const expectedTo = payload.payment.to.toLowerCase()
      const expectedAmount = BigInt(payload.payment.amount)

      const actualFrom = tx.from.toLowerCase()
      const actualTo = tx.to?.toLowerCase()
      const actualAmount = tx.value

      if (actualFrom !== expectedFrom) {
        console.log(`❌ Transaction from address mismatch: expected ${expectedFrom}, got ${actualFrom}`)
        return NextResponse.json({
          success: false,
          error: 'Transaction sender mismatch'
        }, { status: 400 })
      }

      if (actualTo !== expectedTo) {
        console.log(`❌ Transaction to address mismatch: expected ${expectedTo}, got ${actualTo}`)
        return NextResponse.json({
          success: false,
          error: 'Transaction recipient mismatch'
        }, { status: 400 })
      }

      if (actualAmount !== expectedAmount) {
        console.log(`❌ Transaction amount mismatch: expected ${expectedAmount}, got ${actualAmount}`)
        return NextResponse.json({
          success: false,
          error: 'Transaction amount mismatch'
        }, { status: 400 })
      }

      console.log('✅ Payment transaction verified on blockchain')
      console.log(`📝 Ready to issue authorization token for ${payload.payment.amount} wei payment`)

      return NextResponse.json({
        success: true,
        transactionHash: paymentTxHash,
        settledAmount: payload.payment.amount,
        network: payload.payment.network,
        note: 'Testnet settlement - transaction verified on blockchain'
      })

    } catch (verificationError: any) {
      console.log(`❌ Payment verification error: ${verificationError.message}`)
      console.log('🚫 SECURITY: NOT issuing token due to verification failure')

      return NextResponse.json({
        success: false,
        error: 'Payment verification failed - transaction check failed',
        details: verificationError.message
      }, { status: 400 })
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Settlement failed',
      details: error.message
    }, { status: 500 })
  }
}

async function getSupported(): Promise<NextResponse> {
  return NextResponse.json({
    x402Version: 2,
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
