#!/usr/bin/env node

/**
 * 🧠 Ollama AI Agent for x402 Rug Maintenance
 *
 * This AI agent uses Ollama to autonomously maintain rugs via the x402 protocol.
 * It can analyze rug conditions, make maintenance decisions, and execute transactions.
 *
 * Features:
 * - Ollama integration for intelligent maintenance decisions
 * - x402 protocol compliance
 * - Single-transaction maintenance execution
 * - Revenue tracking from service fees
 *
 * Usage:
 * npm install
 * cp config.example.env .env
 * # Edit .env with your configuration
 * npm start
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Ollama } from 'ollama';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b'
  },
  api: {
    baseUrl: process.env.RUG_API_BASE || 'http://localhost:3000',
    contractAddress: process.env.CONTRACT_ADDRESS || '0xa43532205Fc90b286Da98389a9883347Cc4064a8'
  },
  wallet: {
    privateKey: process.env.AGENT_PRIVATE_KEY,
    address: process.env.AGENT_ADDRESS
  },
  owner: {
    privateKey: process.env.OWNER_PRIVATE_KEY,
    address: process.env.OWNER_ADDRESS
  },
  test: {
    tokenId: parseInt(process.env.TEST_TOKEN_ID || '1'),
    autoMaintain: process.env.AUTO_MAINTAIN === 'true',
    checkInterval: parseInt(process.env.MAINTENANCE_CHECK_INTERVAL || '300000')
  },
  network: {
    rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
    chainId: parseInt(process.env.CHAIN_ID || '84532')
  }
};

// Initialize clients
const ollama = new Ollama({
  host: config.ollama.baseUrl
});

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.network.rpcUrl)
});

let agentWallet = null;
if (config.wallet.privateKey) {
  agentWallet = createWalletClient({
    chain: baseSepolia,
    transport: http(config.network.rpcUrl),
    account: config.wallet.privateKey
  });
}

let ownerWallet = null;
if (config.owner.privateKey) {
  ownerWallet = createWalletClient({
    chain: baseSepolia,
    transport: http(config.network.rpcUrl),
    account: config.owner.privateKey
  });
}

// Rug Maintenance ABI (simplified)
const RugMaintenanceAbi = [
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'authorizeMaintenanceAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'cleanRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'restoreRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'masterRestoreRugAgent',
    outputs: [],
    stateMutability: 'payable',
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

class OllamaRugMaintenanceAgent {
  constructor() {
    this.agentAddress = config.wallet.address;
    this.totalEarnings = 0n;
    this.maintenanceCount = 0;
    this.isRunning = false;
  }

  async initialize() {
    console.log(chalk.blue('🤖 Initializing Ollama Rug Maintenance Agent...\n'));

    // Check Ollama connection
    try {
      console.log(chalk.gray('🔗 Connecting to Ollama...'));
      const models = await ollama.list();
      const hasModel = models.models.some(m => m.name.includes(config.ollama.model.split(':')[0]));
      if (!hasModel) {
        console.log(chalk.yellow(`⚠️  Model ${config.ollama.model} not found. Available models:`));
        models.models.forEach(m => console.log(chalk.gray(`   - ${m.name}`)));
        console.log(chalk.yellow('\n💡 Run: ollama pull ' + config.ollama.model));
        return false;
      }
      console.log(chalk.green('✅ Ollama connected'));
    } catch (error) {
      console.log(chalk.red('❌ Ollama connection failed:'), error.message);
      console.log(chalk.yellow('💡 Make sure Ollama is running: ollama serve'));
      return false;
    }

    // Check API connection
    try {
      console.log(chalk.gray('🔗 Testing API connection...'));
      const response = await fetch(`${config.api.baseUrl}/api/maintenance/status/${config.test.tokenId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log(chalk.green('✅ API connected'));
    } catch (error) {
      console.log(chalk.red('❌ API connection failed:'), error.message);
      console.log(chalk.yellow('💡 Make sure the main app is running: npm run dev'));
      return false;
    }

    // Check wallet
    if (!agentWallet) {
      console.log(chalk.yellow('⚠️  No agent wallet configured - running in simulation mode'));
      console.log(chalk.gray('   Set AGENT_PRIVATE_KEY in .env for real transactions'));
    } else {
      console.log(chalk.green('✅ Agent wallet configured:'), config.wallet.address);
    }

    return true;
  }

  async analyzeRugWithAI(rugData) {
    console.log(chalk.gray('🧠 Analyzing rug condition with Ollama...'));

    const prompt = `You are an AI maintenance agent for digital rugs. Analyze this rug's condition and recommend maintenance action.

Rug Data:
- Token ID: ${rugData.tokenId}
- Can Clean: ${rugData.maintenance.canClean}
- Can Restore: ${rugData.maintenance.canRestore}
- Needs Master Restore: ${rugData.maintenance.needsMaster}
- Dirt Level: ${rugData.maintenance.canClean ? 'Needs cleaning' : 'Clean'}
- Aging: ${rugData.maintenance.canRestore ? 'Needs restoration' : rugData.maintenance.needsMaster ? 'Severely aged' : 'Good condition'}

Service Fees (you earn these):
- Clean: 0.001 ETH
- Restore: 0.002 ETH
- Master: 0.005 ETH

Maintenance Costs (paid by rug owner):
- Clean: ${formatEther(BigInt(rugData.maintenance.cleaningCostWei))} ETH
- Restore: ${formatEther(BigInt(rugData.maintenance.restorationCostWei))} ETH
- Master: ${formatEther(BigInt(rugData.maintenance.masterCostWei))} ETH

Instructions:
1. Analyze the rug's condition
2. Recommend the most appropriate maintenance action (clean, restore, master, or none)
3. Explain your reasoning
4. Consider urgency and cost-effectiveness

Respond in JSON format:
{
  "analysis": "brief analysis of condition",
  "recommendedAction": "clean|restore|master|none",
  "reasoning": "why this action",
  "urgency": "low|medium|high",
  "expectedEarnings": "0.001|0.002|0.005",
  "confidence": "percentage 0-100"
}`;

    try {
      const response = await ollama.generate({
        model: config.ollama.model,
        prompt: prompt,
        format: 'json'
      });

      const analysis = JSON.parse(response.response);
      console.log(chalk.blue('🧠 AI Analysis:'), analysis.analysis);
      console.log(chalk.blue('🎯 Recommended Action:'), analysis.recommendedAction);
      console.log(chalk.blue('⚡ Urgency:'), analysis.urgency);
      console.log(chalk.blue('💰 Expected Earnings:'), analysis.expectedEarnings + ' ETH');

      return analysis;
    } catch (error) {
      console.log(chalk.red('❌ AI analysis failed:'), error.message);
      return null;
    }
  }

  async checkRugStatus(tokenId) {
    console.log(chalk.gray(`🔍 Checking status for rug #${tokenId}...`));

    try {
      const response = await fetch(`${config.api.baseUrl}/api/maintenance/status/${tokenId}`);
      const data = await response.json();

      if (!data.maintenance) {
        throw new Error('Invalid API response');
      }

      console.log(chalk.green(`✅ Rug #${tokenId} status:`));
      console.log(chalk.gray(`   Can Clean: ${data.maintenance.canClean}`));
      console.log(chalk.gray(`   Can Restore: ${data.maintenance.canRestore}`));
      console.log(chalk.gray(`   Needs Master: ${data.maintenance.needsMaster}`));

      return data;
    } catch (error) {
      console.log(chalk.red(`❌ Failed to check rug #${tokenId}:`), error.message);
      return null;
    }
  }

  async getMaintenanceQuote(tokenId, action) {
    console.log(chalk.gray(`💰 Getting quote for ${action} on rug #${tokenId}...`));

    try {
      const response = await fetch(`${config.api.baseUrl}/api/maintenance/quote/${tokenId}/${action}`);
      const data = await response.json();

      if (response.status === 402 && data.x402?.accepts?.[0]) {
        const paymentReq = data.x402.accepts[0];
        const extra = paymentReq.extra;

        console.log(chalk.green(`✅ Payment quote for ${action}:`));
        console.log(chalk.gray(`   Total: ${formatEther(BigInt(paymentReq.maxAmountRequired))} ETH`));
        console.log(chalk.gray(`   Service Fee: ${formatEther(BigInt(extra.serviceFeeWei))} ETH`));
        console.log(chalk.gray(`   Maintenance: ${formatEther(BigInt(extra.maintenanceWei))} ETH`));

        return paymentReq;
      } else {
        console.log(chalk.red('❌ Unexpected quote response'));
        return null;
      }
    } catch (error) {
      console.log(chalk.red('❌ Failed to get quote:'), error.message);
      return null;
    }
  }

  async executeMaintenance(tokenId, paymentReq) {
    const extra = paymentReq.extra;
    const totalValue = BigInt(paymentReq.maxAmountRequired);
    const serviceFee = BigInt(extra.serviceFeeWei);

    console.log(chalk.yellow(`🔧 Executing maintenance for rug #${tokenId}...`));

    if (!agentWallet) {
      console.log(chalk.yellow('⚠️  SIMULATION MODE - No wallet configured'));
      console.log(chalk.gray(`   Would send ${formatEther(totalValue)} ETH to contract`));
      console.log(chalk.gray(`   Would earn ${formatEther(serviceFee)} ETH service fee`));

      // Simulate success
      this.totalEarnings += serviceFee;
      this.maintenanceCount++;
      return true;
    }

    try {
      console.log(chalk.gray('📤 Sending transaction...'));
      const hash = await agentWallet.writeContract({
        address: config.api.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: extra.function,
        args: [BigInt(tokenId)],
        value: totalValue
      });

      console.log(chalk.gray('⏳ Waiting for confirmation...'));
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log(chalk.green('✅ Maintenance completed successfully!'));
        console.log(chalk.green(`💰 Earned ${formatEther(serviceFee)} ETH service fee`));

        this.totalEarnings += serviceFee;
        this.maintenanceCount++;
        return true;
      } else {
        console.log(chalk.red('❌ Transaction failed'));
        return false;
      }
    } catch (error) {
      console.log(chalk.red('❌ Maintenance execution failed:'), error.message);
      return false;
    }
  }

  async authorizeAsAgent() {
    if (!ownerWallet || !agentWallet) {
      console.log(chalk.yellow('⚠️  Cannot authorize agent - missing wallet configuration'));
      return false;
    }

    console.log(chalk.gray('🔐 Authorizing AI agent...'));

    try {
      const hash = await ownerWallet.writeContract({
        address: config.api.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'authorizeMaintenanceAgent',
        args: [this.agentAddress]
      });

      console.log(chalk.gray('⏳ Waiting for authorization...'));
      await publicClient.waitForTransactionReceipt({ hash });

      console.log(chalk.green('✅ Agent authorized successfully!'));
      return true;
    } catch (error) {
      console.log(chalk.red('❌ Authorization failed:'), error.message);
      return false;
    }
  }

  async runMaintenanceCycle() {
    console.log(chalk.blue('\n🏠 Starting maintenance cycle...\n'));

    // Step 1: Check rug status
    const rugData = await this.checkRugStatus(config.test.tokenId);
    if (!rugData) return;

    // Step 2: AI analysis
    const analysis = await this.analyzeRugWithAI(rugData);
    if (!analysis) return;

    // Step 3: Execute recommended action
    if (analysis.recommendedAction === 'none') {
      console.log(chalk.green('✅ No maintenance needed'));
      return;
    }

    // Step 4: Get payment quote
    const paymentReq = await this.getMaintenanceQuote(config.test.tokenId, analysis.recommendedAction);
    if (!paymentReq) return;

    // Step 5: Ask for confirmation (unless auto mode)
    if (!config.test.autoMaintain) {
      console.log(chalk.yellow('\n⚠️  Ready to execute maintenance. Continue? (y/N): '));
      process.stdout.write('> ');
      const answer = await new Promise(resolve => {
        process.stdin.once('data', data => {
          resolve(data.toString().trim().toLowerCase());
        });
      });

      if (answer !== 'y' && answer !== 'yes') {
        console.log(chalk.gray('⏸️  Maintenance cancelled'));
        return;
      }
    }

    // Step 6: Execute maintenance
    const success = await this.executeMaintenance(config.test.tokenId, paymentReq);

    if (success) {
      console.log(chalk.green('\n🎉 Maintenance cycle completed!'));
      console.log(chalk.blue(`📊 Stats: ${this.maintenanceCount} maintenances, ${formatEther(this.totalEarnings)} ETH earned`));
    }
  }

  async startAutonomousMode() {
    console.log(chalk.blue('🤖 Starting autonomous maintenance mode...\n'));
    console.log(chalk.gray(`   Checking every ${config.test.checkInterval / 1000} seconds`));
    console.log(chalk.gray('   Press Ctrl+C to stop\n'));

    this.isRunning = true;

    while (this.isRunning) {
      await this.runMaintenanceCycle();

      if (this.isRunning) {
        console.log(chalk.gray(`⏰ Waiting ${config.test.checkInterval / 1000} seconds...`));
        await new Promise(resolve => setTimeout(resolve, config.test.checkInterval));
      }
    }
  }

  async showStats() {
    console.log(chalk.blue('\n📊 Agent Statistics:'));
    console.log(chalk.gray(`   Maintenances Performed: ${this.maintenanceCount}`));
    console.log(chalk.gray(`   Total Earnings: ${formatEther(this.totalEarnings)} ETH`));
    console.log(chalk.gray(`   Agent Address: ${this.agentAddress || 'Not configured'}`));
    console.log(chalk.gray(`   Ollama Model: ${config.ollama.model}`));
    console.log(chalk.gray(`   API Endpoint: ${config.api.baseUrl}`));
  }

  stop() {
    console.log(chalk.yellow('\n🛑 Stopping AI agent...'));
    this.isRunning = false;
  }
}

// CLI Interface
async function main() {
  console.log(chalk.bold.blue('🧠 Ollama x402 Rug Maintenance Agent\n'));

  const agent = new OllamaRugMaintenanceAgent();

  // Initialize
  const initialized = await agent.initialize();
  if (!initialized) {
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'authorize':
      await agent.authorizeAsAgent();
      break;

    case 'check':
      const tokenId = args[1] || config.test.tokenId;
      await agent.checkRugStatus(tokenId);
      break;

    case 'quote':
      const action = args[1] || 'clean';
      await agent.getMaintenanceQuote(config.test.tokenId, action);
      break;

    case 'analyze':
      const rugData = await agent.checkRugStatus(config.test.tokenId);
      if (rugData) {
        await agent.analyzeRugWithAI(rugData);
      }
      break;

    case 'once':
      await agent.runMaintenanceCycle();
      await agent.showStats();
      break;

    case 'auto':
      // Handle graceful shutdown
      process.on('SIGINT', () => agent.stop());
      process.on('SIGTERM', () => agent.stop());

      await agent.startAutonomousMode();
      break;

    case 'stats':
      await agent.showStats();
      break;

    default:
      console.log(chalk.yellow('Usage:'));
      console.log(chalk.gray('  npm start authorize    - Authorize agent for maintenance'));
      console.log(chalk.gray('  npm start check [id]   - Check rug status'));
      console.log(chalk.gray('  npm start quote [act]  - Get maintenance quote'));
      console.log(chalk.gray('  npm start analyze      - AI analysis of rug'));
      console.log(chalk.gray('  npm start once         - Run one maintenance cycle'));
      console.log(chalk.gray('  npm start auto         - Start autonomous mode'));
      console.log(chalk.gray('  npm start stats        - Show agent statistics'));
      console.log(chalk.gray('\nExamples:'));
      console.log(chalk.gray('  npm start check 5      - Check rug #5'));
      console.log(chalk.gray('  npm start quote clean  - Get cleaning quote'));
      break;
  }
}

// Export for testing
export default OllamaRugMaintenanceAgent;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('💥 Agent crashed:'), error);
    process.exit(1);
  });
}
