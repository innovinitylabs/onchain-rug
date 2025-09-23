// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/Diamond.sol";
import "../src/diamond/facets/DiamondCutFacet.sol";
import "../src/diamond/facets/DiamondLoupeFacet.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/facets/RugAgingFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugCommerceFacet.sol";
import "../src/facets/RugLaunderingFacet.sol";
import "../src/libraries/LibRugStorage.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title Simple Local Diamond Deployment Script
 * @dev Deploys diamond system locally, uses existing Scripty contracts
 */
contract SimpleDeployLocal is Script {
    // Main diamond contract (public for test access)
    Diamond public diamond;

    // Diamond contracts
    DiamondCutFacet public diamondCutFacet;
    DiamondLoupeFacet public diamondLoupeFacet;
    RugNFTFacet public rugNFTFacet;
    RugAdminFacet public rugAdminFacet;
    RugAgingFacet public rugAgingFacet;
    RugMaintenanceFacet public rugMaintenanceFacet;
    RugCommerceFacet public rugCommerceFacet;
    RugLaunderingFacet public rugLaunderingFacet;

    // Deployment addresses
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Starting local diamond deployment...");
        console.log("Using existing Scripty contracts from testnet");

        // Deploy diamond system
        deployDiamondSystem(deployerPrivateKey);

        // Configure with existing Scripty contracts
        configureDiamondWithScripty(deployerPrivateKey);

        console.log("\nDiamond deployment completed!");
        console.log("Diamond Address:", diamondAddr);

        // Display testing commands
        console.log("\nTesting commands:");
        console.log("cast call", diamondAddr, "'getMintPrice(uint256)' 2 --rpc-url http://127.0.0.1:8545");
        console.log("cast send", diamondAddr, "'mintRug(string[],uint256,string,string,string,string,uint8,uint8,uint256,uint256)' '[\"Test\"]' 123 'palette' 'minified' 'stripes' 'chars' 1 1 10 5 --value 0.00003ether --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    }

    function deployDiamondSystem(uint256 deployerPrivateKey) internal {
        vm.startBroadcast(deployerPrivateKey);

        // Deploy facets
        diamondCutFacet = new DiamondCutFacet();
        diamondLoupeFacet = new DiamondLoupeFacet();
        rugNFTFacet = new RugNFTFacet();
        rugAdminFacet = new RugAdminFacet();
        rugAgingFacet = new RugAgingFacet();
        rugMaintenanceFacet = new RugMaintenanceFacet();
        rugCommerceFacet = new RugCommerceFacet();
        rugLaunderingFacet = new RugLaunderingFacet();

        // Deploy diamond
        diamond = new Diamond(vm.addr(deployerPrivateKey), address(diamondCutFacet));
        diamondAddr = address(diamond);

        vm.stopBroadcast();

        // Add facets to diamond - ONE BY ONE
        vm.startBroadcast(deployerPrivateKey);

        // DiamondLoupeFacet
        bytes4[] memory loupeSelectors = new bytes4[](4);
        loupeSelectors[0] = DiamondLoupeFacet.facets.selector;
        loupeSelectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        loupeSelectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        loupeSelectors[3] = DiamondLoupeFacet.supportsInterface.selector;
        IDiamondCut.FacetCut[] memory loupeCut = new IDiamondCut.FacetCut[](1);
        loupeCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: loupeSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(loupeCut, address(0), "");

        // RugNFTFacet
        bytes4[] memory nftSelectors = new bytes4[](12);
        nftSelectors[0] = RugNFTFacet.mintRug.selector;
        nftSelectors[1] = RugNFTFacet.burn.selector;
        nftSelectors[2] = RugNFTFacet.getRugData.selector;
        nftSelectors[3] = RugNFTFacet.getAgingData.selector;
        nftSelectors[4] = RugNFTFacet.totalSupply.selector;
        nftSelectors[5] = RugNFTFacet.maxSupply.selector;
        nftSelectors[6] = RugNFTFacet.isTextAvailable.selector;
        nftSelectors[7] = RugNFTFacet.getMintPrice.selector;
        nftSelectors[8] = RugNFTFacet.canMint.selector;
        nftSelectors[9] = RugNFTFacet.walletMints.selector;
        nftSelectors[10] = RugNFTFacet.isWalletException.selector;
        nftSelectors[11] = RugNFTFacet.tokenURI.selector;
        IDiamondCut.FacetCut[] memory nftCut = new IDiamondCut.FacetCut[](1);
        nftCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: nftSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(nftCut, address(0), "");

        // RugAdminFacet
        bytes4[] memory adminSelectors = new bytes4[](16);
        adminSelectors[0] = RugAdminFacet.updateCollectionCap.selector;
        adminSelectors[1] = RugAdminFacet.updateWalletLimit.selector;
        adminSelectors[2] = RugAdminFacet.updateMintPricing.selector;
        adminSelectors[3] = RugAdminFacet.updateServicePricing.selector;
        adminSelectors[4] = RugAdminFacet.updateAgingThresholds.selector;
        adminSelectors[5] = RugAdminFacet.addToExceptionList.selector;
        adminSelectors[6] = RugAdminFacet.removeFromExceptionList.selector;
        adminSelectors[7] = RugAdminFacet.setLaunderingEnabled.selector;
        adminSelectors[8] = RugAdminFacet.setLaunchStatus.selector;
        adminSelectors[9] = RugAdminFacet.setScriptyContracts.selector;
        adminSelectors[10] = RugAdminFacet.getConfig.selector;
        adminSelectors[11] = RugAdminFacet.getMintPricing.selector;
        adminSelectors[12] = RugAdminFacet.getServicePricing.selector;
        adminSelectors[13] = RugAdminFacet.getAgingThresholds.selector;
        adminSelectors[14] = RugAdminFacet.getExceptionList.selector;
        adminSelectors[15] = RugAdminFacet.isConfigured.selector;
        IDiamondCut.FacetCut[] memory adminCut = new IDiamondCut.FacetCut[](1);
        adminCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAdminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: adminSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(adminCut, address(0), "");

        // RugAgingFacet
        bytes4[] memory agingSelectors = new bytes4[](3);
        agingSelectors[0] = RugAgingFacet.getAgingState.selector;
        agingSelectors[1] = RugAgingFacet.getDirtLevel.selector;
        agingSelectors[2] = RugAgingFacet.getTextureLevel.selector;
        IDiamondCut.FacetCut[] memory agingCut = new IDiamondCut.FacetCut[](1);
        agingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAgingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: agingSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(agingCut, address(0), "");

        // RugMaintenanceFacet
        bytes4[] memory maintenanceSelectors = new bytes4[](9);
        maintenanceSelectors[0] = RugMaintenanceFacet.cleanRug.selector;
        maintenanceSelectors[1] = RugMaintenanceFacet.restoreRug.selector;
        maintenanceSelectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        maintenanceSelectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        maintenanceSelectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        maintenanceSelectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        maintenanceSelectors[6] = RugMaintenanceFacet.canCleanRug.selector;
        maintenanceSelectors[7] = RugMaintenanceFacet.canRestoreRug.selector;
        maintenanceSelectors[8] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: maintenanceSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(maintenanceCut, address(0), "");

        // RugCommerceFacet
        bytes4[] memory commerceSelectors = new bytes4[](4);
        commerceSelectors[0] = RugCommerceFacet.withdraw.selector;
        commerceSelectors[1] = RugCommerceFacet.royaltyInfo.selector;
        commerceSelectors[2] = RugCommerceFacet.configureRoyalties.selector;
        commerceSelectors[3] = RugCommerceFacet.getBalance.selector;
        IDiamondCut.FacetCut[] memory commerceCut = new IDiamondCut.FacetCut[](1);
        commerceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugCommerceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: commerceSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(commerceCut, address(0), "");

        // RugLaunderingFacet
        bytes4[] memory launderingSelectors = new bytes4[](9);
        launderingSelectors[0] = RugLaunderingFacet.recordSale.selector;
        launderingSelectors[1] = RugLaunderingFacet.triggerLaundering.selector;
        launderingSelectors[2] = RugLaunderingFacet.updateLaunderingThreshold.selector;
        launderingSelectors[3] = RugLaunderingFacet.wouldTriggerLaundering.selector;
        launderingSelectors[4] = RugLaunderingFacet.getSaleHistory.selector;
        launderingSelectors[5] = RugLaunderingFacet.getMaxRecentSalePrice.selector;
        launderingSelectors[6] = RugLaunderingFacet.getLaunderingConfig.selector;
        launderingSelectors[7] = RugLaunderingFacet.getLaunderingStats.selector;
        IDiamondCut.FacetCut[] memory launderingCut = new IDiamondCut.FacetCut[](1);
        launderingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugLaunderingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: launderingSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(launderingCut, address(0), "");

        vm.stopBroadcast();
    }

    function configureDiamondWithScripty(uint256 deployerPrivateKey) internal {
        vm.startBroadcast(deployerPrivateKey);

        // Configure Scripty contracts (using testnet addresses)
        RugAdminFacet(diamondAddr).setScriptyContracts(
            0x8548f9f9837E055dCa729DC2f6067CC9aC6A0EA8, // ScriptyBuilderV2
            0x8523D1ED6e4a2AC12d25A22F829Ffa50c205D58e, // ScriptyStorageV2
            0x0aB9850E205807c615bA936eA27D020406D78131  // OnchainRugsHTMLGenerator
        );

        // Configure initial parameters for testing
        RugAdminFacet(diamondAddr).updateCollectionCap(10000);
        RugAdminFacet(diamondAddr).updateWalletLimit(7);

        // Set pricing: basePrice = 0.00001, line prices = 0.00001 each
        uint256[6] memory mintPrices = [uint256(0.00001 ether), 0.00001 ether, 0.00001 ether, 0 ether, 0 ether, 0 ether];
        RugAdminFacet(diamondAddr).updateMintPricing(mintPrices);

        // Configure aging thresholds (in seconds for testing)
        uint256[6] memory thresholds = [uint256(300), 600, 1800, 3600, 7200, 14400];
        RugAdminFacet(diamondAddr).updateAgingThresholds(thresholds);

        // Configure service prices
        uint256[4] memory servicePrices = [uint256(0.00001 ether), 0.00005 ether, 0.0001 ether, 0.001 ether];
        RugAdminFacet(diamondAddr).updateServicePricing(servicePrices);

        // Configure royalties (5% to deployer)
        address[] memory royaltyRecipients = new address[](1);
        royaltyRecipients[0] = vm.addr(deployerPrivateKey);
        uint256[] memory royaltySplits = new uint256[](1);
        royaltySplits[0] = 500; // 5% in basis points
        RugCommerceFacet(payable(diamondAddr)).configureRoyalties(500, royaltyRecipients, royaltySplits);

        vm.stopBroadcast();
    }
}
