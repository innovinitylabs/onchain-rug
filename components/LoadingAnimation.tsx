import React from 'react'
import Image from 'next/image'

interface LoadingAnimationProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = "Loading...",
  className = "",
  size = 'md'
}) => {
  const pixelSizes = {
    sm: 128,
    md: 192,
    lg: 256,
    xl: 320
  }
  
  const imageSize = pixelSizes[size]
  
  return (
    <div className={`loading-animation-container flex flex-col items-center justify-center ${className}`}>
      <div className="loading-animation-image-wrapper" style={{ width: imageSize, height: imageSize }}>
        <Image
          src="/rug-loading-big.webp"
          alt="Loading animation"
          width={imageSize}
          height={imageSize}
          className="mb-4"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          unoptimized // WebP animation needs unoptimized to preserve animation
        />
      </div>
      <span className="loading-animation-text text-white font-medium text-lg">{message}</span>
    </div>
  )
}

export default LoadingAnimation
