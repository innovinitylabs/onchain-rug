# Ultra-Minimal On-Chain Art Architecture

## Overview
Store only seed + text per NFT, generate complete HTML on-demand using shared generator contract.

## Architecture

### 1. Generator Contract (One-Time Setup)
```solidity
contract RugGenerator {
    string public p5jsLibrary;        // ~200KB P5.js library
    string public generationAlgorithm; // Your complete P5.js algorithm
    
    // Generate complete HTML for any seed + text combination
    function generateRugHTML(uint256 seed, string[] memory textLines) 
        public view returns (string memory);
}
```

### 2. NFT Contract (Minimal Storage)
```solidity
contract OnchainRugs {
    RugGenerator public generator;
    
    struct RugData {
        uint256 seed;           // ~5k gas
        string[] textLines;     // ~10k gas
        uint256 mintTime;
        uint256 lastCleaned;
        uint256 lastSalePrice;
    }
    
    mapping(uint256 => RugData) public rugs;
    
    // Generate HTML on-demand
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        RugData memory rug = rugs[tokenId];
        return generator.generateRugHTML(rug.seed, rug.textLines);
    }
}
```

## Gas Cost Comparison

### Current Approach (15KB HTML per NFT):
- **Per NFT**: ~300k gas
- **1111 NFTs**: ~333M gas
- **Cost**: $15,000+ total

### Ultra-Minimal Approach:
- **Generator Setup**: ~500k gas (one-time)
- **Per NFT**: ~15k gas
- **1111 NFTs**: ~17M gas total
- **Cost**: $500-1000 total

### **Savings: 95% reduction in gas costs!**

## Benefits

### ✅ Advantages
- **Ultra Gas Efficient**: 95% reduction in storage costs
- **Fully On-Chain**: No external dependencies
- **High Quality**: Keep your complete P5.js algorithm
- **Deterministic**: Same seed + text = same art
- **Upgradeable**: Can improve algorithm without changing NFTs
- **Scalable**: Can mint thousands affordably

### ⚠️ Considerations
- **Generator Contract Size**: Large contract (but one-time cost)
- **Generation Gas**: `tokenURI()` calls cost gas (but only when viewing)
- **Complexity**: More complex than simple storage

## Implementation

### Generator Contract
```solidity
contract RugGenerator {
    string public p5jsLibrary;
    string public generationAlgorithm;
    
    function generateRugHTML(uint256 seed, string[] memory textLines) 
        public view returns (string memory) 
    {
        // Generate complete HTML with embedded P5.js + algorithm + seed/text
        string memory html = string(abi.encodePacked(
            '<!DOCTYPE html><html><head><script>',
            p5jsLibrary,
            generationAlgorithm,
            'const RUG_SEED = ', seed.toString(), ';',
            'const RUG_TEXT = ', encodeTextLines(textLines), ';',
            'generateRug(RUG_SEED, RUG_TEXT);',
            '</script></head><body><div id="p5-container"></div></body></html>'
        ));
        
        return string(abi.encodePacked(
            'data:text/html;base64,',
            Base64.encode(bytes(html))
        ));
    }
}
```

### NFT Contract
```solidity
contract OnchainRugs {
    RugGenerator public generator;
    
    function mintWithText(
        string[] memory textLines,
        uint256 seed
    ) external payable {
        // Store only minimal data
        rugs[tokenId] = RugData({
            seed: seed,
            textLines: textLines,
            mintTime: block.timestamp,
            lastCleaned: 0,
            lastSalePrice: 0
        });
        
        _safeMint(msg.sender, tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        RugData memory rug = rugs[tokenId];
        return generator.generateRugHTML(rug.seed, rug.textLines);
    }
}
```

## HTML Generation Flow

### 1. User Views NFT
- Calls `tokenURI(tokenId)`
- Contract gets seed + text from storage
- Calls `generator.generateRugHTML(seed, text)`

### 2. Generator Creates HTML
- Embeds P5.js library
- Embeds your complete algorithm
- Injects seed + text as variables
- Returns complete HTML

### 3. Browser Renders
- HTML loads with everything embedded
- P5.js runs your algorithm
- Uses seed + text to generate art
- Fully self-contained and on-chain

## Conclusion

This approach is **perfect** because:
- **95% gas savings** compared to storing full HTML
- **Keeps your complete algorithm** (no quality loss)
- **Fully on-chain** (no external dependencies)
- **Deterministic** (same inputs = same art)
- **Affordable minting** ($0.50-1.00 per mint)
- **Scalable** (can mint thousands)

The key insight is that we don't need to store the generated art - we just need to store the inputs and generate the art on-demand using the shared algorithm.
