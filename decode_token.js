// Simple script to decode token URI and check for JS libraries
const { ethers } = require('ethers');

async function decodeTokenURI() {
    // Connect to local Anvil
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');

    // Contract address
    const contractAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

    // Minimal ABI for tokenURI
    const abi = [
        "function tokenURI(uint256) view returns (string)"
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider);

    try {
        console.log('Getting token URI...');
        const tokenURI = await contract.tokenURI(1);
        console.log('Token URI:', tokenURI.substring(0, 100) + '...');

        // Remove the data:application/json;base64, prefix
        const base64Data = tokenURI.replace('data:application/json;base64,', '');

        // Decode the JSON
        const jsonData = Buffer.from(base64Data, 'base64').toString('utf-8');
        const metadata = JSON.parse(jsonData);

        console.log('\nDecoded metadata:');
        console.log('Name:', metadata.name);
        console.log('Animation URL length:', metadata.animation_url.length);

        // Check if animation_url contains JavaScript libraries
        const html = metadata.animation_url;

        console.log('\nChecking for JavaScript libraries in HTML...');
        console.log('Contains p5.js:', html.includes('rug-p5.js.b64'));
        console.log('Contains algorithm:', html.includes('rug-algorithm.js.b64'));

        // Show first part of HTML to verify structure
        console.log('\nHTML preview (first 500 chars):');
        console.log(html.substring(0, 500));

        // Check for script tags
        const scriptTags = html.match(/<script[^>]*>[\s\S]*?<\/script>/g);
        console.log('\nNumber of script tags found:', scriptTags ? scriptTags.length : 0);

        if (scriptTags) {
            scriptTags.forEach((tag, i) => {
                console.log(`Script ${i + 1}:`, tag.substring(0, 100) + '...');
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

decodeTokenURI();
