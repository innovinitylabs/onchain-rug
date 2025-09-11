// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {OnchainRugs} from "../src/OnchainRugs.sol";

contract TestUpgradeableScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address onchainRugsAddress = vm.envAddress("ONCHAIN_RUGS_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        OnchainRugs onchainRugs = OnchainRugs(onchainRugsAddress);
        
        console.log("=== Testing Upgradeable Features ===");
        
        // Test current parameters
        console.log("Current base price:", onchainRugs.basePrice());
        console.log("Current cleaning cost:", onchainRugs.cleaningCost());
        console.log("Current free cleaning period:", onchainRugs.freeCleaningPeriod());
        console.log("Current moderate texture days:", onchainRugs.moderateTextureDays());
        console.log("Current heavy texture days:", onchainRugs.heavyTextureDays());
        console.log("Current royalty percentage:", onchainRugs.royaltyPercentage());
        console.log("Current royalty recipient:", onchainRugs.royaltyRecipient());
        console.log("Contract paused:", onchainRugs.paused());
        
        // Test updating pricing
        console.log("\n=== Updating Pricing ===");
        onchainRugs.updatePricing(
            0.0002 ether,  // New base price
            0.002 ether,   // New line 2-3 price
            0.004 ether,   // New line 4-5 price
            0.001 ether    // New cleaning cost
        );
        console.log("Pricing updated successfully!");
        
        // Test updating aging
        console.log("\n=== Updating Aging ===");
        onchainRugs.updateAging(
            45 days,  // New free cleaning period
            45 days,  // New moderate texture days
            120 days  // New heavy texture days
        );
        console.log("Aging parameters updated successfully!");
        
        // Test updating royalties
        console.log("\n=== Updating Royalties ===");
        onchainRugs.updateRoyalties(
            500,  // 5% royalty
            address(0x1234567890123456789012345678901234567890)  // New recipient
        );
        console.log("Royalties updated successfully!");
        
        // Test pausing
        console.log("\n=== Testing Pause ===");
        onchainRugs.pause();
        console.log("Contract paused:", onchainRugs.paused());
        
        onchainRugs.unpause();
        console.log("Contract unpaused:", onchainRugs.paused());
        
        // Verify changes
        console.log("\n=== Verifying Changes ===");
        console.log("New base price:", onchainRugs.basePrice());
        console.log("New cleaning cost:", onchainRugs.cleaningCost());
        console.log("New free cleaning period:", onchainRugs.freeCleaningPeriod());
        console.log("New moderate texture days:", onchainRugs.moderateTextureDays());
        console.log("New heavy texture days:", onchainRugs.heavyTextureDays());
        console.log("New royalty percentage:", onchainRugs.royaltyPercentage());
        console.log("New royalty recipient:", onchainRugs.royaltyRecipient());
        
        // Reset to original values
        console.log("\n=== Resetting to Original Values ===");
        onchainRugs.updatePricing(
            0.0001 ether,  // Original base price
            0.00111 ether, // Original line 2-3 price
            0.00222 ether, // Original line 4-5 price
            0.0009 ether   // Original cleaning cost
        );
        
        onchainRugs.updateAging(
            30 days,  // Original free cleaning period
            30 days,  // Original moderate texture days
            90 days   // Original heavy texture days
        );
        
        onchainRugs.updateRoyalties(
            1000,  // 10% royalty
            vm.addr(deployerPrivateKey)  // Original recipient
        );
        
        console.log("Reset to original values completed!");
        
        vm.stopBroadcast();
    }
}
