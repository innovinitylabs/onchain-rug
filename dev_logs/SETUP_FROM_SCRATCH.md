# 🚀 Complete Setup Guide: Ollama GUI + Blockchain AI Agent

## 📋 Prerequisites Checklist

### ✅ Required Software:
- [ ] Node.js 18+ (with npm)
- [ ] Ollama (GUI app)
- [ ] Git
- [ ] A code editor (VS Code, etc.)

### ✅ Required Accounts:
- [ ] MetaMask or similar wallet
- [ ] Shape Sepolia testnet ETH (faucet)

---

## 🎯 Step-by-Step Setup Guide

### Step 1: Install Dependencies

#### 1.1 Install Node.js
```bash
# Download from: https://nodejs.org/
# Or use nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Verify:
node --version  # Should show v20+
npm --version   # Should show 10+
```

#### 1.2 Install Ollama
```bash
# Download from: https://ollama.ai/download
# Install the GUI app (Ollama.app on Mac)

# Verify installation:
ollama --version
```

### Step 2: Clone and Setup Project

#### 2.1 Clone Repository
```bash
git clone https://github.com/innovinitylabs/onchain-rug.git
cd onchain-rug
```

#### 2.2 Install Dependencies
```bash
cd standalone-ai-agent
npm install
```

#### 2.3 Setup Environment
```bash
# Copy configuration template
cp config.example.env .env

# Edit .env file (see next section)
code .env  # or use your preferred editor
```

### Step 3: Configure Environment

#### 3.1 Edit .env File
```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=rugbot-updated:latest

# Blockchain Configuration (Shape Sepolia)
RPC_URL=https://sepolia.shape.network
CHAIN_ID=11011
CONTRACT_ADDRESS=0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325

# Agent Wallet Configuration (REQUIRED for transactions)
AGENT_PRIVATE_KEY=your_private_key_here
AGENT_ADDRESS=your_wallet_address_here

# Owner Wallet Configuration (for authorization)
OWNER_PRIVATE_KEY=your_owner_private_key_here
OWNER_ADDRESS=your_owner_address_here

# Test Configuration
TEST_TOKEN_ID=1
AUTO_MAINTAIN=false
MAINTENANCE_CHECK_INTERVAL=300000

# Agent Personality
AGENT_NAME=RugBot
AGENT_STYLE=helpful,professional,enthusiastic

# API Server
API_PORT=3001
```

#### 3.2 Get Wallet Private Key
```bash
# In MetaMask:
# 1. Click account icon → Account Details
# 2. Export Private Key
# 3. Paste in .env as AGENT_PRIVATE_KEY

# ⚠️  NEVER share your private key!
# ⚠️  NEVER commit .env to git!
```

#### 3.3 Get Shape Sepolia ETH
```bash
# Visit: https://faucet.shape.network
# Connect wallet and claim testnet ETH
# Need ~0.01 ETH for testing
```

### Step 4: Setup Ollama Models

#### 4.1 Download Base Model
```bash
ollama pull deepseek-r1:8b
```

#### 4.2 Create RugBot Model
```bash
# The rugbot-updated model should already be created
# If not, it will be created automatically when you run the API server

ollama list  # Should show: rugbot-updated:latest
```

### Step 5: Test Everything

#### 5.1 Test Complete System
```bash
npm test
```

**Expected Output:**
```
🧪 Standalone x402 Rug Maintenance Agent - Test Suite

🧠 Testing Ollama Connection... ✅
⛓️  Testing Blockchain Connection... ✅  
📋 Testing Contract Read Operations... ✅
🧠 Testing AI Reasoning... ✅
👛 Testing Wallet Configuration... ✅

📊 Test Results Summary
════════════════════════════════════════
Total Tests: 9
Passed: 9
Failed: 0

Success Rate: 100%

🎉 All tests passed! Agent is ready to run.
```

#### 5.2 Test Individual Components

**Test API Server:**
```bash
npm run api-server
# Should show: 🎉 RugBot API Server running! 📡 Server: http://localhost:3001
# Press Ctrl+C to stop
```

**Test Rug Status (in another terminal):**
```bash
curl http://localhost:3001/rug/1/status
# Should return JSON with rug status
```

