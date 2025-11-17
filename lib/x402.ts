import { parseEther } from 'viem'

interface X402Config {
  facilitatorUrl: string
  facilitatorApiKey: string
  payToAddress: string
  network: string
  assetAddress: string
  assetName: string
  privateKey?: string
  rpcUrl?: string
}

export function getX402Config(): X402Config {
  const config = {
    facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
    facilitatorApiKey: process.env.X402_FACILITATOR_API_KEY || '',
    payToAddress: process.env.X402_PAY_TO_ADDRESS || '',
    network: process.env.X402_NETWORK || 'base-sepolia', // Coinbase facilitator supports Base & Ethereum
    assetAddress: '0x0000000000000000000000000000000000000000', // ETH
    assetName: 'ETH',
    rpcUrl: process.env.RPC_URL
  }

  console.log(`🔧 X402 Config: payTo=${!!config.payToAddress}, network=${config.network}`)

  return config
}

// Create payment requirements using our custom facilitator
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

  // console.log(`🔧 createPaymentRequiredResponse called with:`, {
  //   price: options.price,
  //   contractAddress: options.contractAddress,
  //   functionName: options.functionName,
  //   tokenId: options.tokenId
  // })

  if (!config.payToAddress) {
    console.log('🔄 Using X402 fallback (no payTo configured)')
    // Fallback: create basic payment requirement
    return {
      x402: {
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: config.network,
          asset: config.assetAddress,
          payTo: options.contractAddress || '0x0000000000000000000000000000000000000000',
          maxAmountRequired: (parseFloat(options.price || '0') * 1e18).toString(),
          resource: options.contractAddress ? `/api/maintenance/action/${options.tokenId || '0'}/${options.functionName || 'unknown'}` : '/api/payment',
          description: options.description || 'Payment required',
          mimeType: 'application/json',
          maxTimeoutSeconds: 900,
          extra: {
            fallback: true,
            functionName: options.functionName,
            tokenId: options.tokenId,
            maintenanceCost: options.maintenanceCost,
            serviceFee: options.serviceFee
          }
        }]
      }
    }
  }

  try {
    // Call our custom facilitator to generate payment requirements
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for facilitator calls')
    }
    const facilitatorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/x402/facilitator`

    console.log(`🔗 Calling facilitator: ${facilitatorUrl}`)

    const response = await fetch(facilitatorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_payment_requirement',
        price: options.price,
        description: options.description,
        payTo: options.contractAddress || config.payToAddress,
        resource: `/api/maintenance/action/${options.tokenId}/${options.functionName}`,
        scheme: 'exact',
        network: config.network,
        maintenanceCost: options.maintenanceCost,
        serviceFee: options.serviceFee
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Facilitator HTTP error: ${response.status} ${response.statusText}`)
      console.error(`❌ Facilitator error response:`, errorText)
      throw new Error(`Facilitator error: ${response.status} - ${errorText}`)
    }

    const facilitatorResponse = await response.json()
    console.log(`✅ Facilitator response received, has x402: ${!!facilitatorResponse.x402}`)

    if (!facilitatorResponse.x402) {
      console.error(`❌ Facilitator returned invalid response:`, facilitatorResponse)
      throw new Error('Facilitator returned response without x402 structure')
    }

    // Add our extra metadata for agent UX
    if (facilitatorResponse.x402?.accepts?.[0]) {
      facilitatorResponse.x402.accepts[0].extra = {
        ...facilitatorResponse.x402.accepts[0].extra,
        functionName: options.functionName,
        tokenId: options.tokenId,
        maintenanceWei: '0',
        serviceFeeWei: '0',
        totalWei: '0'
      }
    }

    return facilitatorResponse

  } catch (error) {
    console.error('❌ Failed to create payment requirement via facilitator:', error)
    console.log('🔄 Using fallback payment requirement after facilitator error')
    // Fallback to basic response if facilitator fails
    return {
      x402: {
        x402Version: 1,
        accepts: [{
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
            fallback: true
          }
        }]
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

  if (!config.payToAddress) {
    return { isValid: false, invalidReason: 'X402 pay-to address not configured' }
  }

  try {
    // Parse and validate the payment payload directly (no facilitator calls)
    const payload: any = JSON.parse(paymentPayload)

    // Validate X402 version
    if (payload.x402Version !== 1) {
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

    // For our simplified flow, payment verification is complete
    // Transaction verification happens separately in the action route
    return {
      isValid: true,
      settlementSuccess: true, // Direct contract payments don't need separate settlement
      errorReason: undefined
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return {
      isValid: false,
      invalidReason: `Payment processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
