# OnchainRugs Project Overview

## 🎯 **Project Summary**

**OnchainRugs** is a fully on-chain generative NFT collection featuring dynamic aging mechanics, text uniqueness enforcement, and complete art rendering embedded in smart contracts. Each rug is a unique piece of generative art that evolves over time through dirt accumulation and texture development.

---

## 🏗️ **Architecture Overview**

### **Core Components:**
1. **Smart Contract** (`OnchainRugs.sol`) - Main NFT contract with embedded art algorithm
2. **Frontend** (Next.js) - Web interface for rug generation and minting
3. **Art Engine** - Complete P5.js algorithm embedded in contract
4. **Aging System** - Dynamic dirt and texture mechanics
5. **Text Uniqueness** - Cryptographic enforcement of unique text combinations

---

## 🔒 **IMMUTABLE (Cannot Be Changed)**

### **Constants (Hardcoded Forever):**
```solidity
uint256 public constant MAX_SUPPLY = 1111;           // Total supply limit
uint256 public constant ROYALTY_PERCENTAGE = 1000;   // 10% royalties
uint256 public constant BASE_PRICE = 0.0001 ether;   // Base mint price
uint256 public constant LINE_2_3_PRICE = 0.00111 ether; // Lines 2-3 cost
uint256 public constant LINE_4_5_PRICE = 0.00222 ether; // Lines 4-5 cost
string public constant RUG_ALGORITHM = "...";        // Complete P5.js code
```

### **Core Logic (Cannot Be Modified):**
- ✅ **Text Uniqueness System** - Once text is used, it's permanently unavailable
- ✅ **Aging Calculations** - Dirt and texture development algorithms
- ✅ **Art Generation** - Complete P5.js algorithm is embedded
- ✅ **Minting Logic** - Core minting and validation functions
- ✅ **NFT Standards** - ERC721 compliance and metadata structure

### **Data Structures (Immutable):**
- ✅ **RugData** - Individual rug parameters and metadata
- ✅ **AgingData** - Dirt and texture state tracking
- ✅ **Used Text Hashes** - Permanent record of used text combinations

---

## ⚙️ **ADJUSTABLE (Owner Can Change)**

### **Owner-Only Functions:**
```solidity
function withdraw() external onlyOwner
```
- 💰 **Revenue Withdrawal** - Owner can withdraw contract balance

### **Currently Implemented Adjustable Features:**
- 🔄 **Pricing Parameters** - Base price, line costs, cleaning cost
- 🔄 **Aging Timelines** - Free cleaning period, texture development times
- 🔄 **Art Algorithm** - Complete P5.js algorithm can be upgraded
- 🔄 **Royalty Settings** - Percentage and recipient address
- 🔄 **Emergency Controls** - Pause/unpause functionality

---

## 📊 **Current Contract State**

### **Deployed Contract:**
- **Address**: `0xa43eBb099aA98Bdf4d2E3c0172Cafd600e113249`
- **Network**: Shape Sepolia (Chain ID: 11011)
- **Owner**: `0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F`

### **Current Settings:**
- **Max Supply**: 1,111 rugs
- **Base Price**: 0.0001 ETH
- **Text Pricing**: 0.00111 ETH (lines 2-3), 0.00222 ETH (lines 4-5)
- **Cleaning Cost**: 0.0009 ETH (after 30 days)
- **Royalties**: 10% to contract owner

---

## 🎨 **Art Generation System**

### **Embedded Algorithm:**
- **Complete P5.js Code** - Full rendering engine in contract
- **Deterministic Generation** - Same seed always produces same rug
- **Dynamic Parameters** - Color palettes, stripe patterns, text rendering
- **Aging Effects** - Dirt overlays and texture development

### **Rendering Process:**
1. **Seed Generation** - Deterministic from text and minter address
2. **Parameter Injection** - Palette, stripes, text, aging state
3. **Algorithm Execution** - P5.js runs in browser with contract data
4. **Visual Output** - Unique rug rendered in real-time

---

## 🧽 **Aging & Maintenance System**

### **Dirt Accumulation:**
- **Light Dirt**: Appears after 3 days without cleaning
- **Heavy Dirt**: Full dirt level after 7 days without cleaning
- **Visual Impact**: Brown/black spots and edge dirt

### **Texture Development:**
- **Smooth (0-30 days)**: Clean, new appearance
- **Moderate (30-90 days)**: Light texture and wear
- **Heavy (90+ days)**: Full texture, aged appearance

### **Cleaning Mechanics:**
- **Free Period**: First 30 days after minting
- **Paid Cleaning**: 0.0009 ETH after 30 days
- **Laundering**: Automatic when sale price increases
- **Effects**: Removes dirt, adjusts texture level

---

## 🔐 **Security Features**

### **Text Uniqueness:**
- **Cryptographic Hashing** - SHA3 of text combinations
- **Permanent Records** - Once used, text stays unavailable
- **Gas Efficient** - O(1) lookup for uniqueness checks

### **Access Control:**
- **Owner-Only Functions** - Only contract owner can withdraw
- **Public Minting** - Anyone can mint (with payment)
- **No Admin Override** - No way to bypass text uniqueness

### **Economic Security:**
- **Fixed Pricing** - No price manipulation possible
- **Supply Limit** - Hard cap at 1,111 rugs
- **Revenue Model** - Owner receives minting fees and royalties

---

## 💰 **Economic Model**

### **Revenue Streams:**
1. **Minting Fees** - 0.0001 ETH base + text line costs
2. **Cleaning Fees** - 0.0009 ETH per cleaning after 30 days
3. **Royalties** - 10% on secondary sales

### **Cost Structure:**
- **Gas Costs** - Users pay for transactions
- **Maintenance** - Minimal (just withdrawal function)
- **No Ongoing Costs** - Art rendering is client-side

---

## 🚀 **Future Upgradeability**

### **What CAN Be Upgraded:**
- 🔄 **New Contract Deployment** - Deploy new version with different parameters
- 🔄 **Frontend Updates** - Website can be updated anytime
- 🔄 **Art Algorithm** - New contract could have different algorithm
- 🔄 **Pricing Model** - New contract could have different pricing

### **What CANNOT Be Upgraded:**
- ❌ **Existing NFTs** - Current rugs are permanent
- ❌ **Used Text** - Once used, text stays unavailable forever
- ❌ **Current Pricing** - Fixed in current contract
- ❌ **Art Algorithm** - Embedded in current contract

---

## 📈 **Project Status**

### **Current State:**
- ✅ **Contract Deployed** - Live on Shape Sepolia
- ✅ **Art Rendering** - Working with embedded P5.js
- ✅ **Minting System** - Functional with proper pricing
- ✅ **Aging System** - Dirt and texture mechanics active
- ✅ **Text Uniqueness** - Cryptographic enforcement working
- ✅ **Frontend Ready** - Updated for new contract

### **Ready for:**
- 🎯 **Public Launch** - All systems operational
- 🎯 **Mainnet Deployment** - When ready to go live
- 🎯 **Marketing Campaign** - Unique value proposition ready
- 🎯 **Community Building** - Engaging aging mechanics

---

## 🎯 **Key Value Propositions**

1. **True Uniqueness** - Text combinations can only be minted once
2. **Dynamic Art** - Rugs evolve and age over time
3. **Fully On-Chain** - No external dependencies for art
4. **Affordable Maintenance** - Low cleaning costs
5. **Generative Variety** - Infinite visual combinations
6. **Interactive Care** - Owners can maintain their rugs

This project represents a unique blend of generative art, gamification, and true digital ownership with permanent on-chain storage and dynamic visual evolution.
