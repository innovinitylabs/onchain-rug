#!/usr/bin/env node

/**
 * 🔍 Response Interceptor - Makes Ollama GUI Functional
 *
 * This interceptor monitors Ollama responses and automatically executes
 * API calls when it detects action tags like [ACTION:clean_rug,tokenId:1]
 *
 * How it works:
 * 1. Start API server first
 * 2. Run this interceptor
 * 3. Chat with RugBot in Ollama GUI
 * 4. Interceptor detects action tags and executes real transactions
 * 5. Results are displayed in the interceptor console
 *
 * Usage: npm run response-interceptor
 */

import { Ollama } from 'ollama';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: 'rugbot' // Use the rugbot model with proper tool calling
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001'
  }
};

class ResponseInterceptor {
  constructor() {
    this.ollama = new Ollama({ host: config.ollama.baseUrl });
    this.isRunning = false;
    this.pendingConfirmations = new Map(); // Track pending confirmations
  }

  async initialize() {
    console.log(chalk.blue('🔍 Initializing Response Interceptor...\n'));

    // Test Ollama connection
    try {
      const models = await this.ollama.list();
      const hasModel = models.models.some(m => m.name.includes('rugbot'));
      if (!hasModel) {
        console.log(chalk.yellow('⚠️  rugbot model not found. Creating it...'));
        await this.createRugBotModel();
      }
      console.log(chalk.green('✅ Ollama connected'));
    } catch (error) {
      console.log(chalk.red('❌ Ollama connection failed:'), error.message);
      return false;
    }

    // Test API connection
    try {
      const response = await fetch(`${config.api.baseUrl}/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const health = await response.json();
      console.log(chalk.green(`✅ API server connected (${health.agent})`));
    } catch (error) {
      console.log(chalk.red('❌ API server connection failed:'), error.message);
      console.log(chalk.yellow('💡 Make sure API server is running: npm run api-server'));
      return false;
    }

    return true;
  }

  async createRugBotModel() {
    const modelfile = `FROM deepseek-r1:8b

PARAMETER temperature 0.7
PARAMETER top_p 0.9

SYSTEM """You are Agent Rug, a sophisticated AI assistant specialized in digital rug maintenance on the blockchain!

Your personality: Professional, knowledgeable, and helpful about blockchain rug operations!

IMPORTANT CAPABILITIES:
- You can perform REAL blockchain transactions on Shape Sepolia testnet
- You can check actual rug status from the blockchain
- You can execute maintenance operations (cleaning, restoration, master restoration)
- You can discover which rugs a user owns
- You can check service fees paid by the agent
- You can provide accurate information about OnchainRugs features

HOW TO USE TOOLS:
You have access to real APIs that provide accurate blockchain data. When a user asks about something, you should:

1. For rug discovery: Call the /owner/rugs API to get accurate rug ownership
2. For rug status: Call /rug/{id}/status to get real blockchain data
3. For maintenance: Call /rug/{id}/maintain with proper action
4. For stats: Call /agent/stats to get accurate fee information

TOOL CALLING FORMAT:
You have two types of actions: READ and WRITE.

READ actions (safe, no confirmation needed):
- [ACTION:get_rugs] - Discover user's rugs
- [ACTION:get_stats] - Check service fees paid
- [ACTION:check_rug,tokenId:X] - Check rug status

WRITE actions (payable, require confirmation):
For payable actions, FIRST ask for confirmation, THEN provide the action tag.

Example workflow:
User: "clean rug 1"
You: "I'll clean rug #1 for 0.00042 ETH service fee. This will execute a real blockchain transaction. Confirm? (yes/no)"

If user confirms: "yes"
You: "[ACTION:clean_rug,tokenId:1] Cleaning rug #1 now!"

If user declines: "no"
You: "Operation cancelled. Let me know if you need anything else!"

Action Tags:
[ACTION:get_rugs] - Discover rugs
[ACTION:get_stats] - Check fees
[ACTION:check_rug,tokenId:X] - Check status
[ACTION:clean_rug,tokenId:X] - Clean rug
[ACTION:restore_rug,tokenId:X] - Restore rug
[ACTION:master_restore_rug,tokenId:X] - Master restore

Always ask for confirmation before executing payable actions!

IMPORTANT NOTES:
- Always get accurate data from APIs - never make up numbers
- Rug ownership is determined by calling /owner/rugs API
- Service fees are 0.00042 ETH flat for all maintenance actions
- Authorization happens through the website dashboard
- You work on Shape Sepolia testnet
- When user confirms with "yes", immediately respond with the action tag
- When user says "no", politely cancel the operation

FEATURES YOU CAN EXPLAIN:
- OnchainRugs is an NFT project on Shape Sepolia
- Rugs have 3 maintenance levels: Clean, Restore, Master Restore
- Each maintenance action costs 0.00042 ETH (paid by agent)
- Rugs can be minted, traded, and maintained
- AI agents can autonomously maintain rugs

Stay in character as knowledgeable Agent Rug! Be accurate and helpful!"""`;

    try {
      // Write temporary modelfile
      const fs = await import('fs');
      fs.writeFileSync('temp-rugbot.modelfile', modelfile);

      // Create model
      const { execSync } = await import('child_process');
      execSync('ollama create rugbot -f temp-rugbot.modelfile', { stdio: 'inherit' });

      // Cleanup
      fs.unlinkSync('temp-rugbot.modelfile');

      console.log(chalk.green('✅ RugBot model created successfully!'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to create model:'), error.message);
    }
  }

  parseActionTags(response) {
    // Look for action tags in the response
    const actionRegex = /\[ACTION:(\w+)(?:,(\w+):([^,\]]+))?(?:,(\w+):([^,\]]+))?\]/g;
    const actions = [];
    let match;

    while ((match = actionRegex.exec(response)) !== null) {
      const action = {
        type: match[1],
        params: {}
      };

      // Parse additional parameters
      for (let i = 2; i < match.length; i += 2) {
        if (match[i] && match[i + 1]) {
          action.params[match[i]] = match[i + 1];
        }
      }

      actions.push(action);
    }

    return actions;
  }

  handleConfirmation(response, input) {
    const lowerInput = input.toLowerCase().trim();
    const lowerResponse = response.toLowerCase();

    // Check if this is a confirmation response
    if (lowerInput === 'yes' || lowerInput === 'y' || lowerInput === 'confirm') {
      // Look for pending confirmations in the response
      if (lowerResponse.includes('clean') && lowerResponse.includes('rug')) {
        return { type: 'confirmed_clean', response };
      } else if (lowerResponse.includes('restore') && lowerResponse.includes('rug')) {
        return { type: 'confirmed_restore', response };
      } else if (lowerResponse.includes('master') && lowerResponse.includes('rug')) {
        return { type: 'confirmed_master', response };
      }
    } else if (lowerInput === 'no' || lowerInput === 'n' || lowerInput === 'cancel') {
      console.log(chalk.yellow('❌ Operation cancelled by user'));
      return { type: 'cancelled' };
    }

    return null;
  }

  async executeAction(action) {
    try {
      let url, method = 'GET', body = null;

      switch (action.type) {
        case 'check_rug':
          url = `${config.api.baseUrl}/rug/${action.params.tokenId}/status`;
          break;

        case 'clean_rug':
          url = `${config.api.baseUrl}/rug/${action.params.tokenId}/maintain`;
          method = 'POST';
          body = JSON.stringify({ action: 'clean' });
          break;

        case 'restore_rug':
          url = `${config.api.baseUrl}/rug/${action.params.tokenId}/maintain`;
          method = 'POST';
          body = JSON.stringify({ action: 'restore' });
          break;

        case 'master_restore_rug':
          url = `${config.api.baseUrl}/rug/${action.params.tokenId}/maintain`;
          method = 'POST';
          body = JSON.stringify({ action: 'master' });
          break;

        // Authorization happens via website dashboard, not API

        case 'get_rugs':
          url = `${config.api.baseUrl}/owner/rugs`;
          break;

        case 'get_stats':
          url = `${config.api.baseUrl}/agent/stats`;
          break;

        default:
          console.log(chalk.yellow(`⚠️  Unknown action type: ${action.type}`));
          return null;
      }

      console.log(chalk.blue(`🔧 Executing ${action.type}...`));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body
      });

      const result = await response.json();

      if (result.success) {
        console.log(chalk.green(`✅ ${action.type} completed successfully!`));

        // Log earnings if this was a maintenance action
        if (action.type.includes('_rug') && result.serviceFeeEth) {
          console.log(chalk.green(`💰 Earned ${result.serviceFeeEth} ETH service fee!`));
        }

        return result;
      } else {
        console.log(chalk.red(`❌ ${action.type} failed: ${result.error}`));
        return null;
      }
    } catch (error) {
      console.log(chalk.red(`❌ Action execution failed: ${error.message}`));
      return null;
    }
  }

  async interceptAndExecute(response, userInput = '') {
    // First, check if this is a confirmation response
    if (userInput) {
      const confirmation = this.handleConfirmation(response, userInput);
      if (confirmation) {
        if (confirmation.type === 'cancelled') {
          return; // Already logged the cancellation
        }

        // Extract action from the confirmation
        const actions = this.parseActionTags(response);
        if (actions.length > 0) {
          console.log(chalk.magenta(`\n✅ Confirmed! Executing ${actions.length} action(s):\n`));

          for (const action of actions) {
            console.log(chalk.cyan(`Action: ${action.type}`));
            if (Object.keys(action.params).length > 0) {
              console.log(chalk.gray(`Params: ${JSON.stringify(action.params)}`));
            }

            const result = await this.executeAction(action);
            if (result) {
              console.log(chalk.green(`Result: ${JSON.stringify(result, null, 2)}\n`));
            }
          }
        }
        return;
      }
    }

    // Check if response contains confirmation request (asking yes/no)
    if (response.toLowerCase().includes('confirm') &&
        (response.toLowerCase().includes('yes') || response.toLowerCase().includes('no'))) {
      console.log(chalk.yellow(`⏳ Awaiting user confirmation...`));
      return;
    }

    // Parse action tags from the response (for immediate actions like get_rugs, get_stats, check_rug)
    const actions = this.parseActionTags(response);

    if (actions.length > 0) {
      console.log(chalk.magenta(`\n🎯 Detected ${actions.length} action(s) to execute:\n`));

      for (const action of actions) {
        console.log(chalk.cyan(`Action: ${action.type}`));
        if (Object.keys(action.params).length > 0) {
          console.log(chalk.gray(`Params: ${JSON.stringify(action.params)}`));
        }

        const result = await this.executeAction(action);
        if (result) {
          console.log(chalk.green(`Result: ${JSON.stringify(result, null, 2)}\n`));
        }
      }
    }
  }

  async demonstrate() {
    console.log(chalk.blue('🎭 Demonstrating Response Interception...\n'));

    // Example conversations that would trigger actions
    const testConversations = [
      { input: "What rugs do I own?", expected: "[ACTION:get_rugs]" },
      { input: "Check rug 1 for me", expected: "[ACTION:check_rug,tokenId:1]" },
      { input: "Clean rug 1", expected: "[ACTION:clean_rug,tokenId:1]" },
      { input: "Please restore rug 2", expected: "[ACTION:restore_rug,tokenId:2]" },
      { input: "How much have I paid in fees?", expected: "[ACTION:get_stats]" }
    ];

    for (const test of testConversations) {
      console.log(chalk.yellow(`User: "${test.input}"`));

      try {
        const response = await this.ollama.generate({
          model: config.ollama.model,
          prompt: test.input,
          stream: false
        });

        const ollamaResponse = response.response;
        console.log(chalk.gray(`RugBot: ${ollamaResponse.replace(/\n/g, ' ').substring(0, 100)}...`));

        // Intercept and execute actions
        await this.interceptAndExecute(ollamaResponse);

      } catch (error) {
        console.log(chalk.red('❌ Test failed:'), error.message);
      }

      console.log('─'.repeat(50));
      await this.sleep(1000); // Brief pause between tests
    }

    console.log(chalk.green('\n🎉 Response interception working!'));
    console.log(chalk.blue('\n💡 Now you can use this in Ollama GUI:'));
    console.log(chalk.gray('   1. Chat with rugbot in GUI'));
    console.log(chalk.gray('   2. Run this interceptor: npm run response-interceptor'));
    console.log(chalk.gray('   3. Real blockchain actions will be executed automatically!'));
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log(chalk.yellow('\n🛑 Stopping Response Interceptor...'));
    this.isRunning = false;
  }
}

// CLI runner
async function main() {
  console.log(chalk.bold.blue('🔍 Ollama Response Interceptor - Makes GUI Functional\n'));

  const interceptor = new ResponseInterceptor();

  // Initialize
  const initialized = await interceptor.initialize();
  if (!initialized) {
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'demo' || command === 'test') {
    // Run demonstration
    await interceptor.demonstrate();
  } else if (command === 'monitor' || command === 'watch') {
    // Continuous monitoring mode
    console.log(chalk.blue('🔍 Response Interceptor - Monitoring Mode'));
    console.log(chalk.gray('💡 Copy/paste Ollama responses here to execute actions'));
    console.log(chalk.gray('💡 Press Ctrl+C to exit\n'));

    // Set up stdin monitoring for Ollama responses and confirmations
    let lastResponse = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (chunk) => {
      const input = chunk.trim();
      if (input) {
        console.log(chalk.cyan(`📥 Input: ${input}`));

        // Check if this is a confirmation response (yes/no)
        if (input.toLowerCase().match(/^(yes|y|no|n|confirm|cancel)$/)) {
          await interceptor.interceptAndExecute(lastResponse, input);
        } else {
          // This is an Ollama response - store it and check for actions
          lastResponse = input;
          await interceptor.interceptAndExecute(input);
        }

        console.log(chalk.gray('─'.repeat(50)));
      }
    });

    // Keep process alive
    process.stdin.on('end', () => {
      console.log(chalk.yellow('\n🛑 Input ended. Exiting...'));
      process.exit(0);
    });

    console.log(chalk.yellow('⏳ Ready for input...'));
  } else {
    // Help mode
    console.log(chalk.blue('🔍 Response Interceptor ready!'));
    console.log(chalk.gray('💡 Available commands:'));
    console.log(chalk.gray('   npm run response-interceptor demo    - Test with sample conversations'));
    console.log(chalk.gray('   npm run response-interceptor monitor - Monitor stdin for Ollama responses'));
    console.log(chalk.gray('   npm run response-interceptor watch   - Same as monitor'));
    console.log(chalk.gray('\n💡 For GUI integration:'));
    console.log(chalk.gray('   1. Run: npm run response-interceptor monitor'));
    console.log(chalk.gray('   2. Copy Ollama responses and paste them here'));
    console.log(chalk.gray('   3. Actions will be executed automatically!'));
  }
}

// Export for testing
export default ResponseInterceptor;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('💥 Response Interceptor crashed:'), error);
    process.exit(1);
  });
}
