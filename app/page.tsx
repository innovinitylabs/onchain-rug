'use client'

import { Suspense, useEffect, useState } from 'react'
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
    }, 1500) // Start after Hero text animations (1.2s) but before SVG animations (2.5s)

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

      {/* Features Section */}
      <Features />

      {/* Gallery Section */}
      <Gallery />
    </main>
  )
}