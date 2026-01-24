// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract RedeployRugNFTFacet is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Redeploying RugNFTFacet at:", diamondAddr);

        // Deploy new RugNFTFacet
        RugNFTFacet rugNFTFacet = new RugNFTFacet();
        console.log("New RugNFTFacet deployed at:", address(rugNFTFacet));

        // Replace RugNFTFacet with updated version
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        // RugNFTFacet function selectors (from original deployment)
        bytes4[] memory selectors = new bytes4[](32);

        // ERC721 standard functions
        selectors[0] = bytes4(0x01ffc9a7); // supportsInterface(bytes4)
        selectors[1] = bytes4(0x06fdde03); // name()
        selectors[2] = bytes4(0x95d89b41); // symbol()
        selectors[3] = bytes4(0xc87b56dd); // tokenURI(uint256)
        selectors[4] = bytes4(0x18160ddd); // totalSupply()
        selectors[5] = bytes4(0x70a08231); // balanceOf(address)
        selectors[6] = bytes4(0x6352211e); // ownerOf(uint256)
        selectors[7] = bytes4(0xb88d4fde); // safeTransferFrom(address,address,uint256,bytes)
        selectors[8] = bytes4(0x42842e0e); // safeTransferFrom(address,address,uint256)
        selectors[9] = bytes4(0x23b872dd); // transferFrom(address,address,uint256)
        selectors[10] = bytes4(0x095ea7b3); // approve(address,uint256)
        selectors[11] = bytes4(0xa22cb465); // setApprovalForAll(address,bool)
        selectors[12] = bytes4(0x081812fc); // getApproved(uint256)
        selectors[13] = bytes4(0xe985e9c5); // isApprovedForAll(address,address)

        // Rug-specific functions
        selectors[14] = RugNFTFacet.mintRug.selector;
        selectors[15] = RugNFTFacet.mintRugFor.selector;
        selectors[16] = RugNFTFacet.burn.selector;
        selectors[17] = RugNFTFacet.getRugData.selector;
        selectors[18] = RugNFTFacet.getAgingData.selector;
        selectors[19] = RugNFTFacet.getMintPrice.selector;
        selectors[20] = RugNFTFacet.canMint.selector;
        selectors[21] = RugNFTFacet.isTextAvailable.selector;
        selectors[22] = RugNFTFacet.maxSupply.selector;
        selectors[23] = RugNFTFacet.walletMints.selector;
        selectors[24] = RugNFTFacet.isWalletException.selector;

        // ERC721-C functions
        selectors[25] = RugNFTFacet.getTransferValidator.selector;
        selectors[26] = RugNFTFacet.getSecurityPolicy.selector;
        selectors[27] = RugNFTFacet.getWhitelistedOperators.selector;
        selectors[28] = RugNFTFacet.getPermittedContractReceivers.selector;
        selectors[29] = RugNFTFacet.isOperatorWhitelisted.selector;
        selectors[30] = RugNFTFacet.isContractReceiverPermitted.selector;
        selectors[31] = RugNFTFacet.isTransferAllowed.selector;

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");
        console.log("RugNFTFacet redeployed successfully!");

        vm.stopBroadcast();
    }
}