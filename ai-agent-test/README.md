# 🧠 Ollama x402 Rug Maintenance Agent

A standalone AI agent that uses Ollama to autonomously maintain rugs via the x402 protocol. This agent can analyze rug conditions, make intelligent maintenance decisions, and execute transactions to earn service fees.

## ✨ Features

- 🤖 **AI-Powered Decisions**: Uses Ollama models to analyze rug conditions and recommend maintenance
- 💰 **Revenue Generation**: Earns service fees (0.001-0.005 ETH) per maintenance action
- 🔄 **Autonomous Operation**: Can run continuously, checking and maintaining rugs
- 🛡️ **Scoped Permissions**: Only performs maintenance, no admin or transfer operations
- 📊 **Real-time Monitoring**: Tracks earnings and maintenance statistics
- 🧪 **Simulation Mode**: Test without real transactions

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd ai-agent-test
npm install
```

### 2. Set Up Ollama
```bash
# Install Ollama (if not already installed)
# Visit: https://ollama.ai/download

# Pull a model (recommended: llama3.2:3b)
ollama pull llama3.2:3b

# Start Ollama server
ollama serve
```

### 3. Configure Agent
```bash
# Interactive setup
npm run setup

# Or manually copy and edit config
cp config.example.env .env
# Edit .env with your settings
```

### 4. Test Setup
```bash
# Run all tests
npm test

# Should show all ✅ if configured correctly
```

### 5. Choose Your Interface

#### **Option A: Chat Interface (Talk to your AI agent)**
```bash
# Interactive chat with natural language
npm run chat

# Then talk to your agent:
# "check rug 1"
# "clean rug 1"
# "how is my rug doing?"
# "show me earnings"
```

#### **Option B: Command Line Scripts**
```bash
# Test single maintenance cycle
npm start once

# Start autonomous mode
npm start auto

# Check agent statistics
npm start stats
```

## 📋 Configuration

Copy `config.example.env` to `.env` and configure:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Rug Maintenance API
RUG_API_BASE=http://localhost:3000
CONTRACT_ADDRESS=0xa43532205Fc90b286Da98389a9883347Cc4064a8

# Agent Wallet (for real transactions)
AGENT_PRIVATE_KEY=0x...
AGENT_ADDRESS=0x...

# Owner Wallet (for authorization)
OWNER_PRIVATE_KEY=0x...
OWNER_ADDRESS=0x...

# Test Settings
TEST_TOKEN_ID=1
AUTO_MAINTAIN=false
MAINTENANCE_CHECK_INTERVAL=300000
```

## 💬 Chat Interface

**Talk to your AI agent conversationally!**

```bash
npm run chat
```

### **Natural Language Commands:**
- `"check rug 1"` - Check rug status
- `"clean rug 1"` - Clean a rug
- `"how is my rug doing?"` - AI-powered status check
- `"show me earnings"` - Display revenue stats
- `"what can you do?"` - AI help and capabilities
- `"maintain rug 1"` - Auto-maintain with AI decisions

### **Chat Features:**
- 🤖 **AI-Powered Responses** - Natural conversation
- 🎯 **Smart Command Recognition** - Understands intent
- ⚠️ **Safety Confirmations** - Confirms expensive actions
- 📊 **Real-time Stats** - Earnings and performance
- 🔄 **Autonomous Control** - Start/stop auto mode

## 🛠️ Command Line Scripts

| Command | Description |
|---------|-------------|
| `npm run chat` | **NEW:** Interactive chat with AI agent |
| `npm run setup` | Interactive configuration wizard |
| `npm test` | Run test suite |
| `npm start once` | Run one maintenance cycle |
| `npm start auto` | Start autonomous mode |
| `npm start stats` | Show agent statistics |
| `npm start authorize` | Authorize agent (requires owner wallet) |
| `npm start check [id]` | Check specific rug status |
| `npm start quote [action]` | Get maintenance quote |
| `npm start analyze` | AI analysis of rug condition |

## 🧠 How It Works

### AI Decision Making
The agent uses Ollama to analyze rug conditions and make intelligent decisions:

1. **Data Collection**: Fetches rug status via x402 API
2. **AI Analysis**: Ollama analyzes condition, urgency, and cost-effectiveness
3. **Decision Making**: Recommends clean/restore/master/none
4. **Quote Retrieval**: Gets payment requirements from x402 API
5. **Transaction Execution**: Performs maintenance in single transaction

### Revenue Model
```
User pays: 0.00101 ETH total
├── Service fee: 0.001 ETH (agent earns)
└── Maintenance: 0.00001 ETH (contract treasury)
```

