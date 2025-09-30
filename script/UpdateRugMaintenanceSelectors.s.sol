// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @dev Updates RugMaintenanceFacet selectors to include all 10 functions
 */
contract UpdateRugMaintenanceSelectors is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address diamondAddr = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

        // Get the current RugMaintenanceFacet address from the diamond
        // For now, we'll use the address from the latest deployment
        address maintenanceFacetAddr = 0xD18073114c88D206762c08B6B2C666E723b0F8e9;

        // Add the missing 3 RugMaintenanceFacet selectors
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: maintenanceFacetAddr,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getMissingRugMaintenanceSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(maintenanceCut, address(0), "");

        console.log("Added missing RugMaintenanceFacet selectors: canCleanRug, canRestoreRug, needsMasterRestoration");

        vm.stopBroadcast();
    }

    function _getMissingRugMaintenanceSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](3);
        selectors[0] = RugMaintenanceFacet.canCleanRug.selector;          // 0x89d929be
        selectors[1] = RugMaintenanceFacet.canRestoreRug.selector;        // 0xf4fbfba0
        selectors[2] = RugMaintenanceFacet.needsMasterRestoration.selector; // 0x6c3075f2
        return selectors;
    }
}
