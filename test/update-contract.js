#!/usr/bin/env node

/**
 * Update OnchainRugs contract to use the new fixed HTML generator
 */

import { ethers } from 'ethers';

const RPC_URL = 'https://sepolia.shape.network';
const ONCHAIN_RUGS_ADDRESS = '0xF6eE290597cCB1e136772122C1c4DcBb6Bf7f089';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207';

// FIXED HTML Generator address (latest deployment)
const NEW_HTML_GENERATOR = '0x2C6F61274AeEbE16Bb6C117e61fdE88d5e18714A';

// Existing addresses (keep these the same)
const EXISTING_BUILDER = '0x48a988dC026490c11179D9Eb7f7aBC377CaFA353';
const EXISTING_STORAGE = '0x2263cf7764c19070b6fce6e8b707f2bdc35222c9';

async function main() {
    console.log('🔄 UPDATING ONCHAIN RUGS CONTRACT');
    console.log('==================================');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('Deployer:', wallet.address);

    const onchainRugsABI = [
        "function setRugScriptyContracts(address _rugScriptyBuilder, address _rugEthFSStorage, address _onchainRugsHTMLGenerator) external",
        "function rugScriptyBuilder() external view returns (address)",
        "function rugEthFSStorage() external view returns (address)",
        "function onchainRugsHTMLGenerator() external view returns (address)"
    ];

    const contract = new ethers.Contract(ONCHAIN_RUGS_ADDRESS, onchainRugsABI, wallet);

    try {
        console.log('\\n📊 Current contract configuration:');
        const currentBuilder = await contract.rugScriptyBuilder();
        const currentStorage = await contract.rugEthFSStorage();
        const currentGenerator = await contract.onchainRugsHTMLGenerator();

        console.log('Builder:', currentBuilder);
        console.log('Storage:', currentStorage);
        console.log('Generator:', currentGenerator);

        console.log('\\n🔧 Updating to new HTML generator...');
        console.log('New Generator:', NEW_HTML_GENERATOR);

        // Update the contract
        const tx = await contract.setRugScriptyContracts(
            EXISTING_BUILDER,
            EXISTING_STORAGE,
            NEW_HTML_GENERATOR
        );

        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('✅ Update confirmed in block:', receipt.blockNumber);

        // Verify the update
        console.log('\\n🔍 Verifying update:');
        const newGenerator = await contract.onchainRugsHTMLGenerator();
        console.log('Updated Generator:', newGenerator);
        console.log('Update successful:', newGenerator === NEW_HTML_GENERATOR);

        console.log('\\n🎉 CONTRACT UPDATED SUCCESSFULLY!');
        console.log('Now tokenURI should generate inline UTF-8 scripts instead of base64!');

    } catch (error) {
        console.error('❌ Update failed:', error.message);
    }
}

main().catch(console.error);
