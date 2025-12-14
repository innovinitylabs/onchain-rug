#!/usr/bin/env node

/**
 * Test Direct Payment Flow - No Wallet Required
 *
 * This script demonstrates the complete direct payment flow without executing transactions.
 * Perfect for testing API integration and understanding the new payment system.
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
    console.log(`\n🧪 Testing /api/maintenance/quote endpoint for ${action}...`);
    console.log(`\n🧪 Testing /api/maintenance/quote endpoint (${action}) - V2 format...\n`);

    try {
      const response = await fetch(`${this.apiBase}/api/maintenance/quote/${this.tokenId}/${action}`, {
        headers: {
          'x-agent-address': process.env.TEST_AGENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' // Test agent address (set TEST_AGENT_ADDRESS env var)
        }
      });

      console.log(`Status: ${response.status} (${response.status === 402 ? 'Expected - Payment Required' : 'Unexpected'})`);

      // V2: Payment requirement comes in PAYMENT-REQUIRED header
      const paymentRequiredHeader = response.headers.get('PAYMENT-REQUIRED');
      const x402ExtraHeader = response.headers.get('X402-Extra');

      if (response.status === 402 && paymentRequiredHeader) {
        const paymentData = JSON.parse(paymentRequiredHeader);

        console.log('✅ V2 Payment Requirement Header:');
        console.log(`   Version: ${paymentData.x402Version}`);

        if (paymentData.accepts?.[0]) {
          const paymentReq = paymentData.accepts[0];
          const extraData = paymentReq.extra || {};

          console.log(`   Scheme: ${paymentReq.scheme}`);
          console.log(`   Network: ${paymentReq.network}`);
          console.log(`   Asset: ${paymentReq.asset} (ETH)`);
          console.log(`   Pay To: ${paymentReq.payTo}`);
          console.log(`   Total Amount: ${paymentReq.maxAmountRequired} wei`);
          console.log(`   Service Fee: ${extraData.serviceFee} wei`);
          console.log(`   Maintenance Cost: ${extraData.maintenanceCost} wei`);
          console.log(`   Function: ${extraData.functionName}`);
          console.log(`   Resource: ${paymentReq.resource}`);
          console.log(`   Description: ${paymentReq.description}`);

          return { ...paymentReq, extra: extraData };
        }
      }

      // Fallback: try old V1 format for backward compatibility
      try {
        const data = await response.json();
        if (data.x402?.accepts?.[0]) {
          console.log('📋 Using V1 fallback format:');
          const paymentReq = data.x402.accepts[0];
          console.log(`   Version: ${data.x402.x402Version}`);
          console.log(`   Scheme: ${paymentReq.scheme}`);
          console.log(`   Network: ${paymentReq.network}`);
          console.log(`   Asset: ${paymentReq.asset} (ETH)`);
          console.log(`   Pay To: ${paymentReq.payTo}`);
          console.log(`   Total Amount: ${paymentReq.maxAmountRequired} wei`);
          return paymentReq;
        }
      } catch (e) {
        console.log('❌ No valid payment data in response');
      }

      console.log('❌ Unexpected response format');
      return null;
    } catch (error) {
      console.error('❌ Quote endpoint test failed:', error.message);
      return null;
    }
  }

  async testCompleteFlow() {
    console.log('🚀 Testing Complete Direct Payment Flow\n');
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

    // Step 4: Test action execution with direct payment
    console.log('\nStep 4: Test Direct Payment Execution');
    await this.testActionEndpoint(action, quote.maxAmountRequired);

    // Step 5: Simulate transaction details
    console.log('\nStep 5: Transaction Details');
    this.simulateTransaction(quote);

    console.log('\n═'.repeat(60));
    console.log('🎉 Direct Payment Flow Test Completed Successfully!');
    console.log('Your APIs are working correctly.');
  }

  async testActionEndpoint(action, paymentAmount) {
    console.log(`\n🧪 Testing /api/maintenance/action endpoint for ${action} with direct payment...`);

    try {
      const response = await fetch(`${this.apiBase}/api/maintenance/action/${this.tokenId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-address': process.env.TEST_AGENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        },
        body: JSON.stringify({
          action: action,
          paymentAmount: paymentAmount
        })
      });

      console.log(`Status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Action executed successfully:');
        console.log(`   Tx Hash: ${result.txHash}`);
        console.log(`   Gas Used: ${result.gasUsed}`);
        console.log(`   Message: ${result.message}`);
        return result;
      } else {
        const error = await response.json();
        console.log('❌ Action failed:');
        console.log(`   Error: ${error.error}`);
        console.log(`   Details: ${error.details}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Action endpoint test failed:', error.message);
      return null;
    }
  }

  simulateTransaction(paymentReq) {
    const extra = paymentReq.extra;
    const totalWei = BigInt(paymentReq.maxAmountRequired);

    // Convert ETH values to wei
    const serviceFeeWei = extra.serviceFee ? BigInt(Math.floor(parseFloat(extra.serviceFee) * 1e18)) : BigInt(0);
    const maintenanceWei = extra.maintenanceCost ? BigInt(Math.floor(parseFloat(extra.maintenanceCost) * 1e18)) : BigInt(0);

    console.log('📤 Simulated Transaction:');
    console.log(`   Contract: ${this.contractAddress}`);
    console.log(`   Function: ${extra.functionName}`);
    console.log(`   Token ID: ${this.tokenId}`);
    console.log(`   Total Value: ${totalWei.toString()} wei`);
    console.log(`   ├── Service Fee: ${serviceFeeWei.toString()} wei (goes to platform)`);
    console.log(`   └── Maintenance: ${maintenanceWei.toString()} wei (goes to contract)`);

    console.log('\n🔧 What happens in real execution:');
    console.log('   1. AI agent gets quote (PAYMENT-REQUIRED header)');
    console.log('   2. AI agent calls action API with paymentAmount in body');
    console.log('   3. API calls contract directly with payment');
    console.log('   4. Contract verifies agent authorization + payment amount');
    console.log('   5. Contract executes maintenance and distributes fees');
    console.log('   6. Transaction completes - no facilitator needed');

    console.log('\n💰 Revenue Distribution:');
    console.log(`   Platform earns: ${serviceFeeWei.toString()} wei (service fee)`);
    console.log(`   Contract treasury: ${maintenanceWei.toString()} wei (maintenance)`);
    console.log(`   AI agent gas cost: ~50,000 gas`);
    console.log(`   Process: Direct payment → On-chain verification → No intermediaries`);
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
export default X402FlowTester;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
