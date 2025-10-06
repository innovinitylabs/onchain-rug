/**
 * Combined rug data management hook
 * Single hook for all rug-related data fetching and management
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useContractInteraction } from './use-contract-interaction'
import { useTokenURI, TokenURIData } from './use-token-uri'
import { getDirtDescription, getAgingDescription } from '@/utils/parsing-utils'
import { handleContractError, logContractError } from '@/utils/error-utils'

export interface RugData extends TokenURIData {
  tokenId: number
  owner: string | null
  dirtDescription: string
  textureDescription: string
  isClean: boolean
  needsCleaning: boolean
  cleaningCost: number
}

export interface UseRugDataResult {
  rug: RugData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  refreshAging: () => Promise<void>
}

export function useRugData(tokenId: number | null): UseRugDataResult {
  const { useContractCall } = useContractInteraction()
  const tokenURI = useTokenURI(tokenId)

  const [owner, setOwner] = useState<string | null>(null)
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [ownerError, setOwnerError] = useState<string | null>(null)

  // Get owner of the token
  const ownerResult = useContractCall<string>('ownerOf', tokenId || 0, {
    retries: 2,
  })

  // Update owner when contract call succeeds
  React.useEffect(() => {
    if (ownerResult.data) {
      setOwner(ownerResult.data)
      setOwnerError(null)
    } else if (ownerResult.error) {
      setOwnerError(`Failed to fetch owner: ${ownerResult.error.message}`)
      logContractError(ownerResult.error, 'useRugData.fetchOwner')
    }
  }, [ownerResult.data, ownerResult.error])

  // Update owner loading state
  React.useEffect(() => {
    setOwnerLoading(ownerResult.loading)
  }, [ownerResult.loading])

  // Create combined rug data
  const rug = useMemo((): RugData | null => {
    if (!tokenURI.data || !owner) {
      return null
    }

    const { dirtLevel, textureLevel } = tokenURI.data.aging

    return {
      ...tokenURI.data,
      tokenId: tokenId || 0,
      owner,
      dirtDescription: getDirtDescription(dirtLevel),
      textureDescription: getAgingDescription(textureLevel),
      isClean: dirtLevel === 0,
      needsCleaning: dirtLevel > 0,
      cleaningCost: dirtLevel > 0 ? 0.01 : 0, // This would come from config
    }
  }, [tokenURI.data, owner, tokenId])

  // Combined loading state
  const loading = tokenURI.loading || ownerLoading

  // Combined error state
  const error = tokenURI.error || ownerError

  // Refetch function for all data
  const refetch = useCallback(async () => {
    try {
      await Promise.all([
        tokenURI.refetch(),
        ownerResult.refetch(),
      ])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refetch rug data'
      logContractError(handleContractError(err, 'useRugData.refetch'), 'useRugData')
    }
  }, [tokenURI.refetch, ownerResult.refetch])

  // Refresh aging data specifically
  const refreshAging = useCallback(async () => {
    try {
      await tokenURI.refetch()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh aging data'
      logContractError(handleContractError(err, 'useRugData.refreshAging'), 'useRugData')
    }
  }, [tokenURI.refetch])

  return {
    rug,
    loading,
    error,
    refetch,
    refreshAging,
  }
}
