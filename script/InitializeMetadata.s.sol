// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugNFTFacet.sol";

contract InitializeMetadata is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Initializing ERC721 metadata...");

        // Call the initialization function
        RugNFTFacet(diamondAddr).initializeERC721Metadata();

        console.log("ERC721 metadata initialized successfully");

        vm.stopBroadcast();
    }
}
