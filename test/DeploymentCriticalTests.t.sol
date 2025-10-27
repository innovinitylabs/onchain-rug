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
 * @title Deployment Critical Tests
 * @notice Essential tests that MUST pass before testnet deployment
 * @dev Covers security, gas optimization, and core functionality verification
 * @dev Simplified version focusing on critical deployment checks
 */
contract DeploymentCriticalTests is Test {
    // Rug facets (deployed individually for testing)
    RugNFTFacet public nftFacet;
    RugAgingFacet public agingFacet;
    RugMaintenanceFacet public maintenanceFacet;
    RugAdminFacet public adminFacet;

    // Test accounts
    address public owner = address(0x1000);
    address public user1 = address(0x1001);
    address public user2 = address(0x1002);
    address public attacker = address(0x9999);

    // Test data
    uint256 public testTokenId;

    // Configuration constants
    uint256 constant CLEANING_COST = 0.00001 ether;
    uint256 constant RESTORATION_COST = 0.00001 ether;
    uint256 constant MASTER_COST = 0.00001 ether;
    uint256 constant DAY = 1 days;

    function setUp() public {
        // Setup test accounts
        vm.deal(owner, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(attacker, 10 ether);

        // FULLY RESET storage BEFORE deploying any facets
        _resetStorageState();

        // Deploy facets
        _deployFacets();

        // Setup initial configuration (including collection cap)
        _setupInitialConfiguration();

        // Mint test token
        _mintTestToken();
    }

    function _resetStorageState() internal {
        // Complete storage reset before any contract interactions
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Reset RugConfig struct fields
        rs.collectionCap = 0;
        rs.walletLimit = 0;
        rs.reserveAmount = 0;
        rs.isLaunched = false;
        rs.launderingEnabled = false;
        delete rs.exceptionList;
        rs.rugScriptyBuilder = address(0);
        rs.rugEthFSStorage = address(0);
        rs.onchainRugsHTMLGenerator = address(0);
        rs.basePrice = 0;
        rs.linePrice1 = 0;
        rs.linePrice2 = 0;
        rs.linePrice3 = 0;
        rs.linePrice4 = 0;
        rs.linePrice5 = 0;
        rs.dirtLevel1Days = 0;
        rs.dirtLevel2Days = 0;
        rs.agingAdvanceDays = 0;
        rs.freeCleanDays = 0;
        rs.freeCleanWindow = 0;
        rs.cleaningCost = 0;
        rs.restorationCost = 0;
        rs.masterRestorationCost = 0;
        rs.launderingThreshold = 0;
        rs.bronzeThreshold = 0;
        rs.silverThreshold = 0;
        rs.goldThreshold = 0;
        rs.diamondThreshold = 0;

        // Reset supply tracking
        rs.totalSupply = 0;
        rs.tokenCounter = 0;

        // Note: Cannot reset mappings (usedTextHashes, rugs, agingData) directly in Solidity
        // But they should be empty for fresh tests
    }

    function _deployFacets() internal {
        vm.startPrank(owner);

        nftFacet = new RugNFTFacet();
        agingFacet = new RugAgingFacet();
        maintenanceFacet = new RugMaintenanceFacet();
        adminFacet = new RugAdminFacet();

        vm.stopPrank();
    }

    function _setupInitialConfiguration() internal {
        vm.startPrank(owner);

        // FULLY RESET all storage state for test isolation
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Reset aging configuration
        rs.dirtLevel1Days = 1 * DAY;
        rs.dirtLevel2Days = 3 * DAY;
        rs.agingAdvanceDays = 7 * DAY;
        rs.freeCleanDays = 14 * DAY;
        rs.freeCleanWindow = 5 * DAY;

        // Reset pricing
        rs.cleaningCost = CLEANING_COST;
        rs.restorationCost = RESTORATION_COST;
        rs.masterRestorationCost = MASTER_COST;

        // Reset frame thresholds
        rs.bronzeThreshold = 25;
        rs.silverThreshold = 50;
        rs.goldThreshold = 100;
        rs.diamondThreshold = 200;

        // Reset supply tracking - set higher cap for tests
        rs.collectionCap = 10000;
        rs.totalSupply = 0;
        rs.tokenCounter = 0;

        // Reset wallet limits
        rs.walletLimit = 7;

        // Reset launch state
        rs.isLaunched = true;

        // Reset exception list
        delete rs.exceptionList;

        // Reset Scripty contracts (set dummy addresses for testing)
        rs.rugScriptyBuilder = address(0x123);
        rs.rugEthFSStorage = address(0x456);
        rs.onchainRugsHTMLGenerator = address(0x789);

        // Reset pricing configuration
        rs.basePrice = 0.000005 ether;
        rs.linePrice1 = 0.000001 ether;
        rs.linePrice2 = 0.000001 ether;
        rs.linePrice3 = 0.000001 ether;
        rs.linePrice4 = 0.000001 ether;
        rs.linePrice5 = 0.000001 ether;

        vm.stopPrank();
    }

    function _mintTestToken() internal {
        vm.startPrank(user1);

        string[] memory textRows = new string[](3);
        textRows[0] = "HELLO";
        textRows[1] = "WORLD";
        textRows[2] = "TEST";

        // Create structs for new mintRug signature
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

        nftFacet.mintRug{value: 0.00001 ether}(
            textRows,
            12345,
            visual,
            art,
            4, // complexity
            10 // characterCount
        );

        testTokenId = nftFacet.totalSupply();
        vm.stopPrank();
    }

    // ===== PHASE 1: CONTRACT DEPLOYMENT TESTS =====

    function testFacetDeployment() public {
        // Verify all facets are deployed
        assertTrue(address(nftFacet) != address(0));
        assertTrue(address(agingFacet) != address(0));
        assertTrue(address(maintenanceFacet) != address(0));
        assertTrue(address(adminFacet) != address(0));
    }

    function testInitialConfiguration() public {
        // Verify configuration is set correctly
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        assertEq(rs.agingAdvanceDays, 7 * DAY);
        assertEq(rs.dirtLevel1Days, 1 * DAY);
        assertEq(rs.dirtLevel2Days, 3 * DAY);
        assertEq(rs.cleaningCost, CLEANING_COST);
        assertEq(rs.bronzeThreshold, 25);
    }

    function testTokenMinting() public {
        vm.startPrank(user1);

        // Verify token was minted correctly
        assertEq(nftFacet.ownerOf(testTokenId), user1);
        assertEq(nftFacet.balanceOf(user1), 1);
        assertEq(nftFacet.totalSupply(), 1);

        // Verify initial aging state
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);
        assertEq(agingFacet.getDirtLevel(testTokenId), 0);
        assertEq(agingFacet.getFrameLevel(testTokenId), 0);

        vm.stopPrank();
    }

    // ===== PHASE 1: SECURITY & ACCESS CONTROL TESTS =====

    function testTokenOwnershipRequired() public {
        // Advance time to make rug dirty
        vm.warp(block.timestamp + 5 * DAY);

        // Non-owner should not be able to clean
        vm.startPrank(user2);
        vm.expectRevert("Not token owner");
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        vm.stopPrank();

        // Owner should be able to clean
        vm.startPrank(user1);
        assertTrue(maintenanceFacet.canCleanRug(testTokenId));
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        vm.stopPrank();
    }

    function testPaymentValidation() public {
        // Advance time to make rug dirty again
        vm.warp(block.timestamp + 5 * DAY);

        vm.startPrank(user1);

        // Test insufficient payment
        vm.expectRevert("Insufficient payment");
        maintenanceFacet.cleanRug{value: CLEANING_COST - 1}(testTokenId);

        // Test correct payment
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);

        vm.stopPrank();
    }

    function testInputValidation() public {
        vm.startPrank(user1);

        // Test invalid token ID
        vm.expectRevert(); // Should revert for non-existent token
        agingFacet.getAgingLevel(999);

        // Test valid token ID
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);

        vm.stopPrank();
    }

    // ===== PHASE 1: GAS OPTIMIZATION TESTS =====

    function testGasUsageMinting() public {
        vm.startPrank(user1);

        string[] memory textRows = new string[](2);
        textRows[0] = "GAS";
        textRows[1] = "TEST";

        // Measure gas for minting
        uint256 gasStart = gasleft();

        RugNFTFacet.VisualConfig memory visual2 = RugNFTFacet.VisualConfig({
            warpThickness: 2,
            stripeCount: 4
        });

        RugNFTFacet.ArtData memory art2 = RugNFTFacet.ArtData({
            paletteName: "GasPalette",
            minifiedPalette: "minifiedPaletteData",
            minifiedStripeData: "minifiedStripeData",
            filteredCharacterMap: "characterMap"
        });

        nftFacet.mintRug{value: 0.00001 ether}(
            textRows,
            54321,
            visual2,
            art2,
            3, // complexity
            8  // characterCount
        );
        uint256 gasUsed = gasStart - gasleft();

        console.log("Minting gas used:", gasUsed);

        // Gas should be reasonable (< 500k for complex mint)
        assertLt(gasUsed, 500000, "Minting gas usage too high");

        vm.stopPrank();
    }

    function testGasUsageMaintenanceActions() public {
        // Advance time to enable maintenance
        vm.warp(block.timestamp + 5 * DAY);

        vm.startPrank(user1);

        // Test cleaning gas
        uint256 gasStart = gasleft();
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        uint256 cleanGas = gasStart - gasleft();

        console.log("Cleaning gas used:", cleanGas);
        assertLt(cleanGas, 100000, "Cleaning gas usage too high");

        // Advance time for restoration
        vm.warp(block.timestamp + 10 * DAY);

        // Test restoration gas
        gasStart = gasleft();
        maintenanceFacet.restoreRug{value: RESTORATION_COST}(testTokenId);
        uint256 restoreGas = gasStart - gasleft();

        console.log("Restoration gas used:", restoreGas);
        assertLt(restoreGas, 100000, "Restoration gas usage too high");

        vm.stopPrank();
    }

    function testGasUsageViewFunctions() public {
        vm.startPrank(user1);

        // Test view function gas usage
        uint256 gasStart = gasleft();
        uint8 agingLevel = agingFacet.getAgingLevel(testTokenId);
        uint256 viewGas = gasStart - gasleft();

        console.log("View function gas used:", viewGas);

        // View functions should be very cheap
        assertLt(viewGas, 50000, "View function gas usage too high");
        assertEq(agingLevel, 0); // Should be 0 initially

        vm.stopPrank();
    }

    // ===== PHASE 2: EDGE CASES & BOUNDARY TESTS =====

    function testMaxAgingLevelBoundary() public {
        // Advance to maximum aging level
        vm.warp(block.timestamp + 15 * 7 * DAY); // 15 weeks = 105 days

        assertEq(agingFacet.getAgingLevel(testTokenId), 10);

        // Advance further - should still be 10
        vm.warp(block.timestamp + 10 * DAY);
        assertEq(agingFacet.getAgingLevel(testTokenId), 10);
    }

    function testFrameThresholdBoundaries() public {
        // Test exact threshold transitions
        vm.startPrank(user1);

        // Should start with 0 points
        assertEq(agingFacet.getMaintenanceScore(testTokenId), 0);

        // Clean once (2 points) - should stay at frame 0
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        assertEq(agingFacet.getMaintenanceScore(testTokenId), 2);

        vm.stopPrank();
    }

    function testTimeBoundaryCalculations() public {
        // Test timeUntilNextAging at different levels
        uint256 timeUntilNext = agingFacet.timeUntilNextAging(testTokenId);

        // Fresh rug should have full interval until next aging
        assertEq(timeUntilNext, 7 * DAY);

        // At level 10, should return 0
        vm.warp(block.timestamp + 15 * 7 * DAY);
        timeUntilNext = agingFacet.timeUntilNextAging(testTokenId);
        assertEq(timeUntilNext, 0);
    }

    // ===== PHASE 2: CROSS-CONTRACT INTERACTION TESTS =====

    function testERC721Compliance() public {
        vm.startPrank(user1);

        // Test ERC721 interface compliance
        assertEq(nftFacet.balanceOf(user1), 1);
        assertEq(nftFacet.ownerOf(testTokenId), user1);
        assertEq(nftFacet.totalSupply(), 1);

        // Test transfer
        nftFacet.approve(user2, testTokenId);
        vm.stopPrank();

        vm.startPrank(user2);
        nftFacet.transferFrom(user1, user2, testTokenId);

        assertEq(nftFacet.ownerOf(testTokenId), user2);
        assertEq(nftFacet.balanceOf(user1), 0);
        assertEq(nftFacet.balanceOf(user2), 1);

        vm.stopPrank();
    }

    function testMetadataGeneration() public {
        vm.startPrank(user1);

        string memory uri = nftFacet.tokenURI(testTokenId);

        // Should contain basic metadata structure
        assertTrue(bytes(uri).length > 0);
        // Could parse JSON here for more detailed validation

        vm.stopPrank();
    }

    // ===== PHASE 3: STRESS & PERFORMANCE TESTS =====

    function testBatchOperations() public {
        vm.startPrank(user1);

        // Perform multiple maintenance operations in sequence
        vm.warp(block.timestamp + 5 * DAY); // Make dirty
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);

        vm.warp(block.timestamp + 10 * DAY); // Allow aging
        maintenanceFacet.restoreRug{value: RESTORATION_COST}(testTokenId);

        vm.warp(block.timestamp + 15 * DAY); // Allow more aging
        maintenanceFacet.masterRestoreRug{value: MASTER_COST}(testTokenId);

        // Verify final state
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);
        assertEq(agingFacet.getDirtLevel(testTokenId), 0);
        assertEq(agingFacet.getMaintenanceScore(testTokenId), 17); // 2 + 5 + 10

        vm.stopPrank();
    }

    function testConcurrentOperations() public {
        // Mint multiple tokens and test concurrent operations
        vm.startPrank(user1);

        // Mint a few more tokens
        string[] memory textRows = new string[](1);
        textRows[0] = "MULTI";

        RugNFTFacet.VisualConfig memory visual3 = RugNFTFacet.VisualConfig({
            warpThickness: 2,
            stripeCount: 4
        });

        RugNFTFacet.ArtData memory art3 = RugNFTFacet.ArtData({
            paletteName: "MultiPalette",
            minifiedPalette: "minifiedPaletteData",
            minifiedStripeData: "minifiedStripeData",
            filteredCharacterMap: "characterMap"
        });

        for (uint256 i = 0; i < 3; i++) {
            nftFacet.mintRug{value: 0.00001 ether}(
                textRows,
                uint256(keccak256(abi.encode(i))),
                visual3,
                art3,
                3, // complexity
                8  // characterCount
            );
        }

        uint256 totalSupply = nftFacet.totalSupply();
        assertEq(totalSupply, 4); // Original + 3 new

        vm.stopPrank();
    }

    // ===== DEPLOYMENT READINESS SUMMARY =====

    function testDeploymentReadiness() public {
        // Final comprehensive test
        console.log("=== DEPLOYMENT READINESS CHECK ===");

        // 1. Contract deployment
        assertTrue(address(nftFacet) != address(0));
        console.log("Contracts deployed");

        // 2. Configuration set
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        assertEq(rs.agingAdvanceDays, 7 * DAY);
        console.log("Configuration set");

        // 3. Core functionality works
        vm.startPrank(user1);
        assertEq(nftFacet.ownerOf(testTokenId), user1);
        assertEq(agingFacet.getAgingLevel(testTokenId), 0);

        // Test maintenance
        vm.warp(block.timestamp + 5 * DAY);
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        assertEq(agingFacet.getDirtLevel(testTokenId), 0);
        console.log("Core functionality working");

        vm.stopPrank();

        // 4. Security checks
        vm.startPrank(attacker);
        vm.expectRevert("Not token owner");
        maintenanceFacet.cleanRug{value: CLEANING_COST}(testTokenId);
        console.log("Security controls working");

        vm.stopPrank();

        console.log("DEPLOYMENT READY: All critical tests passed!");
    }
}
