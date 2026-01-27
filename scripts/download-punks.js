#!/usr/bin/env node

/**
 * Cryptopunk SVG Downloader
 * Downloads all 10,000 Cryptopunk SVGs from the CryptoPunksData contract
 *
 * Usage: node scripts/download-punks.js [rpc-url] [batch-size] [start-id] [end-id]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const RPC_URL = process.argv[2] || 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY';
const BATCH_SIZE = parseInt(process.argv[3] || '10'); // Punks per batch
const START_ID = parseInt(process.argv[4] || '0');
const END_ID = parseInt(process.argv[5] || '9999');

const CRYPTOPUNKS_DATA_ADDRESS = '0x16f5a35647d6f03d5d3da7b35409d65ba03af3b2';

/**
 * Fetch SVG for a single punk using punks.art API
 */
async function fetchPunkSvg(punkId) {
  try {
    // Try punks.art API first (more reliable)
    const response = await fetch(`https://punks.art/api/punks/${punkId}?format=svg`);

    if (response.ok) {
      const svgText = await response.text();
      // Check if it's actually SVG (starts with <svg)
      if (svgText.trim().startsWith('<svg')) {
        return svgText;
      }
      // If it's JSON, parse it
      try {
        const data = JSON.parse(svgText);
        return data.svg || data.image || svgText;
      } catch {
        return svgText;
      }
    }

    // Fallback to direct contract call
    console.log(`punks.art failed for ${punkId}, trying direct contract call...`);

    const contractResponse = await fetch('https://cloudflare-eth.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: CRYPTOPUNKS_DATA_ADDRESS,
          data: `0xc87b56dd${punkId.toString(16).padStart(64, '0')}` // punkImageSvg(uint16)
        }, 'latest'],
        id: 1
      })
    });

    if (!contractResponse.ok) {
      throw new Error(`HTTP ${contractResponse.status}: ${contractResponse.statusText}`);
    }

    const result = await contractResponse.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    // The contract returns the SVG as a string directly
    return result.result;
  } catch (error) {
    throw new Error(`Failed to fetch punk ${punkId}: ${error.message}`);
  }
}

/**
 * Save punk data to file
 */
function savePunkBatch(punks, batchIndex) {
  const outputDir = path.join(__dirname, '..', 'data', 'cryptopunks');
  const filename = `punks-${batchIndex.toString().padStart(3, '0')}.json`;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(punks, null, 2));

  console.log(`💾 Saved batch ${batchIndex} to ${filename}`);
}

/**
 * Main download function
 */
async function downloadAllPunks() {
  console.log('🚀 Starting Cryptopunk SVG download...');
  console.log(`📊 Range: ${START_ID} to ${END_ID}`);
  console.log(`📦 Batch size: ${BATCH_SIZE}`);
  console.log(`🌐 RPC: ${RPC_URL}`);
  console.log('');

  let totalDownloaded = 0;
  let currentBatch = [];
  let batchIndex = Math.floor(START_ID / BATCH_SIZE);

  for (let punkId = START_ID; punkId <= END_ID; punkId++) {
    try {
      console.log(`🎨 Fetching punk ${punkId}...`);
      const svg = await fetchPunkSvg(punkId);

      currentBatch.push({
        id: punkId,
        svg: svg
      });

      totalDownloaded++;

      // Save batch when full or at end
      if (currentBatch.length >= BATCH_SIZE || punkId === END_ID) {
        savePunkBatch(currentBatch, batchIndex);
        currentBatch = [];
        batchIndex++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error with punk ${punkId}:`, error.message);

      // Save current batch even if there's an error
      if (currentBatch.length > 0) {
        savePunkBatch(currentBatch, batchIndex);
        currentBatch = [];
        batchIndex++;
      }
    }

    // Progress update
    if (totalDownloaded % 50 === 0) {
      console.log(`📈 Progress: ${totalDownloaded}/${END_ID - START_ID + 1} punks downloaded`);
    }
  }

  console.log(`\n✅ Download complete! ${totalDownloaded} punks saved.`);
  console.log('📁 Files saved to: data/cryptopunks/');
}

// Run the downloader
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadAllPunks().catch(console.error);
}

export { fetchPunkSvg, downloadAllPunks };