### Example AI Analysis
```
Rug Condition: Needs cleaning
AI Decision: clean (low urgency, good ROI)
Expected Earnings: 0.001 ETH
Confidence: 95%
Reasoning: Rug has dirt but is otherwise healthy
```

## 🧪 Testing

### Prerequisites
- ✅ Main app running (`npm run dev`)
- ✅ Ollama server running (`ollama serve`)
- ✅ Model downloaded (`ollama pull llama3.2:3b`)
- ✅ Agent configured (`.env` file)

### Test Commands
```bash
# Test all components
npm test

# Manual testing
npm start check 1        # Check rug #1
npm start quote clean    # Get cleaning quote
npm start analyze        # AI analysis
npm start once          # Full maintenance cycle
```

### Expected Results
```
🧪 Ollama x402 Rug Maintenance Agent - Test Suite

🧠 Testing Ollama Connection...
✅ Ollama server connection
✅ Model llama3.2:3b availability
✅ AI response generation

🔗 Testing API Endpoints...
✅ Status endpoint
✅ clean quote endpoint
✅ restore quote endpoint
✅ master quote endpoint

⛓️ Testing Blockchain Connection...
✅ Blockchain connection
✅ Contract connection

🧠 Testing AI Reasoning...
✅ AI reasoning

👛 Testing Wallet Configuration...
✅ Agent private key
✅ Owner private key
✅ Agent address

📊 Test Results Summary
════════════════════════════════════════
Total Tests: 11
Passed: 11
Failed: 0

Success Rate: 100%

🎉 All tests passed! Agent is ready to run.
```

## 🔧 Advanced Configuration

### Custom Ollama Models
```bash
# Use different models
OLLAMA_MODEL=mistral:7b
OLLAMA_MODEL=codellama:13b
OLLAMA_MODEL=llama3.1:8b
```

### Autonomous Mode Settings
```bash
# Check every 5 minutes
MAINTENANCE_CHECK_INTERVAL=300000

# Enable automatic maintenance (no confirmations)
AUTO_MAINTAIN=true
```

### Multi-Rug Management
```bash
# Agent can be extended to monitor multiple rugs
# Add array of token IDs to monitor
MONITOR_RUGS=1,2,3,5,8,13
```

## 🛡️ Security Considerations

- **Private Keys**: Never commit `.env` to git
- **Authorization**: Agent only performs maintenance operations
- **Simulation Mode**: Test without real transactions first
- **Funding**: Ensure agent wallet has sufficient ETH for gas

## 📊 Monitoring

The agent provides real-time statistics:
```
📊 Agent Statistics:
   Maintenances Performed: 5
   Total Earnings: 0.005 ETH
   Agent Address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
   Ollama Model: llama3.2:3b
   API Endpoint: http://localhost:3000
```

## 🚨 Troubleshooting

### Common Issues

**"Ollama server not running"**
```bash
ollama serve
```

**"Model not found"**
```bash
ollama pull llama3.2:3b
```

**"API connection failed"**
```bash
# Make sure main app is running
npm run dev
```

**"Contract connection failed"**
```bash
# Check if using correct network
# Base Sepolia testnet required
```

**"Authorization failed"**
```bash
# Need owner private key in .env
# Or authorize manually via contract
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=true npm start once
```

## 🤝 Integration

This agent can be integrated with:
- **Discord bots** for user notifications
- **Web dashboards** for monitoring
- **Database systems** for earnings tracking
- **Multiple blockchains** (extend base classes)
- **Different AI models** (swap Ollama for other providers)

## 📝 API Reference

### Agent Methods
- `checkRugStatus(tokenId)` - Get rug condition
- `getMaintenanceQuote(tokenId, action)` - Get x402 quote
- `executeMaintenance(tokenId, quote)` - Perform maintenance
- `analyzeRugWithAI(rugData)` - AI decision making
- `authorizeAsAgent()` - Get maintenance permissions

### x402 Protocol
- **Status**: `GET /api/maintenance/status/:tokenId`
- **Quote**: `GET /api/maintenance/quote/:tokenId/:action`
- **Payment Required**: HTTP 402 with x402 format

---

## 🎯 Ready to Earn!

Your AI agent is now configured to:

1. **Analyze** rug conditions with AI
2. **Decide** optimal maintenance actions
3. **Execute** single-transaction maintenance
4. **Earn** service fees automatically
5. **Monitor** performance and earnings

**Start earning by running: `npm start auto`** 🚀

---

*Built for the x402 Rug Maintenance ecosystem. Compatible with Ollama and other AI providers.*
