# Marketplace Testing Guide

## Current Status

✅ **Smart Contracts:** 23/23 tests passing  
✅ **Frontend:** Build successful, no TypeScript errors  
✅ **Ready for:** Testnet deployment and manual testing  

---

## Step 1: Deploy to Shape Sepolia Testnet

### Prerequisites
1. Shape Sepolia testnet ETH for gas
2. Private key with ETH loaded
3. Environment configured

### Deployment Command

```bash
cd /Users/valipokkann/Developer/onchain_rugs_working

# Set environment variables
export PRIVATE_KEY=your_private_key_here
export SHAPE_SEPOLIA_RPC=https://sepolia.shape.network

# Deploy contracts
forge script script/DeployShapeSepolia.s.sol \
  --rpc-url $SHAPE_SEPOLIA_RPC \
  --broadcast \
  --verify \
  -vvvv
```

### What Gets Deployed
1. FileStore (for on-chain storage)
2. ScriptyStorage & ScriptyBuilder
3. OnchainRugsHTMLGenerator
4. Diamond proxy contract
5. All facets including **RugMarketplaceFacet**
6. JavaScript libraries (p5.js, rug-algo.js)

**Expected time:** 5-10 minutes

### After Deployment

The deployment will output:
```
Diamond: 0x... <-- THIS IS YOUR CONTRACT ADDRESS
```

Update `/lib/web3.ts`:
```typescript
export const contractAddresses: Record<number, string> = {
  360: '0x...', // Shape Mainnet (keep existing)
  11011: '0x...' // ADD: Shape Sepolia (from deployment)
}
```

---

## Step 2: Start Frontend for Testing

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev
```

Visit: `http://localhost:3000`

---

## Step 3: Test Marketplace Flows

### Test Flow 1: Fixed-Price Listing

1. **Mint 2 test NFTs**
   - Go to `/generator`
   - Mint 2 rugs (will cost ~0.00003 ETH each)
   - Note their token IDs

2. **Create a listing**
   - Go to `/market`
   - Click on one of your NFTs
   - Click "Create Listing"
   - Set price: `0.01 ETH`
   - Set duration: `7 days`
   - Confirm transaction

3. **Verify listing appears**
   - Should show "FOR SALE" badge
   - Should display price
   - Should appear in "Showcased for Sale" tab in `/portfolio`

4. **Buy the listing (from different wallet)**
   - Switch to a different wallet in MetaMask
   - Click the listed NFT
   - Click "Buy Now"
   - Confirm transaction
   - Verify ownership transferred
   - Check if laundering triggered (if price > threshold)

### Test Flow 2: Auction

1. **Create auction**
   - Go to your portfolio
   - Select an NFT
   - Click "Create Auction"
   - Start price: `0.005 ETH`
   - Reserve price: `0.02 ETH` (optional)
   - Duration: `1 day`
   - Enable auto-extend: ✅
   - Confirm transaction

2. **Place bids**
   - Switch to different wallet
   - Click the auctioned NFT
   - Place bid >= start price
   - Switch wallets, outbid yourself
   - Verify previous bidder got refunded

3. **Test auto-extend (if enabled)**
   - Place bid in last 10 minutes
   - Verify auction extends by 10 minutes

4. **Finalize auction**
   - Wait for auction to end (or fast-forward time in testing)
   - Click "Finalize" or call from any wallet
   - Verify NFT transferred to highest bidder
   - Verify seller received payment minus fees

### Test Flow 3: Offers

1. **Make an offer**
   - Browse market
   - Find an unlisted NFT
   - Click "Make Offer"
   - Offer: `0.008 ETH`
   - Duration: `7 days`
   - Confirm (ETH will be escrowed)

2. **View received offers (as owner)**
   - Go to `/portfolio`
   - Click "Interest Received" tab
   - Should see the offer

3. **Accept offer**
   - Click "Accept" on the offer
   - Confirm transaction
   - Verify NFT transferred
   - Verify offerer received NFT
   - Verify you received ETH

4. **Cancel offer**
   - Make another offer
   - Go to "Interest Expressed" tab
   - Click "Withdraw"
   - Verify ETH refunded

### Test Flow 4: Bundles

1. **Create bundle**
   - Own 2+ NFTs
   - Select 2 NFTs in portfolio
   - (Feature needs UI - can test via contract directly)
   - Bundle price: `0.03 ETH`

