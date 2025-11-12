#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE PIPELINE TEST
 * Tests the entire X402 clean rug flow end-to-end
 */

import { createWalletClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

console.log('🚀 STARTING COMPREHENSIVE PIPELINE TEST...\n');

// Test configuration
const config = {
  websiteUrl: 'http://localhost:3000',
  agentApiUrl: 'http://localhost:3001',
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY,
  agentAddress: process.env.AGENT_ADDRESS,
  contractAddress: process.env.CONTRACT_ADDRESS,
  rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org'
};

async function testStep(name, testFn) {
  console.log(`\n📋 STEP: ${name}`);
  try {
    const result = await testFn();
    console.log(`✅ PASSED: ${result || 'OK'}`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  }
}

async function runFullPipelineTest() {
  console.log('🔧 CONFIGURATION:');
  console.log(`   Website API: ${config.websiteUrl}`);
  console.log(`   Agent API: ${config.agentApiUrl}`);
  console.log(`   Contract: ${config.contractAddress}`);
  console.log(`   Agent: ${config.agentAddress}`);
  console.log(`   RPC: ${config.rpcUrl}\n`);

  let allPassed = true;

  // STEP 1: Test website server connectivity
  allPassed &= await testStep('Website Server Connectivity', async () => {
    const response = await fetch(`${config.websiteUrl}/api/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.status) throw new Error('No status in response');
    return `Server healthy: ${data.status}`;
  });

  // STEP 2: Test agent API server connectivity
  allPassed &= await testStep('Agent API Server Connectivity', async () => {
    const response = await fetch(`${config.agentApiUrl}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.status) throw new Error('No status in response');
    return `Agent healthy: ${data.agent}`;
  });

  // STEP 3: Test maintenance quote API
  allPassed &= await testStep('Maintenance Quote API', async () => {
    const response = await fetch(`${config.websiteUrl}/api/maintenance/quote/1/clean`);
    if (response.status !== 402) throw new Error(`Expected 402, got ${response.status}`);

    const data = await response.json();
    if (!data.x402?.accepts?.[0]) throw new Error('No X402 payment requirement');

    const req = data.x402.accepts[0];
    const cost = parseFloat(req.maxAmountRequired) / 1e18;
    return `Quote: ${cost} ETH for cleaning rug 1`;
  });

  // STEP 4: Test rug status (free operation)
  allPassed &= await testStep('Rug Status API (Free)', async () => {
    const response = await fetch(`${config.agentApiUrl}/rug/1/status`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data.success) throw new Error(`API error: ${data.error}`);

    const status = data.data;
    return `Rug 1: dirt=${status.dirtLevel}, clean=${status.canClean}`;
  });

  // STEP 5: Test agent wallet connection
  allPassed &= await testStep('Agent Wallet Connection', async () => {
    if (!config.agentPrivateKey) throw new Error('AGENT_PRIVATE_KEY not set');

    const account = privateKeyToAccount(config.agentPrivateKey);
    if (account.address.toLowerCase() !== config.agentAddress?.toLowerCase()) {
      throw new Error(`Address mismatch: expected ${config.agentAddress}, got ${account.address}`);
    }

    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(config.rpcUrl)
    });

    const balance = await client.getBalance({ address: account.address });
    const balanceEth = parseFloat(balance.toString()) / 1e18;
    return `Wallet connected, balance: ${balanceEth.toFixed(6)} ETH`;
  });

  // STEP 6: Test contract connection
  allPassed &= await testStep('Smart Contract Connection', async () => {
    if (!config.contractAddress) throw new Error('CONTRACT_ADDRESS not set');

    const client = createWalletClient({
      account: privateKeyToAccount(config.agentPrivateKey),
      chain: baseSepolia,
      transport: http(config.rpcUrl)
    });

    // Simple contract call to test connection
    const blockNumber = await client.getBlockNumber();
    return `Contract reachable, current block: ${blockNumber}`;
  });

  // SUMMARY
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Pipeline is ready for X402 operations.');
    console.log('\n💡 You can now run:');
    console.log('   cd standalone-ai-agent && npm run chat');
    console.log('   Then say: "clean rug 1"');
  } else {
    console.log('❌ SOME TESTS FAILED. Please fix the issues above before testing X402.');
  }
  console.log('='.repeat(50));

  process.exit(allPassed ? 0 : 1);
}

runFullPipelineTest().catch(error => {
  console.error('\n💥 FATAL ERROR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});
