#!/usr/bin/env node

/**
 * Verify that the JavaScript files are readable and have content
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const dataDir = './data';

console.log('🔍 VERIFYING JAVASCRIPT FILES');
console.log('============================');

const files = [
    'rug-p5.js',
    'rug.js',
    'rug-p5.js.b64',
    'rug-algo.js.b64'
];

files.forEach(file => {
    try {
        const filePath = join(dataDir, file);
        const content = readFileSync(filePath, 'utf8');

        console.log(`\n📄 ${file}:`);
        console.log(`   Path: ${filePath}`);
        console.log(`   Size: ${content.length} characters`);
        console.log(`   First 100 chars: "${content.substring(0, 100)}..."`);

        if (content.length === 0) {
            console.log(`   ❌ EMPTY FILE!`);
        } else if (content.length < 1000) {
            console.log(`   ⚠️  VERY SMALL FILE (${content.length} chars)`);
        } else {
            console.log(`   ✅ Looks good`);
        }

    } catch (error) {
        console.log(`\n❌ ${file}: FILE NOT FOUND - ${error.message}`);
    }
});

console.log('\n🎯 VERIFICATION COMPLETE');
