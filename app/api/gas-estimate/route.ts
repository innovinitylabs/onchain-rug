/**
 * Gas Estimation API Route
 * Securely estimates gas for contract functions using server-side Alchemy API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { getContractAddress, getAlchemyRpcUrl } from '@/utils/contract-utils'
import { onchainRugsABI } from '@/lib/web3'

export async function POST(request: NextRequest) {
  try {
    const { functionName, args = [], chainId, value } = await request.json()

    if (!functionName || !chainId) {
      return NextResponse.json(
        { error: 'Missing required parameters: functionName, chainId' },
        { status: 400 }
      )
    }

    // Get server-side API key (not exposed to client)
    const apiKey = process.env.ALCHEMY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Alchemy API key not configured on server' },
        { status: 500 }
      )
    }

    // For functions that require ownership/state checks, return fallback
    // Gas estimation will fail because we can't simulate with proper ownership
    if (functionName === 'cleanRug' || functionName === 'mintRug' || functionName === 'transferFrom') {
        console.log(`Using fallback gas estimation for ${functionName} (requires ownership checks)`)
        const fallbackGasLimit = '8000000' // 8M gas for complex operations
      const fallbackGasPrice = ethers.parseUnits('2', 'gwei').toString()

      return NextResponse.json({
        success: true,
        gasLimit: fallbackGasLimit,
        gasPrice: fallbackGasPrice,
        estimatedCost: (BigInt(fallbackGasLimit) * BigInt(fallbackGasPrice)).toString(),
        readable: `${fallbackGasLimit} gas @ ${ethers.formatUnits(fallbackGasPrice, 'gwei')} gwei = ${ethers.formatEther(BigInt(fallbackGasLimit) * BigInt(fallbackGasPrice))} ETH (fallback)`,
        fallback: true // Indicate this is a fallback estimate
      })
    }

    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      return NextResponse.json(
        { error: `Contract address not found for chain ${chainId}` },
        { status: 400 }
      )
    }

    // Create RPC provider with server-side API key
    const rpcUrl = getAlchemyRpcUrl(chainId, apiKey)
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Create contract instance with ABI that includes the requested function
    const contractABI = [
      {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: functionName,
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
      },
    ]
    const contract = new ethers.Contract(contractAddress, contractABI, provider)

    // Prepare transaction data
    const txData = {
      to: contractAddress,
      data: contract.interface.encodeFunctionData(functionName, args),
      value: value ? ethers.parseEther(value.toString()) : BigInt(0),
    }

    // Estimate gas
    const gasLimit = await provider.estimateGas(txData)

    // Apply 20% buffer for safety
    const bufferedGasLimit = (gasLimit * BigInt(120)) / BigInt(100)

    // Get current gas price
    const feeData = await provider.getFeeData()
    let gasPrice = feeData.gasPrice || feeData.maxFeePerGas || ethers.parseUnits('2', 'gwei')

    // Ensure minimum gas price for testnets
    const minGasPrice = ethers.parseUnits('1', 'gwei')
    if (gasPrice < minGasPrice) {
      gasPrice = minGasPrice
    }

    // Calculate estimated cost
    const estimatedCost = bufferedGasLimit * gasPrice

    return NextResponse.json({
      success: true,
      gasLimit: bufferedGasLimit.toString(),
      gasPrice: gasPrice.toString(),
      estimatedCost: estimatedCost.toString(),
      readable: `${bufferedGasLimit.toString()} gas @ ${ethers.formatUnits(gasPrice, 'gwei')} gwei = ${ethers.formatEther(estimatedCost)} ETH`
    })

  } catch (error) {
    console.error('Gas estimation error:', error)

        // Return fallback values on error
        const fallbackGasLimit = '8000000' // 8M gas for complex operations
    const fallbackGasPrice = ethers.parseUnits('2', 'gwei').toString()

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      gasLimit: fallbackGasLimit,
      gasPrice: fallbackGasPrice,
      estimatedCost: (BigInt(fallbackGasLimit) * BigInt(fallbackGasPrice)).toString(),
      readable: `${fallbackGasLimit} gas @ ${ethers.formatUnits(fallbackGasPrice, 'gwei')} gwei = ${ethers.formatEther(BigInt(fallbackGasLimit) * BigInt(fallbackGasPrice))} ETH`
    })
  }
}
