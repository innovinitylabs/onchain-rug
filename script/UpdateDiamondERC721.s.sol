// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

/**
 * @title Update Diamond ERC721 Functions
 * @dev Adds missing ERC721 functions to existing diamond contract
 * @notice Only adds ERC721 selectors, doesn't redeploy facets
 */
contract UpdateDiamondERC721 is Script {
    // Existing diamond contract address (from previous deployment)
    address public constant DIAMOND_ADDR = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Adding ERC721 Functions to Existing Diamond");
        console.log("=========================================");
        console.log("Diamond address:", DIAMOND_ADDR);

        // Get the existing RugNFTFacet address by calling facetAddress on the diamond
        bytes4 facetAddressSelector = bytes4(keccak256("facetAddress(bytes4)"));
        (bool success, bytes memory data) = DIAMOND_ADDR.call(abi.encodeWithSelector(facetAddressSelector, bytes4(0xc87b56dd))); // tokenURI selector
        require(success, "Failed to get facet address");

        address rugNFTFacetAddr = abi.decode(data, (address));
        console.log("RugNFTFacet address:", rugNFTFacetAddr);

        // Check which ERC721 selectors are missing
        bytes4[] memory allSelectors = _getAllERC721Selectors();
        bytes4[] memory missingSelectors = _getMissingSelectors(DIAMOND_ADDR, rugNFTFacetAddr, allSelectors);

        if (missingSelectors.length == 0) {
            console.log("All ERC721 selectors are already exposed!");
            vm.stopBroadcast();
            return;
        }

        console.log("Found", missingSelectors.length, "missing ERC721 selectors");

        // Add missing ERC721 selectors to existing RugNFTFacet
        IDiamondCut.FacetCut[] memory erc721Cut = new IDiamondCut.FacetCut[](1);
        erc721Cut[0] = IDiamondCut.FacetCut({
            facetAddress: rugNFTFacetAddr, // Use existing facet address
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: missingSelectors
        });

        IDiamondCut(DIAMOND_ADDR).diamondCut(erc721Cut, address(0), "");
        console.log("   Added", missingSelectors.length, "missing ERC721 functions to existing RugNFTFacet");

        console.log("=========================================");
        console.log("ERC721 Functions Added Successfully!");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getMissingSelectors(address diamond, address facetAddr, bytes4[] memory selectors) internal view returns (bytes4[] memory) {
        bytes4[] memory missing = new bytes4[](selectors.length);
        uint256 missingCount = 0;

        bytes4 facetAddressSelector = bytes4(keccak256("facetAddress(bytes4)"));

        for (uint256 i = 0; i < selectors.length; i++) {
            (bool success, bytes memory data) = diamond.staticcall(abi.encodeWithSelector(facetAddressSelector, selectors[i]));
            if (success) {
                address existingFacet = abi.decode(data, (address));
                if (existingFacet == address(0)) {
                    // Selector not exposed at all
                    missing[missingCount] = selectors[i];
                    missingCount++;
                }
                // If it's exposed to a different facet, we'll skip it for now
            } else {
                // This shouldn't happen, but if facetAddress call fails, assume selector is missing
                missing[missingCount] = selectors[i];
                missingCount++;
            }
        }

        // Resize array to actual missing count
        bytes4[] memory result = new bytes4[](missingCount);
        for (uint256 i = 0; i < missingCount; i++) {
            result[i] = missing[i];
        }

        return result;
    }

    function _getAllERC721Selectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](13);
        // ERC721 Standard Functions that should be exposed
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
        selectors[10] = bytes4(0x18160ddd); // totalSupply()
        selectors[11] = bytes4(0x01ffc9a7); // supportsInterface(bytes4)
        selectors[12] = bytes4(0xb88d4fde); // safeTransferFrom(address,address,uint256,bytes)

        return selectors;
    }
}
