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
  return {
    facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
    facilitatorApiKey: process.env.X402_FACILITATOR_API_KEY || '',
    payToAddress: process.env.X402_PAY_TO_ADDRESS || '',
    network: process.env.X402_NETWORK || 'base-sepolia', // Coinbase facilitator supports Base & Ethereum
    assetAddress: '0x0000000000000000000000000000000000000000', // ETH
    assetName: 'ETH',
    rpcUrl: process.env.RPC_URL
  }
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

  if (!config.payToAddress) {
    console.warn('X402 pay-to address not configured')
    return {
      error: 'Payment Required',
      x402: {
        x402Version: 1,
        accepts: []
      }
    }
  }

  try {
    // Call our custom facilitator to generate payment requirements
    const facilitatorUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/x402/facilitator`
      : 'http://localhost:3000/api/x402/facilitator'

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
      throw new Error(`Facilitator error: ${response.status}`)
    }

    const facilitatorResponse = await response.json()

    // Add our extra metadata for agent UX
    if (facilitatorResponse.x402?.accepts?.[0]) {
      facilitatorResponse.x402.accepts[0].extra = {
        ...facilitatorResponse.x402.accepts[0].extra,
        functionName: options.functionName,
        tokenId: options.tokenId,
        maintenanceWei: '0', // These would be calculated by the maintenance API
        serviceFeeWei: '0',
        totalWei: '0'
      }
    }

    return {
      error: 'Payment Required',
      x402: facilitatorResponse
    }

  } catch (error) {
    console.error('Failed to create payment requirement:', error)
    // Fallback to basic response if facilitator fails
    return {
      error: 'Payment Required',
      x402: {
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: config.network,
          asset: '0x0000000000000000000000000000000000000000',
          payTo: options.contractAddress || config.payToAddress,
          maxAmountRequired: (parseFloat(options.price) * 1e18).toString(),
          resource: `/api/maintenance/action/${options.tokenId}/${options.functionName}`,
          description: options.description,
          mimeType: 'application/json',
          maxTimeoutSeconds: 900,
          extra: {
            functionName: options.functionName,
            tokenId: options.tokenId,
            fallback: true // Indicates this is a fallback response
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
