# Root Cause Analysis: NFT Fetching Pipeline Failure

## Issue Summary
NFT fetching stopped working for wallet-owned NFTs in the dashboard. The system previously worked but stopped functioning at an unknown point in time.

## Pipeline Flow Analysis

### Complete Pipeline Flow

```
1. User connects wallet → Dashboard loads
   ↓
2. useReadContract hook checks balanceOf(address)
   ↓
3. If balance > 0, fetchUserRugs() is triggered
   ↓
4. Dashboard calls: /api/alchemy?endpoint=getNFTsForOwner&contractAddresses[]=${contractAddress}&owner=${address}&chainId=${chain?.id}
   ↓
5. API Route (app/api/alchemy/route.ts):
   - Extracts: endpoint, contractAddresses[], owner, chainId
   - Builds Alchemy URL: https://base-sepolia.g.alchemy.com/nft/v3/{API_KEY}/getNFTsForOwner?owner={owner}&contractAddresses[]={contract}&withMetadata=true
   - Calls Alchemy API
   - Returns response directly: NextResponse.json(data)
   ↓
6. Dashboard receives response:
   - Expects: ownerData.ownedNfts (array)
   - Iterates through ownedNfts
   - For each NFT, calls fetchRugData(tokenId)
   ↓
7. fetchRugData(tokenId):
   - Calls ownerOf(tokenId) to verify existence
   - Calls tokenURI(tokenId) to get metadata
   - Parses tokenURI JSON
   - Returns RugData object
   ↓
8. Dashboard displays NFTs
```

## Critical Issues Identified

### Issue #1: Response Structure Mismatch (POTENTIAL)

**Location:** `app/api/alchemy/route.ts:133`

**Problem:**
```typescript
console.log(`✅ Alchemy proxy success: ${endpoint} returned ${data.nfts?.length || 'data'}`)
```

The log checks `data.nfts`, but `getNFTsForOwner` returns `data.ownedNfts`, not `data.nfts`. This suggests:
- The log is checking the wrong field (minor issue)
- OR there's confusion about response structure (potential bug)

**Impact:** Low - logging only, but indicates potential misunderstanding of API response

**Fix:** Update log to check correct field:
```typescript
console.log(`✅ Alchemy proxy success: ${endpoint} returned ${data.ownedNfts?.length || data.nfts?.length || 'data'}`)
```

### Issue #2: Contract Address Resolution (CRITICAL)

**Location:** `app/dashboard/page.tsx:141-160`

**Problem:**
```typescript
const getContractAddress = (chainId: number): string => {
  switch (chainId) {
    case 84532: // Base Sepolia
      return process.env.NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT || process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT || ''
    // ...
  }
}

const contractAddress = chain ? getContractAddress(chain.id) : ''
```

**Potential Issues:**
1. If `chain` is undefined, `contractAddress` becomes empty string
2. If environment variables are not set, `contractAddress` becomes empty string
3. If user is on wrong chain, wrong contract address is used

**Impact:** HIGH - Empty contract address = Alchemy API returns empty results

**Evidence Needed:**
- Check browser console for `contractAddress` value
- Check if `chain?.id` is correctly set
- Verify environment variables are loaded

### Issue #3: Chain ID Mismatch (CRITICAL)

**Location:** `app/dashboard/page.tsx:488-490`

**Problem:**
```typescript
if (!chain?.id || chain.id !== 84532) {
  console.warn(`⚠️ Not on Base Sepolia (current: ${chain?.id}), Alchemy results may be incorrect`)
}
```

**Issue:** Warning is logged but execution continues. If user is on wrong chain:
- Wrong contract address is used
- Wrong Alchemy network endpoint is used
- Results will be empty or incorrect

**Impact:** HIGH - Wrong chain = wrong results

**Fix:** Should return early or switch chains:
```typescript
if (!chain?.id || chain.id !== 84532) {
  console.warn(`⚠️ Not on Base Sepolia (current: ${chain?.id}), switching...`)
  // Attempt to switch chains or return early
  return
}
```

### Issue #4: Alchemy API Response Handling (MEDIUM)

**Location:** `app/dashboard/page.tsx:494-501`

**Problem:**
```typescript
const ownerData = await ownerResponse.json()

console.log('Owner data response:', {
  chainId: chain?.id,
  contractAddress,
  ownedNftsCount: ownerData.ownedNfts?.length || 0,
  balance: balance?.toString()
})

if (ownerData.ownedNfts && ownerData.ownedNfts.length > 0) {
```

**Potential Issues:**
1. If Alchemy API returns error, `ownerData` might have `error` field instead of `ownedNfts`
2. No error handling for failed API calls
3. No validation that response is successful

**Impact:** MEDIUM - Silent failures if API returns error

**Fix:** Add error checking:
```typescript
if (!ownerResponse.ok) {
  const errorData = await ownerResponse.json()
  console.error('Alchemy API error:', errorData)
  return
}

const ownerData = await ownerResponse.json()

if (ownerData.error) {
  console.error('Alchemy API returned error:', ownerData.error)
  return
}
```

