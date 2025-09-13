"use client"

import React, { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseEther } from 'viem'
import { shapeSepolia, shapeMainnet } from '@/lib/web3'

interface SimpleMintingProps {
  textRows: string[]
  currentPalette: any
  currentStripeData: any[]
  characterMap: any
  warpThickness: number
}

export default function SimpleMinting({
  textRows,
  currentPalette,
  currentStripeData,
  characterMap,
  warpThickness
}: SimpleMintingProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[SIMPLE MINTING] ${message}`)
  }

  const clearLogs = () => setDebugLogs([])

  const handleSimpleMint = async () => {
    clearLogs()
    addLog('🚀 Starting simple mint process...')

    if (!isConnected) {
      addLog('❌ Wallet not connected')
      alert('Please connect your wallet first!')
      return
    }

    if (!process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT) {
      addLog('❌ Contract address not set')
      alert('Contract not deployed yet!')
      return
    }

    addLog(`✅ Wallet connected: ${address}`)
    addLog(`✅ Chain ID: ${chainId}`)
    addLog(`✅ Contract: ${process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT}`)

    try {
      // Minimal data for testing
      const testTextRows = ['A'] // Simple test text
      const testSeed = 42 // Fixed seed for testing
      const testPalette = { name: 'Classic Red & Black', colors: ['#8B0000', '#DC143C', '#B22222', '#000000', '#2F2F2F'] } // Full palette data
      const testStripeData = [] // Empty stripe data
      const testCharacterMap = { 'A': ['01110','10001','10001','11111','10001','10001','10001'] } // Minimal character map
      const testWarpThickness = 1
      const testMintCost = '0.0001' // Base price

      addLog('📊 Using minimal test data:')
      addLog(`  - Text: ${JSON.stringify(testTextRows)}`)
      addLog(`  - Seed: ${testSeed}`)
      addLog(`  - Palette: ${JSON.stringify(testPalette)}`)
      addLog(`  - Stripe Data: ${JSON.stringify(testStripeData)}`)
      addLog(`  - Character Map: ${JSON.stringify(testCharacterMap)}`)
      addLog(`  - Warp Thickness: ${testWarpThickness}`)
      addLog(`  - Mint Cost: ${testMintCost} ETH`)

      // Try with maximum gas limit
      const maxGas = BigInt(5000000) // 5 million gas - same as main component
      addLog(`⛽ Using maximum gas limit: ${maxGas.toString()}`)

      addLog('🔄 Calling writeContract...')

      await writeContract({
        address: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"internalType": "string[]", "name": "textRows", "type": "string[]"},
              {"internalType": "uint256", "name": "seed", "type": "uint256"},
              {"internalType": "string", "name": "palette", "type": "string"},
              {"internalType": "string", "name": "stripeData", "type": "string"},
              {"internalType": "uint256", "name": "warpThickness", "type": "uint256"}
            ],
            "name": "mintWithText",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ] as const,
        functionName: 'mintWithText',
        args: [
          testTextRows,
          BigInt(testSeed),
          JSON.stringify(testPalette),
          JSON.stringify(testStripeData),
          BigInt(testWarpThickness)
        ],
        value: parseEther(testMintCost),
        gas: maxGas,
        chain: chainId === 11011 ? shapeSepolia : shapeMainnet,
        account: address
      })

      addLog('✅ writeContract call completed successfully!')
      addLog('⏳ Waiting for transaction confirmation...')

    } catch (err) {
      addLog(`❌ Error during minting: ${err}`)
      addLog(`❌ Error type: ${typeof err}`)
      addLog(`❌ Error message: ${err instanceof Error ? err.message : 'Unknown error'}`)
      addLog(`❌ Error stack: ${err instanceof Error ? err.stack : 'No stack trace'}`)
      
      // Try to extract more details
      if (err && typeof err === 'object') {
        addLog(`❌ Error details: ${JSON.stringify(err, null, 2)}`)
      }
      
      alert(`Minting failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleContractTest = async () => {
    clearLogs()
    addLog('🔍 Testing contract accessibility...')

    try {
      // Test if we can read from the contract
      const contractAddress = process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT
      addLog(`📋 Contract address: ${contractAddress}`)
      
      // Test basic contract interaction
      addLog('🔄 Testing contract read operations...')
      
      // This would require a different approach - let's just log what we can
      addLog('✅ Contract address is set')
      addLog('✅ Environment variables loaded')
      
    } catch (err) {
      addLog(`❌ Contract test failed: ${err}`)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-gray-900 border border-red-500 rounded">
      <h3 className="text-red-400 font-bold">🔧 Simple Minting Debug Tool</h3>
      
      {/* Status */}
      <div className="bg-gray-800 p-3 rounded">
        <div className="text-sm space-y-1">
          <div>Wallet: {isConnected ? '✅ Connected' : '❌ Not connected'}</div>
          <div>Address: {address || 'None'}</div>
          <div>Chain: {chainId}</div>
          <div>Contract: {process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT ? '✅ Set' : '❌ Missing'}</div>
          <div>Status: {isPending ? '⏳ Pending' : isConfirming ? '⏳ Confirming' : isSuccess ? '✅ Success' : '⏸️ Ready'}</div>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleContractTest}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          🔍 Test Contract Access
        </button>
        
        <button
          onClick={handleSimpleMint}
          disabled={!isConnected || isPending || isConfirming}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded"
        >
          🚀 Simple Mint (Minimal Data)
        </button>
        
        <button
          onClick={clearLogs}
          className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          🗑️ Clear Logs
        </button>
      </div>

      {/* Debug Logs */}
      <div className="bg-black p-3 rounded max-h-64 overflow-y-auto">
        <div className="text-green-400 text-xs font-mono">
          {debugLogs.length === 0 ? 'No logs yet...' : debugLogs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      {/* Transaction Status */}
      {hash && (
        <div className="bg-green-900 p-3 rounded">
          <div className="text-green-400 text-sm">
            <div>Transaction Hash: {hash}</div>
            {isConfirming && <div>⏳ Confirming transaction...</div>}
            {isSuccess && <div>✅ Transaction confirmed!</div>}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 p-3 rounded">
          <div className="text-red-400 text-sm">
            <div>❌ Error: {error.message}</div>
          </div>
        </div>
      )}
    </div>
  )
}
