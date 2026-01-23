// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugAttributionRegistryFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract UpgradeReferralFacetOnly is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_ETHEREUM_SEPOLIA_CONTRACT");
        console.log("Upgrading referral facet at:", diamondAddr);

        // Deploy new referral facet
        RugAttributionRegistryFacet rugAttributionRegistryFacet = new RugAttributionRegistryFacet();
        console.log("New RugAttributionRegistryFacet deployed at:", address(rugAttributionRegistryFacet));

        // Replace the referral facet with cleaned up version
        IDiamondCut.FacetCut[] memory referralCut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory selectors = new bytes4[](15);

        // Attribution facet function selectors (15 total)
        selectors[0] = RugAttributionRegistryFacet.registerAttributionCode.selector;
        selectors[1] = RugAttributionRegistryFacet.registerForAttribution.selector;
        selectors[2] = RugAttributionRegistryFacet.isAttributionRegistered.selector;
        selectors[3] = RugAttributionRegistryFacet.getAttributionCode.selector;
        selectors[4] = RugAttributionRegistryFacet.generateAttributionCode.selector;
        selectors[5] = RugAttributionRegistryFacet.calculateMintAttributionReward.selector;
        selectors[6] = RugAttributionRegistryFacet.calculateMarketplaceAttributionReward.selector;
        selectors[7] = RugAttributionRegistryFacet.recordAttribution.selector;
        selectors[8] = RugAttributionRegistryFacet.extractReferrerFromAttributionCodes.selector;
        selectors[9] = RugAttributionRegistryFacet.setAttributionSystemEnabled.selector;
        selectors[10] = RugAttributionRegistryFacet.setAttributionPercentages.selector;
        selectors[11] = RugAttributionRegistryFacet.setCodeLengthLimits.selector;
        selectors[12] = RugAttributionRegistryFacet.getAttributionStats.selector;
        selectors[13] = RugAttributionRegistryFacet.getAttributionConfig.selector;
        selectors[14] = RugAttributionRegistryFacet.getReferrerFromAttributionCode.selector;

        referralCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAttributionRegistryFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        IDiamondCut(diamondAddr).diamondCut(referralCut, address(0), "");
        console.log("Referral facet upgraded successfully!");

        vm.stopBroadcast();
    }
}