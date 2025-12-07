import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const contractAddress = '0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff'
    const rpcUrl = 'https://sepolia.base.org'

    console.log(`[Test RPC] Making call to ${rpcUrl}`)

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

    console.log(`[Test RPC] Response status: ${response.status}`)

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({
        error: `RPC failed: ${response.status}`,
        response: text,
        success: false
      })
    }

    const data = await response.json()
    console.log(`[Test RPC] Response data:`, data)

    if (data.error) {
      return NextResponse.json({
        error: `RPC error: ${data.error.message}`,
        data,
        success: false
      })
    }

    const totalSupply = parseInt(data.result, 16)
    console.log(`[Test RPC] Parsed totalSupply: ${totalSupply}`)

    return NextResponse.json({
      totalSupply,
      rawResult: data.result,
      success: true
    })

  } catch (error) {
    console.error('[Test RPC] Error:', error)
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 })
  }
}
