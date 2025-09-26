import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { useState, useEffect, useMemo } from 'react'
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

  // Read rug aging data from contract using tokenURI (contains real-time aging state)
  const { data: tokenURI, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'tokenURI',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  })

  // Parse aging data from tokenURI
  const agingData = useMemo(() => {
    if (!tokenURI) return null

    try {
      const metadata = JSON.parse(
        tokenURI.replace('data:application/json,', '')
      )

      const attributes = metadata.attributes || []
      const getAttributeValue = (traitType: string) => {
        const attr = attributes.find((a: any) => a.trait_type === traitType)
        return attr ? attr.value : 0
      }

      return {
        dirtLevel: parseInt(getAttributeValue('Dirt Level')) || 0,
        textureLevel: parseInt(getAttributeValue('Texture Level')) || 0,
        showDirt: (parseInt(getAttributeValue('Dirt Level')) || 0) > 0,
        showTexture: (parseInt(getAttributeValue('Texture Level')) || 0) > 0,
        timeSinceCleaned: BigInt(0), // Not directly available in attributes
        timeSinceMint: BigInt(0), // Not directly available in attributes
      }
    } catch (error) {
      console.warn('Failed to parse tokenURI for aging data:', error)
      return null
    }
  }, [tokenURI])

  // Calculate aging based on tokenURI data
  useEffect(() => {
    if (agingData && tokenId) {
      // Use the dirt and texture levels from tokenURI attributes
      setDirtLevel(agingData.dirtLevel)
      setTextureLevel(agingData.textureLevel)

      // For last cleaned time, we don't have this in tokenURI attributes
      // Could be added to tokenURI generation if needed
      setLastCleaned(null)
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

    // Calculate cleaning cost based on age (free for first 30 minutes)
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
