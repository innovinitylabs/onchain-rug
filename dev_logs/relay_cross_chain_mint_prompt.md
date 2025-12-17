# 🚀 Cursor Prompt — Relay Cross-Chain Mint Frontend Integration (for Onchain Rugs)

This prompt is designed for your **onchain_rugs_working** project to integrate **Relay Protocol** for automatic cross-chain NFT minting — no manual bridging.

---

## 🎯 Context

- The project uses **Next.js App Router** and **Ethers.js**.
- The NFT contract supports `mintRugFor(address, ...)` for cross-chain calls.
- Supported chains: **ShapeL2**, **Base**, and **Ethereum**.
- The file `components/Web3Minting.tsx` handles mint logic.

We want to add a **unified cross-chain mint flow** that:
- Detects the connected chain.
- If user is already on ShapeL2 → mint directly.
- If user is on Base or Ethereum → use **Relay Protocol Calling Integration** to bridge + mint in one transaction.
- Easily supports new chains in the future.

---

## 🧩 Implementation Plan

### 1. Create New Files

#### `utils/relay-api.ts`
Handles communication with the Relay API.

#### `config/chains.ts`
Defines supported chain configs.

#### `hooks/use-relay-mint.ts`
Wraps Relay quote + submit logic.

#### `hooks/use-direct-mint.ts`
Handles on-chain mint on ShapeL2.

#### `hooks/use-chain-config.ts`
Returns config for a given chainId.

Update `hooks/use-rug-minting.ts` to automatically decide between direct or cross-chain mint.

---

### 2. Modify `components/Web3Minting.tsx`
- Import and use the updated `useRugMinting()`.
- Detect connected chain via wallet context.
- If chain = ShapeL2 → use direct mint.
- Else → call Relay mint.
- Display mint status (Bridge + Mint, Minting..., Done).

---

### 3. `utils/relay-api.ts`

```ts
export async function getRelayQuote(payload) { ... }
export async function submitRelayTransaction(quoteId) { ... }
```

Use the following endpoints:
- `POST https://api.relay.link/v1/quote`
- `POST https://api.relay.link/v1/submit`

Return quote + tx hash.

---

### 4. `hooks/use-relay-mint.ts`

Accept params:
```ts
{ originChainId, destinationChainId, recipient, encodedData, amount }
```

Encode contract call with `ethers.Interface` for `mintRugFor()`.

---

### 5. `hooks/use-direct-mint.ts`

Use `ethers.Contract` to call `mintRugFor()` directly on ShapeL2.

---

### 6. `config/chains.ts`

```ts
export const CHAINS = {
  ethereum: { name: "Ethereum", chainId: 1, rpcUrl: "...", nativeSymbol: "ETH" },
  base: { name: "Base", chainId: 8453, rpcUrl: "...", nativeSymbol: "ETH" },
  shape: { name: "ShapeL2", chainId: 77777, rpcUrl: "https://rpc.shape.network", nativeSymbol: "SHAPE", contractAddress: "0xYourRugNFTFacet" }
};
```

---

### 7. `hooks/use-rug-minting.ts`

Add logic:

```ts
const currentChainId = await provider.getNetwork().then(n => n.chainId);
const destinationChainId = CHAINS.shape.chainId;

if (currentChainId === destinationChainId) {
  return await mintDirect(provider, args, value);
} else {
  return await mintCrossChain({
    originChainId: currentChainId,
    destinationChainId,
    recipient,
    encodedData,
    amount: value
  });
}
```

---

### 8. Optional — UI in `Web3Minting.tsx`
Show a **“Bridge + Mint”** label when user isn’t on ShapeL2.

---

### 9. File Locations

| File | Purpose |
|------|----------|
| `/hooks/use-relay-mint.ts` | Relay bridge + mint logic |
| `/hooks/use-direct-mint.ts` | On-chain mint logic |
| `/hooks/use-chain-config.ts` | Returns current chain config |
| `/utils/relay-api.ts` | API interface for Relay |
| `/config/chains.ts` | Chain metadata |

---

### ✅ Output

- Full TypeScript code for each file
- Uses project conventions (Next.js + Ethers.js + Wagmi)
- No new top-level folders
- Backward compatible with existing mint button

---

Would you like a **follow-up Cursor prompt** that adds *WalletConnect integration and auto chain switch UI* (for Base ↔ ETH ↔ Shape)?
