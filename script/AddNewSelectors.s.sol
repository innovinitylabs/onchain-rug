// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugAgingFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugCommerceFacet.sol";

/**
 * @title AddNewSelectors
 * @notice Add the new function selectors to existing facets
 */
contract AddNewSelectors is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== ADDING NEW SELECTORS TO EXISTING FACETS ===");
        console.log("Diamond:", DIAMOND);

        // Find current facet addresses by checking existing functions
        address agingFacet = getFacetAddress(RugAgingFacet.getDirtLevel.selector);
        address maintenanceFacet = getFacetAddress(RugMaintenanceFacet.cleanRug.selector);
        address commerceFacet = getFacetAddress(RugCommerceFacet.withdraw.selector);

        console.log("Current facet addresses:");
        console.log("  RugAgingFacet:", agingFacet);
        console.log("  RugMaintenanceFacet:", maintenanceFacet);
        console.log("  RugCommerceFacet:", commerceFacet);

        // Add getFrameStatus to RugAgingFacet
        if (agingFacet != address(0)) {
            IDiamondCut.FacetCut[] memory agingCut = new IDiamondCut.FacetCut[](1);
            agingCut[0] = IDiamondCut.FacetCut({
                facetAddress: agingFacet,
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: new bytes4[](1)
            });
            agingCut[0].functionSelectors[0] = RugAgingFacet.getFrameStatus.selector;
            IDiamondCut(DIAMOND).diamondCut(agingCut, address(0), "");
            console.log("Added getFrameStatus to RugAgingFacet");
        }

        // Add getMaintenanceHistory to RugMaintenanceFacet
        if (maintenanceFacet != address(0)) {
            IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
            maintenanceCut[0] = IDiamondCut.FacetCut({
                facetAddress: maintenanceFacet,
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: new bytes4[](1)
            });
            maintenanceCut[0].functionSelectors[0] = RugMaintenanceFacet.getMaintenanceHistory.selector;
            IDiamondCut(DIAMOND).diamondCut(maintenanceCut, address(0), "");
            console.log("Added getMaintenanceHistory to RugMaintenanceFacet");
        }

        // Add getSaleHistory to RugCommerceFacet
        if (commerceFacet != address(0)) {
            IDiamondCut.FacetCut[] memory commerceCut = new IDiamondCut.FacetCut[](1);
            commerceCut[0] = IDiamondCut.FacetCut({
                facetAddress: commerceFacet,
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: new bytes4[](1)
            });
            commerceCut[0].functionSelectors[0] = RugCommerceFacet.getSaleHistory.selector;
            IDiamondCut(DIAMOND).diamondCut(commerceCut, address(0), "");
            console.log("Added getSaleHistory to RugCommerceFacet");
        }

        console.log("All missing function selectors have been added!");
        console.log("Functions should now be accessible through the diamond.");

        vm.stopBroadcast();
    }

    function getFacetAddress(bytes4 selector) internal view returns (address) {
        // Use the DiamondLoupe interface to get facet address
        (bool success, bytes memory data) = DIAMOND.staticcall(
            abi.encodeWithSignature("facetAddress(bytes4)", selector)
        );
        if (success && data.length == 32) {
            return abi.decode(data, (address));
        }
        return address(0);
    }
}
