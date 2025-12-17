import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther } from 'viem'
import { getContractAddress, DEFAULT_CHAIN_ID, getNetworkByChainId, getRpcUrl } from '@/lib/networks'
import { defineChain } from 'viem'
import { checkRateLimit, getRateLimitStatus } from '@/utils/rate-limiter'

/**
 * GET /api/agent/stats
 * 
 * Get agent statistics (wallet balance, gas prices, etc.)
 * Query params: address (required) - agent wallet address
 * Rate limit: 10 requests/minute per agent address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentAddress = searchParams.get('address')
    const chainId = parseInt(searchParams.get('chainId') || DEFAULT_CHAIN_ID.toString())

    if (!agentAddress) {
      return NextResponse.json(
        { error: 'Agent address required', details: 'Provide agent address as query parameter: ?address=0x...' },
        { status: 400 }
      )
    }

    if (!agentAddress.startsWith('0x') || agentAddress.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid agent address format' },
        { status: 400 }
      )
    }
    
    // 🛡️ Input validation: Validate chainId
    if (isNaN(chainId) || chainId <= 0) {
      return NextResponse.json(
        { error: 'Invalid chainId', details: 'ChainId must be a valid positive number' },
        { status: 400 }
      )
    }

    // Rate limit by agent address (10 requests/minute)
    const rateLimitCheck = checkRateLimit(agentAddress)
    if (!rateLimitCheck.allowed) {
      const resetInSeconds = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)
      console.log(`🚫 Rate limit exceeded for agent ${agentAddress}. Reset in ${resetInSeconds}s`)
      return NextResponse.json({
        error: 'Rate limit exceeded',
        details: `Maximum 10 requests per minute. Try again in ${resetInSeconds} seconds.`,
        resetAt: rateLimitCheck.resetAt,
        resetInSeconds
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitCheck.resetAt.toString(),
          'Retry-After': resetInSeconds.toString()
        }
      })
    }

    const currentRateLimit = getRateLimitStatus(agentAddress)

    const contract = getContractAddress(chainId)
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not configured for this network' },
        { status: 500 }
      )
    }

    const network = getNetworkByChainId(chainId)
    const rpcUrl = getRpcUrl(chainId)

    if (!network || !rpcUrl) {
      return NextResponse.json(
        { error: 'Network configuration error' },
        { status: 500 }
      )
    }

    console.log(`📊 Getting agent stats for ${agentAddress} on chain ${chainId}`)

    // Define chain
    const chain = defineChain({
      id: network.chainId,
      name: network.displayName,
      nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        default: {
          http: [rpcUrl],
        },
      },
      blockExplorers: {
        default: {
          name: network.blockExplorerName,
          url: network.explorerUrl,
        },
      },
      testnet: network.isTestnet,
    })

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    // Get agent wallet balance
    let walletBalance = '0'
    let walletBalanceEth = '0'
    let walletError = null
    try {
      const balance = await publicClient.getBalance({
        address: agentAddress as `0x${string}`
      })
      walletBalance = balance.toString()
      walletBalanceEth = formatEther(balance)
    } catch (error) {
      walletError = error instanceof Error ? error.message : 'Unknown error'
    }

    // Get current gas price
    let gasPrice = '20000000000' // 20 gwei default
    let gasPriceGwei = '20'
    try {
      const currentGasPrice = await publicClient.getGasPrice()
      gasPrice = currentGasPrice.toString()
      gasPriceGwei = (Number(currentGasPrice) / 1e9).toFixed(2)
    } catch (error) {
      console.log(`   Could not get gas price: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Get service fee from contract
    let serviceFeeInfo = '0.00042 ETH flat for all maintenance actions'
    try {
      const serviceFeeAbi = [{
        inputs: [],
        name: 'getAgentServiceFee',
        outputs: [
          { name: 'serviceFee', type: 'uint256' },
          { name: 'feeRecipient', type: 'address' }
        ],
        stateMutability: 'view',
        type: 'function'
      }] as const

      const [serviceFee] = await publicClient.readContract({
        address: contract as `0x${string}`,
        abi: serviceFeeAbi,
        functionName: 'getAgentServiceFee'
      }) as [bigint, string]

      serviceFeeInfo = `${formatEther(serviceFee)} ETH flat for all maintenance actions`
    } catch (error) {
      console.log(`   Could not get service fee: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    const stats = {
      walletAddress: agentAddress,
      walletBalance,
      walletBalanceEth,
      walletError,
      currentGasPrice: gasPrice,
      currentGasPriceGwei: gasPriceGwei,
      contractAddress: contract,
      network: network.displayName,
      chainId: network.chainId,
      serviceFeeInfo,
      note: 'Real blockchain data - balances checked live from network. Maintenance count not tracked on-chain.'
    }

    console.log(`✅ Agent stats retrieved for ${agentAddress}`)

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      dataSource: 'live-blockchain'
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': currentRateLimit.remaining.toString(),
        'X-RateLimit-Reset': currentRateLimit.resetAt.toString()
      }
    })

  } catch (error) {
    console.error('Error getting agent stats:', error)
    return NextResponse.json(
      { error: 'Failed to get agent stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

