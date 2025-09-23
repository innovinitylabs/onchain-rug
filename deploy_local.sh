#!/bin/bash
set -e

# Environment setup
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export RPC_URL=http://127.0.0.1:8545

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting complete local deployment...${NC}"

# Step 1: Deploy FileStore
echo -e "${YELLOW}📦 Deploying FileStore...${NC}"
FILESTORE_ADDR=$(forge create src/scripty/dependencies/ethfs/FileStore.sol:FileStore \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --json | jq -r '.deployedTo')
echo -e "${GREEN}✅ FileStore deployed at: $FILESTORE_ADDR${NC}"

# Step 2: Deploy ScriptyStorageV2
echo -e "${YELLOW}📦 Deploying ScriptyStorageV2...${NC}"
SCRIPTY_STORAGE_ADDR=$(forge create src/scripty/ScriptyStorageV2.sol:ScriptyStorageV2 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args $FILESTORE_ADDR 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --json | jq -r '.deployedTo')
echo -e "${GREEN}✅ ScriptyStorageV2 deployed at: $SCRIPTY_STORAGE_ADDR${NC}"

# Step 3: Deploy ScriptyBuilderV2
echo -e "${YELLOW}📦 Deploying ScriptyBuilderV2...${NC}"
SCRIPTY_BUILDER_ADDR=$(forge create src/scripty/ScriptyBuilderV2.sol:ScriptyBuilderV2 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --json | jq -r '.deployedTo')
echo -e "${GREEN}✅ ScriptyBuilderV2 deployed at: $SCRIPTY_BUILDER_ADDR${NC}"

# Step 4: Deploy OnchainRugsHTMLGenerator
echo -e "${YELLOW}📦 Deploying OnchainRugsHTMLGenerator...${NC}"
HTML_GENERATOR_ADDR=$(forge create src/OnchainRugsHTMLGenerator.sol:OnchainRugsHTMLGenerator \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --json | jq -r '.deployedTo')
echo -e "${GREEN}✅ OnchainRugsHTMLGenerator deployed at: $HTML_GENERATOR_ADDR${NC}"

# Step 6: Upload JS libraries
echo -e "${YELLOW}📤 Uploading JavaScript libraries...${NC}"

# Upload p5.js library
echo -e "${BLUE}Uploading rug-p5.js...${NC}"
cast send $SCRIPTY_STORAGE_ADDR \
  'createContent(string,bytes)' \
  'rug-p5.js' \
  '' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY >/dev/null 2>&1

# Get p5 content and upload in chunks
P5_CONTENT=$(cat data/rug-p5.js)
P5_BYTES=$(echo -n "$P5_CONTENT" | wc -c)
echo "rug-p5.js size: $P5_BYTES bytes"

# Upload in 20KB chunks
CHUNK_SIZE=20000
TOTAL_CHUNKS=$(( ($P5_BYTES + $CHUNK_SIZE - 1) / $CHUNK_SIZE ))
echo "Uploading $TOTAL_CHUNKS chunks..."

for ((i=0; i<TOTAL_CHUNKS; i++)); do
  START=$((i * CHUNK_SIZE))
  END=$((START + CHUNK_SIZE))
  if [ $END -gt $P5_BYTES ]; then END=$P5_BYTES; fi
  CHUNK=$(echo -n "$P5_CONTENT" | dd bs=1 skip=$START count=$((END-START)) 2>/dev/null)

  cast send $SCRIPTY_STORAGE_ADDR \
    'addChunkToContent(string,bytes)' \
    'rug-p5.js' \
    "$CHUNK" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY >/dev/null 2>&1
  echo -n "."
done
echo ""

# Freeze p5.js content
cast send $SCRIPTY_STORAGE_ADDR \
  'freezeContent(string)' \
  'rug-p5.js' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY >/dev/null 2>&1
echo -e "${GREEN}✅ rug-p5.js uploaded and frozen${NC}"

# Upload algorithm library
echo -e "${BLUE}Uploading rug-algo.js...${NC}"
cast send $SCRIPTY_STORAGE_ADDR \
  'createContent(string,bytes)' \
  'rug-algo.js' \
  '' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY >/dev/null 2>&1

