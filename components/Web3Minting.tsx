"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { parseEther } from 'viem'
import { shapeSepolia, shapeMainnet, contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'

interface Web3MintingProps {
  textRows: string[]
  currentPalette: any
  currentStripeData: any[]
  characterMap: any
  warpThickness: number
  seed: number
  complexity: number
}

export default function Web3Minting({
  textRows,
  currentPalette,
  currentStripeData,
  characterMap,
  warpThickness,
  seed,
  complexity
}: Web3MintingProps) {
  const [isMinting, setIsMinting] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const publicClient = usePublicClient()
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)
  const [gasError, setGasError] = useState<string | null>(null)
  const [gasLoading, setGasLoading] = useState(false)

  // Get contract address for current network (no fallback for safety)
  const contractAddress = contractAddresses[chainId]

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

  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first!')
      return
    }

    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      alert('Contract not deployed yet for this network!')
      return
    }

    try {
      // Check if character map is available
      const globalCharacterMap = typeof window !== 'undefined' && (window as any).doormatData?.characterMap
      if (!globalCharacterMap) {
        throw new Error('Character map not loaded. Please wait for the page to fully load before minting.')
      }

      const optimized = optimizeData()
      // Use the seed from the generator (not random!)

      // Try estimating gas first
      let gasLimit: bigint
      setGasLoading(true)
      try {
        const est = await publicClient.estimateContractGas({
          address: contractAddress as `0x${string}`,
          abi: [
            {
              "inputs": [
                {"internalType": "string[]", "name": "textRows", "type": "string[]"},
                {"internalType": "uint256", "name": "seed", "type": "uint256"},
                {
                  "components": [
                    {"internalType": "uint8", "name": "warpThickness", "type": "uint8"},
                    {"internalType": "uint256", "name": "stripeCount", "type": "uint256"}
                  ],
                  "internalType": "struct RugNFTFacet.VisualConfig",
                  "name": "visual",
                  "type": "tuple"
                },
                {
                  "components": [
                    {"internalType": "string", "name": "paletteName", "type": "string"},
                    {"internalType": "string", "name": "minifiedPalette", "type": "string"},
                    {"internalType": "string", "name": "minifiedStripeData", "type": "string"},
                    {"internalType": "string", "name": "filteredCharacterMap", "type": "string"}
                  ],
                  "internalType": "struct RugNFTFacet.ArtData",
                  "name": "art",
                  "type": "tuple"
                },
                {"internalType": "uint8", "name": "complexity", "type": "uint8"},
                {"internalType": "uint256", "name": "characterCount", "type": "uint256"}
              ],
              "name": "mintRug",
              "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
              "stateMutability": "payable",
              "type": "function"
            }
          ] as const,
          functionName: 'mintRug',
          args: [
            optimized.textRows,
            BigInt(seed),
            {
              warpThickness: warpThickness,
              stripeCount: BigInt(optimized.stripeData.length)
            },
            {
              paletteName: optimized.palette.name,
              minifiedPalette: JSON.stringify(optimized.palette),
              minifiedStripeData: JSON.stringify(optimized.stripeData),
              filteredCharacterMap: JSON.stringify(optimized.characterMap)
            },
            complexity,
            BigInt(optimized.textRows.join('').length)
          ],
          value: parseEther(mintCost.toString()),
          account: address
        })
        gasLimit = est * BigInt(12) / BigInt(10) // add 20% buffer
        setGasEstimate(gasLimit)
        setGasError(null)
      } catch (e: any) {
        console.warn("Gas estimation failed, falling back to static limits:", e)
        setGasError(e.message || "Estimation failed")

        // Conservative fallback for Shape L2
        const baseGasLimit = BigInt(8000000)
        const textLength = optimized.textRows.join('').length
        const stripeCount = optimized.stripeData.length
        const dataComplexity = textLength + (stripeCount * 100)

        if (dataComplexity > 1000) {
          gasLimit = baseGasLimit
        } else if (dataComplexity > 500) {
          gasLimit = baseGasLimit * BigInt(90) / BigInt(100)
        } else if (dataComplexity > 200) {
          gasLimit = baseGasLimit * BigInt(80) / BigInt(100)
        } else {
          gasLimit = baseGasLimit * BigInt(70) / BigInt(100)
        }
      }

      setGasLoading(false)

      console.log('Using gas limit:', gasLimit.toString())
      
      console.log('Minting with optimized data:', {
        contract: contractAddress,
        chainId: chainId,
        network: chainId === 84532 ? 'Base Sepolia' : chainId === 11011 ? 'Shape Sepolia' : 'Unknown',
        textRows: optimized.textRows,
        seed: seed, // Using the seed from the generator
        paletteName: optimized.palette.name,
        minifiedStripeData: JSON.stringify(optimized.stripeData),
        minifiedPalette: JSON.stringify(optimized.palette),
        filteredCharacterMap: JSON.stringify(optimized.characterMap),
        warpThickness: warpThickness, // Dynamic from generator
        complexity: complexity, // Dynamic from generator
        characterCount: optimized.textRows.join('').length,
        stripeCount: optimized.stripeData.length,
        mintCost,
        gasLimit: gasLimit.toString(),
        address,
        characterMapSize: Object.keys(optimized.characterMap).length,
        originalSize: optimized.originalSize,
        optimizedSize: optimized.optimizedSize
      })

      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"internalType": "string[]", "name": "textRows", "type": "string[]"},
              {"internalType": "uint256", "name": "seed", "type": "uint256"},
              {
                "components": [
                  {"internalType": "uint8", "name": "warpThickness", "type": "uint8"},
                  {"internalType": "uint256", "name": "stripeCount", "type": "uint256"}
                ],
                "internalType": "struct RugNFTFacet.VisualConfig",
                "name": "visual",
                "type": "tuple"
              },
              {
                "components": [
                  {"internalType": "string", "name": "paletteName", "type": "string"},
                  {"internalType": "string", "name": "minifiedPalette", "type": "string"},
                  {"internalType": "string", "name": "minifiedStripeData", "type": "string"},
                  {"internalType": "string", "name": "filteredCharacterMap", "type": "string"}
                ],
                "internalType": "struct RugNFTFacet.ArtData",
                "name": "art",
                "type": "tuple"
              },
              {"internalType": "uint8", "name": "complexity", "type": "uint8"},
              {"internalType": "uint256", "name": "characterCount", "type": "uint256"}
            ],
            "name": "mintRug",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "payable",
            "type": "function"
          }
        ] as const,
        functionName: 'mintRug',
        args: [
          optimized.textRows,
          BigInt(seed), // Using the seed from the generator
          {
            warpThickness: warpThickness, // Using the actual warp thickness from generator
            stripeCount: BigInt(optimized.stripeData.length)
          },
          {
            paletteName: optimized.palette.name,
            minifiedPalette: JSON.stringify(optimized.palette),
            minifiedStripeData: JSON.stringify(optimized.stripeData),
            filteredCharacterMap: JSON.stringify(optimized.characterMap)
          },
          complexity, // Using the calculated complexity from generator
          BigInt(optimized.textRows.join('').length) // characterCount
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

  const isButtonDisabled = !isConnected || isPending || isConfirming

  return (
    <div className="space-y-3">
      {/* Contract Status */}
      {!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000' ? (
        <div className="bg-orange-900/30 border border-orange-500/30 rounded p-2">
          <div className="text-orange-400 text-xs font-mono">
            ⚠️ Contract not deployed on this network
          </div>
          <div className="text-orange-300 text-xs mt-1">
            Network: {chainId === 84532 ? 'Base Sepolia' : chainId === 11011 ? 'Shape Sepolia' : `Chain ${chainId}`}
          </div>
          <div className="text-orange-300 text-xs mt-1">
            Please switch to a supported network
          </div>
        </div>
      ) : (
        <div className="bg-green-900/30 border border-green-500/30 rounded p-2">
          <div className="text-green-400 text-xs font-mono">
            ✅ Ready: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}
          </div>
          <div className="text-green-300 text-xs mt-1">
            Network: {chainId === 84532 ? 'Base Sepolia' : chainId === 11011 ? 'Shape Sepolia' : `Chain ${chainId}`}
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

      {/* Gas Limit Status */}
      {isConnected && (
        <div className="bg-green-900/30 border border-green-500/30 rounded p-2">
          <div className="text-green-400 text-xs font-mono">
            ⛽ {gasLoading ? "Estimating gas..." : gasEstimate ? `Estimated gas: ${gasEstimate.toString()}` : "Using fallback gas limits"}
          </div>
          {gasError && (
            <div className="text-red-300 text-xs mt-1">
              Estimation error: {gasError}
            </div>
          )}
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