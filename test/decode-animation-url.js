#!/usr/bin/env node

/**
 * Decode the animation URL to see what the HTML actually contains
 */

import { ethers } from 'ethers';

const RPC_URL = 'https://sepolia.shape.network';
const ONCHAIN_RUGS_ADDRESS = '0xF6eE290597cCB1e136772122C1c4DcBb6Bf7f089';

async function main() {
    console.log('🔍 DECODING ANIMATION URL');
    console.log('==========================');

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const onchainRugsABI = [
        "function tokenURI(uint256 tokenId) external view returns (string)"
    ];

    const contract = new ethers.Contract(ONCHAIN_RUGS_ADDRESS, onchainRugsABI, provider);

    try {
        console.log('📊 Getting tokenURI for token #1...');

        const tokenURI = await contract.tokenURI(1);
        console.log('✅ tokenURI retrieved');

        // Decode the metadata
        const base64Data = tokenURI.replace('data:application/json;base64,', '');
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        const metadata = JSON.parse(jsonString);

        console.log('\\n📋 Metadata:');
        console.log('- Name:', metadata.name);
        console.log('- Description:', metadata.description);

        if (metadata.animation_url) {
            console.log('\\n🎨 Animation URL:');
            console.log('- Length:', metadata.animation_url.length, 'characters');

            if (metadata.animation_url.startsWith('data:text/html;base64,')) {
                console.log('📝 Animation URL is base64 encoded HTML');

                // Decode the HTML
                const htmlBase64 = metadata.animation_url.replace('data:text/html;base64,', '');
                const decodedHTML = Buffer.from(htmlBase64, 'base64').toString('utf-8');

                console.log('\\n🔍 DECODED HTML ANALYSIS:');
                console.log('=====================================');
                console.log('Total HTML length:', decodedHTML.length, 'characters');

                // Check for script tags
                const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/g;
                const scriptMatches = decodedHTML.match(scriptRegex);

                if (scriptMatches) {
                    console.log('\\n📋 Script Analysis:');
                    console.log('- Number of script tags:', scriptMatches.length);

                    scriptMatches.forEach((script, index) => {
                        console.log(`\\n--- Script ${index + 1} ---`);
                        console.log('Length:', script.length, 'characters');

                        // Check if it's a data URI or inline
                        if (script.includes('data:text/javascript;base64,')) {
                            console.log('❌ Still contains base64 data URI');
                            console.log('Script preview:', script.substring(0, 150) + '...');
                        } else if (script.includes('<script>')) {
                            console.log('✅ Contains inline script tag');
                            console.log('Script preview:', script.substring(0, 150) + '...');
                        } else {
                            console.log('❓ Unknown script format');
                            console.log('Script preview:', script.substring(0, 150) + '...');
                        }
                    });
                } else {
                    console.log('❌ No script tags found in HTML');
                }

                // Check for specific libraries
                if (decodedHTML.includes('p5.js')) {
                    console.log('✅ Contains p5.js reference');
                } else {
                    console.log('❌ Missing p5.js reference');
                }

                if (decodedHTML.includes('onchainrugs.js')) {
                    console.log('✅ Contains onchainrugs.js reference');
                } else {
                    console.log('❌ Missing onchainrugs.js reference');
                }

            } else if (metadata.animation_url.startsWith('data:text/html,')) {
                console.log('✅ Animation URL is inline HTML (this is what we want!)');
            } else {
                console.log('❓ Unknown animation URL format');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main().catch(console.error);
