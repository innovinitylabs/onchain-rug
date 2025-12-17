# 🚀 x402 Rug Maintenance API Guide

This guide explains how to integrate with the Onchain Rugs x402 payment system for AI-powered NFT maintenance operations.

## 📋 Overview

The x402 v2 integration enables seamless payment for blockchain-based rug maintenance services. The system supports:

- **Direct smart contract payments** (no external facilitators)
- **AI-powered maintenance analysis** and execution
- **Multi-network support** (Shape L2, Base Sepolia)
- **Transparent pricing** with service fees and maintenance costs

## 🏗️ Architecture

```
User Request → AI Agent → x402 Payment → Smart Contract → Maintenance
     ↓             ↓             ↓             ↓             ↓
  Natural     Condition     Exact Payment   On-chain       Execute
 Language    Assessment     Verification    Settlement    Operation
```

## 🎯 API Endpoints

### Free Operations (No Payment Required)

#### 1. Check Rug Status
```bash
GET /api/maintenance/status/{tokenId}
```

**Response:**
```json
{
  "chainId": 84532,
  "network": "base-sepolia",
  "tokenId": "1",
  "maintenance": {
    "canClean": true,
    "canRestore": true,
    "needsMaster": true,
    "cleaningCostWei": "10000000000000",
    "restorationCostWei": "10000000000000",
    "masterCostWei": "10000000000000"
  }
}
```

#### 2. Get Maintenance Quote
```bash
GET /api/maintenance/quote/{tokenId}/{action}?agent={agentAddress}
```

**Parameters:**
- `tokenId`: Rug token ID (e.g., "1")
- `action`: "clean", "restore", or "master"
- `agent`: Agent wallet address (query parameter)

**Response:**
```json
{
  "x402Version": 2,
  "accepts": [
    {
      "scheme": "exact",
      "network": "shape-sepolia",
      "asset": "0x0000000000000000000000000000000000000000",
      "payTo": "0x8B46f9A4a29967644C3B6A628C058541492acD57",
      "maxAmountRequired": "42000000000000",
      "resource": "/api/maintenance/action",
      "description": "Clean rug #1",
      "mimeType": "application/json",
      "maxTimeoutSeconds": 900,
      "extra": {
        "facilitatorUrl": "http://localhost:3000/api/x402/facilitator",
        "created": 1765961110422,
        "expires": 1765962010422,
        "maintenanceCost": "10000000000000",
        "serviceFee": "32000000000000"
      }
    }
  ]
}
```

### Paid Operations (Require x402 Payment)

#### 3. Execute Maintenance Action
```bash
POST /api/maintenance/action/{tokenId}/{action}
```

**Headers:**
```
Content-Type: application/json
x-agent-address: 0x_your_agent_wallet_address
x402-payment-tx: 0x_transaction_hash (optional, for settlement)
```

**Body:**
```json
{
  "paymentAmount": "42000000000000"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "gasUsed": "21000",
  "message": "Rug cleaning completed successfully",
  "newCondition": "clean"
}
```

### Advanced x402 Facilitator API

#### 4. Create Payment Requirement
```bash
POST /api/x402/facilitator
```

**Body:**
```json
{
  "action": "create_payment_requirement",
  "price": "0.000042",
  "description": "Clean rug #1",
  "resource": "/api/maintenance/action/1/clean",
  "payTo": "0x8B46f9A4a29967644C3B6A628C058541492acD57",
  "scheme": "exact",
  "network": "shape-sepolia"
}
```

#### 5. Verify Payment Payload
```bash
POST /api/x402/facilitator
```

**Body:**
```json
{
  "action": "verify_payment",
  "paymentPayload": "{\"x402Version\":2,\"payment\":{...},\"signature\":\"0x...\"}"
}
```

**Response:**
```json
{
  "isValid": true,
  "paymentDetails": {
    "amount": "42000000000000",
    "from": "0x_user_wallet",
    "to": "0x_merchant_wallet",
    "scheme": "exact",
    "network": "shape-sepolia",
    "asset": "0x0000000000000000000000000000000000000000"
  }
}
```

