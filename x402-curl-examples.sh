#!/bin/bash

# 🚀 x402 Rug Maintenance API - Curl Examples
#
# This script demonstrates how to query the Onchain Rugs x402 API
# for rug maintenance operations on Shape L2 network.
#
# Prerequisites:
# 1. Your Next.js app running on localhost:3000 (npm run dev)
# 2. Agent wallet authorized for maintenance operations
# 3. Test ETH on Shape Sepolia for payments

# Configuration
API_BASE="https://www.onchainrugs.xyz/api"
AGENT_ADDRESS="0x18aD3393691372821A05d08E6C30f4Fe4E150403"  # Replace with your agent address
USER_ADDRESS="0x_your_user_wallet_address"  # Replace with user's wallet address
TOKEN_ID="1"  # Replace with the rug token ID

echo "🤖 x402 Rug Maintenance API - Curl Examples"
echo "=========================================="
echo "API Base: $API_BASE"
echo "Agent Address: $AGENT_ADDRESS"
echo ""

# ============================================================================
# 🎯 1. RUG STATUS CHECKS (FREE - No Payment Required)
# ============================================================================

echo "📊 1. Check Rug Status"
echo "curl -X GET \"$API_BASE/maintenance/status/$TOKEN_ID\""
echo ""

curl -X GET "$API_BASE/maintenance/status/$TOKEN_ID" 2>/dev/null | jq . 2>/dev/null || echo "Response:"
curl -X GET "$API_BASE/maintenance/status/$TOKEN_ID"
echo -e "\n"

# ============================================================================
# 💰 2. MAINTENANCE QUOTES (FREE - Shows Payment Requirements)
# ============================================================================

echo "💰 2. Get Maintenance Quote for Cleaning"
echo "curl -X GET \"$API_BASE/maintenance/quote/$TOKEN_ID/clean\" \\
  -H \"x-agent-address: $AGENT_ADDRESS\""
echo ""

curl -X GET "$API_BASE/maintenance/quote/$TOKEN_ID/clean" \
  -H "x-agent-address: $AGENT_ADDRESS" 2>/dev/null | jq . 2>/dev/null || echo "Response:"
curl -X GET "$API_BASE/maintenance/quote/$TOKEN_ID/clean" \
  -H "x-agent-address: $AGENT_ADDRESS"
echo -e "\n"

echo "💰 3. Get Maintenance Quote for Restoration"
echo "curl -X GET \"$API_BASE/maintenance/quote/$TOKEN_ID/restore\" \\
  -H \"x-agent-address: $AGENT_ADDRESS\""
echo ""

curl -X GET "$API_BASE/maintenance/quote/$TOKEN_ID/restore" \
  -H "x-agent-address: $AGENT_ADDRESS" 2>/dev/null | jq . 2>/dev/null || echo "Response:"
curl -X GET "$API_BASE/maintenance/quote/$TOKEN_ID/restore" \
  -H "x-agent-address: $AGENT_ADDRESS"
echo -e "\n"

# ============================================================================
# 🔧 3. MAINTENANCE ACTIONS (REQUIRES PAYMENT)
# ============================================================================

echo "🔧 4. Execute Rug Cleaning (REQUIRES PAYMENT)"
echo "curl -X POST \"$API_BASE/maintenance/action/$TOKEN_ID/clean\" \\
  -H \"Content-Type: application/json\" \\
  -H \"x-agent-address: $AGENT_ADDRESS\" \\
  -d '{\"paymentAmount\": \"42000000000000\"}'"
echo ""

# WARNING: This will actually execute the transaction if uncommented!
# curl -X POST "$API_BASE/maintenance/action/$TOKEN_ID/clean" \
#   -H "Content-Type: application/json" \
#   -H "x-agent-address: $AGENT_ADDRESS" \
#   -d '{"paymentAmount": "42000000000000"}'  # 0.000042 ETH

echo "⚠️  SKIPPED: Uncomment the curl command above to actually execute cleaning"
echo "   (Requires agent wallet to have sufficient ETH for gas + service fee)"
echo -e "\n"

# ============================================================================
# 🎫 4. X402 FACILITATOR DIRECT API (Advanced)
# ============================================================================

echo "🎫 5. Create X402 Payment Requirement"
echo "curl -X POST \"$API_BASE/x402/facilitator\" \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"action\": \"create_payment_requirement\",
    \"price\": \"0.000042\",
    \"description\": \"Clean rug #$TOKEN_ID\",
    \"resource\": \"/api/maintenance/action/$TOKEN_ID/clean\"
  }'"
echo ""

curl -X POST "$API_BASE/x402/facilitator" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"create_payment_requirement\",
    \"price\": \"0.000042\",
    \"description\": \"Clean rug #$TOKEN_ID\",
    \"resource\": \"/api/maintenance/action/$TOKEN_ID/clean\"
  }" 2>/dev/null | jq . 2>/dev/null || echo "Response:"
