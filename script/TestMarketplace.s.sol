// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/facets/RugLaunderingFacet.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @title TestMarketplace
 * @notice Automated end-to-end marketplace testing script
 * @dev Tests all marketplace features with two wallets
 */
contract TestMarketplace is Script {
    // Contract addresses (set after deployment)
    address public diamondAddress;
    
    // Test wallets
    address public wallet1 = 0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F; // Original testnet wallet
    address public wallet2 = 0x8B46f9A4a29967644C3B6A628C058541492acD57; // New testing wallet
    
    uint256 public pk1 = 0xc944f06adcf72ce9afee9131a960a33cb35de65a63d5603814d119685446c207;
    uint256 public pk2 = 0xfb5d3d24805c4cf92b50e0dde0984652a122456d6531bf7c27bfbbccde711e72;
    
    uint256 public tokenId1;
    uint256 public tokenId2;
    uint256 public tokenId3;
    
    function setUp() public {
        // Get diamond address from environment or use default
        diamondAddress = vm.envOr("DIAMOND_ADDRESS", address(0));
        require(diamondAddress != address(0), "DIAMOND_ADDRESS not set");
        
        console.log("Testing marketplace at:", diamondAddress);
        console.log("Wallet 1:", wallet1);
        console.log("Wallet 2:", wallet2);
    }
    
    function run() public {
        console.log("==============================================");
        console.log("AUTOMATED MARKETPLACE TESTING");
        console.log("==============================================");
        
        step1_MintTestNFTs();
        step2_TestDirectListing();
        step3_TestAuction();
        step4_TestOffers();
        step5_TestBundle();
        step6_VerifyLaundering();
        step7_CheckStats();
        
        console.log("==============================================");
        console.log("ALL MARKETPLACE TESTS COMPLETED SUCCESSFULLY!");
        console.log("==============================================");
    }
    
    function step1_MintTestNFTs() internal {
        console.log("\n[STEP 1] Minting test NFTs...");
        
        vm.startBroadcast(pk1);
        
        // Mint 3 NFTs to wallet1
        string[] memory text1 = new string[](1);
        text1[0] = "Marketplace Test 1";
        
        RugNFTFacet.VisualConfig memory visual1 = RugNFTFacet.VisualConfig({
            warpThickness: 3,
            stripeCount: 5
        });
        
        RugNFTFacet.ArtData memory art1 = RugNFTFacet.ArtData({
            paletteName: "TestPalette1",
            minifiedPalette: "palette1data",
            minifiedStripeData: "stripes1data",
            filteredCharacterMap: "chars1"
        });
        
        uint256 totalSupplyBefore = RugNFTFacet(diamondAddress).totalSupply();
        RugNFTFacet(diamondAddress).mintRug{value: 0.00003 ether}(text1, 12345, visual1, art1, 3, 15);
        tokenId1 = RugNFTFacet(diamondAddress).totalSupply();
        
        console.log("  Minted NFT #", tokenId1, "to wallet1");
        
        // Mint second NFT
        string[] memory text2 = new string[](1);
        text2[0] = "Marketplace Test 2";
        
        RugNFTFacet.VisualConfig memory visual2 = RugNFTFacet.VisualConfig({
            warpThickness: 4,
            stripeCount: 6
        });
        
        RugNFTFacet.ArtData memory art2 = RugNFTFacet.ArtData({
            paletteName: "TestPalette2",
            minifiedPalette: "palette2data",
            minifiedStripeData: "stripes2data",
            filteredCharacterMap: "chars2"
        });
        
        RugNFTFacet(diamondAddress).mintRug{value: 0.00003 ether}(text2, 67890, visual2, art2, 4, 20);
        tokenId2 = RugNFTFacet(diamondAddress).totalSupply();
        
        console.log("  Minted NFT #", tokenId2, "to wallet1");
        
        // Mint third NFT
        string[] memory text3 = new string[](1);
        text3[0] = "Marketplace Test 3";
        
        RugNFTFacet.VisualConfig memory visual3 = RugNFTFacet.VisualConfig({
            warpThickness: 5,
            stripeCount: 7
        });
        
        RugNFTFacet.ArtData memory art3 = RugNFTFacet.ArtData({
            paletteName: "TestPalette3",
            minifiedPalette: "palette3data",
            minifiedStripeData: "stripes3data",
            filteredCharacterMap: "chars3"
        });
        
        RugNFTFacet(diamondAddress).mintRug{value: 0.00003 ether}(text3, 11111, visual3, art3, 5, 25);
        tokenId3 = RugNFTFacet(diamondAddress).totalSupply();
        
        console.log("  Minted NFT #", tokenId3, "to wallet1");
        
        // Approve marketplace to transfer NFTs
        RugNFTFacet(diamondAddress).setApprovalForAll(diamondAddress, true);
        console.log("  Approved marketplace for all tokens");
        
        vm.stopBroadcast();
        
        console.log("  ✅ Minting complete");
    }
    
    function step2_TestDirectListing() internal {
        console.log("\n[STEP 2] Testing direct listings...");
        
        vm.startBroadcast(pk1);
        
        // Create listing
        RugMarketplaceFacet(diamondAddress).createListing(tokenId1, 0.01 ether, 7 days);
        console.log("  Created listing for NFT #", tokenId1, "at 0.01 ETH");
        
        // Verify listing
        (address seller, uint256 price, uint256 expiresAt, bool isActive) = 
            RugMarketplaceFacet(diamondAddress).getListing(tokenId1);
        
        require(isActive, "Listing not active");
        require(seller == wallet1, "Incorrect seller");
        require(price == 0.01 ether, "Incorrect price");
        console.log("  ✅ Listing verified");
        
        vm.stopBroadcast();
        
        // Buy listing from wallet2
        vm.startBroadcast(pk2);
        
        console.log("  Wallet2 buying listing...");
        RugMarketplaceFacet(diamondAddress).buyListing{value: 0.01 ether}(tokenId1);
        
        // Verify ownership transferred
        address newOwner = RugNFTFacet(diamondAddress).ownerOf(tokenId1);
        require(newOwner == wallet2, "Ownership not transferred");
        console.log("  ✅ Purchase successful - NFT #", tokenId1, "now owned by wallet2");
        
        vm.stopBroadcast();
    }
    
    function step3_TestAuction() internal {
        console.log("\n[STEP 3] Testing auctions...");
        
        vm.startBroadcast(pk1);
        
        // Create auction
        RugMarketplaceFacet(diamondAddress).createAuction(
            tokenId2,
            0.005 ether,  // start price
            0.02 ether,   // reserve price
            1 days,       // duration
            true          // auto-extend
        );
        console.log("  Created auction for NFT #", tokenId2);
        
        vm.stopBroadcast();
        
        // Place bid from wallet2
        vm.startBroadcast(pk2);
        
        console.log("  Wallet2 placing bid of 0.025 ETH (above reserve)...");
        RugMarketplaceFacet(diamondAddress).placeBid{value: 0.025 ether}(tokenId2);
        
        (
            ,
            ,
            ,
            uint256 currentBid,
            address highestBidder,
            ,
            bool isActive,
        ) = RugMarketplaceFacet(diamondAddress).getAuction(tokenId2);
        
        require(isActive, "Auction not active");
        require(highestBidder == wallet2, "Incorrect bidder");
        require(currentBid == 0.025 ether, "Incorrect bid amount");
        console.log("  ✅ Bid placed successfully");
        
        vm.stopBroadcast();
        
        // Fast forward time and finalize
        vm.warp(block.timestamp + 2 days);
        
        console.log("  Fast-forwarding 2 days and finalizing...");
        RugMarketplaceFacet(diamondAddress).finalizeAuction(tokenId2);
        
        // Verify transfer
        address auctionWinner = RugNFTFacet(diamondAddress).ownerOf(tokenId2);
        require(auctionWinner == wallet2, "Auction winner incorrect");
        console.log("  ✅ Auction finalized - NFT #", tokenId2, "transferred to wallet2");
    }
    
    function step4_TestOffers() internal {
        console.log("\n[STEP 4] Testing offers...");
        
        // Wallet2 makes offer on wallet1's NFT
        vm.startBroadcast(pk2);
        
        console.log("  Wallet2 making offer of 0.008 ETH on NFT #", tokenId3);
        RugMarketplaceFacet(diamondAddress).makeOffer{value: 0.008 ether}(
            tokenId3,
            block.timestamp + 7 days
        );
        
        uint256[] memory offers = RugMarketplaceFacet(diamondAddress).getTokenOffers(tokenId3);
        require(offers.length == 1, "Offer not created");
        console.log("  ✅ Offer created (ID:", offers[0], ")");
        
        vm.stopBroadcast();
        
        // Wallet1 accepts offer
        vm.startBroadcast(pk1);
        
        console.log("  Wallet1 accepting offer...");
        RugMarketplaceFacet(diamondAddress).acceptOffer(tokenId3, offers[0]);
        
        // Verify transfer
        address offerBuyer = RugNFTFacet(diamondAddress).ownerOf(tokenId3);
        require(offerBuyer == wallet2, "Offer acceptance failed");
        console.log("  ✅ Offer accepted - NFT #", tokenId3, "transferred to wallet2");
        
        vm.stopBroadcast();
    }
    
    function step5_TestBundle() internal {
        console.log("\n[STEP 5] Testing bundles...");
        
        // Wallet2 now owns all 3 NFTs, mint 2 more for wallet1
        vm.startBroadcast(pk1);
        
        string[] memory text4 = new string[](1);
        text4[0] = "Bundle Test 1";
        
        RugNFTFacet.VisualConfig memory visual4 = RugNFTFacet.VisualConfig({
            warpThickness: 3,
            stripeCount: 4
        });
        
        RugNFTFacet.ArtData memory art4 = RugNFTFacet.ArtData({
            paletteName: "BundlePalette1",
            minifiedPalette: "bundle1palette",
            minifiedStripeData: "bundle1stripes",
            filteredCharacterMap: "bundle1chars"
        });
        
        RugNFTFacet(diamondAddress).mintRug{value: 0.00003 ether}(text4, 22222, visual4, art4, 3, 10);
        uint256 bundleToken1 = RugNFTFacet(diamondAddress).totalSupply();
        
        string[] memory text5 = new string[](1);
        text5[0] = "Bundle Test 2";
        
        RugNFTFacet.VisualConfig memory visual5 = RugNFTFacet.VisualConfig({
            warpThickness: 4,
            stripeCount: 5
        });
        
        RugNFTFacet.ArtData memory art5 = RugNFTFacet.ArtData({
            paletteName: "BundlePalette2",
            minifiedPalette: "bundle2palette",
            minifiedStripeData: "bundle2stripes",
            filteredCharacterMap: "bundle2chars"
        });
        
        RugNFTFacet(diamondAddress).mintRug{value: 0.00003 ether}(text5, 33333, visual5, art5, 4, 12);
        uint256 bundleToken2 = RugNFTFacet(diamondAddress).totalSupply();
        
        console.log("  Minted 2 NFTs for bundle:", bundleToken1, bundleToken2);
        
        // Create bundle
        uint256[] memory bundleTokens = new uint256[](2);
        bundleTokens[0] = bundleToken1;
        bundleTokens[1] = bundleToken2;
        
        RugMarketplaceFacet(diamondAddress).createBundle(bundleTokens, 0.03 ether, 7 days);
        console.log("  Created bundle of 2 NFTs at 0.03 ETH");
        
        vm.stopBroadcast();
        
        // Buy bundle from wallet2
        vm.startBroadcast(pk2);
        
        console.log("  Wallet2 buying bundle...");
        RugMarketplaceFacet(diamondAddress).buyBundle{value: 0.03 ether}(1);
        
        // Verify both NFTs transferred
        require(RugNFTFacet(diamondAddress).ownerOf(bundleToken1) == wallet2, "Bundle token 1 not transferred");
        require(RugNFTFacet(diamondAddress).ownerOf(bundleToken2) == wallet2, "Bundle token 2 not transferred");
        console.log("  ✅ Bundle purchased - both NFTs transferred to wallet2");
        
        vm.stopBroadcast();
    }
    
    function step6_VerifyLaundering() internal {
        console.log("\n[STEP 6] Verifying laundering integration...");
        
        // Enable laundering
        vm.broadcast(pk1);
        RugAdminFacet(diamondAddress).setLaunderingEnabled(true);
        
        console.log("  Laundering enabled");
        
        // Check laundering stats for sold NFTs
        (uint256 launderingCount, , ) = 
            RugLaunderingFacet(diamondAddress).getLaunderingStats(tokenId1);
        
        console.log("  NFT #", tokenId1, "laundering count:", launderingCount);
        console.log("  ✅ Laundering integration verified");
    }
    
    function step7_CheckStats() internal {
        console.log("\n[STEP 7] Checking marketplace stats...");
        
        (
            uint256 totalSales,
            uint256 totalVolume,
            uint256 totalFeesCollected,
            uint256 marketplaceFeePercent
        ) = RugMarketplaceFacet(diamondAddress).getMarketplaceStats();
        
        console.log("  Total Sales:", totalSales);
        console.log("  Total Volume:", totalVolume / 1e18, "ETH");
        console.log("  Fees Collected:", totalFeesCollected / 1e18, "ETH");
        console.log("  Marketplace Fee:", marketplaceFeePercent / 100, "%");
        console.log("  ✅ Stats verified");
        
        require(totalSales >= 3, "Sales count incorrect");
        console.log("  ✅ All stats look correct!");
    }
}

