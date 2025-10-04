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

    // Aging thresholds in MINUTES (will be converted to seconds by contract)
    // [dirtLevel1Days, dirtLevel2Days, textureLevel1Days, textureLevel2Days, freeCleanDays, freeCleanWindow]

    // ULTRA FAST TEST SETTINGS (current)
    uint256[6] public TEST_THRESHOLDS = [
        1,   // dirtLevel1Days: 1 minute (light dirt)
        2,   // dirtLevel2Days: 2 minutes (heavy dirt, triggers neglect)
        3,   // textureLevel1Days: 3 minutes (texture level 1)
        5,   // textureLevel2Days: 5 minutes (texture level 2)
        1,   // freeCleanDays: 1 minute free after mint
        1    // freeCleanWindow: 1 minute free after cleaning
    ];

    // PRODUCTION SETTINGS (realistic)
    uint256[6] public PRODUCTION_THRESHOLDS = [
        4320,   // dirtLevel1Days: 3 days in minutes (light dirt)
        10080,  // dirtLevel2Days: 7 days in minutes (heavy dirt, triggers neglect)
        43200,  // textureLevel1Days: 30 days in minutes (texture level 1)
        129600, // textureLevel2Days: 90 days in minutes (texture level 2)
        720,    // freeCleanDays: 12 hours in minutes free after mint
        2880    // freeCleanWindow: 2 days in minutes free after cleaning
    ];

    // Choose which settings to use
    bool useProductionSettings = false; // Set to true for production, false for testing

    // =============================================

    // Helper function to read current aging thresholds from deployed contract
    function getCurrentThresholds() external view returns (uint256[6] memory) {
        address diamondAddr = DIAMOND_ADDRESS;
        (
            uint256 dirt1, uint256 dirt2, uint256 tex1, uint256 tex2,
            uint256 freeMint, uint256 freeAfter
        ) = RugAdminFacet(diamondAddr).getAgingThresholds();

        uint256[6] memory currentThresholds = [dirt1, dirt2, tex1, tex2, freeMint, freeAfter];

        console.log("=== CURRENT DEPLOYED THRESHOLDS (in minutes) ===");
        console.log("Dirt Level 1:", currentThresholds[0], "minutes");
        console.log("Dirt Level 2:", currentThresholds[1], "minutes");
        console.log("Texture Level 1:", currentThresholds[2], "minutes");
        console.log("Texture Level 2:", currentThresholds[3], "minutes");
        console.log("Free Clean (mint):", currentThresholds[4], "minutes");
        console.log("Free Clean (after):", currentThresholds[5], "minutes");

        console.log("");
        console.log("=== CONVERTED TO SECONDS ===");
        console.log("Dirt Level 1:", currentThresholds[0] * 60, "seconds");
        console.log("Dirt Level 2:", currentThresholds[1] * 60, "seconds");
        console.log("Texture Level 1:", currentThresholds[2] * 60, "seconds");
        console.log("Texture Level 2:", currentThresholds[3] * 60, "seconds");
        console.log("Free Clean (mint):", currentThresholds[4] * 60, "seconds");
        console.log("Free Clean (after):", currentThresholds[5] * 60, "seconds");

        return currentThresholds;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address diamondAddr = DIAMOND_ADDRESS;
        uint256[6] memory thresholds = useProductionSettings ? PRODUCTION_THRESHOLDS : TEST_THRESHOLDS;

        // First check current values
        console.log("=== CHECKING CURRENT DEPLOYED VALUES ===");
        (
            uint256 currDirt1, uint256 currDirt2, uint256 currTex1, uint256 currTex2,
            uint256 currFreeMint, uint256 currFreeAfter
        ) = RugAdminFacet(diamondAddr).getAgingThresholds();

        console.log("Current Dirt Level 1:", currDirt1, "minutes");
        console.log("Current Dirt Level 2:", currDirt2, "minutes");
        console.log("Current Texture Level 1:", currTex1, "minutes");
        console.log("Current Texture Level 2:", currTex2, "minutes");
        console.log("Current Free Clean (mint):", currFreeMint, "minutes");
        console.log("Current Free Clean (after):", currFreeAfter, "minutes");

        console.log("");
        console.log("=== UPDATING TO NEW VALUES ===");
        console.log("Target settings:", useProductionSettings ? "PRODUCTION" : "TEST");

        console.log("New Dirt Level 1:", thresholds[0], "minutes");
        console.log("New Dirt Level 2:", thresholds[1], "minutes");
        console.log("New Texture Level 1:", thresholds[2], "minutes");
        console.log("New Texture Level 2:", thresholds[3], "minutes");
        console.log("New Free Clean (mint):", thresholds[4], "minutes");
        console.log("New Free Clean (after clean):", thresholds[5], "minutes");

        RugAdminFacet(diamondAddr).updateAgingThresholds(thresholds);

        console.log("Aging thresholds updated successfully!");

        vm.stopBroadcast();
    }

    // Helper function to preview what the script will do
    function previewSettings() external view {
        uint256[6] memory thresholds = useProductionSettings ? PRODUCTION_THRESHOLDS : TEST_THRESHOLDS;

        console.log("=== AGING THRESHOLDS PREVIEW ===");
        console.log("Mode:", useProductionSettings ? "PRODUCTION" : "TEST");
        console.log("Contract:", DIAMOND_ADDRESS);
        console.log("");

        console.log("Dirt Accumulation:");
        console.log("  Level 1 (light):", thresholds[0], "minutes");
        console.log("  Level 2 (heavy):", thresholds[1], "minutes");
        console.log("");

        console.log("Texture Aging:");
        console.log("  Level 1:", thresholds[2], "minutes");
        console.log("  Level 2:", thresholds[3], "minutes");
        console.log("");

        console.log("Free Cleaning Windows:");
        console.log("  After mint:", thresholds[4], "minutes");
        console.log("  After clean:", thresholds[5], "minutes");
        console.log("");

        console.log("Expected Timeline:");
        uint256 maxTime = thresholds[3]; // texture level 2
        console.log("  Complete aging cycle:", maxTime, "minutes");
        if (maxTime >= 60) {
            console.log("  In hours:", maxTime / 60, "hours");
        }
        if (maxTime >= 1440) {
            console.log("  In days:", maxTime / 1440, "days");
        }
    }
}
