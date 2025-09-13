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
  calculatedComplexity?: number // Auto-calculated from traits
}

export default function Web3Minting({
  textRows,
  currentPalette,
  currentStripeData,
  characterMap,
  warpThickness,
  calculatedComplexity = 3 // Auto-calculated complexity
}: Web3MintingProps) {
  const [isMinting, setIsMinting] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Calculate minting cost - Updated to match smart contract pricing
  const calculateCost = () => {
    const nonEmptyRows = textRows.filter(row => row.trim() !== '').length

    // Base price: 0.00069 ETH
    let totalCost = 0.00069

    // Add individual line prices (up to 5 lines)
    for (let i = 0; i < nonEmptyRows && i < 5; i++) {
      // Default line prices (can be updated via contract)
      const linePrices = [0.00042, 0.00069, 0.00111, 0.00142, 0.00169]
      totalCost += linePrices[i]
    }

    return totalCost
  }

  const mintCost = calculateCost()

  // Optimize and minify data for smart contract
  const optimizeData = () => {
    const nonEmptyTextRows = textRows.filter(row => row.trim() !== '')
    const finalTextRows = nonEmptyTextRows.length > 0 ? nonEmptyTextRows : ['']

    // Filter character map to only include used characters
    const usedChars = new Set<string>()
    finalTextRows.forEach(row => {
      for (const char of row.toUpperCase()) {
        if (char !== ' ') usedChars.add(char)
      }
    })

    const filteredCharacterMap: any = {}
    usedChars.forEach((char: string) => {
      if (characterMap && characterMap[char]) {
        filteredCharacterMap[char] = characterMap[char]
      }
    })

    // Full palette data
    const fullPalette = {
      name: currentPalette?.name || 'Default',
      colors: currentPalette?.colors || ['#FF0000']
    }

    // Minified stripe data for contract
    const minifiedStripeData = (currentStripeData || []).map(stripe => ({
      y: Math.round(stripe.y * 100) / 100, // Truncate to 3 decimals
      h: Math.round(stripe.height * 100) / 100,
      pc: stripe.primaryColor,
      sc: stripe.secondaryColor,
      wt: stripe.weaveType === 'solid' ? 's' : stripe.weaveType === 'mixed' ? 'm' : 't',
      wv: Math.round(stripe.warpVariation * 100) / 100
    }))

    return {
      textRows: finalTextRows,
      paletteName: currentPalette?.name || 'Default',
      minifiedPalette: JSON.stringify(fullPalette),
      minifiedStripeData: JSON.stringify(minifiedStripeData),
      minifiedCharacterMap: JSON.stringify(filteredCharacterMap),
      complexity: calculatedComplexity
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
      const optimized = optimizeData()
      const seed = Math.floor(Math.random() * 4294967296) // Generate random seed
      
      // Use a very high fixed gas limit to avoid wallet simulation issues
      const gasLimit = BigInt(5000000) // 5M gas - very high limit for Shape L2
      
      console.log('Minting with optimized data:', {
        contract: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT,
        textRows: optimized.textRows,
        seed,
        paletteName: optimized.paletteName,
        minifiedPalette: optimized.minifiedPalette,
        minifiedStripeData: optimized.minifiedStripeData,
        minifiedCharacterMap: optimized.minifiedCharacterMap,
        warpThickness,
        complexity: optimized.complexity,
        mintCost,
        gasLimit: gasLimit.toString(),
        chainId,
        address,
        originalSize: JSON.stringify(currentPalette || {}).length + JSON.stringify(currentStripeData || []).length + JSON.stringify(characterMap || {}).length,
        minifiedSize: optimized.minifiedPalette.length + optimized.minifiedStripeData.length + optimized.minifiedCharacterMap.length
      })
      
      await writeContract({
        address: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"internalType": "string[]", "name": "textRows", "type": "string[]"},
              {"internalType": "uint256", "name": "seed", "type": "uint256"},
              {"internalType": "string", "name": "paletteName", "type": "string"},
              {"internalType": "string", "name": "minifiedPalette", "type": "string"},
              {"internalType": "string", "name": "minifiedStripeData", "type": "string"},
              {"internalType": "string", "name": "minifiedCharacterMap", "type": "string"},
              {"internalType": "uint256", "name": "warpThickness", "type": "uint256"},
              {"internalType": "uint8", "name": "complexity", "type": "uint8"}
            ],
            "name": "mintRugWithParams",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ] as const,
        functionName: 'mintRugWithParams',
        args: [
          optimized.textRows,
          BigInt(seed),
          optimized.paletteName,
          optimized.minifiedPalette,
          optimized.minifiedStripeData,
          optimized.minifiedCharacterMap,
          BigInt(warpThickness),
          optimized.complexity
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
    if (!isConnected) return 'Connect Wallet to Mint'
    if (isPending || isConfirming) return 'Minting...'
    if (isSuccess) return 'Minted Successfully!'
    return `Mint Rug (${mintCost} ETH) - 5M Gas`
  }

  const isButtonDisabled = !isConnected || isPending || isConfirming || isSuccess

  return (
    <div className="space-y-3">
      {/* Contract Status */}
      {!process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT || process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT === '0x0000000000000000000000000000000000000000' ? (
        <div className="bg-orange-900/30 border border-orange-500/30 rounded p-2">
          <div className="text-orange-400 text-xs font-mono">
            ⚠️ Contract not deployed yet - This is a preview
          </div>
        </div>
      ) : (
        <div className="bg-green-900/30 border border-green-500/30 rounded p-2">
          <div className="text-green-400 text-xs font-mono">
            ✅ Contract deployed: {process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT?.slice(0, 6)}...{process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT?.slice(-4)}
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

      {/* Debug Info */}
      <div className="bg-gray-900/50 border border-gray-500/30 rounded p-2">
        <div className="text-gray-400 text-xs font-mono">
          Ready to mint: {textRows.filter(row => row.trim() !== '').length} text line(s)
        </div>
        <div className="text-gray-400 text-xs font-mono mt-1">
          Contract: {process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT ? '✅ Set' : '❌ Missing'}
        </div>
        <div className="text-gray-400 text-xs font-mono">
          Wallet: {isConnected ? '✅ Connected' : '❌ Not connected'}
        </div>
        <div className="text-gray-400 text-xs font-mono">
          Gas: {gasEstimate ? `✅ ${gasEstimate.toString()}` : gasError ? '❌ Failed' : '⏳ Estimating'}
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={() => {
          console.log('=== DEBUG INFO ===');
          console.log('Contract:', process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT);
          console.log('Connected:', isConnected);
          console.log('Address:', address);
          console.log('Chain ID:', chainId);
          console.log('Gas Estimate:', gasEstimate);
          console.log('Gas Error:', gasError);
          console.log('Text Rows:', textRows);
          console.log('Palette:', currentPalette);
          console.log('Stripe Data:', currentStripeData);
          console.log('Character Map:', characterMap);
          console.log('Warp Thickness:', warpThickness);
          console.log('Mint Cost:', mintCost);
          console.log('==================');
        }}
        className="w-full py-2 px-3 rounded font-mono text-xs bg-blue-600 hover:bg-blue-700 text-white"
      >
        🔍 Debug Info (Check Console)
      </button>

      {/* Manual Gas Override Button */}
      <button
        onClick={async () => {
          if (!isConnected) {
            alert('Please connect your wallet first!')
            return
          }

          if (!process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT) {
            alert('Contract not deployed yet!')
            return
          }

          try {
            const nonEmptyTextRows = textRows.filter(row => row.trim() !== '')
            const finalTextRows = nonEmptyTextRows.length > 0 ? nonEmptyTextRows : ['']
            const seed = Math.floor(Math.random() * 4294967296)
            
            // Use maximum gas limit for Shape L2
            const maxGasLimit = BigInt(2000000) // 2 million gas
            
            console.log('🚀 Attempting mint with MAX GAS:', maxGasLimit.toString())
            
            await writeContract({
              address: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT as `0x${string}`,
              abi: [
                {
                  "inputs": [
                    {"internalType": "string[]", "name": "textRows", "type": "string[]"},
                    {"internalType": "uint256", "name": "seed", "type": "uint256"},
                    {"internalType": "string", "name": "palette", "type": "string"},
                    {"internalType": "string", "name": "stripeData", "type": "string"},
                    {"internalType": "string", "name": "characterMap", "type": "string"},
                    {"internalType": "uint256", "name": "warpThickness", "type": "uint256"}
                  ],
                  "name": "mintRugWithParams",
                  "outputs": [],
                  "stateMutability": "payable",
                  "type": "function"
                }
              ] as const,
              functionName: 'mintRugWithParams',
              args: [
                finalTextRows,
                BigInt(seed),
                JSON.stringify(currentPalette),
                JSON.stringify(currentStripeData),
                JSON.stringify(characterMap || {}),
                BigInt(warpThickness)
              ],
              value: parseEther(mintCost.toString()),
              gas: maxGasLimit,
              chain: chainId === 11011 ? shapeSepolia : shapeMainnet,
              account: address
            })
          } catch (err) {
            console.error('Max gas minting error:', err)
            alert(`Minting failed even with max gas: ${err instanceof Error ? err.message : 'Unknown error'}`)
          }
        }}
        className="w-full py-2 px-3 rounded font-mono text-xs bg-red-600 hover:bg-red-700 text-white"
      >
        🚀 Force Mint (Max Gas: 2M)
      </button>
    </div>
  )
}