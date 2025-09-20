// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * Simple script to update the HTML generator contract
 * This will redeploy just the HTML generator with the correct library names
 */

import "forge-std/Script.sol";
import "../src/OnchainRugsHTMLGenerator.sol";

contract UpdateHTMLGenerator is Script {
    OnchainRugsHTMLGenerator public htmlGenerator;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying updated OnchainRugsHTMLGenerator...");

        // Deploy the updated HTML generator
        htmlGenerator = new OnchainRugsHTMLGenerator();

        console.log("New HTML Generator deployed at:", address(htmlGenerator));

        // Verify the library names
        string[] memory libraries = htmlGenerator.getRequiredLibraries();
        console.log("Library names in new contract:");
        for (uint i = 0; i < libraries.length; i++) {
            console.log("  ", i + 1, ":", libraries[i]);
        }

        vm.stopBroadcast();

        console.log("HTML Generator update complete!");
        console.log("You can now update your NFT contract to use this new HTML generator address.");
    }
}
