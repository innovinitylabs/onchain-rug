# Onchain Rugs Smart Contract Architecture

## Overview
Fully on-chain NFT rug collection with dynamic aging, cleaning mechanics, and unique text constraints.

## Core Contracts

### 1. P5Library.sol (Shared Library Contract)
#### Key Features:
- **Stores P5.js library once** (~200KB, one-time cost)
- **Provides library access** to main NFT contract
- **Gas efficient** (shared across all NFTs)

#### State Variables:
```solidity
string public p5jsLibrary; // ~200KB P5.js library code
bool public isInitialized;
```

#### Key Functions:
```solidity
// Initialize with P5.js library (one-time setup)
function initializeLibrary(string memory p5jsCode) external onlyOwner;

// Get P5.js library code
function getP5JS() external view returns (string memory);
```

### 2. OnchainRugs.sol (Main NFT Contract)

#### Key Features:
- **ERC-721A** for gas-efficient batch minting
- **Fully on-chain art generation** using deterministic PRNG
- **Free base minting** with optional text pricing
- **10% royalties** (EIP-2981)
- **Unique text constraint** (once used, cannot be reused)

#### State Variables:
```solidity
uint256 public constant MAX_SUPPLY = 1111;
uint256 public constant ROYALTY_PERCENTAGE = 1000; // 10%

// Pricing (in wei)
uint256 public constant LINE_2_3_PRICE = 0.00111 ether;
uint256 public constant LINE_4_5_PRICE = 0.00222 ether;

// P5.js library reference
P5Library public p5Library;

// Rug data storage
struct RugData {
    uint256 seed;
    string[] textLines;
    string artCode;        // ~15KB individual art code
    uint256 mintTime;
    uint256 lastCleaned;
    uint256 lastSalePrice;
}

mapping(uint256 => RugData) public rugs;

// Text management
mapping(string => bool) public usedTextHashes;
```

#### Key Functions:
```solidity
// Minting with pre-generated art code
function mintWithText(
    string[] memory textLines,
    uint256 seed,
    string memory artCode
) external payable;

// Calculate minting price based on text lines
function calculateMintingPrice(string[] memory textLines) 
    public pure returns (uint256);

// Check if text is available
function isTextAvailable(string[] memory textLines) 
    public view returns (bool);

// Get rug aging data
function getRugAgingData(uint256 tokenId) 
    external view returns (uint8 dirtLevel, uint8 textureLevel, uint256 lastCleaned, uint256 mintTime);

// Laundering mechanic (cleans on higher sale)
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override;
```

### 2. RugCleaning.sol (Cleaning Contract)

#### Key Features:
- **Free cleaning** for first 30 days (just gas)
- **Paid cleaning** after 30 days
- **Laundering detection** (higher sale price cleans automatically)

#### State Variables:
```solidity
uint256 public constant FREE_CLEANING_PERIOD = 30 days;
uint256 public constant PAID_CLEANING_COST = 0.1 ether; // TBD

mapping(uint256 => bool) public isCleaningFree;
```

#### Key Functions:
```solidity
// Clean rug (free or paid based on age)
function cleanRug(uint256 tokenId) external payable;

// Check cleaning cost
function getCleaningCost(uint256 tokenId) external view returns (uint256);

// Auto-clean on laundering (higher sale price)
function handleLaundering(uint256 tokenId, uint256 newPrice) external;
```

## Economic Model

### Minting Pricing:
- **Base mint**: Free (0 ETH)
- **With text**: Free or any value above 0
- **Line 2-3**: +0.00111 ETH each
- **Line 4-5**: +0.00222 ETH each

### Aging Timeline:
- **3 days**: 50% dirt accumulation
- **7 days**: 100% dirt + 50% texture aging
- **30 days**: 100% dirt + 100% texture aging

### Cleaning Costs:
- **0-30 days**: Free (just gas)
- **30+ days**: 0.1 ETH (TBD)

### Laundering:
- Selling for higher price than previous sale automatically cleans the rug

## Technical Implementation

### On-Chain Art Generation:
```solidity
// Generate complete HTML with embedded P5.js library
function tokenURI(uint256 tokenId) public view returns (string memory) {
    RugData memory rug = rugs[tokenId];
    
    // Get P5.js library from shared contract
    string memory p5js = p5Library.getP5JS();
    
    // Generate complete HTML
    string memory html = string(abi.encodePacked(
        '<!DOCTYPE html><html><head><script>',
        p5js,
        rug.artCode,
        '</script></head><body><div id="p5-container"></div></body></html>'
    ));
    
    // Return as data URI
    return string(abi.encodePacked(
        'data:text/html;base64,',
        Base64.encode(bytes(html))
    ));
}
```

### Text Uniqueness:
```solidity
// Hash text lines to ensure uniqueness
function hashTextLines(string[] memory textLines) 
    internal pure returns (string memory);

// Check availability before minting
modifier textAvailable(string[] memory textLines) {
    require(isTextAvailable(textLines), "Text already used");
    _;
}
```

### Aging Calculations:
```solidity
function calculateDirtLevel(uint256 tokenId) public view returns (uint8) {
    uint256 timeSinceCleaned = block.timestamp - lastCleanedTimestamps[tokenId];
    if (timeSinceCleaned >= 7 days) return 2; // Heavy dirt
    if (timeSinceCleaned >= 3 days) return 1; // Light dirt
    return 0; // Clean
}

function calculateTextureLevel(uint256 tokenId) public view returns (uint8) {
    uint256 timeSinceMint = block.timestamp - mintTimestamps[tokenId];
    if (timeSinceMint >= 30 days) return 2; // Heavy texture
    if (timeSinceMint >= 7 days) return 1; // Moderate texture
    return 0; // Smooth
}
```

## Future Enhancements

### Detergent NFT System:
- Separate NFT collection for cleaning detergents
- Can clean rugs after 30 days without paying ETH
- Limited supply, tradeable on secondary markets

### Advanced Features:
- **Rug Repair**: Fix permanent texture damage
- **Customization**: Add patterns or colors
- **Staking**: Earn rewards for holding clean rugs

## Deployment Strategy

### Phase 1: Core Contracts
1. Deploy OnchainRugs.sol
2. Deploy RugCleaning.sol
3. Set up royalty recipient
4. Test on Shape Sepolia

### Phase 2: Integration
1. Update frontend with new contract addresses
2. Test full minting and cleaning flow
3. Deploy to Shape Mainnet

### Phase 3: Advanced Features
1. Implement detergent NFT system
2. Add advanced cleaning mechanics
3. Launch secondary market features

## Security Considerations

- **Reentrancy protection** on all state-changing functions
- **Access control** for admin functions
- **Input validation** for text lines and pricing
- **Gas optimization** for on-chain art generation
- **Upgradeability** considerations for future enhancements
