// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/////////////////////////////////////////////////////////////////////////////////////////////////
/// ██╗   ██╗ █████╗ ██╗     ██╗██████╗  ██████╗ ██╗  ██╗██╗  ██╗ █████╗ ███╗   ██╗███╗   ██╗ ///
/// ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔═══██╗██║ ██╔╝██║ ██╔╝██╔══██╗████╗  ██║████╗  ██║ ///
/// ██║   ██║███████║██║     ██║██████╔╝██║   ██║█████╔╝ █████╔╝ ███████║██╔██╗ ██║██╔██╗ ██║ ///
/// ╚██╗ ██╔╝██╔══██║██║     ██║██╔═══╝ ██║   ██║██╔═██╗ ██╔═██╗ ██╔══██║██║╚██╗██║██║╚██╗██║ ///
///  ╚████╔╝ ██║  ██║███████╗██║██║     ╚██████╔╝██║  ██╗██║  ██╗██║  ██║██║ ╚████║██║ ╚████║ ///
///   ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝ ///
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @title LibRugStorage
 * @notice Shared storage library for all Rug facets - FRESH REDESIGN
 * @dev Contains simplified storage structures for 2-level dirt, 10-level aging, 5-frame system
 */

library LibRugStorage {
    // Storage slots (using keccak256 to avoid conflicts)
    bytes32 constant RUG_STORAGE_POSITION = keccak256("rug.storage.position");
    bytes32 constant ERC721_STORAGE_POSITION = keccak256("erc721.storage.position");
    bytes32 constant MARKETPLACE_STORAGE_POSITION = keccak256("rug.marketplace.storage.position");
    bytes32 constant REFERRAL_STORAGE_POSITION = keccak256("rug.referral.storage.position");
    bytes32 constant AGENT_REGISTRY_STORAGE_POSITION = keccak256("rug.agent.registry.storage.position");
    bytes32 constant AGENT_REPUTATION_STORAGE_POSITION = keccak256("rug.agent.reputation.storage.position");
    bytes32 constant AGENT_VALIDATION_STORAGE_POSITION = keccak256("rug.agent.validation.storage.position");

    struct RugData {
        uint256 seed;                    // Generation seed
        string[] textRows;              // User text (1-5 lines)
        string paletteName;             // Color palette identifier
        string minifiedPalette;         // Compressed color data
        string minifiedStripeData;      // Compressed pattern data
        uint8 warpThickness;            // Design parameter (1-5)
        uint256 mintTime;               // Auto-set on mint
        string filteredCharacterMap;    // Used characters only
        address curator;                // The address that minted/curated this NFT
        uint256 characterCount;         // Total characters
        uint256 stripeCount;            // Pattern stripes
    }

    struct AgingData {
        // ===== FRESH SIMPLIFIED SYSTEM =====

        // Dirt System (3 levels: 0=Clean, 1=Dirty, 2=Very Dirty)
        uint256 lastCleaned;            // Last cleaning timestamp
        uint8 dirtLevel;                // Current dirt level (0-2)

        // Aging System (11 levels: 0=Clean, 1-10=Aged)
        uint8 agingLevel;               // Current aging level (0-10)

        // Frame System (5 levels: 0=None, 1=Bronze, 2=Silver, 3=Gold, 4=Diamond)
        uint8 frameLevel;               // Current frame level (0-4)
        uint256 frameAchievedTime;      // When current frame was achieved

        // Maintenance Tracking
        uint256 cleaningCount;          // Number of times cleaned
        uint256 restorationCount;       // Number of times aging level reduced
        uint256 masterRestorationCount; // Number of times fully reset
        uint256 launderingCount;        // Number of times laundered
        uint256 lastLaundered;          // Last laundering timestamp

        // Trading History
        uint256 lastSalePrice;          // Highest sale price
        uint256[3] recentSalePrices;    // Last 3 sale prices
    }

    // ===== MARKETPLACE STRUCTS =====

    struct Listing {
        address seller;
        uint256 price;
        uint256 expiresAt;
        bool isActive;
    }

    struct Auction {
        address seller;
        uint256 startPrice;
        uint256 reservePrice;
        uint256 currentBid;
        address highestBidder;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool autoExtend;
        uint256 minBidIncrement; // Minimum bid increase (basis points)
    }

    struct Offer {
        uint256 offerId;
        address offerer;
        uint256 tokenId;    // 0 for collection-wide offers
        uint256 price;
        uint256 expiresAt;
        bool isActive;
    }

    struct Bundle {
        uint256 bundleId;
        address seller;
        uint256[] tokenIds;
        uint256 price;
        uint256 expiresAt;
        bool isActive;
    }

    struct MarketplaceConfig {
        // Token-specific listings and auctions
        mapping(uint256 => Listing) listings;      // tokenId => Listing
        mapping(uint256 => Auction) auctions;       // tokenId => Auction
        
        // Offers (both token-specific and collection-wide)
        mapping(uint256 => Offer) offers;           // offerId => Offer
        mapping(uint256 => uint256[]) tokenOffers;  // tokenId => offerIds[]
        uint256[] collectionOffers;                 // Collection-wide offer IDs
        
        // Bundles
        mapping(uint256 => Bundle) bundles;         // bundleId => Bundle
        
        // Config
        uint256 marketplaceFeePercent;              // Basis points (250 = 2.5%)
        uint256 maxAuctionDuration;                 // Maximum auction duration in seconds
        uint256 minBidIncrementPercent;             // Minimum bid increase percentage (500 = 5%)
        uint256 autoExtendDuration;                 // Time to extend auction if bid near end (600 = 10 min)
        uint256 autoExtendThreshold;                // Time from end that triggers extension (600 = 10 min)
        
        // Tracking
        uint256 totalFeesCollected;                 // Total marketplace fees
        uint256 totalVolume;                        // Total sales volume
        uint256 totalSales;                         // Total number of sales
        uint256 nextBundleId;                       // Counter for bundle IDs
        uint256 nextOfferId;                        // Counter for offer IDs
    }

    // ERC721 Storage for diamond pattern
    struct ERC721Storage {
        string name;
        string symbol;
        mapping(uint256 => address) _owners;
        mapping(address => uint256) _balances;
        mapping(uint256 => address) _tokenApprovals;
        mapping(address => mapping(address => bool)) _operatorApprovals;
        uint256 _currentTokenId;

        // ERC721 enumerable storage
        mapping(address => mapping(uint256 => uint256)) _ownedTokens;
        mapping(uint256 => uint256) _ownedTokensIndex;
        uint256[] _allTokens;
        mapping(uint256 => uint256) _allTokensIndex;
    }

    struct RugConfig {
        uint256 collectionCap;          // Current max supply (editable 0-10000)
        uint256 walletLimit;            // NFTs per wallet (default: 10)
        uint256 reserveAmount;          // Team reserve allocation
        bool isLaunched;               // Launch state
        bool launderingEnabled;        // Global laundering toggle
        address[] exceptionList;       // Addresses exempt from wallet limits (for enumeration)
        mapping(address => bool) exceptionMap; // O(1) lookup for exception checks

        // Scripty integration
        address rugScriptyBuilder;      // ScriptyBuilderV2 contract
        address rugEthFSStorage;        // EthFS storage contract
        address onchainRugsHTMLGenerator; // HTML generator contract

        // Pricing configuration
        uint256 basePrice;             // Base mint cost
        uint256 linePrice1;            // Additional for line 1
        uint256 linePrice2;            // Additional for line 2
        uint256 linePrice3;            // Additional for line 3
        uint256 linePrice4;            // Additional for line 4
        uint256 linePrice5;            // Additional for line 5

        // ===== FRESH SIMPLIFIED AGING CONFIG =====
        uint256 dirtLevel1Days;        // Seconds until rug becomes dirty level 1 (default: 3 days worth)
        uint256 dirtLevel2Days;        // Seconds until rug becomes dirty level 2 (default: 7 days worth)
        uint256 agingAdvanceDays;      // Seconds between aging level increases (default: 14 days worth)
        uint256 freeCleanDays;         // Days after mint for free cleaning (default: 30)
        uint256 freeCleanWindow;       // Days after cleaning for free cleaning (default: 11)

        // Maintenance pricing (simplified)
        uint256 cleaningCost;          // Cost to clean dirt
        uint256 restorationCost;       // Cost to reduce aging by 1 level
        uint256 masterRestorationCost; // Cost for full reset
        uint256 launderingThreshold;   // Minimum price for laundering

        // Frame thresholds (maintenance points needed)
        uint256 bronzeThreshold;       // Points needed for Bronze frame (default: 25)
        uint256 silverThreshold;       // Points needed for Silver frame (default: 50)
        uint256 goldThreshold;         // Points needed for Gold frame (default: 100)
        uint256 diamondThreshold;      // Points needed for Diamond frame (default: 200)

        // Token supply tracking
        uint256 totalSupply;           // Current total supply
        uint256 tokenCounter;          // Next token ID to mint
        uint256 diamondFrameCount;     // Total count of NFTs with diamond frame (frameLevel == 4)
        mapping(uint256 => bool) diamondFrameTokens; // Token ID => has diamond frame
        uint256[] diamondFrameTokenIds; // Array of all token IDs with diamond frame

        // Text uniqueness
        mapping(bytes32 => bool) usedTextHashes; // Track used text combinations

        // Token data
        mapping(uint256 => RugData) rugs;          // Token ID => rug data
        mapping(uint256 => AgingData) agingData;   // Token ID => aging data

        // Wallet tracking
        mapping(address => uint256) walletMints;   // Address => mint count

        // ===== X402 + Agent Maintenance Configuration =====
        address feeRecipient;                       // Recipient of service fees
        uint256 serviceFee;                         // Flat service fee for all maintenance actions (wei)
        uint256 aiServiceFee;                       // Optional AI service fee for X402 monetization (wei)
        // Per-owner global allowlist: owner => agent => allowed
        mapping(address => mapping(address => bool)) isOwnerAgentAllowed;
        // Per-owner authorized agents list: owner => agents[]
        mapping(address => address[]) ownerAuthorizedAgents;


        // ===== Trusted Marketplace Whitelist =====
        // External marketplaces (like OpenSea) that can record sales
        mapping(address => bool) trustedMarketplaces;
    }

    function rugStorage() internal pure returns (RugConfig storage rs) {
        bytes32 position = RUG_STORAGE_POSITION;
        assembly {
            rs.slot := position
        }
    }

    function marketplaceStorage() internal pure returns (MarketplaceConfig storage ms) {
        bytes32 position = MARKETPLACE_STORAGE_POSITION;
        assembly {
            ms.slot := position
        }
    }

    function erc721Storage() internal pure returns (ERC721Storage storage es) {
        bytes32 position = ERC721_STORAGE_POSITION;
        assembly {
            es.slot := position
        }
    }

    // ===== REFERRAL STRUCTS =====

    struct ReferralStats {
        uint256 totalReferrals;      // Total number of successful referrals
        uint256 totalEarned;         // Total ETH earned from referrals
        uint256 lastReferralTime;    // Timestamp of last referral
    }

    struct ReferralConfig {
        // Code mappings
        mapping(string => address) codeToReferrer;    // Referral code => referrer wallet
        mapping(address => string) referrerToCode;    // Referrer wallet => referral code
        mapping(string => bool) codeExists;           // Track if code is registered

        // Deterministic registration tracking
        mapping(address => bool) registeredReferrers; // Referrer wallet => is registered

        // Referral statistics
        mapping(address => ReferralStats) referralStats;  // Referrer => stats
        
        // Configuration
        bool referralSystemEnabled;                   // Global toggle for referral system
        uint256 mintReferralPercent;                  // Percentage of mint fee to referrer (basis points, e.g., 500 = 5%, default: 5%)
        uint256 marketplaceReferralPercent;           // Percentage of marketplace fee to referrer (basis points, e.g., 500 = 5%, default: 5%)
        
        // Code validation
        uint256 minCodeLength;                        // Minimum referral code length (default: 3)
        uint256 maxCodeLength;                        // Maximum referral code length (default: 20)
    }

    function referralStorage() internal pure returns (ReferralConfig storage rs) {
        bytes32 position = REFERRAL_STORAGE_POSITION;
        assembly {
            rs.slot := position
        }
    }

    // ===== ERC-8004 AGENT REGISTRY STRUCTS =====

    /**
     * @notice Stored Agent Card structure (internal storage format)
     * @dev This mirrors the AgentCard struct but is optimized for storage
     */
    struct StoredAgentCard {
        string agentId;
        string name;
        string description;
        address evmAddress;
        string[] capabilities;
        string metadataURI;
        uint256 registeredAt;
        uint256 updatedAt;
        bool active;
    }

    /**
     * @notice Agent Registry configuration
     * @dev Stores all agent identity information following ERC-8004 standard
     */
    struct AgentRegistry {
        // Agent address => Agent Card
        mapping(address => StoredAgentCard) agents;
        
        // All registered agents
        address[] allAgents;
        
        // Capability => Agent addresses (for discovery)
        mapping(string => address[]) agentsByCapability;
    }

    function agentRegistry() internal pure returns (AgentRegistry storage ar) {
        bytes32 position = AGENT_REGISTRY_STORAGE_POSITION;
        assembly {
            ar.slot := position
        }
    }

    // ===== ERC-8004 AGENT REPUTATION STRUCTS =====

    /**
     * @notice Stored feedback structure (internal storage format)
     * @dev This mirrors the Feedback struct but is optimized for storage
     */
    struct StoredFeedback {
        address client;
        uint256 taskId;
        uint8 accuracy;
        uint8 timeliness;
        uint8 reliability;
        string comment;
        uint256 timestamp;
    }

    /**
     * @notice Stored reputation summary (internal storage format)
     * @dev Stores aggregated reputation data for efficient lookup
     */
    struct StoredReputation {
        uint256 totalTasks;         // Total tasks completed (can be >= feedback count)
        uint256 totalFeedback;      // Number of feedback submissions
        uint256 totalAccuracy;      // Sum of accuracy ratings (in basis points)
        uint256 totalTimeliness;    // Sum of timeliness ratings (in basis points)
        uint256 totalReliability;   // Sum of reliability ratings (in basis points)
        uint256 reputationScore;    // Calculated reputation score (0-100)
        uint256 lastUpdated;        // Last update timestamp
    }

    /**
     * @notice Agent Reputation Registry configuration
     * @dev Stores all agent reputation information following ERC-8004 standard
     */
    struct AgentReputationRegistry {
        // Agent address => Reputation summary
        mapping(address => StoredReputation) reputations;
        
        // Agent address => Feedback history
        mapping(address => StoredFeedback[]) feedbackHistory;
        
        // Feedback key (agent + taskId + client) => exists
        mapping(bytes32 => bool) feedbackExists;
    }

    function agentReputationStorage() internal pure returns (AgentReputationRegistry storage arr) {
        bytes32 position = AGENT_REPUTATION_STORAGE_POSITION;
        assembly {
            arr.slot := position
        }
    }

    // ===== ERC-8004 AGENT VALIDATION STRUCTS =====

    /**
     * @notice Stored validation proof structure (internal storage format)
     * @dev This mirrors the ValidationProof struct but is optimized for storage
     */
    struct StoredValidationProof {
        uint8 method;           // ValidationMethod enum as uint8
        bytes proof;            // Validation proof data (method-specific)
        address validator;      // Address that validated the proof
        uint256 taskId;         // Task identifier
        address agent;          // Agent that performed the task
        uint256 validatedAt;    // Timestamp when proof was submitted
        bool verified;          // Whether proof has been verified
    }

    /**
     * @notice Agent Validation Registry configuration
     * @dev Stores all validation proofs following ERC-8004 standard
     */
    struct AgentValidationRegistry {
        // Proof key (agent + taskId hash) => Validation proof
        mapping(bytes32 => StoredValidationProof) validationProofs;
        
        // Proof key => exists (for efficient lookup)
        mapping(bytes32 => bool) proofExists;
        
        // Agent => Proof keys (for listing agent's proofs)
        mapping(address => bytes32[]) agentProofs;
        mapping(address => uint256) agentProofCount;
        mapping(address => uint256) verifiedProofCount;
        
        // Validator => Proof keys (for listing validator's proofs)
        mapping(address => bytes32[]) validatorProofs;
        mapping(address => uint256) validatorProofCount;
    }

    function agentValidationStorage() internal pure returns (AgentValidationRegistry storage avr) {
        bytes32 position = AGENT_VALIDATION_STORAGE_POSITION;
        assembly {
            avr.slot := position
        }
    }

    // Utility functions for text uniqueness
    function hashTextLines(string[] memory textLines) internal pure returns (bytes32) {
        return keccak256(abi.encode(textLines));
    }

    function isTextAvailable(string[] memory textLines) internal view returns (bool) {
        RugConfig storage rs = rugStorage();

        // Allow unlimited mints of empty text (no uniqueness restriction)
        if (isEmptyText(textLines)) {
            return true;
        }

        bytes32 textHash = hashTextLines(textLines);
        return !rs.usedTextHashes[textHash];
    }

    function markTextAsUsed(string[] memory textLines) internal {
        RugConfig storage rs = rugStorage();

        // Don't mark empty text as used (allow unlimited mints)
        if (isEmptyText(textLines)) {
            return;
        }

        bytes32 textHash = hashTextLines(textLines);
        rs.usedTextHashes[textHash] = true;
    }

    function isEmptyText(string[] memory textLines) internal pure returns (bool) {
        if (textLines.length == 0) return true;

        for (uint256 i = 0; i < textLines.length; i++) {
            if (bytes(textLines[i]).length > 0) {
                return false;
            }
        }
        return true;
    }

    // Utility functions for wallet limits
    function canMint(address account) internal view returns (bool) {
        RugConfig storage rs = rugStorage();
        return rs.walletMints[account] < rs.walletLimit || isException(account);
    }

    function isException(address account) internal view returns (bool) {
        RugConfig storage rs = rugStorage();
        // Use mapping for O(1) lookup instead of array iteration
        return rs.exceptionMap[account];
    }

    // Check if a marketplace is trusted (can record sales)
    function isTrustedMarketplace(address marketplace) internal view returns (bool) {
        RugConfig storage rs = rugStorage();
        return rs.trustedMarketplaces[marketplace];
    }

    function recordMint(address account) internal {
        RugConfig storage rs = rugStorage();
        rs.walletMints[account]++;
        rs.totalSupply++;
        rs.tokenCounter++;
    }

    // SafeMath functions for critical calculations
    function safeMul(uint256 a, uint256 b) internal pure returns (uint256) {
        unchecked {
            if (a == 0) return 0;
            uint256 c = a * b;
            require(c / a == b, "SafeMath: multiplication overflow");
            return c;
        }
    }

    function safeAdd(uint256 a, uint256 b) internal pure returns (uint256) {
        unchecked {
            uint256 c = a + b;
            require(c >= a, "SafeMath: addition overflow");
            return c;
        }
    }

    function safeSub(uint256 a, uint256 b) internal pure returns (uint256) {
        unchecked {
            require(b <= a, "SafeMath: subtraction overflow");
            return a - b;
        }
    }

    // Pricing calculations
    function calculateMintPrice(uint256 lineCount) internal view returns (uint256) {
        RugConfig storage rs = rugStorage();
        uint256 total = rs.basePrice;

        if (lineCount >= 1) total += rs.linePrice1;
        if (lineCount >= 2) total += rs.linePrice2;
        if (lineCount >= 3) total += rs.linePrice3;
        if (lineCount >= 4) total += rs.linePrice4;
        if (lineCount >= 5) total += rs.linePrice5;

        return total;
    }

    // Supply checks
    function canMintSupply() internal view returns (bool) {
        RugConfig storage rs = rugStorage();
        return rs.totalSupply < rs.collectionCap;
    }

    function nextTokenId() internal view returns (uint256) {
        RugConfig storage rs = rugStorage();
        return rs.tokenCounter + 1;
    }

    // ===== FRESH SYSTEM UTILITY FUNCTIONS =====

    /**
     * @notice Calculate maintenance score for frame progression
     * @param aging Aging data for the rug
     * @return score Total maintenance score
     */
    function calculateMaintenanceScore(AgingData storage aging) internal view returns (uint256) {
        return (aging.cleaningCount * 2) +        // 2 points per clean
               (aging.restorationCount * 8) +      // 8 points per restore
               (aging.masterRestorationCount * 12) + // 12 points per master restore
               (aging.launderingCount * 20);       // 20 points per laundering
    }

    /**
     * @notice Get frame level based on maintenance score
     * @param score Maintenance score
     * @return frameLevel Frame level (0-4)
     */
    function getFrameLevelFromScore(uint256 score) internal view returns (uint8) {
        RugConfig storage rs = rugStorage();

        if (score >= rs.diamondThreshold) return 4; // Diamond
        if (score >= rs.goldThreshold) return 3;    // Gold
        if (score >= rs.silverThreshold) return 2;  // Silver
        if (score >= rs.bronzeThreshold) return 1;  // Bronze
        return 0; // None
    }

    /**
     * @notice Get frame name from frame level
     * @param frameLevel Frame level (0-4)
     * @return frameName String name of the frame
     */
    function getFrameName(uint8 frameLevel) internal pure returns (string memory) {
        if (frameLevel == 4) return "Diamond";
        if (frameLevel == 3) return "Gold";
        if (frameLevel == 2) return "Silver";
        if (frameLevel == 1) return "Bronze";
        return "None";
    }

    /**
     * @notice Check if rug has dirt immunity (Silver+ frames)
     * @param frameLevel Current frame level
     * @return hasImmunity True if frame provides dirt immunity
     */
    function hasDirtImmunity(uint8 frameLevel) internal pure returns (bool) {
        return frameLevel >= 2; // Silver and above
    }

    /**
     * @notice Update diamond frame counter and token tracking when frame level changes
     * @param tokenId Token ID whose frame level changed
     * @param oldFrameLevel Previous frame level (0-4)
     * @param newFrameLevel New frame level (0-4)
     */
    function updateDiamondFrameCount(uint256 tokenId, uint8 oldFrameLevel, uint8 newFrameLevel) internal {
        RugConfig storage rs = rugStorage();
        
        // If old level was diamond (4) and new level is not, remove from tracking
        if (oldFrameLevel == 4 && newFrameLevel != 4) {
            require(rs.diamondFrameCount > 0, "Diamond frame count underflow");
            require(rs.diamondFrameTokens[tokenId], "Token not tracked as diamond frame");
            rs.diamondFrameCount--;
            rs.diamondFrameTokens[tokenId] = false;
            _removeDiamondFrameTokenId(tokenId);
        }
        // If new level is diamond (4) and old level was not, add to tracking
        else if (newFrameLevel == 4 && oldFrameLevel != 4) {
            require(!rs.diamondFrameTokens[tokenId], "Token already tracked as diamond frame");
            rs.diamondFrameCount++;
            rs.diamondFrameTokens[tokenId] = true;
            rs.diamondFrameTokenIds.push(tokenId);
        }
    }

    /**
     * @notice Remove token ID from diamond frame array (internal helper)
     * @param tokenId Token ID to remove
     */
    function _removeDiamondFrameTokenId(uint256 tokenId) private {
        RugConfig storage rs = rugStorage();
        uint256 length = rs.diamondFrameTokenIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (rs.diamondFrameTokenIds[i] == tokenId) {
                // Move last element to current position and pop
                rs.diamondFrameTokenIds[i] = rs.diamondFrameTokenIds[length - 1];
                rs.diamondFrameTokenIds.pop();
                break;
            }
        }
    }

    /**
     * @notice Get current count of diamond frame NFTs
     * @return count Number of NFTs with diamond frame (frameLevel == 4)
     */
    function getDiamondFrameCount() internal view returns (uint256) {
        return rugStorage().diamondFrameCount;
    }

    /**
     * @notice Check if a token ID has diamond frame
     * @param tokenId Token ID to check
     * @return hasDiamondFrame True if token has diamond frame
     */
    function hasDiamondFrame(uint256 tokenId) internal view returns (bool) {
        return rugStorage().diamondFrameTokens[tokenId];
    }

    /**
     * @notice Get all token IDs with diamond frame
     * @return tokenIds Array of token IDs with diamond frame
     */
    function getDiamondFrameTokenIds() internal view returns (uint256[] memory) {
        return rugStorage().diamondFrameTokenIds;
    }

    /**
     * @notice Get frame-based aging multiplier (higher frames age slower)
     * @param frameLevel Current frame level
     * @return multiplier Aging speed multiplier (100 = normal, 60 = 40% slower, etc.)
     */
    function getAgingMultiplier(uint8 frameLevel) internal pure returns (uint256) {
        if (frameLevel >= 4) return 10; // Diamond: 90% slower (10x longer, ~1.9 years total)
        if (frameLevel >= 3) return 20; // Gold: 80% slower (5x longer, ~11.7 months total)
        if (frameLevel >= 2) return 50; // Silver: 50% slower (2x longer, ~4.7 months total)
        if (frameLevel >= 1) return 75; // Bronze: 25% slower (1.3x longer, ~3 months total)
        return 100; // None: normal speed (~2.3 months total)
    }

    /**
     * @notice Calculate aging progression time
     * @param agingLevel Current aging level
     * @return daysRequired Days needed to reach this level
     */
    function getAgingProgressionDays(uint8 agingLevel) internal view returns (uint256) {
        RugConfig storage rs = rugStorage();
        return agingLevel * rs.agingAdvanceDays;
    }

    /**
     * @notice Cancel a marketplace listing when NFT ownership changes
     * @param tokenId Token ID to cancel listing for
     * @param previousOwner The address that previously owned the token
     * @return cancelled Whether the listing was cancelled
     * @dev This is called from NFT transfer hooks to auto-cancel listings
     */
    function cancelListingOnTransfer(uint256 tokenId, address previousOwner) internal returns (bool cancelled) {
        MarketplaceConfig storage ms = marketplaceStorage();
        Listing storage listing = ms.listings[tokenId];
        
        // Only cancel if listing is active and the previous owner was the seller
        if (listing.isActive && listing.seller == previousOwner) {
            listing.isActive = false;
            return true;
        }
        return false;
    }
}
