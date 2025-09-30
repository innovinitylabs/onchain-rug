// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugMaintenanceFacet.sol";

/**
 * @title Fix Cleaning Mechanics
 * @dev Updates RugMaintenanceFacet to only reset dirt timer during cleaning
 * Texture wear remains permanent until restored
 */
contract FixCleaningMechanics is Script {
    address public constant DIAMOND_ADDR = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Fixing Cleaning Mechanics - Texture wear now permanent");
        console.log("=========================================");

        // Deploy new RugMaintenanceFacet with fixed cleaning logic
        RugMaintenanceFacet newRugMaintenanceFacet = new RugMaintenanceFacet();
        address newFacetAddr = address(newRugMaintenanceFacet);
        console.log("New RugMaintenanceFacet deployed at:", newFacetAddr);

        // Replace the existing RugMaintenanceFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: newFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugMaintenanceSelectors()
        });

        IDiamondCut(DIAMOND_ADDR).diamondCut(cut, address(0), "");
        console.log("RugMaintenanceFacet replaced with fixed cleaning mechanics");

        console.log("=========================================");
        console.log("Cleaning Mechanics Fixed!");
        console.log("- Cleaning only resets dirt (not texture)");
        console.log("- Texture wear is now permanent until restored");
        console.log("- Restoration functions still work as before");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = RugMaintenanceFacet.cleanRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreRug.selector;
        selectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[6] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        return selectors;
    }
}
