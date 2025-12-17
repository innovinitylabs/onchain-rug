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
AGENT_ADDRESS="0x18aD3393691372821A05d08E6C30f4Fe4E150403"
TOKEN_ID="1"

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

curl -X GET "$API_BASE/maintenance/status/$TOKEN_ID" 2>/dev/null || echo "Response:"
curl -X GET "$API_BASE/maintenance/status/$TOKEN_ID"
echo -e "\n"

# ============================================================================
# 💰 2. MAINTENANCE QUOTES (FREE - Shows Payment Requirements)
# ============================================================================

echo "💰 2. Get Maintenance Quote for Cleaning"
echo "curl -X GET \"$API_BASE/maintenance/quote/$TOKEN_ID/clean\" \\"
echo "  -H \"x-agent-address: $AGENT_ADDRESS\""
echo ""

curl -X GET "$API_BASE/maintenance/quote/$TOKEN_ID/clean" \
  -H "x-agent-address: $AGENT_ADDRESS" 2>/dev/null || echo "Response:"
curl -X GET "$API_BASE/maintenance/quote/$TOKEN_ID/clean" \
  -H "x-agent-address: $AGENT_ADDRESS"
echo -e "\n"

# ============================================================================
# 🎫 3. X402 FACILITATOR DIRECT API
# ============================================================================

echo "🎫 3. Create X402 Payment Requirement"
echo "curl -X POST \"$API_BASE/x402/facilitator\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"action\": \"create_payment_requirement\","
echo "    \"price\": \"0.000042\","
echo "    \"description\": \"Clean rug #$TOKEN_ID\""
echo "  }'"
echo ""

curl -X POST "$API_BASE/x402/facilitator" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"create_payment_requirement\",
    \"price\": \"0.000042\",
    \"description\": \"Clean rug #$TOKEN_ID\"
  }" 2>/dev/null || echo "Response:"
curl -X POST "$API_BASE/x402/facilitator" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"create_payment_requirement\",
    \"price\": \"0.000042\",
    \"description\": \"Clean rug #$TOKEN_ID\"
  }"
echo -e "\n"

echo "🎫 4. Get Supported X402 Schemes and Networks"
echo "curl -X POST \"$API_BASE/x402/facilitator\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"action\": \"get_supported\"}'"
echo ""

curl -X POST "$API_BASE/x402/facilitator" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_supported"}' 2>/dev/null || echo "Response:"
curl -X POST "$API_BASE/x402/facilitator" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_supported"}'
echo -e "\n"

# ============================================================================
# 📝 USAGE INSTRUCTIONS
# ============================================================================

echo "📝 HOW TO USE X402 API:"
echo "======================="
echo ""
echo "1. FREE OPERATIONS (No payment needed):"
echo "   • Check rug status: GET /api/maintenance/status/{tokenId}"
echo "   • Get maintenance quotes: GET /api/maintenance/quote/{tokenId}/{action}"
echo ""
echo "2. X402 PAYMENT FLOW:"
echo "   a) Create payment requirement via facilitator API"
echo "   b) User signs x402 payment payload off-chain"
echo "   c) User submits payment transaction to blockchain"
echo "   d) Agent verifies payment on-chain"
echo "   e) Maintenance action executes"
echo ""
echo "3. SUPPORTED NETWORKS:"
echo "   • Shape Sepolia (Testnet): chainId 11011"
echo "   • Base Sepolia (Testnet): chainId 84532"
echo ""
echo "⚠️  IMPORTANT:"
echo "   • Agent wallet must be authorized first"
echo "   • Service fee: 0.000042 ETH per operation"
echo ""

echo "🎉 x402 API Examples Complete!"
