"use client"

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface SectionWrapperProps {
  children: ReactNode
  className?: string
  animate?: boolean
  delay?: number
}

export function SectionWrapper({
  children,
  className = "",
  animate = true,
  delay = 0
}: SectionWrapperProps) {
  if (!animate) {
    return (
      <section className={className}>
        {children}
      </section>
    )
  }

  return (
    <section className={className}>
      {children}
    </section>
  )
}