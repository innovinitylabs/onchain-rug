'use client'

import { useState } from 'react'
import { ethers } from 'ethers'

// Configuration - using your existing env vars
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT ||
                        process.env.ONCHAIN_RUGS_CONTRACT ||
                        '0xa7e2c645E9332900b09c627c88b15Cc0b0fAcDc0'

// Function selector for tokenURI(uint256)
const TOKENURI_SELECTOR = '0xc87b56dd'

// Demo tokenId = 1
const DEMO_TOKEN_ID = 1

interface ManualTokenURIFetchProps {
  onResult?: (uri: string) => void
}

export function ManualTokenURIFetch({ onResult }: ManualTokenURIFetchProps) {
  const [tokenURI, setTokenURI] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const fetchTokenURIManual = async () => {
    if (!ALCHEMY_API_KEY) {
      setError('ALCHEMY_API_KEY not configured')
      return
    }

    setIsLoading(true)
    setError('')
    setTokenURI('')

    try {
      // Connect to Alchemy RPC (use Shape Sepolia for your project)
      const provider = new ethers.JsonRpcProvider(`https://shape-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)

      // Manually encode the function call
      // tokenURI(uint256) selector: 0xc87b56dd
      // Pad tokenId to 32 bytes
      const paddedTokenId = ethers.zeroPadValue(ethers.toBeHex(DEMO_TOKEN_ID), 32).slice(2)
      const data = TOKENURI_SELECTOR + paddedTokenId

      console.log('Manual eth_call data:', data)
      console.log('Contract address:', CONTRACT_ADDRESS)

      // Perform manual eth_call
      const result = await provider.call({
        to: CONTRACT_ADDRESS,
        data: data
      })

      console.log('Raw eth_call result:', result)

      // Decode the returned hex string using AbiCoder
      // tokenURI returns a string, so decode as ["string"]
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], result)
      const uri = decoded[0]

      console.log('Decoded tokenURI:', uri)

      setTokenURI(uri)

      // Call optional callback
      if (onResult) {
        onResult(uri)
      }

    } catch (err) {
      console.error('Manual tokenURI fetch failed:', err)
      setError(`Failed to fetch tokenURI: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-gray-900/50 border border-cyan-500/30 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-cyan-300 mb-2">Manual TokenURI Fetch</h3>
        <p className="text-gray-400 text-sm">
          Direct eth_call for tokenURI({DEMO_TOKEN_ID}) - no wrappers, manual encoding/decoding
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800/50 p-3 rounded border font-mono text-xs">
          <div className="text-cyan-300 mb-1">Function Call:</div>
          <div className="text-gray-300">tokenURI(uint256)</div>
          <div className="text-gray-300">Token ID: {DEMO_TOKEN_ID}</div>
          <div className="text-gray-300">Selector: {TOKENURI_SELECTOR}</div>
        </div>

        <button
          onClick={fetchTokenURIManual}
          disabled={isLoading}
          className={`w-full px-4 py-3 rounded font-mono transition-all duration-200 border flex items-center justify-center gap-2 text-sm ${
            isLoading
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed border-gray-500'
              : 'bg-cyan-600 text-white hover:bg-cyan-700 border-cyan-500 hover:border-cyan-400'
          }`}
        >
          {isLoading ? 'Fetching...' : 'Fetch TokenURI Manually'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {tokenURI && (
          <div className="p-3 rounded-lg bg-green-900/50 border border-green-500/50">
            <p className="text-green-300 text-sm font-semibold mb-2">TokenURI Result:</p>
            <div className="bg-black/50 p-2 rounded font-mono text-xs break-all text-gray-300 max-h-32 overflow-y-auto">
              {tokenURI}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Manual ABI encoding/decoding</p>
          <p>• Direct eth_call to blockchain</p>
          <p>• No ethers.Contract wrapper</p>
          <p>• Real-time data from Shape Sepolia</p>
        </div>
      </div>
    </div>
  )
}
