#!/usr/bin/env node

/**
 * 🧪 Test Script for Standalone x402 Rug Maintenance Agent
 *
 * Tests all components of the standalone AI agent:
 * - Ollama connectivity
 * - Blockchain connection
 * - Contract interaction
 * - AI decision making
 */

import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Ollama } from 'ollama';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment
dotenv.config();

const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'deepseek-r1:8b'
  },
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'https://sepolia.shape.network',
    contractAddress: process.env.CONTRACT_ADDRESS || '0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325'
  },
  test: {
    tokenId: parseInt(process.env.TEST_TOKEN_ID || '1')
  }
};

// Contract ABI for testing
const RugMaintenanceAbi = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getMaintenanceOptions',
    outputs: [
      { name: 'canClean', type: 'bool' },
      { name: 'canRestore', type: 'bool' },
      { name: 'needsMaster', type: 'bool' },
      { name: 'cleaningCost', type: 'uint256' },
      { name: 'restorationCost', type: 'uint256' },
      { name: 'masterCost', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getAgentServiceFees',
    outputs: [
      { name: 'cleanFee', type: 'uint256' },
      { name: 'restoreFee', type: 'uint256' },
      { name: 'masterFee', type: 'uint256' },
      { name: 'feeRecipient', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

class StandaloneAgentTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  log(test, result, message = '') {
    this.results.total++;
    if (result) {
      this.results.passed++;
      console.log(chalk.green(`✅ ${test}`));
      if (message) console.log(chalk.gray(`   ${message}`));
    } else {
      this.results.failed++;
      console.log(chalk.red(`❌ ${test}`));
      if (message) console.log(chalk.red(`   ${message}`));
    }
  }

  async testOllamaConnection() {
    console.log(chalk.blue('\n🧠 Testing Ollama Connection...\n'));

    try {
      const ollama = new Ollama({ host: config.ollama.baseUrl });
      const models = await ollama.list();

      this.log('Ollama server connection', true, `${models.models.length} models available`);

      const hasModel = models.models.some(m => m.name.includes(config.ollama.model.split(':')[0]));
      this.log(`Model ${config.ollama.model} availability`, hasModel,
        hasModel ? 'Model ready' : 'Model not found');

      // Test AI response
      const response = await ollama.generate({
        model: config.ollama.model,
        prompt: 'Say "Hello from standalone AI agent!" and nothing else.',
        format: 'json'
      });

      const hasHello = response.response.toLowerCase().includes('hello');
      this.log('AI response generation', hasHello, response.response.substring(0, 50) + '...');

    } catch (error) {
      this.log('Ollama connection', false, error.message);
    }
  }

  async testBlockchainConnection() {
    console.log(chalk.blue('\n⛓️  Testing Blockchain Connection...\n'));

    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(config.blockchain.rpcUrl)
      });

      const blockNumber = await publicClient.getBlockNumber();
      this.log('Blockchain connection', true, `Block #${blockNumber}`);

      // Test contract call
      const fees = await publicClient.readContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getAgentServiceFees'
      });

      const hasFees = fees.length === 4 && typeof fees[0] === 'bigint';
      this.log('Contract connection', hasFees, `Fees configured`);

    } catch (error) {
      this.log('Blockchain connection', false, error.message);
    }
  }

  async testContractRead() {
    console.log(chalk.blue('\n📋 Testing Contract Read Operations...\n'));

    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(config.blockchain.rpcUrl)
      });

      // Test maintenance options
      const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await publicClient.readContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getMaintenanceOptions',
        args: [BigInt(config.test.tokenId)]
      });

      const validOptions = typeof canClean === 'boolean' &&
                          typeof canRestore === 'boolean' &&
                          typeof needsMaster === 'boolean' &&
                          typeof cleaningCost === 'bigint';

      this.log('Maintenance options read', validOptions,
        `Clean: ${canClean}, Restore: ${canRestore}, Master: ${needsMaster}`);

    } catch (error) {
      this.log('Contract read operations', false, error.message);
    }
  }

  async testAIReasoning() {
    console.log(chalk.blue('\n🧠 Testing AI Reasoning...\n'));

    const ollama = new Ollama({ host: config.ollama.baseUrl });

    // Mock rug data for testing (convert BigInts to strings for JSON)
    const testRugData = {
      tokenId: 1,
      canClean: true,
      canRestore: false,
      needsMaster: false,
      cleaningCost: "10000000000000", // 0.00001 ETH
      restorationCost: "20000000000000", // 0.00002 ETH
      masterCost: "50000000000000" // 0.00005 ETH
    };

    const prompt = `Analyze this rug condition and recommend action. Respond with JSON:
{
  "recommendedAction": "clean|restore|master|none",
  "reasoning": "brief explanation"
}

Rug data: ${JSON.stringify(testRugData)}`;

    try {
      const response = await ollama.generate({
        model: config.ollama.model,
        prompt: prompt,
        format: 'json'
      });

      const analysis = JSON.parse(response.response);
      const validAction = ['clean', 'restore', 'master', 'none'].includes(analysis.recommendedAction);
      const hasReasoning = analysis.reasoning && analysis.reasoning.length > 10;

      this.log('AI reasoning', validAction && hasReasoning,
        `Action: ${analysis.recommendedAction}, Reasoning: ${analysis.reasoning.substring(0, 50)}...`);

    } catch (error) {
      this.log('AI reasoning', false, error.message);
    }
  }

  async testWalletConfiguration() {
    console.log(chalk.blue('\n👛 Testing Wallet Configuration...\n'));

    const hasAgentKey = process.env.AGENT_PRIVATE_KEY &&
      process.env.AGENT_PRIVATE_KEY.startsWith('0x') &&
      process.env.AGENT_PRIVATE_KEY.length === 66;

    this.log('Agent private key', hasAgentKey,
      hasAgentKey ? 'Configured' : 'Missing - simulation mode only');

    const hasAgentAddress = process.env.AGENT_ADDRESS &&
      process.env.AGENT_ADDRESS.startsWith('0x') &&
      process.env.AGENT_ADDRESS.length === 42;

    this.log('Agent address', hasAgentAddress,
      hasAgentAddress ? `Configured: ${process.env.AGENT_ADDRESS}` : 'Missing');
  }

  async runAllTests() {
    console.log(chalk.bold.blue('🧪 Standalone x402 Rug Maintenance Agent - Test Suite\n'));

    await this.testOllamaConnection();
    await this.testBlockchainConnection();
    await this.testContractRead();
    await this.testAIReasoning();
    await this.testWalletConfiguration();

    // Summary
    console.log(chalk.blue('\n📊 Test Results Summary'));
    console.log(chalk.gray('═'.repeat(40)));
    console.log(chalk.gray(`Total Tests: ${this.results.total}`));
    console.log(chalk.green(`Passed: ${this.results.passed}`));
    console.log(chalk.red(`Failed: ${this.results.failed}`));

    const passRate = Math.round((this.results.passed / this.results.total) * 100);
    console.log(chalk.blue(`\nSuccess Rate: ${passRate}%\n`));

    if (this.results.failed === 0) {
      console.log(chalk.green('🎉 All tests passed! Standalone agent is ready to run.'));
      console.log(chalk.blue('\n🚀 Next steps:'));
      console.log(chalk.gray('   • Run: npm run chat'));
      console.log(chalk.gray('   • Or: npm start once'));
      console.log(chalk.gray('   • Or: npm start auto'));
    } else {
      console.log(chalk.yellow('⚠️  Some tests failed. Check configuration and try again.'));
      console.log(chalk.gray('\nCommon fixes:'));
      console.log(chalk.gray('   - Ensure Ollama is running'));
      console.log(chalk.gray('   - Check RPC_URL for blockchain'));
      console.log(chalk.gray('   - Verify CONTRACT_ADDRESS'));
      console.log(chalk.gray('   - Run: ollama pull ' + config.ollama.model));
    }
  }
}

// Run tests
async function main() {
  const tester = new StandaloneAgentTester();
  await tester.runAllTests();
}

main().catch(error => {
  console.error(chalk.red('💥 Test suite crashed:'), error);
  process.exit(1);
});
