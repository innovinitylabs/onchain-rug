// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugAgingFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugCommerceFacet.sol";

/**
 * @title UpdateFacetsWithMissingFunctions
 * @notice Redeploy facets with the missing functions that were "moved" but not actually implemented
 */
contract UpdateFacetsWithMissingFunctions is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== UPDATING FACETS WITH MISSING FUNCTIONS ===");
        console.log("Diamond:", DIAMOND);

        // Deploy updated RugAgingFacet with getFrameStatus
        RugAgingFacet newRugAgingFacet = new RugAgingFacet();
        address agingFacetAddress = address(newRugAgingFacet);

        // Deploy updated RugMaintenanceFacet with getMaintenanceHistory
        RugMaintenanceFacet newRugMaintenanceFacet = new RugMaintenanceFacet();
        address maintenanceFacetAddress = address(newRugMaintenanceFacet);

        // Deploy updated RugCommerceFacet with getSaleHistory
        RugCommerceFacet newRugCommerceFacet = new RugCommerceFacet();
        address commerceFacetAddress = address(newRugCommerceFacet);

        console.log("Deployed updated facets:");
        console.log("  RugAgingFacet:", agingFacetAddress);
        console.log("  RugMaintenanceFacet:", maintenanceFacetAddress);
        console.log("  RugCommerceFacet:", commerceFacetAddress);

        // Update RugAgingFacet selectors
        bytes4[] memory agingSelectors = new bytes4[](11);
        agingSelectors[0] = RugAgingFacet.getDirtLevel.selector;
        agingSelectors[1] = RugAgingFacet.getAgingLevel.selector;
        agingSelectors[2] = RugAgingFacet.getFrameLevel.selector;
        agingSelectors[3] = RugAgingFacet.getFrameName.selector;
        agingSelectors[4] = RugAgingFacet.getMaintenanceScore.selector;
        agingSelectors[5] = RugAgingFacet.hasDirt.selector;
        agingSelectors[6] = RugAgingFacet.isCleaningFree.selector;
        agingSelectors[7] = RugAgingFacet.timeUntilNextAging.selector;
        agingSelectors[8] = RugAgingFacet.timeUntilNextDirt.selector;
        agingSelectors[9] = RugAgingFacet.getAgingState.selector;
        agingSelectors[10] = RugAgingFacet.getFrameStatus.selector; // Added

        IDiamondCut.FacetCut[] memory agingCut = new IDiamondCut.FacetCut[](1);
        agingCut[0] = IDiamondCut.FacetCut({
            facetAddress: agingFacetAddress,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: agingSelectors
        });

        // Update RugMaintenanceFacet selectors
        bytes4[] memory maintenanceSelectors = new bytes4[](11);
        maintenanceSelectors[0] = RugMaintenanceFacet.cleanRug.selector;
        maintenanceSelectors[1] = RugMaintenanceFacet.restoreRug.selector;
        maintenanceSelectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        maintenanceSelectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        maintenanceSelectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        maintenanceSelectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        maintenanceSelectors[6] = RugMaintenanceFacet.canCleanRug.selector;
        maintenanceSelectors[7] = RugMaintenanceFacet.canRestoreRug.selector;
        maintenanceSelectors[8] = RugMaintenanceFacet.needsMasterRestoration.selector;
        maintenanceSelectors[9] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        maintenanceSelectors[10] = RugMaintenanceFacet.getMaintenanceHistory.selector; // Added

        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: maintenanceFacetAddress,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: maintenanceSelectors
        });

        // Update RugCommerceFacet selectors
        bytes4[] memory commerceSelectors = new bytes4[](19);
        commerceSelectors[0] = RugCommerceFacet.withdraw.selector;
        commerceSelectors[1] = RugCommerceFacet.withdrawTo.selector;
        commerceSelectors[2] = RugCommerceFacet.configureRoyalties.selector;
        commerceSelectors[3] = RugCommerceFacet.royaltyInfo.selector;
        commerceSelectors[4] = RugCommerceFacet.distributeRoyalties.selector;
        commerceSelectors[5] = RugCommerceFacet.getBalance.selector;
        commerceSelectors[6] = RugCommerceFacet.getRoyaltyConfig.selector;
        commerceSelectors[7] = RugCommerceFacet.calculateRoyalty.selector;
        commerceSelectors[8] = RugCommerceFacet.getRoyaltyRecipients.selector;
        commerceSelectors[9] = RugCommerceFacet.areRoyaltiesConfigured.selector;
        commerceSelectors[10] = RugCommerceFacet.setCollectionPricingBounds.selector;
        commerceSelectors[11] = RugCommerceFacet.setTokenPricingBounds.selector;
        commerceSelectors[12] = RugCommerceFacet.setApprovedPaymentCoin.selector;
        commerceSelectors[13] = RugCommerceFacet.getCollectionPricingBounds.selector;
        commerceSelectors[14] = RugCommerceFacet.getTokenPricingBounds.selector;
        commerceSelectors[15] = RugCommerceFacet.isCollectionPricingImmutable.selector;
        commerceSelectors[16] = RugCommerceFacet.isTokenPricingImmutable.selector;
        commerceSelectors[17] = RugCommerceFacet.getApprovedPaymentCoin.selector;
        commerceSelectors[18] = RugCommerceFacet.getSaleHistory.selector; // Added

        IDiamondCut.FacetCut[] memory commerceCut = new IDiamondCut.FacetCut[](1);
        commerceCut[0] = IDiamondCut.FacetCut({
            facetAddress: commerceFacetAddress,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: commerceSelectors
        });

        // Execute all facet updates
        IDiamondCut.FacetCut[] memory allCuts = new IDiamondCut.FacetCut[](3);
        allCuts[0] = agingCut[0];
        allCuts[1] = maintenanceCut[0];
        allCuts[2] = commerceCut[0];

        IDiamondCut(DIAMOND).diamondCut(allCuts, address(0), "");

        console.log("All facets updated successfully!");
        console.log("Missing functions now accessible:");
        console.log("  - getFrameStatus(tokenId)");
        console.log("  - getMaintenanceHistory(tokenId)");
        console.log("  - getSaleHistory(tokenId)");

        vm.stopBroadcast();
    }
}
