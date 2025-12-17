# Remove Dangerous Fallback Contract Address

## Critical Security Improvement

Removed the dangerous fallback to `NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT` from all network-specific contract address lookups.

### The Risk

**Before this fix:**
```typescript
const contractAddress = contractAddresses[chainId] || config.contracts.onchainRugs
```

**Problem:**
- If `NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT` is not set
- User connects to Shape Sepolia
- `contractAddresses[11011]` returns `undefined`
- Falls back to `config.contracts.onchainRugs` (Base Sepolia address)
- **User's transaction sent to Base Sepolia contract instead!** ⚠️
- **User loses ETH to wrong network!** 💸

### The Solution

**After this fix:**
```typescript
const contractAddress = contractAddresses[chainId] // No fallback
```

**Behavior:**
- If contract not set for network → `contractAddress` is `undefined`
- Components check for `undefined` and show error message
- **Transaction blocked - user protected!** ✅
- Clear message: "Contract not deployed on this network"

---

## Files Changed

### Core Configuration

#### `lib/web3.ts`
```typescript
// Before (DANGEROUS):
export const contractAddresses = {
  [shapeSepolia.id]: process.env.NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT || appConfig.contracts.onchainRugs,
  [shapeMainnet.id]: process.env.NEXT_PUBLIC_SHAPE_MAINNET_CONTRACT || appConfig.contracts.onchainRugs,
  [baseSepolia.id]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT || appConfig.contracts.onchainRugs,
  [baseMainnet.id]: process.env.NEXT_PUBLIC_BASE_MAINNET_CONTRACT || appConfig.contracts.onchainRugs,
}

// After (SAFE):
export const contractAddresses: Record<number, string | undefined> = {
  [shapeSepolia.id]: process.env.NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT,
  [shapeMainnet.id]: process.env.NEXT_PUBLIC_SHAPE_MAINNET_CONTRACT,
  [baseSepolia.id]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT,
  [baseMainnet.id]: process.env.NEXT_PUBLIC_BASE_MAINNET_CONTRACT,
}
```

### Frontend Components

All components updated to remove fallback:

1. **`app/generator/page.tsx`**
   ```typescript
   const contractAddress = contractAddresses[chainId] // No fallback
   ```

2. **`components/Web3Minting.tsx`**
   ```typescript
   const contractAddress = contractAddresses[chainId] // No fallback for safety
   ```

3. **`app/gallery/page.tsx`**
   ```typescript
   const contractAddress = contractAddresses[chainId] // No fallback - safer to fail
   ```

4. **`app/dashboard/page.tsx`**
   ```typescript
   const contractAddress = contractAddresses[chainId] // Prevents accidental wrong network
   ```

5. **`app/market/page.tsx`**
   ```typescript
   const contractAddress = contractAddresses[chainId] // No fallback - safer to show error
   ```

6. **`app/portfolio/page.tsx`**
   ```typescript
   const contractAddress = contractAddresses[chainId] // No fallback for safety
   ```

7. **`components/marketplace/NFTDetailModal.tsx`**
   ```typescript
   const contractAddress = contractAddresses[chainId] // No fallback for safety
   ```

---

## How Components Handle Undefined

All components already have proper checks:

### Minting Component
```typescript
if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
  alert('Contract not deployed yet for this network!')
  return
}

// UI shows:
⚠️ Contract not deployed on this network
Network: Shape Sepolia
Please switch to a supported network
```

### Gallery/Dashboard/Market
```typescript
if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
  return // Don't fetch data
}

// UI shows:
No NFTs Available
Contract not deployed on Shape Sepolia
```

---

## Benefits

### 1. **Prevents Cross-Network Transactions**
- User on Shape Sepolia → Can't accidentally mint to Base contract
- User on unsupported network → Clear error message
- No silent failures or mysterious ETH loss

### 2. **Forces Proper Configuration**
- Developers must explicitly set each network's contract
- Missing configuration caught immediately during testing
- No "it worked on my machine" issues

### 3. **Clear Error Messages**
- Users see: "Contract not deployed on this network"
- Users know: They need to switch networks
- No confusion about where their transaction went

### 4. **Fail-Safe Design**
- Better to block transaction than send to wrong network
- Protection against misconfiguration
- Users keep their ETH

---

## Required Environment Variables

Now **strictly required** for each network you want to support:

```bash
# Base Sepolia (required)
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8

# Shape Sepolia (required if deploying to Shape)
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325

# Base Mainnet (required for mainnet)
NEXT_PUBLIC_BASE_MAINNET_CONTRACT=0x...

# Shape Mainnet (required for mainnet)
NEXT_PUBLIC_SHAPE_MAINNET_CONTRACT=0x...
```

### NO LONGER USED AS FALLBACK:
```bash
# This was dangerous - DO NOT rely on it as fallback
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0x...
```

---

## Testing

### Test 1: Network with Contract Deployed
```bash
1. Set NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT in .env
2. Connect to Base Sepolia
3. Try to mint → Should work ✅
4. Generator shows Base contract address ✅
```

### Test 2: Network without Contract
```bash
1. Don't set NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT
2. Connect to Shape Sepolia
3. Try to mint → Blocked with error message ✅
4. Generator shows "Not deployed on this network" ✅
5. No accidental transaction to Base contract ✅
```

### Test 3: Switching Networks
```bash
1. Connect to Base Sepolia (has contract)
2. All features work ✅
3. Switch to Shape Sepolia (no contract set)
4. Features disabled, clear error messages ✅
5. Switch back to Base Sepolia
6. Features work again ✅
```

---

## Migration Guide

### For Developers

If you're deploying to a new network:

**OLD WAY (Dangerous):**
```bash
# Could rely on fallback - risky!
# Just deploy and forget to set variable
```

**NEW WAY (Safe):**
```bash
# Deploy contract
forge script script/DeployShapeSepolia.s.sol --rpc-url shape-sepolia --broadcast

# Get contract address: 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325

# MUST set in .env (no fallback)
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325

# Test: Try minting on Shape Sepolia
# Should work if configured correctly ✅
# Should fail clearly if not configured ✅
```

---

## Summary

### What Changed
- ❌ Removed dangerous fallback to `config.contracts.onchainRugs`
- ✅ Contract addresses now network-specific only
- ✅ Clear error messages when contract not deployed
- ✅ Protection against accidental cross-network transactions

### Impact
- 🛡️ **Users protected** from losing ETH to wrong network
- 🔒 **Developers forced** to configure each network properly
- 📝 **Clear errors** when configuration missing
- ✅ **Fail-safe** design prevents silent failures

### Risk Assessment

**Before:** 🔴 **HIGH RISK**
- Missing env var → silent fallback
- Wrong network → wrong contract
- User loses ETH

**After:** 🟢 **LOW RISK**
- Missing env var → clear error
- Wrong network → transaction blocked
- User keeps ETH

---

**Date**: October 28, 2025  
**Priority**: 🔴 Critical Security Fix  
**Status**: ✅ Complete  
**Impact**: Prevents ETH loss from misconfiguration

