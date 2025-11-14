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
    event FrameThresholdsUpdated();
    event ServiceFeesUpdated(uint256 cleanFee, uint256 restoreFee, uint256 masterFee);
    event ServiceFeeUpdated(uint256 serviceFee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event AIServiceFeeUpdated(uint256 newFee);

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
     * @notice Update aging thresholds for simplified system (owner only)
     * @param thresholds Array of 5 time periods in seconds: [dirtLevel1, dirtLevel2, agingAdvance, freeCleanDays, freeCleanWindow]
     */
    function updateAgingThresholds(uint256[5] calldata thresholds) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Update simplified aging parameters (values in seconds)
        rs.dirtLevel1Days = thresholds[0];      // Seconds until dirt level 1
        rs.dirtLevel2Days = thresholds[1];      // Seconds until dirt level 2
        rs.agingAdvanceDays = thresholds[2];    // Seconds between aging level advances
        rs.freeCleanDays = thresholds[3];       // Seconds after mint for free cleaning
        rs.freeCleanWindow = thresholds[4];     // Seconds after cleaning for free cleaning

        emit AgingThresholdsUpdated();
    }

    /**
     * @notice Update frame progression thresholds (owner only)
     * @param thresholds Array of 4 thresholds: [bronze, silver, gold, diamond]
     */
    function updateFrameThresholds(uint256[4] calldata thresholds) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        rs.bronzeThreshold = thresholds[0];
        rs.silverThreshold = thresholds[1];
        rs.goldThreshold = thresholds[2];
        rs.diamondThreshold = thresholds[3];

        emit FrameThresholdsUpdated();
    }

    /**
     * @notice Update AI service fee for X402 monetization
     * @param newFee New AI service fee in wei (0 to disable)
     */
    function updateAIServiceFee(uint256 newFee) external {
        LibDiamond.enforceIsContractOwner();

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.aiServiceFee = newFee;

        emit AIServiceFeeUpdated(newFee);
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
     * @notice Set flat service fee for all agent maintenance actions (owner only)
     * @param fee Flat service fee in wei
     */
    function setServiceFee(uint256 fee) external {
        LibDiamond.enforceIsContractOwner();
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.serviceFee = fee;
        emit ServiceFeeUpdated(fee);
    }

    /**
     * @notice Set the fee recipient for agent service fees (owner only)
     * @param recipient Address to receive service fees
     */
    function setFeeRecipient(address recipient) external {
        LibDiamond.enforceIsContractOwner();
        require(recipient != address(0), "Invalid recipient");
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        address old = rs.feeRecipient;
        rs.feeRecipient = recipient;
        emit FeeRecipientUpdated(old, recipient);
    }

    /**
     * @notice Get agent service fee and recipient
     * @return serviceFee, feeRecipient
     */
    function getAgentServiceFee() external view returns (uint256, address) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return (rs.serviceFee, rs.feeRecipient);
    }

    /**
     * @notice Get aging thresholds for simplified system
     * @return dirtLevel1, dirtLevel2, agingAdvance, freeCleanDays, freeCleanWindow
     */
    function getAgingThresholds() external view returns (uint256, uint256, uint256, uint256, uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return (
            rs.dirtLevel1Days,
            rs.dirtLevel2Days,
            rs.agingAdvanceDays,
            rs.freeCleanDays,
            rs.freeCleanWindow
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
     * @notice Set Scripty contract addresses for HTML generation
     * @param _rugScriptyBuilder ScriptyBuilderV2 contract address
     * @param _rugEthFSStorage EthFS storage contract address
     * @param _onchainRugsHTMLGenerator HTML generator contract address
     */
    function setScriptyContracts(
        address _rugScriptyBuilder,
        address _rugEthFSStorage,
        address _onchainRugsHTMLGenerator
    ) external {
        LibDiamond.enforceIsContractOwner();
        require(_rugScriptyBuilder != address(0), "Invalid ScriptyBuilder");
        require(_rugEthFSStorage != address(0), "Invalid EthFS storage");
        require(_onchainRugsHTMLGenerator != address(0), "Invalid HTML generator");

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.rugScriptyBuilder = _rugScriptyBuilder;
        rs.rugEthFSStorage = _rugEthFSStorage;
        rs.onchainRugsHTMLGenerator = _onchainRugsHTMLGenerator;
    }

    /**
     * @notice Set ERC721 metadata (name and symbol)
     * @param _name Token name
     * @param _symbol Token symbol
     */
    function setERC721Metadata(string calldata _name, string calldata _symbol) external {
        LibDiamond.enforceIsContractOwner();
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_symbol).length > 0, "Symbol cannot be empty");

        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        es.name = _name;
        es.symbol = _symbol;
    }

    /**
     * @notice Check if contract is properly configured
     * @return configured True if all required parameters are set
     */
    function isConfigured() external view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return rs.collectionCap > 0 && rs.walletLimit > 0;
    }
}
