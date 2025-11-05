# 🧠 AI Agent Setup Guide for x402 Rug Maintenance

This guide shows you how to set up and run an AI agent that can perform rug maintenance using the x402 protocol.

## 📋 Prerequisites

- Node.js 18+
- Your development server running (`npm run dev`)
- A test wallet with some testnet ETH
- Access to Base Sepolia or Shape Sepolia testnets

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd /Users/valipokkann/Developer/onchain_rugs_working
npm install viem@^2.37.5
```

### 2. Create Agent Wallet
```bash
# Generate a new private key for your AI agent
cast wallet new

# Save the private key securely - this will be your agent's wallet
# Example output:
# 0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207

# Fund the wallet with testnet ETH from:
# Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
# Shape Sepolia: https://faucet.shape.network
```

### 3. Configure Environment
Create `.env.agent`:
```bash
# AI Agent Configuration
AGENT_PRIVATE_KEY=0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207
CONTRACT_ADDRESS=0xa43532205Fc90b286Da98389a9883347Cc4064a8
API_BASE=http://localhost:3000
TEST_TOKEN_ID=1

# Rug Owner Configuration (for testing)
OWNER_PRIVATE_KEY=your_owner_private_key_here
```

### 4. Run the AI Agent
```bash
# Load environment and run
source .env.agent && node simple-ai-agent.js
```

## 🔧 Complete AI Agent Implementation

### Enhanced Agent with Wallet Integration

Create `advanced-ai-agent.js`:

```javascript
#!/usr/bin/env node

const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { baseSepolia } = require('./lib/web3');

// Load configuration
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xa43532205Fc90b286Da98389a9883347Cc4064a8';
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

// Initialize clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const agentWallet = createWalletClient({
  chain: baseSepolia,
  transport: http(),
  account: AGENT_PRIVATE_KEY
});

// Rug Maintenance ABI (simplified)
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

class AdvancedRugMaintenanceAgent {
  constructor() {
    this.contractAddress = CONTRACT_ADDRESS;
    this.apiBase = API_BASE;
    this.agentAddress = agentWallet.account.address;
  }

  async authorizeAsAgent() {
    console.log('🔐 Authorizing AI agent for maintenance...');

    if (!OWNER_PRIVATE_KEY) {
      console.log('⚠️  OWNER_PRIVATE_KEY not set. Skipping authorization.');
      console.log('   You need to manually authorize this agent address:', this.agentAddress);
      return false;
    }

    try {
      // Create owner wallet for authorization
      const ownerWallet = createWalletClient({
        chain: baseSepolia,
        transport: http(),
        account: OWNER_PRIVATE_KEY
      });

      const hash = await ownerWallet.writeContract({
        address: this.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'authorizeMaintenanceAgent',
        args: [this.agentAddress]
      });

      console.log('✅ Agent authorized! Tx:', hash);
      await publicClient.waitForTransactionReceipt({ hash });
      return true;
    } catch (error) {
      console.error('❌ Authorization failed:', error.message);
      return false;
    }
  }

  async checkServiceFees() {
    console.log('💰 Checking service fees...');

    try {
      const fees = await publicClient.readContract({
        address: this.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: 'getAgentServiceFees'
      });

      const [cleanFee, restoreFee, masterFee, feeRecipient] = fees;

      console.log('📊 Current Service Fees:', {
        cleanFee: formatEther(cleanFee) + ' ETH',
        restoreFee: formatEther(restoreFee) + ' ETH',
        masterFee: formatEther(masterFee) + ' ETH',
        feeRecipient: feeRecipient
      });

      return { cleanFee, restoreFee, masterFee, feeRecipient };
    } catch (error) {
      console.error('❌ Failed to check fees:', error.message);
      return null;
    }
  }

  async checkRugStatus(tokenId) {
    console.log(`🔍 Checking status for rug #${tokenId}...`);

    try {
      const response = await fetch(`${this.apiBase}/api/maintenance/status/${tokenId}`);
      const data = await response.json();

      if (!data.maintenance) {
        console.log('❌ Invalid response:', data);
        return null;
      }

      console.log('📊 Rug Status:', {
        canClean: data.maintenance.canClean,
        canRestore: data.maintenance.canRestore,
        needsMaster: data.maintenance.needsMaster,
        cleaningCost: formatEther(BigInt(data.maintenance.cleaningCostWei)) + ' ETH',
        restorationCost: formatEther(BigInt(data.maintenance.restorationCostWei)) + ' ETH',
        masterCost: formatEther(BigInt(data.maintenance.masterCostWei)) + ' ETH'
      });

      return data;
    } catch (error) {
      console.error('❌ Failed to check rug status:', error.message);
      return null;
    }
  }

