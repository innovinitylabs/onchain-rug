'use client'

import SevenSegmentDigit from './SevenSegmentDigit'

interface SevenSegmentDisplayProps {
  value: string | number
  activeColor?: string
  inactiveColor?: string
  className?: string
}

export default function SevenSegmentDisplay({
  value,
  activeColor = '#ff0000',
  inactiveColor = '#666666',
  className = ''
}: SevenSegmentDisplayProps) {
  // Convert value to string and handle different cases
  const displayValue = value.toString().toUpperCase()

  // Split into individual characters
  const characters = displayValue.split('')

  return (
    <div
      className={`seven-segment-display ${className}`}
      style={{
        display: 'inline-flex',
        gap: 'clamp(0.1875rem, 0.5vw, 0.25rem)',
        padding: 'clamp(0.375rem, 1vw, 0.625rem) clamp(0.5rem, 1.25vw, 0.75rem)',
        background: '#0a0a0a',
        border: 'clamp(0.09375rem, 0.5vw, 0.1875rem) solid #333',
        borderRadius: 'clamp(0.1875rem, 1vw, 0.375rem)',
        boxShadow: 'inset 0 0 0.5rem rgba(0, 0, 0, 0.9), 0 0 0.25rem rgba(239, 68, 68, 0.1)',
        minWidth: 0
      }}
    >
      {characters.map((char, index) => (
        <SevenSegmentDigit
          key={`${char}-${index}`}
          value={char}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </div>
  )
}