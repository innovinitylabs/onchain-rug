// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugReferralRegistryFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/libraries/LibDiamond.sol";

/**
 * @title RedeployReferralFacetV2
 * @notice Redeploy RugReferralRegistryFacet with new format (no ref- prefix)
 */
contract RedeployReferralFacetV2 is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address from environment
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Redeploying RugReferralRegistryFacet V2 for diamond at:", diamondAddr);

        // Deploy new referral registry facet (with no ref- prefix)
        RugReferralRegistryFacet newFacet = new RugReferralRegistryFacet();
        console.log("   New RugReferralRegistryFacet deployed at:", address(newFacet));

        // Get all function selectors for the facet
        bytes4[] memory selectors = new bytes4[](18);
        selectors[0] = RugReferralRegistryFacet.registerReferralCode.selector;
        selectors[1] = RugReferralRegistryFacet.getReferrerFromCode.selector;
        selectors[2] = RugReferralRegistryFacet.getCodeFromReferrer.selector;
        selectors[3] = RugReferralRegistryFacet.codeExists.selector;
        selectors[4] = RugReferralRegistryFacet.getReferralStats.selector;
        selectors[5] = RugReferralRegistryFacet.getReferralConfig.selector;
        selectors[6] = RugReferralRegistryFacet.extractReferrerFromCodes.selector;
        selectors[7] = RugReferralRegistryFacet.recordReferral.selector;
        selectors[8] = RugReferralRegistryFacet.calculateMintReferralReward.selector;
        selectors[9] = RugReferralRegistryFacet.calculateMarketplaceReferralReward.selector;
        selectors[10] = RugReferralRegistryFacet.setReferralSystemEnabled.selector;
        selectors[11] = RugReferralRegistryFacet.setReferralPercentages.selector;
        selectors[12] = RugReferralRegistryFacet.setCodeLengthLimits.selector;
        selectors[13] = RugReferralRegistryFacet.initializeReferralSystem.selector;
        selectors[14] = RugReferralRegistryFacet.registerForReferrals.selector;
        selectors[15] = RugReferralRegistryFacet.getReferralCode.selector;
        selectors[16] = RugReferralRegistryFacet.generateShortCode.selector;
        selectors[17] = RugReferralRegistryFacet.isRegistered.selector;

        console.log("Replacing RugReferralRegistryFacet with", selectors.length, "functions");

        // Replace the facet
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(newFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        // Execute the diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("Successfully redeployed RugReferralRegistryFacet V2!");
        console.log("New format: referral codes no longer have 'ref-' prefix");
    }
}