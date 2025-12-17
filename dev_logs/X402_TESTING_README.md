# 🧪 x402 AI Maintenance - Testing Guide

## 🚀 Quick Test (No Setup Required)

### 1. Start Your Dev Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 2. Test APIs Instantly
```bash
# Test status endpoint
node test-x402-flow.js status

# Test quote endpoint
node test-x402-flow.js quote clean

# Test all maintenance actions
node test-x402-flow.js actions

# Test complete flow
node test-x402-flow.js flow
```

## 🎯 Testing Scenarios

### ✅ API Testing (No Wallet)
- [x] Status endpoint returns rug condition
- [x] Quote endpoint returns x402 payment requirements
- [x] All maintenance actions supported
- [x] Error handling for invalid requests

### ✅ Contract Testing (With Wallet)
- [ ] Agent authorization works
- [ ] Service fees are configured correctly
- [ ] Maintenance functions execute properly
- [ ] Fee splitting works (service fee to recipient, maintenance to contract)

### ✅ Full AI Agent Testing
- [ ] Complete maintenance cycle
- [ ] Revenue collection
- [ ] Multi-rug batch processing

---

## 🛠️ Test Commands

### API Tests (No Setup)
```bash
# Basic functionality
node test-x402-flow.js

# Specific endpoints
curl "http://localhost:3000/api/maintenance/status/1"
curl "http://localhost:3000/api/maintenance/quote/1/clean"
```

### Contract Tests (Need Wallet)
```bash
# Check agent authorization
cast call $CONTRACT_ADDR "getAgentServiceFees()(uint256,uint256,uint256,address)" --rpc-url https://sepolia.base.org

# Authorize agent (requires owner private key)
cast send $CONTRACT_ADDR "authorizeMaintenanceAgent(address)" $AGENT_ADDR --private-key $OWNER_KEY --rpc-url https://sepolia.base.org

# Execute maintenance (requires agent private key)
cast send $CONTRACT_ADDR "cleanRugAgent(uint256)" 1 --value 11000000000000000 --private-key $AGENT_KEY --rpc-url https://sepolia.base.org
```

---

## 📊 Test Results

### Expected API Responses

**Status Response:**
```json
{
  "chainId": 84532,
  "network": "base-sepolia",
  "tokenId": "1",
  "maintenance": {
    "canClean": true,
    "canRestore": false,
    "needsMaster": false,
    "cleaningCostWei": "10000000000000",
    "restorationCostWei": "10000000000000",
    "masterCostWei": "10000000000000"
  }
}
```

**Quote Response (402):**
```json
{
  "error": "Payment Required",
  "x402": {
    "x402Version": 1,
    "accepts": [{
      "scheme": "exact",
      "network": "base-sepolia",
      "asset": "0x0000000000000000000000000000000000000000",
      "payTo": "0xa43532205Fc90b286Da98389a9883347Cc4064a8",
      "maxAmountRequired": "11000000000000000",
      "resource": "/api/maintenance/quote/1/clean",
      "description": "Rug cleaning service",
      "mimeType": "application/json",
      "maxTimeoutSeconds": 900,
      "extra": {
        "function": "cleanRugAgent",
        "maintenanceWei": "10000000000000",
        "serviceFeeWei": "1000000000000000",
        "totalWei": "11000000000000000"
      }
    }]
  }
}
```

---

## 🔧 Setup for Full Testing

### 1. Environment Setup
```bash
# Copy and configure environment
cp .env.example .env.agent
# Edit .env.agent with your test keys
```

### 2. Wallet Setup
```bash
# Generate agent wallet
cast wallet new

# Fund with testnet ETH:
# Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
# Shape Sepolia: https://faucet.shape.network
```

### 3. Run Full AI Agent
```bash
# Load environment and run
source .env.agent && node advanced-ai-agent.js
```

---

## 🎯 Success Criteria

### ✅ APIs Working
- [x] Status endpoint returns valid JSON
- [x] Quote endpoint returns 402 with x402 format
- [x] All maintenance actions supported

### ✅ Contracts Deployed
- [x] Base Sepolia: `0xa43532205Fc90b286Da98389a9883347Cc4064a8`
- [x] Shape Sepolia: `0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325`
- [x] Agent functions available
- [x] Service fees configured

### ✅ Documentation Complete
- [x] `AI_AGENT_MAINTENANCE.md` - Agent integration guide
- [x] `AI_AGENT_SETUP_GUIDE.md` - Complete setup instructions
- [x] `X402_AI_MAINTENANCE_DEPLOYMENT_SUMMARY.md` - Deployment details

### 🔄 Next Steps
- [ ] Set up test wallets
- [ ] Test agent authorization
- [ ] Execute maintenance transactions
- [ ] Verify fee collection
- [ ] Test multi-rug scenarios

---

## 🚨 Troubleshooting

### API Tests Failing
```bash
# Check if dev server is running
curl http://localhost:3000
# Should return HTML

# Check API specifically
curl "http://localhost:3000/api/maintenance/status/1"
# Should return JSON, not 404
```

### Contract Tests Failing
```bash
# Check contract is deployed
cast code $CONTRACT_ADDR --rpc-url https://sepolia.base.org
# Should return bytecode, not 0x

# Check function exists
cast call $CONTRACT_ADDR "getAgentServiceFees()(uint256,uint256,uint256,address)" --rpc-url https://sepolia.base.org
# Should return fee values
```

### Agent Authorization Failing
```bash
# Check owner has the token
cast call $CONTRACT_ADDR "ownerOf(uint256)" 1 --rpc-url https://sepolia.base.org
# Should return owner address

# Check agent is authorized
cast call $CONTRACT_ADDR "isOwnerAgentAllowed(address,address)" $OWNER_ADDR $AGENT_ADDR --rpc-url https://sepolia.base.org
# Should return true after authorization
```

---

## 📞 Support

If tests are failing:

1. **Check the deployment summary**: `X402_AI_MAINTENANCE_DEPLOYMENT_SUMMARY.md`
2. **Verify contract addresses**: Make sure you're using the right network
3. **Check API logs**: Look at your dev server console for errors
4. **Verify wallet funding**: Make sure test wallets have ETH

**The x402 AI maintenance system is ready for testing!** 🎉
