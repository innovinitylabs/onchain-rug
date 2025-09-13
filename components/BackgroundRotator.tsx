'use client';

import { useEffect, useState } from 'react';

// Available background images
const backgrounds = [
  '/backgrounds/anime-style-clouds.jpg',
  '/backgrounds/anime-style-clouds (1).jpg',
  '/backgrounds/anime-style-clouds (2).jpg'
];

// Use a simple hash of the current timestamp for consistent SSR
function getBackgroundIndex(): number {
  const timestamp = Date.now();
  // Simple hash function for consistent randomization
  return Math.abs(timestamp % backgrounds.length);
}

export default function BackgroundRotator() {
  const [currentBg, setCurrentBg] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated on client
    setIsHydrated(true);

    // Use consistent randomization based on timestamp for SSR compatibility
    const index = getBackgroundIndex();
    setCurrentBg(backgrounds[index]);
  }, []);

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isHydrated || !currentBg) {
    return (
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${backgrounds[0]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          opacity: 0.8
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        backgroundImage: `url(${currentBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        opacity: 0.8 // More visible now that gradients are semi-transparent
      }}
    />
  );
}
