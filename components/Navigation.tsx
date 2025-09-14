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
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-blue-200/50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
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
