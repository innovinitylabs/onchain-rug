# Base Sepolia Frontend Setup Guide

## Required .env Variables

To make your frontend work with Base Sepolia, you need these environment variables in your `.env` file:

```bash
# ============================================
# REQUIRED FOR BASE SEPOLIA
# ============================================

# Your deployed contract address on Base Sepolia
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0x3bcd07e784c00bb84EfBab7F710ef041707003b9

# Base Sepolia RPC URL
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# ============================================
# OPTIONAL BUT RECOMMENDED
# ============================================

# Alchemy API Key for better RPC performance
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# Royalty recipient address
NEXT_PUBLIC_ROYALTY_RECIPIENT=your_wallet_address

# ============================================
# FOR DEPLOYMENT/BACKEND
# ============================================

# Private key for deployments (already set)
TESTNET_PRIVATE_KEY=0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207
```

## Changes Made to Support Base Sepolia

### ✅ 1. Updated `lib/config.ts`
- Changed default chain ID from 11011 (Shape Sepolia) to 84532 (Base Sepolia)

### ✅ 2. Updated `components/providers.tsx`
- Added Base Sepolia and Base Mainnet chain imports
- Updated wagmi config to include all 4 chains (Shape + Base)
- Updated RainbowKit config to support Base networks

### ✅ 3. Already Configured (from earlier)
- `lib/web3.ts` - Has Base chain definitions and Alchemy RPC support
- `foundry.toml` - Has Base Sepolia RPC endpoints

## How Users Will Experience It

### Network Switching
Users can now:
1. **Connect wallet** - RainbowKit will show Base Sepolia as an option
2. **Auto-detect** - If user is on Base Sepolia (84532), app will work automatically
3. **Switch networks** - Users can switch between:
   - Base Sepolia (84532)
   - Base Mainnet (8453)
   - Shape Sepolia (11011)
   - Shape Mainnet (360)

### Default Network
- **Default**: Base Sepolia (84532)
- **Contract**: 0x3bcd07e784c00bb84EfBab7F710ef041707003b9
- **RPC**: https://sepolia.base.org

## Testing Your Frontend

### 1. Start Development Server

```bash
npm run dev
```

### 2. Connect Wallet
- Click "Connect Wallet" button
- Select your wallet (MetaMask, Coinbase Wallet, etc.)
- If not on Base Sepolia, wallet will prompt to switch networks

### 3. Test Features

**Minting**:
- Navigate to generator/minting page
- Enter custom text (optional)
- Click "Mint" - should cost 0.00003 ETH
- Confirm transaction in wallet

**View NFTs**:
- Go to gallery/portfolio page
- Should see your minted NFTs
- TokenURI should load with on-chain art

**Aging System**:
- Wait 1-2 minutes after minting
- Refresh page
- Should see dirt level increase
- Try cleaning functionality

**Marketplace**:
- List an NFT for sale
- View active listings
- Purchase functionality

## Troubleshooting

### "Wrong Network" Error
**Problem**: Wallet is on different network  
**Solution**: 
- Click "Switch Network" in wallet prompt
- Or manually switch to Base Sepolia (84532) in wallet

### "Contract Not Found" Error
**Problem**: Contract address not set correctly  
**Solution**: 
```bash
# Make sure this is in your .env
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0x3bcd07e784c00bb84EfBab7F710ef041707003b9
```

### "RPC Error" or Slow Loading
**Problem**: Public RPC is slow or rate-limited  
**Solution**:
```bash
# Add Alchemy API key to .env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key_here
```
Get free key at: https://www.alchemy.com

### Wallet Not Connecting
**Problem**: WalletConnect not configured  
**Solution**:
```bash
# Get free project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```
Get at: https://cloud.walletconnect.com

### Transactions Failing
**Problem**: Not enough ETH or wrong parameters  
**Solution**:
- Ensure wallet has Base Sepolia ETH
- Get from faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Check mint price is correct (0.00003 ETH)

## WalletConnect Setup

If you don't have a WalletConnect Project ID:

1. Go to https://cloud.walletconnect.com
2. Sign up for free account
3. Create new project
4. Copy Project ID
5. Add to .env:
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

## Alchemy Setup (Optional)

For better RPC performance:

1. Go to https://www.alchemy.com
2. Sign up for free account
3. Create new app
4. Select "Base" network
5. Select "Base Sepolia" testnet
6. Copy API key
7. Add to .env:
```bash
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key_here
```

## Network Configuration Summary

Your app now supports:

| Network | Chain ID | RPC | Status |
|---------|----------|-----|--------|
| Base Sepolia | 84532 | https://sepolia.base.org | ✅ Default |
| Base Mainnet | 8453 | https://mainnet.base.org | ✅ Supported |
| Shape Sepolia | 11011 | https://sepolia.shape.network | ✅ Supported |
| Shape Mainnet | 360 | https://mainnet.shape.network | ✅ Supported |

## Contract Addresses

**Base Sepolia Deployment**:
```
Diamond (Main Contract): 0x3bcd07e784c00bb84EfBab7F710ef041707003b9
FileStore: 0x5Fb9310C998cC608226316F521D6d25E97E4B78A
ScriptyStorage: 0x63bb0d67db4B7bFf07FAAcbF0E973ed3f6422C59
ScriptyBuilder: 0x7e3FFB073E29d1715C08Ee9bC3E41356c75dcF42
HTMLGenerator: 0x46270eB2bB5CE81ea29106514679e67d9Fa9ad27
```

## Quick Check

Run these checks to verify your frontend is configured correctly:

```bash
# Check environment variables are set
grep "NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT" .env
grep "NEXT_PUBLIC_RPC_URL" .env

# Check contract on Base Sepolia
cast call 0x3bcd07e784c00bb84EfBab7F710ef041707003b9 \
  "totalSupply()" \
  --rpc-url https://sepolia.base.org

# Start development server
npm run dev
```

## Expected Behavior

After these changes:

1. ✅ Frontend connects to Base Sepolia by default
2. ✅ Wallet prompts to switch to Base Sepolia if on wrong network
3. ✅ Contract calls work correctly
4. ✅ Minting works with correct pricing (0.00003 ETH)
5. ✅ NFT metadata loads from on-chain
6. ✅ Aging system displays correctly
7. ✅ All maintenance features work
8. ✅ Marketplace functions properly

## Next Steps

1. **Update .env** with all required variables
2. **Restart dev server** (`npm run dev`)
3. **Connect wallet** to Base Sepolia
4. **Test minting** a few NFTs
5. **Verify features** work as expected
6. **Test on mobile** if needed

---

Your frontend is now configured for Base Sepolia! 🎉

