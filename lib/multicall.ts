import { createPublicClient, http, type Address, type PublicClient } from 'viem'
import { getNetworkByChainId } from './networks'

/**
 * Create a chain client for blockchain interactions
 */
export function createChainClient(chainId: number): PublicClient {
  const network = getNetworkByChainId(chainId)
  if (!network) {
    throw new Error(`Network not found for chain ${chainId}`)
  }

  return createPublicClient({
    chain: {
      id: network.chainId,
      name: network.name,
      nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        default: {
          http: [network.rpcUrl],
        },
      },
    },
    transport: http(network.rpcUrl),
  }) as PublicClient
}

/**
 * Execute a batch of contract calls using multicall3
 * TEMPORARILY DISABLED due to build issues
 */
export async function batchReadContract(
  chainId: number,
  contractAddress: Address,
  calls: Array<{ functionName: string; args: any[] }>,
  abi: any[]
): Promise<Array<{ success: boolean; data: any; error?: Error }>> {
  const client = createChainClient(chainId)
  const results = []

  // Process calls individually to avoid multicall type issues
  for (const call of calls) {
    try {
      const result = await client.readContract({
        address: contractAddress,
        abi,
        functionName: call.functionName as any,
        args: call.args,
        authorizationList: [],
      })

      results.push({
        success: true,
        data: result,
      })
    } catch (error) {
      results.push({
        success: false,
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  return results
}
