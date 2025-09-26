# 🧵 OnchainRugs - Complete Project Specification

## 🎯 Project Vision

**OnchainRugs** is a fully on-chain generative NFT collection featuring living, breathing digital rugs that age and require maintenance. Inspired by Chromie Squiggles' purity but with unique temporal mechanics, each rug evolves over time through dirt accumulation and texture development, creating emotional attachment and long-term value.

**Core Philosophy**: Art project first, financial incentives second. Focus on creating meaningful digital artifacts that users want to care for.

---

## 🏗️ Technical Architecture

### Diamond Pattern Implementation
```
DiamondRug (Core Contract)
├── RugNFTFacet          # ERC721 + Basic Minting
├── RugAgingFacet        # Dirt/Texture Aging System
├── RugMaintenanceFacet  # Cleaning/Restoration Services
├── RugCommerceFacet     # Withdraw/Royalties/Pricing
├── RugAdminFacet        # Owner Controls & Limits
├── RugLaunderingFacet   # Sale Tracking & Auto-Cleaning
└── RugTokenFacet        # $RUG Token Infrastructure (Future)
```

### Storage Architecture
```solidity
struct RugData {
    uint256 seed;                    // Generation seed
    string[] textRows;              // User text (1-5 lines)
    string paletteName;             // Color palette identifier
    string minifiedPalette;         // Compressed color data
    string minifiedStripeData;      // Compressed pattern data
    uint8 warpThickness;            // Design parameter (1-5)
    uint256 mintTime;               // Auto-set on mint
    string filteredCharacterMap;    // Used characters only
    uint8 complexity;               // Pattern complexity (1-5)
    uint256 characterCount;         // Total characters
    uint256 stripeCount;            // Pattern stripes
}

struct AgingData {
    uint256 lastCleaned;            // Last cleaning timestamp
    uint256 lastTextureReset;       // Last texture reset timestamp
    uint256 lastSalePrice;          // Highest sale price
    uint256[3] recentSalePrices;    // Last 3 sale prices
    uint8 dirtLevel;                // Current dirt (0-2) - deprecated, calculated
    uint8 textureLevel;             // Current texture aging (0-10) - deprecated, calculated
    uint256 launderingCount;        // Number of times laundered
    uint256 lastLaundered;          // Last laundering timestamp
    uint256 cleaningCount;          // Number of times cleaned
    uint256 restorationCount;       // Number of times restored
    uint256 masterRestorationCount; // Number of times master restored
    uint256 maintenanceScore;       // Calculated maintenance quality score
    string currentFrameLevel;       // Current frame level ("None", "Bronze", etc.)
    uint256 frameAchievedTime;      // When current frame was first achieved
    bool gracePeriodActive;         // Whether frame is in grace period
    uint256 gracePeriodEnd;         // Grace period expiration timestamp
    bool isMuseumPiece;             // Whether this is a permanent Diamond frame
}

struct RugConfig {
    uint256 collectionCap;          // Current max supply (editable 0-10000)
    uint256 walletLimit;            // NFTs per wallet (default: 7)
    uint256 reserveAmount;          // Team reserve allocation
    bool isLaunched;               // Launch state
    bool launderingEnabled;        // Global laundering toggle
    address[] exceptionList;       // Addresses exempt from wallet limits
}
```

---

## 🎨 Art Generation System

### Algorithm Components
- **P5.js Canvas**: 800x1200 pixel rugs
- **Weaving Patterns**: Solid, mixed, textured stripe types
- **Character Rendering**: Pixel-perfect text embedding
- **Color Palettes**: 100+ curated cultural palettes
- **PRNG System**: Deterministic seeded randomness
- **Dynamic Effects**: Dirt overlays, texture aging, fringe details

### Visual Features
- **Base Rug**: Woven textile pattern with user text
- **Aging Effects**: Progressive dirt and wear accumulation
- **Maintenance Impact**: Cleaning restores visual quality
- **Golden Background**: Special effect for early adopters on cap increase

### Technical Implementation
- **On-Chain Storage**: Minimal seed + parameters
- **Deterministic Generation**: Same input = identical output
- **Scripty.sol Integration**: External P5.js library storage
- **Base64 Encoding**: Self-contained HTML NFTs

