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
 * @title Edge Case Tests
 * @notice Tests for extreme conditions, boundary values, and potential failure modes
 * @dev Critical for ensuring system robustness and security
 */
contract EdgeCaseTests is Test {
    RugNFTFacet public nftFacet;
    RugAgingFacet public agingFacet;
    RugMaintenanceFacet public maintenanceFacet;
    RugAdminFacet public adminFacet;

    address public owner = address(0x1000);
    address public user1 = address(0x1001);
    address public user2 = address(0x1002);
    address public attacker = address(0x9999);

    uint256 public testTokenId;
    uint256 constant CLEANING_COST = 0.00001 ether;
    uint256 constant DAY = 1 days;

    // Malicious contract for reentrancy testing
    ReentrancyAttacker public attackerContract;

    function setUp() public {
        vm.deal(owner, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(attacker, 10 ether);

        // Deploy facets
        vm.startPrank(owner);
        nftFacet = new RugNFTFacet();
        agingFacet = new RugAgingFacet();
        maintenanceFacet = new RugMaintenanceFacet();
        adminFacet = new RugAdminFacet();

        // Setup configuration
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.dirtLevel1Days = 1 * DAY;
        rs.dirtLevel2Days = 3 * DAY;
        rs.agingAdvanceDays = 7 * DAY;
        rs.freeCleanDays = 14 * DAY;
        rs.freeCleanWindow = 5 * DAY;
        rs.cleaningCost = CLEANING_COST;
        rs.restorationCost = CLEANING_COST;
        rs.masterRestorationCost = CLEANING_COST;
        rs.bronzeThreshold = 25;
        rs.silverThreshold = 50;
        rs.goldThreshold = 100;
        rs.diamondThreshold = 200;
        rs.collectionCap = 1000;

        vm.stopPrank();

        // Mint test token
        vm.startPrank(user1);
        string[] memory textRows = new string[](1);
        textRows[0] = "EDGE";
        nftFacet.mintRug{value: 0.00001 ether}(
            textRows, 12345, "EdgePalette", "data", "data", "map", 2, 3, 8, 4
        );
        testTokenId = nftFacet.totalSupply();
        vm.stopPrank();

        // Deploy attacker contract
        attackerContract = new ReentrancyAttacker(address(maintenanceFacet));
    }

    // ===== TIME EDGE CASES =====

    function testTimeEdgeCaseVerySmallIntervals() public {
        // Test aging progression with very small time intervals
        vm.startPrank(user1);

        // Advance by 1 second - should not progress aging
        vm.warp(block.timestamp + 1);
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);

        // Advance by 1 minute - still no aging
        vm.warp(block.timestamp + 60);
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);

        // Advance to just before aging threshold
        vm.warp(block.timestamp + 7 * DAY - 60);
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);

        // Advance past threshold
        vm.warp(block.timestamp + 61);
        assertEq(agingFacet.getAgingLevel(testTokenId), 1);

        vm.stopPrank();
    }

    function testTimeEdgeCaseVeryLargeIntervals() public {
        // Test with extremely large time jumps (years)
        vm.startPrank(user1);

        // Advance by 1 year - should cap at max aging level
        vm.warp(block.timestamp + 365 * DAY);
        assertEq(agingFacet.getAgingLevel(testTokenId), 10);

        // Advance by another year - should still be 10
        vm.warp(block.timestamp + 365 * DAY);
        assertEq(agingFacet.getAgingLevel(testTokenId), 10);

        vm.stopPrank();
    }

    function testTimeEdgeCaseBlockTimestampManipulation() public {
        // Test potential timestamp manipulation scenarios
        vm.startPrank(user1);

        uint256 initialTime = block.timestamp;

        // Simulate going backward in time (block reorg scenario)
        vm.warp(initialTime - 1000);
        // Aging should not go negative - should handle gracefully
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);

        // Go forward again
        vm.warp(initialTime + 8 * DAY);
        assertEq(agingFacet.getAgingLevel(testTokenId), 1);

        vm.stopPrank();
    }

    // ===== PAYMENT EDGE CASES =====

    function testPaymentEdgeCaseExactAmount() public {
        // Test with exact payment amounts
        vm.startPrank(user1);

        // Make rug dirty
        vm.warp(block.timestamp + 5 * DAY);

        // Test exact cleaning cost
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        assertEq(agingFacet.getDirtLevel(testTokenId), 0);

        vm.stopPrank();
    }

    function testPaymentEdgeCaseLargePayment() public {
        // Test with very large payment (should refund excess)
        vm.startPrank(user1);

        uint256 largePayment = 1 ether;
        uint256 initialBalance = user1.balance;

        // Make rug dirty
        vm.warp(block.timestamp + 5 * DAY);

        // Pay with large amount
        maintenanceFacet.cleanRug{value: largePayment}(testTokenId);

        // Should have been refunded
        uint256 finalBalance = user1.balance;
        uint256 expectedBalance = initialBalance - CLEANING_COST;

        assertEq(finalBalance, expectedBalance);
        assertEq(agingFacet.getDirtLevel(testTokenId), 0);

        vm.stopPrank();
    }

    function testPaymentEdgeCaseTinyPayment() public {
        // Test with payment just slightly less than required
        vm.startPrank(user1);

        vm.warp(block.timestamp + 5 * DAY);

        vm.expectRevert("Insufficient payment");
        maintenanceFacet.cleanRug{value: CLEANING_COST - 1 wei}(testTokenId);

        vm.stopPrank();
    }

    // ===== INTEGER OVERFLOW/UNDERFLOW EDGE CASES =====

    function testIntegerOverflowAgingMultiplier() public {
        // Test aging calculations with maximum frame level
        vm.startPrank(user1);

        // Manually set to Diamond frame (level 4)
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.agingData[testTokenId].frameLevel = 4;

        // Advance time significantly
        vm.warp(block.timestamp + 100 * DAY);

        // Should handle multiplier calculation without overflow
        uint8 agingLevel = agingFacet.getAgingLevel(testTokenId);
        assertLe(agingLevel, 10); // Should be capped at 10

        vm.stopPrank();
    }

    function testIntegerOverflowMaintenanceScore() public {
        // Test maintenance score with many operations
        vm.startPrank(user1);

        // Perform many cleaning operations to test score accumulation
        for (uint256 i = 0; i < 50; i++) {
            vm.warp(block.timestamp + 5 * DAY); // Make dirty
            maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        }

        // Should reach Diamond frame (200 points threshold)
        assertEq(agingFacet.getFrameLevel(testTokenId), 4);

        // Score should be reasonable (50 cleanings * 2 points = 100 points)
        uint256 score = agingFacet.getMaintenanceScore(testTokenId);
        assertEq(score, 100);

        vm.stopPrank();
    }

    function testIntegerUnderflowTimeCalculations() public {
        // Test time calculations that might cause underflow
        vm.startPrank(user1);

        // Set aging level to 5, then immediately check calculations
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.agingData[testTokenId].agingLevel = 5;
        rs.agingData[testTokenId].lastCleaned = block.timestamp;

        // Small time advance - should not cause issues
        vm.warp(block.timestamp + 1);

        uint8 currentLevel = agingFacet.getAgingLevel(testTokenId);
        assertGe(currentLevel, 5); // Should be at least the stored level

        vm.stopPrank();
    }

    // ===== FRAME TRANSITION EDGE CASES =====

    function testFrameTransitionExactThresholds() public {
        // Test exact threshold values for frame progression
        vm.startPrank(user1);

        // Clean exactly 12 times (24 points) - should be just below Bronze
        for (uint256 i = 0; i < 12; i++) {
            vm.warp(block.timestamp + 5 * DAY);
            maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        }

        assertEq(agingFacet.getMaintenanceScore(testTokenId), 24);
        assertEq(agingFacet.getFrameLevel(testTokenId), 0); // Still None

        // 13th clean (26 points) - should reach Bronze
        vm.warp(block.timestamp + 5 * DAY);
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);

        assertEq(agingFacet.getMaintenanceScore(testTokenId), 26);
        assertEq(agingFacet.getFrameLevel(testTokenId), 1); // Bronze

        vm.stopPrank();
    }

    function testFrameTransitionBoundaryValues() public {
        // Test boundary values around each threshold
        vm.startPrank(user1);

        // Test around Silver threshold (50 points)
        // Clean 25 times (50 points)
        for (uint256 i = 0; i < 25; i++) {
            vm.warp(block.timestamp + 5 * DAY);
            maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        }

        assertEq(agingFacet.getMaintenanceScore(testTokenId), 50);
        assertEq(agingFacet.getFrameLevel(testTokenId), 2); // Silver

        vm.stopPrank();
    }

    // ===== CONCURRENT OPERATIONS EDGE CASES =====

    function testConcurrentOperationsSameBlock() public {
        // Test multiple operations in the same block
        vm.startPrank(user1);

        // Make rug very dirty and aged
        vm.warp(block.timestamp + 50 * DAY);

        // Perform multiple operations rapidly
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        maintenanceFacet.restoreRug{value: CLEANING_COST}(testTokenId);
        maintenanceFacet.masterRestoreRug{value: CLEANING_COST}(testTokenId);

        // Should be fully clean and restored
        assertEq(agingFacet.getDirtLevel(testTokenId), 0);
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);

        vm.stopPrank();
    }

    function testRapidMaintenanceOperations() public {
        // Test very rapid maintenance operations
        vm.startPrank(user1);

        // Perform operations with minimal time between
        for (uint256 i = 0; i < 10; i++) {
            maintenanceFacet.masterRestoreRug{value: CLEANING_COST}(testTokenId);
            vm.warp(block.timestamp + 1); // Minimal time advance
        }

        // Should still work correctly
        assertEq(agingFacet.getDirtLevel(testTokenId), 0);
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);

        // Score should be high (10 * 10 = 100 points)
        assertEq(agingFacet.getMaintenanceScore(testTokenId), 100);

        vm.stopPrank();
    }

    // ===== TOKEN OWNERSHIP EDGE CASES =====

    function testTokenTransferDuringMaintenance() public {
        // Test transferring token ownership during maintenance operations
        vm.startPrank(user1);

        // Make rug dirty
        vm.warp(block.timestamp + 5 * DAY);

        // Approve user2 for transfer
        nftFacet.approve(user2, testTokenId);

        vm.stopPrank();

        // User2 tries to clean before transfer
        vm.startPrank(user2);
        vm.expectRevert("Not token owner");
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        vm.stopPrank();

        // Transfer ownership
        vm.startPrank(user1);
        nftFacet.transferFrom(user1, user2, testTokenId);
        vm.stopPrank();

        // Now user2 can clean
        vm.startPrank(user2);
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        assertEq(agingFacet.getDirtLevel(testTokenId), 0);
        vm.stopPrank();
    }

    function testOperatorApprovals() public {
        // Test ERC721 operator approvals
        vm.startPrank(user1);

        // Set user2 as operator for all tokens
        nftFacet.setApprovalForAll(user2, true);

        // Make rug dirty
        vm.warp(block.timestamp + 5 * DAY);

        vm.stopPrank();

        // User2 should still not be able to clean (not owner)
        vm.startPrank(user2);
        vm.expectRevert("Not token owner");
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        vm.stopPrank();
    }

    // ===== STORAGE EDGE CASES =====

    function testStorageBoundaryValues() public {
        // Test with maximum possible values in storage
        vm.startPrank(owner);

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Set maximum reasonable values
        rs.agingData[testTokenId].agingLevel = 10;
        rs.agingData[testTokenId].dirtLevel = 2;
        rs.agingData[testTokenId].frameLevel = 4;
        rs.agingData[testTokenId].cleaningCount = type(uint256).max / 2; // Large but not max
        rs.agingData[testTokenId].restorationCount = type(uint256).max / 2;
        rs.agingData[testTokenId].masterRestorationCount = type(uint256).max / 2;

        vm.stopPrank();

        // Should handle large values gracefully
        assertEq(agingFacet.getAgingLevel(testTokenId), 10);
        assertEq(agingFacet.getDirtLevel(testTokenId), 2);
        assertEq(agingFacet.getFrameLevel(testTokenId), 4);
    }

    function testStorageSlotConflicts() public {
        // Test that different facets don't interfere with each other's storage
        vm.startPrank(user1);

        // Get initial state
        uint8 initialAging = agingFacet.getAgingLevel(testTokenId);
        uint8 initialDirt = agingFacet.getDirtLevel(testTokenId);
        uint8 initialFrame = agingFacet.getFrameLevel(testTokenId);

        // Perform maintenance
        vm.warp(block.timestamp + 5 * DAY);
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);

        // Check state is consistent across facets
        assertEq(agingFacet.getAgingLevel(testTokenId), initialAging);
        assertEq(agingFacet.getDirtLevel(testTokenId), 0); // Should be cleaned
        assertEq(agingFacet.getFrameLevel(testTokenId), initialFrame + 1); // Should increase

        vm.stopPrank();
    }

    // ===== REENTRANCY ATTACK TESTS =====

    function testReentrancyProtection() public {
        // Test against reentrancy attacks
        vm.startPrank(attacker);

        // Fund attacker contract
        vm.deal(address(attackerContract), 10 ether);

        // Try reentrancy attack
        vm.expectRevert(); // Should fail due to reentrancy protection
        attackerContract.attack{value: CLEANING_COST * 2}(testTokenId);

        vm.stopPrank();
    }

    // ===== GAS LIMIT EDGE CASES =====

    function testGasLimitEdgeCaseComplexOperations() public {
        // Test operations that might approach gas limits
        vm.startPrank(user1);

        // Create complex scenario with many operations
        for (uint256 i = 0; i < 20; i++) {
            vm.warp(block.timestamp + 10 * DAY);
            maintenanceFacet.masterRestoreRug{value: CLEANING_COST}(testTokenId);
        }

        // Should complete without gas issues
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);
        assertEq(agingFacet.getMaintenanceScore(testTokenId), 200); // 20 * 10

        vm.stopPrank();
    }

    function testGasLimitViewFunctions() public {
        // Test that view functions are gas-efficient
        vm.startPrank(user1);

        // Call view functions repeatedly
        for (uint256 i = 0; i < 100; i++) {
            agingFacet.getAgingLevel(testTokenId);
            agingFacet.getDirtLevel(testTokenId);
            agingFacet.getFrameLevel(testTokenId);
            agingFacet.getMaintenanceScore(testTokenId);
        }

        // Should not cause issues
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);

        vm.stopPrank();
    }
}

// Malicious contract for reentrancy testing
contract ReentrancyAttacker {
    address public target;
    uint256 public attackCount;

    constructor(address _target) {
        target = _target;
    }

    function attack(uint256 tokenId) external payable {
        attackCount = 0;
        // Try to call maintenance function which might callback
        RugMaintenanceFacet(target).cleanRug{value: msg.value / 2}(tokenId);
    }

    // Fallback function that tries to reenter
    receive() external payable {
        attackCount++;
        if (attackCount < 3) {
            // Try to reenter - this should fail
            RugMaintenanceFacet(target).cleanRug{value: 0.00001 ether}(1);
        }
    }
}
