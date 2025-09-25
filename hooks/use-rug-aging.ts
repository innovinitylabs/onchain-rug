import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { useState, useEffect } from 'react'
import { config, agingConfig } from '@/lib/config'
import { shapeSepolia, shapeMainnet, contractAddresses } from '@/lib/web3'

// Rug aging hook for managing dirt and texture states
export function useRugAging(tokenId?: bigint) {
  const { address } = useAccount()
  const chainId = useChainId()
  const [dirtLevel, setDirtLevel] = useState(0)
  const [textureLevel, setTextureLevel] = useState(0)
  const [lastCleaned, setLastCleaned] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  // Read rug aging data from contract using getAgingState
  const { data: agingData, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'getAgingState',
        outputs: [
          { name: 'dirtLevel', type: 'uint8' },
          { name: 'textureLevel', type: 'uint8' },
          { name: 'showDirt', type: 'bool' },
          { name: 'showTexture', type: 'bool' },
          { name: 'timeSinceCleaned', type: 'uint256' },
          { name: 'timeSinceMint', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'getAgingState',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  })

  // Calculate aging based on time
  useEffect(() => {
    if (agingData && tokenId) {
      const [contractDirtLevel, contractTextureLevel, showDirt, showTexture, timeSinceCleaned, timeSinceMint] = agingData as readonly [number, number, boolean, boolean, bigint, bigint]

      // Use the dirt and texture levels directly from the contract
      setDirtLevel(contractDirtLevel)
      setTextureLevel(contractTextureLevel)

      // Calculate last cleaned time from time since cleaned
      const now = Math.floor(Date.now() / 1000)
      const lastCleanedTime = timeSinceCleaned > 0 ? now - Number(timeSinceCleaned) : now - Number(timeSinceMint)
      setLastCleaned(lastCleanedTime > 0 ? new Date(lastCleanedTime * 1000) : null)
    }
  }, [agingData, tokenId])

  return {
    dirtLevel,
    textureLevel,
    lastCleaned,
    isLoading,
    refetch,
  }
}

// Hook for cleaning rug transactions
export function useCleanRug() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs

  const cleanRug = async (tokenId: bigint, dirtLevel: number, mintTime?: bigint) => {
    if (!writeContract) return

    // Calculate cleaning cost based on age (free for first 30 days)
    const now = Math.floor(Date.now() / 1000)
    const timeSinceMint = mintTime ? now - Number(mintTime) : 0
    const cleaningCost = timeSinceMint < agingConfig.textureAging.intense
      ? agingConfig.cleaningCosts.free
      : agingConfig.cleaningCosts.paid

    try {
      const chain = chainId === 360 ? shapeMainnet : shapeSepolia
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            inputs: [{ name: 'tokenId', type: 'uint256' }],
            name: 'cleanRug',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
          },
        ] as const,
        functionName: 'cleanRug',
        args: [tokenId],
        value: BigInt(cleaningCost),
        chain,
        account: address,
      })
    } catch (err) {
      console.error('Failed to clean rug:', err)
    }
  }

  return {
    cleanRug,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