---

## ⏰ Aging & Maintenance System

### Dirt Accumulation (Resettable)
```
Time Uncleaned | Dirt Level | Visual Effect
---------------|------------|--------------
0-3 days       | 0 (Clean) | No dirt
3-7 days       | 1 (Light) | Subtle spots/stains
7+ days        | 2 (Heavy) | Heavy soiling
```

### Texture Aging (Persistent)
```
Time Since Mint | Texture Level | Visual Effect
----------------|----------------|--------------
0-30 days       | 0 (Fresh)     | Crisp, new appearance
30-90 days      | 1 (Worn)      | Light wear patterns
90-180 days     | 2 (Aged)      | Moderate aging
...            | ...           | Progressive wear
Up to 10 levels| 10 (Ancient)  | Maximum aging
```

### Maintenance Services

#### Regular Cleaning
- **Cost**: Configurable (test: 0.00001 ETH)
- **Effect**: Resets dirt to 0, resets texture timer, earns maintenance points
- **Availability**: Anytime beneficial (has dirt, has texture aging, or free cleaning available)
- **Free Conditions**: First 30 days from mint OR last cleaned within 11 days (both configurable)
- **Frame Impact**: Required for framed rugs to reset texture timers and earn points

#### Rug Restoration
- **Cost**: Configurable (test: 0.00001 ETH per level)
- **Effect**: Reduces texture level by 1, sets dirt to 0
- **Availability**: Anytime texture level > 0
- **Master Restoration**: High cost, resets everything to level 0 (configurable test: 0.00001 ETH)

#### Laundering (Auto-Cleaning) (also be able to disable it)
- **Trigger**: Sale price > laundering threshold(editable) AND sale price > highest price among last 3 sales(or editable to just last sale)
- **Effect**: Full reset (dirt = 0, texture = 0)
- **Threshold**: Configurable minimum price for laundering eligibility (test: 0.00001 ETH, prod: ~0.005 ETH)
- **Tracking**: Last 3 sale prices per NFT (finds highest among them)
- **Global Toggle**: Owner can disable laundering for entire collection

### Economic Incentives
- **Well-Maintained Rugs**: Never age if regularly cleaned
- **Neglected Rugs**: Develop valuable "character" through aging
- **Trading Benefits**: Higher sale prices trigger full rejuvenation
- **Restoration Services**: Premium service tier for quick fixes

---

## 🖼️ Frame System

### Frame Philosophy
**Museum-Quality Digital Heirlooms**: Frames represent lifetime curation commitment, just like priceless art in museums. Each frame level signifies dedication to maintaining a digital masterpiece, with Diamond frames becoming permanent "museum pieces" that require ongoing stewardship.

### Frame Benefits Hierarchy
```
Bronze (25+ points):  No special benefits (milestone achievement)
Silver (50+ points):  🛡️ Dirt Immunity - Always pristine appearance
Gold (100+ points):   🛡️ Dirt Immunity + 🐌 25% slower texture aging
Platinum (200+ points): 🛡️ Dirt Immunity + 🐌 50% slower texture aging
Diamond (500+ points):  🛡️ Dirt Immunity + 🐌 75% slower texture aging + ♾️ PERMANENT STATUS
```

### Maintenance Score Calculation
```solidity
maintenanceScore = (cleaningCount × 2) +
                   (restorationCount × 5) +
                   (masterRestorationCount × 10) +
                   (launderingCount × 10)
```

### Frame Mechanics

#### Dirt Immunity (Silver+)
- Framed rugs (Silver+) never accumulate visible dirt
- Dirt level is permanently set to 0
- Still require texture maintenance (restoration services)

#### Texture Aging Reduction
- Gold: 25% slower texture progression
- Platinum: 50% slower texture progression
- Diamond: 75% slower texture progression
- Still requires periodic restoration to maintain appearance

#### Frame Persistence on Sale
- Frames transfer with NFT ownership
- New owner inherits maintenance responsibility
- Creates heirloom trading dynamics

#### Demotion Mechanics (Grace Period System)
- Score drops below threshold → Frame enters "tarnished" state (30 days)
- Visual frame becomes faded/translucent during grace period
- Full benefits maintained during grace period
- After 30 days: Frame lost unless score recovers
- **Exception**: Diamond frames NEVER demote (museum status)

