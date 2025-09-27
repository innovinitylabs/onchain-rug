'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { manualEthCall, decodeContractResult, getContractAddress, getAlchemyRpcUrl } from '@/utils/contract-utils'
import { parseTokenURIData } from '@/utils/parsing-utils'
import { handleContractError, logContractError } from '@/utils/error-utils'

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
    setIsLoading(true)
    setError('')
    setTokenURI('')

    try {
      // Use the new consolidated manual eth_call utility
      const rawResult = await manualEthCall('tokenURI', DEMO_TOKEN_ID, 11011, process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '')

      // Decode the result using new utilities
      const uri = decodeContractResult('tokenURI', rawResult)

      console.log('Manual tokenURI fetch result:', uri)

      setTokenURI(uri)

      // Parse the tokenURI to show structured data
      try {
        const parsedData = parseTokenURIData(uri)
        console.log('Parsed tokenURI data:', {
          name: parsedData.name,
          dirtLevel: parsedData.aging.dirtLevel,
          textureLevel: parsedData.aging.textureLevel,
        })
      } catch (parseError) {
        console.warn('Failed to parse tokenURI data:', parseError)
      }

      // Call optional callback
      if (onResult) {
        onResult(uri)
      }

    } catch (err) {
      const contractError = handleContractError(err, 'ManualTokenURIFetch.fetchTokenURIManual')
      logContractError(contractError, 'ManualTokenURIFetch')
      setError(`Failed to fetch tokenURI: ${contractError.message}`)
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
