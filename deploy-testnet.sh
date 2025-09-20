#!/bin/bash

# Shape Sepolia Testnet Deployment Script
echo "🚀 Deploying OnchainRugs to Shape Sepolia Testnet..."

# Set the private key as environment variable
export PRIVATE_KEY="0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207"

# Run the deployment
echo "📡 Running deployment script..."
forge script script/DeployToShapeSepolia.s.sol:DeployToShapeSepolia \
    --rpc-url https://sepolia.shape.network \
    --broadcast \
    --verify \
    --gas-price 1000000000 \
    --gas-limit 30000000 \
    --chain-id 11011

echo "✅ Deployment completed!"
echo "📋 Check the broadcast directory for deployment details"