#### Museum Piece Status (Diamond Frames)
- Once achieved, Diamond frames become permanent
- No demotion possible regardless of maintenance score
- Represents ultimate curation achievement
- Requires lifetime stewardship like owning fine art

### Frame Visual Design
- **Bronze**: Basic ornate border (achievement milestone)
- **Silver**: Elegant metallic frame (dirt immunity)
- **Gold**: Rich golden accents (enhanced preservation)
- **Platinum**: Sleek modern design (superior preservation)
- **Diamond**: Crystal-clear premium frame (museum quality)

---

## 📊 Transparent Metadata & History

### TokenURI Transparency
All game data and statistics are fully visible in NFT metadata for complete transparency:

### Core Attributes (Always Visible)
```json
{
  "Frame Level": "Diamond",
  "Maintenance Score": "750",
  "Dirt Level": "0",
  "Texture Level": "2",
  "Mint Time": "1640995200",
  "Last Cleaned": "1641081600",
  "Last Texture Reset": "1641081600"
}
```

### Maintenance History (Complete Activity Log)
```json
{
  "Cleaning Count": "45",
  "Restoration Count": "12",
  "Master Restoration Count": "3",
  "Laundering Count": "8",
  "Last Laundered": "1641168000",
  "Maintenance Score": "750"
}
```

### Sale History (Trading Transparency)
```json
{
  "Last Sale Price": "0.05",
  "Recent Sale Prices": ["0.03", "0.04", "0.05"],
  "Total Sales": "5",
  "Highest Sale Price": "0.08"
}
```

### Frame Status Details
```json
{
  "Frame Level": "Diamond",
  "Frame Achieved Time": "1641254400",
  "Grace Period Active": false,
  "Grace Period End": null,
  "Museum Piece Status": true
}
```

### Complete Rug Data
```json
{
  "Text Lines": "3",
  "Character Count": "45",
  "Palette Name": "Persian Heritage",
  "Complexity": "4",
  "Warp Thickness": "3",
  "Stripe Count": "12",
  "Seed": "123456789"
}
```

### Transparency Benefits
- **Complete Auditability**: Every maintenance action is trackable
- **Fair Trading**: Buyers see full maintenance history
- **Achievement Verification**: Frame levels are provably earned
- **Museum Status Proof**: Diamond rugs have permanent certification
- **No Hidden Mechanics**: All aging and benefits are visible

---

## 🎮 Complete Gamification Flow

### User Journey: From Mint to Museum Piece

#### **Phase 1: Fresh Rug (Days 0-30)**
```
🎯 Goal: Learn maintenance basics, earn first frame
📅 Timeline: First 30 days after mint
💰 Pricing: FREE cleaning period

Daily Flow:
├── Mint rug → Fresh, clean appearance
├── Days 0-3: Rug stays clean (no dirt accumulation)
├── Day 3+: Light dirt appears (level 1)
├── CLEANING: FREE (within 30 days of mint)
│   ├── Effect: Dirt = 0, earns 2 maintenance points
│   ├── Frequency: As needed (dirt appears every 3-4 days)
│   └── Result: Keeps rug looking pristine
├── RESTORE: Paid (if texture ages, but rare in first 30 days)
└── FRAME PROGRESSION: Bronze at 25 points (12-13 cleanings)

Key Pricing Rules:
✅ Cleaning: FREE for first 30 days
✅ Restoration: PAID if texture ages (rare)
✅ Laundering: FREE if sold above threshold (automatic)
```

