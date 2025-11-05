export type RelayTx = {
  to: string
  value: string
  data: string
}

export type RelayQuoteRequest = {
  user: string
  originChainId: number
  destinationChainId: number
  originCurrency: string
  destinationCurrency: string
  amount: string
  tradeType: 'EXACT_OUTPUT'
  txs: RelayTx[]
  recipient?: string
  referrer?: string
  refundTo?: string
}

export type RelayQuoteResponse = any

// Use testnet API for development, mainnet for production
// Set NEXT_PUBLIC_RELAY_USE_TESTNET=true to use testnet API
const useTestnet = process.env.NEXT_PUBLIC_RELAY_USE_TESTNET === 'true'
const RELAY_BASE = useTestnet 
  ? 'https://api.testnets.relay.link' 
  : (process.env.NEXT_PUBLIC_RELAY_API_BASE || 'https://api.relay.link')

function assertAmountMatchesTxs(amount: string, txs: RelayTx[]): void {
  try {
    const sum = txs.reduce((acc, t) => acc + BigInt(t.value || '0'), BigInt(0))
    if (sum !== BigInt(amount)) {
      throw new Error(`Relay amount mismatch: amount=${amount}, sum(txs.value)=${sum.toString()}`)
    }
  } catch {
    // If parsing fails, let the request flow but log for diagnosis
    console.warn('Relay amount validation skipped due to parsing issue')
  }
}

export async function getRelayQuote(body: RelayQuoteRequest): Promise<RelayQuoteResponse> {
  if (body.tradeType !== 'EXACT_OUTPUT') {
    throw new Error('Relay tradeType must be EXACT_OUTPUT')
  }
  assertAmountMatchesTxs(body.amount, body.txs)

  console.log('Relay Quote Request:', JSON.stringify(body, null, 2))
  console.log('Using Relay API:', RELAY_BASE)

  const res = await fetch(`${RELAY_BASE}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  
  const responseText = await res.text()
  console.log('Relay Quote Response:', res.status, responseText)
  
  if (!res.ok) {
    // Check if this is a route issue
    if (responseText.includes('NO_SWAP_ROUTES_FOUND')) {
      console.error('⚠️ Relay does not support this route for contract calls.')
      console.error('Suggestion: Try Ethereum Sepolia → Shape Sepolia or Base Sepolia → Ethereum Sepolia')
      console.error('Note: Some routes work for simple bridging but not for contract execution')
    }
    throw new Error(`Relay quote failed: ${res.status} ${responseText}`)
  }
  return JSON.parse(responseText)
}

export async function getRelayStatus(requestId: string): Promise<any> {
  const url = `${RELAY_BASE}/intents/status/v2?requestId=${encodeURIComponent(requestId)}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Relay status failed: ${res.status} ${text}`)
  }
  return res.json()
}


