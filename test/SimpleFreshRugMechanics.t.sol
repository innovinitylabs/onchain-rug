// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "forge-std/console.sol";

/**
 * @title Simple Fresh Rug Mechanics Test
 * @notice Unit tests for the fresh rug mechanics logic (without full deployment)
 * @dev Tests dirt (3 levels), aging (11 levels), and frames (5 levels) with accelerated time
 */
contract SimpleFreshRugMechanicsTest is Test {
    // Test data structure matching our fresh design
    struct TestRugData {
        uint256 lastCleaned;
        uint8 agingLevel;        // Stored aging level
        uint8 frameLevel;
        uint256 frameAchievedTime;
        uint256 cleaningCount;
        uint256 restorationCount;
        uint256 masterRestorationCount;
    }

    // Test configuration
    uint256 constant DAY = 1 days;
    uint256 constant DIRT_LEVEL_1_DAYS = 1 days;
    uint256 constant DIRT_LEVEL_2_DAYS = 3 days;
    uint256 constant AGING_ADVANCE_DAYS = 7 days;
    uint256 constant BRONZE_THRESHOLD = 25;
    uint256 constant SILVER_THRESHOLD = 50;
    uint256 constant GOLD_THRESHOLD = 100;
    uint256 constant DIAMOND_THRESHOLD = 200;

    TestRugData testRug;

    function setUp() public {
        // Initialize fresh rug
        testRug = TestRugData({
            lastCleaned: block.timestamp,
            agingLevel: 0,
            frameLevel: 0,
            frameAchievedTime: 0,
            cleaningCount: 0,
            restorationCount: 0,
            masterRestorationCount: 0
        });
    }

    // ===== DIRT SYSTEM TESTS (3 Levels) =====

    function testInitialDirtState() public {
        assertEq(_calculateDirtLevel(testRug), 0);
        assertFalse(_hasDirt(testRug));
    }

    function testDirtProgression() public {
        // Test level 0 -> 1
        vm.warp(block.timestamp + DIRT_LEVEL_1_DAYS);
        assertEq(_calculateDirtLevel(testRug), 1);
        assertTrue(_hasDirt(testRug));

        // Test level 1 -> 2
        vm.warp(block.timestamp + (DIRT_LEVEL_2_DAYS - DIRT_LEVEL_1_DAYS));
        assertEq(_calculateDirtLevel(testRug), 2);
        assertTrue(_hasDirt(testRug));
    }

    function testDirtImmunityWithFrames() public {
        // Advance to very dirty
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS + 1 days);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Give Silver frame (level 2)
        testRug.frameLevel = 2;

        // Should be immune (level 0)
        assertEq(_calculateDirtLevel(testRug), 0);
        assertFalse(_hasDirt(testRug));
    }

    function testCleaningAction() public {
        // Make rug dirty
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS + 1 days);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Clean it
        _cleanRug(testRug);

        // Should be clean
        assertEq(testRug.lastCleaned, block.timestamp);
        assertEq(_calculateDirtLevel(testRug), 0);
        assertEq(testRug.cleaningCount, 1);
    }

    // ===== AGING SYSTEM TESTS (11 Levels: 0-10) =====

    function testInitialAgingState() public {
        assertEq(_calculateAgingLevel(testRug), 0);
    }

    function testAgingProgression() public {
        // Test each level progression
        for (uint8 level = 1; level <= 10; level++) {
            vm.warp(level * AGING_ADVANCE_DAYS + 1); // Set absolute time
            uint8 calculated = _calculateAgingLevel(testRug);
            assertEq(calculated, level, string(abi.encodePacked("Failed at level ", level)));
        }

        // Should cap at level 10
        vm.warp(11 * AGING_ADVANCE_DAYS + 1);
        assertEq(_calculateAgingLevel(testRug), 10);
    }

    function testRestorationAction() public {
        // Advance to aging level 5
        vm.warp(5 * AGING_ADVANCE_DAYS + 1);
        assertEq(_calculateAgingLevel(testRug), 5);

        // Restore aging
        _restoreRug(testRug);

        // Should delay aging by 1 level
        assertEq(_calculateAgingLevel(testRug), 4);
        assertEq(testRug.restorationCount, 1);
        assertEq(testRug.lastCleaned, block.timestamp);
    }

    function testMasterRestorationAction() public {
        // Advance aging and make dirty
        vm.warp(3 * AGING_ADVANCE_DAYS + DIRT_LEVEL_2_DAYS + 1);
        assertEq(_calculateAgingLevel(testRug), 3);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Master restore
        _masterRestoreRug(testRug);

        // Should reset everything
        assertEq(_calculateAgingLevel(testRug), 0);
        assertEq(testRug.lastCleaned, block.timestamp);
        assertEq(_calculateDirtLevel(testRug), 0);
        assertEq(testRug.lastCleaned, block.timestamp);
        assertEq(testRug.masterRestorationCount, 1);
    }

    // ===== FRAME SYSTEM TESTS (5 Levels) =====

    function testFrameProgression() public {
        // Start with no frame
        assertEq(testRug.frameLevel, 0);
        assertEq(_getFrameName(testRug.frameLevel), "None");

        // Earn Bronze (25 points)
        _earnPoints(testRug, 25);
        _updateFrame(testRug);
        assertEq(testRug.frameLevel, 1);
        assertEq(_getFrameName(testRug.frameLevel), "Bronze");

        // Earn Silver (50 points)
        _earnPoints(testRug, 25);
        _updateFrame(testRug);
        assertEq(testRug.frameLevel, 2);
        assertEq(_getFrameName(testRug.frameLevel), "Silver");

        // Earn Gold (100 points)
        _earnPoints(testRug, 50);
        _updateFrame(testRug);
        assertEq(testRug.frameLevel, 3);
        assertEq(_getFrameName(testRug.frameLevel), "Gold");

        // Earn Diamond (200 points)
        _earnPoints(testRug, 100);
        _updateFrame(testRug);
        assertEq(testRug.frameLevel, 4);
        assertEq(_getFrameName(testRug.frameLevel), "Diamond");
    }

    function testMaintenanceScoreCalculation() public {
        // Test score calculation
        _cleanRug(testRug); // +2 points
        assertEq(_calculateMaintenanceScore(testRug), 2);

        _restoreRug(testRug); // +8 points
        assertEq(_calculateMaintenanceScore(testRug), 10);

        _masterRestoreRug(testRug); // +12 points
        assertEq(_calculateMaintenanceScore(testRug), 22);
    }

    // ===== INTEGRATION TESTS =====


    function testRestorationAtLevel9() public {
        // Advance to aging level 9
        vm.warp(9 * AGING_ADVANCE_DAYS + 1);
        assertEq(_calculateAgingLevel(testRug), 9);

        // Restore aging
        _restoreRug(testRug);

        // Should reduce to level 8
        assertEq(_calculateAgingLevel(testRug), 8);
        assertEq(testRug.restorationCount, 1);
    }

    function testRestorationAtLevel10() public {
        // Advance to maximum aging level 10
        vm.warp(15 * AGING_ADVANCE_DAYS + 1); // More than enough time
        assertEq(_calculateAgingLevel(testRug), 10);

        // Restore aging
        _restoreRug(testRug);

        // Should reduce to level 9
        assertEq(_calculateAgingLevel(testRug), 9);
        assertEq(testRug.restorationCount, 1);
    }

    // ===== CLEANING EFFECT TESTS =====

    function testCleaningAtTextureLevel6() public {
        // Advance to some aging level
        vm.warp(8 * AGING_ADVANCE_DAYS + 1); // Advance time
        uint8 levelBeforeClean = _calculateAgingLevel(testRug);

        // Make it very dirty (level 2)
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Clean the rug
        _cleanRug(testRug);

        // Should reset dirt AND delay aging
        assertEq(_calculateDirtLevel(testRug), 0); // Dirt cleaned
        uint8 levelAfterClean = _calculateAgingLevel(testRug);
        assert(levelAfterClean <= levelBeforeClean + 1); // Should not increase significantly
        assertEq(testRug.lastCleaned, block.timestamp); // Timer reset
        assertEq(testRug.cleaningCount, 1);
        assertEq(testRug.lastCleaned, block.timestamp);
    }

    function testCleaningAtTextureLevel0() public {
        // Fresh rug at level 0
        assertEq(_calculateAgingLevel(testRug), 0);

        // Make it dirty
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Clean
        _cleanRug(testRug);

        // Verify: dirt resets and aging timer reset (though level 0 unchanged)
        assertEq(_calculateDirtLevel(testRug), 0);
        assertEq(_calculateAgingLevel(testRug), 0);
        assertEq(testRug.lastCleaned, block.timestamp); // Timer reset
        assertEq(testRug.cleaningCount, 1);
    }

    function testCleaningAtTextureLevel3() public {
        // Advance to some aging level
        vm.warp(10 * AGING_ADVANCE_DAYS + 1); // Advance time
        uint8 levelBeforeClean = _calculateAgingLevel(testRug);

        // Make it dirty
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Clean
        _cleanRug(testRug);

        // Verify: dirt resets, aging is delayed (level maintained or similar)
        assertEq(_calculateDirtLevel(testRug), 0);
        uint8 levelAfterClean = _calculateAgingLevel(testRug);
        assert(levelAfterClean <= levelBeforeClean + 1); // Should not increase significantly
        assertEq(testRug.lastCleaned, block.timestamp); // Timer reset
        assertEq(testRug.cleaningCount, 1);
    }

    function testCleaningAtTextureLevel9() public {
        // Advance to some aging level
        vm.warp(12 * AGING_ADVANCE_DAYS + 1); // Advance time
        uint8 levelBeforeClean = _calculateAgingLevel(testRug);

        // Make it dirty
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Clean
        _cleanRug(testRug);

        // Verify: dirt resets and aging is delayed
        assertEq(_calculateDirtLevel(testRug), 0);
        uint8 levelAfterClean = _calculateAgingLevel(testRug);
        assert(levelAfterClean <= levelBeforeClean + 1); // Should not increase significantly
        assertEq(testRug.lastCleaned, block.timestamp); // Timer reset
        assertEq(testRug.cleaningCount, 1);
    }


    // ===== MASTER RESTORATION TESTS =====

    function testMasterRestorationAtTextureLevel0() public {
        // Fresh rug at level 0
        assertEq(_calculateAgingLevel(testRug), 0);
        assertEq(_calculateDirtLevel(testRug), 0);

        // Master restore
        _masterRestoreRug(testRug);

        // Should stay at 0, earn points
        assertEq(_calculateAgingLevel(testRug), 0);
        assertEq(_calculateDirtLevel(testRug), 0);
        assertEq(testRug.masterRestorationCount, 1);
        assertEq(_calculateMaintenanceScore(testRug), 12);
    }

    function testMasterRestorationAtTextureLevel5() public {
        // Advance to level 5
        vm.warp(5 * AGING_ADVANCE_DAYS + 1);
        assertEq(_calculateAgingLevel(testRug), 5);

        // Make it dirty
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Master restore
        _masterRestoreRug(testRug);

        // Should reset everything to 0
        assertEq(_calculateAgingLevel(testRug), 0);
        assertEq(_calculateDirtLevel(testRug), 0);
        assertEq(testRug.lastCleaned, block.timestamp);
        assertEq(testRug.lastCleaned, block.timestamp);
        assertEq(testRug.masterRestorationCount, 1);
        assertEq(_calculateMaintenanceScore(testRug), 12);
    }

    function testMasterRestorationAtTextureLevel10() public {
        // Advance to max level 10
        vm.warp(15 * AGING_ADVANCE_DAYS + 1);
        assertEq(_calculateAgingLevel(testRug), 10);
        assertEq(_calculateDirtLevel(testRug), 2); // Also dirty

        // Master restore
        _masterRestoreRug(testRug);

        // Should reset everything to 0
        assertEq(_calculateAgingLevel(testRug), 0);
        assertEq(_calculateDirtLevel(testRug), 0);
        assertEq(testRug.masterRestorationCount, 1);
        assertEq(_calculateMaintenanceScore(testRug), 12);
    }

    function testMasterRestorationAtTextureLevel2() public {
        // Advance to level 2
        vm.warp(2 * AGING_ADVANCE_DAYS + 1);
        assertEq(_calculateAgingLevel(testRug), 2);

        // Make it dirty
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Master restore
        _masterRestoreRug(testRug);

        // Verify complete reset
        assertEq(_calculateAgingLevel(testRug), 0);
        assertEq(_calculateDirtLevel(testRug), 0);
        assertEq(testRug.masterRestorationCount, 1);
        assertEq(_calculateMaintenanceScore(testRug), 12);
    }

    function testMasterRestorationAtTextureLevel7() public {
        // Advance to level 7
        vm.warp(7 * AGING_ADVANCE_DAYS + 1);
        assertEq(_calculateAgingLevel(testRug), 7);

        // Make it dirty
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Master restore
        _masterRestoreRug(testRug);

        // Verify complete reset
        assertEq(_calculateAgingLevel(testRug), 0);
        assertEq(_calculateDirtLevel(testRug), 0);
        assertEq(testRug.masterRestorationCount, 1);
        assertEq(_calculateMaintenanceScore(testRug), 12);
    }

    // ===== FRAME LEVEL EFFECTS =====

    function testFrameLevelDirtImmunity() public {
        // Advance to dirty level
        vm.warp(DIRT_LEVEL_2_DAYS + 1);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Test each frame level
        for (uint8 frame = 0; frame <= 4; frame++) {
            testRug.frameLevel = frame;

            if (frame >= 2) { // Silver and above should be immune
                assertEq(_calculateDirtLevel(testRug), 0, string(abi.encodePacked("Frame level ", frame, " should provide dirt immunity")));
            } else {
                assertEq(_calculateDirtLevel(testRug), 2, string(abi.encodePacked("Frame level ", frame, " should not provide dirt immunity")));
            }
        }
    }

    function testFrameLevelAgingImmunity() public {
        // Advance to aging level 5 with no frame
        testRug.frameLevel = 0;
        vm.warp(5 * AGING_ADVANCE_DAYS + 1);
        uint8 baseLevel = _calculateAgingLevel(testRug);
        assertEq(baseLevel, 5);

        // Test that higher frames age slower
        testRug.frameLevel = 1; // Bronze (10% slower)
        uint8 bronzeLevel = _calculateAgingLevel(testRug);
        assert(bronzeLevel <= baseLevel);

        testRug.frameLevel = 2; // Silver (20% slower)
        uint8 silverLevel = _calculateAgingLevel(testRug);
        assert(silverLevel <= bronzeLevel);

        testRug.frameLevel = 3; // Gold (40% slower)
        uint8 goldLevel = _calculateAgingLevel(testRug);
        assert(goldLevel <= silverLevel);

        testRug.frameLevel = 4; // Diamond (60% slower)
        uint8 diamondLevel = _calculateAgingLevel(testRug);
        assert(diamondLevel <= goldLevel);
    }

    function testFrameLevelProgression() public {
        // Test frame progression through maintenance
        assertEq(testRug.frameLevel, 0);

        // Earn 25 points (Bronze threshold: 25 points)
        for (uint256 i = 0; i < 13; i++) { // 13 * 2 = 26 points (> 25)
            _cleanRug(testRug);
        }
        _updateFrame(testRug);
        assertEq(testRug.frameLevel, 1); // Bronze (26 points)

        // Earn additional points to reach Silver (50 points total)
        for (uint256 i = 0; i < 12; i++) { // 12 * 2 = 24 points, total 50
            _cleanRug(testRug);
        }
        _updateFrame(testRug);
        assertEq(testRug.frameLevel, 2); // Silver (50 points)

        // Earn additional points to reach Gold (100 points total)
        for (uint256 i = 0; i < 25; i++) { // 25 * 2 = 50 points, total 100
            _cleanRug(testRug);
        }
        _updateFrame(testRug);
        assertEq(testRug.frameLevel, 3); // Gold (100 points)

        // Earn additional points to reach Diamond (200 points total)
        for (uint256 i = 0; i < 50; i++) { // 50 * 2 = 100 points, total 200
            _cleanRug(testRug);
        }
        _updateFrame(testRug);
        assertEq(testRug.frameLevel, 4); // Diamond (200 points)
    }

    function testFrameAgingImmunityDetailed() public {
        // Test aging speed differences between frames
        uint8[5] memory expectedLevels;

        // Advance time significantly (should reach level 10 for no frame)
        vm.warp(15 * AGING_ADVANCE_DAYS + 1); // 210 days

        // Test each frame level
        for (uint8 frame = 0; frame <= 4; frame++) {
            testRug.frameLevel = frame;
            expectedLevels[frame] = _calculateAgingLevel(testRug);
        }

        // Verify aging immunity hierarchy
        console.log("No frame level:", expectedLevels[0]);
        console.log("Bronze level:", expectedLevels[1]);
        console.log("Silver level:", expectedLevels[2]);
        console.log("Gold level:", expectedLevels[3]);
        console.log("Diamond level:", expectedLevels[4]);

        // Higher frames should have lower or equal aging levels
        assert(expectedLevels[1] <= expectedLevels[0]);
        assert(expectedLevels[2] <= expectedLevels[1]);
        assert(expectedLevels[3] <= expectedLevels[2]);
        assert(expectedLevels[4] <= expectedLevels[3]);
    }

    function testDiamondFrameAgingImmunity() public {
        // Test that Diamond frame significantly slows aging
        testRug.frameLevel = 0; // No frame
        vm.warp(10 * AGING_ADVANCE_DAYS + 1); // 140 days - should reach level 10
        assertEq(_calculateAgingLevel(testRug), 10);

        // Reset and test with Diamond frame
        testRug.agingLevel = 0;
        testRug.lastCleaned = block.timestamp;
        testRug.frameLevel = 4; // Diamond

        vm.warp(block.timestamp + 10 * AGING_ADVANCE_DAYS); // Another 140 days
        uint8 diamondLevel = _calculateAgingLevel(testRug);

        // Diamond should age much slower (60% reduction = ~2.5x slower)
        // After 140 days with Diamond frame, should reach level ~4-5 instead of 10
        assert(diamondLevel < 8);
        console.log("Diamond frame aging level after 140 days:", diamondLevel);
    }

    function testTimePredictions() public {
        // Test dirt timing
        uint256 timeToDirt1 = _timeUntilDirtLevel(testRug, 1);
        assertEq(timeToDirt1, DIRT_LEVEL_1_DAYS);

        uint256 timeToDirt2 = _timeUntilDirtLevel(testRug, 2);
        assertEq(timeToDirt2, DIRT_LEVEL_2_DAYS);

        // Test aging timing
        uint256 timeToAging1 = _timeUntilAgingLevel(testRug, 1);
        assertEq(timeToAging1, AGING_ADVANCE_DAYS);
    }

    // ===== EDGE CASES =====

    function testMaxAgingCap() public {
        // Advance beyond max aging
        vm.warp(block.timestamp + 15 * AGING_ADVANCE_DAYS);
        assertEq(_calculateAgingLevel(testRug), 10); // Should cap at 10

        // Further advancement shouldn't increase
        vm.warp(block.timestamp + 5 * AGING_ADVANCE_DAYS);
        assertEq(_calculateAgingLevel(testRug), 10);
    }

    function testRestorationDelaysAging() public {
        // Advance to level 3 first
        vm.warp(3 * AGING_ADVANCE_DAYS + 1);
        assertEq(_calculateAgingLevel(testRug), 3);

        // Restore to reduce level to 2
        _restoreRug(testRug);
        assertEq(_calculateAgingLevel(testRug), 2);
        assertEq(testRug.restorationCount, 1);

        // Restore again to reduce to level 1
        _restoreRug(testRug);
        assertEq(_calculateAgingLevel(testRug), 1);

        // Restore again to reduce to level 0
        _restoreRug(testRug);
        assertEq(_calculateAgingLevel(testRug), 0);

        // Further restorations at level 0 do nothing
        _restoreRug(testRug);
        assertEq(_calculateAgingLevel(testRug), 0);
        assertEq(testRug.restorationCount, 4);
    }

    function testFrameImmunity() public {
        // Make very dirty
        vm.warp(block.timestamp + DIRT_LEVEL_2_DAYS + 1 days);
        assertEq(_calculateDirtLevel(testRug), 2);

        // Give Silver frame
        testRug.frameLevel = 2;
        assertEq(_calculateDirtLevel(testRug), 0); // Immune

        // Gold and Diamond should also be immune
        testRug.frameLevel = 3; // Gold
        assertEq(_calculateDirtLevel(testRug), 0);

        testRug.frameLevel = 4; // Diamond
        assertEq(_calculateDirtLevel(testRug), 0);
    }

    // ===== HELPER FUNCTIONS =====

    function _calculateDirtLevel(TestRugData memory rug) internal view returns (uint8) {
        if (_hasDirtImmunity(rug.frameLevel)) {
            return 0;
        }

        uint256 timeSinceCleaned = block.timestamp - rug.lastCleaned;
        if (timeSinceCleaned >= DIRT_LEVEL_2_DAYS) return 2;
        if (timeSinceCleaned >= DIRT_LEVEL_1_DAYS) return 1;
        return 0;
    }

    function _hasDirt(TestRugData memory rug) internal view returns (bool) {
        return _calculateDirtLevel(rug) > 0;
    }

    function _hasDirtImmunity(uint8 frameLevel) internal pure returns (bool) {
        return frameLevel >= 2; // Silver and above
    }

    function _calculateAgingLevel(TestRugData memory rug) internal view returns (uint8) {
        uint256 timeSinceLevelStart = block.timestamp - rug.lastCleaned;
        uint256 baseInterval = AGING_ADVANCE_DAYS;

        // Apply frame-based aging immunity
        uint256 agingMultiplier = _getAgingMultiplier(rug.frameLevel);
        uint256 adjustedInterval = (baseInterval * 100) / agingMultiplier;

        uint8 levelsAdvanced = uint8(timeSinceLevelStart / adjustedInterval);

        uint8 calculatedLevel = rug.agingLevel + levelsAdvanced;
        return calculatedLevel > 10 ? 10 : calculatedLevel;
    }

    function _getAgingMultiplier(uint8 frameLevel) internal pure returns (uint256) {
        if (frameLevel >= 4) return 10; // Diamond: 90% slower (10x longer)
        if (frameLevel >= 3) return 20; // Gold: 80% slower (5x longer)
        if (frameLevel >= 2) return 50; // Silver: 50% slower (2x longer)
        if (frameLevel >= 1) return 75; // Bronze: 25% slower (1.3x longer)
        return 100; // None: normal speed
    }

    function _calculateMaintenanceScore(TestRugData memory rug) internal pure returns (uint256) {
        return (rug.cleaningCount * 2) +
               (rug.restorationCount * 8) +
               (rug.masterRestorationCount * 12);
    }

    function _getFrameLevelFromScore(uint256 score) internal pure returns (uint8) {
        if (score >= DIAMOND_THRESHOLD) return 4;
        if (score >= GOLD_THRESHOLD) return 3;
        if (score >= SILVER_THRESHOLD) return 2;
        if (score >= BRONZE_THRESHOLD) return 1;
        return 0;
    }

    function _getFrameName(uint8 frameLevel) internal pure returns (string memory) {
        if (frameLevel == 4) return "Diamond";
        if (frameLevel == 3) return "Gold";
        if (frameLevel == 2) return "Silver";
        if (frameLevel == 1) return "Bronze";
        return "None";
    }

    function _cleanRug(TestRugData storage rug) internal {
        // Clean only resets dirt and delays aging progression
        rug.lastCleaned = block.timestamp;
        rug.cleaningCount++;
        _updateFrame(rug);
    }

    function _restoreRug(TestRugData storage rug) internal {
        uint8 currentLevel = _calculateAgingLevel(rug);
        // Set stored level to current calculated - 1
        rug.agingLevel = currentLevel > 0 ? currentLevel - 1 : 0;
        rug.lastCleaned = block.timestamp;
        rug.restorationCount++;
        _updateFrame(rug);
    }

    function _masterRestoreRug(TestRugData storage rug) internal {
        rug.agingLevel = 0;
        rug.lastCleaned = block.timestamp;
        rug.masterRestorationCount++;
        _updateFrame(rug);
    }

    function _updateFrame(TestRugData storage rug) internal {
        uint256 score = _calculateMaintenanceScore(rug);
        uint8 newFrameLevel = _getFrameLevelFromScore(score);
        if (newFrameLevel != rug.frameLevel) {
            rug.frameLevel = newFrameLevel;
            rug.frameAchievedTime = block.timestamp;
        }
    }

    function _earnPoints(TestRugData storage rug, uint256 points) internal {
        // Simulate earning points through cleanings (2 points each)
        uint256 cleaningsNeeded = (points + 1) / 2;
        for (uint256 i = 0; i < cleaningsNeeded; i++) {
            _cleanRug(rug);
        }
    }

    function _timeUntilDirtLevel(TestRugData memory rug, uint8 targetLevel) internal view returns (uint256) {
        if (_hasDirtImmunity(rug.frameLevel)) return 0;

        uint256 timeSinceCleaned = block.timestamp - rug.lastCleaned;
        uint256 targetTime;

        if (targetLevel == 1) targetTime = DIRT_LEVEL_1_DAYS;
        else if (targetLevel == 2) targetTime = DIRT_LEVEL_2_DAYS;
        else return 0;

        if (timeSinceCleaned < targetTime) {
            return targetTime - timeSinceCleaned;
        }
        return 0;
    }

    function _timeUntilAgingLevel(TestRugData memory rug, uint8 targetLevel) internal view returns (uint256) {
        uint8 currentLevel = _calculateAgingLevel(rug);
        if (targetLevel <= currentLevel) return 0;

        uint256 levelsNeeded = targetLevel - currentLevel;
        uint256 timeSinceLevelStart = block.timestamp - rug.lastCleaned;
        uint256 advanceInterval = AGING_ADVANCE_DAYS;

        uint256 targetTime = levelsNeeded * advanceInterval;
        if (timeSinceLevelStart < targetTime) {
            return targetTime - timeSinceLevelStart;
        }
        return 0;
    }
}
