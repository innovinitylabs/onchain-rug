// Ethereum Mainnet Deployment Cost Calculator for OnchainRugs
// Based on the Shape Sepolia deployment script analysis

// Current market conditions (as provided by user)
const ETH_PRICE_USD = 4000;  // $4,000 per ETH
const GAS_PRICE_GWEI = 0.7;  // 0.7 gwei (cheap), 0.8 gwei (fastest)

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

// Contract deployment gas estimates (conservative)
const CONTRACT_GAS_COSTS = {
  // Infrastructure contracts
  fileStore: 150000,        // FileStore deployment
  scriptyStorage: 200000,   // ScriptyStorageV2 deployment
  scriptyBuilder: 100000,   // ScriptyBuilderV2 deployment
  htmlGenerator: 80000,     // HTMLGenerator deployment

  // Diamond system
  diamondCutFacet: 80000,
  diamondLoupeFacet: 120000,
  diamond: 150000,          // Main diamond contract

  // Rug facets (average per facet)
  rugFacet: 180000,         // Average for each Rug facet (NFT, Admin, Aging, etc.)

  // Total facets to deploy: 8 facets
  totalFacets: 8
};

// File upload gas costs
const FILE_UPLOAD_COSTS = {
  // Base cost per file upload operation
  createContent: 50000,     // scriptyStorage.createContent()
  addChunk: 30000,          // scriptyStorage.addChunkToContent() per 20KB chunk
  freezeContent: 25000,     // scriptyStorage.freezeContent()

  // File sizes (from ls -la output)
  fileSizes: {
    'rug-p5.js': 8331,
    'rug-algo.js': 10315,
    'rug-frame.js': 2339
  }
};

// Configuration/initialization gas costs
const CONFIG_GAS_COSTS = {
  initializeERC721: 50000,
  setScriptyContracts: 60000,
  updateMintPricing: 45000,
  updateCollectionCap: 35000,
  updateWalletLimit: 35000,
  updateAgingThresholds: 55000,
  updateServicePricing: 45000,
  updateFrameThresholds: 45000,
  configureRoyalties: 80000,
  setLaunderingEnabled: 35000,

  // Diamond cuts (adding facets)
  diamondCut: 100000,      // Per facet addition
  totalDiamondCuts: 8       // 8 facets to add
};

console.log('=====================================');
console.log('ETHEREUM MAINNET DEPLOYMENT COST CALCULATOR');
console.log('=====================================');
console.log(`ETH Price: $${ETH_PRICE_USD} | Gas Price: ${GAS_PRICE_GWEI} gwei`);
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
console.log('3. RUG FACETS DEPLOYMENT (8 facets)');
const facetsGas = CONTRACT_GAS_COSTS.rugFacet * CONTRACT_GAS_COSTS.totalFacets;
const facetsCost = calculateGasCost(facetsGas);
console.log(`   8 facets × ${CONTRACT_GAS_COSTS.rugFacet.toLocaleString()} gas = ${facetsGas.toLocaleString()} gas = ${facetsCost.eth.toFixed(4)} ETH = $${facetsCost.usd.toFixed(2)}\n`);

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

// Add diamond cuts
const diamondCutsGas = CONFIG_GAS_COSTS.diamondCut * CONFIG_GAS_COSTS.totalDiamondCuts;
const diamondCutsCost = calculateGasCost(diamondCutsGas);
console.log(`   diamond cuts (8 facets): ${diamondCutsGas.toLocaleString()} gas = ${diamondCutsCost.eth.toFixed(4)} ETH = $${diamondCutsCost.usd.toFixed(2)}`);
configTotalGas += diamondCutsGas;

const configCost = calculateGasCost(configTotalGas);
console.log(`   Subtotal: ${configCost.gas.toLocaleString()} gas = ${configCost.eth.toFixed(4)} ETH = $${configCost.usd.toFixed(2)}\n`);

// 6. Total Cost
const totalGas = infraTotalGas + diamondTotalGas + facetsGas + uploadTotalGas + configTotalGas;
const totalCost = calculateGasCost(totalGas);

console.log('=====================================');
console.log('DEPLOYMENT COST SUMMARY');
console.log('=====================================');
console.log(`Infrastructure:     ${infraCost.usd.toFixed(2)}`);
console.log(`Diamond System:     ${diamondCost.usd.toFixed(2)}`);
console.log(`Rug Facets:         ${facetsCost.usd.toFixed(2)}`);
console.log(`File Uploads:       ${uploadCost.usd.toFixed(2)}`);
console.log(`Configuration:      ${configCost.usd.toFixed(2)}`);
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
