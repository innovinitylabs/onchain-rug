#!/usr/bin/env node

/**
 * Comprehensive debug test for OnchainRugs metadata generation
 * Tests all components: Storage → HTML Generator → NFT Contract → tokenURI
 */

import { ethers } from 'ethers';

const RPC_URL = 'https://sepolia.shape.network';

// Your deployed contract addresses (update these with your actual addresses)
const ONCHAIN_RUGS_ADDRESS = '0xf5d5E3eFeF9618D4e6884963E5cCe7572Bb100FC'; // Updated NFT contract address
const HTML_GENERATOR_ADDRESS = '0x4274c776F24aAA8C8AE07C780D0E632E82083b88'; // Updated HTML generator address
const SCRIPTY_BUILDER = '0x435D2ffDfA9fc1A3405a5E87691003F10E5d5Dd3'; // Updated ScriptyBuilder
const SCRIPTY_STORAGE = '0xaCD87d7a2DD0dC2294CD0C8c25c9cae598B890f1'; // Updated ScriptyStorage

async function main() {
    console.log('🔍 COMPREHENSIVE ONCHAINRUGS DEBUG TEST');
    console.log('======================================');
    console.log('Testing: Storage → HTML Generator → NFT Contract → tokenURI');
    console.log('');

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // STEP 1: Check what's in ScriptyStorage
    await testScriptyStorage(provider);

    // STEP 2: Test HTML generator directly
    await testHTMLGenerator(provider);

    // STEP 3: Test NFT contract (if we can find the right address)
    await testNFTContract(provider);

    console.log('\n🎯 DEBUG COMPLETE - Check results above for the issue!');
}

async function testScriptyStorage(provider) {
    console.log('📊 STEP 1: Checking ScriptyStorage Contents');
    console.log('==========================================');

    const storageABI = [
        "function contents(string calldata name) external view returns (bool isFrozen, address owner, uint256 size, bytes memory details, address[] memory chunks)"
    ];

    const storage = new ethers.Contract(SCRIPTY_STORAGE, storageABI, provider);

    // Test the library names your HTML generator expects
    const expectedLibraries = ["rug-p5.js", "rug.js"];

    for (const libName of expectedLibraries) {
        console.log(`\n🔍 Checking library: "${libName}"`);
        try {
            const content = await storage.contents(libName);
            console.log(`✅ FOUND: "${libName}"`);
            console.log(`   - Frozen: ${content[0]}`);
            console.log(`   - Size: ${content[2].toString()} bytes`);
            console.log(`   - Chunks: ${content[4].length}`);
        } catch (error) {
            console.log(`❌ MISSING: "${libName}" - ${error.message}`);

            // Try alternative names that might be in storage
            const alternatives = [
                libName + ".b64",
                "onchainrugs-" + libName,
                "onchainrugs-" + libName + ".b64"
            ];

            console.log(`   Trying alternatives...`);
            for (const alt of alternatives) {
                try {
                    const altContent = await storage.contents(alt);
                    console.log(`   ✅ FOUND ALTERNATIVE: "${alt}" (${altContent[2].toString()} bytes)`);
                } catch (altError) {
                    // Alternative not found, continue
                }
            }
        }
    }
}

