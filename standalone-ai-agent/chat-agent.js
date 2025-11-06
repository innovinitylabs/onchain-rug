#!/usr/bin/env node

/**
 * 💬 Standalone Chat Interface for x402 Rug Maintenance AI Agent
 *
 * Interactive chat with your AI agent - completely standalone!
 *
 * Usage: npm run chat
 */

import StandaloneRugMaintenanceAgent from './standalone-agent.js';
import chalk from 'chalk';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment
dotenv.config();

class StandaloneChatAgent {
  constructor() {
    this.agent = new StandaloneRugMaintenanceAgent();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.isInitialized = false;
    this.conversationHistory = [];
  }

  async initialize() {
    console.log(chalk.blue('🤖 Initializing Standalone Chat Agent...\n'));

    this.isInitialized = await this.agent.initialize();
    if (!this.isInitialized) {
      console.log(chalk.red('❌ Agent initialization failed'));
      return false;
    }

    console.log(chalk.green('✅ Standalone Chat Agent ready!'));
    console.log(chalk.gray('💡 Type commands or ask questions. Type "help" for commands.\n'));

    return true;
  }

  async startChat() {
    if (!await this.initialize()) return;

    const askQuestion = () => {
      this.rl.question(chalk.cyan('You: '), async (input) => {
        await this.processInput(input.trim());
        askQuestion(); // Continue the chat loop
      });
    };

    askQuestion();
  }

  async processInput(input) {
    if (!input) return;

    // Store in conversation history
    this.conversationHistory.push({ role: 'user', message: input });

    // Process commands
    const command = input.toLowerCase();

    if (command === 'exit' || command === 'quit' || command === 'bye') {
      console.log(chalk.yellow('👋 Goodbye!'));
      this.rl.close();
      process.exit(0);
    }

    if (command === 'help' || command === '?') {
      this.showHelp();
      return;
    }

    if (command === 'stats' || command === 'status') {
      await this.agent.showStats();
      return;
    }

    // Parse natural language commands
    await this.processNaturalLanguage(input);
  }

  showHelp() {
    console.log(chalk.blue('\n📋 Available Commands:\n'));

    console.log(chalk.yellow('Maintenance Commands:'));
    console.log(chalk.gray('  "check rug 1"           - Check rug #1 status'));
    console.log(chalk.gray('  "clean rug 1"           - Clean rug #1'));
    console.log(chalk.gray('  "restore rug 1"         - Restore rug #1'));
    console.log(chalk.gray('  "master restore rug 1"  - Master restore rug #1'));
    console.log(chalk.gray('  "maintain rug 1"        - Auto-maintain rug #1'));
    console.log(chalk.gray('  "analyze rug 1"         - AI analysis of rug #1'));

    console.log(chalk.yellow('\nManagement Commands:'));
    console.log(chalk.gray('  "authorize me"          - Authorize agent'));
    console.log(chalk.gray('  "show stats"            - Show agent statistics'));
    console.log(chalk.gray('  "start auto mode"       - Start autonomous mode'));
    console.log(chalk.gray('  "stop"                  - Stop autonomous mode'));

    console.log(chalk.yellow('\nGeneral Commands:'));
    console.log(chalk.gray('  "help"                  - Show this help'));
    console.log(chalk.gray('  "exit"                  - Quit chat'));

    console.log(chalk.yellow('\nNatural Language Examples:'));
    console.log(chalk.gray('  "How is my rug doing?"'));
    console.log(chalk.gray('  "Clean all my rugs"'));
    console.log(chalk.gray('  "What can you do?"'));
    console.log(chalk.gray('  "Show me the earnings"'));
  }

