// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

contract DeployScript is Script {
    function run() external {
        // Use the default Anvil private key for local testing
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(deployerPrivateKey);

        // Deploy OnchainRugs contract
        OnchainRugs onchainRugs = new OnchainRugs();
        
        console.log("OnchainRugs deployed to:", address(onchainRugs));

        vm.stopBroadcast();

        // Log deployment info
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Network: Shape Sepolia");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("OnchainRugs:", address(onchainRugs));
        console.log("Timestamp:", block.timestamp);
        console.log("===========================");
    }
}
