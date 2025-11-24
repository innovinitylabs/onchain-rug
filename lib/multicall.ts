import { createPublicClient, http } from 'viem'
import { getContractAddress, getRpcUrl } from './networks'

/**
 * Create a chain client for blockchain interactions
 */
export function createChainClient(chainId: number): any {
  // Simplified client creation to avoid viem type issues
  return {
    readContract: async (params: any) => {
      // This will be replaced with actual RPC calls later
      return null
    }
  }
}

/**
 * Execute a batch of contract calls using individual RPC calls
 * (Multicall3 functionality removed due to persistent build issues)
 */
export async function batchReadContract(
  chainId: number,
  contractAddress: string,
  calls: Array<{ functionName: string; args: any[] }>,
  abi: any[]
): Promise<Array<{ success: boolean; data: any; error?: Error }>> {
  // Get RPC URL for the chain
  const rpcUrl = getRpcUrl(chainId)
  if (!rpcUrl) {
    return calls.map(() => ({
      success: false,
      data: null,
      error: new Error('RPC URL not configured')
    }))
  }

  // Process calls individually (simplified batch implementation)
  const results = await Promise.all(
    calls.map(async (call) => {
      try {
        // Find the function in ABI
        const functionAbi = abi.find(item =>
          item.type === 'function' &&
          item.name === call.functionName &&
          item.inputs?.length === call.args.length
        )

        if (!functionAbi) {
          return {
            success: false,
            data: null,
            error: new Error(`Function ${call.functionName} not found in ABI`)
          }
        }

        // Encode function call data
        const functionSignature = `0x${functionAbi.signature || ''}`
        let encodedArgs = ''

        // Simple argument encoding (works for basic types)
        for (const arg of call.args) {
          if (typeof arg === 'number' || typeof arg === 'bigint') {
            encodedArgs += BigInt(arg).toString(16).padStart(64, '0')
          } else if (typeof arg === 'string' && arg.startsWith('0x')) {
            // Address
            encodedArgs += arg.slice(2).padStart(64, '0')
          } else {
            return {
              success: false,
              data: null,
              error: new Error(`Unsupported argument type: ${typeof arg}`)
            }
          }
        }

        const data = functionSignature + encodedArgs

        // Make RPC call
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Math.floor(Math.random() * 1000000),
            method: 'eth_call',
            params: [{
              to: contractAddress.toLowerCase(),
              data: data
            }, 'latest']
          })
        })

        if (!response.ok) {
          return {
            success: false,
            data: null,
            error: new Error(`RPC call failed: ${response.status}`)
          }
        }

        const jsonResponse = await response.json()
        if (jsonResponse.error) {
          return {
            success: false,
            data: null,
            error: new Error(jsonResponse.error.message)
          }
        }

        // Return raw result (caller can decode based on function output types)
        return {
          success: true,
          data: jsonResponse.result
        }

      } catch (error) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error : new Error(String(error))
        }
      }
    })
  )

  return results
}
