# Diamond-Centric Pool Architecture

## Proposed Architecture Change

### Current Architecture (Query-Based)
```
User → Pool Contract → Queries Diamond Contract → Verifies → Pays User
```

### Proposed Architecture (Diamond-Centric)
```
User → Diamond Contract → Verifies Everything → Calls Pool Contract → Pays User
```

---

## How It Works

### Flow:
1. **User calls** `claimPoolRoyalties(uint256[] tokenIds)` on **Diamond Contract**
2. **Diamond Contract** does all verification:
   - Checks ownership (has direct access to storage)
   - Checks diamond frame status (has direct access to storage)
   - Validates token IDs
   - Calculates claimable amount
3. **Diamond Contract** calls `claimForTokens(address user, uint256[] tokenIds, uint256 amount)` on **Pool Contract**
4. **Pool Contract** verifies caller is diamond contract, then pays user

---

## Benefits

### ✅ **1. Gas Efficiency**
- **Before:** Pool makes N external calls to diamond (expensive)
- **After:** Diamond makes 1 external call to pool (cheap)
- **Savings:** ~50-70% gas reduction

### ✅ **2. Simpler Pool Contract**
- Pool contract becomes "dumb" payment handler
- No need to query diamond contract
- No need to verify ownership/frame status
- Just verifies caller and pays

### ✅ **3. Better Security**
- Diamond contract controls access (single entry point)
- Pool contract can't be called directly by users
- All verification happens in diamond (trusted)
- Pool contract just executes payment

### ✅ **4. Direct Storage Access**
- Diamond contract has direct access to storage
- No external calls needed
- Faster execution
- More reliable

### ✅ **5. Better User Experience**
- Users call diamond contract (same as other functions)
- Consistent interface
- No need to know pool contract address

---

## Implementation Details

### Diamond Contract Changes

#### New Function in RugCommerceFacet (or new RugPoolFacet)
```solidity
/**
 * @notice Claim pool royalties for diamond frame NFTs
 * @param tokenIds Array of token IDs to claim for
 */
function claimPoolRoyalties(uint256[] calldata tokenIds) external {
    require(tokenIds.length > 0, "No token IDs provided");
    require(tokenIds.length <= 100, "Too many tokens");
    
    // Get pool contract address
    RoyaltyConfig storage rs = royaltyStorage();
    require(rs.poolContract != address(0), "Pool not configured");
    
    // Verify caller owns all tokens and they have diamond frames
    uint256[] memory validTokenIds = new uint256[](tokenIds.length);
    uint256 validCount = 0;
    
    for (uint256 i = 0; i < tokenIds.length; i++) {
        uint256 tokenId = tokenIds[i];
        
        // Check ownership (direct storage access - no external call!)
        address owner = _ownerOf(tokenId);
        require(owner == msg.sender, "Not owner");
        
        // Check diamond frame (direct storage access!)
        require(LibRugStorage.hasDiamondFrame(tokenId), "Not diamond frame");
        
        validTokenIds[validCount] = tokenId;
        validCount++;
    }
    
    // Resize array
    assembly {
        mstore(validTokenIds, validCount)
    }
    
    // Call pool contract to calculate and pay
    IDiamondFramePool pool = IDiamondFramePool(rs.poolContract);
    pool.claimForTokens(msg.sender, validTokenIds);
}
```

### Pool Contract Changes

#### Simplified Pool Contract
```solidity
contract DiamondFramePool {
    address public immutable diamondContract;
    
    // Only diamond contract can call claimForTokens
    modifier onlyDiamond() {
        require(msg.sender == diamondContract, "Only diamond");
        _;
    }
    
    /**
     * @notice Claim royalties for tokens (called by diamond contract)
     * @param user Address to pay
     * @param tokenIds Array of valid token IDs (already verified by diamond)
     */
    function claimForTokens(address user, uint256[] calldata tokenIds) 
        external 
        onlyDiamond 
    {
        require(tokenIds.length > 0, "No tokens");
        
        // Calculate claimable amount (pool contract handles payment logic)
        uint256 totalClaimableAmount = _calculateClaimable(tokenIds);
        
        require(totalClaimableAmount >= minimumClaimableAmount, "Below minimum");
        require(totalClaimableAmount <= address(this).balance, "Insufficient balance");
        
        // Update withdrawn amounts
        _updateWithdrawn(tokenIds, totalClaimableAmount);
        
        // Pay user
        (bool success, ) = payable(user).call{value: totalClaimableAmount}("");
        require(success, "Transfer failed");
        
        emit Claim(user, tokenIds, totalClaimableAmount);
    }
    
    // Public view functions remain the same (for frontend)
    function getClaimableAmountForToken(uint256 tokenId) external view returns (uint256) {
        // Still queries diamond for verification (view function)
        // But actual claim goes through diamond
    }
}
```

