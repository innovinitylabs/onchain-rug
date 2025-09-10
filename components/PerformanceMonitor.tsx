'use client'

import { useEffect, useRef, useState } from 'react'

export default function PerformanceMonitor() {
  const [fps, setFps] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationIdRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const measureFPS = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      
      if (currentTime - lastTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current)))
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
      }
      
      animationIdRef.current = requestAnimationFrame(measureFPS)
    }

    // Only start monitoring if visible (for development)
    if (isVisible) {
      animationIdRef.current = requestAnimationFrame(measureFPS)
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [isVisible])

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg font-mono text-sm">
      <div>FPS: {fps}</div>
      <div className="text-xs text-gray-400 mt-1">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}
