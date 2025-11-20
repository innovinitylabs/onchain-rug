'use client'

import { Suspense, useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import AnimatedRugs from '@/components/AnimatedRugs'
import Features from '@/components/Features'
import WhitePaperSection from '@/components/WhitePaperSection'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import ScrollIndicator from '@/components/ScrollIndicator'

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
    <div className="bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-400 min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <PerformanceMonitor />
        <ScrollIndicator />
        {/* Hero Section with 3D Flying Rugs - Performance Optimized */}
        <section className="relative h-screen overflow-hidden" style={{ willChange: 'auto' }}>
          {showAnimatedRugs && (
            <Suspense fallback={<div className="h-screen bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-400" />}>
              <AnimatedRugs key={animationKey} />
            </Suspense>
          )}
          <div style={{ willChange: 'auto' }}>
            <Hero />
          </div>
        </section>

        {/* Features Section */}
        <Features />

        {/* White Paper Section */}
        <WhitePaperSection />

        {/* FAQ Section */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}