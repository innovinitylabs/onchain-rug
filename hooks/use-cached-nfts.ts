/**
 * Hook for fetching cached NFT data using SWR
 * 
 * WARNING: This is example code - adapt imports and types to your real project.
 */

import useSWR from 'swr'
import { useEffect, useRef, useState } from 'react'

interface CachedNFT {
  tokenId: number
  static?: any
  dynamic?: {
    dirtLevel: number | null
    agingLevel: number | null
    owner: string | null
  }
  tokenURI?: string
  hash?: string
  cached?: boolean
}

interface CollectionResponse {
  page: number
  totalPages: number
  totalSupply: number
  itemsPerPage: number
  nfts: CachedNFT[]
  hasMore: boolean
}

const fetcher = async (url: string): Promise<CollectionResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch collection')
  }
  return res.json()
}

export function useCachedCollection(chainId: number, page: number = 1) {
  const { data, error, isLoading, mutate } = useSWR<CollectionResponse>(
    `/api/collection?chainId=${chainId}&page=${page}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
    }
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}

const metadataFetcher = async (url: string): Promise<any> => {
  const res = await fetch(url)
  if (res.status === 202) {
    // Loading state - return the response
    return res.json()
  }
  if (!res.ok) {
    throw new Error('Failed to fetch metadata')
  }
  return res.json()
}

export function useCachedNFTMetadata(chainId: number, tokenId: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    tokenId ? `/api/metadata/${tokenId}?chainId=${chainId}` : null,
    metadataFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
    }
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}

/**
 * Hook for lazy loading NFTs using IntersectionObserver
 */
export function useLazyNFTs(
  nfts: CachedNFT[],
  options?: {
    rootMargin?: string
    threshold?: number
  }
) {
  const [visibleNFTs, setVisibleNFTs] = useState<Set<number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tokenId = parseInt(entry.target.getAttribute('data-token-id') || '0')
            setVisibleNFTs((prev) => new Set([...prev, tokenId]))
          }
        })
      },
      {
        rootMargin: options?.rootMargin || '100px',
        threshold: options?.threshold || 0.1,
      }
    )

    // Observe all NFT elements
    const elements = document.querySelectorAll('[data-token-id]')
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [nfts.length, options?.rootMargin, options?.threshold])

  return visibleNFTs
}

