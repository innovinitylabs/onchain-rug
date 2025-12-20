# Frontend ERC-8021 Integration Progress

## Status: In Progress

### Completed ✅

1. **Marketplace Purchase (`useBuyListing`)**
   - ✅ Updated to use `sendTransaction` with ERC-8021 suffix
   - ✅ Attribution codes automatically appended
   - ✅ Ready for testing

2. **Marketplace Offer Acceptance (`useAcceptOffer`)**
   - ✅ Updated to use `sendTransaction` with ERC-8021 suffix
   - ✅ Attribution codes automatically appended
   - ✅ Ready for testing

### In Progress ⏳

3. **Minting (`useRugMinting`)**
   - ⏳ Direct mint path (Shape chain) - needs update
   - ⏳ Cross-chain mint path (Relay) - needs special handling
   - Status: Requires encoding + suffix for direct path

4. **Maintenance Functions (`useCleanRug`, `useRestoreRug`, `useMasterRestoreRug`)**
   - ⏳ All need to be updated to use `sendTransaction`
   - ⏳ Attribution codes need to be appended
   - Status: Similar pattern to marketplace

### Remaining 📋

5. **Offer Creation (`useMakeOffer`)**
   - Can use `writeContract` (no attribution needed on creation)

6. **Other Marketplace Functions**
   - `useCreateListing` - No attribution needed
   - `useCancelListing` - No attribution needed
   - `useUpdateListingPrice` - No attribution needed
   - `useCancelOffer` - No attribution needed

---

## Implementation Pattern

For transactions that need ERC-8021 attribution:

```typescript
// 1. Import utilities
import { appendERC8021Suffix, getAllAttributionCodes } from '@/utils/erc8021-utils'
import { encodeFunctionData } from 'viem'
import { useSendTransaction } from 'wagmi'

// 2. Encode function call
const encodedData = encodeFunctionData({
  abi: marketplaceABI,
  functionName: 'buyListing',
  args: [BigInt(tokenId)],
})

// 3. Get attribution codes
const codes = getAllAttributionCodes()

// 4. Append ERC-8021 suffix
const dataWithAttribution = appendERC8021Suffix(encodedData, codes)

// 5. Send transaction
sendTransaction({
  to: contractAddress,
  data: dataWithAttribution,
  value: parseEther(price),
})
```

---

## Next Steps

1. Update `useRugMinting` for direct mint path
2. Handle cross-chain mint (may need relay API modification)
3. Update maintenance hooks
4. Test all integrations
5. Verify attribution events are emitted

