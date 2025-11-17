#!/usr/bin/env node

console.log('🔥 API SERVER STARTING...');

/**
 * 🛠️ RugBot API Server - Blockchain Backend for Ollama GUI
 *
 * This server provides REST API endpoints that Ollama can call via tool calling
 * to perform actual blockchain transactions through the GUI chat interface.
 *
 * Usage: npm run api-server
 */

console.log('🚀 Starting RugBot API Server...');

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

console.log('📋 Loading configuration...');

import express from 'express';
import cors from 'cors';
import { createPublicClient, createWalletClient, http, parseEther, formatEther, keccak256, encodePacked } from 'viem';
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
import chalk from 'chalk';

// Configuration
const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'rugbot:latest'
  },
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'https://sepolia.shape.network',
    chainId: parseInt(process.env.CHAIN_ID || '11011'),
    contractAddress: process.env.CONTRACT_ADDRESS
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
    facilitatorUrl: process.env.X402_FACILITATOR_URL,
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

// Validate required environment variables
if (!config.blockchain.contractAddress) {
  console.log(chalk.red('❌ CONTRACT_ADDRESS environment variable is required'));
  process.exit(1);
}

if (!config.wallet.address) {
  console.log(chalk.red('❌ AGENT_ADDRESS environment variable is required'));
  process.exit(1);
}

