// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugAdminFacet.sol";

contract AddSetMetadataFunction is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Adding setERC721Metadata function...");

        // Deploy new admin facet
        RugAdminFacet newAdminFacet = new RugAdminFacet();
        address adminFacetAddr = address(newAdminFacet);
        console.log("New RugAdminFacet deployed at:", adminFacetAddr);

        // Prepare facet cuts for adding the new function
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        // Add new function
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = RugAdminFacet.setERC721Metadata.selector;

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: adminFacetAddr,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("setERC721Metadata function added successfully");

        vm.stopBroadcast();
    }
}

