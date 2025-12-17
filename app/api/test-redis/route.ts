import { NextRequest, NextResponse } from 'next/server'
import { RugMarketRedis } from '../../../lib/rug-market-redis'
import { getContractAddress } from '../../../lib/networks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainId = parseInt(searchParams.get('chainId') || '84532')
    const contract = getContractAddress(chainId)

    console.log(`[Test Redis] Testing Redis for chain ${chainId}, contract ${contract}`)

    // Test batch get
    const tokenIds = [1, 2, 3, 4]
    const batchResult = await RugMarketRedis.getNFTDataBatch(chainId, contract, tokenIds)
    console.log(`[Test Redis] Batch get result: ${batchResult.filter(r => r !== null).length} non-null results`)

    // Test individual get
    const individualResult = await RugMarketRedis.getNFTData(chainId, contract, 1)
    console.log(`[Test Redis] Individual get result: ${individualResult !== null}`)
    console.log(`[Test Redis] Individual data:`, individualResult)

    // Test permanent data
    const permanentResult = await RugMarketRedis.getPermanentData(chainId, contract, 1)
    console.log(`[Test Redis] Permanent data result: ${permanentResult !== null}`)
    console.log(`[Test Redis] Permanent data:`, permanentResult)

    // Test dynamic data
    const dynamicResult = await RugMarketRedis.getDynamicData(chainId, contract, 1)
    console.log(`[Test Redis] Dynamic data result: ${dynamicResult !== null}`)
    console.log(`[Test Redis] Dynamic data:`, dynamicResult)

    // Test combined getNFTData call
    let combinedResult = null
    try {
      combinedResult = await RugMarketRedis.getNFTData(chainId, contract, 1)
      console.log(`[Test Redis] Manual getNFTData result: ${combinedResult !== null}`)
    } catch (error) {
      console.log(`[Test Redis] Manual getNFTData error:`, error)
    }

    return NextResponse.json({
      chainId,
      contract,
      tokenIds,
      batchResult: batchResult.map(r => r !== null),
      individualResult: individualResult !== null,
      permanentResult: permanentResult !== null,
      dynamicResult: dynamicResult !== null,
      combinedResult: combinedResult !== null,
      individualData: individualResult,
      permanentData: permanentResult,
      dynamicData: dynamicResult,
      success: true
    })
  } catch (error) {
    console.error('[Test Redis] Error:', error)
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 })
  }
}
