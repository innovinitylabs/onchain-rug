/**
 * Unified Gas Estimation System
 *
 * Handles gas estimation for complex contract functions that wagmi's automatic
 * estimation might fail on due to payable functions, cross-facet calls, or
 * time-dependent logic.
 */

import { ethers } from 'ethers'
import { getAlchemyRpcUrl, getContractAddress } from './contract-utils'
import { onchainRugsABI } from '@/lib/web3'
import { handleContractError, logContractError } from './error-utils'

export interface GasEstimationOptions {
  gasLimitMultiplier?: number // Default 1.2 (20% buffer)
  maxGasLimit?: bigint // Maximum allowed gas limit
  minGasLimit?: bigint // Minimum allowed gas limit
}

export interface GasEstimateResult {
  gasLimit: bigint
  gasPrice: bigint
  estimatedCost: bigint
  success: boolean
  error?: string
}

/**
 * Default gas estimation options
 */
export const DEFAULT_GAS_OPTIONS: GasEstimationOptions = {
  gasLimitMultiplier: 1.2, // 20% buffer
  maxGasLimit: BigInt(5_000_000), // 5M gas max
  minGasLimit: BigInt(21_000), // Minimum transaction gas
}

/**
 * Unified gas estimation for contract functions
 */
export async function estimateContractGas(
  functionName: string,
  args: any[] = [],
  options: GasEstimationOptions = DEFAULT_GAS_OPTIONS,
  chainId: number,
  apiKey: string,
  value?: bigint // For payable functions
): Promise<GasEstimateResult> {
  try {
    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      throw new Error(`Contract address not found for chain ${chainId}`)
    }

    const rpcUrl = getAlchemyRpcUrl(chainId, apiKey)
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Create contract instance for estimation
    const contract = new ethers.Contract(contractAddress, onchainRugsABI, provider)

    // Prepare transaction data
    const txData = {
      to: contractAddress,
      data: contract.interface.encodeFunctionData(functionName, args),
      value: value || BigInt(0),
    }

    // Estimate gas limit
    let gasLimit: bigint
    try {
      const estimatedGas = await provider.estimateGas(txData)
      gasLimit = estimatedGas * BigInt(Math.floor((options.gasLimitMultiplier || 1.2) * 100)) / BigInt(100)
    } catch (estimateError) {
      // If estimation fails, use fallback gas limits based on function type
      gasLimit = getFallbackGasLimit(functionName)
    }

    // Apply limits
    if (options.maxGasLimit && gasLimit > options.maxGasLimit) {
      gasLimit = options.maxGasLimit
    }
    if (options.minGasLimit && gasLimit < options.minGasLimit) {
      gasLimit = options.minGasLimit
    }

    // Get current gas price
    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || BigInt(1_000_000_000) // 1 gwei fallback

    // Calculate estimated cost
    const estimatedCost = gasLimit * gasPrice + (value || BigInt(0))

    return {
      gasLimit,
      gasPrice,
      estimatedCost,
      success: true,
    }

  } catch (error) {
    const contractError = handleContractError(error, `estimateContractGas.${functionName}`)
    logContractError(contractError, 'gas-estimation')

    // Return fallback values on error
    const fallbackGasLimit = getFallbackGasLimit(functionName)
    const fallbackGasPrice = BigInt(2_000_000_000) // 2 gwei fallback

    return {
      gasLimit: fallbackGasLimit,
      gasPrice: fallbackGasPrice,
      estimatedCost: fallbackGasLimit * fallbackGasPrice + (value || BigInt(0)),
      success: false,
      error: contractError.message,
    }
  }
}

/**
 * Fallback gas limits for common contract functions
 * Based on typical gas usage for complex contract operations
 */
function getFallbackGasLimit(functionName: string): bigint {
  const gasLimits: Record<string, bigint> = {
    // Maintenance operations (complex with cross-facet calls)
    'cleanRug': BigInt(500_000),        // Complex: checks + updates + frame level update
    'restoreRug': BigInt(400_000),      // Texture restoration
    'masterRestoreRug': BigInt(600_000),// Full restoration

    // Minting operations
    'mintRug': BigInt(800_000),         // Complex minting with data storage

    // Commerce operations
    'buyRug': BigInt(350_000),          // Transfer + payment
    'sellRug': BigInt(300_000),         // Listing update
    'cancelSale': BigInt(250_000),      // Listing removal

    // Laundering operations
    'launderRug': BigInt(450_000),      // Complex laundering logic

    // Default fallback
    'default': BigInt(250_000),
  }

  return gasLimits[functionName] || gasLimits.default
}

/**
 * Enhanced gas estimation with retry logic for network issues
 */
export async function estimateContractGasWithRetry(
  functionName: string,
  args: any[] = [],
  options: GasEstimationOptions = DEFAULT_GAS_OPTIONS,
  chainId: number,
  apiKey: string,
  value?: bigint,
  retries: number = 2
): Promise<GasEstimateResult> {
  let lastError: string = ''

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await estimateContractGas(functionName, args, options, chainId, apiKey, value)

      // If we got a successful estimate or this is our last attempt, return it
      if (result.success || attempt === retries) {
        return result
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      if (attempt < retries) {
        console.warn(`Gas estimation attempt ${attempt + 1} failed for ${functionName}:`, error)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }
  }

  // Return fallback if all retries failed
  const fallbackGasLimit = getFallbackGasLimit(functionName)
  const fallbackGasPrice = BigInt(2_000_000_000) // 2 gwei fallback

  return {
    gasLimit: fallbackGasLimit,
    gasPrice: fallbackGasPrice,
    estimatedCost: fallbackGasLimit * fallbackGasPrice + (value || BigInt(0)),
    success: false,
    error: `All gas estimation attempts failed. Last error: ${lastError}`,
  }
}

/**
 * Get recommended gas options for different function types
 */
export function getRecommendedGasOptions(functionName: string): GasEstimationOptions {
  const baseOptions = { ...DEFAULT_GAS_OPTIONS }

  // Higher buffer for complex operations
  if (['cleanRug', 'masterRestoreRug', 'mintRug', 'launderRug'].includes(functionName)) {
    return {
      ...baseOptions,
      gasLimitMultiplier: 1.5, // 50% buffer for complex operations
      maxGasLimit: BigInt(1_000_000), // Higher max for complex ops
    }
  }

  // Standard options for simple operations
  return baseOptions
}

/**
 * Format gas estimate for display
 */
export function formatGasEstimate(result: GasEstimateResult): {
  gasLimit: string
  gasPrice: string
  estimatedCost: string
  readable: string
} {
  return {
    gasLimit: result.gasLimit.toString(),
    gasPrice: ethers.formatUnits(result.gasPrice, 'gwei'),
    estimatedCost: ethers.formatEther(result.estimatedCost),
    readable: `${result.gasLimit.toString()} gas @ ${ethers.formatUnits(result.gasPrice, 'gwei')} gwei = ${ethers.formatEther(result.estimatedCost)} ETH`,
  }
}
