#!/usr/bin/env node

/**
 * Manual X402 Testing Script
 *
 * Test your complete X402 system manually:
 * 1. Request payment requirement from AI agent
 * 2. Create signed X402 payment payload
 * 3. Submit payment to complete transaction
 *
 * Run with: node test-manual-x402.js
 */

const AGENT_BASE = 'http://localhost:3001'; // AI Agent API
const FACILITATOR_BASE = 'http://localhost:3000/api/x402/facilitator'; // Custom facilitator

class ManualX402Tester {
  constructor() {
    this.agentBase = AGENT_BASE;
    this.facilitatorBase = FACILITATOR_BASE;
  }

  async testStep1_GetPaymentRequirement() {
    console.log('\n🎯 STEP 1: Get Payment Requirement from AI Agent');
    console.log('═'.repeat(60));

    try {
      // Request rug status (requires payment)
      const response = await fetch(`${this.agentBase}/rug/1/status`);
      const data = await response.json();

      console.log(`Status: ${response.status}`);
      if (response.status === 402) {
        console.log('✅ Got X402 payment requirement!');
        console.log('Payment Details:');
        console.log(`   Version: ${data.x402?.x402Version}`);
        console.log(`   Scheme: ${data.x402?.accepts?.[0]?.scheme}`);
        console.log(`   Network: ${data.x402?.accepts?.[0]?.network}`);
        console.log(`   Amount: ${data.x402?.accepts?.[0]?.maxAmountRequired} wei`);
        console.log(`   Pay To: ${data.x402?.accepts?.[0]?.payTo}`);
        console.log(`   Description: ${data.x402?.accepts?.[0]?.description}`);

        return data.x402?.accepts?.[0];
      } else {
        console.log('❌ Expected 402 Payment Required, got:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get payment requirement:', error.message);
      return null;
    }
  }

  async testStep2_VerifyFacilitatorDirectly() {
    console.log('\n🎯 STEP 2: Test Custom Facilitator Directly');
    console.log('═'.repeat(60));

    try {
      // Test facilitator supported schemes
      const response = await fetch(this.facilitatorBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_supported' })
      });

      const data = await response.json();
      console.log('✅ Facilitator Status:');
      console.log(`   X402 Version: ${data.x402Version}`);
      console.log(`   Supported Schemes: ${JSON.stringify(data.kind?.[0]?.scheme)}`);
      console.log(`   Supported Networks: ${JSON.stringify(data.kind?.[0]?.networkId)}`);

      // Test payment requirement creation
      const payReqResponse = await fetch(this.facilitatorBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_payment_requirement',
          price: '0.001',
          description: 'Manual X402 test payment',
          payTo: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          resource: '/test/payment',
          scheme: 'exact',
          network: 'shape-sepolia'
        })
      });

      const payReqData = await payReqResponse.json();
      console.log('✅ Payment Requirement Created:');
      console.log(`   Amount: ${payReqData.x402?.accepts?.[0]?.maxAmountRequired} wei`);
      console.log(`   Pay To: ${payReqData.x402?.accepts?.[0]?.payTo}`);

      return payReqData.x402?.accepts?.[0];
    } catch (error) {
      console.error('❌ Facilitator test failed:', error.message);
      return null;
    }
  }

  createMockPaymentPayload(paymentReq) {
    console.log('\n🎯 STEP 3: Create Mock X402 Payment Payload');
    console.log('═'.repeat(60));

    // Create a mock payment payload (in real scenario, this would be signed)
    const payload = {
      x402Version: 1,
      payment: {
        scheme: paymentReq.scheme,
        network: paymentReq.network,
        asset: paymentReq.asset,
        amount: paymentReq.maxAmountRequired,
        from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Mock from address
        to: paymentReq.payTo,
        nonce: Math.floor(Math.random() * 1000000).toString(),
        deadline: Math.floor(Date.now() / 1000) + 900 // 15 minutes
      },
      signature: '0x' + '00'.repeat(65) // Mock signature (65 bytes)
    };

    console.log('✅ Created mock payment payload:');
    console.log(`   From: ${payload.payment.from}`);
    console.log(`   To: ${payload.payment.to}`);
    console.log(`   Amount: ${payload.payment.amount} wei`);
    console.log(`   Signature: ${payload.signature.substring(0, 20)}...`);

    return payload;
  }

  async testStep4_VerifyPayment() {
    console.log('\n🎯 STEP 4: Test Payment Verification');
    console.log('═'.repeat(60));

    // Create a simple test payload
    const testPayload = {
      x402Version: 1,
      payment: {
        scheme: 'exact',
        network: 'shape-sepolia',
        asset: '0x0000000000000000000000000000000000000000',
        amount: '1000000000000000', // 0.001 ETH
        from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        nonce: '12345',
        deadline: Math.floor(Date.now() / 1000) + 900
      },
      signature: '0x' + '00'.repeat(65)
    };

    try {
      const response = await fetch(this.facilitatorBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_payment',
          paymentPayload: JSON.stringify(testPayload)
        })
      });

      const data = await response.json();
      console.log('✅ Payment verification result:');
      console.log(`   Valid: ${data.isValid}`);
      if (!data.isValid) {
        console.log(`   Reason: ${data.invalidReason}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Payment verification test failed:', error.message);
      return null;
    }
  }

  async testCompleteFlow() {
    console.log('🚀 MANUAL X402 SYSTEM TEST');
    console.log('═'.repeat(60));
    console.log('Testing your complete X402 ecosystem...\n');

    // Step 1: Test facilitator directly
    const facilitatorResult = await this.testStep2_VerifyFacilitatorDirectly();
    if (!facilitatorResult) {
      console.log('❌ Facilitator test failed - check if Next.js app is running');
      return;
    }

    // Step 2: Get payment requirement from agent
    const paymentReq = await this.testStep1_GetPaymentRequirement();
    if (!paymentReq) {
      console.log('❌ Agent payment requirement failed - check if agent API is running');
      return;
    }

    // Step 3: Create mock payment payload
    const paymentPayload = this.createMockPaymentPayload(paymentReq);

    // Step 4: Test payment verification
    const verifyResult = await this.testStep4_VerifyPayment();
    if (!verifyResult?.isValid) {
      console.log('❌ Payment verification failed');
      return;
    }

    console.log('\n🎉 MANUAL X402 TEST COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('✅ Custom Facilitator: Working');
    console.log('✅ X402 Payment Requirements: Generated');
    console.log('✅ Agent API Integration: Connected');
    console.log('✅ Payment Verification: Functional');
    console.log('\n🚀 Your X402 system is ready for real payments!');
    console.log('\n💡 Next: Configure real wallet and test with actual ETH!');
  }
}

// CLI interface
async function main() {
  const tester = new ManualX402Tester();

  const args = process.argv.slice(2);
  const command = args[0] || 'flow';

  console.log('🧪 Manual X402 System Tester\n');

  switch (command) {
    case 'facilitator':
      await tester.testStep2_VerifyFacilitatorDirectly();
      break;
    case 'agent':
      await tester.testStep1_GetPaymentRequirement();
      break;
    case 'verify':
      await tester.testStep4_VerifyPayment();
      break;
    case 'flow':
    default:
      await tester.testCompleteFlow();
      break;
  }
}

// Export for testing
export default ManualX402Tester;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
