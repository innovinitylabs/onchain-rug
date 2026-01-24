// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract AddAdminFunction is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Adding admin function to attribution facet at:", diamondAddr);

        // Add the fixAttributionMapping function to the existing attribution facet
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        // The existing attribution facet address
        address existingFacet = 0x07fe1BeD8701CF67A84Fc8e5ce4A27a2BD839eaa;

        // Add the admin function
        bytes4[] memory adminSelectors = new bytes4[](1);
        adminSelectors[0] = 0x97474b4b; // fixAttributionMapping(string,address)

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: existingFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: adminSelectors
        });

        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");
        console.log("Admin function added to attribution facet!");

        vm.stopBroadcast();
    }
}