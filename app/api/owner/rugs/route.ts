import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback, onchainRugsABI } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID } from '@/lib/networks'
import { checkRateLimit, getRateLimitStatus } from '@/utils/rate-limiter'

/**
 * GET /api/owner/rugs
 * 
 * Get all rugs owned by a specific address
 * Query params: owner (required)
 * Rate limit: 10 requests/minute per owner address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerAddress = searchParams.get('owner')
    const chainId = parseInt(searchParams.get('chainId') || DEFAULT_CHAIN_ID.toString())

    if (!ownerAddress) {
      return NextResponse.json(
        { error: 'Owner address required', details: 'Provide owner address as query parameter: ?owner=0x...' },
        { status: 400 }
      )
    }

    if (!ownerAddress.startsWith('0x') || ownerAddress.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid owner address format' },
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

    // Rate limit by owner address (10 requests/minute)
    const rateLimitCheck = checkRateLimit(ownerAddress)
    if (!rateLimitCheck.allowed) {
      const resetInSeconds = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)
      console.log(`🚫 Rate limit exceeded for owner ${ownerAddress}. Reset in ${resetInSeconds}s`)
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

    const currentRateLimit = getRateLimitStatus(ownerAddress)

    const contract = getContractAddress(chainId)
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not configured for this network' },
        { status: 500 }
      )
    }

    console.log(`🔍 Discovering rugs owned by ${ownerAddress} on chain ${chainId}`)

    // Get total supply to know how many tokens to check
    const totalSupply = await callContractMultiFallback(
      contract,
      onchainRugsABI,
      'totalSupply',
      [],
      { chainId }
    ) as unknown as bigint

    console.log(`   Scanning ${totalSupply} total tokens...`)

    // Scan through all possible token IDs to find ones owned by the owner
    const ownedRugs: number[] = []

    for (let tokenId = 0; tokenId <= Number(totalSupply); tokenId++) {
      try {
        const owner = await callContractMultiFallback(
          contract,
          onchainRugsABI,
          'ownerOf',
          [BigInt(tokenId)],
          { chainId }
        ) as unknown as string

        if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
          ownedRugs.push(tokenId)
        }
      } catch (error: any) {
        // Token doesn't exist or other error - skip
        const errorMsg = error?.message || String(error)
        if (!errorMsg.includes('token does not exist') && 
            !errorMsg.includes('ERC721: invalid token ID') &&
            !errorMsg.includes('execution reverted')) {
          console.log(`   Token ${tokenId} error: ${errorMsg.substring(0, 50)}...`)
        }
      }
    }

    console.log(`✅ Found ${ownedRugs.length} rug(s) owned by ${ownerAddress}`)

    return NextResponse.json({
      success: true,
      ownerAddress,
      ownedRugs,
      totalOwned: ownedRugs.length,
      chainId
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': currentRateLimit.remaining.toString(),
        'X-RateLimit-Reset': currentRateLimit.resetAt.toString()
      }
    })

  } catch (error) {
    console.error('Error discovering owner rugs:', error)
    return NextResponse.json(
      { error: 'Failed to discover owner rugs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

