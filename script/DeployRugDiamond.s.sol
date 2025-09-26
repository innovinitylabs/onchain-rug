// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/Diamond.sol";
import "../src/diamond/facets/DiamondCutFacet.sol";
import "../src/diamond/facets/DiamondLoupeFacet.sol";

// Rug Facets
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/facets/RugAgingFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugCommerceFacet.sol";
import "../src/facets/RugLaunderingFacet.sol";

// Rug Storage
import "../src/libraries/LibRugStorage.sol";

// Scripty dependencies
import "../src/scripty/ScriptyBuilderV2.sol";
import "../src/scripty/ScriptyStorageV2.sol";
import "../src/scripty/dependencies/ethfs/FileStore.sol";

/**
 * @title DeployRugDiamond
 * @notice Deployment script for the complete OnchainRugs diamond contract
 * @dev Deploys all facets and configures the diamond with proper function selectors
 */
contract DeployRugDiamond is Script {
    // Deployed contracts
    Diamond public diamond;
    DiamondCutFacet public diamondCutFacet;
    DiamondLoupeFacet public diamondLoupeFacet;

    // Rug facets
    RugNFTFacet public rugNFTFacet;
    RugAdminFacet public rugAdminFacet;
    RugAgingFacet public rugAgingFacet;
    RugMaintenanceFacet public rugMaintenanceFacet;
    RugCommerceFacet public rugCommerceFacet;
    RugLaunderingFacet public rugLaunderingFacet;

    // Configuration
    address public constant SCRIPTY_BUILDER = 0x0000000000000000000000000000000000000000; // Will be set later
    address public constant SCRIPTY_STORAGE = 0x0000000000000000000000000000000000000000; // Will be set later
    address public constant HTML_GENERATOR = 0x0000000000000000000000000000000000000000; // Will be set later

    function run() external returns (Diamond) {
        vm.startBroadcast();

        // Deploy core diamond infrastructure
        diamondCutFacet = new DiamondCutFacet();
        diamond = new Diamond(address(this), address(diamondCutFacet));
        diamondLoupeFacet = new DiamondLoupeFacet();

        // Deploy rug facets
        rugNFTFacet = new RugNFTFacet();
        rugAdminFacet = new RugAdminFacet();
        rugAgingFacet = new RugAgingFacet();
        rugMaintenanceFacet = new RugMaintenanceFacet();
        rugCommerceFacet = new RugCommerceFacet();
        rugLaunderingFacet = new RugLaunderingFacet();

        // Build facet cuts
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](7);

        // DiamondLoupe facet
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getDiamondLoupeSelectors()
        });

        // RugNFT facet
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugNFTSelectors()
        });

        // RugAdmin facet
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(rugAdminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugAdminSelectors()
        });

        // RugAging facet
        cuts[3] = IDiamondCut.FacetCut({
            facetAddress: address(rugAgingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugAgingSelectors()
        });

        // RugMaintenance facet
        cuts[4] = IDiamondCut.FacetCut({
            facetAddress: address(rugMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugMaintenanceSelectors()
        });

        // RugCommerce facet
        cuts[5] = IDiamondCut.FacetCut({
            facetAddress: address(rugCommerceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugCommerceSelectors()
        });

        // RugLaundering facet
        cuts[6] = IDiamondCut.FacetCut({
            facetAddress: address(rugLaunderingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugLaunderingSelectors()
        });

        // Execute diamond cut
        IDiamondCut(address(diamond)).diamondCut(cuts, address(0), "");

        // Initialize configuration
        _initializeConfiguration();

        vm.stopBroadcast();

        console.log("Diamond deployed at:", address(diamond));
        return diamond;
    }

    function _initializeConfiguration() internal {
        // Set initial configuration for testing
        RugAdminFacet(address(diamond)).updateCollectionCap(10000);
        RugAdminFacet(address(diamond)).updateWalletLimit(7);

        // Set pricing (test values)
        uint256[6] memory mintPrices = [uint256(0.00001 ether), 0.00001 ether, 0.00001 ether, 0.00001 ether, 0.00001 ether, 0.00001 ether];
        RugAdminFacet(address(diamond)).updateMintPricing(mintPrices);

        uint256[4] memory servicePrices = [uint256(0.00001 ether), 0.00001 ether, 0.00001 ether, 0.00001 ether];
        RugAdminFacet(address(diamond)).updateServicePricing(servicePrices);

        // Set aging thresholds (test values - minutes instead of days for quick testing)
        uint256[6] memory agingThresholds = [
            uint256(3 minutes),    // dirt level 1 threshold (3 minutes)
            uint256(7 minutes),    // dirt level 2 threshold (7 minutes)
            uint256(30 minutes),   // texture level 1 threshold (30 minutes)
            uint256(90 minutes),   // texture level 2 threshold (90 minutes)
            uint256(30 minutes),   // free clean days (30 minutes)
            uint256(11 minutes)    // free clean window (11 minutes)
        ];
        RugAdminFacet(address(diamond)).updateAgingThresholds(agingThresholds);

        // Add owner to exception list (no wallet limits)
        RugAdminFacet(address(diamond)).addToExceptionList(address(this));

        console.log("Configuration initialized with owner exceptions");
    }

    function _getDiamondLoupeSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = DiamondLoupeFacet.facets.selector;
        selectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        selectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        selectors[3] = DiamondLoupeFacet.facetAddress.selector;
        return selectors;
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](18);
        selectors[0] = RugNFTFacet.mintRug.selector;
        selectors[1] = RugNFTFacet.burn.selector;
        selectors[2] = RugNFTFacet.getRugData.selector;
        selectors[3] = RugNFTFacet.getAgingData.selector;
        selectors[4] = RugNFTFacet.totalSupply.selector;
        selectors[5] = RugNFTFacet.maxSupply.selector;
        selectors[6] = RugNFTFacet.isTextAvailable.selector;
        selectors[7] = RugNFTFacet.getMintPrice.selector;
        selectors[8] = RugNFTFacet.canMint.selector;
        selectors[9] = RugNFTFacet.walletMints.selector;
        selectors[10] = RugNFTFacet.isWalletException.selector;
        selectors[11] = RugNFTFacet.tokenURI.selector;
        selectors[12] = RugNFTFacet.supportsInterface.selector;
        selectors[13] = RugNFTFacet.getFrameLevel.selector;
        selectors[14] = RugNFTFacet.getFrameStatus.selector;
        selectors[15] = RugNFTFacet.getMaintenanceHistory.selector;
        selectors[16] = RugNFTFacet.getSaleHistory.selector;
        selectors[17] = RugNFTFacet.updateFrameLevel.selector;
        return selectors;
    }

    function _getRugAdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](16);
        selectors[0] = RugAdminFacet.updateCollectionCap.selector;
        selectors[1] = RugAdminFacet.updateWalletLimit.selector;
        selectors[2] = RugAdminFacet.updateMintPricing.selector;
        selectors[3] = RugAdminFacet.updateServicePricing.selector;
        selectors[4] = RugAdminFacet.updateAgingThresholds.selector;
        selectors[5] = RugAdminFacet.addToExceptionList.selector;
        selectors[6] = RugAdminFacet.removeFromExceptionList.selector;
        selectors[7] = RugAdminFacet.setLaunderingEnabled.selector;
        selectors[8] = RugAdminFacet.setLaunchStatus.selector;
        selectors[9] = RugAdminFacet.setScriptyContracts.selector;
        selectors[10] = RugAdminFacet.getConfig.selector;
        selectors[11] = RugAdminFacet.getMintPricing.selector;
        selectors[12] = RugAdminFacet.getServicePricing.selector;
        selectors[13] = RugAdminFacet.getAgingThresholds.selector;
        selectors[14] = RugAdminFacet.getExceptionList.selector;
        selectors[15] = RugAdminFacet.isConfigured.selector;
        return selectors;
    }

    function _getRugAgingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](14);
        selectors[0] = RugAgingFacet.getDirtLevel.selector;
        selectors[1] = RugAgingFacet.getTextureLevel.selector;
        selectors[2] = RugAgingFacet.getAgingState.selector;
        selectors[3] = RugAgingFacet.canClean.selector;
        selectors[4] = RugAgingFacet.canRestore.selector;
        selectors[5] = RugAgingFacet.isCleaningFree.selector;
        selectors[6] = RugAgingFacet.timeUntilNextDirt.selector;
        selectors[7] = RugAgingFacet.timeUntilNextTexture.selector;
        selectors[8] = RugAgingFacet.getAgingStats.selector;
        selectors[9] = RugAgingFacet.isWellMaintained.selector;
        selectors[10] = RugAgingFacet.getProgressionInfo.selector;
        return selectors;
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](13);
        selectors[0] = RugMaintenanceFacet.cleanRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreRug.selector;
        selectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[6] = RugMaintenanceFacet.canCleanRug.selector;
        selectors[7] = RugMaintenanceFacet.canRestoreRug.selector;
        selectors[8] = RugMaintenanceFacet.needsMasterRestoration.selector;
        selectors[9] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        return selectors;
    }

    function _getRugCommerceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](9);
        selectors[0] = RugCommerceFacet.withdraw.selector;
        selectors[1] = RugCommerceFacet.withdrawTo.selector;
        selectors[2] = RugCommerceFacet.configureRoyalties.selector;
        selectors[3] = RugCommerceFacet.royaltyInfo.selector;
        selectors[4] = RugCommerceFacet.distributeRoyalties.selector;
        selectors[5] = RugCommerceFacet.getBalance.selector;
        selectors[6] = RugCommerceFacet.getRoyaltyConfig.selector;
        selectors[7] = RugCommerceFacet.calculateRoyalty.selector;
        selectors[8] = RugCommerceFacet.getRoyaltyRecipients.selector;
        return selectors;
    }

    function _getRugLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](9);
        selectors[0] = RugLaunderingFacet.recordSale.selector;
        selectors[1] = RugLaunderingFacet.triggerLaundering.selector;
        selectors[2] = RugLaunderingFacet.updateLaunderingThreshold.selector;
        selectors[3] = RugLaunderingFacet.wouldTriggerLaundering.selector;
        selectors[4] = RugLaunderingFacet.getSaleHistory.selector;
        selectors[5] = RugLaunderingFacet.getMaxRecentSalePrice.selector;
        selectors[6] = RugLaunderingFacet.getLaunderingConfig.selector;
        selectors[7] = RugLaunderingFacet.getLaunderingStats.selector;
        return selectors;
    }
}