# ERC-8021 & ERC-8004 Implementation Roadmap

## 🎯 Strategy: Implement One at a Time

**Approach**: Build ERC-8021 first (analytics/attribution), then ERC-8004 (agent system), then reconsider referral system with security in mind.

**Current Branch**: `feature/erc8021-erc8004-implementation`

---

## Phase 1: ERC-8021 Implementation (Analytics & Attribution)

### Goal
Track transaction sources via ERC-8021 attribution codes for analytics. **No revenue sharing** - just tracking and event emission.

### What We'll Build

#### 1.1 ERC-8021 Parser Library

**File**: `src/libraries/LibERC8021.sol`

**Purpose**: Parse ERC-8021 data suffixes from transaction calldata

**Key Functions**:
```solidity
library LibERC8021 {
    struct AttributionData {
        bool hasAttribution;
        uint8 schemaId;
        string[] codes;
    }
    
    // Extract and parse ERC-8021 suffix from calldata
    function parseAttribution(bytes calldata data) 
        internal 
        pure 
        returns (AttributionData memory);
    
    // Verify ERC-8021 marker (0x8021...8021)
    function verifyERC8021Marker(bytes memory suffix) 
        internal 
        pure 
        returns (bool);
    
    // Extract codes from Schema 0 format
    function parseSchema0Codes(bytes memory schemaData) 
        internal 
        pure 
        returns (string[] memory);
}
```

**Implementation Steps**:
1. ✅ Create library structure
2. ✅ Implement marker verification (16 bytes: 0x8021...8021)
3. ✅ Implement Schema ID extraction (1 byte before marker)
4. ✅ Implement Schema 0 parsing (comma-delimited ASCII codes)
5. ✅ Add comprehensive tests

#### 1.2 Attribution Registry (Optional - Can Use External)

**File**: `src/facets/RugAttributionFacet.sol`

**Purpose**: Store entity code → payout address mappings (for future use)

**Note**: This is optional if we're only doing analytics. Can use external canonical registry.

**Key Functions**:
```solidity
contract RugAttributionFacet {
    // Map entity codes to addresses (for future revenue sharing)
    mapping(string => address) public codeToAddress;
    
    // Register entity code (admin only)
    function registerEntityCode(string memory code, address payout) external;
    
    // Get payout address for code
    function getPayoutAddress(string memory code) external view returns (address);
}
```

**Implementation Decision**: 
- Start minimal (just parsing, no registry)
- Add registry later if needed for revenue sharing

#### 1.3 Integration Points

**A. Marketplace Attribution** (`RugMarketplaceFacet.sol`)

```solidity
function buyRug(uint256 tokenId) external payable {
    // ... existing purchase logic ...
    
    // NEW: Parse ERC-8021 attribution (read-only)
    LibERC8021.AttributionData memory attribution = 
        LibERC8021.parseAttribution(msg.data);
    
    // NEW: Emit event with attribution data (for off-chain analytics)
    if (attribution.hasAttribution) {
        emit TransactionAttributed(
            tokenId, 
            msg.sender,
            attribution.codes
        );
    }
    
    // Existing payment logic unchanged
    _processPayment(tokenId, seller, price);
}
```

**B. Mint Attribution** (`RugNFTFacet.sol`)

```solidity
function mintRug(...) external payable {
    // ... existing mint logic ...
    
    // NEW: Parse ERC-8021 attribution
    LibERC8021.AttributionData memory attribution = 
        LibERC8021.parseAttribution(msg.data);
    
    // NEW: Emit event
    if (attribution.hasAttribution) {
        emit MintAttributed(
            tokenId,
            recipient,
            attribution.codes
        );
    }
    
    // Existing mint logic unchanged
}
```

**C. Maintenance Attribution** (`RugMaintenanceFacet.sol`)

```solidity
function cleanRugAgent(uint256 tokenId) external payable {
    // ... existing maintenance logic ...
    
    // NEW: Track which app/wallet facilitated maintenance
    LibERC8021.AttributionData memory attribution = 
        LibERC8021.parseAttribution(msg.data);
    
    if (attribution.hasAttribution) {
        emit MaintenanceAttributed(
            tokenId,
            msg.sender,
            "clean",
            attribution.codes
        );
    }
    
    // Existing maintenance logic unchanged
}
```

#### 1.4 Events for Analytics

