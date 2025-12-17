# Shape L2 Deployment Guide - ERC-721-C & Payment Processor

## Overview

This guide explains how to deploy and configure LimitBreak's ERC-721-C infrastructure on Shape L2 using their developer tools at https://developers.apptokens.com/infrastructure.

## What You Need to Deploy

### **Already Deployed (Deterministic Addresses)**:
✅ **CreatorTokenTransferValidator** - `0x721C008fdff27BF06E7E123956E2Fe03B63342e3` (deployed on Shape L2)
✅ **Payment Processor V3.0.0** - `0x9a1D00000000fC540e2000560054812452eB5366` (deployed on Shape L2)
✅ **Payment Processor Configuration** - `0x9A1D00773287950891B8A48Be6f21e951EFF91b3` (deployed on Shape L2)
✅ **Collection Settings Registry** - `0x9A1D001A842c5e6C74b33F2aeEdEc07F0Cb20BC4` (deployed on Shape L2)

### **Via Your Scripts** (Your NFT collection):
1. **OnchainRugs Diamond** - Your ERC-721-C NFT contract

## Prerequisites

**🎉 ALL INFRASTRUCTURE IS ALREADY DEPLOYED ON SHAPE L2!**

You can deploy your OnchainRugs collection **IMMEDIATELY** - no website deployment required.

1. **Environment Setup**
   ```bash
   # Install dependencies (already done)
   forge install limitbreakinc/creator-token-contracts

   # Set your private key
   export PRIVATE_KEY=your_private_key_here

   # Infrastructure addresses (already deployed on Shape L2)
   export CREATOR_TOKEN_VALIDATOR_SHAPE=0x721C008fdff27BF06E7E123956E2Fe03B63342e3
   export PAYMENT_PROCESSOR_SHAPE=0x9a1D00000000fC540e2000560054812452eB5366
   export SHAPE_RPC=https://sepolia.shape.network
   ```

## 🚀 **Complete Deployment Checklist**

### **What You Deploy (4 contracts total):**

#### **Phase 1: Via LimitBreak Website** (3 contracts - trustless)
1. ✅ **CreatorTokenTransferValidator** - Transfer validation registry
2. ✅ **Payment Processor** - Marketplace royalty enforcement
3. ✅ **WNATIVE** (optional) - Wrapped native token for Shape

#### **Phase 2: Via Your Scripts** (1 contract - your NFT)
4. ✅ **OnchainRugs Diamond** - Your ERC-721-C NFT collection

---

## 🚀 **Deployment Steps (Super Simple!)**

### **Step 1: Set Environment Variables**

```bash
export PRIVATE_KEY=your_private_key_here
export CREATOR_TOKEN_VALIDATOR_SHAPE=0x721C008fdff27BF06E7E123956E2Fe03B63342e3
export PAYMENT_PROCESSOR_SHAPE=0x9a1D00000000fC540e2000560054812452eB5366
export SHAPE_RPC=https://sepolia.shape.network
```

### **Step 2: Deploy Your OnchainRugs Collection**

```bash
# One-command deployment - everything automated!
forge script script/DeployOnchainRugsToShape.s.sol \
  --rpc-url $SHAPE_RPC \
  --broadcast \
  --verify
```

**That's it!** 🎉

**What this single command does:**
- ✅ Deploys your OnchainRugs Diamond contract (ERC-721-C)
- ✅ Configures Payment Processor security policies
- ✅ Links to the deterministic Transfer Validator
- ✅ Sets up 5% royalty enforcement
- ✅ Enables transfer validation

### **Phase 2: Deploy Your NFT Collection (Via Scripts)**

After Payment Processor is deployed, you have two options:

#### **Option A: One-Command Deployment (Recommended)**

```bash
# Set environment variables with deployed addresses
export PAYMENT_PROCESSOR_SHAPE=0x2222...        # From website deployment
export CREATOR_TOKEN_VALIDATOR_SHAPE=0x721C008fdff27BF06E7E123956E2Fe03B63342e3  # Already deployed!
export SHAPE_RPC=https://sepolia.shape.network

# Deploy everything automatically
forge script script/DeployOnchainRugsToShape.s.sol \
  --rpc-url $SHAPE_RPC \
  --broadcast \
  --verify
```

**This single command will:**
- ✅ Configure Payment Processor security policies
- ✅ Deploy your OnchainRugs diamond contract
- ✅ Link to deterministic CreatorTokenTransferValidator
- ✅ Link validator and security policies
- ✅ Configure 5% royalties automatically

#### **Option B: Manual Step-by-Step**

If you prefer manual control:

```bash
# Step 1: Configure Payment Processor
forge script script/DeployPaymentProcessor.s.sol \
  --sig "configureForShape(address)" $PAYMENT_PROCESSOR_SHAPE \
  --rpc-url $SHAPE_RPC \
  --broadcast

# Step 2: Deploy NFT collection
forge script script/DeployShapeSepolia.s.sol \
  --rpc-url $SHAPE_RPC \
  --broadcast \
  --verify

# Step 3: Manual linking (see Phase 4 below)
```

**Save your diamond contract address** (e.g., `0xaaaa...`)

### **Phase 3: Configure Security Policies**

After deploying infrastructure, configure your collection's policies:

