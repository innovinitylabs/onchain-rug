'use client'

interface SevenSegmentDigitProps {
  value: number | string
  activeColor?: string
  inactiveColor?: string
  className?: string
}

export default function SevenSegmentDigit({
  value,
  activeColor = '#ff0000',
  inactiveColor = '#666666',
  className = ''
}: SevenSegmentDigitProps) {
  // Define which segments are active for each digit (0-9, and some letters)
  const segmentPatterns: { [key: string]: boolean[] } = {
    '0': [true, true, true, true, true, true, false],
    '1': [false, true, true, false, false, false, false],
    '2': [true, true, false, true, true, false, true],
    '3': [true, true, true, true, false, false, true],
    '4': [false, true, true, false, false, true, true],
    '5': [true, false, true, true, false, true, true],
    '6': [true, false, true, true, true, true, true],
    '7': [true, true, true, false, false, false, false],
    '8': [true, true, true, true, true, true, true],
    '9': [true, true, true, true, false, true, true],
    'A': [true, true, true, false, true, true, true],
    'B': [false, false, true, true, true, true, true],
    'C': [true, false, false, true, true, true, false],
    'D': [false, true, true, true, true, false, true],
    'E': [true, false, false, true, true, true, true],
    'F': [true, false, false, false, true, true, true],
    '-': [false, false, false, false, false, false, true],
    ' ': [false, false, false, false, false, false, false]
  }

  const segments = segmentPatterns[value.toString()] || segmentPatterns[' ']

  // SVG viewBox dimensions for perfect scaling
  const viewBoxWidth = 100
  const viewBoxHeight = 160

  // Segment coordinates (scaled to viewBox)
  const segmentCoords = {
    a: { x: 15, y: 10, width: 70, height: 15 },   // Top horizontal
    b: { x: 75, y: 15, width: 15, height: 60 },   // Top-right vertical
    c: { x: 75, y: 85, width: 15, height: 60 },   // Bottom-right vertical
    d: { x: 15, y: 135, width: 70, height: 15 },  // Bottom horizontal
    e: { x: 10, y: 85, width: 15, height: 60 },   // Bottom-left vertical
    f: { x: 10, y: 15, width: 15, height: 60 },   // Top-left vertical
    g: { x: 15, y: 75, width: 70, height: 15 }    // Middle horizontal
  }

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className={`seven-segment-svg ${className}`}
      style={{
        width: 'clamp(1rem, 1.5vw, 1.25rem)',
        height: 'clamp(1.5rem, 2.25vw, 2rem)',
        margin: '0 clamp(0.0625rem, 0.15vw, 0.1875rem)'
      }}
    >
      <defs>
        {/* Refined inner glow effect */}
        <filter id="segment-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feColorMatrix
            in="coloredBlur"
            type="matrix"
            values="1 0 0 0 0
                   0 1 0 0 0
                   0 0 1 0 0
                   0 0 0 2 0"
            result="brightBlur"
          />
          <feMerge>
            <feMergeNode in="brightBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Subtle outer glow */}
        <filter id="segment-outer-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="outerBlur"/>
          <feColorMatrix
            in="outerBlur"
            type="matrix"
            values="1 0 0 0 0
                   0 0.3 0 0 0
                   0 0 0.2 0 0
                   0 0 0 1.5 0"
            result="redGlow"
          />
          <feMerge>
            <feMergeNode in="redGlow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Rounded rectangle path for segments */}
        <rect id="segment-shape" x="0" y="0" width="100%" height="100%" rx="2" ry="2"/>
      </defs>

      {/* Render each segment */}
      {Object.entries(segmentCoords).map(([segment, coords], index) => {
        const isActive = segments[index]
        return (
          <rect
            key={segment}
            x={coords.x}
            y={coords.y}
            width={coords.width}
            height={coords.height}
            rx="2"
            ry="2"
            fill={isActive ? activeColor : inactiveColor}
            stroke={isActive ? '#ff4444' : '#555555'}
            strokeWidth="1"
            filter={isActive ? 'url(#segment-outer-glow) url(#segment-glow)' : 'none'}
            className={isActive ? 'segment-active' : 'segment-inactive'}
          />
        )
      })}
    </svg>
  )
}