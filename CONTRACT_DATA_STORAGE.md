# OnchainRugs Contract Data Storage

## 🏗️ **Storage Architecture Overview**

The OnchainRugs contract uses a sophisticated storage system to permanently store all NFT data on the blockchain. Here's how it works:

---

## 📊 **Data Structures**

### **1. RugData Struct (Core NFT Data)**
```solidity
struct RugData {
    uint256 seed;           // Generation seed for deterministic art
    string palette;         // JSON string of color palette
    string stripeData;      // JSON string of stripe patterns
    string[] textRows;      // Array of text lines
    string characterMap;    // JSON string of character definitions
    uint256 mintTime;       // Block timestamp when minted
    uint256 warpThickness;  // Weave thickness parameter
    bool showDirt;          // Initial dirt state
    uint8 dirtLevel;        // Initial dirt level (0-2)
    bool showTexture;       // Initial texture state
    uint8 textureLevel;     // Initial texture level (0-2)
}
```

### **2. AgingData Struct (Dynamic State)**
```solidity
struct AgingData {
    uint256 lastCleaned;    // Timestamp of last cleaning
    uint256 lastSalePrice;  // Price of last sale (for laundering)
    bool isDirty;           // Current dirt state
    uint8 dirtLevel;        // Current dirt level (0-2)
    bool hasTexture;        // Current texture state
    uint8 textureLevel;     // Current texture level (0-2)
}
```

---

## 🗄️ **Storage Mappings**

### **Primary Storage**
```solidity
mapping(uint256 => RugData) public rugs;        // Token ID → Rug Data
mapping(uint256 => AgingData) public agingData; // Token ID → Aging Data
mapping(string => bool) public usedTextHashes;  // Text Hash → Used Status
```

### **State Variables**
```solidity
uint256 private _tokenIdCounter;  // Auto-incrementing token ID
uint256 public constant MAX_SUPPLY = 1111;  // Maximum NFTs
```

---

## 💾 **Data Persistence Mechanisms**

### **1. Immutable Core Data**
Once minted, the core rug data is **permanently stored** and **cannot be changed**:

```solidity
// During minting - data is stored permanently
rugs[tokenId] = RugData({
    seed: seed,                    // ✅ Immutable
    palette: palette,              // ✅ Immutable  
    stripeData: stripeData,        // ✅ Immutable
    textRows: textRows,            // ✅ Immutable
    characterMap: characterMap,    // ✅ Immutable
    mintTime: block.timestamp,     // ✅ Immutable
    warpThickness: warpThickness,  // ✅ Immutable
    showDirt: showDirt,            // ✅ Immutable
    dirtLevel: dirtLevel,          // ✅ Immutable
    showTexture: showTexture,      // ✅ Immutable
    textureLevel: textureLevel     // ✅ Immutable
});
```

### **2. Dynamic Aging Data**
Aging data can be **updated** through cleaning and laundering:

```solidity
// During cleaning - aging data is updated
agingData[tokenId] = AgingData({
    lastCleaned: block.timestamp,  // 🔄 Updated
    lastSalePrice: 0,              // 🔄 Updated
    isDirty: false,                // 🔄 Updated
    dirtLevel: 0,                  // 🔄 Updated
    hasTexture: true,              // 🔄 Updated
    textureLevel: 1                // 🔄 Updated
});
```

### **3. Text Uniqueness System**
Text is permanently marked as used to prevent duplicates:

```solidity
// Text uniqueness check
function isTextAvailable(string[] memory textRows) public view returns (bool) {
    string memory textHash = hashTextLines(textRows);
    return !usedTextHashes[textHash];  // Check if hash exists
}

// Mark text as used (permanent)
function markTextAsUsed(string[] memory textRows) internal {
    string memory textHash = hashTextLines(textRows);
    usedTextHashes[textHash] = true;  // ✅ Permanent storage
    emit TextUsed(textHash);
}
```

---

## 🔐 **Data Security & Integrity**

### **1. Cryptographic Hashing**
Text uniqueness is enforced using `keccak256`:

```solidity
function hashTextLines(string[] memory textRows) internal pure returns (string memory) {
    bytes32 hash = keccak256(abi.encode(textRows));
    return Strings.toHexString(uint256(hash));
}
```

### **2. Access Control**
- **Public Read**: All stored data is publicly readable
- **Owner Write**: Only contract owner can update parameters
- **User Write**: Only NFT owners can clean their rugs

### **3. Immutable Core Data**
- Once minted, core rug data **cannot be modified**
- This ensures **permanent uniqueness** and **art integrity**
- Only aging data can change over time

---

## 📈 **Data Flow During Minting**

### **Step 1: Validation**
```solidity
require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
require(msg.value >= price, "Insufficient payment");
require(isTextAvailable(textRows), "Text already used");
```

### **Step 2: Text Uniqueness**
```solidity
markTextAsUsed(textRows);  // Permanently mark text as used
```

### **Step 3: Data Storage**
```solidity
uint256 tokenId = _tokenIdCounter++;
rugs[tokenId] = RugData({...});           // Store core data
agingData[tokenId] = AgingData({...});    // Initialize aging
```

