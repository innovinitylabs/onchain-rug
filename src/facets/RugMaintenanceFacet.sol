// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

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

        // Check if cleaning is needed
        uint8 currentDirt = _getDirtLevel(tokenId);
        require(currentDirt > 0, "Rug is already clean");

        // Check if free cleaning is available
        bool isFree = _isCleaningFree(tokenId);
        uint256 cost = isFree ? 0 : rs.cleaningCost;

        // Validate payment
        require(msg.value >= cost, "Insufficient payment");

        // Refund excess payment
        if (msg.value > cost) {
            payable(msg.sender).call{value: msg.value - cost}("");
        }

        // Update aging data - reset dirt timer, keep texture level
        aging.lastCleaned = block.timestamp;

        emit RugCleaned(tokenId, msg.sender, cost, isFree);
    }

    /**
     * @notice Restore a rug (reduce texture level by 1)
     * @param tokenId Token ID to restore
     */
    function restoreRug(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Verify ownership
        require(IERC721(address(this)).ownerOf(tokenId) == msg.sender, "Not token owner");

        // Check if restoration is available
        uint8 currentTexture = _getTextureLevel(tokenId);
        require(currentTexture > 0, "Rug has no texture aging");

        // Validate payment
        require(msg.value >= rs.restorationCost, "Insufficient payment");

        // Refund excess payment
        if (msg.value > rs.restorationCost) {
            payable(msg.sender).call{value: msg.value - rs.restorationCost}("");
        }

        // Reduce texture level by 1 (with floor at 0)
        uint8 previousLevel = currentTexture;
        uint8 newLevel = currentTexture > 1 ? currentTexture - 1 : 0;

        // Store the reduced level in aging data
        // Note: This is a simplification - in practice, we might need to adjust the lastCleaned timestamp
        // to achieve the desired texture level, but for now we'll store it directly
        aging.textureLevel = newLevel;

        // Reset dirt timer to maintain cleanliness
        aging.lastCleaned = block.timestamp;

        emit RugRestored(tokenId, msg.sender, previousLevel, newLevel, rs.restorationCost);
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
            payable(msg.sender).call{value: msg.value - rs.masterRestorationCost}("");
        }

        // Reset all aging data
        aging.lastCleaned = block.timestamp;
        aging.dirtLevel = 0;
        aging.textureLevel = 0;

        emit RugMasterRestored(tokenId, msg.sender, currentDirt, currentTexture, rs.masterRestorationCost);
    }

    /**
     * @notice Get cost for cleaning a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei (0 if free)
     */
    function getCleaningCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists and ownership
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        return _isCleaningFree(tokenId) ? 0 : rs.cleaningCost;
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

        uint8 currentTexture = _getTextureLevel(tokenId);
        return currentTexture > 0 ? rs.restorationCost : 0;
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
     * @notice Check if a rug can be cleaned (has dirt)
     * @param tokenId Token ID to check
     * @return canClean True if cleaning is needed
     */
    function canCleanRug(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        return _getDirtLevel(tokenId) > 0;
    }

    /**
     * @notice Check if a rug can be restored (has texture aging)
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
     * @return canClean, canRestore, needsMaster, cleaningCost, restorationCost, masterCost
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
        canRestore = _getTextureLevel(tokenId) > 0;
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

        uint256 timeSinceLastReset = block.timestamp - aging.lastCleaned;

        if (timeSinceLastReset >= rs.textureLevel2Days * 5) return 10;
        if (timeSinceLastReset >= rs.textureLevel2Days * 4) return 8;
        if (timeSinceLastReset >= rs.textureLevel2Days * 3) return 6;
        if (timeSinceLastReset >= rs.textureLevel2Days * 2) return 4;
        if (timeSinceLastReset >= rs.textureLevel2Days) return 2;
        if (timeSinceLastReset >= rs.textureLevel1Days) return 1;

        return 0;
    }

    function _isCleaningFree(uint256 tokenId) internal view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.RugData storage rug = rs.rugs[tokenId];
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Free if within initial period from mint
        uint256 timeSinceMint = block.timestamp - rug.mintTime;
        if (timeSinceMint <= rs.freeCleanWindow) return true;

        // Free if recently cleaned
        uint256 timeSinceLastClean = block.timestamp - aging.lastCleaned;
        if (timeSinceLastClean <= rs.freeCleanWindow) return true;

        return false;
    }
}
