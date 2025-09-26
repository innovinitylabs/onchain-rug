// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title LibRugStorage
 * @notice Shared storage library for all Rug facets
 * @dev Contains all storage structures and utilities used across Rug facets
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
        uint256 lastCleaned;            // Last cleaning timestamp
        uint256 lastTextureReset;       // Last texture reset timestamp (mint time initially)
        uint256 lastSalePrice;          // Highest sale price
        uint256[3] recentSalePrices;    // Last 3 sale prices
        uint8 dirtLevel;                // Current dirt (0-2) - deprecated, calculated
        uint8 textureLevel;             // Current texture aging (0-10) - deprecated, calculated
        uint256 launderingCount;        // Number of times laundered
        uint256 lastLaundered;          // Last laundering timestamp
        uint256 cleaningCount;          // Number of times cleaned
        uint256 restorationCount;       // Number of times restored
        uint256 masterRestorationCount; // Number of times master restored
        uint256 maintenanceScore;       // Calculated maintenance quality score
        string currentFrameLevel;       // Current frame level ("None", "Bronze", etc.)
        uint256 frameAchievedTime;      // When current frame was first achieved
        bool gracePeriodActive;         // Whether frame is in grace period
        uint256 gracePeriodEnd;         // Grace period expiration timestamp
        bool isMuseumPiece;             // Whether this is a permanent Diamond frame
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
        // Aging configuration
        uint256 dirtLevel1Days;        // Days for dirt level 1
        uint256 dirtLevel2Days;        // Days for dirt level 2
        uint256 textureLevel1Days;     // Days for texture level 1
        uint256 textureLevel2Days;     // Days for texture level 2
        uint256 freeCleanDays;         // Days after mint for free cleaning
        uint256 freeCleanWindow;       // Days after cleaning for free cleaning
        // Maintenance pricing
        uint256 cleaningCost;          // Regular cleaning cost
        uint256 restorationCost;       // Per level restoration cost
        uint256 masterRestorationCost; // Full reset cost
        uint256 launderingThreshold;   // Minimum price for laundering
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
        bytes32 textHash = hashTextLines(textLines);
        return !rs.usedTextHashes[textHash];
    }

    function markTextAsUsed(string[] memory textLines) internal {
        RugConfig storage rs = rugStorage();
        bytes32 textHash = hashTextLines(textLines);
        rs.usedTextHashes[textHash] = true;
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
}
