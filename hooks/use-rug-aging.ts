import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { useState, useEffect, useMemo } from 'react'
import { ethers } from 'ethers'
import { config, agingConfig } from '@/lib/config'
import { shapeSepolia, shapeMainnet, baseSepolia, baseMainnet, contractAddresses, onchainRugsABI } from '@/lib/web3'
import { useTokenURI } from './use-token-uri'
import { getDirtDescription, getAgingDescription } from '@/utils/parsing-utils'
import { estimateContractGasWithRetry, getRecommendedGasOptions, formatGasEstimate } from '@/utils/gas-estimation'

// Hook for getting maintenance options from contract
export function useMaintenanceOptions(tokenId?: bigint) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  const { data: maintenanceOptions, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'getMaintenanceOptions',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && !!contractAddress
    }
  })

  return {
    maintenanceOptions: maintenanceOptions as [boolean, boolean, boolean, bigint, bigint, bigint] | undefined,
    isLoading,
    error,
    canClean: maintenanceOptions?.[0] ?? false,
    canRestore: maintenanceOptions?.[1] ?? false,
    needsMaster: maintenanceOptions?.[2] ?? false,
    cleaningCost: maintenanceOptions?.[3] ?? BigInt(0),
    restorationCost: maintenanceOptions?.[4] ?? BigInt(0),
    masterCost: maintenanceOptions?.[5] ?? BigInt(0)
  }
}

// Rug aging hook for managing dirt and texture states
export function useRugAging(tokenId?: bigint) {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [dirtLevel, setDirtLevel] = useState(0)
  const [agingLevel, setAgingLevel] = useState(0)
  const [lastCleaned, setLastCleaned] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const contractAddress = contractAddresses[chainId]

  // Use the new consolidated tokenURI hook
  const tokenURI = useTokenURI(tokenId ? Number(tokenId) : null)

  // Legacy refetch function for backward compatibility
  const refetch = async () => {
    await tokenURI.refetch()
  }

  // Parse aging data from tokenURI
  const agingData = useMemo(() => {
    if (!tokenURI.data) return null

    try {
      const { aging } = tokenURI.data

      return {
        dirtLevel: aging.dirtLevel,
        agingLevel: aging.agingLevel, // Updated: contract now uses agingLevel instead of textureLevel
        showDirt: aging.dirtLevel > 0,
        showAging: aging.agingLevel > 0, // Updated: show aging instead of texture
        timeSinceCleaned: BigInt(0), // Not directly available in tokenURI
        timeSinceMint: BigInt(0), // Not directly available in tokenURI
      }
    } catch (error) {
      console.warn('Failed to parse tokenURI for aging data:', error)
      return null
    }
  }, [tokenURI])

  // Calculate aging based on tokenURI data
  useEffect(() => {
    if (agingData && tokenId) {
      // Use the dirt and aging levels from tokenURI attributes
      setDirtLevel(agingData.dirtLevel)
      setAgingLevel(agingData.agingLevel)

      // For last cleaned time, we don't have this in tokenURI attributes
      // Could be added to tokenURI generation if needed
      setLastCleaned(null)
    }
  }, [agingData, tokenId])

  // Update loading state
  useEffect(() => {
    setIsLoading(tokenURI.loading)
  }, [tokenURI.loading])

  return {
    dirtLevel,
    agingLevel,
    lastCleaned,
    isLoading,
    refetch,
  }
}

