import { NextRequest, NextResponse } from 'next/server'
import { getContractAddress, getRpcUrl } from '../../../src/lib/networks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainIdStr = searchParams.get('chainId') || '84532'
    const chainId = parseInt(chainIdStr)

    console.log(`[Test Collection Debug] chainIdStr: "${chainIdStr}", chainId: ${chainId}`)

    // Get contract and RPC
    const contractAddress = getContractAddress(chainId)
    const rpcUrl = getRpcUrl(chainId)

    console.log(`[Test Collection Debug] contractAddress: ${contractAddress}`)
    console.log(`[Test Collection Debug] rpcUrl: ${rpcUrl}`)

    if (!contractAddress || !rpcUrl) {
      return NextResponse.json({
        error: 'Contract address or RPC URL not configured',
        chainId,
        contractAddress,
        rpcUrl,
        success: false
      })
    }

    // Make RPC call
    console.log(`[Test Collection Debug] Making RPC call...`)

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: contractAddress.toLowerCase(),
          data: '0x18160ddd' // totalSupply()
        }, 'latest']
      })
    })

    console.log(`[Test Collection Debug] RPC response status: ${response.status}`)

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({
        error: `RPC call failed: ${response.status}`,
        responseBody: text,
        success: false
      })
    }

    const data = await response.json()
    console.log(`[Test Collection Debug] RPC response data:`, data)

    if (data.error) {
      return NextResponse.json({
        error: `RPC error: ${data.error.message}`,
        data,
        success: false
      })
    }

    const totalSupply = parseInt(data.result, 16)
    console.log(`[Test Collection Debug] Parsed totalSupply: ${totalSupply}`)

    return NextResponse.json({
      chainId,
      contractAddress,
      rpcUrl,
      totalSupply,
      rawResult: data.result,
      success: true
    })

  } catch (error) {
    console.error('[Test Collection Debug] Error:', error)
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 })
  }
}
