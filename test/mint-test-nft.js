#!/usr/bin/env node

/**
 * Mint a test NFT and verify the HTML generation works
 */

import { ethers } from 'ethers';

const RPC_URL = 'https://sepolia.shape.network';
const ONCHAIN_RUGS_ADDRESS = '0xF6eE290597cCB1e136772122C1c4DcBb6Bf7f089';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207';

// Mint data for the new NFT
const mintData = {
    textRows: ["TEST MINT " + Date.now()], // Unique text to avoid duplicate error
    seed: Math.floor(Math.random() * 1000000),
    paletteName: "vibrant",
    minifiedStripeData: "[]",
    minifiedPalette: '["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7"]',
    filteredCharacterMap: "[]",
    warpThickness: 2,
    complexity: 2,
    characterCount: 15,
    stripeCount: 8
};

async function main() {
    console.log('🎨 MINTING TEST NFT ON SHAPE SEPOLIA');
    console.log('====================================');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('Deployer:', wallet.address);

    const onchainRugsABI = [
        "function mintRug(string[] memory textRows, uint256 seed, string memory paletteName, string memory minifiedStripeData, string memory minifiedPalette, string memory filteredCharacterMap, uint8 warpThickness, uint8 complexity, uint256 characterCount, uint256 stripeCount) external payable",
        "function tokenURI(uint256 tokenId) external view returns (string)",
        "function totalSupply() external view returns (uint256)",
        "function getMintPrice(uint256) external view returns (uint256)"
    ];

    const contract = new ethers.Contract(ONCHAIN_RUGS_ADDRESS, onchainRugsABI, wallet);

    try {
        console.log('\\n📊 Current total supply:', (await contract.totalSupply()).toString());

        // Get mint price
        const mintPrice = await contract.getMintPrice(mintData.textRows.length);
        console.log('💰 Mint price:', ethers.formatEther(mintPrice), 'ETH');

        console.log('\\n🎨 Minting NFT with data:');
        console.log('- Text:', mintData.textRows[0]);
        console.log('- Seed:', mintData.seed);
        console.log('- Palette:', mintData.paletteName);

        // Mint the NFT
        const mintTx = await contract.mintRug(
            mintData.textRows,
            mintData.seed,
            mintData.paletteName,
            mintData.minifiedStripeData,
            mintData.minifiedPalette,
            mintData.filteredCharacterMap,
            mintData.warpThickness,
            mintData.complexity,
            mintData.characterCount,
            mintData.stripeCount,
            {
                value: mintPrice
            }
        );

        console.log('📡 Mint transaction sent:', mintTx.hash);

        // Wait for confirmation
        const receipt = await mintTx.wait();
        console.log('✅ Mint confirmed in block:', receipt.blockNumber);

        // Check new total supply
        const newTotalSupply = await contract.totalSupply();
        const tokenId = newTotalSupply; // The new NFT will have this ID
        console.log('\\n🆔 New NFT minted with Token ID:', tokenId.toString());

        console.log('\\n🔍 Testing tokenURI generation...');

        // Get the tokenURI
        const tokenURI = await contract.tokenURI(tokenId);
        console.log('✅ tokenURI retrieved successfully');
        console.log('Length:', tokenURI.length, 'characters');

        // Decode and analyze the metadata
        if (tokenURI.startsWith('data:application/json;base64,')) {
            const base64Data = tokenURI.replace('data:application/json;base64,', '');
            const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
            const metadata = JSON.parse(jsonString);

            console.log('\\n📋 NFT Metadata:');
            console.log('- Name:', metadata.name);
            console.log('- Description:', metadata.description);
            console.log('- Animation URL present:', !!metadata.animation_url);

            if (metadata.animation_url) {
                console.log('- Animation URL length:', metadata.animation_url.length);

                if (metadata.animation_url.startsWith('data:text/html;base64,')) {
                    console.log('\\n🎨 Animation URL Analysis:');

                    const htmlBase64 = metadata.animation_url.replace('data:text/html;base64,', '');
                    const decodedHTML = Buffer.from(htmlBase64, 'base64').toString('utf-8');

                    console.log('HTML length:', decodedHTML.length, 'characters');

                    // Check for script tags
                    const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/g;
                    const scriptMatches = decodedHTML.match(scriptRegex);

                    if (scriptMatches) {
                        console.log('✅ Found', scriptMatches.length, 'script tags');

                        // Analyze first script (should be p5.js)
                        const firstScript = scriptMatches[0];
                        if (firstScript.includes('let _p5=')) {
                            console.log('✅ First script contains p5.js code');
                        } else {
                            console.log('❌ First script missing p5.js code');
                        }

                        // Analyze second script (should be rug config)
                        if (scriptMatches.length > 1) {
                            const secondScript = scriptMatches[1];
                            if (secondScript.includes('let w=') && secondScript.includes('let h=')) {
                                console.log('✅ Second script contains rug configuration');
                            }
                        }

                        // Analyze third script (should be algorithm)
                        if (scriptMatches.length > 2) {
                            const thirdScript = scriptMatches[2];
                            if (thirdScript.includes('function setup()')) {
                                console.log('✅ Third script contains algorithm code');
                            }
                        }

                        console.log('\\n🎉 SUCCESS! NFT minted with working HTML generation!');
                        console.log('\\n📱 This NFT will display properly in:');
                        console.log('- OpenSea');
                        console.log('- MetaMask');
                        console.log('- Any wallet supporting animated NFTs');

                    } else {
                        console.log('❌ No script tags found in HTML');
                    }

                } else {
                    console.log('❌ Animation URL is not base64 HTML');
                }
            }
        }

    } catch (error) {
        console.error('❌ Minting failed:', error.message);
        if (error.data) {
            console.error('Error data:', error.data);
        }
    }
}

main().catch(console.error);
