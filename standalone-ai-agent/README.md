# 🤖 OnchainRug Standalone AI Agent

A **production-ready, local AI assistant** for digital rug maintenance on the blockchain. Features intelligent NFT analysis, real-time blockchain data, and **direct smart contract payments**. Runs completely locally with no external dependencies.

## ✨ Key Features

- 🚀 **Single Command Launch** - Everything starts automatically with `npm run chat`
- 🧠 **AI-Powered NFT Analysis** - Smart condition assessment using real tokenURI metadata
- ⛓️ **Real-Time Blockchain Data** - Direct contract calls, no hallucinations
- 💬 **Natural Language Chat** - Conversational interface with context awareness
- 📊 **Comprehensive Statistics** - Accurate maintenance counts and cost tracking
- 🔧 **Automated Operations** - Clean, restore, and master restore rugs
- 🛡️ **Clean UX** - No debug logs, professional chat experience
- 💰 **Transparent Costs** - Clear service fee breakdown

## 🚀 Quick Start (4 Steps)

### 1. **Install Dependencies**
```bash
cd standalone-ai-agent
npm install
```

### 2. **Setup Environment**
```bash
# Copy and edit configuration
cp config.example.env .env

# Edit .env with your settings (see Configuration section below)
```

### 3. **Start Your Local API Server**
```bash
# In a separate terminal, start your Next.js development server
npm run dev  # from the main project directory
```
The standalone agent needs your local API server running to function properly.

### 4. **Launch the Agent**
```bash
# Single command - starts everything automatically!
npm run chat
```

**That's it!** 🤖✨ The agent handles everything else automatically.

---

## 🧪 **Testing Direct Payment System**

The standalone agent now uses **direct smart contract payments** instead of X402 facilitators:

```bash
# Test the direct payment system
npm run test:direct-payment
```

This will:
- ✅ Test rug status queries (free)
- ✅ Test maintenance quotes (free)
- ✅ Show payment requirements for actions
- ⚠️ Skip actual transactions (to avoid gas costs)

---

## 💰 **Payment System Changes**

### **Before (X402 V1):**
```
Agent → Facilitator → Smart Contract
       (keys)     (payment)
```

### **Now (Direct Payment):**
```
Agent → Smart Contract (direct payment)
```

### **Benefits:**
- 🚀 **Faster**: No facilitator round-trips
- 🔒 **Safer**: No external key management
- 💰 **Cheaper**: Direct gas-only costs
- ✅ **Reliable**: On-chain verification

---

## 💬 **What You Can Ask**

### **NFT Analysis & Status**
```
"how are my rugs doing?"     → AI analysis of all your rugs
"how is my rug 1 doing?"     → Detailed analysis of specific rug
"what rugs do I have?"       → List all rugs you own
"check rug 1"               → Basic status of rug #1
```

### **Wallet & Costs**
```
"how much ETH do I have?"    → Real wallet balance
"how many maintenances?"    → Operation history
"what can you do?"          → Show all capabilities
```

### **Maintenance Operations**
```
"clean rug 1"               → Clean a rug
"restore rug 1"             → Restore a rug
"master restore rug 1"      → Complete restoration
```

---

## 🧠 **AI Intelligence Features**

### **Smart NFT Analysis**
- **Real tokenURI data** - Direct blockchain metadata reading
- **Condition assessment** - Clean/dirty/needs cleaning status
- **Priority scoring** - Urgent/needs attention/optional
- **Cost analysis** - Service fees + maintenance costs
- **Maintenance recommendations** - Personalized care suggestions

### **Example AI Response:**
```
• Rug #1: dirty - needs cleaning (maintenance score: 52)
  📊 Raw Stats: Text Lines: 1, Characters: 4, Palette: Indian Flag, Stripes: 25, Complexity: 2, Warp: 3
  🧹 Maintenance: Dirt 2, Aging 1, Score 64, Cleanings 8, Restorations 0, Masters 4
  📅 History: Minted 11/11/2025, Last Cleaned 11/17/2025
  💡 Recommendations: Schedule cleaning - moderate dirt buildup, Moderate maintenance score - could use improvement
```

