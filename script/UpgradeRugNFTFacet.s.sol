// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

contract UpgradeRugNFTFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Starting RugNFTFacet upgrade...");

        // Deploy new NFT facet
        RugNFTFacet newNftFacet = new RugNFTFacet();
        address nftFacetAddr = address(newNftFacet);
        console.log("New RugNFTFacet deployed at:", nftFacetAddr);

        // Prepare facet cut for replacement
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        // NFT facet replacement
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: nftFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugNFTSelectors()
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("RugNFTFacet upgraded successfully");

        vm.stopBroadcast();
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
        selectors[15] = RugNFTFacet.getRugData.selector;
        selectors[16] = RugNFTFacet.getAgingData.selector;
        selectors[17] = RugNFTFacet.initializeERC721Metadata.selector;

        return selectors;
    }
}
