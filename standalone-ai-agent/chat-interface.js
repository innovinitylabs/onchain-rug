#!/usr/bin/env node

/**
 * 🔍 Seamless Chat Interface for Agent Rug
 *
 * This provides a seamless chat experience with Agent Rug
 * No copy/paste required - just chat naturally!
 *
 * Usage: npm run chat
 */

import { Ollama } from 'ollama';
import { MerchantExecutor } from 'x402';
import dotenv from 'dotenv';
import chalk from 'chalk';
import readline from 'readline';

// Load environment variables
dotenv.config();

const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: 'llama3.1:8b'
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001'
  }
};

class AgentRugChat {
  constructor() {
    this.ollama = new Ollama({ host: config.ollama.baseUrl });
    this.conversationHistory = [];
    this.tools = this.defineTools();
    this.systemPrompt = this.getSystemPrompt();
  }

  defineTools() {
    return [
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
          description: 'Check the status of a specific rug',
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
          description: 'Clean a rug (costs 0.00042 ETH service fee)',
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
          description: 'Restore a rug (costs 0.00042 ETH service fee)',
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
          description: 'Master restore a rug (costs 0.00042 ETH service fee)',
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

  getSystemPrompt() {
    return `You are Agent Rug, a sophisticated AI assistant specialized in digital rug maintenance on the blockchain!

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

IMPORTANT: For maintenance actions (clean_rug, restore_rug, master_restore_rug), you MUST ask the user for confirmation before calling the tool, because these execute real blockchain transactions that cost 0.00042 ETH each.

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
- When user confirms with "yes", immediately call the tool
- When user says "no", politely cancel the operation

FEATURES YOU CAN EXPLAIN:
- OnchainRugs is an NFT project on Shape Sepolia
- Rugs have 3 maintenance levels: Clean, Restore, Master Restore
- Each maintenance action costs 0.00042 ETH (paid by agent)
- Rugs can be minted, traded, and maintained
- AI agents can autonomously maintain rugs

Stay in character as knowledgeable Agent Rug! Be accurate and helpful!`;
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

  async chatWithAgent(userInput) {
    try {
      // Add user message to conversation
      this.conversationHistory.push({ role: 'user', content: userInput });

      const response = await this.ollama.chat({
        model: config.ollama.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...this.conversationHistory
        ],
        tools: this.tools,
        stream: false
      });

      const assistantMessage = response.message;

      // Add assistant response to conversation
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage.content,
        tool_calls: assistantMessage.tool_calls
      });

      // Handle tool calls if any
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(chalk.magenta(`🎯 Executing ${assistantMessage.tool_calls.length} tool call(s)...`));

        for (const toolCall of assistantMessage.tool_calls) {
          const result = await this.executeToolCall(toolCall);

          // Add tool result to conversation
          this.conversationHistory.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: toolCall.id
          });
        }

        // Get final response after tool execution
        const finalResponse = await this.ollama.chat({
          model: config.ollama.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory
          ],
          stream: false
        });

        return finalResponse.message.content;
      }

      return assistantMessage.content;

    } catch (error) {
      console.error(chalk.red('❌ Chat error:'), error.message);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  async startInteractiveChat() {
    console.log(chalk.bold.blue('🤖 Agent Rug - Seamless Blockchain Chat'));
    console.log(chalk.gray('💡 Chat naturally with Agent Rug!'));
    console.log(chalk.gray('💡 Type "exit" to quit\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = () => {
      rl.question(chalk.cyan('You: '), async (input) => {
        if (input.toLowerCase() === 'exit') {
          console.log(chalk.yellow('👋 Goodbye!'));
          rl.close();
          return;
        }

        console.log(chalk.gray('Agent Rug:'), 'Thinking...');

        const response = await this.chatWithAgent(input);

        console.log(chalk.green('Agent Rug:'), response);
        console.log(''); // Empty line for readability

        askQuestion(); // Continue the conversation
      });
    };

    askQuestion();
  }
}

// Main execution
async function main() {
  const chat = new AgentRugChat();

  // Test API connection
  try {
    const response = await fetch(`${config.api.baseUrl}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const health = await response.json();
    console.log(chalk.green(`✅ API server connected (${health.agent})`));
  } catch (error) {
    console.log(chalk.red('❌ API server connection failed:'), error.message);
    console.log(chalk.yellow('💡 Make sure API server is running: npm run api-server'));
    process.exit(1);
  }

  // Test Ollama connection
  try {
    const models = await chat.ollama.list();
    const hasModel = models.models.some(m => m.name.includes('llama3.1'));
    if (!hasModel) {
      console.log(chalk.red('❌ Llama 3.1 model not found. Please run: ollama pull llama3.1:8b'));
      process.exit(1);
    }
    console.log(chalk.green('✅ Llama 3.1 ready with tool calling'));
  } catch (error) {
    console.log(chalk.red('❌ Ollama connection failed:'), error.message);
    process.exit(1);
  }

  await chat.startInteractiveChat();
}

main().catch(console.error);
