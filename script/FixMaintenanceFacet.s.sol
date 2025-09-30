// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @dev Updates RugMaintenanceFacet with texture restoration timer fix
 * - Fixes texture restoration timer synchronization bug
 * - Ensures lastTextureReset = textureProgressTimer for consistent -1 level reduction
 * - Eliminates unpredictable restoration behavior
 * - Maintains restorable wear system (can fully restore rugs)
 */
contract FixMaintenanceFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address diamondAddr = 0xb39093648309694438E2c3FdF4a8b952C13df070;

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
