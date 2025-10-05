// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/diamond/Diamond.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title Update RugAdminFacet Script
 * @dev Updates the RugAdminFacet with fixed aging thresholds
 */
contract UpdateRugAdminFacet is Script {
    // Main diamond contract
    address public diamondAddr = 0xbFcf06FA1fEBCc8e990a5E5e5681e96a7B422724;

    // Diamond contracts
    RugAdminFacet public rugAdminFacet;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        console.log("=========================================");
        console.log("Updating RugAdminFacet with Fixed Aging Thresholds");
        console.log("=========================================");

        // Deploy new RugAdminFacet
        rugAdminFacet = new RugAdminFacet();
        console.log("New RugAdminFacet deployed at:", address(rugAdminFacet));

        // Replace the RugAdminFacet in the diamond
        IDiamondCut.FacetCut[] memory adminCut = new IDiamondCut.FacetCut[](1);
        adminCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAdminFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: getRugAdminSelectors()
        });

        IDiamondCut(diamondAddr).diamondCut(adminCut, address(0), "");
        console.log("RugAdminFacet updated successfully");

        // Set correct aging thresholds (in days)
        uint256[5] memory agingThresholds = [
            uint256(1),      // dirtLevel1Days: 1 day
            uint256(3),      // dirtLevel2Days: 3 days
            uint256(7),      // agingAdvanceDays: 7 days between levels
            uint256(14),     // freeCleanDays: 14 days after mint
            uint256(5)       // freeCleanWindow: 5 days after cleaning
        ];

        RugAdminFacet(diamondAddr).updateAgingThresholds(agingThresholds);
        console.log("Aging thresholds updated to proper values");

        console.log("=========================================");
        console.log("Update Complete!");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function getRugAdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](16);
        selectors[0] = RugAdminFacet.updateMintPricing.selector;
        selectors[1] = RugAdminFacet.updateCollectionCap.selector;
        selectors[2] = RugAdminFacet.updateWalletLimit.selector;
        selectors[3] = RugAdminFacet.updateAgingThresholds.selector;
        selectors[4] = RugAdminFacet.getAgingThresholds.selector;
        selectors[5] = RugAdminFacet.setLaunderingEnabled.selector;
        selectors[6] = RugAdminFacet.setLaunchStatus.selector;
        selectors[7] = RugAdminFacet.getMintPricing.selector;
        selectors[8] = RugAdminFacet.getConfig.selector;
        selectors[9] = RugAdminFacet.setScriptyContracts.selector;
        selectors[10] = RugAdminFacet.addToExceptionList.selector;
        selectors[11] = RugAdminFacet.removeFromExceptionList.selector;
        selectors[12] = RugAdminFacet.getExceptionList.selector;
        selectors[13] = RugAdminFacet.getServicePricing.selector;
        selectors[14] = RugAdminFacet.updateServicePricing.selector;
        selectors[15] = RugAdminFacet.isConfigured.selector;
        return selectors;
    }
}