if (!config.owner.address) {
  console.log(chalk.red('❌ OWNER_ADDRESS environment variable is required'));
  process.exit(1);
}

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
  // ERC721 tokenURI function
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'agent', type: 'address' }],
    name: 'authorizeMaintenanceAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'authorizationToken', type: 'bytes32' },
      { name: 'nonce', type: 'string' },
      { name: 'expires', type: 'uint256' }
    ],
    name: 'cleanRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'authorizationToken', type: 'bytes32' },
      { name: 'nonce', type: 'string' },
      { name: 'expires', type: 'uint256' }
    ],
    name: 'restoreRugAgent',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'authorizationToken', type: 'bytes32' },
      { name: 'nonce', type: 'string' },
      { name: 'expires', type: 'uint256' }
    ],
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

        // Get maintenance options from contract
        const [canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost] = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'getMaintenanceOptions',
          args: [BigInt(tokenId)]
        });

        // Get real rug data from tokenURI metadata
        const tokenUri = await publicClient.readContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)]
        });

        console.log(chalk.gray(`   Token URI: ${tokenUri}`));

        // Fetch metadata from tokenURI
        let metadata = {};
        try {
          const metadataResponse = await fetch(tokenUri);
          if (metadataResponse.ok) {
            metadata = await metadataResponse.json();
          } else {
            console.log(chalk.yellow(`   Failed to fetch metadata: ${metadataResponse.status}`));
          }
        } catch (error) {
          console.log(chalk.yellow(`   Error fetching metadata: ${error.message}`));
        }

        // Extract traits from metadata
        const attributes = metadata.attributes || metadata.traits || [];
        const traits = {};
        attributes.forEach(attr => {
          if (attr.trait_type && attr.value !== undefined) {
            traits[attr.trait_type.toLowerCase().replace(/\s+/g, '')] = attr.value;
          }
        });

        // Get real values from traits
        const dirtLevel = parseInt(traits.dirtlevel || traits.dirt_level || '0') || 0;
        const agingLevel = parseInt(traits.aginglevel || traits.aging_level || '0') || 0;
        const frameLevel = parseInt(traits.frame || traits.framelevel || '0') || 0;
        const maintenanceScore = parseInt(traits.maintenancescore || traits.maintenance_score || '100') || 100;

        console.log(chalk.gray(`   Status: dirt=${dirtLevel}, aging=${agingLevel}, score=${maintenanceScore}, clean=${canClean}, restore=${canRestore}, master=${needsMaster}`));

        const status = {
          tokenId,
          canClean,
          canRestore,
          needsMaster,
          dirtLevel,
          agingLevel,
          frameLevel,
          maintenanceScore,
          cleaningCost: cleaningCost.toString(),
          restorationCost: restorationCost.toString(),
          masterCost: masterCost.toString(),
          cleaningCostEth: formatEther(cleaningCost),
          restorationCostEth: formatEther(restorationCost),
          masterCostEth: formatEther(masterCost),
          maintenanceScore: parseInt(maintenanceScore)
        };

        console.log(chalk.green(`✅ API: Rug #${tokenId} status retrieved (free)`));
        res.json({
          success: true,
          data: status
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

          // This endpoint is obsolete - maintenance operations now use website API directly
          return res.status(410).json({
            error: 'Endpoint obsolete',
            message: 'Use website API for maintenance operations'
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
      console.log(chalk.blue(`🔧 API: Execute endpoint called for rug ${req.params.tokenId}`));
      console.log(chalk.gray(`   Request body:`, JSON.stringify(req.body, null, 2)));

      try {
        const tokenId = parseInt(req.params.tokenId);
        const { authorization } = req.body;

        console.log(chalk.blue(`🔧 API: Executing authorized ${authorization.action} on rug #${tokenId}`));
        console.log(chalk.gray(`   Authorization object:`, JSON.stringify(authorization, null, 2)));

        // Verify authorization token (new X402 format)
        if (!authorization || !authorization.authorizationToken) {
          return res.status(403).json({ success: false, error: 'Missing authorization token' });
        }

        // Token validation is handled by the smart contract
        console.log(chalk.gray('   🔐 Token validation handled by smart contract'));

        // Execute the blockchain transaction
        console.log(chalk.gray(`   Checking action: "${authorization.action}" against ['clean', 'restore', 'master']`));
        if (!['clean', 'restore', 'master'].includes(authorization.action)) {
          console.log(chalk.red(`   Action "${authorization.action}" not in allowed list`));
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

        // Determine contract function
        let contractFunction;
        switch (authorization.action) {
          case 'clean':
            contractFunction = 'cleanRugAgent';
            break;
          case 'restore':
            contractFunction = 'restoreRugAgent';
            break;
          case 'master':
            contractFunction = 'masterRestoreRugAgent';
            break;
        }

        // Execute transaction with 0 value (X402 already covered the service costs)
        console.log(chalk.blue(`🔧 Calling contract function: ${contractFunction}`));
        console.log(chalk.gray(`   Address: ${config.blockchain.contractAddress}`));

        // Always use Agent functions with authorization tokens
        console.log(chalk.gray(`   Args: [${tokenId}, ${authorization.authorizationToken}, "${authorization.nonce}", ${authorization.expires}]`));

        const contractArgs = [
          BigInt(tokenId),
          authorization.authorizationToken,
          authorization.nonce,
          BigInt(authorization.expires)
        ];

        // Find the function in ABI to verify
        const abiFunction = RugMaintenanceAbi.find(f => f.name === contractFunction);
        console.log(chalk.gray(`   ABI function found:`, !!abiFunction));

        const hash = await agentWallet.writeContract({
          address: config.blockchain.contractAddress,
          abi: RugMaintenanceAbi,
          functionName: contractFunction,
          args: contractArgs,
          value: 0n
        });

        console.log(chalk.gray('⏳ Waiting for confirmation...'));
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Update agent statistics
        this.maintenanceCount++;
        // Note: Service fees are paid to facilitator, not tracked by agent
        // Agent only pays gas fees for transactions

        console.log(chalk.green(`✅ API: ${authorization.action} completed! Tx: ${hash}`));
        console.log(chalk.gray(`   Maintenance count updated: ${this.maintenanceCount}`));

        res.json({
          success: true,
          action: authorization.action,
          tokenId: tokenId,
          transactionHash: hash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          authorizationToken: authorization.authorizationToken,
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

        // Get agent wallet balance (direct on-chain read - no X402 needed)
        let walletBalance = '0';
        let walletBalanceEth = '0';
        try {
          if (config.wallet.address) {
            console.log(chalk.gray(`   Reading balance for address: ${config.wallet.address}`));
            const balance = await publicClient.getBalance({
              address: config.wallet.address
            });
            walletBalance = balance.toString();
            walletBalanceEth = formatEther(balance);
            console.log(chalk.gray(`   Balance: ${walletBalanceEth} ETH`));
          } else {
            console.log(chalk.yellow(`   No agent wallet address configured`));
          }
        } catch (error) {
          console.log(chalk.yellow(`   Could not get wallet balance: ${error.message}`));
        }

        // Calculate gas fees paid by agent (rough estimate based on transaction count)
        // Each maintenance operation costs ~0.00001 ETH in gas
        const estimatedGasFees = BigInt(this.maintenanceCount) * BigInt('10000000000000000'); // 0.01 ETH per tx
        const estimatedGasFeesEth = formatEther(estimatedGasFees);

        const stats = {
          agentName: config.agent.name,
          walletAddress: config.wallet.address || 'Not configured',
          walletBalance: walletBalance,
          walletBalanceEth: walletBalanceEth,
          // Service fees are paid to facilitator, not by agent
          totalServiceFeesPaid: '0', // Agent doesn't pay service fees directly
          totalServiceFeesPaidEth: '0',
          // Agent pays gas fees for transactions
          estimatedGasFeesPaid: estimatedGasFees.toString(),
          estimatedGasFeesPaidEth: estimatedGasFeesEth,
          maintenanceCount: this.maintenanceCount,
          contractAddress: config.blockchain.contractAddress,
          network: config.blockchain.chainId === 84532 ? 'Base Sepolia' : 'Shape Sepolia',
          note: 'Service fees are collected by facilitator. Agent only pays gas fees.'
        };

        console.log(chalk.green(`✅ API: Agent stats retrieved (free)`));
        res.json({
          success: true,
          data: stats
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
