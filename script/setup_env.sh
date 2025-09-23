#!/bin/bash

# Environment setup for OnchainRugs Shape Sepolia deployment
# Copy and customize these variables for your deployment

echo "OnchainRugs Shape Sepolia Deployment Environment Setup"
echo "======================================================"
echo ""

# Shape Sepolia testnet RPC URL
echo "# Shape Sepolia RPC URL:"
echo 'export RPC_URL="https://sepolia.shape.network/"'
echo ""

# Your private key (NEVER commit this to git!)
echo "# Your private key (get from your wallet):"
echo 'export PRIVATE_KEY="your_private_key_here"'
echo ""

# Example of how to get your address
echo "# Check your deployer address:"
echo 'echo "Deployer address: $(cast wallet address --private-key $PRIVATE_KEY)"'
echo ""

# Example of how to check balance
echo "# Check your balance:"
echo 'echo "Balance: $(cast balance $(cast wallet address --private-key $PRIVATE_KEY) --rpc-url $RPC_URL) ETH"'
echo ""

echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "- Never commit your PRIVATE_KEY to git"
echo "- Make sure you have enough ETH on Shape Sepolia for deployment (~0.1 ETH)"
echo "- Test on local Anvil first before mainnet deployment"
echo ""

echo "📋 Deployment Checklist:"
echo "✅ Private key set"
echo "✅ RPC URL configured"
echo "✅ Balance checked (>0.1 ETH)"
echo "✅ Local Anvil testing completed"
echo "✅ Ready for Shape Sepolia deployment"
