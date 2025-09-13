'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Home, Palette, Image } from 'lucide-react'
import { WalletConnect } from './wallet-connect'
import LiquidGlass from 'liquid-glass-react'

export default function Navigation() {
  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <LiquidGlass
        displacementScale={40}
        blurAmount={0.05}
        saturation={120}
        aberrationIntensity={1.5}
        elasticity={0.2}
        cornerRadius={12}
        className="border-b border-amber-200/30"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 bg-white/60">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 z-10 relative">
              <span className="text-2xl">🧶</span>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                ONCHAIN RUGS
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors z-10 relative"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link
                href="/generator"
                className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors z-10 relative"
              >
                <Palette className="w-4 h-4" />
                Generator
              </Link>
              <Link
                href="/gallery"
                className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors z-10 relative"
              >
                <Image className="w-4 h-4" />
                Gallery
              </Link>
            </div>

            {/* Wallet Connection */}
            <div className="z-10 relative">
              <WalletConnect />
            </div>
          </div>
        </div>
      </LiquidGlass>
    </motion.div>
  )
}
