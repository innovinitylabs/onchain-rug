import { ethers } from 'ethers';
import fs from 'fs';

async function main() {
    // Connect to local Anvil
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);

    // RugEthFSStorage contract address (fresh deployment)
    const storageAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    const storageABI = [
        "function storeLibrary(string calldata name, string calldata base64Content) external",
        "function libraryExists(string calldata name) external view returns (bool)"
    ];

    const storageContract = new ethers.Contract(storageAddress, storageABI, signer);

    console.log('🚀 Uploading libraries to RugEthFSStorage...');

    try {
        // Upload p5.js
        console.log('📤 Uploading p5.min.js...');
        const p5Content = fs.readFileSync('./data/p5.min.js.gz.b64', 'utf8');
        const tx1 = await storageContract.storeLibrary('p5.min.js.gz', p5Content);
        await tx1.wait();
        console.log('✅ p5.min.js uploaded successfully!');

        // Upload rug algorithm
        console.log('📤 Uploading rug-algorithm.js...');
        const algoContent = fs.readFileSync('./data/rug-algorithm.js.gz.b64', 'utf8');
        const tx2 = await storageContract.storeLibrary('rug-algorithm.js', algoContent);
        await tx2.wait();
        console.log('✅ rug-algorithm.js uploaded successfully!');

        // Verify uploads
        console.log('🔍 Verifying uploads...');
        const p5Exists = await storageContract.libraryExists('p5.min.js.gz');
        const algoExists = await storageContract.libraryExists('rug-algorithm.js');

        console.log(`📊 p5.min.js.gz exists: ${p5Exists}`);
        console.log(`📊 rug-algorithm.js exists: ${algoExists}`);

        if (p5Exists && algoExists) {
            console.log('🎉 All libraries uploaded successfully!');
        } else {
            console.log('❌ Some libraries failed to upload');
        }

    } catch (error) {
        console.error('❌ Upload failed:', error.message);
    }
}

main().catch(console.error);
