import { ethers } from 'ethers';

async function testRugScriptyIntegration() {
    console.log('🧪 Testing RugScripty Integration...\n');

    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);

    // Fresh deployed contract addresses
    const contracts = {
        rugScriptyBuilder: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        rugEthFSStorage: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        onchainRugsHTMLGenerator: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        onchainRugs: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
    };

    console.log('📋 Contract Addresses:');
    Object.entries(contracts).forEach(([name, address]) => {
        console.log(`  ${name}: ${address}`);
    });
    console.log();

    try {
        // Test 1: Check if RugScriptyBuilderV2 is accessible
        console.log('🧪 Test 1: RugScriptyBuilderV2 Accessibility');
        const code = await provider.getCode(contracts.rugScriptyBuilder);
        if (code === '0x') {
            console.log('❌ RugScriptyBuilderV2 contract code is empty');
        } else {
            console.log('✅ RugScriptyBuilderV2 contract deployed');
        }

        // Test 2: Check if RugEthFSStorage is accessible
        console.log('\n🧪 Test 2: RugEthFSStorage Accessibility');
        const storageCode = await provider.getCode(contracts.rugEthFSStorage);
        if (storageCode === '0x') {
            console.log('❌ RugEthFSStorage contract code is empty');
        } else {
            console.log('✅ RugEthFSStorage contract deployed');
        }

        // Test 3: Check if OnchainRugs is accessible
        console.log('\n🧪 Test 3: OnchainRugs Accessibility');
        const rugsCode = await provider.getCode(contracts.onchainRugs);
        if (rugsCode === '0x') {
            console.log('❌ OnchainRugs contract code is empty');
        } else {
            console.log('✅ OnchainRugs contract deployed');
        }

        // Test 4: Check RugEthFSStorage for libraries
        if (storageCode !== '0x') {
            console.log('\n🧪 Test 4: Library Verification');
            const storageABI = [
                "function libraryExists(string calldata name) external view returns (bool)"
            ];
            const storageContract = new ethers.Contract(contracts.rugEthFSStorage, storageABI, provider);

            try {
                const p5Exists = await storageContract.libraryExists('p5.min.js.gz');
                const algoExists = await storageContract.libraryExists('rug-algorithm.js');

                console.log(`📊 p5.min.js.gz exists: ${p5Exists}`);
                console.log(`📊 rug-algorithm.js exists: ${algoExists}`);

                if (p5Exists && algoExists) {
                    console.log('✅ All required libraries are uploaded');
                } else {
                    console.log('❌ Missing required libraries');
                }
            } catch (error) {
                console.log('❌ Error checking libraries:', error.message);
            }
        }

        console.log('\n🎉 RugScripty Integration Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRugScriptyIntegration().catch(console.error);
