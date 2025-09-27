/**
 * Unified contract interaction hook
 * Single source of truth for all blockchain interactions
 */

import React, { useState, useCallback } from 'react'
import { useChainId, usePublicClient } from 'wagmi'
import { ethers } from 'ethers'
import {
  getContractAddress,
  getAlchemyRpcUrl,
  manualEthCall,
  decodeContractResult,
  CONTRACT_ABIS,
  FUNCTION_SELECTORS
} from '@/utils/contract-utils'
import {
  handleContractError,
  logContractError,
  withRetry,
  ContractError
} from '@/utils/error-utils'

// Types
export interface ContractCallOptions {
  useManualCall?: boolean // Use raw eth_call instead of wagmi
  retries?: number
  timeout?: number
}

export interface ContractCallResult<T = any> {
  data: T | null
  loading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}

// Main contract interaction hook
export function useContractInteraction() {
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [globalLoading, setGlobalLoading] = useState(false)

  // Get contract address for current chain
  const contractAddress = getContractAddress(chainId)

  // Manual eth_call using ethers
  const callManual = useCallback(async <T>(
    functionName: keyof typeof FUNCTION_SELECTORS,
    tokenId: number,
    options: ContractCallOptions = {}
  ): Promise<T> => {
    const apiKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    if (!apiKey) {
      throw new Error('ALCHEMY_API_KEY not configured')
    }

    return withRetry(async () => {
      const result = await manualEthCall(functionName, tokenId, chainId, apiKey)
      return decodeContractResult(functionName, result) as T
    }, options.retries || 3)
  }, [chainId])

  // Wagmi contract call
  const callWagmi = useCallback(async <T>(
    functionName: keyof typeof FUNCTION_SELECTORS,
    tokenId: number,
    options: ContractCallOptions = {}
  ): Promise<T> => {
    if (!publicClient || !contractAddress) {
      throw new Error('Public client or contract address not available')
    }

    return withRetry(async () => {
      const result = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: CONTRACT_ABIS[functionName] as any,
        functionName,
        args: [BigInt(tokenId)],
      } as any)
      return result as T
    }, options.retries || 3)
  }, [publicClient, contractAddress])

  // Unified contract call function
  const callContract = useCallback(async <T>(
    functionName: keyof typeof FUNCTION_SELECTORS,
    tokenId: number,
    options: ContractCallOptions = {}
  ): Promise<T> => {
    const { useManualCall = false } = options

    try {
      if (useManualCall) {
        return await callManual<T>(functionName, tokenId, options)
      } else {
        return await callWagmi<T>(functionName, tokenId, options)
      }
    } catch (error) {
      const contractError = handleContractError(error, `callContract(${functionName}, ${tokenId})`)
      logContractError(contractError, 'useContractInteraction')
      throw contractError
    }
  }, [callManual, callWagmi])

  // Hook for contract calls with loading state
  const useContractCall = useCallback(<T>(
    functionName: keyof typeof FUNCTION_SELECTORS,
    tokenId: number | null,
    options: ContractCallOptions = {}
  ): ContractCallResult<T> => {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<ContractError | null>(null)

    const execute = useCallback(async () => {
      if (tokenId === null || tokenId === undefined) {
        setData(null)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await callContract<T>(functionName, tokenId, options)
        setData(result)
      } catch (err) {
        const contractError = err instanceof Error ? handleContractError(err, `useContractCall(${functionName})`) : null
        setError(contractError || handleContractError(new Error('Unknown error')))
      } finally {
        setLoading(false)
      }
    }, [functionName, tokenId, callContract, options])

    // Auto-execute on mount and when dependencies change
    React.useEffect(() => {
      execute()
    }, [execute])

    return {
      data,
      loading,
      error,
      refetch: execute,
    }
  }, [callContract])

  return {
    contractAddress,
    chainId,
    callContract,
    useContractCall,
    manualCall: callManual,
    wagmiCall: callWagmi,
    globalLoading,
  }
}
