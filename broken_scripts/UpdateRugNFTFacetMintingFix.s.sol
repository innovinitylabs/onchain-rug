// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

/**
 * @title UpdateRugNFTFacetMintingFix
 * @notice Replace RugNFTFacet to fix minting issue by disabling problematic ERC721-C validation
 * @dev Temporarily disables _beforeTokenTransfer validation to allow minting to work
 */
contract UpdateRugNFTFacetMintingFix is Script {
    address constant DIAMOND = 0x8B68C94c4DDFa604FFCD7e32Aa70987586DAB222;
    address constant OLD_RUG_NFT_FACET = 0x0353e6665eDE612CB59BEF5EfdCd8F4A76b20e99;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy new RugNFTFacet with ERC721-C validation disabled
        RugNFTFacet newRugNFTFacet = new RugNFTFacet();
        address newFacetAddress = address(newRugNFTFacet);

        console.log("Deployed new RugNFTFacet at:", newFacetAddress);

        // Replace RugNFTFacet with updated version (Replace action)
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory selectors = new bytes4[](29);

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

        // ERC721-C functions (still exposed but validation disabled)
        selectors[23] = RugNFTFacet.getTransferValidator.selector;
        selectors[24] = RugNFTFacet.getSecurityPolicy.selector;
        selectors[25] = RugNFTFacet.getWhitelistedOperators.selector;
        selectors[26] = RugNFTFacet.getPermittedContractReceivers.selector;
        selectors[27] = RugNFTFacet.isTransferAllowed.selector;

        // Interface support
        selectors[28] = 0x01ffc9a7; // supportsInterface

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: newFacetAddress,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(DIAMOND).diamondCut(cut, address(0), "");

        console.log("RugNFTFacet replaced successfully!");
        console.log("Old facet:", OLD_RUG_NFT_FACET);
        console.log("New facet:", newFacetAddress);
        console.log("ERC721-C validation temporarily disabled to fix minting");

        vm.stopBroadcast();
    }
}
