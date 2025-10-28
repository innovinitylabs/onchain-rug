// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";

contract UpgradeMarketplaceFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

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

        // Prepare facet cuts for replacement
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](2);

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

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("RugNFTFacet and RugMarketplaceFacet upgraded successfully");

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
}
