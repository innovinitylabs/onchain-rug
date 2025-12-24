#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main contracts to analyze (excluding libraries and interfaces)
const MAIN_CONTRACTS = [
  'Diamond.sol/Diamond.json',
  'DiamondCutFacet.sol/DiamondCutFacet.json',
  'DiamondLoupeFacet.sol/DiamondLoupeFacet.json',
  'DiamondFramePool.sol/DiamondFramePool.json',
  'FileStore.sol/FileStore.json',
  'ScriptyStorageV2.sol/ScriptyStorageV2.json',
  'ScriptyBuilderV2.sol/ScriptyBuilderV2.json',
  'OnchainRugsHTMLGenerator.sol/OnchainRugsHTMLGenerator.json',
  'RugNFTFacet.sol/RugNFTFacet.json',
  'RugAdminFacet.sol/RugAdminFacet.json',
  'RugAgingFacet.sol/RugAgingFacet.json',
  'RugMaintenanceFacet.sol/RugMaintenanceFacet.json',
  'RugCommerceFacet.sol/RugCommerceFacet.json',
  'RugLaunderingFacet.sol/RugLaunderingFacet.json',
  'RugTransferSecurityFacet.sol/RugTransferSecurityFacet.json',
  'RugMarketplaceFacet.sol/RugMarketplaceFacet.json',
  'ERC721CFacet.sol/ERC721CFacet.json',
  'RugAgentRegistryFacet.sol/RugAgentRegistryFacet.json',
  'RugAgentReputationFacet.sol/RugAgentReputationFacet.json',
  'RugAgentValidationFacet.sol/RugAgentValidationFacet.json',
  'RugReferralRegistryFacet.sol/RugReferralRegistryFacet.json',
];

function getBytecodeSize(artifactPath) {
  try {
    const fullPath = path.join(__dirname, 'out', artifactPath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const artifact = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    // Get deployed bytecode size (runtime bytecode)
    const bytecode = artifact.deployedBytecode?.object || artifact.bytecode?.object;
    if (!bytecode || bytecode === '0x') {
      return null;
    }
    
    // Remove '0x' prefix and calculate size in bytes
    const bytecodeHex = bytecode.replace('0x', '');
    return bytecodeHex.length / 2; // Each byte is 2 hex characters
  } catch (error) {
    console.error(`Error reading ${artifactPath}:`, error.message);
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} bytes`;
}

console.log('=====================================');
console.log('SMART CONTRACT SIZE ANALYSIS');
console.log('=====================================\n');

let totalSize = 0;
const contractSizes = [];

MAIN_CONTRACTS.forEach(contractPath => {
  const size = getBytecodeSize(contractPath);
  if (size !== null) {
    const contractName = path.basename(contractPath, '.json');
    contractSizes.push({ name: contractName, size });
    totalSize += size;
    console.log(`${contractName.padEnd(40)} ${formatBytes(size).padStart(15)}`);
  }
});

console.log('\n=====================================');
console.log(`TOTAL CONTRACT SIZE: ${formatBytes(totalSize)}`);
console.log(`TOTAL CONTRACT SIZE: ${totalSize.toLocaleString()} bytes`);
console.log('=====================================\n');

// Gas information from deployment logs
console.log('=====================================');
console.log('DEPLOYMENT GAS USAGE');
console.log('=====================================\n');

const deploymentLogs = [
  { network: 'Base Sepolia', gas: 36271055, logFile: 'deployment.log' },
  { network: 'Shape Sepolia', gas: 36331941, logFile: 'shape_sepolia_deploy.log' },
  { network: 'Ethereum Sepolia', gas: 44523782, logFile: 'eth_sepolia_deployment.log' },
];

deploymentLogs.forEach(({ network, gas }) => {
  console.log(`${network.padEnd(25)} ${gas.toLocaleString().padStart(15)} gas`);
});

const avgGas = Math.round(deploymentLogs.reduce((sum, d) => sum + d.gas, 0) / deploymentLogs.length);
console.log('\n-------------------------------------');
console.log(`AVERAGE DEPLOYMENT GAS: ${avgGas.toLocaleString()} gas`);
console.log('=====================================\n');

// Summary
console.log('=====================================');
console.log('SUMMARY');
console.log('=====================================');
console.log(`Total Contract Size: ${formatBytes(totalSize)} (${totalSize.toLocaleString()} bytes)`);
console.log(`Average Deployment Gas: ${avgGas.toLocaleString()} gas`);
console.log('=====================================');

