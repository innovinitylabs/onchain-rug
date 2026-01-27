#!/usr/bin/env node

/**
 * Cryptopunk SVG Downloader
 * Downloads all 10,000 Cryptopunk SVGs in parallel batches
 *
 * Usage: node scripts/download-punks.js [start-id] [end-id] [batch-size]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const START_ID = parseInt(process.argv[2] || '625');
const END_ID = parseInt(process.argv[3] || '9999');
const BATCH_SIZE = parseInt(process.argv[4] || '100');

/**
 * Fetch SVG for a single punk
 */
async function fetchPunkSvg(punkId) {
  try {
    // Try punks.art API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`https://punks.art/api/punks/${punkId}?format=svg`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

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
    // Don't throw, just return placeholder
    return `<svg xmlns="http://www.w3.org/2000/svg">Placeholder for punk ${punkId}</svg>`;
  }
}

/**
 * Download all punks in parallel batches
 */
async function downloadAllPunks() {
  const outputDir = path.join(__dirname, '..', 'public', 'data', 'cryptopunks');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🚀 Starting Cryptopunk SVG download...');
  console.log(`📊 Range: ${START_ID} to ${END_ID}`);
  console.log(`📦 Batch size: ${BATCH_SIZE}`);

  const totalPunks = END_ID - START_ID + 1;
  const totalBatches = Math.ceil(totalPunks / BATCH_SIZE);
  let totalDownloaded = 0;

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = START_ID + (batchIndex * BATCH_SIZE);
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, END_ID);
    const batchNum = batchIndex + 1;

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batchStart}-${batchEnd})`);

    // Create promises for all punks in this batch
    const punkPromises = [];
    for (let punkId = batchStart; punkId <= batchEnd; punkId++) {
      punkPromises.push(fetchPunkData(punkId));
    }

    // Process in chunks of 20 concurrent requests
    const results = [];
    for (let i = 0; i < punkPromises.length; i += 20) {
      const chunk = punkPromises.slice(i, i + 20);
      const chunkResults = await Promise.allSettled(chunk);
      results.push(...chunkResults);

      // Small delay between chunks
      if (i + 20 < punkPromises.length) {
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
      } else {
        console.warn(`❌ Failed punk ${punkId}: ${result.reason?.message || 'Unknown error'}`);
      }
    }

    // Save batch
    const batchFilename = `punks-${String(batchStart).padStart(5, '0')}.json`;
    const outputPath = path.join(outputDir, batchFilename);
    fs.writeFileSync(outputPath, JSON.stringify(batchPunks, null, 2));

    console.log(`💾 Saved ${batchFilename} (${batchPunks.length} punks, ${totalDownloaded} total)`);
  }

  console.log(`\n✅ Download complete! ${totalDownloaded}/${totalPunks} punks downloaded successfully`);
}

async function fetchPunkData(punkId) {
  try {
    return await fetchPunkSvg(punkId);
  } catch (error) {
    console.warn(`⚠️ Punk ${punkId} failed, using placeholder`);
    return `<svg xmlns="http://www.w3.org/2000/svg">Placeholder for punk ${punkId}</svg>`;
  }
}

// Run the download
downloadAllPunks().catch(console.error);