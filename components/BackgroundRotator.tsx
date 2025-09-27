'use client';

import { useEffect, useState } from 'react';

// Available background images for desktop
const desktopBackgrounds = [
  '/backgrounds/anime-style-clouds-1.jpg'
];

// Available background images for mobile (vertical)
const mobileBackgrounds = [
  '/backgrounds/mobile/anime-style-clouds-port-0.jpg',
  '/backgrounds/mobile/anime-style-clouds-port-1.jpg'
];

// Mobile detection function
function isMobileDevice(): boolean {
  // Check for mobile user agents
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];

  const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));

  // Check screen size (mobile if width < 768px)
  const isSmallScreen = window.innerWidth < 768;

  // Check if touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Return true if it's likely a mobile device
  return isMobileUserAgent || (isSmallScreen && isTouchDevice);
}

// Generate time-based background index (42-second rotation)
function get42SecondBackgroundIndex(backgroundArray: string[]): number {
  // Change background every 42 seconds
  const fortyTwoSecondWindow = Math.floor(Date.now() / (1000 * 42));
  return fortyTwoSecondWindow % backgroundArray.length;
}

export default function BackgroundRotator() {
  const [isMobile, setIsMobile] = useState(false);
  const [backgrounds, setBackgrounds] = useState(desktopBackgrounds);
  const [currentBg, setCurrentBg] = useState(desktopBackgrounds[0]);
  const [nextBg, setNextBg] = useState(desktopBackgrounds[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Detect mobile device and set appropriate backgrounds
  useEffect(() => {
    const mobile = isMobileDevice();
    setIsMobile(mobile);
    setBackgrounds(mobile ? mobileBackgrounds : desktopBackgrounds);

    console.log(`📱 Device Detection: ${mobile ? 'Mobile' : 'Desktop'}`);
    console.log(`   User Agent: ${navigator.userAgent.substring(0, 50)}...`);
    console.log(`   Screen Size: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`   Touch Points: ${navigator.maxTouchPoints}`);
    console.log(`🎨 Using backgrounds: [${(mobile ? mobileBackgrounds : desktopBackgrounds).join(', ')}]`);

    // Test image loading for selected background type
    const testBg = mobile ? mobileBackgrounds[0] : desktopBackgrounds[0];
    const testImg = new Image();
    testImg.onload = () => console.log(`✅ Background loaded successfully: ${testBg}`);
    testImg.onerror = () => console.log(`❌ Background failed to load: ${testBg}`);
    testImg.src = testBg;

    // Store the current mobile state for comparison in resize handler
    const currentMobile = mobile;

    // Listen for window resize to handle orientation changes
    const handleResize = () => {
      const newMobile = isMobileDevice();
      if (newMobile !== currentMobile) {
        console.log(`📱 Orientation/Device change detected: ${newMobile ? 'Mobile' : 'Desktop'}`);
        setIsMobile(newMobile);
        setBackgrounds(newMobile ? mobileBackgrounds : desktopBackgrounds);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Preload all background images for instant loading
  useEffect(() => {
    if (backgrounds.length > 0) {
      backgrounds.forEach(bg => {
        const img = new Image();
        img.src = bg;
      });
    }
  }, [backgrounds]);

  // Update selected background when backgrounds change or periodically
  useEffect(() => {
    const updateBackground = () => {
      const timeBasedIndex = get42SecondBackgroundIndex(backgrounds);
      const newSelectedBg = backgrounds.length > 0 ? backgrounds[timeBasedIndex] : desktopBackgrounds[0];

      if (newSelectedBg !== currentBg && !isTransitioning) {
        setIsTransitioning(true);
        setNextBg(newSelectedBg);

        // Start transition after a brief delay to ensure nextBg is set
        setTimeout(() => {
          setCurrentBg(newSelectedBg);
          setNextBg(newSelectedBg);

          // Reset transition state after transition completes
          setTimeout(() => {
            setIsTransitioning(false);
          }, 2000); // Match CSS transition duration
        }, 100);
      }
    };

    // Update immediately
    updateBackground();

    // Update every 42 seconds
    const interval = setInterval(updateBackground, 42000);

    return () => clearInterval(interval);
  }, [backgrounds, currentBg, isTransitioning]);

  // Detailed logging for debugging time-based rotation
  const timestamp = new Date().toISOString();
  const currentWindow = Math.floor(Date.now() / (1000 * 42));
  const timeBasedIndex = get42SecondBackgroundIndex(backgrounds);
  console.log(`🎨 Background Rotator [${timestamp}] - Window ${currentWindow}:`);
  console.log(`   Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
  console.log(`   Index: ${timeBasedIndex}, Current: ${currentBg}, Next: ${nextBg}`);
  console.log(`   Transitioning: ${isTransitioning}`);
  console.log(`   Changes every 42 seconds: [${backgrounds.join(', ')}]`);

  return (
    <div className="fixed inset-0 z-0">
      {/* Current background layer */}
      <div
        className={`absolute inset-0 transition-opacity duration-2000 ease-in-out ${
          isTransitioning ? 'opacity-0' : 'opacity-80'
        }`}
        style={{
          backgroundImage: `url(${currentBg})`,
          backgroundSize: isMobile ? 'cover' : 'cover',
          backgroundPosition: isMobile ? 'center top' : 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: isMobile ? 'scroll' : 'fixed',
          backgroundOrigin: isMobile ? 'padding-box' : 'border-box',
        }}
      />

      {/* Next background layer */}
      <div
        className={`absolute inset-0 transition-opacity duration-2000 ease-in-out ${
          isTransitioning ? 'opacity-80' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${nextBg})`,
          backgroundSize: isMobile ? 'cover' : 'cover',
          backgroundPosition: isMobile ? 'center top' : 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: isMobile ? 'scroll' : 'fixed',
          backgroundOrigin: isMobile ? 'padding-box' : 'border-box',
        }}
      />
    </div>
  );
}
