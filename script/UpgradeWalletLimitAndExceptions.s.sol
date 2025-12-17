// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/facets/RugAdminFacet.sol";

contract UpgradeWalletLimitAndExceptions is Script {
    function run() external {
        address diamondAddr = vm.envAddress("DIAMOND_ADDRESS");
        address deployerAddr = vm.envAddress("DEPLOYER_ADDRESS");

        vm.startBroadcast();

        console.log("Upgrading wallet limit and exceptions on:", diamondAddr);

        // Update wallet limit to 10
        console.log("Setting wallet limit to 10...");
        RugAdminFacet(diamondAddr).updateWalletLimit(10);

        // Add deployer to exception list (no wallet limits)
        console.log("Adding deployer to exception list:", deployerAddr);
        RugAdminFacet(diamondAddr).addToExceptionList(deployerAddr);

        console.log("Upgrade completed successfully!");

        vm.stopBroadcast();
    }
}