#### 6. Settle Payment
```bash
POST /api/x402/facilitator
```

**Headers:**
```
x402-payment-tx: 0x_transaction_hash
```

**Body:**
```json
{
  "action": "settle_payment",
  "paymentPayload": "{\"x402Version\":2,\"payment\":{...},\"signature\":\"0x...\"}"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "settledAmount": "42000000000000",
  "network": "shape-sepolia",
  "note": "Testnet settlement - transaction verified on blockchain"
}
```

#### 7. Get Supported Schemes
```bash
POST /api/x402/facilitator
```

**Body:**
```json
{
  "action": "get_supported"
}
```

**Response:**
```json
{
  "x402Version": 2,
  "kind": [
    {
      "scheme": ["exact"],
      "networkId": ["shape-sepolia", "base-sepolia"],
      "extra": {
        "assets": ["0x0000000000000000000000000000000000000000"],
        "facilitator": "http://localhost:3000/api/x402/facilitator"
      }
    }
  ]
}
```

## 💰 Payment Structure

### Service Fees
- **All maintenance operations**: 0.000042 ETH flat service fee
- **Plus actual maintenance cost**: Variable based on operation and rug condition

### Example Costs
```json
{
  "clean": {
    "serviceFee": "0.000042 ETH",
    "maintenanceCost": "0.000010 ETH",
    "total": "0.000052 ETH"
  },
  "restore": {
    "serviceFee": "0.000042 ETH",
    "maintenanceCost": "0.000020 ETH",
    "total": "0.000062 ETH"
  },
  "master": {
    "serviceFee": "0.000042 ETH",
    "maintenanceCost": "0.000050 ETH",
    "total": "0.000092 ETH"
  }
}
```

## 🔄 Complete x402 Payment Flow

### For Applications Integrating x402:

1. **Request Quote** (Free)
   ```bash
   curl -X GET "http://localhost:3000/api/maintenance/quote/1/clean?agent=0x_agent_address"
   ```

2. **Present Payment Requirement** to User
   - Show total cost breakdown
   - Explain what the payment covers
   - Get user authorization

3. **Create x402 Payment Payload** (Off-chain)
   ```javascript
   const paymentPayload = {
     x402Version: 2,
     payment: {
       scheme: "exact",
       network: "shape-sepolia",
       asset: "0x0000000000000000000000000000000000000000",
       amount: "42000000000000",
       from: userWalletAddress,
       to: merchantWalletAddress,
       nonce: Date.now().toString(),
       deadline: Math.floor(Date.now() / 1000) + 900
     }
   };
   ```

4. **Sign Payment Payload**
   ```javascript
   const signature = await wallet.signMessage(JSON.stringify(paymentPayload.payment));
   paymentPayload.signature = signature;
   ```

5. **Submit Payment Transaction**
   ```javascript
   const tx = await wallet.sendTransaction({
     to: paymentPayload.payment.to,
     value: paymentPayload.payment.amount,
     // Include x402 metadata if supported by wallet
   });
   ```

6. **Execute Maintenance Action**
   ```bash
   curl -X POST "http://localhost:3000/api/maintenance/action/1/clean" \
     -H "Content-Type: application/json" \
     -H "x-agent-address: 0x_agent_address" \
     -H "x402-payment-tx: 0x_tx_hash" \
     -d '{"paymentAmount": "42000000000000"}'
   ```

## 🤖 Standalone AI Agent Integration

The standalone AI agent handles the complete x402 flow automatically:

### Launch the Agent
```bash
cd standalone-ai-agent
npm run chat
```

