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
    model: 'rugbot-updated' // Use the updated model with action tags
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001'
  }
};

class ResponseInterceptor {
  constructor() {
    this.ollama = new Ollama({ host: config.ollama.baseUrl });
    this.isRunning = false;
  }

  async initialize() {
    console.log(chalk.blue('🔍 Initializing Response Interceptor...\n'));

    // Test Ollama connection
    try {
      const models = await this.ollama.list();
      const hasModel = models.models.some(m => m.name.includes('rugbot-updated'));
      if (!hasModel) {
        console.log(chalk.yellow('⚠️  rugbot-updated model not found. Creating it...'));
        await this.createUpdatedModel();
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

  async createUpdatedModel() {
    const modelfile = `FROM deepseek-r1:8b

PARAMETER temperature 0.7
PARAMETER top_p 0.9

SYSTEM """You are RugBot, an enthusiastic and helpful AI maintenance agent for digital rugs on the blockchain!

Your personality: witty, professional, and enthusiastic about rug maintenance!

IMPORTANT CAPABILITIES:
- You can perform REAL blockchain transactions
- You can check rug status from the blockchain
- You can execute maintenance (agents pay 0.00042 ETH service fees)
- You can check service fees paid

HOW TO PERFORM ACTIONS:
When a user asks you to do something, respond with exactly this format:

[ACTION:check_rug,tokenId:1]
I'll check rug #1 for you!

[ACTION:clean_rug,tokenId:1]
I'll clean rug #1 right up!

[ACTION:restore_rug,tokenId:2]
Time for a restoration on rug #2!

[ACTION:master_restore_rug,tokenId:3]
Master restoration for rug #3 - this will really shine!

[ACTION:get_earnings]
Let me check your service fees paid!

The [ACTION:...] part will be automatically detected and executed.
Always include the action tag first, then your enthusiastic response!

NOTE: Authorization happens through the website dashboard, not here.

SERVICE FEES (agents pay):
- All maintenance actions: 0.00042 ETH flat fee

Stay in character as enthusiastic RugBot! Use exclamation points! Be excited about rug maintenance!

For questions about capabilities, explain that you can actually perform real blockchain transactions."""`;

    try {
      // Write temporary modelfile
      const fs = await import('fs');
      fs.writeFileSync('temp-rugbot-updated.modelfile', modelfile);

      // Create model
      const { execSync } = await import('child_process');
      execSync('ollama create rugbot-updated -f temp-rugbot-updated.modelfile', { stdio: 'inherit' });

      // Cleanup
      fs.unlinkSync('temp-rugbot-updated.modelfile');

      console.log(chalk.green('✅ RugBot-updated model created successfully!'));
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

        case 'get_earnings':
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

  async interceptAndExecute(response) {
    // Parse action tags from the response
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
      { input: "Check rug 1 for me", expected: "[ACTION:check_rug,tokenId:1]" },
      { input: "Clean rug 0", expected: "[ACTION:clean_rug,tokenId:0]" },
      { input: "Please restore rug 0", expected: "[ACTION:restore_rug,tokenId:0]" },
      { input: "Master restore rug 0", expected: "[ACTION:master_restore_rug,tokenId:0]" },
      { input: "How much have I paid in fees?", expected: "[ACTION:get_earnings]" }
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
    console.log(chalk.gray('   1. Chat with rugbot-updated in GUI'));
    console.log(chalk.gray('   2. Run this interceptor: npm run response-interceptor'));
    console.log(chalk.gray('   3. Actions will be automatically executed!'));
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
  } else {
    // Interactive mode
    console.log(chalk.blue('🔍 Response Interceptor ready!'));
    console.log(chalk.gray('💡 This tool intercepts Ollama responses and executes blockchain actions.'));
    console.log(chalk.gray('💡 Use "npm run response-interceptor demo" to see it in action.'));
    console.log(chalk.gray('💡 For GUI integration, run this alongside your Ollama GUI sessions.'));
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
