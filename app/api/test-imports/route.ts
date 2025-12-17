import { NextRequest, NextResponse } from 'next/server'
import { getContractAddress, getRpcUrl } from '../../../lib/networks'

export async function GET(request: NextRequest) {
  try {
    const chainId = 84532

    console.log('[Test Imports] Testing imports...')
    console.log('[Test Imports] getContractAddress function:', typeof getContractAddress)
    console.log('[Test Imports] getRpcUrl function:', typeof getRpcUrl)

    const contractAddress = getContractAddress(chainId)
    const rpcUrl = getRpcUrl(chainId)

    console.log(`[Test Imports] getContractAddress(${chainId}) = ${contractAddress}`)
    console.log(`[Test Imports] getRpcUrl(${chainId}) = ${rpcUrl}`)

    return NextResponse.json({
      chainId,
      contractAddress,
      rpcUrl,
      getContractAddress: typeof getContractAddress,
      getRpcUrl: typeof getRpcUrl,
      success: true
    })

  } catch (error) {
    console.error('[Test Imports] Error:', error)
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 })
  }
}
