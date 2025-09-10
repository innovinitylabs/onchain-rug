# On-Chain Art Strategy: Pre-Generated SVG Storage

## Overview
Store pre-generated SVG art directly in smart contract state, generated using existing P5.js algorithm.

## Architecture

### 1. Art Generation Flow
```
User Input (seed + text) → P5.js Algorithm → SVG → Smart Contract Storage
```

### 2. Smart Contract Storage
```solidity
struct RugData {
    uint256 seed;
    string[] textLines;
    string svgArt;        // Pre-generated SVG
    uint256 mintTime;
    uint256 lastCleaned;
    uint256 lastSalePrice;
}

mapping(uint256 => RugData) public rugs;
```

### 3. Generation Process
1. **Frontend**: User inputs seed + text
2. **P5.js**: Generates SVG using existing algorithm
3. **Validation**: Verify SVG matches seed + text
4. **Minting**: Store SVG + metadata in contract

## Benefits

### ✅ Advantages
- **Keeps P5.js Algorithm**: No complex Solidity porting
- **Fully On-Chain**: SVG stored in contract state
- **Gas Efficient**: One-time generation cost
- **Deterministic**: Same inputs = same art
- **No Dependencies**: No IPFS or external servers
- **Verifiable**: Can verify art matches inputs

### ⚠️ Considerations
- **Storage Cost**: SVG storage is expensive but one-time
- **Generation Cost**: Frontend handles computation
- **Size Limits**: SVG must fit in contract storage

## Implementation

### Frontend Generation
```typescript
// Generate SVG using existing P5.js algorithm
const generateRugSVG = (seed: number, textLines: string[]) => {
  // Use existing P5.js algorithm
  const svg = p5Canvas.elt.outerHTML;
  return svg;
};

// Validate before minting
const validateArt = (seed: number, textLines: string[], svg: string) => {
  // Verify SVG matches expected output
  return true;
};
```

### Smart Contract
```solidity
function mintWithText(
    string[] memory textLines,
    uint256 seed,
    string memory svgArt
) external payable {
    // Validate pricing
    uint256 price = calculateMintingPrice(textLines);
    require(msg.value >= price, "Insufficient payment");
    
    // Check text uniqueness
    require(isTextAvailable(textLines), "Text already used");
    
    // Store rug data
    rugs[tokenId] = RugData({
        seed: seed,
        textLines: textLines,
        svgArt: svgArt,
        mintTime: block.timestamp,
        lastCleaned: 0,
        lastSalePrice: 0
    });
    
    // Mark text as used
    markTextAsUsed(textLines);
    
    _safeMint(msg.sender, tokenId);
    tokenId++;
}
```

### Token URI Generation
```solidity
function tokenURI(uint256 tokenId) public view returns (string memory) {
    RugData memory rug = rugs[tokenId];
    
    string memory json = Base64.encode(
        bytes(
            string(
                abi.encodePacked(
                    '{"name": "Onchain Rug #', toString(tokenId), '",',
                    '"description": "A unique onchain rug with custom text",',
                    '"image": "data:image/svg+xml;base64,', 
                    Base64.encode(bytes(rug.svgArt)), '",',
                    '"attributes": [',
                    '{"trait_type": "Seed", "value": ', toString(rug.seed), '},',
                    '{"trait_type": "Text Lines", "value": ', toString(rug.textLines.length), '},',
                    '{"trait_type": "Mint Time", "value": ', toString(rug.mintTime), '}',
                    ']}'
                )
            )
        )
    );
    
    return string(abi.encodePacked('data:application/json;base64,', json));
}
```

## Gas Optimization

### SVG Compression
- **Minify SVG**: Remove whitespace and unnecessary elements
- **Optimize Paths**: Use efficient SVG path syntax
- **Reduce Precision**: Limit decimal places in coordinates

### Storage Optimization
- **Compress SVG**: Use gzip compression before storage
- **Chunk Storage**: Split large SVGs into multiple storage slots
- **Lazy Loading**: Generate SVG on-demand for tokenURI

## Security Considerations

### Validation
- **SVG Verification**: Ensure SVG matches seed + text
- **Size Limits**: Prevent oversized SVG storage
- **Content Validation**: Sanitize SVG content

### Anti-Gaming
- **Text Uniqueness**: Prevent duplicate text usage
- **Seed Validation**: Ensure seeds are properly generated
- **Price Validation**: Verify correct pricing

## Future Enhancements

### Dynamic Elements
- **Aging Effects**: Modify SVG based on time
- **Cleaning Effects**: Update SVG after cleaning
- **Customization**: Allow SVG modifications

### Optimization
- **SVG Caching**: Cache generated SVGs
- **Batch Generation**: Generate multiple SVGs at once
- **Compression**: Advanced SVG compression techniques

## Conclusion

This approach provides the best of both worlds:
- **Keeps existing P5.js algorithm** (no complex porting)
- **Fully on-chain storage** (no external dependencies)
- **Gas efficient** (one-time generation cost)
- **Deterministic** (same inputs = same art)
- **Verifiable** (can validate art matches inputs)

The key insight is that we don't need to run the algorithm on-chain - we just need to store the results on-chain and ensure they're deterministic and verifiable.
