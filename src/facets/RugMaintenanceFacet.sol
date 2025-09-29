// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {RugNFTFacet} from "./RugNFTFacet.sol";

/**
 * @title RugMaintenanceFacet
 * @notice Maintenance services facet for OnchainRugs cleaning and restoration
 * @dev Handles cleaning, restoration, and master restoration services
 */
contract RugMaintenanceFacet {

    // Events
    event RugCleaned(uint256 indexed tokenId, address indexed owner, uint256 cost, bool wasFree);
    event RugRestored(uint256 indexed tokenId, address indexed owner, uint8 previousLevel, uint8 newLevel, uint256 cost);
    event RugMasterRestored(uint256 indexed tokenId, address indexed owner, uint8 previousDirt, uint8 previousTexture, uint256 cost);

    /**
     * @notice Clean a rug (removes dirt, resets dirt timer)
     * @param tokenId Token ID to clean
     */
    function cleanRug(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Verify ownership
        require(IERC721(address(this)).ownerOf(tokenId) == msg.sender, "Not token owner");

        // Check if cleaning is beneficial (for maintenance or dirt removal)
        uint8 currentDirt = _getDirtLevel(tokenId);
        uint8 currentTexture = _getTextureLevel(tokenId);
        bool needsCleaning = currentDirt > 0 || currentTexture > 0 || _isCleaningFree(tokenId);
        require(needsCleaning, "Rug doesn't need cleaning right now");

        // Check if free cleaning is available
        bool isFree = _isCleaningFree(tokenId);
        uint256 cost = isFree ? 0 : rs.cleaningCost;

        // Validate payment
        require(msg.value >= cost, "Insufficient payment");

        // Refund excess payment
        if (msg.value > cost) {
            (bool success,) = payable(msg.sender).call{value: msg.value - cost}("");
            require(success, "Refund transfer failed");
        }

        // Update aging data - reset dirt timer and texture progress timer
        // This delays further texture wear but preserves existing max texture level
        aging.lastCleaned = block.timestamp;
        aging.textureProgressTimer = block.timestamp;
        aging.cleaningCount++;
        aging.maintenanceScore = (aging.cleaningCount * 2) + (aging.restorationCount * 5) + (aging.masterRestorationCount * 10) + (aging.launderingCount * 10);

        // Frame level updates are handled by the NFT facet when tokenURI is requested
        // No cross-facet calls needed here

        emit RugCleaned(tokenId, msg.sender, cost, isFree);
    }

    /**
     * @notice Restore a rug (reduce texture level by 1, set dirt to 0)
     * @param tokenId Token ID to restore
     */
    function restoreRug(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Verify ownership
        require(IERC721(address(this)).ownerOf(tokenId) == msg.sender, "Not token owner");

        // Check if texture restoration is available
        uint8 currentTexture = _getTextureLevel(tokenId);
        require(currentTexture > 0, "Rug has no texture aging to restore");

        // Validate payment
        require(msg.value >= rs.restorationCost, "Insufficient payment");

        // Refund excess payment
        if (msg.value > rs.restorationCost) {
            (bool success,) = payable(msg.sender).call{value: msg.value - rs.restorationCost}("");
            require(success, "Refund transfer failed");
        }

        // Restore texture by reducing max level and resetting progress timer
        uint8 previousDirt = _getDirtLevel(tokenId);
        uint8 previousTexture = currentTexture;
        aging.lastCleaned = block.timestamp;

        // Reduce max texture level by 1 (actual repair of existing wear)
        if (aging.maxTextureLevel > 0) {
            aging.maxTextureLevel -= 1;
        }

        // Reset texture progress timer to ensure immediate texture level reduction
        aging.textureProgressTimer = block.timestamp;
        aging.restorationCount++;
        aging.maintenanceScore = (aging.cleaningCount * 2) + (aging.restorationCount * 5) + (aging.masterRestorationCount * 10) + (aging.launderingCount * 10);

        // Frame level updates are handled by the NFT facet when tokenURI is requested
        // No cross-facet calls needed here

        emit RugRestored(tokenId, msg.sender, previousDirt, previousTexture - 1, rs.restorationCost);
    }

    /**
     * @notice Master restore a rug (reset all aging to level 0)
     * @param tokenId Token ID to master restore
     */
    function masterRestoreRug(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Verify ownership
        require(IERC721(address(this)).ownerOf(tokenId) == msg.sender, "Not token owner");

        // Check if any aging exists
        uint8 currentDirt = _getDirtLevel(tokenId);
        uint8 currentTexture = _getTextureLevel(tokenId);
        require(currentDirt > 0 || currentTexture > 0, "Rug is already pristine");

        // Validate payment
        require(msg.value >= rs.masterRestorationCost, "Insufficient payment");

        // Refund excess payment
        if (msg.value > rs.masterRestorationCost) {
            (bool success,) = payable(msg.sender).call{value: msg.value - rs.masterRestorationCost}("");
            require(success, "Refund transfer failed");
        }

        // Reset aging timers and max texture level (complete rejuvenation)
        aging.lastCleaned = block.timestamp;
        aging.lastTextureReset = block.timestamp; // Reset texture aging completely
        aging.maxTextureLevel = 0; // Reset all texture wear to pristine condition
        aging.textureProgressTimer = block.timestamp;
        aging.masterRestorationCount++;
        aging.maintenanceScore = (aging.cleaningCount * 2) + (aging.restorationCount * 5) + (aging.masterRestorationCount * 10) + (aging.launderingCount * 10);

        // Frame level updates are handled by the NFT facet when tokenURI is requested
        // No cross-facet calls needed here

        emit RugMasterRestored(tokenId, msg.sender, currentDirt, currentTexture, rs.masterRestorationCost);
    }

    /**
     * @notice Get cost for cleaning a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei (0 if free or not beneficial)
     */
    function getCleaningCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists and ownership
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        // Return 0 if cleaning is not beneficial
        uint8 dirtLevel = _getDirtLevel(tokenId);
        uint8 textureLevel = _getTextureLevel(tokenId);
        bool isFreeCleaning = _isCleaningFree(tokenId);
        bool needsCleaning = dirtLevel > 0 || textureLevel > 0 || isFreeCleaning;

        if (!needsCleaning) return 0;

        return isFreeCleaning ? 0 : rs.cleaningCost;
    }

    /**
     * @notice Get cost for restoring a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei
     */
    function getRestorationCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists and ownership
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        uint8 currentDirt = _getDirtLevel(tokenId);
        return currentDirt > 0 ? rs.restorationCost : 0;
    }

    /**
     * @notice Get cost for master restoration of a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei
     */
    function getMasterRestorationCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists and ownership
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        uint8 currentDirt = _getDirtLevel(tokenId);
        uint8 currentTexture = _getTextureLevel(tokenId);
        return (currentDirt > 0 || currentTexture > 0) ? rs.masterRestorationCost : 0;
    }

    /**
     * @notice Check if a rug can be cleaned (has dirt, texture aging, or free cleaning available)
     * @param tokenId Token ID to check
     * @return canClean True if cleaning is beneficial
     */
    function canCleanRug(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        uint8 dirtLevel = _getDirtLevel(tokenId);
        uint8 textureLevel = _getTextureLevel(tokenId);
        bool isFreeCleaning = _isCleaningFree(tokenId);
        return dirtLevel > 0 || textureLevel > 0 || isFreeCleaning;
    }

    /**
     * @notice Check if a rug can be restored (has texture wear that can be reduced)
     * @param tokenId Token ID to check
     * @return canRestore True if restoration is available
     */
    function canRestoreRug(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        return _getTextureLevel(tokenId) > 0;
    }

    /**
     * @notice Check if a rug needs master restoration
     * @param tokenId Token ID to check
     * @return needsMaster True if any aging exists
     */
    function needsMasterRestoration(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        uint8 dirt = _getDirtLevel(tokenId);
        uint8 texture = _getTextureLevel(tokenId);
        return dirt > 0 || texture > 0;
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
        canRestore = _getTextureLevel(tokenId) > 0; // Restoration reduces texture level
        needsMaster = canClean || canRestore;

        cleaningCost = canClean ? (_isCleaningFree(tokenId) ? 0 : LibRugStorage.rugStorage().cleaningCost) : 0;
        restorationCost = canRestore ? LibRugStorage.rugStorage().restorationCost : 0;
        masterCost = needsMaster ? LibRugStorage.rugStorage().masterRestorationCost : 0;
    }

    // Internal helper functions (duplicate logic from RugAgingFacet for efficiency)

    function _getDirtLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        if (timeSinceCleaned >= rs.dirtLevel2Days) return 2;
        if (timeSinceCleaned >= rs.dirtLevel1Days) return 1;
        return 0;
    }

    function _getTextureLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Get frame level to determine texture aging speed
        string memory frameLevel = aging.currentFrameLevel;
        uint256 agingMultiplier = _getTextureAgingMultiplier(frameLevel);

        // Calculate current advancement level based on progress timer
        uint256 timeSinceProgressStart = (block.timestamp - aging.textureProgressTimer) / agingMultiplier;
        uint8 currentAdvancementLevel;

        // Texture progression over time (longer timeline than dirt)
        if (timeSinceProgressStart >= rs.textureLevel2Days * 10) currentAdvancementLevel = 10;
        else if (timeSinceProgressStart >= rs.textureLevel2Days * 8) currentAdvancementLevel = 8;
        else if (timeSinceProgressStart >= rs.textureLevel2Days * 6) currentAdvancementLevel = 6;
        else if (timeSinceProgressStart >= rs.textureLevel2Days * 4) currentAdvancementLevel = 4;
        else if (timeSinceProgressStart >= rs.textureLevel2Days * 2) currentAdvancementLevel = 2;
        else if (timeSinceProgressStart >= rs.textureLevel1Days * 2) currentAdvancementLevel = 1;
        else currentAdvancementLevel = 0;

        // Texture level = MAX(current advancement, max texture level ever reached)
        // This ensures texture wear is persistent once achieved
        return currentAdvancementLevel > aging.maxTextureLevel ? currentAdvancementLevel : aging.maxTextureLevel;
    }

    function _getTextureAgingMultiplier(string memory frameLevel) internal pure returns (uint256) {
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Diamond"))) return 4; // 75% slower
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Platinum"))) return 3; // 67% slower (2/3 speed)
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Gold"))) return 2; // 50% slower
        return 1; // Normal speed for Silver, Bronze, None
    }

    function _isCleaningFree(uint256 tokenId) internal view returns (bool) {
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
}