curl -X POST "$API_BASE/x402/facilitator" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"create_payment_requirement\",
    \"price\": \"0.000042\",
    \"description\": \"Clean rug #$TOKEN_ID\",
    \"resource\": \"/api/maintenance/action/$TOKEN_ID/clean\"
  }"
echo -e "\n"

echo "🎫 6. Get Supported X402 Schemes and Networks"
echo "curl -X POST \"$API_BASE/x402/facilitator\" \\
  -H \"Content-Type: application/json\" \\
  -d '{\"action\": \"get_supported\"}'"
echo ""

curl -X POST "$API_BASE/x402/facilitator" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_supported"}' 2>/dev/null | jq . 2>/dev/null || echo "Response:"
curl -X POST "$API_BASE/x402/facilitator" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_supported"}'
echo -e "\n"

# ============================================================================
# 📊 5. MARKETPLACE AND NFT DATA (FREE)
# ============================================================================

echo "📊 7. Get NFT Metadata"
echo "curl -X GET \"$API_BASE/metadata/$TOKEN_ID\""
echo ""

curl -X GET "$API_BASE/metadata/$TOKEN_ID" 2>/dev/null | jq . 2>/dev/null || echo "Response:"
curl -X GET "$API_BASE/metadata/$TOKEN_ID"
echo -e "\n"

echo "📊 8. Get Collection Statistics"
echo "curl -X GET \"$API_BASE/collection\""
echo ""

curl -X GET "$API_BASE/collection" 2>/dev/null | jq . 2>/dev/null || echo "Response:"
curl -X GET "$API_BASE/collection" | head -20
echo "(truncated output...)"
echo -e "\n"

# ============================================================================
# 🤖 6. STANDALONE AI AGENT EXAMPLES
# ============================================================================

echo "🤖 9. Test Standalone AI Agent Direct Payment System"
echo "cd standalone-ai-agent && npm run test:direct-payment"
echo ""

echo "🤖 10. Launch Standalone AI Agent Chat"
echo "cd standalone-ai-agent && npm run chat"
echo ""

echo "🤖 11. Run Full Standalone Agent Test Suite"
echo "cd standalone-ai-agent && npm test"
echo ""

# ============================================================================
# 📝 USAGE INSTRUCTIONS
# ============================================================================

echo "📝 HOW TO USE X402 API:"
echo "======================="
echo ""
echo "1. FREE OPERATIONS (No payment needed):"
echo "   • Check rug status: GET /api/maintenance/status/{tokenId}"
echo "   • Get maintenance quotes: GET /api/maintenance/quote/{tokenId}/{action}"
echo "   • View NFT metadata: GET /api/metadata/{tokenId}"
echo "   • Browse marketplace: GET /api/marketplace/*"
echo ""
echo "2. PAID OPERATIONS (Require x402 payment):"
echo "   • Execute maintenance: POST /api/maintenance/action/{tokenId}/{action}"
echo "     Headers: x-agent-address: {agent_wallet_address}"
echo "     Body: {\"paymentAmount\": \"wei_amount\"}"
echo ""
echo "3. X402 FACILITATOR (Advanced payment handling):"
echo "   • Create payment requirement: POST /api/x402/facilitator"
echo "     Body: {action: \"create_payment_requirement\", price: \"0.000042\", ...}"
echo "   • Verify payment: POST /api/x402/facilitator"
echo "     Body: {action: \"verify_payment\", paymentPayload: \"...\"}"
echo "   • Settle payment: POST /api/x402/facilitator"
echo "     Body: {action: \"settle_payment\", paymentPayload: \"...\"}"
echo ""
echo "4. PAYMENT FLOW:"
echo "   a) Get quote to see required payment amount"
echo "   b) User creates x402 payment payload (off-chain)"
echo "   c) User signs and submits payment transaction"
echo "   d) Agent verifies payment on-chain"
echo "   e) Maintenance action executes"
echo ""
echo "5. SUPPORTED NETWORKS:"
echo "   • Shape Sepolia (Testnet): chainId 11011"
echo "   • Base Sepolia (Testnet): chainId 84532"
echo ""
echo "6. ACTIONS:"
echo "   • clean: Basic cleaning operation"
echo "   • restore: Full restoration"
echo "   • master: Complete master restoration"
echo ""
echo "⚠️  IMPORTANT:"
echo "   • Agent wallet must be authorized by rug owner first"
echo "   • Agent wallet needs ETH for gas + service fees"
echo "   • All transactions are on Shape L2 testnet"
echo "   • Service fee: 0.000042 ETH per operation"
echo ""

echo "🎉 x402 Rug Maintenance API Examples Complete!"