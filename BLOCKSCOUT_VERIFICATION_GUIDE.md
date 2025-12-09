# Blockscout Verification Guide for Base Sepolia

This guide provides commands to verify all deployed contracts on Base Sepolia using Blockscout.

## Configuration

- **RPC URL**: `https://sepolia-preconf.base.org`
- **Verifier URL**: `https://base-sepolia.blockscout.com/api/`
- **Diamond Address**: `0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff`
- **Deployer**: `0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F`

## Quick Start

Run the automated script:

```bash
./verify-blockscout-base-sepolia.sh
```

## Manual Verification Commands

### 1. Verify Diamond Contract

The Diamond contract requires constructor arguments (owner and DiamondCutFacet address).

```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff \
  src/diamond/Diamond.sol:Diamond \
  --constructor-args $(cast abi-encode "constructor(address,address)" "0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F" "0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05") \
  --watch
```

### 2. Verify Facet Contracts

All facets have no constructor arguments.

#### DiamondCutFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05 \
  src/diamond/facets/DiamondCutFacet.sol:DiamondCutFacet \
  --watch
```

#### DiamondLoupeFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0xea06dbacddade92e50283cefd5f21ead03583fba \
  src/diamond/facets/DiamondLoupeFacet.sol:DiamondLoupeFacet \
  --watch
```

#### RugNFTFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0xc9142ef2681cb63552c0f5311534abddc8c22922 \
  src/facets/RugNFTFacet.sol:RugNFTFacet \
  --watch
```

#### RugAdminFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0xf996b3a229754e3632def40c6079de151fe44334 \
  src/facets/RugAdminFacet.sol:RugAdminFacet \
  --watch
```

#### RugAgingFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0x58e1760c15f5a004715c91e64e8c1d14f64393cc \
  src/facets/RugAgingFacet.sol:RugAgingFacet \
  --watch
```

#### RugMaintenanceFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0xbb4e6a1705b10b53eb56e0289cb58a0d5d4deaa8 \
  src/facets/RugMaintenanceFacet.sol:RugMaintenanceFacet \
  --watch
```

#### RugCommerceFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0x225809e163c335da4625c4a206cbcb6a86e53a54 \
  src/facets/RugCommerceFacet.sol:RugCommerceFacet \
  --watch
```

#### RugLaunderingFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0xe9d0b95a1dea62e74844eee8f3430d61114466b0 \
  src/facets/RugLaunderingFacet.sol:RugLaunderingFacet \
  --watch
```

#### RugTransferSecurityFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0xe113d62563e5bef766f5ca588f119ae3741bf458 \
  src/facets/RugTransferSecurityFacet.sol:RugTransferSecurityFacet \
  --watch
```

#### RugMarketplaceFacet
```bash
forge verify-contract \
  --rpc-url https://sepolia-preconf.base.org \
  --verifier blockscout \
  --verifier-url 'https://base-sepolia.blockscout.com/api/' \
  0x0f806e5baded1705bd2bc2df4cb59ce1733e77d2 \
  src/facets/RugMarketplaceFacet.sol:RugMarketplaceFacet \
  --watch
```

## Contract Addresses Summary

| Contract | Address | Constructor Args |
|----------|---------|------------------|
| Diamond | `0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff` | Yes (owner, diamondCutFacet) |
| DiamondCutFacet | `0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05` | No |
| DiamondLoupeFacet | `0xea06dbacddade92e50283cefd5f21ead03583fba` | No |
| RugNFTFacet | `0xc9142ef2681cb63552c0f5311534abddc8c22922` | No |
| RugAdminFacet | `0xf996b3a229754e3632def40c6079de151fe44334` | No |
| RugAgingFacet | `0x58e1760c15f5a004715c91e64e8c1d14f64393cc` | No |
| RugMaintenanceFacet | `0xbb4e6a1705b10b53eb56e0289cb58a0d5d4deaa8` | No |
| RugCommerceFacet | `0x225809e163c335da4625c4a206cbcb6a86e53a54` | No |
| RugLaunderingFacet | `0xe9d0b95a1dea62e74844eee8f3430d61114466b0` | No |
| RugTransferSecurityFacet | `0xe113d62563e5bef766f5ca588f119ae3741bf458` | No |
| RugMarketplaceFacet | `0x0f806e5baded1705bd2bc2df4cb59ce1733e77d2` | No |

## Verification Checklist

- [ ] Diamond
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

## View Verified Contracts

After verification, view your contracts on Blockscout:

- **Diamond**: https://base-sepolia.blockscout.com/address/0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff
- **DiamondCutFacet**: https://base-sepolia.blockscout.com/address/0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05
- **DiamondLoupeFacet**: https://base-sepolia.blockscout.com/address/0xea06dbacddade92e50283cefd5f21ead03583fba
- **RugNFTFacet**: https://base-sepolia.blockscout.com/address/0xc9142ef2681cb63552c0f5311534abddc8c22922
- **RugAdminFacet**: https://base-sepolia.blockscout.com/address/0xf996b3a229754e3632def40c6079de151fe44334
- **RugAgingFacet**: https://base-sepolia.blockscout.com/address/0x58e1760c15f5a004715c91e64e8c1d14f64393cc
- **RugMaintenanceFacet**: https://base-sepolia.blockscout.com/address/0xbb4e6a1705b10b53eb56e0289cb58a0d5d4deaa8
- **RugCommerceFacet**: https://base-sepolia.blockscout.com/address/0x225809e163c335da4625c4a206cbcb6a86e53a54
- **RugLaunderingFacet**: https://base-sepolia.blockscout.com/address/0xe9d0b95a1dea62e74844eee8f3430d61114466b0
- **RugTransferSecurityFacet**: https://base-sepolia.blockscout.com/address/0xe113d62563e5bef766f5ca588f119ae3741bf458
- **RugMarketplaceFacet**: https://base-sepolia.blockscout.com/address/0x0f806e5baded1705bd2bc2df4cb59ce1733e77d2

## Troubleshooting

### Error: "Contract already verified"
This means the contract is already verified. You can skip it.

### Error: "Constructor arguments mismatch"
Double-check the constructor arguments. For the Diamond contract, ensure you're using:
- Owner: `0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F`
- DiamondCutFacet: `0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05`

### Error: "Compiler version mismatch"
Make sure your `foundry.toml` matches the deployment settings:
- Solidity: 0.8.22
- Optimizer: enabled, runs: 10
- Via IR: true

### Error: "API endpoint issues"
If Blockscout API is having issues, you can try:
1. Wait a few minutes and retry
2. Check Blockscout status
3. Use the manual verification via Blockscout UI if needed

## Notes

1. **Diamond Pattern**: The Diamond contract uses the EIP-2535 Diamond pattern. Each facet is a separate contract that needs to be verified individually.

2. **No API Key Required**: Blockscout verification doesn't require an API key (unlike Basescan/Etherscan).

3. **Constructor Args**: Only the Diamond contract requires constructor arguments. All facets have no constructor.

4. **Compiler Settings**: Make sure your `foundry.toml` matches the deployment settings used when the contracts were deployed.

---

**Last Updated**: 2025-01-27  
**Network**: Base Sepolia (Chain ID: 84532)  
**Explorer**: https://base-sepolia.blockscout.com

