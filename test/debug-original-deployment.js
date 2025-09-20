#!/usr/bin/env node

/**
 * Debug Original Deployment - Test existing working contracts
 */

import { ethers } from 'ethers';

// Use the ORIGINAL deployed addresses
const RPC_URL = 'https://sepolia.shape.network';
const ONCHAIN_RUGS_ADDRESS = '0xF6eE290597cCB1e136772122C1c4DcBb6Bf7f089';
const SCRIPTY_BUILDER = '0x48a988dC026490c11179D9Eb7f7aBC377CaFA353';
const SCRIPTY_STORAGE = '0x2263cf7764c19070b6fce6e8b707f2bdc35222c9';
const HTML_GENERATOR = '0x480Eb74097EBb58FC7189873480e10D6FA0675A5';

async function main() {
    console.log('🔧 DEBUGGING ORIGINAL DEPLOYMENT');
    console.log('================================');

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Contract ABIs
    const onchainRugsABI = [
        "function tokenURI(uint256 tokenId) external view returns (string)",
        "function totalSupply() external view returns (uint256)",
        "function owner() external view returns (address)",
        "function rugScriptyBuilder() external view returns (address)",
        "function rugEthFSStorage() external view returns (address)",
        "function onchainRugsHTMLGenerator() external view returns (address)"
    ];

    const contract = new ethers.Contract(ONCHAIN_RUGS_ADDRESS, onchainRugsABI, provider);

    try {
        console.log('📊 Contract Status:');
        const totalSupply = await contract.totalSupply();
        console.log('- Total Supply:', totalSupply.toString());

        const owner = await contract.owner();
        console.log('- Owner:', owner);

        const builder = await contract.rugScriptyBuilder();
        console.log('- Scripty Builder:', builder);

        const storage = await contract.rugEthFSStorage();
        console.log('- EthFS Storage:', storage);

        const generator = await contract.onchainRugsHTMLGenerator();
        console.log('- HTML Generator:', generator);

        // Check if addresses match expected
        console.log('\\n✅ Address Verification:');
        console.log('- Builder matches:', builder === SCRIPTY_BUILDER);
        console.log('- Storage matches:', storage === SCRIPTY_STORAGE);
        console.log('- Generator matches:', generator === HTML_GENERATOR);

        if (totalSupply > 0) {
            console.log('\\n🎨 Testing tokenURI for token #1:');

            try {
                const tokenURI = await contract.tokenURI(1);
                console.log('✅ tokenURI generated successfully!');
                console.log('Length:', tokenURI.length, 'characters');

                if (tokenURI.startsWith('data:application/json;base64,')) {
                    console.log('✅ Correct format: base64 encoded JSON');

                    const base64Data = tokenURI.replace('data:application/json;base64,', '');
                    const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
                    const metadata = JSON.parse(jsonString);

                    console.log('\\n📋 Metadata:');
                    console.log('- Name:', metadata.name);
                    console.log('- Description:', metadata.description);
                    console.log('- Animation URL present:', !!metadata.animation_url);

                    if (metadata.animation_url) {
                        console.log('- Animation URL length:', metadata.animation_url.length);

                        if (metadata.animation_url.startsWith('data:text/html;base64,')) {
                            console.log('⚠️  Animation URL is base64 HTML - this might be the issue');
                        } else if (metadata.animation_url.startsWith('data:text/html,')) {
                            console.log('✅ Animation URL is inline HTML - this is correct');
                        }
                    }
                }

            } catch (error) {
                console.log('❌ tokenURI failed:', error.message);
                console.log('🔍 This is the issue we need to fix!');
            }
        } else {
            console.log('\\n⚠️  No NFTs minted yet - need to test minting first');
        }

    } catch (error) {
        console.error('❌ Contract interaction failed:', error.message);
    }
}

main().catch(console.error);
