# Quick Start: Automated Marketplace Testing

## Prerequisites

✅ **You have:**
- Wallet 1: `0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F` (with testnet ETH)
- Wallet 2: `0x8B46f9A4a29967644C3B6A628C058541492acD57` (testing wallet)
- Private keys in `.env` file

## Your .env File Should Look Like:

```env
# Primary deployment wallet (has testnet ETH)
# Wallet: 0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F
PRIVATE_KEY=0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207
TESTNET_PRIVATE_KEY=0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207

# Testing wallet 2 (for buy/bid operations)
# Wallet: 0x8B46f9A4a29967644C3B6A628C058541492acD57
TESTNET_PRIVATE_KEY_2=0xfb5d3d24805c4cf92b50e0dde0984652a122456d6531bf7c27bfbbccde711e72

# Shape Sepolia RPC
SHAPE_SEPOLIA_RPC=https://sepolia.shape.network

# Will be set after deployment
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=
```

**Or copy from template:**
```bash
cp env.marketplace-testing.example .env
```

---

## Option 1: Fully Automated Testing (Recommended)

Run everything with one command:

```bash
./test-marketplace.sh
```

This will:
1. ✅ Run unit tests (23 tests)
2. ✅ Deploy all contracts to Shape Sepolia
3. ✅ Wait for deployment to settle
4. ✅ Run automated integration tests
5. ✅ Print diamond address for frontend

**Time:** ~10-15 minutes

---

## Option 2: Manual Step-by-Step

### Step 1: Run Unit Tests

```bash
forge test --match-contract RugMarketplaceTest -vv
```

Expected: **23/23 tests passing**

### Step 2: Deploy to Testnet

```bash
forge script script/DeployShapeSepolia.s.sol \
  --rpc-url https://sepolia.shape.network \
  --broadcast \
  --slow \
  -vv
```

**Save the Diamond address** from output!

### Step 3: Run Integration Tests

```bash
export DIAMOND_ADDRESS=0x... # Use address from step 2

forge script script/TestMarketplace.s.sol \
  --rpc-url https://sepolia.shape.network \
  --broadcast \
  --slow \
  -vv
```

### Step 4: Update Frontend

Edit `lib/web3.ts`:
```typescript
export const contractAddresses: Record<number, string> = {
  360: '0x...', // Shape Mainnet
  11011: '0x...' // ADD: Your diamond address here
}
```

### Step 5: Test Frontend

```bash
npm run dev
```

Visit: http://localhost:3000/market

---

## What The Automated Tests Do

### Test 1: Mint NFTs
- Mints 3 test NFTs to wallet1
- Approves marketplace
- ✅ Verifies ownership

### Test 2: Direct Listing
- Wallet1 lists NFT #1 for 0.01 ETH
- Wallet2 buys it
- ✅ Verifies transfer and payment

### Test 3: Auction
- Wallet1 creates auction for NFT #2
- Start: 0.005 ETH, Reserve: 0.02 ETH
- Wallet2 bids 0.025 ETH
- Fast-forwards and finalizes
- ✅ Verifies auction completion

### Test 4: Offers
- Wallet2 makes offer on NFT #3 (0.008 ETH)
- Wallet1 accepts offer
- ✅ Verifies escrow and transfer

### Test 5: Bundles
- Wallet1 mints 2 more NFTs
- Creates bundle at 0.03 ETH
- Wallet2 buys bundle
- ✅ Verifies both NFTs transferred

### Test 6: Laundering
- Checks laundering was triggered on high-value sales
- ✅ Verifies sale tracking

### Test 7: Stats
- Checks marketplace statistics
- Total sales, volume, fees
- ✅ Verifies all metrics correct

---

## Expected Results

### Smart Contracts
```
✅ 23/23 unit tests passing
✅ Deployment successful
✅ 7 integration tests passing
✅ Laundering triggered on sales > threshold
✅ Fees collected correctly
```

### Gas Costs (Actual on Testnet)
- Deployment: ~15-20M gas
- Create Listing: ~125k gas
- Buy Listing: ~337k gas
- Create Auction: ~202k gas
- Place Bid: ~279k gas
- Bundle Buy: ~516k gas

**Total test cost:** ~0.05-0.1 ETH on testnet

---

## Troubleshooting

### Issue: "PRIVATE_KEY not set"
**Solution:** Check your `.env` file exists and has the keys

### Issue: "Insufficient funds"
**Solution:** Ensure wallet1 has at least 0.1 ETH on Shape Sepolia

### Issue: "Diamond address not found"
**Solution:** Manually set `export DIAMOND_ADDRESS=0x...` from deployment output

### Issue: Tests fail
**Solution:** Check RPC is responding: `curl https://sepolia.shape.network`

---

## After Testing

If all tests pass:

1. ✅ **Smart contracts work**
2. ✅ **Marketplace is functional**
3. ✅ **Ready for frontend testing**

Next:
- Update `lib/web3.ts` with diamond address
- Test UI manually
- If all good, ready for mainnet!

---

## Quick Commands Reference

```bash
# Run unit tests only
forge test --match-contract RugMarketplaceTest

# Deploy only (no tests)
forge script script/DeployShapeSepolia.s.sol --rpc-url https://sepolia.shape.network --broadcast

# Run integration tests only (need DIAMOND_ADDRESS set)
export DIAMOND_ADDRESS=0x...
forge script script/TestMarketplace.s.sol --rpc-url https://sepolia.shape.network --broadcast

# Full automated flow
./test-marketplace.sh
```

---

**Ready to test? Just run `./test-marketplace.sh`!** 🚀

