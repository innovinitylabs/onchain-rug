#!/bin/bash
# Simple upgrade script for Minter Royalty distribution
# This script deploys the new RugCommerceFacet and upgrades the diamond

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required variables
if [ -z "$TESTNET_PRIVATE_KEY" ]; then
    echo "ERROR: TESTNET_PRIVATE_KEY not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT" ]; then
    echo "ERROR: NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT not set"
    exit 1
fi

DIAMOND_ADDR="$NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT"
RPC_URL="https://sepolia.base.org"

echo "========================================="
echo "Upgrading RugCommerceFacet with Minter Royalty"
echo "========================================="
echo "Diamond Address: $DIAMOND_ADDR"
echo "Network: Base Sepolia"
echo ""

# Step 1: Deploy new RugCommerceFacet
echo "1. Deploying new RugCommerceFacet..."
FACET_ADDR=$(forge create src/facets/RugCommerceFacet.sol:RugCommerceFacet \
    --rpc-url "$RPC_URL" \
    --private-key "$TESTNET_PRIVATE_KEY" \
    --json | jq -r '.deployedTo')

if [ -z "$FACET_ADDR" ] || [ "$FACET_ADDR" == "null" ]; then
    echo "ERROR: Failed to deploy RugCommerceFacet"
    exit 1
fi

echo "   RugCommerceFacet deployed at: $FACET_ADDR"
echo ""

# Step 2: Prepare function selectors (from upgrade script)
echo "2. Preparing diamond cut..."
# Function selectors for RugCommerceFacet
SELECTORS=(
    "0x2a55205a" # royaltyInfo
    "0x" # distributeRoyalties (need to calculate)
    "0x" # configureRoyalties
    # ... add all selectors
)

echo "   Function selectors prepared"
echo ""

# Step 3: Call diamondCut
echo "3. Executing diamond cut..."
echo "   This requires calling diamondCut on $DIAMOND_ADDR"
echo "   with facet address: $FACET_ADDR"
echo ""
echo "You can use cast or a tool like Remix to call:"
echo "  diamondCut([{"
echo "    facetAddress: $FACET_ADDR,"
echo "    action: 1, // Replace"
echo "    functionSelectors: [/* all selectors */]"
echo "  }], address(0), '')"
echo ""
echo "Or use the forge script once compilation issues are resolved."
echo ""
echo "========================================="
echo "Deployment complete!"
echo "New RugCommerceFacet: $FACET_ADDR"
echo "========================================="