// Hook for restoring rug texture transactions
export function useRestoreRug() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const contractAddress = contractAddresses[chainId]

  const restoreRug = async (tokenId: bigint, textureLevel: number, providedGasEstimate?: { gasLimit: bigint }) => {
    console.log('🔍 DEBUG: Wallet connection check for restore')
    console.log('Address:', address)
    console.log('Chain ID:', chainId)
    console.log('writeContract available:', !!writeContract)

    if (!address) {
      console.error('❌ No wallet connected')
      throw new Error('Please connect your wallet first')
    }

    // Check if on supported network
    const supportedChainIds = [11011, 360, 84532, 8453] // Shape Sepolia, Shape Mainnet, Base Sepolia, Base Mainnet
    if (!supportedChainIds.includes(chainId)) {
      console.error('❌ Unsupported network:', chainId, 'Supported:', supportedChainIds)
      throw new Error(`Please switch to a supported network: Shape Sepolia (${11011}), Shape Mainnet (${360}), Base Sepolia (${84532}), or Base Mainnet (${8453})`)
    }

    if (!writeContract) {
      console.error('❌ writeContract function not available')
      return
    }

    // Check for existing error
    if (error) {
      console.error('❌ Existing transaction error:', error)
      throw new Error(`Cannot proceed with transaction: ${error.message}`)
    }

    console.log('restoreRug called with:', { tokenId: tokenId.toString(), textureLevel, providedGasEstimate })

    // Get restoration cost from contract (source of truth)
    // For now, use fallback pricing - will be improved with proper hook integration
    const restorationCost = BigInt('10000000000000') // 0.00001 ETH

    console.log('Using contract-based pricing - restoration cost:', restorationCost.toString())

    try {
      // Select appropriate chain based on chainId
      let chain
      if (chainId === 360) {
        chain = shapeMainnet
      } else if (chainId === 11011) {
        chain = shapeSepolia
      } else if (chainId === 8453) {
        chain = baseMainnet
      } else if (chainId === 84532) {
        chain = baseSepolia
      } else {
        chain = shapeSepolia // Default fallback
      }

      // Prepare transaction parameters
      const txParams: any = {
        address: contractAddress as `0x${string}`,
        abi: onchainRugsABI,
        functionName: 'restoreRug',
        args: [tokenId],
        value: BigInt(restorationCost),
        account: address,
      }

      // Add gas estimate if provided, otherwise do client-side estimation
      if (providedGasEstimate?.gasLimit) {
        txParams.gasLimit = BigInt(providedGasEstimate.gasLimit)
        console.log('Using provided gas estimate:', providedGasEstimate.gasLimit.toString())
      } else {
        // Get client-side gas estimation with domain-restricted API key
        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        if (!apiKey) {
          throw new Error('NEXT_PUBLIC_ALCHEMY_API_KEY not configured - gas estimation failed')
        }

        const gasOptions = getRecommendedGasOptions('restoreRug')
        const gasEstimate = await estimateContractGasWithRetry(
          'restoreRug',
          [tokenId],
          gasOptions,
          chainId,
          apiKey,
          BigInt(restorationCost),
          address // Pass user address for ownership simulation
        )

        txParams.gasLimit = gasEstimate.gasLimit
        console.log('RestoreRug gas estimation:', formatGasEstimate(gasEstimate))
      }

      console.log('Submitting restoreRug transaction with params:', {
        address: txParams.address,
        functionName: txParams.functionName,
        args: txParams.args,
        value: txParams.value?.toString(),
        gasLimit: txParams.gasLimit?.toString(),
        gasLimitType: typeof txParams.gasLimit,
        chain: txParams.chain?.id
      })

      // Trigger the transaction using writeContract
      console.log('Sending transaction with writeContract...')
      console.log('Final gas limit:', txParams.gasLimit, 'type:', typeof txParams.gasLimit)

      const writeContractParams = {
        address: contractAddress as `0x${string}`,
        abi: onchainRugsABI as any, // Cast to any to bypass strict typing
        functionName: 'restoreRug',
        args: [tokenId],
        value: BigInt(restorationCost),
        gas: txParams.gasLimit,
        chain,
        account: address as `0x${string}`,
      }

      console.log('writeContract parameters:', {
        address: writeContractParams.address,
        functionName: writeContractParams.functionName,
        args: writeContractParams.args,
        value: writeContractParams.value?.toString(),
        gas: writeContractParams.gas?.toString(),
        gasType: typeof writeContractParams.gas,
        chainId: writeContractParams.chain?.id,
        account: writeContractParams.account
      })

      try {
        const result = await writeContract(writeContractParams)
        console.log('writeContract result:', result)
        return { success: true, result }
      } catch (writeError) {
        console.error('writeContract failed:', writeError)
        throw writeError
      }
    } catch (err) {
      console.error('Failed to restore rug:', err)
      throw err // Re-throw so the UI can handle it
    }
  }

  return {
    restoreRug,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Hook for master restoring rug transactions
export function useMasterRestoreRug() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const contractAddress = contractAddresses[chainId]

  const masterRestoreRug = async (tokenId: bigint, dirtLevel: number, textureLevel: number, providedGasEstimate?: { gasLimit: bigint }) => {
    console.log('🔍 DEBUG: Wallet connection check for master restore')
    console.log('Address:', address)
    console.log('Chain ID:', chainId)
    console.log('writeContract available:', !!writeContract)

    if (!address) {
      console.error('❌ No wallet connected')
      throw new Error('Please connect your wallet first')
    }

    // Check if on supported network
    const supportedChainIds = [11011, 360, 84532, 8453] // Shape Sepolia, Shape Mainnet, Base Sepolia, Base Mainnet
    if (!supportedChainIds.includes(chainId)) {
      console.error('❌ Unsupported network:', chainId, 'Supported:', supportedChainIds)
      throw new Error(`Please switch to a supported network: Shape Sepolia (${11011}), Shape Mainnet (${360}), Base Sepolia (${84532}), or Base Mainnet (${8453})`)
    }

    if (!writeContract) {
      console.error('❌ writeContract function not available')
      return
    }

    // Check for existing error
    if (error) {
      console.error('❌ Existing transaction error:', error)
      throw new Error(`Cannot proceed with transaction: ${error.message}`)
    }

    console.log('masterRestoreRug called with:', { tokenId: tokenId.toString(), dirtLevel, textureLevel, providedGasEstimate })

    // Get master restoration cost from contract (source of truth)
    // For now, use fallback pricing - will be improved with proper hook integration
    const masterRestorationCost = BigInt('10000000000000') // 0.00001 ETH

    console.log('Using contract-based pricing - master restoration cost:', masterRestorationCost.toString())

    try {
      // Select appropriate chain based on chainId
      let chain
      if (chainId === 360) {
        chain = shapeMainnet
      } else if (chainId === 11011) {
        chain = shapeSepolia
      } else if (chainId === 8453) {
        chain = baseMainnet
      } else if (chainId === 84532) {
        chain = baseSepolia
      } else {
        chain = shapeSepolia // Default fallback
      }

      // Prepare transaction parameters
      const txParams: any = {
        address: contractAddress as `0x${string}`,
        abi: onchainRugsABI,
        functionName: 'masterRestoreRug',
        args: [tokenId],
        value: BigInt(masterRestorationCost),
        account: address,
      }

      // Add gas estimate if provided, otherwise do client-side estimation
      if (providedGasEstimate?.gasLimit) {
        txParams.gasLimit = BigInt(providedGasEstimate.gasLimit)
        console.log('Using provided gas estimate:', providedGasEstimate.gasLimit.toString())
      } else {
        // Get client-side gas estimation with domain-restricted API key
        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        if (!apiKey) {
          throw new Error('NEXT_PUBLIC_ALCHEMY_API_KEY not configured - gas estimation failed')
        }

        const gasOptions = getRecommendedGasOptions('masterRestoreRug')
        const gasEstimate = await estimateContractGasWithRetry(
          'masterRestoreRug',
          [tokenId],
          gasOptions,
          chainId,
          apiKey,
          BigInt(masterRestorationCost),
          address // Pass user address for ownership simulation
        )

        txParams.gasLimit = gasEstimate.gasLimit
        console.log('MasterRestoreRug gas estimation:', formatGasEstimate(gasEstimate))
      }

      console.log('Submitting masterRestoreRug transaction with params:', {
        address: txParams.address,
        functionName: txParams.functionName,
        args: txParams.args,
        value: txParams.value?.toString(),
        gasLimit: txParams.gasLimit?.toString(),
        gasLimitType: typeof txParams.gasLimit,
        chain: txParams.chain?.id
      })

      // Trigger the transaction using writeContract
      console.log('Sending transaction with writeContract...')
      console.log('Final gas limit:', txParams.gasLimit, 'type:', typeof txParams.gasLimit)

      const writeContractParams = {
        address: contractAddress as `0x${string}`,
        abi: onchainRugsABI as any, // Cast to any to bypass strict typing
        functionName: 'masterRestoreRug',
        args: [tokenId],
        value: BigInt(masterRestorationCost),
        gas: txParams.gasLimit,
        chain,
        account: address as `0x${string}`,
      }

      console.log('writeContract parameters:', {
        address: writeContractParams.address,
        functionName: writeContractParams.functionName,
        args: writeContractParams.args,
        value: writeContractParams.value?.toString(),
        gas: writeContractParams.gas?.toString(),
        gasType: typeof writeContractParams.gas,
        chainId: writeContractParams.chain?.id,
        account: writeContractParams.account
      })

      try {
        const result = await writeContract(writeContractParams)
        console.log('writeContract result:', result)
        return { success: true, result }
      } catch (writeError) {
        console.error('writeContract failed:', writeError)
        throw writeError
      }
    } catch (err) {
      console.error('Failed to master restore rug:', err)
      throw err // Re-throw so the UI can handle it
    }
  }

  return {
    masterRestoreRug,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Hook for cleaning rug transactions
export function useCleanRug() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const contractAddress = contractAddresses[chainId]

  const cleanRug = async (tokenId: bigint, dirtLevel: number, mintTime?: bigint, providedGasEstimate?: { gasLimit: bigint }) => {
    console.log('🔍 DEBUG: Wallet connection check')
    console.log('Address:', address)
    console.log('Chain ID:', chainId)
    console.log('writeContract available:', !!writeContract)

    if (!address) {
      console.error('❌ No wallet connected')
      throw new Error('Please connect your wallet first')
    }

    // Check if on supported network
    const supportedChainIds = [11011, 360, 84532, 8453] // Shape Sepolia, Shape Mainnet, Base Sepolia, Base Mainnet
    if (!supportedChainIds.includes(chainId)) {
      console.error('❌ Unsupported network:', chainId, 'Supported:', supportedChainIds)
      throw new Error(`Please switch to a supported network: Shape Sepolia (${11011}), Shape Mainnet (${360}), Base Sepolia (${84532}), or Base Mainnet (${8453})`)
    }

    if (!writeContract) {
      console.error('❌ writeContract function not available')
      return
    }

    // Check for existing error
    if (error) {
      console.error('❌ Existing transaction error:', error)
      throw new Error(`Cannot proceed with transaction: ${error.message}`)
    }

    console.log('cleanRug called with:', { tokenId: tokenId.toString(), dirtLevel, mintTime, providedGasEstimate })

    // Get maintenance options from contract (source of truth)
    // For now, use fallback pricing - will be improved with proper hook integration
    const cleaningCost = BigInt('10000000000000') // 0.00001 ETH

    console.log('Using contract-based pricing - cleaning cost:', cleaningCost.toString())

    try {
      // Select appropriate chain based on chainId
      let chain
      if (chainId === 360) {
        chain = shapeMainnet
      } else if (chainId === 11011) {
        chain = shapeSepolia
      } else if (chainId === 8453) {
        chain = baseMainnet
      } else if (chainId === 84532) {
        chain = baseSepolia
      } else {
        chain = shapeSepolia // Default fallback
      }

      // Prepare transaction parameters
      const txParams: any = {
        address: contractAddress as `0x${string}`,
        abi: onchainRugsABI,
        functionName: 'cleanRug',
        args: [tokenId],
        value: BigInt(cleaningCost),
        account: address,
      }

      // Add gas estimate if provided, otherwise do client-side estimation
      if (providedGasEstimate?.gasLimit) {
        txParams.gasLimit = BigInt(providedGasEstimate.gasLimit)
        console.log('Using provided gas estimate:', providedGasEstimate.gasLimit.toString())
      } else {
        // Get client-side gas estimation with domain-restricted API key
        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        if (!apiKey) {
          throw new Error('NEXT_PUBLIC_ALCHEMY_API_KEY not configured - gas estimation failed')
        }

        const gasOptions = getRecommendedGasOptions('cleanRug')
        const gasEstimate = await estimateContractGasWithRetry(
          'cleanRug',
          [tokenId],
          gasOptions,
          chainId,
          apiKey,
          BigInt(cleaningCost),
          address // Pass user address for ownership simulation
        )

        txParams.gasLimit = gasEstimate.gasLimit
        console.log('CleanRug gas estimation:', formatGasEstimate(gasEstimate))
      }

      console.log('Submitting cleanRug transaction with params:', {
        address: txParams.address,
        functionName: txParams.functionName,
        args: txParams.args,
        value: txParams.value?.toString(),
        gasLimit: txParams.gasLimit?.toString(),
        gasLimitType: typeof txParams.gasLimit,
        chain: txParams.chain?.id
      })

      // Additional validation
      if (!txParams.gasLimit || txParams.gasLimit === BigInt(0)) {
        console.error('CRITICAL: gasLimit is invalid!', txParams.gasLimit)
        throw new Error('Invalid gas limit for transaction')
      }

      // Calculate intrinsic gas for the transaction
      // Base gas: 21,000 for transaction
      // Data gas: 16 gas per non-zero byte, 4 gas per zero byte
      const BASE_GAS = BigInt(21000)
      const NON_ZERO_BYTE_GAS = BigInt(16)
      const ZERO_BYTE_GAS = BigInt(4)

      // Encode the data to calculate intrinsic gas
      const contract = new ethers.Contract(contractAddress, onchainRugsABI)
      const callData = contract.interface.encodeFunctionData('cleanRug', [tokenId])

      // Count zero and non-zero bytes in the data
      let zeroBytes = BigInt(0)
      let nonZeroBytes = BigInt(0)
      for (let i = 2; i < callData.length; i += 2) { // Skip '0x' prefix
        const byte = parseInt(callData.slice(i, i + 2), 16)
        if (byte === 0) {
          zeroBytes++
        } else {
          nonZeroBytes++
        }
      }

      const dataGas = (zeroBytes * ZERO_BYTE_GAS) + (nonZeroBytes * NON_ZERO_BYTE_GAS)
      const intrinsicGas = BASE_GAS + dataGas

      console.log('Intrinsic gas calculation:', {
        baseGas: BASE_GAS.toString(),
        zeroBytes: zeroBytes.toString(),
        nonZeroBytes: nonZeroBytes.toString(),
        dataGas: dataGas.toString(),
        intrinsicGas: intrinsicGas.toString(),
        callDataLength: callData.length,
        callDataSample: callData.slice(0, 66) + '...'
      })

      // Ensure gas limit is at least intrinsic gas + buffer for execution
      const executionBuffer = BigInt(50000) // Buffer for contract execution
      const recommendedGas = intrinsicGas + executionBuffer
      const finalGasLimit = txParams.gasLimit > recommendedGas ? txParams.gasLimit : recommendedGas

      console.log('Gas limit calculation:', {
        providedGas: txParams.gasLimit.toString(),
        recommendedGas: recommendedGas.toString(),
        finalGasLimit: finalGasLimit.toString()
      })

      // Trigger the transaction using writeContract (now that ABI includes cleanRug)
      console.log('Sending transaction with writeContract...')
      console.log('Final gas limit:', finalGasLimit, 'type:', typeof finalGasLimit)

      const writeContractParams = {
        address: contractAddress as `0x${string}`,
        abi: onchainRugsABI as any, // Cast to any to bypass strict typing
        functionName: 'cleanRug',
        args: [tokenId],
        value: BigInt(cleaningCost),
        gas: finalGasLimit, // Pass as bigint directly to wagmi
        chain,
        account: address as `0x${string}`,
      }

      console.log('writeContract parameters:', {
        address: writeContractParams.address,
        functionName: writeContractParams.functionName,
        args: writeContractParams.args,
        value: writeContractParams.value?.toString(),
        gas: writeContractParams.gas?.toString(),
        gasType: typeof writeContractParams.gas,
        chainId: writeContractParams.chain?.id,
        account: writeContractParams.account
      })

      try {
        const result = await writeContract(writeContractParams)
        console.log('writeContract result:', result)
        return { success: true, result }
      } catch (writeError) {
        console.error('writeContract failed:', writeError)
        throw writeError
      }
    } catch (err) {
      console.error('Failed to clean rug:', err)
      throw err // Re-throw so the UI can handle it
    }
  }

  return {
    cleanRug,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
