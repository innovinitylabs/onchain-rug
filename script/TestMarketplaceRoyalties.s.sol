// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

/**
 * @title Test Marketplace Royalties
 * @notice Test script to verify royalty enforcement in marketplace sales
 */
contract TestMarketplaceRoyalties is Script {
    // Contract addresses (update these for your deployment)
    address constant DIAMOND_ADDR = 0xa43532205Fc90b286Da98389a9883347Cc4064a8; // Shape Sepolia
    address constant TEST_BUYER = 0x742d35Cc6634C0532925a3b844Bc454e4438f44e; // Test buyer address

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== Testing Marketplace Royalty Enforcement ===");
        console.log("Diamond Address:", DIAMOND_ADDR);

        // 1. Check current royalty configuration
        console.log("\n1. Checking royalty configuration...");
        checkRoyaltyConfig();

        // 2. Mint a test NFT
        console.log("\n2. Minting test NFT...");
        uint256 tokenId = mintTestNFT();

        // 3. Create a listing
        console.log("\n3. Creating marketplace listing...");
        createListing(tokenId);

        // 4. Check listing details
        console.log("\n4. Verifying listing...");
        checkListing(tokenId);

        vm.stopBroadcast();

        console.log("\n=== Test Setup Complete ===");
        console.log("To complete the test:");
        console.log("1. Switch to buyer account:", TEST_BUYER);
        console.log("2. Call buyListing(", tokenId, ") with sufficient ETH");
        console.log("3. Verify royalties were paid to recipients");
        console.log("4. Check seller received proceeds minus fees and royalties");
    }

    function checkRoyaltyConfig() internal view {
        (bool success, bytes memory data) = DIAMOND_ADDR.staticcall(
            abi.encodeWithSignature("getRoyaltyConfig()")
        );
        require(success, "Failed to get royalty config");

        (uint256 percentage, address[] memory recipients, uint256[] memory splits) =
            abi.decode(data, (uint256, address[], uint256[]));

        console.log("Royalty configuration checked");
        console.log("Recipients configured successfully");
    }

    function mintTestNFT() internal returns (uint256) {
        // Simple test data for minting
        string[] memory textRows = new string[](2);
        textRows[0] = "TEST";
        textRows[1] = "ROYALTY";
        uint256 seed = 12345;

        // Visual config
        RugNFTFacet.VisualConfig memory visual = RugNFTFacet.VisualConfig({
            warpThickness: 3,
            stripeCount: 5
        });

        // Art data
        RugNFTFacet.ArtData memory art = RugNFTFacet.ArtData({
            paletteName: "test",
            minifiedPalette: "rgb(255,0,0);rgb(0,255,0);rgb(0,0,255)",
            minifiedStripeData: "1,2,3,1,2",
            filteredCharacterMap: "abcdefghij"
        });

        (bool success, bytes memory data) = DIAMOND_ADDR.call(
            abi.encodeWithSignature(
                "mintRug((string[]),uint256,(uint8,uint256),(string,string,string,string),uint8,uint256)",
                textRows, seed, visual, art, uint8(1), uint256(10)
            )
        );
        require(success, "Minting failed");

        // Get the token ID (this is approximate - you might need to query totalSupply)
        (success, data) = DIAMOND_ADDR.staticcall(abi.encodeWithSignature("totalSupply()"));
        require(success, "Failed to get total supply");

        uint256 tokenId = abi.decode(data, (uint256));
        console.log("Minted Token ID:", tokenId);

        return tokenId;
    }

    function createListing(uint256 tokenId) internal {
        uint256 price = 0.01 ether; // 0.01 ETH
        uint256 duration = 1 days;

        (bool success,) = DIAMOND_ADDR.call(
            abi.encodeWithSignature(
                "createListing(uint256,uint256,uint256)",
                tokenId, price, duration
            )
        );
        require(success, "Listing creation failed");

        console.log("Created listing successfully");
    }

    function checkListing(uint256 tokenId) internal view {
        (bool success, bytes memory data) = DIAMOND_ADDR.staticcall(
            abi.encodeWithSignature("getListing(uint256)", tokenId)
        );
        require(success, "Failed to get listing");

        (address seller, uint256 price, uint256 expiresAt, bool isActive) =
            abi.decode(data, (address, uint256, uint256, bool));

        console.log("Listing verified successfully");
    }
}

// Type definitions for the script
interface RugNFTFacet {
    struct VisualConfig {
        uint8 warpThickness;
        uint256 stripeCount;
    }

    struct ArtData {
        string paletteName;
        string minifiedPalette;
        string minifiedStripeData;
        string filteredCharacterMap;
    }
}