### Issue #5: Balance Check Dependency (MEDIUM)

**Location:** `app/dashboard/page.tsx:478-483`

**Problem:**
```typescript
if (!balance || balance === BigInt(0)) {
  console.log('User has no NFTs (balance is 0), skipping NFT loading')
  setUserRugs([])
  setLoading(false)
  return
}
```

**Potential Issues:**
1. If `balance` query fails or is undefined, it might not be `BigInt(0)`, so check might pass incorrectly
2. If `balance` is stale or incorrect, NFTs won't load even if user has them
3. Race condition: balance might not be loaded when this check runs

**Impact:** MEDIUM - Could prevent NFT loading if balance check fails

**Fix:** More robust check:
```typescript
if (balanceLoading) {
  // Wait for balance to load
  return
}

if (balanceError) {
  console.warn('Balance check failed, proceeding anyway:', balanceError)
  // Continue anyway - Alchemy will return empty if no NFTs
}

if (balance && balance > BigInt(0)) {
  // Proceed with loading
}
```

## When Did This Break?

### Timeline Analysis

**Most Likely Scenarios:**

1. **Environment Variable Change**
   - `NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT` was removed or changed
   - `.env` file was not loaded properly
   - Build process changed and env vars weren't included

2. **Chain Configuration Change**
   - User's wallet default chain changed
   - Wagmi configuration changed
   - Chain ID detection broke

3. **Alchemy API Changes**
   - Alchemy API endpoint changed
   - API key expired or was revoked
   - Rate limiting introduced

4. **Recent Code Changes**
   - Recent changes to error handling (storage encoding errors)
   - Changes to contract address resolution
   - Changes to chain detection logic

### Most Likely Root Cause

Based on the code analysis, the **most likely root cause** is:

**Empty or incorrect `contractAddress`** due to:
1. Missing environment variable `NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT`
2. Wrong chain ID detection (user on wrong chain)
3. Environment variables not loading in production

## Diagnostic Steps

### Step 1: Check Contract Address
```javascript
// In browser console on dashboard page
console.log('Contract Address:', document.querySelector('[data-contract-address]')?.textContent)
// OR check network tab for API call URL
```

### Step 2: Check Chain ID
```javascript
// In browser console
window.ethereum?.request({ method: 'eth_chainId' }).then(console.log)
```

### Step 3: Check Alchemy API Response
```javascript
// In browser console
fetch('/api/alchemy?endpoint=getNFTsForOwner&contractAddresses[]=0x15c5a551b8aA39a3A4E73643a681E71F76093b62&owner=YOUR_ADDRESS&chainId=84532')
  .then(r => r.json())
  .then(d => console.log('Alchemy Response:', d))
```

### Step 4: Check Environment Variables
```bash
# In terminal
grep NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT .env
```

## Recommended Fixes

### Fix #1: Add Contract Address Validation (CRITICAL)
```typescript
const contractAddress = chain ? getContractAddress(chain.id) : ''

if (!contractAddress) {
  console.error('❌ Contract address not configured for chain', chain?.id)
  setUserRugs([])
  setLoading(false)
  return
}
```

### Fix #2: Add Chain Validation (CRITICAL)
```typescript
if (!chain?.id) {
  console.error('❌ No chain detected')
  setUserRugs([])
  setLoading(false)
  return
}

if (chain.id !== 84532) {
  console.warn(`⚠️ Wrong chain (${chain.id}), expected Base Sepolia (84532)`)
  // Optionally: trigger chain switch
}
```

### Fix #3: Add API Error Handling (HIGH)
```typescript
const ownerResponse = await fetch(...)

if (!ownerResponse.ok) {
  const errorData = await ownerResponse.json()
  console.error('❌ Alchemy API error:', errorData)
  setUserRugs([])
  setLoading(false)
  return
}

const ownerData = await ownerResponse.json()

if (ownerData.error) {
  console.error('❌ Alchemy API returned error:', ownerData.error)
  setUserRugs([])
  setLoading(false)
  return
}
```

### Fix #4: Fix Logging in API Route (LOW)
```typescript
// app/api/alchemy/route.ts:133
const itemCount = data.ownedNfts?.length || data.nfts?.length || 0
console.log(`✅ Alchemy proxy success: ${endpoint} returned ${itemCount} items`)
```

## Verification Checklist

- [ ] Check browser console for `contractAddress` value
- [ ] Check browser console for `chain?.id` value
- [ ] Verify environment variable `NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT` is set
- [ ] Check Alchemy API response in network tab
- [ ] Verify user is on Base Sepolia (chain ID 84532)
- [ ] Check if balance query is working
- [ ] Verify Alchemy API key is valid
- [ ] Check server logs for API route errors

## Next Steps

1. **Immediate:** Add validation and error handling (Fixes #1-3)
2. **Diagnostic:** Run diagnostic steps to identify exact failure point
3. **Fix:** Apply appropriate fix based on diagnostic results
4. **Test:** Verify NFT fetching works end-to-end
5. **Monitor:** Add better logging to catch issues early

