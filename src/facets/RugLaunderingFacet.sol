// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";
// import {RugNFTFacet} from "./RugNFTFacet.sol";

/**
 * @title RugLaunderingFacet
 * @notice Laundering facet for OnchainRugs sale tracking and auto-cleaning
 * @dev Handles sale price tracking and automatic laundering triggers
 */
contract RugLaunderingFacet {

    // Events
    event RugSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event RugLaundered(uint256 indexed tokenId, address indexed buyer, uint256 salePrice, string triggerReason);
    event LaunderingThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event SaleTracked(uint256 indexed tokenId, uint256 salePrice, uint256[3] recentPrices);

    /**
     * @notice Record a sale and trigger laundering if conditions met
     * @param tokenId Token ID that was sold
     * @param from Seller address
     * @param to Buyer address
     * @param salePrice Sale price in wei
     */
    function recordSale(uint256 tokenId, address from, address to, uint256 salePrice) external {
        // Access control: allow marketplace facet, contract owner, or trusted external marketplaces
        require(
            msg.sender == address(this) || 
            msg.sender == LibDiamond.contractOwner() ||
            LibRugStorage.isTrustedMarketplace(msg.sender),
            "Only marketplace, owner, or trusted marketplace can record sales"
        );

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Verify the sale
        require(IERC721(address(this)).ownerOf(tokenId) == to, "Buyer is not current owner");
        require(salePrice > 0, "Sale price must be greater than 0");

        // Check if laundering should be triggered BEFORE updating sale history
        // This prevents the current sale from being included in the "recent sales" calculation
        bool shouldLaunder = _shouldTriggerLaundering(tokenId, salePrice);

        // Update sale tracking
        aging.lastSalePrice = salePrice;

        // Shift recent sale prices (keep last 3)
        aging.recentSalePrices[2] = aging.recentSalePrices[1];
        aging.recentSalePrices[1] = aging.recentSalePrices[0];
        aging.recentSalePrices[0] = salePrice;

        emit RugSold(tokenId, from, to, salePrice);
        emit SaleTracked(tokenId, salePrice, aging.recentSalePrices);

        // Trigger laundering if conditions were met
        if (shouldLaunder) {
            _triggerLaundering(tokenId, to, salePrice);
        }
    }

    /**
     * @notice Manually trigger laundering for a rug (owner only, for testing)
     * @param tokenId Token ID to launder
     */
    function triggerLaundering(uint256 tokenId) external {
        LibDiamond.enforceIsContractOwner();

        address owner = IERC721(address(this)).ownerOf(tokenId);
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        _triggerLaundering(tokenId, owner, aging.lastSalePrice);
    }

    /**
     * @notice Update laundering threshold (owner only)
     * @param newThreshold New threshold in wei
     */
    function updateLaunderingThreshold(uint256 newThreshold) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        uint256 oldThreshold = rs.launderingThreshold;
        rs.launderingThreshold = newThreshold;

        emit LaunderingThresholdUpdated(oldThreshold, newThreshold);
    }

    /**
     * @notice Check if a sale would trigger laundering
     * @param tokenId Token ID to check
     * @param salePrice Proposed sale price
     * @return wouldTrigger True if laundering would be triggered
     * @return reason Reason for triggering (empty if none)
     */
    function wouldTriggerLaundering(uint256 tokenId, uint256 salePrice) external view returns (bool wouldTrigger, string memory reason) {
        return _checkLaunderingConditions(tokenId, salePrice);
    }

    /**
     * @notice Get sale history for a rug
     * @param tokenId Token ID to check
     * @return lastSalePrice Most recent sale price
     * @return recentPrices Last 3 sale prices
     */
    function getLaunderingSaleHistory(uint256 tokenId) external view returns (uint256 lastSalePrice, uint256[3] memory recentPrices) {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];
        return (aging.lastSalePrice, aging.recentSalePrices);
    }

    /**
     * @notice Get maximum of last 3 sale prices
     * @param tokenId Token ID to check
     * @return maxPrice Maximum sale price in last 3 sales
     */
    function getMaxRecentSalePrice(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        uint256 maxPrice = 0;
        for (uint256 i = 0; i < 3; i++) {
            if (aging.recentSalePrices[i] > maxPrice) {
                maxPrice = aging.recentSalePrices[i];
            }
        }
        return maxPrice;
    }

    /**
     * @notice Get current laundering configuration
     * @return threshold Laundering threshold in wei
     * @return enabled Whether laundering is globally enabled
     */
    function getLaunderingConfig() external view returns (uint256 threshold, bool enabled) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return (rs.launderingThreshold, rs.launderingEnabled);
    }

    /**
     * @notice Get laundering statistics for a rug
     * @param tokenId Token ID to check
     * @return timesLaundered Number of times laundered (tracked via events)
     * @return lastLaundered Timestamp of last laundering (0 if never)
     * @return eligibleForLaundering Whether current conditions would trigger laundering
     */
    function getLaunderingStats(uint256 tokenId) external view returns (uint256 timesLaundered, uint256 lastLaundered, bool eligibleForLaundering) {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        // Get actual laundering statistics from storage
        timesLaundered = aging.launderingCount;
        lastLaundered = aging.lastLaundered;

        // Check if current conditions would trigger laundering
        (bool wouldTrigger,) = _checkLaunderingConditions(tokenId, aging.lastSalePrice);
        eligibleForLaundering = wouldTrigger;

        return (timesLaundered, lastLaundered, eligibleForLaundering);
    }

    // Internal functions

    /**
     * @notice Check if laundering conditions are met
     * @param tokenId Token ID to check
     * @param salePrice Sale price
     * @return shouldTrigger True if laundering should be triggered
     * @return reason Reason for triggering
     */
    function _checkLaunderingConditions(uint256 tokenId, uint256 salePrice) internal view returns (bool shouldTrigger, string memory reason) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Check if laundering is globally enabled
        if (!rs.launderingEnabled) {
            return (false, "");
        }

        // Get maximum of last 3 sales
        uint256 maxRecentPrice = _getMaxRecentSalePrice(tokenId);

        // Condition 1: Sale price above laundering threshold
        bool aboveThreshold = salePrice >= rs.launderingThreshold;

        // Condition 2: Sale price above maximum of last 3 sales
        bool aboveRecentMax = salePrice > maxRecentPrice;

        // Laundering triggers if BOTH conditions are met
        if (aboveThreshold && aboveRecentMax) {
            return (true, "Above threshold and recent maximum");
        }

        return (false, "");
    }

    /**
     * @notice Check if laundering should be triggered for a sale
     * @param tokenId Token ID
     * @param salePrice Sale price
     * @return shouldTrigger True if laundering should happen
     */
    function _shouldTriggerLaundering(uint256 tokenId, uint256 salePrice) internal view returns (bool) {
        (bool shouldTrigger,) = _checkLaunderingConditions(tokenId, salePrice);
        return shouldTrigger;
    }

    /**
     * @notice Trigger laundering for a rug
     * @param tokenId Token ID to launder
     * @param buyer Buyer address
     * @param salePrice Sale price that triggered laundering
     */
    function _triggerLaundering(uint256 tokenId, address buyer, uint256 salePrice) internal {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        // Reset all aging (laundering resets everything to level 0)
        aging.lastCleaned = block.timestamp;
        aging.agingLevel = 0;

        // Track laundering statistics
        aging.launderingCount++;
        aging.lastLaundered = block.timestamp;

        // Update frame level based on new score
        uint256 newScore = LibRugStorage.calculateMaintenanceScore(aging);
        uint8 newFrameLevel = LibRugStorage.getFrameLevelFromScore(newScore);
        if (newFrameLevel != aging.frameLevel) {
            aging.frameLevel = newFrameLevel;
            aging.frameAchievedTime = block.timestamp;
        }

        (, string memory reason) = _checkLaunderingConditions(tokenId, salePrice);

        emit RugLaundered(tokenId, buyer, salePrice, reason);
    }

    // Internal helper functions

    function _getMaxRecentSalePrice(uint256 tokenId) internal view returns (uint256) {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        uint256 maxPrice = 0;
        for (uint256 i = 0; i < 3; i++) {
            if (aging.recentSalePrices[i] > maxPrice) {
                maxPrice = aging.recentSalePrices[i];
            }
        }
        return maxPrice;
    }
}
