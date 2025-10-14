// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// import {RugNFTFacet} from "./RugNFTFacet.sol";

/**
 * @title RugMaintenanceFacet
 * @notice FRESH REDESIGN: Simplified maintenance services for OnchainRugs
 * @dev Handles cleaning, restoration, and master restoration with dirt (3 levels) and aging (10 levels)
 */
contract RugMaintenanceFacet {
    // Events
    event RugCleaned(uint256 indexed tokenId, address indexed owner, uint256 cost, bool wasFree);
    event RugRestored(uint256 indexed tokenId, address indexed owner, uint8 previousLevel, uint8 newLevel, uint256 cost);
    event RugMasterRestored(uint256 indexed tokenId, address indexed owner, uint8 previousDirt, uint8 previousAging, uint256 cost);

    /**
     * @notice Clean a rug (resets dirt to level 0, earns maintenance points)
     * @param tokenId Token ID to clean
     */
    function cleanRug(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Verify ownership FIRST (before complex calculations for gas estimation)
        require(IERC721(address(this)).ownerOf(tokenId) == msg.sender, "Not token owner");

        // Check if cleaning is beneficial (has dirt or free cleaning available)
        uint8 currentDirt = _getDirtLevel(tokenId);
        bool isFree = _isCleaningFree(tokenId);
        bool needsCleaning = currentDirt > 0 || isFree;
        require(needsCleaning, "Rug doesn't need cleaning right now");

        // Calculate cost
        uint256 cost = isFree ? 0 : rs.cleaningCost;

        // Require exact payment (no refunds to avoid complexity)
        require(msg.value == cost, "Must send exact payment amount");

        // Clean dirt (reset to level 0) and delay aging progression
        // Preserve current aging level by committing it to storage
        uint8 currentAging = _getAgingLevel(tokenId);
        aging.agingLevel = currentAging;
        aging.lastCleaned = block.timestamp;

        // Earn maintenance points
        aging.cleaningCount++;

        // Update frame level based on new score
        uint256 newScore = LibRugStorage.calculateMaintenanceScore(aging);
        uint8 newFrameLevel = LibRugStorage.getFrameLevelFromScore(newScore);
        if (newFrameLevel != aging.frameLevel) {
            aging.frameLevel = newFrameLevel;
            aging.frameAchievedTime = block.timestamp;
        }

        emit RugCleaned(tokenId, msg.sender, cost, isFree);
    }

    /**
     * @notice Restore a rug (reduce aging level by 1, clean dirt)
     * @param tokenId Token ID to restore
     */
    function restoreRug(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Verify ownership
        require(IERC721(address(this)).ownerOf(tokenId) == msg.sender, "Not token owner");

        // Check if restoration is available (aging level > 0)
        uint8 currentAging = _getAgingLevel(tokenId);
        require(currentAging > 0, "Rug has no aging to restore");

        // Require exact payment (no refunds to avoid complexity)
        require(msg.value == rs.restorationCost, "Must send exact payment amount");

        // Record previous state
        uint8 previousAging = currentAging;

        // Clean dirt and reduce aging level by 1 from current calculated level
        aging.lastCleaned = block.timestamp;
        // Reduce visible aging by 1 level (can't go below 0)
        aging.agingLevel = currentAging > 0 ? currentAging - 1 : 0;

        // Earn maintenance points
        aging.restorationCount++;

        // Update frame level based on new score
        uint256 newScore = LibRugStorage.calculateMaintenanceScore(aging);
        uint8 newFrameLevel = LibRugStorage.getFrameLevelFromScore(newScore);
        if (newFrameLevel != aging.frameLevel) {
            aging.frameLevel = newFrameLevel;
            aging.frameAchievedTime = block.timestamp;
        }

        emit RugRestored(tokenId, msg.sender, previousAging, aging.agingLevel, rs.restorationCost);
    }

    /**
     * @notice Master restore a rug (reset dirt and aging to level 0)
     * @param tokenId Token ID to master restore
     */
    function masterRestoreRug(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Verify ownership
        require(IERC721(address(this)).ownerOf(tokenId) == msg.sender, "Not token owner");

        // Check if any aging exists
        uint8 currentDirt = _getDirtLevel(tokenId);
        uint8 currentAging = _getAgingLevel(tokenId);
        require(currentDirt > 0 || currentAging > 0, "Rug is already pristine");

        // Require exact payment (no refunds to avoid complexity)
        require(msg.value == rs.masterRestorationCost, "Must send exact payment amount");

        // Record previous state
        uint8 previousDirt = currentDirt;
        uint8 previousAging = currentAging;

        // Complete reset: dirt to 0, aging to 0
        aging.lastCleaned = block.timestamp;
        aging.agingLevel = 0;

        // Earn maintenance points
        aging.masterRestorationCount++;

        // Update frame level based on new score
        uint256 newScore = LibRugStorage.calculateMaintenanceScore(aging);
        uint8 newFrameLevel = LibRugStorage.getFrameLevelFromScore(newScore);
        if (newFrameLevel != aging.frameLevel) {
            aging.frameLevel = newFrameLevel;
            aging.frameAchievedTime = block.timestamp;
        }

        emit RugMasterRestored(tokenId, msg.sender, previousDirt, previousAging, rs.masterRestorationCost);
    }

    /**
     * @notice Get cost for cleaning a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei (0 if free or not beneficial)
     */
    function getCleaningCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        // Return 0 if cleaning is not beneficial
        uint8 dirtLevel = _getDirtLevel(tokenId);
        bool isFreeCleaning = _isCleaningFree(tokenId);
        bool needsCleaning = dirtLevel > 0 || isFreeCleaning;

        if (!needsCleaning) return 0;

        return isFreeCleaning ? 0 : rs.cleaningCost;
    }

    /**
     * @notice Get cost for restoring a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei (0 if no aging to restore)
     */
    function getRestorationCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        uint8 currentAging = _getAgingLevel(tokenId);
        return currentAging > 0 ? rs.restorationCost : 0;
    }

    /**
     * @notice Get cost for master restoration of a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei (0 if already pristine)
     */
    function getMasterRestorationCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        uint8 currentDirt = _getDirtLevel(tokenId);
        uint8 currentAging = _getAgingLevel(tokenId);
        return (currentDirt > 0 || currentAging > 0) ? rs.masterRestorationCost : 0;
    }

    /**
     * @notice Check if a rug can be cleaned (has dirt or free cleaning available)
     * @param tokenId Token ID to check
     * @return canClean True if cleaning is beneficial
     */
    function canCleanRug(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        uint8 dirtLevel = _getDirtLevel(tokenId);
        bool isFreeCleaning = _isCleaningFree(tokenId);
        return dirtLevel > 0 || isFreeCleaning;
    }

    /**
     * @notice Check if a rug can be restored (has aging that can be reduced)
     * @param tokenId Token ID to check
     * @return canRestore True if restoration is available
     */
    function canRestoreRug(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        return _getAgingLevel(tokenId) > 0;
    }

    /**
     * @notice Check if a rug needs master restoration
     * @param tokenId Token ID to check
     * @return needsMaster True if any aging exists
     */
    function needsMasterRestoration(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        uint8 dirt = _getDirtLevel(tokenId);
        uint8 aging = _getAgingLevel(tokenId);
        return dirt > 0 || aging > 0;
    }

    /**
     * @notice Get maintenance options available for a rug
     * @param tokenId Token ID to check
     * @return canClean Whether the rug can be cleaned
     * @return canRestore Whether the rug can be restored
     * @return needsMaster Whether master restoration is needed
     * @return cleaningCost Cost to clean the rug
     * @return restorationCost Cost to restore the rug
     * @return masterCost Cost for master restoration
     */
    function getMaintenanceOptions(uint256 tokenId) external view returns (
        bool canClean,
        bool canRestore,
        bool needsMaster,
        uint256 cleaningCost,
        uint256 restorationCost,
        uint256 masterCost
    ) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        canClean = _getDirtLevel(tokenId) > 0;
        canRestore = _getAgingLevel(tokenId) > 0; // Restoration reduces aging level
        needsMaster = canClean || canRestore;

        cleaningCost = canClean ? (_isCleaningFree(tokenId) ? 0 : LibRugStorage.rugStorage().cleaningCost) : 0;
        restorationCost = canRestore ? LibRugStorage.rugStorage().restorationCost : 0;
        masterCost = needsMaster ? LibRugStorage.rugStorage().masterRestorationCost : 0;
    }

    // Internal helper functions

    function _getDirtLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Gold+ frames never get dirty
        if (aging.frameLevel >= 3) {
            return 0;
        }

        // Calculate dirt level based on time since cleaning with frame speed adjustments
        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        // Pre-calculate adjusted thresholds to reduce computation
        uint256 level1Threshold;
        uint256 level2Threshold;

        if (aging.frameLevel == 2) {
            // Silver: 2x slower
            level1Threshold = rs.dirtLevel1Days * 2;
            level2Threshold = rs.dirtLevel2Days * 2;
        } else if (aging.frameLevel == 1) {
            // Bronze: 1.5x slower (multiply by 3/2)
            level1Threshold = (rs.dirtLevel1Days * 3) / 2;
            level2Threshold = (rs.dirtLevel2Days * 3) / 2;
        } else {
            // None: normal speed
            level1Threshold = rs.dirtLevel1Days;
            level2Threshold = rs.dirtLevel2Days;
        }

        if (timeSinceCleaned >= level2Threshold) return 2;
        if (timeSinceCleaned >= level1Threshold) return 1;
        return 0;
    }

    function _getAgingLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint256 timeSinceLevelStart = block.timestamp - aging.lastCleaned;
        uint256 baseInterval = rs.agingAdvanceDays;

        // Apply frame-based aging immunity (higher frames age slower)
        uint256 agingMultiplier = LibRugStorage.getAgingMultiplier(aging.frameLevel);
        uint256 adjustedInterval = (baseInterval * 100) / agingMultiplier;

        // Calculate how many levels we should have advanced
        uint8 levelsAdvanced = uint8(timeSinceLevelStart / adjustedInterval);

        // Cap at max level 10
        uint8 calculatedLevel = aging.agingLevel + levelsAdvanced;
        return calculatedLevel > 10 ? 10 : calculatedLevel;
    }

    function _isCleaningFree(uint256 tokenId) internal view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.RugData storage rug = rs.rugs[tokenId];
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Free if within initial grace period from mint
        uint256 timeSinceMint = block.timestamp - rug.mintTime;
        if (timeSinceMint <= rs.freeCleanDays) return true;

        // Free if recently cleaned (within free window)
        uint256 timeSinceLastClean = block.timestamp - aging.lastCleaned;
        if (timeSinceLastClean <= rs.freeCleanWindow) return true;

        return false;
    }
}