#### **Phase 2: Active Maintenance (Days 30-200)**
```
🎯 Goal: Achieve Silver frame, master maintenance rhythm
📅 Timeline: Days 30-200 after mint
💰 Pricing: Mixed (free windows + paid services)

Maintenance Rhythm:
├── DIRT CYCLE: Every 3-7 days
│   ├── Dirt level increases: 0 → 1 → 2
│   └── Cleaning needed every 3-7 days
├── TEXTURE AGING: Gradual over months
│   ├── Texture level increases slowly: 0 → 1 → 2...
│   └── Restoration needed every 1-2 months
└── FREE CLEANING WINDOWS
    ├── Available 11 days after last cleaning
    └── Allows strategic maintenance planning

Pricing Scenarios:
✅ CLEANING:
   ├── FREE: Within 11 days of last clean (free window)
   ├── PAID: Outside free window (0.00001 ETH test)
   └── ALWAYS AVAILABLE: Even for framed rugs (for timer reset)

✅ RESTORATION:
   ├── PAID: Always requires payment (0.00001 ETH test)
   ├── AVAILABLE: When texture level > 0
   └── EFFECT: Reduces texture by 1, sets dirt to 0

✅ LAUNDERING:
   ├── FREE: Automatic on qualifying sales
   ├── TRIGGER: Sale price > threshold AND > highest of last 3 sales
   └── EFFECT: Full reset (dirt=0, texture=0) + 10 maintenance points

Frame Progression:
├── Silver (50 points): ~25 cleanings + some restorations
├── Gold (100 points): ~50 cleanings + 10-15 restorations
└── Benefits: Dirt immunity, slower texture aging
```

#### **Phase 3: Elite Curation (200+ Days)**
```
🎯 Goal: Reach Platinum/Diamond status
📅 Timeline: 200+ days, ongoing maintenance
💰 Pricing: Premium services for high-value rugs

Advanced Strategies:
├── FRAME BENEFITS: Dirt immunity saves cleaning costs
├── TEXTURE MANAGEMENT: Slower aging reduces restoration frequency
│   ├── Gold: 25% slower aging
│   ├── Platinum: 50% slower aging
│   └── Diamond: 75% slower aging
├── FREE CLEANING: Still available in 11-day windows
└── LAUNDERING: More valuable for high-tier rugs

Pricing Optimization:
✅ CHEAP MAINTENANCE: Use free cleaning windows strategically
✅ TIMING: Clean just before free window expires
✅ BATCHING: Combine cleaning + restoration when needed
✅ TRADING: Use laundering for free full resets

Diamond Achievement:
├── 500+ maintenance points required
├── Permanent museum piece status
├── Never loses frame, regardless of neglect
└── Ultimate curation achievement
```

### Detailed Pricing Matrix

#### **Cleaning Costs by Scenario**
```
┌─────────────────┬──────────────┬──────────────────┬─────────────┐
│ Scenario        │ Free?        │ Cost (Test)      │ Conditions  │
├─────────────────┼──────────────┼──────────────────┼─────────────┤
│ Fresh Rug       │ ✅ FREE      │ 0 ETH           │ < 30 days   │
│ Free Window     │ ✅ FREE      │ 0 ETH           │ < 11 days   │
│ Standard        │ ❌ PAID      │ 0.00001 ETH     │ Always      │
│ Framed Rug      │ ✅ FREE      │ 0 ETH           │ Free window │
│ Maintenance     │ ❌ PAID      │ 0.00001 ETH     │ Timer reset │
└─────────────────┴──────────────┴──────────────────┴─────────────┘
```

#### **Restoration Costs**
```
┌─────────────────┬──────────────┬──────────────────┬─────────────┐
│ Service         │ Free?        │ Cost (Test)      │ Conditions  │
├─────────────────┼──────────────┼──────────────────┼─────────────┤
│ Texture Restore │ ❌ PAID      │ 0.00001 ETH     │ Level > 0   │
│ Master Restore  │ ❌ PAID      │ 0.00001 ETH     │ Any aging   │
│ Laundering      │ ✅ FREE      │ 0 ETH           │ Auto on sale│
└─────────────────┴──────────────┴──────────────────┴─────────────┘
```

### Economic Strategy Guide

#### **Cost Optimization Strategies**
```
🎯 MINIMAL MAINTENANCE (Basic Care)
├── Clean every 3-4 days during free windows
├── Occasional restoration when texture ages
├── Goal: Bronze frame, basic preservation
└── Cost: ~0.00005 ETH/month (mostly free cleanings)

🎯 ACTIVE CURATION (Frame Progression)
├── Clean regularly to maximize points
├── Restore proactively to maintain appearance
├── Goal: Gold/Platinum frame benefits
└── Cost: ~0.0001-0.0002 ETH/month (mixed free/paid)

🎯 ELITE STEWARDSHIP (Diamond Status)
├── Maximize maintenance points through all services
├── Use laundering for free resets on trades
├── Goal: Permanent museum piece status
└── Cost: ~0.0003-0.0005 ETH/month (premium services)
```

