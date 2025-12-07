"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Info } from 'lucide-react'
import { useAccount, useChainId } from 'wagmi'
import { parseEther } from 'viem'
import { getChainDisplayName, NETWORKS } from '@/lib/networks'
import { contractAddresses } from '@/lib/web3'

interface BridgeMintModalProps {
  isOpen: boolean
  onClose: () => void
  onMint: (params: {
    destinationChainId: number
    payChainId: number
    contractAddress: string
    mintCost: string
  }) => Promise<void>
  mintCostETH: number // Actual mint cost in ETH calculated by parent
  textRows: string[]
}

export default function BridgeMintModal({
  isOpen,
  onClose,
  onMint,
  mintCostETH,
  textRows
}: BridgeMintModalProps) {
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()

  // Destination options: chains with deployed contracts that have mintRugFor
  const destinationOptions = [
    NETWORKS.ethereumSepolia.chainId, // Fresh deployment with mintRugFor
    NETWORKS.shapeSepolia.chainId,    // Fresh deployment with mintRugFor
    NETWORKS.baseSepolia.chainId,     // Fresh deployment with mintRugFor
    // NETWORKS.shapeMainnet.chainId, // Enable after deploying to mainnet
    // NETWORKS.baseMainnet.chainId,  // Enable after deploying to mainnet
  ].filter(id => !!contractAddresses[id])

  // Pay options: all common chains users might have funds on
  const payOptions = [
    { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH' },
    { id: 11155111, name: 'Ethereum Sepolia', symbol: 'ETH' },
    { id: NETWORKS.baseMainnet.chainId, name: 'Base', symbol: 'ETH' },
    { id: NETWORKS.baseSepolia.chainId, name: 'Base Sepolia', symbol: 'ETH' },
    { id: NETWORKS.shapeMainnet.chainId, name: 'Shape', symbol: 'ETH' },
    { id: NETWORKS.shapeSepolia.chainId, name: 'Shape Sepolia', symbol: 'ETH' },
  ]

  // Default to Base Sepolia if available, otherwise first available option
  const defaultDestination = destinationOptions.includes(NETWORKS.baseSepolia.chainId) 
    ? NETWORKS.baseSepolia.chainId 
    : (destinationOptions[0] || NETWORKS.shapeSepolia.chainId)
  const [destinationChainId, setDestinationChainId] = useState(defaultDestination)
  const [payChainId, setPayChainId] = useState(currentChainId)
  const [payDropdownOpen, setPayDropdownOpen] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  
  // Check if route is likely supported (based on known Relay limitations)
  const isLikelyUnsupportedRoute = () => {
    // Base Sepolia → Shape Sepolia: Relay supports bridging but may not support contract calls
    if (payChainId === NETWORKS.baseSepolia.chainId && destinationChainId === NETWORKS.shapeSepolia.chainId && !isDirect) {
      return true
    }
    return false
  }

  // Update pay chain when user's connected chain changes
  useEffect(() => {
    if (currentChainId && payOptions.find(o => o.id === currentChainId)) {
      setPayChainId(currentChainId)
    }
  }, [currentChainId])

  const getName = (id: number) => {
    const opt = payOptions.find(o => o.id === id)
    return opt?.name || getChainDisplayName(id)
  }

  const getSymbol = (id: number) => {
    const opt = payOptions.find(o => o.id === id)
    return opt?.symbol || 'ETH'
  }

  // Calculate fees (actual values from contract/pricing logic)
  const isDirect = payChainId === destinationChainId
  const baseMintCost = mintCostETH // Already calculated in parent based on text lines
  
  // Estimate bridge fee as ~3-5% of mint cost (Relay's typical fee)
  // In production, this should come from Relay's quote API
  const bridgeFeeETH = isDirect ? 0 : Math.max(0.0001, baseMintCost * 0.04)
  
  const totalETH = baseMintCost + bridgeFeeETH

  const destinationContract = contractAddresses[destinationChainId]

  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet')
      return
    }
    if (!destinationContract) {
      alert('Contract not deployed on selected destination chain')
      return
    }
    
    // CRITICAL SAFETY: For direct mints, verify wallet is on correct chain
    if (isDirect && currentChainId !== destinationChainId) {
      alert(`⚠️ SAFETY CHECK FAILED\n\nYou selected to mint on ${getName(destinationChainId)}, but your wallet is connected to ${getName(currentChainId)}.\n\nPlease switch your wallet to ${getName(destinationChainId)} first, or use a different "Pay on" chain for cross-chain minting.`)
      return
    }

    setIsMinting(true)
    try {
      await onMint({
        destinationChainId,
        payChainId,
        contractAddress: destinationContract,
        mintCost: baseMintCost.toString(),
      })
      // Don't auto-close - let parent handle success state
    } catch (err) {
      console.error('Mint failed:', err)
      alert(`Mint failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsMinting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white">Mint Your Rug</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-visible">
            {/* Price Summary */}
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">Total Price</div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                {totalETH.toFixed(6)} {getSymbol(payChainId)}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Info size={12} />
                  <span>{baseMintCost.toFixed(6)} {getSymbol(payChainId)} MINT COST</span>
                </div>
                {!isDirect && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <Info size={12} />
                    <span>~{bridgeFeeETH.toFixed(6)} {getSymbol(payChainId)} BRIDGE FEE (estimated)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mint To Chain */}
            <div>
              <div className="text-xs text-slate-400 uppercase mb-2">Mint To</div>
              <select
                value={destinationChainId}
                onChange={(e) => setDestinationChainId(parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {destinationOptions.map(id => (
                  <option key={id} value={id}>{getName(id)}</option>
                ))}
              </select>
              {destinationContract && (
                <div className="mt-1 text-xs text-slate-500">
                  Contract: {destinationContract.slice(0, 6)}...{destinationContract.slice(-4)}
                </div>
              )}
            </div>

            {/* Pay On Chain */}
            <div>
              <div className="text-xs text-slate-400 uppercase mb-2">Pay On</div>
              <div className="relative">
                <button
                  onClick={() => setPayDropdownOpen(!payDropdownOpen)}
                  className="w-full bg-slate-800 border-2 border-purple-500 rounded-lg px-3 py-2 text-white focus:outline-none flex items-center justify-between"
                >
                  <span>{getName(payChainId)}</span>
                  <ChevronDown size={16} className={`transition-transform ${payDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {payDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
                    >
                      {payOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setPayChainId(option.id)
                            setPayDropdownOpen(false)
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors ${
                            payChainId === option.id ? 'bg-purple-500/20 border-l-2 border-purple-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white">{option.name}</span>
                            {payChainId === option.id && (
                              <span className="text-purple-400">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {!isDirect && !isLikelyUnsupportedRoute() && (
                <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                  <Info size={12} />
                  <span>Cross-chain mint via Relay Protocol</span>
                </div>
              )}
              {isLikelyUnsupportedRoute() && (
                <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <Info size={12} />
                  <span>⚠️ Route may not be supported for contract calls. Try Ethereum Sepolia instead.</span>
                </div>
              )}
            </div>

            {/* Safety Warning for Chain Mismatch */}
            {isDirect && currentChainId !== destinationChainId && (
              <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-3">
                <div className="text-red-400 text-sm font-bold mb-1">⚠️ SAFETY WARNING</div>
                <div className="text-red-300 text-xs">
                  Your wallet is on <span className="font-bold">{getName(currentChainId)}</span> but you&apos;re trying to mint on <span className="font-bold">{getName(destinationChainId)}</span>.
                  This will fail and may send funds to the wrong chain!
                </div>
                <div className="text-red-200 text-xs mt-2">
                  Switch wallet to {getName(destinationChainId)} or select a different &quot;Pay on&quot; chain for cross-chain minting.
                </div>
              </div>
            )}

            {/* Mint Button */}
            <motion.button
              whileHover={{ scale: isConnected && !isMinting ? 1.02 : 1 }}
              whileTap={{ scale: isConnected && !isMinting ? 0.98 : 1 }}
              onClick={handleMint}
              disabled={!isConnected || isMinting || (isDirect && currentChainId !== destinationChainId)}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                !isConnected || isMinting || (isDirect && currentChainId !== destinationChainId)
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {!isConnected ? '🔗 Connect Wallet' : isMinting ? '⏳ Minting...' : `🚀 ${isDirect ? 'Mint' : 'Bridge & Mint'}`}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

