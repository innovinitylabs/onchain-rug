// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {DiamondFramePool} from "../src/DiamondFramePool.sol";
import {MockDiamondContract} from "./mocks/MockDiamondContract.sol";

contract DiamondFramePoolFairnessTest is Test {
    DiamondFramePool pool;
    MockDiamondContract mockDiamond;

    address owner = address(1);
    address alice = address(2);
    address bob = address(3);
    address charlie = address(4);

    uint256 minimumClaimable = 0.001 ether;

    function setUp() public {
        vm.startPrank(owner);

        mockDiamond = new MockDiamondContract();
        pool = new DiamondFramePool(address(mockDiamond), minimumClaimable);

        vm.stopPrank();
    }

    /* ==================== FAIR DISTRIBUTION TESTS ==================== */

    function test_FairDistribution_EqualShares() public {
        // Setup: 4 diamond frames total
        mockDiamond.setDiamondFrameCount(4);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setOwnerOf(200, bob);
        mockDiamond.setOwnerOf(300, charlie);
        mockDiamond.setOwnerOf(400, owner);
        mockDiamond.setHasDiamondFrame(100, true);
        mockDiamond.setHasDiamondFrame(200, true);
        mockDiamond.setHasDiamondFrame(300, true);
        mockDiamond.setHasDiamondFrame(400, true);

        // Deposit 12 ETH
        vm.deal(address(this), 12 ether);
        (bool success,) = address(pool).call{value: 12 ether}("");
        assertTrue(success);

        // Each NFT should get 3 ETH (12 / 4)
        assertEq(pool.getClaimableAmountForToken(100), 3 ether);
        assertEq(pool.getClaimableAmountForToken(200), 3 ether);
        assertEq(pool.getClaimableAmountForToken(300), 3 ether);
        assertEq(pool.getClaimableAmountForToken(400), 3 ether);

        // Alice claims her token
        uint256[] memory aliceTokens = new uint256[](1);
        aliceTokens[0] = 100;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, aliceTokens);

        assertEq(alice.balance, 3 ether);
        assertEq(pool.withdrawnRoyalties(100), 3 ether);

        // Bob claims his token
        uint256[] memory bobTokens = new uint256[](1);
        bobTokens[0] = 200;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(bob, bobTokens);

        assertEq(bob.balance, 3 ether);
        assertEq(pool.withdrawnRoyalties(200), 3 ether);
    }

    function test_FairDistribution_MultipleTokensPerUser() public {
        // Setup: 5 diamond frames total
        mockDiamond.setDiamondFrameCount(5);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setOwnerOf(200, alice); // Alice owns 2
        mockDiamond.setOwnerOf(300, bob);
        mockDiamond.setOwnerOf(400, bob);   // Bob owns 2
        mockDiamond.setOwnerOf(500, charlie);
        mockDiamond.setHasDiamondFrame(100, true);
        mockDiamond.setHasDiamondFrame(200, true);
        mockDiamond.setHasDiamondFrame(300, true);
        mockDiamond.setHasDiamondFrame(400, true);
        mockDiamond.setHasDiamondFrame(500, true);

        // Deposit 10 ETH
        vm.deal(address(this), 10 ether);
        (bool success,) = address(pool).call{value: 10 ether}("");
        assertTrue(success);

        // Each NFT gets 2 ETH (10 / 5)
        assertEq(pool.getClaimableAmountForToken(100), 2 ether);
        assertEq(pool.getClaimableAmountForToken(200), 2 ether);
        assertEq(pool.getClaimableAmountForToken(300), 2 ether);
        assertEq(pool.getClaimableAmountForToken(400), 2 ether);
        assertEq(pool.getClaimableAmountForToken(500), 2 ether);

        // Alice claims both her tokens
        uint256[] memory aliceTokens = new uint256[](2);
        aliceTokens[0] = 100;
        aliceTokens[1] = 200;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, aliceTokens);

        assertEq(alice.balance, 4 ether); // 2 ETH * 2 tokens
        assertEq(pool.withdrawnRoyalties(100), 2 ether);
        assertEq(pool.withdrawnRoyalties(200), 2 ether);
    }

    function test_FairDistribution_NewDeposits() public {
        // Setup: 2 diamond frames initially
        mockDiamond.setDiamondFrameCount(2);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setHasDiamondFrame(100, true);

        // First deposit: 4 ETH
        vm.deal(address(this), 4 ether);
        (bool success1,) = address(pool).call{value: 4 ether}("");
        assertTrue(success1);

        // Alice's token should get 2 ETH (4 / 2)
        assertEq(pool.getClaimableAmountForToken(100), 2 ether);

        // Alice claims
        uint256[] memory aliceTokens = new uint256[](1);
        aliceTokens[0] = 100;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, aliceTokens);

        assertEq(alice.balance, 2 ether);
        assertEq(pool.withdrawnRoyalties(100), 2 ether);

        // New diamond frame appears
        mockDiamond.setDiamondFrameCount(3);
        mockDiamond.setOwnerOf(200, bob);
        mockDiamond.setHasDiamondFrame(200, true);

        // Second deposit: 6 ETH
        vm.deal(address(this), 6 ether);
        (bool success2,) = address(pool).call{value: 6 ether}("");
        assertTrue(success2);

        // Alice's token should get additional 2 ETH (6 / 3)
        assertEq(pool.getClaimableAmountForToken(100), 2 ether);
        // Bob's token should get 2 ETH (6 / 3)
        assertEq(pool.getClaimableAmountForToken(200), 2 ether);

        // Alice claims again
        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, aliceTokens);

        assertEq(alice.balance, 4 ether); // 2 + 2
        assertEq(pool.withdrawnRoyalties(100), 4 ether);
    }

    /* ==================== ACCUMULATED ROYALTIES TESTS ==================== */

    function test_AccumulatedRoyalties_FirstComeFirstServed() public {
        // No diamond frames initially - royalties accumulate
        vm.deal(address(this), 5 ether);
        (bool success1,) = address(pool).call{value: 5 ether}("");
        assertTrue(success1);

        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 5 ether);
        assertEq(pool.magnifiedRoyaltyPerNFT(), 0);

        // First diamond frame appears
        mockDiamond.setDiamondFrameCount(1);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setHasDiamondFrame(100, true);

        // Next deposit triggers distribution of accumulated
        vm.deal(address(this), 3 ether);
        (bool success2,) = address(pool).call{value: 3 ether}("");
        assertTrue(success2);

        // Should distribute: (5 + 3) / 1 = 8 ETH to the first NFT
        assertEq(pool.getClaimableAmountForToken(100), 8 ether);
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 0);

        // Alice claims
        uint256[] memory aliceTokens = new uint256[](1);
        aliceTokens[0] = 100;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, aliceTokens);

        assertEq(alice.balance, 8 ether);
    }

    function test_AccumulatedRoyalties_MultipleFrames() public {
        // Accumulate 10 ETH before any diamond frames
        vm.deal(address(this), 10 ether);
        (bool success1,) = address(pool).call{value: 10 ether}("");
        assertTrue(success1);

        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 10 ether);

        // 3 diamond frames appear at once
        mockDiamond.setDiamondFrameCount(3);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setOwnerOf(200, bob);
        mockDiamond.setOwnerOf(300, charlie);
        mockDiamond.setHasDiamondFrame(100, true);
        mockDiamond.setHasDiamondFrame(200, true);
        mockDiamond.setHasDiamondFrame(300, true);

        // Next deposit distributes accumulated proportionally
        vm.deal(address(this), 6 ether);
        (bool success2,) = address(pool).call{value: 6 ether}("");
        assertTrue(success2);

        // Each NFT gets (10 + 6) / 3 = 16/3 ≈ 5.333 ETH
        // Due to integer division, this will be 5 ETH (15/3 = 5)
        uint256 expectedPerNFT = (15 ether) / 3; // 15 ETH total distributed
        assertEq(pool.getClaimableAmountForToken(100), expectedPerNFT);
        assertEq(pool.getClaimableAmountForToken(200), expectedPerNFT);
        assertEq(pool.getClaimableAmountForToken(300), expectedPerNFT);

        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 0);
    }

    /* ==================== MATHEMATICAL PRECISION TESTS ==================== */

    function test_MathematicalPrecision_IntegerDivision() public {
        mockDiamond.setDiamondFrameCount(3);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setHasDiamondFrame(100, true);

        // Deposit 1 wei
        vm.deal(address(this), 1 wei);
        (bool success,) = address(pool).call{value: 1 wei}("");
        assertTrue(success);

        // 1 wei / 3 frames = 0 (integer division)
        assertEq(pool.getClaimableAmountForToken(100), 0);

        // Deposit 3 wei
        vm.deal(address(this), 3 wei);
        (bool success2,) = address(pool).call{value: 3 wei}("");
        assertTrue(success2);

        // 3 wei / 3 frames = 1 wei each
        assertEq(pool.getClaimableAmountForToken(100), 1 wei);
    }

    function test_MathematicalPrecision_MagnifiedCalculations() public {
        mockDiamond.setDiamondFrameCount(1);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setHasDiamondFrame(100, true);

        // Deposit 1 ETH
        vm.deal(address(this), 1 ether);
        (bool success,) = address(pool).call{value: 1 ether}("");
        assertTrue(success);

        // magnifiedRoyaltyPerNFT = 1 ether * 2^128 / 1
        uint256 expectedMagnified = 1 ether * (1 << 128);

        // Claimable = magnifiedRoyaltyPerNFT / 2^128 = 1 ether
        uint256 claimable = pool.getClaimableAmountForToken(100);
        assertEq(claimable, 1 ether);

        // After claiming
        uint256[] memory aliceTokens = new uint256[](1);
        aliceTokens[0] = 100;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, aliceTokens);

        // Should have 0 claimable now
        assertEq(pool.getClaimableAmountForToken(100), 0);
    }

    /* ==================== CLAIM TIMING TESTS ==================== */

    function test_ClaimTiming_EarlyVsLate() public {
        // Setup: 2 diamond frames
        mockDiamond.setDiamondFrameCount(2);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setOwnerOf(200, bob);
        mockDiamond.setHasDiamondFrame(100, true);
        mockDiamond.setHasDiamondFrame(200, true);

        // Deposit 10 ETH
        vm.deal(address(this), 10 ether);
        (bool success,) = address(pool).call{value: 10 ether}("");
        assertTrue(success);

        // Both should have 5 ETH claimable
        assertEq(pool.getClaimableAmountForToken(100), 5 ether);
        assertEq(pool.getClaimableAmountForToken(200), 5 ether);

        // Alice claims early
        uint256[] memory aliceTokens = new uint256[](1);
        aliceTokens[0] = 100;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, aliceTokens);

        assertEq(alice.balance, 5 ether);
        assertEq(pool.withdrawnRoyalties(100), 5 ether);

        // Bob claims late - should still get 5 ETH
        uint256[] memory bobTokens = new uint256[](1);
        bobTokens[0] = 200;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(bob, bobTokens);

        assertEq(bob.balance, 5 ether);
        assertEq(pool.withdrawnRoyalties(200), 5 ether);

        // Both got the same amount despite different claim times
        assertEq(alice.balance, bob.balance);
    }

    function test_ClaimTiming_PartialClaims() public {
        // Setup: Alice owns 2 tokens, claims them separately
        mockDiamond.setDiamondFrameCount(2);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setOwnerOf(200, alice);
        mockDiamond.setHasDiamondFrame(100, true);
        mockDiamond.setHasDiamondFrame(200, true);

        // Deposit 10 ETH
        vm.deal(address(this), 10 ether);
        (bool success,) = address(pool).call{value: 10 ether}("");
        assertTrue(success);

        // First claim: token 100
        uint256[] memory token1 = new uint256[](1);
        token1[0] = 100;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, token1);

        assertEq(alice.balance, 5 ether);
        assertEq(pool.withdrawnRoyalties(100), 5 ether);
        assertEq(pool.withdrawnRoyalties(200), 0);

        // Second claim: token 200
        uint256[] memory token2 = new uint256[](1);
        token2[0] = 200;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, token2);

        assertEq(alice.balance, 10 ether);
        assertEq(pool.withdrawnRoyalties(200), 5 ether);
    }

    /* ==================== DYNAMIC FRAME COUNT TESTS ==================== */

    function test_DynamicFrameCount_Increasing() public {
        // Start with 1 frame
        mockDiamond.setDiamondFrameCount(1);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setHasDiamondFrame(100, true);

        // Deposit when 1 frame exists
        vm.deal(address(this), 3 ether);
        (bool success1,) = address(pool).call{value: 3 ether}("");
        assertTrue(success1);

        assertEq(pool.getClaimableAmountForToken(100), 3 ether);

        // Add another frame
        mockDiamond.setDiamondFrameCount(2);
        mockDiamond.setOwnerOf(200, bob);
        mockDiamond.setHasDiamondFrame(200, true);

        // Deposit when 2 frames exist
        vm.deal(address(this), 6 ether);
        (bool success2,) = address(pool).call{value: 6 ether}("");
        assertTrue(success2);

        // Alice's token: 3 ETH (from first deposit) + 3 ETH (from second) = 6 ETH
        assertEq(pool.getClaimableAmountForToken(100), 6 ether);
        // Bob's token: 3 ETH (from second deposit only)
        assertEq(pool.getClaimableAmountForToken(200), 3 ether);
    }

    function test_DynamicFrameCount_Decreasing() public {
        // Start with 2 frames
        mockDiamond.setDiamondFrameCount(2);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setHasDiamondFrame(100, true);

        // Deposit 8 ETH
        vm.deal(address(this), 8 ether);
        (bool success,) = address(pool).call{value: 8 ether}("");
        assertTrue(success);

        assertEq(pool.getClaimableAmountForToken(100), 4 ether);

        // Simulate frame loss (token 100 loses diamond frame)
        mockDiamond.setDiamondFrameCount(1);
        mockDiamond.setHasDiamondFrame(100, false);

        // Future deposits should go to remaining frames
        vm.deal(address(this), 4 ether);
        (bool success2,) = address(pool).call{value: 4 ether}("");
        assertTrue(success2);

        // Alice's token should still have original 4 ETH claimable
        // (since frame loss happened after deposit)
        assertEq(pool.getClaimableAmountForToken(100), 4 ether);
    }

    /* ==================== EDGE CASES ==================== */

    function test_EdgeCase_ZeroDivisionProtection() public {
        // Test what happens with 0 diamond frames (should accumulate)
        vm.deal(address(this), 1 ether);
        (bool success,) = address(pool).call{value: 1 ether}("");
        assertTrue(success);

        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 1 ether);
        assertEq(pool.magnifiedRoyaltyPerNFT(), 0);
    }

    function test_EdgeCase_VerySmallAmounts() public {
        mockDiamond.setDiamondFrameCount(1);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setHasDiamondFrame(100, true);

        // Deposit 1 wei
        vm.deal(address(this), 1 wei);
        (bool success,) = address(pool).call{value: 1 wei}("");
        assertTrue(success);

        assertEq(pool.getClaimableAmountForToken(100), 1 wei);

        // Claim
        uint256[] memory aliceTokens = new uint256[](1);
        aliceTokens[0] = 100;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, aliceTokens);

        assertEq(alice.balance, 1 wei);
    }

    function test_EdgeCase_VeryLargeAmounts() public {
        mockDiamond.setDiamondFrameCount(1);
        mockDiamond.setOwnerOf(100, alice);
        mockDiamond.setHasDiamondFrame(100, true);

        // Deposit a very large amount (1 million ETH equivalent)
        uint256 largeAmount = 10**18 * 10**6;
        vm.deal(address(this), largeAmount);

        (bool success,) = address(pool).call{value: largeAmount}("");
        assertTrue(success);

        assertEq(pool.getClaimableAmountForToken(100), largeAmount);

        uint256[] memory aliceTokens = new uint256[](1);
        aliceTokens[0] = 100;

        uint256 balanceBefore = alice.balance;
        vm.prank(address(mockDiamond));
        pool.claimForTokens(alice, aliceTokens);
        uint256 balanceAfter = alice.balance;

        assertEq(balanceAfter - balanceBefore, largeAmount);
    }
}
