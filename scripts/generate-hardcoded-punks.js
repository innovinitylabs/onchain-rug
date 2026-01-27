#!/usr/bin/env node

/**
 * Generate Hardcoded Punk Data from Real Cryptopunk SVGs
 * Extracts actual pixel colors from downloaded SVG data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Our curated punk IDs
const CURATED_PUNKS = [0, 1, 2, 5, 26, 29, 58, 64, 95, 465, 3100, 5217];

/**
 * Parse Cryptopunk SVG into 24x24 pixel color array
 */
function parsePunkSvg(svgString) {
  const pixels = Array(24).fill(null).map(() => Array(24).fill(null));

  try {
    // Extract rect elements from SVG with their fill colors
    // More flexible regex that handles any attribute order
    const rectRegex = /<rect[^>]*x="(\d+)"[^>]*y="(\d+)"[^>]*fill="#([0-9a-fA-F]{6})[0-9a-fA-F]*"[^>]*>/g;
    let match;
    let rectCount = 0;

    console.log(`Parsing SVG (${svgString.length} chars)...`);

    while ((match = rectRegex.exec(svgString)) !== null) {
      rectCount++;
      const x = parseInt(match[1]);
      const y = parseInt(match[2]);
      const hexColor = match[3];

      if (x >= 0 && x < 24 && y >= 0 && y < 24 && hexColor && hexColor.length >= 6) {
        // Convert hex color to RGB (first 6 digits, ignore alpha)
        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);

        pixels[y][x] = { r, g, b };
      }
    }

    console.log(`Found ${rectCount} rect elements, ${pixels.flat().filter(p => p !== null).length} colored pixels`);
  } catch (error) {
    console.warn('Failed to parse punk SVG:', error);
  }

  return pixels;
}

/**
 * Load punk data from JSON files
 */
function loadPunkData(punkId) {
  // Determine which file contains this punk ID
  let filename;
  if (punkId < 3100) {
    const batchIndex = Math.floor(punkId / 100);
    filename = `punks-${batchIndex.toString().padStart(3, '0')}.json`;
  } else {
    if (punkId === 3100) filename = 'punks-031.json';
    else if (punkId === 5217) filename = 'punks-052.json';
    else filename = 'punks-004.json'; // For 465
  }

  const filePath = path.join(__dirname, '..', 'public', 'data', 'cryptopunks', filename);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const punkData = data.find(p => p.id === punkId);

    if (punkData) {
      console.log(`✅ Found punk #${punkId} in ${filename}`);
      return parsePunkSvg(punkData.svg);
    } else {
      console.warn(`⚠️ Punk #${punkId} not found in ${filename}`);
      return null;
    }
  } catch (error) {
    console.warn(`❌ Failed to load punk #${punkId} from ${filename}:`, error.message);
    return null;
  }
}

/**
 * Generate TypeScript code for hardcoded punk data
 */
function generateTypeScriptCode() {
  console.log('🎨 Generating hardcoded punk data from real Cryptopunk SVGs...\n');

  const punkDataEntries = [];

  let processedCount = 0;
  for (const punkId of CURATED_PUNKS) {
    console.log(`📊 Processing punk #${punkId}...`);
    const pixelData = loadPunkData(punkId);

    if (pixelData) {
      // Count non-null pixels
      let pixelCount = 0;
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 24; x++) {
          if (pixelData[y][x] !== null) pixelCount++;
        }
      }

      console.log(`   → ${pixelCount} colored pixels out of 576 total`);

      // Convert to TypeScript array format
      const rows = pixelData.map(row =>
        `[${row.map(pixel =>
          pixel ? `{r:${pixel.r},g:${pixel.g},b:${pixel.b}}` : 'null'
        ).join(',')}]`
      );

      punkDataEntries.push(`  // Punk #${punkId} (${pixelCount} pixels)
  ${punkId}: [
${rows.map(row => `    ${row}`).join(',\n')},
  ]`);

      processedCount++;
      console.log(`   ✅ Added punk #${punkId} to output (${processedCount}/${CURATED_PUNKS.length})`);
    } else {
      console.warn(`   → Failed to load punk #${punkId}, skipping`);
    }
  }

  // Generate the complete TypeScript code
  const tsCode = `// Hardcoded Cryptopunk pixel data from real SVGs
// Auto-generated from downloaded Cryptopunk data
const HARDCODED_PUNK_DATA: { [key: number]: ({r: number, g: number, b: number} | null)[][] } = {
${punkDataEntries.join(',\n\n')}
};`;

  // Write to a temporary file for manual copy-paste
  const outputPath = path.join(__dirname, '..', 'HARDCODED_PUNK_DATA.ts');
  fs.writeFileSync(outputPath, tsCode);

  console.log(`\n🎉 Generated hardcoded data for ${punkDataEntries.length} punks`);
  console.log(`📁 Output saved to: ${outputPath}`);
  console.log(`\n📋 Copy the HARDCODED_PUNK_DATA content into lib/GeometricPatterns.ts`);
}

generateTypeScriptCode();