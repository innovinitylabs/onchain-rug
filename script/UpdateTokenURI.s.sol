// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

/**
 * @title Update TokenURI with Last Cleaned Timestamp
 * @dev Updates the existing RugNFTFacet to include lastCleaned in tokenURI
 */
contract UpdateTokenURI is Script {
    // Existing diamond contract address
    address public constant DIAMOND_ADDR = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Updating TokenURI to include Last Cleaned");
        console.log("=========================================");
        console.log("Diamond address:", DIAMOND_ADDR);

        // Get the existing RugNFTFacet address by calling facetAddress on the diamond
        bytes4 facetAddressSelector = bytes4(keccak256("facetAddress(bytes4)"));
        (bool success, bytes memory data) = DIAMOND_ADDR.call(abi.encodeWithSelector(facetAddressSelector, bytes4(keccak256("tokenURI(uint256)"))));
        require(success, "Failed to get facet address");

        address rugNFTFacetAddr = abi.decode(data, (address));
        console.log("RugNFTFacet address:", rugNFTFacetAddr);

        // Deploy new RugNFTFacet with updated tokenURI
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
        console.log("RugNFTFacet replaced with updated tokenURI function");

        console.log("=========================================");
        console.log("TokenURI Update Complete!");
        console.log("Now includes Last Cleaned timestamp");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](9);
        selectors[0] = bytes4(keccak256("tokenURI(uint256)"));
        selectors[1] = bytes4(keccak256("name()"));
        selectors[2] = bytes4(keccak256("symbol()"));
        selectors[3] = bytes4(keccak256("totalSupply()"));
        selectors[4] = bytes4(keccak256("balanceOf(address)"));
        selectors[5] = bytes4(keccak256("ownerOf(uint256)"));
        selectors[6] = bytes4(keccak256("approve(address,uint256)"));
        selectors[7] = bytes4(keccak256("getApproved(uint256)"));
        selectors[8] = bytes4(keccak256("setApprovalForAll(address,bool)"));
        // Note: transferFrom and safeTransferFrom are handled by RugTransferFacet
        return selectors;
    }
}
