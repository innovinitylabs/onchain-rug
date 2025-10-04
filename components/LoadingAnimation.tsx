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
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const pixelSizes = {
    sm: 128,
    md: 192,
    lg: 256,
    xl: 320
  }
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Image
        src="/rug-loading-big.webp"
        alt="Loading animation"
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className={`${sizeClasses[size]} mb-4`}
        unoptimized // WebP animation needs unoptimized to preserve animation
      />
      <span className="text-white font-medium text-lg">{message}</span>
    </div>
  )
}

export default LoadingAnimation
