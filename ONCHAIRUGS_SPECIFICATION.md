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
    uint256 lastSalePrice;          // Highest sale price
    uint256[3] recentSalePrices;    // Last 3 sale prices
    uint8 dirtLevel;                // Current dirt (0-2)
    uint8 textureLevel;             // Current texture aging (0-10)
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
- **Effect**: Resets dirt to 0, resets texture timer
- **Frequency**: Anytime after 3+ days dirt accumulation
- **Free Period**: First 30 days from mint OR last cleaned within 11 days (both configurable)

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
