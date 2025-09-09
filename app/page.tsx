'use client'

import { Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import AnimatedRugs from '@/components/AnimatedRugs'
import Features from '@/components/Features'
import Gallery from '@/components/Gallery'
import PerformanceMonitor from '@/components/PerformanceMonitor'

export default function Home() {
  const [animationKey, setAnimationKey] = useState(0)
  const [showAnimatedRugs, setShowAnimatedRugs] = useState(false)

  // Force re-mount of AnimatedRugs when component mounts (navigation back)
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [])

  // Delay AnimatedRugs to start after Hero content is animated
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimatedRugs(true)
    }, 1000) // Start after Hero text animations (1.2s) but before SVG animations (2.5s)

    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 min-h-screen">
      <Navigation />
      <PerformanceMonitor />
      {/* Hero Section with 3D Flying Rugs - Performance Optimized */}
      <section className="relative h-screen overflow-hidden" style={{ willChange: 'auto' }}>
        {showAnimatedRugs && (
          <Suspense fallback={<div className="h-screen bg-gradient-to-br from-amber-100 to-orange-100" />}>
            <AnimatedRugs key={animationKey} />
          </Suspense>
        )}
        <div style={{ willChange: 'auto' }}>
          <Hero />
        </div>
      </section>

      {/* Scroll indicator - Positioned outside Hero to avoid canvas conflicts */}
      <motion.div 
        className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2000, type: "tween" }}
        style={{ willChange: 'opacity' }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, type: "tween" }}
          className="text-amber-600"
          style={{ willChange: 'transform' }}
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <Features />

      {/* Gallery Section */}
      <Gallery />
    </main>
  )
}