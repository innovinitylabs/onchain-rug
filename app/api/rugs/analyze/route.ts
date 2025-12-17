import { NextRequest, NextResponse } from 'next/server'
import { callContractMultiFallback, onchainRugsABI } from '@/lib/web3'
import { getContractAddress, DEFAULT_CHAIN_ID } from '@/lib/networks'
import { checkRateLimit, getRateLimitStatus } from '@/utils/rate-limiter'

/**
 * GET /api/rugs/analyze
 * 
 * Analyze all rugs owned by an address with AI-powered assessments
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
    // Note: Analysis is more expensive, so we use the same rate limit
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

    console.log(`🧠 Analyzing rugs owned by ${ownerAddress} on chain ${chainId}`)

    // First, get all rugs owned by this address
    const totalSupply = await callContractMultiFallback(
      contract,
      onchainRugsABI,
      'totalSupply',
      [],
      { chainId }
    ) as unknown as bigint

    const ownedRugs: number[] = []
    for (let tokenId = 0; tokenId <= Number(totalSupply); tokenId++) {
      try {
        const owner = await callContractMultiFallback(
          contract,
          onchainRugsABI,
          'ownerOf',
          [BigInt(tokenId)],
          { chainId }
        ) as string

        if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
          ownedRugs.push(tokenId)
        }
      } catch (error) {
        // Token doesn't exist - skip
      }
    }

    console.log(`   Found ${ownedRugs.length} rug(s) to analyze`)

    // Analyze each rug using the maintenance status endpoint
    const analyses = []
    for (const tokenId of ownedRugs) {
      try {
        // Get maintenance status for this rug
        const statusResponse = await fetch(
          `${request.nextUrl.origin}/api/maintenance/status/${tokenId}?chainId=${chainId}`
        )
        
        if (!statusResponse.ok) {
          console.log(`   Failed to get status for rug #${tokenId}`)
          continue
        }

        const statusData = await statusResponse.json()
        
        // Analyze the rug condition
        const analysis = analyzeRugCondition(tokenId, statusData)
        if (analysis) {
          analyses.push(analysis)
        }
      } catch (error) {
        console.log(`   Error analyzing rug #${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Generate overall assessment
    const overallAssessment = generateOverallAssessment(analyses)

    console.log(`✅ Analyzed ${analyses.length} rug(s)`)

    return NextResponse.json({
      success: true,
      ownerAddress,
      totalRugs: analyses.length,
      analyses,
      overallAssessment,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': currentRateLimit.remaining.toString(),
        'X-RateLimit-Reset': currentRateLimit.resetAt.toString()
      }
    })

  } catch (error) {
    console.error('Error analyzing rugs:', error)
    return NextResponse.json(
      { error: 'Failed to analyze rugs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function analyzeRugCondition(tokenId: number, statusData: any) {
  try {
    const maintenance = statusData.maintenance || {}
    const canClean = maintenance.canClean || false
    const canRestore = maintenance.canRestore || false
    const needsMaster = maintenance.needsMaster || false

    // Determine condition and priority
    let condition = 'excellent'
    let priority = 'low'
    const recommendations: string[] = []

    if (needsMaster) {
      condition = 'needs master restoration'
      priority = 'high'
      recommendations.push('URGENT: Master restoration needed - significant wear detected')
    } else if (canRestore) {
      condition = 'needs restoration'
      priority = 'medium'
      recommendations.push('Consider restoration - showing wear')
    } else if (canClean) {
      condition = 'needs cleaning'
      priority = 'medium'
      recommendations.push('Schedule cleaning - dirt accumulation detected')
    } else {
      condition = 'clean'
      recommendations.push('Rug is in good condition')
    }

    return {
      tokenId,
      condition,
      priority,
      canClean,
      canRestore,
      needsMaster,
      recommendations,
      summary: `Rug #${tokenId}: ${condition}`
    }
  } catch (error) {
    return null
  }
}

function generateOverallAssessment(analyses: any[]) {
  if (analyses.length === 0) {
    return {
      summary: 'No rugs found to analyze',
      recommendations: ['Make sure you own rugs on this network']
    }
  }

  const totalRugs = analyses.length
  const highPriority = analyses.filter(a => a.priority === 'high').length
  const mediumPriority = analyses.filter(a => a.priority === 'medium').length
  const lowPriority = analyses.filter(a => a.priority === 'low').length

  let summary = `You have ${totalRugs} rug${totalRugs > 1 ? 's' : ''}. `
  const recommendations: string[] = []

  if (highPriority > 0) {
    summary += `${highPriority} need${highPriority > 1 ? '' : 's'} immediate attention. `
    recommendations.push(`${highPriority} rug${highPriority > 1 ? 's need' : ' needs'} urgent maintenance`)
  }

  if (mediumPriority > 0) {
    summary += `${mediumPriority} could use maintenance. `
    recommendations.push(`${mediumPriority} rug${mediumPriority > 1 ? 's could' : ' could'} benefit from maintenance`)
  }

  if (lowPriority > 0) {
    summary += `${lowPriority} ${lowPriority > 1 ? 'are' : 'is'} in good condition. `
  }

  return {
    summary: summary.trim(),
    recommendations
  }
}