# Get algo content and upload in chunks
ALGO_CONTENT=$(cat data/rug-algo.js)
ALGO_BYTES=$(echo -n "$ALGO_CONTENT" | wc -c)
echo "rug-algo.js size: $ALGO_BYTES bytes"

# Upload in 20KB chunks
TOTAL_CHUNKS=$(( ($ALGO_BYTES + $CHUNK_SIZE - 1) / $CHUNK_SIZE ))
echo "Uploading $TOTAL_CHUNKS chunks..."

for ((i=0; i<TOTAL_CHUNKS; i++)); do
  START=$((i * CHUNK_SIZE))
  END=$((START + CHUNK_SIZE))
  if [ $END -gt $ALGO_BYTES ]; then END=$ALGO_BYTES; fi
  CHUNK=$(echo -n "$ALGO_CONTENT" | dd bs=1 skip=$START count=$((END-START)) 2>/dev/null)

  cast send $SCRIPTY_STORAGE_ADDR \
    'addChunkToContent(string,bytes)' \
    'rug-algo.js' \
    "$CHUNK" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY >/dev/null 2>&1
  echo -n "."
done
echo ""

# Freeze algo.js content
cast send $SCRIPTY_STORAGE_ADDR \
  'freezeContent(string)' \
  'rug-algo.js' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY >/dev/null 2>&1
echo -e "${GREEN}✅ rug-algo.js uploaded and frozen${NC}"

# Step 7: Deploy Diamond system
echo -e "${YELLOW}💎 Deploying Diamond system...${NC}"
DIAMOND_OUTPUT=$(forge script script/DeployRugDiamond.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --json)

# Extract diamond address from output
DIAMOND_ADDR=$(echo "$DIAMOND_OUTPUT" | jq -r '.returns.diamond.new')

if [ -z "$DIAMOND_ADDR" ] || [ "$DIAMOND_ADDR" = "null" ]; then
  echo -e "${RED}❌ Failed to extract diamond address${NC}"
  echo "$DIAMOND_OUTPUT"
  exit 1
fi

echo -e "${GREEN}✅ Diamond deployed at: $DIAMOND_ADDR${NC}"

# Step 8: Configure Scripty contracts in diamond
echo -e "${YELLOW}⚙️  Configuring Scripty contracts...${NC}"
cast send $DIAMOND_ADDR \
  'setScriptyContracts(address,address,address)' \
  $SCRIPTY_BUILDER_ADDR \
  $SCRIPTY_STORAGE_ADDR \
  $HTML_GENERATOR_ADDR \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY >/dev/null 2>&1
echo -e "${GREEN}✅ Scripty contracts configured${NC}"

# Step 9: Run integration tests
echo -e "${YELLOW}🧪 Running integration tests...${NC}"
forge test --match-path test/RugDiamondIntegrationTest.sol \
  -v \
  --rpc-url $RPC_URL

# Step 10: Summary
echo -e "${BLUE}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}Contract Addresses:${NC}"
echo "CREATE2Deployer:     $CREATE2_DEPLOYER_ADDR"
echo "FileStore:            $FILESTORE_ADDR"
echo "ScriptyStorageV2:     $SCRIPTY_STORAGE_ADDR"
echo "ScriptyBuilderV2:     $SCRIPTY_BUILDER_ADDR"
echo "HTMLGenerator:        $HTML_GENERATOR_ADDR"
echo "Diamond:              $DIAMOND_ADDR"

# Save addresses for testing
cat > .local_addresses << EOF
CREATE2_DEPLOYER_ADDR=$CREATE2_DEPLOYER_ADDR
FILESTORE_ADDR=$FILESTORE_ADDR
SCRIPTY_STORAGE_ADDR=$SCRIPTY_STORAGE_ADDR
SCRIPTY_BUILDER_ADDR=$SCRIPTY_BUILDER_ADDR
HTML_GENERATOR_ADDR=$HTML_GENERATOR_ADDR
DIAMOND_ADDR=$DIAMOND_ADDR
EOF
echo -e "${GREEN}Addresses saved to .local_addresses${NC}"
