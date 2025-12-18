# User Referral System Using ERC-8021

## 🎯 Overview

**Goal**: Let users do the marketing work by incentivizing them to refer new users with on-chain rewards.

**How**: Use ERC-8021 attribution codes to track referrals and automatically reward referrers.

---

## 💡 The Referral System

### How It Works

1. **User Gets Referral Code**
   - Each wallet address gets a unique referral code: `ref-0xABC...` (shortened address)
   - OR: User generates a custom code: `ref-john123` (unique username)
   - Code is stored on-chain and mapped to their wallet address

2. **User Shares Their Code**
   - Share on Twitter: "Mint a rug using my code: ref-0xABC... and get a discount!"
   - Share on Discord: "Use code `ref-john123` when minting"
   - Website shows referral dashboard with their unique link

3. **New User Uses Referral Code**
   - When minting/buying, transaction includes referral code via ERC-8021 suffix
   - Contract parses code and identifies referrer
   - Automatically distributes reward to referrer

4. **Referrer Gets Paid**
   - % of mint fee goes to referrer (e.g., 10-20%)
   - % of marketplace fee goes to referrer (e.g., 5-10%)
   - Paid instantly on-chain, no manual work

---

## 🔧 Implementation Design

### Phase 1: Referral Code Registry

**New Facet**: `RugReferralFacet.sol`

```solidity
// Storage
struct ReferralConfig {
    mapping(address => string) addressToCode;      // wallet → code
    mapping(string => address) codeToAddress;      // code → wallet
    mapping(string => bool) codeExists;            // code uniqueness
    bool referralRewardsEnabled;                   // admin toggle
    uint256 mintReferralPercent;                   // e.g., 1000 = 10%
    uint256 marketplaceReferralPercent;            // e.g., 500 = 5%
}

// Functions
function registerReferralCode(string memory code) external {
    // User registers their code (e.g., "ref-john123")
    // Must be unique, min 3 chars, max 20 chars
}

function getReferralCode(address user) external view returns (string memory) {
    // Get user's referral code
}

function getReferrerFromCode(string memory code) external view returns (address) {
    // Get wallet address for a code
}
```

### Phase 2: ERC-8021 Attribution Integration

**How Referral Codes Travel in Transactions:**

```
Transaction Calldata:
[mintRug(...)] + ["ref-john123"] + [Schema ID] + [0x8021...8021 Marker]
```

**In `RugNFTFacet.sol` mintRug():**
```solidity
function mintRug(...) external payable {
    // ... existing mint logic ...
    
    // Parse ERC-8021 attribution (includes referral code)
    LibERC8021.AttributionData memory attribution = 
        LibERC8021.parseAttribution(msg.data);
    
    // Extract referral code from attribution codes
    address referrer = _extractReferrer(attribution.codes);
    
    if (referrer != address(0)) {
        // Calculate referral reward
        uint256 referralReward = (price * referralConfig.mintReferralPercent) / 10000;
        
        // Pay referrer
        payable(referrer).transfer(referralReward);
        
        emit ReferralRewardPaid(tokenId, referrer, referralReward);
        
        // Track referral stats
        referralStats[referrer].totalReferrals++;
        referralStats[referrer].totalEarned += referralReward;
    }
    
    // Continue with normal mint...
}
```

**In `RugMarketplaceFacet.sol` buyRug():**
```solidity
function buyRug(uint256 tokenId) external payable {
    // ... existing buy logic ...
    
    // Parse ERC-8021 attribution
    LibERC8021.AttributionData memory attribution = 
        LibERC8021.parseAttribution(msg.data);
    
    address referrer = _extractReferrer(attribution.codes);
    
    if (referrer != address(0)) {
        // Calculate referral reward from marketplace fee
        uint256 referralReward = (marketplaceFee * referralConfig.marketplaceReferralPercent) / 10000;
        
        payable(referrer).transfer(referralReward);
        emit ReferralRewardPaid(tokenId, referrer, referralReward);
    }
    
    // Continue with normal purchase...
}
```

### Phase 3: Frontend Integration

**User Dashboard:**
```
Your Referral Code: ref-0xABC...
Your Referral Link: https://onchainrugs.xyz/mint?ref=ref-0xABC...

📊 Your Stats:
- Total Referrals: 47
- Total Earned: 2.4 ETH
- Pending Rewards: 0.12 ETH
```

**Minting Page with Referral:**
```
Mint a Rug

Referral Code (optional): [ref-0xABC...]
Get 10% discount when using a referral code!
```

**Transaction with Referral Code:**
```javascript
// When user clicks "Mint with Referral Code"
const referralCode = "ref-0xABC...";
const tx = await contract.mintRug(..., {
    // Append ERC-8021 suffix with referral code
    data: originalCalldata + encodeERC8021Suffix([referralCode])
});
```

---

## 💰 Reward Structure

### Recommended Percentages

**Mint Referrals:**
- Referrer gets: **15% of mint fee**
- Example: Mint costs 0.01 ETH → Referrer gets 0.0015 ETH
- New user pays: **Same price** (you cover the referral cost)

**Marketplace Referrals:**
- Referrer gets: **10% of marketplace fee**
- Example: Sale with 2.5% fee on 1 ETH = 0.025 ETH fee → Referrer gets 0.0025 ETH
- Seller pays: **Same fee** (you cover the referral cost)

### Alternative: Cost Sharing

**Option A: You Cover Cost (Recommended for Growth)**
- User pays normal price
- You pay referrer from your revenue
- Better for user acquisition

