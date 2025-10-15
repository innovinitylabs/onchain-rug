// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugAgingFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugCommerceFacet.sol";

/**
 * @title AddMissingFunctionSelectors
 * @notice Add the missing function selectors that were "moved" but not actually routed
 */
contract AddMissingFunctionSelectors is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== ADDING MISSING FUNCTION SELECTORS ===");
        console.log("Diamond:", DIAMOND);

        // Add getFrameStatus to RugAgingFacet
        IDiamondCut.FacetCut[] memory agingCut = new IDiamondCut.FacetCut[](1);
        agingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(0), // Use existing facet
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: new bytes4[](1)
        });
        agingCut[0].functionSelectors[0] = RugAgingFacet.getFrameStatus.selector;

        IDiamondCut(DIAMOND).diamondCut(agingCut, address(0), "");

        // Add getMaintenanceHistory to RugMaintenanceFacet
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(0), // Use existing facet
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: new bytes4[](1)
        });
        maintenanceCut[0].functionSelectors[0] = RugMaintenanceFacet.getMaintenanceHistory.selector;

        IDiamondCut(DIAMOND).diamondCut(maintenanceCut, address(0), "");

        // Add getSaleHistory to RugCommerceFacet
        IDiamondCut.FacetCut[] memory commerceCut = new IDiamondCut.FacetCut[](1);
        commerceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(0), // Use existing facet
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: new bytes4[](1)
        });
        commerceCut[0].functionSelectors[0] = RugCommerceFacet.getSaleHistory.selector;

        IDiamondCut(DIAMOND).diamondCut(commerceCut, address(0), "");

        console.log("Added missing function selectors:");
        console.log("  - getFrameStatus (RugAgingFacet)");
        console.log("  - getMaintenanceHistory (RugMaintenanceFacet)");
        console.log("  - getSaleHistory (RugCommerceFacet)");
        console.log("");
        console.log("Functions should now be accessible through the diamond!");

        vm.stopBroadcast();
    }
}
