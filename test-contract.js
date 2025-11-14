import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { shapeSepolia } from './config/chains.js'; // Adjust path as needed

const client = createPublicClient({
  chain: shapeSepolia,
  transport: http('https://sepolia.shape.network')
});

// Test getMaintenanceOptions
async function test() {
  try {
    const result = await client.readContract({
      address: '0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325',
      abi: [{
        "inputs": [{"name": "tokenId", "type": "uint256"}],
        "name": "getMaintenanceOptions",
        "outputs": [
          {"name": "canClean", "type": "bool"},
          {"name": "canRestore", "type": "bool"},
          {"name": "needsMaster", "type": "bool"},
          {"name": "cleaningCost", "type": "uint256"},
          {"name": "restorationCost", "type": "uint256"},
          {"name": "masterCost", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      }],
      functionName: 'getMaintenanceOptions',
      args: [2n]
    });
    
    console.log('getMaintenanceOptions result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
