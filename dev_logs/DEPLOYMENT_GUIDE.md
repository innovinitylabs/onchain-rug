# Onchain Rugs - Shape L2 Deployment Guide

## Overview
This guide covers deploying the Onchain Rugs smart contracts to Shape L2 using Foundry.

## Architecture
- **RugGenerator.sol**: Stores P5.js library and generation algorithm, generates HTML on-demand
- **OnchainRugs.sol**: Main NFT contract that stores only seed + text, calls RugGenerator for art

## Prerequisites

### 1. Environment Setup
Add to your `.env` file:
```bash
PRIVATE_KEY=your_private_key_here
```

### 2. Shape L2 Testnet Setup
- **Network**: Shape Sepolia
- **Chain ID**: 11011
- **RPC URL**: https://sepolia-rpc.shape.xyz
- **Explorer**: https://sepolia-explorer.shape.xyz

### 3. Get Testnet ETH
Visit the [Shape Sepolia Faucet](https://sepolia-faucet.shape.xyz) to get testnet ETH.

## Deployment Steps

### Step 1: Deploy Contracts
```bash
# Deploy to Shape Sepolia
forge script script/Deploy.s.sol --rpc-url shape-sepolia --broadcast --verify

# Or with environment variable
PRIVATE_KEY=your_key forge script script/Deploy.s.sol --rpc-url shape-sepolia --broadcast
```

### Step 2: Initialize Generator
```bash
# Initialize with P5.js library and algorithm
forge script script/InitializeGenerator.s.sol --rpc-url shape-sepolia --broadcast
```

### Step 3: Update Frontend
Update `lib/config.ts` with deployed contract addresses:
```typescript
export const config = {
  chainId: 11011, // Shape Sepolia
  rugContractAddress: '0x...', // OnchainRugs address
  cleaningContractAddress: '0x...', // Same as rug contract
  // ... other config
}
```

## Contract Addresses
After deployment, you'll get:
- **RugGenerator**: `0x...` (stores P5.js library and algorithm)
- **OnchainRugs**: `0x...` (main NFT contract)

## Gas Costs
- **Deployment**: ~2-4M gas (~$2-4 on Shape L2)
- **Minting**: ~15k gas per NFT (~$0.015)
- **Cleaning**: ~50k gas (~$0.05)

## Testing
```bash
# Test minting
cast call $ONCHAIN_RUGS_ADDRESS "totalSupply()" --rpc-url shape-sepolia

# Test generator
cast call $GENERATOR_ADDRESS "isReady()" --rpc-url shape-sepolia
```

## Production Deployment
For mainnet deployment:
1. Change `chainId` to `360` (Shape Mainnet)
2. Use mainnet RPC: `https://rpc.shape.xyz`
3. Ensure sufficient ETH for deployment costs

## Troubleshooting
- **Stack too deep**: Use `via_ir = true` in foundry.toml
- **Gas limit**: Shape L2 has 30M gas limit
- **Verification**: Use Shape explorer for contract verification
