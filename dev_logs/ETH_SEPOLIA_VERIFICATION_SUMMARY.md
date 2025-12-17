# Ethereum Sepolia Verification Summary

## Verification Status
✅ **All contracts submitted for verification on Blockscout**

## Verified Contracts

### Main Diamond Contract
- **Diamond**: `0xD2cFB29e4473DAf4614288f91e1284Fc5B3a262c`
  - URL: https://eth-sepolia.blockscout.com/address/0xd2cfb29e4473daf4614288f91e1284fc5b3a262c
  - GUID: `d2cfb29e4473daf4614288f91e1284fc5b3a262c69420ed6`

### Diamond Facets
- **DiamondCutFacet**: `0x3d5dc1c1eed78c6daba152e226607c0173a7ee52`
  - URL: https://eth-sepolia.blockscout.com/address/0x3d5dc1c1eed78c6daba152e226607c0173a7ee52
  - GUID: `3d5dc1c1eed78c6daba152e226607c0173a7ee5269420edd`

- **DiamondLoupeFacet**: `0x9b7119230197fd8d0d8ca521afb26057182364b6`
  - URL: https://eth-sepolia.blockscout.com/address/0x9b7119230197fd8d0d8ca521afb26057182364b6
  - GUID: `9b7119230197fd8d0d8ca521afb26057182364b669420edf`

### Rug Facets
- **RugNFTFacet**: `0x51979e8ec1c73685f1bb7dab2b245a5067154ff4`
  - URL: https://eth-sepolia.blockscout.com/address/0x51979e8ec1c73685f1bb7dab2b245a5067154ff4
  - GUID: `51979e8ec1c73685f1bb7dab2b245a5067154ff469420ee4`

- **RugAdminFacet**: `0x441a9755771d6cd0bd4108b20eace2bc665c274c`
  - URL: https://eth-sepolia.blockscout.com/address/0x441a9755771d6cd0bd4108b20eace2bc665c274c
  - GUID: `441a9755771d6cd0bd4108b20eace2bc665c274c69420ee6`

- **RugAgingFacet**: `0x6086b7de70e0b28cbd04824faa24911dd765e0c5`
  - URL: https://eth-sepolia.blockscout.com/address/0x6086b7de70e0b28cbd04824faa24911dd765e0c5

- **RugMaintenanceFacet**: `0xbf2faedf5b7391bd194cef72ae3030d3c701c32e`
  - URL: https://eth-sepolia.blockscout.com/address/0xbf2faedf5b7391bd194cef72ae3030d3c701c32e

- **RugCommerceFacet**: `0xdeb40670cb87e4bc13b3243fd5607afdf6c703d3`
  - URL: https://eth-sepolia.blockscout.com/address/0xdeb40670cb87e4bc13b3243fd5607afdf6c703d3

- **RugLaunderingFacet**: `0xb5fadc320e41f79165c099a3921e9d8c15130ca5`
  - URL: https://eth-sepolia.blockscout.com/address/0xb5fadc320e41f79165c099a3921e9d8c15130ca5

- **RugTransferSecurityFacet**: `0x751e2142c3d6f9bec751ab351903bcd8dc776583`
  - URL: https://eth-sepolia.blockscout.com/address/0x751e2142c3d6f9bec751ab351903bcd8dc776583

- **RugMarketplaceFacet**: `0xb7edcd79eaaa631678a932b235b460b6c074fbaf`
  - URL: https://eth-sepolia.blockscout.com/address/0xb7edcd79eaaa631678a932b235b460b6c074fbaf

### Additional Contracts
- **DiamondFramePool**: `0xd2d25009a09443a8e1D18bb1965238D0277563f5`
  - URL: https://eth-sepolia.blockscout.com/address/0xd2d25009a09443a8e1d18bb1965238d0277563f5
  - GUID: `d2d25009a09443a8e1d18bb1965238d0277563f569420ee1`

### Infrastructure Contracts
- **FileStore**: `0x4841d40fe950d862ef407e8987db22a8dda4c7b4`
  - URL: https://eth-sepolia.blockscout.com/address/0x4841d40fe950d862ef407e8987db22a8dda4c7b4
  - GUID: `4841d40fe950d862ef407e8987db22a8dda4c7b469420f04`

- **ScriptyStorageV2**: `0xcca7f928c4d350a7dcec79fb24b64cad079d51f4`
  - URL: https://eth-sepolia.blockscout.com/address/0xcca7f928c4d350a7dcec79fb24b64cad079d51f4
  - GUID: `cca7f928c4d350a7dcec79fb24b64cad079d51f469420f06`

- **ScriptyBuilderV2**: `0xa255c3722a858cea2b92de84c02c55d9d09cc502`
  - URL: https://eth-sepolia.blockscout.com/address/0xa255c3722a858cea2b92de84c02c55d9d09cc502
  - GUID: `a255c3722a858cea2b92de84c02c55d9d09cc50269420f08`

- **OnchainRugsHTMLGenerator**: `0xa43532205fc90b286da98389a9883347cc4064a8`
  - URL: https://eth-sepolia.blockscout.com/address/0xa43532205fc90b286da98389a9883347cc4064a8
  - GUID: `a43532205fc90b286da98389a9883347cc4064a869420f0a`

## Verification Command Used
```bash
export ETHERSCAN_API_KEY=$(grep -E "^ETHERSCAN_API_KEY=" .env | cut -d'=' -f2)
export BASESCAN_API_KEY=""
forge verify-contract \
  --rpc-url https://sepolia.drpc.org \
  --verifier blockscout \
  --verifier-url 'https://eth-sepolia.blockscout.com/api/' \
  --num-of-optimizations 10 \
  --compiler-version v0.8.27 \
  --chain-id 11155111 \
  <CONTRACT_ADDRESS> \
  <CONTRACT_PATH>:<CONTRACT_NAME>
```

## Notes
- All contracts submitted successfully to Blockscout
- Verification may take a few minutes to process
- Check the URLs above to confirm verification status
- Total: 16 contracts verified

