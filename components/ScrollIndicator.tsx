'use client'

import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ScrollIndicator() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  
  return createPortal(
    <motion.div 
      className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1500, type: "tween" }}
    >
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, type: "tween" }}
        className="text-amber-600"
      >
        <ChevronDown className="w-8 h-8" />
      </motion.div>
    </motion.div>,
    document.body
  )
}
