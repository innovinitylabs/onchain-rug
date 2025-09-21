"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useEstimateGas } from 'wagmi'
import { parseEther } from 'viem'
import { shapeSepolia, shapeMainnet } from '@/lib/web3'

interface Web3MintingProps {
  textRows: string[]
  currentPalette: any
  currentStripeData: any[]
  characterMap: any
  warpThickness: number
}

export default function Web3Minting({ 
  textRows, 
  currentPalette, 
  currentStripeData, 
  characterMap, 
  warpThickness 
}: Web3MintingProps) {
  const [isMinting, setIsMinting] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Calculate minting cost - NO TEXT IS FREE TO MINT
  const calculateCost = () => {
    const nonEmptyRows = textRows.filter(row => row.trim() !== '').length
    
    // Base price for ANY mint (even no text) = 0.0001 ETH
    const basePrice = 0.0001
    
    if (nonEmptyRows <= 1) return basePrice // Base price for 0 or 1 line
    
    // Additional costs for extra lines
    if (nonEmptyRows <= 3) {
      return basePrice + (nonEmptyRows - 1) * 0.00111 // Lines 2-3: +0.00111 ETH each
    }
    
    // Lines 4-5: +0.00222 ETH each
    return basePrice + 2 * 0.00111 + (nonEmptyRows - 3) * 0.00222
  }

  const mintCost = calculateCost()

  // Optimize data before sending
  const optimizeData = () => {
    const nonEmptyTextRows = textRows.filter(row => row.trim() !== '')
    const finalTextRows = nonEmptyTextRows.length > 0 ? nonEmptyTextRows : ['']

    // Get character map from global doormatData
    const globalCharacterMap = typeof window !== 'undefined' && (window as any).doormatData?.characterMap

    if (!globalCharacterMap) {
      console.warn('Character map not loaded yet! Minting may fail.')
    }

    // Filter character map to only include used characters
    const usedChars = new Set<string>()
    finalTextRows.forEach(row => {
      for (const char of row.toUpperCase()) {
        usedChars.add(char)
      }
    })

    const filteredCharacterMap: any = {}
    usedChars.forEach((char: string) => {
      if (globalCharacterMap && globalCharacterMap[char]) {
        filteredCharacterMap[char] = globalCharacterMap[char]
      }
    })

    // Always include space character
    if (globalCharacterMap && globalCharacterMap[' ']) {
      filteredCharacterMap[' '] = globalCharacterMap[' ']
    }

    // Use full palette data for proper rarity calculation
    const fullPalette = {
      name: currentPalette?.name || 'Default',
      colors: currentPalette?.colors || ['#FF0000']
    }

    // Compress stripe data with null checks
    const compressedStripeData = (currentStripeData || []).map(stripe => ({
      y: stripe.y,
      h: stripe.height || stripe.h, // 'height' -> 'h'
      pc: stripe.primaryColor || stripe.pc, // 'primaryColor' -> 'pc'
      sc: stripe.secondaryColor || stripe.sc, // 'secondaryColor' -> 'sc'
      wt: stripe.weaveType || stripe.wt, // 'weaveType' -> 'wt'
      wv: stripe.warpVariation || stripe.wv // 'warpVariation' -> 'wv'
    }))

    // Calculate sizes for debugging
    const originalSize = JSON.stringify(currentPalette || {}).length + JSON.stringify(currentStripeData || []).length + JSON.stringify(globalCharacterMap || {}).length
    const optimizedSize = JSON.stringify(fullPalette).length + JSON.stringify(compressedStripeData).length + JSON.stringify(filteredCharacterMap).length

    return {
      textRows: finalTextRows,
      palette: fullPalette,
      stripeData: compressedStripeData,
      characterMap: filteredCharacterMap,
      originalSize,
      optimizedSize
    }
  }

  // Skip gas estimation - use fixed high gas limit to avoid wallet issues
  const gasEstimate = null
  const gasError = null
  const gasLoading = false

  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first!')
      return
    }

    if (!process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT) {
      alert('Contract not deployed yet!')
      return
    }

    try {
      // Check if character map is available
      const globalCharacterMap = typeof window !== 'undefined' && (window as any).doormatData?.characterMap
      if (!globalCharacterMap) {
        throw new Error('Character map not loaded. Please wait for the page to fully load before minting.')
      }

      const optimized = optimizeData()
      const seed = Math.floor(Math.random() * 4294967296) // Generate random seed
      
      // Use a very high fixed gas limit to avoid wallet simulation issues
      const gasLimit = BigInt(5000000) // 5M gas - very high limit for Shape L2
      
      console.log('Minting with optimized data:', {
        contract: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT,
        textRows: optimized.textRows,
        seed,
        paletteName: optimized.palette.name,
        minifiedStripeData: JSON.stringify(optimized.stripeData),
        minifiedPalette: JSON.stringify(optimized.palette),
        filteredCharacterMap: JSON.stringify(optimized.characterMap),
        warpThickness: 3,
        complexity: 2,
        characterCount: optimized.textRows.join('').length,
        stripeCount: optimized.stripeData.length,
        mintCost,
        gasLimit: gasLimit.toString(),
        chainId,
        address,
        characterMapSize: Object.keys(optimized.characterMap).length,
        originalSize: optimized.originalSize,
        optimizedSize: optimized.optimizedSize
      })

      await writeContract({
        address: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"internalType": "string[]", "name": "textRows", "type": "string[]"},
              {"internalType": "uint256", "name": "seed", "type": "uint256"},
              {"internalType": "string", "name": "paletteName", "type": "string"},
              {"internalType": "string", "name": "minifiedStripeData", "type": "string"},
              {"internalType": "string", "name": "minifiedPalette", "type": "string"},
              {"internalType": "string", "name": "filteredCharacterMap", "type": "string"},
              {"internalType": "uint8", "name": "warpThickness", "type": "uint8"},
              {"internalType": "uint8", "name": "complexity", "type": "uint8"},
              {"internalType": "uint256", "name": "characterCount", "type": "uint256"},
              {"internalType": "uint256", "name": "stripeCount", "type": "uint256"}
            ],
            "name": "mintRug",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ] as const,
        functionName: 'mintRug',
        args: [
          optimized.textRows,
          BigInt(seed),
          optimized.palette.name,
          JSON.stringify(optimized.stripeData),
          JSON.stringify(optimized.palette),
          JSON.stringify(optimized.characterMap),
          3, // warpThickness
          2, // complexity
          BigInt(optimized.textRows.join('').length), // characterCount
          BigInt(optimized.stripeData.length) // stripeCount
        ],
        value: parseEther(mintCost.toString()),
        gas: gasLimit,
        chain: chainId === 11011 ? shapeSepolia : shapeMainnet,
        account: address
      })
    } catch (err) {
      console.error('Minting error:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        gasEstimate,
        gasError
      })
      alert(`Minting failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const getButtonText = () => {
    if (!isConnected) return '🔗 Connect Wallet First'
    if (isPending) return '⏳ Sending Transaction...'
    if (isConfirming) return '⏳ Confirming on Blockchain...'
    if (isSuccess) return '✅ NFT Minted Successfully!'
    return `🚀 Mint Rug (${mintCost} ETH)`
  }

  const isButtonDisabled = !isConnected || isPending || isConfirming || isSuccess

  return (
    <div className="space-y-3">
      {/* Contract Status */}
      {!process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT || process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT === '0x0000000000000000000000000000000000000000' ? (
        <div className="bg-orange-900/30 border border-orange-500/30 rounded p-2">
          <div className="text-orange-400 text-xs font-mono">
            ⚠️ Contract address not set in environment variables
          </div>
          <div className="text-orange-300 text-xs mt-1">
            Set NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT in .env file
          </div>
        </div>
      ) : (
        <div className="bg-green-900/30 border border-green-500/30 rounded p-2">
          <div className="text-green-400 text-xs font-mono">
            ✅ Contract ready: {process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT?.slice(0, 6)}...{process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT?.slice(-4)}
          </div>
        </div>
      )}

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded p-2">
          <div className="text-yellow-400 text-xs font-mono">
            🔗 Please connect your wallet to mint
          </div>
        </div>
      )}

      {/* Gas Estimation Status */}
      {isConnected && !gasEstimate && !gasError && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded p-2">
          <div className="text-blue-400 text-xs font-mono">
            ⏳ Estimating gas costs...
          </div>
        </div>
      )}

      {gasError && (
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded p-2">
          <div className="text-yellow-400 text-xs font-mono">
            ⚠️ Gas estimation failed, using default gas limit (200,000)
          </div>
        </div>
      )}

      {gasEstimate && (
        <div className="bg-green-900/30 border border-green-500/30 rounded p-2">
          <div className="text-green-400 text-xs font-mono">
            ✅ Gas estimated: {gasEstimate.toString()} units
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {hash && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded p-2">
          <div className="text-blue-400 text-xs font-mono">
            📝 Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="bg-green-900/30 border border-green-500/30 rounded p-2">
          <div className="text-green-400 text-xs font-mono">
            ✅ NFT minted successfully!
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded p-2">
          <div className="text-red-400 text-xs font-mono">
            ❌ Error: {error.message}
          </div>
        </div>
      )}

      {/* Mint Button */}
      <motion.button
        whileHover={{ scale: isButtonDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isButtonDisabled ? 1 : 0.98 }}
        onClick={handleMint}
        disabled={isButtonDisabled}
        className={`w-full py-3 px-4 rounded font-mono text-sm font-bold transition-all duration-200 ${
          isButtonDisabled 
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {getButtonText()}
      </motion.button>


    </div>
  )
}