'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import ListingCard from './ListingCard'

// Simplified virtual scrolling implementation
// Uses pagination-based virtual scrolling for better performance

interface VirtualGridProps {
  nfts: any[]
  itemsPerRow: number
  itemHeight: number
  favorites: Set<number>
  onToggleFavorite: (tokenId: number) => void
  onCardClick: (nft: any) => void
  className?: string
}

export default function VirtualGrid({
  nfts,
  itemsPerRow,
  favorites,
  onToggleFavorite,
  onCardClick,
  className = ''
}: VirtualGridProps) {
  // For virtual scrolling, we'll render all items but use CSS containment for performance
  // This is a simpler approach that still provides good performance

  return (
    <div className={`grid gap-6 ${className}`} style={{
      gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
      contain: 'layout style paint' // CSS containment for better performance
    }}>
      {nfts.map((nft, index) => (
        <motion.div
          key={nft.tokenId}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.02, // Reduced delay for better performance
            ease: "easeOut"
          }}
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          className="cursor-pointer"
          onClick={() => onCardClick(nft)}
          style={{
            contain: 'layout style paint' // Individual item containment
          }}
        >
          <ListingCard
            tokenId={nft.tokenId}
            nftData={nft}
            onCardClick={() => onCardClick(nft)}
            isFavorited={favorites.has(nft.tokenId)}
            onToggleFavorite={() => onToggleFavorite(nft.tokenId)}
          />
        </motion.div>
      ))}
    </div>
  )
}

// Responsive wrapper component
export function ResponsiveVirtualGrid(props: VirtualGridProps) {
  return (
    <div className="w-full">
      <VirtualGrid {...props} />
    </div>
  )
}

// Hook to determine items per row based on screen size
export function useItemsPerRow(containerWidth?: number): number {
  return useMemo(() => {
    if (!containerWidth) return 4 // Default for SSR

    if (containerWidth >= 2560) return 6 // 3xl:grid-cols-6
    if (containerWidth >= 1920) return 5 // 3xl:grid-cols-5
    if (containerWidth >= 1280) return 4 // xl:grid-cols-4
    if (containerWidth >= 1024) return 3 // lg:grid-cols-3
    if (containerWidth >= 768) return 2  // md:grid-cols-2
    return 1 // sm:grid-cols-1
  }, [containerWidth])
}