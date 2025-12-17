// Ethereum Mainnet Deployment Cost Calculator for OnchainRugs
// Based on the Shape Sepolia deployment script analysis

// Current market conditions (as provided by user)
const ETH_PRICE_USD = 3000;  // $3,000 per ETH
const GAS_PRICE_GWEI = 0.15;  // 0.15 gwei

// Gas cost calculator
function gweiToEth(gwei) {
  return gwei / 1e9;
}

function ethToUsd(eth) {
  return eth * ETH_PRICE_USD;
}

function calculateGasCost(gasAmount, gasPriceGwei = GAS_PRICE_GWEI) {
  const ethCost = gasAmount * gweiToEth(gasPriceGwei);
  return {
    gas: gasAmount,
    eth: ethCost,
    usd: ethToUsd(ethCost)
  };
}

// Contract deployment gas estimates (based on actual deployment logs)
// Actual deployment on Base Sepolia used ~36.3M gas total
const CONTRACT_GAS_COSTS = {
  // Infrastructure contracts
  fileStore: 200000,        // FileStore deployment (more complex than estimated)
  scriptyStorage: 350000,   // ScriptyStorageV2 deployment (larger contract)
  scriptyBuilder: 200000,   // ScriptyBuilderV2 deployment
  htmlGenerator: 150000,    // HTMLGenerator deployment

  // Diamond system
  diamondCutFacet: 150000,  // DiamondCutFacet deployment
  diamondLoupeFacet: 200000, // DiamondLoupeFacet deployment
  diamond: 500000,           // Main diamond contract (stores initial facet + selector mappings)

  // Rug facets (actual sizes vary, but these are more realistic)
  // Total: 9 facets (including DiamondLoupeFacet which is counted separately above)
  // Rug facets: NFT(32 selectors), Admin(23), Aging(10), Maintenance(19), Commerce(23), Laundering(8), TransferSecurity(9), Marketplace(8)
  rugNFTFacet: 400000,       // RugNFTFacet - largest facet with 32 selectors
  rugAdminFacet: 300000,     // RugAdminFacet - 23 selectors
  rugAgingFacet: 200000,      // RugAgingFacet - 10 selectors
  rugMaintenanceFacet: 300000, // RugMaintenanceFacet - 19 selectors
  rugCommerceFacet: 300000,  // RugCommerceFacet - 23 selectors
  rugLaunderingFacet: 200000, // RugLaunderingFacet - 8 selectors
  rugTransferSecurityFacet: 200000, // RugTransferSecurityFacet - 9 selectors
  rugMarketplaceFacet: 200000, // RugMarketplaceFacet - 8 selectors

  // Total facets to deploy: 9 facets (8 Rug facets + DiamondLoupeFacet)
  totalFacets: 9,

  // Diamond Frame Pool
  diamondFramePool: 250000  // DiamondFramePool deployment
};

// File upload gas costs
const FILE_UPLOAD_COSTS = {
  // Base cost per file upload operation (more realistic)
  createContent: 80000,     // scriptyStorage.createContent() (includes storage writes)
  addChunk: 50000,          // scriptyStorage.addChunkToContent() per 20KB chunk (storage is expensive)
  freezeContent: 40000,     // scriptyStorage.freezeContent() (final storage operations)

  // File sizes (from ls -la output)
  fileSizes: {
    'rug-p5.js': 8331,
    'rug-algo.js': 10315,
    'rug-frame.js': 2339
  }
};

// Configuration/initialization gas costs (more realistic for Diamond proxy calls)
const CONFIG_GAS_COSTS = {
  initializeERC721: 100000,      // More expensive through Diamond proxy
  setScriptyContracts: 120000,   // Multiple storage writes
  updateMintPricing: 100000,     // Array storage updates
  updateCollectionCap: 80000,    // Storage write
  updateWalletLimit: 80000,      // Storage write
  updateAgingThresholds: 120000, // Array storage updates
  updateServicePricing: 100000,  // Array storage updates
  updateFrameThresholds: 100000, // Array storage updates
  configureRoyalties: 200000,    // Complex royalty configuration with arrays
  setLaunderingEnabled: 80000,   // Storage write
  setPoolContract: 100000,       // Set pool contract address
  setPoolPercentage: 80000,      // Set pool percentage

  // Diamond cuts (adding facets)
  // Each diamond cut stores function selectors in storage (~20k gas per selector for cold storage)
  // Total selectors: 137 (5+32+23+10+19+23+8+9+8)
  // Diamond cuts are VERY expensive because they:
  // - Store selector -> facet mappings in storage (~20k gas per selector for cold storage = ~2.74M gas)
  // - Update facet address arrays
  // - Have significant transaction overhead
  // Based on actual deployment: 36.3M total gas, most of it is diamond cuts
  diamondCut: 2500000,     // Per facet addition (realistic based on actual deployment)
  totalDiamondCuts: 9       // 9 facets to add (DiamondLoupeFacet + 8 Rug facets)
};

