#!/usr/bin/env node

/**
 * Debug deployment by simulating what the deployment script does
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 DEBUGGING DEPLOYMENT PROCESS');
console.log('===============================');

// Simulate what the deployment script does
console.log('\n📖 Step 1: Reading files (like deployment script)');

const p5Content = readFileSync('./data/rug-p5.js', 'utf8');
const algoContent = readFileSync('./data/rug.js', 'utf8');

console.log(`rug-p5.js: ${p5Content.length} characters`);
console.log(`rug.js: ${algoContent.length} characters`);

console.log('\n📤 Step 2: Simulating chunking process');

const chunkSize = 20000; // Same as deployment script

function simulateChunking(content, fileName) {
    const contentBytes = Buffer.from(content, 'utf8');
    const totalChunks = Math.ceil(contentBytes.length / chunkSize);

    console.log(`\n${fileName}:`);
    console.log(`  Total size: ${contentBytes.length} bytes`);
    console.log(`  Chunk size: ${chunkSize} bytes`);
    console.log(`  Total chunks needed: ${totalChunks}`);

    // Simulate creating chunks
    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, contentBytes.length);
        const chunk = contentBytes.slice(start, end);

        console.log(`  Chunk ${i + 1}/${totalChunks}: ${chunk.length} bytes`);
    }

    return { totalChunks, contentBytes };
}

const p5Result = simulateChunking(p5Content, 'rug-p5.js');
const algoResult = simulateChunking(algoContent, 'rug.js');

console.log('\n🔍 Step 3: Checking for potential issues');

if (p5Content.length === 0 || algoContent.length === 0) {
    console.log('❌ ISSUE: One or more files is empty!');
} else {
    console.log('✅ Files have content');
}

if (p5Result.totalChunks === 0 || algoResult.totalChunks === 0) {
    console.log('❌ ISSUE: No chunks would be created!');
} else {
    console.log('✅ Chunking would work');
}

console.log('\n📊 Step 4: Summary');
console.log(`rug-p5.js: ${p5Result.contentBytes.length} bytes → ${p5Result.totalChunks} chunks`);
console.log(`rug.js: ${algoResult.contentBytes.length} bytes → ${algoResult.totalChunks} chunks`);

console.log('\n🎯 If deployment fails, check:');
console.log('1. PRIVATE_KEY environment variable');
console.log('2. RPC endpoint connectivity');
console.log('3. Gas limits');
console.log('4. Contract deployment order');

console.log('\n🎯 DEPLOYMENT SIMULATION COMPLETE');
