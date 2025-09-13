# Gas-Efficient On-Chain Art Strategy

## Problem with Full Storage
- Storing full SVG/HTML per NFT = 100k+ gas per mint
- 1111 NFTs × 100k gas = 111M+ gas total
- Extremely expensive and unsustainable

## Solution: Shared Algorithm + Minimal Storage

### Strategy 1: Shared Algorithm Contract
```solidity
// Store algorithm once, reference per NFT
contract RugAlgorithm {
    // Store the P5.js algorithm as a string (one-time cost)
    string public algorithmCode;
    
    // Generate art on-demand using stored algorithm
    function generateArt(uint256 seed, string[] memory textLines) 
        public view returns (string memory svg);
}

// Main NFT contract stores only minimal data
contract OnchainRugs {
    struct RugData {
        uint256 seed;
        string[] textLines;
        uint256 mintTime;
        uint256 lastCleaned;
        uint256 lastSalePrice;
    }
    
    mapping(uint256 => RugData) public rugs;
    RugAlgorithm public algorithmContract;
}
```

### Strategy 2: Deterministic Generation (Recommended)
```solidity
// Store only the inputs, generate art deterministically
contract OnchainRugs {
    struct RugData {
        uint256 seed;
        string[] textLines;
        uint256 mintTime;
        uint256 lastCleaned;
        uint256 lastSalePrice;
    }
    
    // Store only minimal data per NFT
    mapping(uint256 => RugData) public rugs;
    
    // Generate art on-demand using deterministic algorithm
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        RugData memory rug = rugs[tokenId];
        
        // Generate SVG using deterministic algorithm
        string memory svg = generateRugSVG(rug.seed, rug.textLines);
        
        // Return metadata with generated SVG
        return createMetadata(tokenId, svg, rug);
    }
}
```

## Gas Cost Comparison

### Full Storage Approach:
- **Per NFT**: ~100k gas (storing full SVG)
- **Total for 1111 NFTs**: ~111M gas
- **Cost**: $50-100+ per mint

### Minimal Storage Approach:
- **Per NFT**: ~20k gas (storing seed + text)
- **Total for 1111 NFTs**: ~22M gas
- **Cost**: $10-20 per mint

### Shared Algorithm Approach:
- **Algorithm Storage**: ~500k gas (one-time)
- **Per NFT**: ~15k gas (storing seed + text)
- **Total**: ~500k + (1111 × 15k) = ~17M gas
- **Cost**: $5-10 per mint

## Implementation Options

### Option 1: Deterministic Generation (Best)
- Store only seed + text per NFT
- Generate SVG on-demand in `tokenURI()`
- Most gas efficient
- Requires porting P5.js algorithm to Solidity

### Option 2: Shared Algorithm Contract
- Store algorithm once in separate contract
- Reference algorithm from main contract
- Generate art on-demand
- Moderate gas efficiency
- Easier to implement

### Option 3: Hybrid Approach
- Store algorithm in main contract
- Generate art on-demand
- Cache generated SVGs (optional)
- Balance between gas efficiency and complexity

## Recommended Implementation

### Phase 1: Minimal Storage
```solidity
contract OnchainRugs {
    struct RugData {
        uint256 seed;
        string[] textLines;
        uint256 mintTime;
        uint256 lastCleaned;
        uint256 lastSalePrice;
    }
    
    mapping(uint256 => RugData) public rugs;
    
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
        tokenId++;
    }
}
```

### Phase 2: On-Demand Generation
```solidity
function tokenURI(uint256 tokenId) public view returns (string memory) {
    RugData memory rug = rugs[tokenId];
    
    // Generate SVG using deterministic algorithm
    string memory svg = generateRugSVG(rug.seed, rug.textLines);
    
    // Create metadata
    string memory json = Base64.encode(
        bytes(
            string(
                abi.encodePacked(
                    '{"name": "Onchain Rug #', toString(tokenId), '",',
                    '"description": "A unique onchain rug",',
                    '"image": "data:image/svg+xml;base64,', 
                    Base64.encode(bytes(svg)), '",',
                    '"attributes": [',
                    '{"trait_type": "Seed", "value": ', toString(rug.seed), '},',
                    '{"trait_type": "Text Lines", "value": ', toString(rug.textLines.length), '}',
                    ']}'
                )
            )
        )
    );
    
    return string(abi.encodePacked('data:application/json;base64,', json));
}
```

## Benefits

### ✅ Advantages
- **Gas Efficient**: 80% reduction in minting costs
- **Fully On-Chain**: No external dependencies
- **Deterministic**: Same inputs = same art
- **Scalable**: Can mint thousands of NFTs affordably
- **Upgradeable**: Can improve algorithm without changing existing NFTs

### ⚠️ Considerations
- **Algorithm Porting**: Need to port P5.js to Solidity
- **Gas for Generation**: `tokenURI()` calls cost gas
- **Complexity**: More complex than simple storage

## Conclusion

The **Deterministic Generation** approach is the best balance:
- **Minimal storage per NFT** (seed + text only)
- **Generate art on-demand** in `tokenURI()`
- **80% gas savings** compared to full storage
- **Fully on-chain** and deterministic
- **Scalable** for thousands of NFTs

This approach makes minting affordable while keeping the art fully on-chain and deterministic.