#### **Revenue Opportunities**
```
💰 MAINTENANCE FEES: Primary revenue from cleaning/restoration
💰 ROYALTIES: 10% on secondary sales (EIP-2981)
💰 FRAMED NFT PREMIUM: Higher value for maintained rugs
💰 LAUNDERING INCENTIVES: Trading activity drives engagement
💰 MUSEUM PIECE VALUE: Diamond frames become collectibles
```

### Frame Impact on Economics

#### **Silver+ Frame Benefits**
```
✅ DIRT IMMUNITY: Eliminates cleaning costs for dirt removal
✅ APPEARANCE: Always looks pristine (marketing value)
✅ TIMER MANAGEMENT: Still need cleaning for texture timer reset
❌ TEXTURE AGING: Still progresses (requires restoration)
```

#### **Gold+ Frame Benefits**
```
✅ SLOWER AGING: 25-75% reduction in texture progression
✅ COST SAVINGS: Fewer restoration services needed
✅ STATUS APPEAL: Premium appearance commands higher prices
❌ MAINTENANCE STILL REQUIRED: Cannot ignore completely
```

#### **Diamond Museum Status**
```
✅ PERMANENT VALUE: Never loses frame or benefits
✅ MARKET PREMIUM: Commands highest collector prices
✅ LEGACY ASSET: Becomes family heirloom
❌ LIFETIME COMMITMENT: Requires ongoing stewardship
```

---

## 📈 Success Metrics & Balance

### **User Engagement Targets**
- **80%**: Users who clean at least once in first 30 days
- **60%**: Users who achieve Bronze frame
- **30%**: Users who reach Silver+ frames
- **10%**: Users who achieve Diamond status

### **Economic Balance**
- **Free Actions**: 70% of maintenance should be free
- **Paid Services**: 30% premium services for revenue
- **Frame Incentives**: Clear value proposition for each tier
- **Trading Activity**: Laundering drives secondary market

### **Long-term Sustainability**
- **Maintenance Revenue**: Steady income from engaged users
- **Collector Value**: Framed rugs appreciate over time
- **Community Building**: Shared curation culture
- **Museum Economy**: Diamond pieces as blue-chip assets

---

## 💰 Revenue & Pricing Model

### Minting Costs
```solidity
// Base pricing (all configurable - testnet values for development)
uint256 public basePrice = 0.00001 ether;        // Base mint cost (test: 0.00001 ETH, prod: ~0.003 ETH)
uint256 public linePrice1 = 0.00001 ether;       // Additional for line 1 (test: 0.00001 ETH, prod: ~0.001 ETH)
uint256 public linePrice2 = 0.00001 ether;       // Additional for line 2 (test: 0.00001 ETH, prod: ~0.002 ETH)
uint256 public linePrice3 = 0.00001 ether;       // Additional for line 3 (test: 0.00001 ETH, prod: ~0.003 ETH)
uint256 public linePrice4 = 0.00001 ether;       // Additional for line 4 (test: 0.00001 ETH, prod: ~0.004 ETH)
uint256 public linePrice5 = 0.00001 ether;       // Additional for line 5 (test: 0.00001 ETH, prod: ~0.005 ETH)

// Total cost calculation
function getMintPrice(uint256 lineCount) public view returns (uint256) {
    uint256 total = basePrice;
    if (lineCount >= 1) total += linePrice1;
    if (lineCount >= 2) total += linePrice2;
    if (lineCount >= 3) total += linePrice3;
    if (lineCount >= 4) total += linePrice4;
    if (lineCount >= 5) total += linePrice5;
    return total;
}
```

### Service Pricing (configurable - testnet values for development)
```solidity
uint256 public cleaningCost = 0.00001 ether;         // Regular cleaning (test: 0.00001 ETH, prod: ~0.001 ETH)
uint256 public restorationCost = 0.00001 ether;      // Per level restoration (test: 0.00001 ETH, prod: ~0.002 ETH)
uint256 public masterRestorationCost = 0.00001 ether; // Full reset (test: 0.00001 ETH, prod: ~0.01 ETH)
uint256 public launderingThreshold = 0.00001 ether;  // Auto-clean threshold (test: 0.00001 ETH, prod: ~0.005 ETH)
```

