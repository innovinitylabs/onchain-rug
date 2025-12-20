# Maintenance Functions ERC-8021 Integration

## Status: Partially Complete

### ✅ Completed
- `useCleanRug` - Updated to use `sendTransaction` with ERC-8021 suffix

### ⏳ Remaining
- `useRestoreRug` - Needs similar update
- `useMasterRestoreRug` - Needs similar update

## Implementation Pattern

All maintenance functions follow the same pattern:

1. **Encode function call**
   ```typescript
   const encodedData = encodeFunctionData({
     abi: onchainRugsABI,
     functionName: 'cleanRug', // or 'restoreRug', 'masterRestoreRug'
     args: [tokenId],
   })
   ```

2. **Get attribution codes**
   ```typescript
   const codes = getAllAttributionCodes()
   ```

3. **Append ERC-8021 suffix**
   ```typescript
   const callDataWithAttribution = appendERC8021Suffix(encodedData, codes)
   ```

4. **Use for gas calculation and send transaction**
   - Use `callDataWithAttribution` for intrinsic gas calculation
   - Pass to `sendTransaction` with the same data

## Note

The maintenance functions have complex gas estimation logic that needs to be preserved. The key change is:
- Switch from `writeContract` to `sendTransaction`
- Encode function + append ERC-8021 suffix before gas calculation
- Use the suffix-appended calldata for both gas estimation and transaction sending

