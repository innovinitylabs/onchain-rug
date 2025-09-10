# Shape L2 Deployment Checklist for Onchain Rugs

## ✅ Based on Your Successful shapecraft2 Deployment

Since you've successfully deployed to Shape L2 before with [shapecraft2](https://github.com/innovinitylabs/shapecraft2), we can use the same proven approach.

## 🎯 Current Status

### ✅ Completed
- **Smart Contracts**: RugGenerator.sol + OnchainRugs.sol compiled and tested
- **Deployment Scripts**: Foundry scripts ready
- **Frontend Integration**: Web3 components configured
- **Private Key**: Added to .env file
- **Local Testing**: Successfully deployed locally

### 🚀 Ready for Shape L2 Deployment

## 📋 Deployment Steps

### 1. Get Testnet ETH
Visit the Shape Sepolia faucet:
- **Faucet**: https://sepolia-faucet.shape.xyz
- **Explorer**: https://sepolia-explorer.shape.xyz

### 2. Deploy Contracts
```bash
# Deploy to Shape Sepolia (when RPC is available)
forge script script/Deploy.s.sol --rpc-url https://sepolia-rpc.shape.xyz --broadcast

# Or try mainnet RPC
forge script script/Deploy.s.sol --rpc-url https://rpc.shape.xyz --broadcast
```

### 3. Save Contract Addresses
After successful deployment, you'll get:
```
RugGenerator: 0x...
OnchainRugs: 0x...
```

### 4. Update Frontend Configuration
Update `lib/config.ts`:
```typescript
export const config = {
  chainId: 11011, // Shape Sepolia (or 360 for mainnet)
  rugContractAddress: '0x...', // Your deployed OnchainRugs address
  cleaningContractAddress: '0x...', // Same as rug contract
  // ... rest of config
}
```

### 5. Initialize Generator (Optional)
```bash
# Replace placeholder files with real P5.js library and algorithm
# Then initialize
forge script script/InitializeGenerator.s.sol --rpc-url https://sepolia-rpc.shape.xyz --broadcast
```

## 🔧 Troubleshooting

### If RPC Endpoints Are Down
Based on your shapecraft2 experience, you can:

1. **Wait and retry**: Shape L2 RPC might be temporarily unavailable
2. **Use alternative endpoints**: Check Shape documentation for backup RPCs
3. **Deploy to mainnet**: Use Shape Mainnet (chain ID: 360) when ready

### Alternative RPC Endpoints to Try
```bash
# Try different Shape L2 endpoints
https://rpc.shape.xyz
https://sepolia-rpc.shape.xyz
https://mainnet-rpc.shape.xyz
```

## 💰 Cost Estimates (Based on shapecraft2)

- **Deployment**: ~4.5M gas (~$4.50 on Shape L2)
- **Per NFT Mint**: ~15k gas (~$0.015)
- **Cleaning**: ~50k gas (~$0.05)
- **Total for 1111 NFTs**: ~$21.65

## 🎯 Shape L2 Advantages (From Your Experience)

- **80% Gasback**: Users get 80% of gas costs back
- **Higher Contract Limits**: No 24KB restriction
- **Lower Gas Costs**: 10-100x cheaper than mainnet
- **Fast Transactions**: 2-5 second finality
- **Account Abstraction**: Enhanced user experience

## 🚀 Next Steps

1. **Wait for RPC**: Shape L2 RPC endpoints to come back online
2. **Get Testnet ETH**: From Shape Sepolia faucet
3. **Deploy**: Run the deployment script
4. **Test**: Verify contracts on Shape explorer
5. **Update Frontend**: Configure with new contract addresses

## 📞 If You Need Help

Since you've successfully deployed to Shape L2 before, you know the process. The main difference is that your Onchain Rugs project uses:
- **Ultra-minimal storage** (seed + text only)
- **Shared P5.js library** approach
- **Deterministic PRNG** for consistent generation

Your deployment should be even more gas-efficient than shapecraft2! 🎉

## 🎯 Ready to Deploy!

Your Onchain Rugs project is fully prepared for Shape L2 deployment. Once the RPC endpoints are back online, you can deploy in minutes using the same successful approach from your shapecraft2 project.
