'use client'

import { motion } from 'framer-motion'
import { ChevronDown, Sparkles, Star } from 'lucide-react'
import LiquidGlass from '@/components/LiquidGlass'

export default function Hero() {
  return (
    <div className="relative z-10 h-screen flex items-center justify-center text-center px-6" style={{ willChange: 'transform' }}>
      <div className="max-w-4xl mx-auto" style={{ willChange: 'transform, opacity' }}>
        {/* Floating elements - Delayed for performance optimization */}
        <div className="absolute -top-10 -left-10 w-20 h-20 opacity-20" style={{ willChange: 'transform' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              y: [0, -20, 0],
              rotate: [0, 360]
            }}
            transition={{ 
              opacity: { duration: 0.5, delay: 2.5 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", type: "tween", delay: 2.5 },
              rotate: { duration: 6, repeat: Infinity, ease: "easeInOut", type: "tween", delay: 2.5 }
            }}
            style={{ willChange: 'transform' }}
          >
            <Sparkles className="w-full h-full text-amber-600" />
          </motion.div>
        </div>
        
        <div className="absolute -top-5 -right-5 w-16 h-16 opacity-30" style={{ willChange: 'transform' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              y: [0, 15, 0],
              rotate: [0, -360]
            }}
            transition={{ 
              opacity: { duration: 0.5, delay: 2.8 },
              y: { duration: 8, repeat: Infinity, ease: "easeInOut", type: "tween", delay: 2.8 },
              rotate: { duration: 8, repeat: Infinity, ease: "easeInOut", type: "tween", delay: 2.8 }
            }}
            style={{ willChange: 'transform' }}
          >
            <Star className="w-full h-full text-orange-500" />
          </motion.div>
        </div>

        {/* Main content - Optimized for performance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, type: "tween" }}
          style={{ willChange: 'transform, opacity' }}
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-extrabold mb-6 flex items-center justify-center gap-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, type: "tween" }}
            style={{ willChange: 'transform' }}
          >
            <span className="text-6xl md:text-8xl">🧶</span>
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              ONCHAIN RUGS
            </span>
          </motion.h1>
          
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, type: "tween" }}
            style={{ willChange: 'opacity' }}
          >
            <svg
              width="100%"
              height="auto"
              viewBox="0 0 800 60"
              style={{
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
              }}
              aria-label="Generative Doormat Art on the Blockchain"
            >
              <defs>
                {/* Liquid Glass Material - Multiple Layers for Depth */}
                <filter id="liquid-glass-depth" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
                  {/* Base turbulence for liquid flow */}
                  <feTurbulence
                    baseFrequency="0.01"
                    numOctaves="4"
                    seed="42"
                    type="fractalNoise"
                    result="LIQUID_BASE"
                  />

                  {/* Displacement for refraction */}
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="LIQUID_BASE"
                    scale="12"
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="DISPLACED_LIQUID"
                  />

                  {/* Chromatic aberration for glass effect */}
                  <feColorMatrix
                    in="DISPLACED_LIQUID"
                    type="matrix"
                    values="1.15 0.02 0 0 0
                           0 1.1 0.01 0 0
                           0 0 1.05 0 0
                           0 0 0 1 0"
                    result="GLASS_COLORS"
                  />

                  {/* Blur for liquid softness */}
                  <feGaussianBlur
                    in="GLASS_COLORS"
                    stdDeviation="1.2"
                    result="GLASS_BLUR"
                  />
                </filter>

                {/* Liquid Glass Surface */}
                <filter id="liquid-glass-surface" x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
                  <feTurbulence
                    baseFrequency="0.05"
                    numOctaves="2"
                    seed="123"
                    type="fractalNoise"
                    result="SURFACE_NOISE"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="SURFACE_NOISE"
                    scale="6"
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="SURFACE_DISPLACED"
                  />
                  <feGaussianBlur
                    in="SURFACE_DISPLACED"
                    stdDeviation="0.8"
                    result="SURFACE_BLUR"
                  />
                </filter>

                {/* Liquid Glass Gradient - Multi-stop for depth */}
                <linearGradient id="liquid-glass-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.95)', stopOpacity: 1 }} />
                  <stop offset="25%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: 'rgba(255, 255, 255, 0.85)', stopOpacity: 1 }} />
                  <stop offset="75%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.95)', stopOpacity: 1 }} />
                </linearGradient>

                {/* Liquid Glass Highlight */}
                <linearGradient id="liquid-glass-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.6)', stopOpacity: 1 }} />
                  <stop offset="30%" style={{ stopColor: 'rgba(255, 255, 255, 0.4)', stopOpacity: 1 }} />
                  <stop offset="70%" style={{ stopColor: 'rgba(255, 255, 255, 0.2)', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.5)', stopOpacity: 1 }} />
                </linearGradient>

                {/* Liquid Glass Shadow */}
                <linearGradient id="liquid-glass-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(0, 0, 0, 0.2)', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: 'rgba(0, 0, 0, 0.1)', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'rgba(0, 0, 0, 0.15)', stopOpacity: 1 }} />
                </linearGradient>
              </defs>

              {/* Liquid Glass Shadow Layer */}
              <text
                x="50%"
                y="37"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl md:text-3xl font-semibold"
                style={{
                  fill: 'url(#liquid-glass-shadow)',
                  filter: 'url(#liquid-glass-depth)',
                  fontSize: '24px',
                  fontWeight: '600',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  opacity: 0.6
                }}
              >
                Generative Doormat Art on the Blockchain
              </text>

              {/* Liquid Glass Main Fill */}
              <text
                x="50%"
                y="35"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl md:text-3xl font-semibold"
                style={{
                  fill: 'url(#liquid-glass-fill)',
                  filter: 'url(#liquid-glass-depth)',
                  fontSize: '24px',
                  fontWeight: '600',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                Generative Doormat Art on the Blockchain
              </text>

              {/* Liquid Glass Surface Highlight */}
              <text
                x="50%"
                y="33"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl md:text-3xl font-semibold"
                style={{
                  fill: 'url(#liquid-glass-highlight)',
                  filter: 'url(#liquid-glass-surface)',
                  fontSize: '24px',
                  fontWeight: '600',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  mixBlendMode: 'screen'
                }}
              >
                Generative Doormat Art on the Blockchain
              </text>

              {/* Liquid Glass Rim Light */}
              <text
                x="50%"
                y="35"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl md:text-3xl font-semibold"
                style={{
                  fill: 'none',
                  stroke: 'rgba(255, 255, 255, 0.8)',
                  strokeWidth: '0.3',
                  filter: 'url(#liquid-glass-surface)',
                  fontSize: '24px',
                  fontWeight: '600',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  mixBlendMode: 'overlay'
                }}
              >
                Generative Doormat Art on the Blockchain
              </text>
            </svg>
          </motion.div>
          
          {/* Hidden description paragraph */}
          {/* <motion.p 
            className="text-lg md:text-xl text-amber-700/70 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, type: "tween" }}
            style={{ 
              willChange: 'transform, opacity',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
              mixBlendMode: 'multiply',
              filter: 'contrast(1.1) saturate(1.05)'
            }}
          >
            Each NFT is a unique, woven masterpiece with 102 color palettes, and 
            custom text embedding. 
            <br />
            <span 
              className="font-semibold"
              style={{
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                mixBlendMode: 'multiply',
                filter: 'contrast(1.3) saturate(1.15)'
              }}
            >
              Max supply: 1111 onchain rugs
            </span>
          </motion.p> */}
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, type: "tween" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ willChange: 'transform' }}
            >
              <LiquidGlass
                blurAmount={0.2}
                aberrationIntensity={3}
                saturation={200}
                className="text-lg font-bold px-6 py-3"
                onClick={() => window.location.href = '/generator'}
                style={{
                  border: '2px solid #f59e0b',
                  borderRadius: '9999px',
                  background: 'linear-gradient(to right, #f59e0b, #ea580c)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem 2rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                🚀 Start Creating
              </LiquidGlass>
            </motion.div>
            
            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ willChange: 'transform' }}
            >
              <LiquidGlass
                blurAmount={0.2}
                aberrationIntensity={3}
                saturation={200}
                className="text-lg font-bold px-6 py-3"
                onClick={() => window.location.href = '/gallery'}
                style={{
                  border: '2px solid #f59e0b',
                  borderRadius: '9999px',
                  background: 'transparent',
                  color: '#92400e',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem 2rem'
                }}
              >
                🎨 Gallery
              </LiquidGlass>
            </motion.div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  )
}
