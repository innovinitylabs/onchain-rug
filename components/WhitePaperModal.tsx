// Minimal, launch-safe Specification modal
'use client'

import { useState, useRef, useCallback } from 'react'
import { X, FileText, Palette, Target, Clock, Gem } from 'lucide-react'

interface SpecificationModalProps {
  isOpen: boolean
  onClose: () => void
}

const sections = [
  { id: 'overview', label: 'Overview', icon: Target },
  { id: 'object', label: 'The Object', icon: Palette },
  { id: 'aging', label: 'Aging & Care', icon: Clock },
  { id: 'economics', label: 'Pricing & Royalties', icon: Gem },
  { id: 'notes', label: 'Irreversibility', icon: FileText }
] as const

type SectionId = typeof sections[number]['id']

export default function SpecificationModal({ isOpen, onClose }: SpecificationModalProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const navRef = useRef<HTMLElement>(null)
  const scrollAnimationRef = useRef<number | undefined>(undefined)

  const handleNavMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!navRef.current) return

    const nav = navRef.current
    const rect = nav.getBoundingClientRect()
    const x = e.clientX - rect.left
    const edgeThreshold = 24

    // Check if content overflows
    if (nav.scrollWidth <= nav.clientWidth) return

    let scrollDirection = 0

    if (x <= edgeThreshold) {
      scrollDirection = -1 // Scroll left
    } else if (x >= rect.width - edgeThreshold) {
      scrollDirection = 1 // Scroll right
    }

    if (scrollDirection !== 0) {
      const scrollStep = () => {
        if (!navRef.current) return

        const currentNav = navRef.current
        const maxScroll = currentNav.scrollWidth - currentNav.clientWidth

        if ((scrollDirection < 0 && currentNav.scrollLeft > 0) ||
            (scrollDirection > 0 && currentNav.scrollLeft < maxScroll)) {
          currentNav.scrollLeft += scrollDirection * 2 // Slow, calm scroll speed
          scrollAnimationRef.current = requestAnimationFrame(scrollStep)
        }
      }

      if (!scrollAnimationRef.current) {
        scrollAnimationRef.current = requestAnimationFrame(scrollStep)
      }
    } else {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current)
        scrollAnimationRef.current = undefined
      }
    }
  }, [])

  const handleNavMouseLeave = useCallback(() => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = undefined
    }
  }, [])

  if (!isOpen) return null

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-medium text-amber-100/90">OnchainRugs</h2>
            <p className="text-amber-200/70 text-base leading-relaxed">
              Fully on-chain generative rugs. Each piece is complete at mint and records time, care, and neglect directly on Ethereum.
            </p>
          </div>
        )
      case 'object':
        return (
          <div className="space-y-4">
            <ul className="text-amber-200/60 space-y-3 text-sm leading-relaxed">
              <li>• Fully on-chain P5JS and logic</li>
              <li>• No IPFS or external storage</li>
              <li>• Front side is user-curated</li>
              <li>• Reverse side is deterministically generated (WIP)</li>
              <li>• Custom text is globally unique and irreversible</li>
            </ul>
          </div>
        )
      case 'aging':
        return (
          <div className="space-y-4">
            <ul className="text-amber-200/60 space-y-3 text-sm leading-relaxed">
              <li>• Aging begins only after the first cleaning</li>
              <li>• Dirt and texture accumulate with time</li>
              <li>• Cleaning and restoration are optional</li>
              <li>• Neglect is a valid visual outcome</li>
            </ul>
          </div>
        )
      case 'economics':
        return (
          <div className="space-y-4">
            <ul className="text-amber-200/60 space-y-3 text-sm leading-relaxed">
              <li>• Mint price = base cost + optional text lines</li>
              <li>• Secondary royalties follow ERC-2981</li>
              <li>• 1% attribution to original minter</li>
              <li>• Creator royalty encoded on-chain</li>
              <li>• Optional attribution via ERC-8021</li>
            </ul>
          </div>
        )
      case 'notes':
        return (
          <div className="space-y-4">
            <p className="text-amber-200/60 text-sm leading-relaxed">
              All state changes are on-chain and irreversible. There are no hidden mechanics, no off-chain upgrades, and no mutable metadata.
            </p>
            <p className="text-amber-200/60 text-sm leading-relaxed">
              The contract is the source of truth.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/90">
      <div className="relative w-full max-w-md mx-auto bg-amber-900/95 rounded-lg shadow-xl border border-amber-700/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-200/60 hover:text-amber-100/80"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="px-8 pt-8 pb-6">
          <h1 className="text-xl font-medium text-amber-100/90 mb-6">Specification</h1>
          <nav
            ref={navRef}
            className="flex flex-nowrap space-x-4 md:space-x-6 mb-8 overflow-x-auto px-2"
            onMouseMove={handleNavMouseMove}
            onMouseLeave={handleNavMouseLeave}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {sections.map((section) => (
              <button
                key={section.id}
                className={`flex items-center flex-shrink-0 whitespace-nowrap text-sm font-medium transition-colors border-b-2 ${
                  activeSection === section.id
                    ? 'text-amber-200 border-amber-600'
                    : 'text-amber-300/50 border-transparent hover:text-amber-200/70'
                }`}
                onClick={() => setActiveSection(section.id)}
                type="button"
              >
                <section.icon className="w-3 h-3 mr-2" />
                {section.label}
              </button>
            ))}
          </nav>
          <div className="min-h-[140px]">{renderSectionContent()}</div>
        </div>
      </div>
    </div>
  )
}