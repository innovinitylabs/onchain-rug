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
    this.conversationState = {
      lastTopic: null,
      mentionedRugs: new Set(),
      lastCommand: null,
      contextData: {},
      userPreferences: {}
    };
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

    // Update conversation state
    this.updateConversationState(input);

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
    console.log(chalk.blue('\n🤖 RugBot AI Agent - Enhanced Natural Language Support\n'));

    console.log(chalk.yellow('💬 Natural Language Commands (Recommended):'));
    console.log(chalk.gray('  "How is my rug doing?"     - Check all your rugs'));
    console.log(chalk.gray('  "What\'s the status of rug 1?" - Check specific rug'));
    console.log(chalk.gray('  "Clean rug 1"              - Clean a specific rug'));
    console.log(chalk.gray('  "Fix my rug 2"             - Restore a rug'));
    console.log(chalk.gray('  "Analyze rug 1"            - AI analysis of rug condition'));
    console.log(chalk.gray('  "How much ETH do I have?"  - Check wallet balance'));
    console.log(chalk.gray('  "How many maintenances?"   - Check maintenance history'));
    console.log(chalk.gray('  "Show me the costs"        - View earnings and fees'));
    console.log(chalk.gray('  "Start autonomous mode"    - Begin auto-maintenance'));

    console.log(chalk.yellow('\n🔧 Direct Commands (Still Supported):'));
    console.log(chalk.gray('  check rug [id]            - Check rug status'));
    console.log(chalk.gray('  clean rug [id]            - Clean specific rug'));
    console.log(chalk.gray('  restore rug [id]          - Restore specific rug'));
    console.log(chalk.gray('  master restore rug [id]   - Master restore rug'));
    console.log(chalk.gray('  analyze rug [id]          - AI analysis'));
    console.log(chalk.gray('  show stats                - Show agent statistics'));

    console.log(chalk.yellow('\n🎯 What I Can Do:'));
    console.log(chalk.gray('  ✅ Check real wallet balances from blockchain'));
    console.log(chalk.gray('  ✅ Track actual maintenance operation counts'));
    console.log(chalk.gray('  ✅ Provide real-time gas cost estimates'));
    console.log(chalk.gray('  ✅ Discover all rugs you own'));
    console.log(chalk.gray('  ✅ Execute real blockchain transactions'));
    console.log(chalk.gray('  ✅ AI-powered rug condition analysis'));
    console.log(chalk.gray('  ✅ Autonomous maintenance scheduling'));

    console.log(chalk.yellow('\n💰 Service Fees:'));
    console.log(chalk.gray('  • All maintenance actions: 0.00042 ETH flat fee'));
    console.log(chalk.gray('  • Free operations: status checks, balance queries'));
    console.log(chalk.gray('  • Gas fees: Paid by agent wallet'));

    console.log(chalk.yellow('\n❓ General Commands:'));
    console.log(chalk.gray('  "help" or "what can you do?" - Show this help'));
    console.log(chalk.gray('  "exit" or "quit"           - Exit chat'));
    console.log(chalk.gray('  "bye"                      - Say goodbye'));

    console.log(chalk.cyan('\n💡 Tip: Try asking in natural language! I understand context and can help with various queries.\n'));
  }

  async processNaturalLanguage(input) {
    const lowerInput = input.toLowerCase();

    // Enhanced pattern matching for rug operations
    const rugPatterns = {
      check: /(?:check|status|how.?s|what.?s)\s+(?:rug\s+|my\s+)?(?:#)?(\d+)(?:\s+doing|\s+looking|\s+status)?/i,
      clean: /(?:clean|wash|dust)\s+(?:rug\s+|my\s+)?(?:#)?(\d+)/i,
      restore: /(?:restore|fix|repair)\s+(?:rug\s+|my\s+)?(?:#)?(\d+)/i,
      master: /(?:master\s+(?:restore|fix|repair)|full\s+(?:restore|fix))\s+(?:rug\s+|my\s+)?(?:#)?(\d+)/i,
      analyze: /(?:analyze|analyse|assess|evaluate)\s+(?:rug\s+|my\s+)?(?:#)?(\d+)/i,
      maintain: /(?:maintain|service|take\s+care\s+of)\s+(?:rug\s+|my\s+)?(?:#)?(\d+)/i
    };

    // Check for specific rug operations
    for (const [action, pattern] of Object.entries(rugPatterns)) {
      const match = input.match(pattern);
      if (match) {
        const tokenId = parseInt(match[1]);
        await this.handleRugOperation(action, tokenId, input);
        return;
      }
    }

    // Handle general rug queries (no specific ID)
    if (lowerInput.includes('my rug') || lowerInput.includes('all rug') ||
        lowerInput.includes('rug ') || lowerInput.includes('rugs')) {

      if (lowerInput.includes('check') || lowerInput.includes('status') ||
          lowerInput.includes('how') || lowerInput.includes('what')) {
        await this.handleGeneralRugQuery('status', input);
        return;
      }

      if (lowerInput.includes('clean') || lowerInput.includes('wash')) {
        await this.handleGeneralRugQuery('clean', input);
        return;
      }

      if (lowerInput.includes('restore') || lowerInput.includes('fix')) {
        await this.handleGeneralRugQuery('restore', input);
        return;
      }

      if (lowerInput.includes('analyze') || lowerInput.includes('assess')) {
        await this.handleGeneralRugQuery('analyze', input);
        return;
      }
    }

    // Handle wallet/balance queries
    if (lowerInput.includes('balance') || lowerInput.includes('wallet') ||
        lowerInput.includes('eth') || lowerInput.includes('money') ||
        lowerInput.includes('funds') || lowerInput.includes('how much')) {
      await this.handleWalletQuery(input);
      return;
    }

    // Handle maintenance history/operations queries
    if (lowerInput.includes('maintenance') || lowerInput.includes('operations') ||
        lowerInput.includes('performed') || lowerInput.includes('done') ||
        lowerInput.includes('history') || lowerInput.includes('count')) {
      await this.handleMaintenanceHistoryQuery(input);
      return;
    }

    // Handle stats/earnings queries
    if (lowerInput.includes('stats') || lowerInput.includes('earnings') ||
        lowerInput.includes('performance') || lowerInput.includes('costs') ||
        lowerInput.includes('paid') || lowerInput.includes('spent')) {
      await this.handleStatsQuery(input);
      return;
    }

    // Handle autonomous mode queries
    if (lowerInput.includes('auto') || lowerInput.includes('autonomous')) {
      if (lowerInput.includes('start') || lowerInput.includes('begin') || lowerInput.includes('run')) {
        console.log(chalk.blue('🤖 Starting autonomous mode...'));
        console.log(chalk.yellow('⚠️  Press Ctrl+C to stop'));
        await this.agent.startAutonomousMode();
      } else if (lowerInput.includes('stop') || lowerInput.includes('end') || lowerInput.includes('quit')) {
        console.log(chalk.yellow('🛑 Stopping autonomous mode...'));
        this.agent.stop();
      } else {
        console.log(chalk.blue('🤖 Autonomous mode allows continuous monitoring and maintenance of your rugs.'));
        console.log(chalk.gray('   Commands: "start autonomous mode", "stop autonomous mode"'));
      }
      return;
    }

    // Handle help queries
    if (lowerInput.includes('help') || lowerInput.includes('what can') ||
        lowerInput.includes('commands') || lowerInput.includes('options')) {
      this.showHelp();
      return;
    }

    // Handle authorization queries
    if (lowerInput.includes('authorize') || lowerInput.includes('permission') ||
        lowerInput.includes('access')) {
      console.log(chalk.blue('🔐 Agent authorization is handled through the dashboard UI.'));
      console.log(chalk.gray('   Visit /dashboard to authorize agents for maintenance operations.'));
      return;
    }

    // Default to AI-powered response for unrecognized inputs
    await this.handleGeneralInquiry(input);
  }

  async performMaintenance(tokenId, action) {
    try {
      console.log(chalk.blue(`🔧 Preparing to ${action} rug #${tokenId}...`));

      // Check status first
      const rugData = await this.agent.checkRugStatus(tokenId);
      if (!rugData) {
        console.log(chalk.yellow(`⚠️ Could not retrieve status for rug #${tokenId}`));
        console.log(chalk.gray('💡 The rug might not exist or there might be a network issue'));
        return;
      }

    // Get service fees
    let serviceFee;
    try {
      const [serviceFeeFromContract, feeRecipient] = await publicClient.readContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getAgentServiceFee'
      });

      // Use the flat service fee for all actions
      serviceFee = serviceFeeFromContract;
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
      } else {
        console.log(chalk.red(`❌ Maintenance operation failed for rug #${tokenId}`));
        console.log(chalk.gray('💡 Check wallet balance and network connection'));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Failed to ${action} rug #${tokenId}:`), error.message);
      console.log(chalk.gray('💡 This might be due to insufficient funds, network issues, or contract errors'));
      console.log(chalk.gray('💡 Try checking your wallet balance first: "how much ETH do I have?"'));
    }
  }

  async handleGeneralInquiry(input) {
    console.log(chalk.blue('🧠 Analyzing your request with full context...'));

    try {
      // Update context data for better responses
      await this.updateContextData();

      const contextData = this.conversationState.contextData;

      const contextPrompt = `You are ${config.agent.name}, a professional AI maintenance agent for digital rugs on the blockchain.

USER QUESTION: "${input}"

CONVERSATION CONTEXT:
- Last Topic: ${this.conversationState.lastTopic || 'None'}
- Last Command: ${this.conversationState.lastCommand || 'None'}
- Mentioned Rugs: ${Array.from(this.conversationState.mentionedRugs).join(', ') || 'None'}
- Conversation Length: ${this.conversationHistory.length} messages

REAL-TIME BLOCKCHAIN DATA:
- Agent Wallet Balance: ${contextData.walletBalance || 'Unknown'} ETH
- Maintenance Operations Performed: ${contextData.maintenanceCount || '0'}
- Total Service Fees Paid: ${contextData.totalServiceFees || '0'} ETH
- Recent Transactions: ${contextData.recentTransactions || '0'}
- Network: Shape Sepolia (x402 enabled)

RECENT CONVERSATION (${Math.min(3, this.conversationHistory.length)} messages):
${this.conversationHistory.slice(-3).map(h => `${h.role}: ${h.message}`).join('\n')}

AVAILABLE ACTIONS:
- "check rug [id]" - Check specific rug status (free)
- "clean rug [id]" - Clean a rug (0.00042 ETH service fee + maintenance cost)
- "restore rug [id]" - Restore a rug (0.00042 ETH service fee + maintenance cost)
- "analyze rug [id]" - AI analysis of rug condition
- "how much ETH do I have?" - Check real wallet balance (free)
- "how many maintenances?" - Check maintenance history (free)
- "show stats" - Comprehensive statistics (free)
- "start autonomous mode" - Continuous maintenance

INSTRUCTIONS FOR RESPONSE:
- Be contextual - reference previous conversation topics when relevant
- Use real blockchain data to provide accurate information
- If user mentioned specific rugs before, reference them in suggestions
- Be proactive - suggest next logical steps based on conversation flow
- Explain costs clearly (service fee is 0.00042 ETH for all maintenance actions)
- Stay in character as ${config.agent.name} - professional, enthusiastic, helpful
- Keep responses informative but concise
- If this is a follow-up question, provide continuity

RESPONSE FORMAT:
{
  "response": "Contextual response using conversation history and real data",
  "suggestedAction": "Optional contextual suggestion based on conversation flow"
}`;

      const ollama = new Ollama({ host: config.ollama.baseUrl });
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
      console.log(chalk.red('❌ AI analysis failed, but I can still help with direct commands!'));
      console.log(chalk.gray('💡 Try asking about wallet balance, maintenance history, or rug status'));
      console.log(chalk.gray('💡 Type "help" to see all available commands'));
    }
  }

  async handleRugOperation(action, tokenId, originalInput) {
    try {
      switch (action) {
        case 'check':
          console.log(chalk.blue(`🔍 Checking rug #${tokenId}...`));
          await this.agent.checkRugStatus(tokenId);
          break;

        case 'clean':
          await this.performMaintenance(tokenId, 'clean');
          break;

        case 'restore':
          await this.performMaintenance(tokenId, 'restore');
          break;

        case 'master':
          await this.performMaintenance(tokenId, 'master');
          break;

        case 'analyze':
          console.log(chalk.blue(`🧠 Analyzing rug #${tokenId}...`));
          const status = await this.agent.checkRugStatus(tokenId);
          if (status) {
            await this.agent.analyzeRugWithAI(status);
          } else {
            console.log(chalk.yellow(`⚠️ Could not retrieve status for rug #${tokenId}`));
          }
          break;

        case 'maintain':
          console.log(chalk.blue(`🤖 Auto-maintaining rug #${tokenId}...`));
          await this.agent.runMaintenanceCycle();
          break;

        default:
          console.log(chalk.yellow(`⚠️ Unknown action: ${action}`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Failed to ${action} rug #${tokenId}:`), error.message);
      console.log(chalk.gray('💡 This might be due to network issues or invalid rug ID'));
      console.log(chalk.gray('💡 Try "check rug 1" to verify the rug exists'));
    }
  }

  async handleGeneralRugQuery(action, originalInput) {
    // Get rugs owned by the owner (from environment)
    try {
      console.log(chalk.blue('🔍 Discovering your rugs...'));

      // Try to get owner rugs from API
      const response = await fetch(`${config.api?.baseUrl || 'http://localhost:3001'}/owner/rugs`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.ownedRugs && result.data.ownedRugs.length > 0) {
          const data = result.data;
          console.log(chalk.green(`✅ Found ${data.ownedRugs.length} rug(s): ${data.ownedRugs.join(', ')}`));

          // Handle the action for all rugs or ask user to specify
          if (action === 'status') {
            console.log(chalk.blue('📊 Checking status of all your rugs...'));
            for (const rugId of data.ownedRugs) {
              await this.agent.checkRugStatus(rugId);
              console.log(''); // Add spacing
            }
          } else {
            console.log(chalk.yellow(`💡 Please specify which rug (e.g., "${action} rug ${data.ownedRugs[0]}")`));
          }
          return;
        }
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not discover your rugs automatically'));
      console.log(chalk.gray(`   Error: ${error.message}`));
      console.log(chalk.gray('💡 Make sure the API server is running: npm run api-server'));
    }

    // Fallback - ask for specific rug ID
    console.log(chalk.yellow(`💡 Please specify a rug ID (e.g., "${action} rug 1")`));
  }

  async handleWalletQuery(originalInput) {
    console.log(chalk.blue('💰 Checking wallet balance...'));

    try {
      // Get real wallet balance from blockchain
      if (config.wallet?.address) {
        const balance = await publicClient.getBalance({
          address: config.wallet.address
        });
        const balanceEth = formatEther(balance);

        console.log(chalk.green('✅ Agent Wallet Balance:'));
        console.log(chalk.cyan(`   Address: ${config.wallet.address}`));
        console.log(chalk.cyan(`   Balance: ${balanceEth} ETH`));

        // Estimate gas costs
        try {
          const gasPrice = await publicClient.getGasPrice();
          const estimatedGasCost = gasPrice * 21000n; // Basic transfer
          const estimatedGasCostEth = formatEther(estimatedGasCost);
          console.log(chalk.gray(`   Estimated gas cost: ~${estimatedGasCostEth} ETH per transaction`));

          // Check if balance is sufficient for operations
          const minBalance = parseEther('0.001'); // Minimum for operations
          if (balance < minBalance) {
            console.log(chalk.yellow('⚠️ Low balance - may need to add funds for maintenance operations'));
            console.log(chalk.gray('   Recommended minimum: 0.01 ETH for gas fees'));
          } else {
            console.log(chalk.gray('   ✅ Sufficient balance for operations'));
          }
        } catch (gasError) {
          console.log(chalk.yellow('⚠️ Could not estimate gas costs:'), gasError.message);
        }
      } else {
        console.log(chalk.yellow('⚠️ No agent wallet configured'));
        console.log(chalk.gray('   Set AGENT_PRIVATE_KEY and AGENT_ADDRESS in .env'));
        console.log(chalk.gray('   Then restart the chat agent'));
      }
    } catch (error) {
      console.log(chalk.red('❌ Could not check wallet balance:'), error.message);
      console.log(chalk.gray('💡 Check your RPC_URL and network connection'));
      console.log(chalk.gray('💡 Verify AGENT_ADDRESS is correct'));
    }
  }

  async handleMaintenanceHistoryQuery(originalInput) {
    console.log(chalk.blue('📊 Checking maintenance history...'));

    try {
      // Get agent stats which includes maintenance count
      const response = await fetch(`${config.api?.baseUrl || 'http://localhost:3001'}/agent/stats`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          console.log(chalk.green('✅ Maintenance History:'));
          console.log(chalk.cyan(`   Maintenances Performed: ${data.maintenanceCount || 0}`));
          console.log(chalk.cyan(`   Agent Address: ${data.walletAddress || 'Not configured'}`));
          console.log(chalk.cyan(`   Network: ${data.network || 'Unknown'}`));

          if (data.maintenanceCount === 0) {
            console.log(chalk.gray('   💡 No maintenance operations performed yet'));
            console.log(chalk.gray('   Try: "clean rug 1" to perform your first maintenance!'));
          } else {
            console.log(chalk.gray(`   📈 Success rate: ${(data.maintenanceCount > 0 ? 100 : 0)}%`));
          }
        } else {
          console.log(chalk.yellow('⚠️ Unexpected API response structure'));
          await this.agent.showStats();
        }
      } else {
        // Fallback to agent stats
        await this.agent.showStats();
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not fetch maintenance history from API'));
      console.log(chalk.gray('   Falling back to agent statistics...'));
      await this.agent.showStats();
    }
  }

  async handleStatsQuery(originalInput) {
    console.log(chalk.blue('📊 Gathering comprehensive statistics...'));

    try {
      // Get agent stats from API
      const apiUrl = config.api?.baseUrl || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/agent/stats`);

      if (response.ok) {
        const result = await response.json();

        // Check if the response has the expected structure
        if (result.success && result.data) {
          const stats = result.data; // The actual stats are in result.data

          console.log(chalk.green('✅ Agent Statistics:'));
          console.log(chalk.cyan('═'.repeat(60)));
          console.log(chalk.cyan(`   Agent Name: ${stats.agentName || 'Unknown'}`));
          console.log(chalk.cyan(`   Wallet Address: ${stats.walletAddress || 'Not configured'}`));
          console.log(chalk.cyan(`   Wallet Balance: ${stats.walletBalanceEth || '0'} ETH`));
          console.log(chalk.cyan(`   Maintenances Performed: ${stats.maintenanceCount || 0}`));
          console.log(chalk.cyan(`   Service Fees Paid: ${stats.totalServiceFeesPaidEth || '0'} ETH`));
          console.log(chalk.cyan(`   Estimated Gas Fees: ${stats.estimatedGasFeesPaidEth || '0'} ETH`));
          console.log(chalk.cyan(`   Network: ${stats.network || 'Unknown'}`));
          console.log(chalk.cyan(`   Service Fee Info: ${stats.serviceFeeInfo || ''}`));
          console.log(chalk.cyan(`   Data Source: ${result.dataSource || 'Unknown'}`));

          // Add some insights
          if ((stats.maintenanceCount || 0) > 0) {
            const avgFee = parseFloat(stats.totalServiceFeesPaidEth || '0') / stats.maintenanceCount;
            console.log(chalk.gray(`   💡 Average service fee: ${avgFee.toFixed(6)} ETH per maintenance`));
          }

          if (stats.walletError) {
            console.log(chalk.yellow(`   ⚠️ Wallet Error: ${stats.walletError}`));
          }

          console.log(chalk.gray(`   📅 Last Updated: ${result.timestamp ? new Date(result.timestamp).toLocaleString() : 'Unknown'}`));
        } else {
          console.log(chalk.yellow('⚠️ Unexpected API response structure'));
          console.log(chalk.gray('   Falling back to local agent statistics...'));
          await this.agent.showStats();
        }
      } else {
        console.log(chalk.yellow(`⚠️ API request failed with status ${response.status}`));
        console.log(chalk.gray('   Falling back to local agent statistics...'));
        await this.agent.showStats();
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not fetch stats from API, using local data...'));
      console.log(chalk.gray(`   Error: ${error.message}`));
      await this.agent.showStats();
    }
  }

  updateConversationState(input) {
    const lowerInput = input.toLowerCase();

    // Track mentioned rug IDs
    const rugMatches = input.match(/(?:rug\s+|#)?(\d+)/gi);
    if (rugMatches) {
      rugMatches.forEach(match => {
        const rugId = match.replace(/[^\d]/g, '');
        if (rugId) this.conversationState.mentionedRugs.add(parseInt(rugId));
      });
    }

    // Track conversation topics
    if (lowerInput.includes('balance') || lowerInput.includes('wallet') || lowerInput.includes('eth') || lowerInput.includes('money')) {
      this.conversationState.lastTopic = 'wallet';
    } else if (lowerInput.includes('maintenance') || lowerInput.includes('operations') || lowerInput.includes('history')) {
      this.conversationState.lastTopic = 'maintenance';
    } else if (lowerInput.includes('rug') || lowerInput.includes('status') || lowerInput.includes('check')) {
      this.conversationState.lastTopic = 'rug_status';
    } else if (lowerInput.includes('cost') || lowerInput.includes('fee') || lowerInput.includes('stats')) {
      this.conversationState.lastTopic = 'costs';
    }

    // Track last command type
    if (lowerInput.includes('clean') || lowerInput.includes('restore') || lowerInput.includes('fix')) {
      this.conversationState.lastCommand = 'maintenance';
    } else if (lowerInput.includes('check') || lowerInput.includes('status')) {
      this.conversationState.lastCommand = 'status_check';
    } else if (lowerInput.includes('analyze') || lowerInput.includes('assess')) {
      this.conversationState.lastCommand = 'analysis';
    }
  }

  async updateContextData() {
    try {
      // Update context data periodically or when needed
      const walletData = await this.agent.getRealWalletBalance();
      const txHistory = await this.agent.getTransactionHistory();

      this.conversationState.contextData = {
        walletBalance: walletData.balanceEth,
        maintenanceCount: this.agent.maintenanceCount,
        totalServiceFees: formatEther(this.agent.totalServiceFeesPaid),
        recentTransactions: txHistory.recentTransactions.length,
        mentionedRugs: Array.from(this.conversationState.mentionedRugs),
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      // Silently handle context update failures
      this.conversationState.contextData = { error: 'Could not update context' };
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
import { Ollama } from 'ollama';

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

// Initialize clients (needed for chat functions)
const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'rugbot-updated:latest'
  },
  blockchain: {
    contractAddress: process.env.CONTRACT_ADDRESS
  },
  agent: {
    name: process.env.AGENT_NAME || 'RugBot'
  }
};

const publicClient = createPublicClient({
  chain: shapeSepolia,
  transport: http(process.env.RPC_URL || 'https://sepolia.shape.network')
});

// ABI for chat functions
const RugMaintenanceAbi = [
  {
    inputs: [],
    name: 'getAgentServiceFee',
    outputs: [
      { name: 'serviceFee', type: 'uint256' },
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

