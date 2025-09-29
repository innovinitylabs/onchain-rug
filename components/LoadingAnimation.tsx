import React from 'react'
import Image from 'next/image'

interface LoadingAnimationProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = "Loading...",
  className = "",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const pixelSizes = {
    sm: 32,
    md: 48,
    lg: 64
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Image
        src="/rug-loading-smol.webp"
        alt="Loading animation"
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className={`${sizeClasses[size]} mb-4`}
        unoptimized // WebP animation needs unoptimized to preserve animation
      />
      <span className="text-blue-600 font-medium">{message}</span>
    </div>
  )
}

export default LoadingAnimation
