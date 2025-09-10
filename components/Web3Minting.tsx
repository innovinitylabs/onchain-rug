'use client'

import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useRugMinting } from '@/hooks/use-rug-minting'
import { mintingConfig } from '@/lib/config'
import { motion } from 'framer-motion'
import { Shuffle, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { config } from '@/lib/config'
import { formatEther } from 'viem'

interface Web3MintingProps {
  currentSeed: number
  onMintSuccess?: (tokenId: bigint) => void
}

export function Web3Minting({ currentSeed, onMintSuccess }: Web3MintingProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { 
    mintRug, 
    mintPrice, 
    currentSupply, 
    maxSupply, 
    calculateMintingPrice,
    isPending, 
    isConfirming, 
    isSuccess, 
    error 
  } = useRugMinting()

  const [customSeed, setCustomSeed] = useState('')

  const isCorrectChain = chainId === config.chainId
  const isSoldOut = currentSupply && maxSupply ? currentSupply >= maxSupply : false

  const handleMint = async () => {
    if (!isConnected || !isCorrectChain || isSoldOut) return

    const seed = customSeed ? parseInt(customSeed) : currentSeed
    // For now, mint without text (free)
    await mintRug(seed, [])
  }

  const getMintButtonText = () => {
    if (!isConnected) return 'Connect Wallet to Mint'
    if (!isCorrectChain) return `Switch to ${config.chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'}`
    if (isSoldOut) return 'Sold Out'
    if (isPending) return 'Minting...'
    if (isConfirming) return 'Confirming...'
    return 'Mint Rug'
  }

  const getMintButtonClass = () => {
    if (!isConnected || !isCorrectChain || isSoldOut) {
      return 'bg-gray-400 text-gray-200 cursor-not-allowed'
    }
    if (isPending || isConfirming) {
      return 'bg-blue-500 text-white hover:bg-blue-600'
    }
    return 'bg-green-600 text-white hover:bg-green-700'
  }

  return (
    <div className="space-y-4">
      {/* Mint Status */}
      <div className="bg-gray-900/50 border border-green-500/30 rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-green-300 text-sm font-mono">MINT STATUS</span>
          {isSuccess && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
        </div>
        
        <div className="text-green-400 text-xs font-mono space-y-1">
          <div>Supply: {currentSupply?.toString() || '0'} / {maxSupply?.toString() || '1111'}</div>
          <div>Base Price: FREE</div>
          <div>Text Lines: +0.00111 ETH (lines 2-3), +0.00222 ETH (lines 4-5)</div>
          <div>Network: {chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'}</div>
        </div>
      </div>

      {/* Custom Seed Input */}
      <div className="space-y-2">
        <label className="text-green-300 text-sm font-mono">CUSTOM SEED (Optional)</label>
        <input
          type="number"
          value={customSeed}
          onChange={(e) => setCustomSeed(e.target.value)}
          placeholder="Enter custom seed or use current"
          className="w-full px-3 py-2 bg-gray-900 border border-green-500/50 text-green-400 rounded text-sm font-mono focus:ring-1 focus:ring-green-500 focus:border-transparent transition-all"
        />
        <div className="text-green-500 text-xs font-mono">
          Current seed: {currentSeed} | Custom seed: {customSeed || 'None'}
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
            Rug minted successfully! Check your wallet.
          </div>
        </div>
      )}

      {/* Mint Button */}
      <motion.button
        onClick={handleMint}
        disabled={!isConnected || !isCorrectChain || isSoldOut || isPending || isConfirming}
        className={`w-full px-4 py-3 rounded font-mono transition-all duration-200 border flex items-center justify-center gap-2 text-sm ${getMintButtonClass()}`}
        whileHover={{ scale: isConnected && isCorrectChain && !isSoldOut ? 1.02 : 1 }}
        whileTap={{ scale: isConnected && isCorrectChain && !isSoldOut ? 0.98 : 1 }}
      >
        <Shuffle className="w-4 h-4" />
        {getMintButtonText()}
      </motion.button>

      {/* Network Warning */}
      {isConnected && !isCorrectChain && (
        <div className="bg-yellow-900/50 border border-yellow-500/30 rounded p-3">
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-mono">
            <AlertCircle className="w-4 h-4" />
            Please switch to {config.chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'} to mint
          </div>
        </div>
      )}
    </div>
  )
}
