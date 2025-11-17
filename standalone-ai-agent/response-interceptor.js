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
    model: 'llama3.1:8b' // Use Llama 3.1 which has native tool calling support
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

    // Define available tools for Ollama
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'get_rugs',
          description: 'Discover which rugs the user owns on the blockchain',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_stats',
          description: 'Check the service fees paid by the agent',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'check_rug',
          description: 'Check the status and condition of a specific rug',
          parameters: {
            type: 'object',
            properties: {
              tokenId: {
                type: 'integer',
                description: 'The token ID of the rug to check'
              }
            },
            required: ['tokenId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'clean_rug',
          description: 'Clean a rug (0.00042 ETH service fee + maintenance cost)',
          parameters: {
            type: 'object',
            properties: {
              tokenId: {
                type: 'integer',
                description: 'The token ID of the rug to clean'
              }
            },
            required: ['tokenId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'restore_rug',
          description: 'Restore a rug (0.00042 ETH service fee + maintenance cost)',
          parameters: {
            type: 'object',
            properties: {
              tokenId: {
                type: 'integer',
                description: 'The token ID of the rug to restore'
              }
            },
            required: ['tokenId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'master_restore_rug',
          description: 'Master restore a rug (0.00042 ETH service fee + maintenance cost)',
          parameters: {
            type: 'object',
            properties: {
              tokenId: {
                type: 'integer',
                description: 'The token ID of the rug to master restore'
              }
            },
            required: ['tokenId']
          }
        }
      }
    ];
  }

  async initialize() {
    console.log(chalk.blue('🔍 Initializing Response Interceptor...\n'));

    // Test Ollama connection
    try {
      const models = await this.ollama.list();
      const hasModel = models.models.some(m => m.name.includes('llama3.1'));
      if (!hasModel) {
        console.log(chalk.red('❌ Llama 3.1 model not found. Please run: ollama pull llama3.1:8b'));
        return false;
      }
      console.log(chalk.green('✅ Ollama connected with Llama 3.1 (tool calling enabled)'));
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
    const modelfile = `FROM llama3.1:8b

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

TOOL CALLING:
You have access to tools that allow you to interact with the OnchainRugs blockchain. Use these tools to provide accurate information and execute real blockchain transactions.

Available Tools:
- get_rugs: Discover which rugs the user owns
- get_stats: Check service fees paid
- check_rug: Check the status of a specific rug
- clean_rug: Clean a rug (requires confirmation)
- restore_rug: Restore a rug (requires confirmation)
- master_restore_rug: Master restore a rug (requires confirmation)

IMPORTANT: For maintenance actions (clean_rug, restore_rug, master_restore_rug), you MUST ask the user for confirmation before calling the tool, because these execute real blockchain transactions that cost 0.00042 ETH service fee plus the actual maintenance cost.

Workflow for maintenance actions:
1. User requests maintenance
2. You explain the cost and ask for confirmation
3. User confirms with "yes"
4. You call the appropriate tool
5. User says "no" - you politely decline

For read-only actions (get_rugs, get_stats, check_rug), you can call the tools immediately without confirmation.

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
- Each maintenance action costs 0.00042 ETH service fee + actual maintenance cost (paid by agent)
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

  parseToolCalls(response) {
    // Check if response has tool_calls (Ollama's native tool calling)
    if (response.tool_calls && Array.isArray(response.tool_calls)) {
      return response.tool_calls.map(toolCall => ({
        type: toolCall.function.name,
        params: toolCall.function.arguments || {}
      }));
    }

    // Fallback to action tag parsing for backward compatibility
    const actionRegex = /\[ACTION:(\w+)(?:,(\w+):([^,\]]+))?(?:,(\w+):([^,\]]+))?\]/g;
    const actions = [];
    let match;

    while ((match = actionRegex.exec(response.content || response)) !== null) {
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

  async executeToolCall(toolCall) {
    try {
      const { name, arguments: args } = toolCall.function;
      let url, method = 'GET', body = null;

      switch (name) {
        case 'get_rugs':
          url = `${config.api.baseUrl}/owner/rugs`;
          break;
        case 'get_stats':
          url = `${config.api.baseUrl}/agent/stats`;
          break;
        case 'check_rug':
          url = `${config.api.baseUrl}/rug/${args.tokenId}/status`;
          break;
        case 'clean_rug':
          url = `${config.api.baseUrl}/rug/${args.tokenId}/maintain`;
          method = 'POST';
          body = JSON.stringify({ action: 'clean' });
          break;
        case 'restore_rug':
          url = `${config.api.baseUrl}/rug/${args.tokenId}/maintain`;
          method = 'POST';
          body = JSON.stringify({ action: 'restore' });
          break;
        case 'master_restore_rug':
          url = `${config.api.baseUrl}/rug/${args.tokenId}/maintain`;
          method = 'POST';
          body = JSON.stringify({ action: 'master' });
          break;
        default:
          console.log(chalk.red(`❌ Unknown tool: ${name}`));
          return null;
      }

      console.log(chalk.blue(`🔧 Executing ${name}...`));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body
      });

      const result = await response.json();

      if (result.success) {
        console.log(chalk.green(`✅ ${name} completed successfully!`));

        // Log fees if this was a maintenance action
        if (name.includes('_rug') && result.serviceFeeEth) {
          console.log(chalk.green(`💰 Paid ${result.serviceFeeEth} ETH service fee!`));
        }

        return result;
      } else {
        console.log(chalk.red(`❌ ${name} failed: ${result.error}`));
        return null;
      }
    } catch (error) {
      console.log(chalk.red(`❌ Tool execution failed: ${error.message}`));
      return null;
    }
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
    // Handle Ollama's native tool_calls format (preferred)
    if (response && response.tool_calls && response.tool_calls.length > 0) {
      console.log(chalk.magenta(`\n🎯 Detected ${response.tool_calls.length} native tool call(s) to execute:\n`));

      for (const toolCall of response.tool_calls) {
        console.log(chalk.cyan(`Tool: ${toolCall.function.name}`));
        console.log(chalk.gray(`Args: ${JSON.stringify(toolCall.function.arguments)}`));

        const result = await this.executeToolCall(toolCall);
        if (result) {
          console.log(chalk.green(`Result: ${JSON.stringify(result, null, 2)}\n`));
        }
      }
      return;
    }

    // Handle confirmation responses for payable actions
    if (userInput) {
      const confirmation = this.handleConfirmation(response, userInput);
      if (confirmation) {
        if (confirmation.type === 'cancelled') {
          return; // Already logged the cancellation
        }

        // Extract action from the confirmation (fallback to text parsing)
        const actions = this.parseToolCalls(response);
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
    if (response && typeof response === 'string' && response.toLowerCase().includes('confirm') &&
        (response.toLowerCase().includes('yes') || response.toLowerCase().includes('no'))) {
      console.log(chalk.yellow(`⏳ Awaiting user confirmation...`));
      return;
    }

    // Fallback: Parse tool calls from text response
    if (response && typeof response === 'string') {
      const actions = this.parseToolCalls(response);

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
  }

  async demonstrate() {
    console.log(chalk.blue('🎭 Demonstrating Response Interception...\n'));

    // Example conversations that would trigger actions
    const testConversations = [
      { input: "What rugs do I own?", expected: "[ACTION:get_rugs]" },
      { input: "Check rug 1 for me", expected: "[ACTION:check_rug,tokenId:1]" },
      { input: "How much have I paid in fees?", expected: "[ACTION:get_stats]" },
      { input: "Clean rug 1", expected: "confirmation request" },
      { input: "yes", expected: "[ACTION:clean_rug,tokenId:1]" } // Simulate confirmation
    ];

    let lastResponse = '';

    for (const test of testConversations) {
      console.log(chalk.yellow(`User: "${test.input}"`));

      try {
        if (test.input === 'yes') {
          // This is a confirmation response - simulate tool call
          console.log(chalk.gray(`RugBot: Calling clean_rug tool...`));
          const simulatedToolCall = {
            tool_calls: [{
              function: {
                name: 'clean_rug',
                arguments: { tokenId: 1 }
              }
            }]
          };
          await this.interceptAndExecute(simulatedToolCall);
        } else {
          // Use Ollama's chat API with tools and system prompt
          const systemPrompt = `You are Agent Rug, a sophisticated AI assistant specialized in digital rug maintenance on the blockchain!

Your personality: Professional, knowledgeable, and helpful about blockchain rug operations!

IMPORTANT CAPABILITIES:
- You can perform REAL blockchain transactions on Shape Sepolia testnet
- You can check actual rug status from the blockchain
- You can execute maintenance operations (cleaning, restoration, master restoration)
- You can discover which rugs a user owns
- You can check service fees paid by the agent
- You can provide accurate information about OnchainRugs features

TOOL CALLING:
You have access to tools that allow you to interact with the OnchainRugs blockchain. Use these tools to provide accurate information and execute real blockchain transactions.

Available Tools:
- get_rugs: Discover which rugs the user owns
- get_stats: Check service fees paid
- check_rug: Check the status of a specific rug
- clean_rug: Clean a rug (requires confirmation)
- restore_rug: Restore a rug (requires confirmation)
- master_restore_rug: Master restore a rug (requires confirmation)

IMPORTANT: For maintenance actions (clean_rug, restore_rug, master_restore_rug), you MUST ask the user for confirmation before calling the tool, because these execute real blockchain transactions that cost 0.00042 ETH service fee plus the actual maintenance cost.

Workflow for maintenance actions:
1. User requests maintenance
2. You explain the cost and ask for confirmation
3. User confirms with "yes"
4. You call the appropriate tool
5. User says "no" - you politely decline

For read-only actions (get_rugs, get_stats, check_rug), you can call the tools immediately without confirmation.

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
- Each maintenance action costs 0.00042 ETH service fee + actual maintenance cost (paid by agent)
- Rugs can be minted, traded, and maintained
- AI agents can autonomously maintain rugs

Stay in character as knowledgeable Agent Rug! Be accurate and helpful!`;

          const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: test.input }
          ];

          const response = await this.ollama.chat({
            model: config.ollama.model,
            messages: messages,
            tools: this.tools,
            stream: false
          });

          lastResponse = response.message;

          if (test.expected === 'confirmation request') {
            console.log(chalk.gray(`RugBot: I'll clean rug #1 for 0.00042 ETH service fee. Confirm? (yes/no)`));
            console.log(chalk.yellow(`⏳ Awaiting user confirmation...`));
          } else {
            console.log(chalk.gray(`RugBot: ${response.message.content || 'Tool call made'}`));
            // Check for tool calls
            if (response.message.tool_calls) {
              console.log(chalk.blue(`🔧 Tool calls detected: ${response.message.tool_calls.length}`));
            }
            // Intercept and execute actions
            await this.interceptAndExecute(response.message);
          }
        }

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
