# AI Agent Maintenance Guide (x402-style, single transaction)

This guide explains how external AI agents can perform rug maintenance in a single on-chain transaction while paying both the maintenance cost and a service fee.

No server-side AI is required. Your agent integrates with two things:
- Read-only quote/status APIs (for UX)
- On-chain contract calls (single-tx execution)

## Authorize Agent (one-time per owner)

Owners authorize an agent once to maintain all of their rugs:

```
function authorizeMaintenanceAgent(address agent) external
function revokeMaintenanceAgent(address agent) external
```

## Quote Flow (optional, x402-style)

For UX, fetch a quote (HTTP 402) before executing on-chain:

- GET `/api/maintenance/status/:tokenId` → canClean/canRestore/needsMaster + costs
- GET `/api/maintenance/quote/:tokenId/:action` where `:action` ∈ `clean|restore|master`

Response (402) includes:
```
{
  "x402": {
    "accepts": [{
      "network": "shape-sepolia",
      "asset": "0x0000000000000000000000000000000000000000",
      "payTo": "<contract>",
      "maxAmountRequired": "<totalWei>",
      "extra": {
        "function": "cleanRugAgent",
        "maintenanceWei": "...",
        "serviceFeeWei": "...",
        "totalWei": "..."
      }
    }]
  }
}
```

Reference: x402 starter kit for payment requirement format: [x402-starter-kit](https://github.com/dabit3/x402-starter-kit)

## Single-Transaction Execution

Your agent executes one on-chain call and pays `maintenanceWei + serviceFeeWei`:

```
function cleanRugAgent(uint256 tokenId) external payable
function restoreRugAgent(uint256 tokenId) external payable
function masterRestoreRugAgent(uint256 tokenId) external payable
```

Rules:
- Caller must be an authorized agent for the rug owner
- `msg.value == maintenanceCost + serviceFee`
- Contract performs maintenance and transfers the service fee to `feeRecipient`

## Reading Fees (on-chain)

Admin-configured fees and recipient can be read via:

```
function getAgentServiceFees() external view returns (
  uint256 cleanFee,
  uint256 restoreFee,
  uint256 masterFee,
  address feeRecipient
)
```

## Agent Pseudocode (viem)

```ts
// 1) Quote (optional)
await fetch(`/api/maintenance/quote/${tokenId}/clean`)

// 2) Execute
await walletClient.writeContract({
  address: contract,
  abi,
  functionName: 'cleanRugAgent',
  args: [tokenId],
  value: maintenanceWei + serviceFeeWei
})
```

## Errors
- "Agent not authorized" → Owner must call `authorizeMaintenanceAgent(agent)`
- "Incorrect payment" → Ensure `msg.value` equals maintenance + fee
- "Rug doesn't need cleaning right now" / "Restoration not available" → Check status endpoint


