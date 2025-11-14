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
    address: process.env.AGENT_ADDRESS,
    privateKey: process.env.AGENT_PRIVATE_KEY
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

    // Debug wallet configuration
    console.log('🔑 Agent wallet config:', {
      address: config.wallet.address,
      privateKeyLength: config.wallet.privateKey ? config.wallet.privateKey.length : 'undefined'
    });
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
      console.log(chalk.yellow('⚠️  Ollama not running, attempting to start it...'));

      // Check if ollama command is available
      try {
        const { spawn } = await import('child_process');
        this.ollamaProcess = spawn('ollama', ['serve'], {
          detached: true,
          stdio: 'ignore'
        });

        // Check if process started
        if (this.ollamaProcess.pid) {
          console.log(chalk.blue('⏳ Waiting for Ollama to start...'));
        } else {
          console.log(chalk.red('❌ Failed to spawn Ollama process'));
          return false;
        }
      } catch (spawnError) {
        console.log(chalk.red('❌ Ollama command not found in PATH'));
        console.log(chalk.yellow('💡 Install Ollama from: https://ollama.ai'));
        return false;
      }

      // Wait for Ollama to start up
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
      console.log(chalk.yellow('💡 Try running: ollama serve'));
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
          description: 'Check agent wallet balance and service fees paid',
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
          description: 'Check the status of a specific rug by token ID',
          parameters: {
            type: 'object',
            properties: {
              tokenId: {
                type: 'integer',
                description: 'The token ID number of the rug to check (e.g., 1 for rug #1)'
              }
            },
            required: ['tokenId']
          }
        }
      },
      {
        type: 'function',
        function:         {
          name: 'clean_rug',
          description: 'Clean a specific rug immediately. Handles X402 payment automatically and executes the blockchain transaction. You must know the tokenId first - call get_rugs() if you dont know what rugs the user owns.',
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
        function:         {
          name: 'restore_rug',
          description: 'Restore a specific rug immediately. Handles X402 payment automatically and executes the blockchain transaction. You must know the tokenId first - call get_rugs() if you dont know what rugs the user owns.',
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
        function:         {
          name: 'master_restore_rug',
          description: 'Master restore a specific rug immediately. Handles X402 payment automatically and executes the blockchain transaction. You must know the tokenId first - call get_rugs() if you dont know what rugs the user owns.',
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
- Parse rug numbers from user input: "rug 1" or "rug #1" or "token 1" = tokenId: 1
- For check_rug: ONLY provide tokenId (integer), no other parameters
- For maintenance operations: provide tokenId (integer)
- Always extract the specific rug number mentioned by the user

EXAMPLE FLOWS:

FREE INFO QUERY:
User: "how many rugs do I own?"
AI: Calls get_rugs() → Returns rug list (no payment required)

User: "what's my balance?" or "check agent balance"
AI: Calls get_stats() → Returns wallet balance and maintenance stats (no payment required)

User: "is rug 1 clean?" or "check rug 1"
AI: Calls check_rug(tokenId=1) → Returns rug status (no payment required)

MAINTENANCE WITH PAYMENT:
User: "clean rug 1"
AI: Parse "rug 1" as tokenId=1 → Calls clean_rug(tokenId=1) → Automatically handles X402 payment → Executes maintenance → "Rug cleaned!"

User: "clean my rugs"
AI: First calls get_rugs() → Discovers user's rugs → "You own rugs #1, #2, #3. Which one would you like to clean?"

UNAVAILABLE OPERATION:
User: "restore rug 2"
AI: Calls restore_rug(tokenId=2) → "Restoration not available for this rug"

IMPORTANT NOTES:
- Always get accurate data from APIs - never make up numbers
- Rug ownership is determined by calling get_rugs() API
- Agent wallet balance and fees are checked with get_stats()
- Service fees are 0.00042 ETH flat for all maintenance actions
- If a tool returns an error, acknowledge the failure and don't claim success
- Only report success when tool results confirm the operation worked
- NEVER call tools with incorrect parameters - check the tool definitions first
- When operations fail, explain what went wrong and ask for clarification
- For questions like "is rug X clean/dirty/status", immediately call check_rug(tokenId=X)
- For questions about "my rugs", first call get_rugs() to see what they own
- Authorization happens through the website dashboard
- You work on Shape Sepolia testnet
- Maintenance operations execute immediately without user confirmation

FORMATTED RESPONSES:
- When you see a tool result that is just a plain text message (not JSON), use it as your final answer EXACTLY as provided
- Do not modify, rephrase, or add extra information to formatted messages
- These messages are already perfectly formatted for the user
- For agent stats, use the message exactly: "Agent Stats: [name] has [balance] ETH in wallet, performed [count] maintenance operations. Service fees collected by facilitator, agent pays gas fees (~[gas] ETH estimated)."

MAINTENANCE OPERATIONS:
- Maintenance operations (clean_rug, restore_rug, master_restore_rug) execute immediately without confirmation
- They handle X402 payments automatically and return the result
- No need to ask for user confirmation - just call the appropriate tool

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
          // Always execute immediately - no confirmation needed
          url = `${this.apiBaseUrl}/api/maintenance/action/${args.tokenId}/clean`;
          method = 'POST';
          body = JSON.stringify({ action: 'clean' });
          break;
        case 'restore_rug':
          // Always execute immediately - no confirmation needed
          url = `${this.apiBaseUrl}/api/maintenance/action/${args.tokenId}/restore`;
          method = 'POST';
          body = JSON.stringify({ action: 'restore' });
          break;
        case 'master_restore_rug':
          // Always execute immediately - no confirmation needed
          url = `${this.apiBaseUrl}/api/maintenance/action/${args.tokenId}/master`;
          method = 'POST';
          body = JSON.stringify({ action: 'master' });
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

      if (config.wallet.address && url.includes('/api/maintenance/')) {
        headers['x-agent-address'] = config.wallet.address;
      }

      let response = await fetch(url, {
        method,
        headers,
        body
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let result;

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log(chalk.gray(`   API response status: ${response.status}, result:`, JSON.stringify(result)));
      } else {
        // Handle non-JSON responses (HTML error pages, etc.)
        const text = await response.text();
        console.log(chalk.red(`   API returned non-JSON response: ${response.status} ${response.statusText}`));
        console.log(chalk.gray(`   Content-Type: ${contentType}`));
        console.log(chalk.gray(`   Response preview: ${text.substring(0, 200)}...`));

        throw new Error(`API returned HTML instead of JSON. Server may not be running or endpoint doesn't exist. Status: ${response.status}`);
      }

      // Handle different response types
      if (response.status >= 400 && result?.error) {
        // Error response from facilitator or API
        console.log(chalk.red(`❌ API/Facilitator error: ${result.error}`));
        if (result.details) {
          console.log(chalk.gray(`   Details: ${result.details}`));
        }
        throw new Error(`Operation failed: ${result.error}`);
      } else if (!isFreeOperation && response.status === 402 && result.x402) {
        // Handle X402 payment automatically for maintenance operations
        console.log(chalk.yellow(`💰 X402 payment required for ${name} execution`));

        // Validate X402 response structure
        if (!result.x402.accepts || !result.x402.accepts[0]) {
          console.log(chalk.red(`❌ Invalid X402 response structure:`, result.x402));
          throw new Error('Invalid X402 payment requirement format');
        }

        const paymentReq = result.x402.accepts[0];
        if (!paymentReq.maxAmountRequired || !paymentReq.payTo) {
          console.log(chalk.red(`❌ Missing required X402 fields:`, paymentReq));
          throw new Error('X402 payment requirement missing required fields');
        }

        // First, send the actual ETH payment to the facilitator
        const paymentAmount = paymentReq.maxAmountRequired;
        const facilitatorAddress = paymentReq.payTo;

        console.log(chalk.blue(`💸 Sending ${parseFloat(paymentAmount) / 1e18} ETH to facilitator: ${facilitatorAddress}`));

        let paymentTx;

        try {
          // Import viem functions
          const { createWalletClient, http, parseEther } = await import('viem');
          const { privateKeyToAccount } = await import('viem/accounts');
          const { baseSepolia } = await import('viem/chains');

          // Create agent wallet
          const agentAccount = privateKeyToAccount(config.wallet.privateKey);
          const agentWallet = createWalletClient({
            account: agentAccount,
            chain: baseSepolia,
            transport: http(process.env.RPC_URL || 'https://sepolia.base.org')
          });

          // Send ETH to facilitator
          paymentTx = await agentWallet.sendTransaction({
            to: facilitatorAddress,
            value: BigInt(paymentAmount)
          });

          console.log(chalk.green(`✅ Payment sent: ${paymentTx}`));

          // Wait for confirmation
          const publicClient = await import('viem').then(m => m.createPublicClient({
            chain: baseSepolia,
            transport: http(process.env.RPC_URL || 'https://sepolia.base.org')
          }));

          const receipt = await publicClient.waitForTransactionReceipt({ hash: paymentTx });
          console.log(chalk.green(`✅ Payment confirmed in block ${receipt.blockNumber}`));

        } catch (paymentError) {
          console.log(chalk.red(`❌ Payment failed: ${paymentError.message}`));
          throw new Error(`Failed to send payment: ${paymentError.message}`);
        }

        // Now create signed payment payload and submit
        const paymentPayload = await this.createX402PaymentPayload(result.x402.accepts[0]);

        console.log(chalk.blue(`🔏 Submitting X402 authorization request...`));

        // Submit with payment headers including transaction hash
        console.log(chalk.gray(`   Submitting to: ${url}`));
        const paymentHeaders = {
          'Content-Type': 'application/json',
          'x402-payment-payload': JSON.stringify(paymentPayload),
          'x402-payment-status': 'payment-submitted',
          'x402-payment-tx': paymentTx // Include the payment transaction hash
        };

        if (config.wallet.address) {
          paymentHeaders['x-agent-address'] = config.wallet.address;
        }

        response = await fetch(url, {
          method,
          headers: paymentHeaders,
          body
        });

        console.log(chalk.gray(`   Authorization response status: ${response.status}`));
        result = await response.json();
        console.log(chalk.gray(`   Authorization result: ${JSON.stringify(result)}`));
        console.log(chalk.gray(`   Result type check: ${typeof result}, has error: ${!!result?.error}`));
      }

      console.log(chalk.gray(`   Final check - response.ok: ${response.ok}, result exists: ${!!result}, has auth token: ${!!result?.authorizationToken}`));
      if (response.ok && result.authorizationToken) {
        console.log(chalk.green(`✅ ${name} authorized successfully!`));

        // Handle authorization token response - execute transaction via agent API
        if (result.authorizationToken) {
          console.log(chalk.blue(`🔑 Received authorization token, executing transaction...`));

          // Call agent API server to execute the actual transaction
          // Extract tokenId and action from the URL
          // URL format: /api/maintenance/action/{tokenId}/{action}
          const urlParts = url.split('/');
          const action = urlParts[urlParts.length - 1]; // Last part = action (clean/restore/master)
          const tokenId = urlParts[urlParts.length - 2]; // Second to last = tokenId

          // Action is already correctly extracted from URL

          const agentApiUrl = `${config.api.baseUrl}/rug/${tokenId}/execute`;
          console.log(chalk.gray(`   URL extracted action: "${action}", tokenId: "${tokenId}"`));

          const authObject = {
            authorization: {
              authorizationToken: result.authorizationToken,
              action: action,
              tokenId: tokenId,
              nonce: result.nonce,
              expires: result.expires
            }
          };
          console.log(chalk.gray(`   Auth object:`, JSON.stringify(authObject, null, 2)));

          const executeResponse = await fetch(agentApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(authObject)
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
        if (['clean_rug', 'restore_rug', 'master_restore_rug'].includes(name)) {
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
        } else if (name === 'get_stats' && result.data) {
          // Format agent stats nicely
          const stats = result.data;
          return {
            ...result,
            message: `Agent Stats: ${stats.agentName} has ${stats.walletBalanceEth} ETH in wallet, performed ${stats.maintenanceCount} maintenance operations. Service fees collected by facilitator, agent pays gas fees (~${stats.estimatedGasFeesPaidEth} ETH estimated).`,
            formatted: true
          };

        return result;
      } else {
        console.log(chalk.gray(`   Error handling - result: ${JSON.stringify(result)}, response.ok: ${response.ok}, result type: ${typeof result}`));
        console.log(chalk.gray(`   Error handling - result keys: ${result ? Object.keys(result) : 'undefined'}`));
        const errorMsg = result?.error || result?.message || 'Unknown error';
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
      // Operations execute immediately without confirmation

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
          } else if (result.quote) {
            // Quote response - user needs to confirm
            this.conversationHistory.push({
              role: 'tool',
              content: JSON.stringify({
                quote: result,
                status: 'quote',
                operation: name,
                message: result.message,
                cost: result.cost,
                action: result.action,
                tokenId: result.tokenId
              }),
              tool_call_id: toolCall.id
            });
          } else {
            // Tool succeeded - add result to conversation
            if (result.formatted && result.message) {
              // For formatted results, use only the message
              this.conversationHistory.push({
                role: 'tool',
                content: result.message,
                tool_call_id: toolCall.id
              });
            } else {
              // For regular results, use full JSON
          this.conversationHistory.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: toolCall.id
          });
            }

            // If this was a quote waiting for confirmation, don't call LLM again
            if (result.waitingForConfirmation) {
              return result.message;
            }
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
  try {
    console.log(chalk.bold.blue('🤖 Agent Rug - Seamless Blockchain Chat'));
    console.log(chalk.gray('💡 Chat naturally with Agent Rug!'));
    console.log(chalk.gray('💡 Type "exit" to quit\n'));

    console.log(chalk.blue('🔧 Initializing chat interface...'));

    // Initialize chat instance
    let chat;
    try {
      console.log(chalk.blue('📦 Loading dependencies...'));
      // Test Ollama import
      const { Ollama } = await import('ollama');
      console.log(chalk.green('✅ Ollama import successful'));

      chat = new AgentRugChat();
      console.log(chalk.green('✅ Chat interface initialized'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to initialize chat interface:'), error.message);
      console.log(chalk.yellow('Stack trace:'), error.stack);
      console.log(chalk.yellow('💡 Check if Ollama package is installed: npm install'));
      console.log(chalk.yellow('💡 Check if Ollama server is running: ollama serve'));
      process.exit(1);
    }

  // Test API connection
    console.log(chalk.blue('🔗 Testing API connection...'));
  try {
    const response = await fetch(`${config.api.baseUrl}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const health = await response.json();
    console.log(chalk.green(`✅ API server connected (${health.agent})`));
  } catch (error) {
    console.log(chalk.red('❌ API server connection failed:'), error.message);
    console.log(chalk.yellow('💡 Make sure API server is running: npm run api-server'));
      console.log(chalk.yellow('💡 Continuing anyway - some features may not work'));
    }

    // Ensure Ollama is running
    console.log(chalk.blue('🔍 Checking Ollama connection...'));
    const ollamaReady = await chat.ensureOllamaRunning();
    if (!ollamaReady) {
      console.log(chalk.red('❌ Could not start Ollama. Please install Ollama and run: ollama serve'));
    process.exit(1);
  }

    // Check for configured model
    console.log(chalk.blue('🤖 Checking AI model...'));
  try {
    const models = await chat.ollama.list();
      const modelName = config.ollama.model.split(':')[0]; // Get base name (e.g., 'llama3.1' from 'llama3.1:8b')
      const hasModel = models.models.some(m => m.name.includes(modelName));
    if (!hasModel) {
        console.log(chalk.red(`❌ ${modelName} model not found. Please run: ollama pull ${config.ollama.model}`));
      process.exit(1);
      }
      console.log(chalk.green(`✅ ${modelName} ready with tool calling`));
    } catch (error) {
      console.log(chalk.red('❌ Failed to check models:'), error.message);
      console.log(chalk.yellow('💡 Continuing without model check - may not work properly'));
    }

    console.log(chalk.green('\n🚀 Starting interactive chat...\n'));
    await chat.startInteractiveChat();

  } catch (error) {
    console.log(chalk.red('\n❌ Fatal error starting chat:'), error.message);
    console.log(chalk.yellow('Stack trace:'), error.stack);
    process.exit(1);
  }
}

main().catch(console.error);