  async processNaturalLanguage(input) {
    const lowerInput = input.toLowerCase();

    // Rug maintenance commands
    const rugCheck = input.match(/check\s+(?:rug\s+)?(?:#)?(\d+)/i);
    if (rugCheck) {
      const tokenId = parseInt(rugCheck[1]);
      console.log(chalk.blue(`🔍 Checking rug #${tokenId}...`));
      await this.agent.checkRugStatus(tokenId);
      return;
    }

    const rugClean = input.match(/(?:clean|wash)\s+(?:rug\s+)?(?:#)?(\d+)/i);
    if (rugClean) {
      const tokenId = parseInt(rugClean[1]);
      await this.performMaintenance(tokenId, 'clean');
      return;
    }

    const rugRestore = input.match(/(?:restore|fix)\s+(?:rug\s+)?(?:#)?(\d+)/i);
    if (rugRestore) {
      const tokenId = parseInt(rugRestore[1]);
      await this.performMaintenance(tokenId, 'restore');
      return;
    }

    const rugMaster = input.match(/(?:master\s+)?restore\s+(?:rug\s+)?(?:#)?(\d+)/i);
    if (rugMaster && lowerInput.includes('master')) {
      const tokenId = parseInt(rugMaster[1]);
      await this.performMaintenance(tokenId, 'master');
      return;
    }

    // Auto maintenance
    const rugMaintain = input.match(/(?:maintain|auto)\s+(?:rug\s+)?(?:#)?(\d+)/i);
    if (rugMaintain) {
      const tokenId = parseInt(rugMaintain[1]);
      console.log(chalk.blue(`🤖 Auto-maintaining rug #${tokenId}...`));
      await this.agent.runMaintenanceCycle();
      return;
    }

    // AI analysis
    const rugAnalyze = input.match(/(?:analyze|analyse)\s+(?:rug\s+)?(?:#)?(\d+)/i);
    if (rugAnalyze) {
      const tokenId = parseInt(rugAnalyze[1]);
      console.log(chalk.blue(`🧠 Analyzing rug #${tokenId}...`));
      const status = await this.agent.checkRugStatus(tokenId);
      if (status) {
        await this.agent.analyzeRugWithAI(status);
      }
      return;
    }

    // Authorization
    if (lowerInput.includes('authorize') || lowerInput.includes('permission')) {
      console.log(chalk.blue('🔐 Authorizing agent...'));
      await this.agent.authorizeAsAgent();
      return;
    }

    // Autonomous mode
    if (lowerInput.includes('auto') && lowerInput.includes('mode')) {
      if (lowerInput.includes('start')) {
        console.log(chalk.blue('🤖 Starting autonomous mode...'));
        console.log(chalk.yellow('⚠️  Press Ctrl+C to stop'));
        await this.agent.startAutonomousMode();
      } else if (lowerInput.includes('stop')) {
        console.log(chalk.yellow('🛑 Stopping autonomous mode...'));
        this.agent.stop();
      }
      return;
    }

    // Stats and earnings
    if (lowerInput.includes('stats') || lowerInput.includes('earnings') ||
        lowerInput.includes('performance') || lowerInput.includes('how much')) {
      await this.agent.showStats();
      return;
    }

    // General inquiries - use AI to respond
    await this.handleGeneralInquiry(input);
  }

  async performMaintenance(tokenId, action) {
    console.log(chalk.blue(`🔧 Preparing to ${action} rug #${tokenId}...`));

    // Check status first
    const rugData = await this.agent.checkRugStatus(tokenId);
    if (!rugData) return;

    // Get service fees
    let serviceFee;
    try {
      const fees = await publicClient.readContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getAgentServiceFees'
      });

      switch (action) {
        case 'clean': serviceFee = fees[0]; break;
        case 'restore': serviceFee = fees[1]; break;
        case 'master': serviceFee = fees[2]; break;
      }
    } catch (error) {
      console.log(chalk.red('❌ Could not get service fees:'), error.message);
      return;
    }

    // AI analysis
    const analysis = await this.agent.analyzeRugWithAI(rugData);
    if (analysis && analysis.recommendedAction !== action) {
      console.log(chalk.yellow(`⚠️  AI recommends "${analysis.recommendedAction}" instead of "${action}"`));
      console.log(chalk.gray(`   Reasoning: ${analysis.reasoning}`));

      const proceed = await this.askYesNo('Continue with your choice?');
      if (!proceed) return;
    }

    // Confirm execution
    const proceed = await this.askYesNo(`Execute ${action} maintenance for rug #${tokenId}?`);
    if (!proceed) return;

    // Get maintenance cost
    let maintenanceCost;
    switch (action) {
      case 'clean': maintenanceCost = rugData.cleaningCost; break;
      case 'restore': maintenanceCost = rugData.restorationCost; break;
      case 'master': maintenanceCost = rugData.masterCost; break;
    }

    // Execute maintenance
    const success = await this.agent.executeMaintenance(tokenId, action, maintenanceCost, serviceFee);

    if (success) {
      console.log(chalk.green(`✅ Successfully ${action}ed rug #${tokenId}!`));
    }
  }

  async handleGeneralInquiry(input) {
    console.log(chalk.blue('🧠 Thinking...'));

    const contextPrompt = `You are ${config.agent.name}, a helpful AI maintenance agent for digital rugs. The user asked: "${input}"

Based on our conversation history:
${this.conversationHistory.slice(-3).map(h => `${h.role}: ${h.message}`).join('\n')}

Available actions you can suggest:
- Check rug status: "check rug [id]"
- Clean rug: "clean rug [id]"
- Restore rug: "restore rug [id]"
- Master restore: "master restore rug [id]"
- Show stats: "show stats"
- Start autonomous mode: "start auto mode"

Keep your response helpful and concise. If they ask what you can do, list the main actions. Stay in character as ${config.agent.name}.

Respond in JSON format:
{
  "response": "your helpful response",
  "suggestedAction": "optional action suggestion"
}`;

    try {
      const response = await ollama.generate({
        model: config.ollama.model,
        prompt: contextPrompt,
        format: 'json'
      });

      const aiResponse = JSON.parse(response.response);

      // Store AI response
      this.conversationHistory.push({ role: 'assistant', message: aiResponse.response });

      console.log(chalk.green('🤖 ') + aiResponse.response);

      if (aiResponse.suggestedAction) {
        console.log(chalk.gray(`💡 Try: "${aiResponse.suggestedAction}"`));
      }

    } catch (error) {
      console.log(chalk.red('❌ AI response failed, try a specific command instead'));
      console.log(chalk.gray('💡 Type "help" for available commands'));
    }
  }

  askYesNo(question) {
    return new Promise(resolve => {
      this.rl.question(chalk.yellow(`${question} (y/N): `), (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  stop() {
    console.log(chalk.yellow('\n🛑 Stopping chat agent...'));
    this.rl.close();
    this.agent.stop();
  }
}

// Import required modules for chat
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Ollama } from 'ollama';

// Initialize clients (needed for chat functions)
const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

const config = {
  blockchain: {
    contractAddress: process.env.CONTRACT_ADDRESS || '0xa43532205Fc90b286Da98389a9883347Cc4064a8'
  },
  agent: {
    name: process.env.AGENT_NAME || 'RugBot'
  }
};

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL || 'https://sepolia.base.org')
});

// ABI for chat functions
const RugMaintenanceAbi = [
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

// CLI runner
async function main() {
  console.log(chalk.bold.blue('💬 Standalone x402 Rug Maintenance Chat Agent\n'));

  const chatAgent = new StandaloneChatAgent();

  // Handle graceful shutdown
  process.on('SIGINT', () => chatAgent.stop());

  try {
    await chatAgent.startChat();
  } catch (error) {
    console.error(chalk.red('💥 Chat agent crashed:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
