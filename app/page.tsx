'use client'

import { Suspense } from 'react'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import AnimatedRugs from '@/components/AnimatedRugs'
import Features from '@/components/Features'
import Gallery from '@/components/Gallery'

export default function Home() {
  return (
    <main className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 min-h-screen">
      <Navigation />
      {/* Hero Section with 3D Flying Rugs */}
      <section className="relative h-screen overflow-hidden">
        <Suspense fallback={<div className="h-screen bg-gradient-to-br from-amber-100 to-orange-100" />}>
          <AnimatedRugs />
        </Suspense>
        <Hero />
      </section>

      {/* Features Section */}
      <Features />

      {/* Gallery Section */}
      <Gallery />
    </main>
  )
}