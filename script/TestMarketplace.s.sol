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
    
    // Test wallets (derived from private keys)
    address public wallet1;
    address public wallet2;
    
    // Private keys (read from .env)
    uint256 public pk1;
    uint256 public pk2;
    
    uint256 public tokenId1;
    uint256 public tokenId2;
    uint256 public tokenId3;
    
    function setUp() public {
        // Read private keys from environment
        pk1 = vm.envUint("TESTNET_PRIVATE_KEY");
        pk2 = vm.envUint("TESTNET_PRIVATE_KEY_2");
        
        // Derive wallet addresses
        wallet1 = vm.addr(pk1);
        wallet2 = vm.addr(pk2);
        
        // Get diamond address from environment (same as NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT)
        diamondAddress = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");
        require(diamondAddress != address(0), "NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT not set in .env");
        
        console.log("Testing marketplace at:", diamondAddress);
        console.log("Wallet 1 (Seller):", wallet1);
        console.log("Wallet 2 (Buyer):", wallet2);
    }
    
    function run() public {
        console.log("==============================================");
        console.log("AUTOMATED MARKETPLACE TESTING");
        console.log("==============================================");
        
        step1_MintTestNFTs();
        step2_TestDirectListing();
        step3_CheckStats();
        
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
        
        console.log("  [SUCCESS] Minting complete");
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
        console.log("  [SUCCESS] Listing verified");
        
        vm.stopBroadcast();
        
        // Buy listing from wallet2
        vm.startBroadcast(pk2);
        
        console.log("  Wallet2 buying listing...");
        RugMarketplaceFacet(diamondAddress).buyListing{value: 0.01 ether}(tokenId1);
        
        // Verify ownership transferred
        address newOwner = RugNFTFacet(diamondAddress).ownerOf(tokenId1);
        require(newOwner == wallet2, "Ownership not transferred");
        console.log("  [SUCCESS] Purchase successful - NFT #", tokenId1, "now owned by wallet2");
        
        vm.stopBroadcast();
    }
    

    function step3_CheckStats() internal {
        console.log("\n[STEP 3] Checking marketplace statistics...");

        (uint256 feesCollected, uint256 volume, uint256 sales, uint256 feeBPS) =
            RugMarketplaceFacet(diamondAddress).getMarketplaceStats();

        console.log("  Total fees collected:", feesCollected);
        console.log("  Total volume:", volume);
        console.log("  Total sales:", sales);
        console.log("  Marketplace fee BPS:", feeBPS);

        console.log("  [SUCCESS] Statistics retrieved successfully");
    }
}
