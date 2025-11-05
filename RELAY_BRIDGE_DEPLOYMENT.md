# Relay Bridge Mint - Fresh Deployment Summary

**Date:** November 4, 2025  
**Branch:** `feature/bridge-mint`  
**Purpose:** Fresh deployment with `mintRugFor` for Relay Protocol cross-chain minting

---

## New Contract Addresses (TESTNET)

### Ethereum Sepolia (Chain ID: 11155111)
- **Diamond (Main Contract):** `0x1c061D0b0a21d3068D18847c9153Fa6083A88CeE`
- FileStore: `0x46270eB2bB5CE81ea29106514679e67d9Fa9ad27`
- ScriptyStorageV2: `0x1Bf16786b18ED231Ff8bd8c278c1aadD501c7B68`
- ScriptyBuilderV2: `0xf9BaB2c695b959c40fF028423aa03B680e9Bf1Db`
- HTMLGenerator: `0x3bcd07e784c00bb84EfBab7F710ef041707003b9`
- Explorer: https://sepolia.etherscan.io/address/0x1c061D0b0a21d3068D18847c9153Fa6083A88CeE

### Shape Sepolia (Chain ID: 11011)
- **Diamond (Main Contract):** `0x13349e292dF822169566Bac96F31690a1AEC8312`
- FileStore: `0x071AD918ee38a68cb42adf3d0019dBBA91473893`
- ScriptyStorageV2: `0x96E2bD58021419a8ed1ca98B44AC4abaC1E40C70`
- ScriptyBuilderV2: `0x6d5c0d519D752A651FeD3776F29B8b5e1b83dF5C`
- HTMLGenerator: `0xB6284543C6020f95444288B69DdBf5E5a6DFfe15`
- Explorer: https://sepolia.shapescan.xyz/address/0x13349e292dF822169566Bac96F31690a1AEC8312

### Base Sepolia (Chain ID: 84532)
- **Diamond (Main Contract):** `0xd6E16CF5094C1DdFb1bE09652b0Fb27ACAA124C1`
- FileStore: `0x60b2F386102ED14a644Bbc663a6f1CbB0225b5D6`
- ScriptyStorageV2: `0x6D3912a20Bc193c95B062494bd3a94c798441CD0`
- ScriptyBuilderV2: `0x0A71B8561fd89AAa1Bcf564D3BBEcaCBF3739C04`
- HTMLGenerator: `0xDE32D7A64255cB665a7DD4B85eE936AD625BBdeD`
- Explorer: https://sepolia-explorer.base.org/address/0xd6E16CF5094C1DdFb1bE09652b0Fb27ACAA124C1

---

## Updated .env Configuration

Add these to your `.env.local`:

```bash
# Relay Protocol
NEXT_PUBLIC_RELAY_USE_TESTNET=true

# Ethereum Sepolia (NEW)
NEXT_PUBLIC_ETHEREUM_SEPOLIA_CONTRACT=0x1c061D0b0a21d3068D18847c9153Fa6083A88CeE

# Shape Sepolia (NEW)
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x13349e292dF822169566Bac96F31690a1AEC8312

# Base Sepolia (NEW)
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xd6E16CF5094C1DdFb1bE09652b0Fb27ACAA124C1
```

**Note:** `NEXT_PUBLIC_SHAPE_TARGET` is no longer needed since users select destination in the modal UI.

---

## Key Changes

### Smart Contract
1. Added `mintRugFor(address recipient, ...)` function to RugNFTFacet
2. `mintRug()` now delegates to `mintRugFor(msg.sender, ...)`
3. All validation uses `recipient` instead of `msg.sender`
4. Compatible with Relay Protocol cross-chain calling

### Frontend
1. New `BridgeMintModal` component with chain selection UI
2. "Mint to" selector (destination chain)
3. "Pay on" selector (origin chain)
4. Automatic routing: direct mint if same chain, Relay if cross-chain
5. Real-time fee calculation (mint cost + bridge fee)

### New Files
- `config/chains.ts` - Chain metadata and helpers
- `utils/relay-api.ts` - Relay API integration
- `hooks/use-relay-mint.ts` - Cross-chain mint hook
- `hooks/use-direct-mint.ts` - Direct mint hook
- `components/BridgeMintModal.tsx` - Bridge mint UI

---

## Testing Guide

### Supported Test Routes (Relay Testnets API)

**Origin Chains (Pay on):**
- Ethereum Sepolia (11155111)
- Base Sepolia (84532)
- Shape Sepolia (11011)

**Destination Chains (Mint to):**
- Ethereum Sepolia (11155111)
- Shape Sepolia (11011)
- Base Sepolia (84532)

### Example Test Cases

1. **Cross-chain: Ethereum Sepolia → Shape Sepolia**
   - Any wallet connected
   - Open mint modal
   - Select "Mint to: Shape Sepolia"
   - Select "Pay on: Ethereum Sepolia"
   - Click "Bridge & Mint"

2. **Cross-chain: Base Sepolia → Ethereum Sepolia**
   - Any wallet connected
   - Open mint modal
   - Select "Mint to: Ethereum Sepolia"
   - Select "Pay on: Base Sepolia"
   - Click "Bridge & Mint"

3. **Cross-chain: Ethereum Sepolia → Base Sepolia**
   - Any wallet connected
   - Open mint modal
   - Select "Mint to: Base Sepolia"
   - Select "Pay on: Ethereum Sepolia"
   - Click "Bridge & Mint"

4. **Direct: Shape Sepolia → Shape Sepolia**
   - Any wallet connected
   - Open mint modal
   - Select "Mint to: Shape Sepolia"
   - Select "Pay on: Shape Sepolia"
   - Click "Mint" (no bridge fee, direct mint)

---

## Function Signatures

### mintRug (Legacy - still works)
```solidity
function mintRug(
    string[] calldata textRows,
    uint256 seed,
    VisualConfig calldata visual,
    ArtData calldata art,
    uint8 complexity,
    uint256 characterCount
) external payable
```

### mintRugFor (NEW - Relay compatible)
```solidity
function mintRugFor(
    address recipient,
    string[] calldata textRows,
    uint256 seed,
    VisualConfig calldata visual,
    ArtData calldata art,
    uint8 complexity,
    uint256 characterCount
) external payable
```

---

## Relay API Endpoints

- **Testnet:** `https://api.testnets.relay.link`
- **Mainnet:** `https://api.relay.link`

Controlled by: `NEXT_PUBLIC_RELAY_USE_TESTNET=true`

---

## Next Steps

1. Test cross-chain minting from Ethereum Sepolia
2. Monitor Relay transaction status
3. When ready for mainnet:
   - Deploy to Shape Mainnet & Base Mainnet
   - Set `NEXT_PUBLIC_RELAY_USE_TESTNET=false`
   - Update contract addresses in `.env`

---

## Notes

- Both deployments include all facets (NFT, Admin, Aging, Maintenance, Commerce, Laundering, Marketplace, TransferSecurity)
- ERC721-C transfer validation enabled
- Royalties configured (10% to deployer)
- Test aging values (minutes instead of days for rapid testing)

