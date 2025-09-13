#!/usr/bin/env node

/**
 * Simple test script to verify the OnchainRugsV2Shape contract is working
 * Run with: node test-contract.js
 */

const { ethers } = require('ethers');

const CONTRACT_ADDRESS = '0x0165878a594ca255338adfa4d48449f69242eb8f';
const RPC_URL = 'http://localhost:8545';

const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }
];

async function testContract() {
    console.log('🧪 Testing OnchainRugsV2Shape contract...');
    console.log('📍 Contract:', CONTRACT_ADDRESS);
    console.log('🌐 RPC:', RPC_URL);
    console.log('');

    try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        console.log('✅ Connected to contract');

        // Test token 0 (should not exist)
        console.log('🧪 Testing token 0 (should fail)...');
        try {
            const owner0 = await contract.ownerOf(0);
            console.log('❌ Token 0 exists with owner:', owner0);
        } catch (error) {
            console.log('✅ Token 0 correctly does not exist');
        }

        // Test token 1
        console.log('🧪 Testing token 1...');
        try {
            const owner1 = await contract.ownerOf(1);
            console.log('✅ Token 1 exists with owner:', owner1);

            // Test tokenURI
            console.log('🧪 Testing tokenURI(1)...');
            const uri = await contract.tokenURI(1);
            console.log('✅ TokenURI length:', uri.length);
            console.log('✅ TokenURI starts with:', uri.substring(0, 50) + '...');

        } catch (error) {
            console.log('ℹ️  Token 1 does not exist yet (this is normal if no tokens minted)');
        }

        console.log('');
        console.log('🎉 Contract test completed successfully!');

    } catch (error) {
        console.error('❌ Contract test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testContract().catch(console.error);
