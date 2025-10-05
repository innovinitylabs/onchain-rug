// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @dev Script to update aging thresholds in OnchainRugs contract
 * Allows changing dirt accumulation, texture aging, and free cleaning times
 *
 * Usage: Update these constants and run:
 * forge script script/UpdateAgingThresholds.s.sol --rpc-url <URL> --broadcast
 */
contract UpdateAgingThresholds is Script {
    // ========== CONFIGURE THESE VALUES ==========

    // Current deployment address
    address constant DIAMOND_ADDRESS = 0xb39093648309694438E2c3FdF4a8b952C13df070;

    // Aging thresholds in DAYS
    // [dirtLevel1Days, dirtLevel2Days, agingAdvanceDays, freeCleanDays, freeCleanWindow]

    // ULTRA FAST TEST SETTINGS (current)
    uint256[5] public TEST_THRESHOLDS = [
        1,   // dirtLevel1Days: 1 day (light dirt)
        3,   // dirtLevel2Days: 3 days (heavy dirt)
        7,   // agingAdvanceDays: 7 days between aging levels
        14,  // freeCleanDays: 14 days free after mint
        5    // freeCleanWindow: 5 days free after cleaning
    ];

    // PRODUCTION SETTINGS (realistic)
    uint256[5] public PRODUCTION_THRESHOLDS = [
        3,     // dirtLevel1Days: 3 days (light dirt)
        7,     // dirtLevel2Days: 7 days (heavy dirt)
        14,    // agingAdvanceDays: 14 days between aging levels
        30,    // freeCleanDays: 30 days free after mint
        11     // freeCleanWindow: 11 days free after cleaning
    ];

    // Choose which settings to use
    bool useProductionSettings = false; // Set to true for production, false for testing

    // =============================================

    // Helper function to read current aging thresholds from deployed contract
    function getCurrentThresholds() external view returns (uint256[5] memory) {
        address diamondAddr = DIAMOND_ADDRESS;
        (
            uint256 dirt1, uint256 dirt2, uint256 agingAdvance,
            uint256 freeMint, uint256 freeAfter
        ) = RugAdminFacet(diamondAddr).getAgingThresholds();

        uint256[5] memory currentThresholds = [dirt1, dirt2, agingAdvance, freeMint, freeAfter];

        console.log("=== CURRENT DEPLOYED THRESHOLDS (in days) ===");
        console.log("Dirt Level 1:", currentThresholds[0], "days");
        console.log("Dirt Level 2:", currentThresholds[1], "days");
        console.log("Aging Advance:", currentThresholds[2], "days");
        console.log("Free Clean Days:", currentThresholds[3], "days");
        console.log("Free Clean Window:", currentThresholds[4], "days");

        console.log("");
        console.log("=== CONVERTED TO SECONDS ===");
        console.log("Dirt Level 1:", currentThresholds[0] * 86400, "seconds");
        console.log("Dirt Level 2:", currentThresholds[1] * 86400, "seconds");
        console.log("Aging Advance:", currentThresholds[2] * 86400, "seconds");
        console.log("Free Clean Days:", currentThresholds[3] * 86400, "seconds");
        console.log("Free Clean Window:", currentThresholds[4] * 86400, "seconds");

        return currentThresholds;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address diamondAddr = DIAMOND_ADDRESS;
        uint256[5] memory thresholds = useProductionSettings ? PRODUCTION_THRESHOLDS : TEST_THRESHOLDS;

        // First check current values
        console.log("=== CHECKING CURRENT DEPLOYED VALUES ===");
        (
            uint256 currDirt1, uint256 currDirt2, uint256 currAgingAdvance,
            uint256 currFreeMint, uint256 currFreeAfter
        ) = RugAdminFacet(diamondAddr).getAgingThresholds();

        console.log("Current Dirt Level 1:", currDirt1, "days");
        console.log("Current Dirt Level 2:", currDirt2, "days");
        console.log("Current Aging Advance:", currAgingAdvance, "days");
        console.log("Current Free Clean Days:", currFreeMint, "days");
        console.log("Current Free Clean Window:", currFreeAfter, "days");

        console.log("");
        console.log("=== UPDATING TO NEW VALUES ===");
        console.log("Target settings:", useProductionSettings ? "PRODUCTION" : "TEST");

        console.log("New Dirt Level 1:", thresholds[0], "days");
        console.log("New Dirt Level 2:", thresholds[1], "days");
        console.log("New Aging Advance:", thresholds[2], "days");
        console.log("New Free Clean Days:", thresholds[3], "days");
        console.log("New Free Clean Window:", thresholds[4], "days");

        RugAdminFacet(diamondAddr).updateAgingThresholds(thresholds);

        console.log("Aging thresholds updated successfully!");

        vm.stopBroadcast();
    }

    // Helper function to preview what the script will do
    function previewSettings() external view {
        uint256[5] memory thresholds = useProductionSettings ? PRODUCTION_THRESHOLDS : TEST_THRESHOLDS;

        console.log("=== AGING THRESHOLDS PREVIEW ===");
        console.log("Mode:", useProductionSettings ? "PRODUCTION" : "TEST");
        console.log("Contract:", DIAMOND_ADDRESS);
        console.log("");

        console.log("Dirt Accumulation:");
        console.log("  Level 1 (light):", thresholds[0], "days");
        console.log("  Level 2 (heavy):", thresholds[1], "days");
        console.log("");

        console.log("Aging Progression:");
        console.log("  Advance every:", thresholds[2], "days");
        console.log("  Max level: 10");
        console.log("");

        console.log("Free Cleaning Windows:");
        console.log("  After mint:", thresholds[3], "days");
        console.log("  After clean:", thresholds[4], "days");
        console.log("");

        console.log("Expected Timeline:");
        uint256 maxTime = thresholds[2] * 10; // aging advance * 10 levels
        console.log("  Complete aging cycle:", maxTime, "days");
        if (maxTime >= 30) {
            console.log("  In months:", maxTime / 30, "months");
        }
    }
}
