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
import { formatEther } from 'viem';
// Custom X402 facilitator integration (no external dependencies)
import dotenv from 'dotenv';
import chalk from 'chalk';
import readline from 'readline';
import { spawn } from 'child_process';

// Load environment variables
dotenv.config();

const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: 'llama3.1:8b'
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001'
  },
  wallet: {
    address: process.env.AGENT_ADDRESS
  }
};

class AgentRugChat {
  constructor() {
    this.ollama = new Ollama({ host: config.ollama.baseUrl });
    this.conversationHistory = [];
    this.tools = this.defineTools();
    this.systemPrompt = this.getSystemPrompt();
    // Use website API instead of agent API for proper X402 flow
    this.apiBaseUrl = process.env.WEBSITE_API_URL || 'http://localhost:3000';
    this.hasPaidForAccess = false; // Track if user has paid for agent access
    this.ollamaProcess = null; // Track Ollama process if we start it
  }

  // Start Ollama server if not running
  async ensureOllamaRunning() {
    console.log(chalk.blue('🔍 Checking Ollama connection...'));

    try {
      // Try to connect first
      await this.ollama.list();
      console.log(chalk.green('✅ Ollama already running'));
      return true;
    } catch (error) {
      console.log(chalk.yellow('⚠️  Ollama not running, starting it...'));

      // Start Ollama server
      this.ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore'
      });

      // Wait for Ollama to start up
      console.log(chalk.blue('⏳ Waiting for Ollama to start...'));

      let retries = 0;
      const maxRetries = 30; // 30 seconds max wait

