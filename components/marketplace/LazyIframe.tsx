'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface LazyIframeProps {
  src: string
  title: string
  className?: string
  style?: React.CSSProperties
  placeholder?: React.ReactNode
}

export default function LazyIframe({
  src,
  title,
  className = '',
  style = {},
  placeholder
}: LazyIframeProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // Stop observing once loaded
        }
      },
      {
        rootMargin: '100px', // Load 100px before entering viewport
        threshold: 0.1
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const defaultPlaceholder = (
    <div className="w-full h-full bg-gradient-to-br from-blue-100/20 to-indigo-100/20 rounded-lg flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="text-3xl mb-2">🧵</div>
        <div className="text-xs text-white/60">Loading...</div>
      </motion.div>
    </div>
  )

  return (
    <div ref={ref} className={`relative w-full h-full ${className}`} style={style}>
      {/* Loading overlay while iframe loads */}
      {isVisible && !isLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-blue-100/30 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
          />
        </motion.div>
      )}

      {/* Iframe or placeholder */}
      {isVisible ? (
        <iframe
          src={src}
          title={title}
          className="w-full h-full rounded-lg"
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            ...style
          }}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  )
}