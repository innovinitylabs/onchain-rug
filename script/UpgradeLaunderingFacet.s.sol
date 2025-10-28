// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugLaunderingFacet.sol";

contract UpgradeLaunderingFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Upgrading RugLaunderingFacet with fix...");

        // Deploy new laundering facet with fix
        RugLaunderingFacet newLaunderingFacet = new RugLaunderingFacet();
        address launderingFacetAddr = address(newLaunderingFacet);
        console.log("New RugLaunderingFacet deployed at:", launderingFacetAddr);

        // Prepare facet cut for replacement
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: launderingFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugLaunderingSelectors()
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("RugLaunderingFacet upgraded successfully with fix!");

        vm.stopBroadcast();
    }

    function _getRugLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);

        selectors[0] = RugLaunderingFacet.recordSale.selector;
        selectors[1] = RugLaunderingFacet.triggerLaundering.selector;
        selectors[2] = RugLaunderingFacet.updateLaunderingThreshold.selector;
        selectors[3] = RugLaunderingFacet.wouldTriggerLaundering.selector;
        selectors[4] = RugLaunderingFacet.getLaunderingSaleHistory.selector;
        selectors[5] = RugLaunderingFacet.getMaxRecentSalePrice.selector;
        selectors[6] = RugLaunderingFacet.getLaunderingConfig.selector;
        selectors[7] = RugLaunderingFacet.getLaunderingStats.selector;

        return selectors;
    }
}
