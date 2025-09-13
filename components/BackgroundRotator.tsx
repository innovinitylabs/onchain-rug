'use client';

import { useEffect, useState } from 'react';

// Available background images
const backgrounds = [
  '/backgrounds/anime-style-clouds.jpg',
  '/backgrounds/anime-style-clouds-1.jpg',
  '/backgrounds/anime-style-clouds-2.jpg'
];

// Generate time-based background index (42-second rotation)
function get42SecondBackgroundIndex(): number {
  // Change background every 42 seconds
  const fortyTwoSecondWindow = Math.floor(Date.now() / (1000 * 42));
  return fortyTwoSecondWindow % backgrounds.length;
}

export default function BackgroundRotator() {
  // Preload all background images for instant loading
  useEffect(() => {
    backgrounds.forEach(bg => {
      const img = new Image();
      img.src = bg;
    });
  }, []);

  // Generate time-based background immediately (42-second rotation)
  const timeBasedIndex = get42SecondBackgroundIndex();
  const selectedBg = backgrounds[timeBasedIndex];

  // Detailed logging for debugging time-based rotation
  const timestamp = new Date().toISOString();
  const currentWindow = Math.floor(Date.now() / (1000 * 42));
  console.log(`🎨 Background Rotator [${timestamp}] - Window ${currentWindow}:`);
  console.log(`   Index: ${timeBasedIndex}, Background: ${selectedBg}`);
  console.log(`   Changes every 42 seconds: [${backgrounds.join(', ')}]`);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        backgroundImage: `url(${selectedBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        opacity: 0.8
      }}
    />
  );
}
