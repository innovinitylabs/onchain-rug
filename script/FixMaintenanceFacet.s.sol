// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @dev Updates RugMaintenanceFacet with restorable wear system
 * - Fixes texture restoration to always reduce level by 1
 * - Implements restorable wear (can fully restore rugs)
 * - Uses lastTextureReset for accurate progression timing
 */
contract FixMaintenanceFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address diamondAddr = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

        // Deploy new RugMaintenanceFacet with fixed frame level access
        RugMaintenanceFacet newRugMaintenanceFacet = new RugMaintenanceFacet();
        address newMaintenanceAddr = address(newRugMaintenanceFacet);
        console.log("New RugMaintenanceFacet deployed at:", newMaintenanceAddr);

        // Replace RugMaintenanceFacet (includes fixed frame level access)
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: newMaintenanceAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugMaintenanceFacetSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(maintenanceCut, address(0), "");

        console.log("RugMaintenanceFacet updated with restorable wear system!");

        vm.stopBroadcast();
    }

    function _getRugMaintenanceFacetSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](10);
        selectors[0] = RugMaintenanceFacet.cleanRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreRug.selector;
        selectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[6] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        selectors[7] = RugMaintenanceFacet.canCleanRug.selector;
        selectors[8] = RugMaintenanceFacet.canRestoreRug.selector;
        selectors[9] = RugMaintenanceFacet.needsMasterRestoration.selector;
    }
}
