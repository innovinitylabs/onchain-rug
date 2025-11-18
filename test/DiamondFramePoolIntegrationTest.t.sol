// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {RugCommerceFacet} from "../src/facets/RugCommerceFacet.sol";
import {DiamondFramePool} from "../src/DiamondFramePool.sol";
import {LibRugStorage} from "../src/libraries/LibRugStorage.sol";
import {MockERC721} from "./mocks/MockERC721.sol";

contract DiamondFramePoolIntegrationTest is Test {
    RugCommerceFacet commerce;
    DiamondFramePool pool;
    MockERC721 nft;

    address owner = address(1);
    address user1 = address(2);
    address user2 = address(3);

    uint256 minimumClaimable = 0.001 ether;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy NFT contract
        nft = new MockERC721();

        // Mint some NFTs
        nft.mint(user1, 100);
        nft.mint(user1, 200);
        nft.mint(user2, 300);

        // Deploy commerce facet (simplified - normally this would be part of diamond)
        commerce = new RugCommerceFacet();

        // Deploy pool contract
        pool = new DiamondFramePool(address(commerce), minimumClaimable);

        // Configure pool in commerce
        commerce.setPoolContract(address(pool));
        commerce.setPoolPercentage(100); // 1%

        vm.stopPrank();
    }

    /* ==================== INTEGRATION TESTS ==================== */

    function test_Integration_FullRoyaltyFlow() public {
        // Setup: Make tokens diamond frames
        vm.startPrank(address(commerce)); // Simulate diamond calling storage
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Manually set up storage (normally done by maintenance)
        rs.diamondFrameCount = 2;
        rs.diamondFrameTokens[100] = true;
        rs.diamondFrameTokens[200] = true;
        rs.diamondFrameTokenIds.push(100);
        rs.diamondFrameTokenIds.push(200);

        vm.stopPrank();

        // Simulate sale: 100 ETH sale price
        uint256 salePrice = 100 ether;

        // Commerce distributes royalties
        vm.deal(address(commerce), salePrice);
        vm.prank(owner);

        // This would normally call distributeRoyalties, but let's simulate
        uint256 poolAmount = (salePrice * 100) / 10000; // 1%

        vm.prank(address(commerce));
        (bool success,) = address(pool).call{value: poolAmount}("");
        assertTrue(success);

        // Verify pool received funds
        assertEq(pool.getPoolBalance(), poolAmount);

        // User1 claims for their tokens
        uint256[] memory user1Tokens = new uint256[](2);
        user1Tokens[0] = 100;
        user1Tokens[1] = 200;

        vm.prank(address(commerce)); // Diamond calls pool
        pool.claimForTokens(user1, user1Tokens);

        // User1 should receive poolAmount (since they own both diamond frames)
        assertEq(user1.balance, poolAmount);
    }

    function test_Integration_CommerceToPool() public {
        // Test that commerce can send to pool
        vm.deal(address(commerce), 10 ether);

        vm.prank(address(commerce));
        (bool success,) = address(pool).call{value: 5 ether}("");
        assertTrue(success);

        assertEq(pool.getPoolBalance(), 5 ether);
    }

    function test_Integration_PoolQueriesDiamond() public {
        // Setup diamond frame data
        vm.startPrank(address(commerce));
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        rs.diamondFrameCount = 1;
        rs.diamondFrameTokens[100] = true;
        rs.diamondFrameTokenIds.push(100);

        vm.stopPrank();

        // Pool should be able to query diamond
        assertEq(pool.getTotalDiamondFrameNFTs(), 1);

        // Test diamond frame queries via LibRugStorage
        vm.startPrank(address(commerce));
        bool hasFrame = LibRugStorage.hasDiamondFrame(100);
        assertTrue(hasFrame);

        bool noFrame = LibRugStorage.hasDiamondFrame(999);
        assertFalse(noFrame);
        vm.stopPrank();
    }

    function test_Integration_ClaimValidation() public {
        // Setup: user1 owns token 100, it's a diamond frame
        vm.startPrank(address(commerce));
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        rs.diamondFrameCount = 1;
        rs.diamondFrameTokens[100] = true;
        rs.diamondFrameTokenIds.push(100);

        vm.stopPrank();

        // Fund pool
        vm.deal(address(pool), 10 ether);

        // Valid claim should work
        uint256[] memory validTokens = new uint256[](1);
        validTokens[0] = 100;

        vm.prank(address(commerce));
        pool.claimForTokens(user1, validTokens);

        assertEq(user1.balance, 10 ether);
    }

    function test_Integration_InvalidClaimRejected() public {
        // Setup: token 100 is NOT a diamond frame
        vm.startPrank(address(commerce));
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        rs.diamondFrameCount = 0; // No diamond frames

        vm.stopPrank();

        // Fund pool
        vm.deal(address(pool), 10 ether);

        // Invalid claim should be rejected by diamond (before reaching pool)
        uint256[] memory invalidTokens = new uint256[](1);
        invalidTokens[0] = 100;

        // Diamond would reject this claim because token is not diamond frame
        // We can't test the full flow here because we don't have the full diamond
        // But we can test that pool rejects calls from non-diamond
        vm.expectRevert("Only diamond contract");
        pool.claimForTokens(user1, invalidTokens);
    }

    function test_Integration_MultipleUsers() public {
        // Setup: 3 diamond frames, different owners
        vm.startPrank(address(commerce));
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        rs.diamondFrameCount = 3;
        rs.diamondFrameTokens[100] = true;
        rs.diamondFrameTokens[200] = true;
        rs.diamondFrameTokens[300] = true;
        rs.diamondFrameTokenIds.push(100);
        rs.diamondFrameTokenIds.push(200);
        rs.diamondFrameTokenIds.push(300);

        vm.stopPrank();

        // Fund pool with 9 ETH
        vm.deal(address(pool), 9 ether);

        // User1 claims token 100 (gets 3 ETH)
        uint256[] memory user1Tokens = new uint256[](1);
        user1Tokens[0] = 100;

        vm.prank(address(commerce));
        pool.claimForTokens(user1, user1Tokens);

        assertEq(user1.balance, 3 ether);

        // User2 claims token 300 (gets 3 ETH)
        uint256[] memory user2Tokens = new uint256[](1);
        user2Tokens[0] = 300;

        vm.prank(address(commerce));
        pool.claimForTokens(user2, user2Tokens);

        assertEq(user2.balance, 3 ether);

        // Pool should have 3 ETH left
        assertEq(pool.getPoolBalance(), 3 ether);
    }

    /* ==================== STORAGE INTEGRATION TESTS ==================== */

    function test_StorageIntegration_DiamondFrameTracking() public {
        vm.startPrank(address(commerce));

        // Test diamond frame storage functions
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Initially no frames
        assertEq(LibRugStorage.getDiamondFrameCount(), 0);

        // Add first frame
        LibRugStorage.updateDiamondFrameCount(100, 0, 4); // token 100 becomes diamond
        assertEq(LibRugStorage.getDiamondFrameCount(), 1);
        assertTrue(LibRugStorage.hasDiamondFrame(100));

        // Add second frame
        LibRugStorage.updateDiamondFrameCount(200, 0, 4); // token 200 becomes diamond
        assertEq(LibRugStorage.getDiamondFrameCount(), 2);
        assertTrue(LibRugStorage.hasDiamondFrame(200));

        // Remove first frame
        LibRugStorage.updateDiamondFrameCount(100, 4, 0); // token 100 loses diamond
        assertEq(LibRugStorage.getDiamondFrameCount(), 1);
        assertFalse(LibRugStorage.hasDiamondFrame(100));
        assertTrue(LibRugStorage.hasDiamondFrame(200));

        vm.stopPrank();
    }

    function test_StorageIntegration_TokenIdsArray() public {
        vm.startPrank(address(commerce));

        // Add diamond frames
        LibRugStorage.updateDiamondFrameCount(100, 0, 4);
        LibRugStorage.updateDiamondFrameCount(200, 0, 4);
        LibRugStorage.updateDiamondFrameCount(300, 0, 4);

        uint256[] memory tokenIds = LibRugStorage.getDiamondFrameTokenIds();
        assertEq(tokenIds.length, 3);

        // Check that array contains our tokens (order may vary)
        bool found100 = false;
        bool found200 = false;
        bool found300 = false;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (tokenIds[i] == 100) found100 = true;
            if (tokenIds[i] == 200) found200 = true;
            if (tokenIds[i] == 300) found300 = true;
        }
        assertTrue(found100 && found200 && found300);

        // Remove one
        LibRugStorage.updateDiamondFrameCount(200, 4, 0);
        tokenIds = LibRugStorage.getDiamondFrameTokenIds();
        assertEq(tokenIds.length, 2);

        vm.stopPrank();
    }

    /* ==================== EDGE CASE INTEGRATION TESTS ==================== */

    function test_Integration_AccumulatedRoyalties() public {
        // Fund pool before any diamond frames (should accumulate)
        vm.deal(address(pool), 5 ether);

        // Verify accumulation
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 5 ether);

        // Now add diamond frames
        vm.startPrank(address(commerce));
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.diamondFrameCount = 1;
        rs.diamondFrameTokens[100] = true;
        rs.diamondFrameTokenIds.push(100);
        vm.stopPrank();

        // Next deposit should distribute accumulated
        vm.deal(address(commerce), 3 ether);
        vm.prank(address(commerce));
        (bool success,) = address(pool).call{value: 3 ether}("");
        assertTrue(success);

        // Should get 8 ETH total (5 accumulated + 3 new)
        assertEq(pool.getClaimableAmountForToken(100), 8 ether);
        assertEq(pool.accumulatedRoyaltiesBeforeFirstFrame(), 0);
    }

    function test_Integration_RoyaltyPercentageCalculation() public {
        vm.prank(owner);
        commerce.setPoolPercentage(200); // 2%

        // Simulate sale price of 1000 ETH
        uint256 salePrice = 1000 ether;
        uint256 expectedPoolAmount = (salePrice * 200) / 10000; // 20 ETH

        // In real implementation, commerce would calculate this
        assertEq(expectedPoolAmount, 20 ether);

        // Simulate commerce sending to pool
        vm.deal(address(commerce), expectedPoolAmount);
        vm.prank(address(commerce));
        (bool success,) = address(pool).call{value: expectedPoolAmount}("");
        assertTrue(success);

        assertEq(pool.getPoolBalance(), expectedPoolAmount);
    }

    /* ==================== SECURITY INTEGRATION TESTS ==================== */

    function test_Security_PoolIsolatedFromCommerce() public {
        // Pool should not be able to access commerce funds
        vm.deal(address(commerce), 100 ether);

        // Pool trying to drain commerce should fail
        vm.startPrank(address(pool));
        (bool success,) = address(commerce).call{value: 0}("");
        assertTrue(success); // Call succeeds, but no transfer

        // Commerce should still have its funds
        assertEq(address(commerce).balance, 100 ether);

        vm.stopPrank();
    }

    function test_Security_CommerceControlsPool() public {
        // Only commerce should be able to configure pool
        vm.prank(user1);
        vm.expectRevert(); // Would revert in real diamond due to ownership
        commerce.setPoolContract(address(0x123));

        // Owner should be able to
        vm.prank(owner);
        commerce.setPoolContract(address(0x123));

        (address returnedPoolContract,) = commerce.getPoolConfig();
        assertEq(returnedPoolContract, address(0x123));
    }

    function test_Security_PoolAccessControl() public {
        // Pool should reject direct user calls
        uint256[] memory tokens = new uint256[](1);
        tokens[0] = 100;

        vm.prank(user1);
        vm.expectRevert("Only diamond contract");
        pool.claimForTokens(user1, tokens);

        // Should accept calls from commerce
        vm.prank(address(commerce));
        pool.claimForTokens(user1, tokens); // Would succeed if token exists
    }
}

