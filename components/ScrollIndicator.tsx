'use client'

import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ScrollIndicator() {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      
      // Show only when in the hero section (first 80% of viewport height)
      const shouldShow = scrollY < windowHeight * 0.69
      setIsVisible(shouldShow)
    }

    // Initial check
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mounted])

  if (!mounted) return null
  
  return createPortal(
    <motion.div 
      key="scroll-indicator"
      className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ delay: isVisible ? 1 : 0, duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-amber-600"
      >
        <ChevronDown className="w-8 h-8" />
      </motion.div>
    </motion.div>,
    document.body
  )
}
