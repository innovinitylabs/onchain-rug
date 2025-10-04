# UpdateAgingThresholds Script

This script allows you to update the aging thresholds in the deployed OnchainRugs contract.

## Usage

### Quick Start

1. **Edit the script configuration:**
   ```solidity
   // Set to true for production, false for testing
   bool useProductionSettings = false;
   ```

2. **Run the script:**
   ```bash
   forge script script/UpdateAgingThresholds.s.sol --rpc-url https://sepolia.shape.network --broadcast
   ```

### Preview Settings

To see what the script will do without executing:

```bash
forge script script/UpdateAgingThresholds.s.sol --rpc-url https://sepolia.shape.network
```

This will show the preview output from the `previewSettings()` function.

## Configuration Options

### Threshold Array Format
```solidity
[0] dirtLevel1Days     // Time for dirt level 1 (light dirt)
[1] dirtLevel2Days     // Time for dirt level 2 (heavy dirt, triggers neglect)
[2] textureLevel1Days  // Time for texture level 1
[3] textureLevel2Days  // Time for texture level 2
[4] freeCleanDays      // Free cleaning window after mint
[5] freeCleanWindow    // Free cleaning window after each clean
```

All values are in **MINUTES** - the contract converts them to seconds.

### Preset Configurations

#### Test Settings (Ultra Fast)
```solidity
uint256[6] TEST_THRESHOLDS = [1, 2, 3, 5, 1, 1];
// Dirt levels: 1min, 2min
// Texture levels: 3min, 5min
// Free windows: 1min each
```

#### Production Settings (Realistic)
```solidity
uint256[6] PRODUCTION_THRESHOLDS = [4320, 10080, 43200, 129600, 720, 2880];
// Dirt levels: 3 days, 7 days
// Texture levels: 30 days, 90 days
// Free windows: 12 hours, 2 days
```

## Examples

### Switch to Production Settings
```solidity
bool useProductionSettings = true; // Change this line
```
Then run the script.

### Custom Settings
Create your own array:
```solidity
uint256[6] CUSTOM_THRESHOLDS = [
    60,     // 1 hour for dirt level 1
    240,    // 4 hours for dirt level 2
    1440,   // 1 day for texture level 1
    4320,   // 3 days for texture level 2
    30,     // 30 minutes free after mint
    60      // 1 hour free after cleaning
];
```

### Update Contract Address
If you redeploy the contract:
```solidity
address constant DIAMOND_ADDRESS = 0xNEW_ADDRESS_HERE;
```

## Impact on Gameplay

### Test Settings (Current)
- **Complete aging cycle:** 5 minutes
- **Dirt accumulation:** Every 1-2 minutes
- **Free maintenance:** Every 1 minute
- **Perfect for testing** all game mechanics quickly

### Production Settings
- **Complete aging cycle:** 90 days
- **Dirt accumulation:** Every 3-7 days
- **Free maintenance:** Every 12 hours - 2 days
- **Realistic long-term** NFT ownership experience

## Safety Notes

- ⚠️ **Contract Owner Only:** Only the contract owner can update these settings
- ⚠️ **Irreversible:** Changes affect all existing rugs
- ⚠️ **Test First:** Always test on a local network first
- ⚠️ **Backup Settings:** Save current values before changing

## Related Scripts

- `DeployShapeSepolia.s.sol` - Full deployment with initial settings
- `FixMaintenanceFacet.s.sol` - Update maintenance facet
- `UpdateRugAdminFacet.s.sol` - Update admin functions
