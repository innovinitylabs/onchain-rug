// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/facets/RugCommerceFacet.sol";

contract UpgradeMarketplaceFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        // Use the deployed contract address from latest deployment
        address diamondAddr = 0x20241d50bd923ADb3B0d1398F62dfcaA39895B33;

        vm.startBroadcast(deployerPrivateKey);

        console.log("Starting facet upgrades...");

        // Deploy new NFT facet
        RugNFTFacet newNftFacet = new RugNFTFacet();
        address nftFacetAddr = address(newNftFacet);
        console.log("New RugNFTFacet deployed at:", nftFacetAddr);

        // Deploy new marketplace facet
        RugMarketplaceFacet newMarketplaceFacet = new RugMarketplaceFacet();
        address marketplaceFacetAddr = address(newMarketplaceFacet);
        console.log("New RugMarketplaceFacet deployed at:", marketplaceFacetAddr);

        // Deploy new commerce facet (includes royalty functions)
        RugCommerceFacet newCommerceFacet = new RugCommerceFacet();
        address commerceFacetAddr = address(newCommerceFacet);
        console.log("New RugCommerceFacet deployed at:", commerceFacetAddr);

        // Prepare facet cuts for replacement
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](3);

        // NFT facet replacement
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: nftFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugNFTSelectors()
        });

        // Marketplace facet replacement
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: marketplaceFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugMarketplaceSelectors()
        });

        // Commerce facet replacement (includes royalty functions)
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: commerceFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugCommerceSelectors()
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("RugNFTFacet, RugMarketplaceFacet, and RugCommerceFacet upgraded successfully");

        vm.stopBroadcast();
    }

    function _getRugMarketplaceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);

        // Listing functions
        selectors[0] = RugMarketplaceFacet.createListing.selector;
        selectors[1] = RugMarketplaceFacet.cancelListing.selector;
        selectors[2] = RugMarketplaceFacet.updateListingPrice.selector;
        selectors[3] = RugMarketplaceFacet.buyListing.selector;

        // Admin functions
        selectors[4] = RugMarketplaceFacet.setMarketplaceFee.selector;
        selectors[5] = RugMarketplaceFacet.withdrawFees.selector;

        // View functions
        selectors[6] = RugMarketplaceFacet.getListing.selector;
        selectors[7] = RugMarketplaceFacet.getMarketplaceStats.selector;

        return selectors;
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](18);

        // ERC721 Standard Functions
        selectors[0] = RugNFTFacet.ownerOf.selector;
        selectors[1] = RugNFTFacet.balanceOf.selector;
        selectors[2] = RugNFTFacet.approve.selector;
        selectors[3] = RugNFTFacet.getApproved.selector;
        selectors[4] = RugNFTFacet.setApprovalForAll.selector;
        selectors[5] = RugNFTFacet.isApprovedForAll.selector;
        selectors[6] = RugNFTFacet.transferFrom.selector;
        selectors[7] = 0x42842e0e; // safeTransferFrom(address,address,uint256)
        selectors[8] = 0xb88d4fde; // safeTransferFrom(address,address,uint256,bytes)
        selectors[9] = RugNFTFacet.name.selector;
        selectors[10] = RugNFTFacet.symbol.selector;
        selectors[11] = RugNFTFacet.tokenURI.selector;
        selectors[12] = RugNFTFacet.totalSupply.selector;
        selectors[13] = RugNFTFacet.supportsInterface.selector;

        // Rug-specific functions
        selectors[14] = RugNFTFacet.mintRug.selector;
        selectors[15] = RugNFTFacet.burn.selector;
        selectors[16] = RugNFTFacet.getRugData.selector;
        selectors[17] = RugNFTFacet.getAgingData.selector;

        return selectors;
    }

    function _getRugCommerceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](19);
        // Original selectors
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
        // Payment Processor integration selectors
        selectors[10] = RugCommerceFacet.setCollectionPricingBounds.selector;
        selectors[11] = RugCommerceFacet.setTokenPricingBounds.selector;
        selectors[12] = RugCommerceFacet.setApprovedPaymentCoin.selector;
        selectors[13] = RugCommerceFacet.getCollectionPricingBounds.selector;
        selectors[14] = RugCommerceFacet.getTokenPricingBounds.selector;
        selectors[15] = RugCommerceFacet.isCollectionPricingImmutable.selector;
        selectors[16] = RugCommerceFacet.isTokenPricingImmutable.selector;
        selectors[17] = RugCommerceFacet.getApprovedPaymentCoin.selector;
        selectors[18] = RugCommerceFacet.getSaleHistory.selector;
        return selectors;
    }
}
