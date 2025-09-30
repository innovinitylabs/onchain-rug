'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain, useSendTransaction } from 'wagmi'
import { estimateContractGasWithRetry, getRecommendedGasOptions, formatGasEstimate } from '@/utils/gas-estimation'
import { useRugAging, useCleanRug, useRestoreRug, useMasterRestoreRug } from '@/hooks/use-rug-aging'
import { motion } from 'framer-motion'
import { Droplets, AlertCircle, CheckCircle, Clock, Sparkles, Crown } from 'lucide-react'
import { config, agingConfig } from '@/lib/config'
import { formatEther } from 'viem'

interface RugCleaningProps {
  tokenId: bigint
  mintTime?: number
  lastCleaned?: bigint | Date | null
  onRefreshNFT?: (tokenId: number) => void | Promise<void>
}

export function RugCleaning({ tokenId, mintTime, lastCleaned: propLastCleaned, onRefreshNFT }: RugCleaningProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { sendTransaction } = useSendTransaction()
  const { dirtLevel, textureLevel, lastCleaned: hookLastCleaned, refetch } = useRugAging(tokenId)

  // Use prop data if available, otherwise fall back to hook data
  const actualMintTime = mintTime

  // Normalize lastCleaned to bigint timestamp in seconds
  const normalizeLastCleaned = (value: bigint | Date | null | undefined): bigint | undefined => {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'bigint') return value
    if (value instanceof Date) return BigInt(Math.floor(value.getTime() / 1000))
    return undefined
  }

  const actualLastCleaned = normalizeLastCleaned(propLastCleaned !== undefined ? propLastCleaned : hookLastCleaned)
  const {
    cleanRug,
    isPending: cleanPending,
    isConfirming: cleanConfirming,
    isSuccess: cleanSuccess,
    error: cleanError
  } = useCleanRug()

  const {
    restoreRug,
    isPending: restorePending,
    isConfirming: restoreConfirming,
    isSuccess: restoreSuccess,
    error: restoreError
  } = useRestoreRug()

  const {
    masterRestoreRug,
    isPending: masterRestorePending,
    isConfirming: masterRestoreConfirming,
    isSuccess: masterRestoreSuccess,
    error: masterRestoreError
  } = useMasterRestoreRug()

  // State to track refresh to prevent multiple calls
  const [hasRefreshed, setHasRefreshed] = useState(false)

  // Monitor transaction completion and refetch data (only once per transaction)
  useEffect(() => {
    if ((cleanSuccess || restoreSuccess || masterRestoreSuccess) && !hasRefreshed) {
      console.log('Transaction confirmed, refetching data...')
      refetch()
      // Also refresh this specific NFT in the parent collection (only once)
      if (onRefreshNFT) {
        onRefreshNFT(Number(tokenId))
      }
      setHasRefreshed(true)
    }
    if (cleanError || restoreError || masterRestoreError) {
      console.error('Transaction error:', cleanError || restoreError || masterRestoreError)
      // Error is already displayed in the UI, no need for alert here
    }
  }, [cleanSuccess, restoreSuccess, masterRestoreSuccess, cleanError, restoreError, masterRestoreError, refetch, onRefreshNFT, tokenId, hasRefreshed])

  // Reset refresh flag when starting a new transaction
  useEffect(() => {
    if (cleanPending || restorePending || masterRestorePending) {
      setHasRefreshed(false)
    }
  }, [cleanPending, restorePending, masterRestorePending])

  const [gasEstimate, setGasEstimate] = useState<string>('')
  const [estimatingGas, setEstimatingGas] = useState(false)

  const [restoreGasEstimate, setRestoreGasEstimate] = useState<string>('')
  const [estimatingRestoreGas, setEstimatingRestoreGas] = useState(false)

  const [masterRestoreGasEstimate, setMasterRestoreGasEstimate] = useState<string>('')
  const [estimatingMasterRestoreGas, setEstimatingMasterRestoreGas] = useState(false)

  const isCorrectChain = chainId === config.chainId
  const needsCleaning = dirtLevel > 0

  const getCleaningCost = () => {
    // Check if rug is within free cleaning periods (matching contract logic)
    const now = Math.floor(Date.now() / 1000)

    // Free if within initial period from mint (30 minutes)
    const timeSinceMint = actualMintTime ? now - actualMintTime : 0
    if (timeSinceMint <= 30 * 60) { // 30 minutes in seconds
      return agingConfig.cleaningCosts.free // Free for first 30 minutes
    }

    // Free if recently cleaned (within 11 minutes of last clean)
    const timeSinceLastClean = actualLastCleaned ? now - Number(actualLastCleaned) : 0
    if (timeSinceLastClean <= 11 * 60) { // 11 minutes in seconds
      return agingConfig.cleaningCosts.free // Free within 11 minutes of cleaning
    }

    return agingConfig.cleaningCosts.paid // Paid otherwise
  }

  const getDirtDescription = () => {
    if (dirtLevel === 0) return 'Clean'
    if (dirtLevel === 1) return 'Lightly Dirty (3+ minutes)'
    if (dirtLevel === 2) return 'Heavily Dirty (7+ minutes)'
    return 'Unknown'
  }

  const getTextureDescription = () => {
    if (textureLevel === 0) return 'Smooth'
    if (textureLevel === 1) return 'Moderate Wear (30+ minutes)'
    if (textureLevel === 2) return 'Heavy Wear (90+ minutes)'
    return 'Unknown'
  }

  const handleClean = async () => {
    if (!isConnected || !isCorrectChain || !needsCleaning) return

    console.log('Starting clean process for token:', tokenId.toString())
    console.log('User address:', address)
    console.log('Chain ID:', chainId)
    console.log('Dirt level:', dirtLevel)

    // Validate that the user owns this token before proceeding
    if (!address) {
      console.error('No user address available')
      return
    }

    setEstimatingGas(true)
    // Don't clear gas estimate - keep previous estimate visible
    // setGasEstimate('')

    try {
      // Estimate gas using client-side API with domain-restricted key
      const cleaningCost = getCleaningCost()
      const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY

      if (!apiKey) {
        console.warn('NEXT_PUBLIC_ALCHEMY_API_KEY not found, using fallback gas estimation')
        setGasEstimate('Using fallback gas estimation (8M gas)...')
        setEstimatingGas(false)

        const cleanResult = await cleanRug(
          tokenId,
          dirtLevel,
          actualLastCleaned ? actualLastCleaned : undefined,
          { gasLimit: BigInt(8_000_000) } // 8M gas fallback
        )
        console.log('Clean transaction submitted (fallback gas estimation):', cleanResult)
      } else {
        // Use client-side gas estimation with domain-restricted API key
        const gasOptions = getRecommendedGasOptions('cleanRug')
        let estimate
        try {
          estimate = await estimateContractGasWithRetry(
            'cleanRug',
            [tokenId],
            gasOptions,
            chainId,
            apiKey,
            BigInt(cleaningCost),
            address // Pass user address for ownership simulation
          )
        } catch (gasError) {
          console.warn('Client-side gas estimation failed, using fallback:', gasError)
          // Use fallback gas estimate
          const fallbackGasPrice = '1000000000' // 1 gwei
          const fallbackGasLimit = '500000' // 500K gas
          const fallbackCost = (BigInt(fallbackGasLimit) * BigInt(fallbackGasPrice)).toString()

          estimate = {
            gasLimit: fallbackGasLimit,
            gasPrice: fallbackGasPrice,
            estimatedCost: fallbackCost,
            readable: `${fallbackGasLimit} gas @ 1.0 gwei = 0.0005 ETH (fallback)`,
            success: true
          }
          console.log('Using fallback estimate:', estimate)
        }

        const formatted = formatGasEstimate(estimate)
        setGasEstimate(`TEMPORARY MAX GAS: ${formatted.readable}`)
        setEstimatingGas(false)

        console.log('Gas estimate for cleaning:', formatted)

        // Now execute the transaction with estimated gas
        const gasLimit = BigInt(estimate.gasLimit)
        console.log('Passing gasLimit to cleanRug:', gasLimit.toString(), 'type:', typeof gasLimit)

        const cleanResult = await cleanRug(
          tokenId,
          dirtLevel,
          actualLastCleaned ? actualLastCleaned : undefined,
          { gasLimit }
        )
        console.log('Clean transaction submitted (client-side gas estimate):', cleanResult)

        // The transaction is now pending - UI will monitor hook states
      }
    } catch (err) {
      console.error('Clean rug failed:', err)
      setEstimatingGas(false)
      // Show alert for critical errors
      if (err instanceof Error) {
        alert(`Transaction failed: ${err.message}`)
      } else {
        alert('Transaction failed with unknown error')
      }
      // Don't clear gas estimate on error - keep it visible for debugging
      // setGasEstimate('')
    }
  }

  const handleRestore = async () => {
    if (!isConnected || !isCorrectChain || textureLevel === 0) return

    console.log('Starting restore process for token:', tokenId.toString())
    console.log('User address:', address)
    console.log('Chain ID:', chainId)
    console.log('Texture level:', textureLevel)

    // Validate that the user owns this token before proceeding
    if (!address) {
      console.error('No user address available')
      return
    }

    setEstimatingRestoreGas(true)
    // Don't clear gas estimate - keep previous estimate visible
    // setRestoreGasEstimate('')

    try {
      // Estimate gas using client-side API with domain-restricted key
      const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY

      if (!apiKey) {
        console.warn('NEXT_PUBLIC_ALCHEMY_API_KEY not found, using fallback gas estimation')
        setRestoreGasEstimate('Using fallback gas estimation (12M gas)...')
        setEstimatingRestoreGas(false)

        const restoreResult = await restoreRug(
          tokenId,
          textureLevel,
          { gasLimit: BigInt(12_000_000) } // 12M gas fallback
        )
        console.log('Restore transaction submitted (fallback gas estimation):', restoreResult)
      } else {
        // Use client-side gas estimation with domain-restricted API key
        const gasOptions = getRecommendedGasOptions('restoreRug')
        let estimate
        try {
          estimate = await estimateContractGasWithRetry(
            'restoreRug',
            [tokenId],
            gasOptions,
            chainId,
            apiKey,
            BigInt(agingConfig.restorationCosts.paid),
            address // Pass user address for ownership simulation
          )
        } catch (gasError) {
          console.warn('Client-side gas estimation failed, using fallback:', gasError)
          // Use fallback gas estimate
          const fallbackGasPrice = '1000000000' // 1 gwei
          const fallbackGasLimit = '500000' // 500K gas
          const fallbackCost = (BigInt(fallbackGasLimit) * BigInt(fallbackGasPrice)).toString()

          estimate = {
            gasLimit: fallbackGasLimit,
            gasPrice: fallbackGasPrice,
            estimatedCost: fallbackCost,
            readable: `${fallbackGasLimit} gas @ 1.0 gwei = 0.0005 ETH (fallback)`,
            success: true
          }
          console.log('Using fallback estimate:', estimate)
        }

        const formatted = formatGasEstimate(estimate)
        setRestoreGasEstimate(`TEMPORARY MAX GAS: ${formatted.readable}`)
        setEstimatingRestoreGas(false)

        console.log('Gas estimate for restoration:', formatted)

        // Now execute the transaction with estimated gas
        const gasLimit = BigInt(estimate.gasLimit)
        console.log('Passing gasLimit to restoreRug:', gasLimit.toString(), 'type:', typeof gasLimit)

        const restoreResult = await restoreRug(
          tokenId,
          textureLevel,
          { gasLimit }
        )
        console.log('Restore transaction submitted (client-side gas estimate):', restoreResult)

        // The transaction is now pending - UI will monitor hook states
      }
    } catch (err) {
      console.error('Restore rug failed:', err)
      setEstimatingRestoreGas(false)
      // Show alert for critical errors
      if (err instanceof Error) {
        alert(`Transaction failed: ${err.message}`)
      } else {
        alert('Transaction failed with unknown error')
      }
      // Don't clear gas estimate on error - keep it visible for debugging
      // setRestoreGasEstimate('')
    }
  }

  const handleMasterRestore = async () => {
    if (!isConnected || !isCorrectChain || textureLevel === 0) return

    console.log('Starting master restore process for token:', tokenId.toString())
    console.log('User address:', address)
    console.log('Chain ID:', chainId)
    console.log('Dirt level:', dirtLevel, 'Texture level:', textureLevel)

    // Validate that the user owns this token before proceeding
    if (!address) {
      console.error('No user address available')
      return
    }

    setEstimatingMasterRestoreGas(true)
    // Don't clear gas estimate - keep previous estimate visible
    // setMasterRestoreGasEstimate('')

    try {
      // Estimate gas using client-side API with domain-restricted key
      const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY

      if (!apiKey) {
        console.warn('NEXT_PUBLIC_ALCHEMY_API_KEY not found, using fallback gas estimation')
        setMasterRestoreGasEstimate('Using fallback gas estimation (12M gas)...')
        setEstimatingMasterRestoreGas(false)

        const masterRestoreResult = await masterRestoreRug(
          tokenId,
          dirtLevel,
          textureLevel,
          { gasLimit: BigInt(12_000_000) } // 12M gas fallback
        )
        console.log('Master restore transaction submitted (fallback gas estimation):', masterRestoreResult)
      } else {
        // Use client-side gas estimation with domain-restricted API key
        const gasOptions = getRecommendedGasOptions('masterRestoreRug')
        let estimate
        try {
          estimate = await estimateContractGasWithRetry(
            'masterRestoreRug',
            [tokenId],
            gasOptions,
            chainId,
            apiKey,
            BigInt(agingConfig.masterRestorationCosts.paid),
            address // Pass user address for ownership simulation
          )
        } catch (gasError) {
          console.warn('Client-side gas estimation failed, using fallback:', gasError)
          // Use fallback gas estimate
          const fallbackGasPrice = '1000000000' // 1 gwei
          const fallbackGasLimit = '500000' // 500K gas
          const fallbackCost = (BigInt(fallbackGasLimit) * BigInt(fallbackGasPrice)).toString()

          estimate = {
            gasLimit: fallbackGasLimit,
            gasPrice: fallbackGasPrice,
            estimatedCost: fallbackCost,
            readable: `${fallbackGasLimit} gas @ 1.0 gwei = 0.0005 ETH (fallback)`,
            success: true
          }
          console.log('Using fallback estimate:', estimate)
        }

        const formatted = formatGasEstimate(estimate)
        setMasterRestoreGasEstimate(`TEMPORARY MAX GAS: ${formatted.readable}`)
        setEstimatingMasterRestoreGas(false)

        console.log('Gas estimate for master restoration:', formatted)

        // Now execute the transaction with estimated gas
        const gasLimit = BigInt(estimate.gasLimit)
        console.log('Passing gasLimit to masterRestoreRug:', gasLimit.toString(), 'type:', typeof gasLimit)

        const masterRestoreResult = await masterRestoreRug(
          tokenId,
          dirtLevel,
          textureLevel,
          { gasLimit }
        )
        console.log('Master restore transaction submitted (client-side gas estimate):', masterRestoreResult)

        // The transaction is now pending - UI will monitor hook states
      }
    } catch (err) {
      console.error('Master restore rug failed:', err)
      setEstimatingMasterRestoreGas(false)
      // Show alert for critical errors
      if (err instanceof Error) {
        alert(`Transaction failed: ${err.message}`)
      } else {
        alert('Transaction failed with unknown error')
      }
      // Don't clear gas estimate on error - keep it visible for debugging
      // setMasterRestoreGasEstimate('')
    }
  }

  const getCleanButtonText = () => {
    if (!isConnected) return 'Connect Wallet to Clean'
    if (!isCorrectChain) return `Switch to ${config.chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'}`
    if (!needsCleaning) return 'Rug is Already Clean'
    if (estimatingGas) return 'Estimating Gas...'
    if (cleanPending) return 'Cleaning...'
    if (cleanConfirming) return 'Confirming...'
    return `Clean Rug (${formatEther(BigInt(getCleaningCost()))} ETH)`
  }

  const getCleanButtonClass = () => {
    if (!isConnected || !isCorrectChain || !needsCleaning) {
      return 'bg-gray-400 text-gray-200 cursor-not-allowed'
    }
    if (cleanPending || cleanConfirming) {
      return 'bg-blue-500 text-white hover:bg-blue-600'
    }
    return 'bg-cyan-600 text-white hover:bg-cyan-700'
  }

  const getRestoreButtonText = () => {
    if (!isConnected) return 'Connect Wallet to Restore'
    if (!isCorrectChain) return `Switch to ${config.chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'}`
    if (textureLevel === 0) return 'No Texture Wear to Restore'
    if (estimatingRestoreGas) return 'Estimating Gas...'
    if (restorePending) return 'Restoring...'
    if (restoreConfirming) return 'Confirming...'
    return `Restore Texture (${formatEther(BigInt(agingConfig.restorationCosts.paid))} ETH)`
  }

  const getRestoreButtonClass = () => {
    if (!isConnected || !isCorrectChain || textureLevel === 0) {
      return 'bg-gray-400 text-gray-200 cursor-not-allowed'
    }
    if (restorePending || restoreConfirming) {
      return 'bg-blue-500 text-white hover:bg-blue-600'
    }
    return 'bg-purple-600 text-white hover:bg-purple-700'
  }

  const getMasterRestoreButtonText = () => {
    if (!isConnected) return 'Connect Wallet to Restore'
    if (!isCorrectChain) return `Switch to ${config.chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'}`
    if (textureLevel === 0) return 'No Texture Wear to Restore'
    if (estimatingMasterRestoreGas) return 'Estimating Gas...'
    if (masterRestorePending) return 'Restoring...'
    if (masterRestoreConfirming) return 'Confirming...'
    return `Master Restore (${formatEther(BigInt(agingConfig.masterRestorationCosts.paid))} ETH)`
  }

  const getMasterRestoreButtonClass = () => {
    if (!isConnected || !isCorrectChain || textureLevel === 0) {
      return 'bg-gray-400 text-gray-200 cursor-not-allowed'
    }
    if (masterRestorePending || masterRestoreConfirming) {
      return 'bg-blue-500 text-white hover:bg-blue-600'
    }
    return 'bg-indigo-600 text-white hover:bg-indigo-700'
  }

  return (
    <div className="space-y-4">

      {/* Visual Status Indicators */}
      <div className="flex items-center gap-4">
        {/* Dirt Level Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            dirtLevel === 0 ? 'bg-green-500' : 
            dirtLevel === 1 ? 'bg-yellow-500' : 
            'bg-red-500'
          }`} />
          <span className="text-green-400 text-xs font-mono">
            Dirt: {dirtLevel}/2
          </span>
        </div>

        {/* Texture Level Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            textureLevel === 0 ? 'bg-blue-500' : 
            textureLevel === 1 ? 'bg-purple-500' : 
            'bg-indigo-500'
          }`} />
          <span className="text-green-400 text-xs font-mono">
            Texture: {textureLevel}/10
          </span>
        </div>
      </div>


      {/* Error Display */}
      {(cleanError || restoreError || masterRestoreError) && (
        <div className="bg-red-900/50 border border-red-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-red-400 text-sm font-mono">
            <AlertCircle className="w-4 h-4" />
            Error: {(cleanError || restoreError || masterRestoreError)?.message}
          </div>
        </div>
      )}

      {/* Success Display */}
      {(cleanSuccess || restoreSuccess || masterRestoreSuccess) && (
        <div className="bg-green-900/50 border border-green-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-green-400 text-sm font-mono">
            <CheckCircle className="w-4 h-4" />
            {cleanSuccess && 'Rug cleaned successfully!'}
            {restoreSuccess && 'Texture restored successfully!'}
            {masterRestoreSuccess && 'Master restoration completed!'}
            {' Refreshing status...'}
          </div>
        </div>
      )}

      {/* Gas Estimation Display */}
      {gasEstimate && (
        <div className="bg-blue-900/50 border border-blue-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-mono mb-1">
            ⛽ Clean Gas Estimate
          </div>
          <div className="text-blue-300 text-xs font-mono break-all">
            {gasEstimate}
          </div>
        </div>
      )}

      {/* Restore Gas Estimation Display */}
      {restoreGasEstimate && (
        <div className="bg-purple-900/50 border border-purple-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-purple-400 text-sm font-mono mb-1">
            ⛽ Restore Gas Estimate
          </div>
          <div className="text-purple-300 text-xs font-mono break-all">
            {restoreGasEstimate}
          </div>
        </div>
      )}

      {/* Master Restore Gas Estimation Display */}
      {masterRestoreGasEstimate && (
        <div className="bg-indigo-900/50 border border-indigo-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-mono mb-1">
            ⛽ Master Restore Gas Estimate
          </div>
          <div className="text-indigo-300 text-xs font-mono break-all">
            {masterRestoreGasEstimate}
          </div>
        </div>
      )}

      {/* Clean Button */}
      <motion.button
        onClick={handleClean}
        disabled={!isConnected || !isCorrectChain || !needsCleaning || cleanPending || cleanConfirming}
        className={`w-full px-4 py-3 rounded font-mono transition-all duration-200 border flex items-center justify-center gap-2 text-sm ${getCleanButtonClass()}`}
        whileHover={{ scale: isConnected && isCorrectChain && needsCleaning ? 1.02 : 1 }}
        whileTap={{ scale: isConnected && isCorrectChain && needsCleaning ? 0.98 : 1 }}
      >
        <Droplets className="w-4 h-4" />
        {getCleanButtonText()}
      </motion.button>

      {/* Restore Texture Button */}
      <motion.button
        onClick={handleRestore}
        disabled={!isConnected || !isCorrectChain || textureLevel === 0 || restorePending || restoreConfirming}
        className={`w-full px-4 py-3 rounded font-mono transition-all duration-200 border flex items-center justify-center gap-2 text-sm ${getRestoreButtonClass()}`}
        whileHover={{ scale: isConnected && isCorrectChain && textureLevel > 0 ? 1.02 : 1 }}
        whileTap={{ scale: isConnected && isCorrectChain && textureLevel > 0 ? 0.98 : 1 }}
      >
        <Sparkles className="w-4 h-4" />
        {getRestoreButtonText()}
      </motion.button>

      {/* Master Restore Button */}
      <motion.button
        onClick={handleMasterRestore}
        disabled={!isConnected || !isCorrectChain || textureLevel === 0 || masterRestorePending || masterRestoreConfirming}
        className={`w-full px-4 py-3 rounded font-mono transition-all duration-200 border flex items-center justify-center gap-2 text-sm ${getMasterRestoreButtonClass()}`}
        whileHover={{ scale: isConnected && isCorrectChain && textureLevel > 0 ? 1.02 : 1 }}
        whileTap={{ scale: isConnected && isCorrectChain && textureLevel > 0 ? 0.98 : 1 }}
      >
        <Crown className="w-4 h-4" />
        {getMasterRestoreButtonText()}
      </motion.button>

      {/* Network Warning */}
      {isConnected && !isCorrectChain && (
        <div className="bg-yellow-900/50 border border-yellow-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-mono">
            <AlertCircle className="w-4 h-4" />
            Please switch to {config.chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'} to clean
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-900/50 border border-blue-500/30 rounded p-3">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-mono mb-2">
          <Clock className="w-4 h-4" />
          Maintenance Info
        </div>
        <div className="text-blue-300 text-xs font-mono space-y-1">
          <div>• <strong>Clean:</strong> Removes dirt and delays texture wear progression</div>
          <div>• <strong>Restore Texture:</strong> Repairs texture wear (reduces wear level by 1)</div>
          <div>• <strong>Master Restore:</strong> Complete texture restoration (resets texture to pristine)</div>
          <div>• Cleaning: Free for first 30 minutes, then {formatEther(BigInt(agingConfig.cleaningCosts.paid))} ETH</div>
          <div>• Texture Restoration: {formatEther(BigInt(agingConfig.restorationCosts.paid))} ETH</div>
          <div>• Master Texture Restoration: {formatEther(BigInt(agingConfig.masterRestorationCosts.paid))} ETH</div>
        </div>
      </div>
    </div>
  )
}
