'use client';

import { useEffect, useState } from 'react';

// Available background images
const backgrounds = [
  '/backgrounds/anime-style-clouds.jpg',
  '/backgrounds/anime-style-clouds (1).jpg',
  '/backgrounds/anime-style-clouds (2).jpg'
];

export default function BackgroundRotator() {
  const [currentBg, setCurrentBg] = useState<string>('');

  useEffect(() => {
    // Randomly select a background on component mount (page load)
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    setCurrentBg(backgrounds[randomIndex]);
  }, []);

  if (!currentBg) return null;

  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        backgroundImage: `url(${currentBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    />
  );
}
