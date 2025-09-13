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
  // Add multiple sources of entropy for better randomization
  const entropy1 = Math.random();
  const entropy2 = performance.now() % 1000; // Sub-millisecond timing
  const entropy3 = Math.random() * Date.now(); // Timestamp + random

  // Combine entropies and ensure good distribution
  const combined = entropy1 + (entropy2 / 1000) + (entropy3 / 1000000);
  const normalized = combined % 1; // Get fractional part

  return Math.floor(normalized * backgrounds.length);
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

  // Detailed logging for debugging randomization
  const timestamp = new Date().toISOString();
  console.log(`🎨 Background Rotator [${timestamp}]:`);
  console.log(`   Index: ${randomIndex}, Background: ${selectedBg}`);
  console.log(`   Available: [${backgrounds.join(', ')}]`);

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
