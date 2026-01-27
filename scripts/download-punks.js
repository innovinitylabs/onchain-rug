#!/usr/bin/env node

/**
 * Cryptopunk SVG Downloader
 * Downloads all 10,000 Cryptopunk SVGs from punks.art API
 *
 * Usage: node scripts/download-punks.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch SVG for a single punk
 */
async function fetchPunkSvg(punkId) {
  try {
    // Try punks.art API
    const response = await fetch(`https://punks.art/api/punks/${punkId}?format=svg`);

    if (response.ok) {
      const svgText = await response.text();
      if (svgText.trim().startsWith('<svg')) {
        return svgText;
      }
      // Try parsing as JSON
      try {
        const data = JSON.parse(svgText);
        return data.svg || data.image || svgText;
      } catch {
        return svgText;
      }
    }

    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    // Return placeholder for failed requests
    return `<svg xmlns="http://www.w3.org/2000/svg">Placeholder for punk ${punkId}</svg>`;
  }
}

/**
 * Download all missing punks
 */
async function downloadAllPunks() {
  const outputDir = path.join(__dirname, '..', 'public', 'data', 'cryptopunks');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🚀 Starting Cryptopunk SVG download...');

  // Process each batch (0-399, each containing 25 punks)
  const totalBatches = 400; // 10000 / 25 = 400 batches
  let totalDownloaded = 0;

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * 25;
    const batchEnd = Math.min(batchStart + 24, 9999);
    const batchFilename = `punks-${batchIndex.toString().padStart(3, '0')}.json`;
    const batchPath = path.join(outputDir, batchFilename);

    // Skip if batch file already exists
    if (fs.existsSync(batchPath)) {
      console.log(`⏭️  Skipping existing batch ${batchIndex + 1}/${totalBatches} (${batchStart}-${batchEnd})`);
      continue;
    }

    console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batchStart}-${batchEnd})`);

    // Download all punks in this batch
    const punkPromises = [];
    for (let punkId = batchStart; punkId <= batchEnd; punkId++) {
      punkPromises.push(fetchPunkData(punkId));
    }

    // Process in chunks of 10 concurrent requests
    const results = [];
    for (let i = 0; i < punkPromises.length; i += 10) {
      const chunk = punkPromises.slice(i, i + 10);
      const chunkResults = await Promise.allSettled(chunk);
      results.push(...chunkResults);

      // Small delay between chunks
      if (i + 10 < punkPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Process results
    const batchPunks = [];
    for (let i = 0; i < results.length; i++) {
      const punkId = batchStart + i;
      const result = results[i];

      batchPunks.push({
        id: punkId,
        svg: result.status === 'fulfilled' ? result.value : `<svg xmlns="http://www.w3.org/2000/svg">Placeholder for punk ${punkId}</svg>`
      });

      if (result.status === 'fulfilled') {
        totalDownloaded++;
      }
    }

    // Save batch
    fs.writeFileSync(batchPath, JSON.stringify(batchPunks, null, 2));
    console.log(`💾 Saved ${batchFilename} (${batchPunks.length} punks)`);
  }

  console.log(`\n✅ Download complete! ${totalDownloaded} punks downloaded successfully`);
}

async function fetchPunkData(punkId) {
  const svg = await fetchPunkSvg(punkId);
  return svg;
}

// Run the download
downloadAllPunks().catch(console.error);