### Example Conversation
```
You: How is my rug 1 doing?

Agent: Analyzing rug #1...
• Rug #1: dirty - needs cleaning (maintenance score: 52)
🧹 Maintenance: Dirt 2, Aging 1, Score 64, Cleanings 8, Restorations 0, Masters 4
📅 History: Minted 11/11/2025, Last Cleaned 11/17/2025
💡 Recommendations: Schedule cleaning - moderate dirt buildup

You: Clean rug 1

Agent: I'll clean rug #1 for you. This will cost 0.000052 ETH (0.000042 service + 0.000010 maintenance).
Do you want me to proceed? (yes/no)

You: yes

Agent: Executing cleaning operation...
✅ Payment verified on blockchain
✅ Rug #1 cleaned successfully
💰 Transaction: 0x1234...abcd
⛽ Gas used: 45,231
```

### Test the Integration
```bash
# Test direct payment system
npm run test:direct-payment

# Run full test suite
npm test

# Test specific components
npm run test:rate-limit
```

## 🌐 Supported Networks

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| Shape Sepolia | 11011 | https://sepolia.shape.network | https://sepolia.shapescan.xyz |
| Base Sepolia | 84532 | https://sepolia.base.org | https://sepolia-explorer.base.org |

## ⚠️ Security Considerations

### Agent Authorization
- Agent wallets must be authorized by rug owners before performing maintenance
- Authorization is done via the web dashboard: `/dashboard`
- Agents can only maintain rugs they are authorized for

### Private Key Protection
- Never expose agent private keys
- Use dedicated agent wallets with minimal funds
- Implement proper key management and rotation

### Payment Verification
- All payments are verified on-chain before actions execute
- Invalid or insufficient payments are rejected
- Transaction receipts are validated for authenticity

### Rate Limiting
- API endpoints include rate limiting to prevent abuse
- Maintenance operations have cooldown periods
- Failed payment attempts are logged and monitored

## 🧪 Testing

### Local Development Setup
```bash
# Start Next.js app
npm run dev

# In another terminal, test x402 API
./x402-curl-examples.sh

# Test standalone agent
cd standalone-ai-agent && npm test
```

### Test Networks
- Use **Shape Sepolia** or **Base Sepolia** for testing
- Get test ETH from respective faucets
- Contract addresses are configured in environment variables

### Environment Variables
```bash
# For x402 facilitator
FACILITATOR_PRIVATE_KEY=0x_your_key
X402_PAY_TO_ADDRESS=0x_merchant_wallet

# For standalone agent
AGENT_PRIVATE_KEY=0x_agent_key
AGENT_ADDRESS=0x_agent_address
OWNER_ADDRESS=0x_rug_owner_address

# Network configuration
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x_contract_address
```

## 🔧 Troubleshooting

### Common Issues

**"Agent not authorized"**
- Ensure agent wallet is authorized via dashboard
- Check authorization transaction was successful
- Verify correct agent address is being used

**"Payment verification failed"**
- Check transaction was mined and successful
- Verify payment amount matches requirement
- Ensure payment was sent to correct address

**"Contract interaction failed"**
- Verify contract is deployed on correct network
- Check contract address in environment variables
- Ensure rug exists and agent is authorized

**"AI agent not responding"**
- Check Ollama is running: `ollama list`
- Verify model is available: `ollama pull llama3.1:8b`
- Check agent configuration in `.env`

### Debug Commands
```bash
# Check blockchain connection
curl -X GET "http://localhost:3000/api/maintenance/status/1"

# Test payment requirement creation
curl -X POST "http://localhost:3000/api/x402/facilitator" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_supported"}'

# Verify agent wallet balance
cast balance 0x_agent_address --rpc-url https://sepolia.shape.network
```

## 📞 Support

- **Documentation**: This guide and inline code comments
- **Testing**: Use provided curl scripts and test suites
- **Issues**: Check GitHub issues for known problems
- **Security**: Report security issues privately

---

## 🎯 Quick Start Summary

1. **Setup**: `npm run dev` (Next.js) + `npm run chat` (AI Agent)
2. **Authorize**: Agent wallet via `/dashboard`
3. **Fund**: Agent wallet with test ETH
4. **Test**: `./x402-curl-examples.sh`
5. **Chat**: Ask agent to "clean rug 1"

**The x402 v2 integration handles payments automatically - just authorize and fund your agent!** 🚀🤖
