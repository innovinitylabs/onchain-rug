#!/usr/bin/env node

/**
 * Simple AI Agent for x402 Rug Maintenance
 *
 * This demonstrates how to build an AI agent that:
 * 1. Checks rug maintenance status
 * 2. Gets maintenance quotes
 * 3. Executes maintenance with payment
 *
 * Run with: node simple-ai-agent.js
 */

const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { baseSepolia } = require('./lib/web3');

// Configuration
const CONTRACT_ADDRESS = '0xa43532205Fc90b286Da98389a9883347Cc4064a8';
const API_BASE = 'http://localhost:3000';
const TOKEN_ID = '1'; // Replace with actual token ID

// Initialize clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// You'll need to set up a wallet for the agent
// For testing, you can use a test private key
// const agentWallet = createWalletClient({
//   chain: baseSepolia,
//   transport: http(),
//   account: '0x...' // Agent's private key
// });

class RugMaintenanceAgent {
  constructor() {
    this.contractAddress = CONTRACT_ADDRESS;
    this.apiBase = API_BASE;
    this.tokenId = TOKEN_ID;
  }

  async checkRugStatus() {
    console.log(`🔍 Checking status for rug #${this.tokenId}...`);

    try {
      const response = await fetch(`${this.apiBase}/api/maintenance/status/${this.tokenId}`);
      const data = await response.json();

      console.log('📊 Rug Status:', {
        canClean: data.maintenance.canClean,
        canRestore: data.maintenance.canRestore,
        needsMaster: data.maintenance.needsMaster,
        cleaningCost: formatEther(BigInt(data.maintenance.cleaningCostWei)) + ' ETH',
        restorationCost: formatEther(BigInt(data.maintenance.restorationCostWei)) + ' ETH',
        masterCost: formatEther(BigInt(data.maintenance.masterCostWei)) + ' ETH'
      });

      return data;
    } catch (error) {
      console.error('❌ Failed to check rug status:', error.message);
      return null;
    }
  }

  async getMaintenanceQuote(action) {
    console.log(`💰 Getting quote for ${action} on rug #${this.tokenId}...`);

    try {
      const response = await fetch(`${this.apiBase}/api/maintenance/quote/${this.tokenId}/${action}`);
      const data = await response.json();

      if (response.status === 402) {
        // This is expected - it's the x402 payment requirement
        const paymentReq = data.x402.accepts[0];

        console.log('💳 Payment Required:', {
          network: paymentReq.network,
          totalAmount: formatEther(BigInt(paymentReq.maxAmountRequired)) + ' ETH',
          serviceFee: formatEther(BigInt(paymentReq.extra.serviceFeeWei)) + ' ETH',
          maintenanceCost: formatEther(BigInt(paymentReq.extra.maintenanceWei)) + ' ETH',
          function: paymentReq.extra.function
        });

        return paymentReq;
      } else {
        console.log('❌ Unexpected response:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get quote:', error.message);
      return null;
    }
  }

  async executeMaintenance(paymentReq) {
    console.log(`🔧 Executing maintenance for rug #${this.tokenId}...`);

    try {
      // For demonstration - this would normally use the agent's wallet
      // const hash = await agentWallet.writeContract({
      //   address: this.contractAddress,
      //   abi: RugMaintenanceFacetAbi, // You'd need to import this
      //   functionName: paymentReq.extra.function,
      //   args: [BigInt(this.tokenId)],
      //   value: BigInt(paymentReq.maxAmountRequired)
      // });

      console.log('✅ Maintenance transaction would be sent with:');
      console.log(`   Function: ${paymentReq.extra.function}`);
      console.log(`   Token ID: ${this.tokenId}`);
      console.log(`   Value: ${formatEther(BigInt(paymentReq.maxAmountRequired))} ETH`);

      // Simulate success
      console.log('✅ Maintenance completed successfully!');
      return true;

    } catch (error) {
      console.error('❌ Maintenance execution failed:', error.message);
      return false;
    }
  }

  async runMaintenanceCycle() {
    console.log('🤖 AI Rug Maintenance Agent Starting...\n');

    // Step 1: Check rug status
    const status = await this.checkRugStatus();
    if (!status) return;

    // Step 2: Determine what maintenance is needed
    let action = null;
    if (status.maintenance.needsMaster) {
      action = 'master';
      console.log('🎯 Rug needs master restoration');
    } else if (status.maintenance.canRestore) {
      action = 'restore';
      console.log('🎯 Rug needs restoration');
    } else if (status.maintenance.canClean) {
      action = 'clean';
      console.log('🎯 Rug needs cleaning');
    } else {
      console.log('✅ Rug is in perfect condition!');
      return;
    }

    // Step 3: Get maintenance quote
    const paymentReq = await this.getMaintenanceQuote(action);
    if (!paymentReq) return;

    // Step 4: Execute maintenance (in real implementation, this would require user approval)
    console.log('\n⚠️  In production, the agent would request user approval for payment...');
    const success = await this.executeMaintenance(paymentReq);

    if (success) {
      console.log('\n🎉 Maintenance cycle completed successfully!');
      console.log('💰 Service fee earned by agent/platform');
    }
  }
}

// Example usage
async function main() {
  const agent = new RugMaintenanceAgent();

  // Run the maintenance cycle
  await agent.runMaintenanceCycle();

  // Example of checking different rugs
  console.log('\n' + '='.repeat(50));
  console.log('Example: Checking multiple rugs...');

  // You could loop through multiple token IDs
  // for (let tokenId = 1; tokenId <= 10; tokenId++) {
  //   agent.tokenId = tokenId.toString();
  //   await agent.checkRugStatus();
  // }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RugMaintenanceAgent;
