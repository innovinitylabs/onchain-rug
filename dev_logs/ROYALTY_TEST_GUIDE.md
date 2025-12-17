# Marketplace Royalty Enforcement Test Guide

## Overview
Your marketplace now automatically enforces creator royalties on all sales. This guide shows how to test this functionality on Shape Sepolia testnet.

## What Was Implemented
- ✅ **Automatic Royalty Deduction**: Sales deduct creator royalties before paying sellers
- ✅ **EIP-2981 Compliance**: Uses standard royalty information
- ✅ **Immediate Distribution**: Royalties paid directly to recipients
- ✅ **Marketplace Fees**: Separate from creator royalties

## Test Scenario
1. **Setup**: Mint NFT → Create listing → Buy NFT
2. **Verify**: Royalties paid to creators, seller gets proceeds minus fees/royalties

## Step-by-Step Testing

### 1. Check Current Royalty Configuration
```bash
cast call 0xa43532205Fc90b286Da98389a9883347Cc4064a8 \
  "getRoyaltyConfig()" \
  --rpc-url https://sepolia.shape.network
```

Expected output shows:
- Royalty percentage (e.g., 500 = 5%)
- Recipient addresses
- Royalty splits

### 2. Run Test Setup Script
```bash
forge script script/TestMarketplaceRoyalties.s.sol \
  --rpc-url https://sepolia.shape.network \
  --broadcast
```

This will:
- Check royalty configuration
- Mint a test NFT
- Create a marketplace listing
- Display listing details

### 3. Complete the Sale (Manual Step)
Switch to buyer account and execute the purchase:

```bash
# Get the token ID from step 2 output
TOKEN_ID=123  # Replace with actual token ID

# Buy the listing (send 0.01 ETH + gas)
cast send 0xa43532205Fc90b286Da98389a9883347Cc4064a8 \
  "buyListing(uint256)" $TOKEN_ID \
  --value 0.01ether \
  --rpc-url https://sepolia.shape.network \
  --private-key $BUYER_PRIVATE_KEY
```

### 4. Verify Royalty Enforcement

#### Check Royalty Payment
```bash
# Check recipient balance before/after sale
cast balance $ROYALTY_RECIPIENT \
  --rpc-url https://sepolia.shape.network
```

#### Calculate Expected Amounts
For a 0.01 ETH sale:
- **Royalty (5%)**: 0.0005 ETH → Paid to creator
- **Marketplace Fee (2.5%)**: 0.00025 ETH → Kept by marketplace
- **Seller Proceeds**: 0.00925 ETH → Paid to seller

#### Verify Seller Received Correct Amount
```bash
# Check seller balance change
SELLER_ADDRESS=0x...  # From listing details
cast balance $SELLER_ADDRESS \
  --rpc-url https://sepolia.shape.network
```

## Expected Results

### ✅ Successful Royalty Enforcement
- **Creator Royalty**: Automatically deducted and paid
- **Seller Payment**: Receives `price - royalty - marketplace_fee`
- **Marketplace Fee**: Collected separately
- **Transaction Success**: No reverts due to royalty enforcement

### 📊 Payment Flow
```
Buyer pays: 0.01 ETH
├── Creator Royalty: 0.0005 ETH (5%)
├── Marketplace Fee: 0.00025 ETH (2.5%)
└── Seller Receives: 0.00925 ETH (92.5%)
```

## Troubleshooting

### Issue: Sale Fails
- **Cause**: Insufficient royalty configuration
- **Fix**: Ensure `configureRoyalties()` was called with valid recipients

### Issue: Wrong Amounts
- **Cause**: Royalty percentage changed after listing
- **Fix**: Royalties calculated at sale time using current config

### Issue: No Royalty Payment
- **Cause**: `royaltyInfo()` returns (address(0), 0)
- **Fix**: Check royalty configuration is properly set

## Code Changes Made

### Modified `RugMarketplaceFacet.sol`
```solidity
function _processPayment(uint256 tokenId, address seller, uint256 price) internal {
    // Calculate marketplace fee
    uint256 marketplaceFee = (price * ms.marketplaceFeePercent) / 10000;

    // Calculate and distribute royalties immediately
    RugCommerceFacet commerceFacet = RugCommerceFacet(address(this));
    (address royaltyRecipient, uint256 royaltyAmount) = commerceFacet.royaltyInfo(tokenId, price);

    // Distribute royalties to recipient if configured
    if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
        (bool royaltySuccess, ) = royaltyRecipient.call{value: royaltyAmount}("");
        if (!royaltySuccess) revert TransferFailed();
    }

    // Calculate seller proceeds after fees and royalties
    uint256 totalDeductions = marketplaceFee + royaltyAmount;
    uint256 sellerProceeds = price - totalDeductions;

    // Process payments...
}
```

## Integration Benefits

- **🎨 Creator Protection**: Royalties paid regardless of marketplace
- **🔄 Automatic**: No manual royalty claims needed
- **⚡ Gas Efficient**: Single transaction handles everything
- **📊 Transparent**: On-chain royalty tracking
- **🔒 Compliant**: EIP-2981 standard implementation

Your marketplace now provides enforceable royalties just like major platforms! 🚀
