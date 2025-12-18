# ERC-8021 & ERC-8004 Implementation Plan

## 🎯 Overview

This document outlines the implementation of **ERC-8021** (Transaction Attribution) and **ERC-8004** (AI Agent Standard) for the Onchain Rugs project.

**Branch**: `feature/erc8021-erc8004-implementation`  
**Date**: 2025-01-XX  
**Status**: Planning Phase

---

## 📚 What Are These Standards?

### ERC-8021: Transaction Attribution Protocol

**What it does:**
- Enables **standardized transaction attribution** by appending data suffixes to transaction calldata
- Allows protocols to identify which applications/wallets initiated transactions
- Enables **automatic revenue sharing** to applications that bring users to protocols
- Creates an **attribution layer** for the Ethereum ecosystem

**Key Components:**
1. **Data Suffix Structure**: Appends structured data to transaction calldata
2. **Entity Codes**: Human-readable identifiers (e.g., "baseapp", "morpho", "onchainrugs")
3. **Registry Contracts**: Maps entity codes to payout addresses
4. **Backward Parsing**: Extracts attribution data by reading from the end of calldata

### ERC-8004: AI Agent Standard

**What it does:**
- Creates **on-chain identity system** for AI agents
- Enables **reputation tracking** through structured feedback
- Provides **validation mechanisms** for agent work verification
- Establishes **trust framework** for autonomous AI agents

**Key Components:**
1. **Identity Registry**: Agents register their capabilities and EVM address
2. **Reputation Registry**: Clients submit feedback after task completion
3. **Validation Registry**: Cryptographic proofs ensure task correctness

---

## 🎯 Why Implement These Standards?

### For ERC-8021: Transaction Attribution

**Current Problem:**
- Your NFT marketplace can't identify which aggregator/wallet/app brought users
- No way to reward applications that drive traffic to your protocol
- Limited analytics on transaction sources
- Can't build referral/revenue-sharing partnerships

**Benefits After Implementation:**
1. **Revenue Sharing**: Automatically distribute fees to wallets/apps that bring users
2. **Partnership Opportunities**: Build referral programs with wallets and aggregators
3. **Analytics**: Track which sources drive the most volume
4. **Ecosystem Growth**: Incentivize more applications to integrate your NFTs
5. **Competitive Advantage**: Early adoption of attribution standards

**Use Cases for Onchain Rugs:**
- Reward NFT aggregators (Blur, OpenSea) when they route users to your marketplace
- Share revenue with wallets (Rainbow, MetaMask) that facilitate purchases
- Track which platforms drive rug sales and maintenance operations
- Build affiliate network for rug minting and maintenance

### For ERC-8004: AI Agent Standard

**Current Problem:**
- Your AI agent system has no standardized identity on-chain
- No way to build reputation for agents
- Can't verify agent work cryptographically
- Difficult for agents to discover each other or prove capabilities

**Benefits After Implementation:**
1. **Trust System**: Agents build verifiable reputation over time
2. **Discoverability**: Agents can find each other via capability matching
3. **Verification**: Cryptographic proofs ensure maintenance was performed correctly
4. **Interoperability**: Works with other protocols implementing ERC-8004
5. **Agent Economy**: Enable agent-to-agent services and payments

**Use Cases for Onchain Rugs:**
- Rug maintenance agents register their capabilities (cleaning, restoration)
- Users can discover agents with best reputation scores
- Agents prove they performed maintenance correctly via validation proofs
- Enable agent-to-agent referrals and service chains

---

## 🏗️ Implementation Architecture

### Phase 1: ERC-8021 Core Infrastructure

#### 1.1 Registry Contract

**File**: `src/facets/RugAttributionFacet.sol`

```solidity
// Registry that maps entity codes to payout addresses
function payoutAddress(string memory code) external view returns (address);
function registerCode(string memory code, address payout) external;
function updatePayout(string memory code, address newPayout) external;
```

**Responsibilities:**
- Store entity code → payout address mappings
- Handle registration and updates (with access control)
- Support the canonical registry schema (Schema ID 0)

#### 1.2 Calldata Parser Library

**File**: `src/libraries/LibERC8021.sol`

```solidity
library LibERC8021 {
    struct AttributionData {
        uint8 schemaId;
        string[] codes;
        address[] payoutAddresses;
    }
    
    function parseAttribution(bytes calldata data) 
        internal 
        view 
        returns (AttributionData memory);
    
    function extractERC8021Suffix(bytes calldata data) 
        internal 
        pure 
        returns (bytes memory suffix);
    
    function verifyERC8021Marker(bytes memory suffix) 
        internal 
        pure 
        returns (bool);
}
```

**Responsibilities:**
- Extract last 16 bytes and verify ERC marker (`0x8021...8021`)
- Parse schema ID (1 byte before marker)
- Extract entity codes (comma-delimited ASCII)
- Map codes to payout addresses via registry

#### 1.3 Integration Points