```solidity
// Attribution events (emitted for off-chain indexing)
event TransactionAttributed(
    uint256 indexed tokenId,
    address indexed buyer,
    string[] codes
);

event MintAttributed(
    uint256 indexed tokenId,
    address indexed minter,
    string[] codes
);

event MaintenanceAttributed(
    uint256 indexed tokenId,
    address indexed agent,
    string action,
    string[] codes
);
```

#### 1.5 Off-Chain Analytics

**Build Later** (Phase 1.5):
- Index events from blockchain
- Aggregate attribution data
- Dashboard showing:
  - Which apps/wallets drive most volume
  - Transaction sources breakdown
  - User acquisition analytics

### Testing Plan

**Unit Tests**:
- Valid ERC-8021 suffix parsing
- Invalid marker rejection
- Multiple entity codes
- Schema 0 format validation
- Edge cases (empty codes, malformed data)

**Integration Tests**:
- Mint with attribution → verify event emission
- Purchase with attribution → verify event emission
- Maintenance with attribution → verify event emission
- Transactions without attribution → normal operation

**Gas Tests**:
- Measure gas cost of parsing (~500-1000 gas expected)
- Ensure no significant impact on existing functions

---

## Phase 2: ERC-8004 Implementation (Agent Identity & Reputation)

### Goal
Create on-chain identity, reputation, and validation system for AI agents.

### What We'll Build

#### 2.1 Identity Registry

**File**: `src/facets/RugAgentRegistryFacet.sol`

**Purpose**: Register agent identities with capabilities

**Key Functions**:
```solidity
struct AgentCard {
    string agentId;           // e.g., "rug-cleaner-v1"
    string name;              // "RugBot Pro"
    string description;       // Human-readable description
    address evmAddress;       // Agent's wallet
    string[] capabilities;    // ["rug_cleaning", "rug_restoration"]
    uint256 registeredAt;
    bool active;
}

contract RugAgentRegistryFacet {
    // Register agent identity
    function registerAgent(AgentCard memory card) external;
    
    // Update agent information
    function updateAgent(AgentCard memory card) external;
    
    // Get agent by address
    function getAgent(address agentAddress) 
        external 
        view 
        returns (AgentCard memory);
    
    // Search agents by capability
    function searchAgentsByCapability(string memory capability) 
        external 
        view 
        returns (address[] memory);
    
    // List all agents
    function getAllAgents() 
        external 
        view 
        returns (address[] memory);
}
```

**Integration**: Works alongside existing `authorizeMaintenanceAgent()` system

#### 2.2 Reputation Registry

**File**: `src/facets/RugAgentReputationFacet.sol`

**Purpose**: Store and calculate agent reputation scores

**Key Functions**:
```solidity
struct Feedback {
    address client;
    uint256 taskId;
    uint8 accuracy;      // 1-5
    uint8 timeliness;    // 1-5
    uint8 reliability;   // 1-5
    string comment;      // Optional
    uint256 timestamp;
}

struct AgentReputation {
    uint256 totalTasks;
    uint256 totalFeedback;
    uint256 averageAccuracy;
    uint256 averageTimeliness;
    uint256 averageReliability;
    uint256 reputationScore;  // Calculated score
}

contract RugAgentReputationFacet {
    // Submit feedback after task completion
    function submitFeedback(
        address agent,
        uint256 taskId,
        Feedback memory feedback
    ) external;
    
    // Get agent reputation
    function getReputation(address agent) 
        external 
        view 
        returns (AgentReputation memory);
    
    // Get all feedback for an agent
    function getFeedbackHistory(address agent) 
        external 
        view 
        returns (Feedback[] memory);
}
```

**Reputation Calculation**:
- Weighted average of ratings
- Total tasks completed
- Recency weighting (newer feedback weighs more)
- Overall reputation score (0-100)

#### 2.3 Validation Registry

**File**: `src/facets/RugAgentValidationFacet.sol`

**Purpose**: Store validation proofs for agent work

