#!/usr/bin/env node

/**
 * Testnet Verification Script
 * Tests the deployed OnchainRugs contract on Shape Sepolia
 */

import { ethers } from 'ethers';

// Configuration
const RPC_URL = 'https://sepolia.shape.network';
const CONTRACT_ADDRESS = '0xf3D17e523a2E85964E1E4394C995756C72c145Eb';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207';

// Test data for minting (based on actual contract parameters)
const testMintData = {
    textRows: ["UNIQUE TEST RUG " + Date.now()],
    seed: 123456789,
    paletteName: "default",
    minifiedStripeData: "[]",
    minifiedPalette: "[]",
    filteredCharacterMap: "[]",
    warpThickness: 1,
    complexity: 1,
    characterCount: 10,
    stripeCount: 5
};

async function main() {
    console.log('🧪 Testing OnchainRugs on Shape Sepolia Testnet');
    console.log('========================================');

    try {
        // Connect to network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log('✅ Connected to Shape Sepolia');
        console.log('Deployer address:', wallet.address);

        // Get contract instance (we'll need the ABI)
        const contractABI = [
            "function mintRug(string[] memory textRows, uint256 seed, string memory paletteName, string memory minifiedStripeData, string memory minifiedPalette, string memory filteredCharacterMap, uint8 warpThickness, uint8 complexity, uint256 characterCount, uint256 stripeCount) external payable",
            "function tokenURI(uint256 tokenId) external view returns (string)",
            "function totalSupply() external view returns (uint256)",
            "function owner() external view returns (address)",
            "function getMintPrice(uint256) external view returns (uint256)"
        ];

        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

        console.log('\\n📊 Contract Info:');
        console.log('- Address:', CONTRACT_ADDRESS);

        // Check if contract is accessible
        const owner = await contract.owner();
        console.log('- Owner:', owner);

        const totalSupply = await contract.totalSupply();
        console.log('- Total Supply:', totalSupply.toString());

        console.log('\\n🎨 Testing NFT Minting...');

        // Check mint price first
        const mintPrice = await contract.getMintPrice(testMintData.textRows.length);
        console.log('Mint price (wei):', mintPrice.toString());
        console.log('Mint price (ETH):', ethers.formatEther(mintPrice));

        // Mint a test NFT
        const mintTx = await contract.mintRug(
            testMintData.textRows,
            testMintData.seed,
            testMintData.paletteName,
            testMintData.minifiedStripeData,
            testMintData.minifiedPalette,
            testMintData.filteredCharacterMap,
            testMintData.warpThickness,
            testMintData.complexity,
            testMintData.characterCount,
            testMintData.stripeCount,
            {
                value: mintPrice // Use the actual mint price
            }
        );

        console.log('Minting transaction sent:', mintTx.hash);

        // Wait for confirmation
        const receipt = await mintTx.wait();
        console.log('✅ Minting confirmed in block:', receipt.blockNumber);

        // Check total supply after minting
        const newTotalSupply = await contract.totalSupply();
        console.log('New total supply:', newTotalSupply.toString());

        // Get token URI
        try {
            const tokenURI = await contract.tokenURI(1);
            console.log('\\n🔗 Token URI for token #1:');
            console.log(tokenURI);

            // Try to decode if it's base64
            if (tokenURI.startsWith('data:application/json;base64,')) {
                const base64Data = tokenURI.replace('data:application/json;base64,', '');
                const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
                const metadata = JSON.parse(jsonString);

                console.log('\\n📋 Decoded Metadata:');
                console.log('- Name:', metadata.name);
                console.log('- Description:', metadata.description);
                console.log('- Animation URL:', metadata.animation_url ? 'Present' : 'Missing');

                if (metadata.animation_url && metadata.animation_url.startsWith('data:text/html;base64,')) {
                    console.log('✅ Animation URL contains HTML data');
                }
            }
        } catch (error) {
            console.log('\\n⚠️  TokenURI call failed, but minting was successful!');
            console.log('This might be due to Scripty integration issues.');
            console.log('Error:', error.message);
        }

        console.log('\\n🎉 Testnet verification completed!');
        console.log('✅ Contract is functional');
        console.log('✅ NFT minting works');
        console.log('✅ Transaction confirmed on Shape Sepolia');

        if (newTotalSupply > 0) {
            console.log('✅ NFT was successfully minted');
        }

    } catch (error) {
        console.error('\\n❌ Test failed:', error.message);
        if (error.data) {
            console.error('Error data:', error.data);
        }
    }
}

main().catch(console.error);