async function testHTMLGenerator(provider) {
    console.log('\n🎨 STEP 2: Testing HTML Generator');
    console.log('================================');

    const htmlGeneratorABI = [
        "function generateProjectHTML(bytes memory projectData, uint256 tokenId, address scriptyBuilder, address scriptyStorage) external view returns (string memory)",
        "function getRequiredLibraries() external pure returns (string[] memory)"
    ];

    const htmlGenerator = new ethers.Contract(HTML_GENERATOR_ADDRESS, htmlGeneratorABI, provider);

    try {
        // First check what libraries the HTML generator expects
        console.log('📚 Checking getRequiredLibraries()...');
        const libraries = await htmlGenerator.getRequiredLibraries();
        console.log(`HTML generator expects ${libraries.length} libraries:`);
        libraries.forEach((lib, i) => console.log(`   ${i+1}. "${lib}"`));

        // Test with simple rug data
        const testRugData = {
            seed: 123456789,
            paletteName: "test",
            minifiedPalette: '["#FF0000","#00FF00","#0000FF"]',
            minifiedStripeData: "[]",
            textRows: ["DEBUG TEST"],
            warpThickness: 2,
            mintTime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
            filteredCharacterMap: "{}",
            complexity: 1,
            characterCount: 5,
            stripeCount: 3
        };

        console.log('\n🧪 Testing HTML generation...');
        console.log('Test data:', JSON.stringify(testRugData, null, 2));

        const rugDataEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
            [
                'uint256', 'string', 'string', 'string', 'string[]',
                'uint8', 'uint256', 'string', 'uint8', 'uint256', 'uint256'
            ],
            [
                testRugData.seed, testRugData.paletteName, testRugData.minifiedPalette,
                testRugData.minifiedStripeData, testRugData.textRows, testRugData.warpThickness,
                testRugData.mintTime, testRugData.filteredCharacterMap, testRugData.complexity,
                testRugData.characterCount, testRugData.stripeCount
            ]
        );

        console.log(`Encoded data length: ${rugDataEncoded.length} bytes`);

        const htmlResult = await htmlGenerator.generateProjectHTML(
            rugDataEncoded,
            1, // tokenId
            SCRIPTY_BUILDER,
            SCRIPTY_STORAGE
        );

        console.log('✅ HTML generation successful!');
        console.log(`Result length: ${htmlResult.length} characters`);

        if (htmlResult.startsWith('data:text/html;base64,')) {
            console.log('📄 HTML is base64 encoded');
            const base64Data = htmlResult.replace('data:text/html;base64,', '');
            const decodedHTML = Buffer.from(base64Data, 'base64').toString('utf-8');
            console.log(`Decoded HTML length: ${decodedHTML.length} characters`);

            // Check if libraries are referenced correctly
            if (decodedHTML.includes('rug-p5.js')) {
                console.log('✅ HTML contains reference to "rug-p5.js"');
            } else {
                console.log('❌ HTML missing reference to "rug-p5.js"');
            }

            if (decodedHTML.includes('rug.js')) {
                console.log('✅ HTML contains reference to "rug.js"');
            } else {
                console.log('❌ HTML missing reference to "rug.js"');
            }

        } else {
            console.log('📄 HTML appears to be inline (not base64)');
        }

    } catch (error) {
        console.log('❌ HTML generation failed:', error.message);
        console.log('This indicates Scripty cannot find the required libraries!');
    }
}

async function testNFTContract(provider) {
    console.log('\n🖼️  STEP 3: Testing NFT Contract');
    console.log('==============================');

    // Try to find the actual NFT contract address
    // For now, let's assume the HTML generator address might be the NFT contract
    const possibleNFTAddresses = [ONCHAIN_RUGS_ADDRESS, HTML_GENERATOR_ADDRESS];

    for (const address of possibleNFTAddresses) {
        console.log(`\n🔍 Testing address: ${address}`);

        try {
            // Try ERC721 interface
            const erc721ABI = [
                "function tokenURI(uint256 tokenId) external view returns (string memory)",
                "function ownerOf(uint256 tokenId) external view returns (address)",
                "function totalSupply() external view returns (uint256)"
            ];

            const contract = new ethers.Contract(address, erc721ABI, provider);

            // Check if this is an NFT contract
            const totalSupply = await contract.totalSupply();
            console.log(`✅ Contract has totalSupply: ${totalSupply.toString()}`);

            if (totalSupply > 0) {
                console.log('🎯 Found NFT contract!');

                try {
                    const tokenURI = await contract.tokenURI(1);
                    console.log('✅ tokenURI(1) successful!');
                    console.log(`Result length: ${tokenURI.length} characters`);

                    if (tokenURI.startsWith('data:application/json;base64,')) {
                        console.log('📄 tokenURI is base64 encoded JSON');

                        const base64Data = tokenURI.replace('data:application/json;base64,', '');
                        const decodedJSON = Buffer.from(base64Data, 'base64').toString('utf-8');
                        const metadata = JSON.parse(decodedJSON);

                        console.log('📊 Decoded metadata:');
                        console.log(`   - Name: ${metadata.name || 'MISSING'}`);
                        console.log(`   - Description: ${metadata.description || 'MISSING'}`);
                        console.log(`   - Has animation_url: ${!!metadata.animation_url}`);

                        if (metadata.animation_url) {
                            console.log(`   - animation_url length: ${metadata.animation_url.length} characters`);
                            if (metadata.animation_url.startsWith('data:text/html;base64,')) {
                                console.log('   ✅ animation_url is base64 HTML (good!)');
                            } else {
                                console.log('   ⚠️  animation_url format unexpected');
                            }
                        } else {
                            console.log('   ❌ MISSING animation_url!');
                        }
                    } else {
                        console.log('⚠️  tokenURI format unexpected');
                    }

                } catch (tokenURIError) {
                    console.log('❌ tokenURI(1) failed:', tokenURIError.message);
                }

                // Don't check other addresses if we found a working NFT contract
                break;
            }

        } catch (error) {
            console.log(`❌ Not an NFT contract or error: ${error.message}`);
        }
    }
}

main().catch(console.error);
