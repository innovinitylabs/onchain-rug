// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/diamond/Diamond.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title Update RugMaintenanceFacet Script
 * @dev Updates the RugMaintenanceFacet with fixed restoration logic
 */
contract UpdateRugMaintenanceFacet is Script {
    // Main diamond contract
    address public diamondAddr = 0xbFcf06FA1fEBCc8e990a5E5e5681e96a7B422724;

    // Diamond contracts
    RugMaintenanceFacet public rugMaintenanceFacet;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        console.log("=========================================");
        console.log("Updating RugMaintenanceFacet with Fixed Restoration Logic");
        console.log("=========================================");

        // Deploy new RugMaintenanceFacet
        rugMaintenanceFacet = new RugMaintenanceFacet();
        console.log("New RugMaintenanceFacet deployed at:", address(rugMaintenanceFacet));

        // Replace the RugMaintenanceFacet in the diamond
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: getRugMaintenanceSelectors()
        });

        IDiamondCut(diamondAddr).diamondCut(maintenanceCut, address(0), "");
        console.log("RugMaintenanceFacet updated successfully");

        console.log("=========================================");
        console.log("Update Complete!");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = bytes4(0x4f44b188); // cleanRug(uint256)
        selectors[1] = bytes4(0x9282303d); // restoreRug(uint256)
        selectors[2] = bytes4(0x0c19faf9); // masterRestoreRug(uint256)
        selectors[3] = bytes4(0x6c174ed8); // getCleaningCost(uint256)
        selectors[4] = bytes4(0x40a9c122); // getRestorationCost(uint256)
        selectors[5] = bytes4(0x234e4777); // getMasterRestorationCost(uint256)
        selectors[6] = bytes4(0x7eeafdbc); // getMaintenanceOptions(uint256)
        selectors[7] = bytes4(0x89d929be); // canCleanRug(uint256)
        selectors[8] = bytes4(0xf4fbfba0); // canRestoreRug(uint256)
        selectors[9] = bytes4(0x6c3075f2); // needsMasterRestoration(uint256)
        return selectors;
    }
}