**Update Functions to Support Attribution:**

1. **Marketplace Functions** (`RugMarketplaceFacet.sol`):
   - `buyRug()` - Attribute purchases to source app
   - `listRug()` - Attribute listings to source app

2. **Maintenance Functions** (`RugMaintenanceFacet.sol`):
   - `cleanRugAgent()` - Attribute maintenance to agent/wallet
   - `restoreRugAgent()` - Track which app facilitated maintenance

3. **Minting Functions** (`RugNFTFacet.sol`):
   - `mintRug()` - Attribute mints to source application

#### 1.4 Revenue Distribution

**File**: `src/facets/RugAttributionFacet.sol`

```solidity
function distributeAttributionRewards(
    uint256 amount,
    AttributionData memory attribution
) internal {
    // Distribute percentage of fees to attributed entities
    // E.g., 10% of marketplace fee to the app that brought the user
}
```

---

### Phase 2: ERC-8004 Agent Registries

#### 2.1 Identity Registry

**File**: `src/facets/RugAgentRegistryFacet.sol`

```solidity
struct AgentCard {
    string agentId;           // e.g., "rug-cleaner-v1.eth#0x123..."
    string name;              // Human-readable name
    string description;       // Capabilities description
    address evmAddress;       // Agent's wallet address
    string[] capabilities;    // ["rug_cleaning", "rug_restoration"]
    uint256 registeredAt;     // Registration timestamp
}

function registerAgent(AgentCard memory card) external;
function getAgent(address agentAddress) external view returns (AgentCard memory);
function searchAgentsByCapability(string memory capability) 
    external 
    view 
    returns (address[] memory);
```

**Responsibilities:**
- Store agent identity information on-chain
- Enable agent discovery by capabilities
- Link agent wallet addresses to metadata

#### 2.2 Reputation Registry

**File**: `src/facets/RugAgentReputationFacet.sol`

```solidity
struct Feedback {
    address client;           // Who submitted feedback
    uint256 taskId;           // Reference to task
    uint8 accuracy;           // 1-5 rating
    uint8 timeliness;         // 1-5 rating
    uint8 reliability;        // 1-5 rating
    string comment;           // Optional text feedback
    uint256 timestamp;
}

struct AgentReputation {
    uint256 totalTasks;
    uint256 totalFeedback;
    uint256 averageAccuracy;
    uint256 averageTimeliness;
    uint256 averageReliability;
}

function submitFeedback(
    address agent,
    Feedback memory feedback
) external;

function getReputation(address agent) 
    external 
    view 
    returns (AgentReputation memory);
```

**Responsibilities:**
- Store feedback after task completion
- Calculate reputation scores (averages, totals)
- Enable reputation-based agent selection

#### 2.3 Validation Registry

**File**: `src/facets/RugAgentValidationFacet.sol`

```solidity
enum ValidationMethod {
    NONE,           // No validation
    CRYPTO_PROOF,   // zkTLS, TEE attestation
    ECONOMIC        // Restaking, AVS
}

struct ValidationProof {
    ValidationMethod method;
    bytes proof;              // Cryptographic proof data
    address validator;        // Validator address
    uint256 validatedAt;
}

function submitValidationProof(
    uint256 taskId,
    ValidationProof memory proof
) external;

function getValidationProof(uint256 taskId) 
    external 
    view 
    returns (ValidationProof memory);
```

**Responsibilities:**
- Store validation proofs for agent work
- Support multiple validation methods
- Enable trustless verification of maintenance operations

---

## 📋 Implementation Steps

### Step 1: ERC-8021 Registry (Week 1)

1. ✅ Create `RugAttributionFacet.sol` with registry functions
2. ✅ Create `LibERC8021.sol` parsing library
3. ✅ Add tests for suffix parsing
4. ✅ Deploy registry contract
5. ✅ Register initial entity codes (e.g., "onchainrugs", "rugagent")

### Step 2: Integrate Attribution (Week 2)

1. ✅ Update `RugMarketplaceFacet.sol` to parse attribution
2. ✅ Update `RugMaintenanceFacet.sol` to support attribution
3. ✅ Update `RugNFTFacet.sol` minting functions
4. ✅ Implement revenue distribution logic
5. ✅ Add tests for attribution parsing in transactions

### Step 3: ERC-8004 Identity Registry (Week 3)

1. ✅ Create `RugAgentRegistryFacet.sol`
2. ✅ Implement agent registration functions
3. ✅ Add capability search functionality
4. ✅ Update existing agent authorization to use registry
5. ✅ Add tests for agent registration and discovery

### Step 4: ERC-8004 Reputation (Week 4)

1. ✅ Create `RugAgentReputationFacet.sol`
2. ✅ Implement feedback submission
3. ✅ Add reputation calculation logic
4. ✅ Update maintenance completion to request feedback
5. ✅ Add tests for reputation scoring

### Step 5: ERC-8004 Validation (Week 5)

