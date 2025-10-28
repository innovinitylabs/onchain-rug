// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

/**
 * @title Initialize ERC721 Metadata
 * @dev Add initializeERC721Metadata selector and call it
 */
contract InitializeMetadata is Script {
    address public diamondAddr = 0x3bcd07e784c00bb84EfBab7F710ef041707003b9;
    
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey;
        
        // Try TESTNET_PRIVATE_KEY first, fallback to PRIVATE_KEY
        try vm.envUint("TESTNET_PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        }

        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Adding initializeERC721Metadata selector");
        console.log("=========================================");

        // Get the RugNFTFacet address (we need to find it from diamond)
        // For now, we'll deploy a new one to get the selector
        RugNFTFacet rugNFTFacet = new RugNFTFacet();
        
        // Create the selector array
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = RugNFTFacet.initializeERC721Metadata.selector;

        // Create the facet cut
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        // Add to diamond
        console.log("Adding selector to diamond...");
        IDiamondCut(diamondAddr).diamondCut(cut, address(0), "");
        console.log("Selector added successfully");

        // Now call the initialization
        console.log("Calling initializeERC721Metadata...");
        RugNFTFacet(diamondAddr).initializeERC721Metadata();
        console.log("Metadata initialized!");

        // Verify
        console.log("Verifying...");
        console.log("Name:", RugNFTFacet(diamondAddr).name());
        console.log("Symbol:", RugNFTFacet(diamondAddr).symbol());

        console.log("=========================================");
        console.log("Metadata initialization complete!");
        console.log("=========================================");

        vm.stopBroadcast();
    }
}
