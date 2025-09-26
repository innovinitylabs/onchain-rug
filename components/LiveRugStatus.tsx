'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

// Contract ABI - replace with your actual ABI
const CONTRACT_ABI = [
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "getDirtLevel",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
]

// Configuration - replace with your values
const RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || 'https://shape-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xa7e2c645E9332900b09c627c88b15Cc0b0fAcDc0'

interface LiveRugStatusProps {
  tokenId: string
}

export function LiveRugStatus({ tokenId }: LiveRugStatusProps) {
  const [rugStatus, setRugStatus] = useState<'clean' | 'dirty' | 'unknown'>('unknown')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkRugStatus = async () => {
    if (!tokenId) {
      setError('Please provide a valid token ID')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create ethers provider with Alchemy RPC
      const provider = new ethers.JsonRpcProvider(RPC_URL)

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

      // Call getDirtLevel function directly
      const dirtLevel = await contract.getDirtLevel(tokenId)

      // Determine status based on dirt level
      // 0 = clean, 1+ = dirty
      const isClean = dirtLevel === 0
      setRugStatus(isClean ? 'clean' : 'dirty')

    } catch (err) {
      console.error('Error checking rug status:', err)
      setError('Failed to check rug status. Please try again.')
      setRugStatus('unknown')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (rugStatus) {
      case 'clean': return 'text-green-600 bg-green-50 border-green-200'
      case 'dirty': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = () => {
    switch (rugStatus) {
      case 'clean': return 'Rug is Clean'
      case 'dirty': return 'Rug Needs Cleaning'
      default: return 'Status Unknown'
    }
  }

  return (
    <div className="w-full max-w-md bg-gray-900/50 border border-cyan-500/30 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-cyan-300 mb-2">Live Rug Status</h3>
        <p className="text-gray-400 text-sm">
          Check the real-time cleanliness status of rug #{tokenId}
        </p>
      </div>

      <div className="space-y-4">
        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
          <p className="text-lg font-semibold">{getStatusText()}</p>
          {rugStatus !== 'unknown' && (
            <p className="text-sm opacity-75 mt-1">
              Last checked: {new Date().toLocaleTimeString()}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={checkRugStatus}
          disabled={isLoading}
          className={`w-full px-4 py-3 rounded font-mono transition-all duration-200 border flex items-center justify-center gap-2 text-sm ${
            isLoading
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed border-gray-500'
              : 'bg-cyan-600 text-white hover:bg-cyan-700 border-cyan-500 hover:border-cyan-400'
          }`}
        >
          {isLoading ? 'Checking...' : 'Refresh Status'}
        </button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Uses direct contract call (not cached)</p>
          <p>• Queries live blockchain state</p>
          <p>• Powered by Alchemy RPC</p>
        </div>
      </div>
    </div>
  )
}
