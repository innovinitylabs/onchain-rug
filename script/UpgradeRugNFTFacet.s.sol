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

        // Replace the RugNFTFacet implementation by updating the facet address for existing selectors
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: nftFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getCurrentRugNFTSelectors() // Use the same selectors but with new implementation
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("RugNFTFacet upgraded successfully");

        vm.stopBroadcast();
    }

    // Current selectors from the deployed contract (from cast call output)
    function _getCurrentRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](31);
        // From cast call output, there are exactly 31 selectors on the current contract
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
        selectors[13] = 0x91af3155; // tokenOfOwnerByIndex
        selectors[14] = 0x7868fd54; // tokenByIndex
        selectors[15] = 0x42966c68; // burn
        selectors[16] = 0x2e99fe3f; // getRugData
        selectors[17] = 0xa8accc46; // getAgingData
        selectors[18] = 0x559e775b; // maxSupply
        selectors[19] = 0xc2ba4744; // isTextAvailable
        selectors[20] = 0xfdd9d9e8; // getMintPrice
        selectors[21] = 0xd5abeb01; // canMint
        selectors[22] = 0xf0293fd3; // walletMints
        selectors[23] = 0x2d2bf633; // isWalletException
        selectors[24] = 0x098144d4; // initializeERC721Metadata
        selectors[25] = 0xbe537f43; // getTransferValidator
        selectors[26] = 0x495c8bf9; // getSecurityPolicy
        selectors[27] = 0xd007af5c; // getWhitelistedOperators
        selectors[28] = 0x2e8da829; // getPermittedContractReceivers
        selectors[29] = 0x9d645a44; // isOperatorWhitelisted
        selectors[30] = 0xfdb15474; // isTransferAllowed

        return selectors;
    }

    // Updated selectors for the new RugNFTFacet implementation
    function _getUpdatedRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](35);

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

        // ERC721 Enumerable Functions
        selectors[14] = RugNFTFacet.tokenOfOwnerByIndex.selector;
        selectors[15] = RugNFTFacet.tokenByIndex.selector;

        // Rug-specific functions
        selectors[16] = RugNFTFacet.mintRug.selector;
        selectors[17] = RugNFTFacet.mintRugFor.selector;
        selectors[18] = RugNFTFacet.burn.selector;
        selectors[19] = RugNFTFacet.getRugData.selector;
        selectors[20] = RugNFTFacet.getAgingData.selector;
        selectors[21] = RugNFTFacet.maxSupply.selector;
        selectors[22] = RugNFTFacet.isTextAvailable.selector;
        selectors[23] = RugNFTFacet.getMintPrice.selector;
        selectors[24] = RugNFTFacet.canMint.selector;
        selectors[25] = RugNFTFacet.walletMints.selector;
        selectors[26] = RugNFTFacet.isWalletException.selector;
        selectors[27] = RugNFTFacet.initializeERC721Metadata.selector;

        // ERC721-C Functions
        selectors[28] = RugNFTFacet.getTransferValidator.selector;
        selectors[29] = RugNFTFacet.getSecurityPolicy.selector;
        selectors[30] = RugNFTFacet.getWhitelistedOperators.selector;
        selectors[31] = RugNFTFacet.getPermittedContractReceivers.selector;
        selectors[32] = RugNFTFacet.isOperatorWhitelisted.selector;
        selectors[33] = RugNFTFacet.isContractReceiverPermitted.selector;
        selectors[34] = RugNFTFacet.isTransferAllowed.selector;

        return selectors;
    }
}
