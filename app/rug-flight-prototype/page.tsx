'use client'

import dynamic from 'next/dynamic'

// Dynamically import the game component to avoid SSR issues
const RugFlightPrototype = dynamic(() => import('../../components/rug-flight/RugFlightPrototype'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white text-xl">Loading Flight Prototype...</div>
    </div>
  )
})

export default function RugFlightPrototypePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <RugFlightPrototype />
    </div>
  )
}
