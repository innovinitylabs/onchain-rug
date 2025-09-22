// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";

/**
 * @title RugAdminFacet
 * @notice Administrative facet for OnchainRugs owner controls
 * @dev Handles all configuration, pricing, and administrative functions
 */
contract RugAdminFacet {
    // Events
    event CollectionCapUpdated(uint256 oldCap, uint256 newCap);
    event WalletLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event PricingUpdated(string parameter, uint256 oldValue, uint256 newValue);
    event AgingThresholdsUpdated();
    event ExceptionAdded(address indexed account);
    event ExceptionRemoved(address indexed account);
    event LaunderingToggled(bool enabled);
    event LaunchStatusChanged(bool launched);

    /**
     * @notice Update collection cap (owner only)
     * @param newCap New maximum supply (0-10000)
     */
    function updateCollectionCap(uint256 newCap) external {
        LibDiamond.enforceIsContractOwner();
        require(newCap <= 10000, "Cap cannot exceed 10,000");

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        uint256 oldCap = rs.collectionCap;
        rs.collectionCap = newCap;

        emit CollectionCapUpdated(oldCap, newCap);
    }

    /**
     * @notice Update wallet limit (owner only)
     * @param newLimit New NFTs per wallet limit
     */
    function updateWalletLimit(uint256 newLimit) external {
        LibDiamond.enforceIsContractOwner();
        require(newLimit > 0, "Limit must be greater than 0");

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        uint256 oldLimit = rs.walletLimit;
        rs.walletLimit = newLimit;

        emit WalletLimitUpdated(oldLimit, newLimit);
    }

    /**
     * @notice Update all mint pricing (owner only)
     * @param prices Array of 6 prices: [basePrice, line1, line2, line3, line4, line5]
     */
    function updateMintPricing(uint256[6] calldata prices) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        if (rs.basePrice != prices[0]) {
            emit PricingUpdated("basePrice", rs.basePrice, prices[0]);
            rs.basePrice = prices[0];
        }
        if (rs.linePrice1 != prices[1]) {
            emit PricingUpdated("linePrice1", rs.linePrice1, prices[1]);
            rs.linePrice1 = prices[1];
        }
        if (rs.linePrice2 != prices[2]) {
            emit PricingUpdated("linePrice2", rs.linePrice2, prices[2]);
            rs.linePrice2 = prices[2];
        }
        if (rs.linePrice3 != prices[3]) {
            emit PricingUpdated("linePrice3", rs.linePrice3, prices[3]);
            rs.linePrice3 = prices[3];
        }
        if (rs.linePrice4 != prices[4]) {
            emit PricingUpdated("linePrice4", rs.linePrice4, prices[4]);
            rs.linePrice4 = prices[4];
        }
        if (rs.linePrice5 != prices[5]) {
            emit PricingUpdated("linePrice5", rs.linePrice5, prices[5]);
            rs.linePrice5 = prices[5];
        }
    }

    /**
     * @notice Update service pricing (owner only)
     * @param prices Array of 4 prices: [cleaning, restoration, masterRestoration, launderingThreshold]
     */
    function updateServicePricing(uint256[4] calldata prices) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        if (rs.cleaningCost != prices[0]) {
            emit PricingUpdated("cleaningCost", rs.cleaningCost, prices[0]);
            rs.cleaningCost = prices[0];
        }
        if (rs.restorationCost != prices[1]) {
            emit PricingUpdated("restorationCost", rs.restorationCost, prices[1]);
            rs.restorationCost = prices[1];
        }
        if (rs.masterRestorationCost != prices[2]) {
            emit PricingUpdated("masterRestorationCost", rs.masterRestorationCost, prices[2]);
            rs.masterRestorationCost = prices[2];
        }
        if (rs.launderingThreshold != prices[3]) {
            emit PricingUpdated("launderingThreshold", rs.launderingThreshold, prices[3]);
            rs.launderingThreshold = prices[3];
        }
    }

    /**
     * @notice Update aging thresholds (owner only)
     * @param thresholds Array of 6 time periods in days: [dirt1, dirt2, texture1, texture2, freeCleanDays, freeCleanWindow]
     */
    function updateAgingThresholds(uint256[6] calldata thresholds) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        rs.dirtLevel1Days = thresholds[0] * 1 days;
        rs.dirtLevel2Days = thresholds[1] * 1 days;
        rs.textureLevel1Days = thresholds[2] * 1 days;
        rs.textureLevel2Days = thresholds[3] * 1 days;
        rs.freeCleanWindow = thresholds[5] * 1 days;

        emit AgingThresholdsUpdated();
    }

    /**
     * @notice Add address to exception list (bypasses wallet limits)
     * @param account Address to add
     */
    function addToExceptionList(address account) external {
        LibDiamond.enforceIsContractOwner();
        require(account != address(0), "Invalid address");

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Check if already exists
        for (uint256 i = 0; i < rs.exceptionList.length; i++) {
            if (rs.exceptionList[i] == account) {
                return; // Already in list
            }
        }

        rs.exceptionList.push(account);
        emit ExceptionAdded(account);
    }

    /**
     * @notice Remove address from exception list
     * @param account Address to remove
     */
    function removeFromExceptionList(address account) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        for (uint256 i = 0; i < rs.exceptionList.length; i++) {
            if (rs.exceptionList[i] == account) {
                // Move last element to this position
                rs.exceptionList[i] = rs.exceptionList[rs.exceptionList.length - 1];
                rs.exceptionList.pop();
                emit ExceptionRemoved(account);
                break;
            }
        }
    }

    /**
     * @notice Toggle laundering functionality on/off
     * @param enabled True to enable, false to disable
     */
    function setLaunderingEnabled(bool enabled) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.launderingEnabled = enabled;

        emit LaunderingToggled(enabled);
    }

    /**
     * @notice Set launch status
     * @param launched True when officially launched
     */
    function setLaunchStatus(bool launched) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.isLaunched = launched;

        emit LaunchStatusChanged(launched);
    }

    // View functions for owner/admin

    /**
     * @notice Get current configuration
     * @return Collection cap, wallet limit, launched status, laundering enabled
     */
    function getConfig() external view returns (uint256, uint256, bool, bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return (rs.collectionCap, rs.walletLimit, rs.isLaunched, rs.launderingEnabled);
    }

    /**
     * @notice Get current pricing
     * @return basePrice, line prices array
     */
    function getMintPricing() external view returns (uint256, uint256[5] memory) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return (
            rs.basePrice,
            [rs.linePrice1, rs.linePrice2, rs.linePrice3, rs.linePrice4, rs.linePrice5]
        );
    }

    /**
     * @notice Get service pricing
     * @return cleaning, restoration, master restoration, laundering threshold
     */
    function getServicePricing() external view returns (uint256, uint256, uint256, uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return (rs.cleaningCost, rs.restorationCost, rs.masterRestorationCost, rs.launderingThreshold);
    }

    /**
     * @notice Get aging thresholds in days
     * @return dirt1, dirt2, texture1, texture2, freeCleanWindow
     */
    function getAgingThresholds() external view returns (uint256, uint256, uint256, uint256, uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return (
            rs.dirtLevel1Days / 1 days,
            rs.dirtLevel2Days / 1 days,
            rs.textureLevel1Days / 1 days,
            rs.textureLevel2Days / 1 days,
            rs.freeCleanWindow / 1 days
        );
    }

    /**
     * @notice Get exception list
     * @return Array of exception addresses
     */
    function getExceptionList() external view returns (address[] memory) {
        return LibRugStorage.rugStorage().exceptionList;
    }

    /**
     * @notice Check if contract is properly configured
     * @return True if all required parameters are set
     */
    function isConfigured() external view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return rs.collectionCap > 0 && rs.walletLimit > 0;
    }
}