### **Step 4: NFT Minting**
```solidity
_safeMint(msg.sender, tokenId);  // Mint ERC721 token
emit RugMinted(tokenId, seed, textRows);  // Emit event
```

---

## 🎨 **Data Retrieval for Rendering**

### **TokenURI Function**
The contract generates dynamic metadata by combining stored data:

```solidity
function tokenURI(uint256 tokenId) public view returns (string memory) {
    RugData memory rug = rugs[tokenId];  // Get core data
    (bool showDirt, uint8 dirtLevel, bool showTexture, uint8 textureLevel) = 
        calculateAgingState(tokenId);  // Calculate current aging
    
    // Generate HTML with embedded P5.js algorithm
    string memory html = string.concat(
        '<!DOCTYPE html><html><head>',
        '<title>Onchain Rug #', tokenId.toString(), '</title>',
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>',
        // ... P5.js algorithm and data
    );
    
    // Return as base64-encoded JSON metadata
    return string.concat(
        'data:application/json;base64,',
        Base64.encode(bytes(jsonMetadata))
    );
}
```

---

## ⏰ **Dynamic Aging System**

### **Time-Based Calculations**
The contract calculates aging state in real-time:

```solidity
function calculateAgingState(uint256 tokenId) public view returns (...) {
    RugData memory rug = rugs[tokenId];
    AgingData memory aging = agingData[tokenId];
    
    uint256 currentTime = block.timestamp;
    uint256 timeSinceMint = currentTime - rug.mintTime;
    uint256 timeSinceCleaned = aging.lastCleaned > 0 ? 
        currentTime - aging.lastCleaned : timeSinceMint;
    
    // Dirt Logic
    if (timeSinceCleaned > 7 days) {
        showDirt = true;
        dirtLevel = 2;  // Heavy dirt
    } else if (timeSinceCleaned > 3 days) {
        showDirt = true;
        dirtLevel = 1;  // Light dirt
    }
    
    // Texture Logic
    if (timeSinceMint > heavyTextureDays) {
        showTexture = true;
        textureLevel = 2;  // Heavy texture
    } else if (timeSinceMint > moderateTextureDays) {
        showTexture = true;
        textureLevel = 1;  // Moderate texture
    }
}
```

---

## 🔄 **Data Updates**

### **Cleaning Function**
```solidity
function cleanRug(uint256 tokenId) external payable {
    AgingData storage aging = agingData[tokenId];
    aging.lastCleaned = block.timestamp;  // Update timestamp
    aging.isDirty = false;                // Reset dirt
    aging.dirtLevel = 0;                  // Reset level
    aging.hasTexture = true;              // Set moderate texture
    aging.textureLevel = 1;               // Level 1
}
```

### **Laundering Function**
```solidity
function handleLaundering(uint256 tokenId, uint256 newPrice) external {
    AgingData storage aging = agingData[tokenId];
    if (newPrice > aging.lastSalePrice) {
        aging.lastCleaned = block.timestamp;
        aging.lastSalePrice = newPrice;
        aging.isDirty = false;
        aging.dirtLevel = 0;
        aging.hasTexture = false;         // Make smooth
        aging.textureLevel = 0;           // Level 0
    }
}
```

---

## 📊 **Storage Costs & Efficiency**

### **Gas Costs (Approximate)**
- **Minting**: ~200,000-300,000 gas
- **Cleaning**: ~50,000-80,000 gas
- **Reading**: Free (view functions)

### **Storage Optimization**
- **String Arrays**: Efficient for text storage
- **JSON Strings**: Compact palette/stripe data
- **Mappings**: O(1) lookup time
- **Events**: Off-chain indexing for efficiency

---

## 🛡️ **Data Integrity Guarantees**

### **1. Immutable Core Data**
- ✅ **Seed**: Cannot be changed after minting
- ✅ **Palette**: Cannot be changed after minting
- ✅ **Text**: Cannot be changed after minting
- ✅ **Stripe Data**: Cannot be changed after minting
- ✅ **Character Map**: Cannot be changed after minting

### **2. Dynamic Aging Data**
- 🔄 **Dirt State**: Can be cleaned/reset
- 🔄 **Texture State**: Can be modified through cleaning
- 🔄 **Timestamps**: Updated with each interaction

### **3. Uniqueness Guarantees**
- ✅ **Text Uniqueness**: Cryptographic hash prevents duplicates
- ✅ **Token ID**: Auto-incrementing ensures uniqueness
- ✅ **Seed**: Deterministic generation from text

---

## 🎯 **Key Benefits**

### **1. Permanent Storage**
- All data stored on blockchain forever
- No external dependencies
- Immutable art generation

### **2. Dynamic Features**
- Aging system adds interactivity
- Cleaning/laundering mechanics
- Time-based texture development

### **3. Efficiency**
- Optimized storage patterns
- Minimal gas costs
- Fast retrieval

### **4. Transparency**
- All data publicly readable
- Complete audit trail
- Verifiable uniqueness

This storage system ensures that every OnchainRug NFT is **permanently unique**, **fully on-chain**, and **dynamically interactive** while maintaining **gas efficiency** and **data integrity**.
