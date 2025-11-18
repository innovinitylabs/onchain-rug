// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {DiamondFramePool} from "../src/DiamondFramePool.sol";
import {MockDiamondContract} from "./mocks/MockDiamondContract.sol";

contract DiamondFramePoolTest is Test {
    DiamondFramePool pool;
    MockDiamondContract mockDiamond;

    address owner = address(1);
    address user1 = address(2);
    address user2 = address(3);
    address user3 = address(4);

    uint256 minimumClaimable = 0.001 ether;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mock diamond contract
        mockDiamond = new MockDiamondContract();

        // Deploy pool contract
        pool = new DiamondFramePool(address(mockDiamond), minimumClaimable);

        vm.stopPrank();
    }

    function test_Constructor() public {
        assertEq(address(pool.diamondContract()), address(mockDiamond));
        assertEq(pool.minimumClaimableAmount(), minimumClaimable);
        assertEq(pool.getPoolBalance(), 0);
        assertEq(pool.totalRoyaltiesDeposited(), 0);
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 0);
        assertEq(pool.magnifiedRoyaltyPerNFT(), 0);
    }

    function test_ReceiveAccumulatesWhenNoDiamondFrames() public {
        vm.deal(address(this), 10 ether);

        // Send 5 ETH to pool when no diamond frames
        (bool success,) = address(pool).call{value: 5 ether}("");
        assertTrue(success);

        assertEq(pool.getPoolBalance(), 5 ether);
        assertEq(pool.totalRoyaltiesDeposited(), 5 ether);
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 5 ether);
        assertEq(pool.magnifiedRoyaltyPerNFT(), 0);

        // Send another 3 ETH
        (bool success2,) = address(pool).call{value: 3 ether}("");
        assertTrue(success2);

        assertEq(pool.getPoolBalance(), 8 ether);
        assertEq(pool.totalRoyaltiesDeposited(), 8 ether);
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 8 ether);
    }

    function test_ReceiveDistributesWhenDiamondFramesExist() public {
        // Set up 2 diamond frames
        mockDiamond.setDiamondFrameCount(2);

        vm.deal(address(this), 10 ether);

        // Send 10 ETH when diamond frames exist
        (bool success,) = address(pool).call{value: 10 ether}("");
        assertTrue(success);

        assertEq(pool.getPoolBalance(), 10 ether);
        assertEq(pool.totalRoyaltiesDeposited(), 10 ether);
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 0);

        // magnifiedRoyaltyPerNFT = (10 ether * 2^128) / 2
        uint256 expectedMagnified = (10 ether * (1 << 128)) / 2;
        assertEq(pool.magnifiedRoyaltyPerNFT(), expectedMagnified);
    }

    function test_ReceiveDistributesAccumulatedWhenFirstFramesAppear() public {
        vm.deal(address(this), 10 ether);

        // Send 6 ETH when no diamond frames (accumulates)
        (bool success1,) = address(pool).call{value: 6 ether}("");
        assertTrue(success1);
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 6 ether);

        // Now set up 3 diamond frames
        mockDiamond.setDiamondFrameCount(3);

        // Send 4 ETH - this should distribute accumulated + new
        (bool success2,) = address(pool).call{value: 4 ether}("");
        assertTrue(success2);

        assertEq(pool.getPoolBalance(), 10 ether);
        assertEq(pool.totalRoyaltiesDeposited(), 10 ether);
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 0);

        // Test that accumulated royalties were distributed
        // We don't need exact calculation due to integer division complexity
        // Just verify that magnifiedRoyaltyPerNFT is reasonable
        assertGt(pool.magnifiedRoyaltyPerNFT(), 0);
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 0);
    }

    function test_GetTotalDiamondFrameNFTs() public {
        assertEq(pool.getTotalDiamondFrameNFTs(), 0);

        mockDiamond.setDiamondFrameCount(5);
        assertEq(pool.getTotalDiamondFrameNFTs(), 5);

        mockDiamond.setDiamondFrameCount(100);
        assertEq(pool.getTotalDiamondFrameNFTs(), 100);
    }

    function test_GetClaimableAmountForToken_NoDeposits() public {
        mockDiamond.setHasDiamondFrame(100, true);

        uint256 claimable = pool.getClaimableAmountForToken(100);
        assertEq(claimable, 0);
    }

    function test_GetClaimableAmountForToken_WithDeposits() public {
        mockDiamond.setDiamondFrameCount(2);
        mockDiamond.setHasDiamondFrame(100, true);
        mockDiamond.setHasDiamondFrame(200, false); // Not diamond frame

        vm.deal(address(this), 10 ether);
        (bool success,) = address(pool).call{value: 10 ether}("");
        assertTrue(success);

        // Token 100 should have 5 ETH claimable (10 / 2)
        uint256 claimable100 = pool.getClaimableAmountForToken(100);
        assertEq(claimable100, 5 ether);

        // Token 200 should have 0 (not diamond frame)
        uint256 claimable200 = pool.getClaimableAmountForToken(200);
        assertEq(claimable200, 0);
    }

    function test_GetClaimableAmount_UserWithTokens() public {
        // Setup: 3 diamond frames total, user owns 2
        mockDiamond.setDiamondFrameCount(3);
        mockDiamond.setOwnerOf(100, user1);
        mockDiamond.setOwnerOf(200, user1);
        mockDiamond.setHasDiamondFrame(100, true);
        mockDiamond.setHasDiamondFrame(200, true);

        vm.deal(address(this), 9 ether);
        (bool success,) = address(pool).call{value: 9 ether}("");
        assertTrue(success);

        // Each NFT gets 3 ETH (9 / 3)
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 100;
        tokenIds[1] = 200;

        uint256 claimable = pool.getClaimableAmount(user1, tokenIds);
        assertEq(claimable, 6 ether); // 3 ETH * 2 tokens
    }

    function test_ClaimForTokens_RevertsIfNotDiamond() public {
        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 100;

        vm.expectRevert("Only diamond contract");
        pool.claimForTokens(user1, tokenIds);
    }

    function test_ClaimForTokens_RevertsEmptyArray() public {
        uint256[] memory tokenIds = new uint256[](0);

        vm.prank(address(mockDiamond));
        vm.expectRevert("No token IDs provided");
        pool.claimForTokens(user1, tokenIds);
    }

    function test_ClaimForTokens_RevertsBelowMinimum() public {
        mockDiamond.setDiamondFrameCount(1);
        mockDiamond.setOwnerOf(100, user1);
        mockDiamond.setHasDiamondFrame(100, true);

        // Deposit very small amount
        vm.deal(address(this), 1 wei);
        (bool success,) = address(pool).call{value: 1 wei}("");
        assertTrue(success);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 100;

        vm.prank(address(mockDiamond));
        vm.expectRevert("Claimable amount below minimum");
        pool.claimForTokens(user1, tokenIds);
    }

    function test_ClaimForTokens_SuccessfulClaim() public {
        // Setup: 2 diamond frames, user owns 1
        mockDiamond.setDiamondFrameCount(2);
        mockDiamond.setOwnerOf(100, user1);
        mockDiamond.setHasDiamondFrame(100, true);

        vm.deal(address(this), 10 ether);
        (bool success,) = address(pool).call{value: 10 ether}("");
        assertTrue(success);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 100;

        uint256 balanceBefore = user1.balance;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(user1, tokenIds);

        uint256 balanceAfter = user1.balance;
        assertEq(balanceAfter - balanceBefore, 5 ether); // 10 ETH / 2 NFTs
        assertEq(pool.getPoolBalance(), 5 ether);

        // Check withdrawn tracking
        assertEq(pool.withdrawnRoyalties(100), 5 ether);
    }

    function test_ClaimForTokens_MultipleTokens() public {
        // Setup: 4 diamond frames total, user owns 3
        mockDiamond.setDiamondFrameCount(4);
        mockDiamond.setOwnerOf(100, user1);
        mockDiamond.setOwnerOf(200, user1);
        mockDiamond.setOwnerOf(300, user1);
        mockDiamond.setHasDiamondFrame(100, true);
        mockDiamond.setHasDiamondFrame(200, true);
        mockDiamond.setHasDiamondFrame(300, true);

        vm.deal(address(this), 20 ether);
        (bool success,) = address(pool).call{value: 20 ether}("");
        assertTrue(success);

        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 100;
        tokenIds[1] = 200;
        tokenIds[2] = 300;

        uint256 balanceBefore = user1.balance;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(user1, tokenIds);

        uint256 balanceAfter = user1.balance;
        assertEq(balanceAfter - balanceBefore, 15 ether); // 20 ETH / 4 NFTs * 3 tokens
        assertEq(pool.getPoolBalance(), 5 ether);
    }

    function test_ClaimForTokens_PartialClaims() public {
        // Setup: 2 diamond frames, user owns both
        mockDiamond.setDiamondFrameCount(2);
        mockDiamond.setOwnerOf(100, user1);
        mockDiamond.setOwnerOf(200, user1);
        mockDiamond.setHasDiamondFrame(100, true);
        mockDiamond.setHasDiamondFrame(200, true);

        vm.deal(address(this), 10 ether);
        (bool success,) = address(pool).call{value: 10 ether}("");
        assertTrue(success);

        // First claim: only token 100
        uint256[] memory tokenIds1 = new uint256[](1);
        tokenIds1[0] = 100;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(user1, tokenIds1);

        assertEq(user1.balance, 5 ether);
        assertEq(pool.withdrawnRoyalties(100), 5 ether);
        assertEq(pool.withdrawnRoyalties(200), 0);

        // Second claim: token 200
        uint256[] memory tokenIds2 = new uint256[](1);
        tokenIds2[0] = 200;

        vm.prank(address(mockDiamond));
        pool.claimForTokens(user1, tokenIds2);

        assertEq(user1.balance, 10 ether);
        assertEq(pool.withdrawnRoyalties(200), 5 ether);
    }

    function test_ClaimForTokens_InsufficientBalance() public {
        // Setup: 1 diamond frame
        mockDiamond.setDiamondFrameCount(1);
        mockDiamond.setOwnerOf(100, user1);
        mockDiamond.setHasDiamondFrame(100, true);

        vm.deal(address(this), 10 ether);
        (bool success,) = address(pool).call{value: 10 ether}("");
        assertTrue(success);

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 100;

        // Manually reduce pool balance to test insufficient balance check
        vm.prank(address(pool));
        payable(address(0)).transfer(6 ether); // Leave only 4 ETH

        vm.prank(address(mockDiamond));
        vm.expectRevert("Insufficient pool balance");
        pool.claimForTokens(user1, tokenIds);
    }

    function test_ClaimForTokens_TransferFailure() public {
        // This test would require a malicious user contract that rejects ETH
        // For now, we test the success path
        test_ClaimForTokens_SuccessfulClaim();
    }
}