```bash
# Configure Payment Processor for your collection
forge script script/DeployPaymentProcessor.s.sol \
  --sig "configureForShape(address)" $PAYMENT_PROCESSOR_SHAPE \
  --rpc-url $SHAPE_RPC \
  --broadcast
```

This creates:
- ✅ Security policy for OnchainRugs collection
- ✅ Whitelisted ETH as payment method
- ✅ Returns a `securityPolicyId` (save this!)

### **Phase 4: Deploy Your ERC-721-C Collection**

Deploy your OnchainRugs collection with ERC-721-C integration:

```bash
forge script script/DeployShapeSepolia.s.sol \
  --rpc-url $SHAPE_RPC \
  --broadcast \
  --verify
```

The deployment automatically:
- ✅ Deploys ERC-721-C compatible NFT contract
- ✅ Sets up transfer validation
- ✅ Initializes security policies

## Step 5: Link Everything Together

After deployment, you need to connect your NFT contract to the Payment Processor:

### Option A: Using RugTransferSecurityFacet

```solidity
// Call these functions on your deployed diamond contract:

// 1. Set the Payment Processor security policy
RugTransferSecurityFacet(diamondAddress).setPaymentProcessorSecurityPolicy(securityPolicyId);

// 2. Configure royalties (EIP-2981)
RugCommerceFacet(diamondAddress).configureRoyalties(
    500, // 5% royalty
    [creatorAddress],
    [500]
);

// 3. Set pricing bounds (optional)
RugCommerceFacet(diamondAddress).setCollectionPricingBounds(
    0.01 ether,  // floor price
    10 ether,    // ceiling price
    false        // not immutable
);
```

### Option B: Direct Payment Processor Call

```solidity
// Link your collection to the security policy
IPaymentProcessor(paymentProcessorAddress).setCollectionSecurityPolicy(
    diamondAddress,  // Your NFT contract
    securityPolicyId // From step 3
);
```

## Step 6: Add Approved Marketplaces

If you want to restrict marketplaces, add them to the whitelist:

```solidity
// Using the CreatorTokenTransferValidator
CreatorTokenTransferValidator(validatorAddress).addOperatorToWhitelist(
    whitelistId,        // From validator deployment
    marketplaceAddress  // OpenSea, Blur, your marketplace, etc.
);
```

## Step 7: Test Everything

### Test Basic Transfers
```solidity
// Mint an NFT
RugNFTFacet(diamondAddress).mintRug(textRows, seed, palette, stripeData, characterMap, thickness, complexity, charCount, stripeCount);

// Transfer it (should work with validation)
IERC721(diamondAddress).transferFrom(user1, user2, tokenId);
```

### Test Marketplace Sales
```solidity
// Create a listing through Payment Processor
// This should enforce royalties automatically
PaymentProcessor(paymentProcessorAddress).buySingleListing(saleDetails, signedListing, signedOffer);
```

## Addresses You'll Need

### After Deployment, Save These:

```solidity
// Infrastructure (deployed by you or LimitBreak)
address constant CREATOR_TOKEN_VALIDATOR = 0x0000721C310194CcfC01E523fc93C9cCcFa2A0Ac; // Or your deployed one
address constant PAYMENT_PROCESSOR_SHAPE = 0x1234567890123456789012345678901234567890; // From LimitBreak tools

// Your contracts
address constant ONCHAIN_RUGS_DIAMOND = 0xabcdef123456789012345678901234567890abcdef; // Your diamond
uint256 constant SECURITY_POLICY_ID = 123; // From Payment Processor configuration
```

## Troubleshooting

### "Transfer validation failed"
- CreatorTokenTransferValidator not deployed on Shape
- Security level too restrictive
- Marketplace not whitelisted

### "Payment method not approved"
- Payment coin not whitelisted in Payment Processor policy
- Use `whitelistPaymentMethod()` to add more coins

### "Marketplace not authorized"
- Marketplace not in operator whitelist
- Use `addOperatorToWhitelist()` to approve marketplaces

## Security Considerations

### For Shape L2 Deployment:

1. **Start Permissive**: Use security level 1 initially
2. **Whitelist Gradually**: Add trusted marketplaces over time
3. **Test Extensively**: Shape L2 is new - test all scenarios
4. **Monitor Activity**: Watch for unusual transfer patterns
5. **Update Policies**: Be ready to tighten security if needed

### Recommended Initial Settings:

```solidity
// Security Level 1: Balanced approach
TransferSecurityLevels.One  // Operator whitelist with OTC enabled

// Payment Policy: Permissive
enforceExchangeWhitelist: false     // Any marketplace initially
enforcePaymentMethodWhitelist: true // Only ETH initially
enforcePricingConstraints: false    // No price restrictions
```

## Next Steps After Deployment

1. **Frontend Integration**: Update your marketplace UI
2. **Marketplace Partnerships**: Get listed on Shape marketplaces
3. **Community Building**: Educate users about enforced royalties
4. **Analytics**: Monitor royalty collection and transfer patterns
5. **Policy Updates**: Adjust security policies based on usage

## Support

- **LimitBreak Documentation**: https://developers.apptokens.com/
- **Shape L2 Documentation**: Check Shape's developer resources
- **Community**: Join NFT developer communities for Shape L2

---

**Congratulations!** 🎉 You've successfully deployed an ERC-721-C collection with enforceable royalties on Shape L2. Your NFTs now have programmable transfer controls and guaranteed royalty payments across all marketplaces.

