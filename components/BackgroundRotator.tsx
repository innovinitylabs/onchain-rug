'use client';

import { useEffect, useState } from 'react';

// Available background images
const backgrounds = [
  '/backgrounds/anime-style-clouds.jpg',
  '/backgrounds/anime-style-clouds-1.jpg',
  '/backgrounds/anime-style-clouds-2.jpg'
];

// Generate truly random background index for each page load
function getRandomBackgroundIndex(): number {
  // Simple and reliable randomization using Math.random()
  return Math.floor(Math.random() * backgrounds.length);
}

export default function BackgroundRotator() {
  // Preload all background images for instant loading
  useEffect(() => {
    backgrounds.forEach(bg => {
      const img = new Image();
      img.src = bg;
    });
  }, []);

  // Generate random background immediately (no useEffect delay)
  const randomIndex = getRandomBackgroundIndex();
  const selectedBg = backgrounds[randomIndex];

  // Log for debugging
  console.log('🎨 Background Rotator: Selected background', randomIndex, selectedBg);

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
