import { NextRequest, NextResponse } from 'next/server'
import { fetchTotalSupply } from '../../../lib/direct-contract-fetcher'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || '84532')

    console.log(`[Test API] Testing totalSupply for chain ${chainId}`)

    const totalSupply = await fetchTotalSupply(chainId)

    console.log(`[Test API] Total supply result: ${totalSupply}`)

    return NextResponse.json({
      chainId,
      totalSupply,
      success: true
    })
  } catch (error) {
    console.error('[Test API] Error:', error)
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 })
  }
}
