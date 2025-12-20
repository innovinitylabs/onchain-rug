# ERC-8021 Upgrade Ready for Base Sepolia

## Summary

All ERC-8021 and referral system code is complete and ready for deployment to Base Sepolia testnet.

## Changes Made

### 1. Referral Percentages Updated
- Changed from 15%/10% to **5% for both mint and marketplace** (500 basis points)
- Made fully editable via admin function `setReferralPercentages()`
- Added initialization function `initializeReferralSystem()` that sets 5% defaults

### 2. Upgrade Script Created
- `script/UpgradeBaseSepoliaERC8021.s.sol` - Ready to upgrade existing Base Sepolia contract
- Upgrades 3 existing facets (RugNFTFacet, RugMarketplaceFacet, RugMaintenanceFacet)
- Adds new RugReferralRegistryFacet
- Initializes referral system with 5% percentages

## Files Modified

1. **src/facets/RugReferralRegistryFacet.sol**
   - Added `initializeReferralSystem()` function
   - Updated comments to reflect 5% default

2. **src/libraries/LibRugStorage.sol**
   - Updated comments to reflect 5% default percentages

3. **src/libraries/LibERC8021.sol**
   - Fixed marker constant to use hex string literal format

4. **script/UpgradeBaseSepoliaERC8021.s.sol** (NEW)
   - Complete upgrade script for Base Sepolia

## Deployment Steps

1. **Set Environment Variable**
   ```bash
   export BASE_SEPOLIA_DIAMOND_ADDRESS=<your-diamond-address>
   ```

2. **Run Upgrade Script**
   ```bash
   forge script script/UpgradeBaseSepoliaERC8021.s.sol:UpgradeBaseSepoliaERC8021 \
     --rpc-url $BASE_SEPOLIA_RPC_URL \
     --broadcast \
     --verify \
     -vvvv
   ```

3. **Enable Referral System (After Upgrade)**
   ```solidity
   // Call on diamond contract
   RugReferralRegistryFacet(diamondAddress).setReferralSystemEnabled(true);
   ```

4. **Verify Configuration**
   ```solidity
   // Check referral config
   (bool enabled, uint256 mintPercent, uint256 marketplacePercent) = 
       RugReferralRegistryFacet(diamondAddress).getReferralConfig();
   
   // Should return: enabled=false, mintPercent=500, marketplacePercent=500
   ```

## What Gets Upgraded

### RugNFTFacet (Replaced)
- Adds ERC-8021 attribution parsing
- Adds referral reward distribution for mints (5%)
- Emits `MintAttributed` event

### RugMarketplaceFacet (Replaced)
- Adds ERC-8021 attribution parsing  
- Adds referral reward distribution for purchases (5%)
- Emits `TransactionAttributed` event

### RugMaintenanceFacet (Replaced)
- Adds ERC-8021 attribution tracking
- Emits `MaintenanceAttributed` event

### RugReferralRegistryFacet (New)
- User referral code registration
- Referral statistics tracking
- Reward calculation helpers
- Admin configuration functions

## Configuration

**Referral Percentages**: 5% (500 basis points)
- Mint referrals: 5% of mint fee
- Marketplace referrals: 5% of marketplace fee

**Code Format**: "ref-{code}" (e.g., "ref-alice123")

**Status**: Disabled by default (must enable via `setReferralSystemEnabled(true)`)

## Testing Checklist

After upgrade:

- [ ] Verify all facets upgraded successfully
- [ ] Check referral config shows 5% for both
- [ ] Test registering a referral code
- [ ] Enable referral system
- [ ] Test mint with referral code
- [ ] Verify referrer receives 5% reward
- [ ] Test marketplace purchase with referral code
- [ ] Verify referrer receives 5% reward
- [ ] Check referral statistics updated
- [ ] Test ERC-8021 attribution events emitted

## Notes

- Referral system is **disabled by default** for safety
- Admin must enable via `setReferralSystemEnabled(true)`
- Percentages can be changed anytime via `setReferralPercentages()`
- Max percentage is 50% (5000 basis points) to prevent abuse

---

**Status**: ✅ Ready for deployment!

