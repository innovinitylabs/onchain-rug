# OnchainRugs Pricing Structure

## 📊 Complete Pricing Overview

### 🎯 **Minting Prices**

| Text Lines | Base Price | Additional Cost | Total Cost | Description |
|------------|------------|-----------------|------------|-------------|
| 0-1 lines  | 0.0001 ETH | 0 ETH          | 0.0001 ETH | Base price for any mint |
| 2-3 lines  | 0.0001 ETH | +0.00111 ETH each | 0.00121-0.00232 ETH | Additional cost per line |
| 4-5 lines  | 0.0001 ETH | +0.00222 ETH each | 0.00454-0.00676 ETH | Higher cost for longer text |

**Formula:**
```
Total Cost = 0.0001 + (lines 2-3 × 0.00111) + (lines 4-5 × 0.00222)
```

### 🧽 **Cleaning Prices**

| Time Since Last Clean | Cost | Description |
|----------------------|------|-------------|
| 0-30 days | **FREE** | Free cleaning period |
| 30+ days | **0.0009 ETH** | Paid cleaning (very affordable!) |

### 🎨 **Texture Development Timeline**

| Time Since Minting | Texture Level | Description |
|-------------------|---------------|-------------|
| 0-30 days | **Smooth (Level 0)** | No texture, clean appearance |
| 30-90 days | **Moderate (Level 1)** | Light texture development |
| 90+ days | **Heavy (Level 2)** | Full texture, aged appearance |

### 🧹 **Cleaning & Laundering Effects**

#### **Paid Cleaning (`cleanRug`)**
- ✅ Removes all dirt (sets to Level 0)
- ✅ Sets texture to **Moderate Level (1)**
- ✅ Resets cleaning timer
- 💰 Cost: 0.0009 ETH

#### **Laundering (Sale Price Increase)**
- ✅ Removes all dirt (sets to Level 0)
- ✅ Sets texture to **Smooth Level (0)**
- ✅ Resets cleaning timer
- 💰 Triggered when sale price increases

### 🕐 **Aging System**

#### **Dirt Accumulation**
- **Light Dirt**: Appears after 3 days without cleaning
- **Heavy Dirt**: Full dirt level after 7 days without cleaning

#### **Texture Development**
- **Moderate Texture**: Starts at 30 days since minting
- **Heavy Texture**: Full texture at 90 days since minting

### 💰 **Cost Examples**

#### **Minting Examples:**
```
1 line:  "Hello"                    = 0.0001 ETH
2 lines: "Hello\nWorld"             = 0.00121 ETH
3 lines: "Hello\nWorld\nNFT"        = 0.00232 ETH
4 lines: "Hello\nWorld\nNFT\nRug"   = 0.00454 ETH
5 lines: "Hello\nWorld\nNFT\nRug\nArt" = 0.00676 ETH
```

#### **Cleaning Examples:**
```
Day 15:  Clean rug = FREE
Day 45:  Clean rug = 0.0009 ETH
Day 100: Clean rug = 0.0009 ETH
```

### 🔄 **Dynamic Pricing Benefits**

1. **Affordable Base**: 0.0001 ETH minimum mint cost
2. **Scalable Text**: Higher costs for longer text prevent spam
3. **Free Maintenance**: 30-day free cleaning period
4. **Low Cleaning Cost**: 0.0009 ETH is very affordable
5. **Automatic Laundering**: Sale price increases trigger free cleaning

### 📈 **Economic Model**

- **Text Uniqueness**: Each text combination can only be minted once
- **Aging Mechanics**: Rugs evolve over time, creating dynamic NFTs
- **Maintenance Costs**: Low cleaning costs encourage regular maintenance
- **Value Preservation**: Laundering system maintains rug quality

### 🎯 **Target Market**

- **Art Collectors**: Unique generative art with aging mechanics
- **Text Enthusiasts**: Custom text with guaranteed uniqueness
- **NFT Traders**: Dynamic assets that evolve over time
- **Maintenance Enthusiasts**: Low-cost cleaning and care system

---

## 🚀 **Contract Address**

**Shape Sepolia Testnet:**
```
0xa43eBb099aA98Bdf4d2E3c0172Cafd600e113249
```

**Network:** Shape Sepolia (Chain ID: 11011)
**RPC URL:** https://sepolia.shape.network
