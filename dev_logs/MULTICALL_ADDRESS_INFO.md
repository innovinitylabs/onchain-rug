# Multicall Address Information

## What is MULTICALL_ADDRESS?

`MULTICALL_ADDRESS` is the address of the Multicall3 contract deployed on your blockchain network. This contract allows batching multiple read-only contract calls into a single transaction, dramatically improving performance when fetching data for many NFTs.

## Default Value

The code uses a default value that works on most modern EVM chains:

```
0xcA11bde05977b3631167028862bE2a173976CA11
```

This is the standard **Multicall3** contract address that's deployed on:
- Base Sepolia ✅
- Base Mainnet ✅
- Ethereum Mainnet ✅
- Ethereum Sepolia ✅
- Shape Sepolia ✅
- Shape Mainnet ✅
- Most other modern EVM chains

## Do You Need to Set It?

**No, you don't need to set it!** The default value will work for most chains.

Only set `MULTICALL_ADDRESS` in your environment variables if:
1. Your chain uses a different multicall contract address
2. You're using a custom/private chain
3. You want to use a specific multicall implementation

## How to Check if Default Works

The default address should work on Base Sepolia (your current chain). If you encounter errors like:
- "Multicall contract not found"
- "Invalid multicall address"

Then you may need to find the correct multicall address for your specific chain.

## Finding the Correct Address for Your Chain

1. Check chain documentation
2. Look for "Multicall3" or "Multicall" in chain explorer
3. Check viem's chain definitions (they often include multicall addresses)
4. Deploy your own Multicall3 contract if needed

## Current Implementation

The code in `lib/multicall.ts` uses:
```typescript
const MULTICALL_ADDRESS = (
  process.env.MULTICALL_ADDRESS || 
  '0xcA11bde05977b3631167028862bE2a173976CA11'
) as Address
```

This means:
- If `MULTICALL_ADDRESS` is set in env → use that
- Otherwise → use the default (works for most chains)

## Recommendation

**Don't set it** unless you encounter issues. The default should work fine for Base Sepolia and most other chains you'll use.