console.log('=====================================');
console.log('ETHEREUM MAINNET DEPLOYMENT COST CALCULATOR');
console.log('=====================================');
console.log(`ETH Price: $${ETH_PRICE_USD} | Gas Price: ${GAS_PRICE_GWEI} gwei`);
console.log('=====================================');
console.log('NOTE: Based on actual Base Sepolia deployment (~36.3M gas)');
console.log('Diamond proxy with 9 facets and 137 function selectors is gas-intensive');
console.log('=====================================\n');

// 1. Infrastructure Deployment
console.log('1. INFRASTRUCTURE DEPLOYMENT');
const infraContracts = ['fileStore', 'scriptyStorage', 'scriptyBuilder', 'htmlGenerator'];
let infraTotalGas = 0;

infraContracts.forEach(contract => {
  const gas = CONTRACT_GAS_COSTS[contract];
  const cost = calculateGasCost(gas);
  console.log(`   ${contract}: ${gas.toLocaleString()} gas = ${cost.eth.toFixed(4)} ETH = $${cost.usd.toFixed(2)}`);
  infraTotalGas += gas;
});

const infraCost = calculateGasCost(infraTotalGas);
console.log(`   Subtotal: ${infraCost.gas.toLocaleString()} gas = ${infraCost.eth.toFixed(4)} ETH = $${infraCost.usd.toFixed(2)}\n`);

// 2. Diamond System Deployment
console.log('2. DIAMOND SYSTEM DEPLOYMENT');
const diamondContracts = ['diamondCutFacet', 'diamondLoupeFacet', 'diamond'];
let diamondTotalGas = 0;

diamondContracts.forEach(contract => {
  const gas = CONTRACT_GAS_COSTS[contract];
  const cost = calculateGasCost(gas);
  console.log(`   ${contract}: ${gas.toLocaleString()} gas = ${cost.eth.toFixed(4)} ETH = $${cost.usd.toFixed(2)}`);
  diamondTotalGas += gas;
});

const diamondCost = calculateGasCost(diamondTotalGas);
console.log(`   Subtotal: ${diamondCost.gas.toLocaleString()} gas = ${diamondCost.eth.toFixed(4)} ETH = $${diamondCost.usd.toFixed(2)}\n`);

// 3. Rug Facets Deployment
console.log('3. RUG FACETS DEPLOYMENT (8 Rug facets)');
const facetsGas = CONTRACT_GAS_COSTS.rugNFTFacet +
                  CONTRACT_GAS_COSTS.rugAdminFacet +
                  CONTRACT_GAS_COSTS.rugAgingFacet +
                  CONTRACT_GAS_COSTS.rugMaintenanceFacet +
                  CONTRACT_GAS_COSTS.rugCommerceFacet +
                  CONTRACT_GAS_COSTS.rugLaunderingFacet +
                  CONTRACT_GAS_COSTS.rugTransferSecurityFacet +
                  CONTRACT_GAS_COSTS.rugMarketplaceFacet;
const facetsCost = calculateGasCost(facetsGas);
console.log(`   RugNFTFacet (32 selectors): ${CONTRACT_GAS_COSTS.rugNFTFacet.toLocaleString()} gas`);
console.log(`   RugAdminFacet (23 selectors): ${CONTRACT_GAS_COSTS.rugAdminFacet.toLocaleString()} gas`);
console.log(`   RugAgingFacet (10 selectors): ${CONTRACT_GAS_COSTS.rugAgingFacet.toLocaleString()} gas`);
console.log(`   RugMaintenanceFacet (19 selectors): ${CONTRACT_GAS_COSTS.rugMaintenanceFacet.toLocaleString()} gas`);
console.log(`   RugCommerceFacet (23 selectors): ${CONTRACT_GAS_COSTS.rugCommerceFacet.toLocaleString()} gas`);
console.log(`   RugLaunderingFacet (8 selectors): ${CONTRACT_GAS_COSTS.rugLaunderingFacet.toLocaleString()} gas`);
console.log(`   RugTransferSecurityFacet (9 selectors): ${CONTRACT_GAS_COSTS.rugTransferSecurityFacet.toLocaleString()} gas`);
console.log(`   RugMarketplaceFacet (8 selectors): ${CONTRACT_GAS_COSTS.rugMarketplaceFacet.toLocaleString()} gas`);
console.log(`   Subtotal: ${facetsGas.toLocaleString()} gas = ${facetsCost.eth.toFixed(4)} ETH = $${facetsCost.usd.toFixed(2)}\n`);

// 3.5. Diamond Frame Pool Deployment
console.log('3.5. DIAMOND FRAME POOL DEPLOYMENT');
const poolGas = CONTRACT_GAS_COSTS.diamondFramePool;
const poolCost = calculateGasCost(poolGas);
console.log(`   diamondFramePool: ${poolGas.toLocaleString()} gas = ${poolCost.eth.toFixed(4)} ETH = $${poolCost.usd.toFixed(2)}\n`);

// 4. File Uploads
console.log('4. JAVASCRIPT LIBRARY UPLOADS');
let uploadTotalGas = 0;

