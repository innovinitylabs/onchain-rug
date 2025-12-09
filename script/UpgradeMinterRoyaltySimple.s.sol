// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugCommerceFacet.sol";

contract UpgradeMinterRoyaltySimple is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        address facetAddr = 0xf2880078B087fdeb1ba3a4E24aeC5BB9DF29e392; // Deployed facet

        vm.startBroadcast(deployerPrivateKey);

        console.log("Upgrading diamond at:", diamondAddr);
        console.log("New facet:", facetAddr);

        // Function selectors for RugCommerceFacet (26 total) - using .selector for accuracy
        bytes4[] memory selectors = new bytes4[](26);
        selectors[0] = RugCommerceFacet.royaltyInfo.selector;
        selectors[1] = RugCommerceFacet.distributeRoyalties.selector;
        selectors[2] = RugCommerceFacet.configureRoyalties.selector;
        selectors[3] = RugCommerceFacet.getRoyaltyConfig.selector;
        selectors[4] = RugCommerceFacet.getRoyaltyRecipients.selector;
        selectors[5] = RugCommerceFacet.calculateRoyalty.selector;
        selectors[6] = RugCommerceFacet.areRoyaltiesConfigured.selector;
        selectors[7] = RugCommerceFacet.claimPendingRoyalties.selector;
        selectors[8] = RugCommerceFacet.getPendingRoyalties.selector;
        selectors[9] = RugCommerceFacet.setPoolContract.selector;
        selectors[10] = RugCommerceFacet.setPoolPercentage.selector;
        selectors[11] = RugCommerceFacet.getPoolConfig.selector;
        selectors[12] = RugCommerceFacet.emergencyWithdrawFromPool.selector;
        selectors[13] = RugCommerceFacet.claimPoolRoyalties.selector;
        selectors[14] = RugCommerceFacet.withdraw.selector;
        selectors[15] = RugCommerceFacet.withdrawTo.selector;
        selectors[16] = RugCommerceFacet.getBalance.selector;
        selectors[17] = RugCommerceFacet.setCollectionPricingBounds.selector;
        selectors[18] = RugCommerceFacet.setTokenPricingBounds.selector;
        selectors[19] = RugCommerceFacet.setApprovedPaymentCoin.selector;
        selectors[20] = RugCommerceFacet.getCollectionPricingBounds.selector;
        selectors[21] = RugCommerceFacet.getTokenPricingBounds.selector;
        selectors[22] = RugCommerceFacet.isCollectionPricingImmutable.selector;
        selectors[23] = RugCommerceFacet.isTokenPricingImmutable.selector;
        selectors[24] = RugCommerceFacet.getApprovedPaymentCoin.selector;
        selectors[25] = RugCommerceFacet.getSaleHistory.selector;

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: facetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("Upgrade complete!");

        vm.stopBroadcast();
    }
}

