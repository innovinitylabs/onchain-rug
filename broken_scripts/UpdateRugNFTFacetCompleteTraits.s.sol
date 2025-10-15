// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

/**
 * @title UpdateRugNFTFacetCompleteTraits
 * @notice Add all missing traits to tokenURI to match main branch
 * @dev Includes Aging Level, Maintenance stats, timestamps, etc.
 */
contract UpdateRugNFTFacetCompleteTraits is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy new RugNFTFacet with complete traits
        RugNFTFacet newRugNFTFacet = new RugNFTFacet();
        address newFacetAddress = address(newRugNFTFacet);

        console.log("Deployed new RugNFTFacet at:", newFacetAddress);

        // Replace RugNFTFacet with updated version (Replace action)
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory selectors = new bytes4[](24);

        // ERC721 functions
        selectors[0] = 0x70a08231; // balanceOf
        selectors[1] = 0x6352211e; // ownerOf
        selectors[2] = 0x42842e0e; // safeTransferFrom(address,address,uint256)
        selectors[3] = 0x23b872dd; // transferFrom
        selectors[4] = 0x095ea7b3; // approve
        selectors[5] = 0xa22cb465; // setApprovalForAll
        selectors[6] = 0x081812fc; // getApproved
        selectors[7] = 0xe985e9c5; // isApprovedForAll
        selectors[8] = 0x06fdde03; // name
        selectors[9] = 0x95d89b41; // symbol
        selectors[10] = 0xc87b56dd; // tokenURI
        selectors[11] = 0x18160ddd; // totalSupply
        selectors[12] = 0xb88d4fde; // safeTransferFrom(address,address,uint256,bytes)

        // Rug-specific functions
        selectors[13] = RugNFTFacet.mintRug.selector;
        selectors[14] = RugNFTFacet.burn.selector;
        selectors[15] = RugNFTFacet.getRugData.selector;
        selectors[16] = RugNFTFacet.getAgingData.selector;
        selectors[17] = RugNFTFacet.getMintPrice.selector;
        selectors[18] = RugNFTFacet.canMint.selector;
        selectors[19] = RugNFTFacet.isTextAvailable.selector;
        selectors[20] = RugNFTFacet.maxSupply.selector;
        selectors[21] = RugNFTFacet.walletMints.selector;
        selectors[22] = RugNFTFacet.isWalletException.selector;
        selectors[23] = 0x01ffc9a7; // supportsInterface

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: newFacetAddress,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(DIAMOND).diamondCut(cut, address(0), "");

        console.log("RugNFTFacet replaced successfully!");
        console.log("Added all missing traits to tokenURI:");
        console.log("  - Aging Level");
        console.log("  - Cleaning/Restoration/Master counts");
        console.log("  - Laundering Count");
        console.log("  - Maintenance Score");
        console.log("  - Last Sale Price");
        console.log("  - Mint Time");
        console.log("  - Last Cleaned");
        console.log("New facet:", newFacetAddress);

        vm.stopBroadcast();
    }
}
