"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi'
import { parseEther, encodeFunctionData } from 'viem'
import { shapeSepolia, shapeMainnet, contractAddresses } from '@/lib/web3'
import { config } from '@/lib/config'
import { getChainDisplayName, NETWORKS } from '@/lib/networks'
import { DESTINATION_SHAPE_ID, getDestinationContractAddress, getWagmiChainById } from '@/config/chains'
import { useRelayMint } from '@/hooks/use-relay-mint'
import BridgeMintModal from './BridgeMintModal'

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

  const { mintCrossChain, relayTxHash, isConfirming: isRelayConfirming, isSuccess: isRelaySuccess } = useRelayMint()

  // Modal state
  const [showModal, setShowModal] = useState(false)

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

  const handleModalMint = async (params: {
    destinationChainId: number
    payChainId: number
    contractAddress: string
    mintCost: string
  }) => {
    const { destinationChainId, payChainId, contractAddress } = params

    try {
      // Check if character map is available
      const globalCharacterMap = typeof window !== 'undefined' && (window as any).doormatData?.characterMap
      if (!globalCharacterMap) {
        throw new Error('Character map not loaded. Please wait for the page to fully load before minting.')
      }

      const optimized = optimizeData()
      // Use the seed from the generator (not random!)

      // Route: direct if pay chain equals destination chain
      const isDirect = payChainId === destinationChainId

      // Try estimating gas first (only relevant for direct path)
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
        network: getChainDisplayName(chainId),
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

      if (isDirect) {
        const destChain = getWagmiChainById(destinationChainId)
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
          gas: gasLimit,
          chain: destChain,
          account: address
        })
      } else {
        const callData = encodeFunctionData({
          abi: [
            {
              inputs: [
                { name: 'recipient', type: 'address' },
                { name: 'textRows', type: 'string[]' },
                { name: 'seed', type: 'uint256' },
                { name: 'visual', type: 'tuple', components: [
                  { name: 'warpThickness', type: 'uint8' },
                  { name: 'stripeCount', type: 'uint256' },
                ] },
                { name: 'art', type: 'tuple', components: [
                  { name: 'paletteName', type: 'string' },
                  { name: 'minifiedPalette', type: 'string' },
                  { name: 'minifiedStripeData', type: 'string' },
                  { name: 'filteredCharacterMap', type: 'string' },
                ] },
                { name: 'complexity', type: 'uint8' },
                { name: 'characterCount', type: 'uint256' },
              ],
              name: 'mintRugFor',
              outputs: [],
              stateMutability: 'payable',
              type: 'function',
            }
          ] as const,
          functionName: 'mintRugFor',
          args: [
            address as `0x${string}`,
            optimized.textRows,
            BigInt(seed),
            { warpThickness, stripeCount: BigInt(optimized.stripeData.length) },
            {
              paletteName: optimized.palette.name,
              minifiedPalette: JSON.stringify(optimized.palette),
              minifiedStripeData: JSON.stringify(optimized.stripeData),
              filteredCharacterMap: JSON.stringify(optimized.characterMap)
            },
            complexity,
            BigInt(optimized.textRows.join('').length)
          ],
        })

        const valueWei = parseEther(mintCost.toString())
        const quote = await mintCrossChain({
          originChainId: payChainId,
          destinationChainId,
          contractAddress: contractAddress as string,
          recipient: address as `0x${string}`,
          textRows: optimized.textRows,
          seed: BigInt(seed),
          visual: { warpThickness, stripeCount: Number(BigInt(optimized.stripeData.length)) },
          art: {
            paletteName: optimized.palette.name,
            minifiedPalette: JSON.stringify(optimized.palette),
            minifiedStripeData: JSON.stringify(optimized.stripeData),
            filteredCharacterMap: JSON.stringify(optimized.characterMap)
          },
          complexity,
          characterCount: BigInt(optimized.textRows.join('').length),
          valueWei,
        })

        console.log('Relay quote result:', quote)
        
        if (quote.hash) {
          alert(`Bridge + Mint transaction sent! Hash: ${quote.hash}\n\nPlease wait for confirmation. The NFT will be minted on ${getName(destinationChainId)} after the bridge completes.`)
        } else {
          alert('Bridge + Mint quote created. Transaction will be executed by wallet.')
        }
      }
      
      // Modal stays open to show status - will close when tx confirms
      if (isDirect) {
        setShowModal(false)
      }
    } catch (err) {
      console.error('Minting error:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        gasEstimate,
        gasError
      })
      throw err // Let modal handle the error display
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
      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded p-2">
          <div className="text-yellow-400 text-xs font-mono">
            🔗 Please connect your wallet to mint
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {(hash || relayTxHash) && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded p-2">
          <div className="text-blue-400 text-xs font-mono">
            📝 Transaction: {(hash || relayTxHash)?.slice(0, 10)}...{(hash || relayTxHash)?.slice(-8)}
          </div>
          {relayTxHash && isRelayConfirming && (
            <div className="text-amber-400 text-xs mt-1">
              ⏳ Waiting for bridge to complete...
            </div>
          )}
        </div>
      )}

      {(isSuccess || isRelaySuccess) && (
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
        onClick={() => setShowModal(true)}
        disabled={isButtonDisabled}
        className={`w-full py-3 px-4 rounded font-mono text-sm font-bold transition-all duration-200 ${
          isButtonDisabled 
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {getButtonText()}
      </motion.button>

      {/* Bridge Mint Modal */}
      <BridgeMintModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onMint={handleModalMint}
        mintCostETH={mintCost}
        textRows={textRows}
      />
    </div>
  )
}