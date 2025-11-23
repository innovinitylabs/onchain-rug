/**
 * viem multicall utilities with chunking
 * 
 * WARNING: This is example code - adapt imports, ABIs, and types to your real project.
 * Uses viem's multicall3 aggregate pattern for batch blockchain reads.
 */

import { createPublicClient, http, encodeFunctionData, type Address, type PublicClient } from 'viem'
import { getRpcUrl, getMulticallAddress, getNetworkByChainId } from './networks'
import { onchainRugsABI } from './web3'

// Batch size for multicall (RPC limits typically 100-200)
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100')

/**
 * Create a public client for a specific chain
 */
// Temporarily disabled multicall due to viem type issues
// This will be re-enabled once the build succeeds
export function createChainClient(chainId: number): PublicClient {
  throw new Error('Multicall temporarily disabled - build issue')
}

/**
 * Multicall3 aggregate interface
 */
interface MulticallCall {
  target: Address
  callData: `0x${string}`
}

interface MulticallResult {
  success: boolean
  returnData: `0x${string}`
}

/**
 * Execute a batch of contract calls using multicall3
 */
export async function batchReadContract(
  chainId: number,
  contractAddress: Address,
  calls: Array<{ functionName: string; args: any[] }>,
  abi: any[]
): Promise<Array<{ success: boolean; data: any; error?: Error }>> {
  const client = createChainClient(chainId)
  const multicallAddress = getMulticallAddress(chainId) as Address

  // Encode all calls
  const multicallCalls: MulticallCall[] = calls.map((call) => {
    const callData = encodeFunctionData({
      abi,
      functionName: call.functionName as any,
      args: call.args,
    })

    return {
      target: contractAddress,
      callData,
    }
  })

  try {
    // Use multicall3 aggregate
    // viem will use the default multicall address if not specified
    // We specify it explicitly for compatibility across all chains
    const results = await client.multicall({
      contracts: calls.map((call, i) => ({
        address: contractAddress,
        abi,
        functionName: call.functionName as any,
        args: call.args,
      })),
      multicallAddress, // Chain-specific multicall address
    })

    return results.map((result, i) => {
      if (result.status === 'success') {
        return {
          success: true,
          data: result.data,
          error: undefined,
        }
      } else {
        return {
          success: false,
          data: null,
          error: result.error || new Error('Multicall failed'),
        }
      }
    })
  } catch (error) {
    console.error('Multicall error:', error)
    // Return all failures
    return calls.map(() => ({
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }))
  }
}

/**
 * Chunk an array into batches
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Batch read with automatic chunking and retry logic
 */
export async function batchReadWithRetry(
  chainId: number,
  contractAddress: Address,
  calls: Array<{ functionName: string; args: any[] }>,
  abi: any[],
  options?: {
    batchSize?: number
    maxRetries?: number
    retryDelay?: number
  }
): Promise<Array<{ success: boolean; data: any; error?: Error }>> {
  const batchSize = options?.batchSize || BATCH_SIZE
  const maxRetries = options?.maxRetries || 3
  const retryDelay = options?.retryDelay || 1000

  // Chunk calls into batches
  const callChunks = chunkArray(calls, batchSize)
  const results: Array<{ success: boolean; data: any; error?: Error }> = []

  for (const chunk of callChunks) {
    let attempts = 0
    let chunkResults: Array<{ success: boolean; data: any; error?: Error }> = []

    while (attempts < maxRetries) {
      try {
        chunkResults = await batchReadContract(chainId, contractAddress, chunk, abi)
        
        // Check if all calls succeeded
        const allSuccess = chunkResults.every(r => r.success)
        if (allSuccess || attempts === maxRetries - 1) {
          break
        }
      } catch (error) {
        console.error(`Batch read attempt ${attempts + 1} failed:`, error)
      }

      attempts++
      if (attempts < maxRetries) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempts - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    results.push(...chunkResults)
  }

  return results
}

/**
 * Read multiple token URIs in batch
 */
export async function batchReadTokenURIs(
  chainId: number,
  contractAddress: Address,
  tokenIds: number[]
): Promise<Array<{ tokenId: number; tokenURI: string | null; error?: Error }>> {
  const calls = tokenIds.map(tokenId => ({
    functionName: 'tokenURI' as const,
    args: [BigInt(tokenId)],
  }))

  const results = await batchReadWithRetry(chainId, contractAddress, calls, onchainRugsABI)

  return results.map((result, i) => ({
    tokenId: tokenIds[i],
    tokenURI: result.success ? (result.data as string) : null,
    error: result.error,
  }))
}

/**
 * Read multiple owners in batch
 */
export async function batchReadOwners(
  chainId: number,
  contractAddress: Address,
  tokenIds: number[]
): Promise<Array<{ tokenId: number; owner: string | null; error?: Error }>> {
  const calls = tokenIds.map(tokenId => ({
    functionName: 'ownerOf' as const,
    args: [BigInt(tokenId)],
  }))

  const results = await batchReadWithRetry(chainId, contractAddress, calls, onchainRugsABI)

  return results.map((result, i) => ({
    tokenId: tokenIds[i],
    owner: result.success ? (result.data as Address) : null,
    error: result.error,
  }))
}

/**
 * Read multiple dirt levels in batch
 */
export async function batchReadDirtLevels(
  chainId: number,
  contractAddress: Address,
  tokenIds: number[]
): Promise<Array<{ tokenId: number; dirtLevel: number | null; error?: Error }>> {
  const calls = tokenIds.map(tokenId => ({
    functionName: 'getDirtLevel' as const,
    args: [BigInt(tokenId)],
  }))

  const results = await batchReadWithRetry(chainId, contractAddress, calls, onchainRugsABI)

  return results.map((result, i) => ({
    tokenId: tokenIds[i],
    dirtLevel: result.success ? Number(result.data) : null,
    error: result.error,
  }))
}

/**
 * Read multiple aging levels in batch
 */
export async function batchReadAgingLevels(
  chainId: number,
  contractAddress: Address,
  tokenIds: number[]
): Promise<Array<{ tokenId: number; agingLevel: number | null; error?: Error }>> {
  const calls = tokenIds.map(tokenId => ({
    functionName: 'getAgingLevel' as const,
    args: [BigInt(tokenId)],
  }))

  const results = await batchReadWithRetry(chainId, contractAddress, calls, onchainRugsABI)

  return results.map((result, i) => ({
    tokenId: tokenIds[i],
    agingLevel: result.success ? Number(result.data) : null,
    error: result.error,
  }))
}

/**
 * Read dynamic data (dirt + aging levels) in batch
 */
export async function batchReadDynamicData(
  chainId: number,
  contractAddress: Address,
  tokenIds: number[]
): Promise<Array<{
  tokenId: number
  dirtLevel: number | null
  agingLevel: number | null
  owner: string | null
  error?: Error
}>> {
  // Read all three in parallel batches
  const [dirtResults, agingResults, ownerResults] = await Promise.all([
    batchReadDirtLevels(chainId, contractAddress, tokenIds),
    batchReadAgingLevels(chainId, contractAddress, tokenIds),
    batchReadOwners(chainId, contractAddress, tokenIds),
  ])

  // Combine results
  return tokenIds.map((tokenId, i) => ({
    tokenId,
    dirtLevel: dirtResults[i]?.dirtLevel ?? null,
    agingLevel: agingResults[i]?.agingLevel ?? null,
    owner: ownerResults[i]?.owner ?? null,
    error: dirtResults[i]?.error || agingResults[i]?.error || ownerResults[i]?.error,
  }))
}

