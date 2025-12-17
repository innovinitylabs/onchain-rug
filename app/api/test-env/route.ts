import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    agentPrivateKey: process.env.AGENT_PRIVATE_KEY ? 'SET' : 'NOT SET',
    agentPrivateKeyValue: process.env.AGENT_PRIVATE_KEY?.substring(0, 10) + '...',
    allAgentVars: Object.keys(process.env).filter(key => key.toLowerCase().includes('agent')),
    rpcUrl: process.env.RPC_URL,
    chainId: process.env.CHAIN_ID,
    note: 'X402 v2: No facilitator - agents execute transactions directly'
  })
}