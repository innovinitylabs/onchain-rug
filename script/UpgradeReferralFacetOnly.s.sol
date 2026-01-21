// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugReferralRegistryFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract UpgradeReferralFacetOnly is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Upgrading referral facet at:", diamondAddr);

        // Deploy new referral facet
        RugReferralRegistryFacet rugReferralRegistryFacet = new RugReferralRegistryFacet();
        console.log("New RugReferralRegistryFacet deployed at:", address(rugReferralRegistryFacet));

        // Replace the referral facet with cleaned up version
        IDiamondCut.FacetCut[] memory referralCut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory selectors = new bytes4[](15);

        // Referral facet function selectors (15 total)
        selectors[0] = RugReferralRegistryFacet.registerReferralCode.selector;
        selectors[1] = RugReferralRegistryFacet.registerForReferrals.selector;
        selectors[2] = RugReferralRegistryFacet.isRegistered.selector;
        selectors[3] = RugReferralRegistryFacet.getReferralCode.selector;
        selectors[4] = RugReferralRegistryFacet.generateShortCode.selector;
        selectors[5] = RugReferralRegistryFacet.calculateMintReferralReward.selector;
        selectors[6] = RugReferralRegistryFacet.calculateMarketplaceReferralReward.selector;
        selectors[7] = RugReferralRegistryFacet.recordReferral.selector;
        selectors[8] = RugReferralRegistryFacet.extractReferrerFromCodes.selector;
        selectors[9] = RugReferralRegistryFacet.setReferralSystemEnabled.selector;
        selectors[10] = RugReferralRegistryFacet.setReferralPercentages.selector;
        selectors[11] = RugReferralRegistryFacet.setCodeLengthLimits.selector;
        selectors[12] = RugReferralRegistryFacet.getReferralStats.selector;
        selectors[13] = RugReferralRegistryFacet.getReferralConfig.selector;
        selectors[14] = RugReferralRegistryFacet.getReferrerFromCode.selector;

        referralCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugReferralRegistryFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(diamondAddr).diamondCut(referralCut, address(0), "");
        console.log("Referral facet upgraded successfully!");

        vm.stopBroadcast();
    }
}