2. **Buy bundle**
   - See bundle in market
   - Click "Buy Bundle"
   - Pay bundle price
   - Verify all NFTs transferred

### Test Flow 5: Bulk Operations

1. **Bulk list**
   - Go to portfolio
   - Select 3+ NFTs (checkboxes)
   - Click "Showcase Selected"
   - Set price for each
   - Confirm transaction
   - Verify all listings created

---

## Step 4: Verify Marketplace Features

### Check Marketplace Stats
- `/market` should show:
  - Floor price (lowest listing)
  - Total volume
  - Total sales count
  - Marketplace fee

### Check Activity Feed
- Sidebar should show recent events:
  - Sales
  - New listings
  - Bids placed
  - Offers made
- Auto-refreshes every 30 seconds

### Check Portfolio
- `/portfolio` should show:
  - Your total collection
  - Pieces showcased for sale
  - Interest received (offers)
  - Interest expressed (your offers)

---

## Step 5: Test Laundering Integration

### Laundering Trigger Test

1. **Check laundering threshold**
   - Default: `0.00001 ETH`
   - Can be updated by contract owner

2. **Create high-value sale**
   - List NFT for `0.1 ETH` (well above threshold)
   - Ensure this is higher than last 3 sales
   - Complete sale

3. **Verify laundering**
   - Check NFT after sale
   - Dirt level should be 0
   - Aging level should be 0
   - Laundering count should increment

---

## Step 6: Test on Mobile

- Open on mobile browser
- Test responsive design
- Verify modals work
- Test touch interactions

---

## Troubleshooting

### Issue: "Not owner" errors
**Solution:** Ensure you're connected with the wallet that owns the NFT

### Issue: "Listing expired"
**Solution:** Expired listings need to be recreated

### Issue: "Insufficient payment"
**Solution:** Ensure you're sending enough ETH (including gas)

### Issue: Activity feed empty
**Solution:** Activity feed requires event indexing (coming in Phase 2)

### Issue: Floor price shows N/A
**Solution:** No active listings yet, or needs backend indexing

---

## Gas Costs (Estimated on Shape L2)

- Create Listing: ~125k gas (~$0.01 at 0.1 gwei)
- Buy Listing: ~337k gas (~$0.03)
- Create Auction: ~202k gas (~$0.02)
- Place Bid: ~279k gas (~$0.03)
- Make Offer: ~259k gas (~$0.02)
- Accept Offer: ~434k gas (~$0.04)
- Bulk List (2): ~229k gas (~$0.02)

**Total cost for full test:** ~$0.20-0.30

---

## Success Criteria

### Smart Contracts
- [x] 23/23 tests passing
- [ ] Deployed to testnet
- [ ] Marketplace initialized
- [ ] Test listing created
- [ ] Test sale completed
- [ ] Test auction completed
- [ ] Fees collected correctly
- [ ] Laundering triggered

### Frontend
- [x] Build successful
- [ ] Market page loads
- [ ] Portfolio page loads
- [ ] Can create listings
- [ ] Can buy listings
- [ ] Can make offers
- [ ] Can create auctions
- [ ] Stats display correctly
- [ ] Mobile responsive

### Integration
- [ ] Alchemy API working
- [ ] Wallet connection working
- [ ] Transactions execute
- [ ] Events emitted
- [ ] UI updates after transactions
- [ ] Error handling works

---

## Known Issues / Future Enhancements

### Current Limitations
- Activity feed placeholder (needs event indexing)
- Floor price calculation (needs indexing)
- Price filtering (needs indexing)
- No real-time price updates (needs WebSocket)

### Phase 2 Features
- Event indexing service (TheGraph or custom)
- Advanced analytics dashboard
- Real-time notifications
- Social features (comments, shares)
- Mobile app
- Bulk actions UI improvements

---

## Next Steps After Testing

1. **If tests pass:** Merge to main, deploy to mainnet
2. **If issues found:** Fix and retest
3. **Phase 2:** Add event indexing and analytics

---

## Support

If you encounter issues:
1. Check console for errors
2. Verify wallet connection
3. Check testnet ETH balance
4. Verify contract deployment succeeded
5. Check transaction on block explorer

---

*Happy testing! You've built a full-featured NFT marketplace! 🎨*

