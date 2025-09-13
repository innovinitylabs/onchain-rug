'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import LiquidGlass to avoid SSR issues
const LiquidGlass = dynamic(() => import('liquid-glass-react'), {
  ssr: false,
  loading: () => <div style={{ opacity: 0 }}>Loading...</div>
});

interface LiquidGlassWrapperProps {
  children: ReactNode;
  className?: string;
  // Conservative default settings to avoid breaking layouts
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  disabled?: boolean; // Allow disabling for debugging
}

export default function LiquidGlassWrapper({
  children,
  className = '',
  displacementScale = 30, // Reduced from default 70 for subtlety
  blurAmount = 0.03, // Reduced from default 0.0625
  saturation = 120, // Reduced from default 140
  aberrationIntensity = 1, // Reduced from default 2
  elasticity = 0.08, // Reduced from default 0.15
  cornerRadius = 12, // Reasonable default
  mode = 'standard',
  disabled = false
}: LiquidGlassWrapperProps) {

  // If disabled, just return children without wrapper
  if (disabled || typeof window === 'undefined') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <LiquidGlass
        displacementScale={displacementScale}
        blurAmount={blurAmount}
        saturation={saturation}
        aberrationIntensity={aberrationIntensity}
        elasticity={elasticity}
        cornerRadius={cornerRadius}
        mode={mode}
        overLight={true} // Prevents dark backgrounds on light themes
        style={{
          display: 'inline-block',
          width: '100%',
          height: 'auto',
          background: 'transparent' // Ensure transparent background
        }}
      >
        {children}
      </LiquidGlass>
    </div>
  );
}
