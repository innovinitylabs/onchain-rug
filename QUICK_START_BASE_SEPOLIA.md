# Quick Start: Base Sepolia Deployment

## TL;DR - Deploy in 5 Minutes

### 1. Setup Environment

```bash
# Switch to Base Sepolia branch
git checkout base-sepolia-testing

# Create .env file
cat > .env << 'EOF'
PRIVATE_KEY=your_private_key_without_0x
BASE_RPC=https://sepolia.base.org
EOF
```

### 2. Get Testnet ETH

Get Base Sepolia testnet ETH from:
- https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### 3. Deploy

```bash
# Deploy everything to Base Sepolia
forge script script/DeployBaseSepolia.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify \
  --profile base
```

### 4. Save Your Contract Address

From the console output, copy your Diamond address:
```
Diamond: 0x...
```

### 5. Test It

```bash
# Test mint
cast send YOUR_DIAMOND_ADDRESS \
  "mintRug(string[],string,string,string,uint256)" \
  '["Hello Base"]' "default" "" "" 8 \
  --value 0.00003ether \
  --rpc-url base-sepolia \
  --private-key $PRIVATE_KEY
```

## Done!

Your NFT collection is now live on Base Sepolia at:
`https://sepolia-explorer.base.org/address/YOUR_DIAMOND_ADDRESS`

## Network Details

- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia-explorer.base.org
- **Gas Price**: ~0.5 gwei (cheap!)

## What You Get

- Generative NFT collection with on-chain art
- Aging mechanics (rugs age over time)
- Cleaning and maintenance features
- Built-in marketplace
- Frame progression system
- Full ERC-721 compatibility

## Next Steps

1. **Frontend Setup**:
   ```bash
   echo "NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=YOUR_DIAMOND_ADDRESS" >> .env
   npm run dev
   ```

2. **Test Features**:
   - Mint NFTs
   - Check aging (wait a few minutes for test values)
   - Try cleaning
   - List on marketplace

3. **Production Ready**:
   - See `BASE_SEPOLIA_DEPLOYMENT_GUIDE.md` for full details
   - Adjust timing values for mainnet
   - Consider security audit

## Troubleshooting

**"Insufficient funds"**
- Get more testnet ETH from faucets

**"Verification failed"**
- Check Basescan API key in foundry.toml
- Try manual verification

**"Nonce too high"**
```bash
cast nonce YOUR_ADDRESS --rpc-url base-sepolia
```

## Key Commands

```bash
# Check deployment
cast call DIAMOND_ADDRESS "totalSupply()" --rpc-url base-sepolia

# Get mint price
cast call DIAMOND_ADDRESS "getMintPrice(string[])" '["text"]' --rpc-url base-sepolia

# Check if configured
cast call DIAMOND_ADDRESS "isConfigured()" --rpc-url base-sepolia
```

## More Info

- Full guide: `BASE_SEPOLIA_DEPLOYMENT_GUIDE.md`
- Migration summary: `BASE_SEPOLIA_MIGRATION_SUMMARY.md`
- Environment setup: `BASE_SEPOLIA_ENV_EXAMPLE.txt`

---

**Happy deploying on Base Sepolia!** 🚀

