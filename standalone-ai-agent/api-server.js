#!/usr/bin/env node

/**
 * 🛠️ RugBot API Server - Blockchain Backend for Ollama GUI
 *
 * This server provides REST API endpoints that Ollama can call via tool calling
 * to perform actual blockchain transactions through the GUI chat interface.
 *
 * Usage: npm run api-server
 */

import express from 'express';
import cors from 'cors';
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
    model: process.env.OLLAMA_MODEL || 'rugbot:latest'
  },
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
    chainId: parseInt(process.env.CHAIN_ID || '84532'),
    contractAddress: process.env.CONTRACT_ADDRESS || '0xa43532205Fc90b286Da98389a9883347Cc4064a8'
  },
  wallet: {
    privateKey: process.env.AGENT_PRIVATE_KEY,
    address: process.env.AGENT_ADDRESS
  },
  owner: {
    privateKey: process.env.OWNER_PRIVATE_KEY,
    address: process.env.OWNER_ADDRESS
  },
  server: {
    port: parseInt(process.env.API_PORT || '3001')
  },
  agent: {
    name: process.env.AGENT_NAME || 'RugBot',
    style: process.env.AGENT_STYLE || 'helpful,professional,enthusiastic'
  }
};

// Initialize clients
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

let ownerWallet = null;
if (config.owner.privateKey) {
  ownerWallet = createWalletClient({
    chain: shapeSepolia,
    transport: http(config.blockchain.rpcUrl),
    account: config.owner.privateKey
  });
}

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

