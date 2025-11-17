// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

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
        uint256 walletLimit;            // NFTs per wallet (default: 7)
        uint256 reserveAmount;          // Team reserve allocation
        bool isLaunched;               // Launch state
        bool launderingEnabled;        // Global laundering toggle
        address[] exceptionList;       // Addresses exempt from wallet limits

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

        // ===== X402 Authorization Tokens =====
        // tokenHash => used (prevent replay attacks)
        mapping(bytes32 => bool) usedAuthorizationTokens;
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
        for (uint256 i = 0; i < rs.exceptionList.length; i++) {
            if (rs.exceptionList[i] == account) {
                return true;
            }
        }
        return false;
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
}