### Revenue Streams
1. **Primary Sales**: Minting fees (base + per line) - Test: 0.00001-0.00006 ETH, Prod: ~0.003-0.008 ETH
2. **Maintenance**: Cleaning and restoration services - Test: 0.00001 ETH, Prod: ~0.001-0.01 ETH
3. **Royalties**: 10% on secondary sales (EIP-2981) - Production only
4. **Future Token**: $RUG token ecosystem

---

## 🔐 Smart Contract Features

### Core NFT Standards
- **ERC721**: Full compliance with metadata, enumeration
- **EIP-2981**: Royalty payments on secondary sales
- **Ownable**: Owner controls for all parameters
- **Pausable**: Emergency pause functionality

### Owner Controls (All Updateable)
```solidity
// Pricing
function updateMintPricing(uint256[6] calldata prices) external onlyOwner;
function updateServicePricing(uint256[4] calldata prices) external onlyOwner;

// Aging parameters
function updateAgingThresholds(uint256[6] calldata days) external onlyOwner; // dirt1, dirt2, texture1, texture2, freeCleanDays, freeCleanWindow

// Collection management
function updateCollectionCap(uint256 newCap) external onlyOwner;
function updateWalletLimit(uint256 newLimit) external onlyOwner;
function addToExceptionList(address account) external onlyOwner;
function removeFromExceptionList(address account) external onlyOwner;

// Laundering controls
function setLaunderingEnabled(bool enabled) external onlyOwner;

// Revenue collection
function withdraw() external onlyOwner; // Uses call() for safety
function updateRoyaltyRecipients(address[] calldata recipients, uint256[] calldata shares) external onlyOwner;
```

### Security Features
- **Reentrancy Protection**: NonReentrant on state-changing functions
- **Input Validation**: Comprehensive parameter checking
- **Access Control**: Owner-only for sensitive operations
- **Emergency Controls**: Pause/unpause for emergencies

### Business Logic
- **Text Uniqueness**: Global hash-based uniqueness enforcement
- **Wallet Limits**: 7 NFTs per wallet (fair distribution)
- **Exception List**: Team/tester addresses exempt from wallet limits
- **Fair Launch**: No presale, equal opportunity minting
- **Royalty Distribution**: Configurable split to multiple wallets (owner-controlled)

---

## 🎮 User Experience Flow

### Minting Process
1. **Text Input**: User enters 0-5 lines of text
2. **Preview Generation**: Client-side rug preview
3. **Price Calculation**: Automatic pricing based on text
4. **Wallet Verification**: Check 7-per-wallet limit
5. **Uniqueness Check**: Verify text not used before
6. **Mint Transaction**: On-chain minting with payment
7. **Receipt**: NFT in wallet with aging mechanics

### Ownership Experience
1. **Initial State**: Fresh, clean rug (level 0 dirt/texture)
2. **Aging Progression**: Gradual dirt/texture accumulation
3. **Maintenance Options**:
   - Wait for natural aging
   - Clean regularly to prevent aging
   - Use restoration for quick fixes
   - Trade for automatic laundering
4. **Visual Evolution**: Rug changes appearance over time
5. **Value Appreciation**: Well-maintained rugs gain "character"

---

## 🚀 Implementation Phases

### Phase 1: Core Diamond Infrastructure (Week 1)
- [ ] Diamond contract setup
- [ ] Basic NFT facet (ERC721)
- [ ] Simple minting with text uniqueness
- [ ] Owner controls framework

### Phase 2: Aging System (Week 2)
- [ ] Dirt accumulation mechanics
- [ ] Basic cleaning functionality
- [ ] Texture level foundations
- [ ] Time-based calculations

### Phase 3: Advanced Maintenance (Week 3)
- [ ] Laundering system
- [ ] Restoration services
- [ ] Sale price tracking
- [ ] Marketplace integration

### Phase 4: Business Logic (Week 4)
- [ ] Revenue collection (withdraw)
- [ ] Royalty system (EIP-2981)
- [ ] Configurable pricing
- [ ] Collection management

