# OnchainRugsV2Shape - Contract Documentation

## Overview
**OnchainRugsV2Shape** is a fully on-chain NFT collection optimized for Shape L2 featuring sophisticated generative art with aging mechanics and global text uniqueness.

## Key Features

### 🎨 **Art Generation**
- **Sophisticated P5.js Algorithm**: Complex rug generation with 43+ curated color palettes
- **Advanced Weave Patterns**: Solid, textured, and mixed weave types
- **Dynamic Text Embedding**: Character-by-character pixel rendering
- **Realistic Fringe Generation**: Natural curl patterns with organic variation

### ⏰ **Aging System**
- **Time-Based Degradation**:
  - 3 days: Dirt Level 1 (light dirt)
  - 7 days: Dirt Level 2 (heavy dirt)
  - 30 days: Texture Level 1 (wear begins)
  - 90 days: Texture Level 2 (heavy wear)

- **Cleaning Mechanics**:
  - Dirt resets on cleaning (free for first 30 days, then 0.0001 ETH)
  - Texture aging persists until laundering (0.0005 ETH)
  - Higher sale price automatically cleans/launders

### 💰 **Economic Model**
- **Base Price**: 0.0001 ETH per NFT
- **Text Premium**: +0.00111 ETH per line beyond first
- **Cleaning Cost**: 0.0001 ETH (dirt removal)
- **Laundering Cost**: 0.0005 ETH (texture reset)

### 🔒 **Uniqueness System**
- **Global Text Uniqueness**: Each text combination can only be used once
- **Hash-Based Tracking**: SHA-256 of text rows for efficient lookup
- **Per-NFT Character Maps**: Optimized storage per NFT

## Technical Specifications

### Storage Architecture
```
Per NFT: ~2.5KB
├── RugData (seed, palette, stripeData, textRows, warpThickness, characterMap)
├── AgingData (lastCleaned, lastSalePrice, textureLevel)
└── Global Character Map: Filtered per NFT
```

### HTML Generation
- **Size**: <20KB before base64 encoding
- **Algorithm**: Optimized P5.js with shortened variables
- **Rendering**: Browser-side with deterministic seed
- **Format**: data:text/html;base64 encoded

### Gas Optimization
- **Shape L2 Optimized**: Low gas fees
- **Efficient Storage**: Minimal on-chain data
- **Compressed Data**: Shortened property names
- **Batch Operations**: Optimized for L2

## Contract Functions

### Minting
```solidity
mintRugWithParams(
    string[] textRows,
    uint256 seed,
    string palette,
    string stripeData,
    string characterMap,
    uint256 warpThickness
) payable
```

### Aging & Maintenance
```solidity
cleanRug(uint256 tokenId) payable     // Remove dirt
launderRug(uint256 tokenId) payable   // Reset texture
calculateAgingState(uint256 tokenId)  // Get current levels
```

### Price Management
```solidity
getMintPrice(uint256 textLines)        // Calculate mint cost
setPricing(...) onlyOwner             // Update pricing
```

## Deployment

### Networks Supported
- **Shape L2 Mainnet** (Chain ID: 360)
- **Shape L2 Testnet** (Chain ID: 11011)
- **Local Anvil** (Chain ID: 31337)

### Deployment Scripts
```bash
# Local testing
forge script script/DeployLocal.s.sol --broadcast

# Shape L2 Testnet
forge script script/DeployShapeL2Testnet.s.sol --broadcast --rpc-url https://sepolia.shape.network

# Shape L2 Mainnet
forge script script/DeployShapeL2.s.sol --broadcast --rpc-url https://mainnet.shape.network
```

## Frontend Integration

### Required Data Format
```javascript
const mintData = {
  textRows: ["HELLO", "WORLD"],
  palette: '{"name":"Red & Blue","colors":["#FF0000","#0000FF"]}',
  stripeData: '[{"y":0,"height":100,"primaryColor":"#FF0000","weaveType":"solid"}]',
  characterMap: '{"H":[[1,1,1],[1,0,1],[1,1,1]]}',
  warpThickness: 2
}
```

### Web3 Integration
```javascript
// Using Wagmi/RainbowKit
const { writeContract } = useWriteContract()

writeContract({
  address: contractAddress,
  abi: onchainRugsABI,
  functionName: 'mintRugWithParams',
  args: [mintData.textRows, 0, mintData.palette, mintData.stripeData, mintData.characterMap, mintData.warpThickness],
  value: mintPrice
})
```

## Testing

### Local Testing
```bash
# Start local node
anvil

# Deploy and test
forge script script/TestContract.s.sol --broadcast --rpc-url http://localhost:8545
```

### Contract Verification
```bash
forge verify-contract <CONTRACT_ADDRESS> src/OnchainRugsV2Shape.sol:OnchainRugsV2Shape --chain-id 360
```

## Security Considerations

### Access Control
- **Owner Functions**: Pricing updates, emergency pause
- **User Functions**: Minting, cleaning, laundering
- **View Functions**: TokenURI, aging state, pricing

### Economic Security
- **Price Bounds**: Minimum/maximum pricing limits
- **Payment Validation**: Exact payment requirements
- **Text Uniqueness**: Global hash-based uniqueness

### Technical Security
- **Input Validation**: Comprehensive parameter checking
- **Gas Limits**: Optimized for L2 constraints
- **Storage Bounds**: Efficient data structures

## Performance Metrics

### Gas Costs (Estimated)
- **Mint**: ~230K gas (~$0.05 on Shape L2)
- **Clean**: ~45K gas (~$0.01)
- **Launder**: ~50K gas (~$0.01)
- **TokenURI**: ~150K gas (~$0.03)

### HTML Generation
- **Size**: <20KB uncompressed
- **Load Time**: <2 seconds
- **Compatibility**: Modern browsers with P5.js support

## Future Enhancements

### Planned Features
- **Scripty.sol Integration**: On-chain P5.js for Shape L2
- **Enhanced Aging**: More sophisticated wear patterns
- **Social Features**: Rug cleaning competitions
- **Cross-Chain**: Multi-network deployment

### Optimization Opportunities
- **Gzip Compression**: Further reduce HTML size
- **Batch Operations**: Multiple NFT minting
- **Dynamic Pricing**: Market-based adjustments

---

## Support

For technical support or questions:
- Review the contract code in `src/OnchainRugsV2Shape.sol`
- Test locally using provided scripts
- Check deployment logs for transaction details

**Contract Address**: Deploy using provided scripts
**Network**: Shape L2 (Mainnet/Testnet)
**Standard**: ERC721 with aging mechanics
