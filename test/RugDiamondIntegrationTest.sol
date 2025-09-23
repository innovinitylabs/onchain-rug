// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test, console} from "forge-std/Test.sol";
import {DeployRugDiamond} from "../script/DeployRugDiamond.s.sol";

// Diamond Core
import {Diamond} from "../src/diamond/Diamond.sol";
import {IDiamondCut} from "../src/diamond/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../src/diamond/interfaces/IDiamondLoupe.sol";

// Rug Facets
import {RugNFTFacet} from "../src/facets/RugNFTFacet.sol";
import {RugAdminFacet} from "../src/facets/RugAdminFacet.sol";
import {RugAgingFacet} from "../src/facets/RugAgingFacet.sol";
import {RugMaintenanceFacet} from "../src/facets/RugMaintenanceFacet.sol";
import {RugCommerceFacet} from "../src/facets/RugCommerceFacet.sol";
import {RugLaunderingFacet} from "../src/facets/RugLaunderingFacet.sol";

// Rug Storage
import {LibRugStorage} from "../src/libraries/LibRugStorage.sol";

/**
 * @title RugDiamondIntegrationTest
 * @notice Comprehensive integration tests for the complete OnchainRugs diamond
 * @dev Tests end-to-end functionality of all facets working together
 */
contract RugDiamondIntegrationTest is Test {
    // Deployed contracts
    Diamond public diamond;
    address public diamondAddress;

    // Test accounts
    address public owner;
    address public user1;
    address public user2;
    address public user3;

    // Test constants
    uint256 constant TEST_ETH = 0.00001 ether;
    uint256 constant TOKEN_ID_1 = 1;
    uint256 constant TOKEN_ID_2 = 2;

    // Test data
    string[] testTextLines = ["HELLO", "WORLD"];

    function setUp() public {
        // Setup test accounts
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");

        // Fund test users
        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);
        vm.deal(user3, 1 ether);

        // Deploy the complete diamond
        DeployRugDiamond deployScript = new DeployRugDiamond();

        // Set environment variable for deployment
        vm.setEnv("PRIVATE_KEY", vm.toString(uint256(keccak256("test_key"))));

        // Deploy
        deployScript.run();
        diamondAddress = address(deployScript.diamond());
        diamond = Diamond(payable(diamondAddress));

        console.log("Diamond deployed at:", diamondAddress);
    }

    function test_DiamondDeployment() public {
        // Verify diamond was deployed
        assertNotEq(diamondAddress, address(0), "Diamond not deployed");

        // Test basic loupe functionality
        address[] memory facets = IDiamondLoupe(diamondAddress).facetAddresses();
        assertGt(facets.length, 1, "Not enough facets added");

        console.log("Facets deployed:", facets.length);
    }

    function test_InitialConfiguration() public {
        // Test collection cap
        (uint256 collectionCap, uint256 walletLimit,,) = RugAdminFacet(diamondAddress).getConfig();
        assertEq(collectionCap, 10000, "Collection cap not set correctly");

        // Test wallet limit
        assertEq(walletLimit, 7, "Wallet limit not set correctly");

        // Test pricing
        (uint256 basePrice,) = RugAdminFacet(diamondAddress).getMintPricing();
        assertEq(basePrice, TEST_ETH, "Base price not set correctly");

        console.log("Initial configuration verified");
    }

    function test_MintRug() public {
        // Prepare mint data
        uint256 seed = 12345;
        string memory paletteName = "Warm";
        string memory minifiedPalette = "palette_data";
        string memory minifiedStripeData = "stripe_data";
        string memory filteredCharacterMap = "char_map";
        uint8 warpThickness = 3;
        uint8 complexity = 2;
        uint256 characterCount = 10;
        uint256 stripeCount = 5;

        // Mint as user1
        vm.startPrank(user1);

        uint256 mintPrice = RugNFTFacet(diamondAddress).getMintPrice(testTextLines.length);
        assertEq(mintPrice, TEST_ETH * (1 + testTextLines.length), "Mint price calculation incorrect");

        RugNFTFacet(diamondAddress).mintRug{value: mintPrice}(
            testTextLines,
            seed,
            paletteName,
            minifiedPalette,
            minifiedStripeData,
            filteredCharacterMap,
            warpThickness,
            complexity,
            characterCount,
            stripeCount
        );

        // Verify minting
        assertEq(RugNFTFacet(diamondAddress).ownerOf(TOKEN_ID_1), user1, "NFT not minted to correct owner");
        assertEq(RugNFTFacet(diamondAddress).totalSupply(), 1, "Total supply not updated");

        // Verify rug data
        LibRugStorage.RugData memory rugData = RugNFTFacet(diamondAddress).getRugData(TOKEN_ID_1);
        assertEq(rugData.seed, seed, "Seed not stored correctly");
        assertEq(rugData.textRows.length, testTextLines.length, "Text lines not stored");

        console.log("Rug minted successfully, token ID:", TOKEN_ID_1);
        vm.stopPrank();
    }

    function test_AgingMechanics() public {
        // First mint a rug
        test_MintRug();

        // Check initial aging state
        (uint8 dirtLevel, uint8 textureLevel, bool showDirt, bool showTexture, uint256 timeSinceCleaned, uint256 timeSinceMint) =
            RugAgingFacet(diamondAddress).getAgingState(TOKEN_ID_1);

        assertEq(dirtLevel, 0, "Initial dirt level should be 0");
        assertEq(textureLevel, 0, "Initial texture level should be 0");

        // Fast forward time to trigger dirt aging (3 days)
        vm.warp(block.timestamp + 3 days + 1 hours);

        dirtLevel = RugAgingFacet(diamondAddress).getDirtLevel(TOKEN_ID_1);
        assertEq(dirtLevel, 1, "Dirt level should be 1 after 3 days");

        // Fast forward more time for dirt level 2 (7 days total)
        vm.warp(block.timestamp + 4 days);

        dirtLevel = RugAgingFacet(diamondAddress).getDirtLevel(TOKEN_ID_1);
        assertEq(dirtLevel, 2, "Dirt level should be 2 after 7 days");

        console.log("Aging mechanics working correctly");
    }

    function test_CleaningService() public {
        // Mint and age a rug
        test_MintRug();

        // Age the rug to level 2 dirt
        vm.warp(block.timestamp + 7 days + 1 hours);

        uint8 dirtBefore = RugAgingFacet(diamondAddress).getDirtLevel(TOKEN_ID_1);
        assertEq(dirtBefore, 2, "Rug should have dirt level 2");

        // Clean the rug
        vm.startPrank(user1);

        uint256 cleaningCost = RugMaintenanceFacet(diamondAddress).getCleaningCost(TOKEN_ID_1);
        RugMaintenanceFacet(diamondAddress).cleanRug{value: cleaningCost}(TOKEN_ID_1);

        // Verify cleaning
        uint8 dirtAfter = RugAgingFacet(diamondAddress).getDirtLevel(TOKEN_ID_1);
        assertEq(dirtAfter, 0, "Rug should be clean after cleaning");

        console.log("Cleaning service working correctly");
        vm.stopPrank();
    }

    function test_TextureAgingAndRestoration() public {
        // Mint a rug
        test_MintRug();

        // Age for texture level progression (30 days for level 1)
        vm.warp(block.timestamp + 30 days + 1 hours);

        uint8 textureLevel = RugAgingFacet(diamondAddress).getTextureLevel(TOKEN_ID_1);
        assertGt(textureLevel, 0, "Texture should have aged");

        // Restore texture level
        vm.startPrank(user1);

        uint256 restorationCost = RugMaintenanceFacet(diamondAddress).getRestorationCost(TOKEN_ID_1);
        assertGt(restorationCost, 0, "Restoration should cost something");

        uint8 textureBefore = textureLevel;
        RugMaintenanceFacet(diamondAddress).restoreRug{value: restorationCost}(TOKEN_ID_1);

        uint8 textureAfter = RugAgingFacet(diamondAddress).getTextureLevel(TOKEN_ID_1);
        assertLt(textureAfter, textureBefore, "Texture level should decrease after restoration");

        console.log("Texture restoration working correctly");
        vm.stopPrank();
    }

    function test_LaunderingSystem() public {
        // Mint a rug
        test_MintRug();

        // Enable laundering
        RugAdminFacet(diamondAddress).setLaunderingEnabled(true);

        // Record a high-value sale that should trigger laundering
        vm.startPrank(user1);

        // Transfer to user2 first
        RugNFTFacet(diamondAddress).transferFrom(user1, user2, TOKEN_ID_1);

        vm.stopPrank();
        vm.startPrank(user2);

        // Record sale with price above threshold
        uint256 highSalePrice = TEST_ETH * 2; // Above laundering threshold
        RugLaunderingFacet(diamondAddress).recordSale(TOKEN_ID_1, user1, user2, highSalePrice);

        // Check if laundering was triggered
        (uint8 dirtLevel,,,,,) = RugAgingFacet(diamondAddress).getAgingState(TOKEN_ID_1);
        assertEq(dirtLevel, 0, "Rug should be laundered (clean) after high-value sale");

        console.log("Laundering system working correctly");
        vm.stopPrank();
    }

    function test_RoyaltySystem() public {
        // Test royalty configuration
        (uint256 royaltyPercent,,) = RugCommerceFacet(payable(diamondAddress)).getRoyaltyConfig();
        assertEq(royaltyPercent, 500, "Royalty percentage should be 5%");

        // Test royalty calculation
        uint256 salePrice = 1 ether;
        (address receiver, uint256 royaltyAmount) = RugCommerceFacet(payable(diamondAddress)).royaltyInfo(TOKEN_ID_1, salePrice);
        assertEq(royaltyAmount, salePrice * 500 / 10000, "Royalty calculation incorrect");

        console.log("Royalty system working correctly");
    }

    function test_WalletLimits() public {
        // Mint 7 rugs as user1 to hit the wallet limit
        vm.startPrank(user1);
        for (uint256 i = 1; i <= 7; i++) {
            uint256 mintPrice = RugNFTFacet(diamondAddress).getMintPrice(1);
            string[] memory singleLine = new string[](1);
            singleLine[0] = string(abi.encodePacked("TEST", i));

            RugNFTFacet(diamondAddress).mintRug{value: mintPrice}(
                singleLine,
                uint256(keccak256(abi.encode(i))),
                "Test",
                "palette",
                "stripes",
                "chars",
                2,
                1,
                4,
                3
            );
        }
        vm.stopPrank();

        // Test that 8th mint is blocked for user1 (wallet limit exceeded)
        vm.startPrank(user1);
        bool canMint = RugNFTFacet(diamondAddress).canMint(user1);
        assertFalse(canMint, "Should not be able to mint 8th rug");

        console.log("Wallet limits working correctly");
        vm.stopPrank();
    }

    function test_TextUniqueness() public {
        // Mint first rug with specific text
        vm.startPrank(user1);
        uint256 mintPrice = RugNFTFacet(diamondAddress).getMintPrice(testTextLines.length);
        RugNFTFacet(diamondAddress).mintRug{value: mintPrice}(
            testTextLines,
            12345,
            "Warm",
            "palette_data",
            "stripe_data",
            "char_map",
            3,
            2,
            10,
            5
        );
        vm.stopPrank();

        // Try to mint same text again - should fail
        vm.startPrank(user2);
        bool isAvailable = RugNFTFacet(diamondAddress).isTextAvailable(testTextLines);
        assertFalse(isAvailable, "Text should not be available after first mint");

        console.log("Text uniqueness working correctly");
        vm.stopPrank();
    }

    function test_OwnerControls() public {
        // Test collection cap update
        RugAdminFacet(diamondAddress).updateCollectionCap(5000);
        (uint256 newCap,,,) = RugAdminFacet(diamondAddress).getConfig();
        assertEq(newCap, 5000, "Collection cap update failed");

        // Test pricing update
        uint256[6] memory newPrices = [TEST_ETH * 2, TEST_ETH * 2, TEST_ETH * 2, TEST_ETH * 2, TEST_ETH * 2, TEST_ETH * 2];
        RugAdminFacet(diamondAddress).updateMintPricing(newPrices);

        (uint256 newBasePrice,) = RugAdminFacet(diamondAddress).getMintPricing();
        assertEq(newBasePrice, TEST_ETH * 2, "Pricing update failed");

        console.log("Owner controls working correctly");
    }

    function test_WithdrawFunction() public {
        // Send some ETH to the diamond
        vm.deal(diamondAddress, 1 ether);

        uint256 initialBalance = owner.balance;
        uint256 contractBalance = RugCommerceFacet(payable(diamondAddress)).getBalance();
        assertEq(contractBalance, 1 ether, "Contract should have 1 ether");

        // Withdraw as owner
        RugCommerceFacet(payable(diamondAddress)).withdraw(0.5 ether);

        uint256 finalBalance = owner.balance;
        assertEq(finalBalance, initialBalance + 0.5 ether, "Owner should receive withdrawn ETH");

        console.log("Withdraw function working correctly");
    }

    function test_CompleteWorkflow() public {
        console.log("Testing complete workflow...");

        // 1. Mint a rug
        test_MintRug();
        console.log("Rug minted");

        // 2. Age the rug
        vm.warp(block.timestamp + 10 days);
        uint8 dirtLevel = RugAgingFacet(diamondAddress).getDirtLevel(TOKEN_ID_1);
        assertGt(dirtLevel, 0, "Rug should have aged");
        console.log("Rug aged, dirt level:", dirtLevel);

        // 3. Clean the rug
        vm.startPrank(user1);
        uint256 cleaningCost = RugMaintenanceFacet(diamondAddress).getCleaningCost(TOKEN_ID_1);
        RugMaintenanceFacet(diamondAddress).cleanRug{value: cleaningCost}(TOKEN_ID_1);
        console.log("Rug cleaned, cost:", cleaningCost);

        // 4. Transfer and sell
        RugNFTFacet(diamondAddress).transferFrom(user1, user2, TOKEN_ID_1);
        vm.stopPrank();

        // 5. Record sale with laundering
        RugAdminFacet(diamondAddress).setLaunderingEnabled(true);
        vm.prank(user2);
        RugLaunderingFacet(diamondAddress).recordSale(TOKEN_ID_1, user1, user2, TEST_ETH * 2);
        console.log("Sale recorded with laundering");

        // 6. Verify laundering occurred
        (uint8 finalDirt,,,,,) = RugAgingFacet(diamondAddress).getAgingState(TOKEN_ID_1);
        assertEq(finalDirt, 0, "Rug should be laundered after sale");
        console.log("Laundering verified, final dirt level:", finalDirt);

        console.log("Complete workflow test passed!");
    }
}
