#!/usr/bin/env node

/**
 * Test script to verify PNG-based CryptoPunk loading
 */

import { loadCanonicalPunkPixels } from './lib/GeometricPatterns.ts';

// Test punk IDs: 0, 1, 3100, 7804
const testPunks = [0, 1, 3100, 7804];

async function testPunkLoading() {
  console.log('🧪 Testing PNG-based CryptoPunk loading...\n');

  for (const punkId of testPunks) {
    try {
      console.log(`🎨 Testing punk #${punkId}...`);
      const pixels = await loadCanonicalPunkPixels(punkId);

      if (pixels) {
        const coloredPixels = pixels.flat().filter(p => p !== null).length;
        console.log(`✅ Punk #${punkId}: ${coloredPixels} colored pixels`);

        // Sample a few pixels to verify they have color
        const samplePixels = [];
        for (let y = 0; y < Math.min(5, pixels.length); y++) {
          for (let x = 0; x < Math.min(5, pixels[y].length); x++) {
            if (pixels[y][x]) {
              samplePixels.push(`(${x},${y}): rgb(${pixels[y][x].r},${pixels[y][x].g},${pixels[y][x].b})`);
            }
          }
        }

        if (samplePixels.length > 0) {
          console.log(`   Sample pixels: ${samplePixels.slice(0, 3).join(', ')}`);
        }
      } else {
        console.log(`❌ Punk #${punkId}: Failed to load`);
      }

      console.log('');

    } catch (error) {
      console.error(`💥 Error loading punk #${punkId}:`, error.message);
    }
  }

  console.log('🏁 Test complete!');
}

testPunkLoading().catch(console.error);