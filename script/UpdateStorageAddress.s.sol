// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugs.sol";

/**
 * @title Update Storage Address
 * @notice Update OnchainRugs contract to use correct ScriptyStorage address
 */
contract UpdateStorageAddress is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== Updating OnchainRugs Storage Address ===");

        // Current contract addresses
        address onchainRugsAddr = 0x73db032918FAEb5c853045cF8e9F70362738a8ee;
        address scriptyBuilderAddr = 0x8548f9f9837E055dCa729DC2f6067CC9aC6A0EA8;
        address correctStorageAddr = 0x8523D1ED6e4a2AC12d25A22F829Ffa50c205D58e; // NEW storage with files
        address htmlGeneratorAddr = 0x0aB9850E205807c615bA936eA27D020406D78131;

        OnchainRugs onchainRugs = OnchainRugs(payable(onchainRugsAddr));

        console.log("OnchainRugs contract:", onchainRugsAddr);
        console.log("Current ScriptyBuilder:", onchainRugs.rugScriptyBuilder());
        console.log("Current Storage:", onchainRugs.rugEthFSStorage());
        console.log("Current HTML Generator:", onchainRugs.onchainRugsHTMLGenerator());

        console.log("\nUpdating to:");
        console.log("New ScriptyBuilder:", scriptyBuilderAddr);
        console.log("New Storage:", correctStorageAddr);
        console.log("New HTML Generator:", htmlGeneratorAddr);

        // Update the contract addresses
        onchainRugs.setRugScriptyContracts(
            scriptyBuilderAddr,
            correctStorageAddr,
            htmlGeneratorAddr
        );

        console.log("\n=== Update Complete ===");
        console.log("Verifying new addresses:");
        console.log("New ScriptyBuilder:", onchainRugs.rugScriptyBuilder());
        console.log("New Storage:", onchainRugs.rugEthFSStorage());
        console.log("New HTML Generator:", onchainRugs.onchainRugsHTMLGenerator());

        vm.stopBroadcast();
    }
}
