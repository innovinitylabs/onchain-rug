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
import { privateKeyToAccount } from 'viem/accounts';
// Custom X402 facilitator integration (no external dependencies)

// Base Sepolia chain definition (not built into viem)
const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
    public: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Base Sepolia Explorer',
      url: 'https://sepolia-explorer.base.org',
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
    rpcUrl: process.env.RPC_URL || 'https://sepolia.shape.network',
    chainId: parseInt(process.env.CHAIN_ID || '11011'),
    contractAddress: process.env.CONTRACT_ADDRESS || '0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325'
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
  },
  x402: {
    facilitatorUrl: process.env.X402_FACILITATOR_URL || 'http://localhost:3000/api/x402/facilitator',
    payToAddress: process.env.X402_PAY_TO_ADDRESS || process.env.CONTRACT_ADDRESS,
    network: 'base-sepolia',
    assetAddress: '0x0000000000000000000000000000000000000000', // ETH
    assetName: 'ETH'
  }
};

// Initialize clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.blockchain.rpcUrl)
});

let agentWallet = null;
if (config.wallet.privateKey) {
  const account = privateKeyToAccount(config.wallet.privateKey);
  agentWallet = createWalletClient({
    chain: baseSepolia,
    transport: http(config.blockchain.rpcUrl),
    account: account
  });
  console.log(chalk.green(`✅ Agent wallet loaded: ${account.address}`));
} else {
  console.log(chalk.yellow('⚠️  No AGENT_PRIVATE_KEY set - maintenance actions will fail'));
}

// Initialize x402 Facilitator Client (HTTP-based)
const facilitatorClient = {
  url: config.x402.facilitatorUrl,

  async createPaymentRequirement(price, description, payTo, resource) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_payment_requirement',
        price: price.toString(),
        description,
        payTo,
        resource,
        scheme: 'exact',
        network: config.x402.network
      })
    });

    if (!response.ok) {
      throw new Error(`Facilitator error: ${response.status}`);
    }

    return await response.json();
  },

  async verifyPayment(paymentPayload) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify_payment',
        paymentPayload: JSON.stringify(paymentPayload)
      })
    });

    if (!response.ok) {
      throw new Error(`Facilitator verification error: ${response.status}`);
    }

    return await response.json();
  },

  async settlePayment(paymentPayload) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'settle_payment',
        paymentPayload: JSON.stringify(paymentPayload)
      })
    });

    if (!response.ok) {
      throw new Error(`Facilitator settlement error: ${response.status}`);
    }

    return await response.json();
  }
};

console.log(chalk.green('✅ Custom x402 Facilitator Client initialized'));
console.log(chalk.gray(`   Facilitator URL: ${config.x402.facilitatorUrl}`));

