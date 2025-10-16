// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugAgingFacet.sol";

/**
 * @title FixRugAgingFacet
 * @notice Fix the RugAgingFacet with corrected getFrameStatus
 */
contract FixRugAgingFacet is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== FIXING RUGAGINGFACET ===");
        console.log("Diamond:", DIAMOND);

        // Deploy updated RugAgingFacet
        RugAgingFacet newRugAgingFacet = new RugAgingFacet();
        address facetAddress = address(newRugAgingFacet);

        console.log("Deployed updated RugAgingFacet at:", facetAddress);

        // Update RugAgingFacet selectors
        bytes4[] memory selectors = new bytes4[](11);
        selectors[0] = RugAgingFacet.getDirtLevel.selector;
        selectors[1] = RugAgingFacet.getAgingLevel.selector;
        selectors[2] = RugAgingFacet.getFrameLevel.selector;
        selectors[3] = RugAgingFacet.getFrameName.selector;
        selectors[4] = RugAgingFacet.getMaintenanceScore.selector;
        selectors[5] = RugAgingFacet.hasDirt.selector;
        selectors[6] = RugAgingFacet.isCleaningFree.selector;
        selectors[7] = RugAgingFacet.timeUntilNextAging.selector;
        selectors[8] = RugAgingFacet.timeUntilNextDirt.selector;
        selectors[9] = RugAgingFacet.getAgingState.selector;
        selectors[10] = RugAgingFacet.getFrameStatus.selector; // Fixed

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: facetAddress,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(DIAMOND).diamondCut(cut, address(0), "");

        console.log("RugAgingFacet replaced successfully!");
        console.log("getFrameStatus should now work correctly");

        vm.stopBroadcast();
    }
}
