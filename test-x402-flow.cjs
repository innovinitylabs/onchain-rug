#!/usr/bin/env node

/**
 * Test x402 Flow - No Wallet Required
 *
 * This script demonstrates the complete x402 flow without executing transactions.
 * Perfect for testing API integration and understanding the protocol.
 *
 * Run with: node test-x402-flow.js
 */

const API_BASE = 'http://localhost:3000';
const CONTRACT_ADDRESS = '0xa43532205Fc90b286Da98389a9883347Cc4064a8';
const TOKEN_ID = '1'; // Use an existing token ID

class X402FlowTester {
  constructor() {
    this.apiBase = API_BASE;
    this.contractAddress = CONTRACT_ADDRESS;
    this.tokenId = TOKEN_ID;
  }

  async testStatusEndpoint() {
    console.log('🧪 Testing /api/maintenance/status endpoint...\n');

    try {
      const response = await fetch(`${this.apiBase}/api/maintenance/status/${this.tokenId}`);
      const data = await response.json();

      console.log('✅ Status Response:');
      console.log(JSON.stringify(data, null, 2));

      if (data.maintenance) {
        console.log('\n📊 Maintenance Options:');
        console.log(`   Can Clean: ${data.maintenance.canClean}`);
        console.log(`   Can Restore: ${data.maintenance.canRestore}`);
        console.log(`   Needs Master: ${data.maintenance.needsMaster}`);
        console.log(`   Cleaning Cost: ${data.maintenance.cleaningCostWei} wei`);
        console.log(`   Restoration Cost: ${data.maintenance.restorationCostWei} wei`);
        console.log(`   Master Cost: ${data.maintenance.masterCostWei} wei`);
      }

      return data;
    } catch (error) {
      console.error('❌ Status endpoint test failed:', error.message);
      return null;
    }
  }

  async testQuoteEndpoint(action = 'clean') {
    console.log(`\n🧪 Testing /api/maintenance/quote endpoint (${action})...\n`);

    try {
      const response = await fetch(`${this.apiBase}/api/maintenance/quote/${this.tokenId}/${action}`);
      const data = await response.json();

      console.log(`Status: ${response.status} (${response.status === 402 ? 'Expected - Payment Required' : 'Unexpected'})`);

      if (response.status === 402 && data.x402?.accepts?.[0]) {
        const paymentReq = data.x402.accepts[0];
        const extra = paymentReq.extra;

        console.log('✅ x402 Payment Requirement:');
        console.log(`   Version: ${data.x402.x402Version}`);
        console.log(`   Scheme: ${paymentReq.scheme}`);
        console.log(`   Network: ${paymentReq.network}`);
        console.log(`   Asset: ${paymentReq.asset} (ETH)`);
        console.log(`   Pay To: ${paymentReq.payTo}`);
        console.log(`   Total Amount: ${paymentReq.maxAmountRequired} wei`);
        console.log(`   Service Fee: ${extra.serviceFeeWei} wei`);
        console.log(`   Maintenance Cost: ${extra.maintenanceWei} wei`);
        console.log(`   Function: ${extra.function}`);
        console.log(`   Resource: ${paymentReq.resource}`);
        console.log(`   Description: ${paymentReq.description}`);

        return paymentReq;
      } else {
        console.log('❌ Unexpected response format:');
        console.log(JSON.stringify(data, null, 2));
        return null;
      }
    } catch (error) {
      console.error('❌ Quote endpoint test failed:', error.message);
      return null;
    }
  }

  async testCompleteFlow() {
    console.log('🚀 Testing Complete x402 Flow\n');
    console.log('═'.repeat(60));

    // Step 1: Check status
    console.log('Step 1: Check Rug Status');
    const status = await this.testStatusEndpoint();
    if (!status) return;

    // Step 2: Determine maintenance action
    console.log('\nStep 2: Determine Maintenance Action');
    let action = null;
    if (status.maintenance.needsMaster) {
      action = 'master';
      console.log('🎯 Action: Master Restoration (highest priority)');
    } else if (status.maintenance.canRestore) {
      action = 'restore';
      console.log('🎯 Action: Restoration');
    } else if (status.maintenance.canClean) {
      action = 'clean';
      console.log('🎯 Action: Cleaning');
    } else {
      console.log('✅ No maintenance needed - rug is perfect!');
      return;
    }

    // Step 3: Get quote
    console.log(`\nStep 3: Get ${action} Quote`);
    const quote = await this.testQuoteEndpoint(action);
    if (!quote) return;

    // Step 4: Simulate transaction
    console.log('\nStep 4: Simulate Transaction Execution');
    this.simulateTransaction(quote);

    console.log('\n═'.repeat(60));
    console.log('🎉 x402 Flow Test Completed Successfully!');
    console.log('Your APIs are working correctly.');
  }

  simulateTransaction(paymentReq) {
    const extra = paymentReq.extra;
    const totalWei = BigInt(paymentReq.maxAmountRequired);
    const serviceFeeWei = BigInt(extra.serviceFeeWei);
    const maintenanceWei = BigInt(extra.maintenanceWei);

    console.log('📤 Simulated Transaction:');
    console.log(`   Contract: ${this.contractAddress}`);
    console.log(`   Function: ${extra.function}`);
    console.log(`   Token ID: ${this.tokenId}`);
    console.log(`   Total Value: ${totalWei.toString()} wei`);
    console.log(`   ├── Service Fee: ${serviceFeeWei.toString()} wei (goes to platform)`);
    console.log(`   └── Maintenance: ${maintenanceWei.toString()} wei (goes to contract)`);

    console.log('\n🔧 What would happen in real execution:');
    console.log('   1. AI agent creates transaction with total value');
    console.log('   2. Contract receives maintenance + service fee');
    console.log('   3. Contract executes maintenance logic');
    console.log('   4. Service fee transferred to fee recipient');
    console.log('   5. Rug condition improves');
    console.log('   6. AI agent earns service fee revenue');

    console.log('\n💰 Revenue Distribution:');
    console.log(`   Platform earns: ${serviceFeeWei.toString()} wei`);
    console.log(`   Contract treasury: ${maintenanceWei.toString()} wei`);
    console.log(`   AI agent gas cost: ~50,000 gas`);
  }

  async testAllActions() {
    console.log('🧪 Testing All Maintenance Actions\n');

    const actions = ['clean', 'restore', 'master'];

    for (const action of actions) {
      console.log(`\n═ Testing ${action.toUpperCase()} ═`);
      await this.testQuoteEndpoint(action);
    }

    console.log('\n✅ All action quotes tested!');
  }
}

// CLI interface
async function main() {
  const tester = new X402FlowTester();

  const args = process.argv.slice(2);
  const command = args[0] || 'flow';

  console.log('🧪 x402 Rug Maintenance API Tester\n');

  switch (command) {
    case 'status':
      await tester.testStatusEndpoint();
      break;

    case 'quote':
      const action = args[1] || 'clean';
      await tester.testQuoteEndpoint(action);
      break;

    case 'actions':
      await tester.testAllActions();
      break;

    case 'flow':
    default:
      await tester.testCompleteFlow();
      break;
  }
}

// Export for testing
module.exports = X402FlowTester;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
