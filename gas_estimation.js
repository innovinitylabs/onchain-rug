// Gas estimation for royalty distribution to 10,000 holders
// Using current Ethereum gas prices (approximate)

// Current gas estimates (conservative)
const GAS_COSTS = {
  simpleTransfer: 21000,      // Basic ETH transfer
  erc20Transfer: 65000,       // ERC20 transfer
  merkleProof: 50000,         // Merkle proof verification
  storageUpdate: 20000,       // Updating claimed amounts
  loopIteration: 1000,        // Per iteration in a loop
  functionCall: 30000,        // Function call overhead
};

// Current prices (approximate as of 2025)
const ETH_PRICE_USD = 3200;   // $3,200 per ETH
const GAS_PRICE_GWEI = 20;   // 20 gwei average

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

console.log('=== Royalty Distribution Gas Cost Analysis ===\n');

// Method 1: Individual Transfers (10,000 separate transactions)
console.log('METHOD 1: Individual Transfers (10,000 transactions)');
const individualTxGas = GAS_COSTS.simpleTransfer + GAS_COSTS.functionCall;
const totalIndividualGas = individualTxGas * 10000;
const individualCost = calculateGasCost(totalIndividualGas);
console.log(`Per transaction: ${individualTxGas.toLocaleString()} gas`);
console.log(`Total: ${individualCost.gas.toLocaleString()} gas = ${individualCost.eth.toFixed(2)} ETH = $${individualCost.usd.toFixed(2)}\n`);

// Method 2: Batch Distribution (100 holders per batch)
console.log('METHOD 2: Batch Distribution (100 batches of 100 holders)');
const batchOverhead = GAS_COSTS.functionCall + 50000; // Batch setup
const perHolderGas = GAS_COSTS.simpleTransfer + GAS_COSTS.loopIteration + 5000; // Storage updates
const batchGas = batchOverhead + (perHolderGas * 100);
const totalBatchGas = batchGas * 100; // 100 batches
const batchCost = calculateGasCost(totalBatchGas);
console.log(`Per batch (100 holders): ${batchGas.toLocaleString()} gas`);
console.log(`Total: ${batchCost.gas.toLocaleString()} gas = ${batchCost.eth.toFixed(2)} ETH = $${batchCost.usd.toFixed(2)}\n`);

// Method 3: Merkle Airdrop
console.log('METHOD 3: Merkle Airdrop Distribution');
const merkleOverhead = GAS_COSTS.functionCall + 100000; // Merkle setup
const perClaimGas = GAS_COSTS.merkleProof + GAS_COSTS.simpleTransfer + GAS_COSTS.storageUpdate;
console.log(`Per claim: ${perClaimGas.toLocaleString()} gas = $${ethToUsd(perClaimGas * gweiToEth(GAS_PRICE_GWEI)).toFixed(2)}`);
console.log(`If all 10k claim: ${(perClaimGas * 10000).toLocaleString()} gas = $${ethToUsd((perClaimGas * 10000) * gweiToEth(GAS_PRICE_GWEI)).toFixed(2)}\n`);

// Method 4: Monthly Protocol Distribution (pull-based)
console.log('METHOD 4: Monthly Protocol Distribution (holders claim individually)');
console.log(`Monthly distribution cost: $0 (holders pay their own claims)`);
console.log(`Per claim: ${perClaimGas.toLocaleString()} gas = $${ethToUsd(perClaimGas * gweiToEth(GAS_PRICE_GWEI)).toFixed(2)}`);
console.log(`Average monthly claims (assume 10% active): ~1,000 claims`);
const monthlyClaimGas = perClaimGas * 1000;
const monthlyCost = calculateGasCost(monthlyClaimGas);
console.log(`Monthly gas cost: ${monthlyCost.gas.toLocaleString()} gas = ${monthlyCost.eth.toFixed(4)} ETH = $${monthlyCost.usd.toFixed(2)}\n`);

// Summary
console.log('=== SUMMARY ===');
console.log(`Individual transfers: $${individualCost.usd.toFixed(0)} (impractical)`);
console.log(`Batch distribution: $${batchCost.usd.toFixed(0)} per distribution`);
console.log(`Merkle airdrop: $${ethToUsd((perClaimGas * 10000) * gweiToEth(GAS_PRICE_GWEI)).toFixed(0)} if all claim at once`);
console.log(`Pull-based claiming: $${monthlyCost.usd.toFixed(0)}/month (scalable)`);
console.log(`\nRecommendation: Pull-based claiming with monthly protocol distributions`);
