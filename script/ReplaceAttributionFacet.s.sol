// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugAttributionRegistryFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract ReplaceAttributionFacet is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Replacing attribution facet at:", diamondAddr);

        // Deploy new attribution facet
        RugAttributionRegistryFacet newFacet = new RugAttributionRegistryFacet();
        console.log("New RugAttributionRegistryFacet deployed at:", address(newFacet));

        // Replace the existing attribution facet
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        bytes4[] memory allSelectors = new bytes4[](15);
        allSelectors[0] = RugAttributionRegistryFacet.registerAttributionCode.selector;
        allSelectors[1] = RugAttributionRegistryFacet.registerForAttribution.selector;
        allSelectors[2] = RugAttributionRegistryFacet.isAttributionRegistered.selector;
        allSelectors[3] = RugAttributionRegistryFacet.getAttributionCode.selector;
        allSelectors[4] = RugAttributionRegistryFacet.generateAttributionCode.selector;
        allSelectors[5] = RugAttributionRegistryFacet.calculateMintAttributionReward.selector;
        allSelectors[6] = RugAttributionRegistryFacet.calculateMarketplaceAttributionReward.selector;
        allSelectors[7] = RugAttributionRegistryFacet.recordAttribution.selector;
        allSelectors[8] = RugAttributionRegistryFacet.extractReferrerFromAttributionCodes.selector;
        allSelectors[9] = RugAttributionRegistryFacet.setAttributionSystemEnabled.selector;
        allSelectors[10] = RugAttributionRegistryFacet.setAttributionPercentages.selector;
        allSelectors[11] = RugAttributionRegistryFacet.setCodeLengthLimits.selector;
        allSelectors[12] = RugAttributionRegistryFacet.getAttributionStats.selector;
        allSelectors[13] = RugAttributionRegistryFacet.getAttributionConfig.selector;
        allSelectors[14] = RugAttributionRegistryFacet.getReferrerFromAttributionCode.selector;

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(newFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: allSelectors
        });

        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");
        console.log("Attribution facet replaced successfully!");

        vm.stopBroadcast();
    }
}