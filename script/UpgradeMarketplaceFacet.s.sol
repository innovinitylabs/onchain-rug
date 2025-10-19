// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugMarketplaceFacet.sol";

contract UpgradeMarketplaceFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new marketplace facet
        RugMarketplaceFacet newMarketplaceFacet = new RugMarketplaceFacet();
        address marketplaceFacetAddr = address(newMarketplaceFacet);

        console.log("New RugMarketplaceFacet deployed at:", marketplaceFacetAddr);

        // Prepare facet cut for replacement
        IDiamondCut.FacetCut[] memory marketplaceCut = new IDiamondCut.FacetCut[](1);
        marketplaceCut[0] = IDiamondCut.FacetCut({
            facetAddress: marketplaceFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugMarketplaceSelectors()
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(marketplaceCut, address(0), "");

        console.log("RugMarketplaceFacet upgraded successfully");

        vm.stopBroadcast();
    }

    function _getRugMarketplaceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](29);

        // Direct Listings
        selectors[0] = RugMarketplaceFacet.createListing.selector;
        selectors[1] = RugMarketplaceFacet.cancelListing.selector;
        selectors[2] = RugMarketplaceFacet.updateListingPrice.selector;
        selectors[3] = RugMarketplaceFacet.buyListing.selector;
        selectors[4] = RugMarketplaceFacet.bulkCreateListings.selector;

        // Auctions
        selectors[5] = RugMarketplaceFacet.createAuction.selector;
        selectors[6] = RugMarketplaceFacet.placeBid.selector;
        selectors[7] = RugMarketplaceFacet.finalizeAuction.selector;
        selectors[8] = RugMarketplaceFacet.cancelAuction.selector;

        // Offers
        selectors[9] = RugMarketplaceFacet.makeOffer.selector;
        selectors[10] = RugMarketplaceFacet.makeCollectionOffer.selector;
        selectors[11] = RugMarketplaceFacet.acceptOffer.selector;
        selectors[12] = RugMarketplaceFacet.cancelOffer.selector;

        // Bundles
        selectors[13] = RugMarketplaceFacet.createBundle.selector;
        selectors[14] = RugMarketplaceFacet.buyBundle.selector;
        selectors[15] = RugMarketplaceFacet.cancelBundle.selector;

        // Admin functions
        selectors[16] = RugMarketplaceFacet.setMarketplaceFee.selector;
        selectors[17] = RugMarketplaceFacet.setMaxAuctionDuration.selector;
        selectors[18] = RugMarketplaceFacet.setMinBidIncrement.selector;
        selectors[19] = RugMarketplaceFacet.withdrawMarketplaceFees.selector;
        selectors[20] = RugMarketplaceFacet.initializeMarketplace.selector;

        // View functions
        selectors[21] = RugMarketplaceFacet.getListing.selector;
        selectors[22] = RugMarketplaceFacet.getAuction.selector;
        selectors[23] = RugMarketplaceFacet.getOffer.selector;
        selectors[24] = RugMarketplaceFacet.getTokenOffers.selector;
        selectors[25] = RugMarketplaceFacet.getCollectionOffers.selector;
        selectors[26] = RugMarketplaceFacet.getBundle.selector;
        selectors[27] = RugMarketplaceFacet.getMarketplaceStats.selector;
        selectors[28] = RugMarketplaceFacet.getMarketplaceConfig.selector;

        return selectors;
    }
}