### Phase 5: Polish & Testing (Week 5)
- [ ] Frontend integration
- [ ] Comprehensive testing
- [ ] Security audit preparation
- [ ] Performance optimization

---

## 🏦 Token Economics ($RUG)

### Token Utility (Future Implementation)
- **Cleaning Costs**: Pay with $RUG tokens
- **Restoration Services**: Discounted with tokens
- **Governance**: Community voting rights
- **Staking**: Enhanced aging prevention
- **Marketplace**: Reduced fees

### Economic Design
- **Total Supply**: 1,000,000 $RUG (if implemented)
- **Distribution**: Community-focused allocation
- **Release Schedule**: Gradual unlock over time
- **Utility First**: Token serves the ecosystem, not speculation

---

## 📊 Technical Specifications

### Gas Optimizations
- **Storage Packing**: Efficient struct layouts
- **Batch Operations**: Multi-token processing where possible
- **External Libraries**: Scripty.sol for pruned P5.js & art algo storage (already implemented)
- **Minimal State**: Only essential data on-chain

### Network Requirements
- **Primary**: Shape L2 (low gas, fast transactions)
- **Compatibility**: Ethereum mainnet deployment ready
- **Gas Estimates**:
  - Mint: ~25k gas
  - Clean: ~15k gas
  - tokenURI: ~20k gas

### Integration Points
- **Scripty.sol**: P5.js library and algorithm storage
- **OpenSea**: Full metadata and royalty support
- **Wallets**: Standard ERC721 compatibility
- **Marketplaces**: Royalty enforcement

---

## 🎯 Success Metrics

### User Engagement
- **Daily Active Cleaners**: Users maintaining their rugs
- **Average Rug Age**: How long users keep rugs uncleaned
- **Restoration Usage**: Premium service adoption
- **Trading Volume**: Secondary market activity

### Technical Performance
- **Mint Success Rate**: 99.9% successful transactions
- **Metadata Loading**: <2 second load times
- **Gas Efficiency**: Stay under network limits
- **Uptime**: 99.9% contract availability

### Business Metrics
- **Revenue Distribution**: Primary vs secondary sales
- **User Retention**: Long-term holder percentage
- **Community Growth**: Discord/telegram engagement
- **Market Value**: Floor price and volume trends

---

## 🔮 Future Extensibility

### Potential Diamond Additions
- **Staking Facet**: $RUG token staking for benefits
- **Breeding Facet**: Combine rugs for rare offspring
- **Governance Facet**: Community parameter voting
- **Auction Facet**: Built-in marketplace features
- **Layer Facet**: Additional visual customization

### Art Algorithm Extensions
- **10 Texture Levels**: Currently 2, expand to 10
- **Dynamic Palettes**: Time-based color evolution
- **Special Events**: Limited-time visual themes
- **User Customization**: Post-mint modifications

### Economic Expansions
- **Token Launch**: $RUG ecosystem activation
- **Revenue Sharing**: Community treasury distribution
- **Partnerships**: Cross-collection interoperability
- **Advanced Pricing**: Dynamic pricing based on demand

---

## 📋 Development Guidelines

### Code Standards
- **Solidity**: ^0.8.22 with latest OpenZeppelin
- **Testing**: 100% test coverage for core functions
- **Security**: Comprehensive audit before mainnet
- **Documentation**: Inline natspec comments

### Deployment Strategy
- **Testnet First**: Shape L2 testnet validation
- **Gradual Rollout**: Phased feature activation
- **Emergency Controls**: Pause functionality for issues
- **Upgrade Path**: Diamond pattern enables seamless upgrades

### Community Management
- **Fair Launch**: No presale advantages
- **Transparent Pricing**: All costs clearly communicated
- **Regular Updates**: Community feedback integration
- **Long-term Vision**: Sustainable project development

---

## 📞 Contact & Support

**Project Lead**: @valipokkann
**Technical Implementation**: AI-assisted development
**Community**: [Discord/Telegram links]

**Last Updated**: [Current Date]
**Version**: 1.0 - Complete Specification

---

*This document serves as the comprehensive specification for OnchainRugs. All development decisions should reference this document to maintain project vision and technical integrity.*
