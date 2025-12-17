# Base Sepolia - Current Deployment Information

## Current Contract Address (from .env)

**Diamond (Main Contract)**: `0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff`

**Explorer**: https://sepolia-explorer.base.org/address/0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff

## Verified Facet Addresses

From querying the Diamond contract:

- **DiamondCutFacet**: `0xb31dfeb05961e3d486ebebecf947ef6fb8f31f05`

## Next Steps

1. **Get all facet addresses**:
   ```bash
   ./extract-facet-addresses.sh
   ```

2. **Get infrastructure addresses** from your deployment logs or by querying the Diamond configuration.

3. **Verify contracts** using the verification guide:
   ```bash
   ./verify-base-sepolia.sh
   ```

## Deployer Address

- **Deployer**: `0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F`

---

**Last Updated**: 2025-01-27  
**Network**: Base Sepolia (Chain ID: 84532)

