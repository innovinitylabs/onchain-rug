#!/bin/bash
# Call diamondCut to upgrade RugCommerceFacet

set -e

export $(grep -E "^TESTNET_PRIVATE_KEY=|^NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=" .env 2>/dev/null | xargs)

FACET_ADDR="0xf2880078B087fdeb1ba3a4E24aeC5BB9DF29e392"
DIAMOND_ADDR="$NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT"
RPC_URL="https://sepolia.base.org"

# Function selectors (26 total)
SELECTORS=(
    "0x2a55205a" # royaltyInfo
    "0x7bdcdea0" # distributeRoyalties
    "0x19cf6c3d" # configureRoyalties
    "0x801d06d9" # getRoyaltyConfig
    "0x9baa0de5" # getRoyaltyRecipients
    "0xa154dfe8" # calculateRoyalty
    "0xa246abca" # areRoyaltiesConfigured
    "0xa69ba4b1" # claimPendingRoyalties
    "0xa8275ada" # getPendingRoyalties
    "0xa9050f8d" # setPoolContract
    "0xb0d96580" # setPoolPercentage
    "0xc1b79eae" # getPoolConfig
    "0xc903e479" # emergencyWithdrawFromPool
    "0xda410a09" # claimPoolRoyalties
    "0xe05d541d" # withdraw
    "0xee605963" # withdrawTo
    "0xfd41928d" # getBalance
    "0x2647f8e7" # setCollectionPricingBounds
    "0x25c43cc4" # setTokenPricingBounds
    "0x205c2878" # setApprovedPaymentCoin
    "0x2e1a7d4d" # getCollectionPricingBounds
    "0x59c3f3e0" # getTokenPricingBounds
    "0x133b0975" # isCollectionPricingImmutable
    "0x12065fe0" # isTokenPricingImmutable
    "0x024fa0d6" # getApprovedPaymentCoin
    "0x" # getSaleHistory (need to get this)
)

# Build the calldata using cast
echo "Calling diamondCut on $DIAMOND_ADDR..."
echo "New facet: $FACET_ADDR"

# Use cast to encode and send
cast send "$DIAMOND_ADDR" \
  "diamondCut((address,uint8,bytes4[])[],address,bytes)" \
  "([(\"$FACET_ADDR\",1,[0x2a55205a,0x7bdcdea0,0x19cf6c3d,0x801d06d9,0x9baa0de5,0xa154dfe8,0xa246abca,0xa69ba4b1,0xa8275ada,0xa9050f8d,0xb0d96580,0xc1b79eae,0xc903e479,0xda410a09,0xe05d541d,0xee605963,0xfd41928d,0x2647f8e7,0x25c43cc4,0x205c2878,0x2e1a7d4d,0x59c3f3e0,0x133b0975,0x12065fe0,0x024fa0d6])],0x0000000000000000000000000000000000000000,0x)" \
  --rpc-url "$RPC_URL" \
  --private-key "$TESTNET_PRIVATE_KEY"

echo ""
echo "Upgrade complete!"

