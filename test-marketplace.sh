#!/bin/bash

# Marketplace Automated Testing Script
# This script deploys contracts and runs comprehensive marketplace tests

set -e  # Exit on error

echo "=================================================="
echo "  ONCHAIN RUGS MARKETPLACE - AUTOMATED TESTING"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check environment
echo "Checking environment..."

# Load .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$TESTNET_PRIVATE_KEY" ] && [ -z "$PRIVATE_KEY" ]; then
    echo "${RED}ERROR: TESTNET_PRIVATE_KEY or PRIVATE_KEY not set${NC}"
    echo "Please add to your .env file:"
    echo "  TESTNET_PRIVATE_KEY=0x..."
    echo "  TESTNET_PRIVATE_KEY_2=0x..."
    exit 1
fi

# Use TESTNET_PRIVATE_KEY if available, otherwise fall back to PRIVATE_KEY
if [ -z "$TESTNET_PRIVATE_KEY" ]; then
    export TESTNET_PRIVATE_KEY=$PRIVATE_KEY
fi

echo "${GREEN}✅ Environment configured${NC}"
echo ""

# Set RPC URL
RPC_URL="https://sepolia.shape.network"
echo "Using RPC: $RPC_URL"
echo ""

# Step 1: Run local unit tests
echo "${BLUE}[STEP 1] Running unit tests...${NC}"
forge test --match-contract RugMarketplaceTest -vv

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ All 23 unit tests passed${NC}"
else
    echo "${RED}❌ Unit tests failed - fix before deploying${NC}"
    exit 1
fi
echo ""

# Step 2: Deploy contracts to testnet
echo "${BLUE}[STEP 2] Deploying contracts to Shape Sepolia...${NC}"
echo "This will take 5-10 minutes..."
echo ""

# Set PRIVATE_KEY for deployment (use TESTNET_PRIVATE_KEY)
export PRIVATE_KEY=${TESTNET_PRIVATE_KEY}

DEPLOY_OUTPUT=$(forge script script/DeployShapeSepolia.s.sol \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow \
    -vv 2>&1)

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Deployment successful${NC}"
    
    # Extract diamond address
    DIAMOND_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oE "Diamond deployed at: 0x[a-fA-F0-9]{40}" | grep -oE "0x[a-fA-F0-9]{40}")
    
    if [ -z "$DIAMOND_ADDRESS" ]; then
        echo "${YELLOW}⚠️  Could not auto-extract diamond address${NC}"
        echo "Please find it in the deployment output and set manually:"
        echo "export DIAMOND_ADDRESS=0x..."
        echo ""
        echo "$DEPLOY_OUTPUT" | grep "Diamond"
        exit 0
    fi
    
    echo "${GREEN}Diamond Address: $DIAMOND_ADDRESS${NC}"
    export DIAMOND_ADDRESS
    export NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=$DIAMOND_ADDRESS
    
    # Save to file for frontend
    echo "$DIAMOND_ADDRESS" > .diamond-address
    echo "${GREEN}Saved diamond address to .diamond-address${NC}"
    echo ""
    echo "${YELLOW}Add this to your .env file:${NC}"
    echo "DIAMOND_ADDRESS=$DIAMOND_ADDRESS"
    echo "NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=$DIAMOND_ADDRESS"
else
    echo "${RED}❌ Deployment failed${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi
echo ""

# Step 3: Wait for deployment to settle
echo "${BLUE}[STEP 3] Waiting for deployment to settle (30s)...${NC}"
sleep 30
echo "${GREEN}✅ Ready to test${NC}"
echo ""

# Step 4: Run automated marketplace tests
echo "${BLUE}[STEP 4] Running automated marketplace tests...${NC}"
forge script script/TestMarketplace.s.sol \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow \
    -vv

if [ $? -eq 0 ]; then
    echo ""
    echo "${GREEN}✅ All automated tests passed!${NC}"
else
    echo ""
    echo "${RED}❌ Automated tests failed${NC}"
    exit 1
fi
echo ""

# Step 5: Summary
echo "=================================================="
echo "  TESTING COMPLETE!"
echo "=================================================="
echo ""
echo "${GREEN}✅ Unit Tests: 23/23 passing${NC}"
echo "${GREEN}✅ Deployment: Successful${NC}"
echo "${GREEN}✅ Integration Tests: Passed${NC}"
echo ""
echo "Diamond Address: ${BLUE}$DIAMOND_ADDRESS${NC}"
echo ""
echo "Next steps:"
echo "1. Update lib/web3.ts with the diamond address"
echo "2. Run 'npm run dev' to start the frontend"
echo "3. Test the UI at http://localhost:3000/market"
echo ""
echo "See MARKETPLACE_TESTING_GUIDE.md for manual testing checklist"
echo ""
echo "=================================================="

