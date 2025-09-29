// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

/**
 * @title Update TokenURI and Metadata Functions
 * @dev Updates the existing RugNFTFacet with tokenURI + name/symbol functions
 */
contract UpdateTokenURIAndMetadata is Script {
    // Existing diamond contract address
    address public constant DIAMOND_ADDR = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Updating RugNFTFacet with tokenURI + metadata");
        console.log("=========================================");
        console.log("Diamond address:", DIAMOND_ADDR);

        // Deploy new RugNFTFacet with updated functions
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
        console.log("RugNFTFacet replaced with updated functions");

        console.log("=========================================");
        console.log("Update Complete!");
        console.log("Now includes:");
        console.log("- tokenURI with Last Cleaned timestamp");
        console.log("- name() and symbol() functions");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](11);
        selectors[0] = bytes4(keccak256("tokenURI(uint256)"));
        selectors[1] = bytes4(keccak256("name()"));
        selectors[2] = bytes4(keccak256("symbol()"));
        selectors[3] = bytes4(keccak256("totalSupply()"));
        selectors[4] = bytes4(keccak256("balanceOf(address)"));
        selectors[5] = bytes4(keccak256("ownerOf(uint256)"));
        selectors[6] = bytes4(keccak256("approve(address,uint256)"));
        selectors[7] = bytes4(keccak256("getApproved(uint256)"));
        selectors[8] = bytes4(keccak256("setApprovalForAll(address,bool)"));
        selectors[9] = bytes4(keccak256("supportsInterface(bytes4)"));
        selectors[10] = bytes4(0xb88d4fde); // safeTransferFrom(address,address,uint256,bytes)

        return selectors;
    }
}