---

## Architecture Comparison

### Current (Query-Based)
```
┌─────────────┐         ┌──────────────┐
│    User     │────────▶│ Pool Contract│
└─────────────┘         └──────┬───────┘
                               │
                               │ Queries (N calls)
                               ▼
                        ┌──────────────┐
                        │   Diamond    │
                        └──────────────┘
```

**Gas Cost:** High (N external calls)

### Proposed (Diamond-Centric)
```
┌─────────────┐         ┌──────────────┐
│    User     │────────▶│   Diamond    │
└─────────────┘         └──────┬───────┘
                               │
                               │ Direct Storage Access
                               │ (no external calls)
                               │
                               │ Calls (1 call)
                               ▼
                        ┌──────────────┐
                        │ Pool Contract│
                        └──────────────┘
```

**Gas Cost:** Low (1 external call)

---

## Security Model

### Access Control
- **Pool Contract:** Only accepts calls from diamond contract
- **Diamond Contract:** Verifies ownership and frame status
- **Users:** Can only call diamond contract

### Verification Flow
1. User calls diamond → Diamond verifies ownership
2. Diamond verifies diamond frame status
3. Diamond calculates claimable amount
4. Diamond calls pool → Pool verifies caller is diamond
5. Pool pays user

### Attack Vectors Mitigated
- ✅ **Direct pool calls:** Blocked by `onlyDiamond` modifier
- ✅ **Invalid tokens:** Verified by diamond before calling pool
- ✅ **Unauthorized claims:** Diamond checks ownership
- ✅ **Race conditions:** Diamond has latest state

---

## Gas Cost Analysis

### Current Implementation (10 tokens)
```
claim() function:
- 10x ownerOf() calls: ~50,000 gas
- 10x hasDiamondFrame() calls: ~50,000 gas
- 1x getDiamondFrameCount() call: ~5,000 gas
- Pool logic: ~30,000 gas
Total: ~135,000 gas
```

### Proposed Implementation (10 tokens)
```
claimPoolRoyalties() function:
- Direct storage reads (10x): ~20,000 gas (cheaper!)
- Diamond logic: ~15,000 gas
- 1x claimForTokens() call: ~5,000 gas
- Pool logic: ~30,000 gas
Total: ~70,000 gas
```

**Gas Savings: ~48% reduction**

---

## Implementation Steps

### Step 1: Add Interface to Pool Contract
```solidity
interface IDiamondFramePool {
    function claimForTokens(address user, uint256[] calldata tokenIds) external;
    function getClaimableAmountForToken(uint256 tokenId) external view returns (uint256);
    // ... other view functions
}
```

### Step 2: Modify Pool Contract
- Add `onlyDiamond` modifier
- Change `claim()` to `claimForTokens()` (internal)
- Keep view functions public (for frontend)

### Step 3: Add Function to Diamond Contract
- Add `claimPoolRoyalties()` to RugCommerceFacet or new RugPoolFacet
- Implement verification logic
- Call pool contract

### Step 4: Update Frontend
- Change calls from pool contract to diamond contract
- Use `claimPoolRoyalties()` instead of `claim()`

---

## Migration Considerations

### Backward Compatibility
- Keep old `claim()` function in pool (deprecated)
- Add new `claimForTokens()` function
- Gradually migrate users

### Or: Breaking Change
- Remove old `claim()` function
- Force all users to use diamond contract
- Cleaner but requires migration

---

## Recommended Approach

### ✅ **Implement Diamond-Centric Architecture**

**Reasons:**
1. ✅ Better gas efficiency
2. ✅ Simpler pool contract
3. ✅ Better security model
4. ✅ Direct storage access
5. ✅ Consistent user interface

**Trade-offs:**
- ⚠️ Pool contract becomes more "dumb" (but that's fine!)
- ⚠️ Requires diamond contract changes (but worth it)

---

## Code Structure

### Pool Contract Responsibilities
- ✅ Store and manage pool funds
- ✅ Calculate claimable amounts (magnified per-share)
- ✅ Track withdrawn amounts
- ✅ Pay users (when called by diamond)
- ✅ View functions for frontend

### Diamond Contract Responsibilities
- ✅ Verify ownership
- ✅ Verify diamond frame status
- ✅ Validate token IDs
- ✅ Call pool contract
- ✅ User-facing interface

---

## Conclusion

**This architecture change is HIGHLY RECOMMENDED** ✅

The diamond-centric approach:
- ✅ Solves the "dumb contract" problem (diamond does heavy lifting)
- ✅ Maintains fund isolation (separate contract)
- ✅ Improves gas efficiency significantly
- ✅ Enhances security (single entry point)
- ✅ Better user experience (consistent interface)

The pool contract becomes a simple payment handler, which is exactly what you want for fund isolation!

