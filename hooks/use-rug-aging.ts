import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { useState, useEffect } from 'react'
import { config, agingConfig } from '@/lib/config'
import { shapeSepolia, shapeMainnet } from '@/lib/web3'

// Rug aging hook for managing dirt and texture states
export function useRugAging(tokenId?: bigint) {
  const { address } = useAccount()
  const [dirtLevel, setDirtLevel] = useState(0)
  const [textureLevel, setTextureLevel] = useState(0)
  const [lastCleaned, setLastCleaned] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Read rug aging data from contract
  const { data: agingData, refetch } = useReadContract({
    address: config.rugContractAddress as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'getRugAgingData',
        outputs: [
          { name: 'dirtLevel', type: 'uint8' },
          { name: 'textureLevel', type: 'uint8' },
          { name: 'lastCleaned', type: 'uint256' },
          { name: 'mintTime', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'getRugAgingData',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  })

  // Calculate aging based on time
  useEffect(() => {
    if (agingData && tokenId) {
      const [contractDirtLevel, contractTextureLevel, lastCleanedTimestamp, mintTime] = agingData as readonly [number, number, bigint, bigint]
      
      const now = Math.floor(Date.now() / 1000)
      const timeSinceMint = now - Number(mintTime)
      const timeSinceCleaned = lastCleanedTimestamp > 0 ? now - Number(lastCleanedTimestamp) : timeSinceMint

      // Calculate dirt level based on time since last cleaned
      let calculatedDirtLevel = 0
      if (timeSinceCleaned > agingConfig.dirtAccumulation.heavy) {
        calculatedDirtLevel = 2 // Heavy dirt
      } else if (timeSinceCleaned > agingConfig.dirtAccumulation.light) {
        calculatedDirtLevel = 1 // Light dirt
      }

      // Calculate texture level based on time since mint
      let calculatedTextureLevel = 0
      if (timeSinceMint > agingConfig.textureAging.intense) {
        calculatedTextureLevel = 2 // Intense texture
      } else if (timeSinceMint > agingConfig.textureAging.moderate) {
        calculatedTextureLevel = 1 // Moderate texture
      }

      setDirtLevel(calculatedDirtLevel)
      setTextureLevel(calculatedTextureLevel)
      setLastCleaned(lastCleanedTimestamp > 0 ? new Date(Number(lastCleanedTimestamp) * 1000) : null)
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
        address: config.cleaningContractAddress as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: 'tokenId', type: 'uint256' },
              { name: 'dirtLevel', type: 'uint8' }
            ],
            name: 'cleanRug',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
          },
        ] as const,
        functionName: 'cleanRug',
        args: [tokenId, dirtLevel],
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

// Hook for updating aging thresholds (owner only)
export function useUpdateAgingThresholds() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const updateAgingThresholds = async (dirtLevel1Days: number, dirtLevel2Days: number, textureIncrementDays: number) => {
    if (!writeContract) return

    try {
      const chain = chainId === 360 ? shapeMainnet : shapeSepolia
      await writeContract({
        address: config.rugContractAddress as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: 'd1', type: 'uint256' },
              { name: 'd2', type: 'uint256' },
              { name: 't', type: 'uint256' }
            ],
            name: 'updateAgingThresholds',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ] as const,
        functionName: 'updateAgingThresholds',
        args: [BigInt(dirtLevel1Days), BigInt(dirtLevel2Days), BigInt(textureIncrementDays)],
        chain,
        account: address,
      })
    } catch (err) {
      console.error('Failed to update aging thresholds:', err)
    }
  }

  return {
    updateAgingThresholds,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