1. ✅ Create `RugAgentValidationFacet.sol`
2. ✅ Implement validation proof submission
3. ✅ Integrate with maintenance completion workflow
4. ✅ Add validation verification logic
5. ✅ Add tests for validation proofs

### Step 6: Frontend Integration (Week 6)

1. ✅ Add ERC-8021 suffix to wallet transactions
2. ✅ Display agent reputation in UI
3. ✅ Show attribution data in transaction history
4. ✅ Add agent discovery interface
5. ✅ Implement feedback submission UI

---

## 🔧 Technical Details

### ERC-8021 Suffix Format

```
[Original Transaction Calldata]
[Schema Data - variable length]
[Schema ID - 1 byte]
[ERC Marker - 16 bytes: 0x80218021802180218021802180218021]
```

**Schema 0 (Canonical) Structure:**
```
codesLength: 1 byte (length of codes string)
codes: variable (ASCII, comma-delimited: "baseapp,morpho")
```

**Example Suffix:**
```
0x07626173656170700080218021802180218021802180218021
```

Breakdown:
- `07`: codesLength = 7 bytes
- `62617365617070`: "baseapp" in ASCII
- `008021...8021`: Schema ID (00) + ERC marker

### Parsing Logic

```solidity
function parseAttribution(bytes calldata data) internal view returns (AttributionData memory) {
    // 1. Extract last 16 bytes
    bytes32 marker = bytes32(data[data.length - 16:data.length]);
    
    // 2. Verify marker
    require(marker == ERC8021_MARKER, "Invalid ERC-8021 marker");
    
    // 3. Extract schema ID (1 byte before marker)
    uint8 schemaId = uint8(data[data.length - 17]);
    
    // 4. Parse schema data based on schemaId
    if (schemaId == 0) {
        // Parse canonical schema
        uint8 codesLength = uint8(data[data.length - 18]);
        bytes memory codesBytes = data[data.length - 18 - codesLength:data.length - 18];
        // Split by comma and map to addresses
    }
}
```

### Revenue Distribution Example

```solidity
// In buyRug() function
function buyRug(uint256 tokenId) external payable {
    // ... existing purchase logic ...
    
    // Parse ERC-8021 attribution
    LibERC8021.AttributionData memory attribution = 
        LibERC8021.parseAttribution(msg.data);
    
    if (attribution.codes.length > 0) {
        // Distribute 10% of marketplace fee to attributed apps
        uint256 attributionReward = marketplaceFee * 10 / 100;
        uint256 perAppReward = attributionReward / attribution.codes.length;
        
        for (uint i = 0; i < attribution.payoutAddresses.length; i++) {
            if (attribution.payoutAddresses[i] != address(0)) {
                payable(attribution.payoutAddresses[i]).transfer(perAppReward);
            }
        }
    }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

1. **ERC-8021 Parser Tests**:
   - Valid suffix parsing
   - Invalid marker rejection
   - Multiple entity codes
   - Schema validation

2. **Registry Tests**:
   - Code registration
   - Payout address updates
   - Access control

3. **ERC-8004 Registry Tests**:
   - Agent registration
   - Capability search
   - Reputation calculation

### Integration Tests

1. **End-to-End Attribution**:
   - Mint with attribution → verify revenue distribution
   - Purchase with attribution → verify fee sharing
   - Maintenance with attribution → verify tracking

2. **Agent Workflow**:
   - Register agent → submit task → submit feedback → verify reputation

3. **Validation Flow**:
   - Submit maintenance → submit validation proof → verify proof

---

## 📊 Expected Outcomes

### ERC-8021 Benefits

- **Revenue Sharing**: 5-10% of fees automatically distributed to referring apps
- **Partnerships**: Enable integrations with 10+ wallets/aggregators
- **Analytics**: Track transaction sources and optimize marketing spend
- **Growth**: Increase volume by 20-30% through referral incentives

### ERC-8004 Benefits

- **Trust**: Agents build verifiable reputation scores
- **Discovery**: Users can find best-rated agents for maintenance
- **Verification**: Cryptographic proof that maintenance was performed
- **Ecosystem**: Enable agent-to-agent service networks

---

## 🚀 Next Steps

1. **Review this plan** with the team
2. **Prioritize phases** based on business needs
3. **Set up test environment** for ERC-8021 parsing
4. **Begin Phase 1** implementation (Registry + Parser)
5. **Iterate** based on testing and feedback

---

## 📚 References

- [ERC-8021 Specification](https://www.erc8021.com/)
- [ERC-8004 Specification](https://www.erc8021.com/erc8004)
- [x402 Protocol](https://www.erc8021.com/) (already implemented)
- [ETH Magicians Discussion](https://ethereum-magicians.org/)

---

**Status**: Ready for implementation review  
**Estimated Timeline**: 6 weeks for full implementation  
**Priority**: High (competitive advantage, ecosystem growth)

