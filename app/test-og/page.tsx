'use client'

import { useState } from 'react'
import { RefreshCw, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'

/**
 * Test page for verifying Puppeteer-based OG image generation
 * 
 * Usage:
 * 1. Start dev server: npm run dev
 * 2. Navigate to: http://localhost:3002/test-og
 * 3. Enter a tokenId and chainId
 * 4. Click "Generate OG Image" to test Puppeteer rendering
 */
export default function TestOGPage() {
  const [tokenId, setTokenId] = useState('1')
  const [chainId, setChainId] = useState('84532')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generationTime, setGenerationTime] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setImageUrl(null)
    setGenerationTime(null)
    setStatus('generating')

    const startTime = Date.now()

    try {
      const url = `/api/og/rug?tokenId=${tokenId}&chainId=${chainId}`
      console.log('[Test OG] Testing endpoint:', url)
      
      const response = await fetch(url)
      
      const elapsed = Date.now() - startTime
      setGenerationTime(elapsed)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Create blob URL from response
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      setImageUrl(blobUrl)
      setStatus('success')
      
      console.log('[Test OG] Image generated successfully in', elapsed, 'ms')
      console.log('[Test OG] Image size:', blob.size, 'bytes')
    } catch (err) {
      console.error('[Test OG] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const ogImageUrl = imageUrl 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/rug?tokenId=${tokenId}&chainId=${chainId}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-[3200px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">OG Image Generation Test</h1>
          <p className="text-white/70">Test Puppeteer-based OG image generation for rug NFTs</p>
        </div>
        
        {/* Input Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-white mb-2 font-medium">Token ID</label>
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
                min="1"
              />
            </div>
            <div>
              <label className="block text-white mb-2 font-medium">Chain ID</label>
              <input
                type="number"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="84532"
              />
            </div>
          </div>
          
          <button
            onClick={handleTest}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating with Puppeteer...
              </>
            ) : (
              'Generate OG Image'
            )}
          </button>
        </div>

        {/* Status Indicator */}
        {status !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            status === 'success' 
              ? 'bg-green-500/20 border-green-500/50' 
              : status === 'error'
              ? 'bg-red-500/20 border-red-500/50'
              : 'bg-blue-500/20 border-blue-500/50'
          }`}>
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
            {status === 'generating' && <Clock className="w-5 h-5 text-blue-400 animate-pulse" />}
            <div className="flex-1">
              {status === 'success' && (
                <div>
                  <p className="text-green-400 font-semibold">Success!</p>
                  {generationTime !== null && (
                    <p className="text-green-300 text-sm">Generated in {generationTime}ms</p>
                  )}
                </div>
              )}
              {status === 'error' && (
                <div>
                  <p className="text-red-400 font-semibold">Error occurred</p>
                  {generationTime !== null && (
                    <p className="text-red-300 text-sm">Failed after {generationTime}ms</p>
                  )}
                </div>
              )}
              {status === 'generating' && (
                <p className="text-blue-400 font-semibold">Rendering rug in headless browser...</p>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <h2 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Error Details
            </h2>
            <pre className="text-red-300 text-sm whitespace-pre-wrap bg-black/20 p-3 rounded overflow-auto">{error}</pre>
          </div>
        )}

        {/* Generated Image */}
        {imageUrl && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Generated OG Image (1200x630)
            </h2>
            <div className="bg-black/20 rounded-lg p-4 mb-4 border border-white/10">
              <img
                src={imageUrl}
                alt="OG Image"
                className="w-full h-auto border border-white/20 rounded shadow-lg"
              />
            </div>
            <div className="space-y-2">
              <div className="bg-white/5 rounded p-3">
                <p className="text-white/70 text-sm mb-1"><strong>API Endpoint:</strong></p>
                <code className="text-blue-400 text-sm break-all">{ogImageUrl}</code>
              </div>
              {generationTime !== null && (
                <div className="bg-white/5 rounded p-3">
                  <p className="text-white/70 text-sm">
                    <strong>Generation Time:</strong> {generationTime}ms
                    {generationTime > 3000 && (
                      <span className="text-yellow-400 ml-2">⚠️ Exceeded 3s target</span>
                    )}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <a
                  href={ogImageUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Image in New Tab
                </a>
                <button
                  onClick={() => {
                    if (ogImageUrl) {
                      navigator.clipboard.writeText(ogImageUrl)
                    }
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                >
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-white font-semibold mb-4">How It Works</h2>
          <ol className="text-white/70 space-y-3 list-decimal list-inside">
            <li>Enter a token ID (e.g., 1, 7, 8) and chain ID</li>
            <li>Click "Generate OG Image" to trigger Puppeteer</li>
            <li>Puppeteer launches headless Chromium and navigates to: <code className="bg-black/30 px-2 py-1 rounded text-xs">/rug-market?tokenId={tokenId}&renderMode=og</code></li>
            <li>The page renders the NFT with <code className="bg-black/30 px-2 py-1 rounded text-xs">renderMode=og</code> (dirt=0, aging=0, no frames)</li>
            <li>Script waits for <code className="bg-black/30 px-2 py-1 rounded text-xs">window.__OG_READY__</code> flag</li>
            <li>Puppeteer screenshots the canvas from the iframe</li>
            <li>Image is composited onto 1200x630 OG canvas with token ID overlay</li>
            <li>PNG buffer is returned (no storage, generated on-demand)</li>
          </ol>
          
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded">
            <p className="text-blue-300 text-sm">
              <strong>✨ Key Advantage:</strong> Uses the EXACT same rendering pipeline as the marketplace.
              No rewrites, no VM sandbox - just real browser rendering.
            </p>
          </div>

          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded">
            <p className="text-yellow-300 text-sm">
              <strong>⚠️ Note:</strong> First request may be slower as Puppeteer launches Chromium.
              Subsequent requests reuse the browser instance (if available).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
