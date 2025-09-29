/**
 * Unified Gas Estimation System
 *
 * Handles gas estimation for complex contract functions that wagmi's automatic
 * estimation might fail on due to payable functions, cross-facet calls, or
 * time-dependent logic.
 */

import { ethers } from 'ethers'
import { getAlchemyRpcUrl, getContractAddress } from './contract-utils'
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
  gasLimitMultiplier: 1.25, // 25% buffer
  maxGasLimit: BigInt(5_000_000), // 5M gas max
  minGasLimit: BigInt(21_000), // Minimum transaction gas
}

/**
 * Get ABI for specific contract functions
 */
function getFunctionABI(functionName: string): any[] {
  const functionABIs: Record<string, any> = {
    // Rug maintenance functions
    'mintRug': [
      {
        inputs: [
          { name: 'textRows', type: 'string[]' },
          { name: 'palette', type: 'string' },
          { name: 'stripeData', type: 'string' },
          { name: 'characterMap', type: 'string' },
          { name: 'warpThickness', type: 'uint256' }
        ],
        name: 'mintWithText',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
      },
    ],
    // ERC721 functions (from onchainRugsABI)
    'ownerOf': [
      {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'ownerOf',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'tokenURI': [
      {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    'cleanRug': [
      {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'cleanRug',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
      },
    ],
  }

  return functionABIs[functionName] || [
    {
      inputs: [{ name: '', type: 'uint256' }],
      name: functionName,
      outputs: [],
      stateMutability: 'view',
      type: 'function',
    },
  ]
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
  value?: bigint, // For payable functions
  fromAddress?: string // For ownership simulation
): Promise<GasEstimateResult> {
  try {
    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      throw new Error(`Contract address not found for chain ${chainId}`)
    }

    const rpcUrl = getAlchemyRpcUrl(chainId, apiKey)
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Create contract instance with ABI that includes the requested function
    // For functions that require ownership/state checks, provide basic ABI
    const contractABI = getFunctionABI(functionName)
    const contract = new ethers.Contract(contractAddress, contractABI, provider)

    // Prepare transaction data
    const txData = {
      to: contractAddress,
      data: contract.interface.encodeFunctionData(functionName, args),
      value: value || BigInt(0),
      ...(fromAddress && { from: fromAddress }), // Include from address for ownership simulation
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
    let gasPrice = feeData.gasPrice || feeData.maxFeePerGas || ethers.parseUnits('2', 'gwei') // 2 gwei fallback

    // Ensure minimum gas price for testnets (prevent extremely low gas prices)
    const minGasPrice = ethers.parseUnits('1', 'gwei') // 1 gwei minimum
    if (gasPrice < minGasPrice) {
      gasPrice = minGasPrice
    }

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
    // TEMPORARY: Using maximum gas to bypass estimation issues
    'cleanRug': BigInt(8_000_000),      // 8M gas: Maximum to ensure it works
    'restoreRug': BigInt(8_000_000),    // 8M gas: Maximum to ensure it works
    'masterRestoreRug': BigInt(8_000_000),// 8M gas: Maximum to ensure it works

    // Minting operations
    'mintRug': BigInt(8_000_000),       // 8M gas: Maximum to ensure it works

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
  fromAddress?: string,
  retries: number = 2
): Promise<GasEstimateResult> {
  // ============================================================================
  // TEMPORARY SOLUTION: Using maximum gas to bypass estimation issues
  // This will be fixed later with proper gas estimation
  // ============================================================================
  console.log(`TEMPORARY: Using maximum gas for ${functionName} (bypassing estimation)`)
  return {
    gasLimit: BigInt(8_000_000), // 8M gas maximum
    gasPrice: ethers.parseUnits('1', 'gwei'), // 1 gwei
    estimatedCost: BigInt(8_000_000) * ethers.parseUnits('1', 'gwei'),
    success: true
  }
  let lastError: string = ''

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await estimateContractGas(functionName, args, options, chainId, apiKey, value, fromAddress)

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
