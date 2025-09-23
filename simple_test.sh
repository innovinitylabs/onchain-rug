#!/bin/bash
echo "Starting simple test..."

# Kill existing Anvil
pkill -f anvil || true
sleep 2

# Start Anvil
echo "Starting Anvil..."
anvil --silent &
ANVIL_PID=$!
sleep 3

echo "Anvil PID: $ANVIL_PID"

# Test deployment
echo "Testing deployment..."
forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --tc DeployLocal --broadcast 2>&1 | head -20

echo "Test completed"
kill $ANVIL_PID 2>/dev/null || true
