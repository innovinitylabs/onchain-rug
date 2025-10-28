import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi'
import { config } from '@/lib/config'
import { onchainRugsABI, contractAddresses, shapeSepolia, shapeMainnet } from '@/lib/web3'

// Marketplace data from external sources
interface Listing {
  tokenId: number
  seller: string
  price: string
  marketplace: string
  listedAt: number
  marketplaceUrl: string
}

export function useMarketplace() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const contractAddress = contractAddresses[chainId]

  // Record a sale (for laundering purposes)
  const recordSale = async (tokenId: number, from: string, to: string, salePrice: string) => {
    if (!writeContract || !address) return

    try {
      const chain = chainId === 360 ? shapeMainnet : shapeSepolia
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: 'tokenId', type: 'uint256' },
              { name: 'from', type: 'address' },
              { name: 'to', type: 'address' },
              { name: 'salePrice', type: 'uint256' }
            ],
            name: 'recordSale',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ] as const,
        functionName: 'recordSale',
        args: [BigInt(tokenId), from as `0x${string}`, to as `0x${string}`, BigInt(salePrice)],
        chain,
        account: address,
      })
    } catch (err) {
      console.error('Failed to record sale:', err)
    }
  }

  // Check if user owns a rug
  const checkOwnership = async (tokenId: number) => {
    if (!address) return false

    try {
      const response = await fetch(`/api/alchemy?endpoint=getOwner&contractAddress=${contractAddress}&tokenId=${tokenId}`)
      const data = await response.json()
      return data.owner?.toLowerCase() === address.toLowerCase()
    } catch (error) {
      console.error('Error checking ownership:', error)
      return false
    }
  }

  // Get marketplace listings (mock data for demo - in real app this would come from marketplace APIs)
  const getMarketplaceListings = (tokenId: number): Listing[] => {
    // Mock marketplace listings - in production this would query OpenSea/LooksRare APIs
    const mockListings: Listing[] = []

    // Randomly generate some mock listings for demo purposes
    if (Math.random() > 0.7) { // 30% chance of being listed
      mockListings.push({
        tokenId,
        seller: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // mock seller
        price: (Math.random() * 0.1 + 0.001).toFixed(4),
        marketplace: Math.random() > 0.5 ? 'OpenSea' : 'LooksRare',
        listedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // within last week
        marketplaceUrl: `https://opensea.io/assets/${contractAddress}/${tokenId}`
      })
    }

    return mockListings
  }

  return {
    recordSale,
    checkOwnership,
    getMarketplaceListings,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Hook for external marketplace integration
export function useExternalMarketplaces(tokenId: number) {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  // Generate marketplace URLs
  const getMarketplaceUrls = () => {
    return {
      opensea: `https://opensea.io/assets/${contractAddress}/${tokenId}`,
      looksrare: `https://looksrare.org/collections/${contractAddress}/${tokenId}`,
      x2y2: `https://x2y2.io/eth/${contractAddress}/${tokenId}`,
    }
  }

  return {
    getMarketplaceUrls,
  }
}
