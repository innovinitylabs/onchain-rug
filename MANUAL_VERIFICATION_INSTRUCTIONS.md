# Manual Contract Verification Instructions for Base Sepolia

## Issue
Forge's `verify-contract` command is still using the deprecated Basescan API V1 endpoint. Until Forge adds support for API V2, manual verification via the Basescan UI is the recommended approach.

## All Contract Addresses Ready for Verification

### Main Contract
- **Diamond**: `0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff`

### Facets (10 total)
1. **DiamondCutFacet**: `0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05`
2. **DiamondLoupeFacet**: `0xea06dbacddade92e50283cefd5f21ead03583fba`
3. **RugNFTFacet**: `0xc9142ef2681cb63552c0f5311534abddc8c22922`
4. **RugAdminFacet**: `0xf996b3a229754e3632def40c6079de151fe44334`
5. **RugAgingFacet**: `0x58e1760c15f5a004715c91e64e8c1d14f64393cc`
6. **RugMaintenanceFacet**: `0xbb4e6a1705b10b53eb56e0289cb58a0d5d4deaa8`
7. **RugCommerceFacet**: `0x225809e163c335da4625c4a206cbcb6a86e53a54`
8. **RugLaunderingFacet**: `0xe9d0b95a1dea62e74844eee8f3430d61114466b0`
9. **RugTransferSecurityFacet**: `0xe113d62563e5bef766f5ca588f119ae3741bf458`
10. **RugMarketplaceFacet**: `0x0f806e5baded1705bd2bc2df4cb59ce1733e77d2`

## Manual Verification Steps

### Step 1: Navigate to Contract on Basescan
1. Go to https://sepolia-explorer.base.org
2. Search for the contract address (e.g., `0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff`)
3. Click on the contract address

### Step 2: Start Verification
1. Click the **"Contract"** tab
2. Click **"Verify and Publish"** button

### Step 3: Choose Verification Method
Select **"Via Standard JSON Input"** (recommended for complex contracts)

### Step 4: Fill in Verification Details

#### For Facets (no constructor):
- **Compiler Type**: Solidity (Single file)
- **Compiler Version**: `0.8.22`
- **Optimization**: Yes
- **Optimization Runs**: `10`
- **Enter the Solidity Contract Code**: Copy the entire contract source code
- **Constructor Arguments**: Leave empty (facets have no constructor)

#### For Diamond Contract (has constructor):
- **Compiler Type**: Solidity (Single file)
- **Compiler Version**: `0.8.22`
- **Optimization**: Yes
- **Optimization Runs**: `10`
- **Enter the Solidity Contract Code**: Copy the entire contract source code
- **Constructor Arguments**: 
  ```
  0000000000000000000000007bc9427c8730b87ab3fad10da63f0c4b9e9e0a5f000000000000000000000000b31dfeb05961e3d486ebebecf947ef6fb8f31f05
  ```
  (This encodes: deployer address + DiamondCutFacet address)

### Step 5: Submit
Click **"Verify and Publish"** and wait for confirmation.

## Alternative: Using Standard JSON Input (For Complex Contracts)

If the contract has dependencies, use the Standard JSON Input method:

1. Get the Standard JSON from your build artifacts:
   ```bash
   cat out/src/diamond/facets/DiamondCutFacet.sol/DiamondCutFacet.json | jq '.input'
   ```

2. Copy the entire JSON object

3. In Basescan UI:
   - Select **"Via Standard JSON Input"**
   - Paste the JSON
   - Enter contract name: `DiamondCutFacet`
   - Enter compiler version: `0.8.22`
   - Enter optimization: `10`

## Contract Source Files

All source files are in:
- Facets: `src/facets/`
- Diamond: `src/diamond/`
- Diamond facets: `src/diamond/facets/`

## Quick Links

- **Basescan Sepolia**: https://sepolia-explorer.base.org
- **Diamond Contract**: https://sepolia-explorer.base.org/address/0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff

## Notes

- The dependency file errors (missing OpenZeppelin files) are non-critical - they're just warnings about test/mock files
- All contracts were compiled with Solidity 0.8.22, optimizer enabled, 10 runs
- The Diamond contract uses `via_ir = true` in foundry.toml

---

**Once Forge adds Basescan API V2 support, automated verification will work again.**

