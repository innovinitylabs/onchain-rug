#!/bin/bash

# Base Sepolia Contract Verification Script for Blockscout
# This script verifies all contracts on Base Sepolia using Blockscout

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RPC_URL="https://sepolia-preconf.base.org"
VERIFIER_URL="https://base-sepolia.blockscout.com/api/"
DEPLOYER="0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F"

# Load API key from .env if it exists
# Blockscout doesn't require an API key, but forge still checks for BASESCAN_API_KEY
if [ -f .env ]; then
    # Extract API keys from .env file (handles comments and whitespace)
    if [ -z "$BASESCAN_API_KEY" ]; then
        BASESCAN_API_KEY=$(grep -E "^BASESCAN_API_KEY=" .env 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs || echo "")
    fi
    if [ -z "$ETHERSCAN_API_KEY" ]; then
        ETHERSCAN_API_KEY=$(grep -E "^ETHERSCAN_API_KEY=" .env 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs || echo "")
    fi
fi

# Use BASESCAN_API_KEY or ETHERSCAN_API_KEY from .env, or set dummy value
export BASESCAN_API_KEY="${BASESCAN_API_KEY:-${ETHERSCAN_API_KEY:-dummy}}"

if [ "$BASESCAN_API_KEY" != "dummy" ]; then
    echo -e "${GREEN}Using API key from .env${NC}"
fi

# Main Diamond Contract
DIAMOND="0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff"
DIAMOND_CUT_FACET="0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05"

# Facet Addresses (from VERIFICATION_STATUS.md)
DIAMOND_CUT_FACET_ADDR="0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05"
DIAMOND_LOUPE_FACET_ADDR="0xea06dbacddade92e50283cefd5f21ead03583fba"
RUG_NFT_FACET_ADDR="0xc9142ef2681cb63552c0f5311534abddc8c22922"
RUG_ADMIN_FACET_ADDR="0xf996b3a229754e3632def40c6079de151fe44334"
RUG_AGING_FACET_ADDR="0x58e1760c15f5a004715c91e64e8c1d14f64393cc"
RUG_MAINTENANCE_FACET_ADDR="0xbb4e6a1705b10b53eb56e0289cb58a0d5d4deaa8"
RUG_COMMERCE_FACET_ADDR="0x225809e163c335da4625c4a206cbcb6a86e53a54"
RUG_LAUNDERING_FACET_ADDR="0xe9d0b95a1dea62e74844eee8f3430d61114466b0"
RUG_TRANSFER_SECURITY_FACET_ADDR="0xe113d62563e5bef766f5ca588f119ae3741bf458"
RUG_MARKETPLACE_FACET_ADDR="0x0f806e5baded1705bd2bc2df4cb59ce1733e77d2"

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Base Sepolia Blockscout Verification${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}RPC URL:${NC} $RPC_URL"
echo -e "${BLUE}Verifier URL:${NC} $VERIFIER_URL"
echo -e "${BLUE}Diamond Address:${NC} $DIAMOND"
echo ""

# Function to verify a contract
verify_contract() {
    local address=$1
    local contract_path=$2
    local contract_name=$3
    local constructor_args=$4
    
    echo -e "${YELLOW}Verifying $contract_name at $address...${NC}"
    
    if [ -z "$constructor_args" ]; then
        forge verify-contract \
            --rpc-url "$RPC_URL" \
            --verifier blockscout \
            --verifier-url "$VERIFIER_URL" \
            "$address" \
            "$contract_path:$contract_name" \
            --watch
    else
        forge verify-contract \
            --rpc-url "$RPC_URL" \
            --verifier blockscout \
            --verifier-url "$VERIFIER_URL" \
            "$address" \
            "$contract_path:$contract_name" \
            --constructor-args "$constructor_args" \
            --watch
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $contract_name verified successfully${NC}"
    else
        echo -e "${RED}✗ $contract_name verification failed${NC}"
    fi
    echo ""
}

# Verify Diamond Contract (with constructor args)
echo -e "${BLUE}=== Verifying Diamond Contract ===${NC}"
DIAMOND_CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address,address)" "$DEPLOYER" "$DIAMOND_CUT_FACET")
verify_contract "$DIAMOND" "src/diamond/Diamond.sol" "Diamond" "$DIAMOND_CONSTRUCTOR_ARGS"

# Verify Facets (no constructor args)
echo -e "${BLUE}=== Verifying Facet Contracts ===${NC}"

verify_contract "$DIAMOND_CUT_FACET_ADDR" "src/diamond/facets/DiamondCutFacet.sol" "DiamondCutFacet" ""
verify_contract "$DIAMOND_LOUPE_FACET_ADDR" "src/diamond/facets/DiamondLoupeFacet.sol" "DiamondLoupeFacet" ""
verify_contract "$RUG_NFT_FACET_ADDR" "src/facets/RugNFTFacet.sol" "RugNFTFacet" ""
verify_contract "$RUG_ADMIN_FACET_ADDR" "src/facets/RugAdminFacet.sol" "RugAdminFacet" ""
verify_contract "$RUG_AGING_FACET_ADDR" "src/facets/RugAgingFacet.sol" "RugAgingFacet" ""
verify_contract "$RUG_MAINTENANCE_FACET_ADDR" "src/facets/RugMaintenanceFacet.sol" "RugMaintenanceFacet" ""
verify_contract "$RUG_COMMERCE_FACET_ADDR" "src/facets/RugCommerceFacet.sol" "RugCommerceFacet" ""
verify_contract "$RUG_LAUNDERING_FACET_ADDR" "src/facets/RugLaunderingFacet.sol" "RugLaunderingFacet" ""
verify_contract "$RUG_TRANSFER_SECURITY_FACET_ADDR" "src/facets/RugTransferSecurityFacet.sol" "RugTransferSecurityFacet" ""
verify_contract "$RUG_MARKETPLACE_FACET_ADDR" "src/facets/RugMarketplaceFacet.sol" "RugMarketplaceFacet" ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Verification Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "View verified contracts on Blockscout:"
echo "  Diamond: https://base-sepolia.blockscout.com/address/$DIAMOND"
echo ""

