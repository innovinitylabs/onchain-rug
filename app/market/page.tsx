import { Suspense } from 'react'
import MarketPageClient from './MarketPageClient'

export default function MarketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center"><div className="text-white text-xl">Loading marketplace...</div></div>}>
      <MarketPageClient />
    </Suspense>
  )
}

