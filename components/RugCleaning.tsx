'use client'

import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useRugAging, useCleanRug } from '@/hooks/use-rug-aging'
import { motion } from 'framer-motion'
import { Droplets, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { config, agingConfig } from '@/lib/config'
import { formatEther } from 'viem'

interface RugCleaningProps {
  tokenId: bigint
}

export function RugCleaning({ tokenId }: RugCleaningProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { dirtLevel, textureLevel, lastCleaned, refetch } = useRugAging(tokenId)
  const { 
    cleanRug, 
    isPending, 
    isConfirming, 
    isSuccess, 
    error 
  } = useCleanRug()

  const isCorrectChain = chainId === config.chainId
  const needsCleaning = dirtLevel > 0

  const getCleaningCost = () => {
    // Check if rug is within free cleaning period (30 minutes)
    const now = Math.floor(Date.now() / 1000)
    const timeSinceMint = lastCleaned ? now - (lastCleaned.getTime() / 1000) : 0

    if (timeSinceMint < agingConfig.textureAging.intense) {
      return agingConfig.cleaningCosts.free // Free for first 30 minutes
    }

    return agingConfig.cleaningCosts.paid // Paid after 30 minutes
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
    await cleanRug(tokenId, dirtLevel)
  }

  const getCleanButtonText = () => {
    if (!isConnected) return 'Connect Wallet to Clean'
    if (!isCorrectChain) return `Switch to ${config.chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'}`
    if (!needsCleaning) return 'Rug is Already Clean'
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
          {lastCleaned && (
            <div>Last Cleaned: {lastCleaned.toLocaleDateString()}</div>
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
          <div>• Cleaning removes all dirt and resets aging timer</div>
          <div>• Cost: Free for first 30 days, then {formatEther(BigInt(agingConfig.cleaningCosts.paid))} ETH</div>
          <div>• Texture wear cannot be cleaned (permanent aging)</div>
        </div>
      </div>
    </div>
  )
}
