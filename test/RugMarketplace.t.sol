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

        // Marketplace uses default configuration (no initialization needed)

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
        
        RugNFTFacet(address(diamond)).mintRug{value: 0.001 ether}(text1, 12345, visual1, art1, 10);
        
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
        
        RugNFTFacet(address(diamond)).mintRug{value: 0.001 ether}(text2, 67890, visual2, art2, 11);
        
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
        
        RugNFTFacet(address(diamond)).mintRug{value: 0.001 ether}(text3, 11111, visual3, art3, 12);
        
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

    // ===== SELECTOR HELPERS =====

    function getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](14);
        selectors[0] = RugNFTFacet.mintRug.selector;
        selectors[1] = RugNFTFacet.mintRugFor.selector; // Required for mintRug to work
        selectors[2] = RugNFTFacet.burn.selector;
        selectors[3] = RugNFTFacet.tokenURI.selector;
        selectors[4] = RugNFTFacet.totalSupply.selector;
        selectors[5] = RugNFTFacet.ownerOf.selector;
        selectors[6] = RugNFTFacet.balanceOf.selector;
        selectors[7] = RugNFTFacet.approve.selector;
        selectors[8] = RugNFTFacet.getApproved.selector;
        selectors[9] = RugNFTFacet.setApprovalForAll.selector;
        selectors[10] = RugNFTFacet.isApprovedForAll.selector;
        selectors[11] = RugNFTFacet.transferFrom.selector; // Required for marketplace sales
        selectors[12] = bytes4(0x42842e0e); // safeTransferFrom(address,address,uint256)
        selectors[13] = bytes4(0xb88d4fde); // safeTransferFrom(address,address,uint256,bytes)
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
        bytes4[] memory selectors = new bytes4[](8);
        // Listing functions
        selectors[0] = RugMarketplaceFacet.createListing.selector;
        selectors[1] = RugMarketplaceFacet.cancelListing.selector;
        selectors[2] = RugMarketplaceFacet.updateListingPrice.selector;
        selectors[3] = RugMarketplaceFacet.buyListing.selector;
        // Admin functions
        selectors[4] = RugMarketplaceFacet.setMarketplaceFee.selector;
        selectors[5] = RugMarketplaceFacet.withdrawFees.selector;
        // View functions
        selectors[6] = RugMarketplaceFacet.getListing.selector;
        selectors[7] = RugMarketplaceFacet.getMarketplaceStats.selector;
        return selectors;
    }

    function getLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = RugLaunderingFacet.recordSale.selector;
        selectors[1] = RugLaunderingFacet.getLaunderingStats.selector;
        return selectors;
    }

    function getCommerceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = RugCommerceFacet.withdraw.selector;
        selectors[1] = RugCommerceFacet.withdrawTo.selector;
        selectors[2] = RugCommerceFacet.configureRoyalties.selector;
        selectors[3] = RugCommerceFacet.royaltyInfo.selector;
        selectors[4] = RugCommerceFacet.distributeRoyalties.selector;
        selectors[5] = RugCommerceFacet.claimPendingRoyalties.selector;
        selectors[6] = RugCommerceFacet.getPendingRoyalties.selector;
        selectors[7] = RugCommerceFacet.getBalance.selector;
        selectors[8] = RugCommerceFacet.getRoyaltyConfig.selector;
        selectors[9] = RugCommerceFacet.calculateRoyalty.selector;
        return selectors;
    }
}
