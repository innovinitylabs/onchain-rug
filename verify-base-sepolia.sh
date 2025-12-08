#!/bin/bash

# Base Sepolia Contract Verification Script
# This script verifies all contracts on Base Sepolia

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CHAIN_ID=84532
VERIFIER_URL="https://api-sepolia.basescan.org/api"
RPC_URL="https://sepolia.base.org"

# Contract addresses (from .env - CURRENT DEPLOYMENT)
DIAMOND="0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff"
# Note: Infrastructure and pool addresses need to be retrieved from deployment logs
# or by querying the Diamond contract
DIAMOND_FRAME_POOL=""  # Update with actual address
FILE_STORE=""  # Update with actual address
SCRIPTY_STORAGE=""  # Update with actual address
SCRIPTY_BUILDER=""  # Update with actual address
HTML_GENERATOR=""  # Update with actual address

# Deployer address
DEPLOYER="0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F"

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
    
    echo -e "${YELLOW}Verifying $contract_name...${NC}"
    
    if [ -z "$constructor_args" ]; then
        forge verify-contract \
            "$address" \
            "$contract_path:$contract_name" \
            --chain-id "$CHAIN_ID" \
            --etherscan-api-key "$BASESCAN_API_KEY" \
            --verifier-url "$VERIFIER_URL" \
            --watch
    else
        forge verify-contract \
            "$address" \
            "$contract_path:$contract_name" \
            --chain-id "$CHAIN_ID" \
            --etherscan-api-key "$BASESCAN_API_KEY" \
            --verifier-url "$VERIFIER_URL" \
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

# 1. Verify FileStore
FILE_STORE_ARGS=$(cast abi-encode "constructor(address)" "0x4e59b44847b379578588920cA78FbF26c0B4956C")
verify_contract "$FILE_STORE" "src/scripty/dependencies/ethfs/FileStore.sol" "FileStore" "$FILE_STORE_ARGS"

# 2. Verify ScriptyStorageV2
SCRIPTY_STORAGE_ARGS=$(cast abi-encode "constructor(address,address)" "$FILE_STORE" "$DEPLOYER")
verify_contract "$SCRIPTY_STORAGE" "src/scripty/ScriptyStorageV2.sol" "ScriptyStorageV2" "$SCRIPTY_STORAGE_ARGS"

# 3. Verify ScriptyBuilderV2 (no constructor args)
verify_contract "$SCRIPTY_BUILDER" "src/scripty/ScriptyBuilderV2.sol" "ScriptyBuilderV2" ""

# 4. Verify OnchainRugsHTMLGenerator (no constructor args)
verify_contract "$HTML_GENERATOR" "src/OnchainRugsHTMLGenerator.sol" "OnchainRugsHTMLGenerator" ""

# 5. Verify DiamondFramePool
# Note: We need to get the actual DiamondCutFacet address first
# For now, we'll use a placeholder - you'll need to get it from deployment logs
echo -e "${YELLOW}Note: Diamond verification requires DiamondCutFacet address${NC}"
echo "To get facet addresses, run:"
echo "cast call $DIAMOND 'facets()' --rpc-url $RPC_URL"
echo ""

# Get DiamondCutFacet address (try common selectors)
DIAMOND_CUT_SELECTOR="0x1f931c1c" # diamondCut(bytes,address,bytes)
DIAMOND_CUT_FACET=$(cast call "$DIAMOND" "facetAddress(bytes4)" "$DIAMOND_CUT_SELECTOR" --rpc-url "$RPC_URL" 2>/dev/null || echo "")

if [ -n "$DIAMOND_CUT_FACET" ] && [ "$DIAMOND_CUT_FACET" != "0x0000000000000000000000000000000000000000" ]; then
    echo "Found DiamondCutFacet at: $DIAMOND_CUT_FACET"
    DIAMOND_ARGS=$(cast abi-encode "constructor(address,address)" "$DEPLOYER" "$DIAMOND_CUT_FACET")
    verify_contract "$DIAMOND" "src/diamond/Diamond.sol" "Diamond" "$DIAMOND_ARGS"
else
    echo -e "${RED}Could not find DiamondCutFacet address automatically${NC}"
    echo "Please get it from deployment logs and verify Diamond manually:"
    echo "forge verify-contract \\"
    echo "  $DIAMOND \\"
    echo "  src/diamond/Diamond.sol:Diamond \\"
    echo "  --chain-id $CHAIN_ID \\"
    echo "  --etherscan-api-key \$BASESCAN_API_KEY \\"
    echo "  --verifier-url $VERIFIER_URL \\"
    echo "  --constructor-args \$(cast abi-encode \"constructor(address,address)\" $DEPLOYER DIAMOND_CUT_FACET_ADDRESS)"
    echo ""
fi

# 6. Verify DiamondFramePool
POOL_ARGS=$(cast abi-encode "constructor(address,uint256)" "$DIAMOND" "100000000000000")
verify_contract "$DIAMOND_FRAME_POOL" "src/DiamondFramePool.sol" "DiamondFramePool" "$POOL_ARGS"

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Verification Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Note: Facet contracts need to be verified separately."
echo "Get facet addresses using: cast call $DIAMOND 'facets()' --rpc-url $RPC_URL"
echo ""
echo "Then verify each facet with:"
echo "forge verify-contract <FACET_ADDRESS> <CONTRACT_PATH>:<CONTRACT_NAME> \\"
echo "  --chain-id $CHAIN_ID \\"
echo "  --etherscan-api-key \$BASESCAN_API_KEY \\"
echo "  --verifier-url $VERIFIER_URL"

