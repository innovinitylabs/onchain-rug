#!/usr/bin/env node

/**
 * Verify that the deployment is actually using updated bytecode
 */

import { ethers } from 'ethers';

const RPC_URL = 'https://sepolia.shape.network';
const HTML_GENERATOR_ADDRESS = '0xD82C5F5748a94291a395a9955De22fF076CbE146';

async function main() {
    console.log('🔍 VERIFYING DEPLOYMENT BYTECODE');
    console.log('================================');

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Get the deployed bytecode
    const bytecode = await provider.getCode(HTML_GENERATOR_ADDRESS);
    console.log(`Deployed bytecode length: ${bytecode.length} bytes`);

    // Check if bytecode contains the .b64 string (indicating old version)
    const hasOldB64 = bytecode.includes('rug-p5.js.b64') || bytecode.includes('rug.js.b64');
    const hasNewNames = bytecode.includes('rug-p5.js') || bytecode.includes('rug.js');

    console.log('\n📊 BYTECODE ANALYSIS:');
    console.log(`Contains .b64 names: ${hasOldB64}`);
    console.log(`Contains new names: ${hasNewNames}`);

    if (hasOldB64 && !hasNewNames) {
        console.log('❌ DEPLOYMENT USED OLD BYTECODE!');
        console.log('The deployed contract still has .b64 extensions');
    } else if (hasNewNames && !hasOldB64) {
        console.log('✅ DEPLOYMENT USED NEW BYTECODE!');
        console.log('The deployed contract has new names');
    } else {
        console.log('🤔 MIXED RESULTS - investigating...');
    }

    // Check the actual function behavior
    const htmlGeneratorABI = [
        "function getRequiredLibraries() external pure returns (string[] memory)"
    ];

    const htmlGenerator = new ethers.Contract(HTML_GENERATOR_ADDRESS, htmlGeneratorABI, provider);

    try {
        const libraries = await htmlGenerator.getRequiredLibraries();
        console.log('\n📚 DEPLOYED CONTRACT REPORTS:');
        libraries.forEach((lib, i) => console.log(`   ${i+1}. "${lib}"`));

        const hasOldLibs = libraries.some(lib => lib.includes('.b64'));
        const hasNewLibs = libraries.some(lib => !lib.includes('.b64'));

        console.log('\n🎯 VERDICT:');
        if (hasOldLibs) {
            console.log('❌ DEPLOYED CONTRACT IS USING OLD VERSION');
            console.log('Despite local compilation, testnet has old bytecode');
        } else {
            console.log('✅ DEPLOYED CONTRACT IS USING NEW VERSION');
            console.log('But libraries might still be empty in storage');
        }

    } catch (error) {
        console.log('❌ CANNOT CALL DEPLOYED CONTRACT:', error.message);
    }

    console.log('\n💡 POSSIBLE ISSUES:');
    console.log('1. Foundry cached old bytecode despite clean');
    console.log('2. Deployment used old artifact files');
    console.log('3. Contract was redeployed but libraries overwrote');
    console.log('4. Network delay in bytecode propagation');
}

main().catch(console.error);