### Step 6: Use the System

#### 6.1 Start API Server (Terminal 1)
```bash
npm run api-server
```

#### 6.2 Open Ollama GUI (Terminal 2)
```bash
# Open Ollama.app
# Select model: rugbot-updated:latest
# Chat with RugBot!
```

#### 6.3 Example GUI Chat
```
You: Hi RugBot! Check rug 1

RugBot: [ACTION:check_rug,tokenId:1] I'll check that rug for you!

You: [Copy this entire response]
```

#### 6.4 Execute the Action (Terminal 3)
```bash
npm run execute "[ACTION:check_rug,tokenId:1] I'll check that rug for you!"
```

**Expected Output:**
```
🔧 Executing check_rug...
✅ check_rug completed successfully!
🏠 Rug #1:
   Can Clean: true (0.00001 ETH)
   Can Restore: true (0.00001 ETH)
   Needs Master: true (0.00001 ETH)
```

#### 6.5 Try a Real Transaction
```
# In Ollama GUI:
You: clean rug 1

RugBot: [ACTION:clean_rug,tokenId:1] I'll clean that rug right up!

# Execute:
npm run execute "[ACTION:clean_rug,tokenId:1] I'll clean that rug right up!"

# Result: Real blockchain transaction! Earn 0.001 ETH!
```

### Step 7: Monitor Earnings

#### 7.1 Check Your Stats
```bash
npm run execute "[ACTION:get_earnings] Show me my earnings"
```

#### 7.2 View Transaction History
```bash
# Check your wallet on Shape Sepolia explorer:
# https://sepolia.shapescan.xyz/address/YOUR_ADDRESS
```

---

## 🛠️ Troubleshooting

### Issue: npm test fails
```bash
# Check Node.js version
node --version  # Should be 18+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check .env file exists
ls -la .env
```

### Issue: Ollama connection fails
```bash
# Restart Ollama
ollama serve

# Check models
ollama list

# Pull model if missing
ollama pull deepseek-r1:8b
```

### Issue: Blockchain connection fails
```bash
# Check RPC URL
curl https://sepolia.shape.network

# Check wallet configuration
# Make sure AGENT_PRIVATE_KEY is correct
```

### Issue: API server won't start
```bash
# Check port 3001 is free
lsof -i :3001

# Kill any conflicting process
kill -9 <PID>

# Try different port in .env
API_PORT=3002
```

### Issue: Transactions fail
```bash
# Check wallet balance
# Visit: https://faucet.shape.network

# Verify private key format
# Should start with '0x' and be 66 characters
```

### Issue: RugBot model not available
```bash
# API server will create it automatically
npm run api-server

# Or create manually:
ollama create rugbot-updated -f <modelfile>
```

---

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Ollama GUI     │    │   API Server     │    │  Blockchain      │
│  (User Chat)    │◄──►│  (Action Parser) │◄──►│  (Real Tx)       │
│                 │    │                  │    │                  │
│ • Natural chat  │    │ • Parse [ACTION] │    │ • Contract calls │
│ • Action tags   │    │ • Execute API    │    │ • ETH transfers  │
│ • GUI only      │    │ • Return results │    │ • Fee earnings   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🎯 Quick Reference

### Essential Commands:
```bash
# Setup
npm install
cp config.example.env .env
# Edit .env with your wallet keys

# Testing
npm test                    # Full system test
npm run api-server         # Start API (keep running)

# Usage
npm run execute "response" # Execute GUI responses

# Monitoring
npm start stats            # Show agent stats
npm start check 1          # Check rug status
```

### Key Files:
- `.env` - Your configuration (private keys!)
- `config.example.env` - Configuration template
- `package.json` - Dependencies and scripts
- `README.md` - Detailed documentation

### Important URLs:
- **Shape Sepolia Explorer**: https://sepolia.shapescan.xyz
- **Shape Faucet**: https://faucet.shape.network
- **Ollama Models**: https://ollama.ai/library

---

## 🚀 You're All Set!

Follow this guide and you'll have a fully functional AI agent that can perform real blockchain transactions through your Ollama GUI!

**Questions?** Check the troubleshooting section or ask for help!

🎉 **Happy rug maintaining!** 🤖💰
