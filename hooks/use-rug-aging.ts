import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { useState, useEffect, useMemo } from 'react'
import { ethers } from 'ethers'
import { config, agingConfig } from '@/lib/config'
import { shapeSepolia, shapeMainnet, contractAddresses, onchainRugsABI } from '@/lib/web3'
import { useTokenURI } from './use-token-uri'
import { getDirtDescription, getAgingDescription } from '@/utils/parsing-utils'
import { estimateContractGasWithRetry, getRecommendedGasOptions, formatGasEstimate } from '@/utils/gas-estimation'

// Rug aging hook for managing dirt and texture states
export function useRugAging(tokenId?: bigint) {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [dirtLevel, setDirtLevel] = useState(0)
  const [agingLevel, setAgingLevel] = useState(0)
  const [lastCleaned, setLastCleaned] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

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

  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const restoreRug = async (tokenId: bigint, textureLevel: number, providedGasEstimate?: { gasLimit: bigint }) => {
    console.log('🔍 DEBUG: Wallet connection check for restore')
    console.log('Address:', address)
    console.log('Chain ID:', chainId)
    console.log('writeContract available:', !!writeContract)

    if (!address) {
      console.error('❌ No wallet connected')
      throw new Error('Please connect your wallet first')
    }

    // Check if on correct network
    const expectedChainIds = [11011, 360] // Shape Sepolia and Shape Mainnet
    if (!expectedChainIds.includes(chainId)) {
      console.error('❌ Wrong network:', chainId, 'Expected:', expectedChainIds)
      throw new Error(`Please switch to Shape Sepolia (${11011}) or Shape Mainnet (${360}) network`)
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

    // Get restoration cost from contract
    const restorationCost = agingConfig.restorationCosts.paid

    console.log('Restoration cost calculation:', { restorationCost })

    try {
      const chain = chainId === 360 ? shapeMainnet : shapeSepolia

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
        gas: Number(txParams.gasLimit),
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

  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const masterRestoreRug = async (tokenId: bigint, dirtLevel: number, textureLevel: number, providedGasEstimate?: { gasLimit: bigint }) => {
    console.log('🔍 DEBUG: Wallet connection check for master restore')
    console.log('Address:', address)
    console.log('Chain ID:', chainId)
    console.log('writeContract available:', !!writeContract)

    if (!address) {
      console.error('❌ No wallet connected')
      throw new Error('Please connect your wallet first')
    }

    // Check if on correct network
    const expectedChainIds = [11011, 360] // Shape Sepolia and Shape Mainnet
    if (!expectedChainIds.includes(chainId)) {
      console.error('❌ Wrong network:', chainId, 'Expected:', expectedChainIds)
      throw new Error(`Please switch to Shape Sepolia (${11011}) or Shape Mainnet (${360}) network`)
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

    // Get master restoration cost from contract
    const masterRestorationCost = agingConfig.masterRestorationCosts.paid

    console.log('Master restoration cost calculation:', { masterRestorationCost })

    try {
      const chain = chainId === 360 ? shapeMainnet : shapeSepolia

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
        gas: Number(txParams.gasLimit),
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

  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const cleanRug = async (tokenId: bigint, dirtLevel: number, mintTime?: bigint, providedGasEstimate?: { gasLimit: bigint }) => {
    console.log('🔍 DEBUG: Wallet connection check')
    console.log('Address:', address)
    console.log('Chain ID:', chainId)
    console.log('writeContract available:', !!writeContract)

    if (!address) {
      console.error('❌ No wallet connected')
      throw new Error('Please connect your wallet first')
    }

    // Check if on correct network
    const expectedChainIds = [11011, 360] // Shape Sepolia and Shape Mainnet
    if (!expectedChainIds.includes(chainId)) {
      console.error('❌ Wrong network:', chainId, 'Expected:', expectedChainIds)
      throw new Error(`Please switch to Shape Sepolia (${11011}) or Shape Mainnet (${360}) network`)
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

    // Calculate cleaning cost based on age (free for first 30 minutes)
    const now = Math.floor(Date.now() / 1000)
    const timeSinceMint = mintTime ? now - Number(mintTime) : 0
    const cleaningCost = timeSinceMint < agingConfig.textureAging.intense
      ? agingConfig.cleaningCosts.free
      : agingConfig.cleaningCosts.paid

    console.log('Cleaning cost calculation:', { now, timeSinceMint, cleaningCost })

    try {
      const chain = chainId === 360 ? shapeMainnet : shapeSepolia

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
        gas: Number(finalGasLimit), // Use calculated gas limit that meets intrinsic gas requirements
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
