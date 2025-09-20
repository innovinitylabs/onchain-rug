#!/usr/bin/env node

/**
 * Test the HTML generator directly to see what it produces
 */

import { ethers } from 'ethers';

const RPC_URL = 'https://sepolia.shape.network';
const HTML_GENERATOR_ADDRESS = '0x8E05f5E7592C648BE513d5e752aD767417AE732d';

// Existing Scripty addresses
const SCRIPTY_BUILDER = '0x48a988dC026490c11179D9Eb7f7aBC377CaFA353';
const SCRIPTY_STORAGE = '0x2263cf7764c19070b6fce6e8b707f2bdc35222c9';

async function main() {
    console.log('🧪 TESTING HTML GENERATOR DIRECTLY');
    console.log('==================================');

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Test data that matches the RugData struct
    const testRugData = {
        seed: 123456789,
        paletteName: "default",
        minifiedPalette: "[]",
        minifiedStripeData: "[]",
        textRows: ["TEST RUG"],
        warpThickness: 1,
        mintTime: Math.floor(Date.now() / 1000),
        filteredCharacterMap: "[]",
        complexity: 1,
        characterCount: 10,
        stripeCount: 5
    };

    // Encode the test data
    const rugDataEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
        [
            'uint256',    // seed
            'string',     // paletteName
            'string',     // minifiedPalette
            'string',     // minifiedStripeData
            'string[]',   // textRows
            'uint8',      // warpThickness
            'uint256',    // mintTime
            'string',     // filteredCharacterMap
            'uint8',      // complexity
            'uint256',    // characterCount
            'uint256'     // stripeCount
        ],
        [
            testRugData.seed,
            testRugData.paletteName,
            testRugData.minifiedPalette,
            testRugData.minifiedStripeData,
            testRugData.textRows,
            testRugData.warpThickness,
            testRugData.mintTime,
            testRugData.filteredCharacterMap,
            testRugData.complexity,
            testRugData.characterCount,
            testRugData.stripeCount
        ]
    );

    console.log('📊 Test Rug Data:');
    console.log('- Seed:', testRugData.seed);
    console.log('- Text:', testRugData.textRows[0]);
    console.log('- Encoded length:', rugDataEncoded.length, 'bytes');

    // Test the HTML generator
    const htmlGeneratorABI = [
        "function generateProjectHTML(bytes memory projectData, uint256 tokenId, address scriptyBuilder, address scriptyStorage) external view returns (string memory)"
    ];

    const htmlGenerator = new ethers.Contract(HTML_GENERATOR_ADDRESS, htmlGeneratorABI, provider);

    try {
        console.log('\\n🎨 Calling HTML generator...');

        const htmlResult = await htmlGenerator.generateProjectHTML(
            rugDataEncoded,
            1, // tokenId
            SCRIPTY_BUILDER,
            SCRIPTY_STORAGE
        );

        console.log('✅ HTML generated successfully!');
        console.log('HTML length:', htmlResult.length, 'characters');

        // Check if it's base64 or inline
        if (htmlResult.startsWith('data:text/html;base64,')) {
            console.log('❌ HTML is base64 encoded');

            // Decode and examine
            const base64Data = htmlResult.replace('data:text/html;base64,', '');
            const decodedHTML = Buffer.from(base64Data, 'base64').toString('utf-8');

            console.log('Decoded HTML length:', decodedHTML.length);
            console.log('\\n🔍 First 500 characters of decoded HTML:');
            console.log(decodedHTML.substring(0, 500));

            // Check for script tags
            const scriptMatches = decodedHTML.match(/<script[^>]*>[\s\S]*?<\/script>/g);
            if (scriptMatches) {
                console.log('\\n📋 Script tags found:', scriptMatches.length);
                console.log('First script tag:');
                console.log(scriptMatches[0].substring(0, 200) + '...');
            }

        } else if (htmlResult.startsWith('data:text/html,')) {
            console.log('✅ HTML is inline (not base64)');

            const inlineHTML = htmlResult.replace('data:text/html,', '');
            console.log('Inline HTML length:', inlineHTML.length);

            // Check for script tags
            const scriptMatches = inlineHTML.match(/<script[^>]*>[\s\S]*?<\/script>/g);
            if (scriptMatches) {
                console.log('\\n📋 Script tags found:', scriptMatches.length);
                console.log('First script tag:');
                console.log(scriptMatches[0].substring(0, 200) + '...');
            }
        } else {
            console.log('❓ Unknown HTML format');
            console.log('First 200 characters:', htmlResult.substring(0, 200));
        }

    } catch (error) {
        console.error('❌ HTML generation failed:', error.message);
        console.error('Error data:', error.data);
    }
}

main().catch(console.error);
