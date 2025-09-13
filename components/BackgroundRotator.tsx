'use client';

import { useEffect, useState } from 'react';

// Available background images
const backgrounds = [
  '/backgrounds/anime-style-clouds.jpg',
  '/backgrounds/anime-style-clouds (1).jpg',
  '/backgrounds/anime-style-clouds (2).jpg'
];

// Generate truly random background index for each page load
function getRandomBackgroundIndex(): number {
  // Simple and reliable randomization using Math.random()
  return Math.floor(Math.random() * backgrounds.length);
}

export default function BackgroundRotator() {
  const [currentBg, setCurrentBg] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated on client
    setIsHydrated(true);

    // Generate random background for this page load
    const timestamp = new Date().toISOString();
    const index = getRandomBackgroundIndex();
    const selectedBg = backgrounds[index];
    console.log('🎨 Background Rotator [' + timestamp + ']: Random index =', index, 'Selected =', selectedBg);
    setCurrentBg(selectedBg);
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
