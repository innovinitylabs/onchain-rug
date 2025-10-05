// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {RugNFTFacet} from "./RugNFTFacet.sol";

/**
 * @title RugAgingFacet
 * @notice FRESH REDESIGN: Simplified aging mechanics for OnchainRugs
 * @dev Handles dirt (3 levels), aging (11 levels: 0-10), and frames (5 levels)
 */
contract RugAgingFacet {
    // ===== DIRT SYSTEM (3 LEVELS: 0=Clean, 1=Dirty, 2=Very Dirty) =====

    /**
     * @notice Get current dirt level for a rug
     * @param tokenId Token ID to check
     * @return dirtLevel Current dirt level (0-2)
     */
    function getDirtLevel(uint256 tokenId) external view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Check frame immunity first
        if (LibRugStorage.hasDirtImmunity(aging.frameLevel)) {
            return 0; // Silver+ frames never accumulate dirt
        }

        // Calculate dirt level based on time since cleaning
        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        if (timeSinceCleaned >= rs.dirtLevel2Days * 1 days) return 2;
        if (timeSinceCleaned >= rs.dirtLevel1Days * 1 days) return 1;
        return 0;
    }

    /**
     * @notice Check if a rug shows any dirt
     * @param tokenId Token ID to check
     * @return hasDirt True if rug shows dirt overlay (level 1+)
     */
    function hasDirt(uint256 tokenId) external view returns (bool) {
        return this.getDirtLevel(tokenId) > 0;
    }

    // ===== AGING SYSTEM (11 LEVELS: 0-10) =====

    /**
     * @notice Get current aging level for a rug
     * @param tokenId Token ID to check
     * @return agingLevel Current aging level (0-10)
     */
    function getAgingLevel(uint256 tokenId) external view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint256 timeSinceLevelStart = block.timestamp - aging.agingStartTime;
        uint256 advanceInterval = rs.agingAdvanceDays * 1 days;

        // Calculate how many levels we should have advanced
        uint8 levelsAdvanced = uint8(timeSinceLevelStart / advanceInterval);

        // Cap at max level 10
        uint8 calculatedLevel = aging.agingLevel + levelsAdvanced;
        return calculatedLevel > 10 ? 10 : calculatedLevel;
    }

    // ===== FRAME SYSTEM (5 LEVELS: 0-4) =====

    /**
     * @notice Get current frame level for a rug
     * @param tokenId Token ID to check
     * @return frameLevel Current frame level (0-4)
     */
    function getFrameLevel(uint256 tokenId) external view returns (uint8) {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];
        return aging.frameLevel;
    }

    /**
     * @notice Get frame name for a rug
     * @param tokenId Token ID to check
     * @return frameName String name of current frame
     */
    function getFrameName(uint256 tokenId) external view returns (string memory) {
        uint8 frameLevel = this.getFrameLevel(tokenId);
        return LibRugStorage.getFrameName(frameLevel);
    }

    /**
     * @notice Get maintenance score for a rug
     * @param tokenId Token ID to check
     * @return score Total maintenance score
     */
    function getMaintenanceScore(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];
        return LibRugStorage.calculateMaintenanceScore(aging);
    }

    // ===== COMPREHENSIVE STATE QUERIES =====

    /**
     * @notice Get complete aging state for a rug
     * @param tokenId Token ID to check
     * @return dirtLevel Current dirt level (0-2)
     * @return agingLevel Current aging level (0-9)
     * @return frameLevel Current frame level (0-4)
     * @return maintenanceScore Total maintenance score
     * @return lastCleaned Timestamp of last cleaning
     * @return agingStartTime When current aging level started
     */
    function getAgingState(uint256 tokenId) external view returns (
        uint8 dirtLevel,
        uint8 agingLevel,
        uint8 frameLevel,
        uint256 maintenanceScore,
        uint256 lastCleaned,
        uint256 agingStartTime
    ) {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        dirtLevel = this.getDirtLevel(tokenId);
        agingLevel = this.getAgingLevel(tokenId);
        frameLevel = aging.frameLevel;
        maintenanceScore = LibRugStorage.calculateMaintenanceScore(aging);
        lastCleaned = aging.lastCleaned;
        agingStartTime = aging.agingStartTime;
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * @notice Check if cleaning is free for a rug
     * @param tokenId Token ID to check
     * @return isFree True if cleaning costs nothing
     */
    function isCleaningFree(uint256 tokenId) external view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.RugData storage rug = rs.rugs[tokenId];
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Free if within initial grace period from mint
        uint256 timeSinceMint = block.timestamp - rug.mintTime;
        if (timeSinceMint <= rs.freeCleanDays * 1 days) return true;

        // Free if recently cleaned (within free window)
        uint256 timeSinceLastClean = block.timestamp - aging.lastCleaned;
        if (timeSinceLastClean <= rs.freeCleanWindow * 1 days) return true;

        return false;
    }

    /**
     * @notice Get time until next dirt level increase
     * @param tokenId Token ID to check
     * @return secondsUntilNextDirt Time in seconds until dirt level increases (0 if maxed or immune)
     */
    function timeUntilNextDirt(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Check immunity
        if (LibRugStorage.hasDirtImmunity(aging.frameLevel)) {
            return 0; // Never becomes dirty
        }

        uint8 currentDirt = this.getDirtLevel(tokenId);
        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        // Find time to next level
        if (currentDirt == 0 && timeSinceCleaned < rs.dirtLevel1Days * 1 days) {
            return (rs.dirtLevel1Days * 1 days) - timeSinceCleaned;
        }
        if (currentDirt == 1 && timeSinceCleaned < rs.dirtLevel2Days * 1 days) {
            return (rs.dirtLevel2Days * 1 days) - timeSinceCleaned;
        }

        return 0; // Already at max dirt level
    }

    /**
     * @notice Get time until next aging level increase
     * @param tokenId Token ID to check
     * @return secondsUntilAging Time in seconds until aging level increases (0 if maxed)
     */
    function timeUntilNextAging(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint8 currentLevel = this.getAgingLevel(tokenId);
        if (currentLevel >= 10) return 0; // Max level reached

        uint256 timeSinceLevelStart = block.timestamp - aging.agingStartTime;
        uint256 advanceInterval = rs.agingAdvanceDays * 1 days;

        // Time until next level
        uint256 timeForNextLevel = (currentLevel - aging.agingLevel + 1) * advanceInterval;
        uint256 timeRemaining = timeForNextLevel - timeSinceLevelStart;

        return timeRemaining;
    }

    // Internal helper functions

    function _getDirtLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Check if rug has a frame (Silver+ frames get dirt immunity)
        string memory frameLevel = _getFrameLevel(tokenId);
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

    function _getFrameLevel(uint256 tokenId) internal view returns (string memory) {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];
        return LibRugStorage.getFrameName(aging.frameLevel);
    }

    function _getAgingLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint256 timeSinceLevelStart = block.timestamp - aging.agingStartTime;
        uint256 advanceInterval = rs.agingAdvanceDays * 1 days;

        // Calculate how many levels we should have advanced
        uint8 levelsAdvanced = uint8(timeSinceLevelStart / advanceInterval);

        // Cap at max level 10
        uint8 calculatedLevel = aging.agingLevel + levelsAdvanced;
        return calculatedLevel > 10 ? 10 : calculatedLevel;
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

    function _timeUntilNextAging(uint256 tokenId) internal view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint8 currentLevel = _getAgingLevel(tokenId);
        if (currentLevel >= 10) return 0; // Max level reached

        uint256 timeSinceLevelStart = block.timestamp - aging.agingStartTime;
        uint256 advanceInterval = rs.agingAdvanceDays * 1 days;

        // Time until next level
        uint256 timeForNextLevel = (currentLevel - aging.agingLevel + 1) * advanceInterval;
        uint256 timeRemaining = timeForNextLevel - timeSinceLevelStart;

        return timeRemaining;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return RugNFTFacet(address(this)).ownerOf(tokenId) != address(0);
    }
}
