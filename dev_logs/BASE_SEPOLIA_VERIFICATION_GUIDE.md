# Base Sepolia Contract Verification Guide

This guide will help you verify all your smart contracts on Base Sepolia (Basescan).

## Prerequisites

1. **Get Basescan API Key**
   - Visit: https://basescan.org/myapikey
   - Create a free account
   - Generate an API key
   - Add to your `.env` file:
     ```bash
     BASESCAN_API_KEY=your_api_key_here
     ```

2. **Export API Key**
   ```bash
   export BASESCAN_API_KEY=your_api_key_here
   ```

## Contract Addresses

### Main Contracts (CURRENT DEPLOYMENT)
- **Diamond**: `0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff` ⭐

### Infrastructure Contracts
**Note**: These addresses need to be retrieved from your deployment logs or by querying the Diamond contract. The addresses below are placeholders - update them with your actual deployment addresses.

- **DiamondFramePool**: `[UPDATE WITH ACTUAL ADDRESS]`
- **FileStore**: `[UPDATE WITH ACTUAL ADDRESS]`
- **ScriptyStorageV2**: `[UPDATE WITH ACTUAL ADDRESS]`
- **ScriptyBuilderV2**: `[UPDATE WITH ACTUAL ADDRESS]`
- **OnchainRugsHTMLGenerator**: `[UPDATE WITH ACTUAL ADDRESS]`

### Deployer Address
- **Deployer**: `0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F`

---

## Quick Verification (Automated Script)

Run the automated verification script:

```bash
./verify-base-sepolia.sh
```

This will verify all contracts automatically.

---

## Manual Verification

### Step 1: Get Facet Addresses

First, get all facet addresses from the Diamond contract:

**Option 1: Use the extraction script (recommended)**
```bash
./extract-facet-addresses.sh
```

**Option 2: Manual extraction**
```bash
# Get all facets
cast call 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff \
  "facets()" \
  --rpc-url https://sepolia.base.org

# Or get specific facet by selector
cast call 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff \
  "facetAddress(bytes4)" \
  0x1f931c1c \
  --rpc-url https://sepolia.base.org
```

**Note**: You'll also need to get infrastructure contract addresses (FileStore, ScriptyStorage, etc.) from your deployment logs or by checking the Diamond's configuration.

### Step 2: Get Infrastructure Contract Addresses

**Important**: You need to get the infrastructure contract addresses from your deployment logs or by querying the Diamond contract configuration.

To get Scripty contract addresses from the Diamond:
```bash
# Get ScriptyBuilder address (if stored in Diamond)
# Check your deployment logs or use:
cast call 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff \
  "getConfig()" \
  --rpc-url https://sepolia.base.org
```

**Alternative**: Check your deployment script output or deployment log files for these addresses.

### Step 3: Verify Infrastructure Contracts

Once you have the addresses, verify each contract:

#### 1. Verify FileStore
```bash
# Replace FILE_STORE_ADDRESS with actual address from deployment logs
forge verify-contract \
  <FILE_STORE_ADDRESS> \
  src/scripty/dependencies/ethfs/FileStore.sol:FileStore \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --constructor-args $(cast abi-encode "constructor(address)" "0x4e59b44847b379578588920cA78FbF26c0B4956C") \
  --watch
```

#### 2. Verify ScriptyStorageV2
```bash
# Replace addresses with actual values
forge verify-contract \
  <SCRIPTY_STORAGE_ADDRESS> \
  src/scripty/ScriptyStorageV2.sol:ScriptyStorageV2 \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --constructor-args $(cast abi-encode "constructor(address,address)" "<FILE_STORE_ADDRESS>" "0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F") \
  --watch
```

#### 3. Verify ScriptyBuilderV2
```bash
forge verify-contract \
  <SCRIPTY_BUILDER_ADDRESS> \
  src/scripty/ScriptyBuilderV2.sol:ScriptyBuilderV2 \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --watch
```

#### 4. Verify OnchainRugsHTMLGenerator
```bash
forge verify-contract \
  <HTML_GENERATOR_ADDRESS> \
  src/OnchainRugsHTMLGenerator.sol:OnchainRugsHTMLGenerator \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --watch
```

### Step 4: Verify Diamond Contract

**Important**: You need the DiamondCutFacet address first. Get it from deployment logs or by calling:

```bash
# Get DiamondCutFacet address (diamondCut selector: 0x1f931c1c)
DIAMOND_CUT_FACET=$(cast call 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff \
  "facetAddress(bytes4)" \
  0x1f931c1c \
  --rpc-url https://sepolia.base.org)

echo "DiamondCutFacet: $DIAMOND_CUT_FACET"
# Expected: 0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05
```

Or use the known address directly:
```bash
DIAMOND_CUT_FACET="0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05"
```

Then verify the Diamond:

```bash
forge verify-contract \
  0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff \
  src/diamond/Diamond.sol:Diamond \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --constructor-args $(cast abi-encode "constructor(address,address)" "0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F" "$DIAMOND_CUT_FACET") \
  --watch
```

