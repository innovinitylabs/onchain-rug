import { encodeFunctionData } from 'viem'
import { getRelayQuote } from '@/utils/relay-api'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { useState } from 'react'

type VisualConfig = { warpThickness: number; stripeCount: number }
type ArtData = { paletteName: string; minifiedPalette: string; minifiedStripeData: string; filteredCharacterMap: string }

export function useRelayMint() {
  const { address } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()
  const [relayTxHash, setRelayTxHash] = useState<string | null>(null)
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: relayTxHash as `0x${string}` | undefined,
  })

  async function mintCrossChain(params: {
    originChainId: number
    destinationChainId: number
    contractAddress: string
    recipient?: string
    textRows: string[]
    seed: bigint
    visual: VisualConfig
    art: ArtData
    complexity: number
    characterCount: bigint
    valueWei: bigint
  }) {
    const recipient = params.recipient || address
    if (!recipient) throw new Error('Recipient address required')
    const { originChainId, destinationChainId, contractAddress } = params
    if (!contractAddress) throw new Error('Destination contract address not configured')

    const data = encodeFunctionData({
      abi: [
        {
          inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'textRows', type: 'string[]' },
            { name: 'seed', type: 'uint256' },
            {
              components: [
                { name: 'warpThickness', type: 'uint8' },
                { name: 'stripeCount', type: 'uint256' },
              ],
              name: 'visual',
              type: 'tuple',
            },
            {
              components: [
                { name: 'paletteName', type: 'string' },
                { name: 'minifiedPalette', type: 'string' },
                { name: 'minifiedStripeData', type: 'string' },
                { name: 'filteredCharacterMap', type: 'string' },
              ],
              name: 'art',
              type: 'tuple',
            },
            { name: 'complexity', type: 'uint8' },
            { name: 'characterCount', type: 'uint256' },
          ],
          name: 'mintRugFor',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        },
      ] as const,
      functionName: 'mintRugFor',
      args: [
        recipient as `0x${string}`,
        params.textRows,
        params.seed,
        { warpThickness: params.visual.warpThickness, stripeCount: BigInt(params.visual.stripeCount) },
        {
          paletteName: params.art.paletteName,
          minifiedPalette: params.art.minifiedPalette,
          minifiedStripeData: params.art.minifiedStripeData,
          filteredCharacterMap: params.art.filteredCharacterMap,
        },
        params.complexity,
        params.characterCount,
      ],
    })

    const quote = await getRelayQuote({
      user: recipient,
      originChainId,
      destinationChainId,
      originCurrency: '0x0000000000000000000000000000000000000000',
      destinationCurrency: '0x0000000000000000000000000000000000000000',
      amount: params.valueWei.toString(),
      tradeType: 'EXACT_OUTPUT',
      txs: [
        {
          to: contractAddress,
          value: params.valueWei.toString(),
          data,
        },
      ],
      recipient,
    })

    console.log('Relay quote received:', quote)

    // Execute the first step (deposit transaction)
    if (quote.steps && quote.steps.length > 0) {
      const step = quote.steps[0]
      if (step.items && step.items.length > 0) {
        const txData = step.items[0].data
        
        console.log('Executing Relay deposit transaction:', txData)
        
        // Switch to origin chain if needed
        if (txData.chainId !== originChainId) {
          console.warn('Chain mismatch - switching to origin chain:', originChainId)
        }
        
        try {
          await switchChainAsync({ chainId: txData.chainId })
          console.log('Switched to chain:', txData.chainId)
        } catch (switchError) {
          console.error('Failed to switch chain:', switchError)
          throw new Error('Please switch your wallet to ' + (txData.chainId === 11155111 ? 'Ethereum Sepolia' : 'the origin chain') + ' to complete the transaction')
        }
        
        const hash = await sendTransactionAsync({
          to: txData.to as `0x${string}`,
          data: txData.data as `0x${string}`,
          value: BigInt(txData.value),
          gas: BigInt(txData.gas),
          maxFeePerGas: BigInt(txData.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(txData.maxPriorityFeePerGas),
          chainId: txData.chainId,
        })
        
        setRelayTxHash(hash)
        console.log('Relay deposit transaction sent:', hash)
        
        return { quote, hash, requestId: step.requestId }
      }
    }

    return { quote }
  }

  return { mintCrossChain, relayTxHash, isConfirming, isSuccess }
}