## ⚙️ **Configuration**

Create a `.env` file with your settings:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Blockchain Configuration (Base Sepolia Testnet - Change for Mainnet)
RPC_URL=https://sepolia.base.org          # Use https://mainnet.base.org for mainnet
CHAIN_ID=84532                            # Use 8453 for mainnet
CONTRACT_ADDRESS=0x15c5a551b8aA39a3A4E73643a681E71F76093b62  # ⚠️ NOT FINALIZED - Verify before use

# Agent Wallet (for real transactions)
AGENT_PRIVATE_KEY=0x_your_private_key_here
AGENT_ADDRESS=0x_your_wallet_address_here

# User Wallet (whose rugs to analyze)
OWNER_ADDRESS=0x_your_user_wallet_address_here

# Optional: x402 Payment Configuration
X402_FACILITATOR_URL=http://localhost:3000/api/x402/facilitator
X402_PAY_TO_ADDRESS=0x_your_merchant_wallet
```

### **Required Setup:**

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Pull AI Model**: `ollama pull llama3.1:8b`
3. **Get Wallet**: Create or use existing Base Sepolia wallet
4. **Fund Wallet**: Get test ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
5. **Configure .env**: Add your wallet addresses and keys

---

## 💰 **Cost Structure**

### **Service Fees:**
- **All maintenance operations**: 0.00042 ETH flat service fee
- **Plus actual maintenance cost**: Variable based on operation and rug condition
- **Total example**: Clean operation = 0.00042 ETH (service) + 0.00001 ETH (maintenance) = 0.00043 ETH

### **Free Operations:**
- Checking rug status
- Getting wallet balance
- NFT metadata analysis
- Listing owned rugs

---

## 🔧 **Available Commands**

| Command | Description |
|---------|-------------|
| `npm run chat` | **Launch the agent** (single command) |
| `npm test` | Run test suite |
| `npm run api-server` | Start API server only (for debugging) |

---

## 🛠️ **How It Works**

### **Single Process Architecture:**
```
User Command → npm run chat
                    ↓
        ┌─────────────────────┐
        │  Chat Interface     │
        │  (User Interface)   │
        └─────────────────────┘
                    ↓
        ┌─────────────────────┐
        │  Embedded API       │
        │  (Blockchain Ops)   │
        └─────────────────────┘
                    ↓
        ┌─────────────────────┐
        │  Smart Contracts    │
        │  (Base Sepolia)     │
        └─────────────────────┘
```

### **AI Decision Flow:**
1. **User Query** → Natural language input
2. **Intent Analysis** → AI determines user intent
3. **Data Retrieval** → Fetch real blockchain data
4. **Smart Analysis** → AI assesses conditions and priorities
5. **Response Generation** → Provide insights and recommendations
6. **Action Execution** → Perform maintenance operations (with confirmation)

---

## 🚨 **Troubleshooting**

### **"Connection failed"**
```bash
# Check if Ollama is running
ollama list

# Start Ollama if needed
ollama serve
```

### **"No rugs found"**
- Verify `OWNER_ADDRESS` in `.env` owns rugs on Base Sepolia
- Check contract address is correct
- Ensure you're on the right network

### **"Transaction failed"**
- Check wallet has sufficient ETH for gas + service fees
- Verify private key is correct in `.env`
- Confirm contract is deployed on Base Sepolia

### **"Model not found"**
```bash
# Pull the required model
ollama pull llama3.1:8b

