# Legacy Code Archive

This folder contains the original OnchainRugs implementation that has been replaced by the new diamond architecture.

## Files in this folder:

### 📄 Contracts
- **`OnchainRugs.sol`** - The original monolithic NFT contract (288 lines)
  - Combined ERC721, minting, aging, maintenance, and HTML generation
  - Functionality has been split across 6 diamond facets
  - Still contains working Scripty integration logic

### 📜 Scripts
- **`DeployToShapeSepolia.s.sol`** - Original deployment script for Shape Sepolia
- **`UpdateStorageAddress.s.sol`** - Script to update Scripty storage addresses
- **`TestMintOnTestnet.s.sol`** - Test minting script for testnets

### 🧪 Tests
- **`LocalScriptyTest.t.sol`** - Comprehensive tests for the old system

## Migration Status

| Original Feature | New Diamond Location | Status |
|-----------------|---------------------|--------|
| ERC721 functionality | `RugNFTFacet` | ✅ Complete |
| Minting logic | `RugNFTFacet.mintRug()` | ✅ Complete |
| Aging calculations | `RugAgingFacet` | ✅ Complete |
| Cleaning services | `RugMaintenanceFacet` | ✅ Complete |
| HTML generation | `RugNFTFacet.tokenURI()` | ✅ Complete |
| Owner controls | `RugAdminFacet` | ✅ Complete |
| Withdraw functions | `RugCommerceFacet` | ✅ Complete |
| Royalty system | `RugCommerceFacet` | ✅ Complete |
| Laundering logic | `RugLaunderingFacet` | ✅ Complete |

## Why These Files Are Here

1. **Historical Reference** - Shows the evolution from monolithic to diamond architecture
2. **Working Scripty Integration** - Contains proven HTML generation logic
3. **Backup** - In case any functionality needs to be referenced
4. **Migration Examples** - Demonstrates how monolithic contracts can be modularized

## Current Active System

The active system is now in:
- `src/diamond/` - Diamond core infrastructure
- `src/facets/` - 6 specialized facets
- `src/libraries/` - Shared storage
- `script/DeployRugDiamond.s.sol` - Diamond deployment
- `test/RugDiamondIntegrationTest.sol` - Diamond tests

## Important Note

**`OnchainRugsHTMLGenerator.sol` is still actively used by the diamond system!** It was moved to `src/` and powers the HTML generation for all NFTs.

---

*This legacy code represents the successful evolution from a monolithic smart contract to a modular, upgradeable diamond architecture.*
