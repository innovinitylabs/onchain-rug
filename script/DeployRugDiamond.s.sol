// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

// Diamond Core
import {Diamond} from "../src/diamond/Diamond.sol";
import {DiamondCutFacet} from "../src/diamond/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../src/diamond/facets/DiamondLoupeFacet.sol";
import {LibDiamond} from "../src/diamond/libraries/LibDiamond.sol";
import {IDiamondCut} from "../src/diamond/interfaces/IDiamondCut.sol";

// Rug Facets
import {RugNFTFacet} from "../src/facets/RugNFTFacet.sol";
import {RugAdminFacet} from "../src/facets/RugAdminFacet.sol";
import {RugAgingFacet} from "../src/facets/RugAgingFacet.sol";
import {RugMaintenanceFacet} from "../src/facets/RugMaintenanceFacet.sol";
import {RugCommerceFacet} from "../src/facets/RugCommerceFacet.sol";
import {RugLaunderingFacet} from "../src/facets/RugLaunderingFacet.sol";

// Rug Storage Library
import {LibRugStorage} from "../src/libraries/LibRugStorage.sol";

/**
 * @title DeployRugDiamond
 * @notice Deployment script for the complete OnchainRugs diamond
 * @dev Deploys all facets and assembles the diamond with proper configuration
 */
