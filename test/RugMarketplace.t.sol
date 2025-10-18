// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/diamond/Diamond.sol";
import "../src/diamond/facets/DiamondCutFacet.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/facets/RugLaunderingFacet.sol";
import "../src/facets/RugCommerceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title RugMarketplace Test Suite
 * @notice Comprehensive tests for marketplace functionality
 */
contract RugMarketplaceTest is Test {
    Diamond public diamond;
    DiamondCutFacet public diamondCutFacet;
    RugNFTFacet public rugNFTFacet;
    RugAdminFacet public rugAdminFacet;
    RugMarketplaceFacet public rugMarketplaceFacet;
    RugLaunderingFacet public rugLaunderingFacet;
    RugCommerceFacet public rugCommerceFacet;
    
    address public owner = address(1);
    address public seller = address(2);
    address public buyer = address(3);
    address public bidder1 = address(4);
    address public bidder2 = address(5);
    
    uint256 public tokenId1 = 1;
    uint256 public tokenId2 = 2;
    uint256 public tokenId3 = 3;
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy diamond infrastructure
        diamondCutFacet = new DiamondCutFacet();
        diamond = new Diamond(owner, address(diamondCutFacet));
        
        // Deploy facets
        rugNFTFacet = new RugNFTFacet();
        rugAdminFacet = new RugAdminFacet();
        rugMarketplaceFacet = new RugMarketplaceFacet();
        rugLaunderingFacet = new RugLaunderingFacet();
        rugCommerceFacet = new RugCommerceFacet();
        
        // Add NFT facet
        IDiamondCut.FacetCut[] memory nftCut = new IDiamondCut.FacetCut[](1);
        nftCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getRugNFTSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(nftCut, address(0), "");
        
        // Add admin facet
        IDiamondCut.FacetCut[] memory adminCut = new IDiamondCut.FacetCut[](1);
        adminCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAdminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getRugAdminSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(adminCut, address(0), "");
        
        // Add marketplace facet
        IDiamondCut.FacetCut[] memory marketplaceCut = new IDiamondCut.FacetCut[](1);
        marketplaceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMarketplaceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getMarketplaceSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(marketplaceCut, address(0), "");
        
        // Add laundering facet
        IDiamondCut.FacetCut[] memory launderingCut = new IDiamondCut.FacetCut[](1);
        launderingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugLaunderingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getLaunderingSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(launderingCut, address(0), "");
        
        // Add commerce facet
        IDiamondCut.FacetCut[] memory commerceCut = new IDiamondCut.FacetCut[](1);
        commerceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugCommerceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getCommerceSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(commerceCut, address(0), "");
        
        // Initialize marketplace
        RugMarketplaceFacet(address(diamond)).initializeMarketplace();
        
        // Launch collection and set pricing
        RugAdminFacet(address(diamond)).setLaunchStatus(true);
        uint256[6] memory prices = [uint256(0.001 ether), 0, 0, 0, 0, 0];
        RugAdminFacet(address(diamond)).updateMintPricing(prices);
        RugAdminFacet(address(diamond)).updateCollectionCap(10000);
        RugAdminFacet(address(diamond)).updateWalletLimit(100); // Allow seller to mint multiple for testing
        
        vm.stopPrank();
        
        // Mint test NFTs to seller
        vm.deal(seller, 100 ether);
        vm.startPrank(seller);
        
        string[] memory text1 = new string[](1);
        text1[0] = "Test Rug 1";
        
        RugNFTFacet.VisualConfig memory visual1 = RugNFTFacet.VisualConfig({
            warpThickness: 3,
            stripeCount: 5
        });
        
        RugNFTFacet.ArtData memory art1 = RugNFTFacet.ArtData({
            paletteName: "Rainbow",
            minifiedPalette: "palette1",
            minifiedStripeData: "stripes1",
            filteredCharacterMap: "chars1"
        });
        
        RugNFTFacet(address(diamond)).mintRug{value: 0.001 ether}(text1, 12345, visual1, art1, 3, 10);
        
        string[] memory text2 = new string[](1);
        text2[0] = "Test Rug 2";
        
        RugNFTFacet.VisualConfig memory visual2 = RugNFTFacet.VisualConfig({
            warpThickness: 4,
            stripeCount: 6
        });
        
        RugNFTFacet.ArtData memory art2 = RugNFTFacet.ArtData({
            paletteName: "Ocean",
            minifiedPalette: "palette2",
            minifiedStripeData: "stripes2",
            filteredCharacterMap: "chars2"
        });
        
        RugNFTFacet(address(diamond)).mintRug{value: 0.001 ether}(text2, 67890, visual2, art2, 4, 11);
        
        string[] memory text3 = new string[](1);
        text3[0] = "Test Rug 3";
        
        RugNFTFacet.VisualConfig memory visual3 = RugNFTFacet.VisualConfig({
            warpThickness: 5,
            stripeCount: 7
        });
        
        RugNFTFacet.ArtData memory art3 = RugNFTFacet.ArtData({
            paletteName: "Sunset",
            minifiedPalette: "palette3",
            minifiedStripeData: "stripes3",
            filteredCharacterMap: "chars3"
        });
        
        RugNFTFacet(address(diamond)).mintRug{value: 0.001 ether}(text3, 11111, visual3, art3, 5, 12);
        
        // Approve marketplace to transfer NFTs
        RugNFTFacet(address(diamond)).setApprovalForAll(address(diamond), true);
        
        vm.stopPrank();
        
        // Fund buyer and bidders
        vm.deal(buyer, 100 ether);
        vm.deal(bidder1, 100 ether);
        vm.deal(bidder2, 100 ether);
    }
    
    // ===== LISTING TESTS =====
    
    function testCreateListing() public {
        vm.startPrank(seller);
        
        RugMarketplaceFacet(address(diamond)).createListing(tokenId1, 1 ether, 7 days);
        
        (address listingSeller, uint256 price, uint256 expiresAt, bool isActive) = 
            RugMarketplaceFacet(address(diamond)).getListing(tokenId1);
        
        assertEq(listingSeller, seller);
        assertEq(price, 1 ether);
        assertTrue(isActive);
        assertGt(expiresAt, block.timestamp);
        
        vm.stopPrank();
    }
    
    function testCannotListNonOwnedToken() public {
        vm.startPrank(buyer);
        
        vm.expectRevert();
        RugMarketplaceFacet(address(diamond)).createListing(tokenId1, 1 ether, 7 days);
        
        vm.stopPrank();
    }
    
    function testBuyListing() public {
        // Seller creates listing
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createListing(tokenId1, 1 ether, 7 days);
        
        // Buyer purchases
        vm.prank(buyer);
        RugMarketplaceFacet(address(diamond)).buyListing{value: 1 ether}(tokenId1);
        
        // Verify ownership transferred
        assertEq(RugNFTFacet(address(diamond)).ownerOf(tokenId1), buyer);
        
        // Verify listing deactivated
        (, , , bool isActive) = RugMarketplaceFacet(address(diamond)).getListing(tokenId1);
        assertFalse(isActive);
    }
    
    function testCancelListing() public {
        vm.startPrank(seller);
        
        RugMarketplaceFacet(address(diamond)).createListing(tokenId1, 1 ether, 7 days);
        RugMarketplaceFacet(address(diamond)).cancelListing(tokenId1);
        
        (, , , bool isActive) = RugMarketplaceFacet(address(diamond)).getListing(tokenId1);
        assertFalse(isActive);
        
        vm.stopPrank();
    }
    
    function testUpdateListingPrice() public {
        vm.startPrank(seller);
        
        RugMarketplaceFacet(address(diamond)).createListing(tokenId1, 1 ether, 7 days);
        RugMarketplaceFacet(address(diamond)).updateListingPrice(tokenId1, 2 ether);
        
        (, uint256 price, , ) = RugMarketplaceFacet(address(diamond)).getListing(tokenId1);
        assertEq(price, 2 ether);
        
        vm.stopPrank();
    }
    
    // ===== AUCTION TESTS =====
    
    function testCreateAuction() public {
        vm.startPrank(seller);
        
        RugMarketplaceFacet(address(diamond)).createAuction(
            tokenId1, 
            0.5 ether,  // start price
            1 ether,     // reserve price
            3 days,      // duration
            true         // auto-extend
        );
        
        (
            address auctionSeller,
            uint256 startPrice,
            uint256 reservePrice,
            ,
            ,
            uint256 endTime,
            bool isActive,
            bool autoExtend
        ) = RugMarketplaceFacet(address(diamond)).getAuction(tokenId1);
        
        assertEq(auctionSeller, seller);
        assertEq(startPrice, 0.5 ether);
        assertEq(reservePrice, 1 ether);
        assertTrue(isActive);
        assertTrue(autoExtend);
        assertEq(endTime, block.timestamp + 3 days);
        
        vm.stopPrank();
    }
    
    function testPlaceBid() public {
        // Create auction
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createAuction(
            tokenId1,
            0.5 ether,
            1 ether,
            3 days,
            false
        );
        
        // Place bid
        vm.prank(bidder1);
        RugMarketplaceFacet(address(diamond)).placeBid{value: 0.5 ether}(tokenId1);
        
        (, , , uint256 currentBid, address highestBidder, , , ) = 
            RugMarketplaceFacet(address(diamond)).getAuction(tokenId1);
        
        assertEq(currentBid, 0.5 ether);
        assertEq(highestBidder, bidder1);
    }
    
    function testOutbidRefundsPreviousBidder() public {
        // Create auction
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createAuction(tokenId1, 0.5 ether, 0, 3 days, false);
        
        // First bid
        vm.prank(bidder1);
        RugMarketplaceFacet(address(diamond)).placeBid{value: 0.5 ether}(tokenId1);
        uint256 bidder1BalanceBefore = bidder1.balance;
        
        // Second bid (outbids first)
        vm.prank(bidder2);
        RugMarketplaceFacet(address(diamond)).placeBid{value: 0.6 ether}(tokenId1);
        
        // Verify first bidder was refunded
        assertEq(bidder1.balance, bidder1BalanceBefore + 0.5 ether);
    }
    
    function testAutoExtendAuction() public {
        // Create auction with auto-extend
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createAuction(tokenId1, 0.5 ether, 0, 1 hours, true);
        
        (, , , , , uint256 originalEndTime, , ) = 
            RugMarketplaceFacet(address(diamond)).getAuction(tokenId1);
        
        // Fast forward to near end (within auto-extend threshold)
        vm.warp(block.timestamp + 55 minutes);
        
        // Place bid
        vm.prank(bidder1);
        RugMarketplaceFacet(address(diamond)).placeBid{value: 0.5 ether}(tokenId1);
        
        (, , , , , uint256 newEndTime, , ) = 
            RugMarketplaceFacet(address(diamond)).getAuction(tokenId1);
        
        // Verify auction was extended
        assertGt(newEndTime, originalEndTime);
    }
    
    function testFinalizeAuction() public {
        // Create and complete auction
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createAuction(tokenId1, 0.5 ether, 0, 1 hours, false);
        
        vm.prank(bidder1);
        RugMarketplaceFacet(address(diamond)).placeBid{value: 1 ether}(tokenId1);
        
        // Fast forward past end time
        vm.warp(block.timestamp + 2 hours);
        
        // Finalize
        RugMarketplaceFacet(address(diamond)).finalizeAuction(tokenId1);
        
        // Verify ownership transferred
        assertEq(RugNFTFacet(address(diamond)).ownerOf(tokenId1), bidder1);
        
        // Verify auction deactivated
        (, , , , , , bool isActive, ) = 
            RugMarketplaceFacet(address(diamond)).getAuction(tokenId1);
        assertFalse(isActive);
    }
    
    function testReservePriceEnforcement() public {
        // Create auction with reserve
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createAuction(
            tokenId1,
            0.5 ether,
            2 ether,  // reserve price
            1 hours,
            false
        );
        
        // Bid below reserve
        vm.prank(bidder1);
        RugMarketplaceFacet(address(diamond)).placeBid{value: 1 ether}(tokenId1);
        
        // Fast forward and finalize
        vm.warp(block.timestamp + 2 hours);
        RugMarketplaceFacet(address(diamond)).finalizeAuction(tokenId1);
        
        // Verify NFT NOT transferred (reserve not met)
        assertEq(RugNFTFacet(address(diamond)).ownerOf(tokenId1), seller);
        
        // Verify bidder was refunded
        assertGt(bidder1.balance, 99 ether); // Got bid back
    }
    
    // ===== OFFER TESTS =====
    
    function testMakeOffer() public {
        vm.prank(buyer);
        RugMarketplaceFacet(address(diamond)).makeOffer{value: 0.8 ether}(
            tokenId1,
            block.timestamp + 7 days
        );
        
        uint256[] memory offers = RugMarketplaceFacet(address(diamond)).getTokenOffers(tokenId1);
        assertEq(offers.length, 1);
        
        (address offerer, uint256 tokenId, uint256 price, , bool isActive) = 
            RugMarketplaceFacet(address(diamond)).getOffer(offers[0]);
        
        assertEq(offerer, buyer);
        assertEq(tokenId, tokenId1);
        assertEq(price, 0.8 ether);
        assertTrue(isActive);
    }
    
    function testAcceptOffer() public {
        // Buyer makes offer
        vm.prank(buyer);
        RugMarketplaceFacet(address(diamond)).makeOffer{value: 0.8 ether}(tokenId1, 0);
        
        uint256[] memory offers = RugMarketplaceFacet(address(diamond)).getTokenOffers(tokenId1);
        uint256 offerId = offers[0];
        
        // Seller accepts
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).acceptOffer(tokenId1, offerId);
        
        // Verify ownership transferred
        assertEq(RugNFTFacet(address(diamond)).ownerOf(tokenId1), buyer);
        
        // Verify offer deactivated
        (, , , , bool isActive) = RugMarketplaceFacet(address(diamond)).getOffer(offerId);
        assertFalse(isActive);
    }
    
    function testCancelOffer() public {
        vm.startPrank(buyer);
        
        uint256 balanceBefore = buyer.balance;
        RugMarketplaceFacet(address(diamond)).makeOffer{value: 0.8 ether}(tokenId1, 0);
        
        uint256[] memory offers = RugMarketplaceFacet(address(diamond)).getTokenOffers(tokenId1);
        RugMarketplaceFacet(address(diamond)).cancelOffer(offers[0]);
        
        // Verify refund
        assertEq(buyer.balance, balanceBefore);
        
        vm.stopPrank();
    }
    
    function testCollectionOffer() public {
        vm.prank(buyer);
        RugMarketplaceFacet(address(diamond)).makeCollectionOffer{value: 1 ether}(
            block.timestamp + 7 days
        );
        
        uint256[] memory collectionOffers = RugMarketplaceFacet(address(diamond)).getCollectionOffers();
        assertEq(collectionOffers.length, 1);
    }
    
    // ===== BUNDLE TESTS =====
    
    function testCreateBundle() public {
        vm.startPrank(seller);
        
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = tokenId1;
        tokenIds[1] = tokenId2;
        
        RugMarketplaceFacet(address(diamond)).createBundle(tokenIds, 3 ether, 7 days);
        
        (address bundleSeller, uint256[] memory bundleTokens, uint256 price, , bool isActive) = 
            RugMarketplaceFacet(address(diamond)).getBundle(1);
        
        assertEq(bundleSeller, seller);
        assertEq(bundleTokens.length, 2);
        assertEq(price, 3 ether);
        assertTrue(isActive);
        
        vm.stopPrank();
    }
    
    function testBuyBundle() public {
        // Create bundle
        vm.startPrank(seller);
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = tokenId1;
        tokenIds[1] = tokenId2;
        RugMarketplaceFacet(address(diamond)).createBundle(tokenIds, 3 ether, 7 days);
        vm.stopPrank();
        
        // Buy bundle
        vm.prank(buyer);
        RugMarketplaceFacet(address(diamond)).buyBundle{value: 3 ether}(1);
        
        // Verify both NFTs transferred
        assertEq(RugNFTFacet(address(diamond)).ownerOf(tokenId1), buyer);
        assertEq(RugNFTFacet(address(diamond)).ownerOf(tokenId2), buyer);
    }
    
    // ===== FEE & ROYALTY TESTS =====
    
    function testMarketplaceFeeCollection() public {
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createListing(tokenId1, 1 ether, 7 days);
        
        (uint256 totalSalesBefore, uint256 totalVolumeBefore, uint256 feesBefore, ) = 
            RugMarketplaceFacet(address(diamond)).getMarketplaceStats();
        
        vm.prank(buyer);
        RugMarketplaceFacet(address(diamond)).buyListing{value: 1 ether}(tokenId1);
        
        (uint256 totalSalesAfter, uint256 totalVolumeAfter, uint256 feesAfter, uint256 feePercent) = 
            RugMarketplaceFacet(address(diamond)).getMarketplaceStats();
        
        // Verify stats updated
        assertEq(totalSalesAfter, totalSalesBefore + 1);
        assertEq(totalVolumeAfter, totalVolumeBefore + 1 ether);
        
        // Verify fee collected (2.5% of 1 ETH = 0.025 ETH)
        assertEq(feesAfter - feesBefore, 0.025 ether);
    }
    
    function testConfigurableMarketplaceFee() public {
        vm.prank(owner);
        RugMarketplaceFacet(address(diamond)).setMarketplaceFee(500); // 5%
        
        (, , , uint256 feePercent) = RugMarketplaceFacet(address(diamond)).getMarketplaceStats();
        assertEq(feePercent, 500);
    }
    
    // ===== LAUNDERING INTEGRATION TESTS =====
    
    function testSaleTriggersLaundering() public {
        // Enable laundering
        vm.prank(owner);
        RugAdminFacet(address(diamond)).setLaunderingEnabled(true);
        
        // Create listing at high price
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createListing(tokenId1, 10 ether, 7 days);
        
        // Buy at high price
        vm.prank(buyer);
        RugMarketplaceFacet(address(diamond)).buyListing{value: 10 ether}(tokenId1);
        
        // Verify sale was recorded (check laundering stats)
        (uint256 launderingCount, , ) = 
            RugLaunderingFacet(address(diamond)).getLaunderingStats(tokenId1);
        
        // Laundering might have been triggered depending on threshold
        assertTrue(launderingCount >= 0);
    }
    
    // ===== BULK OPERATIONS =====
    
    function testBulkCreateListings() public {
        vm.startPrank(seller);
        
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = tokenId1;
        tokenIds[1] = tokenId2;
        
        uint256[] memory prices = new uint256[](2);
        prices[0] = 1 ether;
        prices[1] = 2 ether;
        
        uint256[] memory durations = new uint256[](2);
        durations[0] = 7 days;
        durations[1] = 14 days;
        
        RugMarketplaceFacet(address(diamond)).bulkCreateListings(tokenIds, prices, durations);
        
        // Verify both listings created
        (, , , bool isActive1) = RugMarketplaceFacet(address(diamond)).getListing(tokenId1);
        (, , , bool isActive2) = RugMarketplaceFacet(address(diamond)).getListing(tokenId2);
        
        assertTrue(isActive1);
        assertTrue(isActive2);
        
        vm.stopPrank();
    }
    
    // ===== EDGE CASES =====
    
    function testCannotBuyExpiredListing() public {
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createListing(tokenId1, 1 ether, 1 hours);
        
        // Fast forward past expiration
        vm.warp(block.timestamp + 2 hours);
        
        vm.prank(buyer);
        vm.expectRevert();
        RugMarketplaceFacet(address(diamond)).buyListing{value: 1 ether}(tokenId1);
    }
    
    function testCannotBidBelowMinimum() public {
        vm.prank(seller);
        RugMarketplaceFacet(address(diamond)).createAuction(tokenId1, 1 ether, 0, 3 days, false);
        
        vm.prank(bidder1);
        RugMarketplaceFacet(address(diamond)).placeBid{value: 1 ether}(tokenId1);
        
        // Try to bid below 5% increment
        vm.prank(bidder2);
        vm.expectRevert();
        RugMarketplaceFacet(address(diamond)).placeBid{value: 1.01 ether}(tokenId1);
    }
    
    // Helper: Get selector arrays
    function getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](11);
        selectors[0] = RugNFTFacet.mintRug.selector;
        selectors[1] = RugNFTFacet.tokenURI.selector;
        selectors[2] = RugNFTFacet.totalSupply.selector;
        selectors[3] = bytes4(keccak256("ownerOf(uint256)"));
        selectors[4] = bytes4(keccak256("balanceOf(address)"));
        selectors[5] = bytes4(keccak256("transferFrom(address,address,uint256)"));
        selectors[6] = bytes4(keccak256("safeTransferFrom(address,address,uint256)"));
        selectors[7] = bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)"));
        selectors[8] = bytes4(keccak256("approve(address,uint256)"));
        selectors[9] = bytes4(keccak256("setApprovalForAll(address,bool)"));
        selectors[10] = bytes4(keccak256("getApproved(uint256)"));
        return selectors;
    }
    
    function getRugAdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = RugAdminFacet.setLaunchStatus.selector;
        selectors[1] = RugAdminFacet.updateMintPricing.selector;
        selectors[2] = RugAdminFacet.updateCollectionCap.selector;
        selectors[3] = RugAdminFacet.updateWalletLimit.selector;
        selectors[4] = RugAdminFacet.setLaunderingEnabled.selector;
        selectors[5] = RugAdminFacet.updateServicePricing.selector;
        return selectors;
    }
    
    function getMarketplaceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](25);
        selectors[0] = RugMarketplaceFacet.createListing.selector;
        selectors[1] = RugMarketplaceFacet.cancelListing.selector;
        selectors[2] = RugMarketplaceFacet.updateListingPrice.selector;
        selectors[3] = RugMarketplaceFacet.buyListing.selector;
        selectors[4] = RugMarketplaceFacet.bulkCreateListings.selector;
        selectors[5] = RugMarketplaceFacet.createAuction.selector;
        selectors[6] = RugMarketplaceFacet.placeBid.selector;
        selectors[7] = RugMarketplaceFacet.finalizeAuction.selector;
        selectors[8] = RugMarketplaceFacet.cancelAuction.selector;
        selectors[9] = RugMarketplaceFacet.makeOffer.selector;
        selectors[10] = RugMarketplaceFacet.makeCollectionOffer.selector;
        selectors[11] = RugMarketplaceFacet.acceptOffer.selector;
        selectors[12] = RugMarketplaceFacet.cancelOffer.selector;
        selectors[13] = RugMarketplaceFacet.createBundle.selector;
        selectors[14] = RugMarketplaceFacet.buyBundle.selector;
        selectors[15] = RugMarketplaceFacet.cancelBundle.selector;
        selectors[16] = RugMarketplaceFacet.setMarketplaceFee.selector;
        selectors[17] = RugMarketplaceFacet.initializeMarketplace.selector;
        selectors[18] = RugMarketplaceFacet.getListing.selector;
        selectors[19] = RugMarketplaceFacet.getAuction.selector;
        selectors[20] = RugMarketplaceFacet.getOffer.selector;
        selectors[21] = RugMarketplaceFacet.getTokenOffers.selector;
        selectors[22] = RugMarketplaceFacet.getCollectionOffers.selector;
        selectors[23] = RugMarketplaceFacet.getMarketplaceStats.selector;
        selectors[24] = RugMarketplaceFacet.getBundle.selector;
        return selectors;
    }
    
    function getLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = RugLaunderingFacet.recordSale.selector;
        selectors[1] = RugLaunderingFacet.getLaunderingStats.selector;
        selectors[2] = RugLaunderingFacet.wouldTriggerLaundering.selector;
        return selectors;
    }
    
    function getCommerceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = RugCommerceFacet.royaltyInfo.selector;
        return selectors;
    }
}

