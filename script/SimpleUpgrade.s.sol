// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";

contract SimpleUpgrade is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying new facets...");

        // Deploy new facets
        RugNFTFacet newNftFacet = new RugNFTFacet();
        RugMarketplaceFacet newMarketplaceFacet = new RugMarketplaceFacet();

        console.log("RugNFTFacet deployed at:", address(newNftFacet));
        console.log("RugMarketplaceFacet deployed at:", address(newMarketplaceFacet));

        // Prepare facet cuts
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](2);

        // NFT facet replacement
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(newNftFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugNFTSelectors()
        });

        // Marketplace facet replacement with new offer functions
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(newMarketplaceFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugMarketplaceSelectors()
        });

        // Execute diamond cut
        console.log("Executing diamond cut...");
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("Upgrade complete!");

        vm.stopBroadcast();
    }

    function _getRugMarketplaceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](13);
        selectors[0] = RugMarketplaceFacet.createListing.selector;
        selectors[1] = RugMarketplaceFacet.cancelListing.selector;
        selectors[2] = RugMarketplaceFacet.updateListingPrice.selector;
        selectors[3] = RugMarketplaceFacet.buyListing.selector;
        selectors[4] = RugMarketplaceFacet.makeOffer.selector;
        selectors[5] = RugMarketplaceFacet.acceptOffer.selector;
        selectors[6] = RugMarketplaceFacet.cancelOffer.selector;
        selectors[7] = RugMarketplaceFacet.setMarketplaceFee.selector;
        selectors[8] = RugMarketplaceFacet.withdrawFees.selector;
        selectors[9] = RugMarketplaceFacet.getListing.selector;
        selectors[10] = RugMarketplaceFacet.getMarketplaceStats.selector;
        selectors[11] = RugMarketplaceFacet.getOffer.selector;
        selectors[12] = RugMarketplaceFacet.getActiveTokenOffers.selector;
        return selectors;
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](18);
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
        selectors[14] = RugNFTFacet.mintRug.selector;
        selectors[15] = RugNFTFacet.burn.selector;
        selectors[16] = RugNFTFacet.getRugData.selector;
        selectors[17] = RugNFTFacet.getAgingData.selector;
        return selectors;
    }
}

