import { encodeFunctionData } from 'viem'
import { getRelayQuote } from '@/utils/relay-api'
import { useAccount } from 'wagmi'

type VisualConfig = { warpThickness: number; stripeCount: number }
type ArtData = { paletteName: string; minifiedPalette: string; minifiedStripeData: string; filteredCharacterMap: string }

export function useRelayMint() {
  const { address } = useAccount()

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
        { warpThickness: params.visual.warpThickness, stripeCount: params.visual.stripeCount },
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

    return quote
  }

  return { mintCrossChain }
}


