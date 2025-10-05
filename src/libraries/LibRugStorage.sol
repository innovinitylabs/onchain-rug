// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title LibRugStorage
 * @notice Shared storage library for all Rug facets - FRESH REDESIGN
 * @dev Contains simplified storage structures for 2-level dirt, 10-level aging, 5-frame system
 */

library LibRugStorage {
    // Storage slot for Rug data (using keccak256 to avoid conflicts)
    bytes32 constant RUG_STORAGE_POSITION = keccak256("rug.storage.position");

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
        uint256 agingStartTime;         // When current aging level started

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
        uint256 dirtLevel1Days;        // Days until rug becomes dirty level 1 (default: 3)
        uint256 dirtLevel2Days;        // Days until rug becomes dirty level 2 (default: 7)
        uint256 agingAdvanceDays;      // Days between aging level increases (default: 14)
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
    }

    function rugStorage() internal pure returns (RugConfig storage rs) {
        bytes32 position = RUG_STORAGE_POSITION;
        assembly {
            rs.slot := position
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
        return (aging.cleaningCount * 2) +
               (aging.restorationCount * 5) +
               (aging.masterRestorationCount * 10) +
               (aging.launderingCount * 10);
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
     * @notice Calculate aging progression time
     * @param agingLevel Current aging level
     * @return daysRequired Days needed to reach this level
     */
    function getAgingProgressionDays(uint8 agingLevel) internal view returns (uint256) {
        RugConfig storage rs = rugStorage();
        return agingLevel * rs.agingAdvanceDays;
    }
}
