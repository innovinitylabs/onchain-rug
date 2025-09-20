#!/usr/bin/env node

/**
 * Check what's stored in Scripty storage
 */

import { ethers } from 'ethers';

const RPC_URL = 'https://sepolia.shape.network';
const SCRIPTY_STORAGE = '0x2263cf7764c19070b6fce6e8b707f2bdc35222c9';

async function main() {
    console.log('🔍 CHECKING SCRIPTY STORAGE CONTENT');
    console.log('===================================');

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const storageABI = [
        "function getContent(string calldata name) external view returns (bytes memory, address, uint256, bytes memory, address[] memory)",
        "function contents(string calldata name) external view returns (bool isFrozen, address owner, uint256 size, bytes memory details, address[] memory chunks)"
    ];

    const storage = new ethers.Contract(SCRIPTY_STORAGE, storageABI, provider);

    try {
        console.log('📊 Checking p5.js library...');
        try {
            const p5Content = await storage.contents("onchainrugs-p5.js.b64");
            console.log('✅ p5.js found:');
            console.log('- Frozen:', p5Content[0]);
            console.log('- Owner:', p5Content[1]);
            console.log('- Size:', p5Content[2].toString(), 'bytes');
            console.log('- Chunks:', p5Content[4].length);
        } catch (error) {
            console.log('❌ p5.js not found or error:', error.message);
        }

        console.log('\\n📊 Checking algorithm library...');
        try {
            const algoContent = await storage.contents("onchainrugs.js.b64");
            console.log('✅ Algorithm found:');
            console.log('- Frozen:', algoContent[0]);
            console.log('- Owner:', algoContent[1]);
            console.log('- Size:', algoContent[2].toString(), 'bytes');
            console.log('- Chunks:', algoContent[4].length);
        } catch (error) {
            console.log('❌ Algorithm not found or error:', error.message);
        }

        console.log('\\n📊 Checking old library names...');
        try {
            const oldP5 = await storage.contents("rug-p5.js.b64");
            console.log('⚠️  Old p5.js found (wrong name)');
        } catch (error) {
            console.log('✅ Old p5.js not found (good)');
        }

        try {
            const oldAlgo = await storage.contents("rug-algo.js.b64");
            console.log('⚠️  Old algorithm found (wrong name)');
        } catch (error) {
            console.log('✅ Old algorithm not found (good)');
        }

    } catch (error) {
        console.error('❌ Storage check failed:', error.message);
    }
}

main().catch(console.error);
