// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract UpdateRugMaintenanceFacetV3 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address diamondAddr = 0xBd5b888860C857FE82B3442A31A43608b29e8D1f;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new RugMaintenanceFacet
        RugMaintenanceFacet maintenanceFacet = new RugMaintenanceFacet();

        // Diamond cut to replace the facet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);

        // Get all maintenance selectors
        bytes4[] memory selectors = new bytes4[](10);
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

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(maintenanceFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cut, address(0), "");

        vm.stopBroadcast();

        console.log("Updated RugMaintenanceFacet at:", address(maintenanceFacet));
        console.log("Diamond updated successfully");
    }
}
