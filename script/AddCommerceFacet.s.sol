// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugCommerceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title AddCommerceFacet
 * @notice Emergency script to add RugCommerceFacet to the diamond
 * @dev This allows us to use the withdraw functions
 */
contract AddCommerceFacet is Script {
    // Diamond address
    address constant DIAMOND_ADDRESS = 0xa46228a11e6C79f4f5D25038a3b712EBCB8F3459;

    function run() external {
        vm.startBroadcast();

        // Deploy new RugCommerceFacet
        RugCommerceFacet rugCommerceFacet = new RugCommerceFacet();

        // Create facet cut to add RugCommerceFacet
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = RugCommerceFacet.withdraw.selector;
        selectors[1] = RugCommerceFacet.withdrawTo.selector;
        selectors[2] = RugCommerceFacet.configureRoyalties.selector;
        selectors[3] = RugCommerceFacet.royaltyInfo.selector;
        selectors[4] = RugCommerceFacet.distributeRoyalties.selector;
        selectors[5] = RugCommerceFacet.getBalance.selector;
        selectors[6] = RugCommerceFacet.getRoyaltyConfig.selector;
        selectors[7] = RugCommerceFacet.calculateRoyalty.selector;
        selectors[8] = RugCommerceFacet.getRoyaltyRecipients.selector;
        selectors[9] = RugCommerceFacet.areRoyaltiesConfigured.selector;

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugCommerceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        // Execute diamond cut
        IDiamondCut(DIAMOND_ADDRESS).diamondCut(cuts, address(0), "");

        console.log("RugCommerceFacet added to diamond at:", address(rugCommerceFacet));

        vm.stopBroadcast();
    }
}