### Step 5: Verify DiamondFramePool (if deployed)

**Note**: Only verify if DiamondFramePool was deployed with this deployment.

```bash
# Replace DIAMOND_FRAME_POOL_ADDRESS with actual address
forge verify-contract \
  <DIAMOND_FRAME_POOL_ADDRESS> \
  src/DiamondFramePool.sol:DiamondFramePool \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --constructor-args $(cast abi-encode "constructor(address,uint256)" "0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff" "100000000000000") \
  --watch
```

### Step 6: Verify Facet Contracts

```bash
forge verify-contract \
  0x983CEBf3169dF3fa5471C0a59156e7F2F96F603A \
  src/DiamondFramePool.sol:DiamondFramePool \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --constructor-args $(cast abi-encode "constructor(address,uint256)" "0x711aFEE5331F8748A600c58C76EDbb51484625EA" "100000000000000") \
  --watch
```


After getting facet addresses from Step 1, verify each facet:

#### Verify DiamondCutFacet

```bash
# Replace FACET_ADDRESS with actual address from facets() call
forge verify-contract \
  <FACET_ADDRESS> \
  src/diamond/facets/DiamondCutFacet.sol:DiamondCutFacet \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --watch
```

#### Verify DiamondLoupeFacet

```bash
forge verify-contract \
  <FACET_ADDRESS> \
  src/diamond/facets/DiamondLoupeFacet.sol:DiamondLoupeFacet \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --watch
```

#### Verify Rug Facets

Verify each Rug facet using the same pattern:

- `RugNFTFacet`
- `RugAdminFacet`
- `RugAgingFacet`
- `RugMaintenanceFacet`
- `RugCommerceFacet`
- `RugLaunderingFacet`
- `RugTransferSecurityFacet`
- `RugMarketplaceFacet`

```bash
forge verify-contract \
  <FACET_ADDRESS> \
  src/facets/<FacetName>.sol:<FacetName> \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --watch
```

---

## Verification Checklist

- [ ] FileStore
- [ ] ScriptyStorageV2
- [ ] ScriptyBuilderV2
- [ ] OnchainRugsHTMLGenerator
- [ ] Diamond
- [ ] DiamondFramePool
- [ ] DiamondCutFacet
- [ ] DiamondLoupeFacet
- [ ] RugNFTFacet
- [ ] RugAdminFacet
- [ ] RugAgingFacet
- [ ] RugMaintenanceFacet
- [ ] RugCommerceFacet
- [ ] RugLaunderingFacet
- [ ] RugTransferSecurityFacet
- [ ] RugMarketplaceFacet

---

## Troubleshooting

### Error: "Contract already verified"
This means the contract is already verified. You can skip it.

### Error: "Constructor arguments mismatch"
Double-check the constructor arguments. Use `cast abi-encode` to generate them correctly.

### Error: "Compiler version mismatch"
Make sure you're using the same Solidity version (0.8.22) and optimizer settings (runs: 10, via-ir: true).

### Error: "API key invalid"
- Check that your API key is correct
- Make sure you've exported it: `export BASESCAN_API_KEY=your_key`
- Verify the key works: https://basescan.org/myapikey

### Getting Facet Addresses

If you can't get facet addresses from the Diamond, check your deployment logs or use:

```bash
# Get all facets as JSON
cast call 0x711aFEE5331F8748A600c58C76EDbb51484625EA \
  "facets()" \
  --rpc-url https://sepolia.base.org | jq
```

---

## Verification Status

After verification, check your contracts on Basescan:

- **Diamond**: https://sepolia-explorer.base.org/address/0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff

Verified contracts will show a green checkmark and the source code will be visible.

---

## Notes

1. **Diamond Pattern**: The Diamond contract uses the EIP-2535 Diamond pattern. Each facet is a separate contract that needs to be verified individually.

2. **Facet Addresses**: Facet addresses are not stored in deployment files. You must retrieve them from the Diamond contract using `facets()` or `facetAddress(selector)`.

3. **Constructor Args**: Some contracts have constructor arguments that must match exactly. Use `cast abi-encode` to generate them correctly.

4. **Compiler Settings**: Make sure your `foundry.toml` matches the deployment settings:
   - Solidity: 0.8.22
   - Optimizer: enabled, runs: 10
   - Via IR: true

---

## Quick Reference

```bash
# Set API key
export BASESCAN_API_KEY=your_key_here

# Get facet addresses
cast call 0x711aFEE5331F8748A600c58C76EDbb51484625EA "facets()" --rpc-url https://sepolia.base.org

# Verify a contract (template)
forge verify-contract \
  <ADDRESS> \
  <CONTRACT_PATH>:<CONTRACT_NAME> \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --watch
```

---

**Last Updated**: 2025-01-27  
**Network**: Base Sepolia (Chain ID: 84532)  
**Explorer**: https://sepolia-explorer.base.org

