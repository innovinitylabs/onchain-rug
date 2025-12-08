#!/bin/bash

# Complete Contract Verification Script for Base Sepolia
# This script verifies all contracts including Diamond and all facets

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
CHAIN_ID=84532
VERIFIER_URL="https://api-sepolia.basescan.org/api"
RPC_URL="https://sepolia.base.org"

# Contract addresses
DIAMOND="0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff"
DEPLOYER="0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F"

# Facet addresses (discovered from Diamond)
DIAMOND_CUT_FACET="0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05"
DIAMOND_LOUPE_FACET="0xea06dbacddade92e50283cefd5f21ead03583fba"
RUG_NFT_FACET="0xc9142ef2681cb63552c0f5311534abddc8c22922"
RUG_ADMIN_FACET="0xf996b3a229754e3632def40c6079de151fe44334"
RUG_AGING_FACET="0x58e1760c15f5a004715c91e64e8c1d14f64393cc"
RUG_MAINTENANCE_FACET="0xbb4e6a1705b10b53eb56e0289cb58a0d5d4deaa8"
RUG_COMMERCE_FACET="0x225809e163c335da4625c4a206cbcb6a86e53a54"
RUG_LAUNDERING_FACET="0xe9d0b95a1dea62e74844eee8f3430d61114466b0"
RUG_TRANSFER_SECURITY_FACET="0xe113d62563e5bef766f5ca588f119ae3741bf458"
RUG_MARKETPLACE_FACET="0x0f806e5baded1705bd2bc2df4cb59ce1733e77d2"

# Check for API key
if [ -z "$BASESCAN_API_KEY" ]; then
    echo -e "${RED}ERROR: BASESCAN_API_KEY not set!${NC}"
    echo "Get your API key from: https://basescan.org/myapikey"
    echo "Then run: export BASESCAN_API_KEY=your_key_here"
    exit 1
fi

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Base Sepolia Contract Verification${NC}"
echo -e "${GREEN}=========================================${NC}"
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
            "$address" \
            "$contract_path:$contract_name" \
            --chain base-sepolia \
            --num-of-optimizations 10 \
            --compiler-version 0.8.22 \
            --watch 2>&1 | tee -a verification.log
    else
        forge verify-contract \
            "$address" \
            "$contract_path:$contract_name" \
            --chain base-sepolia \
            --num-of-optimizations 10 \
            --compiler-version 0.8.22 \
            --constructor-args "$constructor_args" \
            --watch 2>&1 | tee -a verification.log
    fi
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✓ $contract_name verified successfully${NC}"
    else
        echo -e "${RED}✗ $contract_name verification failed (check verification.log)${NC}"
    fi
    echo ""
}

# Start verification log
echo "Verification started at $(date)" > verification.log

# 1. Verify Diamond Contract
echo -e "${GREEN}=== Verifying Diamond Contract ===${NC}"
DIAMOND_ARGS=$(cast abi-encode "constructor(address,address)" "$DEPLOYER" "$DIAMOND_CUT_FACET")
verify_contract "$DIAMOND" "src/diamond/Diamond.sol" "Diamond" "$DIAMOND_ARGS"

# 2. Verify Facets
echo -e "${GREEN}=== Verifying Facets ===${NC}"

# DiamondCutFacet (no constructor)
verify_contract "$DIAMOND_CUT_FACET" "src/diamond/facets/DiamondCutFacet.sol" "DiamondCutFacet" ""

# DiamondLoupeFacet (no constructor)
verify_contract "$DIAMOND_LOUPE_FACET" "src/diamond/facets/DiamondLoupeFacet.sol" "DiamondLoupeFacet" ""

# RugNFTFacet (no constructor)
verify_contract "$RUG_NFT_FACET" "src/facets/RugNFTFacet.sol" "RugNFTFacet" ""

# RugAdminFacet (no constructor)
verify_contract "$RUG_ADMIN_FACET" "src/facets/RugAdminFacet.sol" "RugAdminFacet" ""

# RugAgingFacet (no constructor)
verify_contract "$RUG_AGING_FACET" "src/facets/RugAgingFacet.sol" "RugAgingFacet" ""

# RugMaintenanceFacet (no constructor)
verify_contract "$RUG_MAINTENANCE_FACET" "src/facets/RugMaintenanceFacet.sol" "RugMaintenanceFacet" ""

# RugCommerceFacet (no constructor)
verify_contract "$RUG_COMMERCE_FACET" "src/facets/RugCommerceFacet.sol" "RugCommerceFacet" ""

# RugLaunderingFacet (no constructor)
verify_contract "$RUG_LAUNDERING_FACET" "src/facets/RugLaunderingFacet.sol" "RugLaunderingFacet" ""

# RugTransferSecurityFacet (no constructor)
verify_contract "$RUG_TRANSFER_SECURITY_FACET" "src/facets/RugTransferSecurityFacet.sol" "RugTransferSecurityFacet" ""

# RugMarketplaceFacet (no constructor)
verify_contract "$RUG_MARKETPLACE_FACET" "src/facets/RugMarketplaceFacet.sol" "RugMarketplaceFacet" ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Verification Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Note: Infrastructure contracts (FileStore, ScriptyStorage, etc.)"
echo "and DiamondFramePool need to be verified separately if deployed."
echo "Check verification.log for detailed results."

