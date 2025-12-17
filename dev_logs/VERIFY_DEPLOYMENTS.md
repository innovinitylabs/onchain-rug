# Contract Verification Guide

## Deployment Addresses

### Ethereum Sepolia (Chain ID: 11155111)
- **Diamond:** `0x1c061D0b0a21d3068D18847c9153Fa6083A88CeE`
- **Status:** ✅ Partially verified on Sourcify

### Shape Sepolia (Chain ID: 11011)  
- **Diamond:** `0x13349e292dF822169566Bac96F31690a1AEC8312`
- **Status:** Needs verification

### Base Sepolia (Chain ID: 84532)
- **Diamond:** `0xd6E16CF5094C1DdFb1bE09652b0Fb27ACAA124C1`
- **Status:** Needs verification

---

## Automatic Verification (Sourcify - No API Key)

Sourcify has already partially verified Ethereum Sepolia. For full verification on block explorers, you need API keys.

---

## Manual Verification with API Keys

### Step 1: Get API Keys

1. **Etherscan (for Ethereum Sepolia)**
   - Visit: https://etherscan.io/myapikey
   - Create free account and generate API key
   - Add to `.env`: `ETHERSCAN_API_KEY=your_key_here`

2. **Basescan (for Base Sepolia)**
   - Visit: https://basescan.org/myapikey
   - Create free account and generate API key
   - Add to `.env`: `BASESCAN_API_KEY=your_key_here`

3. **ShapeScan (for Shape Sepolia)**
   - Visit: https://sepolia.shapescan.xyz
   - May need to request API access or use generic verification

### Step 2: Verify Ethereum Sepolia

```bash
forge verify-contract \
  0x1c061D0b0a21d3068D18847c9153Fa6083A88CeE \
  src/diamond/Diamond.sol:Diamond \
  --chain-id 11155111 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address,address)" "0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F" "0xab6196903da8b5a5b7A5BC137c8Ae7Aca2956788")
```

### Step 3: Verify Base Sepolia

```bash
forge verify-contract \
  0xd6E16CF5094C1DdFb1bE09652b0Fb27ACAA124C1 \
  src/diamond/Diamond.sol:Diamond \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address,address)" "0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F" "0xab6196903da8b5a5b7A5BC137c8Ae7Aca2956788")
```

### Step 4: Verify Shape Sepolia

```bash
forge verify-contract \
  0x13349e292dF822169566Bac96F31690a1AEC8312 \
  src/diamond/Diamond.sol:Diamond \
  --chain-id 11011 \
  --verifier blockscout \
  --verifier-url https://sepolia.shapescan.xyz/api \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address,address)" "0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F" "0xab6196903da8b5a5b7A5BC137c8Ae7Aca2956788")
```

---

## Batch Verification (All Contracts)

If you want to verify all deployed contracts at once, use the deployment script with `--verify`:

### Ethereum Sepolia (requires ETHERSCAN_API_KEY)
```bash
forge script script/DeployEthereumSepolia.s.sol \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --resume
```

### Base Sepolia (requires BASESCAN_API_KEY)
```bash
forge script script/DeployBaseSepolia.s.sol \
  --rpc-url https://sepolia.base.org \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api \
  --resume
```

### Shape Sepolia
```bash
forge script script/DeployShapeSepolia.s.sol \
  --rpc-url https://sepolia.shape.network \
  --verify \
  --verifier blockscout \
  --verifier-url https://sepolia.shapescan.xyz/api \
  --resume
```

---

## Current Status

- **Ethereum Sepolia:** ✅ Partially verified on Sourcify
- **Base Sepolia:** ⏳ Pending API key
- **Shape Sepolia:** ⏳ Pending verification

**Note:** Sourcify verification is automatic and works without API keys, but for full Etherscan/Basescan verification with all features, you need their respective API keys.

---

## Links to View Contracts

- **Ethereum Sepolia:** https://sepolia.etherscan.io/address/0x1c061D0b0a21d3068D18847c9153Fa6083A88CeE
- **Shape Sepolia:** https://sepolia.shapescan.xyz/address/0x13349e292dF822169566Bac96F31690a1AEC8312
- **Base Sepolia:** https://sepolia-explorer.base.org/address/0xd6E16CF5094C1DdFb1bE09652b0Fb27ACAA124C1

Even without full verification, the contracts are deployed and functional. Verification just makes the source code visible in the block explorer UI.

