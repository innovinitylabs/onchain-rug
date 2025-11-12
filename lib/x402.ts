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
    const facilitatorUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/x402/facilitator`
      : 'http://localhost:3000/api/x402/facilitator'

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
    // Call our custom facilitator to verify and settle payment
    const facilitatorUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/x402/facilitator`
      : 'http://localhost:3000/api/x402/facilitator'

    // First verify the payment
    const verifyResponse = await fetch(facilitatorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'verify_payment',
        paymentPayload
      })
    })

    if (!verifyResponse.ok) {
      return { isValid: false, invalidReason: 'Facilitator verification failed' }
    }

    const verifyResult = await verifyResponse.json()

    if (!verifyResult.isValid) {
      return {
        isValid: false,
        invalidReason: verifyResult.invalidReason
      }
    }

    // If verification passed, attempt settlement
    const settleResponse = await fetch(facilitatorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'settle_payment',
        paymentPayload
      })
    })

    if (!settleResponse.ok) {
      return {
        isValid: true, // Payment is valid but settlement failed
        settlementSuccess: false,
        errorReason: 'Settlement request failed'
      }
    }

    const settleResult = await settleResponse.json()

    return {
      isValid: true,
      settlementSuccess: settleResult.success,
      errorReason: settleResult.success ? undefined : settleResult.errorReason
    }

  } catch (error) {
    console.error('Payment verification/settlement error:', error)
    return {
      isValid: false,
      invalidReason: `Payment processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