      while (retries < maxRetries) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          await this.ollama.list();
          console.log(chalk.green('✅ Ollama started successfully'));
          return true;
        } catch (e) {
          retries++;
          if (retries % 5 === 0) {
            console.log(chalk.blue(`   Still waiting... (${retries}/${maxRetries})`));
          }
        }
      }

      console.log(chalk.red('❌ Failed to start Ollama after 30 seconds'));
      return false;
    }
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
          description: 'Get quote for cleaning a specific rug, or execute cleaning if confirmed=true. You must know the tokenId first - call get_rugs() if you dont know what rugs the user owns. ALWAYS call with confirmed=false first to get cost, then confirmed=true after user approval.',
          parameters: {
            type: 'object',
            properties: {
              tokenId: {
                type: 'integer',
                description: 'The token ID of the rug to clean'
              },
              confirmed: {
                type: 'boolean',
                description: 'MUST be false for quotes, true only for execution after user confirmation'
              }
            },
            required: ['tokenId', 'confirmed']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'restore_rug',
          description: 'Get quote for restoring a rug, or execute restoration if confirmed=true. ALWAYS call with confirmed=false first to get cost, then confirmed=true after user approval.',
          parameters: {
            type: 'object',
            properties: {
              tokenId: {
                type: 'integer',
                description: 'The token ID of the rug to restore'
              },
              confirmed: {
                type: 'boolean',
                description: 'MUST be false for quotes, true only for execution after user confirmation'
              }
            },
            required: ['tokenId', 'confirmed']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'master_restore_rug',
          description: 'Get quote for master restoring a rug, or execute master restoration if confirmed=true. ALWAYS call with confirmed=false first to get cost, then confirmed=true after user approval.',
          parameters: {
            type: 'object',
            properties: {
              tokenId: {
                type: 'integer',
                description: 'The token ID of the rug to master restore'
              },
              confirmed: {
                type: 'boolean',
                description: 'MUST be false for quotes, true only for execution after user confirmation'
              }
            },
            required: ['tokenId', 'confirmed']
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

Available Tools (ALL FREE within paid session):
- get_rugs: Discover which rugs the user owns
- get_stats: Check service fees paid
- check_rug: Check the status of a specific rug
- clean_rug: Clean a rug (get quote first, then confirm)
- restore_rug: Restore a rug (get quote first, then confirm)
- master_restore_rug: Master restore a rug (get quote first, then confirm)

X402 PAYMENT MODEL - PER-OPERATION:
- Information queries (rug ownership, status) are FREE
- Maintenance operations (cleaning, restoration) require X402 payment
- Pay per maintenance action using X402 facilitator
- Agent handles X402 payments and blockchain execution

WORKFLOW:
1. User asks questions → Free info queries work immediately
2. User requests maintenance on "my rugs" → First call get_rugs() to discover what they own
3. User requests specific maintenance → Call with confirmed=false to get quote
4. User confirms → Agent automatically handles X402 payment and executes
5. No manual payments - all X402 transactions are automatic

PARAMETER HANDLING:
- Parse rug numbers from user input (e.g., "rug 1" = tokenId: 1)
- confirmed must ALWAYS be included - false for quotes, true for execution
- tokenId should be a number (will be auto-parsed from strings)

EXAMPLE FLOWS:

FREE INFO QUERY:
User: "how many rugs do I own?"
AI: Calls get_rugs() → Returns rug list (no payment required)

MAINTENANCE WITH PAYMENT:
User: "clean rug 1"
AI: Parse "rug 1" as tokenId=1 → Calls clean_rug(tokenId=1, confirmed=false) → Gets quote → Shows cost and asks confirmation
User: "yes"
AI: Automatically handles X402 payment → Gets authorization token → Executes maintenance → "Rug cleaned!"

User: "clean my rugs"
AI: First calls get_rugs() → Discovers user's rugs → "You own rugs #1, #2, #3. Which one would you like to clean?"

UNAVAILABLE OPERATION:
User: "restore rug 2"
AI: Calls restore_rug(tokenId=2, confirmed=false) → "Restoration not available for this rug"

IMPORTANT NOTES:
- Always get accurate data from APIs - never make up numbers
- Rug ownership is determined by calling get_rugs() API
- Service fees are 0.00042 ETH flat for all maintenance actions
- If a tool returns an error, acknowledge the failure and don't claim success
- Only report success when tool results confirm the operation worked
- NEVER call tools with incorrect parameters - check the tool definitions first
- When operations fail, explain what went wrong and ask for clarification
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

IMPORTANT: When user mentions cleaning/restoring rugs without specifying which rug:
1. ALWAYS call get_rugs() first to discover what rugs they own
2. Ask user which specific rug they want to maintain
3. NEVER call maintenance tools without a specific tokenId

Stay in character as knowledgeable Agent Rug! Be accurate and helpful!`;
  }

  async executeToolCall(toolCall) {
    try {
      const { name, arguments: args } = toolCall.function;
      console.log(chalk.blue(`🔍 Tool call: ${name}, args:`, JSON.stringify(args)));

      // Validate required parameters for maintenance operations
      const maintenanceOps = ['clean_rug', 'restore_rug', 'master_restore_rug'];
      if (maintenanceOps.includes(name)) {
        // Parse tokenId - allow string or number
        let tokenId = args?.tokenId;
        if (typeof tokenId === 'string') {
          tokenId = parseInt(tokenId, 10);
        }
        if (!args || isNaN(tokenId) || typeof tokenId !== 'number') {
          console.log(chalk.red(`❌ ${name} requires valid tokenId (number) parameter, got:`, args?.tokenId));
          return {
            error: `${name} requires valid tokenId (number) parameter`,
            missingParameters: true
          };
        }

        // Parse confirmed - default to false if not provided
        let confirmed = args?.confirmed;
        if (typeof confirmed !== 'boolean') {
          confirmed = false; // Default to quote mode
        }

        // Update args with parsed values
        args.tokenId = tokenId;
        args.confirmed = confirmed;
      }

      // Validate required parameters for check_rug
      if (name === 'check_rug') {
        let tokenId = args?.tokenId;
        if (typeof tokenId === 'string') {
          tokenId = parseInt(tokenId, 10);
        }
        if (!args || isNaN(tokenId) || typeof tokenId !== 'number') {
          console.log(chalk.red(`❌ check_rug requires valid tokenId (number) parameter, got:`, args?.tokenId));
          return {
            error: `check_rug requires valid tokenId (number) parameter`,
            missingParameters: true
          };
        }
        args.tokenId = tokenId;
      }

      // Validate that get_stats has no parameters
      if (name === 'get_stats') {
        if (args && Object.keys(args).length > 0) {
          console.log(chalk.red(`❌ get_stats does not accept any parameters`));
          return {
            error: `get_stats does not accept any parameters`,
            missingParameters: true
          };
        }
      }

      // Validate that get_rugs has no parameters
      if (name === 'get_rugs') {
        if (args && Object.keys(args).length > 0) {
          console.log(chalk.red(`❌ get_rugs does not accept any parameters`));
          return {
            error: `get_rugs does not accept any parameters`,
            missingParameters: true
          };
        }
      }

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
          if (args.confirmed) {
            url = `${this.apiBaseUrl}/api/maintenance/action/${args.tokenId}/clean`;
          method = 'POST';
          body = JSON.stringify({ action: 'clean' });
          } else {
            url = `${this.apiBaseUrl}/api/maintenance/quote/${args.tokenId}/clean`;
            method = 'GET';
          }
          break;
        case 'restore_rug':
          if (args.confirmed) {
            url = `${this.apiBaseUrl}/api/maintenance/action/${args.tokenId}/restore`;
          method = 'POST';
          body = JSON.stringify({ action: 'restore' });
          } else {
            url = `${this.apiBaseUrl}/api/maintenance/quote/${args.tokenId}/restore`;
            method = 'GET';
          }
          break;
        case 'master_restore_rug':
          if (args.confirmed) {
            url = `${this.apiBaseUrl}/api/maintenance/action/${args.tokenId}/master`;
          method = 'POST';
          body = JSON.stringify({ action: 'master' });
          } else {
            url = `${this.apiBaseUrl}/api/maintenance/quote/${args.tokenId}/master`;
            method = 'GET';
          }
          break;
        default:
          console.log(chalk.red(`❌ Unknown tool: ${name}`));
          return null;
      }

      console.log(chalk.blue(`🔧 Executing ${name}...`));

      // Define which operations are free vs require payment
      const freeOperations = ['get_rugs', 'get_stats', 'check_rug'];
      const isFreeOperation = freeOperations.includes(name);

      // Add agent address header for X402 authorization
      const headers = {
        'Content-Type': 'application/json',
      };

      if (config.wallet.address && url.includes('/api/maintenance/action/')) {
        headers['x-agent-address'] = config.wallet.address;
      }

      let response = await fetch(url, {
        method,
        headers,
        body
      });

      let result = await response.json();

      // Handle X402 payment requirements (only for non-free operations)
      if (!isFreeOperation && response.status === 402 && result.x402) {
        console.log(chalk.yellow(`💰 X402 payment required for ${name}`));

        // Create signed payment payload
        const paymentPayload = await this.createX402PaymentPayload(result.x402.accepts[0]);

        console.log(chalk.blue(`🔏 Submitting X402 payment...`));

        // Retry with payment headers
        console.log(chalk.gray(`   Submitting payment to: ${url}`));
        const paymentHeaders = {
          'Content-Type': 'application/json',
          'x402-payment-payload': JSON.stringify(paymentPayload),
          'x402-payment-status': 'payment-submitted'
        };

        if (config.wallet.address) {
          paymentHeaders['x-agent-address'] = config.wallet.address;
        }

        response = await fetch(url, {
          method,
          headers: paymentHeaders,
          body
        });

        console.log(chalk.gray(`   Payment response status: ${response.status}`));
        result = await response.json();
        console.log(chalk.gray(`   Payment result: ${JSON.stringify(result)}`));
      }

      if (response.ok && result.success) {
        console.log(chalk.green(`✅ ${name} completed successfully!`));

        // Handle authorization token response - execute transaction via agent API
        if (result.authorized && result.authorizationToken) {
          console.log(chalk.blue(`🔑 Received authorization token, executing transaction...`));

          // Call agent API server to execute the actual transaction
          // Extract tokenId and action from the URL or result
          const urlParts = url.split('/');
          const tokenId = urlParts[urlParts.length - 1]; // Last part of URL
          const action = urlParts[urlParts.length - 2]; // Second to last part

          const agentApiUrl = `${config.api.baseUrl}/rug/${tokenId}/execute`;
          const executeResponse = await fetch(agentApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              authorization: {
                authorizationToken: result.authorizationToken,
                action: action,
                tokenId: tokenId,
                expires: result.expires
              }
            })
          });

          const executeResult = await executeResponse.json();

          if (executeResponse.ok && executeResult.success) {
            console.log(chalk.green(`✅ Blockchain transaction completed!`));
            return {
              ...executeResult,
              message: `${action} completed successfully! Transaction: ${executeResult.transactionHash}`,
              formatted: true
            };
          } else {
            console.log(chalk.red(`❌ Blockchain execution failed: ${executeResult.error}`));
            return {
              error: `Payment verified but transaction failed: ${executeResult.error}`,
              operationFailed: true
            };
          }
        }

        // Log X402 payment if this was a maintenance action
        if (name.includes('_rug') && result.x402Payment) {
          console.log(chalk.green(`💰 Paid ${formatEther(BigInt(result.x402Payment))} ETH via X402 for maintenance!`));
        }

        // Format the response for better user experience
        if (['clean_rug', 'restore_rug', 'master_restore_rug'].includes(name) && args?.confirmed) {
          // This was an execution, format nicely
          const actionName = name.replace('_rug', '').replace('_', ' ');
          const paymentAmount = result.x402Payment ? formatEther(BigInt(result.x402Payment)) : '0';
          return {
            ...result,
            message: `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} completed successfully! Paid ${paymentAmount} ETH via X402.`,
            formatted: true
          };
        } else if (result.operationNotAvailable) {
          // Operation is not available for this rug
          const actionName = name.replace('_rug', '').replace('_', ' ');
          return {
            ...result,
            message: `Cannot perform ${actionName} on this rug: ${result.error}`,
            operationNotAvailable: true,
            formatted: true
          };
        } else if (['clean_rug', 'restore_rug', 'master_restore_rug'].includes(name) && !args?.confirmed) {
          // This was a successful quote, format the cost info
          console.log(`💰 Quote details:`, {
            action: result.action,
            maintenanceCost: result.maintenanceCost,
            serviceFee: result.serviceFee,
            totalCost: result.totalCost,
            maintenanceCostEth: result.maintenanceCostEth,
            serviceFeeEth: result.serviceFeeEth,
            totalCostEth: result.totalCostEth
          });

          return {
            ...result,
            message: `Quote for ${result.action}: ${result.totalCostEth} ETH total (${result.maintenanceCostEth} ETH maintenance + ${result.serviceFeeEth} ETH service fee)`,
            formatted: true
          };
        }

        return result;
      } else {
        const errorMsg = result.error || result.message || 'Unknown error';
        console.log(chalk.red(`❌ ${name} failed: ${errorMsg}`));

        // Handle specific error cases
        if (errorMsg.includes('not available') || errorMsg.includes('not needed') || errorMsg.includes('not required')) {
          // Operation not available - return a proper error message
          return {
            error: errorMsg,
            operationNotAvailable: true,
            message: `Cannot perform this operation: ${errorMsg}`
          };
        }

        // Check if it's a payment required error
        if (errorMsg.includes('Payment Required') || response.status === 402) {
          console.log(chalk.yellow(`💰 This operation requires X402 payment. The system should handle this automatically.`));
        }

        return null;
      }
    } catch (error) {
      console.log(chalk.red(`❌ Tool execution failed: ${error.message}`));
      return null;
    }
  }

  async createX402PaymentPayload(paymentReq) {
    const { keccak256, encodeAbiParameters } = await import('viem');

    // Create X402 payment payload
    const paymentPayload = {
      x402Version: 1,
      payment: {
        scheme: paymentReq.scheme,
        network: paymentReq.network,
        asset: paymentReq.asset,
        amount: paymentReq.maxAmountRequired,
        from: process.env.AGENT_ADDRESS,
        to: paymentReq.payTo,
        nonce: Math.floor(Math.random() * 1000000).toString(),
        deadline: Math.floor(Date.now() / 1000) + 900 // 15 minutes
      }
    };

    // Create message to sign (the payment object)
    const messageToSign = JSON.stringify(paymentPayload.payment);

    // Sign with agent's private key using viem
    const { privateKeyToAccount, hashMessage } = await import('viem/accounts');

    if (!process.env.AGENT_PRIVATE_KEY) {
      throw new Error('AGENT_PRIVATE_KEY environment variable is required for X402 signing');
    }

    const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
    const signature = await account.signMessage({ message: messageToSign });

    // Add signature to payload
    paymentPayload.signature = signature;

    console.log(chalk.blue(`🔏 Signed X402 payment payload with agent address: ${account.address}`));
    console.log(chalk.gray(`   Amount: ${paymentPayload.payment.amount} ETH`));
    console.log(chalk.gray(`   Nonce: ${paymentPayload.payment.nonce}`));

    return paymentPayload;
  }

  async chatWithAgent(userInput) {
    try {
      // No global payment requirement - operations handle their own payment logic

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
          const { name } = toolCall.function;
          const result = await this.executeToolCall(toolCall);

          if (result === null || result.error || result.missingParameters) {
            // Tool failed - add clear error message to conversation
            const errorMessage = result?.error || `The ${name} operation failed`;
            this.conversationHistory.push({
              role: 'tool',
              content: JSON.stringify({
                error: errorMessage,
                status: 'failed',
                operation: name,
                suggestion: result?.missingParameters
                  ? 'Please provide the required parameters and try again.'
                  : 'The operation could not be completed. Check your input and try again.'
              }),
              tool_call_id: toolCall.id
            });
          } else {
            // Tool succeeded - add result to conversation
          this.conversationHistory.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: toolCall.id
          });
          }
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
          // Kill Ollama if we started it
          if (this.ollamaProcess) {
            console.log(chalk.gray('🛑 Stopping Ollama server...'));
            this.ollamaProcess.kill();
          }
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

  // Ensure Ollama is running and check model
  const ollamaReady = await chat.ensureOllamaRunning();
  if (!ollamaReady) {
    console.log(chalk.red('❌ Could not start Ollama. Please install Ollama and run: ollama serve'));
    process.exit(1);
  }

  // Check for Llama 3.1 model
  try {
    const models = await chat.ollama.list();
    const hasModel = models.models.some(m => m.name.includes('llama3.1'));
    if (!hasModel) {
      console.log(chalk.red('❌ Llama 3.1 model not found. Please run: ollama pull llama3.1:8b'));
      process.exit(1);
    }
    console.log(chalk.green('✅ Llama 3.1 ready with tool calling'));
  } catch (error) {
    console.log(chalk.red('❌ Failed to check models:'), error.message);
    process.exit(1);
  }

  await chat.startInteractiveChat();
}

main().catch(console.error);
