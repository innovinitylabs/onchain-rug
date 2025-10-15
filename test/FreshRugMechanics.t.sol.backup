// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugAgingFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/libraries/LibRugStorage.sol";

/**
 * @title FreshRugMechanics Test Suite
 * @notice Comprehensive automated testing for the fresh rug mechanics redesign
 * @dev Tests dirt (3 levels), aging (11 levels), frames (5 levels) with accelerated time
 */
contract FreshRugMechanicsTest is Test {
    // Deployed contract addresses (update with actual deployment)
    address public constant DIAMOND_ADDR = address(0x123); // Placeholder - update with real address

    // Test accounts
    address public user1 = address(0x1001);
    address public user2 = address(0x1002);

    // Test token ID
    uint256 public testTokenId;

    // Test configuration
    uint256 public constant CLEANING_COST = 0.00001 ether;
    uint256 public constant RESTORATION_COST = 0.00001 ether;
    uint256 public constant MASTER_COST = 0.00001 ether;

    // Time acceleration for testing (convert days to seconds)
    uint256 public constant DAY = 1 days;
    uint256 public constant HOUR = 1 hours;

    function setUp() public {
        // Fund test accounts
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);

        // Set up initial configuration
        _setupTestConfiguration();

        // Mint a test rug
        _mintTestRug();
    }

    function _setupTestConfiguration() internal {
        vm.startPrank(DIAMOND_ADDR); // Simulate owner

        // Set aging thresholds for fast testing
        uint256[5] memory thresholds = [
            uint256(1 * DAY),  // dirtLevel1Days: 1 day
            uint256(3 * DAY),  // dirtLevel2Days: 3 days
            uint256(7 * DAY),  // agingAdvanceDays: 7 days
            uint256(14 * DAY), // freeCleanDays: 14 days
            uint256(5 * DAY)   // freeCleanWindow: 5 days
        ];

        RugAdminFacet(DIAMOND_ADDR).updateAgingThresholds(thresholds);

        // Set maintenance costs
        uint256[4] memory prices = [CLEANING_COST, RESTORATION_COST, MASTER_COST, 0.00001 ether];
        RugAdminFacet(DIAMOND_ADDR).updateServicePricing(prices);

        vm.stopPrank();
    }

    function _mintTestRug() internal {
        vm.startPrank(user1);

        string[] memory textRows = new string[](3);
        textRows[0] = "HELLO";
        textRows[1] = "WORLD";
        textRows[2] = "TEST";

        RugNFTFacet.VisualConfig memory visual = RugNFTFacet.VisualConfig({
            warpThickness: 3,
            stripeCount: 5
        });

        RugNFTFacet.ArtData memory art = RugNFTFacet.ArtData({
            paletteName: "TestPalette",
            minifiedPalette: "minifiedPaletteData",
            minifiedStripeData: "minifiedStripeData",
            filteredCharacterMap: "characterMap"
        });

        RugNFTFacet(DIAMOND_ADDR).mintRug{value: 0.00001 ether}(
            textRows,
            12345,
            visual,
            art,
            4, // complexity
            10 // characterCount
        );

        // For testing, assume token ID 1 (first mint)
        testTokenId = 1;
        vm.stopPrank();
    }

    // ===== DIRT SYSTEM TESTS (3 Levels) =====

    function testInitialState() public {
        // Fresh rug should start clean
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 0);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 0);

        // Should show no dirt
        assertFalse(RugAgingFacet(DIAMOND_ADDR).hasDirt(testTokenId));
    }

    function testDirtProgression() public {
        // Test progression through all dirt levels
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);

        // Advance to dirt level 1 (1 day)
        vm.warp(block.timestamp + 1 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 1);
        assertTrue(RugAgingFacet(DIAMOND_ADDR).hasDirt(testTokenId));

        // Advance to dirt level 2 (3 days total)
        vm.warp(block.timestamp + 2 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 2);
        assertTrue(RugAgingFacet(DIAMOND_ADDR).hasDirt(testTokenId));
    }

    function testDirtImmunityWithFrames() public {
        // Advance to very dirty
        vm.warp(block.timestamp + 5 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 2);

        // Earn Silver frame (50 points needed)
        _earnMaintenancePoints(50);

        // Silver frame should provide dirt immunity
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);
        assertFalse(RugAgingFacet(DIAMOND_ADDR).hasDirt(testTokenId));
    }

    // ===== AGING SYSTEM TESTS (11 Levels: 0-10) =====

    function testAgingProgression() public {
        // Test progression through aging levels
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 0);

        // Advance through each aging level
        for (uint8 level = 1; level <= 10; level++) {
            vm.warp(block.timestamp + 7 * DAY);
            assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), level);
        }

        // Should cap at level 10
        vm.warp(block.timestamp + 7 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 10);
    }

    function testAgingResetOnMasterRestore() public {
        // Advance to aging level 5
        vm.warp(block.timestamp + 35 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 5);

        // Master restore should reset aging to 0
        vm.startPrank(user1);
        RugMaintenanceFacet(DIAMOND_ADDR).masterRestoreRug{value: MASTER_COST}(testTokenId);
        vm.stopPrank();

        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 0);
    }

    // ===== FRAME SYSTEM TESTS (5 Levels) =====

    function testFrameProgression() public {
        // Start with no frame
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 0);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameName(testTokenId), "None");

        // Earn Bronze frame (25 points)
        _earnMaintenancePoints(25);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 1);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameName(testTokenId), "Bronze");

        // Earn Silver frame (50 points)
        _earnMaintenancePoints(25); // Additional 25 for total 50
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 2);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameName(testTokenId), "Silver");

        // Earn Gold frame (100 points)
        _earnMaintenancePoints(50); // Additional 50 for total 100
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 3);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameName(testTokenId), "Gold");

        // Earn Diamond frame (200 points)
        _earnMaintenancePoints(100); // Additional 100 for total 200
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 4);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameName(testTokenId), "Diamond");
    }

    // ===== MAINTENANCE ACTION TESTS =====

    function testCleaningAction() public {
        // Advance to very dirty
        vm.warp(block.timestamp + 5 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 2);

        // Clean the rug
        vm.startPrank(user1);
        RugMaintenanceFacet(DIAMOND_ADDR).cleanRug{value: CLEANING_COST}(testTokenId);
        vm.stopPrank();

        // Should be clean again
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);
        assertFalse(RugAgingFacet(DIAMOND_ADDR).hasDirt(testTokenId));

        // Should earn maintenance points
        assertGt(RugAgingFacet(DIAMOND_ADDR).getMaintenanceScore(testTokenId), 0);
    }

    function testRestorationAction() public {
        // Advance to aging level 3
        vm.warp(block.timestamp + 21 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 3);

        // Restore aging
        vm.startPrank(user1);
        RugMaintenanceFacet(DIAMOND_ADDR).restoreRug{value: RESTORATION_COST}(testTokenId);
        vm.stopPrank();

        // Should reduce aging by 1
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 2);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0); // Also cleans dirt
    }

    function testMasterRestorationAction() public {
        // Advance to dirty and aged
        vm.warp(block.timestamp + 10 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 2);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 1);

        // Master restore
        vm.startPrank(user1);
        RugMaintenanceFacet(DIAMOND_ADDR).masterRestoreRug{value: MASTER_COST}(testTokenId);
        vm.stopPrank();

        // Should reset everything
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 0);
    }

    function testFreeCleaningWindows() public {
        // Initial free cleaning period (14 days after mint)
        assertTrue(RugAgingFacet(DIAMOND_ADDR).isCleaningFree(testTokenId));

        // After free period, should require payment
        vm.warp(block.timestamp + 15 * DAY);
        assertFalse(RugAgingFacet(DIAMOND_ADDR).isCleaningFree(testTokenId));

        // Clean the rug
        vm.startPrank(user1);
        RugMaintenanceFacet(DIAMOND_ADDR).cleanRug{value: CLEANING_COST}(testTokenId);
        vm.stopPrank();

        // Should have free window again (5 days)
        assertTrue(RugAgingFacet(DIAMOND_ADDR).isCleaningFree(testTokenId));

        // After free window expires
        vm.warp(block.timestamp + 6 * DAY);
        assertFalse(RugAgingFacet(DIAMOND_ADDR).isCleaningFree(testTokenId));
    }

    // ===== COST AND AVAILABILITY TESTS =====

    function testMaintenanceCosts() public {
        // Test cleaning costs
        assertEq(RugMaintenanceFacet(DIAMOND_ADDR).getCleaningCost(testTokenId), CLEANING_COST);

        // Test restoration costs
        vm.warp(block.timestamp + 10 * DAY); // Create aging to restore
        assertEq(RugMaintenanceFacet(DIAMOND_ADDR).getRestorationCost(testTokenId), RESTORATION_COST);

        // Test master restoration costs
        assertEq(RugMaintenanceFacet(DIAMOND_ADDR).getMasterRestorationCost(testTokenId), MASTER_COST);
    }

    function testMaintenanceAvailability() public {
        // Initially no cleaning needed (clean rug)
        assertFalse(RugMaintenanceFacet(DIAMOND_ADDR).canCleanRug(testTokenId));

        // After getting dirty
        vm.warp(block.timestamp + 2 * DAY);
        assertTrue(RugMaintenanceFacet(DIAMOND_ADDR).canCleanRug(testTokenId));

        // Initially no restoration available (no aging)
        assertFalse(RugMaintenanceFacet(DIAMOND_ADDR).canRestoreRug(testTokenId));

        // After aging
        vm.warp(block.timestamp + 10 * DAY);
        assertTrue(RugMaintenanceFacet(DIAMOND_ADDR).canRestoreRug(testTokenId));
    }

    // ===== TIME PREDICTION TESTS =====

    function testTimePredictions() public {
        // Test dirt progression timing
        uint256 timeToDirt1 = RugAgingFacet(DIAMOND_ADDR).timeUntilNextDirt(testTokenId);
        assertEq(timeToDirt1, 1 * DAY); // Should take 1 day to become dirty

        // Advance to dirt level 1
        vm.warp(block.timestamp + 1 * DAY);
        uint256 timeToDirt2 = RugAgingFacet(DIAMOND_ADDR).timeUntilNextDirt(testTokenId);
        assertEq(timeToDirt2, 2 * DAY); // Should take 2 more days to very dirty

        // Test aging progression timing
        uint256 timeToAging1 = RugAgingFacet(DIAMOND_ADDR).timeUntilNextAging(testTokenId);
        assertEq(timeToAging1, 7 * DAY); // Should take 7 days to level 1
    }

    // ===== EDGE CASE TESTS =====

    function testMaxAgingLevel() public {
        // Advance to max aging level
        vm.warp(block.timestamp + 80 * DAY); // More than enough time
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 10);

        // Further time should not increase beyond 10
        vm.warp(block.timestamp + 20 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 10);

        // Time prediction should return 0 for maxed aging
        assertEq(RugAgingFacet(DIAMOND_ADDR).timeUntilNextAging(testTokenId), 0);
    }

    function testRestorationAtMaxAging() public {
        // Advance to max aging
        vm.warp(block.timestamp + 80 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 10);

        // Restore should reduce from 10 to 9
        vm.startPrank(user1);
        RugMaintenanceFacet(DIAMOND_ADDR).restoreRug{value: RESTORATION_COST}(testTokenId);
        vm.stopPrank();

        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 9);
    }

    function testRestorationAtZeroAging() public {
        // Try to restore when aging is 0
        vm.startPrank(user1);
        vm.expectRevert("Rug has no aging to restore");
        RugMaintenanceFacet(DIAMOND_ADDR).restoreRug{value: RESTORATION_COST}(testTokenId);
        vm.stopPrank();
    }

    function testCleaningWhenNotNeeded() public {
        // Try to clean when rug is clean and no free window
        vm.warp(block.timestamp + 15 * DAY); // Past free period
        vm.startPrank(user1);
        vm.expectRevert("Rug doesn't need cleaning right now");
        RugMaintenanceFacet(DIAMOND_ADDR).cleanRug{value: CLEANING_COST}(testTokenId);
        vm.stopPrank();
    }

    function testUnauthorizedMaintenance() public {
        // Try to maintain with wrong owner
        vm.startPrank(user2);
        vm.expectRevert("Not token owner");
        RugMaintenanceFacet(DIAMOND_ADDR).cleanRug(testTokenId);
        vm.stopPrank();
    }

    function testInsufficientPayment() public {
        // Advance to dirty
        vm.warp(block.timestamp + 2 * DAY);

        // Try to clean with insufficient payment
        vm.startPrank(user1);
        vm.expectRevert("Insufficient payment");
        RugMaintenanceFacet(DIAMOND_ADDR).cleanRug{value: CLEANING_COST - 1}(testTokenId);
        vm.stopPrank();
    }

    // ===== INTEGRATION TESTS =====

    function testCompleteMaintenanceCycle() public {
        // Start with clean rug
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 0);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 0);

        // Let it age and get dirty
        vm.warp(block.timestamp + 50 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 2);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 7);

        // Perform maintenance actions
        vm.startPrank(user1);

        // Clean dirt
        RugMaintenanceFacet(DIAMOND_ADDR).cleanRug{value: CLEANING_COST}(testTokenId);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);

        // Restore aging multiple times
        for (uint256 i = 0; i < 5; i++) {
            RugMaintenanceFacet(DIAMOND_ADDR).restoreRug{value: RESTORATION_COST}(testTokenId);
        }
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 2);

        // Master restore to reset everything
        RugMaintenanceFacet(DIAMOND_ADDR).masterRestoreRug{value: MASTER_COST}(testTokenId);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getAgingLevel(testTokenId), 0);

        vm.stopPrank();

        // Should have earned significant maintenance points
        assertGe(RugAgingFacet(DIAMOND_ADDR).getMaintenanceScore(testTokenId), 35); // 2 + 5*5 + 10
    }

    // ===== HELPER FUNCTIONS =====

    function _earnMaintenancePoints(uint256 targetPoints) internal {
        vm.startPrank(user1);

        uint256 currentScore = RugAgingFacet(DIAMOND_ADDR).getMaintenanceScore(testTokenId);
        uint256 pointsNeeded = targetPoints - currentScore;

        // Each cleaning gives 2 points
        uint256 cleaningsNeeded = (pointsNeeded + 1) / 2; // Round up

        // Make rug dirty first if needed
        vm.warp(block.timestamp + 5 * DAY);

        for (uint256 i = 0; i < cleaningsNeeded; i++) {
            RugMaintenanceFacet(DIAMOND_ADDR).cleanRug{value: CLEANING_COST}(testTokenId);
        }

        vm.stopPrank();
    }

    function testFrameImmunityPersistence() public {
        // Advance to very dirty
        vm.warp(block.timestamp + 5 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 2);

        // Earn Silver frame
        _earnMaintenancePoints(50);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 2);

        // Should remain immune even after more time
        vm.warp(block.timestamp + 10 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);

        // Gold and Diamond should also provide immunity
        _earnMaintenancePoints(50); // Additional for Gold
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 3);

        _earnMaintenancePoints(100); // Additional for Diamond
        assertEq(RugAgingFacet(DIAMOND_ADDR).getFrameLevel(testTokenId), 4);

        // Diamond should still provide immunity
        vm.warp(block.timestamp + 10 * DAY);
        assertEq(RugAgingFacet(DIAMOND_ADDR).getDirtLevel(testTokenId), 0);
    }
}
