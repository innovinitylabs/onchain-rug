#!/usr/bin/env node

/**
 * 🤖 Standalone x402 Rug Maintenance AI Agent
 *
 * A completely self-contained AI agent that can:
 * - Connect directly to Ollama for AI decisions
 * - Interact directly with blockchain contracts
 * - Maintain rugs autonomously
 * - Pay service fees
 *
 * No external API dependencies - works standalone!
 *
 * Usage:
 * npm install
 * cp config.example.env .env
 * # Edit .env with your configuration
 * npm start
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';

// Shape Sepolia chain definition (not built into viem)
const shapeSepolia = {
  id: 11011,
  name: 'Shape Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.shape.network'],
    },
    public: {
      http: ['https://sepolia.shape.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shape Sepolia Explorer',
      url: 'https://sepolia.shapescan.xyz',
    },
  },
  testnet: true,
};
import { Ollama } from 'ollama';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'rugbot-updated:latest'
  },
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'https://sepolia.shape.network',
    chainId: parseInt(process.env.CHAIN_ID || '11011'),
    contractAddress: process.env.CONTRACT_ADDRESS || '0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325'
  },
  wallet: {
    privateKey: process.env.AGENT_PRIVATE_KEY,
    address: process.env.AGENT_ADDRESS
  },
  test: {
    tokenId: parseInt(process.env.TEST_TOKEN_ID || '1'),
    autoMaintain: process.env.AUTO_MAINTAIN === 'true',
    checkInterval: parseInt(process.env.MAINTENANCE_CHECK_INTERVAL || '300000')
  },
  agent: {
    name: process.env.AGENT_NAME || 'RugBot',
    style: process.env.AGENT_STYLE || 'helpful,professional,enthusiastic'
  }
};

// Initialize clients
const ollama = new Ollama({
  host: config.ollama.baseUrl
});

const publicClient = createPublicClient({
  chain: shapeSepolia,
  transport: http(config.blockchain.rpcUrl)
});

let agentWallet = null;
if (config.wallet.privateKey) {
  agentWallet = createWalletClient({
    chain: shapeSepolia,
    transport: http(config.blockchain.rpcUrl),
    account: config.wallet.privateKey
  });
}

// Note: Owner authorization is now handled via dashboard UI
// Agent authorization happens in the web app, not here

// Rug Maintenance Contract ABI
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

class StandaloneRugMaintenanceAgent {
  constructor() {
    this.agentAddress = config.wallet.address;
    this.totalServiceFeesPaid = 0n;
    this.maintenanceCount = 0;
    this.isRunning = false;
  }

  async initialize() {
    console.log(chalk.blue(`🤖 Initializing ${config.agent.name} - Standalone Rug Maintenance Agent...\n`));

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
      console.log(chalk.yellow('💡 Make sure Ollama is running'));
      return false;
    }

    // Check blockchain connection
    try {
      console.log(chalk.gray('⛓️  Testing blockchain connection...'));
      const blockNumber = await publicClient.getBlockNumber();
      console.log(chalk.green(`✅ Blockchain connected (Block: ${blockNumber})`));
    } catch (error) {
      console.log(chalk.red('❌ Blockchain connection failed:'), error.message);
      console.log(chalk.yellow('💡 Check your RPC_URL configuration'));
      return false;
    }

    // Check contract
    try {
      console.log(chalk.gray('📋 Testing contract connection...'));
      const fees = await publicClient.readContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getAgentServiceFees'
      });
      console.log(chalk.green('✅ Contract connected'));
      console.log(chalk.gray(`   Service fees: Clean=${formatEther(fees[0])} ETH, Restore=${formatEther(fees[1])} ETH, Master=${formatEther(fees[2])} ETH`));
    } catch (error) {
      console.log(chalk.red('❌ Contract connection failed:'), error.message);
      console.log(chalk.yellow('💡 Check your CONTRACT_ADDRESS configuration'));
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
    console.log(chalk.gray('🧠 Analyzing rug condition with AI...'));

    const prompt = `You are ${config.agent.name}, an AI maintenance agent for digital rugs. Analyze this rug's condition and recommend maintenance action.

Rug Data:
- Token ID: ${rugData.tokenId}
- Can Clean: ${rugData.canClean}
- Can Restore: ${rugData.canRestore}
- Needs Master Restore: ${rugData.needsMaster}
- Cleaning Cost: ${formatEther(rugData.cleaningCost)} ETH
- Restoration Cost: ${formatEther(rugData.restorationCost)} ETH
- Master Cost: ${formatEther(rugData.masterCost)} ETH

Service Fees (you pay these):
- Clean: 0.001 ETH
- Restore: 0.002 ETH
- Master: 0.005 ETH

Your personality: ${config.agent.style}

Instructions:
1. Analyze the rug's condition
2. Recommend the most appropriate maintenance action (clean, restore, master, or none)
3. Explain your reasoning clearly
4. Consider urgency and cost-effectiveness
5. Stay in character as ${config.agent.name}

Respond in JSON format:
{
  "analysis": "brief analysis of condition",
  "recommendedAction": "clean|restore|master|none",
  "reasoning": "why this action",
  "urgency": "low|medium|high",
  "expectedEarnings": "0.001|0.002|0.005",
  "confidence": "percentage 0-100",
  "personalityNote": "fun comment in your style"
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
      if (analysis.personalityNote) {
        console.log(chalk.cyan('🤖 ' + config.agent.name + ':'), analysis.personalityNote);
      }

      return analysis;
    } catch (error) {
      console.log(chalk.red('❌ AI analysis failed:'), error.message);
      return null;
    }
  }

  async checkRugStatus(tokenId) {
    console.log(chalk.gray(`🔍 Checking status for rug #${tokenId}...`));

    try {
      const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await publicClient.readContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getMaintenanceOptions',
        args: [BigInt(tokenId)]
      });

      const rugData = {
        tokenId,
        canClean,
        canRestore,
        needsMaster,
        cleaningCost,
        restorationCost,
        masterCost
      };

      console.log(chalk.green(`✅ Rug #${tokenId} status:`));
      console.log(chalk.gray(`   Can Clean: ${canClean} (${formatEther(cleaningCost)} ETH)`));
      console.log(chalk.gray(`   Can Restore: ${canRestore} (${formatEther(restorationCost)} ETH)`));
      console.log(chalk.gray(`   Needs Master: ${needsMaster} (${formatEther(masterCost)} ETH)`));

      return rugData;
    } catch (error) {
      console.log(chalk.red(`❌ Failed to check rug #${tokenId}:`), error.message);
      return null;
    }
  }

  async executeMaintenance(tokenId, action, maintenanceCost, serviceFee) {
    const totalValue = maintenanceCost + serviceFee;

    console.log(chalk.yellow(`🔧 Executing ${action} maintenance for rug #${tokenId}...`));
    console.log(chalk.gray(`   Maintenance: ${formatEther(maintenanceCost)} ETH`));
    console.log(chalk.gray(`   Service Fee: ${formatEther(serviceFee)} ETH`));
    console.log(chalk.gray(`   Total: ${formatEther(totalValue)} ETH`));

    if (!agentWallet) {
      console.log(chalk.yellow('⚠️  SIMULATION MODE - No wallet configured'));
      console.log(chalk.gray(`   Would send ${formatEther(totalValue)} ETH to contract`));
      console.log(chalk.gray(`   Would pay ${formatEther(serviceFee)} ETH service fee`));

      // Simulate success
      this.totalServiceFeesPaid += serviceFee;
      this.maintenanceCount++;
      return true;
    }

    try {
      console.log(chalk.gray('📤 Sending transaction...'));

      // Map action to function name
      const functionNameMap = {
        'clean': 'cleanRugAgent',
        'restore': 'restoreRugAgent',
        'master': 'masterRestoreRugAgent'
      };

      const hash = await agentWallet.writeContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: functionNameMap[action],
        args: [BigInt(tokenId)],
        value: totalValue
      });

      console.log(chalk.gray('⏳ Waiting for confirmation...'));
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log(chalk.green('✅ Maintenance completed successfully!'));
        console.log(chalk.green(`💰 Paid ${formatEther(serviceFee)} ETH service fee`));

        this.totalServiceFeesPaid += serviceFee;
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

  // Note: Agent authorization is now handled via dashboard UI
  // Rug owners authorize agents through the web app dashboard

  async runMaintenanceCycle() {
    console.log(chalk.blue('\n🏠 Starting maintenance cycle...\n'));

    // Get service fees
    let serviceFees;
    try {
      const fees = await publicClient.readContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getAgentServiceFees'
      });
      serviceFees = { clean: fees[0], restore: fees[1], master: fees[2] };
    } catch (error) {
      console.log(chalk.red('❌ Could not get service fees:'), error.message);
      return;
    }

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

    // Get the appropriate costs
    let maintenanceCost, serviceFee;
    switch (analysis.recommendedAction) {
      case 'clean':
        maintenanceCost = rugData.cleaningCost;
        serviceFee = serviceFees.clean;
        break;
      case 'restore':
        maintenanceCost = rugData.restorationCost;
        serviceFee = serviceFees.restore;
        break;
      case 'master':
        maintenanceCost = rugData.masterCost;
        serviceFee = serviceFees.master;
        break;
      default:
        console.log(chalk.red('❌ Unknown action recommended by AI'));
        return;
    }

    // Step 4: Ask for confirmation (unless auto mode)
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

    // Step 5: Execute maintenance
    const success = await this.executeMaintenance(
      config.test.tokenId,
      analysis.recommendedAction,
      maintenanceCost,
      serviceFee
    );

    if (success) {
      console.log(chalk.green('\n🎉 Maintenance cycle completed!'));
      console.log(chalk.blue(`📊 Stats: ${this.maintenanceCount} maintenances, ${formatEther(this.totalServiceFeesPaid)} ETH in service fees paid`));
    }
  }

  async startAutonomousMode() {
    console.log(chalk.blue(`🤖 Starting autonomous maintenance mode as ${config.agent.name}...\n`));
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
    console.log(chalk.gray('═'.repeat(40)));
    console.log(chalk.gray(`   Agent Name: ${config.agent.name}`));
    console.log(chalk.gray(`   Maintenances Performed: ${this.maintenanceCount}`));
    console.log(chalk.gray(`   Total Service Fees Paid: ${formatEther(this.totalServiceFeesPaid)} ETH`));
    console.log(chalk.gray(`   Agent Address: ${this.agentAddress || 'Not configured'}`));
    console.log(chalk.gray(`   Ollama Model: ${config.ollama.model}`));
    console.log(chalk.gray(`   Contract: ${config.blockchain.contractAddress}`));
    console.log(chalk.gray(`   Network: Base Sepolia`));
  }

  stop() {
    console.log(chalk.yellow('\n🛑 Stopping AI agent...'));
    this.isRunning = false;
  }
}

// CLI Interface
async function main() {
  console.log(chalk.bold.blue('🤖 Standalone x402 Rug Maintenance Agent\n'));

  const agent = new StandaloneRugMaintenanceAgent();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  // Initialize first
  const initialized = await agent.initialize();
  if (!initialized) {
    process.exit(1);
  }

  switch (command) {
    case 'check':
      const tokenId = args[1] || config.test.tokenId;
      await agent.checkRugStatus(tokenId);
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
      console.log(chalk.gray('  npm start check [id]   - Check rug status'));
      console.log(chalk.gray('  npm start analyze      - AI analysis of rug'));
      console.log(chalk.gray('  npm start once         - Run one maintenance cycle'));
      console.log(chalk.gray('  npm start auto         - Start autonomous mode'));
      console.log(chalk.gray('  npm start stats        - Show agent statistics'));
      console.log(chalk.gray('\n⚠️  Authorization: Use dashboard UI (/dashboard) to authorize agents'));
      console.log(chalk.gray('\nExamples:'));
      console.log(chalk.gray('  npm start check 5      - Check rug #5'));
      console.log(chalk.gray('  npm start once         - Maintain test rug'));
      break;
  }
}

// Export for testing
export default StandaloneRugMaintenanceAgent;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('💥 Agent crashed:'), error);
    process.exit(1);
  });
}
