'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowLeft, Zap, Shield, Heart, Star } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function MintPage() {
  const [selectedText, setSelectedText] = useState('')
  const [rows, setRows] = useState(1)
  const [isConnected, setIsConnected] = useState(false)
  const [isMinting, setIsMinting] = useState(false)

  const connectWallet = () => {
    setIsConnected(true)
    // In real implementation, this would connect to wallet
  }

  const mint = async () => {
    setIsMinting(true)
    // Simulate minting process
    setTimeout(() => {
      setIsMinting(false)
      alert('Minting successful! 🎉')
    }, 3000)
  }

  const calculatePrice = () => {
    const basePrice = 0
    const extraRowFee = 0.0005
    return rows > 1 ? basePrice + extraRowFee * (rows - 1) : basePrice
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <Navigation />
      
      <div className="pt-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-6">
              🚀 Mint Your Onchain Rugs
            </h1>
            <p className="text-xl text-amber-700 max-w-2xl mx-auto">
              Create a unique, generative onchain rugs NFT with custom text and authentic weaving patterns.
              Your rug will be one of only 1111 ever created.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mint Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-amber-200/50"
            >
              <h2 className="text-2xl font-bold text-amber-800 mb-6">🎨 Customize Your Onchain Rugs</h2>
              
              {/* Text Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Custom Text (Max 11 characters)
                </label>
                <input
                  type="text"
                  value={selectedText}
                  onChange={(e) => setSelectedText(e.target.value.toUpperCase().slice(0, 11))}
                  className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="WELCOME"
                  maxLength={11}
                />
                <p className="text-sm text-amber-600 mt-1">
                  {selectedText.length}/11 characters
                </p>
              </div>

              {/* Rows Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Number of Text Rows
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRows(num)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        rows === num
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-amber-600 mt-1">
                  Additional rows increase rarity and optional tip
                </p>
              </div>

              {/* Price Display */}
              <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-700">Base Price:</span>
                  <span className="font-bold text-amber-800">FREE</span>
                </div>
                {rows > 1 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-amber-700">Extra Rows ({rows - 1}):</span>
                    <span className="font-bold text-amber-800">
                      {((rows - 1) * 0.0005).toFixed(4)} ETH
                    </span>
                  </div>
                )}
                <hr className="border-amber-200 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-amber-800">Total:</span>
                  <span className="text-lg font-bold text-amber-800">
                    {calculatePrice() === 0 ? 'FREE' : `${calculatePrice().toFixed(4)} ETH`}
                  </span>
                </div>
              </div>

              {/* Wallet Connection / Mint Button */}
              {!isConnected ? (
                <motion.button
                  onClick={connectWallet}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Wallet className="w-6 h-6" />
                  Connect Wallet
                </motion.button>
              ) : (
                                  <motion.button
                    onClick={mint}
                    disabled={isMinting || !selectedText}
                    className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                      isMinting || !selectedText
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                    }`}
                    whileHover={!isMinting && selectedText ? { scale: 1.02 } : {}}
                    whileTap={!isMinting && selectedText ? { scale: 0.98 } : {}}
                  >
                    {isMinting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-4 border-white border-t-transparent rounded-full"
                        />
                        Minting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-6 h-6" />
                        Mint Onchain Rugs NFT
                      </>
                    )}
                  </motion.button>
              )}

              {isConnected && (
                <p className="text-center text-sm text-green-600 mt-3 flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Wallet Connected
                </p>
              )}
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  What You Get
                </h3>
                <ul className="space-y-3 text-amber-700">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Unique generative onchain rugs with authentic weaving patterns</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Custom text embedded directly into the fabric</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Self-contained HTML file for permanent on-chain storage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Comprehensive trait system with rarity calculations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>One of only 1,111 ever created</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  Why Choose Doormat NFTs
                </h3>
                <ul className="space-y-3 text-amber-700">
                  <li className="flex items-start gap-3">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Cultural heritage meets blockchain innovation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Free mint with optional pay-what-you-want model</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>102 curated color palettes from around the world</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Advanced cloth physics and authentic textures</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
