'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain, useSendTransaction } from 'wagmi'
import { estimateContractGasWithRetry, getRecommendedGasOptions, formatGasEstimate } from '@/utils/gas-estimation'
import { useRugAging, useCleanRug } from '@/hooks/use-rug-aging'
import { motion } from 'framer-motion'
import { Droplets, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { config, agingConfig } from '@/lib/config'
import { formatEther } from 'viem'

interface RugCleaningProps {
  tokenId: bigint
  mintTime?: number
  lastCleaned?: bigint | Date | null
}

export function RugCleaning({ tokenId, mintTime, lastCleaned: propLastCleaned }: RugCleaningProps) {
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
    isPending,
    isConfirming,
    isSuccess,
    error
  } = useCleanRug()

  // Monitor transaction completion and refetch data
  useEffect(() => {
    if (isSuccess) {
      console.log('Transaction confirmed, refetching data...')
      refetch()
    }
    if (error) {
      console.error('Transaction error:', error)
      // Error is already displayed in the UI, no need for alert here
    }
  }, [isSuccess, error, refetch])

  const [gasEstimate, setGasEstimate] = useState<string>('')
  const [estimatingGas, setEstimatingGas] = useState(false)

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
        console.warn('NEXT_PUBLIC_ALCHEMY_API_KEY not found, using wagmi default')
        setGasEstimate('Using automatic gas estimation...')
        setEstimatingGas(false)

        const cleanResult = await cleanRug(
          tokenId,
          dirtLevel,
          actualLastCleaned ? actualLastCleaned : undefined
        )
        console.log('Clean transaction submitted (wagmi gas estimation):', cleanResult)
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

  const getCleanButtonText = () => {
    if (!isConnected) return 'Connect Wallet to Clean'
    if (!isCorrectChain) return `Switch to ${config.chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'}`
    if (!needsCleaning) return 'Rug is Already Clean'
    if (estimatingGas) return 'Estimating Gas...'
    if (isPending) return 'Cleaning...'
    if (isConfirming) return 'Confirming...'
    return `Clean Rug (${formatEther(BigInt(getCleaningCost()))} ETH)`
  }

  const getCleanButtonClass = () => {
    if (!isConnected || !isCorrectChain || !needsCleaning) {
      return 'bg-gray-400 text-gray-200 cursor-not-allowed'
    }
    if (isPending || isConfirming) {
      return 'bg-blue-500 text-white hover:bg-blue-600'
    }
    return 'bg-cyan-600 text-white hover:bg-cyan-700'
  }

  return (
    <div className="space-y-4">
      {/* Rug Status */}
      <div className="bg-gray-900/50 border border-green-500/30 rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-green-300 text-sm font-mono">RUG STATUS</span>
          {isSuccess && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
        </div>
        
        <div className="text-green-400 text-xs font-mono space-y-1">
          <div>Token ID: {tokenId.toString()}</div>
          <div>Dirt Level: {getDirtDescription()}</div>
          <div>Texture: {getTextureDescription()}</div>
          {actualLastCleaned && (
            <div>Last Cleaned: {new Date(Number(actualLastCleaned) * 1000).toLocaleDateString()}</div>
          )}
        </div>
      </div>

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
            Texture: {textureLevel}/2
          </span>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-900/50 border border-gray-600/30 rounded p-2 text-xs font-mono">
        <div className="text-gray-300">🔍 Debug Info:</div>
        <div className="text-cyan-400">Connected: {isConnected ? '✅' : '❌'}</div>
        <div className="text-cyan-400">Chain ID: {chainId} (Expected: 11011/360)</div>
        <div className="text-cyan-400">Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}</div>
        <div className="text-cyan-400">Token ID: {tokenId.toString()}</div>
        {chainId !== 11011 && chainId !== 360 && (
          <div className="text-yellow-400 mt-1">
            ⚠️ Wrong network! Need Shape Sepolia (11011) or Shape Mainnet (360)
            <button
              onClick={() => switchChain({ chainId: 11011 })}
              className="ml-2 px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-black text-xs rounded"
            >
              Switch to Shape Sepolia
            </button>
          </div>
        )}
        <div className="text-cyan-400 mt-1">
          RainbowKit Status: Connected via {isConnected ? 'Wallet' : 'None'}
        </div>
        {isConnected && (
          <button
            onClick={async () => {
              try {
                console.log('Testing wallet connection with 0 ETH transaction...')
                const result = await sendTransaction({
                  to: address as `0x${string}`,
                  value: BigInt(0),
                  gas: BigInt(21000), // Standard ETH transfer gas
                })
                console.log('Test transaction result:', result)
                alert('Test transaction sent! Check wallet for confirmation.')
              } catch (e) {
                console.error('Test transaction failed:', e)
                alert('Test transaction failed: ' + (e as Error).message)
              }
            }}
            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
          >
            Test Wallet (0 ETH)
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-red-400 text-sm font-mono">
            <AlertCircle className="w-4 h-4" />
            Error: {error.message}
          </div>
        </div>
      )}

      {/* Success Display */}
      {isSuccess && (
        <div className="bg-green-900/50 border border-green-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-green-400 text-sm font-mono">
            <CheckCircle className="w-4 h-4" />
            Rug cleaned successfully! Refreshing status...
          </div>
        </div>
      )}

      {/* Gas Estimation Display */}
      {gasEstimate && (
        <div className="bg-blue-900/50 border border-blue-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-mono mb-1">
            ⛽ Gas Estimate
          </div>
          <div className="text-blue-300 text-xs font-mono break-all">
            {gasEstimate}
          </div>
        </div>
      )}

      {/* Clean Button */}
      <motion.button
        onClick={handleClean}
        disabled={!isConnected || !isCorrectChain || !needsCleaning || isPending || isConfirming}
        className={`w-full px-4 py-3 rounded font-mono transition-all duration-200 border flex items-center justify-center gap-2 text-sm ${getCleanButtonClass()}`}
        whileHover={{ scale: isConnected && isCorrectChain && needsCleaning ? 1.02 : 1 }}
        whileTap={{ scale: isConnected && isCorrectChain && needsCleaning ? 0.98 : 1 }}
      >
        <Droplets className="w-4 h-4" />
        {getCleanButtonText()}
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
          Cleaning Info
        </div>
        <div className="text-blue-300 text-xs font-mono space-y-1">
          <div>• Cleaning removes dirt and slows texture wear progression</div>
          <div>• Cost: Free for first 30 minutes, then {formatEther(BigInt(agingConfig.cleaningCosts.paid))} ETH</div>
          <div>• Texture wear is permanent until restored or laundered</div>
        </div>
      </div>
    </div>
  )
}
