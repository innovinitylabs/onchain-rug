# Ethereum Sepolia Deployment Summary

## Deployment Date
December 17, 2025

## Deployment Status
✅ **SUCCESSFUL** - All contracts deployed

## Gas Usage
- **Total Gas Used**: 44,523,782 gas (~44.5M gas)
- **Estimated Gas Price**: 0.001439208 gwei (at time of deployment)
- **Estimated Cost**: 0.000064078983244656 ETH

## Cost Calculation (for Ethereum L1 Mainnet)
At **0.15 gwei** and **$3000 ETH**:
- **Gas Cost**: 44,523,782 × 0.15 gwei = 0.0066785649 ETH
- **Cost in USD**: 0.0066785649 × $3000 = **$20.04**

## Deployed Contracts

### Infrastructure
- **FileStore**: `0x4841d40FE950D862EF407E8987DB22a8dDA4C7B4`
- **ScriptyStorageV2**: `0xcCA7F928c4D350a7DcEc79fb24b64caD079D51F4`
- **ScriptyBuilderV2**: `0xa255c3722A858CeA2b92De84C02C55D9D09cC502`
- **OnchainRugsHTMLGenerator**: `0xa43532205Fc90b286Da98389a9883347Cc4064a8`

### Diamond System
- **DiamondCutFacet**: `0x3d5dc1c1eed78c6daba152e226607c0173a7ee52`
- **DiamondLoupeFacet**: `0x9b7119230197fd8d0d8ca521afb26057182364b6`
- **Diamond** (Main Contract): `0xD2cFB29e4473DAf4614288f91e1284Fc5B3a262c`

### Rug Facets (8 facets)
- **RugNFTFacet**: `0x51979e8ec1c73685f1bb7dab2b245a5067154ff4`
- **RugAdminFacet**: `0x441a9755771d6cd0bd4108b20eace2bc665c274c`
- **RugAgingFacet**: `0x6086b7de70e0b28cbd04824faa24911dd765e0c5`
- **RugMaintenanceFacet**: `0xbf2faedf5b7391bd194cef72ae3030d3c701c32e`
- **RugCommerceFacet**: `0xdeb40670cb87e4bc13b3243fd5607afdf6c703d3`
- **RugLaunderingFacet**: `0xb5fadc320e41f79165c099a3921e9d8c15130ca5`
- **RugTransferSecurityFacet**: `0x751e2142c3d6f9bec751ab351903bcd8dc776583`
- **RugMarketplaceFacet**: `0xb7edcd79eaaa631678a932b235b460b6c074fbaf`

### Additional Contracts
- **DiamondFramePool**: `0xd2d25009a09443a8e1D18bb1965238D0277563f5`

## Configuration
- **Total Function Selectors**: 137 (across 9 facets)
- **Pool Percentage**: 1% (100 basis points)
- **Royalties**: 10% to deployer
- **Marketplace Fee**: 0%
- **Service Fee**: 0.00042 ETH

## Verification Status
⚠️ **Pending** - Requires `ETHERSCAN_API_KEY` environment variable

To verify contracts, set the API key and run:
```bash
export ETHERSCAN_API_KEY=your_api_key_here
forge verify-contract --chain-id 11155111 --num-of-optimizations 10 --compiler-version v0.8.27 <CONTRACT_ADDRESS> <CONTRACT_PATH>:<CONTRACT_NAME>
```

## Notes
- All JavaScript libraries (rug-p5.js, rug-algo.js, rug-frame.js) uploaded successfully
- System initialized with test values (aging thresholds in minutes for testing)
- Diamond proxy pattern with 9 facets and 137 function selectors
- This is a fresh deployment with all latest features including DiamondFramePool

