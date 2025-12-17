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

// Import rate limit handler
import { isRateLimitError, handleRateLimitError } from './rate-limit-handler.js';

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
  },
  owner: {
    address: process.env.OWNER_ADDRESS
  }
};

class AgentRugChat {
  constructor() {
    this.ollama = new Ollama({ host: config.ollama.baseUrl });
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.apiProcess = null;

    // Suppress verbose logs in production/chat mode but keep essential output
    if (!this.isDevelopment) {
      // Override console methods to suppress debug/info logs
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalInfo = console.info;

      console.log = (...args) => {
        // Only suppress logs that don't start with Agent Rug or key UI messages
        if (args[0] && typeof args[0] === 'string' &&
            !args[0].includes('Agent Rug') &&
            !args[0].includes('🤖') &&
            !args[0].includes('❌') &&
            !args[0].includes('👋')) {
          return; // Suppress this log
        }
        originalLog.apply(console, args);
      };

      console.warn = this.silentLog;
      console.info = this.silentLog;
      // Keep error logging
    }
    this.conversationHistory = [];
    this.tools = this.defineTools();
    this.systemPrompt = this.getSystemPrompt();
    // Use website API for X402 flow, agent API for execution
    // These must be configured in environment variables
    this.apiBaseUrl = process.env.WEBSITE_API_URL;
    this.agentApiUrl = process.env.AGENT_API_URL;

    if (!this.apiBaseUrl) {
      throw new Error('WEBSITE_API_URL environment variable is required');
    }
    if (!this.agentApiUrl) {
      throw new Error('AGENT_API_URL environment variable is required');
    }
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

  silentLog() {
    // Suppress logs in production mode
  }

  async startEmbeddedAPIServer() {
    console.log(chalk.blue('🔧 Starting embedded API server...'));

    // Set environment for embedded mode
    const env = { ...process.env, EMBEDDED_MODE: 'true' };

    this.apiProcess = spawn('node', ['api-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'], // Suppress all output
      detached: false,
      env: env,
      cwd: process.cwd()
    });

    // Handle process events
    this.apiProcess.on('error', (error) => {
      console.error(chalk.red('❌ Failed to start embedded API server:'), error.message);
    });

    this.apiProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(chalk.red(`❌ API server exited with code ${code}`));
      }
    });

    // Wait for API server to be ready
    let retries = 0;
    while (retries < 10) {
      try {
        const response = await fetch(`${config.api.baseUrl}/health`);
        if (response.ok) {
          console.log(chalk.green('✅ Embedded API server ready'));
          return true;
        }
      } catch (error) {
        // API not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    console.error(chalk.red('❌ Embedded API server failed to start'));
    return false;
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
          name: 'analyze_rugs',
          description: 'Get AI-powered analysis of all user-owned rugs including condition assessment, maintenance recommendations, and overall collection health. Use this for questions like "how are my rugs doing?" or "what\'s the condition of my rugs?"',
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
- analyze_rugs: Get AI-powered analysis of all user's rugs (recommended for "how are my rugs doing")
- check_rug: Check the status of a specific rug
- clean_rug: Clean a rug (get quote first, then confirm)
- restore_rug: Restore a rug (get quote first, then confirm)
- master_restore_rug: Master restore a rug (get quote first, then confirm)

DIRECT CONTRACT PAYMENT MODEL - PER-OPERATION:
- Information queries (rug ownership, status) are FREE
- Maintenance operations (cleaning, restoration) require direct payment
- Agent pays directly to smart contract (no facilitator required)
- On-chain payment verification and automatic fee distribution

WORKFLOW:
1. User asks questions → Free info queries work immediately
2. User requests maintenance on "my rugs" → First call get_rugs() to discover what they own
3. User requests specific maintenance → Agent gets quote and handles direct contract payment
4. Agent executes maintenance with on-chain payment verification
5. No facilitator required - direct smart contract payments

PARAMETER HANDLING:
- Parse rug numbers from user input: "rug 1" or "rug #1" or "token 1" = tokenId: 1
- For check_rug: ONLY provide tokenId (integer), no other parameters
- For maintenance operations: provide tokenId (integer)
- Always extract the specific rug number mentioned by the user

EXAMPLE FLOWS:

TOOL USAGE GUIDELINES:
- For rug ownership questions: Call get_rugs()
- For specific rug status: Call check_rug(tokenId=X)
- For overall rug condition analysis: Call analyze_rugs() (best for "how are my rugs doing?")
- For maintenance operations: Call clean_rug/restore_rug/master_restore_rug
- DO NOT call get_stats() unless specifically asked about agent statistics
- For general questions about capabilities: Respond directly without tools
- For balance questions: Respond directly without tools

MAINTENANCE WITH DIRECT PAYMENT:
User: "clean rug 1"
AI: Parse "rug 1" as tokenId=1 → Gets quote → Pays directly to contract → Executes maintenance → "Rug cleaned!"

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
- Each maintenance action costs a flat 0.00042 ETH service fee plus the actual maintenance cost (varies by operation)
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
          // Use deployed site - shared utility for all agents
          url = `${this.apiBaseUrl}/api/owner/rugs?owner=${config.owner.address}`;
          break;
        case 'get_stats':
          // Use deployed site - shared utility for all agents
          url = `${this.apiBaseUrl}/api/agent/stats?address=${config.wallet.address}`;
          break;
        case 'analyze_rugs':
          // Use deployed site - shared utility for all agents
          url = `${this.apiBaseUrl}/api/rugs/analyze?owner=${config.owner.address}`;
          break;
        case 'check_rug':
          // Use deployed site for maintenance status
          url = `${this.apiBaseUrl}/api/maintenance/status/${args.tokenId}`;
          break;
        case 'clean_rug':
          // X402 payment flow - use deployed site
          url = `${this.apiBaseUrl}/api/maintenance/quote/${args.tokenId}/clean`;
          method = 'GET';
          break;
        case 'restore_rug':
          // X402 payment flow - use deployed site
          url = `${this.apiBaseUrl}/api/maintenance/quote/${args.tokenId}/restore`;
          method = 'GET';
          break;
        case 'master_restore_rug':
          // X402 payment flow - use deployed site
          url = `${this.apiBaseUrl}/api/maintenance/quote/${args.tokenId}/master`;
          method = 'GET';
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
      let result = null; // Initialize result to prevent undefined errors

      // Special handling for 402 Payment Required responses (x402 quotes)
      if (response.status === 402 && !isFreeOperation) {
        console.log(chalk.yellow(`💰 Direct payment required for ${name} execution`));
        const paymentRequiredHeader = response.headers.get('payment-required') || response.headers.get('PAYMENT-REQUIRED');
        if (paymentRequiredHeader) {
          try {
            const paymentData = JSON.parse(paymentRequiredHeader);
            console.log(chalk.gray(`   Payment requirement parsed from header:`, JSON.stringify(paymentData).substring(0, 200)));

            // Extract payment amount - check multiple possible locations
            let paymentAmount;
            if (paymentData.accepts && paymentData.accepts[0]) {
              // Try maxAmountRequired first (primary location)
              if (paymentData.accepts[0].maxAmountRequired) {
                paymentAmount = paymentData.accepts[0].maxAmountRequired;
              }
              // Fallback to extra.totalWei if maxAmountRequired not found
              else if (paymentData.accepts[0].extra?.totalWei) {
                paymentAmount = paymentData.accepts[0].extra.totalWei;
              }
            }
            // Fallback: check root level extra (shouldn't happen but handle it)
            if (!paymentAmount && paymentData.extra?.totalWei) {
              paymentAmount = paymentData.extra.totalWei;
            }

            if (!paymentAmount) {
              console.log(chalk.red(`❌ No valid payment amount found in header structure`));
              console.log(chalk.gray(`   Header data:`, JSON.stringify(paymentData, null, 2)));
              throw new Error('Invalid payment requirement format');
            }
            
            console.log(chalk.blue(`📋 Payment amount required: ${parseFloat(paymentAmount) / 1e18} ETH (includes service fee)`));

            // Extract action and tokenId from URL for x402 v2 direct execution
            // URL format: /api/maintenance/quote/{tokenId}/{action}
            const urlParts = url.split('/');
            const action = urlParts[urlParts.length - 1]; // clean/restore/master
            const tokenId = urlParts[urlParts.length - 2]; // tokenId

            // Execute transaction directly via agent API server (x402 v2 - no facilitator)
            console.log(chalk.blue(`🔄 Executing direct payment transaction via agent API...`));
            const agentApiUrl = `${this.agentApiUrl}/rug/${tokenId}/execute-direct`;
            const paymentHeaders = {
              'Content-Type': 'application/json'
            };

            const paymentBody = JSON.stringify({
              action: action,
              paymentAmount: paymentAmount
            });

            const paymentResponse = await fetch(agentApiUrl, {
              method: 'POST',
              headers: paymentHeaders,
              body: paymentBody
            });

            // Parse payment response
            if (paymentResponse.headers.get('content-type')?.includes('application/json')) {
              result = await paymentResponse.json();
              console.log(chalk.gray(`   Payment response:`, JSON.stringify(result)));
            }

            // Handle payment result
            if (paymentResponse.ok && result && result.success) {
              console.log(chalk.green(`✅ ${name} completed successfully with payment!`));
              const paymentAmountEth = parseFloat(paymentAmount) / 1e18;
              console.log(chalk.green(`💰 Paid ${paymentAmountEth} ETH via X402 v2 direct payment!`));

              const actionName = name.replace('_rug', '').replace('_', ' ');
              return {
                ...result,
                x402Payment: paymentAmount,
                message: `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} completed successfully! Paid ${paymentAmountEth} ETH via X402 v2. Transaction: ${result.transactionHash}`,
                formatted: true
              };
            } else {
              console.log(chalk.red(`❌ Payment execution failed: ${result?.error || 'Unknown error'}`));
              if (result?.details) {
                console.log(chalk.gray(`   Details: ${result.details}`));
              }
              throw new Error(`Payment execution failed: ${result?.error || 'Unknown error'}`);
            }

          } catch (parseError) {
            console.log(chalk.red(`   Failed to parse payment-required header: ${parseError.message}`));
            throw new Error(`Invalid payment requirement format in header`);
          }
        } else {
          throw new Error(`402 Payment Required but no payment-required header found`);
        }
      }

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log(chalk.gray(`   API response status: ${response.status}, result:`, JSON.stringify(result)));

        // Format get_stats result
        if (name === 'get_stats' && result.data) {
          console.log(chalk.gray(`   Formatting get_stats result`));
          const stats = result.data;
          return {
            ...result,
            message: `Agent Stats: Wallet ${stats.walletAddress} has ${stats.walletBalanceEth} ETH balance. Current gas price: ${stats.currentGasPriceGwei} gwei. Service fee: ${stats.serviceFeeInfo}. Network: ${stats.network}.`,
            formatted: true
          };
        }
      } else {
        // Handle non-JSON responses (HTML error pages, etc.)
        const text = await response.text();
        console.log(chalk.red(`   API returned non-JSON response: ${response.status} ${response.statusText}`));
        console.log(chalk.gray(`   Content-Type: ${contentType}`));
        console.log(chalk.gray(`   Response preview: ${text.substring(0, 200)}...`));

        throw new Error(`API returned HTML instead of JSON. Server may not be running or endpoint doesn't exist. Status: ${response.status}`);
      }

      console.log(chalk.gray(`   Handling response - status: ${response.status}, has error: ${!!result?.error}, is free: ${isFreeOperation}`));

      // Handle rate limit errors first (429)
      if (isRateLimitError(response)) {
        const rateLimitError = handleRateLimitError(response, result);
        throw new Error(`Rate limit exceeded: ${rateLimitError.details}. Please wait ${rateLimitError.rateLimit.resetInSeconds} seconds before retrying.`);
      }

      // Handle different response types
      if (response.status >= 400 && result?.error) {
        // Error response from API
        console.log(chalk.red(`❌ API error: ${result.error}`));
        if (result.details) {
          console.log(chalk.gray(`   Details: ${result.details}`));
        }
        throw new Error(`Operation failed: ${result.error}`);
      } else if (!isFreeOperation && response.status === 402) {
        // Handle direct payment requirement (new V2 format)
        console.log(chalk.yellow(`💰 Direct payment required for ${name} execution`));

        let paymentAmount;

        // Get payment amount from PAYMENT-REQUIRED header (V2 format)
        const paymentRequiredHeader = response.headers.get('PAYMENT-REQUIRED') || response.headers.get('payment-required');
        if (paymentRequiredHeader) {
          try {
            const paymentData = JSON.parse(paymentRequiredHeader);
            console.log(chalk.gray(`   Payment requirement parsed from header:`, JSON.stringify(paymentData).substring(0, 200)));

            // Extract payment amount - check multiple possible locations
            if (paymentData.accepts && paymentData.accepts[0]) {
              // Try maxAmountRequired first (primary location)
              if (paymentData.accepts[0].maxAmountRequired) {
                paymentAmount = paymentData.accepts[0].maxAmountRequired;
              }
              // Fallback to extra.totalWei if maxAmountRequired not found
              else if (paymentData.accepts[0].extra?.totalWei) {
                paymentAmount = paymentData.accepts[0].extra.totalWei;
              }
            }
            // Fallback: check root level extra (shouldn't happen but handle it)
            if (!paymentAmount && paymentData.extra?.totalWei) {
              paymentAmount = paymentData.extra.totalWei;
            }

            if (paymentAmount) {
              console.log(chalk.blue(`📋 Payment amount required: ${parseFloat(paymentAmount) / 1e18} ETH (includes service fee)`));
            }
          } catch (e) {
            console.log(chalk.yellow(`⚠️ Failed to parse payment header: ${e.message}`));
          }
        }

        if (!paymentAmount) {
          console.log(chalk.red(`❌ No valid payment amount found in header structure`));
          if (paymentRequiredHeader) {
            try {
              const paymentData = JSON.parse(paymentRequiredHeader);
              console.log(chalk.gray(`   Header data:`, JSON.stringify(paymentData, null, 2)));
            } catch (e) {
              console.log(chalk.gray(`   Raw header:`, paymentRequiredHeader.substring(0, 200)));
            }
          }
          throw new Error('Invalid payment requirement format');
        }

        // Extract action and tokenId from URL for x402 v2 direct execution
        const urlParts = url.split('/');
        const action = urlParts[urlParts.length - 1]; // clean/restore/master
        const tokenId = urlParts[urlParts.length - 2]; // tokenId

        // Execute transaction directly via agent API server (x402 v2 - no facilitator)
        console.log(chalk.blue(`🔄 Executing direct payment transaction via agent API...`));
        const agentApiUrl = `${this.agentApiUrl}/rug/${tokenId}/execute-direct`;
        const paymentHeaders = {
          'Content-Type': 'application/json'
        };

        const paymentBody = JSON.stringify({
          action: action,
          paymentAmount: paymentAmount
        });

        response = await fetch(agentApiUrl, {
          method: 'POST',
          headers: paymentHeaders,
          body: paymentBody
        });

        // Re-parse the response
        if (response.headers.get('content-type')?.includes('application/json')) {
          result = await response.json();
          console.log(chalk.gray(`   Payment response:`, JSON.stringify(result)));
        }

      }

      console.log(chalk.gray(`   Final check - response.ok: ${response.ok}, result exists: ${!!result}, has auth token: ${!!result?.authorizationToken}`));

      // Handle successful free operations (no X402 payment required)
      if (response.ok && result && !result.authorizationToken && !result.x402) {
        console.log(chalk.green(`✅ ${name} completed successfully (free operation)`));
        console.log(chalk.gray(`   SUCCESS PATH: Reached success handling for ${name}`));

        // Log X402 payment if this was a maintenance action
        if (name.includes('_rug') && result.x402Payment) {
          console.log(chalk.green(`💰 Paid ${formatEther(BigInt(result.x402Payment))} ETH via X402 for maintenance!`));
        }

        // Format the response for better user experience

        // Handle get_stats first since it needs special formatting
        if (name === 'get_stats' && result.data) {
          const stats = result.data;
          return {
            ...result,
            message: `Agent Stats: Wallet ${stats.walletAddress} has ${stats.walletBalanceEth} ETH balance. Current gas price: ${stats.currentGasPriceGwei} gwei. Service fee: ${stats.serviceFeeInfo}. Network: ${stats.network}.`,
            formatted: true
          };
        }

        // Handle analyze_rugs with comprehensive formatting
        if (name === 'analyze_rugs' && result.analyses) {
          let message = result.overallAssessment.summary + '\n\n';

          // Add individual rug assessments
          result.analyses.forEach(analysis => {
            message += `• ${analysis.summary}\n`;
            if (analysis.recommendations && analysis.recommendations.length > 0) {
              message += `  Recommendations: ${analysis.recommendations.join(', ')}\n`;
            }
          });

          // Add overall recommendations
          if (result.overallAssessment.recommendations && result.overallAssessment.recommendations.length > 0) {
            message += `\n💡 Overall Recommendations:\n`;
            result.overallAssessment.recommendations.forEach(rec => {
              message += `• ${rec}\n`;
            });
          }

          return {
            ...result,
            message: message.trim(),
            formatted: true
          };
        }

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
        } else {
          // Default success case
          console.log(chalk.gray(`   Returning result for ${name}:`, JSON.stringify(result).substring(0, 200) + '...'));
          return result;
        }
      } else if (response.ok && result.authorizationToken) {
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

          const agentApiUrl = `${this.agentApiUrl}/rug/${tokenId}/execute`;
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
      } else {
        console.log(chalk.gray(`   Error handling - result: ${JSON.stringify(result)}, response.ok: ${response.ok}, result type: ${typeof result}`));
        console.log(chalk.gray(`   Error handling - result keys: ${result ? Object.keys(result) : 'undefined'}`));
        const errorMsg = result && typeof result === 'object' ? (result.error || result.message || 'Unknown error') : 'Unknown error';
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

    // Create X402 V2 payment payload
    const paymentPayload = {
      x402Version: 2,
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
      // Ollama format: don't include content if there are tool_calls
      const message = { role: 'assistant' };
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        message.tool_calls = assistantMessage.tool_calls;
      } else {
        message.content = assistantMessage.content;
      }
      this.conversationHistory.push(message);

      // Handle tool calls if any
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(chalk.magenta(`🎯 Executing ${assistantMessage.tool_calls.length} tool call(s)...`));

        for (const toolCall of assistantMessage.tool_calls) {
          const { name } = toolCall.function;
          console.log(chalk.gray(`🔧 Processing tool: ${name}`));
          const result = await this.executeToolCall(toolCall);
          console.log(chalk.gray(`🔧 Tool result type: ${typeof result}, has message: ${!!(result && result.message)}, formatted: ${!!(result && result.formatted)}`));

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
            // Tool succeeded - format the result and return directly
            let responseMessage = '';

            if (result.formatted && result.message) {
              // Already formatted result (like get_stats)
              responseMessage = result.message;
            } else if (result.quote) {
              // Quote response - user needs to confirm
              responseMessage = `I need to confirm this action with you. ${result.message || 'Please confirm to proceed.'}`;
            } else {
              // Format raw API result
              if (name === 'check_rug' && result.data) {
                const data = result.data;
                let message = `Rug #${data.tokenId}: ${data.condition} (${data.summary ? data.summary.split(' (')[1].replace(')', '') : 'detailed status'})\n`;

                // Add raw NFT traits if available
                if (data.rawTraits && Object.keys(data.rawTraits).length > 0) {
                  message += `📊 Raw Stats: Text Lines: ${data.rawTraits.textLines}, Characters: ${data.rawTraits.characterCount}, Palette: ${data.rawTraits.paletteName}, Stripes: ${data.rawTraits.stripeCount}, Complexity: ${data.rawTraits.complexity}, Warp: ${data.rawTraits.warpThickness}\n`;
                  message += `🧹 Maintenance: Dirt ${data.rawTraits.dirtLevel}, Aging ${data.rawTraits.agingLevel}, Score ${data.rawTraits.maintenanceScore}, Cleanings ${data.rawTraits.cleaningCount}, Restorations ${data.rawTraits.restorationCount}, Master Restore ${data.rawTraits.masterRestorationCount}\n`;
                  message += `📅 History: Minted ${new Date(parseInt(data.rawTraits.mintTime) * 1000).toLocaleDateString()}, Last Cleaned ${data.rawTraits.lastCleaned > 0 ? new Date(parseInt(data.rawTraits.lastCleaned) * 1000).toLocaleDateString() : 'Never'}\n`;
                }

                // Add maintenance options
                message += `🔧 Maintenance Options: Can Clean: ${data.canClean}, Can Restore: ${data.canRestore}, Needs Master: ${data.needsMaster}\n`;

                // Add recommendations if available
                if (data.recommendations && data.recommendations.length > 0) {
                  message += `💡 Recommendations: ${data.recommendations.join(', ')}\n`;
                }

                responseMessage = message.trim();
              } else if (name === 'get_rugs' && result.ownedRugs) {
                responseMessage = `You own ${result.ownedRugs.length} rug(s): ${result.ownedRugs.join(', ')}`;
              } else {
                // Generic success message
                responseMessage = `${name.replace('_', ' ')} completed successfully.`;
              }
            }

            // Add tool result to conversation for context
            this.conversationHistory.push({
              role: 'tool',
              content: result.formatted && result.message ? result.message : JSON.stringify(result),
              tool_call_id: toolCall.id
            });

            // Return the formatted message directly
            console.log(chalk.gray('📝 Returning result directly without Ollama'));
            return responseMessage;
          }
        }

        // Get final response after tool execution (fallback for complex queries)
        try {
          const messages = [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory
          ];

          const finalResponse = await this.ollama.chat({
            model: config.ollama.model,
            messages: messages,
            stream: false
          });

          return finalResponse.message.content;
        } catch (ollamaError) {
          // Return a fallback response instead of crashing
          return 'I successfully executed the blockchain operation, but had trouble generating a response. The action completed successfully.';
        }
      }

      return assistantMessage.content;

    } catch (error) {
      console.error(chalk.red('❌ Chat error:'), error.message);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  getCapabilitiesMessage() {
    return `I'm Agent Rug, your AI assistant for digital rug maintenance on the blockchain! Here's what I can do:

🧹 **Maintenance Operations:**
• Clean rugs (removes dirt accumulation)
• Restore rugs (repairs wear and tear)
• Master restore rugs (complete restoration)

🔍 **Smart Information & Analysis:**
• Check individual rug status and NFT metadata
• Discover all rugs you own on the blockchain
• **AI-powered collection analysis** - intelligent condition assessment
• Wallet balance and transaction history
• Comprehensive maintenance statistics

💬 **Natural Language Commands:**
• "clean rug 1" - Clean specific rug
• "how are my rugs doing?" - **Smart AI analysis** of your entire collection
• "how much ETH do I have?" - Check wallet balance
• "how many maintenances?" - Show operation history
• "what can you do?" - Show this help

🧠 **AI Intelligence Features:**
• **Real-time NFT metadata analysis** from tokenURI
• **Smart condition assessment** based on dirt levels, aging, maintenance scores
• **Priority-based recommendations** (urgent, needed, optional)
• **Maintenance history insights** and overdue tracking
• **Personalized care suggestions** for each rug
• Context-aware conversations and error recovery

🌐 **Network:** Base Sepolia testnet

**Try asking: "how are my rugs doing?" for intelligent analysis!**

Just tell me what you'd like to do with your rugs!`;
  }

  async getBalanceMessage() {
    try {
      // Get real balance from API
      const response = await fetch(`${config.api.baseUrl}/agent/stats`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const stats = result.data;
          return `Your agent wallet balance is ${stats.walletBalanceEth} ETH. You've performed ${stats.maintenanceCount} maintenance operations.`;
        }
      }
      return 'I\'m having trouble checking your balance right now. Please try again later.';
    } catch (error) {
      console.error('Balance check error:', error.message);
      return 'I\'m having trouble checking your balance right now. Please try again later.';
    }
  }

  async getRugAnalysisMessage() {
    try {
      // Get rug analysis from API
      const response = await fetch(`${config.api.baseUrl}/rugs/analyze?owner=${config.owner.address}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.analyses) {
          let message = result.overallAssessment.summary + '\n\n';

          // Add individual rug assessments
          result.analyses.forEach(analysis => {
            message += `• ${analysis.summary}\n`;

            // Add raw NFT traits
            if (analysis.rawTraits) {
              message += `  📊 Raw Stats: Text Lines: ${analysis.rawTraits.textLines}, Characters: ${analysis.rawTraits.characterCount}, Palette: ${analysis.rawTraits.paletteName}, Stripes: ${analysis.rawTraits.stripeCount}, Complexity: ${analysis.rawTraits.complexity}, Warp: ${analysis.rawTraits.warpThickness}\n`;
              message += `  🧹 Maintenance: Dirt ${analysis.rawTraits.dirtLevel}, Aging ${analysis.rawTraits.agingLevel}, Score ${analysis.rawTraits.maintenanceScore}, Cleanings ${analysis.rawTraits.cleaningCount}, Restorations ${analysis.rawTraits.restorationCount}, Master Restore ${analysis.rawTraits.masterRestorationCount}\n`;
              message += `  📅 History: Minted ${new Date(parseInt(analysis.rawTraits.mintTime) * 1000).toLocaleDateString()}, Last Cleaned ${analysis.rawTraits.lastCleaned > 0 ? new Date(parseInt(analysis.rawTraits.lastCleaned) * 1000).toLocaleDateString() : 'Never'}\n`;
            }

            if (analysis.recommendations && analysis.recommendations.length > 0) {
              message += `  💡 Recommendations: ${analysis.recommendations.join(', ')}\n`;
            }
            message += '\n';
          });

          // Add overall recommendations
          if (result.overallAssessment.recommendations && result.overallAssessment.recommendations.length > 0) {
            message += `\n💡 Overall Recommendations:\n`;
            result.overallAssessment.recommendations.forEach(rec => {
              message += `• ${rec}\n`;
            });
          }

          return message.trim();
        }
      }
      return 'I\'m having trouble analyzing your rugs right now. Please make sure you own rugs and try again later.';
    } catch (error) {
      console.error('Rug analysis error:', error.message);
      return 'I\'m having trouble analyzing your rugs right now. Please try again later.';
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
          // Kill embedded API server if we started it
          if (this.apiProcess) {
            console.log(chalk.gray('🛑 Stopping embedded API server...'));
            this.apiProcess.kill();
          }

          // Kill Ollama if we started it
          if (this.ollamaProcess) {
            console.log(chalk.gray('🛑 Stopping Ollama server...'));
            this.ollamaProcess.kill();
          }
          return;
        }

        // Handle direct queries that should not trigger tool calls
        const lowerInput = input.toLowerCase().trim();

        // Help and capability queries
        if (lowerInput.includes('what can') || lowerInput.includes('help') ||
            lowerInput.includes('commands') || lowerInput.includes('options') ||
            lowerInput === 'capabilities' || lowerInput === 'abilities') {
          console.log(chalk.green('Agent Rug:'), this.getCapabilitiesMessage());
          console.log(''); // Empty line for readability
          askQuestion(); // Continue the conversation
          return;
        }

        // Balance queries - handle directly to avoid tool call conflicts
        if (lowerInput.includes('balance') || lowerInput.includes('wallet') ||
            lowerInput.includes('how much eth') || lowerInput.includes('how much money')) {
          console.log(chalk.gray('Agent Rug:'), 'Thinking...');
          const balanceResponse = await this.getBalanceMessage();
          console.log(chalk.green('Agent Rug:'), balanceResponse);
          console.log(''); // Empty line for readability
          askQuestion(); // Continue the conversation
          return;
        }

        // Bulk rug condition queries - handle directly with smart analysis
        // Only trigger for queries about ALL rugs, not specific ones
        if ((lowerInput.includes('how are my') && lowerInput.includes('rug') && !/\d/.test(lowerInput)) ||
            (lowerInput.includes('rug') && lowerInput.includes('doing') && !/\d/.test(lowerInput)) ||
            lowerInput.includes('rug condition') || lowerInput.includes('rug status') ||
            lowerInput.includes('all my rugs')) {
          console.log(chalk.gray('Agent Rug:'), 'Analyzing your rug collection...');
          const analysisResponse = await this.getRugAnalysisMessage();
          console.log(chalk.green('Agent Rug:'), analysisResponse);
          console.log(''); // Empty line for readability
          askQuestion(); // Continue the conversation
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
    // Start embedded API server
    console.log(chalk.blue('🔗 Starting embedded API server...'));
    const apiStarted = await chat.startEmbeddedAPIServer();
    if (!apiStarted) {
      console.log(chalk.red('❌ Failed to start embedded API server'));
      console.log(chalk.yellow('💡 Some features may not work without the API server'));
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

