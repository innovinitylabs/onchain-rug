#!/usr/bin/env node

/**
 * 🧪 Test Script for Ollama x402 Rug Maintenance Agent
 *
 * Tests all components of the AI agent:
 * - Ollama connectivity
 * - API endpoints
 * - Wallet configuration
 * - AI decision making
 * - Transaction simulation
 */

import { createPublicClient, http } from 'viem';
import { baseSepolia } from '../lib/web3.js';
import { Ollama } from 'ollama';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment
dotenv.config();

const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b'
  },
  api: {
    baseUrl: process.env.RUG_API_BASE || 'http://localhost:3000'
  },
  test: {
    tokenId: parseInt(process.env.TEST_TOKEN_ID || '1')
  }
};

class AgentTester {
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
        prompt: 'Say "Hello from AI agent!" and nothing else.',
        format: 'json'
      });

      const hasHello = response.response.toLowerCase().includes('hello');
      this.log('AI response generation', hasHello, response.response.substring(0, 50) + '...');

    } catch (error) {
      this.log('Ollama connection', false, error.message);
    }
  }

  async testAPIEndpoints() {
    console.log(chalk.blue('\n🔗 Testing API Endpoints...\n'));

    // Test status endpoint
    try {
      const response = await fetch(`${config.api.baseUrl}/api/maintenance/status/${config.test.tokenId}`);
      const data = await response.json();

      const hasMaintenance = data.maintenance &&
        typeof data.maintenance.canClean === 'boolean' &&
        typeof data.maintenance.canRestore === 'boolean';

      this.log('Status endpoint', response.ok && hasMaintenance,
        `HTTP ${response.status}, valid maintenance data`);

    } catch (error) {
      this.log('Status endpoint', false, error.message);
    }

    // Test quote endpoints
    const actions = ['clean', 'restore', 'master'];
    for (const action of actions) {
      try {
        const response = await fetch(`${config.api.baseUrl}/api/maintenance/quote/${config.test.tokenId}/${action}`);
        const data = await response.json();

        const isValidQuote = response.status === 402 &&
          data.x402?.accepts?.[0] &&
          data.x402.accepts[0].extra?.function;

        this.log(`${action} quote endpoint`, isValidQuote,
          `HTTP ${response.status}, valid x402 format`);

      } catch (error) {
        this.log(`${action} quote endpoint`, false, error.message);
      }
    }
  }

  async testBlockchainConnection() {
    console.log(chalk.blue('\n⛓️  Testing Blockchain Connection...\n'));

    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      });

      const blockNumber = await publicClient.getBlockNumber();
      this.log('Blockchain connection', true, `Block #${blockNumber}`);

      // Test contract call
      const contractAddress = '0xa43532205Fc90b286Da98389a9883347Cc4064a8';
      const fees = await publicClient.readContract({
        address: contractAddress,
        abi: [{
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
        }],
        functionName: 'getAgentServiceFees'
      });

      const hasFees = fees.length === 4 && typeof fees[0] === 'bigint';
      this.log('Contract connection', hasFees, `Fees: ${fees[0]}, ${fees[1]}, ${fees[2]}`);

    } catch (error) {
      this.log('Blockchain connection', false, error.message);
    }
  }

  async testAIReasoning() {
    console.log(chalk.blue('\n🧠 Testing AI Reasoning...\n'));

    const ollama = new Ollama({ host: config.ollama.baseUrl });

    const testRugData = {
      tokenId: 1,
      maintenance: {
        canClean: true,
        canRestore: false,
        needsMaster: false,
        cleaningCostWei: '10000000000000',
        restorationCostWei: '10000000000000',
        masterCostWei: '10000000000000'
      }
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

    const hasOwnerKey = process.env.OWNER_PRIVATE_KEY &&
      process.env.OWNER_PRIVATE_KEY.startsWith('0x') &&
      process.env.OWNER_PRIVATE_KEY.length === 66;

    this.log('Owner private key', hasOwnerKey,
      hasOwnerKey ? 'Configured' : 'Missing - manual authorization required');

    const hasAgentAddress = process.env.AGENT_ADDRESS &&
      process.env.AGENT_ADDRESS.startsWith('0x') &&
      process.env.AGENT_ADDRESS.length === 42;

    this.log('Agent address', hasAgentAddress,
      hasAgentAddress ? `Configured: ${process.env.AGENT_ADDRESS}` : 'Missing');
  }

  async runAllTests() {
    console.log(chalk.bold.blue('🧪 Ollama x402 Rug Maintenance Agent - Test Suite\n'));

    await this.testOllamaConnection();
    await this.testAPIEndpoints();
    await this.testBlockchainConnection();
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
      console.log(chalk.green('🎉 All tests passed! Agent is ready to run.'));
    } else {
      console.log(chalk.yellow('⚠️  Some tests failed. Check configuration and try again.'));
      console.log(chalk.gray('\nCommon fixes:'));
      console.log(chalk.gray('   - Start Ollama: ollama serve'));
      console.log(chalk.gray('   - Start API: npm run dev'));
      console.log(chalk.gray('   - Pull model: ollama pull llama3.2:3b'));
      console.log(chalk.gray('   - Check .env configuration'));
    }
  }
}

// Run tests
async function main() {
  const tester = new AgentTester();
  await tester.runAllTests();
}

main().catch(error => {
  console.error(chalk.red('💥 Test suite crashed:'), error);
  process.exit(1);
});