contract DeployRugDiamond is Script {
    // Deployment addresses (will be set during deployment)
    Diamond public diamond;
    DiamondCutFacet public diamondCutFacet;
    DiamondLoupeFacet public diamondLoupeFacet;

    // Rug Facets
    RugNFTFacet public rugNFTFacet;
    RugAdminFacet public rugAdminFacet;
    RugAgingFacet public rugAgingFacet;
    RugMaintenanceFacet public rugMaintenanceFacet;
    RugCommerceFacet public rugCommerceFacet;
    RugLaunderingFacet public rugLaunderingFacet;

    // Configuration constants (test values)
    uint256 constant TEST_ETH = 0.00001 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying OnchainRugs Diamond...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy Diamond Core Facets
        console.log("Step 1: Deploying Diamond Core Facets...");
        diamondCutFacet = new DiamondCutFacet();
        diamondLoupeFacet = new DiamondLoupeFacet();

        console.log("DiamondCutFacet deployed at:", address(diamondCutFacet));
        console.log("DiamondLoupeFacet deployed at:", address(diamondLoupeFacet));

        // Step 2: Deploy Diamond with DiamondCutFacet
        console.log("Step 2: Deploying main Diamond contract...");
        diamond = new Diamond(deployer, address(diamondCutFacet));
        console.log("Diamond deployed at:", address(diamond));

        // Step 3: Deploy Rug Facets
        console.log("Step 3: Deploying Rug Facets...");
        rugNFTFacet = new RugNFTFacet();
        rugAdminFacet = new RugAdminFacet();
        rugAgingFacet = new RugAgingFacet();
        rugMaintenanceFacet = new RugMaintenanceFacet();
        rugCommerceFacet = new RugCommerceFacet();
        rugLaunderingFacet = new RugLaunderingFacet();

        console.log("RugNFTFacet deployed at:", address(rugNFTFacet));
        console.log("RugAdminFacet deployed at:", address(rugAdminFacet));
        console.log("RugAgingFacet deployed at:", address(rugAgingFacet));
        console.log("RugMaintenanceFacet deployed at:", address(rugMaintenanceFacet));
        console.log("RugCommerceFacet deployed at:", address(rugCommerceFacet));
        console.log("RugLaunderingFacet deployed at:", address(rugLaunderingFacet));

        // Step 4: Add Loupe and Rug Facets to Diamond
        console.log("Step 4: Adding facets to Diamond...");

        // Add facets one by one to avoid selector conflicts

        // DiamondLoupeFacet
        IDiamondCut.FacetCut[] memory loupeCut = new IDiamondCut.FacetCut[](1);
        loupeCut[0] = _createFacetCut(
            address(diamondLoupeFacet),
            _generateSelectors("DiamondLoupeFacet")
        );
        IDiamondCut(address(diamond)).diamondCut(loupeCut, address(0), "");
        console.log("Added DiamondLoupeFacet to diamond");

        // RugNFTFacet
        IDiamondCut.FacetCut[] memory nftCut = new IDiamondCut.FacetCut[](1);
        nftCut[0] = _createFacetCut(
            address(rugNFTFacet),
            _generateSelectors("RugNFTFacet")
        );
        IDiamondCut(address(diamond)).diamondCut(nftCut, address(0), "");
        console.log("Added RugNFTFacet to diamond");

        // RugAdminFacet
        IDiamondCut.FacetCut[] memory adminCut = new IDiamondCut.FacetCut[](1);
        adminCut[0] = _createFacetCut(
            address(rugAdminFacet),
            _generateSelectors("RugAdminFacet")
        );
        IDiamondCut(address(diamond)).diamondCut(adminCut, address(0), "");
        console.log("Added RugAdminFacet to diamond");

        // RugAgingFacet
        IDiamondCut.FacetCut[] memory agingCut = new IDiamondCut.FacetCut[](1);
        agingCut[0] = _createFacetCut(
            address(rugAgingFacet),
            _generateSelectors("RugAgingFacet")
        );
        IDiamondCut(address(diamond)).diamondCut(agingCut, address(0), "");
        console.log("Added RugAgingFacet to diamond");

        // RugMaintenanceFacet
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = _createFacetCut(
            address(rugMaintenanceFacet),
            _generateSelectors("RugMaintenanceFacet")
        );
        IDiamondCut(address(diamond)).diamondCut(maintenanceCut, address(0), "");
        console.log("Added RugMaintenanceFacet to diamond");

        // RugLaunderingFacet
        IDiamondCut.FacetCut[] memory launderingCut = new IDiamondCut.FacetCut[](1);
        launderingCut[0] = _createFacetCut(
            address(rugLaunderingFacet),
            _generateSelectors("RugLaunderingFacet")
        );
        IDiamondCut(address(diamond)).diamondCut(launderingCut, address(0), "");
        console.log("Added RugLaunderingFacet to diamond");

        // RugCommerceFacet (add last to avoid conflicts)
        IDiamondCut.FacetCut[] memory commerceCut = new IDiamondCut.FacetCut[](1);
        commerceCut[0] = _createFacetCut(
            address(rugCommerceFacet),
            _generateSelectors("RugCommerceFacet")
        );
        IDiamondCut(address(diamond)).diamondCut(commerceCut, address(0), "");
        console.log("Added RugCommerceFacet to diamond");

        // Step 5: Initialize Rug Configuration
        console.log("Step 5: Initializing Rug configuration...");

        // Set initial configuration using RugAdminFacet
        RugAdminFacet(address(diamond)).updateCollectionCap(10000); // 10k max supply
        RugAdminFacet(address(diamond)).updateWalletLimit(7); // 7 per wallet

        // Set pricing (all test values for now)
        uint256[6] memory mintPrices = [
            TEST_ETH, // basePrice
            TEST_ETH, // linePrice1
            TEST_ETH, // linePrice2
            TEST_ETH, // linePrice3
            TEST_ETH, // linePrice4
            TEST_ETH  // linePrice5
        ];
        RugAdminFacet(address(diamond)).updateMintPricing(mintPrices);

        // Set service pricing
        uint256[4] memory servicePrices = [
            TEST_ETH, // cleaningCost
            TEST_ETH, // restorationCost
            TEST_ETH, // masterRestorationCost
            TEST_ETH  // launderingThreshold
        ];
        RugAdminFacet(address(diamond)).updateServicePricing(servicePrices);

        // Set aging thresholds (in days, converted to seconds)
        uint256[6] memory agingThresholds = [
            uint256(3),  // dirtLevel1Days
            uint256(7),  // dirtLevel2Days
            uint256(30), // textureLevel1Days
            uint256(90), // textureLevel2Days (supports 10 levels total)
            uint256(7),  // freeCleanWindow (days)
            uint256(3)   // freeCleanWindow (days) - duplicate for now
        ];
        RugAdminFacet(address(diamond)).updateAgingThresholds(agingThresholds);

        // Configure royalties (5% to deployer for testing)
        address[] memory royaltyRecipients = new address[](1);
        royaltyRecipients[0] = deployer;
        uint256[] memory royaltySplits = new uint256[](1);
        royaltySplits[0] = 500; // 5% in basis points
        RugCommerceFacet(payable(address(diamond))).configureRoyalties(500, royaltyRecipients, royaltySplits);

        // Step 6: Verification
        console.log("Step 6: Verifying deployment...");

        // Test basic functionality
        (uint256 collectionCap, uint256 walletLimit,,) = RugAdminFacet(address(diamond)).getConfig();
        (uint256 royaltyPercent,,) = RugCommerceFacet(payable(address(diamond))).getRoyaltyConfig();

        console.log("Collection cap:", collectionCap);
        console.log("Wallet limit:", walletLimit);
        console.log("Royalty percentage:", royaltyPercent, "basis points");

        require(collectionCap == 10000, "Collection cap not set correctly");
        require(walletLimit == 7, "Wallet limit not set correctly");
        require(royaltyPercent == 500, "Royalty percentage not set correctly");

        console.log("Diamond deployment completed successfully!");
        console.log("Diamond address:", address(diamond));
        console.log("All facets added and configured with test values");

        vm.stopBroadcast();
    }

    /**
     * @notice Create a facet cut struct
     */
    function _createFacetCut(address facetAddress, bytes4[] memory selectors)
        internal
        pure
        returns (IDiamondCut.FacetCut memory)
    {
        return IDiamondCut.FacetCut({
            facetAddress: facetAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });
    }

    /**
     * @notice Generate function selectors for a facet by name
     * @dev This is a simplified version - in production you'd use proper selector generation
     */
    function _generateSelectors(string memory facetName) internal pure returns (bytes4[] memory) {
        if (keccak256(abi.encodePacked(facetName)) == keccak256(abi.encodePacked("DiamondLoupeFacet"))) {
            return _getDiamondLoupeSelectors();
        } else if (keccak256(abi.encodePacked(facetName)) == keccak256(abi.encodePacked("RugNFTFacet"))) {
            return _getRugNFTSelectors();
        } else if (keccak256(abi.encodePacked(facetName)) == keccak256(abi.encodePacked("RugAdminFacet"))) {
            return _getRugAdminSelectors();
        } else if (keccak256(abi.encodePacked(facetName)) == keccak256(abi.encodePacked("RugAgingFacet"))) {
            return _getRugAgingSelectors();
        } else if (keccak256(abi.encodePacked(facetName)) == keccak256(abi.encodePacked("RugMaintenanceFacet"))) {
            return _getRugMaintenanceSelectors();
        } else if (keccak256(abi.encodePacked(facetName)) == keccak256(abi.encodePacked("RugCommerceFacet"))) {
            return _getRugCommerceSelectors();
        } else if (keccak256(abi.encodePacked(facetName)) == keccak256(abi.encodePacked("RugLaunderingFacet"))) {
            return _getRugLaunderingSelectors();
        }
        revert("Unknown facet name");
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
        bytes4[] memory selectors = new bytes4[](13);
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
        return selectors;
    }

    function _getRugAdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](15);
        selectors[0] = RugAdminFacet.updateCollectionCap.selector;
        selectors[1] = RugAdminFacet.updateWalletLimit.selector;
        selectors[2] = RugAdminFacet.updateMintPricing.selector;
        selectors[3] = RugAdminFacet.updateServicePricing.selector;
        selectors[4] = RugAdminFacet.updateAgingThresholds.selector;
        selectors[5] = RugAdminFacet.addToExceptionList.selector;
        selectors[6] = RugAdminFacet.removeFromExceptionList.selector;
        selectors[7] = RugAdminFacet.setLaunderingEnabled.selector;
        selectors[8] = RugAdminFacet.setLaunchStatus.selector;
        selectors[9] = RugAdminFacet.getConfig.selector;
        selectors[10] = RugAdminFacet.getMintPricing.selector;
        selectors[11] = RugAdminFacet.getServicePricing.selector;
        selectors[12] = RugAdminFacet.getAgingThresholds.selector;
        selectors[13] = RugAdminFacet.getExceptionList.selector;
        selectors[14] = RugAdminFacet.isConfigured.selector;
        return selectors;
    }

    function _getRugAgingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](10);
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
        return selectors;
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](9);
        selectors[0] = RugMaintenanceFacet.cleanRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreRug.selector;
        selectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[6] = RugMaintenanceFacet.canCleanRug.selector;
        selectors[7] = RugMaintenanceFacet.canRestoreRug.selector;
        selectors[8] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        return selectors;
    }

    function _getRugCommerceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = RugCommerceFacet.withdraw.selector;
        selectors[1] = RugCommerceFacet.withdrawTo.selector;
        selectors[2] = RugCommerceFacet.configureRoyalties.selector;
        selectors[3] = RugCommerceFacet.royaltyInfo.selector;
        selectors[4] = RugCommerceFacet.distributeRoyalties.selector;
        selectors[5] = RugCommerceFacet.getBalance.selector;
        selectors[6] = RugCommerceFacet.getRoyaltyConfig.selector;
        selectors[7] = RugCommerceFacet.calculateRoyalty.selector;
        selectors[8] = RugCommerceFacet.getRoyaltyRecipients.selector;
        selectors[9] = RugCommerceFacet.areRoyaltiesConfigured.selector;
        return selectors;
    }

    function _getRugLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
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
