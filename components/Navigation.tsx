'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Home, Palette, Image, Sparkles, Menu, X, ImageIcon, User, ShoppingCart, Briefcase, ChevronDown, Settings } from 'lucide-react'
import { useAccount } from 'wagmi'
import { WalletConnect } from './wallet-connect'
import LiquidGlass from './LiquidGlass'

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isManageDropdownOpen, setIsManageDropdownOpen] = useState(false)
  const { isConnected } = useAccount()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleManageDropdown = () => {
    setIsManageDropdownOpen(!isManageDropdownOpen)
  }

  return (
    <>
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
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
            <svg
              height="44px"
              viewBox="0 0 200 40"
              style={{
                display: 'block',
                height: '44px',
                filter: 'drop-shadow(0 0 8px rgba(108, 190, 230, 0.4)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.2))',
                overflow: 'visible'
              }}
              aria-label="ONCHAIN RUGS"
              preserveAspectRatio="xMidYMid meet"
              className="h-11 sm:h-14"
            >
              <defs>
                {/* Navbar Liquid Glass Material - Scaled Down */}
                <filter id="nav-logo-glass-depth" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
                  <feTurbulence
                    baseFrequency="0.008"
                    numOctaves="4"
                    seed="42"
                    type="fractalNoise"
                    result="NAV_LOGO_BASE"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="NAV_LOGO_BASE"
                    scale="8"
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="NAV_LOGO_DISPLACED"
                  />
                  <feColorMatrix
                    in="NAV_LOGO_DISPLACED"
                    type="matrix"
                    values="1.2 0.08 0 0 0
                           0 1.15 0.03 0 0
                           0 0 1.1 0 0
                           0 0 0 1 0"
                    result="NAV_LOGO_COLORS"
                  />
                  <feGaussianBlur
                    in="NAV_LOGO_COLORS"
                    stdDeviation="1"
                    result="NAV_LOGO_BLUR"
                  />
                </filter>

                <filter id="nav-logo-glass-surface" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
                  <feTurbulence
                    baseFrequency="0.025"
                    numOctaves="3"
                    seed="123"
                    type="fractalNoise"
                    result="NAV_LOGO_SURFACE"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="NAV_LOGO_SURFACE"
                    scale="6"
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="NAV_LOGO_SURFACE_DISPLACED"
                  />
                  <feGaussianBlur
                    in="NAV_LOGO_SURFACE_DISPLACED"
                    stdDeviation="0.8"
                    result="NAV_LOGO_SURFACE_BLUR"
                  />
                </filter>

                <linearGradient id="nav-logo-glass-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.95)', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.95)', stopOpacity: 1 }} />
                </linearGradient>

                <linearGradient id="nav-logo-glass-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.8)', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: 'rgba(255, 255, 255, 0.6)', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.7)', stopOpacity: 1 }} />
                </linearGradient>

                <linearGradient id="nav-logo-glass-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(0, 0, 0, 0.3)', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: 'rgba(0, 0, 0, 0.15)', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'rgba(0, 0, 0, 0.25)', stopOpacity: 1 }} />
                </linearGradient>
              </defs>

              {/* Navbar Liquid Glass Shadow Layer */}
              <text
                x="50%"
                y="26"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: 'url(#nav-logo-glass-shadow)',
                  filter: 'url(#nav-logo-glass-depth)',
                  fontSize: '18px',
                  fontWeight: '700',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  opacity: 0.6,
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'optimizeLegibility',
                }}
              >
                ONCHAIN RUGS
              </text>

              {/* Navbar Liquid Glass Main Fill */}
              <text
                x="50%"
                y="24"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: 'url(#nav-logo-glass-fill)',
                  filter: 'url(#nav-logo-glass-depth)',
                  fontSize: '18px',
                  fontWeight: '700',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'optimizeLegibility',
                  fontFeatureSettings: '"kern" 1, "liga" 1',
                  fontVariantLigatures: 'common-ligatures',
                }}
              >
                ONCHAIN RUGS
              </text>

              {/* Navbar Liquid Glass Surface Highlight */}
              <text
                x="50%"
                y="22"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: 'url(#nav-logo-glass-highlight)',
                  filter: 'url(#nav-logo-glass-surface)',
                  fontSize: '18px',
                  fontWeight: '700',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  mixBlendMode: 'screen',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'optimizeLegibility',
                }}
              >
                ONCHAIN RUGS
              </text>

              {/* Navbar Liquid Glass Rim Light */}
              <text
                x="50%"
                y="24"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: 'none',
                  stroke: 'rgba(255, 255, 255, 0.6)',
                  strokeWidth: '0.2',
                  filter: 'url(#nav-logo-glass-surface)',
                  fontSize: '18px',
                  fontWeight: '700',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  mixBlendMode: 'overlay',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'optimizeLegibility',
                }}
              >
              ONCHAIN RUGS
              </text>
            </svg>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              <svg
                height="28px"
                viewBox="0 0 60 20"
                style={{
                  display: 'block',
                  height: '28px',
                  filter: 'drop-shadow(0 0 6px rgba(108, 190, 230, 0.3))',
                }}
              >
                <defs>
                  <filter id="nav-link-depth" x="-100%" y="-100%" width="300%" height="300%">
                    <feTurbulence baseFrequency="0.02" numOctaves="2" seed="42" type="fractalNoise" result="LINK_BASE" />
                    <feDisplacementMap in="SourceGraphic" in2="LINK_BASE" scale="3" xChannelSelector="R" yChannelSelector="G" result="LINK_DISPLACED" />
                    <feGaussianBlur in="LINK_DISPLACED" stdDeviation="0.5" result="LINK_BLUR" />
                  </filter>
                  <linearGradient id="nav-link-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <text
                  x="50%"
                  y="12"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fill: 'url(#nav-link-gradient)',
                    filter: 'url(#nav-link-depth)',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                    fontFeatureSettings: '"kern" 1',
                  }}
                >
                  Home
                </text>
              </svg>
            </Link>
            <Link
              href="/generator"
              className="flex items-center gap-2 hover:opacity-90 transition-all duration-300"
            >
              <Palette className="w-5 h-5" />
              <svg
                height="28px"
                viewBox="0 0 100 20"
                style={{
                  display: 'block',
                  height: '28px',
                  filter: 'drop-shadow(0 0 6px rgba(108, 190, 230, 0.3))',
                }}
              >
                <defs>
                  <filter id="nav-link-depth-gen" x="-100%" y="-100%" width="300%" height="300%">
                    <feTurbulence baseFrequency="0.02" numOctaves="2" seed="43" type="fractalNoise" result="LINK_BASE_GEN" />
                    <feDisplacementMap in="SourceGraphic" in2="LINK_BASE_GEN" scale="3" xChannelSelector="R" yChannelSelector="G" result="LINK_DISPLACED_GEN" />
                    <feGaussianBlur in="LINK_DISPLACED_GEN" stdDeviation="0.5" result="LINK_BLUR_GEN" />
                  </filter>
                  <linearGradient id="nav-link-gradient-gen" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <text
                  x="50%"
                  y="12"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fill: 'url(#nav-link-gradient-gen)',
                    filter: 'url(#nav-link-depth-gen)',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
              Rug Factory
                </text>
              </svg>
            </Link>
            <Link
              href="/gallery"
              className="flex items-center gap-2 hover:opacity-90 transition-all duration-300"
            >
              <ImageIcon className="w-5 h-5" />
              <svg
                height="28px"
                viewBox="0 0 70 20"
                style={{
                  display: 'block',
                  height: '28px',
                  filter: 'drop-shadow(0 0 6px rgba(108, 190, 230, 0.3))',
                }}
              >
                <defs>
                  <filter id="nav-link-depth-gallery" x="-100%" y="-100%" width="300%" height="300%">
                    <feTurbulence baseFrequency="0.02" numOctaves="2" seed="44" type="fractalNoise" result="LINK_BASE_GALLERY" />
                    <feDisplacementMap in="SourceGraphic" in2="LINK_BASE_GALLERY" scale="3" xChannelSelector="R" yChannelSelector="G" result="LINK_DISPLACED_GALLERY" />
                    <feGaussianBlur in="LINK_DISPLACED_GALLERY" stdDeviation="0.5" result="LINK_BLUR_GALLERY" />
                  </filter>
                  <linearGradient id="nav-link-gradient-gallery" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <text
                  x="50%"
                  y="12"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fill: 'url(#nav-link-gradient-gallery)',
                    filter: 'url(#nav-link-depth-gallery)',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
              Gallery
                </text>
              </svg>
            </Link>
            <Link
              href="/market"
              className="flex items-center gap-2 hover:opacity-90 transition-all duration-300"
            >
              <ShoppingCart className="w-5 h-5" />
              <svg
                height="28px"
                viewBox="0 0 70 20"
                style={{
                  display: 'block',
                  height: '28px',
                  filter: 'drop-shadow(0 0 6px rgba(108, 190, 230, 0.3))',
                }}
              >
                <defs>
                  <filter id="nav-link-depth-market" x="-100%" y="-100%" width="300%" height="300%">
                    <feTurbulence baseFrequency="0.02" numOctaves="2" seed="45" type="fractalNoise" result="LINK_BASE_MARKET" />
                    <feDisplacementMap in="SourceGraphic" in2="LINK_BASE_MARKET" scale="3" xChannelSelector="R" yChannelSelector="G" result="LINK_DISPLACED_MARKET" />
                    <feGaussianBlur in="LINK_DISPLACED_MARKET" stdDeviation="0.5" result="LINK_BLUR_MARKET" />
                  </filter>
                  <linearGradient id="nav-link-gradient-market" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <text
                  x="50%"
                  y="12"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fill: 'url(#nav-link-gradient-market)',
                    filter: 'url(#nav-link-depth-market)',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                    fontFeatureSettings: '"kern" 1',
                  }}
                >
                  Market
                </text>
              </svg>
            </Link>

            {/* NFT Display Demo */}
            <Link
              href="/nft-display-demo"
              className="flex items-center gap-2 hover:opacity-90 transition-all duration-300"
            >
              <svg
                height="28px"
                viewBox="0 0 85 20"
                style={{
                  display: 'block',
                  height: '28px',
                  filter: 'drop-shadow(0 0 6px rgba(108, 190, 230, 0.3))',
                }}
              >
                <defs>
                  <filter id="nav-link-depth-demo" x="-100%" y="-100%" width="300%" height="300%">
                    <feTurbulence baseFrequency="0.02" numOctaves="2" seed="47" type="fractalNoise" result="LINK_BASE_DEMO" />
                    <feDisplacementMap in="SourceGraphic" in2="LINK_BASE_DEMO" scale="3" xChannelSelector="R" yChannelSelector="G" result="LINK_DISPLACED_DEMO" />
                    <feGaussianBlur in="LINK_DISPLACED_DEMO" stdDeviation="0.5" result="LINK_BLUR_DEMO" />
                  </filter>
                  <linearGradient id="nav-link-gradient-demo" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <text
                  x="0"
                  y="16"
                  style={{
                    fill: 'url(#nav-link-gradient-demo)',
                    filter: 'url(#nav-link-depth-demo)',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                    fontFeatureSettings: '"kern" 1',
                  }}
                >
                  NFT Demo
                </text>
              </svg>
            </Link>
            
            {/* Manage Dropdown - Only visible when wallet connected */}
            {isConnected && (
              <div className="relative">
                <button
                  onClick={toggleManageDropdown}
                  className="flex items-center gap-2 hover:opacity-90 transition-all duration-300"
                >
                  <Settings className="w-5 h-5" />
                  <svg
                    height="28px"
                    viewBox="0 0 85 20"
                    style={{
                      display: 'block',
                      height: '28px',
                      filter: 'drop-shadow(0 0 6px rgba(108, 190, 230, 0.3))',
                    }}
                  >
                    <defs>
                      <filter id="nav-link-depth-manage" x="-100%" y="-100%" width="300%" height="300%">
                        <feTurbulence baseFrequency="0.02" numOctaves="2" seed="46" type="fractalNoise" result="LINK_BASE_MANAGE" />
                        <feDisplacementMap in="SourceGraphic" in2="LINK_BASE_MANAGE" scale="3" xChannelSelector="R" yChannelSelector="G" result="LINK_DISPLACED_MANAGE" />
                        <feGaussianBlur in="LINK_DISPLACED_MANAGE" stdDeviation="0.5" result="LINK_BLUR_MANAGE" />
                      </filter>
                      <linearGradient id="nav-link-gradient-manage" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    <text
                      x="50%"
                      y="12"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fill: 'url(#nav-link-gradient-manage)',
                        filter: 'url(#nav-link-depth-manage)',
                        fontSize: '14px',
                        fontWeight: '600',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'optimizeLegibility',
                        fontFeatureSettings: '"kern" 1',
                      }}
                    >
                      Manage
                    </text>
                  </svg>
                  <ChevronDown className={`w-4 h-4 -ml-2 transition-transform ${isManageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isManageDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 right-0 min-w-[200px]"
                      onMouseLeave={() => setIsManageDropdownOpen(false)}
                    >
                      <LiquidGlass
                        blurAmount={0.15}
                        aberrationIntensity={2}
                        elasticity={0.08}
                        cornerRadius={12}
                      >
                        <div className="py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-lg">
                          <Link
                            href="/portfolio"
                            onClick={() => setIsManageDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/20 transition-colors rounded-lg mx-2"
                          >
                            <Briefcase className="w-5 h-5" />
                            <span className="font-semibold text-sm">Portfolio</span>
                          </Link>
                          <Link
                            href="/dashboard"
                            onClick={() => setIsManageDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/20 transition-colors rounded-lg mx-2"
                          >
                            <User className="w-5 h-5" />
                            <span className="font-semibold text-sm">Dashboard</span>
            </Link>
                        </div>
                      </LiquidGlass>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </motion.div>
            </button>
          </div>

          {/* Wallet Connection - Desktop */}
          <div className="hidden md:block">
            <WalletConnect />
          </div>
        </div>
      </div>
    </motion.nav>

    {/* Mobile Menu Overlay */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 md:hidden"
          onClick={closeMobileMenu}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-sm max-h-[80vh] overflow-hidden">
              <LiquidGlass
                blurAmount={0.11}
                aberrationIntensity={3}
                elasticity={0.1}
                cornerRadius={16}
                className="h-full w-full"
              >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Menu</h3>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col py-6">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center gap-4 px-6 py-4 text-white hover:bg-white/10 transition-colors duration-200"
              >
                <Home className="w-6 h-6" />
                <span className="text-lg font-medium">Home</span>
              </Link>

              <Link
                href="/generator"
                onClick={closeMobileMenu}
                className="flex items-center gap-4 px-6 py-4 text-white hover:bg-white/10 transition-colors duration-200"
              >
                <Palette className="w-6 h-6" />
                <span className="text-lg font-medium">Rug Factory</span>
              </Link>

              <Link
                href="/gallery"
                onClick={closeMobileMenu}
                className="flex items-center gap-4 px-6 py-4 text-white hover:bg-white/10 transition-colors duration-200"
              >
                <ImageIcon className="w-6 h-6" />
                <span className="text-lg font-medium">Gallery</span>
              </Link>

              <Link
                href="/market"
                onClick={closeMobileMenu}
                className="flex items-center gap-4 px-6 py-4 text-white hover:bg-white/10 transition-colors duration-200"
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="text-lg font-medium">Market</span>
              </Link>

              <Link
                href="/nft-display-demo"
                onClick={closeMobileMenu}
                className="flex items-center gap-4 px-6 py-4 text-white hover:bg-white/10 transition-colors duration-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="m15 9 3 3" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="text-lg font-medium">NFT Demo</span>
              </Link>

              {/* Manage section - Only visible when connected */}
              {isConnected && (
                <>
                  <div className="px-6 py-2">
                    <div className="flex items-center gap-2 text-white/50 text-sm font-semibold">
                      <Settings className="w-4 h-4" />
                      <span>MANAGE</span>
                    </div>
                  </div>
                  
                  <Link
                    href="/portfolio"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-4 px-6 py-3 pl-12 text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                  >
                    <Briefcase className="w-5 h-5" />
                    <span className="text-base font-medium">Portfolio</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-4 px-6 py-3 pl-12 text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-base font-medium">Dashboard</span>
                  </Link>
                </>
              )}

            </div>

            {/* Mobile Wallet Connection */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-center">
                <p className="text-white/70 text-sm mb-4">Connect Wallet</p>
                <WalletConnect />
              </div>
            </div>
              </LiquidGlass>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