class RugBotAPIServer {
  constructor() {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    this.setupRoutes();
    this.totalEarnings = 0n;
    this.maintenanceCount = 0;
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', agent: config.agent.name, timestamp: new Date().toISOString() });
    });

    // Get rug status
    this.app.get('/rug/:tokenId/status', async (req, res) => {
      try {
        const tokenId = parseInt(req.params.tokenId);
        console.log(chalk.blue(`🔍 API: Checking rug #${tokenId} status...`));

        const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getMaintenanceOptions',
          args: [BigInt(tokenId)]
        });

        const status = {
          tokenId,
          canClean,
          canRestore,
          needsMaster,
          cleaningCost: cleaningCost.toString(),
          restorationCost: restorationCost.toString(),
          masterCost: masterCost.toString(),
          cleaningCostEth: formatEther(cleaningCost),
          restorationCostEth: formatEther(restorationCost),
          masterCostEth: formatEther(masterCost)
        };

        console.log(chalk.green(`✅ API: Rug #${tokenId} status retrieved`));
        res.json({ success: true, data: status });
      } catch (error) {
        console.log(chalk.red(`❌ API: Error checking rug status:`, error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Authorize agent
    this.app.post('/agent/authorize', async (req, res) => {
      try {
        console.log(chalk.blue('🔐 API: Authorizing agent...'));

        if (!ownerWallet || !agentWallet) {
          throw new Error('Wallet not configured');
        }

        const hash = await ownerWallet.writeContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'authorizeMaintenanceAgent',
          args: [config.wallet.address]
        });

        console.log(chalk.gray('⏳ Waiting for authorization...'));
        await publicClient.waitForTransactionReceipt({ hash });

        console.log(chalk.green('✅ API: Agent authorized successfully'));
        res.json({ success: true, message: 'Agent authorized', txHash: hash });
      } catch (error) {
        console.log(chalk.red('❌ API: Authorization failed:', error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Perform maintenance
    this.app.post('/rug/:tokenId/maintain', async (req, res) => {
      try {
        const tokenId = parseInt(req.params.tokenId);
        const { action } = req.body; // 'clean', 'restore', 'master'

        if (!['clean', 'restore', 'master'].includes(action)) {
          throw new Error('Invalid action. Must be: clean, restore, or master');
        }

        console.log(chalk.blue(`🔧 API: Performing ${action} on rug #${tokenId}...`));

        if (!agentWallet) {
          throw new Error('Agent wallet not configured');
        }

        // Get current fees
        const fees = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getAgentServiceFees'
        });

        // Get maintenance costs
        const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getMaintenanceOptions',
          args: [BigInt(tokenId)]
        });

        let maintenanceCost, serviceFee, functionName;
        switch (action) {
          case 'clean':
            maintenanceCost = cleaningCost;
            serviceFee = fees[0];
            functionName = 'cleanRugAgent';
            break;
          case 'restore':
            maintenanceCost = restorationCost;
            serviceFee = fees[1];
            functionName = 'restoreRugAgent';
            break;
          case 'master':
            maintenanceCost = masterCost;
            serviceFee = fees[2];
            functionName = 'masterRestoreRugAgent';
            break;
        }

        const totalValue = maintenanceCost + serviceFee;

        console.log(chalk.gray(`   Maintenance: ${formatEther(maintenanceCost)} ETH`));
        console.log(chalk.gray(`   Service Fee: ${formatEther(serviceFee)} ETH`));
        console.log(chalk.gray(`   Total: ${formatEther(totalValue)} ETH`));

        // Execute transaction
        const hash = await agentWallet.writeContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: functionName,
          args: [BigInt(tokenId)],
          value: totalValue
        });

        console.log(chalk.gray('⏳ Waiting for confirmation...'));
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === 'success') {
          this.maintenanceCount++;
          this.totalEarnings += serviceFee;

          const result = {
            success: true,
            action,
            tokenId,
            maintenanceCost: maintenanceCost.toString(),
            serviceFee: serviceFee.toString(),
            totalCost: totalValue.toString(),
            maintenanceCostEth: formatEther(maintenanceCost),
            serviceFeeEth: formatEther(serviceFee),
            totalCostEth: formatEther(totalValue),
            txHash: hash,
            earnings: formatEther(this.totalEarnings),
            totalMaintenances: this.maintenanceCount
          };

          console.log(chalk.green(`✅ API: ${action} completed! Earned ${formatEther(serviceFee)} ETH`));
          res.json(result);
        } else {
          throw new Error('Transaction failed');
        }
      } catch (error) {
        console.log(chalk.red(`❌ API: Maintenance failed:`, error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get agent stats
    this.app.get('/agent/stats', (req, res) => {
      res.json({
        agentName: config.agent.name,
        totalEarnings: this.totalEarnings.toString(),
        totalEarningsEth: formatEther(this.totalEarnings),
        maintenanceCount: this.maintenanceCount,
        walletAddress: config.wallet.address || 'Not configured',
        contractAddress: config.blockchain.contractAddress,
        network: 'Base Sepolia'
      });
    });

    // AI analysis endpoint (for Ollama tool calling)
    this.app.post('/ai/analyze', async (req, res) => {
      try {
        const { rugData } = req.body;

        const ollama = new Ollama({
          host: config.ollama.baseUrl
        });

        const prompt = `You are ${config.agent.name}, an AI maintenance agent for digital rugs.

Analyze this rug's condition and recommend the best maintenance action. Consider:
- Current condition (canClean, canRestore, needsMaster)
- Cost-effectiveness
- Urgency level
- Your personality: ${config.agent.style}

Rug data: ${JSON.stringify(rugData)}

Respond with a JSON object containing:
- recommendedAction: "clean", "restore", "master", or "none"
- reasoning: brief explanation
- urgency: "low", "medium", or "high"
- confidence: percentage 0-100
- personalityNote: fun comment in your style about this rug

Keep the personalityNote enthusiastic and in character as ${config.agent.name}!`;

        const response = await ollama.generate({
          model: config.ollama.model,
          prompt: prompt,
          format: 'json'
        });

        const analysis = JSON.parse(response.response);
        res.json({ success: true, analysis });
      } catch (error) {
        console.log(chalk.red('❌ AI analysis failed:', error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  async start() {
    console.log(chalk.blue(`🚀 Starting ${config.agent.name} API Server...\n`));

    // Test connections
    try {
      console.log(chalk.gray('⛓️  Testing blockchain connection...'));
      const blockNumber = await publicClient.getBlockNumber();
      console.log(chalk.green(`✅ Blockchain connected (Block: ${blockNumber})`));
    } catch (error) {
      console.log(chalk.red('❌ Blockchain connection failed:', error.message));
      console.log(chalk.yellow('💡 Check your RPC_URL configuration'));
      return;
    }

    try {
      console.log(chalk.gray('📋 Testing contract connection...'));
      const fees = await publicClient.readContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getAgentServiceFees'
      });
      console.log(chalk.green('✅ Contract connected'));
    } catch (error) {
      console.log(chalk.red('❌ Contract connection failed:', error.message));
      console.log(chalk.yellow('💡 Check your CONTRACT_ADDRESS configuration'));
      return;
    }

    if (!agentWallet) {
      console.log(chalk.yellow('⚠️  No agent wallet configured - API will work in read-only mode'));
      console.log(chalk.gray('   Set AGENT_PRIVATE_KEY in .env for transactions'));
    } else {
      console.log(chalk.green('✅ Agent wallet configured'));
    }

    // Start server
    this.app.listen(config.server.port, () => {
      console.log(chalk.green(`\n🎉 ${config.agent.name} API Server running!`));
      console.log(chalk.blue(`📡 Server: http://localhost:${config.server.port}`));
      console.log(chalk.blue(`❤️  Health: http://localhost:${config.server.port}/health`));
      console.log(chalk.blue(`🏠 Rug Status: http://localhost:${config.server.port}/rug/1/status`));
      console.log(chalk.blue(`🔧 Maintenance: POST http://localhost:${config.server.port}/rug/1/maintain`));
      console.log(chalk.blue(`📊 Stats: http://localhost:${config.server.port}/agent/stats`));
      console.log(chalk.gray('\n💡 This server enables Ollama GUI to perform real blockchain transactions!'));
      console.log(chalk.gray('   Use tool calling in Ollama to interact with these endpoints.\n'));
    });
  }
}

// CLI runner
async function main() {
  console.log(chalk.bold.blue('🛠️ RugBot API Server\n'));

  const server = new RugBotAPIServer();
  await server.start();
}

// Export for testing
export default RugBotAPIServer;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('💥 API Server crashed:'), error);
    process.exit(1);
  });
}
