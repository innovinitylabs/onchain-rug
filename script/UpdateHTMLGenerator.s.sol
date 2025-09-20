// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";
import "../src/OnchainRugsHTMLGenerator.sol";

/**
 * @title UpdateHTMLGenerator
 * @dev Update the OnchainRugs contract to use new HTML generator with fixed library names
 */
contract UpdateHTMLGenerator is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");

        // Hardcoded addresses from environment file
        address onchainRugsAddr = 0xF6eE290597cCB1e136772122C1c4DcBb6Bf7f089;
        address scriptyStorageAddr = 0x2263cf7764c19070b6fCE6E8B707f2bDc35222C9;
        address scriptyBuilderAddr = 0x48a988dC026490c11179D9Eb7f7aBC377CaFA353;

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== UPDATING HTML GENERATOR ===");
        console.log("Deployer:", deployer);
        console.log("OnchainRugs:", onchainRugsAddr);

        vm.startBroadcast(deployerPrivateKey);

        OnchainRugs onchainRugs = OnchainRugs(onchainRugsAddr);

        // Deploy new HTML generator
        console.log("Deploying new OnchainRugsHTMLGenerator...");
        OnchainRugsHTMLGenerator newHtmlGenerator = new OnchainRugsHTMLGenerator();
        console.log("New HTML Generator deployed at:", address(newHtmlGenerator));

        // Update the contract to use new generator with correct addresses
        console.log("Updating OnchainRugs contract...");
        console.log("ScriptyBuilder:", scriptyBuilderAddr);
        console.log("ScriptyStorage:", scriptyStorageAddr);
        console.log("New HTML Generator:", address(newHtmlGenerator));

        onchainRugs.setRugScriptyContracts(
            scriptyBuilderAddr,
            scriptyStorageAddr,
            address(newHtmlGenerator)
        );
        console.log("HTML Generator updated successfully!");

        vm.stopBroadcast();

        console.log("\n=== UPDATE COMPLETE ===");
        console.log("New HTML Generator Address:", address(newHtmlGenerator));
        console.log("Your NFTs will now use the updated libraries with p5.js and algorithm!");
    }
}