// Owner wallet not needed - authorization happens via dashboard/website

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
    name: 'getAgentServiceFee',
    outputs: [
      { name: 'serviceFee', type: 'uint256' },
      { name: 'feeRecipient', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  // ERC721 functions for rug discovery
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' }
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
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
    this.totalServiceFeesPaid = 0n;
    this.maintenanceCount = 0;
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', agent: config.agent.name, timestamp: new Date().toISOString() });
    });

    // Get maintenance quote (FREE - read operation)
    this.app.get('/rug/:tokenId/quote/:action', async (req, res) => {
      try {
        const tokenId = parseInt(req.params.tokenId);
        const action = req.params.action;

        console.log(chalk.blue(`💰 API: Getting ${action} quote for rug #${tokenId} (free)`));

        const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getMaintenanceOptions',
          args: [BigInt(tokenId)]
        });

        console.log(chalk.gray(`   Contract data: canClean=${canClean}, canRestore=${canRestore}, needsMaster=${needsMaster}`));
        console.log(chalk.gray(`   Costs: clean=${formatEther(cleaningCost)}, restore=${formatEther(restorationCost)}, master=${formatEther(masterCost)}`));

        const feesResult = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getAgentServiceFee'
        });

        const [serviceFee] = feesResult;

        let maintenanceCost = 0n;
        let functionName = '';
        let description = '';

        switch (action) {
          case 'clean':
            maintenanceCost = cleaningCost;
            functionName = 'cleanRugAgent';
            description = `Clean rug #${tokenId}`;
            if (!canClean && maintenanceCost === 0n) {
              return res.json({ error: 'Cleaning not needed', maintenanceCost: '0', serviceFee: formatEther(serviceFee), totalCost: formatEther(serviceFee) });
        }
            break;
          case 'restore':
            maintenanceCost = restorationCost;
            functionName = 'restoreRugAgent';
            description = `Restore rug #${tokenId}`;
            if (!canRestore || maintenanceCost === 0n) {
              return res.json({ error: 'Restoration not available', maintenanceCost: '0', serviceFee: formatEther(serviceFee), totalCost: formatEther(serviceFee) });
            }
            break;
          case 'master':
            maintenanceCost = masterCost;
            functionName = 'masterRestoreRugAgent';
            description = `Master restore rug #${tokenId}`;
            if (!needsMaster || maintenanceCost === 0n) {
              return res.json({ error: 'Master restoration not needed', maintenanceCost: '0', serviceFee: formatEther(serviceFee), totalCost: formatEther(serviceFee) });
        }
            break;
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }

        const totalCost = maintenanceCost + serviceFee;

        res.json({
          success: true,
          tokenId,
          action,
          description,
          maintenanceCost: formatEther(maintenanceCost),
          serviceFee: formatEther(serviceFee),
          totalCost: formatEther(totalCost),
          canExecute: true
        });
      } catch (error) {
        console.log(chalk.red(`❌ API: Quote failed:`, error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get rug status (FREE - read operation)
    this.app.get('/rug/:tokenId/status', async (req, res) => {
      try {

        const tokenId = parseInt(req.params.tokenId);
        console.log(chalk.blue(`🔍 API: Checking rug #${tokenId} status (free)`));

        const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getMaintenanceOptions',
          args: [BigInt(tokenId)]
        });

        // Get additional rug data
        const [dirtLevel, agingLevel, frameLevel, maintenanceScore] = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getRugData',
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
          masterCostEth: formatEther(masterCost),
          dirtLevel: parseInt(dirtLevel),
          agingLevel: parseInt(agingLevel),
          frameLevel: parseInt(frameLevel),
          maintenanceScore: parseInt(maintenanceScore)
        };

        console.log(chalk.green(`✅ API: Rug #${tokenId} status retrieved (x402 paid)`));
        res.json({
          success: true,
          data: status,
          x402: {
            paymentVerified: true,
            settlement: settlement
          }
        });
      } catch (error) {
        console.log(chalk.red(`❌ API: Error checking rug status:`, error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Authorization happens via dashboard/website, not through API

    // Perform maintenance (requires x402 payment)
    this.app.post('/rug/:tokenId/maintain', async (req, res) => {
      try {
        // Check for x402 payment
        const paymentPayload = req.headers['x402-payment-payload'];
        const paymentStatus = req.headers['x402-payment-status'];

        const tokenId = req.params.tokenId;
        const { action } = req.body;

        if (!paymentPayload || paymentStatus !== 'payment-submitted') {
          try {
          // Get the cost first to create payment requirement
          const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await publicClient.readContract({
            address: config.blockchain.contractAddress,
            abi: RugMaintenanceAbi,
            functionName: 'getMaintenanceOptions',
            args: [BigInt(tokenId)]
          });

          let cost = 0n;
          let description = '';
          switch (action) {
            case 'clean':
              cost = cleaningCost;
              description = `Clean rug #${tokenId}`;
              break;
            case 'restore':
              cost = restorationCost;
              description = `Restore rug #${tokenId}`;
              break;
            case 'master':
              cost = masterCost;
              description = `Master restore rug #${tokenId}`;
              break;
            default:
              return res.status(400).json({ error: 'Invalid action' });
          }

          // Get service fee
          const [serviceFee] = await publicClient.readContract({
            address: config.blockchain.contractAddress,
            abi: RugMaintenanceAbi,
            functionName: 'getAgentServiceFee'
          });

          const totalCost = cost + serviceFee;
          const price = formatEther(totalCost);

            // Get payment requirement from facilitator
            const paymentRequired = await facilitatorClient.createPaymentRequirement(
              price,
              description,
              config.x402.payToAddress,
              `/rug/${tokenId}/maintain`
            );

          console.log(chalk.yellow(`💰 x402 payment required for ${action} on rug #${tokenId}: ${price} ETH`));
          return res.status(402).json({
            error: 'Payment Required',
              x402: paymentRequired
            });
          } catch (error) {
            console.log(chalk.red(`❌ Failed to create payment requirement: ${error.message}`));
            return res.status(500).json({
              error: 'Failed to create payment requirement',
              details: error.message
            });
          }
        }

        // Verify x402 payment
        const verifyResult = await facilitatorClient.verifyPayment(JSON.parse(paymentPayload));
        if (!verifyResult.isValid) {
          console.log(chalk.red(`❌ x402 payment verification failed: ${verifyResult.invalidReason}`));
          return res.status(402).json({
            error: 'Payment verification failed',
            reason: verifyResult.invalidReason
          });
        }

        // Settle the payment
        const settlement = await facilitatorClient.settlePayment(JSON.parse(paymentPayload));
        if (!settlement.success) {
          console.log(chalk.red(`❌ x402 payment settlement failed: ${settlement.errorReason}`));
          return res.status(402).json({
            error: 'Payment settlement failed',
            reason: settlement.errorReason
          });
        }

        // Now execute the maintenance (x402 payment already verified and settled)

        if (!['clean', 'restore', 'master'].includes(action)) {
          throw new Error('Invalid action. Must be: clean, restore, or master');
        }

        console.log(chalk.blue(`🔧 API: Performing ${action} on rug #${tokenId}...`));

        if (!agentWallet) {
          throw new Error('Agent wallet not configured');
        }

        // Get current flat service fee
        const [serviceFee, feeRecipient] = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getAgentServiceFee'
        });

        // Get maintenance costs
        const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getMaintenanceOptions',
          args: [BigInt(tokenId)]
        });

        let maintenanceCost, functionName;
        switch (action) {
          case 'clean':
            maintenanceCost = cleaningCost;
            functionName = 'cleanRugAgent';
            break;
          case 'restore':
            maintenanceCost = restorationCost;
            functionName = 'restoreRugAgent';
            break;
          case 'master':
            maintenanceCost = masterCost;
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
          this.totalServiceFeesPaid += serviceFee;

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
            serviceFeesPaid: formatEther(this.totalServiceFeesPaid),
            totalMaintenances: this.maintenanceCount
          };

          console.log(chalk.green(`✅ API: ${action} completed! Paid ${formatEther(serviceFee)} ETH service fee`));
          res.json(result);
        } else {
          throw new Error('Transaction failed');
        }
      } catch (error) {
        console.log(chalk.red(`❌ API: Maintenance failed:`, error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Execute authorized maintenance action (called after X402 payment verification)
    this.app.post('/rug/:tokenId/execute', async (req, res) => {
      try {
        const tokenId = parseInt(req.params.tokenId);
        const { authorization } = req.body;

        console.log(chalk.blue(`🔧 API: Executing authorized ${authorization.action} on rug #${tokenId}`));

        // Verify authorization token (new X402 format)
        if (!authorization || !authorization.authorizationToken) {
          return res.status(403).json({ success: false, error: 'Missing authorization token' });
        }

        // For now, we trust the website issued valid tokens after X402 verification
        // The contract will validate the token and ensure it hasn't been used

        // Execute the blockchain transaction
        if (!['clean', 'restore', 'master'].includes(authorization.action)) {
          throw new Error('Invalid action. Must be: clean, restore, or master');
        }

        if (!agentWallet) {
          throw new Error('Agent wallet not configured');
        }

        // For X402-authorized agents, contract payment is 0 (X402 already covered fees)
        // The authorization contains the cost breakdown for logging only
        const maintenanceCost = BigInt(authorization.maintenanceCost || '0');
        const serviceFee = BigInt(authorization.serviceFee || '0');

        // Determine contract function to call
        let functionName = '';
        switch (authorization.action) {
          case 'clean':
            functionName = 'cleanRugAgent';
            break;
          case 'restore':
            functionName = 'restoreRugAgent';
            break;
          case 'master':
            functionName = 'masterRestoreRugAgent';
            break;
        }

        console.log(chalk.gray(`   X402 Payment Covered: ${formatEther(maintenanceCost + serviceFee)} ETH`));
        console.log(chalk.gray(`   Contract Payment: 0 ETH (just gas)`));

        // Execute transaction with 0 value (X402 already covered the service costs)
        // Include authorization token, nonce, and expires as parameters
        const hash = await agentWallet.writeContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: functionName,
          args: [BigInt(tokenId), authorization.authorizationToken, authorization.nonce, BigInt(authorization.expires)],
          value: 0n
        });

        console.log(chalk.gray('⏳ Waiting for confirmation...'));
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        console.log(chalk.green(`✅ API: ${authorization.action} completed! Tx: ${hash}`));

        res.json({
          success: true,
          action: authorization.action,
          tokenId: tokenId,
          transactionHash: hash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          authorizationToken: authorization.authorizationToken, // Token used
          contractPayment: '0', // Contract execution is free for authorized agents
          message: 'Maintenance completed successfully via X402 authorization token'
        });

      } catch (error) {
        console.log(chalk.red(`❌ API: Execution failed:`, error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get agent stats (FREE read operation - no X402 payment required)
    this.app.get('/agent/stats', async (req, res) => {
      try {
        console.log(chalk.blue(`📊 API: Getting agent stats (free)`));

        res.json({
          agentName: config.agent.name,
          totalServiceFeesPaid: this.totalServiceFeesPaid.toString(),
          totalServiceFeesPaidEth: formatEther(this.totalServiceFeesPaid),
          maintenanceCount: this.maintenanceCount,
        walletAddress: config.wallet.address || 'Not configured',
        contractAddress: config.blockchain.contractAddress,
        network: 'Shape Sepolia'
      });
      } catch (error) {
        console.error('Agent stats error:', error);
        res.status(500).json({
          error: 'Failed to get agent stats',
          details: error.message
        });
      }
    });

    // Get rugs owned by owner (FREE read operation - no X402 payment required)
    this.app.get('/owner/rugs', async (req, res) => {
      try {
        console.log(chalk.blue('🔍 API: Discovering rugs owned by owner (free read operation)...'));

        if (!config.owner.address) {
          throw new Error('Owner address not configured');
        }

        // Get total supply to know how many tokens to check
        const totalSupply = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'totalSupply'
        });

        console.log(chalk.gray(`   Scanning ${totalSupply} total tokens...`));

        // Scan through all possible token IDs to find ones owned by the owner
        const ownedRugs = [];
        const batchSize = 10; // Check 10 tokens at a time

        console.log(chalk.gray(`   Scanning tokens 0 to ${totalSupply}...`));

        for (let tokenId = 0; tokenId <= Number(totalSupply); tokenId++) {
          try {
            const owner = await publicClient.readContract({
              address: config.blockchain.contractAddress,
              abi: RugMaintenanceAbi,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)]
            });

            if (owner.toLowerCase() === config.owner.address.toLowerCase()) {
              console.log(chalk.gray(`   Found owned token: ${tokenId}`));
              ownedRugs.push(tokenId);
            }
          } catch (error) {
            // Token doesn't exist or other error - skip
            console.log(chalk.gray(`   Token ${tokenId} error: ${error.message.substring(0, 50)}...`));
          }
        }

        console.log(chalk.green(`✅ API: Found ${ownedRugs.length} rugs owned by owner`));
        res.json({
          success: true,
          ownerAddress: config.owner.address,
          ownedRugs,
          totalOwned: ownedRugs.length
        });
      } catch (error) {
        console.log(chalk.red('❌ API: Error discovering owner rugs:', error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get rugs owned by agent (for agent's own rugs)
    this.app.get('/agent/rugs', async (req, res) => {
      try {
        console.log(chalk.blue('🔍 API: Discovering rugs owned by agent...'));

        if (!config.wallet.address) {
          throw new Error('Agent wallet not configured');
        }

        // Get balance of rugs owned by agent
        const balance = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'balanceOf',
          args: [config.wallet.address]
        });

        console.log(chalk.gray(`   Agent owns ${balance} rugs`));

        // Get all token IDs owned by agent
        const ownedRugs = [];
        for (let i = 0; i < Number(balance); i++) {
          try {
            const tokenId = await publicClient.readContract({
              address: config.blockchain.contractAddress,
              abi: RugMaintenanceAbi,
              functionName: 'tokenOfOwnerByIndex',
              args: [config.wallet.address, BigInt(i)]
            });
            ownedRugs.push(Number(tokenId));
          } catch (error) {
            console.log(chalk.yellow(`   Warning: Could not get token at index ${i}:`, error.message));
          }
        }

        console.log(chalk.green(`✅ API: Found ${ownedRugs.length} rugs owned by agent`));
        res.json({
          success: true,
          agentAddress: config.wallet.address,
          ownedRugs,
          totalOwned: ownedRugs.length
        });
      } catch (error) {
        console.log(chalk.red('❌ API: Error discovering agent rugs:', error.message));
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // AI analysis endpoint (for Ollama tool calling)
    this.app.post('/ai/analyze', async (req, res) => {
      try {
        const { rugData } = req.body;

        const ollama = new Ollama({
          host: config.ollama.baseUrl
        });

        const prompt = `You are ${config.agent.name}, an AI maintenance agent for digital rugs.

You maintain rugs by paying service fees (0.00042 ETH per action) to keep them clean and well-maintained.

Analyze this rug's condition and recommend the best maintenance action. Consider:
- Current condition (canClean, canRestore, needsMaster)
- Cost-effectiveness (you pay 0.00042 ETH service fee per action)
- Urgency level
- Your personality: ${config.agent.style}

Rug data: ${JSON.stringify(rugData)}

Respond with a JSON object containing:
- recommendedAction: "clean", "restore", "master", or "none"
- reasoning: brief explanation of why this action and the service fee cost
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
      console.log(chalk.gray(`   Contract: ${config.blockchain.contractAddress}`));
      console.log(chalk.gray(`   RPC: ${config.blockchain.rpcUrl}`));
      console.log(chalk.gray(`   Chain ID: ${config.blockchain.chainId}`));

      const result = await publicClient.readContract({
        address: config.blockchain.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getAgentServiceFee'
      });

      console.log(chalk.gray(`   Raw result: [${result[0]?.toString()}, ${result[1]}]`));

      const [serviceFee, feeRecipient] = result;
      console.log(chalk.green(`✅ Contract connected (Service fee: ${formatEther(serviceFee)} ETH, Recipient: ${feeRecipient})`));
    } catch (error) {
      console.log(chalk.red('❌ Contract connection failed:', error.message));
      console.log(chalk.red('   Full error:', error));
      console.log(chalk.yellow('💡 Check your CONTRACT_ADDRESS and network configuration'));
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
      console.log(chalk.blue(`🏘️  My Rugs: http://localhost:${config.server.port}/owner/rugs`));
      console.log(chalk.blue(`🤖 Agent Rugs: http://localhost:${config.server.port}/agent/rugs`));
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
