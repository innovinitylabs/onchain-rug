#!/bin/bash
echo "=== COMPLETE ONCHAIN RUGS LOCAL DEPLOYMENT & TESTING ==="
echo ""

# Configuration
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC_URL="http://127.0.0.1:8545"

echo "🔧 Setting up fresh Anvil instance..."

# Kill any existing Anvil processes
pkill -f anvil || true
sleep 2

# Start fresh Anvil in background
echo "Starting Anvil..."
anvil --silent &
ANVIL_PID=$!
sleep 3

echo "✅ Anvil started (PID: $ANVIL_PID)"
echo ""

echo "🚀 Deploying Complete System (Scripty + Diamond)..."

# Deploy the complete system (Scripty + Diamond)
forge script script/DeployLocal.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --tc DeployLocal \
  --broadcast

echo ""
echo "✅ Deployment completed!"
echo "Note: Diamond address shown in deployment output above"
echo ""
echo "🧪 Manual Testing Commands:"
echo "Copy the Diamond address from above and use these commands:"
echo ""
echo "cast call [DIAMOND_ADDR] 'getMintPrice(uint256)' 2 --rpc-url http://127.0.0.1:8545"
echo "cast send [DIAMOND_ADDR] 'mintRug(string[],uint256,string,string,string,string,uint8,uint8,uint256,uint256)' '[\"Hello\",\"World\"]' 12345 'palette' 'minified' 'stripes' 'chars' 1 1 10 5 --value 0.00003ether --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "cast call [DIAMOND_ADDR] 'tokenURI(uint256)' 1 --rpc-url http://127.0.0.1:8545"
echo "cast call [DIAMOND_ADDR] 'getAgingState(uint256)' 1 --rpc-url http://127.0.0.1:8545"
echo ""
echo "🎉 Ready for testing! Anvil is still running (PID: $ANVIL_PID)"
echo "Run: kill $ANVIL_PID  (when done)"
