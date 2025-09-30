/**
 * Centralized tokenURI fetching and parsing hook
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useContractInteraction } from './use-contract-interaction'
import { parseTokenURIData, isValidTokenURI } from '@/utils/parsing-utils'
import { handleContractError, logContractError } from '@/utils/error-utils'

export interface TokenURIData {
  tokenURI: string | null
  metadata: any
  aging: {
    dirtLevel: number
    textureLevel: number
    lastCleaned: bigint | null
    mintTime: number
  }
  traits: {
    seed?: string
    paletteName?: string
    minifiedPalette?: string
    minifiedStripeData?: string
    textRows?: string[]
    warpThickness?: number
    complexity?: number
    characterCount?: number
    stripeCount?: number
    mintTime?: number
  }
  animationUrl?: string
  image?: string
  name?: string
}

export interface UseTokenURIResult {
  data: TokenURIData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  rawTokenURI: string | null
}

export function useTokenURI(tokenId: number | null): UseTokenURIResult {
  const { useContractCall } = useContractInteraction()

  const [rawTokenURI, setRawTokenURI] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Contract call for tokenURI
  const tokenURIResult = useContractCall<string>('tokenURI', tokenId || 0, {
    retries: 2,
  })

  // Parse tokenURI data
  const parsedData = useMemo((): TokenURIData | null => {
    if (!rawTokenURI || !isValidTokenURI(rawTokenURI)) {
      return null
    }

    try {
      return parseTokenURIData(rawTokenURI)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse tokenURI data'
      setError(errorMessage)
      logContractError(
        handleContractError(err, 'useTokenURI.parseTokenURIData'),
        'useTokenURI'
      )
      return null
    }
  }, [rawTokenURI])

  // Update raw tokenURI when contract call succeeds
  React.useEffect(() => {
    if (tokenURIResult.data) {
      setRawTokenURI(tokenURIResult.data)
      setError(null)
    } else if (tokenURIResult.error) {
      setError(`Failed to fetch tokenURI: ${tokenURIResult.error.message}`)
      logContractError(tokenURIResult.error, 'useTokenURI.fetchTokenURI')
    }
  }, [tokenURIResult.data, tokenURIResult.error])

  // Loading state
  React.useEffect(() => {
    setLoading(tokenURIResult.loading)
  }, [tokenURIResult.loading])

  // Refetch function
  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // This will trigger the useContractCall to refetch
      await tokenURIResult.refetch()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refetch tokenURI'
      setError(errorMessage)
      logContractError(handleContractError(err, 'useTokenURI.refetch'), 'useTokenURI')
    } finally {
      setLoading(false)
    }
  }, [tokenURIResult.refetch])

  return {
    data: parsedData,
    loading,
    error,
    refetch,
    rawTokenURI,
  }
}