# Or change model in .env
OLLAMA_MODEL=different-model-name
```

---

## 📊 **Network Information**

### **Testnet (Recommended for Testing):**
- **Network**: Base Sepolia
- **Contract**: `0x15c5a551b8aA39a3A4E73643a681E71F76093b62` ⚠️ **Not Finalized**
- **RPC URL**: `https://sepolia.base.org`
- **Chain ID**: 84532
- **Explorer**: [Base Sepolia Explorer](https://sepolia-explorer.base.org)
- **Faucet**: [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

### **Mainnet (Production - Use with Caution):**
- **Network**: Base Mainnet
- **Contract**: `0x15c5a551b8aA39a3A4E73643a681E71F76093b62` ⚠️ **Not Finalized**
- **RPC URL**: `https://mainnet.base.org`
- **Chain ID**: 8453
- **Explorer**: [Base Mainnet Explorer](https://basescan.org)
- **Bridge**: [Base Bridge](https://bridge.base.org)

⚠️ **Contract Address Disclaimer**: The contract address is not yet finalized and may change. Always verify the current contract address before authorizing or sending transactions. Check official sources for the latest deployment address.

⚠️ **Warning**: Mainnet uses real ETH. Start with small amounts and test extensively on testnet first.

---

## ⚠️ **IMPORTANT SAFETY & SECURITY NOTICE**

### **🚨 CRITICAL WARNINGS:**

**This software is provided "AS IS" without warranty of any kind, express or implied.**

- **NO WARRANTY**: This AI agent is provided without any warranties. Use at your own risk.
- **FUND LOSS RISK**: The agent performs real blockchain transactions. You may lose funds due to:
  - Smart contract bugs
  - Network issues
  - Incorrect configurations
  - Unauthorized access to your wallet
- **NO LIABILITY**: The developers are not responsible for any loss of funds, data, or other damages.

### **🔐 SECURITY REQUIREMENTS:**

#### **1. Private Key Protection**
```
❌ NEVER share your private keys
❌ NEVER commit .env files to Git repositories
❌ NEVER store private keys in plain text
❌ NEVER share wallet backups publicly
```

#### **2. Wallet Authorization**
```
✅ ONLY authorize the agent wallet on official dashboards
✅ Verify contract addresses before authorizing
✅ Use read-only permissions when possible
✅ Regularly review and revoke authorizations
```

#### **3. Environment Security**
```bash
# Create .env file (NEVER commit to git)
AGENT_PRIVATE_KEY=your_private_key_here
OWNER_ADDRESS=your_wallet_address

# Add .env to .gitignore
echo ".env" >> .gitignore
```

#### **4. Network Safety**
```
✅ Only use on test networks (Base Sepolia) for testing
✅ Verify all contract addresses before use
✅ Test with small amounts first
✅ Monitor transactions on blockchain explorers
```

#### **5. Operational Safety**
```
✅ Backup your wallet before use
✅ Test all operations on testnet first
✅ Start with small transactions
✅ Monitor wallet balance regularly
✅ Use hardware wallets when possible
```

### **🛡️ RECOMMENDED SAFETY MEASURES:**

1. **Use Test Networks First**: Always test on Base Sepolia before mainnet
2. **Small Amounts**: Start with minimal ETH amounts for testing
3. **Monitor Transactions**: Check all transactions on blockchain explorers
4. **Regular Backups**: Backup your wallet regularly
5. **Secure Environment**: Run on dedicated, secure machines
6. **Limited Permissions**: Only grant necessary permissions

### **📞 SUPPORT & RESPONSIBILITY:**

- **Self-Support**: This is open-source software. Use at your own risk.
- **Community**: Check GitHub issues for known problems
- **No Official Support**: No official support or warranty provided
- **Your Responsibility**: You are solely responsible for:
  - Securing your private keys
  - Verifying transaction safety
  - Understanding blockchain risks
  - Backing up your data

---

## **🎯 FINAL REMINDER:**

**Blockchain transactions are irreversible. Lost funds cannot be recovered.**

**If you are not comfortable with these risks, do not use this software.**

---

## 🎯 **Ready to Launch!**

Your standalone AI agent is configured for:

1. ✅ **Intelligent NFT analysis** using real blockchain data
2. ✅ **Natural language conversations** with context awareness
3. ✅ **Automated maintenance operations** with cost transparency
4. ✅ **Clean, professional user experience** with no debug noise
5. ✅ **Complete local operation** - no external dependencies

**Launch your AI rug maintenance assistant:**
```bash
npm run chat
```

*Completely standalone - runs entirely on your local machine!* 🚀🤖