**Option B: User Pays Less, Referrer Gets Less**
- New user gets 5% discount
- Referrer gets 10% of discounted price
- Both benefit, but less incentive

**Option C: Seller Pays Referral on Sales**
- When rug is sold via referral, seller pays referral fee
- Referrer gets 5% of sale price
- Higher incentive for referrers

---

## 📊 Referral Code Format

### Option 1: Address-Based (Simple)
```
Code: ref-0xABC123
Format: "ref-" + first 6 chars of address
Pros: Automatic, unique, no conflicts
Cons: Not user-friendly, long
```

### Option 2: Custom Username (User-Friendly)
```
Code: ref-john123
Format: "ref-" + user-chosen username
Pros: Memorable, shareable, branded
Cons: Need uniqueness checking, admin approval
```

### Option 3: Hybrid (Best of Both)
```
Default: ref-0xABC123 (auto-generated)
Custom: ref-john123 (user can set)
Users can upgrade to custom code (one-time fee?)
```

---

## 🎯 User Incentives

### For Referrers (Existing Users)

1. **Earn ETH** from every referral
2. **Leaderboard** showing top referrers
3. **Special badges/NFTs** for top referrers
4. **Exclusive perks** for power referrers

### For Referees (New Users)

1. **Discount on mint** (e.g., 10% off)
2. **Special welcome bonus** (e.g., first maintenance free)
3. **Both benefit** from referral system

---

## 📈 Marketing Impact

### Cost Comparison

**Traditional Marketing:**
- Ads: $1000/month = $12,000/year
- Influencers: $500/post × 20 = $10,000
- Total: ~$22,000/year

**Referral System:**
- Pay only when users convert (mint/buy)
- If 1000 mints at 0.01 ETH with 15% referral = 1.5 ETH/year (~$3,000)
- **7x cheaper** than traditional marketing
- Users do the work (sharing, promoting)
- Organic growth through user networks

### Growth Potential

- Each user brings 2-3 friends → exponential growth
- Users incentivized to share (they earn money)
- Lower customer acquisition cost
- Built-in viral loop

---

## 🔒 Security Considerations

### Code Validation
```solidity
function registerReferralCode(string memory code) external {
    require(bytes(code).length >= 3, "Code too short");
    require(bytes(code).length <= 20, "Code too long");
    require(!referralConfig.codeExists[code], "Code already taken");
    require(bytes(code)[0] == 'r' && bytes(code)[1] == 'e' && bytes(code)[2] == 'f', "Must start with 'ref-'");
    
    // Register code
    referralConfig.addressToCode[msg.sender] = code;
    referralConfig.codeToAddress[code] = msg.sender;
    referralConfig.codeExists[code] = true;
}
```

### Self-Referral Prevention
```solidity
function _extractReferrer(string[] memory codes) internal view returns (address) {
    for (uint i = 0; i < codes.length; i++) {
        if (stringsEqual(codes[i], "ref-")) {  // Starts with "ref-"
            address referrer = referralConfig.codeToAddress[codes[i]];
            // Prevent self-referral
            if (referrer != address(0) && referrer != msg.sender) {
                return referrer;
            }
        }
    }
    return address(0);
}
```

### Abuse Prevention
- Rate limiting: Max referrals per day
- Minimum time between referrals from same address
- Fraud detection for fake referrals

---

## 🚀 Implementation Steps

### Step 1: Registry Contract (Week 1)
- Create `RugReferralFacet.sol`
- Implement code registration
- Add code lookup functions
- Tests for code registration

### Step 2: ERC-8021 Integration (Week 2)
- Add `LibERC8021.sol` parser
- Integrate into `mintRug()` and `buyRug()`
- Implement referral reward distribution
- Tests for reward calculation

### Step 3: Frontend (Week 3)
- Referral code registration UI
- Referral dashboard with stats
- Mint page with referral code input
- Transaction builder with ERC-8021 suffix

### Step 4: Analytics & Leaderboard (Week 4)
- Off-chain analytics dashboard
- Top referrers leaderboard
- Referral stats API endpoints
- Reward tracking

---

## 💡 Advanced Features (Future)

### Multi-Level Referrals
- Referrer gets 15%, their referrer gets 5%
- Creates referral chains
- More complex but higher engagement

### Referral Tiers
- Bronze: 10% reward
- Silver: 15% reward (after 10 referrals)
- Gold: 20% reward (after 50 referrals)

### Referral Contests
- Monthly contests: Top referrer gets bonus NFT
- Special rewards for milestones
- Community engagement

### Referral Analytics Dashboard
- Track which referral codes convert best
- See referral sources (Twitter, Discord, etc.)
- Optimize referral program based on data

---

## 📋 Summary

**What We're Building:**
1. ✅ Referral code registry (on-chain)
2. ✅ ERC-8021 attribution parsing
3. ✅ Automatic reward distribution
4. ✅ Frontend dashboard and minting UI
5. ✅ Analytics and leaderboards

**Why It's Worth It:**
- 🚀 **7x cheaper** than traditional marketing
- 👥 Users do the marketing work
- 📈 Exponential growth potential
- 💰 Pay only when users convert
- 🎯 Built-in viral loop

**Cost to You:**
- 15% of mint fees (only on referred mints)
- 10% of marketplace fees (only on referred sales)
- Much cheaper than ads/influencers

**Revenue Impact:**
- More users = more volume
- Referral cost is offset by increased volume
- Long-term growth > short-term costs

---

**Ready to implement?** This is a perfect use case for ERC-8021 and will create a powerful user-driven marketing engine! 🚀

