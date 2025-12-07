import { NextRequest, NextResponse } from 'next/server'
import { fetchTotalSupply } from '../../rug-market/collection/direct-contract-fetcher'

export async function GET(request: NextRequest) {
  try {
    console.log('[Test TotalSupply] Testing fetchTotalSupply...')
    const totalSupply = await fetchTotalSupply(84532)
    console.log('[Test TotalSupply] Result:', totalSupply)

    return NextResponse.json({
      totalSupply,
      success: true
    })
  } catch (error) {
    console.error('[Test TotalSupply] Error:', error)
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 })
  }
}
