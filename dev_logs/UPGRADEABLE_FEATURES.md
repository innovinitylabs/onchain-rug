# OnchainRugs Upgradeable Features

## 🎯 **Overview**

The OnchainRugs contract now includes comprehensive upgradeable features that allow the owner to adjust key parameters without requiring a new contract deployment. This provides flexibility while maintaining the core immutable features that ensure trust and transparency.

---

## 🔧 **Owner-Controlled Parameters**

### **1. Pricing System**
```solidity
function updatePricing(
    uint256 _basePrice,        // Base mint price
    uint256 _line2to3Price,    // Price for lines 2-3
    uint256 _line4to5Price,    // Price for lines 4-5
    uint256 _cleaningCost      // Cleaning cost after free period
) external onlyOwner
```

**Current Defaults:**
- Base Price: `0.0001 ETH`
- Line 2-3 Price: `0.00111 ETH`
- Line 4-5 Price: `0.00222 ETH`
- Cleaning Cost: `0.0009 ETH`

### **2. Aging System**
```solidity
function updateAging(
    uint256 _freeCleaningPeriod,    // Free cleaning period
    uint256 _moderateTextureDays,   // Days for moderate texture
    uint256 _heavyTextureDays       // Days for heavy texture
) external onlyOwner
```

**Current Defaults:**
- Free Cleaning Period: `30 days`
- Moderate Texture: `30 days`
- Heavy Texture: `90 days`

### **3. Art Algorithm**
```solidity
function updateArtAlgorithm(string calldata _newAlgorithm) external onlyOwner
```

**Features:**
- Complete P5.js algorithm replacement
- Maintains backward compatibility
- Allows for new visual effects and features
- Preserves existing NFT rendering

### **4. Royalty System**
```solidity
function updateRoyalties(uint256 _percentage, address _recipient) external onlyOwner
```

**Features:**
- Adjustable royalty percentage (max 10%)
- Changeable recipient address
- Enforced limits for security

### **5. Emergency Controls**
```solidity
function pause() external onlyOwner
function unpause() external onlyOwner
```

**Features:**
- Emergency stop for all minting and cleaning
- Immediate effect on contract state
- Reversible by owner

---

## 🛡️ **Security Features**

### **Access Control**
- All upgradeable functions are `onlyOwner`
- Owner can be transferred using OpenZeppelin's `Ownable`
- No admin keys or multi-sig required (can be added later)

### **Validation**
- Royalty percentage capped at 10% (1000 basis points)
- Non-zero address validation for royalty recipient
- Pause state prevents all user interactions

### **Events**
All parameter changes emit events for transparency:
```solidity
event PricingUpdated(uint256 basePrice, uint256 line2to3Price, uint256 line4to5Price, uint256 cleaningCost);
event AgingUpdated(uint256 freeCleaningPeriod, uint256 moderateTextureDays, uint256 heavyTextureDays);
event ArtAlgorithmUpdated();
event RoyaltyUpdated(uint256 percentage, address recipient);
event ContractPaused();
event ContractUnpaused();
```

---

## 📊 **Current Contract State**

### **Deployed Contract:**
- **Address**: `0xa43eBb099aA98Bdf4d2E3c0172Cafd600e113249`
- **Network**: Shape Sepolia (Chain ID: 11011)
- **Owner**: `0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F`

### **Current Parameters:**
```solidity
// Pricing
basePrice = 0.0001 ether
line2to3Price = 0.00111 ether
line4to5Price = 0.00222 ether
cleaningCost = 0.0009 ether

// Aging
freeCleaningPeriod = 30 days
moderateTextureDays = 30 days
heavyTextureDays = 90 days

// Royalties
royaltyPercentage = 1000 (10%)
royaltyRecipient = 0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F

// State
paused = false
```

---

## 🚀 **Usage Examples**

### **Update Pricing**
```solidity
// Increase base price to 0.0002 ETH
onchainRugs.updatePricing(
    0.0002 ether,  // New base price
    0.00111 ether, // Keep line 2-3 price
    0.00222 ether, // Keep line 4-5 price
    0.0009 ether   // Keep cleaning cost
);
```

### **Adjust Aging Timeline**
```solidity
// Make texture development slower
onchainRugs.updateAging(
    30 days,   // Keep free cleaning period
    60 days,   // Moderate texture at 60 days
    120 days   // Heavy texture at 120 days
);
```

### **Emergency Pause**
```solidity
// Pause all operations
onchainRugs.pause();

// Resume operations
onchainRugs.unpause();
```

### **Update Royalties**
```solidity
// Set 5% royalty to new recipient
onchainRugs.updateRoyalties(
    500,  // 5% royalty
    0x1234567890123456789012345678901234567890  // New recipient
);
```

---

## 🔒 **Immutable Features (Cannot Be Changed)**

### **Core Constants**
- `MAX_SUPPLY = 1111` - Total supply limit
- Text uniqueness system - Once used, text stays unavailable
- Core minting logic and validation
- NFT standards compliance (ERC721)

### **Data Integrity**
- Existing rug data cannot be modified
- Used text hashes remain permanent
- Aging data for existing NFTs preserved

---

## 📈 **Benefits of Upgradeable Design**

### **Flexibility**
- Adapt to market conditions
- Respond to community feedback
- Implement new features over time

### **Maintenance**
- Fix bugs without new deployment
- Update art algorithm for improvements
- Adjust economic parameters

### **Emergency Response**
- Pause operations if needed
- Address security concerns quickly
- Maintain user trust

### **Future-Proofing**
- Art algorithm can evolve
- Pricing can adapt to market
- Royalty system can be optimized

---

## ⚠️ **Important Considerations**

### **Owner Responsibility**
- Owner has significant control over contract parameters
- Changes affect all future mints and operations
- Historical data remains immutable

### **Transparency**
- All changes are recorded on-chain
- Events provide full audit trail
- Current parameters are publicly readable

### **Trust Model**
- Users must trust the owner to act responsibly
- Owner can be transferred to DAO or multi-sig
- Core immutable features provide baseline trust

---

## 🎯 **Best Practices**

### **For Owners**
1. **Test Changes**: Use testnet before mainnet updates
2. **Community Communication**: Announce changes before implementation
3. **Gradual Updates**: Make incremental changes rather than large overhauls
4. **Documentation**: Keep records of all parameter changes

### **For Users**
1. **Monitor Events**: Watch for parameter updates
2. **Understand Impact**: Know how changes affect your NFTs
3. **Participate**: Provide feedback on proposed changes
4. **Verify**: Check current parameters before minting

This upgradeable design provides the perfect balance between flexibility and trust, allowing the project to evolve while maintaining the core guarantees that make OnchainRugs unique.
