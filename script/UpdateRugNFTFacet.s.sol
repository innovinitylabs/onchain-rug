// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugAgingFacet.sol";

/**
 * @title Update RugNFTFacet - New Texture System
 * @dev Updates RugNFTFacet with persistent texture wear mechanics
 */
contract UpdateRugNFTFacet is Script {
    address public constant DIAMOND_ADDR = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Updating RugNFTFacet - New Texture System");
        console.log("=========================================");

        // Deploy new RugNFTFacet with updated texture calculation
        RugNFTFacet newRugNFTFacet = new RugNFTFacet();
        address newFacetAddr = address(newRugNFTFacet);
        console.log("New RugNFTFacet deployed at:", newFacetAddr);

        // Replace the existing RugNFTFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: newFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugNFTSelectors()
        });

        IDiamondCut(DIAMOND_ADDR).diamondCut(cut, address(0), "");
        console.log("RugNFTFacet replaced with new texture system");

        console.log("=========================================");
        console.log("RugNFTFacet Updated!");
        console.log("- Texture wear is now persistent");
        console.log("- maxTextureLevel tracks highest wear achieved");
        console.log("- textureProgressTimer controls advancement rate");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](26);
        // ERC721 Standard Functions (hardcoded selectors from forge inspect)
        selectors[0] = bytes4(0x70a08231); // balanceOf(address)
        selectors[1] = bytes4(0x6352211e); // ownerOf(uint256)
        selectors[2] = bytes4(0x42842e0e); // safeTransferFrom(address,address,uint256)
        selectors[3] = bytes4(0x23b872dd); // transferFrom(address,address,uint256)
        selectors[4] = bytes4(0x095ea7b3); // approve(address,uint256)
        selectors[5] = bytes4(0xa22cb465); // setApprovalForAll(address,bool)
        selectors[6] = bytes4(0x081812fc); // getApproved(uint256)
        selectors[7] = bytes4(0xe985e9c5); // isApprovedForAll(address,address)
        selectors[8] = bytes4(0x06fdde03); // name()
        selectors[9] = bytes4(0x95d89b41); // symbol()
        selectors[10] = bytes4(0xc87b56dd); // tokenURI(uint256)
        selectors[11] = bytes4(0x18160ddd); // totalSupply()
        selectors[12] = bytes4(0x01ffc9a7); // supportsInterface(bytes4)
        selectors[13] = bytes4(0xb88d4fde); // safeTransferFrom(address,address,uint256,bytes)

        // Rug-specific functions
        selectors[14] = RugNFTFacet.mintRug.selector;             // 0f495d0c
        selectors[15] = RugNFTFacet.burn.selector;                // 42966c68
        selectors[16] = RugNFTFacet.getRugData.selector;          // 2e99fe3f
        selectors[17] = RugNFTFacet.getAgingData.selector;        // a8accc46
        selectors[18] = RugNFTFacet.getMintPrice.selector;        // 559e775b
        selectors[19] = RugNFTFacet.canMint.selector;             // c2ba4744
        selectors[20] = RugNFTFacet.isTextAvailable.selector;     // fdd9d9e8
        selectors[21] = RugNFTFacet.maxSupply.selector;           // d5abeb01
        selectors[22] = RugNFTFacet.walletMints.selector;         // f0293fd3
        selectors[23] = RugNFTFacet.isWalletException.selector;   // 2d2bf633
        selectors[24] = RugAgingFacet.getFrameLevel.selector;     // ceffb063
        // selectors[25] = RugNFTFacet.updateFrameLevel.selector;    // 650def5b - REMOVED: frames update automatically

        return selectors;
    }
}
