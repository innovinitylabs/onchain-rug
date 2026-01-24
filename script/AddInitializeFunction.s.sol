// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract AddInitializeFunction is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Adding initializeCodeLengths function to attribution facet at:", diamondAddr);

        // Add the initializeCodeLengths function to the existing attribution facet
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        // The existing attribution facet address
        address existingFacet = 0x01CdCD6B500531CC8330696B7b82c4bBF469eFAd;

        // Add the initialize function
        bytes4[] memory initSelectors = new bytes4[](1);
        initSelectors[0] = 0x43e8a466; // initializeCodeLengths()

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: existingFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: initSelectors
        });

        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");
        console.log("initializeCodeLengths function added!");

        vm.stopBroadcast();
    }
}