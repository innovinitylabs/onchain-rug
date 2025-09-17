'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Home, Palette, Image, Sparkles } from 'lucide-react'
import { WalletConnect } from './wallet-connect'

export default function Navigation() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
      }}
    >
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 80"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Liquid Glass Material for Navigation */}
            <filter id="nav-glass-depth" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
              <feTurbulence baseFrequency="0.008" numOctaves="4" seed="123" type="fractalNoise" result="NAV_BASE" />
              <feDisplacementMap in="SourceGraphic" in2="NAV_BASE" scale="111" xChannelSelector="R" yChannelSelector="G" result="NAV_DISPLACED" />
              <feColorMatrix in="NAV_DISPLACED" type="matrix" values="1.42 8 0 0 0 0 1.42 8 0 0 0 0 1.42 0 0 0 0 0 1 0" result="NAV_COLORS" />
              <feGaussianBlur in="NAV_COLORS" stdDeviation="1.8" result="NAV_BLUR" />
            </filter>

            <filter id="nav-glass-surface" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
              <feTurbulence baseFrequency="0.025" numOctaves="3" seed="456" type="fractalNoise" result="NAV_SURFACE" />
              <feDisplacementMap in="SourceGraphic" in2="NAV_SURFACE" scale="111" xChannelSelector="R" yChannelSelector="G" result="NAV_SURFACE_DISPLACED" />
              <feGaussianBlur in="NAV_SURFACE_DISPLACED" stdDeviation="1.2" result="NAV_SURFACE_BLUR" />
            </filter>

            <linearGradient id="nav-glass-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.15)', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: 'rgba(255, 255, 255, 0.08)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.12)', stopOpacity: 1 }} />
            </linearGradient>

            <linearGradient id="nav-glass-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.2)', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: 'rgba(255, 255, 255, 0.1)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.18)', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Liquid Glass Layers */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#nav-glass-fill)"
            filter="url(#nav-glass-depth)"
            opacity="0.8"
          />
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#nav-glass-highlight)"
            filter="url(#nav-glass-surface)"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Navigation Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🧶</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ONCHAIN RUGS
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              href="/generator"
              className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors"
            >
              <Palette className="w-4 h-4" />
              Generator
            </Link>
            <Link
              href="/gallery"
              className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors"
            >
              <Image className="w-4 h-4" />
              Gallery
            </Link>
          </div>

          {/* Wallet Connection */}
          <WalletConnect />
        </div>
      </div>
    </motion.nav>
  )
}
