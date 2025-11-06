# 🚀 Ollama GUI + Real Blockchain Actions Setup

This guide shows you how to use Ollama GUI to perform **real blockchain transactions** for rug maintenance!

## 🎯 What This Enables

- ✅ **Chat in Ollama GUI** with RugBot
- ✅ **Real blockchain transactions** (not just talk)
- ✅ **Earn actual ETH fees** from maintenance
- ✅ **No command line required** - pure GUI experience

## 🛠️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Ollama GUI     │    │   API Server     │    │  Blockchain      │
│  (User Chat)    │◄──►│  (REST API)      │◄──►│  (Transactions)  │
│                 │    │                  │    │                  │
│ • Natural chat  │    │ • Rug status     │    │ • Contract calls │
│ • Commands      │    │ • Maintenance    │    │ • ETH transfers  │
│ • Responses     │    │ • Agent auth     │    │ • Fee earnings   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies
```bash
cd standalone-ai-agent
npm install
```

### Step 2: Configure Environment
```bash
cp config.example.env .env
# Edit .env with your wallet private key
```

### Step 3: Start Services
```bash
# Terminal 1: Start API server
npm run api-server

# Terminal 2: Start GUI bridge (optional monitoring)
npm run gui-bridge
```

## 💬 How to Use

### 1. Open Ollama GUI
- Open your Ollama.app
- Select `rugbot:latest` model

### 2. Chat Naturally!
```
You: Hi RugBot! Check rug 1 for me

RugBot: I'll check that rug right away! [API call happens automatically]
       Rug #1 status: Can Clean: true, Can Restore: true, Needs Master: true

You: Clean that rug please

RugBot: Absolutely! I'll get that rug sparkling clean! [Transaction executes]
       ✅ Maintenance completed! Earned 0.001 ETH service fee!

You: How much have I earned?

RugBot: Let me check your stats! [API call happens]
       You've earned 0.001 ETH from 1 maintenance!
```

### 3. Real Actions Happen Automatically!

When you type commands in Ollama GUI, the system automatically:

1. **Detects your intent** from natural language
2. **Calls the API server** in the background
3. **Executes blockchain transactions** with real ETH
4. **Returns results** as if RugBot did it directly

## 🎮 Supported Commands

### Rug Status
```
"check rug 1"
"how is rug 5 doing?"
"rug status for number 3"
```
→ Gets real-time blockchain status

### Maintenance Actions
```
"clean rug 1"
"restore rug 2"
"master restore rug 1"
"fix rug 3"
```
→ Executes real transactions, earns fees

### Agent Management
```
"authorize me"
"show my earnings"
"what's my balance?"
"how many rugs have I maintained?"
```
→ Real authorization and statistics

## 💰 Earning Real Money

Every maintenance action earns you ETH:

| Action | Service Fee | Your Earnings |
|--------|-------------|---------------|
| Clean | 0.001 ETH | 💰 0.001 ETH |
| Restore | 0.002 ETH | 💰 0.002 ETH |
| Master | 0.005 ETH | 💰 0.005 ETH |

**You earn these fees for performing the maintenance!**

## ⚙️ Advanced Setup

### Wallet Configuration
```bash
# In your .env file
AGENT_PRIVATE_KEY=0x_your_private_key_here
AGENT_ADDRESS=0x_your_address_here
OWNER_PRIVATE_KEY=0x_owner_private_key_for_authorization
```

### API Server Configuration
```bash
# Default port 3001
API_PORT=3001

# API endpoints
GET  /health                    # Server health
GET  /rug/:id/status           # Rug status
POST /rug/:id/maintain         # Perform maintenance
POST /agent/authorize          # Authorize agent
GET  /agent/stats              # Get earnings
```

### GUI Bridge (Optional)
The GUI bridge monitors conversations and can automatically execute actions:

```bash
npm run gui-bridge  # Monitors for commands and executes them
```

## 🧪 Testing Setup

### 1. Test API Server
```bash
# Start API server
npm run api-server

# Test in another terminal
curl http://localhost:3001/health
curl http://localhost:3001/rug/1/status
```

### 2. Test Transactions (Simulation Mode)
If no wallet is configured, actions work in simulation mode:
```
✅ SIMULATION: Would clean rug #1
💰 Would earn 0.001 ETH service fee
```

### 3. Test Real Transactions
With wallet configured:
```bash
# This will actually spend ETH and earn fees
npm run api-server  # Then use GUI commands
```

## 🔒 Security Notes

- ✅ **Private keys** stay in your `.env` file
- ✅ **API server** runs locally (localhost only)
- ✅ **Transactions** require explicit confirmation
- ✅ **No external access** to your wallet

## 🚨 Troubleshooting

### API Server Won't Start
```
❌ Blockchain connection failed
```
**Fix:** Check `RPC_URL` in `.env`

```
❌ Contract connection failed
```
**Fix:** Check `CONTRACT_ADDRESS` in `.env`

### GUI Commands Not Working
```
RugBot: I don't understand that command
```
**Fix:** Make sure API server is running on port 3001

### No Wallet Configured
```
⚠️ No agent wallet - simulation mode
```
**Fix:** Add `AGENT_PRIVATE_KEY` to `.env`

## 🎉 Success!

You're now set up to:

1. ✅ **Chat naturally** with RugBot in Ollama GUI
2. ✅ **Execute real transactions** with simple commands
3. ✅ **Earn ETH fees** for maintenance work
4. ✅ **Track earnings** and performance
5. ✅ **Maintain rugs** hands-free

**Example session:**
```
You: "Hey RugBot, clean rug 1 for me"
RugBot: "You got it! Cleaning rug #1 now..."
         [Real transaction happens]
         "✅ Done! Earned 0.001 ETH!"

You: "What's my total earnings?"
RugBot: "Checking your stats..."
         "You've earned 0.001 ETH from 1 maintenance!"
```

**Your AI agent is now fully functional through Ollama GUI! 🎊**
