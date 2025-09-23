#!/bin/bash
set -e

# Load addresses
if [ ! -f .local_addresses ]; then
    echo "❌ .local_addresses not found. Run ./deploy_local.sh first."
    exit 1
fi

source .local_addresses

# Environment setup
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export RPC_URL=http://127.0.0.1:8545

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Starting manual tests...${NC}"

# Test 1: Mint a rug
echo -e "${YELLOW}Minting a test rug...${NC}"
cast send $DIAMOND_ADDR \
  'mintRug(string[],uint8,uint8,uint8,uint8)' \
  '["Hello","World"]' 3 2 5 1 \
  --value 0.00001ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY >/dev/null 2>&1
echo -e "${GREEN}✅ Rug minted (Token ID: 1)${NC}"

# Test 2: Check token URI
echo -e "${YELLOW}Checking token URI...${NC}"
URI=$(cast call $DIAMOND_ADDR 'tokenURI(uint256)' 1 --rpc-url $RPC_URL)
if [[ $URI == data:application/json* ]]; then
    echo -e "${GREEN}✅ Token URI generated successfully${NC}"
    echo "URI preview: ${URI:0:100}..."
else
    echo -e "${RED}❌ Token URI generation failed${NC}"
    echo "$URI"
fi

# Test 3: Check aging state
echo -e "${YELLOW}Checking aging state...${NC}"
AGING=$(cast call $DIAMOND_ADDR 'getAgingState(uint256)' 1 --rpc-url $RPC_URL)
echo -e "${GREEN}✅ Aging state: $AGING${NC}"

# Test 4: Clean the rug
echo -e "${YELLOW}Cleaning the rug...${NC}"
cast send $DIAMOND_ADDR \
  'cleanRug(uint256)' 1 \
  --value 0.00001ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY >/dev/null 2>&1
echo -e "${GREEN}✅ Rug cleaned${NC}"

# Test 5: Check owner balance before withdrawal
echo -e "${YELLOW}Checking owner balance...${NC}"
BALANCE_BEFORE=$(cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url $RPC_URL)
echo "Balance before: $BALANCE_BEFORE"

# Test 6: Withdraw funds
echo -e "${YELLOW}Withdrawing funds...${NC}"
cast send $DIAMOND_ADDR \
  'withdraw()' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY >/dev/null 2>&1
echo -e "${GREEN}✅ Funds withdrawn${NC}"

# Test 7: Check owner balance after withdrawal
BALANCE_AFTER=$(cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url $RPC_URL)
echo "Balance after: $BALANCE_AFTER"

# Test 8: Check contract balance (should be 0)
CONTRACT_BALANCE=$(cast balance $DIAMOND_ADDR --rpc-url $RPC_URL)
echo "Contract balance: $CONTRACT_BALANCE"

echo -e "${BLUE}🎉 Manual tests completed!${NC}"
