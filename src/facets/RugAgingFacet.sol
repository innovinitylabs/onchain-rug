// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {RugNFTFacet} from "./RugNFTFacet.sol";

/**
 * @title RugAgingFacet
 * @notice Aging mechanics facet for OnchainRugs dirt and texture calculations
 * @dev Handles time-based aging progression and state calculations
 */
contract RugAgingFacet {
    /**
     * @notice Calculate current dirt level for a rug
     * @param tokenId Token ID to check
     * @return dirtLevel Current dirt level (0-2)
     */
    function getDirtLevel(uint256 tokenId) external view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        if (timeSinceCleaned >= rs.dirtLevel2Days) return 2;
        if (timeSinceCleaned >= rs.dirtLevel1Days) return 1;
        return 0;
    }

    /**
     * @notice Get texture level for a rug (based on aging time)
     * @param tokenId Token ID to check
     * @return textureLevel Texture level based on time since last cleaning (0-10)
     */
    function getTextureLevel(uint256 tokenId) external view returns (uint8) {
        return _getTextureLevel(tokenId);
    }

    /**
     * @notice Get complete aging state for a rug
     * @param tokenId Token ID to check
     * @return dirtLevel Current dirt level based on aging (0-2)
     * @return textureLevel Current texture level based on aging (0-10)
     * @return showDirt Whether dirt should be displayed
     * @return showTexture Whether texture should be displayed
     * @return timeSinceCleaned Seconds since last cleaning
     * @return timeSinceMint Seconds since minting
     */
    function getAgingState(uint256 tokenId) external view returns (
        uint8 dirtLevel,
        uint8 textureLevel,
        bool showDirt,
        bool showTexture,
        uint256 timeSinceCleaned,
        uint256 timeSinceMint
    ) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.RugData storage rug = rs.rugs[tokenId];
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        timeSinceCleaned = block.timestamp - aging.lastCleaned;
        timeSinceMint = block.timestamp - rug.mintTime;

        dirtLevel = _getDirtLevel(tokenId);
        textureLevel = _getTextureLevel(tokenId);

        showDirt = dirtLevel > 0;
        showTexture = textureLevel > 0;
    }

    /**
     * @notice Check if rug can be cleaned (has dirt or needs maintenance)
     * @param tokenId Token ID to check
     * @return canClean True if cleaning is needed or beneficial
     */
    function canClean(uint256 tokenId) external view returns (bool) {
        uint8 dirtLevel = _getDirtLevel(tokenId);
        return dirtLevel > 0;
    }

    /**
     * @notice Check if rug can be restored (has texture aging)
     * @param tokenId Token ID to check
     * @return canRestore True if texture restoration is available
     */
    function canRestore(uint256 tokenId) external view returns (bool) {
        uint8 textureLevel = _getTextureLevel(tokenId);
        return textureLevel > 0;
    }

    /**
     * @notice Check if rug qualifies for free cleaning
     * @param tokenId Token ID to check
     * @return isFree True if cleaning is free
     */
    function isCleaningFree(uint256 tokenId) external view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.RugData storage rug = rs.rugs[tokenId];
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Free if within initial period from mint
        uint256 timeSinceMint = block.timestamp - rug.mintTime;
        if (timeSinceMint <= rs.freeCleanDays) return true;

        // Free if recently cleaned
        uint256 timeSinceLastClean = block.timestamp - aging.lastCleaned;
        if (timeSinceLastClean <= rs.freeCleanWindow) return true;

        return false;
    }

    /**
     * @notice Get time until next dirt level increase
     * @param tokenId Token ID to check
     * @return secondsUntilDirt Time in seconds until dirt level increases
     */
    function timeUntilNextDirt(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint8 currentDirt = _getDirtLevel(tokenId);
        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        if (currentDirt == 0 && timeSinceCleaned < rs.dirtLevel1Days) {
            return rs.dirtLevel1Days - timeSinceCleaned;
        }
        if (currentDirt == 1 && timeSinceCleaned < rs.dirtLevel2Days) {
            return rs.dirtLevel2Days - timeSinceCleaned;
        }

        return 0; // Already at max dirt
    }

    /**
     * @notice Get time until next texture level increase
     * @param tokenId Token ID to check
     * @return secondsUntilTexture Time in seconds until texture level increases
     */
    function timeUntilNextTexture(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint8 currentTexture = _getTextureLevel(tokenId);
        uint256 timeSinceReset = block.timestamp - aging.lastTextureReset;

        // Simple calculation - next level threshold
        uint256 nextThreshold;
        if (currentTexture == 0) nextThreshold = rs.textureLevel1Days;
        else if (currentTexture == 1) nextThreshold = rs.textureLevel2Days;
        else return 0; // Max texture reached

        if (timeSinceReset < nextThreshold) {
            return nextThreshold - timeSinceReset;
        }

        return 0;
    }

    /**
     * @notice Get aging statistics for a rug
     * @param tokenId Token ID to check
     * @return mintTime When the rug was minted
     * @return lastCleaned When the rug was last cleaned
     * @return daysOld How many days since minting
     * @return daysSinceCleaned How many days since last cleaning
     */
    function getAgingStats(uint256 tokenId) external view returns (
        uint256 mintTime,
        uint256 lastCleaned,
        uint256 daysOld,
        uint256 daysSinceCleaned
    ) {
        LibRugStorage.RugData storage rug = LibRugStorage.rugStorage().rugs[tokenId];
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        mintTime = rug.mintTime;
        lastCleaned = aging.lastCleaned;

        daysOld = (block.timestamp - mintTime) / 1 days;
        daysSinceCleaned = (block.timestamp - lastCleaned) / 1 days;
    }

    /**
     * @notice Check if rug is considered "well-maintained"
     * @param tokenId Token ID to check
     * @return isWellMaintained True if recently cleaned and not aged
     */
    function isWellMaintained(uint256 tokenId) external view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        // Well-maintained if cleaned within free window and no aging
        return timeSinceCleaned <= rs.freeCleanWindow &&
               _getDirtLevel(tokenId) == 0 &&
               _getTextureLevel(tokenId) <= 1;
    }

    /**
     * @notice Get aging progression info for UI display
     * @param tokenId Token ID to check
     * @return currentDirt Current dirt level
     * @return maxDirt Maximum possible dirt level
     * @return currentTexture Current texture level
     * @return maxTexture Maximum possible texture level
     * @return secondsToNextAging Seconds until next aging event
     */
    function getProgressionInfo(uint256 tokenId) external view returns (
        uint8 currentDirt,
        uint8 maxDirt,
        uint8 currentTexture,
        uint8 maxTexture,
        uint256 secondsToNextAging
    ) {
        currentDirt = _getDirtLevel(tokenId);
        maxDirt = 2; // Max dirt level

        currentTexture = _getTextureLevel(tokenId);
        maxTexture = 10; // Max texture level

        // Find time to next aging event
        uint256 toDirt = _timeUntilNextDirt(tokenId);
        uint256 toTexture = _timeUntilNextTexture(tokenId);

        secondsToNextAging = (toDirt > 0 && toTexture > 0) ?
            (toDirt < toTexture ? toDirt : toTexture) :
            (toDirt > 0 ? toDirt : toTexture);
    }

    // Internal helper functions

    function _getDirtLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Check if rug has a frame (Silver+ frames get dirt immunity)
        string memory frameLevel = RugNFTFacet(address(this)).getFrameLevel(tokenId);
        if (keccak256(abi.encodePacked(frameLevel)) != keccak256(abi.encodePacked("None")) &&
            keccak256(abi.encodePacked(frameLevel)) != keccak256(abi.encodePacked("Bronze"))) {
            return 0; // Framed rugs don't accumulate dirt
        }

        // Normal dirt calculation for Bronze/None
        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;
        if (timeSinceCleaned >= rs.dirtLevel2Days) return 2;
        if (timeSinceCleaned >= rs.dirtLevel1Days) return 1;
        return 0;
    }

    function _getTextureLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Get frame level to determine texture aging speed
        string memory frameLevel = RugNFTFacet(address(this)).getFrameLevel(tokenId);
        uint256 agingMultiplier = _getTextureAgingMultiplier(frameLevel);

        // Texture level based on time since last texture reset (adjusted by frame benefits)
        uint256 adjustedTimeSinceReset = (block.timestamp - aging.lastTextureReset) / agingMultiplier;

        // Texture progression over time (longer timeline than dirt)
        if (adjustedTimeSinceReset >= rs.textureLevel2Days * 5) return 10;
        if (adjustedTimeSinceReset >= rs.textureLevel2Days * 4) return 8;
        if (adjustedTimeSinceReset >= rs.textureLevel2Days * 3) return 6;
        if (adjustedTimeSinceReset >= rs.textureLevel2Days * 2) return 4;
        if (adjustedTimeSinceReset >= rs.textureLevel2Days) return 2;
        if (adjustedTimeSinceReset >= rs.textureLevel1Days) return 1;

        return 0; // Fresh texture
    }

    function _getTextureAgingMultiplier(string memory frameLevel) internal pure returns (uint256) {
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Diamond"))) return 4; // 75% slower
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Platinum"))) return 3; // 67% slower (2/3 speed)
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Gold"))) return 2; // 50% slower
        return 1; // Normal speed for Silver, Bronze, None
    }

    function _timeUntilNextDirt(uint256 tokenId) internal view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint8 currentDirt = _getDirtLevel(tokenId);
        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        if (currentDirt == 0 && timeSinceCleaned < rs.dirtLevel1Days) {
            return rs.dirtLevel1Days - timeSinceCleaned;
        }
        if (currentDirt == 1 && timeSinceCleaned < rs.dirtLevel2Days) {
            return rs.dirtLevel2Days - timeSinceCleaned;
        }

        return 0; // Already at max dirt
    }

    function _timeUntilNextTexture(uint256 tokenId) internal view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint8 currentTexture = _getTextureLevel(tokenId);
        uint256 timeSinceReset = block.timestamp - aging.lastTextureReset;

        // Simple calculation - next level threshold
        uint256 nextThreshold;
        if (currentTexture == 0) nextThreshold = rs.textureLevel1Days;
        else if (currentTexture == 1) nextThreshold = rs.textureLevel2Days;
        else return 0; // Max texture reached

        if (timeSinceReset < nextThreshold) {
            return nextThreshold - timeSinceReset;
        }

        return 0;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return RugNFTFacet(address(this)).ownerOf(tokenId) != address(0);
    }
}