  async getMaintenanceQuote(tokenId, action) {
    console.log(`💰 Getting quote for ${action} on rug #${tokenId}...`);

    try {
      const response = await fetch(`${this.apiBase}/api/maintenance/quote/${tokenId}/${action}`);
      const data = await response.json();

      if (response.status === 402 && data.x402?.accepts?.[0]) {
        const paymentReq = data.x402.accepts[0];
        const extra = paymentReq.extra;

        console.log('💳 Payment Required:', {
          totalAmount: formatEther(BigInt(paymentReq.maxAmountRequired)) + ' ETH',
          serviceFee: formatEther(BigInt(extra.serviceFeeWei)) + ' ETH',
          maintenanceCost: formatEther(BigInt(extra.maintenanceWei)) + ' ETH',
          function: extra.function
        });

        return paymentReq;
      } else if (data.error) {
        console.log('❌ API Error:', data.error);
        return null;
      } else {
        console.log('❌ Unexpected response:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get quote:', error.message);
      return null;
    }
  }

  async executeMaintenance(tokenId, paymentReq) {
    console.log(`🔧 Executing maintenance for rug #${tokenId}...`);

    try {
      const functionName = paymentReq.extra.function;
      const totalValue = BigInt(paymentReq.maxAmountRequired);

      console.log('📤 Sending transaction...');
      console.log(`   Function: ${functionName}`);
      console.log(`   Token ID: ${tokenId}`);
      console.log(`   Value: ${formatEther(totalValue)} ETH`);

      const hash = await agentWallet.writeContract({
        address: this.contractAddress,
        abi: RugMaintenanceAbi,
        functionName: functionName,
        args: [BigInt(tokenId)],
        value: totalValue
      });

      console.log('⏳ Waiting for confirmation... Tx:', hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log('✅ Maintenance completed successfully!');
        console.log('💰 Service fee earned and sent to recipient');
        return true;
      } else {
        console.log('❌ Transaction failed');
        return false;
      }

    } catch (error) {
      console.error('❌ Maintenance execution failed:', error.message);
      return false;
    }
  }

  async runAutomatedMaintenance(tokenIds = []) {
    console.log('🤖 AI Rug Maintenance Agent Starting...\n');

    // Step 1: Check service fees
    await this.checkServiceFees();
    console.log('');

    // Step 2: Authorize agent (if owner key provided)
    const authorized = await this.authorizeAsAgent();
    if (!authorized) {
      console.log('⚠️  Agent not authorized. Some operations may fail.');
    }
    console.log('');

    // Step 3: Check rugs and perform maintenance
    const rugsToCheck = tokenIds.length > 0 ? tokenIds : [process.env.TEST_TOKEN_ID || '1'];

    for (const tokenId of rugsToCheck) {
      console.log(`🏠 Processing rug #${tokenId}`);
      console.log('─'.repeat(40));

      // Check status
      const status = await this.checkRugStatus(tokenId);
      if (!status) continue;

      // Determine maintenance needed
      let action = null;
      if (status.maintenance.needsMaster) {
        action = 'master';
      } else if (status.maintenance.canRestore) {
        action = 'restore';
      } else if (status.maintenance.canClean) {
        action = 'clean';
      }

      if (!action) {
        console.log('✅ Rug is in perfect condition!');
        console.log('');
        continue;
      }

      // Get quote
      const paymentReq = await this.getMaintenanceQuote(tokenId, action);
      if (!paymentReq) {
        console.log('');
        continue;
      }

      // Ask for confirmation (in production, this would be automatic)
      console.log('\n⚠️  Ready to execute maintenance. In production, user would approve this payment.');
      const shouldProceed = process.env.AUTO_APPROVE === 'true';

      if (shouldProceed) {
        await this.executeMaintenance(tokenId, paymentReq);
      } else {
        console.log('⏸️  Set AUTO_APPROVE=true to execute automatically');
      }

      console.log('');
    }

    console.log('🎉 Maintenance cycle completed!');
  }
}

// CLI interface
async function main() {
  console.log('🚀 Advanced AI Rug Maintenance Agent\n');

  const agent = new AdvancedRugMaintenanceAgent();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const tokenIds = args.length > 0 ? args : [];

  await agent.runAutomatedMaintenance(tokenIds);
}

// Export for testing
module.exports = AdvancedRugMaintenanceAgent;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
```

### 5. Set Up Wallet Integration

Create `wallet-config.js`:
```javascript
// Wallet configuration for AI agent
const { privateKeyToAccount } = require('viem/accounts');

function setupAgentWallet(privateKey) {
  if (!privateKey) {
    throw new Error('AGENT_PRIVATE_KEY environment variable is required');
  }

  const account = privateKeyToAccount(privateKey);
  console.log('🤖 AI Agent Wallet:', account.address);

  return account;
}

function setupOwnerWallet(privateKey) {
  if (!privateKey) {
    console.log('⚠️  OWNER_PRIVATE_KEY not set - manual authorization required');
    return null;
  }

  const account = privateKeyToAccount(privateKey);
  console.log('👤 Owner Wallet:', account.address);

  return account;
}

module.exports = { setupAgentWallet, setupOwnerWallet };
```

### 6. Test the Complete Flow

```bash
# 1. Check agent wallet balance
cast balance $AGENT_ADDRESS --rpc-url https://sepolia.base.org

# 2. Authorize the agent (if you have owner key)
source .env.agent && node -e "
const { setupOwnerWallet } = require('./wallet-config');
const owner = setupOwnerWallet(process.env.OWNER_PRIVATE_KEY);
if (owner) console.log('Owner wallet ready:', owner.address);
"

# 3. Run the AI agent
source .env.agent && node advanced-ai-agent.js

# 4. Check contract balance after maintenance
cast balance $CONTRACT_ADDRESS --rpc-url https://sepolia.base.org
```

## 🎯 What the AI Agent Does

1. **Authorization**: Gets permission to maintain rugs
2. **Status Check**: Monitors rug condition via API
3. **Quote Generation**: Gets payment requirements for maintenance
4. **Transaction Execution**: Performs maintenance in single transaction
5. **Fee Collection**: Earns service fees for providing AI service

## 💰 Revenue Model

- **Service Fees**: AI agent earns 0.001-0.005 ETH per maintenance action
- **Maintenance Costs**: Go to contract treasury (like normal maintenance)
- **Gas Fees**: Paid by AI agent (can be optimized with batching)

## 🔧 Customization

### Adding Intelligence
```javascript
// Add ML logic for maintenance decisions
async function decideMaintenance(rugStatus) {
  if (rugStatus.maintenance.needsMaster) {
    return 'master'; // High priority
  }
  if (rugStatus.maintenance.canRestore && Math.random() > 0.7) {
    return 'restore'; // 30% chance
  }
  if (rugStatus.maintenance.canClean) {
    return 'clean'; // Regular maintenance
  }
  return null; // No maintenance needed
}
```

### Batch Processing
```javascript
// Maintain multiple rugs efficiently
async function batchMaintenance(tokenIds) {
  const maintenanceTxs = [];

  for (const tokenId of tokenIds) {
    const status = await this.checkRugStatus(tokenId);
    if (status.maintenance.canClean) {
      const quote = await this.getMaintenanceQuote(tokenId, 'clean');
      if (quote) {
        maintenanceTxs.push({ tokenId, quote });
      }
    }
  }

  // Execute in batches to save gas
  // ... batch execution logic
}
```

## 🚀 Production Deployment

1. **Set up dedicated agent wallet** with proper funding
2. **Implement user approval flow** for payments
3. **Add monitoring and logging** for maintenance actions
4. **Implement batch processing** for efficiency
5. **Add retry logic** for failed transactions

## 📊 Monitoring

Track agent performance:
- Success rate of maintenance actions
- Gas costs vs. service fees earned
- User satisfaction and rug health improvements

Your AI agent is now ready to autonomously maintain rugs and earn service fees! 🎉
