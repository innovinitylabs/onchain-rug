// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @title FixAgingThresholds
 * @notice Fix the aging thresholds that were set incorrectly in deployment
 */
contract FixAgingThresholds is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== FIXING AGING THRESHOLDS ===");
        console.log("Diamond:", DIAMOND);

        // The system actually expects seconds (despite comments saying "days")
        // So for testing, we want shorter intervals in minutes
        uint256[5] memory agingThresholds = [
            uint256(1 minutes),    // dirtLevel1: 1 minute to level 1
            uint256(2 minutes),    // dirtLevel2: 2 minutes to level 2
            uint256(3 minutes),    // agingAdvance: 3 minutes between aging level advances
            uint256(5 minutes),    // freeClean: 5 minutes after mint for free cleaning
            uint256(2 minutes)     // freeCleanWindow: 2 minutes after cleaning for free cleaning
        ];

        RugAdminFacet(DIAMOND).updateAgingThresholds(agingThresholds);

        console.log("Aging thresholds updated for testing:");
        console.log("  - Dirt Level 1: 1 minute");
        console.log("  - Dirt Level 2: 2 minutes");
        console.log("  - Aging Advance: 3 minutes");
        console.log("  - Free Clean: 5 minutes");
        console.log("  - Free Clean Window: 2 minutes");
        console.log("");
        console.log("Now rugs will age every 3 minutes for testing!");

        vm.stopBroadcast();
    }
}
