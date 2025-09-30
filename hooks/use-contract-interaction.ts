/**
 * Unified contract interaction hook
 * Single source of truth for all blockchain interactions
 */

import React, { useState, useCallback, useRef } from 'react'
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
  ContractError,
  ContractErrorType
} from '@/utils/error-utils'

// Request throttling and deduplication
interface PendingRequest<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
  timestamp: number
}

class RequestManager {
  private pendingRequests = new Map<string, PendingRequest<any>>()
  private lastRequestTime = 0
  private minRequestInterval = 200 // Minimum 200ms between requests

  async throttle<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check for duplicate request
    const existing = this.pendingRequests.get(key)
    if (existing) {
      console.log(`[RequestManager] Using cached request for ${key}`)
      return existing.promise
    }

    // Create new request promise
    let resolve: (value: T) => void
    let reject: (error: any) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })

    this.pendingRequests.set(key, {
      promise,
      resolve: resolve!,
      reject: reject!,
      timestamp: Date.now()
    })

    try {
      // Throttle requests
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.minRequestInterval) {
        const delay = this.minRequestInterval - timeSinceLastRequest
        console.log(`[RequestManager] Throttling request for ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const result = await fn()
      this.lastRequestTime = Date.now()
      resolve!(result)
      return result
    } catch (error) {
      reject!(error)
      throw error
    } finally {
      // Clean up immediately to prevent memory leaks
      // The singleton nature of RequestManager means cleanup happens for the app lifetime
      this.pendingRequests.delete(key)
    }
  }

  // Enhanced retry with rate limit handling
  async withRateLimitRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        // Check if it's a rate limit error
        const isRateLimit = error?.message?.includes('429') ||
                           error?.message?.includes('Too Many Requests') ||
                           error?.code === 429

        if (isRateLimit) {
          console.warn(`[RequestManager] Rate limit hit, attempt ${i + 1}/${maxRetries + 1}`)
          if (i < maxRetries) {
            // Exponential backoff for rate limits (longer delays)
            const delay = baseDelay * Math.pow(2, i) * 2 // Extra multiplier for rate limits
            console.log(`[RequestManager] Waiting ${delay}ms before retry`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }

        // For non-rate-limit errors, use normal retry logic
        if (error instanceof Error) {
          const contractError = handleContractError(error)
          if (contractError.type === ContractErrorType.VALIDATION_ERROR) {
            throw contractError
          }
        }

        if (i < maxRetries) {
          const delay = baseDelay * (i + 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw handleContractError(lastError, 'withRateLimitRetry')
  }
}

// Global request manager instance
const requestManager = new RequestManager()

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

  // Manual eth_call using ethers with throttling
  const callManual = useCallback(async <T>(
    functionName: keyof typeof FUNCTION_SELECTORS,
    tokenId: number,
    options: ContractCallOptions = {}
  ): Promise<T> => {
    const apiKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    if (!apiKey) {
      throw new Error('ALCHEMY_API_KEY not configured')
    }

    // Create request key for deduplication
    const requestKey = `manual-${functionName}-${tokenId}-${chainId}`

    return requestManager.throttle(requestKey, () =>
      requestManager.withRateLimitRetry(async () => {
        const result = await manualEthCall(functionName, tokenId, chainId, apiKey)
        return decodeContractResult(functionName, result) as T
      }, options.retries || 2, 2000)
    )
  }, [chainId])

  // Wagmi contract call with throttling and rate limit handling
  const callWagmi = useCallback(async <T>(
    functionName: keyof typeof FUNCTION_SELECTORS,
    tokenId: number,
    options: ContractCallOptions = {}
  ): Promise<T> => {
    if (!publicClient || !contractAddress) {
      throw new Error('Public client or contract address not available')
    }

    // Create request key for deduplication
    const requestKey = `${functionName}-${tokenId}-${chainId}`

    return requestManager.throttle(requestKey, () =>
      requestManager.withRateLimitRetry(async () => {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: CONTRACT_ABIS[functionName] as any,
          functionName,
          args: [BigInt(tokenId)],
        } as any)
        return result as T
      }, options.retries || 2, 2000) // Longer base delay for rate limits
    )
  }, [publicClient, contractAddress, chainId])

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

    // Use refs to avoid dependency cycles that cause infinite re-renders
    const functionNameRef = React.useRef(functionName)
    const tokenIdRef = React.useRef(tokenId)
    const optionsRef = React.useRef(options)

    // Update refs when values change
    functionNameRef.current = functionName
    tokenIdRef.current = tokenId
    optionsRef.current = options

    const execute = useCallback(async () => {
      const currentTokenId = tokenIdRef.current
      const currentFunctionName = functionNameRef.current
      const currentOptions = optionsRef.current

      if (currentTokenId === null || currentTokenId === undefined) {
        setData(null)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await callContract<T>(currentFunctionName, currentTokenId, currentOptions)
        setData(result)
      } catch (err) {
        const contractError = err instanceof Error ? handleContractError(err, `useContractCall(${currentFunctionName})`) : null
        setError(contractError || handleContractError(new Error('Unknown error')))
      } finally {
        setLoading(false)
      }
    }, [callContract]) // Only depend on callContract, which is stable

    // Auto-execute on mount and when core dependencies change
    React.useEffect(() => {
      execute()
    }, [functionName, tokenId]) // Only re-run when these actually change

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
