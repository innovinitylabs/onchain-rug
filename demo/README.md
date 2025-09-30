# Demo Components

This folder contains educational demo components that showcase various blockchain interaction techniques.

## Blockchain Interaction Demo

**Location:** `/demo/blockchain-interaction`

**Access:** Visit `http://localhost:3000/demo/blockchain-interaction` when running the dev server.

### What It Demonstrates

#### ManualTokenURIFetch Component
- **Purpose**: Educational demonstration of raw blockchain interaction
- **Technique**: Manual eth_call without ethers.Contract wrappers
- **Features**:
  - Direct ABI encoding/decoding
  - Raw eth_call to blockchain
  - Base64 JSON parsing
  - Real-time Shape Sepolia data
  - Error handling and logging

#### Educational Value
- Shows how blockchain libraries work under the hood
- Useful for debugging when wrappers fail
- Demonstrates caching bypass techniques
- Reference implementation for raw contract calls

#### Technical Implementation
```typescript
// Instead of:
const contract = new ethers.Contract(address, abi, provider)
const result = await contract.tokenURI(tokenId)

// It does:
const rawResult = await manualEthCall('tokenURI', tokenId, chainId, apiKey)
const uri = decodeContractResult('tokenURI', rawResult)
```

## Usage

1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/demo/blockchain-interaction`
3. Click "Fetch TokenURI Manually" to see raw blockchain interaction
4. Check browser console for detailed logging

## Why Keep This

- **Educational**: Helps understand blockchain fundamentals
- **Debugging**: Reference for when high-level wrappers fail
- **Reference**: Example implementation for future raw calls
- **Testing**: Validates the unified utility functions work correctly

## Note

This demo is **not used in production** but serves as:
- Technical documentation
- Learning resource
- Troubleshooting reference
- Proof-of-concept for raw blockchain interaction
