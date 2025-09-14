'use client'

import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <Navigation />
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-4xl font-bold text-blue-800 mb-6">Page Not Found</h2>
          <p className="text-xl text-blue-700/70 mb-8 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back to exploring our Onchain Rugs collection.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            🏠 Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
