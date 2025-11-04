// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

contract UpgradeRugNFTFacetAddBridgeMint is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Starting RugNFTFacet upgrade with mintRugFor...");
        console.log("Diamond address:", diamondAddr);

        // Deploy new NFT facet
        RugNFTFacet newNftFacet = new RugNFTFacet();
        address nftFacetAddr = address(newNftFacet);
        console.log("New RugNFTFacet deployed at:", nftFacetAddr);

        // Prepare facet cuts: Replace existing + Add new
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](2);

        // Replace existing functions
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: nftFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getExistingSelectors()
        });

        // Add new mintRugFor function
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: nftFacetAddr,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getNewSelectors()
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("RugNFTFacet upgraded successfully with mintRugFor");

        vm.stopBroadcast();
    }

    function _getExistingSelectors() internal pure returns (bytes4[] memory) {
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

        // Rug-specific functions (existing)
        selectors[14] = RugNFTFacet.mintRug.selector;
        selectors[15] = RugNFTFacet.getRugData.selector;
        selectors[16] = RugNFTFacet.getAgingData.selector;
        selectors[17] = RugNFTFacet.initializeERC721Metadata.selector;

        return selectors;
    }

    function _getNewSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = RugNFTFacet.mintRugFor.selector; // NEW: Cross-chain mint function
        return selectors;
    }
}