Object.entries(FILE_UPLOAD_COSTS.fileSizes).forEach(([filename, size]) => {
  // Calculate chunks (20KB = 20000 bytes per chunk)
  const chunkSize = 20000;
  const chunks = Math.ceil(size / chunkSize);

  // Gas cost: create + chunks × addChunk + freeze
  const fileGas = FILE_UPLOAD_COSTS.createContent +
                  (chunks * FILE_UPLOAD_COSTS.addChunk) +
                  FILE_UPLOAD_COSTS.freezeContent;

  const fileCost = calculateGasCost(fileGas);
  console.log(`   ${filename} (${size} bytes, ${chunks} chunks): ${fileGas.toLocaleString()} gas = ${fileCost.eth.toFixed(4)} ETH = $${fileCost.usd.toFixed(2)}`);
  uploadTotalGas += fileGas;
});

const uploadCost = calculateGasCost(uploadTotalGas);
console.log(`   Subtotal: ${uploadCost.gas.toLocaleString()} gas = ${uploadCost.eth.toFixed(4)} ETH = $${uploadCost.usd.toFixed(2)}\n`);

// 5. Configuration & Initialization
console.log('5. CONFIGURATION & INITIALIZATION');
let configTotalGas = 0;

// Add up all config operations
Object.entries(CONFIG_GAS_COSTS).forEach(([operation, gas]) => {
  if (typeof gas === 'number' && operation !== 'totalDiamondCuts') {
    const cost = calculateGasCost(gas);
    console.log(`   ${operation}: ${gas.toLocaleString()} gas = ${cost.eth.toFixed(4)} ETH = $${cost.usd.toFixed(2)}`);
    configTotalGas += gas;
  }
});

// Add diamond cuts (most expensive part - stores 137 function selectors)
const diamondCutsGas = CONFIG_GAS_COSTS.diamondCut * CONFIG_GAS_COSTS.totalDiamondCuts;
const diamondCutsCost = calculateGasCost(diamondCutsGas);
console.log(`   diamond cuts (9 facets, 137 total selectors): ${diamondCutsGas.toLocaleString()} gas = ${diamondCutsCost.eth.toFixed(4)} ETH = $${diamondCutsCost.usd.toFixed(2)}`);
console.log(`   Note: Each selector stored costs ~20k gas (cold storage), plus overhead for arrays and mappings`);
console.log(`   This is the most expensive part of Diamond proxy deployment`);
configTotalGas += diamondCutsGas;

const configCost = calculateGasCost(configTotalGas);
console.log(`   Subtotal: ${configCost.gas.toLocaleString()} gas = ${configCost.eth.toFixed(4)} ETH = $${configCost.usd.toFixed(2)}\n`);

// 6. Total Cost
const totalGas = infraTotalGas + diamondTotalGas + facetsGas + poolGas + uploadTotalGas + configTotalGas;
const totalCost = calculateGasCost(totalGas);

console.log('=====================================');
console.log('DEPLOYMENT COST SUMMARY');
console.log('=====================================');
console.log(`Infrastructure:     $${infraCost.usd.toFixed(2)}`);
console.log(`Diamond System:     $${diamondCost.usd.toFixed(2)}`);
console.log(`Rug Facets:         $${facetsCost.usd.toFixed(2)}`);
console.log(`Diamond Frame Pool: $${poolCost.usd.toFixed(2)}`);
console.log(`Script Uploads:     $${uploadCost.usd.toFixed(2)}`);
console.log(`Configuration:      $${configCost.usd.toFixed(2)}`);
console.log('-------------------------------------');
console.log(`TOTAL COST:         $${totalCost.usd.toFixed(2)}`);
console.log(`TOTAL GAS:          ${totalGas.toLocaleString()} gas`);
console.log(`TOTAL ETH:          ${totalCost.eth.toFixed(4)} ETH`);
console.log('=====================================\n');

// Cost calculator function for different gas prices
function calculateCostAtGasPrice(gasPriceGwei) {
  const ethCost = totalGas * gweiToEth(gasPriceGwei);
  const usdCost = ethToUsd(ethCost);
  return {
    gasPrice: gasPriceGwei,
    eth: ethCost,
    usd: usdCost
  };
}

console.log('COST CALCULATOR FOR DIFFERENT GAS PRICES:');
console.log('Gas Price → Cost');
[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].forEach(gwei => {
  const cost = calculateCostAtGasPrice(gwei);
  console.log(`${gwei.toFixed(1)} gwei → $${cost.usd.toFixed(2)}`);
});

console.log('\nFORMULA FOR MANUAL CALCULATION:');
console.log(`Total Gas: ${totalGas.toLocaleString()}`);
console.log(`Cost = (Total Gas × Gas Price in gwei × ETH Price) ÷ 1,000,000,000`);
console.log(`Cost = (${totalGas.toLocaleString()} × [GWEI] × ${ETH_PRICE_USD}) ÷ 1,000,000,000`);