**Key Functions**:
```solidity
enum ValidationMethod {
    NONE,
    CRYPTO_PROOF,   // zkTLS, TEE attestation
    ECONOMIC        // Restaking, AVS
}

struct ValidationProof {
    ValidationMethod method;
    bytes proof;
    address validator;
    uint256 validatedAt;
    bool verified;
}

contract RugAgentValidationFacet {
    // Submit validation proof
    function submitValidationProof(
        uint256 taskId,
        ValidationProof memory proof
    ) external;
    
    // Get validation proof for task
    function getValidationProof(uint256 taskId) 
        external 
        view 
        returns (ValidationProof memory);
    
    // Verify proof (can be extended for different methods)
    function verifyProof(ValidationProof memory proof) 
        external 
        view 
        returns (bool);
}
```

**Note**: Validation verification can be extended later (zkTLS, TEE, etc.)

#### 2.4 Integration with Existing Agent System

**Update** `RugMaintenanceFacet.sol`:

```solidity
function cleanRugAgent(uint256 tokenId) external payable {
    // ... existing authorization check ...
    
    // NEW: Check if agent is registered in ERC-8004 registry
    RugAgentRegistryFacet registry = RugAgentRegistryFacet(address(this));
    require(registry.getAgent(msg.sender).active, "Agent not registered");
    
    // ... existing maintenance logic ...
    
    // NEW: Emit event for reputation tracking
    emit MaintenanceCompleted(msg.sender, tokenId, "clean");
    
    // Client can later submit feedback via reputation facet
}
```

#### 2.5 Frontend Integration

**Build Later** (Phase 2.5):
- Agent registration UI
- Reputation display in dashboard
- Feedback submission after maintenance
- Agent discovery/search interface
- Reputation leaderboard

### Testing Plan

**Unit Tests**:
- Agent registration and retrieval
- Reputation calculation accuracy
- Feedback submission and aggregation
- Validation proof storage

**Integration Tests**:
- Register agent → perform maintenance → submit feedback → verify reputation
- Search agents by capability
- Validation proof submission and retrieval

---

## Phase 3: Referral System (Rethink Later)

### Concerns to Address

**Exploitability Risks**:
1. **Self-Referrals**: Users refer themselves with multiple wallets
2. **Sybil Attacks**: Create many fake accounts to farm referrals
3. **Code Farming**: Automated code generation and usage
4. **Collusion**: Users coordinate to game the system

**Security Considerations**:
- Identity verification (KYC? Too restrictive?)
- Rate limiting per address
- Minimum time between referrals
- Maximum referrals per user
- Fraud detection mechanisms
- Reputation-based referral eligibility

**Design Decisions Needed**:
- Permissionless vs permissioned
- KYC requirements (if any)
- Reward structure that prevents gaming
- Monitoring and fraud detection
- Penalties for abuse

**Action**: Revisit referral system design after ERC-8021/8004 implementation with security focus.

---

## Implementation Timeline

### Week 1-2: ERC-8021 Parser
- ✅ Create `LibERC8021.sol` library
- ✅ Implement marker verification
- ✅ Implement Schema 0 parsing
- ✅ Comprehensive tests

### Week 3: ERC-8021 Integration
- ✅ Integrate into `buyRug()`
- ✅ Integrate into `mintRug()`
- ✅ Integrate into maintenance functions
- ✅ Add attribution events
- ✅ Integration tests

### Week 4-5: ERC-8004 Identity Registry
- ✅ Create `RugAgentRegistryFacet.sol`
- ✅ Implement agent registration
- ✅ Implement capability search
- ✅ Integration with existing agent system
- ✅ Tests

### Week 6: ERC-8004 Reputation
- ✅ Create `RugAgentReputationFacet.sol`
- ✅ Implement feedback submission
- ✅ Implement reputation calculation
- ✅ Tests

### Week 7: ERC-8004 Validation
- ✅ Create `RugAgentValidationFacet.sol`
- ✅ Implement proof storage
- ✅ Basic verification logic
- ✅ Tests

### Week 8: Frontend & Analytics
- ✅ ERC-8021 analytics dashboard
- ✅ Agent registry UI
- ✅ Reputation display
- ✅ Feedback submission UI

### Later: Referral System
- 🔄 Security audit
- 🔄 Anti-exploit mechanisms
- 🔄 Careful design review
- 🔄 Implementation with safeguards

---

## Current Focus: ERC-8021 Implementation

**Next Steps**:
1. Start with `LibERC8021.sol` parser library
2. Implement marker verification and Schema 0 parsing
3. Write comprehensive tests
4. Then move to integration

**Ready to begin Phase 1?** 🚀

