// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

contract UpdateRugNFTFacet is Script {
    address constant DIAMOND = 0x0627da3FF590E92Ca249cE600548c25cf6eFEb1f;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy new RugNFTFacet with struct-based mintRug
        RugNFTFacet newRugNFTFacet = new RugNFTFacet();
        address newFacetAddress = address(newRugNFTFacet);

        console.log("Deployed new RugNFTFacet at:", newFacetAddress);

        // First, remove all old RugNFTFacet selectors
        IDiamondCut.FacetCut[] memory removeCut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory oldSelectors = new bytes4[](23);

        // ERC721 functions from old facet
        oldSelectors[0] = 0x70a08231; // balanceOf
        oldSelectors[1] = 0x6352211e; // ownerOf
        oldSelectors[2] = 0x42842e0e; // safeTransferFrom(address,address,uint256)
        oldSelectors[3] = 0x23b872dd; // transferFrom
        oldSelectors[4] = 0x095ea7b3; // approve
        oldSelectors[5] = 0xa22cb465; // setApprovalForAll(address,bool)
        oldSelectors[6] = 0x081812fc; // getApproved(uint256)
        oldSelectors[7] = 0xe985e9c5; // isApprovedForAll(address,address)
        oldSelectors[8] = 0x91af3155; // old mintRug selector (individual params)
        oldSelectors[9] = RugNFTFacet.burn.selector;
        oldSelectors[10] = RugNFTFacet.getRugData.selector;
        oldSelectors[11] = RugNFTFacet.getAgingData.selector;
        oldSelectors[12] = RugNFTFacet.getMintPrice.selector;
        oldSelectors[13] = RugNFTFacet.canMint.selector;
        oldSelectors[14] = RugNFTFacet.isTextAvailable.selector;
        oldSelectors[15] = RugNFTFacet.maxSupply.selector;
        oldSelectors[16] = RugNFTFacet.walletMints.selector;
        oldSelectors[17] = RugNFTFacet.isWalletException.selector;
        oldSelectors[18] = RugNFTFacet.totalSupply.selector;
        oldSelectors[19] = RugNFTFacet.tokenURI.selector;
        oldSelectors[20] = 0x06fdde03; // name()
        oldSelectors[21] = 0x95d89b41; // symbol()
        oldSelectors[22] = 0x01ffc9a7; // supportsInterface

        removeCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(0), // Remove from any facet
            action: IDiamondCut.FacetCutAction.Remove,
            functionSelectors: oldSelectors
        });

        IDiamondCut(DIAMOND).diamondCut(removeCut, address(0), "");
        console.log("Removed old RugNFTFacet selectors");

        // Now add new RugNFTFacet with struct-based mintRug
        IDiamondCut.FacetCut[] memory addCut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory newSelectors = new bytes4[](23);

        // ERC721 functions
        newSelectors[0] = 0x70a08231; // balanceOf
        newSelectors[1] = 0x6352211e; // ownerOf
        newSelectors[2] = 0x42842e0e; // safeTransferFrom(address,address,uint256)
        newSelectors[3] = 0x23b872dd; // transferFrom
        newSelectors[4] = 0x095ea7b3; // approve
        newSelectors[5] = 0xa22cb465; // setApprovalForAll(address,bool)
        newSelectors[6] = 0x081812fc; // getApproved(uint256)
        newSelectors[7] = 0xe985e9c5; // isApprovedForAll(address,address)
        newSelectors[8] = RugNFTFacet.mintRug.selector; // new mintRug selector (struct params)
        newSelectors[9] = RugNFTFacet.burn.selector;
        newSelectors[10] = RugNFTFacet.getRugData.selector;
        newSelectors[11] = RugNFTFacet.getAgingData.selector;
        newSelectors[12] = RugNFTFacet.getMintPrice.selector;
        newSelectors[13] = RugNFTFacet.canMint.selector;
        newSelectors[14] = RugNFTFacet.isTextAvailable.selector;
        newSelectors[15] = RugNFTFacet.maxSupply.selector;
        newSelectors[16] = RugNFTFacet.walletMints.selector;
        newSelectors[17] = RugNFTFacet.isWalletException.selector;
        newSelectors[18] = RugNFTFacet.totalSupply.selector;
        newSelectors[19] = RugNFTFacet.tokenURI.selector;
        newSelectors[20] = 0x06fdde03; // name()
        newSelectors[21] = 0x95d89b41; // symbol()
        newSelectors[22] = 0x01ffc9a7; // supportsInterface

        addCut[0] = IDiamondCut.FacetCut({
            facetAddress: newFacetAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: newSelectors
        });

        IDiamondCut(DIAMOND).diamondCut(addCut, address(0), "");

        console.log("Successfully updated RugNFTFacet in Diamond with proper ERC721-C validation");

        vm.stopBroadcast();
    }
}
